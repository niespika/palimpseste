'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { collecterCheminsInscriptions, retirerFichiers } from '@/utils/effacement'

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

// Effacement DÉFINITIF d'une classe (Lot 2). Friction côté UI (3 étapes) + ici
// défense en profondeur : le nom retapé doit correspondre. Purge complète :
// travail élève scopé SUPPRIMÉ, contenu prof DÉTACHÉ, comptes intacts.
export async function effacerClasse(formData: FormData) {
  await verifierProf()
  const admin = createAdminClient()
  const id = formData.get('id') as string
  const confirmation = ((formData.get('confirmation') as string) ?? '').trim()

  const { data: classe } = await admin.from('classes').select('id, nom').eq('id', id).single()
  if (!classe) return { error: 'Classe introuvable.' }
  if (confirmation !== classe.nom) return { error: 'Le nom saisi ne correspond pas à la classe.' }

  // Inscriptions de la classe (tous statuts)
  const { data: inscriptions } = await admin
    .from('inscriptions').select('id').eq('classe_id', id)
  const inscriptionIds = (inscriptions ?? []).map((i) => i.id as string)

  // 1. Collecter les chemins de stockage AVANT la suppression des lignes
  const chemins = await collecterCheminsInscriptions(admin, inscriptionIds)

  // 2. Effacement DB atomique (transaction Postgres)
  const { error } = await admin.rpc('effacer_classe', { p_classe_id: id })
  if (error) return { error: error.message }

  // 3. Purge du stockage (après succès DB)
  await retirerFichiers(admin, chemins)

  revalidatePath('/prof/classes')
  revalidatePath('/prof')
  return { success: true }
}

// Écartement persistant d'un rappel de fin d'année (« cette classe continue »).
export async function ecarterRappelClasse(formData: FormData) {
  const supabase = await verifierProf()
  const id = formData.get('id') as string
  const { error } = await supabase.from('classes').update({ rappel_ecarte: true }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof')
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
  revalidatePath('/prof/classes/[classeId]', 'page')
  revalidatePath('/prof/eleves')
  return { success: true }
}

// Retrait DUR d'un élève (décision Lot 2) : supprime son inscription + tout son
// travail scopé sur CETTE classe (+ notes de semestre, journal, fichiers), sans
// toucher au compte ni à ses autres classes.
export async function retirerEleve(formData: FormData) {
  await verifierProf()
  const admin = createAdminClient()
  const classeId = formData.get('classeId') as string
  const eleveId = formData.get('eleveId') as string

  const { data: insc } = await admin
    .from('inscriptions')
    .select('id')
    .eq('classe_id', classeId)
    .eq('eleve_id', eleveId)
    .maybeSingle()
  if (!insc) {
    revalidatePath('/prof/classes')
    return { success: true }
  }

  // 1. Collecter les chemins de stockage avant la suppression
  const chemins = await collecterCheminsInscriptions(admin, [insc.id as string])

  // 2. Retrait DB atomique (cascade le travail scopé sur cette inscription)
  const { error } = await admin.rpc('retirer_inscription', { p_inscription_id: insc.id })
  if (error) return { error: error.message }

  // 3. Purge du stockage
  await retirerFichiers(admin, chemins)

  revalidatePath('/prof/classes')
  revalidatePath('/prof/classes/[classeId]', 'page')
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
  revalidatePath('/prof/classes/[classeId]', 'page')
  revalidatePath('/prof/modules')
  return { success: true }
}
