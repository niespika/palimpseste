'use server'
// Server actions du plan annuel d'évaluation (lot 2). Écrivent UNIQUEMENT dans les
// tables neuves (scriptorium_plans_evaluation / _exercices_planifies) : aucun flux
// vivant touché. GATÉES : chaque action refuse si plan_evaluation_actif est false
// (défense en profondeur — l'onglet est déjà masqué gate OFF). Voir SPEC §5 (P/G/V).
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { hookSyntheseBackfillPlan } from '@/utils/plan-synthese-hooks'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { anneeScolaireDe, type SemaineEnseignement } from '@/utils/frise-enseignement'
import { genererCadence, placerDiagnostics, asPlanConfig, type Gabarit, type ExerciceGenere, type PlanConfig } from '@/utils/plan-cadence'
import { coursParJour } from '@/utils/calendrier-cours'
import { lireGatePlanActif } from '@/utils/plan-exercices'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
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
  // Back-fill des synthèses : un parcours monté AVANT le plan n'a pas déclenché les hooks
  // S3 (qui ne se posent qu'à l'ajout de créneau / assignation). Dès que le plan existe
  // (brouillon inclus, comme S3), on crée les synthèses des cours déjà en place. Idempotent,
  // gate-first (no-op gate OFF), best-effort : un échec ne doit pas défaire le plan créé.
  try { await hookSyntheseBackfillPlan(createAdminClient(), planId, classeId) } catch { /* non bloquant */ }
  revalidatePath('/prof/scriptorium')
  return { id: planId }
}

/** Validation (V2) : brouillon → validé (les dérivations deviennent actives, lots 3+). */
export async function validerPlan(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const planId = (formData.get('plan_id') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  const { data: updated, error } = await gardé.supabase
    .from('scriptorium_plans_evaluation')
    .update({ statut: 'valide', valide_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('statut', 'brouillon')
    .select('classe_id')
    .maybeSingle()
  if (error) return { error: error.message }
  // Filet : back-fill aussi à la validation (un parcours assigné pendant que le plan était
  // brouillon est déjà couvert par hookSyntheseAssignClasse ; ceci rattrape les cas de bord
  // et reste idempotent). `updated` null = plan déjà non-brouillon → rien à faire.
  if (updated?.classe_id) {
    try { await hookSyntheseBackfillPlan(createAdminClient(), planId, updated.classe_id as string) } catch { /* non bloquant */ }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * Supprimer un plan (brouillon OU validé). DELETE dur : cascade sur les exercices
 * (FK on delete cascade) ; libère le créneau (classe, AY) pour recréer. Les objets
 * de module éventuellement liés (quiz/session, lots 4/5) NE sont PAS supprimés — la
 * FK est `set null`, ils survivent, seul le lien tombe. L'UI confirme plus fortement
 * pour un plan validé (les exercices conçus/planifiés disparaissent).
 */
export async function supprimerPlan(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const planId = (formData.get('plan_id') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation').select('id').eq('id', planId).is('supprime_at', null).maybeSingle()
  if (!plan) return { error: 'Plan introuvable.' }
  const { error } = await supabase
    .from('scriptorium_plans_evaluation').delete().eq('id', planId)
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

// ── Lot 2b : édition, propagation, régénération, recalage, réglage ──────────────

function estLundi(iso: string): boolean {
  return (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7 === 0
}

// Types manuellement ajoutables (ancrage 'semaine') → combinaison canonique du CHECK.
const TYPE_MANUEL: Record<string, { nature: 'formatif' | 'evaluatif'; lieu: 'classe' | 'maison'; module: string }> = {
  ecriture: { nature: 'formatif', lieu: 'maison', module: 'codex' },
  lecture: { nature: 'formatif', lieu: 'maison', module: 'aletheia' },
  quiz: { nature: 'evaluatif', lieu: 'classe', module: 'quazian' },
  examen_livre: { nature: 'evaluatif', lieu: 'classe', module: 'aletheia' },
}

// Premier jour de cours d'une classe dans UNE semaine (lundi→dimanche), sinon null.
async function jourDeCours(classeId: string, lundi: string): Promise<string | null> {
  const jours = await coursParJour({ debut: lundi, fin: toISODate(addDaysUTC(new Date(lundi + 'T00:00:00Z'), 6)) })
  for (let i = 0; i < 7; i++) {
    const d = toISODate(addDaysUTC(new Date(lundi + 'T00:00:00Z'), i))
    if ((jours.get(d) ?? []).some((c) => c.id === classeId)) return d
  }
  return null
}

// Construit les lignes générées (cadence + diagnostics) d'un plan à partir de
// `aPartirDe` (défaut : ancre). Réutilisé par la propagation (plan frais) et la
// régénération. Frise résolue en interne. `config` honoré (cycle, P5/§7.3).
// `vierge`/frise vide → aucune ligne.
async function rowsPourPlan(
  planId: string,
  classeId: string,
  dateDebut: string,
  gabarit: Gabarit,
  aPartirDe?: string,
  config: PlanConfig = {},
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  if (gabarit === 'vierge') return { rows: [] }
  const { couvertes, frise, ay, ancreLundi, avisBloquant } = await semainesCouvertes(dateDebut)
  if (avisBloquant || !ancreLundi) return { rows: [] }
  const depuis = aPartirDe ?? ancreLundi
  const couvDepuis = couvertes.filter((w) => w.dateDebutLundi >= depuis)
  // Diagnostics planchérés à l'ancre : `placerDiagnostics` filtre la frise entière
  // et retiendrait des semaines < ancre quand aujourd'hui < ancre (régénération
  // avant le début réel du semestre), créant des diagnostics « à recaler » fantômes.
  // La cadence, elle, part déjà de l'ancre (couvDepuis ⊆ couvertes). max() rétablit
  // la parité avec creerPlan ; no-op à la création (depuis=ancre) et en cours d'année.
  const depuisDiag = depuis > ancreLundi ? depuis : ancreLundi
  let generes: ExerciceGenere[]
  try {
    generes = [...genererCadence(couvDepuis, gabarit, config), ...placerDiagnostics(frise, ay, depuisDiag)]
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : 'Génération impossible.' }
  }
  return { rows: await construireRows(generes, planId, classeId, couvDepuis) }
}

/**
 * Propagation (P5) : applique le gabarit + date_debut du plan source à d'autres
 * classes ACTIVES de MÊME type_pedagogique et MÊME AY, SANS plan vivant. Crée pour
 * chaque cible un plan INDÉPENDANT (le calendrier est global → mêmes semaines ; les
 * jour_prevu des diagnostics divergent par classe via coursParJour). Aucune ligne
 * partagée, aucune classe verrouillée. Idempotent (l'unicité classe×AY ignore un
 * doublon acquis entre-temps). Copie EN BROUILLON (chaque cible se valide à part).
 */
export async function propagerPlan(planSourceId: string, classesCiblesIds: string[]): Promise<{ crees?: number; ignores?: number; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase, userId } = gardé
  if (!RE_UUID.test(planSourceId)) return { error: 'Plan invalide.' }
  const cibles = (classesCiblesIds ?? []).filter((c) => RE_UUID.test(c))
  if (cibles.length === 0) return { crees: 0, ignores: 0 }

  const { data: source } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('gabarit, date_debut, annee_scolaire, config, classe_id')
    .eq('id', planSourceId)
    .is('supprime_at', null)
    .maybeSingle()
  if (!source) return { error: 'Plan source introuvable.' }
  const gabarit = source.gabarit as Gabarit
  const dateDebut = source.date_debut as string
  const ay = source.annee_scolaire as number
  const config = asPlanConfig(source.config)
  // Type pédagogique de la classe source (invariant P5 : mêmes-type uniquement).
  const { data: clsSource } = await supabase
    .from('classes').select('type_pedagogique').eq('id', source.classe_id as string).maybeSingle()
  const typeSource = (clsSource?.type_pedagogique as string | null) ?? null

  let crees = 0
  let ignores = 0
  for (const classeId of cibles) {
    if (classeId === source.classe_id) { ignores++; continue }
    // Re-valide la cible côté serveur (le client peut être obsolète/forgé) :
    // ACTIVE + MÊME type_pedagogique que la source (P5).
    const { data: cible } = await supabase
      .from('classes').select('statut, type_pedagogique').eq('id', classeId).maybeSingle()
    if (!cible || cible.statut !== 'active' || !typeSource || cible.type_pedagogique !== typeSource) { ignores++; continue }
    // Ignore une cible ayant déjà un plan vivant pour cette AY (idempotent).
    const { data: dejaPlan } = await supabase
      .from('scriptorium_plans_evaluation')
      .select('id').eq('classe_id', classeId).eq('annee_scolaire', ay).is('supprime_at', null).maybeSingle()
    if (dejaPlan) { ignores++; continue }

    const { data: plan, error } = await supabase
      .from('scriptorium_plans_evaluation')
      .insert({ classe_id: classeId, annee_scolaire: ay, gabarit, date_debut: dateDebut, config: source.config ?? {}, statut: 'brouillon', created_by: userId })
      .select('id').single()
    if (error || !plan) { ignores++; continue } // course/erreur → on n'interrompt pas la propagation
    const planId = plan.id as string
    const { rows, error: eGen } = await rowsPourPlan(planId, classeId, dateDebut, gabarit, undefined, config)
    if (eGen) { await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId); ignores++; continue }
    if (rows.length) {
      const { error: eIns } = await supabase.from('scriptorium_exercices_planifies').insert(rows)
      if (eIns) { await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId); ignores++; continue }
    }
    crees++
  }
  revalidatePath('/prof/scriptorium')
  return { crees, ignores }
}

/** Déplacer un exercice (V3) : change de semaine. Une ligne 'cadence' bascule
 *  'manuel' (libère la clé uk_exercices_cadence). jour_prevu remis à null (repli
 *  lundi ; le prof recalera le jour si besoin). Interdit sur un exercice annulé. */
export async function deplacerExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  const semaineLundi = (formData.get('semaine_lundi') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaineLundi) || !estLundi(semaineLundi)) return { error: 'La semaine cible doit être un lundi.' }

  const { data: exo } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('origine, statut, lieu, plan_id').eq('id', exerciceId).is('supprime_at', null).maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  if (exo.statut === 'annule') return { error: 'Exercice annulé — réactive-le avant de le déplacer.' }
  const origine = exo.origine === 'cadence' ? 'manuel' : (exo.origine as string)

  // jour_prevu recalculé sur la semaine CIBLE pour un exercice en classe (repli lundi).
  let jourPrevu: string | null = null
  if (exo.lieu === 'classe') {
    const { data: plan } = await supabase
      .from('scriptorium_plans_evaluation').select('classe_id').eq('id', exo.plan_id as string).maybeSingle()
    if (plan) jourPrevu = await jourDeCours(plan.classe_id as string, semaineLundi)
  }

  const { error } = await supabase
    .from('scriptorium_exercices_planifies')
    .update({ semaine_lundi: semaineLundi, jour_prevu: jourPrevu, origine, updated_at: new Date().toISOString() })
    .eq('id', exerciceId).is('supprime_at', null)
  if (error) {
    if (error.code === '23505') return { error: 'Un exercice de cadence du même type occupe déjà cette semaine.' }
    return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Ajouter un exercice manuel (V1/V3) à une semaine. Types semaine-ancrés
 *  (ecriture/lecture/quiz/examen_livre) → combinaison canonique du CHECK. */
export async function ajouterExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const planId = (formData.get('plan_id') as string) ?? ''
  const semaineLundi = (formData.get('semaine_lundi') as string) ?? ''
  const type = (formData.get('type_exercice') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaineLundi) || !estLundi(semaineLundi)) return { error: 'Semaine invalide.' }
  const spec = TYPE_MANUEL[type]
  if (!spec) return { error: 'Type d’exercice non ajoutable à la main.' }

  // Exercice en classe : jour_prevu = 1er jour de cours de la classe cette semaine.
  let jourPrevu: string | null = null
  if (spec.lieu === 'classe') {
    const { data: plan } = await supabase
      .from('scriptorium_plans_evaluation').select('classe_id').eq('id', planId).is('supprime_at', null).maybeSingle()
    if (plan) jourPrevu = await jourDeCours(plan.classe_id as string, semaineLundi)
  }

  const { error } = await supabase.from('scriptorium_exercices_planifies').insert({
    plan_id: planId,
    type_exercice: type,
    diagnostique: false,
    nature: spec.nature,
    lieu: spec.lieu,
    module: spec.module,
    ancrage: 'semaine',
    semaine_lundi: semaineLundi,
    jour_prevu: jourPrevu,
    origine: 'manuel',
    statut: 'a_concevoir',
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * Régénération (R1) : « changer de gabarit ». Périmètre = cadence/diagnostic
 * a_concevoir à partir d'aujourd'hui — les conçus, manuels, annulés et le passé ne
 * bougent JAMAIS. Diff OBLIGATOIRE (confirmer=false → aperçu). À l'application :
 * soft-delete du périmètre + génération de la queue, en RESPECTANT les créneaux
 * occupés par un conçu/annulé vivant (idempotence G6).
 */
export async function regenererPlan(
  planId: string,
  nouveauGabarit: string,
  confirmer: boolean,
): Promise<{ needsConfirm?: boolean; nbSupprimes?: number; nbGeneres?: number; success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  if (!GABARITS.includes(nouveauGabarit as Gabarit)) return { error: 'Gabarit invalide.' }

  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('date_debut, classe_id, config').eq('id', planId).is('supprime_at', null).maybeSingle()
  if (!plan) return { error: 'Plan introuvable.' }
  const dateDebut = plan.date_debut as string
  const classeId = plan.classe_id as string
  const config = asPlanConfig(plan.config)
  const aPartirDe = await joursAujourdhui()

  // Périmètre à retirer : cadence/diagnostic a_concevoir à partir d'aujourd'hui.
  const { data: perim } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('id')
    .eq('plan_id', planId)
    .in('origine', ['cadence', 'diagnostic'])
    .eq('statut', 'a_concevoir')
    .is('supprime_at', null)
    .gte('semaine_lundi', aPartirDe)
  const idsPerim = (perim ?? []).map((r) => r.id as string)

  // Créneaux VIVANTS qui BLOQUENT une clé d'unicité (à ne pas régénérer par-dessus) :
  // TOUS les cadence/diagnostic vivants HORS périmètre, quel que soit leur statut.
  // ⚠ Le diagnostic s'indexe par FENÊTRE (plan, fenetre, type), INDÉPENDAMMENT de la
  // semaine — un diagnostic d'une semaine ANTÉRIEURE à aujourd'hui, hors périmètre,
  // bloque quand même sa fenêtre : on ne peut donc PAS filtrer les bloquants par
  // semaine (sinon 23505 à l'insert quand aujourd'hui tombe au milieu d'une fenêtre).
  const idsPerimSet = new Set(idsPerim)
  const { data: vivants } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('id, semaine_lundi, type_exercice, fenetre_diagnostique, origine')
    .eq('plan_id', planId)
    .in('origine', ['cadence', 'diagnostic'])
    .is('supprime_at', null)
  const clesCadence = new Set<string>()
  const clesDiag = new Set<string>()
  for (const b of vivants ?? []) {
    if (idsPerimSet.has(b.id as string)) continue // le périmètre est retiré → ne bloque pas
    if (b.origine === 'cadence') clesCadence.add(`${b.semaine_lundi}:${b.type_exercice}`)
    else clesDiag.add(`${b.fenetre_diagnostique}:${b.type_exercice}`)
  }

  const { rows, error: eGen } = await rowsPourPlan(planId, classeId, dateDebut, nouveauGabarit as Gabarit, aPartirDe, config)
  if (eGen) return { error: eGen }
  const rowsFiltrees = rows.filter((r) =>
    r.origine === 'diagnostic'
      ? !clesDiag.has(`${r.fenetre_diagnostique}:${r.type_exercice}`)
      : !clesCadence.has(`${r.semaine_lundi}:${r.type_exercice}`),
  )

  if (!confirmer) {
    return { needsConfirm: true, nbSupprimes: idsPerim.length, nbGeneres: rowsFiltrees.length }
  }

  // Application : soft-delete du périmètre PUIS insertion de la queue.
  if (idsPerim.length) {
    const { error: eDel } = await supabase
      .from('scriptorium_exercices_planifies')
      .update({ supprime_at: new Date().toISOString() })
      .in('id', idsPerim)
    if (eDel) return { error: eDel.message }
  }
  if (rowsFiltrees.length) {
    const { error: eIns } = await supabase.from('scriptorium_exercices_planifies').insert(rowsFiltrees)
    if (eIns) {
      // Compensation : restaurer le périmètre soft-deleté (jamais de plan mutilé sur
      // un échec d'insert — pas d'atomicité transactionnelle sans RPC dédiée).
      if (idsPerim.length) {
        await supabase.from('scriptorium_exercices_planifies').update({ supprime_at: null }).in('id', idsPerim)
      }
      return { error: `Régénération annulée (${eIns.message}).` }
    }
  }
  const { error: eMaj } = await supabase
    .from('scriptorium_plans_evaluation')
    .update({ gabarit: nouveauGabarit, updated_at: new Date().toISOString() })
    .eq('id', planId)
  if (eMaj) return { error: eMaj.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Aujourd'hui dans le fuseau configuré (date pure).
async function joursAujourdhui(): Promise<string> {
  return jourDansFuseau(new Date().toISOString(), await lireFuseau())
}

/** Recaler un exercice hors frise (J2) : 'reporter' vers la 1re semaine
 *  d'enseignement à venir de sa semaine d'origine, ou 'annuler'. Le report bascule
 *  'cadence'→'manuel' (libère la clé). */
export async function recalerExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  const action = (formData.get('action') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }

  const { data: exo } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('origine, statut, semaine_lundi, plan_id, lieu').eq('id', exerciceId).is('supprime_at', null).maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  if (exo.statut === 'annule') return { success: true }

  if (action === 'annuler') {
    const { error } = await supabase
      .from('scriptorium_exercices_planifies')
      .update({ statut: 'annule', updated_at: new Date().toISOString() }).eq('id', exerciceId).is('supprime_at', null)
    if (error) return { error: error.message }
    revalidatePath('/prof/scriptorium')
    return { success: true }
  }
  if (action !== 'reporter') return { error: 'Action inconnue.' }

  // Reporter : 1re semaine d'enseignement de la frise ≥ semaine d'origine.
  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation').select('date_debut, classe_id').eq('id', exo.plan_id as string).maybeSingle()
  if (!plan) return { error: 'Plan introuvable.' }
  const { couvertes } = await semainesCouvertes(plan.date_debut as string)
  const cible = couvertes.find((w) => w.dateDebutLundi >= (exo.semaine_lundi as string))
  if (!cible) return { error: 'Aucune semaine d’enseignement à venir pour reporter cet exercice — annule-le ou définis le semestre.' }
  const origine = exo.origine === 'cadence' ? 'manuel' : (exo.origine as string)
  const jourPrevu = exo.lieu === 'classe' ? await jourDeCours(plan.classe_id as string, cible.dateDebutLundi) : null
  const { error } = await supabase
    .from('scriptorium_exercices_planifies')
    .update({ semaine_lundi: cible.dateDebutLundi, jour_prevu: jourPrevu, origine, updated_at: new Date().toISOString() })
    .eq('id', exerciceId).is('supprime_at', null)
  if (error) {
    if (error.code === '23505') return { error: 'La semaine cible porte déjà un exercice de cadence du même type — annule plutôt.' }
    return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/** Réglage prof (D5) : quiz annoncé (true) ou surprise (false) au calendrier élève. */
export async function reglerQuizAnnonce(actif: boolean): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { error } = await gardé.supabase
    .from('scriptorium_params')
    .update({ quiz_annonce_defaut: actif, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * S4 — « Préparer la synthèse » : crée une séance Codex BROUILLON ancrée `contenu_id`
 * (classe = classe du plan) puis pose le lien par CLAIM-UPDATE conditionnel (statut→concu).
 * 0 ligne (deux « Préparer » concurrents) ou erreur → supprime la séance fraîche + message
 * (l'index uk_exercices_codex_session ne ferme que la course inverse). Tout via le client
 * prof (RLS *_prof_all sur exercices + codex_sessions_prof_all). Le déclenchement
 * (lancerSynthese) reste inchangé.
 */
export async function preparerSynthese(exerciceId: string): Promise<{ success?: boolean; sessionId?: string; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase, userId } = gardé
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }

  const { data: exo } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('id, type_exercice, statut, contenu_id, codex_session_id, plan_id')
    .eq('id', exerciceId).is('supprime_at', null).maybeSingle()
  if (!exo) return { error: 'Synthèse introuvable ou retirée du plan.' }
  if (exo.type_exercice !== 'synthese') return { error: 'Cet exercice n’est pas une synthèse.' }
  if (exo.statut === 'annule') return { error: 'Cette synthèse a été annulée.' }
  if (exo.codex_session_id) return { error: 'Une séance Codex est déjà liée à cette synthèse.' }
  if (!exo.contenu_id) return { error: 'Synthèse mal formée (cours manquant).' }

  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation').select('classe_id').eq('id', exo.plan_id as string).maybeSingle()
  const classeId = plan?.classe_id as string | undefined
  if (!classeId) return { error: 'Classe du plan introuvable.' }

  const { data: sess, error: eSess } = await supabase
    .from('codex_sessions')
    .insert({ contenu_id: exo.contenu_id, classe_id: classeId, statut: 'brouillon', created_by: userId })
    .select('id').single()
  if (eSess || !sess) return { error: eSess?.message ?? 'Création de la séance Codex impossible.' }

  const { data: claimed, error: eClaim } = await supabase
    .from('scriptorium_exercices_planifies')
    .update({ codex_session_id: sess.id, statut: 'concu', concu_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    // `eq('statut','a_concevoir')` : garde anti-résurrection TOCTOU — une annulation
    // concurrente (S5) pose statut='annule' SANS toucher codex_session_id/supprime_at ;
    // sans ce prédicat, le claim ressusciterait le tombstone en 'concu'. 0 ligne → nettoyage.
    .eq('id', exerciceId).eq('statut', 'a_concevoir').is('codex_session_id', null).is('supprime_at', null).select('id')
  if (eClaim || !claimed || claimed.length === 0) {
    // Séance brouillon vide, rien n'en dépend → on la retire (course perdue ou erreur DB).
    await supabase.from('codex_sessions').delete().eq('id', sess.id)
    return { error: eClaim ? `Échec de la liaison : ${eClaim.message}` : 'Une séance Codex est déjà liée à cette synthèse.' }
  }

  revalidatePath('/prof/codex')
  revalidatePath('/prof/scriptorium')
  return { success: true, sessionId: sess.id }
}
