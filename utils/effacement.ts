import type { SupabaseClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------------------
// Purge du stockage liée à l'effacement (Lot 2).
// Les cascades SQL (inscription_id ON DELETE CASCADE) suppriment les LIGNES du
// travail élève, mais PAS les fichiers dans les buckets. Pour un effacement
// complet (vie privée), on COLLECTE les chemins depuis les lignes AVANT la
// suppression, puis on RETIRE les fichiers APRÈS le succès de la suppression DB.
// Scopé par inscription → ne touche jamais les fichiers d'une autre classe.
// ----------------------------------------------------------------------------

export interface CheminsStockage {
  fragments: string[]
  essais: string[]
  oraux: string[]
  codex: string[]
}

// ----------------------------------------------------------------------------
// C4-L4 — LES PHOTOS DE PASSATION EN CLASSE.
// « TROIS gestes atteignent les fichiers, pas un » (`06-Palimpseste.md` §7) :
// l'effacement d'une classe, le retrait d'un élève d'une classe, la suppression
// d'un compte. Le chemin choisi est `passation/<élève>/<dépôt>/…` dans le bucket
// `codex` (aucun bucket neuf — `07-` §1 : « le bucket existant ») : par élève, le
// préfixe suffit ; par classe, `exercices_depots` → `exercices.classe_id` résout
// en une requête. La classe n'est PAS dans le chemin — un élève qui change de
// classe rendrait les fichiers introuvables par le geste censé les emporter.
//
// ⚠️ CE QUE CETTE FONCTION NE FAIT PAS, ET QUI EST AU RELEVÉ DE C4-L4 :
//    `effacer_classe()` (en base) NE TOUCHE PAS `exercices_depots` — les tables
//    de C4-L1 sont nées après elle. Les FICHIERS partent bien (ci-dessous), mais
//    les LIGNES de dépôt d'une classe effacée survivraient. C'est un geste SQL,
//    sur une fonction `security definer` d'un flux existant : il est signalé, il
//    n'est pas fait en passant.
// ----------------------------------------------------------------------------

/** Collecte (sans rien supprimer) tous les chemins de fichiers des inscriptions. */
export async function collecterCheminsInscriptions(
  admin: SupabaseClient,
  inscriptionIds: string[]
): Promise<CheminsStockage> {
  const vide: CheminsStockage = { fragments: [], essais: [], oraux: [], codex: [] }
  if (inscriptionIds.length === 0) return vide

  // fragments (photos des dépôts)
  const { data: depots } = await admin
    .from('fragments_depots').select('id').in('inscription_id', inscriptionIds)
  const depotIds = (depots ?? []).map((d) => d.id as string)
  const { data: photos } = depotIds.length > 0
    ? await admin.from('fragments_photos').select('storage_path').in('depot_id', depotIds)
    : { data: [] }

  // dépôts d'essai (photos)
  const { data: essais } = await admin
    .from('fragments_essai_depots').select('id').in('inscription_id', inscriptionIds)
  const essaiIds = (essais ?? []).map((e) => e.id as string)
  const { data: essaiPhotos } = essaiIds.length > 0
    ? await admin.from('fragments_essai_depot_photos').select('storage_path').in('depot_id', essaiIds)
    : { data: [] }

  // oraux (audio)
  const { data: oraux } = await admin
    .from('fragments_oraux').select('storage_path').in('inscription_id', inscriptionIds)

  // codex (manuscrits V1 + V-finale) — codex_travaux.inscription_id n'est jamais peuplé :
  // on relie via la synthèse (codex_sessions.classe_id) + l'élève de l'inscription.
  const { data: inscRows } = await admin
    .from('inscriptions').select('eleve_id, classe_id').in('id', inscriptionIds)
  const paires = new Set((inscRows ?? []).map((i) => `${i.eleve_id}:${i.classe_id}`))
  const classeIdsCodex = [...new Set((inscRows ?? []).map((i) => i.classe_id as string))]
  const eleveIdsCodex = [...new Set((inscRows ?? []).map((i) => i.eleve_id as string))]
  let codexPaths: string[] = []
  if (classeIdsCodex.length > 0 && eleveIdsCodex.length > 0) {
    const { data: sessions } = await admin
      .from('codex_sessions').select('id, classe_id').in('classe_id', classeIdsCodex)
    const sessionClasse = new Map((sessions ?? []).map((s) => [s.id as string, s.classe_id as string]))
    const sessionIds = [...sessionClasse.keys()]
    const { data: travaux } = sessionIds.length > 0
      ? await admin.from('codex_travaux').select('session_id, eleve_id, photos_v1, photos_vf')
          .in('session_id', sessionIds).in('eleve_id', eleveIdsCodex)
      : { data: [] }
    codexPaths = (travaux ?? [])
      .filter((t) => paires.has(`${t.eleve_id as string}:${sessionClasse.get(t.session_id as string)}`))
      .flatMap((t) => [...((t.photos_v1 as string[] | null) ?? []), ...((t.photos_vf as string[] | null) ?? [])])
      .filter((x): x is string => !!x)
  }

  // C4-L4 — passation en classe : les photos de copies manuscrites. Scopé par
  // (élève de l'inscription × classe de l'instance), comme le codex ci-dessus.
  const passationPaths = await cheminsDePassation(admin, inscRows ?? [])

  const garder = (xs: (string | null)[]) => xs.filter((x): x is string => !!x)

  return {
    fragments: garder((photos ?? []).map((p) => p.storage_path as string | null)),
    essais: garder((essaiPhotos ?? []).map((p) => p.storage_path as string | null)),
    oraux: garder((oraux ?? []).map((o) => o.storage_path as string | null)),
    codex: [...codexPaths, ...passationPaths],
  }
}

/**
 * Les chemins des photos de passation, pour un jeu d'inscriptions.
 *
 * `photos_v1` porte le chemin de chaque page dans sa clé `chemin` (voir
 * `utils/passation/photos.ts`) : on lit les chemins RÉELLEMENT ÉCRITS plutôt que
 * de les recalculer — un chemin recalculé qui diverge d'un octet laisse le
 * fichier en place, et personne ne le voit.
 */
async function cheminsDePassation(
  admin: SupabaseClient,
  inscRows: Array<{ eleve_id?: unknown; classe_id?: unknown }>,
): Promise<string[]> {
  const eleves = [...new Set(inscRows.map((i) => String(i.eleve_id)))].filter((x) => x !== 'undefined')
  const classes = [...new Set(inscRows.map((i) => String(i.classe_id)))].filter((x) => x !== 'undefined')
  if (eleves.length === 0 || classes.length === 0) return []
  const paires = new Set(inscRows.map((i) => `${String(i.eleve_id)}:${String(i.classe_id)}`))

  // ⚠️ PAGINÉ. supabase-js plafonne toute réponse à mille lignes SANS RIEN
  //    SIGNALER : une purge qui s'arrête à mille laisse des fichiers d'élèves
  //    derrière elle, et `error` reste nul. On ordonne sur `id` (clé unique) et
  //    on avance par pages.
  const PAGE = 500
  const chemins: string[] = []
  let de = 0
  for (;;) {
    const { data, error } = await admin
      .from('exercices_depots')
      .select('id, eleve_id, photos_v1, exercices!inner(classe_id)')
      .in('eleve_id', eleves)
      .in('exercices.classe_id', classes)
      .order('id', { ascending: true })
      .range(de, de + PAGE - 1)
    if (error) {
      console.error('[effacement] photos de passation ILLISIBLES — des fichiers d’élèves '
        + `pourraient survivre à l'effacement : ${error.code} ${error.message}`)
      return chemins
    }
    const lot = (data ?? []) as unknown as Array<{
      id: string; eleve_id: string; photos_v1: unknown
      exercices: { classe_id: string } | Array<{ classe_id: string }>
    }>
    for (const d of lot) {
      const ex = Array.isArray(d.exercices) ? d.exercices[0] : d.exercices
      if (!paires.has(`${d.eleve_id}:${ex?.classe_id}`)) continue
      for (const p of Array.isArray(d.photos_v1) ? d.photos_v1 : []) {
        const chemin = (p as { chemin?: unknown })?.chemin
        // ⭐ C6-L4 — les pages d'un essai de Fragments portent `bucket = 'essais'` :
        //    ce sont LES fichiers de Fragments, déjà collectés par
        //    `fragments_essai_depot_photos` ci-dessus (même inscription). On ne
        //    les envoie pas au `remove` de `codex`, où ils n'existent pas.
        const bucket = (p as { bucket?: unknown })?.bucket
        if (typeof bucket === 'string' && bucket !== 'codex') continue
        if (typeof chemin === 'string' && chemin !== '') chemins.push(chemin)
      }
    }
    if (lot.length < PAGE) break
    de += PAGE
  }
  return chemins
}

/** Retire les fichiers collectés, bucket par bucket. */
export async function retirerFichiers(admin: SupabaseClient, chemins: CheminsStockage): Promise<void> {
  if (chemins.fragments.length > 0) await admin.storage.from('fragments').remove(chemins.fragments)
  if (chemins.essais.length > 0) await admin.storage.from('essais').remove(chemins.essais)
  if (chemins.oraux.length > 0) await admin.storage.from('oraux').remove(chemins.oraux)
  if (chemins.codex.length > 0) await admin.storage.from('codex').remove(chemins.codex)
}
