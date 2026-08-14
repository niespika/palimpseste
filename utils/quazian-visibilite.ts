// La RÈGLE de visibilité des cartes partagées, après C7 · L3 — pure, testée.
//
// Avant ce lot : une carte atteignait l'élève si le prof avait pressé « Publier
// aux élèves » sur sa cible ET que la cible était au programme d'une de ses
// classes. Deux gestes, dont un (la publication) que Louis ne veut plus faire.
//
// Depuis ce lot, c'est le « VU » du Scriptorium qui gouverne — le geste que le
// prof fait déjà, dans le pilotage de sa classe. Le « vu » vit par CLASSE et par
// ÉLÉMENT (`scriptorium_parcours_classe_elements.vu_at`, RAG L1 §C), et un cours
// découpé y est matérialisé en un élément PAR SOUS-SECTION. D'où deux grains :
//
//   • carte à `section_id` (née d'une sous-section) → visible si l'élément de
//     CETTE sous-section est vu, dans l'instance ACTIVE de la classe en contexte ;
//   • carte au grain CONTENU (texte source, cours non découpé, carte ajoutée à
//     la main, carte d'avant L3) → visible si le contenu est ENTAMÉ, c'est-à-dire
//     si AU MOINS UN de ses éléments est vu (décision prise au prompt de lot, R7).
//
// Le bras UNITÉ hérité ne bouge pas : publication + tuple (unité, semaine) via
// `scriptorium_document_classes`, exactement comme avant. Il n'y a aucune unité
// en base, mais le code continue de savoir les lire (cf. utils/quazian-cibles.ts).
//
// Ce module est PUR (aucun accès base, pas de `server-only`) pour que la règle
// soit testable seule — c'est elle qui décide ce qu'un élève voit.

/** Ce que le « vu » d'un jeu de classes rend accessible, côté bras contenu. */
export interface PerimetreVu {
  /** Contenus ENTAMÉS : au moins un de leurs éléments est « vu ». */
  contenusEntames: Set<string>
  /** Sous-sections dont l'élément est « vu ». */
  sectionsVues: Set<string>
}

/** Le périmètre complet d'un élève : le « vu » (bras contenu) + le bras hérité. */
export interface PerimetreCartes extends PerimetreVu {
  /** Unités héritées publiées (`quazian_publications`) — bras unité seulement. */
  unitesPubliees: string[]
  /** `${uniteId}:${semaine}` assignés à ses classes — bras unité seulement. */
  tuplesVisibles: Set<string>
}

/** Les seules colonnes d'ancrage que la règle lit. */
export interface CarteAncree {
  section_id?: string | null
  contenu_id?: string | null
  scriptorium_unite_id?: string | null
  semaine?: number | null
}

/**
 * Une carte partagée atteint-elle cet élève ?
 *
 * ⚠️ La validation (`statut = 'valide'`) et, pour le bras hérité, la publication
 * sont filtrées EN AMONT par la requête (cf. `cartesPartageesVisibles`). Cette
 * fonction ne tranche que le périmètre.
 */
export function carteVisible(carte: CarteAncree, p: PerimetreCartes): boolean {
  if (carte.contenu_id) {
    return carte.section_id
      ? p.sectionsVues.has(carte.section_id)
      : p.contenusEntames.has(carte.contenu_id)
  }
  // Bras hérité — inchangé : les cartes à semaine nulle valent pour toute
  // l'unité publiée, les autres exigent le tuple (unité, semaine) assigné.
  const sem = carte.semaine
  return sem == null || p.tuplesVisibles.has(`${carte.scriptorium_unite_id}:${sem}`)
}

/**
 * Combien de cartes d'un lot ce périmètre rend-il visibles ? Sert à l'écran prof
 * (« 3 sous-sections vues sur 5 → 12 cartes visibles ») : il compte AVEC la même
 * règle que l'élève, jamais avec une approximation parallèle.
 */
export function compterVisibles(cartes: CarteAncree[], p: PerimetreCartes): number {
  return cartes.reduce((n, c) => (carteVisible(c, p) ? n + 1 : n), 0)
}

/** Périmètre vide — un élève sans classe en contexte, ou une classe sans « vu ». */
export function perimetreVide(): PerimetreCartes {
  return {
    contenusEntames: new Set<string>(),
    sectionsVues: new Set<string>(),
    unitesPubliees: [],
    tuplesVisibles: new Set<string>(),
  }
}

// ── Ce que l'écran prof dit à la place du bouton « Publier » ─────────────────

/** Où en est le « vu » d'un contenu, dans UNE classe qui l'a au parcours. */
export interface AvancementVuClasse {
  classeId: string
  /** Éléments de ce contenu dans l'instance active de la classe (0 = anomalie). */
  total: number
  vus: number
  /** true si le grain est la SOUS-SECTION (cours découpé), false si le contenu entier. */
  decoupe: boolean
  /** Sous-sections vues — vide si le contenu n'est pas découpé. */
  sectionsVues: Set<string>
  /** Au moins un élément vu → le contenu est ENTAMÉ (grain contenu ouvert). */
  entame: boolean
}

/** Une ligne d'état, prête à afficher : « Test — 3 sous-sections vues sur 5 → … ». */
export interface LigneEtatVu {
  classe: string
  texte: string
  nbVisibles: number
}

/**
 * L'avancement du « vu » d'un contenu, classe par classe, mis en mots — et le
 * nombre de cartes que chaque classe voit VRAIMENT, compté par la règle de
 * l'élève elle-même (`compterVisibles`), jamais par une approximation parallèle :
 * ce que l'écran prof annonce est exactement ce que l'élève verra.
 */
export function lignesEtatVu(
  contenuId: string,
  validees: CarteAncree[],
  avancement: AvancementVuClasse[],
  nomClasse: Map<string, string>,
): LigneEtatVu[] {
  return avancement
    .map((a) => {
      const nbVisibles = compterVisibles(validees, {
        ...perimetreVide(),
        contenusEntames: a.entame ? new Set([contenuId]) : new Set<string>(),
        sectionsVues: a.sectionsVues,
      })
      const cartes = `${nbVisibles} carte${nbVisibles > 1 ? 's' : ''} visible${nbVisibles > 1 ? 's' : ''}`
      const texte = a.decoupe
        ? `${a.vus} sous-section${a.vus > 1 ? 's' : ''} vue${a.vus > 1 ? 's' : ''} sur ${a.total} → ${cartes}`
        : a.entame
          ? `vu → ${cartes}`
          : `pas encore vu → ${cartes}`
      return { classe: nomClasse.get(a.classeId) ?? '—', texte, nbVisibles }
    })
    .sort((x, y) => x.classe.localeCompare(y.classe))
}
