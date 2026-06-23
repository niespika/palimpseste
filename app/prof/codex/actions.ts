'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// Lire les unités du Scriptorium (contrat de lecture)
export async function lireUnitesScriptorium() {
  const { supabase } = await verifierProf()
  const { data: unites } = await supabase
    .from('scriptorium_unites')
    .select('id, label, classe, ordre')
    .eq('type', 'unite')   // exclut les « livres » Aletheia des unités de cours
    .order('ordre', { ascending: true })
  return unites ?? []
}

// Créer une synthèse (classe × unité) en brouillon
export async function creerSynthese(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const uniteId = formData.get('scriptorium_unite_id') as string
  const classeId = (formData.get('classe_id') as string) || null
  const dureeMin = parseInt(formData.get('duree_phase_min') as string) || 25

  if (!uniteId) return { error: 'Choisis une unité du Scriptorium.' }

  const { error } = await supabase.from('codex_sessions').insert({
    scriptorium_unite_id: uniteId,
    classe_id: classeId,
    duree_phase_min: dureeMin,
    statut: 'brouillon',
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath('/prof/codex')
  return { success: true }
}

export async function supprimerSynthese(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('codex_sessions')
    .delete()
    .eq('id', id)
    .eq('statut', 'brouillon')

  if (error) return { error: error.message }
  revalidatePath('/prof/codex')
  return { success: true }
}

// Lancer la synthèse : brouillon → phase_1 (V1)
export async function lancerSynthese(formData: FormData) {
  const { supabase } = await verifierProf()
  const sessionId = formData.get('sessionId') as string

  const { data: session } = await supabase
    .from('codex_sessions')
    .select('duree_phase_min, statut')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Synthèse introuvable' }
  if (session.statut !== 'brouillon') return { error: 'La synthèse est déjà lancée.' }

  const maintenant = new Date()
  const finPhase = new Date(maintenant.getTime() + session.duree_phase_min * 60 * 1000)

  const { error } = await supabase
    .from('codex_sessions')
    .update({
      statut: 'phase_1',
      lance_at: maintenant.toISOString(),
      phase_courante_fin_at: finPhase.toISOString(),
    })
    .eq('id', sessionId)
    .eq('statut', 'brouillon')

  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/synthese/${sessionId}`)
  return { success: true }
}

// Passer en phase_2 (V-finale)
export async function passerPhase2(formData: FormData) {
  const { supabase } = await verifierProf()
  const sessionId = formData.get('sessionId') as string

  const { data: session } = await supabase
    .from('codex_sessions')
    .select('duree_phase_min, statut')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Synthèse introuvable' }
  if (session.statut !== 'phase_1') return { error: 'La synthèse n\'est pas en phase 1.' }

  const maintenant = new Date()
  const finPhase = new Date(maintenant.getTime() + session.duree_phase_min * 60 * 1000)

  const { error } = await supabase
    .from('codex_sessions')
    .update({
      statut: 'phase_2',
      phase_2_at: maintenant.toISOString(),
      phase_courante_fin_at: finPhase.toISOString(),
    })
    .eq('id', sessionId)
    .eq('statut', 'phase_1')

  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/synthese/${sessionId}`)
  return { success: true }
}

// Fermer la synthèse
export async function fermerSynthese(formData: FormData) {
  const { supabase } = await verifierProf()
  const sessionId = formData.get('sessionId') as string

  const { error } = await supabase
    .from('codex_sessions')
    .update({
      statut: 'fermee',
      ferme_at: new Date().toISOString(),
      phase_courante_fin_at: null,
    })
    .eq('id', sessionId)
    .in('statut', ['phase_1', 'phase_2'])

  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/synthese/${sessionId}`)
  revalidatePath('/prof/codex')
  return { success: true }
}
