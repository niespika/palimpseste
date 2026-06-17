'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { COOKIE_CLASSE_ELEVE } from './contexte-classe'

export async function deconnexion() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// Commutateur de contexte de classe (élève bi-classe). Mémorise l'inscription
// active ; scope toute l'expérience élève.
export async function definirClasseEleve(inscriptionId: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_CLASSE_ELEVE, inscriptionId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/eleve', 'layout')
  return { success: true }
}
