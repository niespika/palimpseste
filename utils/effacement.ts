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

  // essais (photos)
  const { data: essais } = await admin
    .from('fragments_essais').select('id').in('inscription_id', inscriptionIds)
  const essaiIds = (essais ?? []).map((e) => e.id as string)
  const { data: essaiPhotos } = essaiIds.length > 0
    ? await admin.from('fragments_essais_photos').select('storage_path').in('essai_id', essaiIds)
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

  const garder = (xs: (string | null)[]) => xs.filter((x): x is string => !!x)

  return {
    fragments: garder((photos ?? []).map((p) => p.storage_path as string | null)),
    essais: garder((essaiPhotos ?? []).map((p) => p.storage_path as string | null)),
    oraux: garder((oraux ?? []).map((o) => o.storage_path as string | null)),
    codex: codexPaths,
  }
}

/** Retire les fichiers collectés, bucket par bucket. */
export async function retirerFichiers(admin: SupabaseClient, chemins: CheminsStockage): Promise<void> {
  if (chemins.fragments.length > 0) await admin.storage.from('fragments').remove(chemins.fragments)
  if (chemins.essais.length > 0) await admin.storage.from('essais').remove(chemins.essais)
  if (chemins.oraux.length > 0) await admin.storage.from('oraux').remove(chemins.oraux)
  if (chemins.codex.length > 0) await admin.storage.from('codex').remove(chemins.codex)
}
