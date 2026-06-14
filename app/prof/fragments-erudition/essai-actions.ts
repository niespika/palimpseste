'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return supabase
}

// ── Épreuves ──────────────────────────────────────────────────────────────────

export async function creerEpreuve(data: {
  titre: string
  date_epreuve: string
  duree_minutes: number
  consignes?: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { data: epreuve, error } = await admin
    .from('fragments_essais_epreuves')
    .insert({
      titre: data.titre,
      date_epreuve: data.date_epreuve,
      duree_minutes: data.duree_minutes,
      consignes: data.consignes || null,
      depots_ouverts: false,
    })
    .select('id')
    .single()
  if (error) return { error: error.message, data: null }
  revalidatePath('/prof/fragments-erudition/epreuves')
  return { data: { epreuveId: epreuve.id }, error: null }
}

export async function modifierEpreuve(epreuveId: string, data: {
  titre: string
  date_epreuve: string
  duree_minutes: number
  consignes?: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('fragments_essais_epreuves')
    .update({
      titre: data.titre,
      date_epreuve: data.date_epreuve,
      duree_minutes: data.duree_minutes,
      consignes: data.consignes || null,
    })
    .eq('id', epreuveId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/epreuves')
  revalidatePath(`/prof/fragments-erudition/epreuves/${epreuveId}`)
  return { success: true }
}

export async function toggleDepots(epreuveId: string, ouvert: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('fragments_essais_epreuves')
    .update({ depots_ouverts: ouvert })
    .eq('id', epreuveId)
  if (error) return { error: error.message }
  revalidatePath(`/prof/fragments-erudition/epreuves/${epreuveId}`)
  return { success: true }
}

// ── Upload photos essai (prof dépose pour un élève) ───────────────────────────

export async function creerEssaiProf(epreuveId: string, eleveId: string) {
  await verifierProf()
  const admin = createAdminClient()

  // Essai existant ?
  const { data: existant } = await admin
    .from('fragments_essais')
    .select('id')
    .eq('epreuve_id', epreuveId)
    .eq('eleve_id', eleveId)
    .maybeSingle()

  let essaiId: string
  if (existant) {
    // Supprimer les anciennes photos et l'analyse
    const { data: photos } = await admin
      .from('fragments_essais_photos')
      .select('storage_path')
      .eq('essai_id', existant.id)
    if (photos && photos.length > 0) {
      await admin.storage.from('essais').remove(photos.map(p => p.storage_path))
    }
    await admin.from('fragments_essais_photos').delete().eq('essai_id', existant.id)
    await admin.from('essais_analyses').delete().eq('essai_id', existant.id)
    await admin.from('fragments_essais').update({ depose_par: 'prof' }).eq('id', existant.id)
    essaiId = existant.id
  } else {
    const { data, error } = await admin
      .from('fragments_essais')
      .insert({ epreuve_id: epreuveId, eleve_id: eleveId, depose_par: 'prof' })
      .select('id')
      .single()
    if (error || !data) return { error: error?.message ?? 'Erreur création essai', data: null }
    essaiId = data.id
  }

  return { data: { essaiId }, error: null }
}

export async function creerUrlUploadEssaiPhoto(essaiId: string, ordre: number, ext: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { data: essai } = await admin
    .from('fragments_essais')
    .select('eleve_id, epreuve_id')
    .eq('id', essaiId)
    .single()
  if (!essai) return { error: 'Essai introuvable', data: null }

  const storagePath = `${essai.eleve_id}/${essaiId}/${ordre}.${ext}`

  const { data: urlData, error: urlErr } = await admin.storage
    .from('essais')
    .createSignedUploadUrl(storagePath)

  if (urlErr || !urlData) return { error: urlErr?.message ?? 'Erreur URL', data: null }

  // Créer la ligne photo
  const { data: photo, error: photoErr } = await admin
    .from('fragments_essais_photos')
    .insert({ essai_id: essaiId, storage_path: storagePath, ordre })
    .select('id')
    .single()

  if (photoErr || !photo) return { error: photoErr?.message ?? 'Erreur photo', data: null }

  return { data: { photoId: photo.id, path: urlData.path, token: urlData.token }, error: null }
}

export async function supprimerEssaiPhoto(photoId: string, storagePath: string) {
  await verifierProf()
  const admin = createAdminClient()
  await admin.storage.from('essais').remove([storagePath])
  await admin.from('fragments_essais_photos').delete().eq('id', photoId)
  return { success: true }
}

export async function reordonnerPhotosEssai(photos: { id: string; ordre: number }[]) {
  await verifierProf()
  const admin = createAdminClient()
  await Promise.all(
    photos.map(p => admin.from('fragments_essais_photos').update({ ordre: p.ordre }).eq('id', p.id))
  )
  return { success: true }
}

export async function confirmerUploadEssaiPhotos(essaiId: string) {
  await verifierProf()
  after(async () => {
    const { analyserEssai } = await import('@/utils/analyse-essai')
    await analyserEssai(essaiId)
  })
  revalidatePath('/prof/fragments-erudition/epreuves')
  return { success: true }
}

export async function relancerAnalyseEssai(essaiId: string) {
  await verifierProf()
  const admin = createAdminClient()
  // Remettre l'analyse en cours
  await admin.from('essais_analyses').update({ statut: 'en_cours' }).eq('essai_id', essaiId)
  after(async () => {
    const { analyserEssai } = await import('@/utils/analyse-essai')
    await analyserEssai(essaiId)
  })
  return { success: true }
}

// ── Validation et publication de l'analyse d'essai ───────────────────────────

export async function sauvegarderAnalyseEssai(analyseId: string, data: {
  transcription: string
  lettre_structure: string
  lettre_expression: string
  lettre_argumentation: string
  lettre_connaissances: string
  retour_structure: string
  retour_expression: string
  retour_argumentation: string
  retour_connaissances: string
  retour_parcours: string
  synthese: string
  notes_prof: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const validLettres = ['A', 'B', 'C', 'D', 'E']
  const { error } = await admin.from('essais_analyses').update({
    transcription: data.transcription || null,
    lettre_structure: validLettres.includes(data.lettre_structure) ? data.lettre_structure : null,
    lettre_expression: validLettres.includes(data.lettre_expression) ? data.lettre_expression : null,
    lettre_argumentation: validLettres.includes(data.lettre_argumentation) ? data.lettre_argumentation : null,
    lettre_connaissances: validLettres.includes(data.lettre_connaissances) ? data.lettre_connaissances : null,
    retour_structure: data.retour_structure || null,
    retour_expression: data.retour_expression || null,
    retour_argumentation: data.retour_argumentation || null,
    retour_connaissances: data.retour_connaissances || null,
    retour_parcours: data.retour_parcours || null,
    synthese: data.synthese || null,
    notes_prof: data.notes_prof || null,
    modifie_par_prof: true,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function validerNoteEssai(analyseId: string, note20validee: number | null, noteVisibleEleve: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('essais_analyses').update({
    note20_validee: note20validee,
    note_visible_eleve: noteVisibleEleve,
    modifie_par_prof: true,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function publierAnalyseEssai(analyseId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('essais_analyses').update({
    statut: 'publiee',
    publiee_at: new Date().toISOString(),
    modifie_par_prof: true,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/epreuves')
  return { success: true }
}

export async function depublierAnalyseEssai(analyseId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('essais_analyses').update({
    statut: 'generee',
    publiee_at: null,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/epreuves')
  return { success: true }
}

export async function getSignedUrlsEssaiPhotos(storagePaths: string[]): Promise<Record<string, string>> {
  await verifierProf()
  const admin = createAdminClient()
  const urls: Record<string, string> = {}
  await Promise.all(
    storagePaths.map(async (p) => {
      const { data } = await admin.storage.from('essais').createSignedUrl(p, 3600)
      if (data?.signedUrl) urls[p] = data.signedUrl
    })
  )
  return urls
}

export async function getSignedUrlEssaiPhotoEleve(storagePath: string, eleveId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== eleveId) return null
  // Contrôle sur le chemin lui-même (le dossier = uid de l'élève), pas seulement sur le paramètre
  if (!storagePath.startsWith(`${user.id}/`)) return null
  const admin = createAdminClient()
  const { data } = await admin.storage.from('essais').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

// ── Thèmes : essai_actif et question ─────────────────────────────────────────

export async function toggleEssaiActif(eleveId: string, actif: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { data: existant } = await admin
    .from('fragments_themes')
    .select('id')
    .eq('eleve_id', eleveId)
    .maybeSingle()

  if (existant) {
    await admin.from('fragments_themes').update({ essai_actif: actif }).eq('eleve_id', eleveId)
  } else {
    await admin.from('fragments_themes').insert({ eleve_id: eleveId, essai_actif: actif, theme: '' })
  }
  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true }
}

export async function sauvegarderQuestion(eleveId: string, question: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { data: existant } = await admin
    .from('fragments_themes')
    .select('id')
    .eq('eleve_id', eleveId)
    .maybeSingle()

  if (existant) {
    await admin.from('fragments_themes').update({ question: question || null }).eq('eleve_id', eleveId)
  } else {
    await admin.from('fragments_themes').insert({ eleve_id: eleveId, question: question || null, theme: '' })
  }
  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true }
}

export async function activerEssaiPourClasse(classe: string, actif: boolean) {
  await verifierProf()
  const admin = createAdminClient()

  const { data: eleves } = await admin
    .from('profiles')
    .select('id')
    .eq('classe', classe)
    .eq('role', 'eleve')

  if (!eleves || eleves.length === 0) return { success: true, count: 0 }

  await Promise.all(
    eleves.map(e => admin.from('fragments_themes').upsert(
      { eleve_id: e.id, essai_actif: actif, theme: '' },
      { onConflict: 'eleve_id', ignoreDuplicates: false }
    ))
  )

  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true, count: eleves.length }
}

// ── Semestres ────────────────────────────────────────────────────────────────

export async function creerSemestre(data: {
  label: string
  date_debut: string
  date_fin: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { data: semestre, error } = await admin
    .from('fragments_semestres')
    .insert(data)
    .select('id')
    .single()
  if (error) return { error: error.message, data: null }
  revalidatePath('/prof/fragments-erudition/semestres')
  return { data: { semestreId: semestre.id }, error: null }
}

export async function genererSynthese(eleveId: string, semestreId: string) {
  await verifierProf()
  // Mettre en cours immédiatement
  const admin = createAdminClient()
  const { data: existante } = await admin
    .from('fragments_syntheses')
    .select('id, statut')
    .eq('eleve_id', eleveId)
    .eq('semestre_id', semestreId)
    .maybeSingle()

  if (existante?.statut === 'publiee') return { success: true }

  if (!existante) {
    await admin.from('fragments_syntheses').insert({
      eleve_id: eleveId,
      semestre_id: semestreId,
      statut: 'en_cours',
    })
  } else {
    await admin.from('fragments_syntheses').update({ statut: 'en_cours' }).eq('id', existante.id)
  }

  after(async () => {
    const { genererSynthesePourEleve } = await import('@/utils/synthese-semestre')
    await genererSynthesePourEleve(eleveId, semestreId)
  })

  revalidatePath(`/prof/fragments-erudition/semestres/${semestreId}`)
  return { success: true }
}

export async function genererSynthesesLot(eleveIds: string[], semestreId: string) {
  await verifierProf()
  const admin = createAdminClient()

  // Créer/mettre à jour toutes en 'en_cours'
  await Promise.all(
    eleveIds.map(async (eleveId) => {
      const { data: existante } = await admin
        .from('fragments_syntheses')
        .select('id, statut')
        .eq('eleve_id', eleveId)
        .eq('semestre_id', semestreId)
        .maybeSingle()

      if (existante?.statut === 'publiee') return

      if (!existante) {
        await admin.from('fragments_syntheses').insert({ eleve_id: eleveId, semestre_id: semestreId, statut: 'en_cours' })
      } else {
        await admin.from('fragments_syntheses').update({ statut: 'en_cours' }).eq('id', existante.id)
      }
    })
  )

  // Déclencher en arrière-plan (les analyses se font séquentiellement pour éviter de surcharger l'API)
  after(async () => {
    const { genererSynthesePourEleve } = await import('@/utils/synthese-semestre')
    for (const eleveId of eleveIds) {
      await genererSynthesePourEleve(eleveId, semestreId)
    }
  })

  revalidatePath(`/prof/fragments-erudition/semestres/${semestreId}`)
  return { success: true, count: eleveIds.length }
}

export async function sauvegarderSynthese(syntheseId: string, data: {
  synthese: string
  points_forts: string
  axes_progres: string
  notes_prof: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_syntheses').update({
    synthese: data.synthese || null,
    points_forts: data.points_forts || null,
    axes_progres: data.axes_progres || null,
    notes_prof: data.notes_prof || null,
  }).eq('id', syntheseId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function validerNoteSynthese(syntheseId: string, note20validee: number | null, noteVisibleEleve: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_syntheses').update({
    note20_validee: note20validee,
    note_visible_eleve: noteVisibleEleve,
  }).eq('id', syntheseId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function publierSynthese(syntheseId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_syntheses').update({
    statut: 'publiee',
    publiee_at: new Date().toISOString(),
  }).eq('id', syntheseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/semestres')
  return { success: true }
}

export async function depublierSynthese(syntheseId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_syntheses').update({
    statut: 'generee',
    publiee_at: null,
  }).eq('id', syntheseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/semestres')
  return { success: true }
}

export async function sauvegarderConfigEssai(data: {
  echelle_lettres: string
  fourchette_points: number
  prompt_evaluation_essai: string
  prompt_synthese_semestre: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_config').update({
    echelle_lettres: data.echelle_lettres || null,
    fourchette_points: data.fourchette_points,
    prompt_evaluation_essai: data.prompt_evaluation_essai || null,
    prompt_synthese_semestre: data.prompt_synthese_semestre || null,
  }).eq('id', 1)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Dépôt élève (upload via signed URL) ─────────────────────────────────────

export async function creerUrlUploadEssaiPhotoEleve(epreuveId: string, ordre: number, ext: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', data: null }

  // Vérifier que l'épreuve est ouverte
  const admin = createAdminClient()
  const { data: epreuve } = await admin
    .from('fragments_essais_epreuves')
    .select('depots_ouverts')
    .eq('id', epreuveId)
    .single()
  if (!epreuve?.depots_ouverts) return { error: 'Les dépôts sont fermés.', data: null }

  // Trouver ou créer l'essai
  let essaiId: string
  const { data: existant } = await admin
    .from('fragments_essais')
    .select('id')
    .eq('epreuve_id', epreuveId)
    .eq('eleve_id', user.id)
    .maybeSingle()

  if (existant) {
    essaiId = existant.id
  } else {
    const { data, error } = await admin
      .from('fragments_essais')
      .insert({ epreuve_id: epreuveId, eleve_id: user.id, depose_par: 'eleve' })
      .select('id')
      .single()
    if (error || !data) return { error: error?.message ?? 'Erreur', data: null }
    essaiId = data.id
  }

  const storagePath = `${user.id}/${essaiId}/${ordre}.${ext}`

  const { data: urlData, error: urlErr } = await admin.storage
    .from('essais')
    .createSignedUploadUrl(storagePath)

  if (urlErr || !urlData) return { error: urlErr?.message ?? 'Erreur URL', data: null }

  const { data: photo, error: photoErr } = await admin
    .from('fragments_essais_photos')
    .insert({ essai_id: essaiId, storage_path: storagePath, ordre })
    .select('id')
    .single()

  if (photoErr || !photo) return { error: photoErr?.message ?? 'Erreur photo', data: null }

  return { data: { essaiId, photoId: photo.id, path: urlData.path, token: urlData.token }, error: null }
}

export async function confirmerDepotEssaiEleve(essaiId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier que l'essai appartient à l'élève
  const admin = createAdminClient()
  const { data: essai } = await admin
    .from('fragments_essais')
    .select('eleve_id')
    .eq('id', essaiId)
    .single()
  if (!essai || essai.eleve_id !== user.id) return { error: 'Accès refusé' }

  after(async () => {
    const { analyserEssai } = await import('@/utils/analyse-essai')
    await analyserEssai(essaiId)
  })

  revalidatePath('/eleve/modules/fragments-erudition')
  return { success: true }
}

export async function reinitialiserPhotosEssaiEleve(essaiId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { data: essai } = await admin
    .from('fragments_essais')
    .select('eleve_id')
    .eq('id', essaiId)
    .single()
  if (!essai || essai.eleve_id !== user.id) return { error: 'Accès refusé' }

  const { data: photos } = await admin
    .from('fragments_essais_photos')
    .select('storage_path')
    .eq('essai_id', essaiId)

  if (photos && photos.length > 0) {
    await admin.storage.from('essais').remove(photos.map(p => p.storage_path))
    await admin.from('fragments_essais_photos').delete().eq('essai_id', essaiId)
  }

  await admin.from('essais_analyses').delete().eq('essai_id', essaiId)
  return { success: true }
}
