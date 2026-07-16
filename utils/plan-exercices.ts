// Couche I/O du plan annuel d'évaluation (client admin — RLS prof-only sur les
// tables du plan). Le moteur PUR vit dans utils/plan-cadence.ts. En Lot 1, seule
// la lecture tolérante du gate est fournie ; la résolution des dates (semaine +
// synthèse), l'émission calendrier et la synchronisation quiz arrivent avec leurs
// lots consommateurs (3/4/5). Voir SPEC_scriptorium_planification_exercices.md §4.6/§9.

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDaysUTC, toISODate } from './calendrier-grille'

/**
 * Gate dark-launch du plan d'évaluation (scriptorium_params.plan_evaluation_actif,
 * id=1). Défaut false ; table/colonne absente tolérée → false (dégrade proprement
 * AVANT l'exécution de plan_evaluation_phase_a.sql). Patron exact de lireModeCActif
 * (utils/aletheia-dates.ts) : `error` non déstructuré → `data` null → false.
 */
export async function lireGatePlanActif(admin: SupabaseClient): Promise<boolean> {
  const { data } = await admin
    .from('scriptorium_params')
    .select('plan_evaluation_actif')
    .eq('id', 1)
    .maybeSingle()
  return !!(data as { plan_evaluation_actif?: boolean } | null)?.plan_evaluation_actif
}

export interface PlanValideCourant { id: string; classeId: string; anneeScolaire: number }

/**
 * Plans d'évaluation VALIDÉS COURANTS : au plus UN par classe = celui de la plus
 * grande annee_scolaire — MÊME référentiel que la grille panoptique
 * (chargerClassesAvecPlan / chargerPlanDeClasse, qui prennent le plan le plus
 * récent par classe). Les dérivations (à-faire A1/A2, calendrier prospectif) DOIVENT
 * s'aligner dessus : sinon un plan d'une année révolue resté 'valide' (le soft-delete
 * P4 n'impose aucune exclusivité inter-AY) engendrerait des tâches/événements
 * orphelins pointant vers un plan inatteignable depuis ?vue=evaluations&classe=X.
 * Lecture admin (tables du plan en RLS prof-only).
 */
export async function plansValidesCourants(admin: SupabaseClient): Promise<PlanValideCourant[]> {
  const { data } = await admin
    .from('scriptorium_plans_evaluation')
    .select('id, classe_id, annee_scolaire')
    .eq('statut', 'valide')
    .is('supprime_at', null)
  const parClasse = new Map<string, PlanValideCourant>()
  for (const p of (data ?? []) as { id: string; classe_id: string; annee_scolaire: number }[]) {
    const cur: PlanValideCourant = { id: p.id, classeId: p.classe_id, anneeScolaire: p.annee_scolaire }
    const prev = parClasse.get(cur.classeId)
    if (!prev || cur.anneeScolaire > prev.anneeScolaire) parClasse.set(cur.classeId, cur)
  }
  return [...parClasse.values()]
}

/**
 * Q4 — recalcule le statut de conception de l'exercice lié à un quiz. Prédicat
 * `concu` ⇔ quiz_id posé ∧ 100 % des questions `statut_validation='valide'`
 * (« préparé et sans erreur », PO 5). Recalcul idempotent (COUNT), jamais de
 * compteur dénormalisé. GATE EN PREMIER → no-op strict gate OFF. No-op si aucun
 * exercice vivant n'est lié à ce quiz (chemin direct hors plan). Ne ressuscite
 * jamais un exercice `annule` (tombstone). À appeler en fin des actions qui
 * touchent le quiz ou ses questions (Q4, §6.1).
 */
export async function synchroniserStatutExerciceQuiz(admin: SupabaseClient, quizId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  const { data: exo } = await admin
    .from('scriptorium_exercices_planifies')
    .select('id, statut')
    .eq('quiz_id', quizId)
    .is('supprime_at', null)
    .maybeSingle()
  if (!exo || (exo as { statut?: string }).statut === 'annule') return
  const [{ count: total }, { count: valides }] = await Promise.all([
    admin.from('quazian_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId),
    admin.from('quazian_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId).eq('statut_validation', 'valide'),
  ])
  const concu = (total ?? 0) > 0 && (valides ?? 0) === (total ?? 0)
  const cible = concu ? 'concu' : 'a_concevoir'
  if ((exo as { statut?: string }).statut === cible) return // idempotent : évite un UPDATE inutile
  await admin
    .from('scriptorium_exercices_planifies')
    .update({ statut: cible, concu_at: concu ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq('id', (exo as { id: string }).id)
}

/**
 * Q7 — semestre d'un quiz PLANIFIÉ, résolu par sa SEMAINE (jamais par is_active) :
 * le semestre non archivé dont l'intervalle chevauche [semaineLundi, +6]. Robuste
 * au lundi antérieur au start_date (la 1ʳᵉ semaine d'un semestre commençant un
 * mardi a son lundi la veille — calculerGrilleSemaines démarre à lundiOnOrBefore).
 * En cas de chevauchement de frontière, le start_date le plus tardif gagne. null si
 * aucun semestre ne matche → l'appelant refuse la création (jamais de repli
 * silencieux sur is_active, jamais de semester_id null).
 */
export async function resoudreSemestrePourSemaine(admin: SupabaseClient, semaineLundi: string): Promise<string | null> {
  const finSemaine = toISODate(addDaysUTC(new Date(semaineLundi + 'T00:00:00Z'), 6))
  const { data } = await admin
    .from('semesters')
    .select('id, start_date')
    .is('archived_at', null)
    .lte('start_date', finSemaine)   // le semestre commence au plus tard le dimanche de la semaine
    .gte('end_date', semaineLundi)   // et se termine au plus tôt le lundi de la semaine
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  return ((data as { id?: string } | null)?.id as string | undefined) ?? null
}

/**
 * Réglage prof « quiz annoncé/surprise » (D5). false = surprise (défaut). Colonne
 * absente tolérée → false. Lu par le filtre `surface` de l'émission élève (lot 7).
 */
export async function lireQuizAnnonceDefaut(admin: SupabaseClient): Promise<boolean> {
  const { data } = await admin
    .from('scriptorium_params')
    .select('quiz_annonce_defaut')
    .eq('id', 1)
    .maybeSingle()
  return !!(data as { quiz_annonce_defaut?: boolean } | null)?.quiz_annonce_defaut
}
