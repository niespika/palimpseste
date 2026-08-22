import 'server-only'
// ============================================================================
// C4 · L5 — L'ÉCRITURE DES MESURES.
// ----------------------------------------------------------------------------
// « Les entrées des règles s'écrivent ici, LE MOTEUR LES LIRA : `delai_jours`,
//   `delai_mesures`, `aide_consommee`, le `lieu`, la `forme`, le `genre` de
//   l'instance, le `classe_id` NULLABLE, le drapeau `bonus`, le dépôt
//   d'origine. »                                            — piège 22
//
// « Tu écris des MESURES ; le moteur en fera des lettres » (piège 2) : rien ici
// ne touche `competences_niveaux`, `competences_escalade` ni `competences_montee`.
//
// ⚠️ « Une reprise après expiration ne crée JAMAIS une seconde mesure » : le
//    garde est mécanique — un index unique partiel `(depot_id, competence)` —,
//    pas une lecture-puis-écriture qui se ferait doubler par une course.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { distanceContexte, type ContexteMesure } from './distance-contexte'
import type { Observables } from './observables'
import type { Competence, Forme, Lieu } from './types'

type Admin = ReturnType<typeof createAdminClient>

export interface LigneMesure {
  eleve_id: string
  competence: Competence
  modes: string[]
  lettre_equivalente: string | null
  observables: Observables
  lieu: Lieu
  forme: Forme
  genre: string | null
  classe_id: string | null
  sonde_montee: boolean
  distance_contexte: string | null
  delai_jours: number | null
  delai_mesures: number | null
  aide_consommee: number | null
  depot_id: string
  bonus: boolean
  instrument_version: string | null
}

/** La mesure précédente de cette compétence, avec de quoi calculer la distance. */
export async function mesurePrecedente(
  admin: Admin, eleveId: string, competence: Competence, avant?: string,
): Promise<{ mesureAt: string; contexte: ContexteMesure } | null> {
  let q = admin
    .from('competences_mesures')
    .select('mesure_at, modes, depot_id')
    .eq('eleve_id', eleveId).eq('competence', competence)
    .order('mesure_at', { ascending: false }).limit(1)
  if (avant) q = q.lt('mesure_at', avant)
  const { data } = await q
  const ligne = (data ?? [])[0] as { mesure_at: string; modes: string[]; depot_id: string | null } | undefined
  if (!ligne) return null
  return {
    mesureAt: ligne.mesure_at,
    contexte: { modes: ligne.modes ?? [], objet: ligne.depot_id ? await objetDuDepot(admin, ligne.depot_id) : null },
  }
}

/** L'objet se lit PAR LA CHAÎNE DU DÉPÔT — dépôt → exercice → type (`01-` §11). */
export async function objetDuDepot(admin: Admin, depotId: string): Promise<string | null> {
  const { data: d } = await admin
    .from('exercices_depots').select('exercice_id').eq('id', depotId).maybeSingle()
  if (!d) return null
  const { data: e } = await admin
    .from('exercices').select('type_id').eq('id', d.exercice_id).maybeSingle()
  if (!e) return null
  const { data: t } = await admin
    .from('exercices_types').select('code').eq('id', e.type_id).maybeSingle()
  return (t?.code as string | null) ?? null
}

/**
 * Les délais ET la distance, sur UNE SEULE lecture de la mesure précédente.
 *
 * Les deux calculs interrogeaient chacun `mesurePrecedente`, qui interroge
 * elle-même `objetDuDepot`, soit trois requêtes en série : jusqu'à dix
 * allers-retours par compétence là où trois suffisent — et sur un lot de classe,
 * ce budget-là se prend sur les soixante secondes de la fonction.
 */
export async function entreesDesRegles(
  admin: Admin, eleveId: string, competence: Competence,
  courante: ContexteMesure, maintenant: Date,
): Promise<{ delai_jours: number | null; delai_mesures: number | null; distance_contexte: string | null }> {
  const precedente = await mesurePrecedente(admin, eleveId, competence)
  const distance_contexte = distanceContexte(courante, precedente?.contexte ?? null)
  if (!precedente) return { delai_jours: null, delai_mesures: null, distance_contexte }
  const jours = Math.max(0, Math.floor(
    (maintenant.getTime() - new Date(precedente.mesureAt).getTime()) / 86_400_000))
  const { count } = await admin
    .from('competences_mesures').select('id', { count: 'exact', head: true })
    .eq('eleve_id', eleveId).gt('mesure_at', precedente.mesureAt)
  return { delai_jours: jours, delai_mesures: count ?? 0, distance_contexte }
}

export interface ResultatEcriture {
  ecrite: boolean
  /** `true` quand une mesure existait déjà — la reprise n'en a pas créé une seconde. */
  dejaLa: boolean
  erreur: string | null
}

/**
 * Écrit UNE mesure. L'index unique partiel `(depot_id, competence)` fait le reste :
 * une seconde tentative rebondit sur `23505`, et c'est un SUCCÈS du dispositif,
 * pas une erreur — c'est précisément le mode de panne que le lot doit refermer.
 */
export async function ecrireMesure(admin: Admin, ligne: LigneMesure): Promise<ResultatEcriture> {
  const { error } = await admin.from('competences_mesures').insert(ligne)
  if (!error) return { ecrite: true, dejaLa: false, erreur: null }
  if (error.code === '23505') return { ecrite: false, dejaLa: true, erreur: null }
  return { ecrite: false, dejaLa: false, erreur: `${error.code} ${error.message}` }
}

/**
 * « `delta_v1_vf` compare les SQUELETTES, jamais les verdicts — et NULL n'est
 * pas 0 » (piège 17). Il s'attache à LA mesure de la v1, il n'en crée pas une
 * seconde : « le jugement porté sur la vf […] n'écrit JAMAIS dans les mesures ».
 */
export async function attacherDelta(
  admin: Admin, depotId: string, competence: Competence, delta: number | null,
): Promise<void> {
  if (delta === null) return
  const { error } = await admin.from('competences_mesures')
    .update({ delta_v1_vf: delta })
    .eq('depot_id', depotId).eq('competence', competence)
  if (error) console.error(`[chaine] delta non attaché — ${error.code} ${error.message}`)
}

/**
 * « Une paire de diagnostic est UNE mesure […] LES DEUX RÉSULTATS s'y attachent ;
 * le nouveau cas n'écrit JAMAIS une seconde ligne, et NULL n'est pas un échec —
 * une paire non terminée est NULL » (piège 18).
 */
export async function attacherResultatsPaire(
  admin: Admin, depotId: string, competence: Competence,
  resultats: { correctionJuste: boolean | null; nouveauCasDetecte: boolean | null },
): Promise<void> {
  const patch: Record<string, boolean> = {}
  if (resultats.correctionJuste !== null) patch.paire_correction_juste = resultats.correctionJuste
  if (resultats.nouveauCasDetecte !== null) patch.paire_nouveau_cas_detecte = resultats.nouveauCasDetecte
  if (!Object.keys(patch).length) return
  const { error } = await admin.from('competences_mesures').update(patch)
    .eq('depot_id', depotId).eq('competence', competence)
  if (error) console.error(`[chaine] résultats de paire non attachés — ${error.code} ${error.message}`)
}

/**
 * La FENÊTRE D'ÉVIDENCE — « les QUATRE DERNIÈRES mesures de la compétence »
 * (`01-` §3 ; `01-` §8.2). Elle est DÉRIVÉE, jamais stockée ; le retour s'en
 * sert pour dire le progrès, et « elle n'existe pas à la semaine 1 ».
 */
export const FENETRE_EVIDENCE = 4

export async function fenetreDEvidence(
  admin: Admin, eleveId: string, competence: Competence,
): Promise<Array<{ mesure_at: string; lettre_equivalente: string | null; observables: Observables; lieu: string; distance_contexte: string | null; delta_v1_vf: number | null }>> {
  const { data } = await admin
    .from('competences_mesures')
    .select('mesure_at, lettre_equivalente, observables, lieu, distance_contexte, delta_v1_vf, sonde_montee')
    .eq('eleve_id', eleveId).eq('competence', competence)
    // « Les mesures de sonde de montée en sont exclues » (`01-` §8.2, M-e).
    .eq('sonde_montee', false)
    .order('mesure_at', { ascending: false }).limit(FENETRE_EVIDENCE)
  return (data ?? []).reverse() as never
}
