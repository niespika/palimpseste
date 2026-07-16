'use server'
// Server actions du plan annuel d'évaluation (lot 2). Écrivent UNIQUEMENT dans les
// tables neuves (scriptorium_plans_evaluation / _exercices_planifies) : aucun flux
// vivant touché. L'onglet est masqué gate OFF (entrée in-page gatée), ces actions
// ne sont donc pas atteignables sans le gate. Voir SPEC §5 (P/G/V).
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { anneeScolaireDe, type SemaineEnseignement } from '@/utils/frise-enseignement'
import { genererCadence, placerDiagnostics, type Gabarit, type ExerciceGenere } from '@/utils/plan-cadence'
import { coursParJour } from '@/utils/calendrier-cours'
import { semainesCouvertes } from './plan-serveur'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GABARITS: Gabarit[] = ['tc', 'hlp', 'vierge']

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// Construit les lignes DB à insérer depuis les specs du moteur pur. Pour les
// diagnostics (lieu='classe'), résout jour_prevu = 1er jour de cours de la classe
// dans la semaine (coursParJour), repli null → la date effective retombe au lundi.
async function construireRows(
  generes: ExerciceGenere[],
  planId: string,
  classeId: string,
  couvertes: SemaineEnseignement[],
): Promise<Record<string, unknown>[]> {
  let joursCours = new Map<string, { id: string; nom: string }[]>()
  if (generes.some((g) => g.lieu === 'classe') && couvertes.length) {
    joursCours = await coursParJour({
      debut: couvertes[0].dateDebutLundi,
      fin: couvertes[couvertes.length - 1].dateFinDimanche,
    })
  }
  const premierJourCours = (lundi: string): string | null => {
    for (let i = 0; i < 7; i++) {
      const d = toISODate(addDaysUTC(new Date(lundi + 'T00:00:00Z'), i))
      if ((joursCours.get(d) ?? []).some((c) => c.id === classeId)) return d
    }
    return null
  }
  return generes.map((g) => ({
    plan_id: planId,
    type_exercice: g.type_exercice,
    diagnostique: g.diagnostique,
    nature: g.nature,
    lieu: g.lieu,
    module: g.module,
    ancrage: 'semaine',
    semaine_lundi: g.semaine_lundi,
    jour_prevu: g.lieu === 'classe' ? premierJourCours(g.semaine_lundi) : null,
    origine: g.origine,
    fenetre_diagnostique: g.fenetre_diagnostique ?? null,
    statut: 'a_concevoir',
  }))
}

/**
 * Crée un plan (P1–P3) : gabarit explicite + date_debut → AY dérivée. Génère la
 * cadence + les diagnostics dans le brouillon (inerte). Un seul plan vivant par
 * (classe, AY). Le gabarit N'EST JAMAIS présélectionné depuis filiere/type (PO 3).
 */
export async function creerPlan(formData: FormData): Promise<{ id?: string; error?: string; avis?: string }> {
  const { supabase, userId } = await verifierProf()
  const classeId = (formData.get('classe_id') as string) ?? ''
  const gabarit = (formData.get('gabarit') as string) ?? ''
  const dateDebut = (formData.get('date_debut') as string) || ''
  if (!RE_UUID.test(classeId)) return { error: 'Classe invalide.' }
  if (!GABARITS.includes(gabarit as Gabarit)) return { error: 'Choisis un gabarit (TC, HLP ou vierge).' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) return { error: 'Choisis une date de début.' }

  const ay = anneeScolaireDe(dateDebut)
  const { data: existant } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('id')
    .eq('classe_id', classeId)
    .eq('annee_scolaire', ay)
    .is('supprime_at', null)
    .maybeSingle()
  if (existant) return { error: `Cette classe a déjà un plan pour l'année ${ay}–${ay + 1}.` }

  const { data: plan, error } = await supabase
    .from('scriptorium_plans_evaluation')
    .insert({ classe_id: classeId, annee_scolaire: ay, gabarit, date_debut: dateDebut, statut: 'brouillon', created_by: userId })
    .select('id')
    .single()
  if (error || !plan) return { error: error?.message ?? 'Création impossible.' }
  const planId = plan.id as string

  // Génération (G) dans le brouillon.
  const { couvertes, frise, ancreLundi, avisBloquant } = await semainesCouvertes(dateDebut)
  if (avisBloquant) {
    return { id: planId, avis: 'Plan créé, mais la configuration des semestres est incohérente (chevauchement) — corrige-la dans le Calendrier, puis régénère.' }
  }
  if (!ancreLundi) {
    return { id: planId, avis: 'Plan créé, mais aucune semaine d’enseignement à venir pour cette date — définis les semestres dans le Calendrier, puis régénère.' }
  }
  if (gabarit !== 'vierge') {
    let generes: ExerciceGenere[]
    try {
      generes = [...genererCadence(couvertes, gabarit as Gabarit, {}), ...placerDiagnostics(frise, ay, ancreLundi)]
    } catch (e) {
      return { id: planId, avis: e instanceof Error ? e.message : 'Génération impossible.' }
    }
    const rows = await construireRows(generes, planId, classeId, couvertes)
    if (rows.length) {
      const { error: eIns } = await supabase.from('scriptorium_exercices_planifies').insert(rows)
      if (eIns) return { id: planId, avis: `Plan créé mais génération échouée : ${eIns.message}` }
    }
  }
  revalidatePath('/prof/scriptorium')
  return { id: planId }
}

/** Validation (V2) : brouillon → validé (dérivations à-faire/calendrier deviennent actives, lots 3+). */
export async function validerPlan(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  const planId = (formData.get('plan_id') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  const { error } = await supabase
    .from('scriptorium_plans_evaluation')
    .update({ statut: 'valide', valide_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('statut', 'brouillon')
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** « Marquer conçu » (V4, soupape) : pose statut='concu' sans objet lié. */
export async function marquerConcu(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  const { error } = await supabase
    .from('scriptorium_exercices_planifies')
    .update({ statut: 'concu', concu_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', exerciceId)
    .is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Retirer un exercice (V1/V3) : statut='annule' (soft — la ligne reste, bloque la
 *  régénération sur sa clé, l'annulation est respectée ; réactivable plus tard). */
export async function retirerExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const { supabase } = await verifierProf()
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  const { error } = await supabase
    .from('scriptorium_exercices_planifies')
    .update({ statut: 'annule', updated_at: new Date().toISOString() })
    .eq('id', exerciceId)
    .is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}
