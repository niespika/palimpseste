'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { genererMotDePasse } from '@/utils/password'

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

// Traduit en français les erreurs courantes de Supabase Auth (messages anglais).
function messageErreurAuth(message: string | undefined | null): string {
  const m = (message ?? '').toLowerCase()
  if (m.includes('already been registered') || m.includes('already registered')) {
    return 'Adresse courriel déjà utilisée.'
  }
  if (m.includes('password') && m.includes('least')) {
    return 'Mot de passe trop court (8 caractères minimum).'
  }
  if (m.includes('unable to validate email') || (m.includes('invalid') && m.includes('email'))) {
    return 'Adresse courriel invalide.'
  }
  return message?.trim() || 'Création du compte impossible.'
}

export async function creerEleve(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const email = formData.get('email') as string
  const motDePasse = formData.get('motDePasse') as string
  const displayName = formData.get('displayName') as string

  const { data: { user: nouvelUtilisateur }, error } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  })

  if (error) return { error: messageErreurAuth(error.message) }
  if (!nouvelUtilisateur) return { error: 'Utilisateur créé mais introuvable.' }

  // Créer le profil manuellement (plus fiable que le trigger).
  // L'inscription en classe se fait ensuite via /prof/classes.
  const { error: profilError } = await admin.from('profiles').insert({
    id: nouvelUtilisateur.id,
    role: 'eleve',
    display_name: displayName,
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

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
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

export type LigneImport = { nom: string; prenom: string; email: string }
export type ResultatImport = {
  crees: number
  echecs: { ligne: number; email: string; raison: string }[]
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Import en masse depuis un CSV (parsé côté client). Chaque ligne → compte +
// profil. Le mot de passe est interne (jamais affiché) : l'élève sera activé
// par l'invitation (lien sécurisé) ou par un mot de passe défini à la main.
export async function importerEleves(lignes: LigneImport[]): Promise<ResultatImport> {
  await verifierProf()
  const admin = createAdminClient()

  const echecs: ResultatImport['echecs'] = []
  let crees = 0
  const vus = new Set<string>()

  for (let i = 0; i < lignes.length; i++) {
    const numero = i + 1
    const email = (lignes[i]?.email ?? '').trim().toLowerCase()
    const prenom = (lignes[i]?.prenom ?? '').trim()
    const nom = (lignes[i]?.nom ?? '').trim()
    const displayName = [prenom, nom].filter(Boolean).join(' ')

    if (!email || !EMAIL_REGEX.test(email)) {
      echecs.push({ ligne: numero, email: email || '(vide)', raison: 'Adresse courriel invalide.' })
      continue
    }
    if (!displayName) {
      echecs.push({ ligne: numero, email, raison: 'Prénom et nom manquants.' })
      continue
    }
    if (vus.has(email)) {
      echecs.push({ ligne: numero, email, raison: 'Doublon dans le fichier.' })
      continue
    }
    vus.add(email)

    const { data: { user: nouvel }, error } = await admin.auth.admin.createUser({
      email,
      password: genererMotDePasse(),
      email_confirm: true,
    })
    if (error || !nouvel) {
      echecs.push({ ligne: numero, email, raison: messageErreurAuth(error?.message) })
      continue
    }

    const { error: profilError } = await admin.from('profiles').insert({
      id: nouvel.id,
      role: 'eleve',
      display_name: displayName,
    })
    if (profilError) {
      echecs.push({ ligne: numero, email, raison: `Compte créé mais profil impossible : ${profilError.message}` })
      continue
    }

    crees++
  }

  revalidatePath('/prof/eleves')
  return { crees, echecs }
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
