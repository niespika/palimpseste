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

export async function creerUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const label = formData.get('label') as string
  const classe = (formData.get('classe') as string) || null

  // Trouver l'ordre max existant
  const { data: derniere } = await supabase
    .from('scriptorium_unites')
    .select('ordre')
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ordre = (derniere?.ordre ?? 0) + 1

  const { error } = await supabase.from('scriptorium_unites').insert({
    label: label || `Semaine ${ordre}`,
    classe,
    ordre,
  })

  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function renommerUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const label = formData.get('label') as string

  const { error } = await supabase
    .from('scriptorium_unites')
    .update({ label })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function supprimerUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string

  // Supprimer les documents associés d'abord (cascade côté SQL normalement, mais par sécurité)
  const { error } = await supabase
    .from('scriptorium_unites')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function monterUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const ordre = parseInt(formData.get('ordre') as string)

  // Trouver l'unité qui précède
  const { data: precedente } = await supabase
    .from('scriptorium_unites')
    .select('id, ordre')
    .lt('ordre', ordre)
    .order('ordre', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!precedente) return { success: true }

  // Échanger les ordres
  await supabase.from('scriptorium_unites').update({ ordre: precedente.ordre }).eq('id', id)
  await supabase.from('scriptorium_unites').update({ ordre }).eq('id', precedente.id)

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function descendreUnite(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const ordre = parseInt(formData.get('ordre') as string)

  const { data: suivante } = await supabase
    .from('scriptorium_unites')
    .select('id, ordre')
    .gt('ordre', ordre)
    .order('ordre', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!suivante) return { success: true }

  await supabase.from('scriptorium_unites').update({ ordre: suivante.ordre }).eq('id', id)
  await supabase.from('scriptorium_unites').update({ ordre }).eq('id', suivante.id)

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

async function extraireTexte(buffer: Buffer, mimeType: string, nomFichier: string): Promise<string | null> {
  const ext = nomFichier.split('.').pop()?.toLowerCase()

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const { extractText } = await import('unpdf')
      const { text } = await extractText(new Uint8Array(buffer))
      return text.trim() || null
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

export async function ajouterDocument(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const admin = createAdminClient()

  const uniteId = formData.get('uniteId') as string
  const type = formData.get('type') as string
  const titre = formData.get('titre') as string
  const auteur = (formData.get('auteur') as string) || null
  const fichier = formData.get('fichier') as File | null

  if (!fichier || fichier.size === 0) return { error: 'Aucun fichier fourni' }

  const ext = fichier.name.split('.').pop()?.toLowerCase() || 'bin'
  const storagePath = `${userId}/${uniteId}/${Date.now()}.${ext}`

  const arrayBuffer = await fichier.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload dans le bucket scriptorium
  const { error: uploadErr } = await admin.storage
    .from('scriptorium')
    .upload(storagePath, buffer, {
      contentType: fichier.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadErr) return { error: uploadErr.message }

  // Extraction de texte pour PDF et docx
  const texteExtrait = await extraireTexte(buffer, fichier.type, fichier.name)

  const { error } = await supabase.from('scriptorium_documents').insert({
    unite_id: uniteId,
    type,
    titre: titre || fichier.name,
    auteur,
    fichier_ref: storagePath,
    texte_extrait: texteExtrait,
    created_by: userId,
  })

  if (error) {
    // Nettoyer le fichier si l'insert échoue
    await admin.storage.from('scriptorium').remove([storagePath])
    return { error: error.message }
  }

  revalidatePath(`/prof/scriptorium/${uniteId}`)
  return { success: true }
}

export async function supprimerDocument(formData: FormData) {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()
  const id = formData.get('id') as string

  const { data: doc } = await supabase
    .from('scriptorium_documents')
    .select('fichier_ref')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('scriptorium_documents')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  if (doc?.fichier_ref) {
    await admin.storage.from('scriptorium').remove([doc.fichier_ref])
  }

  revalidatePath('/prof/scriptorium')
  return { success: true }
}

export async function getUrlSignee(storagePath: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin.storage
    .from('scriptorium')
    .createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? null
}
