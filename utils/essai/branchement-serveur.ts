import 'server-only'
// ============================================================================
// C6 · L4 — LE BRANCHEMENT DE L'ESSAI DE FRAGMENTS : L'ÉCRIVAIN.
// ----------------------------------------------------------------------------
// « Un essai déposé dans Fragments — par l'élève, ou par le professeur pour
//   lui — devient un dépôt de la chaîne sans qu'aucune valeur le nomme. »
//                                                             — `07-` §2, C6-L4
//
// Ce module est le SEUL endroit où Fragments et le système des exercices se
// touchent. Il fait entrer un dépôt qui existe dans une chaîne qui existe : il
// ne construit ni la transcription, ni la file, ni la correction, ni la
// publication — il les APPELLE, par les fonctions que les écrans de C4-L4
// appellent déjà (`utils/passation/depots.ts`).
//
// ⭐ TROIS GESTES DE FRAGMENTS Y MÈNENT, ET RIEN D'AUTRE :
//    · l'ASSIGNATION d'un essai à une classe → une ligne de plan + une instance
//      + les dépôts de toute la classe (« créée dès l'assignation, pas au
//      dépôt », `07-` §1.1) — quatrième écrivain d'`exercices_depots` ;
//    · l'OUVERTURE des dépôts (`depots_ouverts`) → `ouvrirLesDepots` — la tuile
//      de l'élève naît du lancement (`ouvert_par_prof_at`), les deux coïncident ;
//    · la CONFIRMATION d'un dépôt (élève ou professeur) → les pages entrent dans
//      `photos_v1`, sous la forme gardée, SANS copier un fichier, et la
//      transcription part en file par le seul prompt qui fait foi.
//
// ⛔ AUCUNE MESURE HORS DE LA FILE : le clic du professeur met en file par
//    `declencherLeLot`, comme pour l'examen — « le jour où une passation de
//    classe se traite hors de la file, il y a deux systèmes de mesure ».
//
// ⛔ SANS PLAN D'ÉVALUATION VALIDÉ, PAS D'ESSAI (décision de Louis, 02/09) : la
//    ligne de plan a besoin d'un `plan_id`, et l'ancre est portée par le plan.
//    Le refus se fait à la création et à l'assignation, jamais en silence.
//
// ⚠️ LECTURES ET ÉCRITURES PAR LE CLIENT ADMIN, LE RÔLE VÉRIFIÉ PAR L'APPELANT
//    (`essai-actions.ts`) : le moteur ne porte aucune policy élève, et ce lot
//    n'en ouvre aucune. supabase-js NE LÈVE PAS : chaque `error` est lu.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireGatePlanActif, plansValidesCourants } from '@/utils/plan-exercices'
import {
  declencherLeLot, mettreLaTranscriptionEnFile, ouvrirLesDepots, lireDepotsDeLInstance,
} from '@/utils/passation/depots'
import { remettreEnFile } from '@/utils/chaine/file'
import { depotsQuiBloquent, type DepotPourRetrait } from '@/utils/examens/retrait'
import {
  BUCKET_ESSAIS, CODE_TYPE_ESSAI, MODES_DE_LESSAI, assigneAtDeLEssai, consigneDeLEssai,
  genreDeLEssai, ligneDePlanDeLEssai, lundiDeLaDate, motifDeRefusDuRetrait, motifSansPlan,
  pagesDeLEssai, type PhotoDeFragments,
} from './regles'

type Admin = SupabaseClient
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const un = (v: unknown): unknown => (Array.isArray(v) ? v[0] ?? null : v ?? null)

export interface Refus { ok: false; message: string }
export interface Succes<T> { ok: true; data: T }
export type Issue<T> = Succes<T> | Refus
const refus = (message: string): Refus => ({ ok: false, message })
const ok = <T>(data: T): Succes<T> => ({ ok: true, data })

// ─────────────────────────────────────────────────────────────────────────────
// LE PLAN D'ÉVALUATION DE LA CLASSE — la condition d'existence de l'essai
// ─────────────────────────────────────────────────────────────────────────────

/** Le plan validé courant de la classe, par le chemin de tous les lecteurs du plan. */
export async function planValideDeLaClasse(
  admin: Admin, classeId: string,
): Promise<{ id: string; anneeScolaire: number } | null> {
  if (!(await lireGatePlanActif(admin))) return null
  const plans = await plansValidesCourants(admin)
  const p = plans.find((x) => x.classeId === classeId)
  return p ? { id: p.id, anneeScolaire: p.anneeScolaire } : null
}

/** Les NOMS des classes qui n'ont pas de plan validé — vides quand toutes en ont un. */
export async function classesSansPlan(admin: Admin, classeIds: readonly string[]): Promise<string[]> {
  const ids = [...new Set(classeIds)]
  if (ids.length === 0) return []
  const avecPlan = new Set(
    (await lireGatePlanActif(admin)) ? (await plansValidesCourants(admin)).map((p) => p.classeId) : [])
  const sans = ids.filter((id) => !avecPlan.has(id))
  if (sans.length === 0) return []
  const { data } = await admin.from('classes').select('id, nom').in('id', sans)
  const noms = new Map(((data ?? []) as unknown as Ligne[]).map((c) => [txt(c.id), txt(c.nom)]))
  return sans.map((id) => noms.get(id) || id.slice(0, 8))
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ASSIGNATION — la ligne de plan, l'instance, les dépôts de la classe
// ─────────────────────────────────────────────────────────────────────────────

interface Lien {
  id: string; essai_id: string; classe_id: string; date_essai: string
  depots_ouverts: boolean; exercice_id: string | null
}

async function lireLeLien(admin: Admin, essaiId: string, classeId: string): Promise<Lien | null> {
  const { data, error } = await admin
    .from('fragments_essais_classes')
    .select('id, essai_id, classe_id, date_essai, depots_ouverts, exercice_id')
    .eq('essai_id', essaiId).eq('classe_id', classeId).maybeSingle()
  if (error) {
    console.error(`[essai] lien essai × classe illisible — ${error.code} ${error.message}`)
    return null
  }
  return (data as unknown as Lien | null) ?? null
}

export interface Branche { exerciceId: string; planifieId: string; depotsCrees: number; dejaBranche: boolean }

/**
 * ⭐ POSER UN ESSAI DANS FRAGMENTS EST LE PLANIFIER. Idempotent : un lien déjà
 *    branché ne fait que resynchroniser ses dépôts (un élève arrivé depuis).
 *
 * L'ORDRE DES ÉCRITURES : la ligne de plan, puis l'instance (dont l'insertion
 * est le claim, `uk_exercices_planifie`), puis les dépôts, puis le lien. Un
 * échec en route défait ce qui précède : rien d'incomplet ne reste.
 */
export async function brancherEssaiClasse(
  admin: Admin, essaiId: string, classeId: string,
): Promise<Issue<Branche>> {
  const lien = await lireLeLien(admin, essaiId, classeId)
  if (!lien) return refus('Cet essai n’est pas assigné à cette classe.')

  if (lien.exercice_id) {
    const { data: ex } = await admin.from('exercices')
      .select('id, exercice_planifie_id').eq('id', lien.exercice_id).maybeSingle()
    if (ex) {
      const sync = await synchroniserLesDepotsDeLEssai(admin, lien)
      if (!sync.ok) return sync
      return ok({
        exerciceId: txt(lig(ex).id), planifieId: txt(lig(ex).exercice_planifie_id),
        depotsCrees: sync.data.crees, dejaBranche: true,
      })
    }
    // Le lien pointe une instance disparue (FK `set null` non encore passée) : on rebranche.
  }

  const { data: essai, error: eEssai } = await admin
    .from('fragments_essais_epreuves').select('titre, consignes, duree_minutes')
    .eq('id', essaiId).maybeSingle()
  if (eEssai || !essai) return refus(`Essai introuvable${eEssai ? ` : ${eEssai.message}` : '.'}`)
  const { data: classe } = await admin
    .from('classes').select('nom, type_pedagogique').eq('id', classeId).maybeSingle()
  const nomClasse = txt(lig(classe).nom) || classeId.slice(0, 8)

  const plan = await planValideDeLaClasse(admin, classeId)
  if (!plan) return refus(motifSansPlan([nomClasse]))

  const { data: type } = await admin
    .from('exercices_types').select('id').eq('code', CODE_TYPE_ESSAI).maybeSingle()
  const typeId = txt(lig(type).id)
  if (!typeId) {
    return refus(`Le type « ${CODE_TYPE_ESSAI} » est introuvable : la migration `
      + '`c4_l9_examens_diagnostiques.sql` n’est pas jouée sur cette base.')
  }

  // ── 1. La ligne de plan ────────────────────────────────────────────────────
  const maintenant = new Date().toISOString()
  const { data: ligne, error: eLigne } = await admin
    .from('scriptorium_exercices_planifies')
    .insert({
      plan_id: plan.id,
      ...ligneDePlanDeLEssai({
        titre: txt(lig(essai).titre), dateEssai: lien.date_essai,
        dureeMinutes: (lig(essai).duree_minutes as number | null) ?? null,
      }),
      concu_at: maintenant,
    })
    .select('id').single()
  if (eLigne || !ligne) {
    return refus(`La ligne de plan de l’essai n’a pas été écrite : ${eLigne?.message ?? 'aucune donnée'}`)
  }
  const planifieId = txt(lig(ligne).id)
  const defaireLaLigne = async () => {
    await admin.from('scriptorium_exercices_planifies').delete().eq('id', planifieId)
  }

  // ── 2. L'instance — le claim ───────────────────────────────────────────────
  const { data: instance, error: eIns } = await admin.from('exercices').insert({
    type_id: typeId,
    exercice_planifie_id: planifieId,
    classe_id: classeId,
    // ⭐ « C'est le `lieu` qui commande, JAMAIS le module. »
    lieu: 'classe',
    consigne_instanciee: consigneDeLEssai(txt(lig(essai).titre), txt(lig(essai).consignes) || null),
    modes_par_competence: MODES_DE_LESSAI,
    // Les deux drapeaux d'opt-in de classe, faux par défaut : le professeur les
    // lève à l'écran de passation s'il le veut (`leverLesDrapeaux`).
    optin_se_juger: false,
    optin_confiance_remise: false,
    genre: genreDeLEssai(txt(lig(classe).type_pedagogique) || null),
    // Les dépôts naissent dans le même geste : l'instance est `assigne` d'emblée.
    statut: 'assigne',
    // ⚠️ VOLONTAIREMENT ABSENTS, comme pour l'examen (C4-L9) : `cran` (type
    //    complet), `paire_diagnostic`, `bonus`, `cible_primaire` (repli
    //    alphabétique, ET SON ALERTE), `fenetre_*`, `borne_amont`.
  }).select('id').single()
  if (eIns || !instance) {
    await defaireLaLigne()
    return refus(`L’instance de l’essai n’a pas été écrite : ${eIns?.message ?? 'aucune donnée'}`)
  }
  const exerciceId = txt(lig(instance).id)
  const defaireLInstance = async () => {
    await admin.from('exercices').delete().eq('id', exerciceId)   // cascade sur les dépôts
    await defaireLaLigne()
  }

  // ── 3. Les dépôts de TOUTE la classe ───────────────────────────────────────
  const sync = await synchroniserLesDepotsDeLEssai(admin, { ...lien, exercice_id: exerciceId })
  if (!sync.ok) { await defaireLInstance(); return sync }

  // ── 4. Le lien — une colonne, un seul domicile ─────────────────────────────
  const { error: eLien } = await admin.from('fragments_essais_classes')
    .update({ exercice_id: exerciceId }).eq('id', lien.id)
  if (eLien) {
    await defaireLInstance()
    return refus(`Le lien essai ↔ instance n’a pas été écrit : ${eLien.message}`)
  }
  return ok({ exerciceId, planifieId, depotsCrees: sync.data.crees, dejaBranche: false })
}

/**
 * Les dépôts de la classe — TOUS les inscrits actifs, comme l'examen (décision
 * de Louis, 02/09 : « je ne vois pas comment un élève pourrait ne pas être
 * éligible »). N'insère QUE les manquants, jamais d'`upsert` : « ne jamais
 * réécrire l'état d'un élève qui a commencé » (`assignerALaClasse`).
 * Si les dépôts de l'essai sont ouverts, les nouveaux s'ouvrent aussi.
 */
export async function synchroniserLesDepotsDeLEssai(
  admin: Admin, lien: Pick<Lien, 'exercice_id' | 'classe_id' | 'date_essai' | 'depots_ouverts'>,
): Promise<Issue<{ crees: number }>> {
  const exerciceId = lien.exercice_id
  if (!exerciceId) return refus('Cet essai n’est pas branché à la chaîne de mesure.')
  const { data: inscrits, error: eIns } = await admin.from('inscriptions')
    .select('eleve_id').eq('classe_id', lien.classe_id).eq('statut', 'active')
  if (eIns) return refus(`Les inscriptions n’ont pas pu être lues : ${eIns.message}`)
  const eleves = [...new Set(((inscrits ?? []) as unknown as Ligne[]).map((i) => txt(i.eleve_id)))]
  if (eleves.length === 0) {
    return refus('Aucun élève inscrit dans cette classe : aucun dépôt ne naîtrait.')
  }
  const { depots, tronque } = await lireDepotsDeLInstance(admin, exerciceId)
  if (tronque) return refus('La liste des dépôts n’a pas pu être lue en entier : rien n’a été écrit.')
  const connus = new Set(depots.map((d) => d.eleve_id))
  const neufs = eleves.filter((e) => !connus.has(e))
  if (neufs.length === 0) return ok({ crees: 0 })

  const { data: poses, error } = await admin.from('exercices_depots').insert(
    neufs.map((eleveId) => ({
      eleve_id: eleveId, exercice_id: exerciceId,
      // « `origine` `prof` » : c'est le professeur qui pose l'essai.
      origine: 'prof',
      // ⭐ Midi UTC du lundi de la semaine de l'essai — l'assiduité compte la
      //    semaine d'`assigne_at` (`utils/assiduite/`), et l'essai pèse sur LA
      //    SIENNE, pas sur celle du geste.
      assigne_at: assigneAtDeLEssai(lien.date_essai),
      echeance: null,
      statut: 'assigne',
    }))).select('id')
  if (error) return refus(`Les dépôts n’ont pas été écrits : ${error.message}`)
  if (lien.depots_ouverts) await ouvrirLesDepots(admin, exerciceId)
  return ok({ crees: (poses ?? []).length })
}

/** La date de l'essai change pour cette classe : la ligne de plan et les dépôts non ouverts suivent. */
export async function reporterLaDateDeLEssai(
  admin: Admin, essaiId: string, classeId: string, dateEssai: string,
): Promise<Issue<{ deplaces: number }>> {
  const lien = await lireLeLien(admin, essaiId, classeId)
  if (!lien?.exercice_id) return ok({ deplaces: 0 })
  const { data: ex } = await admin.from('exercices')
    .select('exercice_planifie_id').eq('id', lien.exercice_id).maybeSingle()
  const planifieId = txt(lig(ex).exercice_planifie_id)
  if (planifieId) {
    const { error } = await admin.from('scriptorium_exercices_planifies')
      .update({ semaine_lundi: lundiDeLaDate(dateEssai), jour_prevu: dateEssai,
                updated_at: new Date().toISOString() })
      .eq('id', planifieId).is('supprime_at', null)
    if (error) return refus(`La ligne de plan n’a pas suivi la date : ${error.message}`)
  }
  // Seuls les dépôts que personne n'a ouverts changent de semaine.
  const { data, error } = await admin.from('exercices_depots')
    .update({ assigne_at: assigneAtDeLEssai(dateEssai), updated_at: new Date().toISOString() })
    .eq('exercice_id', lien.exercice_id).eq('statut', 'assigne').select('id')
  if (error) return refus(`Les dépôts n’ont pas suivi la date : ${error.message}`)
  return ok({ deplaces: (data ?? []).length })
}

/** Le titre, les consignes ou la durée changent : les instances et lignes des classes branchées suivent. */
export async function mettreAJourLEssaiBranche(
  admin: Admin, essaiId: string,
): Promise<Issue<{ instances: number }>> {
  const { data: essai } = await admin.from('fragments_essais_epreuves')
    .select('titre, consignes, duree_minutes').eq('id', essaiId).maybeSingle()
  if (!essai) return refus('Essai introuvable.')
  const { data: liens, error } = await admin.from('fragments_essais_classes')
    .select('exercice_id, date_essai').eq('essai_id', essaiId).not('exercice_id', 'is', null)
  if (error) return refus(`Liens illisibles : ${error.message}`)
  let n = 0
  for (const l of (liens ?? []) as unknown as Ligne[]) {
    const exerciceId = txt(l.exercice_id)
    const { data: ex, error: eEx } = await admin.from('exercices')
      .update({ consigne_instanciee: consigneDeLEssai(txt(lig(essai).titre), txt(lig(essai).consignes) || null),
                updated_at: new Date().toISOString() })
      .eq('id', exerciceId).select('exercice_planifie_id').maybeSingle()
    if (eEx) return refus(`L’instance n’a pas suivi : ${eEx.message}`)
    const planifieId = txt(lig(ex).exercice_planifie_id)
    if (planifieId) {
      const ligne = ligneDePlanDeLEssai({
        titre: txt(lig(essai).titre), dateEssai: txt(l.date_essai),
        dureeMinutes: (lig(essai).duree_minutes as number | null) ?? null,
      })
      await admin.from('scriptorium_exercices_planifies')
        .update({ titre: ligne.titre, duree_estimee_min: ligne.duree_estimee_min,
                  updated_at: new Date().toISOString() })
        .eq('id', planifieId).is('supprime_at', null)
    }
    n++
  }
  return ok({ instances: n })
}

/**
 * LE RETRAIT d'un essai d'une classe : refusé si un élève a écrit quelque chose
 * (le motif de C4-L9), sinon la ligne de plan devient un tombstone (`annule` +
 * `supprime_at`) et l'instance part avec ses dépôts vides.
 */
export async function debrancherEssaiClasse(
  admin: Admin, essaiId: string, classeId: string,
): Promise<Issue<{ retire: boolean }>> {
  const lien = await lireLeLien(admin, essaiId, classeId)
  if (!lien?.exercice_id) return ok({ retire: false })
  const exerciceId = lien.exercice_id

  const { count: nb, error: eCount } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true }).eq('exercice_id', exerciceId)
  if (eCount) return refus(`Dépôts illisibles : ${eCount.message}`)
  if ((nb ?? 0) > 0) {
    const { data: depots, error: eDep } = await admin.from('exercices_depots')
      .select('statut, texte_v1, texte_vf, transcription_v1, transcription_vf, photos_v1, photos_vf')
      .eq('exercice_id', exerciceId).limit(2000)
    if (eDep) return refus(`Dépôts illisibles : ${eDep.message}`)
    const lignes = (depots ?? []) as unknown as DepotPourRetrait[]
    if (lignes.length !== nb) {
      return refus('Vérification impossible : la lecture des dépôts est incomplète. Le retrait est refusé par prudence.')
    }
    const motif = motifDeRefusDuRetrait(depotsQuiBloquent(lignes))
    if (motif) return refus(motif)
  }

  const { data: ex } = await admin.from('exercices')
    .select('exercice_planifie_id').eq('id', exerciceId).maybeSingle()
  const planifieId = txt(lig(ex).exercice_planifie_id)
  // Le lien d'abord, puis l'instance (les dépôts vides partent en cascade), puis
  // le tombstone de la ligne — `exercices → planifies` est en `restrict`.
  const { error: eLien } = await admin.from('fragments_essais_classes')
    .update({ exercice_id: null }).eq('id', lien.id)
  if (eLien) return refus(`Le lien n’a pas pu être défait : ${eLien.message}`)
  const { error: eDel } = await admin.from('exercices').delete().eq('id', exerciceId)
  if (eDel) return refus(`L’instance n’a pas été retirée : ${eDel.message}`)
  if (planifieId) {
    const maintenant = new Date().toISOString()
    await admin.from('scriptorium_exercices_planifies')
      .update({ statut: 'annule', supprime_at: maintenant, updated_at: maintenant })
      .eq('id', planifieId)
  }
  return ok({ retire: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// L'OUVERTURE, LE DÉPÔT, LA MESURE — par les fonctions de C4-L4
// ─────────────────────────────────────────────────────────────────────────────

/** `depots_ouverts` passe à vrai : les dépôts de la chaîne s'ouvrent (les deux coïncident). */
export async function ouvrirLesDepotsDeLEssai(
  admin: Admin, essaiId: string, classeId: string,
): Promise<Issue<{ ouverts: number; deja: number }>> {
  const lien = await lireLeLien(admin, essaiId, classeId)
  if (!lien?.exercice_id) return ok({ ouverts: 0, deja: 0 })
  return ouvrirLesDepots(admin, lien.exercice_id)
}

export interface CopieDeposee {
  depotId: string
  pages: number
  transcription: 'en_file' | 'deja_en_file' | 'remise_en_file' | 'conservee'
}

/**
 * ⭐⭐ LE MOMENT OÙ LES PHOTOS SONT TOUTES LÀ — `confirmerDepotEssaiEleve` et son
 *     jumeau professeur y mènent, par un appel.
 *
 * Les pages entrent dans `photos_v1` SOUS LA FORME GARDÉE, dans leur bucket
 * (`essais`) — aucun fichier copié —, et la transcription part en file par le
 * seul prompt qui fait foi (`mettreLaTranscriptionEnFile` → `transcription_v1`).
 *
 * LE RE-DÉPÔT : de nouvelles photos = une nouvelle transcription. Le dépôt
 * revient `ouvert` (transcription, confiance, doutes et `v1_remis_at` effacés)
 * et le job abouti est remis en file — SAUF si une mesure existe déjà : la copie
 * mesurée fait foi, on la conserve, et on le dit.
 */
export async function deposerLaCopieDansLaChaine(
  admin: Admin, fragmentsDepotId: string,
): Promise<Issue<CopieDeposee>> {
  const { data: fd, error: eFd } = await admin.from('fragments_essai_depots')
    .select('id, essai_id, eleve_id, inscription_id, inscriptions!inner(classe_id)')
    .eq('id', fragmentsDepotId).maybeSingle()
  if (eFd || !fd) return refus(`Dépôt d’essai introuvable${eFd ? ` : ${eFd.message}` : '.'}`)
  const f = fd as unknown as Ligne
  const classeId = txt(lig(un(f.inscriptions)).classe_id)
  const eleveId = txt(f.eleve_id)
  const lien = await lireLeLien(admin, txt(f.essai_id), classeId)
  if (!lien?.exercice_id) {
    return refus('Cet essai n’est pas branché à la chaîne de mesure pour cette classe '
      + '(assigné avant le branchement, ou classe sans plan d’évaluation).')
  }
  const exerciceId = lien.exercice_id

  // ── Le dépôt de la chaîne — et le filet : il naît s'il manque ──────────────
  let { data: depot } = await admin.from('exercices_depots')
    .select('id, statut, ouvert_par_prof_at, v1_remis_at')
    .eq('eleve_id', eleveId).eq('exercice_id', exerciceId).maybeSingle()
  if (!depot) {
    const { data: cree, error: eCree } = await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: exerciceId, origine: 'prof',
      assigne_at: assigneAtDeLEssai(lien.date_essai), echeance: null, statut: 'assigne',
    }).select('id, statut, ouvert_par_prof_at, v1_remis_at').single()
    if (eCree || !cree) return refus(`Le dépôt de la chaîne n’a pas pu naître : ${eCree?.message ?? ''}`)
    depot = cree
  }
  const d = depot as unknown as { id: string; statut: string; ouvert_par_prof_at: string | null; v1_remis_at: string | null }
  const maintenant = new Date().toISOString()

  // ── L'ouverture — le geste du professeur, qui a ouvert les dépôts (ou déposé lui-même) ──
  if (!d.ouvert_par_prof_at) {
    const { error } = await admin.from('exercices_depots')
      .update({ statut: 'ouvert', ouvert_at: maintenant, ouvert_par_prof_at: maintenant, updated_at: maintenant })
      .eq('id', d.id).eq('statut', 'assigne')
    if (error) return refus(`Le dépôt n’a pas pu être ouvert : ${error.message}`)
  }

  // ── Une copie déjà mesurée fait foi ────────────────────────────────────────
  const { count: nbMesures } = await admin.from('competences_mesures')
    .select('id', { count: 'exact', head: true }).eq('depot_id', d.id)
  if ((nbMesures ?? 0) > 0) {
    return ok({ depotId: d.id, pages: 0, transcription: 'conservee' })
  }

  // ── Les pages, sous la forme gardée, dans leur bucket ──────────────────────
  const { data: photos, error: ePhotos } = await admin.from('fragments_essai_depot_photos')
    .select('storage_path, ordre').eq('depot_id', fragmentsDepotId).order('ordre')
  if (ePhotos) return refus(`Photos illisibles : ${ePhotos.message}`)
  const liste = (photos ?? []) as unknown as Array<{ storage_path: string; ordre: number }>
  if (liste.length === 0) return refus('Aucune photo sur ce dépôt d’essai.')
  const meta = await empreintesDuStockage(admin, `${eleveId}/${fragmentsDepotId}`)
  const pages = pagesDeLEssai(liste.map((p): PhotoDeFragments => ({
    storage_path: p.storage_path, ordre: p.ordre,
    taille: meta.get(p.storage_path)?.taille ?? null, etag: meta.get(p.storage_path)?.etag ?? null,
  })))

  const { error: eMaj } = await admin.from('exercices_depots').update({
    photos_v1: pages,
    // Le re-dépôt : la transcription d'avant ne vaut plus, la copie revient `ouvert`.
    ...(d.v1_remis_at ? {
      transcription_v1: null, confiance_ocr_v1: null, transcription_v1_doutes: null,
      v1_remis_at: null, statut: 'ouvert',
    } : {}),
    updated_at: maintenant,
  }).eq('id', d.id)
  if (eMaj) return refus(`Les pages n’ont pas été écrites : ${eMaj.message}`)

  // ── La transcription, par la file, et par aucun autre chemin ───────────────
  const file = await mettreLaTranscriptionEnFile(admin, d.id)
  if (!file.ok) return file
  if (!file.data.deja) return ok({ depotId: d.id, pages: pages.length, transcription: 'en_file' })
  const remis = await remettreEnFile(admin, d.id, 'transcription_v1', 'nouvelles photos déposées dans Vestigia')
  return ok({ depotId: d.id, pages: pages.length, transcription: remis.remis ? 'remise_en_file' : 'deja_en_file' })
}

/** La taille et l'empreinte de chaque fichier d'un dossier du bucket `essais`, telles que le stockage les rend. */
async function empreintesDuStockage(
  admin: Admin, dossier: string,
): Promise<Map<string, { taille: number | null; etag: string | null }>> {
  const out = new Map<string, { taille: number | null; etag: string | null }>()
  const { data, error } = await admin.storage.from(BUCKET_ESSAIS).list(dossier, { limit: 100 })
  if (error) {
    console.error(`[essai] stockage illisible (${dossier}) — ${error.message} : les pages `
      + 'porteront leur chemin pour empreinte.')
    return out
  }
  for (const f of data ?? []) {
    const m = (f.metadata ?? {}) as Record<string, unknown>
    out.set(`${dossier}/${f.name}`, {
      taille: typeof m.size === 'number' ? m.size : null,
      etag: typeof m.eTag === 'string' ? m.eTag : null,
    })
  }
  return out
}

/** Le clic du professeur : les copies transcrites entrent en file de mesure — idempotent. */
export async function declencherLaMesureDeLEssai(
  admin: Admin, essaiId: string, classeId: string,
): Promise<Issue<{ misEnFile: number; dejaEnFile: number; sansCopie: number }>> {
  const lien = await lireLeLien(admin, essaiId, classeId)
  if (!lien?.exercice_id) return refus('Cet essai n’est pas branché à la chaîne de mesure pour cette classe.')
  return declencherLeLot(admin, lien.exercice_id)
}

// ─────────────────────────────────────────────────────────────────────────────
// LES LECTURES INVERSES — de l'instance ou du dépôt vers l'essai
// ─────────────────────────────────────────────────────────────────────────────

export interface EssaiDeLInstance {
  essaiId: string; classeId: string; titre: string; classeNom: string; dateEssai: string
}

/** De quelle (essai × classe) cette instance vient — pour l'écran du professeur. */
export async function essaiDeLInstance(admin: Admin, exerciceId: string): Promise<EssaiDeLInstance | null> {
  const { data } = await admin.from('fragments_essais_classes')
    .select('essai_id, classe_id, date_essai, fragments_essais_epreuves(titre), classes(nom)')
    .eq('exercice_id', exerciceId).maybeSingle()
  if (!data) return null
  const l = data as unknown as Ligne
  return {
    essaiId: txt(l.essai_id), classeId: txt(l.classe_id), dateEssai: txt(l.date_essai),
    titre: txt(lig(un(l.fragments_essais_epreuves)).titre),
    classeNom: txt(lig(un(l.classes)).nom),
  }
}

/** De quel essai ce dépôt de la chaîne vient — `null` si ce n'est pas un essai de Fragments. */
export async function essaiDuDepot(admin: Admin, depotId: string): Promise<EssaiDeLInstance | null> {
  const { data } = await admin.from('exercices_depots').select('exercice_id').eq('id', depotId).maybeSingle()
  const exerciceId = txt(lig(data).exercice_id)
  return exerciceId ? essaiDeLInstance(admin, exerciceId) : null
}

export interface EtatDeLaChaine {
  exerciceId: string
  depots: number
  ouverts: number
  remis: number
  retoursPublies: number
  mesures: number
}

/** Ce que la page de l'essai montre de la chaîne, pour une classe — sans joindre les tables interdites. */
export async function etatDeLaChaineDeLEssai(
  admin: Admin, essaiId: string, classeId: string,
): Promise<EtatDeLaChaine | null> {
  const lien = await lireLeLien(admin, essaiId, classeId)
  if (!lien?.exercice_id) return null
  const { depots } = await lireDepotsDeLInstance(admin, lien.exercice_id)
  const ids = depots.map((d) => d.id)
  let mesures = 0
  if (ids.length > 0) {
    const { count } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).in('depot_id', ids)
    mesures = count ?? 0
  }
  return {
    exerciceId: lien.exercice_id,
    depots: depots.length,
    ouverts: depots.filter((d) => d.ouvert_par_prof_at != null).length,
    remis: depots.filter((d) => d.v1_remis_at != null).length,
    retoursPublies: depots.filter((d) => d.statut === 'retour_publie').length,
    mesures,
  }
}
