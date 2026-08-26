'use server'
// Server actions du plan annuel d'évaluation (lot 2). Écrivent UNIQUEMENT dans les
// tables neuves (scriptorium_plans_evaluation / _exercices_planifies) : aucun flux
// vivant touché. GATÉES : chaque action refuse si plan_evaluation_actif est false
// (défense en profondeur — l'onglet est déjà masqué gate OFF). Voir SPEC §5 (P/G/V).
import { revalidatePath } from 'next/cache'
import { verifierProfGate, estLundi, TYPE_MANUEL } from './gate'
import { createAdminClient } from '@/utils/supabase/admin'
import { hookSyntheseBackfillPlan } from '@/utils/plan-synthese-hooks'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { anneeScolaireDe } from '@/utils/frise-enseignement'
import { genererCadence, placerDiagnostics, asPlanConfig, type Gabarit, type ExerciceGenere, type PlanConfig } from '@/utils/plan-cadence'
import { coursParJour } from '@/utils/calendrier-cours'
import { resoudreSemestrePourSemaine } from '@/utils/plan-exercices'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { semainesCouvertes } from './plan-serveur'
import { classeAModule } from '@/utils/acces'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const GABARITS: Gabarit[] = ['tc', 'hlp', 'vierge']

// Construit les lignes DB depuis les specs du moteur pur. Les exercices EN CLASSE
// naissent SANS jour (jour_prevu=null, « à caler » §5.6) : pas de défaut silencieux,
// le prof pose le jour ensuite via fixerJourExercice. Les exercices maison restent
// ancrés à la semaine (dateEffectiveSemaine retombe au dimanche).
function construireRows(
  generes: ExerciceGenere[],
  planId: string,
): Record<string, unknown>[] {
  return generes.map((g) => ({
    plan_id: planId,
    type_exercice: g.type_exercice,
    diagnostique: g.diagnostique,
    nature: g.nature,
    lieu: g.lieu,
    module: g.module,
    ancrage: 'semaine',
    semaine_lundi: g.semaine_lundi,
    jour_prevu: null,
    origine: g.origine,
    fenetre_diagnostique: g.fenetre_diagnostique ?? null,
    statut: 'a_concevoir',
  }))
}

/**
 * NOTE (Lot D) : la création class-first est RETIRÉE de l'UI (§4.5 « coupe propre » —
 * un plan naît désormais par assignation d'un modèle). Cette fonction est CONSERVÉE
 * comme brique/référence de matérialisation (rollback, garde frise) — cf. §7.
 *
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
    const rows = construireRows(generes, planId)
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
  try { await hookSyntheseBackfillPlan(createAdminClient(), planId, classeId) } catch (e) { console.error('[plan] back-fill synthèses (création) échoué', e) }
  revalidatePath('/prof/scriptorium')
  return { id: planId }
}

/** Validation (V2) : brouillon → validé (les dérivations deviennent actives, lots 3+). */
export async function validerPlan(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const planId = (formData.get('plan_id') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  // Autorise la (re)validation d'un plan brouillon OU déjà validé (le prof revalide
  // après avoir modifié un plan validé) : rafraîchit valide_at, back-fill idempotent.
  const { data: updated, error } = await gardé.supabase
    .from('scriptorium_plans_evaluation')
    .update({ statut: 'valide', valide_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', planId)
    .in('statut', ['brouillon', 'valide'])
    .select('classe_id')
    .maybeSingle()
  if (error) return { error: error.message }
  // Filet : back-fill aussi à la validation (un parcours assigné pendant que le plan était
  // brouillon est déjà couvert par hookSyntheseAssignClasse ; ceci rattrape les cas de bord
  // et reste idempotent). `updated` null = plan déjà non-brouillon → rien à faire.
  if (updated?.classe_id) {
    try { await hookSyntheseBackfillPlan(createAdminClient(), planId, updated.classe_id as string) } catch (e) { console.error('[plan] back-fill synthèses (validation) échoué', e) }
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
    .select('origine, plan_id, statut, type_exercice, codex_session_id')
    .eq('id', exerciceId)
    .is('supprime_at', null)
    .maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  if (exo.statut === 'annule') return { success: true } // idempotent
  // Garde-fou synthèse : une séance Codex LANCÉE est intangible (retirerSynthese la laisse
  // intacte ; sinon on tombstonerait une synthèse RÉALISÉE, qui ne serait plus jamais
  // ressuscitée à tort). Ferme la course « formulaire périmé » (à-faire rendu a_concevoir,
  // prof prépare+lance, puis clique « Retirer »). Vérifie lance_at (état serveur), pas le
  // statut snapshotté.
  if (exo.type_exercice === 'synthese' && exo.codex_session_id) {
    const { data: sess } = await supabase
      .from('codex_sessions').select('lance_at').eq('id', exo.codex_session_id as string).maybeSingle()
    if (sess && (sess as { lance_at?: string | null }).lance_at != null) {
      return { error: 'Cette synthèse a déjà été lancée en classe — elle ne peut plus être retirée.' }
    }
  }
  // ── Un exercice CONÇU porte une INSTANCE, et il faut la traiter avec la ligne ──
  //
  // Avant ce correctif, la grille du plan masquait « Retirer » dès `statut = 'concu'`
  // (`GrillePlan.tsx`, `{e.statut !== 'concu' && …}`) : un examen conçu par erreur
  // était DÉFINITIF. Le bouton du tableau de bord, lui, s'affichait — et échouait en
  // silence. Louis l'a rencontré sur 1HLP le 25/08, sur trois lignes d'un coup.
  //
  // ⛔ MAIS ON NE SUPPRIME PAS UNE INSTANCE À L'AVEUGLE. `exercices` cascade sur
  //    `exercices_depots`, qui cascade lui-même sur `exercices_squelettes`,
  //    `exercices_retours`, `exercices_metacognition` et `exercices_jobs`
  //    (vérifié sur les FK en base le 25/08). Supprimer une instance qui porte du
  //    travail détruirait donc les copies, les retours et les mesures qui vont avec.
  //    ⭐ D'où la garde : le retrait n'est permis que si l'instance est VIERGE, et
  //    le refus dit combien de dépôts l'en empêchent. C'est cette garde qui vérifie
  //    « il n'y a pas eu de travail élève » — jamais l'œil de qui clique.
  //
  // ⚠️ `competences_mesures.depot_id` et `monitoring_mesures.depot_id` sont en NO
  //    ACTION : la base refuserait de toute façon. On préfère un refus lisible ici
  //    à une violation de contrainte remontée brute.
  const { data: instance, error: eInst } = await supabase
    .from('exercices').select('id').eq('exercice_planifie_id', exerciceId).maybeSingle()
  if (eInst) return { error: `Instance illisible : ${eInst.message}` }
  if (instance) {
    const instanceId = (instance as { id: string }).id
    // `count: 'exact'` et pas une liste : supabase-js plafonne toute réponse à
    // 1000 lignes sans le dire, et un dénombrement tronqué dirait « vierge » à tort.
    const { count: nbDepots, error: eDep } = await supabase
      .from('exercices_depots').select('id', { count: 'exact', head: true }).eq('exercice_id', instanceId)
    if (eDep) return { error: `Dépôts illisibles : ${eDep.message}` }
    if ((nbDepots ?? 0) > 0) {
      return { error: `Des élèves ont déjà travaillé sur cet exercice (${nbDepots} dépôt${nbDepots! > 1 ? 's' : ''}). `
        + 'Il ne peut plus être retiré : le supprimer effacerait leurs copies, leurs retours et leurs mesures.' }
    }
    // `routeur_decisions.exercice_id` est en NO ACTION : une décision qui pointe
    // l'instance ferait échouer la suppression sur une contrainte. On le dit avant.
    const { count: nbDecisions, error: eDec } = await supabase
      .from('routeur_decisions').select('id', { count: 'exact', head: true }).eq('exercice_id', instanceId)
    if (eDec) return { error: `Décisions du routeur illisibles : ${eDec.message}` }
    if ((nbDecisions ?? 0) > 0) {
      return { error: 'Le routeur a déjà assigné cet exercice : il ne peut plus être retiré du plan.' }
    }
    // Instance vierge : la cascade n'a plus rien à détruire.
    const { error: eSuppr } = await supabase.from('exercices').delete().eq('id', instanceId)
    if (eSuppr) return { error: `Suppression de l’instance refusée : ${eSuppr.message}` }
  }

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
  return { rows: construireRows(generes, planId) }
}

/**
 * NOTE (Lot D) : RETIRÉE de l'UI (redondante avec assignerModeleClasse, §7). Conservée
 * comme brique/référence (le patron « copie indépendante par classe » est repris par
 * l'assignation depuis modèle, et servira à un éventuel « modèle vivant » futur).
 *
 * Propagation (P5) : applique le gabarit + date_debut du plan source à d'autres
 * classes ACTIVES de MÊME type_pedagogique et MÊME AY, SANS plan vivant. Crée pour
 * chaque cible un plan INDÉPENDANT (le calendrier est global → mêmes semaines ; les
 * exercices en classe naissent « à caler » — jour_prevu=null, §5.6 — puis se calent
 * par classe via fixerJourExercice). Aucune ligne partagée, aucune classe verrouillée.
 * Idempotent (l'unicité classe×AY ignore un
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
    const { rows, error: eGen } = await rowsPourPlan(planId, dateDebut, gabarit, undefined, config)
    if (eGen) { await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId); ignores++; continue }
    if (rows.length) {
      const { error: eIns } = await supabase.from('scriptorium_exercices_planifies').insert(rows)
      if (eIns) { await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId); ignores++; continue }
    }
    // Back-fill des synthèses du plan propagé, comme creerPlan (sinon un plan propagé
    // n'aurait aucune synthèse en brouillon, incohérent). Best-effort, gate-first.
    try { await hookSyntheseBackfillPlan(createAdminClient(), planId, classeId) } catch (e) { console.error('[plan] back-fill synthèses (propagation) échoué', e) }
    crees++
  }
  revalidatePath('/prof/scriptorium')
  return { crees, ignores }
}

/**
 * Assigner un MODÈLE à UNE classe (Lot D — généralise propagerPlan). Matérialise une
 * INSTANCE indépendante liée au modèle (modele_id), puis diverge librement. Idempotent :
 * une classe ayant déjà un plan vivant pour l'AY est IGNORÉE (uk_plans_evaluation_classe_ay).
 * Décision ② : classes ACTIVES sans filtre type_pedagogique (le modèle porte un gabarit).
 *
 * Matérialisation = COPIE des exercices du modèle dont la semaine tombe dans les semaines
 * COUVERTES de cette classe (TOUTE origine — cadence + diagnostics + manuel). Honore
 * INTÉGRALEMENT les éditions du prof (déplacements/retraits, diagnostics inclus). jour_prevu
 * = null : les exercices EN CLASSE naissent « à caler » (§5.6). Les lignes du modèle
 * ANTÉRIEURES à l'ancre de la classe (assignée avec une date plus tardive) ne sont PAS
 * reprises — comptées (`horsPeriode`) et signalées à l'UI, jamais supprimées en silence.
 *
 * (Écart assumé vs §5.2 : on ne re-résout PAS les diagnostics via placerDiagnostics — la
 * grille modèle les rend éditables, donc la copie filtrée aux semaines couvertes honore les
 * éditions ET reproduit exactement, pour une classe démarrant plus tard, le placement par
 * fenêtre — équivalent à la re-résolution quand rien n'a été édité. Évite aussi de
 * matérialiser des lignes pré-ancre qui fuiraient dans le « à faire » / le calendrier.)
 */
export async function assignerModeleClasse(
  modeleId: string, classeId: string, dateDebut: string | null,
): Promise<{ success?: boolean; ignore?: boolean; horsPeriode?: number; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase, userId } = gardé
  if (!RE_UUID.test(modeleId) || !RE_UUID.test(classeId)) return { error: 'Identifiant invalide.' }

  const { data: modele } = await supabase
    .from('scriptorium_modeles_plan')
    .select('gabarit, annee_scolaire, date_debut, config')
    .eq('id', modeleId).is('supprime_at', null).maybeSingle()
  if (!modele) return { error: 'Modèle introuvable.' }
  const gabarit = modele.gabarit as Gabarit
  const dateInstance = dateDebut && /^\d{4}-\d{2}-\d{2}$/.test(dateDebut) ? dateDebut : (modele.date_debut as string)

  // Un modèle est « 1 par année scolaire visée » (§4.1) et ses créneaux sont ABSOLUS : une
  // date d'assignation dans un AUTRE AY produirait une instance dégénérée (créneaux hors
  // frise) + une incohérence d'affichage (le loader raisonne sur l'AY du modèle) → refus.
  const ay = anneeScolaireDe(dateInstance)
  if (ay !== (modele.annee_scolaire as number)) {
    return { error: `La date d’assignation doit rester dans l’année scolaire du modèle (${modele.annee_scolaire}–${(modele.annee_scolaire as number) + 1}).` }
  }

  const { data: classe } = await supabase.from('classes').select('statut').eq('id', classeId).maybeSingle()
  if (!classe || classe.statut !== 'active') return { error: 'Classe introuvable ou inactive.' }

  const { data: dejaPlan } = await supabase
    .from('scriptorium_plans_evaluation')
    .select('id').eq('classe_id', classeId).eq('annee_scolaire', ay).is('supprime_at', null).maybeSingle()
  if (dejaPlan) return { ignore: true }

  // Frise de la classe (peut démarrer plus tard que le modèle → moins de semaines couvertes).
  const { couvertes, ancreLundi, avisBloquant } = await semainesCouvertes(dateInstance)
  if (avisBloquant) return { error: 'Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.' }
  if (!ancreLundi) return { error: 'Aucune semaine d’enseignement à venir pour cette date — définis les semestres dans le Calendrier.' }

  const { data: plan, error } = await supabase
    .from('scriptorium_plans_evaluation')
    .insert({ classe_id: classeId, annee_scolaire: ay, gabarit, date_debut: dateInstance, config: modele.config ?? {}, modele_id: modeleId, statut: 'brouillon', created_by: userId })
    .select('id').single()
  if (error || !plan) {
    if (error?.code === '23505') return { ignore: true } // course TOCTOU sur l'unicité → déjà servie
    return { error: error?.message ?? 'Assignation impossible.' }
  }
  const planId = plan.id as string

  // Copie filtrée aux semaines couvertes (toute origine). Un modèle 'vierge' n'a que des
  // lignes manuelles → elles sont bien reprises (pas de branche gabarit).
  const lundisCouverts = new Set(couvertes.map((w) => w.dateDebutLundi))
  const { data: exosModele } = await supabase
    .from('scriptorium_modeles_plan_exercices')
    .select('type_exercice, diagnostique, nature, lieu, module, semaine_lundi, origine, fenetre_diagnostique')
    .eq('modele_id', modeleId)
  const toutes = exosModele ?? []
  const retenues = toutes.filter((e) => lundisCouverts.has(e.semaine_lundi as string))
  const horsPeriode = toutes.length - retenues.length
  const rows = retenues.map((e) => ({
    plan_id: planId,
    type_exercice: e.type_exercice,
    diagnostique: e.diagnostique,
    nature: e.nature,
    lieu: e.lieu,
    module: e.module,
    ancrage: 'semaine',
    semaine_lundi: e.semaine_lundi,
    jour_prevu: null,
    origine: e.origine,
    fenetre_diagnostique: e.fenetre_diagnostique ?? null,
    statut: 'a_concevoir',
  }))
  if (rows.length) {
    const { error: eIns } = await supabase.from('scriptorium_exercices_planifies').insert(rows)
    if (eIns) {
      await supabase.from('scriptorium_plans_evaluation').delete().eq('id', planId)
      return { error: `Matérialisation impossible (${eIns.message}). Réessaie.` }
    }
  }
  // Synthèses (comme creerPlan/propagerPlan), best-effort, gate-first.
  try { await hookSyntheseBackfillPlan(createAdminClient(), planId, classeId) } catch (e) { console.error('[modele] back-fill synthèses (assignation) échoué', e) }
  revalidatePath('/prof/scriptorium')
  return horsPeriode > 0 ? { success: true, horsPeriode } : { success: true }
}

/**
 * Retirer un modèle d'une classe (Lot D — v1 = DÉTACHER, pas supprimer). L'instance a pu
 * être ajustée / des synthèses lancées : on la conserve et on retire seulement le lien
 * modele_id. Pour supprimer l'instance, le prof utilise « Supprimer » sur la grille du plan.
 */
export async function retirerModeleClasse(modeleId: string, classeId: string): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  if (!RE_UUID.test(modeleId) || !RE_UUID.test(classeId)) return { error: 'Identifiant invalide.' }
  const { error } = await gardé.supabase
    .from('scriptorium_plans_evaluation')
    .update({ modele_id: null, updated_at: new Date().toISOString() })
    .eq('classe_id', classeId).eq('modele_id', modeleId).is('supprime_at', null)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * Ré-ancre le semestre d'un quiz DÉJÀ LIÉ quand son exercice change de semaine
 * (déplacer/recaler). `quazian_quizzes.semester_id` est figé à la CRÉATION du quiz sur la
 * semaine planifiée d'alors (quazian/quizz/actions.ts) et n'est écrit nulle part ailleurs :
 * sans ce recalage, un quiz déplacé au-delà d'une frontière de semestre agrège ses notes
 * dans le MAUVAIS semestre (quazian/semestre agrège par semester_id). Renvoie une erreur
 * (à propager, refus du déplacement) si aucun semestre non archivé ne couvre la cible.
 */
async function reancrerSemestreQuiz(quizId: string, semaineLundi: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const sid = await resoudreSemestrePourSemaine(admin, semaineLundi)
  if (!sid) return { error: 'La semaine cible n’appartient à aucun semestre — le quiz lié ne peut y être daté. Définis le semestre ou annule.' }
  const { error } = await admin.from('quazian_quizzes').update({ semester_id: sid }).eq('id', quizId)
  if (error) return { error: error.message }
  return {}
}

/** Déplacer un exercice (V3) : change de semaine. Une ligne 'cadence' bascule
 *  'manuel' (libère la clé uk_exercices_cadence). Pour un exercice en classe,
 *  jour_prevu est RECALCULÉ sur la semaine cible (1er jour de cours, repli null) — le
 *  déplacement garde le défaut, contrairement à la naissance « à caler » (§5.6) ; le
 *  prof re-cale ensuite si besoin. Interdit sur un exercice annulé. */
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
    .select('origine, statut, lieu, plan_id, ancrage, type_exercice, quiz_id').eq('id', exerciceId).is('supprime_at', null).maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  if (exo.statut === 'annule') return { error: 'Exercice annulé — réactive-le avant de le déplacer.' }
  // Seul le bras 'semaine' porte un semaine_lundi (exercices_ancrage_chk) : déplacer une
  // synthèse (bras 'parcours') violerait le CHECK (23514 brut) — refus métier tôt.
  if (exo.ancrage !== 'semaine') return { error: 'Une synthèse suit son cours — elle ne se déplace pas à la semaine.' }
  // Un quiz déjà lié doit re-résoudre son semestre sur la cible AVANT de bouger l'exercice.
  if (exo.type_exercice === 'quiz' && exo.quiz_id) {
    const r = await reancrerSemestreQuiz(exo.quiz_id as string, semaineLundi)
    if (r.error) return r
  }
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

/** Ajouter un exercice manuel (V1/V3) à une semaine. `type_exercice` du formulaire =
 *  ID DE PALETTE (TYPE_MANUEL) → combinaison canonique complète du CHECK (dont
 *  `diagnostique`). Les exercices EN CLASSE (quiz, examen, diagnostics, Bac Blanc)
 *  naissent SANS jour (jour_prevu=null, « à caler » §5.6). */
export async function ajouterExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const planId = (formData.get('plan_id') as string) ?? ''
  const semaineLundi = (formData.get('semaine_lundi') as string) ?? ''
  const paletteId = (formData.get('type_exercice') as string) ?? ''
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaineLundi) || !estLundi(semaineLundi)) return { error: 'Semaine invalide.' }
  const spec = TYPE_MANUEL[paletteId]
  if (!spec) return { error: 'Type d’exercice non ajoutable à la main.' }

  const { error } = await supabase.from('scriptorium_exercices_planifies').insert({
    plan_id: planId,
    type_exercice: spec.type_exercice,
    diagnostique: spec.diagnostique,
    nature: spec.nature,
    lieu: spec.lieu,
    module: spec.module,
    ancrage: 'semaine',
    semaine_lundi: semaineLundi,
    jour_prevu: null,               // en classe → « à caler » (§5.6) ; maison → sans objet
    fenetre_diagnostique: null,     // ajout manuel : jamais lié à une fenêtre (origine='manuel')
    origine: 'manuel',
    statut: 'a_concevoir',
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

/**
 * Caler le jour (§5.6) d'un exercice EN CLASSE : pose jour_prevu sur un jour de cours
 * de la classe, dans la semaine de l'exercice. `jour` vide → remet « à caler » (null).
 * Refuse un exercice maison (ancré à la semaine), un jour hors semaine (exercices_jour_chk),
 * ou un jour sans cours pour la classe. L'échéance affichée en découle (dateEffectiveSemaine).
 */
export async function fixerJourExercice(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  const { supabase } = gardé
  const exerciceId = (formData.get('exercice_id') as string) ?? ''
  const jour = (formData.get('jour') as string) ?? ''
  if (!RE_UUID.test(exerciceId)) return { error: 'Exercice invalide.' }
  if (jour !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(jour)) return { error: 'Jour invalide.' }

  const { data: exo } = await supabase
    .from('scriptorium_exercices_planifies')
    .select('lieu, statut, ancrage, semaine_lundi, plan_id')
    .eq('id', exerciceId).is('supprime_at', null).maybeSingle()
  if (!exo) return { error: 'Exercice introuvable.' }
  if (exo.statut === 'annule') return { error: 'Exercice annulé.' }
  // Réservé aux exercices EN CLASSE ancrés semaine (un maison n'a pas de jour ; une
  // synthèse est ancrée 'parcours' et n'a pas de semaine_lundi).
  if (exo.ancrage !== 'semaine' || exo.lieu !== 'classe') {
    return { error: 'Seul un exercice en classe se cale à un jour précis.' }
  }

  const poser = async (jourPrevu: string | null, attenduLundi: string | null): Promise<{ success?: boolean; error?: string }> => {
    let q = supabase
      .from('scriptorium_exercices_planifies')
      .update({ jour_prevu: jourPrevu, updated_at: new Date().toISOString() })
      .eq('id', exerciceId).eq('lieu', 'classe').neq('statut', 'annule').is('supprime_at', null)
    // Épingle la semaine LUE : un deplacer/recaler concurrent (qui déplace l'exercice
    // sur une AUTRE semaine + remet jour_prevu=null) fait alors matcher 0 ligne → no-op
    // propre, au lieu d'un 23514 brut (le jour validé contre W1 tomberait hors W2). Le
    // repli « à caler » (null) n'en a pas besoin : null satisfait toujours exercices_jour_chk.
    if (attenduLundi) q = q.eq('semaine_lundi', attenduLundi)
    const { error } = await q
    if (error) return { error: error.message }
    revalidatePath('/prof/scriptorium')
    return { success: true }
  }

  if (jour === '') return poser(null, null) // « à caler »

  // Le jour doit tomber dans la semaine de l'exercice ET être un jour de cours de la classe.
  const lundi = exo.semaine_lundi as string
  const dimanche = toISODate(addDaysUTC(new Date(lundi + 'T00:00:00Z'), 6))
  if (jour < lundi || jour > dimanche) return { error: 'Le jour choisi doit tomber dans la semaine de l’exercice.' }
  const { data: plan } = await supabase
    .from('scriptorium_plans_evaluation').select('classe_id').eq('id', exo.plan_id as string).maybeSingle()
  if (!plan) return { error: 'Plan introuvable.' }
  const jours = await coursParJour({ debut: lundi, fin: dimanche })
  if (!(jours.get(jour) ?? []).some((c) => c.id === (plan.classe_id as string))) {
    return { error: 'La classe n’a pas cours ce jour-là.' }
  }
  return poser(jour, lundi)
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
    .select('date_debut, config').eq('id', planId).is('supprime_at', null).maybeSingle()
  if (!plan) return { error: 'Plan introuvable.' }
  const dateDebut = plan.date_debut as string
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

  const { rows, error: eGen } = await rowsPourPlan(planId, dateDebut, nouveauGabarit as Gabarit, aPartirDe, config)
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
    .select('origine, statut, semaine_lundi, plan_id, lieu, type_exercice, quiz_id').eq('id', exerciceId).is('supprime_at', null).maybeSingle()
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
  // Quiz déjà lié : re-résoudre son semestre sur la cible AVANT de bouger (mêmes notes,
  // bon semestre). Refus si la cible n'appartient à aucun semestre.
  if (exo.type_exercice === 'quiz' && exo.quiz_id) {
    const r = await reancrerSemestreQuiz(exo.quiz_id as string, cible.dateDebutLundi)
    if (r.error) return r
  }
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
 * Réglage prof du budget (§7.3) : la part FRAGMENTS entre-t-elle dans le budget temps de
 * la panoptique, et à quelle cadence ? 'hebdo' (défaut = la réalité du module, chip souvent
 * saturée en HLP), 'quinzaine' (une échéance sur deux — pour le prof qui alterne réellement),
 * 'non'. Fusionné dans le jsonb `config` du plan (préserve `cycle`).
 */
export async function reglerCompterFragments(
  planId: string, valeur: 'hebdo' | 'quinzaine' | 'non',
): Promise<{ success?: boolean; error?: string }> {
  const gardé = await verifierProfGate()
  if ('error' in gardé) return { error: gardé.error }
  if (!RE_UUID.test(planId)) return { error: 'Plan invalide.' }
  if (valeur !== 'hebdo' && valeur !== 'quinzaine' && valeur !== 'non') return { error: 'Valeur invalide.' }
  const { data: plan } = await gardé.supabase
    .from('scriptorium_plans_evaluation').select('config').eq('id', planId).is('supprime_at', null).maybeSingle()
  if (!plan) return { error: 'Plan introuvable.' }
  const config = asPlanConfig(plan.config)
  const { error } = await gardé.supabase
    .from('scriptorium_plans_evaluation')
    .update({ config: { ...config, compterFragments: valeur }, updated_at: new Date().toISOString() })
    .eq('id', planId)
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

  // Accès & classes · L1 — LA PORTE DÉROBÉE. C'est le seul endroit du plan
  // d'évaluation qui écrit dans un flux vivant (`codex_sessions`) : le reste ne
  // touche que ses propres tables. Sans cette garde, un plan fabrique une
  // synthèse Codex pour une classe qui n'a pas Codex — exactement le bug réparé
  // ailleurs dans ce lot, par un autre chemin, et gate ON celui-ci est ouvert.
  // Le sélecteur de classe du plan, lui, ne filtre PAS et ne le doit pas : un
  // plan couvre plusieurs modules à la fois, aucun ne peut le filtrer seul.
  // C'est donc ici, au moment d'écrire dans Codex, que la règle se tient.
  if (!(await classeAModule(supabase, classeId, 'codex'))) {
    return { error: 'La classe de ce plan n’a pas le module Codex. Donne-lui le module depuis sa fiche avant de préparer la synthèse.' }
  }

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
