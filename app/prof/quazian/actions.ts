'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { extraireFlashcards, genererVerso } from '@/utils/extraire-flashcards'

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

// Lire les unités du Scriptorium (contrat de lecture)
export async function lireUnitesScriptorium() {
  const { supabase } = await verifierProf()

  const { data: unites } = await supabase
    .from('scriptorium_unites')
    .select('id, label, classe, ordre')
    .eq('type', 'unite')   // exclut les « livres » Aletheia des unités de cours
    .order('ordre', { ascending: true })

  return unites ?? []
}

// Lire le texte extrait d'une unité (tous les docs textuels)
export async function lireTexteUnite(uniteId: string) {
  const { supabase } = await verifierProf()

  const { data: docs } = await supabase
    .from('scriptorium_documents')
    .select('titre, auteur, type, texte_extrait')
    .eq('unite_id', uniteId)
    .not('texte_extrait', 'is', null)
    .order('created_at', { ascending: true })

  return docs ?? []
}

// Lancer l'extraction IA de flashcards pour une unité (ou un document spécifique)
export async function lancerExtractionIA(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const uniteId = formData.get('uniteId') as string
  const documentId = (formData.get('documentId') as string) || null

  // Récupérer le label de l'unité
  const { data: unite } = await supabase
    .from('scriptorium_unites')
    .select('label')
    .eq('id', uniteId)
    .single()

  if (!unite) return { error: 'Unité introuvable' }

  let docsQuery = supabase
    .from('scriptorium_documents')
    .select('titre, auteur, texte_extrait')
    .eq('unite_id', uniteId)
    .not('texte_extrait', 'is', null)

  if (documentId) docsQuery = docsQuery.eq('id', documentId)

  const { data: docs } = await docsQuery

  if (!docs || docs.length === 0) return { error: "Aucun texte extrait dans cette unité. Dépose d'abord des documents dans le Scriptorium." }

  const texteComplet = docs
    .map((d) => `## ${d.titre}${d.auteur ? ` (${d.auteur})` : ''}\n\n${d.texte_extrait}`)
    .join('\n\n---\n\n')

  const suggestions = await extraireFlashcards(texteComplet, unite.label)

  // Insérer les cartes avec statut "suggere"
  const cartes = suggestions.map((s) => ({
    scriptorium_unite_id: uniteId,
    type: s.type,
    format: s.format,
    recto: s.recto,
    verso: s.verso,
    concept_tag: s.concept_tag,
    statut: 'suggere',
    source: 'ia',
    created_by: userId,
  }))

  const { error } = await supabase.from('quazian_flashcards').insert(cartes)
  if (error) return { error: error.message }

  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true, nb: cartes.length }
}

// Générer les cartes d'UNE semaine d'une unité (modèle Scriptorium, Lot 7).
// Le texte de tous les contenus de cette (unité, semaine) alimente la génération ;
// les cartes portent la semaine → visibilité élève dérivée du contenu (Lot 6).
export async function genererCartesSemaine(uniteId: string, semaine: number) {
  const { supabase, userId } = await verifierProf()

  const { data: unite } = await supabase
    .from('scriptorium_unites')
    .select('label')
    .eq('id', uniteId)
    .single()
  if (!unite) return { error: 'Unité introuvable' }

  const { data: docs } = await supabase
    .from('scriptorium_documents')
    .select('titre, texte_extrait, legende')
    .eq('unite_id', uniteId)
    .eq('semaine', semaine)

  const texteComplet = (docs ?? [])
    .map(d => [`## ${d.titre}`, d.texte_extrait, d.legende ? `(Légende : ${d.legende})` : null].filter(Boolean).join('\n\n'))
    .filter(s => s.trim().length > 0)
    .join('\n\n---\n\n')

  if (!texteComplet.trim()) {
    return { error: "Aucun texte dans cette semaine. Ajoute du contenu (texte ou légende) dans le Scriptorium." }
  }

  const suggestions = await extraireFlashcards(texteComplet, `${unite.label} — Semaine ${semaine}`)

  const cartes = suggestions.map(s => ({
    scriptorium_unite_id: uniteId,
    semaine,
    type: s.type,
    format: s.format,
    recto: s.recto,
    verso: s.verso,
    concept_tag: s.concept_tag,
    statut: 'suggere',
    source: 'ia',
    created_by: userId,
  }))

  const { error } = await supabase.from('quazian_flashcards').insert(cartes)
  if (error) return { error: error.message }

  revalidatePath('/prof/quazian')
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true, nb: cartes.length }
}

// Valider une carte
export async function validerCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const uniteId = formData.get('uniteId') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ statut: 'valide' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}

// Supprimer définitivement une carte
export async function supprimerCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const uniteId = formData.get('uniteId') as string

  const { error } = await supabase.from('quazian_flashcards').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}

// Archiver une carte
export async function archiverCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const uniteId = formData.get('uniteId') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ statut: 'archive' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}

// Modifier recto/verso/tag d'une carte
export async function modifierCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const uniteId = formData.get('uniteId') as string
  const recto = formData.get('recto') as string
  const verso = formData.get('verso') as string
  const concept_tag = formData.get('concept_tag') as string
  const type = formData.get('type') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ recto, verso, concept_tag, type })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}

// Ajouter une carte manuellement
export async function ajouterCarteManuellement(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const uniteId = formData.get('uniteId') as string

  const { error } = await supabase.from('quazian_flashcards').insert({
    scriptorium_unite_id: uniteId,
    type: formData.get('type') as string,
    format: formData.get('format') as string,
    recto: formData.get('recto') as string,
    verso: formData.get('verso') as string,
    concept_tag: (formData.get('concept_tag') as string) || '',
    statut: 'valide',
    source: 'prof',
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}

// Générer le verso depuis le recto (aide IA)
export async function aideIAVers(formData: FormData) {
  const recto = formData.get('recto') as string
  if (!recto) return { error: 'Recto vide' }
  await verifierProf()
  const verso = await genererVerso(recto)
  return { verso }
}

// Publier / dépublier une unité (visibilité des cartes aux élèves)
export async function togglePublicationUnite(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const uniteId = formData.get('uniteId') as string
  const actuel = formData.get('actuel') === 'true'

  // Garde-fou : un « livre » Aletheia ne se publie jamais via Quazian — son texte
  // extrait est un ancrage IA qui ne doit pas atteindre l'élève (defense-in-depth).
  const { data: u } = await supabase.from('scriptorium_unites').select('type').eq('id', uniteId).maybeSingle()
  if (u?.type === 'livre') return { error: 'Un livre ne se publie pas via Quazian.' }

  const { data: existing } = await supabase
    .from('quazian_publications')
    .select('id')
    .eq('scriptorium_unite_id', uniteId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('quazian_publications')
      .update({ flashcards_visibles: !actuel, published_at: actuel ? null : new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    // Récupérer la classe depuis l'unité
    const { data: unite } = await supabase
      .from('scriptorium_unites')
      .select('classe')
      .eq('id', uniteId)
      .single()

    await supabase.from('quazian_publications').insert({
      scriptorium_unite_id: uniteId,
      classe_id: unite?.classe ?? null,
      flashcards_visibles: true,
      published_at: new Date().toISOString(),
      created_by: userId,
    })
  }

  revalidatePath('/prof/quazian')
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}

// Valider toutes les cartes "suggere" d'un coup
export async function validerToutesLesSuggerees(formData: FormData) {
  const { supabase } = await verifierProf()
  const uniteId = formData.get('uniteId') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ statut: 'valide' })
    .eq('scriptorium_unite_id', uniteId)
    .eq('statut', 'suggere')

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${uniteId}`)
  return { success: true }
}
