import 'server-only'
// Loaders SERVEUR du plan annuel d'évaluation (client prof — RLS prof-only). Le
// détail d'un plan EST la base de la panoptique (§7) : semaines couvertes de la
// frise + exercices groupés. Voir SPEC_scriptorium_planification_exercices.md §5/§7.
import { createClient } from '@/utils/supabase/server'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { anneeScolaireDe, resoudreAncre, type SemaineEnseignement } from '@/utils/frise-enseignement'
import { construireFrise } from '../parcours/frise-serveur'
import { dateEffectiveSemaine, type Gabarit } from '@/utils/plan-cadence'

export interface PlanMeta {
  id: string
  gabarit: Gabarit
  statut: 'brouillon' | 'valide'
  anneeScolaire: number
}
export interface ClasseAvecPlan {
  classeId: string
  nom: string
  typePedagogique: 'tc' | 'hlp' | 'autre' | null
  plan: PlanMeta | null
}
export interface ExerciceLigne {
  id: string
  typeExercice: string
  diagnostique: boolean
  nature: 'formatif' | 'evaluatif'
  lieu: 'classe' | 'maison'
  module: string
  origine: string
  statut: 'a_concevoir' | 'concu' | 'annule'
  fenetre: string | null
  semaineLundi: string
  jourPrevu: string | null
  echeance: string   // date effective (§4.6)
  enRetard: boolean  // dérivé : a_concevoir ∧ échéance passée
}
export interface SemainePlan {
  lundi: string
  semestreNom: string | null
  pedaNum: number | null
  exercices: ExerciceLigne[]
}
export interface PlanDetail {
  id: string
  classeId: string
  classeNom: string
  typePedagogique: 'tc' | 'hlp' | 'autre' | null
  gabarit: Gabarit
  statut: 'brouillon' | 'valide'
  dateDebut: string
  anneeScolaire: number
  avis?: string
  avisBloquant: boolean
  semaines: SemainePlan[]
  aRecaler: ExerciceLigne[] // exercices dont la semaine ne matche plus la frise (J2)
}

// Date « aujourd'hui » dans le fuseau configuré (date pure).
async function aujourdhui(): Promise<string> {
  const tz = await lireFuseau()
  return jourDansFuseau(new Date().toISOString(), tz)
}

/**
 * Défaut de date_debut (P1) : start_date du 1er semestre non archivé À VENIR
 * (toutes AY confondues) — jamais anneeScolaireDe(today) brut (piège d'été, #19).
 * null → aucun semestre à venir défini (bandeau « définis les semestres »).
 */
export async function defautDateDebut(): Promise<string | null> {
  const supabase = await createClient()
  const today = await aujourdhui()
  const { data } = await supabase
    .from('semesters')
    .select('start_date')
    .is('archived_at', null)
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data?.start_date as string | null) ?? null
}

export interface Couverture {
  couvertes: SemaineEnseignement[]
  frise: SemaineEnseignement[]
  ay: number
  ancreLundi: string | null
  avis?: string
  avisBloquant: boolean
}
/**
 * Semaines d'enseignement COUVERTES par un plan (G1) : de l'ancre (snap de
 * date_debut) à la dernière semaine du dernier semestre défini de l'AY.
 */
export async function semainesCouvertes(dateDebut: string): Promise<Couverture> {
  const friseResult = await construireFrise(dateDebut)
  const { ancreIdx, avis } = resoudreAncre(friseResult, dateDebut)
  const ay = anneeScolaireDe(dateDebut)
  const avisBloquant = !!friseResult.avisBloquant
  if (avisBloquant || ancreIdx == null) {
    return { couvertes: [], frise: friseResult.frise, ay, ancreLundi: null, avis, avisBloquant }
  }
  const couvertes = friseResult.frise.filter((w) => w.indexContinu >= ancreIdx)
  return { couvertes, frise: friseResult.frise, ay, ancreLundi: couvertes[0]?.dateDebutLundi ?? null, avis, avisBloquant }
}

/** Une entrée par classe active + son plan le plus récent (au plus un par AY). */
export async function chargerClassesAvecPlan(): Promise<ClasseAvecPlan[]> {
  const supabase = await createClient()
  const [{ data: classes }, { data: plans }] = await Promise.all([
    supabase.from('classes').select('id, nom, type_pedagogique').eq('statut', 'active').order('nom'),
    supabase.from('scriptorium_plans_evaluation').select('id, classe_id, gabarit, statut, annee_scolaire').is('supprime_at', null),
  ])
  const parClasse = new Map<string, PlanMeta>()
  for (const p of plans ?? []) {
    const cid = p.classe_id as string
    const meta: PlanMeta = {
      id: p.id as string,
      gabarit: p.gabarit as Gabarit,
      statut: p.statut as 'brouillon' | 'valide',
      anneeScolaire: p.annee_scolaire as number,
    }
    const prev = parClasse.get(cid)
    if (!prev || meta.anneeScolaire > prev.anneeScolaire) parClasse.set(cid, meta)
  }
  return (classes ?? []).map((c) => ({
    classeId: c.id as string,
    nom: c.nom as string,
    typePedagogique: (c.type_pedagogique as ClasseAvecPlan['typePedagogique']) ?? null,
    plan: parClasse.get(c.id as string) ?? null,
  }))
}

/**
 * Détail du plan d'une classe (le plus récent vivant) : semaines couvertes +
 * exercices groupés par semaine + « à recaler » (semaine hors frise, J2). Le
 * régime temporel est FIGÉ : la frise est recalculée pour l'affichage, mais les
 * semaine_lundi stockés ne bougent pas — un décalage se voit ici, se corrige à part.
 * null si la classe n'a pas de plan.
 */
export async function chargerPlanDeClasse(classeId: string): Promise<PlanDetail | null> {
  const supabase = await createClient()
  const [{ data: cls }, { data: plan }] = await Promise.all([
    supabase.from('classes').select('nom, type_pedagogique').eq('id', classeId).maybeSingle(),
    supabase
      .from('scriptorium_plans_evaluation')
      .select('id, gabarit, statut, date_debut, annee_scolaire')
      .eq('classe_id', classeId)
      .is('supprime_at', null)
      .order('annee_scolaire', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])
  if (!plan) return null

  const dateDebut = plan.date_debut as string
  const [couverture, { data: exos }, today] = await Promise.all([
    semainesCouvertes(dateDebut),
    supabase
      .from('scriptorium_exercices_planifies')
      .select('id, type_exercice, diagnostique, nature, lieu, module, origine, statut, fenetre_diagnostique, semaine_lundi, jour_prevu')
      .eq('plan_id', plan.id as string)
      .eq('ancrage', 'semaine')
      .is('supprime_at', null),
    aujourdhui(),
  ])

  const toLigne = (e: Record<string, unknown>): ExerciceLigne => {
    const semaineLundi = e.semaine_lundi as string
    const jourPrevu = (e.jour_prevu as string | null) ?? null
    const lieu = e.lieu as 'classe' | 'maison'
    const statut = e.statut as 'a_concevoir' | 'concu' | 'annule'
    const echeance = dateEffectiveSemaine(semaineLundi, jourPrevu, lieu)
    return {
      id: e.id as string,
      typeExercice: e.type_exercice as string,
      diagnostique: e.diagnostique as boolean,
      nature: e.nature as 'formatif' | 'evaluatif',
      lieu,
      module: e.module as string,
      origine: e.origine as string,
      statut,
      fenetre: (e.fenetre_diagnostique as string | null) ?? null,
      semaineLundi,
      jourPrevu,
      echeance,
      enRetard: statut === 'a_concevoir' && echeance < today,
    }
  }

  const lignes = (exos ?? []).map(toLigne)
  const lundisCouverts = new Set(couverture.couvertes.map((w) => w.dateDebutLundi))
  const parLundi = new Map<string, ExerciceLigne[]>()
  const aRecaler: ExerciceLigne[] = []
  for (const l of lignes) {
    if (l.statut === 'annule') continue // les annulés ne figurent pas dans la grille
    if (!lundisCouverts.has(l.semaineLundi)) { aRecaler.push(l); continue }
    const arr = parLundi.get(l.semaineLundi) ?? []
    arr.push(l)
    parLundi.set(l.semaineLundi, arr)
  }

  const semaines: SemainePlan[] = couverture.couvertes.map((w) => ({
    lundi: w.dateDebutLundi,
    semestreNom: w.semestreNom,
    pedaNum: w.pedagogicalNumber,
    exercices: (parLundi.get(w.dateDebutLundi) ?? []).sort(
      (a, b) => a.echeance.localeCompare(b.echeance) || a.typeExercice.localeCompare(b.typeExercice),
    ),
  }))

  return {
    id: plan.id as string,
    classeId,
    classeNom: (cls?.nom as string) ?? 'Classe',
    typePedagogique: (cls?.type_pedagogique as PlanDetail['typePedagogique']) ?? null,
    gabarit: plan.gabarit as Gabarit,
    statut: plan.statut as 'brouillon' | 'valide',
    dateDebut,
    anneeScolaire: plan.annee_scolaire as number,
    avis: couverture.avis,
    avisBloquant: couverture.avisBloquant,
    semaines,
    aRecaler,
  }
}

/**
 * Candidats à la propagation (P5) d'un plan : classes ACTIVES de MÊME
 * type_pedagogique que la classe du plan, MÊME AY, SANS plan vivant. Vide si la
 * classe du plan n'a pas de type_pedagogique (pas de dérivation depuis filiere).
 */
export async function candidatsPropagation(planId: string): Promise<{ classeId: string; nom: string }[]> {
  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('classe_id, annee_scolaire')
    .eq('id', planId)
    .is('supprime_at', null)
    .maybeSingle()
  if (!plan) return []
  const { data: cls } = await supabase
    .from('classes').select('type_pedagogique').eq('id', plan.classe_id as string).maybeSingle()
  const type = (cls?.type_pedagogique as string | null) ?? null
  if (!type) return []

  const { data: classes } = await supabase
    .from('classes')
    .select('id, nom')
    .eq('statut', 'active')
    .eq('type_pedagogique', type)
    .neq('id', plan.classe_id as string)
    .order('nom')
  const liste = (classes ?? []) as { id: string; nom: string }[]
  if (liste.length === 0) return []

  const { data: plans } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('classe_id')
    .eq('annee_scolaire', plan.annee_scolaire as number)
    .is('supprime_at', null)
    .in('classe_id', liste.map((c) => c.id))
  const avecPlan = new Set((plans ?? []).map((p) => p.classe_id as string))
  return liste.filter((c) => !avecPlan.has(c.id)).map((c) => ({ classeId: c.id, nom: c.nom }))
}
