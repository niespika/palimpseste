import 'server-only'
// Entrée « Synthèses à préparer » de /prof/codex (plan d'évaluation, lot 5). Liste les
// synthèses `a_concevoir` (type='synthese') des plans validés COURANTS, avec leur date
// résolue (S1-S2) — recalculée à chaque lecture (déplacer un créneau déplace la date).
// Gate OFF/absent → liste vide (page Codex inchangée). Lecture via client admin.
import { createAdminClient } from '@/utils/supabase/admin'
import { lireGatePlanActif, plansValidesCourants } from '@/utils/plan-exercices'
import { resoudreDatesSyntheses, type DemandeSynthese } from '@/utils/plan-synthese'
import { clesSynthesesOuvertes } from '@/utils/plan-synthese-ouverture'

export interface SyntheseAPreparer {
  exerciceId: string
  contenuTitre: string
  classeNom: string
  echeance: string | null // date résolue (null si non résoluble : assignation non datée…)
}

export async function chargerSynthesesAPreparer(): Promise<SyntheseAPreparer[]> {
  const admin = createAdminClient()
  if (!(await lireGatePlanActif(admin))) return []
  const plans = await plansValidesCourants(admin)
  if (plans.length === 0) return []
  const classeParPlan = new Map(plans.map((p) => [p.id, p.classeId]))

  const { data: exos } = await admin
    .from('scriptorium_exercices_planifies')
    .select('id, plan_id, parcours_id, contenu_id')
    .in('plan_id', plans.map((p) => p.id))
    .eq('type_exercice', 'synthese')
    .eq('statut', 'a_concevoir')
    .is('supprime_at', null)
  const toutes = exos ?? []
  if (toutes.length === 0) return []

  // SOURDINE (01/09) — une synthèse dont le cours a été COUPÉ dans l'instance de sa
  // classe ne se propose plus à la préparation. Elle n'est pas détruite : rouvrir le
  // cours la fait revenir ici telle quelle. Le filtre passe AVANT la résolution des
  // dates : ce qui se tait ne coûte pas une requête.
  const ouvertes = await clesSynthesesOuvertes(admin, toutes.map((e) => ({
    cle: e.id as string,
    parcoursId: e.parcours_id as string,
    contenuId: e.contenu_id as string,
    classeId: classeParPlan.get(e.plan_id as string) as string,
  })))
  const rows = toutes.filter((e) => ouvertes.has(e.id as string))
  if (rows.length === 0) return []

  const classeIds = [...new Set(rows.map((e) => classeParPlan.get(e.plan_id as string)).filter(Boolean))] as string[]
  const contenuIds = [...new Set(rows.map((e) => e.contenu_id as string).filter(Boolean))]
  const [{ data: classes }, { data: contenus }] = await Promise.all([
    admin.from('classes').select('id, nom').in('id', classeIds),
    admin.from('scriptorium_contenus').select('id, titre').in('id', contenuIds),
  ])
  const nomClasse = new Map((classes ?? []).map((c) => [c.id as string, c.nom as string]))
  const titreContenu = new Map((contenus ?? []).map((c) => [c.id as string, c.titre as string]))

  // Dates résolues EN LOT (coût constant) : une résolution par synthèse multiplierait
  // ~10 requêtes sérielles par ligne, sur une page sans maxDuration.
  const demandes: DemandeSynthese[] = rows.map((e) => ({
    cle: e.id as string,
    parcoursId: e.parcours_id as string,
    contenuId: e.contenu_id as string,
    classeId: classeParPlan.get(e.plan_id as string) as string,
  }))
  const dates = await resoudreDatesSyntheses(admin, demandes)

  const out: SyntheseAPreparer[] = rows.map((e) => {
    const classeId = classeParPlan.get(e.plan_id as string) as string
    return {
      exerciceId: e.id as string,
      contenuTitre: titreContenu.get(e.contenu_id as string) ?? 'Cours',
      classeNom: nomClasse.get(classeId) ?? '',
      echeance: dates.get(e.id as string) ?? null,
    }
  })
  // Datées d'abord (échéance croissante), non datées en fin.
  out.sort((a, b) => (a.echeance ?? '9999-99-99').localeCompare(b.echeance ?? '9999-99-99'))
  return out
}
