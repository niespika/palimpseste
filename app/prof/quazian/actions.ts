'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { extraireFlashcards, extraireFlashcardsTexte, genererVerso, type FlashcardSuggestion } from '@/utils/extraire-flashcards'
import { colonneCible, refCible, resoudreCible, type CibleQuazian } from '@/utils/quazian-cibles'

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

// C7·L1 — `lireUnitesScriptorium()` a été retirée : elle demandait
// `scriptorium_unites` où `type='unite'`, c'est-à-dire zéro ligne depuis la
// réorganisation du Scriptorium (§4.1 du RAPPORT_Diagnostic_C7_quazian.md), et
// n'avait plus aucun appelant. La liste des cibles vit désormais dans
// `utils/quazian-cibles.ts` (`chargerCiblesQuazian`), bi-source.

// ── Génération de cartes ─────────────────────────────────────────────────────

/**
 * Le corpus d'une cible, et la manière de le décortiquer.
 *
 * Distinction F2 (antérieure à ce lot, restaurée ici) : un COURS se décortique en
 * cartes atomiques ; un TEXTE SOURCE ne donne qu'1-2 cartes — on ne dissèque pas
 * un extrait d'œuvre comme un cours. Avant C7·L1 le test était `type === 'texte'`
 * sur `scriptorium_documents`, dont les lignes valent `'texte_source'` : la
 * comparaison était TOUJOURS fausse et tout partait en cours (§4.2 du rapport).
 */
const EST_TEXTE_SOURCE = new Set(['texte', 'texte_source'])

async function corpusDeLaCible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cible: CibleQuazian,
): Promise<{ cours: string; textes: { titre: string; contenu: string }[] }> {
  if (cible.bras === 'contenu') {
    const { data: c } = await supabase
      .from('scriptorium_contenus')
      .select('titre, auteur, type, texte_extrait')
      .eq('id', cible.id)
      .maybeSingle()
    const texte = ((c?.texte_extrait as string | null) ?? '').trim()
    if (!texte) return { cours: '', textes: [] }
    const entete = `## ${c!.titre}${c!.auteur ? ` (${c!.auteur})` : ''}`
    return EST_TEXTE_SOURCE.has(c!.type as string)
      ? { cours: '', textes: [{ titre: c!.titre as string, contenu: `${entete}\n\n${texte}` }] }
      : { cours: `${entete}\n\n${texte}`, textes: [] }
  }

  // Bras hérité : les documents de l'unité (une base sans unité n'entre jamais ici).
  const { data: docs } = await supabase
    .from('scriptorium_documents')
    .select('titre, texte_extrait, legende, type')
    .eq('unite_id', cible.id)

  const contenuDoc = (d: { titre: string; texte_extrait: string | null; legende: string | null }) =>
    [`## ${d.titre}`, d.texte_extrait, d.legende ? `(Légende : ${d.legende})` : null].filter(Boolean).join('\n\n').trim()

  const cours = (docs ?? []).filter((d) => !EST_TEXTE_SOURCE.has((d.type as string) ?? 'cours'))
    .map(contenuDoc).filter((s) => s.length > 0).join('\n\n---\n\n')
  const textes = (docs ?? []).filter((d) => EST_TEXTE_SOURCE.has((d.type as string) ?? 'cours'))
    .map((d) => ({ titre: d.titre as string, contenu: contenuDoc(d) })).filter((t) => t.contenu.length > 0)
  return { cours, textes }
}

/**
 * Génère les cartes d'UNE cible (un cours, un texte, ou une unité héritée) et les
 * dépose en `suggere` — la file de validation prof existe déjà, on l'alimente.
 *
 * Le coût API est journalisé par `extraireFlashcards*` (module `quazian`), sans
 * classe ni élève : le contenu est PARTAGÉ entre classes, il n'y a structurellement
 * personne à qui l'attribuer (cf. utils/extraire-flashcards.ts et le pied de la
 * section C11a de SUIVI_tests_manuels.md).
 */
export async function genererCartes(cibleId: string) {
  const { supabase, userId } = await verifierProf()

  const cible = await resoudreCible(supabase, cibleId)
  if (!cible) return { error: 'Contenu introuvable (ou retiré du Scriptorium).' }

  const { cours, textes } = await corpusDeLaCible(supabase, cible)
  if (!cours.trim() && textes.length === 0) {
    return { error: `Aucun texte dans « ${cible.label} ». Ajoute son contenu dans le Scriptorium avant de générer.` }
  }

  let suggestions: FlashcardSuggestion[]
  try {
    const lots: FlashcardSuggestion[][] = []
    if (cours.trim()) lots.push(await extraireFlashcards(cours, cible.label))
    // Un appel par texte source → le plafond 1-2 cartes est garanti par texte.
    for (const t of textes) lots.push(await extraireFlashcardsTexte(t.contenu, t.titre, 2))
    suggestions = lots.flat()
  } catch (e) {
    console.error('[quazian] génération de cartes :', e)
    return { error: 'La génération IA a échoué (réponse inattendue du modèle). Réessaie.' }
  }

  if (suggestions.length === 0) return { error: "L'IA n'a généré aucune carte exploitable. Réessaie." }

  const ancrage = refCible(cible)
  const cartes = suggestions.map((s) => ({
    ...ancrage,
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
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true, nb: cartes.length }
}

// ── Vie d'une carte ──────────────────────────────────────────────────────────

// Valider une carte
export async function validerCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const cibleId = formData.get('cibleId') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ statut: 'valide' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true }
}

// Supprimer définitivement une carte
export async function supprimerCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const cibleId = formData.get('cibleId') as string

  const { error } = await supabase.from('quazian_flashcards').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true }
}

// Archiver une carte
export async function archiverCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const cibleId = formData.get('cibleId') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ statut: 'archive' })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true }
}

// Modifier recto/verso/tag d'une carte
export async function modifierCarte(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const cibleId = formData.get('cibleId') as string
  const recto = formData.get('recto') as string
  const verso = formData.get('verso') as string
  const concept_tag = formData.get('concept_tag') as string
  const type = formData.get('type') as string

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ recto, verso, concept_tag, type })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true }
}

// Ajouter une carte manuellement
export async function ajouterCarteManuellement(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const cibleId = formData.get('cibleId') as string

  const cible = await resoudreCible(supabase, cibleId)
  if (!cible) return { error: 'Contenu introuvable (ou retiré du Scriptorium).' }

  const { error } = await supabase.from('quazian_flashcards').insert({
    ...refCible(cible),
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
  revalidatePath(`/prof/quazian/${cibleId}`)
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

// Valider toutes les cartes "suggere" d'une cible d'un coup
export async function validerToutesLesSuggerees(formData: FormData) {
  const { supabase } = await verifierProf()
  const cibleId = formData.get('cibleId') as string

  const cible = await resoudreCible(supabase, cibleId)
  if (!cible) return { error: 'Contenu introuvable (ou retiré du Scriptorium).' }

  const { error } = await supabase
    .from('quazian_flashcards')
    .update({ statut: 'valide' })
    .eq(colonneCible(cible.bras), cibleId)
    .eq('statut', 'suggere')

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true }
}

// ── Publication ──────────────────────────────────────────────────────────────

/**
 * Publier / dépublier une cible (visibilité des cartes aux élèves).
 *
 * `resoudreCible` est le garde-fou anti-spoiler : elle ne rend jamais un LIVRE
 * (son texte extrait est un ancrage IA d'Aletheia). Le refus explicite d'avant
 * C7·L1 (« Un livre ne se publie pas via Quazian ») devient donc structurel.
 *
 * ⚠️ `quazian_publications.classe_id` n'est PAS alimentée par le bras contenu :
 * c'est une colonne `text` héritée, écrite avec un LIBELLÉ de classe et lue par
 * personne (§4.5 du rapport). Son sort est un arbitrage (R7, §10.1), pas une
 * remise en marche — on ne reconduit simplement pas l'écriture.
 */
export async function togglePublication(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const cibleId = formData.get('cibleId') as string
  const actuel = formData.get('actuel') === 'true'

  const cible = await resoudreCible(supabase, cibleId)
  if (!cible) return { error: 'Contenu introuvable (ou retiré du Scriptorium).' }

  const { data: existing } = await supabase
    .from('quazian_publications')
    .select('id')
    .eq(colonneCible(cible.bras), cibleId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('quazian_publications')
      .update({ flashcards_visibles: !actuel, published_at: actuel ? null : new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('quazian_publications').insert({
      ...refCible(cible),
      flashcards_visibles: true,
      published_at: new Date().toISOString(),
      created_by: userId,
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/prof/quazian')
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true }
}
