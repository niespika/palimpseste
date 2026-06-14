'use server'

import { after } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, classe')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id, classe: profile.classe as string | null }
}

export interface SeanceActive {
  id: string
  statut: 'phase_1' | 'phase_2' | 'fermee'
  unite_label: string
  v1_envoyee: boolean
  vf_envoyee: boolean
  statut_validation: string | null
}

// Trouver la séance la plus pertinente pour cet élève (live d'abord, puis dernière fermée)
export async function chargerSeanceActive(): Promise<SeanceActive | null> {
  const { userId, classe } = await verifierEleve()
  const admin = createAdminClient()

  // Sessions non-brouillon visibles pour cet élève (sa classe ou sans classe)
  const { data: sessions } = await admin
    .from('codex_sessions')
    .select('id, statut, classe_id, lance_at, scriptorium_unites(label)')
    .in('statut', ['phase_1', 'phase_2', 'fermee'])
    .order('lance_at', { ascending: false })
  if (!sessions || sessions.length === 0) return null

  const visibles = sessions.filter((s) => !s.classe_id || s.classe_id === classe)
  if (visibles.length === 0) return null

  // Priorité : une séance en cours, sinon la plus récente fermée
  const live = visibles.find((s) => s.statut === 'phase_1' || s.statut === 'phase_2')
  const choisie = live ?? visibles[0]

  const { data: travail } = await admin
    .from('codex_travaux')
    .select('photos_v1, photos_vf, statut_validation')
    .eq('session_id', choisie.id)
    .eq('eleve_id', userId)
    .maybeSingle()

  const u = choisie.scriptorium_unites as { label: string } | { label: string }[] | null
  const uniteLabel = Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''

  return {
    id: choisie.id,
    statut: choisie.statut as 'phase_1' | 'phase_2' | 'fermee',
    unite_label: uniteLabel,
    v1_envoyee: (travail?.photos_v1?.length ?? 0) > 0,
    vf_envoyee: (travail?.photos_vf?.length ?? 0) > 0,
    statut_validation: travail?.statut_validation ?? null,
  }
}

export interface SeancePassee {
  id: string
  unite_label: string
  validee: boolean
}

// Historique des séances fermées visibles par l'élève (trace durable)
export async function chargerHistorique(): Promise<SeancePassee[]> {
  const { userId, classe } = await verifierEleve()
  const admin = createAdminClient()

  const { data: sessions } = await admin
    .from('codex_sessions')
    .select('id, classe_id, lance_at, scriptorium_unites(label)')
    .eq('statut', 'fermee')
    .order('lance_at', { ascending: false })

  const visibles = (sessions ?? []).filter((s) => !s.classe_id || s.classe_id === classe)
  if (visibles.length === 0) return []

  const { data: travaux } = await admin
    .from('codex_travaux')
    .select('session_id, statut_validation')
    .eq('eleve_id', userId)
    .in('session_id', visibles.map((s) => s.id))

  const validMap: Record<string, boolean> = {}
  for (const t of travaux ?? []) validMap[t.session_id] = t.statut_validation === 'valide'

  return visibles.map((s) => {
    const u = s.scriptorium_unites as { label: string } | { label: string }[] | null
    return {
      id: s.id,
      unite_label: Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? '',
      validee: validMap[s.id] ?? false,
    }
  })
}

// ── Écriture / photos ────────────────────────────────────────────────────────

type Phase = 'v1' | 'vf'

const PHASE_REQUISE: Record<Phase, string> = { v1: 'phase_1', vf: 'phase_2' }

// S'assurer que le travail existe et que la séance est dans la bonne phase
async function getTravail(sessionId: string, phase: Phase) {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()

  const { data: seance } = await admin
    .from('codex_sessions')
    .select('statut')
    .eq('id', sessionId)
    .single()

  if (!seance) return { error: 'Séance introuvable' as const }
  if (seance.statut !== PHASE_REQUISE[phase]) {
    return { error: 'Cette phase n\'est pas ouverte.' as const }
  }

  let { data: travail } = await admin
    .from('codex_travaux')
    .select('id')
    .eq('session_id', sessionId)
    .eq('eleve_id', userId)
    .maybeSingle()

  if (!travail) {
    const { data, error } = await admin
      .from('codex_travaux')
      .insert({ session_id: sessionId, eleve_id: userId })
      .select('id')
      .single()
    if (error || !data) return { error: error?.message ?? 'Erreur création travail' as const }
    travail = data
  }

  return { travailId: travail.id, userId, admin }
}

// Préparer les URLs d'upload signées (efface les photos précédentes de la phase)
export async function creerUploadsPhotos(sessionId: string, phase: Phase, nb: number) {
  const ctx = await getTravail(sessionId, phase)
  if ('error' in ctx) return { error: ctx.error, data: null }
  const { userId, admin } = ctx

  // Effacer les anciennes photos de cette phase
  const prefix = `${userId}/${sessionId}/${phase}`
  const { data: existants } = await admin.storage.from('codex').list(prefix)
  if (existants && existants.length > 0) {
    await admin.storage.from('codex').remove(existants.map((f) => `${prefix}/${f.name}`))
  }

  const uploads: { path: string; token: string }[] = []
  for (let i = 1; i <= nb; i++) {
    const storagePath = `${prefix}/${i}.jpg`
    const { data: urlData, error } = await admin.storage.from('codex').createSignedUploadUrl(storagePath)
    if (error || !urlData) return { error: error?.message ?? 'Erreur URL', data: null }
    uploads.push({ path: urlData.path, token: urlData.token })
  }

  return { data: { uploads }, error: null }
}

// Confirmer l'envoi : enregistre les chemins et déclenche l'analyse en arrière-plan
export async function confirmerEnvoiPhotos(sessionId: string, phase: Phase, paths: string[]) {
  const ctx = await getTravail(sessionId, phase)
  if ('error' in ctx) return { error: ctx.error }
  const { travailId, admin } = ctx

  const colPhotos = phase === 'v1' ? 'photos_v1' : 'photos_vf'
  const colStatut = phase === 'v1' ? 'analyse_v1_statut' : 'analyse_vf_statut'

  const { error } = await admin
    .from('codex_travaux')
    .update({ [colPhotos]: paths, [colStatut]: 'en_cours' })
    .eq('id', travailId)

  if (error) return { error: error.message }

  after(async () => {
    const mod = await import('@/utils/codex-analyse')
    if (phase === 'v1') await mod.analyserV1(travailId)
    else await mod.analyserVF(travailId)
  })

  return { success: true }
}

// Réinitialiser les photos d'une phase (recommencer)
export async function reinitialiserPhotos(sessionId: string, phase: Phase) {
  const ctx = await getTravail(sessionId, phase)
  if ('error' in ctx) return { error: ctx.error }
  const { travailId, userId, admin } = ctx

  const prefix = `${userId}/${sessionId}/${phase}`
  const { data: existants } = await admin.storage.from('codex').list(prefix)
  if (existants && existants.length > 0) {
    await admin.storage.from('codex').remove(existants.map((f) => `${prefix}/${f.name}`))
  }

  const colPhotos = phase === 'v1' ? 'photos_v1' : 'photos_vf'
  const colStatut = phase === 'v1' ? 'analyse_v1_statut' : 'analyse_vf_statut'

  await admin
    .from('codex_travaux')
    .update({ [colPhotos]: [], [colStatut]: 'vide' })
    .eq('id', travailId)

  return { success: true }
}

export interface SuggestionsV1 {
  oublis: { titre: string; detail: string }[]
  erreurs: { type: 'factuelle' | 'ambiguite'; titre: string; detail: string }[]
  ortho: string | null
}

export interface EtatTravail {
  photos_v1_count: number
  photos_vf_count: number
  analyse_v1_statut: string
  analyse_vf_statut: string
  suggestions_v1: SuggestionsV1 | null
}

// État du travail de l'élève (pour le polling pendant l'analyse)
export async function chargerEtatTravail(sessionId: string): Promise<EtatTravail> {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()

  const { data: t } = await admin
    .from('codex_travaux')
    .select('photos_v1, photos_vf, analyse_v1_statut, analyse_vf_statut, suggestions_v1')
    .eq('session_id', sessionId)
    .eq('eleve_id', userId)
    .maybeSingle()

  return {
    photos_v1_count: t?.photos_v1?.length ?? 0,
    photos_vf_count: t?.photos_vf?.length ?? 0,
    analyse_v1_statut: t?.analyse_v1_statut ?? 'vide',
    analyse_vf_statut: t?.analyse_vf_statut ?? 'vide',
    suggestions_v1: (t?.suggestions_v1 as SuggestionsV1 | null) ?? null,
  }
}

export interface TraceCodex {
  erreurs_corrections: { concept_tag: string; description: string; correction: string }[]
  synthese_completee: string | null
}

// Trace validée (consultable par l'élève après validation prof)
export async function chargerTrace(sessionId: string): Promise<TraceCodex | null> {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()

  const { data: t } = await admin
    .from('codex_travaux')
    .select('statut_validation, retour_critique, synthese_completee')
    .eq('session_id', sessionId)
    .eq('eleve_id', userId)
    .maybeSingle()

  if (!t || t.statut_validation !== 'valide') return null

  const retour = (t.retour_critique as { erreurs_corrections?: TraceCodex['erreurs_corrections'] } | null) ?? null
  return {
    erreurs_corrections: retour?.erreurs_corrections ?? [],
    synthese_completee: t.synthese_completee ?? null,
  }
}
