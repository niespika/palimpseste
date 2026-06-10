'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Identifiants incorrects. Vérifie ton adresse et ton mot de passe.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Erreur de connexion. Réessaie.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'prof') redirect('/prof')
  else redirect('/eleve')
}
