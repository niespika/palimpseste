'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { genererMotDePasse } from '@/utils/password'
import { envoyerInvitationEleve } from '@/utils/email'

type Admin = ReturnType<typeof createAdminClient>

// Génère un lien sécurisé (recovery) et l'envoie par courriel. Le compte existe
// déjà (créé avec un MDP interne) : l'élève choisira le sien via /finaliser-inscription.
async function envoyerInvitation(admin: Admin, email: string, displayName: string): Promise<{ error?: string }> {
  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'recovery', email })
  const tokenHash = lien?.properties?.hashed_token
  if (error || !tokenHash) {
    console.error('[eleves] generateLink échec :', error?.message)
    return { error: "Lien d'invitation impossible à générer." }
  }
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const url = `${base}/auth/confirm?token_hash=${tokenHash}&type=recovery&next=${encodeURIComponent('/finaliser-inscription')}`
  try {
    await envoyerInvitationEleve({ email, displayName, lien: url })
    return {}
  } catch (e) {
    console.error('[eleves] envoi invitation échec :', e instanceof Error ? e.message : e)
    return { error: "Compte prêt, mais le courriel d'invitation n'a pas pu être envoyé (config Resend ?)." }
  }
}

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

// La cible d'une action « élève » doit être un profil role='eleve'. Le client
// admin ignore la RLS : sans cette garde, un id forgé pointant un autre prof
// pourrait être modifié / réinitialisé / supprimé.
async function cibleEstEleve(admin: Admin, id: string): Promise<boolean> {
  if (!id) return false
  const { data } = await admin.from('profiles').select('role').eq('id', id).maybeSingle()
  return data?.role === 'eleve'
}

// Borne et nettoie un nom affiché (retire les caractères de contrôle, limite la
// longueur). charCodeAt évite d'écrire des octets de contrôle dans le source.
function nettoyerNom(s: string): string {
  return Array.from(s ?? '')
    .filter((ch) => { const c = ch.charCodeAt(0); return c >= 32 && c !== 127 })
    .join('')
    .trim()
    .slice(0, 120)
}

// Traduit en français les erreurs courantes de Supabase Auth ; pour le reste,
// journalise le détail côté serveur et renvoie un libellé générique (pas de
// fuite de message brut au client).
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
  if (message) console.error('[eleves] erreur auth non mappée :', message)
  return 'Création du compte impossible.'
}

export async function creerEleve(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const email = (formData.get('email') as string)?.trim()
  const motDePasse = formData.get('motDePasse') as string
  const displayName = nettoyerNom(formData.get('displayName') as string)

  const { data: { user: nouvelUtilisateur }, error } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
  })

  if (error) return { error: messageErreurAuth(error.message) }
  if (!nouvelUtilisateur) return { error: 'Utilisateur créé mais introuvable.' }

  // Créer le profil manuellement (plus fiable que le trigger).
  // L'inscription en classe se fait ensuite via le tableau / l'onglet Classes.
  const { error: profilError } = await admin.from('profiles').insert({
    id: nouvelUtilisateur.id,
    role: 'eleve',
    display_name: displayName,
  })

  if (profilError) {
    console.error('[eleves] insert profil échec (creerEleve) :', profilError.message)
    // Rollback : ne pas laisser un compte Auth orphelin (invisible + email bloqué).
    await admin.auth.admin.deleteUser(nouvelUtilisateur.id)
    return { error: 'Compte non créé (profil impossible). Réessaie.' }
  }

  revalidatePath('/prof/eleves')
  return { success: true }
}

// Création « invitation » : compte avec MDP interne (jamais montré) + courriel
// pour que l'élève choisisse son mot de passe. Renvoie un avertissement non
// bloquant si le compte est créé mais l'email échoue (renvoi possible ensuite).
export async function creerEleveEtInviter(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const email = (formData.get('email') as string)?.trim()
  const displayName = nettoyerNom(formData.get('displayName') as string)

  const { data: { user }, error } = await admin.auth.admin.createUser({
    email,
    password: genererMotDePasse(),
    email_confirm: true,
  })
  if (error) return { error: messageErreurAuth(error.message) }
  if (!user) return { error: 'Utilisateur créé mais introuvable.' }

  const { error: profilError } = await admin.from('profiles').insert({
    id: user.id,
    role: 'eleve',
    display_name: displayName,
  })
  if (profilError) {
    console.error('[eleves] insert profil échec (creerEleveEtInviter) :', profilError.message)
    await admin.auth.admin.deleteUser(user.id)
    return { error: 'Compte non créé (profil impossible). Réessaie.' }
  }

  const envoi = await envoyerInvitation(admin, email!, displayName)
  revalidatePath('/prof/eleves')
  if (envoi.error) return { success: true, avertissement: envoi.error }
  return { success: true }
}

// (Re)envoie l'invitation à un élève existant (par id).
export async function renvoyerInvitation(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const id = formData.get('id') as string
  if (!(await cibleEstEleve(admin, id))) return { error: 'Compte introuvable.' }

  const { data: u } = await admin.auth.admin.getUserById(id)
  const email = u?.user?.email
  if (!email) return { error: 'Adresse courriel introuvable.' }

  const { data: profil } = await admin.from('profiles').select('display_name').eq('id', id).maybeSingle()
  const envoi = await envoyerInvitation(admin, email, (profil?.display_name as string) ?? '')
  if (envoi.error) return { error: envoi.error }
  return { success: true }
}

export async function modifierEleve(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const id = formData.get('id') as string
  const displayName = nettoyerNom(formData.get('displayName') as string)

  if (!(await cibleEstEleve(admin, id))) return { error: 'Compte introuvable.' }
  if (!displayName) return { error: 'Le nom ne peut pas être vide.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', id)

  if (error) {
    console.error('[eleves] modif échec :', error.message)
    return { error: 'Modification impossible.' }
  }

  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function reinitialiserMotDePasse(formData: FormData) {
  await verifierProf()

  const admin = createAdminClient()
  const id = formData.get('id') as string
  const nouveauMotDePasse = formData.get('nouveauMotDePasse') as string

  if (!(await cibleEstEleve(admin, id))) return { error: 'Compte introuvable.' }

  const { error } = await admin.auth.admin.updateUserById(id, {
    password: nouveauMotDePasse,
  })

  if (error) {
    console.error('[eleves] reset MDP échec :', error.message)
    return { error: messageErreurAuth(error.message) }
  }

  revalidatePath('/prof/eleves')
  return { success: true }
}

export type LigneImport = { nom: string; prenom: string; email: string }
export type ResultatImport = {
  crees: number
  echecs: { ligne: number; email: string; raison: string }[]
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_IMPORT = 500

// Import en masse depuis un CSV (parsé côté client). Chaque ligne → compte +
// profil. Le mot de passe est interne (jamais affiché) : l'élève sera activé
// par l'invitation (lien sécurisé) ou par un mot de passe défini à la main.
export async function importerEleves(lignes: LigneImport[]): Promise<ResultatImport> {
  await verifierProf()
  if (!Array.isArray(lignes)) return { crees: 0, echecs: [] }
  if (lignes.length > MAX_IMPORT) {
    return { crees: 0, echecs: [{ ligne: 0, email: '', raison: `Import trop volumineux (max ${MAX_IMPORT} lignes par envoi).` }] }
  }

  const admin = createAdminClient()
  const echecs: ResultatImport['echecs'] = []
  let crees = 0
  const vus = new Set<string>()

  for (let i = 0; i < lignes.length; i++) {
    const numero = i + 1
    const email = (lignes[i]?.email ?? '').trim().toLowerCase()
    const prenom = (lignes[i]?.prenom ?? '').trim()
    const nom = (lignes[i]?.nom ?? '').trim()
    const displayName = nettoyerNom([prenom, nom].filter(Boolean).join(' '))

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
      console.error('[eleves] insert profil échec (import) :', profilError.message)
      // Rollback : éviter un compte Auth orphelin qui bloquerait le réimport.
      await admin.auth.admin.deleteUser(nouvel.id)
      echecs.push({ ligne: numero, email, raison: 'Compte non créé (profil impossible).' })
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

  if (!(await cibleEstEleve(admin, id))) return { error: 'Compte introuvable.' }

  const { error } = await admin.auth.admin.deleteUser(id)

  if (error) {
    console.error('[eleves] suppression échec :', error.message)
    return { error: 'Suppression impossible.' }
  }

  revalidatePath('/prof/eleves')
  return { success: true }
}
