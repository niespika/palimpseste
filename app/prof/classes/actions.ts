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

export async function creerClasse(formData: FormData) {
  const supabase = await verifierProf()
  const nom = (formData.get('nom') as string)?.trim()
  const niveau = (formData.get('niveau') as string) || null
  const filiere = (formData.get('filiere') as string) || null
  const annee = (formData.get('annee_scolaire') as string)?.trim()

  if (!nom || !annee) return { error: 'Nom et année scolaire sont requis.' }

  const { error } = await supabase
    .from('classes')
    .insert({ nom, niveau, filiere, annee_scolaire: annee })

  if (error) return { error: error.message }
  revalidatePath('/prof/classes')
  return { success: true }
}

export async function supprimerClasse(formData: FormData) {
  // NB : le Lot 2 durcira l'effacement (confirmations multiples, purge propre du
  // travail + nettoyage Scriptorium). Ici, suppression simple de l'entité.
  const supabase = await verifierProf()
  const id = formData.get('id') as string
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/classes')
  return { success: true }
}

export async function inscrireEleve(formData: FormData) {
  const supabase = await verifierProf()
  const classeId = formData.get('classeId') as string
  const eleveId = formData.get('eleveId') as string
  if (!eleveId) return { error: 'Sélectionne un élève.' }

  const { error } = await supabase
    .from('inscriptions')
    .upsert(
      { eleve_id: eleveId, classe_id: classeId, statut: 'active' },
      { onConflict: 'eleve_id,classe_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/prof/classes')
  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function retirerEleve(formData: FormData) {
  // NB : le Lot 2 tranchera « retrait du roster » vs « purge du travail ».
  // Ici on supprime l'inscription (le travail rattaché part en cascade côté SQL).
  const supabase = await verifierProf()
  const classeId = formData.get('classeId') as string
  const eleveId = formData.get('eleveId') as string

  const { error } = await supabase
    .from('inscriptions')
    .delete()
    .eq('classe_id', classeId)
    .eq('eleve_id', eleveId)

  if (error) return { error: error.message }
  revalidatePath('/prof/classes')
  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function definirModulesClasse(formData: FormData) {
  const supabase = await verifierProf()
  const classeId = formData.get('classeId') as string
  const moduleIds = formData.getAll('moduleIds') as string[]

  const { data: existants } = await supabase
    .from('classe_modules')
    .select('module_id')
    .eq('classe_id', classeId)

  const existantsIds = (existants ?? []).map((r) => r.module_id as string)
  const aAjouter = moduleIds.filter((id) => !existantsIds.includes(id))
  const aSupprimer = existantsIds.filter((id) => !moduleIds.includes(id))

  if (aAjouter.length > 0) {
    await supabase
      .from('classe_modules')
      .insert(aAjouter.map((module_id) => ({ classe_id: classeId, module_id })))
  }
  if (aSupprimer.length > 0) {
    await supabase
      .from('classe_modules')
      .delete()
      .eq('classe_id', classeId)
      .in('module_id', aSupprimer)
  }

  revalidatePath('/prof/classes')
  revalidatePath('/prof/modules')
  return { success: true }
}
