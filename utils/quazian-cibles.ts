// Vocabulaire commun de Quazian après C7 · L1 — l'arc BI-SOURCE.
//
// Une CIBLE Quazian, c'est ce à quoi se rattachent une carte (`quazian_flashcards`),
// une publication (`quazian_publications`) et le périmètre d'un quiz. Deux bras,
// exclusifs (CHECK `*_source_chk`, cf. c7_quazian_contenus.sql) :
//
//   • bras CONTENU  — `scriptorium_contenus` : les Textes et les Cours de la
//     bibliothèque. C'est le monde d'aujourd'hui : tout ce que Quazian crée de
//     neuf s'y ancre.
//   • bras UNITÉ    — `scriptorium_unites` (type='unite') : l'ancien monde. Il
//     n'en reste AUCUNE en base (§3 du RAPPORT_Diagnostic_C7_quazian.md), mais le
//     code continue de savoir les lire : une base qui en aurait garderait ses
//     cartes visibles et éditables au lieu de les voir disparaître.
//
// Les LIVRES (`scriptorium_unites` type='livre') ne sont une cible NI d'un côté
// ni de l'autre : leur texte extrait est un ancrage IA pour Aletheia et ne doit
// jamais atteindre l'élève (règle anti-spoiler, antérieure à ce lot). Les filtres
// ci-dessous l'appliquent à la source plutôt que de compter sur les appelants.

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

export type BrasCible = 'contenu' | 'unite'

export interface CibleQuazian {
  id: string
  bras: BrasCible
  label: string
  /** 'texte' | 'cours' pour le bras contenu ; null pour une unité héritée. */
  genre: 'texte' | 'cours' | null
  /** Texte d'ancrage disponible pour la génération IA (0 = rien à décortiquer). */
  longueurTexte: number
}

/** Ligne d'insertion : la colonne d'ancrage du bon bras, et elle seule. */
export function refCible(cible: Pick<CibleQuazian, 'id' | 'bras'>): Record<string, string> {
  return cible.bras === 'contenu'
    ? { contenu_id: cible.id }
    : { scriptorium_unite_id: cible.id }
}

/** Filtre de lecture : `.eq()` sur la colonne d'ancrage du bon bras. */
export function colonneCible(bras: BrasCible): 'contenu_id' | 'scriptorium_unite_id' {
  return bras === 'contenu' ? 'contenu_id' : 'scriptorium_unite_id'
}

/**
 * Toutes les cibles vivantes, bras contenu d'abord (l'ordre de l'écran prof).
 * Les contenus en corbeille (`supprime_at`) et les unités supprimées sortent :
 * on ne génère plus de cartes sur du contenu retiré.
 */
export async function chargerCiblesQuazian(client: SupabaseClient): Promise<CibleQuazian[]> {
  const [{ data: contenus }, { data: unites }] = await Promise.all([
    client
      .from('scriptorium_contenus')
      .select('id, titre, type, texte_extrait')
      .in('type', ['texte', 'cours'])
      .is('supprime_at', null)
      .order('titre'),
    client
      .from('scriptorium_unites')
      .select('id, label, ordre')
      .eq('type', 'unite')
      .is('supprime_at', null)
      .order('ordre', { ascending: true }),
  ])

  const cibles: CibleQuazian[] = (contenus ?? []).map((c) => ({
    id: c.id as string,
    bras: 'contenu' as const,
    label: c.titre as string,
    genre: c.type as 'texte' | 'cours',
    longueurTexte: ((c.texte_extrait as string | null) ?? '').trim().length,
  }))

  // Bras hérité : la longueur de texte n'est pas lue ici (elle vivrait dans les
  // documents de l'unité) — la génération du bras unité la calcule à la demande.
  for (const u of unites ?? []) {
    cibles.push({ id: u.id as string, bras: 'unite', label: u.label as string, genre: null, longueurTexte: 0 })
  }
  return cibles
}

/** Une cible par son id, quel que soit son bras. `null` si introuvable ou retirée. */
export async function resoudreCible(client: SupabaseClient, id: string): Promise<CibleQuazian | null> {
  const { data: c } = await client
    .from('scriptorium_contenus')
    .select('id, titre, type, texte_extrait')
    .eq('id', id)
    .is('supprime_at', null)
    .maybeSingle()
  if (c) {
    return {
      id: c.id as string,
      bras: 'contenu',
      label: c.titre as string,
      genre: c.type as 'texte' | 'cours',
      longueurTexte: ((c.texte_extrait as string | null) ?? '').trim().length,
    }
  }

  const { data: u } = await client
    .from('scriptorium_unites')
    .select('id, label, type')
    .eq('id', id)
    .is('supprime_at', null)
    .maybeSingle()
  // Un LIVRE n'est pas une cible Quazian (anti-spoiler) : traité comme introuvable.
  if (!u || u.type !== 'unite') return null
  return { id: u.id as string, bras: 'unite', label: u.label as string, genre: null, longueurTexte: 0 }
}

/**
 * Libellés d'affichage pour un lot d'ids mélangés (périmètre d'un quiz : des
 * contenus, et pour les quiz hérités des unités). Un id sans libellé n'est pas
 * inventé — l'appelant retombe sur l'uuid, comme avant.
 */
export async function libellesCibles(client: SupabaseClient, ids: string[]): Promise<Map<string, string>> {
  const uniques = [...new Set(ids)].filter(Boolean)
  const labels = new Map<string, string>()
  if (uniques.length === 0) return labels

  const [{ data: contenus }, { data: unites }] = await Promise.all([
    client.from('scriptorium_contenus').select('id, titre').in('id', uniques),
    client.from('scriptorium_unites').select('id, label').in('id', uniques),
  ])
  for (const c of contenus ?? []) labels.set(c.id as string, c.titre as string)
  for (const u of unites ?? []) labels.set(u.id as string, u.label as string)
  return labels
}

/**
 * Contenu → classes qui l'ont réellement au programme. C'EST le remplaçant de
 * `scriptorium_document_classes` (vide depuis la réorganisation, §4.4 du rapport) :
 * l'unique chemin contenu → classe qui existe aujourd'hui passe par l'INSTANCE de
 * parcours de la classe — la divergence par classe est native (RAG L1), donc c'est
 * bien l'instance qui fait foi, jamais le modèle partagé.
 *
 * Idiome déjà employé par `utils/plan-synthese-hooks.ts` et `utils/aletheia-dates.ts`.
 * Client `admin` attendu (les tables de parcours sont en RLS prof-only).
 */
export async function classesParContenu(
  admin: SupabaseClient,
  contenuIds: string[],
): Promise<Map<string, Set<string>>> {
  const parContenu = new Map<string, Set<string>>()
  const uniques = [...new Set(contenuIds)].filter(Boolean)
  if (uniques.length === 0) return parContenu

  const { data: creneaux } = await admin
    .from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id, contenu_id')
    .eq('ref_type', 'contenu')
    .in('contenu_id', uniques)
  const lignes = creneaux ?? []
  if (lignes.length === 0) return parContenu

  const pcIds = [...new Set(lignes.map((c) => c.parcours_classe_id as string))]
  const { data: assigns } = await admin
    .from('scriptorium_parcours_classes')
    .select('id, classe_id')
    .in('id', pcIds)
    .eq('statut', 'active')
  const classeParPc = new Map((assigns ?? []).map((a) => [a.id as string, a.classe_id as string]))

  for (const c of lignes) {
    const classeId = classeParPc.get(c.parcours_classe_id as string)
    if (!classeId) continue // instance retirée / archivée → ne donne plus accès
    const cid = c.contenu_id as string
    const s = parContenu.get(cid) ?? new Set<string>()
    s.add(classeId)
    parContenu.set(cid, s)
  }
  return parContenu
}
