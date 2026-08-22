import 'server-only'
// ============================================================================
// C4 · L9 — CE QUE LE PROFESSEUR A À CONCEVOIR, DANS SON MODULE.
// ----------------------------------------------------------------------------
// « Le professeur voit ce qu'il a à concevoir, DANS SON MODULE. Les lignes de
//   plan *à concevoir* s'affichent dans CODEX pour l'écriture, dans ALETHEIA
//   pour la lecture, avec leur DATE et leur RETARD — c'est le régime DÉJÀ EN
//   PLACE pour la synthèse et pour le quiz. »                 — `07-` §2, C4-L9
//
// ⭐ LE PATRON EXISTE, ON NE LE RÉÉCRIT PAS. Deux encarts le servent déjà, tous
//    deux depuis les lignes de plan `a_concevoir` des PLANS VALIDÉS COURANTS :
//    `app/prof/codex/synthese-a-preparer.ts` (la synthèse) et
//    `app/prof/quazian/quizz/plan-quazian.ts` (le quiz, avec son deep-link
//    `?exercice={id}` et son drapeau de retard). Le vocabulaire est en place :
//    la colonne `statut`, l'INDEX DÉDIÉ `on (statut, semaine_lundi) where statut
//    = 'a_concevoir'`, la résolution de date par `dateEffectiveSemaine()`, et
//    les TROIS PASTILLES de la grille. Le troisième cas se sert du même chemin.
//
// ⚠️ GATE OFF → INERTE, JAMAIS À MOITIÉ. `lireGatePlanActif`
//    (`scriptorium_params.plan_evaluation_actif`) commande TOUT ce qui lit le
//    plan : gate absent ou OFF, ceci rend une LISTE VIDE et la page du module
//    est INCHANGÉE — c'est ce que font les deux helpers existants, à la première
//    ligne. ⚠️ L'écran de CONCEPTION, lui, vit derrière `fabrique_actif` : deux
//    interrupteurs, deux questions différentes, et on ne lie pas l'un à l'autre.
//
// ⚠️ LECTURE PAR LE CLIENT ADMIN : les tables du plan sont en RLS PROF-ONLY.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireGatePlanActif, plansValidesCourants } from '@/utils/plan-exercices'
import { dateEffectiveSemaine } from '@/utils/plan-cadence'
import { TYPE_EXERCICE, type ModuleExamen } from './types'

export interface ExamenAConcevoir {
  /** L'identifiant de LA LIGNE DE PLAN — c'est elle qui appelle la conception. */
  planifieId: string
  classeId: string
  classeNom: string
  /** La fenêtre diagnostique du plan : `septembre` · `decembre` · `fevrier`. */
  fenetre: string | null
  /** La date effective (§4.6) — jamais demandée à personne, TOUJOURS lue. */
  echeance: string
  enRetard: boolean
  /** L'instance déjà conçue sur cette ligne, s'il y en a une. */
  exerciceId: string | null
}

/**
 * Les examens diagnostiques `a_concevoir` du module, plans validés courants.
 *
 * Le chemin est celui du piège 24, mot pour mot : `lireGatePlanActif` →
 * `plansValidesCourants` → filtre sur `type_exercice` + `diagnostique` +
 * `statut = 'a_concevoir'` → `.is('supprime_at', null)`.
 */
export async function examensAConcevoir(
  admin: SupabaseClient, module: ModuleExamen,
): Promise<ExamenAConcevoir[]> {
  if (!(await lireGatePlanActif(admin))) return []
  const plans = await plansValidesCourants(admin)
  if (plans.length === 0) return []
  const classeParPlan = new Map(plans.map((p) => [p.id, p.classeId]))

  const { data: lignes, error } = await admin
    .from('scriptorium_exercices_planifies')
    .select('id, plan_id, lieu, semaine_lundi, jour_prevu, fenetre_diagnostique')
    .in('plan_id', plans.map((p) => p.id))
    .eq('type_exercice', TYPE_EXERCICE[module])
    .eq('diagnostique', true)
    .eq('statut', 'a_concevoir')
    .is('supprime_at', null)
  if (error) {
    // Une lecture ratée n'est pas une liste vide : on le dit au serveur plutôt
    // que de laisser l'encart affirmer « rien à concevoir ».
    console.error(`[examens] lignes de plan illisibles (${module}) — ${error.code} ${error.message}`)
    return []
  }
  const rows = (lignes ?? []) as unknown as Array<Record<string, unknown>>
  if (rows.length === 0) return []

  const [{ data: classes }, dejaConcues] = await Promise.all([
    admin.from('classes').select('id, nom').in('id', [...new Set(classeParPlan.values())]),
    instancesParLigne(admin, rows.map((e) => String(e.id))),
  ])
  const nomParClasse = new Map((classes ?? []).map((c) => [c.id as string, c.nom as string]))
  const today = new Date().toISOString().slice(0, 10)

  return rows.map((e) => {
    const classeId = classeParPlan.get(String(e.plan_id)) as string
    // ⚠️ LA DATE SE LIT, ELLE NE SE DEMANDE JAMAIS. « La cadence d'ancre est un
    //    objectif du plan d'évaluation, qui appartient au professeur » (`01-`
    //    §9) : si une date manque, c'est au PLAN qu'on la pose, pas ici.
    const echeance = dateEffectiveSemaine(
      String(e.semaine_lundi), (e.jour_prevu as string | null) ?? null,
      e.lieu as 'classe' | 'maison')
    return {
      planifieId: String(e.id),
      classeId,
      classeNom: nomParClasse.get(classeId) ?? '',
      fenetre: (e.fenetre_diagnostique as string | null) ?? null,
      echeance,
      enRetard: echeance < today,
      exerciceId: dejaConcues.get(String(e.id)) ?? null,
    }
  }).sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || a.echeance.localeCompare(b.echeance))
}

/**
 * LA LECTURE INVERSE — de la ligne de plan vers son instance.
 *
 * « Les deux se retrouvent l'une l'autre » se vérifie DANS LES DEUX SENS : de
 * l'instance vers la ligne par `exercice_planifie_id`, et de la ligne vers
 * l'instance par cette lecture-ci. UNE SEULE COLONNE, DEUX LECTURES — jamais
 * deux colonnes (`07-` §2, C4-L9 ; la décision de Louis du 22/08).
 *
 * L'index `uk_exercices_planifie` la rend univoque : au plus une instance par
 * ligne de plan, et il n'y a donc rien à départager.
 */
export async function instancesParLigne(
  admin: SupabaseClient, planifieIds: readonly string[],
): Promise<Map<string, string>> {
  if (planifieIds.length === 0) return new Map()
  const { data, error } = await admin
    .from('exercices').select('id, exercice_planifie_id').in('exercice_planifie_id', planifieIds)
  if (error) {
    console.error(`[examens] lecture inverse impossible — ${error.code} ${error.message}`)
    return new Map()
  }
  return new Map(((data ?? []) as unknown as Array<Record<string, unknown>>)
    .map((e) => [String(e.exercice_planifie_id), String(e.id)]))
}
