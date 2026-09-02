import 'server-only'
// ============================================================================
// C4 · L4 — L'OUVRIER DE LA TRANSCRIPTION : ce qu'un job `transcription_v1` fait.
// ----------------------------------------------------------------------------
// Il est appelé de DEUX endroits, et c'est le choix du piège 2 :
//   1. LE DÉPÔT LUI-MÊME, tout de suite après l'écriture des photos — « le dépôt
//      appelle lui-même le déclencheur » (§1.1). C'est le chemin normal, celui
//      qui tient « les quelques secondes, pendant l'heure de cours » ;
//   2. LA ROUTE PLANIFIÉE, comme FILET — « une tâche planifiée est due dans les
//      deux cas : c'est le filet qui reprend les jobs dont le bail a expiré et
//      que plus aucun dépôt ne rappelle » (§1.1).
//
// Les deux passent par LA MÊME FILE et le MÊME code : il n'y a pas deux chemins
// de traitement (piège 1), il y a deux réveils.
//
// ⚠️ CET OUVRIER NE MESURE RIEN. Il ne touche ni `competences_mesures`, ni
//    `exercices_squelettes`, ni `monitoring_mesures` : il écrit une
//    transcription, une confiance et des doutes sur `exercices_depots`.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  reclamerJobs, terminerJob, reposerJob, type Job,
} from '@/utils/chaine/file'
import { lireConfigPassation } from './config'
import { passationOuverteAEleve } from './acces'
import { transcrire, TranscriptionImpossible } from './transcription'
import { ETAPE_TRANSCRIPTION } from './depots'
import type { Photo } from './photos'
import { sansControleDeLEleve } from '@/utils/essai/regles'

type Admin = SupabaseClient

export interface BilanTranscription {
  depotId: string
  /** Le nombre de blocs de la transcription rendue — la preuve du découpage. */
  nbBlocs: number
  confiance: number | null
  doutes: number
  appels: number
  dureeMs: number
  alertes: string[]
}

/** La passation est fermée POUR TOUT LE MONDE : le job se repose, il n'échoue pas. */
export class PassationSuspendue extends Error {}
/** CE dépôt-ci ne peut pas être transcrit, et aucun tour n'y changera rien. */
export class DepotSansCopie extends Error {}

/**
 * Transcrit UN dépôt. Point d'entrée unique.
 *
 * ⚠️ IDEMPOTENT PAR CONSTRUCTION : un dépôt déjà transcrit ET déjà validé par
 *    l'élève n'est pas re-transcrit — écraser sa correction serait exactement
 *    la panne que le bail existe pour éviter (« une reprise après expiration
 *    écrit une seconde mesure pour la même copie », §1.1). Un dépôt transcrit
 *    mais NON validé se re-transcrit : l'élève n'a encore rien corrigé, et une
 *    reprise après panne doit pouvoir lui rendre son écran.
 */
export async function transcrireDepot(
  admin: Admin, depotId: string,
): Promise<BilanTranscription> {
  const debut = Date.now()

  if (!(await passationOuverteAEleve(admin))) {
    throw new PassationSuspendue(
      '`passation_classe_actif` (ou `exercices_actif`) est à OFF — les dépôts restent en file.')
  }

  const { data, error } = await admin.from('exercices_depots')
    .select('id, eleve_id, statut, photos_v1, transcription_v1, v1_remis_at, '
      + 'ouvert_par_prof_at, exercices!inner(lieu, classe_id, exercice_planifie_id)')
    .eq('id', depotId).maybeSingle()
  if (error) throw new Error(`dépôt ${depotId} illisible — ${error.code} ${error.message}`)
  if (!data) throw new DepotSansCopie(`dépôt ${depotId} introuvable.`)

  const d = data as unknown as {
    id: string; eleve_id: string; statut: string; photos_v1: Photo[] | null
    transcription_v1: string | null; v1_remis_at: string | null; ouvert_par_prof_at: string | null
    exercices: { lieu: string; classe_id: string | null; exercice_planifie_id: string | null }
      | Array<{ lieu: string; classe_id: string | null; exercice_planifie_id: string | null }>
  }
  const ex = Array.isArray(d.exercices) ? d.exercices[0] : d.exercices

  if (ex?.lieu !== 'classe') {
    throw new DepotSansCopie(`dépôt ${depotId} : le \`lieu\` vaut « ${String(ex?.lieu)} » — `
      + 'la transcription de C4-L4 ne sert que la passation en classe.')
  }
  if (!d.ouvert_par_prof_at) {
    throw new DepotSansCopie(`dépôt ${depotId} : le professeur n'a pas ouvert le dépôt.`)
  }
  if (d.v1_remis_at) {
    // L'élève a validé : sa correction fait foi, on ne la piétine pas.
    throw new DepotSansCopie(
      `dépôt ${depotId} : la copie est déjà validée par l'élève — la re-transcrire écraserait `
      + 'sa correction, et « la mesure porte sur la version corrigée » (`02-` §6.D).')
  }
  if (!d.photos_v1 || d.photos_v1.length === 0) {
    throw new DepotSansCopie(`dépôt ${depotId} : aucune photo déposée.`)
  }

  const rendu = await transcrire(
    admin, { id: d.id, eleve_id: d.eleve_id, classe_id: ex?.classe_id ?? null }, d.photos_v1)

  // ⭐ C6-L4 — « MANUSCRIT → PHOTOS → TRANSCRIPTION », TROIS ÉTAPES, PAS QUATRE
  //    (`06-` §1) : l'essai de Fragments n'a pas de contrôle par l'élève, et
  //    `v1_remis_at` se pose ICI, à l'aboutissement, sans son geste — sinon
  //    `declencherLeLot` écarterait la copie. Reconnu PAR LA LIGNE DE PLAN
  //    (`essai × fragments`), jamais par une valeur sur le dépôt.
  const remiseSansControle = sansControleDeLEleve(
    await ligneDePlanDeLInstance(admin, ex?.exercice_planifie_id ?? null))
  const maintenant = new Date().toISOString()

  const { error: eEcriture } = await admin.from('exercices_depots').update({
    // ⚠️ TEL QUEL : aucun `trim`, aucune normalisation — « le champ d'édition
    //    préserve le découpage, et il le conserve de bout en bout, de la photo à
    //    la transcription » (`06-` §4 ; `07-` §3 ; piège 14).
    transcription_v1: rendu.texte,
    confiance_ocr_v1: rendu.confiance,
    transcription_v1_doutes: rendu.doutes.length ? rendu.doutes : null,
    updated_at: maintenant,
    ...(remiseSansControle ? { v1_remis_at: maintenant, statut: 'v1_remis' } : {}),
  }).eq('id', depotId)
  if (eEcriture) {
    // supabase-js NE LÈVE PAS : sans ce contrôle, deux appels seraient payés et
    // l'écran resterait vide sans que rien ne le dise (leçon C11a).
    throw new Error(`la transcription du dépôt ${depotId} n'a pas été écrite — `
      + `${eEcriture.code} ${eEcriture.message} (${rendu.appels} appel(s) déjà payé(s))`)
  }

  return {
    depotId,
    nbBlocs: rendu.nbBlocs,
    confiance: rendu.confiance,
    doutes: rendu.doutes.length,
    appels: rendu.appels,
    dureeMs: Date.now() - debut,
    alertes: rendu.alertes,
  }
}

/**
 * Le CHEMIN NORMAL : le dépôt réclame SON PROPRE job et le traite tout de suite.
 *
 * ⚠️ IL RÉCLAME SON JOB, ET PAS LE PREMIER DE LA FILE. C'est ce que le test de
 *    charge à cent quarante a corrigé le 22/08 : `reclamerJobs` trie par
 *    `created_at ASC`, et sans le filtre `depotId`, l'élève qui vient de
 *    photographier réclamait LA COPIE DU PREMIER, la reposait, et n'avait jamais
 *    déclenché la sienne. À trente-cinq dépôts dans une salle, un seul écran
 *    répondait ; les trente-quatre autres attendaient une tâche planifiée qui
 *    « ne tient pas la seconde » et qui n'est pas encore posée (piège 46).
 *
 * ⚠️ IL RÉCLAME AVANT DE TRAITER, et c'est ce qui rend le double-clic gratuit :
 *    le compare-and-swap de `reclamerJobs` fait qu'un seul des deux appels
 *    obtient le job — l'autre n'a rien à faire et rend `null`.
 */
/** La ligne de plan de l'instance — `null` quand il n'y en a pas (hors plan). */
async function ligneDePlanDeLInstance(
  admin: Admin, planifieId: string | null,
): Promise<{ type_exercice: string | null; module: string | null } | null> {
  if (!planifieId) return null
  const { data } = await admin
    .from('scriptorium_exercices_planifies').select('type_exercice, module')
    .eq('id', planifieId).maybeSingle()
  return (data as { type_exercice: string | null; module: string | null } | null) ?? null
}

export async function transcrireMaintenant(
  admin: Admin, depotId: string,
): Promise<{ bilan: BilanTranscription | null; motif: string | null }> {
  const config = lireConfigPassation()
  const jobs = await reclamerJobs(admin, {
    limite: 1,
    bailMs: config.delaiTranscriptionMs,
    etapes: [ETAPE_TRANSCRIPTION],
    depotId,
  })
  const job = jobs[0]
  if (!job) {
    // Le job n'est pas réclamable : un autre l'a pris (double-clic, ou le filet),
    // ou il est déjà abouti, ou il est en échec définitif. Rien à faire ici — et
    // rien d'alarmant à dire : l'écran lit l'état de la file, qui, lui, sait.
    return { bilan: null, motif: 'la transcription est déjà en cours ou déjà faite' }
  }
  const sorties = await traiterUnJobDeTranscription(admin, job)
  return { bilan: sorties.bilan ?? null, motif: sorties.erreur ?? null }
}

/** Le traitement d'UN job de transcription, avec sa clôture. Partagé par les deux réveils. */
export async function traiterUnJobDeTranscription(
  admin: Admin, job: Job,
): Promise<{ job: Job; bilan?: BilanTranscription; erreur?: string }> {
  try {
    const bilan = await transcrireDepot(admin, job.depot_id)
    await terminerJob(admin, job, { statut: 'abouti', message: resume(bilan) })
    return { job, bilan }
  } catch (e) {
    if (e instanceof PassationSuspendue) {
      // Suspension GLOBALE : le job est REPOSÉ, sa tentative rendue — il n'a pas
      // échoué, il n'a pas eu le droit de tourner (patron `tourDeFile`, C4-L5).
      await reposerJob(admin, job, e.message)
      return { job, erreur: e.message }
    }
    if (e instanceof DepotSansCopie) {
      // Panne LOCALE et PERMANENTE : trois tentatives n'y changeraient rien, et
      // le laisser en file gèlerait la tête de file (leçon `DepotInexploitable`).
      await terminerJob(admin, job, { statut: 'echoue', message: e.message, definitif: true })
      return { job, erreur: e.message }
    }
    const message = e instanceof Error ? e.message : String(e)
    const definitif = e instanceof TranscriptionImpossible
      && message.includes('aucune page déposée')
    await terminerJob(admin, job, { statut: 'echoue', message, definitif })
    return { job, erreur: message }
  }
}

function resume(b: BilanTranscription): string {
  return `${b.nbBlocs} bloc(s), confiance ${b.confiance ?? 'n/a'}, ${b.doutes} doute(s), `
    + `${b.appels} appel(s), ${(b.dureeMs / 1000).toFixed(1)} s`
    + (b.alertes.length ? ` — ${b.alertes.join(' | ')}` : '')
}
