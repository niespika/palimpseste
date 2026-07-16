// Couche I/O du plan annuel d'évaluation (client admin — RLS prof-only sur les
// tables du plan). Le moteur PUR vit dans utils/plan-cadence.ts. En Lot 1, seule
// la lecture tolérante du gate est fournie ; la résolution des dates (semaine +
// synthèse), l'émission calendrier et la synchronisation quiz arrivent avec leurs
// lots consommateurs (3/4/5). Voir SPEC_scriptorium_planification_exercices.md §4.6/§9.

import type { SupabaseClient } from '@supabase/supabase-js'

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
