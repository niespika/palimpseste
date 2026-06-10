'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

// Vérifier que l'appelant est bien le prof
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
}

export async function creerEleve(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const email = formData.get('email') as string
  const motDePasse = formData.get('motDePasse') as string
  const displayName = formData.get('displayName') as string
  const classe = formData.get('classe') as string

  const { data: { user: nouvelUtilisateur }, error } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  })

  if (error) return { error: `Impossible de créer le compte : ${error.message}` }
  if (!nouvelUtilisateur) return { error: 'Utilisateur créé mais introuvable.' }

  // Créer le profil manuellement (plus fiable que le trigger)
  const { error: profilError } = await admin.from('profiles').insert({
    id: nouvelUtilisateur.id,
    role: 'eleve',
    display_name: displayName,
    classe: classe || null,
  })

  if (profilError) return { error: `Compte créé mais profil impossible : ${profilError.message}` }

  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function modifierEleve(formData: FormData) {
  await verifierProf()

  const supabase = await createClient()
  const id = formData.get('id') as string
  const displayName = formData.get('displayName') as string
  const classe = formData.get('classe') as string

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, classe: classe || null })
    .eq('id', id)

  if (error) return { error: `Impossible de modifier : ${error.message}` }

  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function reinitialiserMotDePasse(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const id = formData.get('id') as string
  const nouveauMotDePasse = formData.get('nouveauMotDePasse') as string

  const { error } = await admin.auth.admin.updateUserById(id, {
    password: nouveauMotDePasse,
  })

  if (error) return { error: `Impossible de réinitialiser : ${error.message}` }

  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function supprimerEleve(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const id = formData.get('id') as string

  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) return { error: `Impossible de supprimer : ${error.message}` }

  revalidatePath('/prof/eleves')
  return { success: true }
}
