'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { PROMPT_FEEDBACK_1_DEFAUT, PROMPT_FEEDBACK_2_DEFAUT } from '@/utils/aletheia-retours'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
}

export async function lirePromptsAletheia(): Promise<{ prompt_feedback_1: string | null; prompt_feedback_2: string | null }> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.from('aletheia_params').select('prompt_feedback_1, prompt_feedback_2').eq('id', 1).maybeSingle()
  return {
    prompt_feedback_1: data?.prompt_feedback_1 ?? null,
    prompt_feedback_2: data?.prompt_feedback_2 ?? null,
  }
}

// Si le prof enregistre un prompt par défaut inchangé, on stocke null → le code
// continue d'utiliser le défaut (et bénéficie de ses évolutions futures).
const nullSiDefaut = (valeur: string, defaut: string): string | null =>
  valeur.trim() && valeur.trim() !== defaut.trim() ? valeur : null

export async function sauvegarderPromptsAletheia(promptFeedback1: string, promptFeedback2: string) {
  await verifierProf()
  const p2 = nullSiDefaut(promptFeedback2, PROMPT_FEEDBACK_2_DEFAUT)
  // Le retour 2 reçoit le livre ENTIER : la variable {semaine_courante_N} est la
  // limite de divulgation. Un prompt personnalisé qui la perd ferait fuiter l'aval.
  if (p2 !== null && !p2.includes('{semaine_courante_N}')) {
    return { error: 'Le prompt du retour 2 doit garder la variable {semaine_courante_N} (limite de divulgation : le livre entier est envoyé au modèle). Ajoute-la avant d\'enregistrer.' }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('aletheia_params')
    .upsert({
      id: 1,
      prompt_feedback_1: nullSiDefaut(promptFeedback1, PROMPT_FEEDBACK_1_DEFAUT),
      prompt_feedback_2: p2,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/aletheia')
  return { success: true }
}
