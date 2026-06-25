'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { messageSiBloque } from '@/utils/integrite'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return supabase
}

// ── Essais (l'évaluation programmée) ────────────────────────────────────────

export async function creerEssai(data: {
  titre: string
  duree_minutes: number
  consignes?: string
  semestreId: string
  // Assignation à une ou plusieurs classes, avec une date propre à chacune.
  classes: { classe_id: string; date_essai: string }[]
}) {
  await verifierProf()
  const admin = createAdminClient()

  if (!data.semestreId) return { error: 'Semestre manquant', data: null }
  if (!data.classes.length) return { error: 'Choisis au moins une classe.', data: null }

  // date_essai de l'essai = 1ʳᵉ date assignée (legacy / défaut d'affichage).
  const datesTriees = data.classes.map(c => c.date_essai).sort()

  const { data: epreuve, error } = await admin
    .from('fragments_essais_epreuves')
    .insert({
      titre: data.titre,
      date_essai: datesTriees[0],
      duree_minutes: data.duree_minutes,
      consignes: data.consignes || null,
      depots_ouverts: false,
      semestre_id: data.semestreId,
    })
    .select('id')
    .single()
  if (error) return { error: error.message, data: null }

  const { error: errLiens } = await admin
    .from('fragments_essais_classes')
    .insert(data.classes.map(c => ({
      essai_id: epreuve.id,
      classe_id: c.classe_id,
      date_essai: c.date_essai,
      depots_ouverts: false,
    })))
  if (errLiens) return { error: errLiens.message, data: null }

  revalidatePath('/prof/fragments-erudition/essais')
  return { data: { epreuveId: epreuve.id }, error: null }
}

export async function modifierEssai(epreuveId: string, data: {
  titre: string
  duree_minutes: number
  consignes?: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('fragments_essais_epreuves')
    .update({
      titre: data.titre,
      duree_minutes: data.duree_minutes,
      consignes: data.consignes || null,
    })
    .eq('id', epreuveId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/essais')
  revalidatePath(`/prof/fragments-erudition/essais/${epreuveId}`)
  return { success: true }
}

// Assigne (ou met à jour la date d') un essai pour une classe.
export async function assignerEssaiClasse(epreuveId: string, classeId: string, dateEpreuve: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('fragments_essais_classes')
    .upsert(
      { essai_id: epreuveId, classe_id: classeId, date_essai: dateEpreuve },
      { onConflict: 'essai_id,classe_id', ignoreDuplicates: false }
    )
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/essais')
  return { success: true }
}

export async function retirerEssaiClasse(epreuveId: string, classeId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('fragments_essais_classes')
    .delete()
    .eq('essai_id', epreuveId)
    .eq('classe_id', classeId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/essais')
  return { success: true }
}

// Ouverture / fermeture des dépôts pour un couple (essai, classe).
export async function toggleDepotsClasse(epreuveId: string, classeId: string, ouvert: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('fragments_essais_classes')
    .update({ depots_ouverts: ouvert })
    .eq('essai_id', epreuveId)
    .eq('classe_id', classeId)
  if (error) return { error: error.message }
  revalidatePath(`/prof/fragments-erudition/essais/${epreuveId}`)
  return { success: true }
}

// ── Upload photos essai (prof dépose pour un élève) ───────────────────────────

export async function creerEssaiProf(epreuveId: string, inscriptionId: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { data: insc } = await admin
    .from('inscriptions')
    .select('eleve_id')
    .eq('id', inscriptionId)
    .single()
  if (!insc) return { error: 'Inscription introuvable', data: null }

  // Essai existant ? (scopé par inscription)
  const { data: existant } = await admin
    .from('fragments_essai_depots')
    .select('id')
    .eq('essai_id', epreuveId)
    .eq('inscription_id', inscriptionId)
    .maybeSingle()

  let essaiId: string
  if (existant) {
    // Supprimer les anciennes photos et l'analyse
    const { data: photos } = await admin
      .from('fragments_essai_depot_photos')
      .select('storage_path')
      .eq('depot_id', existant.id)
    if (photos && photos.length > 0) {
      await admin.storage.from('essais').remove(photos.map(p => p.storage_path))
    }
    await admin.from('fragments_essai_depot_photos').delete().eq('depot_id', existant.id)
    await admin.from('fragments_essai_depot_analyses').delete().eq('depot_id', existant.id)
    await admin.from('fragments_essai_depots').update({ depose_par: 'prof' }).eq('id', existant.id)
    essaiId = existant.id
  } else {
    const { data, error } = await admin
      .from('fragments_essai_depots')
      .insert({ essai_id: epreuveId, eleve_id: insc.eleve_id, inscription_id: inscriptionId, depose_par: 'prof' })
      .select('id')
      .single()
    if (error || !data) return { error: error?.message ?? 'Erreur création dépôt', data: null }
    essaiId = data.id
  }

  return { data: { essaiId }, error: null }
}

export async function creerUrlUploadEssaiPhoto(essaiId: string, ordre: number, ext: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { data: essai } = await admin
    .from('fragments_essai_depots')
    .select('eleve_id, essai_id')
    .eq('id', essaiId)
    .single()
  if (!essai) return { error: 'Dépôt introuvable', data: null }

  const storagePath = `${essai.eleve_id}/${essaiId}/${ordre}.${ext}`

  const { data: urlData, error: urlErr } = await admin.storage
    .from('essais')
    .createSignedUploadUrl(storagePath)

  if (urlErr || !urlData) return { error: urlErr?.message ?? 'Erreur URL', data: null }

  // Créer la ligne photo
  const { data: photo, error: photoErr } = await admin
    .from('fragments_essai_depot_photos')
    .insert({ depot_id: essaiId, storage_path: storagePath, ordre })
    .select('id')
    .single()

  if (photoErr || !photo) return { error: photoErr?.message ?? 'Erreur photo', data: null }

  return { data: { photoId: photo.id, path: urlData.path, token: urlData.token }, error: null }
}

export async function supprimerEssaiPhoto(photoId: string, storagePath: string) {
  await verifierProf()
  const admin = createAdminClient()
  await admin.storage.from('essais').remove([storagePath])
  await admin.from('fragments_essai_depot_photos').delete().eq('id', photoId)
  return { success: true }
}

export async function reordonnerPhotosEssai(photos: { id: string; ordre: number }[]) {
  await verifierProf()
  const admin = createAdminClient()
  await Promise.all(
    photos.map(p => admin.from('fragments_essai_depot_photos').update({ ordre: p.ordre }).eq('id', p.id))
  )
  return { success: true }
}

export async function confirmerUploadEssaiPhotos(essaiId: string) {
  await verifierProf()
  after(async () => {
    const { analyserEssai } = await import('@/utils/analyse-essai')
    await analyserEssai(essaiId)
  })
  revalidatePath('/prof/fragments-erudition/essais')
  return { success: true }
}

export async function relancerAnalyseEssai(essaiId: string) {
  await verifierProf()
  const admin = createAdminClient()
  // Remettre l'analyse en cours
  await admin.from('fragments_essai_depot_analyses').update({ statut: 'en_cours' }).eq('depot_id', essaiId)
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
  const { error } = await admin.from('fragments_essai_depot_analyses').update({
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
  const note = note20validee == null || Number.isNaN(note20validee) ? null : Math.max(0, Math.min(20, note20validee))
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_essai_depot_analyses').update({
    note20_validee: note,
    note_visible_eleve: noteVisibleEleve,
    modifie_par_prof: true,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function publierAnalyseEssai(analyseId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_essai_depot_analyses').update({
    statut: 'publiee',
    publiee_at: new Date().toISOString(),
    modifie_par_prof: true,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/essais')
  return { success: true }
}

export async function depublierAnalyseEssai(analyseId: string) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_essai_depot_analyses').update({
    statut: 'generee',
    publiee_at: null,
  }).eq('id', analyseId)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/essais')
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

// eleve_id reste renseigné (RLS) mais le thème est scopé par inscription : on
// dérive eleve_id de l'inscription pour les créations.
async function eleveDeInscription(admin: ReturnType<typeof createAdminClient>, inscriptionId: string) {
  const { data } = await admin.from('inscriptions').select('eleve_id').eq('id', inscriptionId).single()
  return data?.eleve_id as string | undefined
}

export async function toggleEssaiActif(inscriptionId: string, semestreId: string, actif: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { data: existant } = await admin
    .from('fragments_themes')
    .select('id')
    .eq('inscription_id', inscriptionId)
    .eq('semestre_id', semestreId)
    .maybeSingle()

  if (existant) {
    await admin.from('fragments_themes').update({ essai_actif: actif }).eq('id', existant.id)
  } else {
    const eleveId = await eleveDeInscription(admin, inscriptionId)
    await admin.from('fragments_themes').insert({ inscription_id: inscriptionId, semestre_id: semestreId, eleve_id: eleveId, essai_actif: actif, theme: '' })
  }
  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true }
}

export async function activerEssaiPourClasse(classeId: string, semestreId: string, actif: boolean) {
  await verifierProf()
  const admin = createAdminClient()

  const { data: inscrits } = await admin
    .from('inscriptions')
    .select('id, eleve_id')
    .eq('classe_id', classeId)
    .eq('statut', 'active')

  if (!inscrits || inscrits.length === 0) return { success: true, count: 0 }

  await Promise.all(
    inscrits.map(i => admin.from('fragments_themes').upsert(
      { inscription_id: i.id, semestre_id: semestreId, eleve_id: i.eleve_id, essai_actif: actif, theme: '' },
      { onConflict: 'inscription_id,semestre_id', ignoreDuplicates: false }
    ))
  )

  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true, count: inscrits.length }
}

// ── Synthèses de semestre ──────────────────────────────────────────────────
// (La création/édition des semestres est déléguée au Calendrier ; ici on ne
// gère plus que la génération des synthèses, ancrées au semestre global.)

export async function genererSynthese(inscriptionId: string, semestreId: string) {
  await verifierProf()
  // Mettre en cours immédiatement
  const admin = createAdminClient()
  const { data: existante } = await admin
    .from('fragments_syntheses')
    .select('id, statut')
    .eq('inscription_id', inscriptionId)
    .eq('semestre_id', semestreId)
    .maybeSingle()

  if (existante?.statut === 'publiee') return { success: true }

  if (!existante) {
    const { data: insc } = await admin.from('inscriptions').select('eleve_id').eq('id', inscriptionId).single()
    await admin.from('fragments_syntheses').insert({
      inscription_id: inscriptionId,
      eleve_id: insc?.eleve_id,
      semestre_id: semestreId,
      statut: 'en_cours',
    })
  } else {
    await admin.from('fragments_syntheses').update({ statut: 'en_cours' }).eq('id', existante.id)
  }

  after(async () => {
    const { genererSynthesePourEleve } = await import('@/utils/synthese-semestre')
    await genererSynthesePourEleve(inscriptionId, semestreId)
  })

  revalidatePath(`/prof/fragments-erudition/semestres/${semestreId}`)
  return { success: true }
}

export async function genererSynthesesLot(inscriptionIds: string[], semestreId: string) {
  await verifierProf()
  const admin = createAdminClient()

  // Créer/mettre à jour toutes en 'en_cours'
  await Promise.all(
    inscriptionIds.map(async (inscriptionId) => {
      const { data: existante } = await admin
        .from('fragments_syntheses')
        .select('id, statut')
        .eq('inscription_id', inscriptionId)
        .eq('semestre_id', semestreId)
        .maybeSingle()

      if (existante?.statut === 'publiee') return

      if (!existante) {
        const { data: insc } = await admin.from('inscriptions').select('eleve_id').eq('id', inscriptionId).single()
        await admin.from('fragments_syntheses').insert({ inscription_id: inscriptionId, eleve_id: insc?.eleve_id, semestre_id: semestreId, statut: 'en_cours' })
      } else {
        await admin.from('fragments_syntheses').update({ statut: 'en_cours' }).eq('id', existante.id)
      }
    })
  )

  // Déclencher en arrière-plan (les analyses se font séquentiellement pour éviter de surcharger l'API)
  after(async () => {
    const { genererSynthesePourEleve } = await import('@/utils/synthese-semestre')
    for (const inscriptionId of inscriptionIds) {
      await genererSynthesePourEleve(inscriptionId, semestreId)
    }
  })

  revalidatePath(`/prof/fragments-erudition/semestres/${semestreId}`)
  return { success: true, count: inscriptionIds.length }
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
  const note = note20validee == null || Number.isNaN(note20validee) ? null : Math.max(0, Math.min(20, note20validee))
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_syntheses').update({
    note20_validee: note,
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

// Seuil anti-triche « photo suspecte » (T2) : nombre d'heures au-delà duquel une
// photo dont l'EXIF est ancien est signalée. Clampé à [1, 720] (1 h – 30 j).
export async function sauvegarderSeuilPhoto(seuilHeures: number) {
  await verifierProf()
  const admin = createAdminClient()
  const seuil = Math.max(1, Math.min(720, Math.round(seuilHeures)))
  const { error } = await admin.from('fragments_config').update({ seuil_photo_heures: seuil }).eq('id', 1)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Dépôt élève (upload via signed URL) ─────────────────────────────────────

export async function creerUrlUploadEssaiPhotoEleve(epreuveId: string, inscriptionId: string, ordre: number, ext: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', data: null }

  const admin = createAdminClient()

  // Blocage « petit malin » : un dépôt d'essai reste un rendu → gelé si l'élève est bloqué.
  const blocage = await messageSiBloque(admin, user.id)
  if (blocage) return { error: blocage, data: null }

  // Valider que l'inscription appartient bien à l'élève (et est active)
  const { data: insc } = await admin
    .from('inscriptions')
    .select('id, classe_id')
    .eq('id', inscriptionId)
    .eq('eleve_id', user.id)
    .eq('statut', 'active')
    .maybeSingle()
  if (!insc) return { error: 'Accès refusé', data: null }

  // Vérifier que les dépôts sont ouverts POUR LA CLASSE de l'élève (flag par classe que
  // le prof bascule et que la page élève lit). L'ancien flag global
  // fragments_essais_epreuves.depots_ouverts n'est jamais réactivé → ne pas s'y fier.
  const { data: lienClasse } = await admin
    .from('fragments_essais_classes')
    .select('depots_ouverts')
    .eq('essai_id', epreuveId)
    .eq('classe_id', insc.classe_id)
    .maybeSingle()
  if (!lienClasse?.depots_ouverts) return { error: 'Les dépôts sont fermés.', data: null }

  // Trouver ou créer l'essai (scopé par inscription)
  let essaiId: string
  const { data: existant } = await admin
    .from('fragments_essai_depots')
    .select('id')
    .eq('essai_id', epreuveId)
    .eq('inscription_id', inscriptionId)
    .maybeSingle()

  if (existant) {
    essaiId = existant.id
  } else {
    const { data, error } = await admin
      .from('fragments_essai_depots')
      .insert({ essai_id: epreuveId, eleve_id: user.id, inscription_id: inscriptionId, depose_par: 'eleve' })
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
    .from('fragments_essai_depot_photos')
    .insert({ depot_id: essaiId, storage_path: storagePath, ordre })
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
  const blocage = await messageSiBloque(admin, user.id)
  if (blocage) return { error: blocage }
  const { data: essai } = await admin
    .from('fragments_essai_depots')
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
    .from('fragments_essai_depots')
    .select('eleve_id')
    .eq('id', essaiId)
    .single()
  if (!essai || essai.eleve_id !== user.id) return { error: 'Accès refusé' }

  const { data: photos } = await admin
    .from('fragments_essai_depot_photos')
    .select('storage_path')
    .eq('depot_id', essaiId)

  if (photos && photos.length > 0) {
    await admin.storage.from('essais').remove(photos.map(p => p.storage_path))
    await admin.from('fragments_essai_depot_photos').delete().eq('depot_id', essaiId)
  }

  await admin.from('fragments_essai_depot_analyses').delete().eq('depot_id', essaiId)
  return { success: true }
}
