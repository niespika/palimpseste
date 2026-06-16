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
  return supabase
}

export async function toggleModuleActif(formData: FormData) {
  const supabase = await verifierProf()
  const moduleId = formData.get('moduleId') as string
  const actifActuel = formData.get('actif') === 'true'

  const { error } = await supabase
    .from('modules')
    .update({ actif: !actifActuel })
    .eq('id', moduleId)

  if (error) return { error: error.message }
  revalidatePath('/prof/modules')
  return { success: true }
}

// L'accès aux modules se gère désormais par classe (voir app/prof/classes).
