'use server'

import { after } from 'next/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lancerAnalyse } from '@/utils/analyse'
import { inscriptionsClasse } from '@/utils/acces'
import { COOKIE_SEMESTRE_FRAGMENTS, semestreFragmentsActif, type ContexteSemestre } from './contexte-semestre'
import type { StatutPiste } from '@/types/fragments'
import { normaliserRetours } from '@/utils/passation/transcription-calcul'

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


// Contexte semestre chargé À LA DEMANDE par le sélecteur (client), pour que la
// requête `semesters` ne s'exécute QUE sur Fragments — pas sur toutes les routes
// /prof via le shell.
export async function chargerContexteSemestreFragments(): Promise<ContexteSemestre> {
  const supabase = await verifierProf()
  return semestreFragmentsActif(supabase)
}

// Semestre consulté (cookie de contexte du module).
export async function definirSemestreFragments(semestreId: string) {
  await verifierProf()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_SEMESTRE_FRAGMENTS, semestreId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
  revalidatePath('/prof/fragments-erudition', 'layout')
  return { success: true }
}

// La bascule du semestre actif se fait depuis la configuration du Calendrier
// (/prof/calendrier/config) — le semestre est global, plus propre à Fragments.

// La création de semaines se fait désormais dans le Calendrier
// (regenererSemaines, depuis le semestre + vacances) — plus de création manuelle
// côté Fragments. Ici, on ne gère plus que l'ouverture/fermeture.

export async function toggleSemaineOuverte(formData: FormData) {
  const supabase = await verifierProf()
  const id = formData.get('id') as string
  const ouverte = formData.get('ouverte') === 'true'

  const { error } = await supabase
    .from('fragments_semaines')
    .update({ ouverte: !ouverte })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function sauvegarderTheme(formData: FormData) {
  const supabase = await verifierProf()
  const inscriptionId = formData.get('inscriptionId') as string
  const semestreId = formData.get('semestreId') as string
  const theme = formData.get('theme') as string
  const description = normaliserRetours(String(formData.get('description') ?? '')) || null

  if (!semestreId) return { error: 'Semestre manquant' }

  // eleve_id reste renseigné (RLS simple) ; on le dérive de l'inscription.
  const { data: insc } = await supabase
    .from('inscriptions')
    .select('eleve_id')
    .eq('id', inscriptionId)
    .single()
  if (!insc) return { error: 'Inscription introuvable' }

  // Un thème par (inscription, semestre).
  const { data: existant } = await supabase
    .from('fragments_themes')
    .select('id')
    .eq('inscription_id', inscriptionId)
    .eq('semestre_id', semestreId)
    .maybeSingle()

  // C8 (02/09) — la main du professeur vaut validation : `valide_at` se pose.
  const valide_at = new Date().toISOString()
  if (existant) {
    await supabase
      .from('fragments_themes')
      .update({ theme, description, valide_at })
      .eq('id', existant.id)
  } else {
    await supabase
      .from('fragments_themes')
      .insert({ inscription_id: inscriptionId, semestre_id: semestreId, eleve_id: insc.eleve_id, theme, description, valide_at })
  }

  revalidatePath('/prof/fragments-erudition/suivi')
  revalidatePath('/prof')
  return { success: true }
}

// C8 (02/09) — le professeur a relu le thème proposé par l'élève : il le valide
// tel quel. Le texte ne bouge pas ; seul `valide_at` se pose.
export async function validerTheme(inscriptionId: string, semestreId: string) {
  const supabase = await verifierProf()
  const { data: existant } = await supabase
    .from('fragments_themes').select('id, theme').eq('inscription_id', inscriptionId).eq('semestre_id', semestreId).maybeSingle()
  if (!existant) return { error: 'Aucun thème à valider.' }
  if (!existant.theme || String(existant.theme).trim() === '') return { error: 'Le thème est vide : rien à valider.' }
  const { error } = await supabase.from('fragments_themes').update({ valide_at: new Date().toISOString() }).eq('id', existant.id)
  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/suivi')
  revalidatePath('/eleve/modules/fragments-erudition')
  revalidatePath('/prof')
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

// ============================================================
// Validation par LOT (C8·L2) — le goulot du module
// ------------------------------------------------------------
// À ~90 élèves, publier les retours un par un coûte 3 à 7 h par semaine : une
// navigation, un écran d'analyse et un clic pour chaque dépôt. Les deux actions
// ci-dessous font le même geste sur une sélection, en UN aller-retour.
//
// Elles ne créent aucun état neuf : « valider » = publier (`generee` →
// `publiee`), « refuser » = relancer l'analyse — exactement les deux gestes que
// l'écran d'analyse offre déjà dépôt par dépôt. Aucune migration : le schéma
// porte déjà tout ce qu'il faut.
// ============================================================

// Publie une sélection d'analyses. Ne touche QUE celles réellement en attente
// (`generee`) : une ligne déjà publiée ou encore en cours n'est pas réécrite, et
// l'écart entre le demandé et le fait est REMONTÉ, jamais avalé en silence.
export async function publierAnalysesLot(analyseIds: string[]) {
  await verifierProf()
  if (analyseIds.length === 0) return { publiees: 0, ignorees: 0, error: null }

  const admin = createAdminClient()

  // `.select()` après un update renvoie les lignes touchées → le compte est
  // constaté, pas supposé. supabase-js ne LÈVE pas sur erreur SQL : sans lire
  // `error`, un échec total passerait pour un succès.
  const { data, error } = await admin
    .from('fragments_analyses')
    .update({
      statut: 'publiee',
      publiee_at: new Date().toISOString(),
      // `modifie_par_prof` reste tel quel : une validation en lot est
      // précisément une publication SANS retouche.
    })
    .in('id', analyseIds)
    .eq('statut', 'generee')
    .select('id')

  if (error) return { publiees: 0, ignorees: analyseIds.length, error: error.message }

  const publiees = (data ?? []).length
  revalidatePath('/prof/fragments-erudition', 'layout')
  return { publiees, ignorees: analyseIds.length - publiees, error: null }
}

// Dépublie une sélection (le retour redevient invisible à l'élève et repasse
// « à valider »). Filet de rattrapage d'un lot publié trop vite.
export async function depublierAnalysesLot(analyseIds: string[]) {
  await verifierProf()
  if (analyseIds.length === 0) return { depubliees: 0, ignorees: 0, error: null }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fragments_analyses')
    .update({ statut: 'generee', publiee_at: null })
    .in('id', analyseIds)
    .eq('statut', 'publiee')
    .select('id')

  if (error) return { depubliees: 0, ignorees: analyseIds.length, error: error.message }

  const depubliees = (data ?? []).length
  revalidatePath('/prof/fragments-erudition', 'layout')
  return { depubliees, ignorees: analyseIds.length - depubliees, error: null }
}

// Relance l'analyse d'une sélection de dépôts (« refuser » : ce retour ne
// convient pas, qu'il soit refait). Les lignes passent en `en_cours` tout de
// suite pour que l'écran le montre, puis les appels au modèle se font en
// arrière-plan et SÉQUENTIELLEMENT — même patron que `genererSynthesesLot`,
// pour ne pas lancer trente appels d'un coup.
export async function relancerAnalysesLot(cibles: { depotId: string; eleveId: string }[]) {
  await verifierProf()
  if (cibles.length === 0) return { relancees: 0, error: null }

  const admin = createAdminClient()
  const depotIds = cibles.map(c => c.depotId)

  const { error } = await admin
    .from('fragments_analyses')
    .update({ statut: 'en_cours' })
    .in('depot_id', depotIds)

  if (error) return { relancees: 0, error: error.message }

  after(async () => {
    for (const { depotId, eleveId } of cibles) {
      await lancerAnalyse(depotId, eleveId, { force: true })
    }
  })

  revalidatePath('/prof/fragments-erudition', 'layout')
  return { relancees: cibles.length, error: null }
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

export async function sauvegarderConfig(promptEvaluation: string, bareme: string, rubrique?: string) {
  await verifierProf()
  const admin = createAdminClient()

  const { error } = await admin.from('fragments_config').update({
    prompt_evaluation: promptEvaluation,
    bareme,
    ...(rubrique !== undefined ? { rubrique } : {}),
  }).eq('id', 1)

  if (error) return { error: error.message }
  return { success: true }
}

// ============================================================
// Oral : enregistrement, transcription, analyse, publication
// ============================================================

export async function creerUrlUploadAudio(
  presentationId: string,
  eleveId: string,
  ext: string
) {
  await verifierProf()
  const admin = createAdminClient()

  const storagePath = `${eleveId}/${presentationId}.${ext}`

  // Inscription de la présentation (pour scoper l'oral sur élève × classe)
  const { data: pres } = await admin
    .from('fragments_presentations')
    .select('inscription_id')
    .eq('id', presentationId)
    .maybeSingle()
  const inscriptionId = pres?.inscription_id ?? null

  // Créer (ou récupérer) le record fragments_oraux
  const { data: existant } = await admin
    .from('fragments_oraux')
    .select('id')
    .eq('presentation_id', presentationId)
    .maybeSingle()

  let oralId: string
  if (existant) {
    await admin.from('fragments_oraux').update({
      storage_path: storagePath,
      statut: 'enregistre',
      transcription: null,
      duree_secondes: null,
      nb_mots: null,
      debit_mots_minute: null,
      audio_supprime: false,
    }).eq('id', existant.id)
    oralId = existant.id
    // Supprimer l'ancienne analyse si elle existe
    await admin.from('fragments_analyses_orales').delete().eq('oral_id', existant.id)
  } else {
    const { data, error } = await admin
      .from('fragments_oraux')
      .insert({ presentation_id: presentationId, eleve_id: eleveId, inscription_id: inscriptionId, storage_path: storagePath, statut: 'enregistre' })
      .select('id')
      .single()
    if (error || !data) return { error: error?.message ?? 'Erreur création oral', data: null }
    oralId = data.id
  }

  // URL signée d'upload
  const { data: urlData, error: urlErr } = await admin.storage
    .from('oraux')
    .createSignedUploadUrl(storagePath)

  if (urlErr || !urlData) return { error: urlErr?.message ?? 'Erreur URL', data: null }

  return { data: { oralId, path: urlData.path, token: urlData.token }, error: null }
}

export async function confirmerUploadAudio(oralId: string) {
  await verifierProf()
  after(async () => {
    const { transcrireEtAnalyserOral } = await import('@/utils/transcription')
    await transcrireEtAnalyserOral(oralId)
  })
  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function relancerTranscription(oralId: string) {
  await verifierProf()
  const admin = createAdminClient()
  await admin.from('fragments_oraux').update({
    statut: 'enregistre',
    transcription: null,
    duree_secondes: null,
    nb_mots: null,
    debit_mots_minute: null,
  }).eq('id', oralId)
  await admin.from('fragments_analyses_orales').delete().eq('oral_id', oralId)
  after(async () => {
    const { transcrireEtAnalyserOral } = await import('@/utils/transcription')
    await transcrireEtAnalyserOral(oralId)
  })
  return { success: true }
}

export async function relancerAnalyseOrale(oralId: string) {
  await verifierProf()
  const admin = createAdminClient()
  await admin.from('fragments_oraux').update({ statut: 'transcrit' }).eq('id', oralId)
  await admin.from('fragments_analyses_orales').delete().eq('oral_id', oralId)
  after(async () => {
    const { analyserOral } = await import('@/utils/analyse-orale')
    await analyserOral(oralId)
  })
  return { success: true }
}

export async function sauvegarderAnalyseOrale(analyseOraleId: string, data: {
  retour_integration: string
  retour_pistes: string
  retour_completude: string
  retour_oral: string
  commentaire_general: string
  note_contenu: number
  note_structure: number
  note_expression: number
  notes_prof: string
}) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_analyses_orales').update({
    ...data,
    notes_prof: data.notes_prof || null,
    modifie_par_prof: true,
  }).eq('id', analyseOraleId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function publierAnalyseOrale(
  analyseOraleId: string,
  oralId: string,
  presentationId: string,
  supprimerAudio: boolean
) {
  await verifierProf()
  const admin = createAdminClient()

  await admin.from('fragments_analyses_orales').update({
    publiee_at: new Date().toISOString(),
    modifie_par_prof: true,
  }).eq('id', analyseOraleId)

  await admin.from('fragments_oraux').update({ statut: 'publie' }).eq('id', oralId)

  // Passer la présentation à 'presente' si pas déjà fait
  await admin.from('fragments_presentations').update({ statut: 'presente' })
    .eq('id', presentationId)
    .eq('statut', 'tire')

  // Suppression audio optionnelle
  if (supprimerAudio) {
    const { data: oral } = await admin
      .from('fragments_oraux')
      .select('storage_path')
      .eq('id', oralId)
      .single()
    if (oral?.storage_path) {
      await admin.storage.from('oraux').remove([oral.storage_path])
      await admin.from('fragments_oraux').update({ audio_supprime: true }).eq('id', oralId)
    }
  }

  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function depublierAnalyseOrale(analyseOraleId: string, oralId: string) {
  await verifierProf()
  const admin = createAdminClient()
  await admin.from('fragments_analyses_orales').update({ publiee_at: null }).eq('id', analyseOraleId)
  await admin.from('fragments_oraux').update({ statut: 'analyse' }).eq('id', oralId)
  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function getSignedUrlAudio(storagePath: string): Promise<string | null> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.storage.from('oraux').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

export async function getSignedUrlAudioEleve(storagePath: string, eleveId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== eleveId) return null
  // Contrôle sur le chemin lui-même (le dossier = uid de l'élève), pas seulement sur le paramètre
  if (!storagePath.startsWith(`${user.id}/`)) return null
  const admin = createAdminClient()
  const { data } = await admin.storage.from('oraux').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}

export async function sauvegarderConfigOrale(promptOral: string, supprimerAudioPublication: boolean) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin.from('fragments_config').update({
    prompt_evaluation_orale: promptOral,
    supprimer_audio_publication: supprimerAudioPublication,
  }).eq('id', 1)
  if (error) return { error: error.message }
  return { success: true }
}

// ============================================================
// Tirage au sort
// ============================================================

export async function tirerOrateur(semaineId: string, classeId: string, excluIds: string[]) {
  await verifierProf()
  const admin = createAdminClient()

  // Inscriptions de la classe active (élève ↔ inscription 1:1 dans une classe)
  const inscrits = await inscriptionsClasse(admin, classeId)
  const inscriptionIds = inscrits.map(i => i.id)
  if (inscriptionIds.length === 0) return { error: 'Aucun élève éligible', data: null }
  const inscriptionParEleve = Object.fromEntries(inscrits.map(i => [i.eleve_id, i.id]))

  // Élèves de cette classe ayant déposé pour cette semaine
  const { data: depots } = await admin
    .from('fragments_depots')
    .select('eleve_id')
    .eq('semaine_id', semaineId)
    .in('inscription_id', inscriptionIds)

  const eligibles = (depots ?? [])
    .map(d => d.eleve_id as string)
    .filter(id => !excluIds.includes(id))

  if (eligibles.length === 0) return { error: 'Aucun élève éligible', data: null }

  // Nombre de présentations déjà faites dans cette classe (statut = 'presente')
  const { data: presentationsPassees } = await admin
    .from('fragments_presentations')
    .select('eleve_id')
    .eq('statut', 'presente')
    .in('inscription_id', inscriptionIds)

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

  // Enregistrer le tirage (scopé par inscription)
  const { data: presentation, error } = await admin
    .from('fragments_presentations')
    .insert({ eleve_id: gagnantId, inscription_id: inscriptionParEleve[gagnantId], semaine_id: semaineId, statut: 'tire' })
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
