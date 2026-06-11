'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lancerAnalyse } from '@/utils/analyse'
import type { StatutPiste } from '@/types/fragments'

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

export async function creerSemaine(formData: FormData) {
  const supabase = await verifierProf()

  const { data: derniere } = await supabase
    .from('fragments_semaines')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = (derniere?.numero ?? 0) + 1

  const { error } = await supabase.from('fragments_semaines').insert({
    numero,
    titre: (formData.get('titre') as string) || null,
    date_debut: formData.get('dateDebut') as string,
    date_limite: formData.get('dateLimite') as string,
    ouverte: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition')
  revalidatePath('/prof/fragments-erudition/semaines')
  return { success: true }
}

export async function toggleSemaineOuverte(formData: FormData) {
  const supabase = await verifierProf()
  const id = formData.get('id') as string
  const ouverte = formData.get('ouverte') === 'true'

  const { error } = await supabase
    .from('fragments_semaines')
    .update({ ouverte: !ouverte })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/semaines')
  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function sauvegarderTheme(formData: FormData) {
  const supabase = await verifierProf()
  const eleveId = formData.get('eleveId') as string
  const theme = formData.get('theme') as string
  const description = (formData.get('description') as string) || null

  const { data: existant } = await supabase
    .from('fragments_themes')
    .select('id')
    .eq('eleve_id', eleveId)
    .maybeSingle()

  if (existant) {
    await supabase
      .from('fragments_themes')
      .update({ theme, description })
      .eq('eleve_id', eleveId)
  } else {
    await supabase
      .from('fragments_themes')
      .insert({ eleve_id: eleveId, theme, description })
  }

  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true }
}

export async function getSignedUrlsProf(chemins: string[]): Promise<Record<string, string>> {
  await verifierProf()
  const admin = createAdminClient()
  const urls: Record<string, string> = {}

  await Promise.all(
    chemins.map(async (chemin) => {
      const { data } = await admin.storage
        .from('fragments')
        .createSignedUrl(chemin, 3600)
      if (data?.signedUrl) urls[chemin] = data.signedUrl
    })
  )

  return urls
}

// ============================================================
// Actions liées à l'analyse IA
// ============================================================

export async function relancerAnalyse(depotId: string, eleveId: string) {
  await verifierProf()
  const admin = createAdminClient()

  // Passer immédiatement en "en_cours" pour que l'UI le reflète
  const { data: existante } = await admin
    .from('fragments_analyses')
    .select('id')
    .eq('depot_id', depotId)
    .maybeSingle()

  if (existante) {
    await admin.from('fragments_analyses')
      .update({ statut: 'en_cours' })
      .eq('id', existante.id)
  }

  after(async () => {
    await lancerAnalyse(depotId, eleveId, { force: true })
  })

  revalidatePath(`/prof/fragments-erudition/analyse/${depotId}`)
  return { success: true, error: null }
}

export async function sauvegarderAnalyse(analyseId: string, data: {
  note_decouvertes: number
  note_sources: number
  note_reflexions: number
  transcription: string
  retour_progres: string
  retour_langue: string
  retour_style: string
  retour_contenu: string
  commentaire_general: string
  notes_prof: string
}) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_analyses').update({
    ...data,
    notes_prof: data.notes_prof || null,
    retour_progres: data.retour_progres || null,
    modifie_par_prof: true,
  }).eq('id', analyseId)

  if (error) return { error: error.message }

  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function publierAnalyse(analyseId: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_analyses').update({
    statut: 'publiee',
    publiee_at: new Date().toISOString(),
    modifie_par_prof: true,
  }).eq('id', analyseId)

  if (error) return { error: error.message }

  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function depublierAnalyse(analyseId: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_analyses').update({
    statut: 'generee',
    publiee_at: null,
  }).eq('id', analyseId)

  if (error) return { error: error.message }

  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function mettreAJourPiste(pisteId: string, statut: StatutPiste) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_pistes')
    .update({ statut })
    .eq('id', pisteId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function supprimerPiste(pisteId: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_pistes').delete().eq('id', pisteId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function ajouterPiste(analyseId: string, eleveId: string, contenu: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_pistes').insert({
    analyse_id: analyseId,
    eleve_id: eleveId,
    contenu,
    est_rappel: false,
    statut: 'proposee',
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function sauvegarderConfig(promptEvaluation: string, bareme: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_config').update({
    prompt_evaluation: promptEvaluation,
    bareme,
  }).eq('id', 1)

  if (error) return { error: error.message }
  return { success: true }
}

export async function supprimerDepot(formData: FormData) {
  const supabase = await verifierProf()
  const depotId = formData.get('depotId') as string
  const admin = createAdminClient()

  // Récupérer les chemins des photos
  const { data: photos } = await supabase
    .from('fragments_photos')
    .select('storage_path')
    .eq('depot_id', depotId)

  if (photos && photos.length > 0) {
    await admin.storage
      .from('fragments')
      .remove(photos.map(p => p.storage_path))
  }

  await supabase.from('fragments_depots').delete().eq('id', depotId)

  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}
