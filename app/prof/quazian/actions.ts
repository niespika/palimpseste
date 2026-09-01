'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { extraireFlashcards, extraireFlashcardsTexte, genererVerso, type FlashcardSuggestion } from '@/utils/extraire-flashcards'
import { colonneCible, refCible, resoudreCible, type CibleQuazian } from '@/utils/quazian-cibles'
import { normaliserRetours } from '@/utils/passation/transcription-calcul'
import { plafondValide, quotasDesLots } from '@/utils/quazian-quotas'
import type { Parametres } from '@/utils/quazian-params'

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
 * Le corpus d'une cible, découpé en LOTS de génération — un appel IA par lot.
 *
 * Distinction F2 (antérieure à C7·L1, restaurée là) : un COURS se décortique en
 * cartes atomiques ; un TEXTE SOURCE ne donne qu'1-2 cartes — on ne dissèque pas
 * un extrait d'œuvre comme un cours. Avant C7·L1 le test était `type === 'texte'`
 * sur `scriptorium_documents`, dont les lignes valent `'texte_source'` : la
 * comparaison était TOUJOURS fausse et tout partait en cours (§4.2 du rapport).
 *
 * ⚠️ C7·L3 — un cours DÉCOUPÉ se génère SOUS-SECTION PAR SOUS-SECTION, et chaque
 * carte naît avec son `section_id`. C'est ce qui permet au « vu » de filtrer au
 * bon grain : le Scriptorium matérialise un élément par sous-section, donc une
 * carte qui ne saurait dire d'où elle vient ne pourrait être qu'au grain du cours
 * entier. Un cours NON découpé et un texte source gardent le grain contenu.
 */
const EST_TEXTE_SOURCE = new Set(['texte', 'texte_source'])

/** Un appel IA : le texte à décortiquer, son étiquette, son ancrage. */
interface LotGeneration {
  texte: string
  /** Libellé donné au prompt (« Cours — Sous-section »). */
  label: string
  /** F2 : plafonné à 1-2 cartes au lieu d'un décorticage complet. */
  texteSource: boolean
  /** Sous-section d'origine — null = grain contenu. */
  sectionId: string | null
}

/**
 * Le plafond du prof, lu en base. `quazian_parametres.valeur` est un `jsonb`
 * partagé avec les paramètres de notation : rien à migrer, la clé manque
 * simplement dans les lignes écrites avant ce garde-fou.
 */
async function plafondDuProf(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const { data } = await supabase
    .from('quazian_parametres').select('valeur').eq('cle', 'global').maybeSingle()
  return plafondValide((data?.valeur as Partial<Parametres> | null)?.plafond_cartes)
}

async function corpusDeLaCible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cible: CibleQuazian,
): Promise<LotGeneration[]> {
  if (cible.bras === 'contenu') {
    const { data: c } = await supabase
      .from('scriptorium_contenus')
      .select('titre, auteur, type, texte_extrait')
      .eq('id', cible.id)
      .maybeSingle()
    if (!c) return []
    const titre = c.titre as string
    const entete = `## ${titre}${c.auteur ? ` (${c.auteur})` : ''}`
    const texte = ((c.texte_extrait as string | null) ?? '').trim()

    if (EST_TEXTE_SOURCE.has(c.type as string)) {
      return texte ? [{ texte: `${entete}\n\n${texte}`, label: titre, texteSource: true, sectionId: null }] : []
    }

    // Cours DÉCOUPÉ → un lot par sous-section, dans l'ordre du texte. Le corps de
    // la section fait foi (`scriptorium_contenu_sections.texte`, dérivé côté
    // serveur à la découpe), jamais un re-découpage improvisé du texte entier.
    const { data: sections } = await supabase
      .from('scriptorium_contenu_sections')
      .select('id, ordre, titre, texte')
      .eq('contenu_id', cible.id)
      .order('ordre', { ascending: true })
    const lots: LotGeneration[] = []
    for (const s of sections ?? []) {
      const corps = ((s.texte as string | null) ?? '').trim()
      if (!corps) continue // sous-section vide → rien à décortiquer, on l'ignore
      lots.push({
        texte: `${entete} — ${s.titre}\n\n${corps}`,
        label: `${titre} — ${s.titre as string}`,
        texteSource: false,
        sectionId: s.id as string,
      })
    }
    if (lots.length > 0) return lots

    // Cours non découpé (ou découpe entièrement vide) → grain contenu.
    return texte ? [{ texte: `${entete}\n\n${texte}`, label: titre, texteSource: false, sectionId: null }] : []
  }

  // Bras hérité : les documents de l'unité (une base sans unité n'entre jamais
  // ici). Les unités n'ont pas de sections — le grain reste l'unité.
  const { data: docs } = await supabase
    .from('scriptorium_documents')
    .select('titre, texte_extrait, legende, type')
    .eq('unite_id', cible.id)

  const contenuDoc = (d: { titre: string; texte_extrait: string | null; legende: string | null }) =>
    [`## ${d.titre}`, d.texte_extrait, d.legende ? `(Légende : ${d.legende})` : null].filter(Boolean).join('\n\n').trim()

  const cours = (docs ?? []).filter((d) => !EST_TEXTE_SOURCE.has((d.type as string) ?? 'cours'))
    .map(contenuDoc).filter((s) => s.length > 0).join('\n\n---\n\n')
  const lots: LotGeneration[] = cours.trim()
    ? [{ texte: cours, label: cible.label, texteSource: false, sectionId: null }]
    : []
  for (const d of (docs ?? []).filter((d) => EST_TEXTE_SOURCE.has((d.type as string) ?? 'cours'))) {
    const contenu = contenuDoc(d as { titre: string; texte_extrait: string | null; legende: string | null })
    if (contenu.length > 0) {
      lots.push({ texte: contenu, label: d.titre as string, texteSource: true, sectionId: null })
    }
  }
  return lots
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

  const lots = await corpusDeLaCible(supabase, cible)
  if (lots.length === 0) {
    return { error: `Aucun texte dans « ${cible.label} ». Ajoute son contenu dans le Scriptorium avant de générer.` }
  }

  const plafond = await plafondDuProf(supabase)
  const quotas = quotasDesLots(lots, plafond)

  const ancrage = refCible(cible)
  const cartes: Record<string, unknown>[] = []
  try {
    for (const [i, lot] of lots.entries()) {
      // Un appel par lot, chacun avec SON quota — et pas d'appel du tout quand le
      // quota est nul (cours découpé en plus de sous-sections que le plafond).
      const max = quotas[i]
      if (max <= 0) continue
      const suggestions: FlashcardSuggestion[] = lot.texteSource
        ? await extraireFlashcardsTexte(lot.texte, lot.label, max)
        : await extraireFlashcards(lot.texte, lot.label, max)
      for (const s of suggestions) {
        cartes.push({
          ...ancrage,
          ...(lot.sectionId ? { section_id: lot.sectionId } : {}),
          type: s.type,
          format: s.format,
          recto: s.recto,
          verso: s.verso,
          concept_tag: s.concept_tag,
          statut: 'suggere',
          source: 'ia',
          created_by: userId,
        })
      }
    }
  } catch (e) {
    console.error('[quazian] génération de cartes :', e)
    return { error: 'La génération IA a échoué (réponse inattendue du modèle). Réessaie.' }
  }

  if (cartes.length === 0) return { error: "L'IA n'a généré aucune carte exploitable. Réessaie." }

  const { error } = await supabase.from('quazian_flashcards').insert(cartes)
  if (error) {
    // Le code part avant le SQL (protocole renforcé) : sur un cours DÉCOUPÉ, tant
    // que `c7_quazian_sections.sql` n'est pas joué, Postgres refuse la colonne.
    // Le dire en clair plutôt que de renvoyer son message brut.
    if (error.message.includes('section_id')) {
      return { error: 'La base ne connaît pas encore les sous-sections — joue `c7_quazian_sections.sql` (cf. SUIVI_SQL.md), puis régénère.' }
    }
    return { error: error.message }
  }

  revalidatePath('/prof/quazian')
  revalidatePath(`/prof/quazian/${cibleId}`)
  return { success: true, nb: cartes.length, plafond }
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
    recto: normaliserRetours(String(formData.get('recto') ?? '')),
    verso: normaliserRetours(String(formData.get('verso') ?? '')),
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

// ── Publication — SUPPRIMÉE (C7·L3) ──────────────────────────────────────────
//
// `togglePublication()` a été retirée avec le bouton « Publier aux élèves /
// Masquer » qui l'appelait. La visibilité élève n'est plus un geste Quazian :
// elle suit le « VU » du Scriptorium, celui que le prof pose déjà dans le
// pilotage de sa classe (`marquerVu`, app/prof/scriptorium/actions.ts). La règle
// vit dans `utils/quazian-visibilite.ts`, le périmètre dans
// `perimetreVuClasses()` — et l'écran prof DIT cet état au lieu d'offrir un
// bouton (« Test — 3 sous-sections vues sur 5 → 12 cartes visibles »).
//
// Ce que ça règle au passage : §10.2 du rapport de diagnostic (« la publication
// reste globale, pas par classe ») — le « vu » étant par CLASSE, la divergence
// entre classes est native, sans rien à publier deux fois.
//
// ⚠️ La TABLE `quazian_publications` reste en base, intacte : son sort (comme
// celui de sa colonne morte `classe_id`, §4.5 et §10.1) est un arbitrage, pas
// une remise en marche. Plus personne ne l'écrit ; seul le bras UNITÉ hérité la
// lit encore (app/eleve/modules/quazian/actions.ts) — et il n'y a aucune unité
// en base.
