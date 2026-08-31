import 'server-only'
// ============================================================================
// LE SIGNALEMENT D'UN EXERCICE — LES LECTURES ET LES ÉCRITURES.
// ----------------------------------------------------------------------------
// ⭐ PARTAGÉ, comme `utils/assiduite/collecte-serveur.ts` : l'action de l'élève,
//    la page du professeur et la marque d'assiduité lisent TOUTES par ici. Trois
//    lecteurs qui composeraient leur propre requête seraient trois façons de
//    répondre à la même question.
//
// ⛔ AUCUNE POLICY ÉLÈVE N'EST OUVERTE (migration §2) : le client admin
//    contourne la RLS, et **la garde est le CODE** — chaque écriture d'élève
//    passe par un dépôt relu avec `eq('eleve_id', …)`. C'est le patron de tout
//    le moteur (`app/deroule/actions.ts` : « le déroulé écrit par des routes
//    serveur, jamais en direct depuis le client »).
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une écriture dont on ignore
//    le retour échoue INVISIBLEMENT, et **une lecture mal posée se lit comme une
//    réponse négative** — ici, comme « personne n'a signalé ». Tout retour est
//    donc lu, et un échec de lecture se DIT plutôt que de rendre une liste vide.
//
// ⚠️ IL PLAFONNE À 1000 LIGNES SANS RIEN DIRE. La file passe par `lirePagine`,
//    qui confronte au décompte exact.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { lirePagine } from '@/utils/routeur/donnees'
import { titreDeLaConsigne } from '@/utils/codex-onglets/regles'
import { cranNumero } from '@/utils/cran'
import { lundiDuCycle } from '@/utils/deroule/echeance'
import { toISODate } from '@/utils/calendrier-grille'
import {
  MARQUE_RETRAIT_POOL,
  bilanDuRetraitDuPool, blocagesSansLesNotres, fenetreDArbitrage, grouperParExercice,
  motifDuRetraitDuPool, peutRevenirAuPool, emportesParLeRetraitDuPool,
  type Arbitrage, type BilanDuRetrait, type ExerciceSignale, type FenetreDArbitrage,
  type Signalement,
} from './regles'

type Admin = ReturnType<typeof createAdminClient>

// ════════════════════════════════════════════════════════════════════════════
// LA PORTE
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ `signalement_exercice_actif` — **et ce n'est pas un septième interrupteur**
 *    (`07-` §5, liste CLOSE). Il vit sur `scriptorium_params` comme `rag_actif`.
 *
 * ⚠️ **UNE PORTE ILLISIBLE SE FERME**, jamais l'inverse (leçon C11a) : une
 *    lecture en échec rendrait `undefined`, donc `false`, donc fermé — mais on
 *    le DIT au journal, sans quoi une panne ressemblerait à un réglage.
 */
export async function lireLaPorteDuSignalement(admin: Admin): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('signalement_exercice_actif').limit(1).maybeSingle()
  if (error) {
    console.error(`[signalement] porte ILLISIBLE — ${error.code} ${error.message} : `
      + 'elle est tenue pour FERMÉE.')
    return false
  }
  return !!(data as { signalement_exercice_actif?: boolean } | null)?.signalement_exercice_actif
}

export async function basculerLaPorteDuSignalement(
  admin: Admin, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ signalement_exercice_actif: actif })
    .eq('id', 1).select('signalement_exercice_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur : sans ce
  //    contrôle, un `scriptorium_params` vide se lirait comme un succès.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour '
      + '(`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Les élèves peuvent désormais signaler un problème sur un exercice.'
    : 'La case a été retirée de l’écran des élèves. Les signalements déjà reçus restent ici.' }
}

// ════════════════════════════════════════════════════════════════════════════
// CÔTÉ ÉLÈVE — un dépôt, un signalement
// ════════════════════════════════════════════════════════════════════════════

/** Ce que l'écran de l'élève a besoin de savoir sur son propre signalement. */
export interface SignalementDeLEleve {
  texte: string
  signaleAt: string
  majAt: string | null
  arbitrage: Arbitrage | null
}

/**
 * ⚠️ Rendu `null` quand la lecture échoue **ET** quand il n'y a rien : la case
 *    s'affichera décochée dans les deux cas, et c'est le comportement le moins
 *    nuisible — l'élève peut toujours signaler, l'unicité en base empêchera le
 *    doublon. L'échec, lui, part au journal.
 */
export async function lireLeSignalementDuDepot(
  admin: Admin, depotId: string,
): Promise<SignalementDeLEleve | null> {
  const { data, error } = await admin
    .from('exercices_signalements_eleve')
    .select('texte, signale_at, maj_at, arbitrage')
    .eq('depot_id', depotId).maybeSingle()
  if (error) {
    console.error(`[signalement] lecture du dépôt ${depotId} — ${error.code} ${error.message}`)
    return null
  }
  if (!data) return null
  const d = data as unknown as {
    texte: string; signale_at: string; maj_at: string | null; arbitrage: Arbitrage | null }
  return { texte: d.texte, signaleAt: d.signale_at, majAt: d.maj_at, arbitrage: d.arbitrage }
}

/**
 * POSER OU AMENDER. `depot_id` étant UNIQUE, l'`upsert` est le geste juste : un
 * élève qui recoche après s'être rétracté ne fabrique pas une seconde ligne, et
 * un double clic non plus.
 *
 * ⛔ **L'ARBITRAGE NE SE RÉÉCRIT PAS.** Amender son texte ne remet pas un
 *    signalement tranché en attente : le professeur a décidé sur ce qu'il a lu,
 *    et un texte qui rouvrirait sa décision en la faisant disparaître de la file
 *    serait le pire des deux mondes. On n'envoie donc jamais la clé `arbitrage`.
 */
export async function poserLeSignalement(
  admin: Admin,
  depot: { id: string; exerciceId: string; eleveId: string },
  texte: string, maintenant: string,
): Promise<{ ok: boolean; message: string }> {
  const propre = texte.trim()
  if (propre === '') {
    return { ok: false, message: 'Dis en quelques mots ce qui ne va pas : '
      + 'une case cochée sans un mot ne dit rien à ton professeur.' }
  }
  if (propre.length > LONGUEUR_MAX) {
    return { ok: false, message: `C’est un peu long (${propre.length} caractères). `
      + `Tiens-toi sous ${LONGUEUR_MAX}.` }
  }

  const existant = await lireLeSignalementDuDepot(admin, depot.id)
  const { error } = await admin.from('exercices_signalements_eleve').upsert({
    depot_id: depot.id,
    exercice_id: depot.exerciceId,
    eleve_id: depot.eleveId,
    texte: propre,
    ...(existant ? { maj_at: maintenant } : { signale_at: maintenant }),
  }, { onConflict: 'depot_id' })
  if (error) return { ok: false, message: `L’envoi a échoué : ${error.message}` }
  return { ok: true, message: existant
    ? 'Ton message a été mis à jour.'
    : 'C’est signalé. Ton professeur le verra.' }
}

/**
 * ⭐ « Une case se décoche. » Mais seulement tant que personne n'a tranché — la
 *    garde est en SQL autant qu'ici : le `.is('arbitrage', null)` fait que la
 *    suppression ne peut PAS emporter un signalement arbitré, même si l'écran se
 *    trompait.
 */
export async function retirerLeSignalement(
  admin: Admin, depotId: string,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin.from('exercices_signalements_eleve')
    .delete().eq('depot_id', depotId).is('arbitrage', null).select('id')
  if (error) return { ok: false, message: `Le retrait a échoué : ${error.message}` }
  if (!data || data.length === 0) {
    return { ok: false, message: 'Ton professeur a déjà répondu à ce signalement : '
      + 'il ne peut plus être retiré.' }
  }
  return { ok: true, message: 'Signalement retiré.' }
}

/** « Explique le problème dans tes mots » — assez pour un paragraphe, pas pour un essai. */
export const LONGUEUR_MAX = 1500

// ════════════════════════════════════════════════════════════════════════════
// CÔTÉ PROFESSEUR — la file, groupée par exercice
// ════════════════════════════════════════════════════════════════════════════

/** L'identité d'un exercice à l'écran du professeur. */
export interface IdentiteDExercice {
  exerciceId: string
  /**
   * ⚠️ **CE N'EST PAS UN TITRE, ET L'ÉCRAN NE DOIT PAS LE TRAITER COMME TEL.**
   * Mesuré le 31/08 sur les 452 instances du bac à sable : la première ligne de
   * la consigne fait **129 caractères en médiane**, p90 179, **max 298** — 41
   * sur 452 tiennent en 60. Une ligne de liste « pastille + titre + compte +
   * bouton » ne peut pas exister : il faut un bloc, et une troncature assumée.
   */
  premiereLigne: string
  typeLibelle: string | null
  cran: number | null
  lieu: string
  statut: string
  bloque: boolean
  blocages: string[]
  /** Vrai quand le seul blocage est le nôtre : la coche « dans le pool » peut jouer. */
  peutRevenirAuPool: boolean
}

export interface LigneDeLaFile extends ExerciceSignale {
  identite: IdentiteDExercice
  /** Qui a signalé — le nom d'affichage, par identifiant d'élève. */
  noms: Record<string, string>
  /** L'état des dépôts de cette instance, pour annoncer le retrait du pool. */
  bilanDuRetrait: BilanDuRetrait
  /** Par signalement, la fenêtre après laquelle l'assiduité ne bougera plus. */
  fenetres: Record<string, FenetreDArbitrage>
}

export interface FileDesSignalements {
  lignes: LigneDeLaFile[]
  /** Le total des signalements qui attendent une décision, tous exercices confondus. */
  enAttente: number
  /** ⚠️ Ceux dont la fenêtre d'assiduité est déjà passée : arbitrer ne les rattrapera pas. */
  enAttenteHorsFenetre: number
  porteOuverte: boolean
  incidents: string[]
}

/**
 * ⭐⭐ LA FILE. Elle groupe PAR EXERCICE — « si plusieurs élèves signalent le même
 *    exercice, je ne vois que 1 exercice, mais tous les commentaires ».
 *
 * ⚠️ Les lectures de détail (identité de l'instance, noms, dépôts) se font en
 *    LOT sur les seuls exercices signalés : la file est courte par construction,
 *    et la banque ne l'est pas.
 */
export async function chargerLaFileDesSignalements(
  admin: Admin, fuseau: string, maintenant: string,
): Promise<FileDesSignalements> {
  const incidents: string[] = []
  const porteOuverte = await lireLaPorteDuSignalement(admin)

  let brut: Array<{
    id: string; depot_id: string; exercice_id: string; eleve_id: string
    texte: string; signale_at: string; maj_at: string | null
    arbitrage: Arbitrage | null; arbitre_at: string | null
  }> = []
  try {
    brut = await lirePagine(
      admin, 'exercices_signalements_eleve',
      'id, depot_id, exercice_id, eleve_id, texte, signale_at, maj_at, arbitrage, arbitre_at',
      ['signale_at', 'id'], (q) => q)
  } catch (e) {
    incidents.push(`signalements : ${(e as Error).message}`)
    return { lignes: [], enAttente: 0, enAttenteHorsFenetre: 0, porteOuverte, incidents }
  }
  if (brut.length === 0) {
    return { lignes: [], enAttente: 0, enAttenteHorsFenetre: 0, porteOuverte, incidents }
  }

  const exerciceIds = [...new Set(brut.map((s) => s.exercice_id))]
  const depotIds = brut.map((s) => s.depot_id)
  const eleveIds = [...new Set(brut.map((s) => s.eleve_id))]

  // ── Les dépôts SIGNALÉS : leur statut porte l'effet réel sur l'assiduité ──
  const { data: depotsSignales, error: eD } = await admin
    .from('exercices_depots').select('id, statut, assigne_at').in('id', depotIds)
  if (eD) incidents.push(`dépôts signalés : ${eD.message}`)
  const statutParDepot = new Map<string, { statut: string; assigneAt: string }>()
  for (const d of (depotsSignales ?? []) as Array<{ id: string; statut: string; assigne_at: string }>) {
    statutParDepot.set(d.id, { statut: d.statut, assigneAt: d.assigne_at })
  }

  const signalements: Signalement[] = brut.map((s) => ({
    id: s.id, depotId: s.depot_id, exerciceId: s.exercice_id, eleveId: s.eleve_id,
    texte: s.texte, signaleAt: s.signale_at, majAt: s.maj_at,
    arbitrage: s.arbitrage, arbitreAt: s.arbitre_at,
    statutDepot: statutParDepot.get(s.depot_id)?.statut ?? 'inconnu',
  }))

  // ── L'identité des instances ─────────────────────────────────────────────
  const { data: exs, error: eE } = await admin
    .from('exercices')
    .select('id, consigne_instanciee, cran, lieu, statut, bloque, blocages, '
      + 'exercices_types(libelle, code)')
    .in('id', exerciceIds)
  if (eE) incidents.push(`instances : ${eE.message}`)
  const identites = new Map<string, IdentiteDExercice>()
  for (const x of (exs ?? []) as unknown as Array<Record<string, unknown>>) {
    const t = Array.isArray(x.exercices_types) ? x.exercices_types[0] : x.exercices_types
    const blocages = Array.isArray(x.blocages) ? x.blocages.filter(estTexte) : []
    identites.set(String(x.id), {
      exerciceId: String(x.id),
      premiereLigne: titreDeLaConsigne(x.consigne_instanciee),
      typeLibelle: estTexte((t as Record<string, unknown> | null)?.libelle)
        ? String((t as Record<string, unknown>).libelle) : null,
      cran: cranNumero(x.cran),
      lieu: String(x.lieu ?? ''),
      statut: String(x.statut ?? ''),
      bloque: x.bloque === true,
      blocages,
      peutRevenirAuPool: peutRevenirAuPool(blocages),
    })
  }

  // ── TOUS les dépôts de ces instances — pour annoncer le retrait du pool ──
  const { data: tousDepots, error: eT } = await admin
    .from('exercices_depots').select('id, exercice_id, statut').in('exercice_id', exerciceIds)
  if (eT) incidents.push(`dépôts de l’instance : ${eT.message}`)
  const parExercice = new Map<string, Array<{ id: string; statut: string }>>()
  for (const d of (tousDepots ?? []) as Array<{ id: string; exercice_id: string; statut: string }>) {
    parExercice.set(d.exercice_id, [...(parExercice.get(d.exercice_id) ?? []),
      { id: d.id, statut: d.statut }])
  }

  // ── Les noms ─────────────────────────────────────────────────────────────
  const { data: profils, error: eP } = await admin
    .from('profiles').select('id, display_name').in('id', eleveIds)
  if (eP) incidents.push(`élèves : ${eP.message}`)
  const noms: Record<string, string> = {}
  for (const p of (profils ?? []) as Array<{ id: string; display_name: string | null }>) {
    noms[p.id] = p.display_name ?? '—'
  }

  // ── L'assemblage ─────────────────────────────────────────────────────────
  const lignes: LigneDeLaFile[] = grouperParExercice(signalements).map((g) => {
    const fenetres: Record<string, FenetreDArbitrage> = {}
    for (const s of g.signalements) {
      const assigneAt = statutParDepot.get(s.depotId)?.assigneAt
      if (!assigneAt) continue
      const cycle = toISODate(lundiDuCycle(new Date(assigneAt), fuseau))
      fenetres[s.id] = fenetreDArbitrage(cycle, maintenant)
    }
    return {
      ...g,
      identite: identites.get(g.exerciceId) ?? {
        exerciceId: g.exerciceId, premiereLigne: 'Instance introuvable', typeLibelle: null,
        cran: null, lieu: '', statut: '', bloque: false, blocages: [], peutRevenirAuPool: false,
      },
      noms,
      bilanDuRetrait: bilanDuRetraitDuPool(parExercice.get(g.exerciceId) ?? []),
      fenetres,
    }
  })

  const attente = lignes.flatMap((l) => l.signalements.filter((s) => s.arbitrage === null)
    .map((s) => l.fenetres[s.id]))
  return {
    lignes,
    enAttente: attente.length,
    enAttenteHorsFenetre: attente.filter((f) => f?.depassee === true).length,
    porteOuverte, incidents,
  }
}

const estTexte = (x: unknown): boolean => typeof x === 'string' && x !== ''

// ════════════════════════════════════════════════════════════════════════════
// LES DEUX GESTES DU PROFESSEUR
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ L'ARBITRAGE. `confirme` retire le dépôt de CET élève du dénominateur ;
 *    `ecarte` l'y remet. **Les deux sont réversibles**, autant de fois qu'il le
 *    faut — « je peux arbitrer que l'exercice a vraiment un problème et le
 *    retirer du comptage, ou dire qu'il n'y a pas de problème et le remettre ».
 *
 * ⛔ **L'EFFET NE VIT PAS DANS CETTE TABLE**, il vit sur
 *    `exercices_depots.statut` : c'est lui que l'assiduité lit
 *    (`entreAuDenominateur`). La colonne `arbitrage` DIT la décision, elle ne la
 *    FAIT pas — deux domiciles pour un état sont deux domiciles qui divergent.
 *
 * ⛔ **UN DÉPÔT `clos` NE SE RETIRE PLUS** : « le retrait reste permis tant que
 *    le dépôt n'est pas `clos` » (`07-` §1.1). On refuse, et on le dit — plutôt
 *    que d'enregistrer un arbitrage sans effet.
 *
 * ⚠️ **CE GESTE FAIT DISPARAÎTRE L'EXERCICE DE L'ÉCRAN DE L'ÉLÈVE** :
 *    `lireDepotMaison` écarte les `retire`. C'est voulu — un exercice reconnu
 *    cassé n'a pas à rester à faire — mais ce n'est pas anodin, et l'écran le
 *    dit avant.
 */
export async function arbitrerUnSignalement(
  admin: Admin, signalementId: string, arbitrage: Arbitrage,
  profId: string, maintenant: string,
): Promise<{ ok: boolean; message: string }> {
  const { data: sig, error: eS } = await admin
    .from('exercices_signalements_eleve')
    .select('id, depot_id, arbitrage').eq('id', signalementId).maybeSingle()
  if (eS) return { ok: false, message: `Lecture refusée : ${eS.message}` }
  if (!sig) return { ok: false, message: 'Ce signalement n’existe plus.' }
  const s = sig as unknown as { id: string; depot_id: string; arbitrage: Arbitrage | null }

  const { data: dep, error: eD } = await admin
    .from('exercices_depots').select('id, statut').eq('id', s.depot_id).maybeSingle()
  if (eD) return { ok: false, message: `Lecture du dépôt refusée : ${eD.message}` }
  if (!dep) return { ok: false, message: 'Le dépôt de ce signalement n’existe plus.' }
  const d = dep as unknown as { id: string; statut: string }

  const vise = arbitrage === 'confirme' ? 'retire' : null
  if (vise === 'retire') {
    if (d.statut === 'clos') {
      return { ok: false, message: 'Ce dépôt est clos : il ne peut plus sortir du comptage. '
        + 'Le signalement, lui, reste lisible.' }
    }
    if (d.statut !== 'retire') {
      const { error } = await admin.from('exercices_depots')
        .update({ statut: 'retire', updated_at: maintenant }).eq('id', d.id)
        .neq('statut', 'clos')
      if (error) return { ok: false, message: `Retrait refusé : ${error.message}` }
    }
  } else if (d.statut === 'retire') {
    // ⭐ LA REMISE, ET ELLE N'EXISTAIT NULLE PART. `retirerLExercice` (C4-L2)
    //   n'avait pas d'inverse : un retrait était définitif faute de geste.
    // ⚠️ On remet `ouvert` quand le dépôt a été ouvert, `assigne` sinon — le
    //   statut d'avant le retrait ne se conserve pas, mais `ouvert_at` le dit.
    const { data: ouv } = await admin.from('exercices_depots')
      .select('ouvert_at, v1_remis_at, vf_remis_at').eq('id', d.id).maybeSingle()
    const o = ouv as unknown as {
      ouvert_at: string | null; v1_remis_at: string | null; vf_remis_at: string | null } | null
    if (o?.vf_remis_at || o?.v1_remis_at) {
      return { ok: false, message: 'Ce dépôt porte un travail rendu : sa remise au comptage '
        + 'demande de repasser par le fil du dépôt, pas par cet écran.' }
    }
    const { error } = await admin.from('exercices_depots')
      .update({ statut: o?.ouvert_at ? 'ouvert' : 'assigne', updated_at: maintenant })
      .eq('id', d.id).eq('statut', 'retire')
    if (error) return { ok: false, message: `Remise refusée : ${error.message}` }
  }

  const { error } = await admin.from('exercices_signalements_eleve')
    .update({ arbitrage, arbitre_par: profId, arbitre_at: maintenant })
    .eq('id', signalementId)
  if (error) return { ok: false, message: `Arbitrage refusé : ${error.message}` }

  return { ok: true, message: arbitrage === 'confirme'
    ? 'Problème confirmé : cet exercice sort du comptage d’assiduité de cet élève, '
      + 'et disparaît de son écran.'
    : 'Écarté : l’exercice reste au comptage d’assiduité de cet élève.' }
}

/**
 * ⭐⭐ LA COCHE « DANS LE POOL » — et ce qu'elle emporte.
 *
 * Elle réemploie `exercices.bloque`, **qui fait déjà sortir du vivier**
 * (`constituerLeVivier`). Décocher = `bloque = true` + une ligne de motif dans
 * `blocages`, reconnaissable à son préfixe. Recocher = on retire NOTRE ligne, et
 * `bloque` ne retombe que s'il ne reste aucun blocage d'une autre origine.
 *
 * ⭐ ARBITRAGE DE LOUIS (31/08) : **les copies déjà distribuées et non rendues
 *    partent avec**. Ce qui est rendu ne bouge jamais.
 */
export async function basculerLePool(
  admin: Admin, exerciceId: string, dansLePool: boolean, maintenant: string,
): Promise<{ ok: boolean; message: string; details: string[] }> {
  const { data: ex, error: eE } = await admin
    .from('exercices').select('id, bloque, blocages').eq('id', exerciceId).maybeSingle()
  if (eE) return { ok: false, message: `Lecture refusée : ${eE.message}`, details: [] }
  if (!ex) return { ok: false, message: 'Cet exercice n’existe plus.', details: [] }
  const e = ex as unknown as { id: string; bloque: boolean; blocages: unknown }
  const blocages = (Array.isArray(e.blocages) ? e.blocages : []).filter(estTexte).map(String)

  if (dansLePool) {
    if (!peutRevenirAuPool(blocages)) {
      return { ok: false, details: blocagesSansLesNotres(blocages),
        message: 'Cet exercice est bloqué pour une autre raison que le signalement : '
          + 'il ne revient pas au pool par cette coche.' }
    }
    const { error } = await admin.from('exercices')
      .update({ bloque: false, blocages: blocagesSansLesNotres(blocages) })
      .eq('id', exerciceId)
    if (error) return { ok: false, message: `Remise au pool refusée : ${error.message}`, details: [] }
    return { ok: true, details: [
      'Les dépôts retirés ne reviennent pas d’eux-mêmes : chaque élève se remet au comptage '
      + 'par son propre arbitrage, ci-contre.',
    ], message: 'Cet exercice peut de nouveau être servi.' }
  }

  const { count } = await admin.from('exercices_signalements_eleve')
    .select('id', { count: 'exact', head: true }).eq('exercice_id', exerciceId)
  const { data: depots, error: eD } = await admin
    .from('exercices_depots').select('id, statut').eq('exercice_id', exerciceId)
  if (eD) return { ok: false, message: `Lecture des dépôts refusée : ${eD.message}`, details: [] }
  const tous = (depots ?? []) as Array<{ id: string; statut: string }>
  const aRetirer = emportesParLeRetraitDuPool(tous)
  const bilan = bilanDuRetraitDuPool(tous)

  const { error } = await admin.from('exercices')
    .update({ bloque: true,
      blocages: [...blocages, motifDuRetraitDuPool(count ?? 0, maintenant)] })
    .eq('id', exerciceId)
  if (error) return { ok: false, message: `Retrait du pool refusé : ${error.message}`, details: [] }

  const details: string[] = []
  if (aRetirer.length > 0) {
    // ⚠️ Le `.in()` est borné par le nombre de dépôts d'UNE instance — 24 au
    //    maximum mesuré. Pas de pagination à prévoir ici ; si une instance en
    //    portait des milliers, ce serait le lot qui aurait changé de nature.
    const { error: eU } = await admin.from('exercices_depots')
      .update({ statut: 'retire', updated_at: maintenant })
      .in('id', aRetirer.map((d) => d.id))
    if (eU) {
      details.push(`⚠️ Les ${aRetirer.length} copies en cours n’ont PAS été retirées : ${eU.message}`)
    } else {
      details.push(`${aRetirer.length} copie(s) en cours retirée(s) du comptage d’assiduité.`)
    }
  }
  if (bilan.rendusIntouches > 0) {
    details.push(`${bilan.rendusIntouches} copie(s) déjà rendue(s) : intouchées — `
      + 'on ne retire pas le travail de qui l’a fait.')
  }
  if (bilan.closIntouches > 0) details.push(`${bilan.closIntouches} copie(s) close(s) : intouchée(s).`)

  return { ok: true, message: 'Cet exercice ne sera plus servi.', details }
}

// ════════════════════════════════════════════════════════════════════════════
// LA MARQUE À L'ÉCRAN D'ASSIDUITÉ — « je vois si l'élève n'a pas fait un
// exercice parce qu'il a signalé un problème »
// ════════════════════════════════════════════════════════════════════════════

export interface MarqueDeSemaine {
  enAttente: number
  confirmes: number
  ecartes: number
}

/**
 * ⭐ PAR (ÉLÈVE × SEMAINE), et la clé est `eleveId|cycleLundi` — la même clé que
 *    `assiduite_hebdo`, pour que l'écran n'ait rien à rapprocher.
 *
 * ⚠️ **La semaine d'un dépôt se dérive d'`assigne_at`, dans le FUSEAU**, et pas
 *    autrement : c'est le seul chemin TOTAL, et c'est celui que la collecte
 *    emploie (`utils/assiduite/collecte.ts`). Le lire en UTC daterait de la
 *    semaine suivante tout dépôt du dimanche soir à Toronto — à l'heure exacte
 *    à laquelle les élèves déposent.
 *
 * ⛔ **CE N'EST QU'UNE MARQUE.** Elle explique un chiffre, elle ne le corrige
 *    pas : le dénominateur reste celui d'`assiduite_hebdo`, et l'effet d'un
 *    arbitrage passe par le statut du dépôt. Dériver l'assiduité d'ici ferait un
 *    second domicile pour un état qui en a déjà un.
 */
export async function marquesDAssiduite(
  admin: Admin, fuseau: string,
): Promise<{ parCle: Record<string, MarqueDeSemaine>; incidents: string[] }> {
  const incidents: string[] = []
  const { data: sig, error: eS } = await admin
    .from('exercices_signalements_eleve').select('eleve_id, depot_id, arbitrage')
  if (eS) {
    incidents.push(`marques de signalement : ${eS.message}`)
    return { parCle: {}, incidents }
  }
  const lignes = (sig ?? []) as Array<{
    eleve_id: string; depot_id: string; arbitrage: Arbitrage | null }>
  if (lignes.length === 0) return { parCle: {}, incidents }

  const { data: dep, error: eD } = await admin
    .from('exercices_depots').select('id, assigne_at').in('id', lignes.map((l) => l.depot_id))
  if (eD) {
    incidents.push(`dépôts des signalements : ${eD.message}`)
    return { parCle: {}, incidents }
  }
  const quand = new Map<string, string>()
  for (const d of (dep ?? []) as Array<{ id: string; assigne_at: string }>) {
    quand.set(d.id, d.assigne_at)
  }

  const parCle: Record<string, MarqueDeSemaine> = {}
  for (const l of lignes) {
    const assigneAt = quand.get(l.depot_id)
    if (!assigneAt) continue
    const cle = `${l.eleve_id}|${toISODate(lundiDuCycle(new Date(assigneAt), fuseau))}`
    const m = parCle[cle] ?? { enAttente: 0, confirmes: 0, ecartes: 0 }
    if (l.arbitrage === 'confirme') m.confirmes++
    else if (l.arbitrage === 'ecarte') m.ecartes++
    else m.enAttente++
    parCle[cle] = m
  }
  return { parCle, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// L'EXERCICE EN RÉVISION — ce que l'élève voit à la place d'un 404
// ════════════════════════════════════════════════════════════════════════════

export interface ExerciceEnRevision {
  /** La première ligne de la consigne — de quoi reconnaître ce qu'on avait ouvert. */
  titre: string
  /** Ce que l'élève avait écrit, quand c'est LUI qui a signalé. `null` sinon. */
  monTexte: string | null
  /** Vrai quand le professeur a tranché « confirmé » sur le signalement de cet élève. */
  confirme: boolean
}

/**
 * ⭐⭐ « SI JE CONFIRME UN PROBLÈME, IL NE FAUT PAS UN 404, MAIS JUSTE "CET
 *    EXERCICE EST EN RÉVISION PAR LE PROF, REVIENS PLUS TARD" » (Louis, 31/08).
 *
 * ⛔⛔ **ON NE TOUCHE PAS À `lireDepotMaison`, ET C'EST TOUT L'ENJEU.** Son
 *    filtre `statut != 'retire'` est une garde POSÉE EXPRÈS — *« le filtre que
 *    personne ne posait »* (piège 41) —, et l'affaiblir rouvrirait un dépôt
 *    retiré à l'écriture : brouillon, remise, désignation. Ce lecteur-ci est
 *    donc SÉPARÉ, il est en LECTURE SEULE, et il ne rend **que** de quoi écrire
 *    une phrase.
 *
 * ⭐ LES DEUX GARDES QUI COMPTENT SONT TENUES : le dépôt est **à cet élève**
 *    *(le client admin contourne la RLS, et il n'y a aucune policy élève)*, et
 *    son exercice est **à la maison**.
 *
 * ⚠️ **L'ATELIER N'EST PAS BORNÉ ICI, DÉLIBÉRÉMENT.** `utils/deroule/depot.ts`
 *    le dit lui-même : *« la borne d'atelier est une règle de RANGEMENT, pas
 *    d'accès »*. Cet écran ne sert ni consigne, ni matériau, ni copie — rien que
 *    « il est en révision » — et le refuser sous l'autre porte rendrait un 404 à
 *    l'élève PROPRIÉTAIRE, qui est exactement ce qu'on répare.
 *
 * ⛔ **ET IL NE S'AFFICHE PAS POUR N'IMPORTE QUEL RETRAIT.** Un dépôt que le
 *    professeur retire par l'override du Pilotage n'est pas « en révision » : il
 *    est retiré, ce qui ne veut pas dire que l'exercice est cassé. On exige donc
 *    un LIEN AVEC UN SIGNALEMENT — celui de cet élève, ou le retrait du pool
 *    marqué `[signalement]` sur l'instance. Sinon, `null`, et la page reste un
 *    404 comme avant.
 */
export async function exerciceEnRevision(
  admin: Admin, depotId: string, eleveId: string,
): Promise<ExerciceEnRevision | null> {
  const { data, error } = await admin
    .from('exercices_depots')
    .select('id, statut, exercice_id, exercices!inner(lieu, consigne_instanciee, bloque, blocages)')
    .eq('id', depotId).eq('eleve_id', eleveId).eq('statut', 'retire')
    .maybeSingle()
  if (error) {
    console.error(`[signalement] révision illisible ${depotId} — ${error.code} ${error.message}`)
    return null
  }
  if (!data) return null
  const d = data as unknown as { exercices: unknown }
  const ex = (Array.isArray(d.exercices) ? d.exercices[0] : d.exercices) as {
    lieu: string; consigne_instanciee: unknown; bloque: boolean; blocages: unknown } | null
  if (!ex || ex.lieu !== 'maison') return null

  const mien = await lireLeSignalementDuDepot(admin, depotId)
  const blocages = (Array.isArray(ex.blocages) ? ex.blocages : []).filter(estTexte).map(String)
  const retireDuPoolPourSignalement = ex.bloque === true
    && blocages.some((b) => b.startsWith(MARQUE_RETRAIT_POOL))

  if (!mien && !retireDuPoolPourSignalement) return null

  return {
    titre: titreDeLaConsigne(ex.consigne_instanciee),
    monTexte: mien?.texte ?? null,
    confirme: mien?.arbitrage === 'confirme',
  }
}
