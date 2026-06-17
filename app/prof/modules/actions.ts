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

// Accès au niveau CLASSE (Lot 4). Granularité classe uniquement — aucun réglage
// par élève (l'accès bi-classe = union, dérivé du Lot 1).
export async function accorderAccesClasse(formData: FormData) {
  const supabase = await verifierProf()
  const moduleId = formData.get('moduleId') as string
  const classeId = formData.get('classeId') as string
  if (!classeId) return { error: 'Sélectionne une classe.' }

  const { error } = await supabase
    .from('classe_modules')
    .upsert({ module_id: moduleId, classe_id: classeId }, { onConflict: 'classe_id,module_id' })

  if (error) return { error: error.message }
  revalidatePath('/prof/modules')
  revalidatePath('/prof/classes')
  return { success: true }
}

export async function retirerAccesClasse(formData: FormData) {
  const supabase = await verifierProf()
  const moduleId = formData.get('moduleId') as string
  const classeId = formData.get('classeId') as string

  const { error } = await supabase
    .from('classe_modules')
    .delete()
    .eq('module_id', moduleId)
    .eq('classe_id', classeId)

  if (error) return { error: error.message }
  revalidatePath('/prof/modules')
  revalidatePath('/prof/classes')
  return { success: true }
}
