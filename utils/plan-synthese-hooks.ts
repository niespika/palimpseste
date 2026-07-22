// Hooks de synthèse (plan d'évaluation, §5.4 S3/S5) — écrits par les actions parcours
// EXISTANTES. Chaque hook lit le GATE EN PREMIER et sort si OFF (no-op strict : gate OFF
// = flux parcours byte-identique, zéro écriture). I/O client `admin` (RLS prof-only).
//
// Une synthèse = 1 exercice `type='synthese'`, ancrage='parcours', origine='synthese_auto',
// (plan_id, parcours_id, contenu_id). Unicité vivante par uk_exercices_synthese. Ré-établir
// la config (réassigner la classe, remettre le cours) RESSUSCITE un tombstone (annulé/
// soft-deleté) au lieu de le laisser mort — cf. upsertSynthese (décision PO 2026-07-17).

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireGatePlanActif } from './plan-exercices'

// Plan VIVANT (brouillon OU valide — S3 crée une ligne dormante dans un brouillon) le plus
// récent d'une classe (max annee_scolaire), ou null. Aligné sur le « plan courant » des
// autres surfaces.
async function planVivantDeClasse(admin: SupabaseClient, classeId: string): Promise<string | null> {
  const { data } = await admin
    .from('scriptorium_plans_evaluation')
    .select('id, annee_scolaire')
    .eq('classe_id', classeId)
    .is('supprime_at', null)
  let best: { id: string; ay: number } | null = null
  for (const p of data ?? []) {
    const ay = p.annee_scolaire as number
    if (!best || ay > best.ay) best = { id: p.id as string, ay }
  }
  return best?.id ?? null
}

// Contenu vivant de type 'cours' ? (seuls les cours ont une synthèse de fin de cours.)
async function estCoursVivant(admin: SupabaseClient, contenuId: string): Promise<boolean> {
  const { data } = await admin
    .from('scriptorium_contenus')
    .select('type, supprime_at')
    .eq('id', contenuId)
    .maybeSingle()
  const c = data as { type?: string; supprime_at?: string | null } | null
  return !!c && c.type === 'cours' && c.supprime_at == null
}

// Id d'instance (scriptorium_parcours_classes) d'un couple (parcours, classe) ACTIF, ou null.
async function instanceActive(admin: SupabaseClient, parcoursId: string, classeId: string): Promise<string | null> {
  const { data } = await admin
    .from('scriptorium_parcours_classes')
    .select('id').eq('parcours_id', parcoursId).eq('classe_id', classeId).eq('statut', 'active')
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}

// L'INSTANCE référence-t-elle ce contenu ? (créneaux d'instance — RAG L1 : la synthèse
// suit l'instance de chaque classe, plus le modèle.)
async function instanceContientContenu(admin: SupabaseClient, pcId: string, contenuId: string): Promise<boolean> {
  const { data } = await admin
    .from('scriptorium_parcours_classe_creneaux')
    .select('id').eq('parcours_classe_id', pcId).eq('ref_type', 'contenu').eq('contenu_id', contenuId)
    .limit(1).maybeSingle()
  return !!data
}

// Upsert idempotent AVEC RÉSURRECTION (décision PO 2026-07-17, supersède l'anti-résurrection
// du SPEC §5.4-S3) : ré-établir la config (même plan+parcours+contenu) refait vivre une
// synthèse annulée/soft-deletée, au lieu de la laisser morte sans recours. Trois cas pour
// une ligne existante :
//  - VIVANTE (ni annulée ni soft-deletée) → abstention (idempotence ; ne perturbe pas une
//    ligne 'concu' avec sa séance).
//  - TOMBSTONE avec séance Codex encore liée (annulée-avec-session-non-lancée : la
//    préparation du prof existe toujours) → ressuscite en 'concu' (préparation préservée).
//  - TOMBSTONE sans séance → ressuscite en 'a_concevoir'.
// (Une synthèse dont la séance est LANCÉE n'est jamais tombstonée — retirerSynthese la
// laisse intacte —, donc jamais ressuscitée à tort.)
async function upsertSynthese(admin: SupabaseClient, planId: string, parcoursId: string, contenuId: string): Promise<void> {
  const { data: existante } = await admin
    .from('scriptorium_exercices_planifies')
    .select('id, statut, supprime_at, codex_session_id, concu_at')
    .eq('plan_id', planId)
    .eq('parcours_id', parcoursId)
    .eq('contenu_id', contenuId)
    .eq('type_exercice', 'synthese')
    .limit(1)
    .maybeSingle()
  if (existante) {
    const e = existante as { id: string; statut: string; supprime_at: string | null; codex_session_id: string | null; concu_at: string | null }
    if (e.statut !== 'annule' && e.supprime_at == null) return // vivante → idempotence
    const now = new Date().toISOString()
    const avecSession = e.codex_session_id != null
    const { error } = await admin.from('scriptorium_exercices_planifies').update({
      statut: avecSession ? 'concu' : 'a_concevoir',
      concu_at: avecSession ? (e.concu_at ?? now) : null,
      supprime_at: null,
      updated_at: now,
    }).eq('id', e.id)
    // Le client admin ne throw pas : sans ce test, un échec (typo/dérive de schéma)
    // resterait muet et la synthèse ne réapparaîtrait jamais, sans trace.
    if (error) console.error('[plan] résurrection synthèse échouée', { id: e.id, error: error.message })
    return
  }
  const { error } = await admin.from('scriptorium_exercices_planifies').insert({
    plan_id: planId,
    type_exercice: 'synthese',
    diagnostique: false,
    nature: 'formatif',
    lieu: 'classe',
    module: 'codex',
    ancrage: 'parcours',
    parcours_id: parcoursId,
    contenu_id: contenuId,
    origine: 'synthese_auto',
    statut: 'a_concevoir',
  })
  // 23505 = course sur uk_exercices_synthese (deux hooks concurrents) → attendu, ignoré
  // (l'autre a créé la ligne). Toute autre erreur est logguée plutôt qu'avalée.
  if (error && error.code !== '23505') console.error('[plan] création synthèse échouée', { planId, parcoursId, contenuId, error: error.message })
}

// Retrait d'une synthèse (S5) : réalisée (session Codex lancée) → INTACTE (historique).
// mode 'creneau' : sans session → soft-delete (tombstone) ; avec session non lancée → annule.
// mode 'annule' : non réalisée → annule (tombstone réactivable — désassignation/suppression).
// La session Codex n'est JAMAIS supprimée automatiquement.
async function retirerSynthese(
  admin: SupabaseClient,
  exo: { id: string; codex_session_id: string | null },
  mode: 'creneau' | 'annule',
): Promise<void> {
  const now = new Date().toISOString()
  if (exo.codex_session_id) {
    const { data: sess } = await admin
      .from('codex_sessions').select('lance_at').eq('id', exo.codex_session_id).maybeSingle()
    if (sess && (sess as { lance_at?: string | null }).lance_at != null) return // réalisée → intacte
    await admin.from('scriptorium_exercices_planifies')
      .update({ statut: 'annule', updated_at: now }).eq('id', exo.id)
    return
  }
  if (mode === 'creneau') {
    await admin.from('scriptorium_exercices_planifies')
      .update({ supprime_at: now, updated_at: now }).eq('id', exo.id)
  } else {
    await admin.from('scriptorium_exercices_planifies')
      .update({ statut: 'annule', updated_at: now }).eq('id', exo.id)
  }
}

// Synthèses VIVANTES non annulées correspondant à un filtre (parcours + éventuellement
// un plan ou un contenu), pour les passer au retrait.
async function synthesesVivantes(
  admin: SupabaseClient,
  filtre: { parcoursId: string; planIds?: string[]; contenuId?: string },
): Promise<{ id: string; codex_session_id: string | null }[]> {
  let q = admin
    .from('scriptorium_exercices_planifies')
    .select('id, codex_session_id')
    .eq('type_exercice', 'synthese')
    .eq('parcours_id', filtre.parcoursId)
    .is('supprime_at', null)
    .neq('statut', 'annule')
  if (filtre.planIds) q = q.in('plan_id', filtre.planIds)
  if (filtre.contenuId) q = q.eq('contenu_id', filtre.contenuId)
  const { data } = await q
  return (data ?? []).map((e) => ({ id: e.id as string, codex_session_id: (e.codex_session_id as string | null) ?? null }))
}

// ── S3 — auto-création ────────────────────────────────────────────────────────

/**
 * Après ajout d'un créneau-CONTENU : si c'est un cours vivant, crée la synthèse pour
 * chaque classe assignée ACTIVE à plan vivant DONT L'INSTANCE référence ce cours
 * (RAG L1 : ajouter un créneau au MODÈLE ne redescend pas dans les instances → le
 * hook n'y crée rien ; l'ajout d'un créneau à une INSTANCE — geste L3 — passera par
 * ce même hook et trouvera le cours dans l'instance de sa classe). Gate OFF → no-op.
 */
export async function hookSyntheseAjoutCreneau(admin: SupabaseClient, parcoursId: string, contenuId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  if (!(await estCoursVivant(admin, contenuId))) return
  const { data: assigns } = await admin
    .from('scriptorium_parcours_classes').select('id, classe_id').eq('parcours_id', parcoursId).eq('statut', 'active')
  for (const a of assigns ?? []) {
    if (!(await instanceContientContenu(admin, a.id as string, contenuId))) continue
    const planId = await planVivantDeClasse(admin, a.classe_id as string)
    if (planId) await upsertSynthese(admin, planId, parcoursId, contenuId)
  }
}

/**
 * Après assignation d'une classe : crée la synthèse pour chaque COURS présent dans
 * l'INSTANCE fraîchement matérialisée (copie du modèle à ce moment — RAG L1), si la
 * classe a un plan vivant. À appeler APRÈS la matérialisation. Gate OFF → no-op.
 */
export async function hookSyntheseAssignClasse(admin: SupabaseClient, parcoursId: string, classeId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  const planId = await planVivantDeClasse(admin, classeId)
  if (!planId) return
  const pcId = await instanceActive(admin, parcoursId, classeId)
  if (!pcId) return
  const { data: creneaux } = await admin
    .from('scriptorium_parcours_classe_creneaux').select('contenu_id').eq('parcours_classe_id', pcId).eq('ref_type', 'contenu')
  const contenuIds = [...new Set((creneaux ?? []).map((c) => c.contenu_id as string).filter(Boolean))]
  for (const contenuId of contenuIds) {
    if (await estCoursVivant(admin, contenuId)) await upsertSynthese(admin, planId, parcoursId, contenuId)
  }
}

/**
 * BACK-FILL — à la création/validation d'un plan, crée les synthèses des cours DÉJÀ
 * présents dans les parcours assignés ACTIVE à la classe. Les hooks S3 (ajout de créneau /
 * assignation de classe) ne se déclenchent qu'à CES actions : un parcours monté AVANT le
 * plan n'aurait aucune synthèse. Le SPEC excluait tout back-fill (§9.3) en visant un
 * démarrage propre à la rentrée, mais un plan bâti APRÈS ses parcours est le cas réel — et
 * sans ce rattrapage la synthèse n'existe jamais (creerPlan/validerPlan ne touchaient pas
 * les parcours). Miroir de hookSyntheseAssignClasse, côté PLAN (une classe → ses parcours)
 * au lieu de côté parcours. Idempotent ; ressuscite un tombstone (upsertSynthese). Gate
 * OFF → no-op.
 */
export async function hookSyntheseBackfillPlan(admin: SupabaseClient, planId: string, classeId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  const { data: assigns } = await admin
    .from('scriptorium_parcours_classes').select('id, parcours_id').eq('classe_id', classeId).eq('statut', 'active')
  for (const a of assigns ?? []) {
    // RAG L1 : les cours de la classe sont ceux de son INSTANCE (divergence libre).
    const { data: creneaux } = await admin
      .from('scriptorium_parcours_classe_creneaux').select('contenu_id')
      .eq('parcours_classe_id', a.id as string).eq('ref_type', 'contenu')
    const contenuIds = [...new Set((creneaux ?? []).map((c) => c.contenu_id as string).filter(Boolean))]
    for (const contenuId of contenuIds) {
      if (await estCoursVivant(admin, contenuId)) await upsertSynthese(admin, planId, a.parcours_id as string, contenuId)
    }
  }
}

// ── S5 — retraits symétriques ─────────────────────────────────────────────────

/**
 * Après retrait d'un créneau-CONTENU : pour chaque classe assignée ACTIVE dont
 * l'INSTANCE ne référence plus ce cours, retirer ses synthèses (sans session →
 * soft-delete ; avec session non lancée → annule ; réalisée → intacte). RAG L1 :
 * un retrait dans le MODÈLE ne touche pas les instances → il ne retire plus rien
 * par lui-même ; le retrait effectif suivra les gestes d'instance (L3), qui
 * passeront par ce même hook. Gate OFF → no-op. À appeler APRÈS le DELETE.
 */
export async function hookSyntheseRetraitCreneau(admin: SupabaseClient, parcoursId: string, contenuId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  const { data: assigns } = await admin
    .from('scriptorium_parcours_classes').select('id, classe_id').eq('parcours_id', parcoursId).eq('statut', 'active')
  for (const a of assigns ?? []) {
    if (await instanceContientContenu(admin, a.id as string, contenuId)) continue // le cours vit encore dans cette instance
    const { data: plans } = await admin
      .from('scriptorium_plans_evaluation').select('id').eq('classe_id', a.classe_id as string).is('supprime_at', null)
    const planIds = (plans ?? []).map((p) => p.id as string)
    if (planIds.length === 0) continue
    for (const exo of await synthesesVivantes(admin, { parcoursId, contenuId, planIds })) {
      await retirerSynthese(admin, exo, 'creneau')
    }
  }
}

/**
 * Après désassignation d'une classe : annuler les synthèses non réalisées de (parcours,
 * classe) — tombstone réactivable. Gate OFF → no-op.
 */
export async function hookSyntheseRetraitClasse(admin: SupabaseClient, parcoursId: string, classeId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  const { data: plans } = await admin
    .from('scriptorium_plans_evaluation').select('id').eq('classe_id', classeId).is('supprime_at', null)
  const planIds = (plans ?? []).map((p) => p.id as string)
  if (planIds.length === 0) return
  for (const exo of await synthesesVivantes(admin, { parcoursId, planIds })) {
    await retirerSynthese(admin, exo, 'annule')
  }
}

/**
 * Après suppression d'un parcours (soft-delete + DELETE en masse des créneaux/assignations
 * qui court-circuite retirerCreneau/retirerParcoursClasse) : annuler toutes les synthèses
 * non réalisées de ce parcours (toutes classes). Sessions Codex intouchées. Gate OFF → no-op.
 * À appeler AVANT le DELETE en masse (le parcours n'est que soft-deleté → parcours_id survit).
 */
export async function hookSyntheseSuppressionParcours(admin: SupabaseClient, parcoursId: string): Promise<void> {
  if (!(await lireGatePlanActif(admin))) return
  for (const exo of await synthesesVivantes(admin, { parcoursId })) {
    await retirerSynthese(admin, exo, 'annule')
  }
}
