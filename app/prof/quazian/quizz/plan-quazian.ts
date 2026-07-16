import 'server-only'
// Contexte « plan d'évaluation » de la page Quazian (lot 4, gate `plan_evaluation_actif`).
// Deux dérivations, toutes deux inertes gate OFF (helper renvoie une structure vide) :
//   (1) encart « À concevoir » : les exercices type='quiz' `a_concevoir` des plans
//       validés courants → deep-link ?exercice={id} vers la conception (Q1) ;
//   (2) contexte de conception : quand ?exercice={id} est fourni, la classe + le
//       libellé à figer dans CreerQuizz (Q1). Lecture via client admin (RLS prof-only).
import { createAdminClient } from '@/utils/supabase/admin'
import { lireGatePlanActif, plansValidesCourants } from '@/utils/plan-exercices'
import { dateEffectiveSemaine } from '@/utils/plan-cadence'
import { semainesCouvertes } from '@/app/prof/scriptorium/evaluations/plan-serveur'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Libellé d'une semaine couverte pour le sélecteur (Q3). Le numéro pédagogique est
// LOCAL au semestre (renumérote 1..K à chaque semestre) → il DOIT être préfixé du nom
// de semestre pour lever la collision inter-semestres d'un plan année pleine (deux
// « sem. 3 »), à l'image de la grille (« S1 · sem. 3 »). La date reste en secours.
function labelSemaine(semestreNom: string | null, pedaNum: number | null, lundi: string): string {
  const jjmm = `${lundi.slice(8, 10)}/${lundi.slice(5, 7)}`
  const noyau = pedaNum ? `sem. ${pedaNum} · ${jjmm}` : `sem. ${jjmm}`
  return semestreNom ? `${semestreNom} · ${noyau}` : noyau
}

export interface QuizAConcevoir {
  exerciceId: string
  classeId: string
  classeNom: string
  echeance: string   // date effective (§4.6)
  enRetard: boolean
}
export interface ExerciceContexte {
  exerciceId: string
  classeId: string
  classeNom: string
  libelle: string
}
export interface SemaineOption { lundi: string; label: string }
export interface ContexteQuazianPlan {
  actif: boolean                       // gate ON
  aConcevoir: QuizAConcevoir[]
  contexte: ExerciceContexte | null    // deep-link ?exercice
  // Q3 chemin direct : semaines couvertes du plan validé de chaque classe (pour le
  // sélecteur « semaine prévue »). Classe sans plan validé → absente de la map.
  semainesParClasse: Record<string, SemaineOption[]>
}

const VIDE: ContexteQuazianPlan = { actif: false, aConcevoir: [], contexte: null, semainesParClasse: {} }

/**
 * Charge le contexte plan de la page Quazian. `exerciceParam` = valeur brute de
 * ?exercice (validée uuid ici). Gate OFF/absent → structure vide (page inchangée).
 */
export async function chargerContexteQuazianPlan(exerciceParam: string | null): Promise<ContexteQuazianPlan> {
  const admin = createAdminClient()
  if (!(await lireGatePlanActif(admin))) return VIDE

  const plans = await plansValidesCourants(admin)
  if (plans.length === 0) return { ...VIDE, actif: true }

  const classeParPlan = new Map(plans.map((p) => [p.id, p.classeId]))
  const { data: classesRows } = await admin
    .from('classes').select('id, nom').in('id', plans.map((p) => p.classeId))
  const nomParClasse = new Map((classesRows ?? []).map((c) => [c.id as string, c.nom as string]))
  const today = new Date().toISOString().slice(0, 10) // date pure (retard = échéance passée)

  // (1) Encart « À concevoir » : quiz a_concevoir vivants des plans courants.
  const { data: exos } = await admin
    .from('scriptorium_exercices_planifies')
    .select('id, plan_id, lieu, semaine_lundi, jour_prevu')
    .in('plan_id', plans.map((p) => p.id))
    .eq('type_exercice', 'quiz')
    .eq('statut', 'a_concevoir')
    .eq('ancrage', 'semaine')
    .is('supprime_at', null)
  const aConcevoir: QuizAConcevoir[] = (exos ?? []).map((e) => {
    const classeId = classeParPlan.get(e.plan_id as string) as string
    const echeance = dateEffectiveSemaine(e.semaine_lundi as string, (e.jour_prevu as string | null) ?? null, e.lieu as 'classe' | 'maison')
    return {
      exerciceId: e.id as string,
      classeId,
      classeNom: nomParClasse.get(classeId) ?? '',
      echeance,
      enRetard: echeance < today,
    }
  }).sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || a.echeance.localeCompare(b.echeance))

  // (2) Contexte de conception depuis un deep-link ?exercice.
  let contexte: ExerciceContexte | null = null
  if (exerciceParam && RE_UUID.test(exerciceParam)) {
    const { data: exo } = await admin
      .from('scriptorium_exercices_planifies')
      .select('id, type_exercice, statut, plan_id, quiz_id')
      .eq('id', exerciceParam)
      .is('supprime_at', null)
      .maybeSingle()
    // Ne propose la conception que pour un quiz vivant encore non lié d'un plan courant.
    if (exo && exo.type_exercice === 'quiz' && exo.statut !== 'annule' && !exo.quiz_id) {
      const classeId = classeParPlan.get(exo.plan_id as string)
      if (classeId) {
        contexte = { exerciceId: exo.id as string, classeId, classeNom: nomParClasse.get(classeId) ?? '', libelle: 'Quiz planifié' }
      }
    }
  }

  // (3) Q3 — semaines couvertes du plan validé de chaque classe (sélecteur direct).
  const { data: plansD } = await admin
    .from('scriptorium_plans_evaluation')
    .select('classe_id, date_debut')
    .in('id', plans.map((p) => p.id))
  const semainesParClasse: Record<string, SemaineOption[]> = {}
  for (const p of plansD ?? []) {
    const couv = await semainesCouvertes(p.date_debut as string)
    semainesParClasse[p.classe_id as string] = couv.couvertes.map((w) => ({
      lundi: w.dateDebutLundi,
      label: labelSemaine(w.semestreNom, w.pedagogicalNumber, w.dateDebutLundi),
    }))
  }

  return { actif: true, aConcevoir, contexte, semainesParClasse }
}
