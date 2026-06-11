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

// ============================================================
// Tirage au sort
// ============================================================

export async function tirerOrateur(semaineId: string, excluIds: string[]) {
  await verifierProf()
  const admin = createAdminClient()

  // Élèves ayant déposé pour cette semaine
  const { data: depots } = await admin
    .from('fragments_depots')
    .select('eleve_id')
    .eq('semaine_id', semaineId)

  const eligibles = (depots ?? [])
    .map(d => d.eleve_id as string)
    .filter(id => !excluIds.includes(id))

  if (eligibles.length === 0) return { error: 'Aucun élève éligible', data: null }

  // Nombre de présentations déjà faites (statut = 'presente')
  const { data: presentationsPassees } = await admin
    .from('fragments_presentations')
    .select('eleve_id')
    .eq('statut', 'presente')
    .in('eleve_id', eligibles)

  const comptes: Record<string, number> = {}
  for (const p of presentationsPassees ?? []) {
    comptes[p.eleve_id] = (comptes[p.eleve_id] ?? 0) + 1
  }

  // Tirage pondéré : poids = 1 / (1 + nb_presentations)
  const poids = eligibles.map(id => 1 / (1 + (comptes[id] ?? 0)))
  const total = poids.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  let gagnantId = eligibles[eligibles.length - 1]
  for (let i = 0; i < eligibles.length; i++) {
    r -= poids[i]
    if (r <= 0) { gagnantId = eligibles[i]; break }
  }

  // Enregistrer le tirage
  const { data: presentation, error } = await admin
    .from('fragments_presentations')
    .insert({ eleve_id: gagnantId, semaine_id: semaineId, statut: 'tire' })
    .select('id')
    .single()

  if (error) return { error: error.message, data: null }

  // Profil du gagnant
  const { data: profil } = await admin
    .from('profiles')
    .select('id, display_name, classe')
    .eq('id', gagnantId)
    .single()

  revalidatePath(`/prof/fragments-erudition/semaine/${semaineId}`)
  return { data: { presentationId: presentation.id, eleve: profil }, error: null }
}

export async function mettreAJourPresentation(presentationId: string, statut: 'presente' | 'reporte') {
  await verifierProf()
  const admin = createAdminClient()
  const { data: pres } = await admin
    .from('fragments_presentations')
    .select('semaine_id')
    .eq('id', presentationId)
    .single()
  const { error } = await admin
    .from('fragments_presentations')
    .update({ statut })
    .eq('id', presentationId)
  if (error) return { error: error.message }
  if (pres?.semaine_id) revalidatePath(`/prof/fragments-erudition/semaine/${pres.semaine_id}`)
  return { success: true }
}

export async function annulerPresentation(presentationId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { data: pres } = await admin
    .from('fragments_presentations')
    .select('semaine_id')
    .eq('id', presentationId)
    .single()
  const { error } = await admin
    .from('fragments_presentations')
    .delete()
    .eq('id', presentationId)
  if (error) return { error: error.message }
  if (pres?.semaine_id) revalidatePath(`/prof/fragments-erudition/semaine/${pres.semaine_id}`)
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
