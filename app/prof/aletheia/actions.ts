'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { PROMPT_FEEDBACK_1_DEFAUT } from '@/utils/aletheia-retours'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
}

export async function lirePromptsAletheia(): Promise<{ prompt_feedback_1: string | null }> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.from('aletheia_params').select('prompt_feedback_1').eq('id', 1).maybeSingle()
  return { prompt_feedback_1: data?.prompt_feedback_1 ?? null }
}

export async function sauvegarderPromptsAletheia(promptFeedback1: string) {
  await verifierProf()
  const admin = createAdminClient()
  // Si le prof enregistre le prompt par défaut inchangé, on stocke null → le code
  // continue d'utiliser le défaut (et bénéficie de ses évolutions futures).
  const valeur = promptFeedback1.trim() && promptFeedback1.trim() !== PROMPT_FEEDBACK_1_DEFAUT.trim()
    ? promptFeedback1
    : null
  const { error } = await admin
    .from('aletheia_params')
    .upsert({ id: 1, prompt_feedback_1: valeur, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/aletheia')
  return { success: true }
}
