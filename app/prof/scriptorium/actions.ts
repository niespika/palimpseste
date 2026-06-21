'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

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
  return { supabase, userId: user.id }
}

// ── Unités (conteneurs, créées à la volée) ──────────────────────────────────

export async function creerUnite(label: string): Promise<{ id?: string; error?: string }> {
  const { supabase } = await verifierProf()
  const { data: derniere } = await supabase
    .from('scriptorium_unites')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()
  const ordre = (derniere?.ordre ?? 0) + 1

  const { data, error } = await supabase
    .from('scriptorium_unites')
    .insert({ label: label || `Unité ${ordre}`, ordre })
    .select('id')
    .single()
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { id: data.id }
}

export async function renommerUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const label = formData.get('label') as string
  const { error } = await supabase.from('scriptorium_unites').update({ label }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const { error } = await supabase.from('scriptorium_unites').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Extraction de texte (PDF / DOCX / TXT) ──────────────────────────────────

async function extraireTexte(buffer: Buffer, mimeType: string, nomFichier: string): Promise<string | null> {
  const ext = nomFichier.split('.').pop()?.toLowerCase()

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const { extractText } = await import('unpdf')
      const { text } = await extractText(new Uint8Array(buffer))
      return (Array.isArray(text) ? text.join('\n') : text).trim() || null
    } catch (err) {
      console.error('[scriptorium] PDF extraction error:', err)
      return null
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value.trim() || null
    } catch {
      return null
    }
  }

  if (mimeType === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8').trim() || null
  }

  return null
}

function estImage(mimeType: string, nom: string): boolean {
  const ext = nom.split('.').pop()?.toLowerCase()
  return mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext ?? '')
}

async function uploaderBuffer(
  userId: string, documentId: string, buffer: Buffer, ext: string, contentType: string,
): Promise<{ path?: string; error?: string }> {
  const admin = createAdminClient()
  const storagePath = `${userId}/${documentId}/${Date.now()}.${ext}`
  const { error } = await admin.storage.from('scriptorium').upload(storagePath, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  })
  if (error) return { error: error.message }
  return { path: storagePath }
}

async function uploaderFichier(userId: string, documentId: string, fichier: File): Promise<{ path?: string; error?: string }> {
  const ext = fichier.name.split('.').pop()?.toLowerCase() || 'bin'
  const buffer = Buffer.from(await fichier.arrayBuffer())
  return uploaderBuffer(userId, documentId, buffer, ext, fichier.type)
}

// ── Contenu (item multi-classes : unité + semaine + corps) ──────────────────

export async function ajouterContenu(formData: FormData) {
  const { supabase, userId } = await verifierProf()

  let uniteId = (formData.get('uniteId') as string) || ''
  const nouvelleUnite = (formData.get('nouvelleUnite') as string)?.trim() || ''
  const semaineRaw = formData.get('semaine') as string
  const semaine = semaineRaw ? Number(semaineRaw) : null
  const nom = (formData.get('nom') as string)?.trim()
  let texte = (formData.get('texte') as string)?.trim() || null
  const legende = (formData.get('legende') as string)?.trim() || null
  const classeIds = formData.getAll('classeIds').map(c => c as string).filter(Boolean)
  const fichier = formData.get('fichier') as File | null

  if (!nom) return { error: 'Donne un nom au contenu.' }
  if (classeIds.length === 0) return { error: 'Assigne au moins une classe.' }

  // Unité : existante ou créée à la volée.
  if (!uniteId && nouvelleUnite) {
    const res = await creerUnite(nouvelleUnite)
    if (res.error || !res.id) return { error: res.error ?? 'Création d\'unité impossible' }
    uniteId = res.id
  }
  if (!uniteId) return { error: 'Choisis ou crée une unité.' }

  // Fichier optionnel : image → pièce jointe ; document texte → extraction.
  let fichierImage: File | null = null
  if (fichier && fichier.size > 0) {
    if (estImage(fichier.type, fichier.name)) {
      fichierImage = fichier
    } else {
      const buffer = Buffer.from(await fichier.arrayBuffer())
      const extrait = await extraireTexte(buffer, fichier.type, fichier.name)
      if (extrait) texte = [texte, extrait].filter(Boolean).join('\n\n')
    }
  }

  const { data: doc, error } = await supabase
    .from('scriptorium_documents')
    .insert({
      unite_id: uniteId,
      type: 'cours',
      titre: nom,
      texte_extrait: texte,
      legende,
      semaine,
      created_by: userId,
    })
    .select('id')
    .single()
  if (error || !doc) return { error: error?.message ?? 'Erreur' }

  // Assignation multi-classes.
  const { error: errClasses } = await supabase
    .from('scriptorium_document_classes')
    .insert(classeIds.map(classe_id => ({ document_id: doc.id, classe_id })))
  if (errClasses) return { error: errClasses.message }

  // Image jointe le cas échéant.
  if (fichierImage) {
    const up = await uploaderFichier(userId, doc.id, fichierImage)
    if (up.path) {
      await supabase.from('scriptorium_contenu_images').insert({ document_id: doc.id, fichier_ref: up.path, legende })
    }
  }

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// ── Livre (Aletheia Lot 1) ──────────────────────────────────────────────────
// Un livre = une unité `type='livre'` (label = titre, + date_debut, nb_semaines).
// Chaque semaine = un document de cette unité : PDF d'ancrage (extrait en texte),
// titre, chapitres, index `semaine`. Classes assignées par semaine (liaison Lot 6).
// Les PDF sont stockés dans le bucket Scriptorium : ancrage IA, jamais exposés
// à l'élève (aucune route élève ne les sert).
export async function ajouterLivre(formData: FormData) {
  const { supabase, userId } = await verifierProf()

  const titre = (formData.get('titre') as string)?.trim()
  const nbSemaines = Number(formData.get('nbSemaines') as string)
  const dateDebut = (formData.get('dateDebut') as string) || null
  const classeIds = formData.getAll('classeIds').map(c => c as string).filter(Boolean)

  if (!titre) return { error: 'Donne un titre au livre.' }
  if (!Number.isInteger(nbSemaines) || nbSemaines < 1 || nbSemaines > 52)
    return { error: 'Indique un nombre de semaines valide (1–52).' }
  if (!dateDebut) return { error: 'Indique une date de début.' }
  if (classeIds.length === 0) return { error: 'Assigne au moins une classe.' }

  // Le livre est une unité, placée après les unités existantes.
  const { data: derniere } = await supabase
    .from('scriptorium_unites')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()
  const ordre = (derniere?.ordre ?? 0) + 1

  const { data: livre, error: errLivre } = await supabase
    .from('scriptorium_unites')
    .insert({ label: titre, ordre, type: 'livre', date_debut: dateDebut, nb_semaines: nbSemaines })
    .select('id')
    .single()
  if (errLivre || !livre) return { error: errLivre?.message ?? 'Création du livre impossible.' }

  // Création quasi-atomique : pas de transaction multi-tables côté Supabase REST,
  // donc on nettoie nous-mêmes si une étape échoue → pas de livre orphelin. On
  // supprime les documents AVANT l'unité (sans dépendre d'un cascade unite_id non
  // garanti) ; supprimer un document cascade vers ses classes et images (Lot 6).
  const cheminsUploades: string[] = []
  const admin = createAdminClient()
  const annuler = async (msg: string) => {
    if (cheminsUploades.length > 0) await admin.storage.from('scriptorium').remove(cheminsUploades)
    await supabase.from('scriptorium_documents').delete().eq('unite_id', livre.id)
    await supabase.from('scriptorium_unites').delete().eq('id', livre.id)
    return { error: msg }
  }

  // Une semaine = un document de cette unité (PDF extrait + titre + chapitres).
  for (let n = 1; n <= nbSemaines; n++) {
    const titreSem = (formData.get(`semaine_${n}_titre`) as string)?.trim() || `Semaine ${n}`
    const chapitres = (formData.get(`semaine_${n}_chapitres`) as string)?.trim() || null
    const pdf = formData.get(`semaine_${n}_pdf`) as File | null

    // Le buffer du PDF est lu UNE fois (extraction + upload).
    let buffer: Buffer | null = null
    let texteExtrait: string | null = null
    if (pdf && pdf.size > 0) {
      buffer = Buffer.from(await pdf.arrayBuffer())
      // Extraction de texte (ancrage IA) — non bloquante si le PDF est illisible/scanné.
      try {
        texteExtrait = await extraireTexte(buffer, pdf.type, pdf.name)
      } catch (err) {
        console.error(`[scriptorium] extraction PDF semaine ${n} :`, err)
      }
    }

    const { data: doc, error: errDoc } = await supabase
      .from('scriptorium_documents')
      .insert({
        unite_id: livre.id,
        type: 'texte_source',
        titre: titreSem,
        semaine: n,
        chapitres,
        texte_extrait: texteExtrait,
        created_by: userId,
      })
      .select('id')
      .single()
    if (errDoc || !doc) return annuler(errDoc?.message ?? `Erreur sur la semaine ${n}.`)

    // Upload du PDF (réservé serveur) puis enregistrement de la référence. Le PDF
    // est la raison d'être de la semaine (ancrage IA) → un échec est bloquant.
    if (buffer) {
      const ext = pdf!.name.split('.').pop()?.toLowerCase() || 'pdf'
      const up = await uploaderBuffer(userId, doc.id, buffer, ext, pdf!.type)
      if (up.error || !up.path) return annuler(`Téléversement du PDF de la semaine ${n} impossible : ${up.error ?? 'inconnu'}`)
      cheminsUploades.push(up.path)
      const { error: errRef } = await supabase.from('scriptorium_documents').update({ fichier_ref: up.path }).eq('id', doc.id)
      if (errRef) return annuler(errRef.message)
    }
  }

  // Assignation AU NIVEAU DU LIVRE : un seul jeu de classes pour tout le livre
  // (source de vérité du planning élève — cf. scriptorium_unite_classes, Lot 2).
  const { error: errClasses } = await supabase
    .from('scriptorium_unite_classes')
    .insert(classeIds.map(classe_id => ({ unite_id: livre.id, classe_id })))
  if (errClasses) return annuler(errClasses.message)

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

// Réassigner les classes d'un livre (au niveau du livre). Remplace tout le jeu.
export async function reassignerClassesLivre(uniteId: string, classeIds: string[]) {
  const { supabase } = await verifierProf()
  await supabase.from('scriptorium_unite_classes').delete().eq('unite_id', uniteId)
  if (classeIds.length > 0) {
    const { error } = await supabase
      .from('scriptorium_unite_classes')
      .insert(classeIds.map(classe_id => ({ unite_id: uniteId, classe_id })))
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function modifierContenu(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const nom = (formData.get('nom') as string)?.trim()
  const semaineRaw = formData.get('semaine') as string
  const semaine = semaineRaw ? Number(semaineRaw) : null
  const texte = (formData.get('texte') as string)?.trim() || null
  const chapitres = (formData.get('chapitres') as string)?.trim() || null
  const uniteId = (formData.get('uniteId') as string) || undefined

  if (!nom) return { error: 'Le nom est requis.' }

  const maj: Record<string, unknown> = { titre: nom, semaine, texte_extrait: texte, chapitres }
  if (uniteId) maj.unite_id = uniteId

  const { error } = await supabase.from('scriptorium_documents').update(maj).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function reassignerClasses(documentId: string, classeIds: string[]) {
  const { supabase } = await verifierProf()
  await supabase.from('scriptorium_document_classes').delete().eq('document_id', documentId)
  if (classeIds.length > 0) {
    const { error } = await supabase
      .from('scriptorium_document_classes')
      .insert(classeIds.map(classe_id => ({ document_id: documentId, classe_id })))
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerContenu(id: string) {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()

  // Collecter les fichiers (image legacy + images enfants) avant suppression.
  const [{ data: doc }, { data: images }] = await Promise.all([
    supabase.from('scriptorium_documents').select('fichier_ref').eq('id', id).maybeSingle(),
    supabase.from('scriptorium_contenu_images').select('fichier_ref').eq('document_id', id),
  ])

  const { error } = await supabase.from('scriptorium_documents').delete().eq('id', id)
  if (error) return { error: error.message }

  const chemins = [
    ...(doc?.fichier_ref ? [doc.fichier_ref] : []),
    ...((images ?? []).map(i => i.fichier_ref as string)),
  ]
  if (chemins.length > 0) await admin.storage.from('scriptorium').remove(chemins)

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function ajouterImage(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const documentId = formData.get('documentId') as string
  const legende = (formData.get('legende') as string)?.trim() || null
  const fichier = formData.get('fichier') as File | null

  if (!fichier || fichier.size === 0) return { error: 'Aucune image fournie.' }
  if (!estImage(fichier.type, fichier.name)) return { error: 'Le fichier doit être une image.' }

  const up = await uploaderFichier(userId, documentId, fichier)
  if (up.error || !up.path) return { error: up.error ?? 'Upload impossible' }

  const { data: dernier } = await supabase
    .from('scriptorium_contenu_images')
    .select('ordre')
    .eq('document_id', documentId)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('scriptorium_contenu_images').insert({
    document_id: documentId,
    fichier_ref: up.path,
    legende,
    ordre: (dernier?.ordre ?? 0) + 1,
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerImage(imageId: string) {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()
  const { data: img } = await supabase
    .from('scriptorium_contenu_images')
    .select('fichier_ref')
    .eq('id', imageId)
    .maybeSingle()

  const { error } = await supabase.from('scriptorium_contenu_images').delete().eq('id', imageId)
  if (error) return { error: error.message }
  if (img?.fichier_ref) await admin.storage.from('scriptorium').remove([img.fichier_ref])
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function getUrlSignee(storagePath: string): Promise<string | null> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.storage.from('scriptorium').createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}
