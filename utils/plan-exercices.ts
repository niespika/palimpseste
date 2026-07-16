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
