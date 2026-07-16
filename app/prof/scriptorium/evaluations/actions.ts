'use server'
// Server actions du plan annuel d'évaluation (lot 2). Écrivent UNIQUEMENT dans les
// tables neuves (scriptorium_plans_evaluation / _exercices_planifies) : aucun flux
// vivant touché. GATÉES : chaque action refuse si plan_evaluation_actif est false
// (défense en profondeur — l'onglet est déjà masqué gate OFF). Voir SPEC §5 (P/G/V).
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { anneeScolaireDe, type SemaineEnseignement } from '@/utils/frise-enseignement'
import { genererCadence, placerDiagnostics, type Gabarit, type ExerciceGenere } from '@/utils/plan-cadence'
import { coursParJour } from '@/utils/calendrier-cours'
import { lireGatePlanActif } from '@/utils/plan-exercices'
import { semainesCouvertes } from './plan-serveur'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GABARITS: Gabarit[] = ['tc', 'hlp', 'vierge']

// Prof + gate ON. Retourne { supabase, userId } ou { error } (le gate OFF ne doit
// jamais écrire — l'invariant « inerte » vaut aussi côté écriture).
async function verifierProfGate(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') return { error: 'Accès refusé.' }
  if (!(await lireGatePlanActif(supabase))) return { error: 'Le plan d’évaluation est désactivé.' }
  return { supabase, userId: user.id }
}

// Construit les lignes DB depuis les specs du moteur pur. Pour les diagnostics
// (lieu='classe'), résout jour_prevu = 1er jour de cours de la classe dans la
// semaine (coursParJour) ; repli null → la date effective retombe au lundi.
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
 * Crée un plan (P1–P3) : gabarit explicite + date_debut → AY dérivée. La frise est
 * résolue AVANT l'INSERT : un plan sans aucune semaine couverte (semestres
 * incohérents / aucune semaine à venir) est REFUSÉ — sinon il resterait un brouillon
 * vide indélogeable (pas de suppression/régénération en 2a). Génère la cadence + les
 * diagnostics dans le brouillon ; rollback si la génération échoue (pas d'orphelin).
 */
export async function creerPlan(formData: FormData): Promise<{ id?: string; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase, userId } = gardé
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

  // Frise AVANT l'INSERT — refus explicite si rien à planifier (pas de brouillon vide).
  const { couvertes, frise, ancreLundi, avisBloquant } = await semainesCouvertes(dateDebut)
  if (avisBloquant) return { error: 'Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier avant de créer le plan.' }
  if (!ancreLundi) return { error: 'Aucune semaine d’enseignement à venir pour cette date — définis d’abord les semestres dans le Calendrier.' }

  const { data: plan, error } = await supabase
    .from('scriptorium_plans_evaluation')
    .insert({ classe_id: classeId, annee_scolaire: ay, gabarit, date_debut: dateDebut, statut: 'brouillon', created_by: userId })
    .select('id')
    .single()
  if (error || !plan) {
    // Course TOCTOU sur l'unicité (l'index est l'autorité) → message métier.
    if (error?.code === '23505') return { error: `Cette classe a déjà un plan pour l'année ${ay}–${ay + 1}.` }
    return { error: error?.message ?? 'Création impossible.' }
  }
  const planId = plan.id as string

  // Génération (G) dans le brouillon. Toute défaillance → rollback (plan supprimé),
  // erreur remontée au prof, plutôt qu'un brouillon vide/partiel + avis perdu au refresh.
  if (gabarit !== 'vierge') {
    let generes: ExerciceGenere[]
    try {
      generes = [...genererCadence(couvertes, gabarit as Gabarit, {}), ...placerDiagnostics(frise, ay, ancreLundi)]
    } catch (e) {
      await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId)
      return { error: e instanceof Error ? e.message : 'Génération impossible.' }
    }
    const rows = await construireRows(generes, planId, classeId, couvertes)
    if (rows.length) {
      const { error: eIns } = await supabase.from('scriptorium_exercices_planifies').insert(rows)
      if (eIns) {
        await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId)
        return { error: `Génération impossible (${eIns.message}). Réessaie.` }
      }
    }
  }
  revalidatePath('/prof/scriptorium')
  return { id: planId }
}

/** Validation (V2) : brouillon → validé (les dérivations deviennent actives, lots 3+). */
export async function validerPlan(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const planId = (formData.get('plan_id') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  const { error } = await gardé.supabase
    .from('scriptorium_plans_evaluation')
    .update({ statut: 'valide', valide_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('statut', 'brouillon')
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** « Marquer conçu » (V4, soupape) : a_concevoir → concu, sans objet lié. */
export async function marquerConcu(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  const { error } = await gardé.supabase
    .from('scriptorium_exercices_planifies')
    .update({ statut: 'concu', concu_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', exerciceId)
    .eq('statut', 'a_concevoir') // garde de transition : seul a_concevoir → concu
    .is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * Retirer un exercice (V1/V3). Régime SELON le statut du plan :
 *  - brouillon + origine ∈ (cadence, diagnostic, manuel) → DELETE DUR (rien n'en
 *    dépend, libère la clé d'idempotence) ;
 *  - plan validé, ou origine 'synthese_auto' (anti-résurrection S3) → statut='annule'
 *    (soft : la ligne reste, bloque la régénération sur sa clé, réactivable plus tard).
 */
export async function retirerExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }

  const { data: exo } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('origine, plan_id, statut')
    .eq('id', exerciceId)
    .is('supprime_at', null)
    .maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  if (exo.statut === 'annule') return { success: true } // idempotent
  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('statut')
    .eq('id', exo.plan_id as string)
    .maybeSingle()

  const brouillon = plan?.statut === 'brouillon'
  const origine = exo.origine as string
  const deleteDur = brouillon && (origine === 'cadence' || origine === 'diagnostic' || origine === 'manuel')

  const { error } = deleteDur
    ? await supabase.from('scriptorium_exercices_planifies').delete().eq('id', exerciceId).is('supprime_at', null)
    : await supabase
        .from('scriptorium_exercices_planifies')
        .update({ statut: 'annule', updated_at: new Date().toISOString() })
        .eq('id', exerciceId)
        .is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}
