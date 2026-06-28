'use server'

import { createClient } from '@/utils/supabase/server'

// Définit le mot de passe de l'élève en cours de finalisation. La session a été
// posée par /auth/confirm (verifyOtp) ; on agit sur l'utilisateur courant.
export async function definirMotDePasse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Session expirée. Redemande une invitation à ton enseignant.' }

  const mdp = formData.get('motDePasse') as string
  if (!mdp || mdp.length < 8) return { error: 'Le mot de passe doit faire au moins 8 caractères.' }
  if (mdp.length > 64) return { error: 'Le mot de passe est trop long (64 caractères maximum).' }

  const { error } = await supabase.auth.updateUser({ password: mdp })
  if (error) {
    console.error('[finaliser] updateUser échec :', error.message)
    return { error: 'Impossible de définir le mot de passe. Réessaie.' }
  }

  return { success: true }
}
