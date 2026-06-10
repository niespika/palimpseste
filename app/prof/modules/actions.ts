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

export async function sauvegarderAssignments(formData: FormData) {
  const supabase = await verifierProf()
  const moduleId = formData.get('moduleId') as string
  const eleveIdsCoches = formData.getAll('eleveIds') as string[]

  // Récupérer les assignments existants pour ce module
  const { data: existants } = await supabase
    .from('module_assignments')
    .select('id, eleve_id')
    .eq('module_id', moduleId)

  const existantsIds = existants?.map(a => a.eleve_id) ?? []

  // Ajouter les nouveaux
  const aAjouter = eleveIdsCoches.filter(id => !existantsIds.includes(id))
  if (aAjouter.length > 0) {
    await supabase.from('module_assignments').insert(
      aAjouter.map(eleveId => ({ eleve_id: eleveId, module_id: moduleId }))
    )
  }

  // Supprimer ceux décochés
  const aSupprimer = existantsIds.filter(id => !eleveIdsCoches.includes(id))
  if (aSupprimer.length > 0) {
    await supabase
      .from('module_assignments')
      .delete()
      .eq('module_id', moduleId)
      .in('eleve_id', aSupprimer)
  }

  revalidatePath('/prof/modules')
  revalidatePath('/prof/eleves')
  return { success: true }
}
