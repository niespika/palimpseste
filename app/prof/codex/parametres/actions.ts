'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
}

export async function lirePromptsCodex(): Promise<{ prompt_suggestions_v1: string | null; prompt_retour_vf: string | null }> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin
    .from('codex_params')
    .select('prompt_suggestions_v1, prompt_retour_vf')
    .eq('id', 1)
    .maybeSingle()
  return {
    prompt_suggestions_v1: data?.prompt_suggestions_v1 ?? null,
    prompt_retour_vf: data?.prompt_retour_vf ?? null,
  }
}

export async function sauvegarderPromptsCodex(promptV1: string, promptVf: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('codex_params')
    .upsert({ id: 1, prompt_suggestions_v1: promptV1 || null, prompt_retour_vf: promptVf || null }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/codex/parametres')
  return { success: true }
}
