// Vocabulaire commun de Quazian après C7 · L1 — l'arc BI-SOURCE.
//
// Une CIBLE Quazian, c'est ce à quoi se rattachent une carte (`quazian_flashcards`)
// et le périmètre d'un quiz. Deux bras, exclusifs (CHECK `*_source_chk`, cf.
// c7_quazian_contenus.sql) :
//
// ⚠️ C7·L3 — la PUBLICATION a quitté ce vocabulaire au bras contenu : la
// visibilité élève est gouvernée par le « vu » du Scriptorium (voir plus bas,
// `perimetreVuClasses`). `quazian_publications` reste en base et ne sert plus
// qu'au bras unité hérité, en lecture (son sort est un arbitrage, §10.1 du
// rapport de diagnostic).
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
import type { AvancementVuClasse, PerimetreVu } from './quazian-visibilite'

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

// ── Le « vu » du Scriptorium, lu depuis Quazian (C7 · L3) ────────────────────
//
// C7·L3 — `classesParContenu()` a été retirée : elle rendait « contenu → classes
// qui l'ont au programme », ce que `avancementVuParContenu()` ci-dessous rend
// aussi, en disant EN PLUS où en est le « vu » de chacune. Elle n'avait plus
// qu'un appelant (l'écran prof), qui a besoin de l'avancement, pas de la seule
// appartenance. Le chemin, lui, ne change pas : contenu → créneau d'INSTANCE →
// classe (l'unique chemin qui existe depuis la réorganisation, §4.4 du rapport ;
// `scriptorium_document_classes` est vide). C'est l'instance qui fait foi, jamais
// le modèle partagé — la divergence par classe est native (RAG L1).
//
// Idiome déjà employé par `utils/plan-synthese-hooks.ts` et `utils/aletheia-dates.ts`.
// Client `admin` attendu (les tables de parcours sont en RLS prof-only).

/** Un élément d'instance porté par un créneau-CONTENU, à plat. */
interface ElementDeContenu {
  classeId: string
  contenuId: string
  refType: 'contenu' | 'section' | 'livre_semaine'
  sectionId: string | null
  vu: boolean
}

/**
 * Les éléments d'instance de tous les créneaux-CONTENU vivants, filtrés par
 * classes et/ou par contenus. Socle commun du périmètre élève et de l'écran prof :
 * une seule manière de lire le « vu », donc jamais deux vérités.
 */
async function chargerElementsDeContenu(
  admin: SupabaseClient,
  filtre: { classeIds?: string[]; contenuIds?: string[] },
): Promise<ElementDeContenu[]> {
  const classeIds = filtre.classeIds ? [...new Set(filtre.classeIds)].filter(Boolean) : undefined
  const contenuIds = filtre.contenuIds ? [...new Set(filtre.contenuIds)].filter(Boolean) : undefined
  if (classeIds?.length === 0 || contenuIds?.length === 0) return []

  // 1. Instances ACTIVES (une instance retirée / archivée ne donne plus accès).
  let qAssign = admin.from('scriptorium_parcours_classes').select('id, classe_id').eq('statut', 'active')
  if (classeIds) qAssign = qAssign.in('classe_id', classeIds)
  const { data: assigns } = await qAssign
  const classeParPc = new Map((assigns ?? []).map((a) => [a.id as string, a.classe_id as string]))
  if (classeParPc.size === 0) return []

  // 2. Créneaux-contenu de ces instances.
  let qCren = admin
    .from('scriptorium_parcours_classe_creneaux')
    .select('id, parcours_classe_id, contenu_id')
    .eq('ref_type', 'contenu')
    .in('parcours_classe_id', [...classeParPc.keys()])
  if (contenuIds) qCren = qCren.in('contenu_id', contenuIds)
  const { data: crens } = await qCren
  const creneaux = (crens ?? []).filter((c) => !!c.contenu_id)
  if (creneaux.length === 0) return []
  const infoParCreneau = new Map(
    creneaux.map((c) => [
      c.id as string,
      { classeId: classeParPc.get(c.parcours_classe_id as string)!, contenuId: c.contenu_id as string },
    ]),
  )

  // 3. Leurs éléments — LE grain du « vu » (1 par sous-section si le cours est
  //    découpé, sinon 1 pour le contenu entier).
  const { data: els } = await admin
    .from('scriptorium_parcours_classe_elements')
    .select('creneau_id, ref_type, section_id, vu_at')
    .in('creneau_id', [...infoParCreneau.keys()])

  return (els ?? []).flatMap((e) => {
    const info = infoParCreneau.get(e.creneau_id as string)
    if (!info) return []
    return [{
      classeId: info.classeId,
      contenuId: info.contenuId,
      refType: (e.ref_type as ElementDeContenu['refType']) ?? 'contenu',
      sectionId: (e.section_id as string | null) ?? null,
      vu: e.vu_at != null,
    }]
  })
}

/**
 * Le périmètre « vu » d'un élève : ce que les classes EN CONTEXTE lui ouvrent.
 * Deux grains, cf. `utils/quazian-visibilite.ts` — les sous-sections vues, et les
 * contenus ENTAMÉS (au moins un élément vu, décision R7 du prompt de lot).
 */
export async function perimetreVuClasses(
  admin: SupabaseClient,
  classeIds: string[],
): Promise<PerimetreVu> {
  const contenusEntames = new Set<string>()
  const sectionsVues = new Set<string>()
  for (const e of await chargerElementsDeContenu(admin, { classeIds })) {
    if (!e.vu) continue
    contenusEntames.add(e.contenuId)
    if (e.refType === 'section' && e.sectionId) sectionsVues.add(e.sectionId)
  }
  return { contenusEntames, sectionsVues }
}

/**
 * Contenu → avancement du « vu », classe par classe. C'est ce que l'écran prof
 * dit à la place du bouton « Publier » : « Test — 3 sous-sections vues sur 5 ».
 * Un contenu qu'aucune classe n'a au parcours n'a pas d'entrée.
 */
export async function avancementVuParContenu(
  admin: SupabaseClient,
  contenuIds: string[],
): Promise<Map<string, AvancementVuClasse[]>> {
  const parContenu = new Map<string, Map<string, AvancementVuClasse>>()
  for (const e of await chargerElementsDeContenu(admin, { contenuIds })) {
    const parClasse = parContenu.get(e.contenuId) ?? new Map<string, AvancementVuClasse>()
    const a = parClasse.get(e.classeId) ?? {
      classeId: e.classeId, total: 0, vus: 0, decoupe: false,
      sectionsVues: new Set<string>(), entame: false,
    }
    a.total++
    if (e.refType === 'section') a.decoupe = true
    if (e.vu) {
      a.vus++
      a.entame = true
      if (e.refType === 'section' && e.sectionId) a.sectionsVues.add(e.sectionId)
    }
    parClasse.set(e.classeId, a)
    parContenu.set(e.contenuId, parClasse)
  }
  return new Map([...parContenu].map(([cid, parClasse]) => [cid, [...parClasse.values()]]))
}
