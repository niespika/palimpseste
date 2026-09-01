// Découpe d'un COURS de bibliothèque en sections (RAG L2, SPEC_scriptorium_rag.md §2
// décision 3 — amendement PO : marquage MANUEL, pas de proposition IA).
// Une découpe = des PLAGES {début, fin} de lignes (1-based, bornes incluses), chacune
// avec un titre et un niveau — le modèle de la découpe livre (semaines à bornes).
//
// ⭐ IMBRICATION (amendement PO 31/08/2026). Deux plages de MÊME rang ne se
// chevauchent jamais, mais un SOUS-CHAPITRE (§§) peut vivre DANS son chapitre (§) :
// c'est la structure naturelle d'un cours (« 1) … » avec ses « a) b) c) »), et la
// refuser obligeait à choisir entre le chapitre et ses parties. Deux niveaux au
// maximum ; un chevauchement PARTIEL reste interdit (ni dedans, ni dehors).
// La matière d'une section est faite de ses lignes PROPRES — celles qu'aucun de ses
// sous-chapitres ne prend. La découpe reste donc une PARTITION : aucune ligne n'est
// servie deux fois au corpus, et cocher « vu » sur un chapitre ne dévoile pas des
// sous-chapitres non encore vus (garde anti-spoiler du §6). Un chapitre entièrement
// couvert par ses sous-chapitres a une matière VIDE : c'est un intitulé, et les
// consommateurs (corpus, Quazian) sautent déjà les sections vides.
// Les TROUS sont tolérés : une ligne hors de toute section n'entre pas dans la
// matière du cours découpé (utile pour écarter le bruit d'extraction PDF), l'éditeur
// le signale.
//
// Module PUR (ni 'use server' ni 'use client') : importable du serveur (dérivation
// canonique dans l'action), du client (validation/aperçu dans l'éditeur) et des tests.

export interface PlageSection {
  debut: number          // 1-based dans texte.split('\n'), borne incluse
  fin: number            // ≥ debut, borne incluse
  titre: string
  niveau: 1 | 2          // 1 = chapitre, 2 = sous-chapitre (miroir de scriptorium_contenu_sections)
}

export interface SectionDerivee {
  ordre: number          // 1..n dans l'ordre CANONIQUE (cf. ordonnerPlages)
  niveau: 1 | 2
  titre: string
  texte: string          // lignes PROPRES : la plage moins ses sous-chapitres
}

/**
 * Ordre CANONIQUE d'un jeu de plages — celui du texte, un chapitre AVANT les
 * sous-chapitres qu'il contient : début croissant, puis fin décroissante
 * (l'enveloppe d'abord), puis niveau. C'est l'ordre enregistré (`ordre` en base)
 * et celui des éléments d'instance.
 */
export function ordonnerPlages<T extends { debut: number; fin: number; niveau: number }>(plages: T[]): T[] {
  return [...plages].sort((a, b) => a.debut - b.debut || b.fin - a.fin || a.niveau - b.niveau)
}

/**
 * Pour chaque plage de `tri` (ORDRE CANONIQUE), les indices des plages qu'elle
 * contient directement. La pile suffit : l'ordre canonique fait entrer une plage
 * après son enveloppe, et `validerPlages` garantit qu'il n'y a pas d'imbrication
 * partielle ni plus de deux niveaux.
 */
function indexerEnfants(tri: PlageSection[]): number[][] {
  const enfants: number[][] = tri.map(() => [])
  const pile: number[] = []
  tri.forEach((p, i) => {
    while (pile.length && tri[pile[pile.length - 1]].fin < p.debut) pile.pop()
    if (pile.length) enfants[pile[pile.length - 1]].push(i)
    pile.push(i)
  })
  return enfants
}

/**
 * Valide un jeu de plages contre un texte de `nbLignes` lignes. Renvoie un message
 * d'erreur (français, affichable) ou null si valide. Un jeu VIDE est valide : il
 * signifie « effacer la découpe » (retour à l'élément 'contenu' entier). L'ordre
 * de saisie est libre : la validation trie (ordre canonique) et n'accepte qu'un
 * recouvrement, celui d'un §§ ENTIÈREMENT contenu dans un § ; les trous restent
 * permis.
 */
export function validerPlages(plages: PlageSection[], nbLignes: number): string | null {
  for (let i = 0; i < plages.length; i++) {
    const p = plages[i]
    if (!Number.isInteger(p.debut) || !Number.isInteger(p.fin)) return `Section ${i + 1} : bornes incomplètes.`
    if (p.debut < 1 || p.fin > nbLignes) return `Section ${i + 1} : plage hors du texte (l. ${p.debut}–${p.fin} sur ${nbLignes}).`
    if (p.debut > p.fin) return `Section ${i + 1} : la fin (l. ${p.fin}) est avant le début (l. ${p.debut}).`
    if (!p.titre?.trim()) return `Section ${i + 1} : le titre manque.`
    if (p.niveau !== 1 && p.niveau !== 2) return `Section ${i + 1} : niveau invalide.`
  }
  const nom = (p: PlageSection) => `« ${p.titre.trim()} » (l. ${p.debut}–${p.fin})`
  const tri = ordonnerPlages(plages)
  const pile: PlageSection[] = []
  for (const p of tri) {
    while (pile.length && pile[pile.length - 1].fin < p.debut) pile.pop()
    const englobante = pile[pile.length - 1]
    if (englobante) {
      if (p.fin > englobante.fin) {
        return `${nom(englobante)} et ${nom(p)} se chevauchent partiellement : une section doit être soit entièrement dans une autre (sous-chapitre), soit entièrement en dehors.`
      }
      if (englobante.niveau !== 1 || p.niveau !== 2) {
        return englobante.niveau === 2
          ? `${nom(p)} est dans ${nom(englobante)}, qui est déjà un sous-chapitre : la découpe ne descend pas au-delà de deux niveaux.`
          : `${nom(p)} est dans ${nom(englobante)} : passe-la en « §§ Sous-chapitre » pour l'imbriquer, ou sors-la du chapitre.`
      }
    }
    pile.push(p)
  }
  return null
}

/**
 * Dérive les sections d'un texte depuis des plages VALIDES (appeler validerPlages
 * avant). Ordre canonique (cf. ordonnerPlages), texte = les lignes PROPRES de la
 * plage — celles qu'aucun de ses sous-chapitres ne prend, jointes par '\n' même
 * quand elles ne sont pas contiguës (un chapitre garde son chapeau et sa chute).
 * Titres trimés (la correspondance des « vus » se fait sur titre trimé, cf.
 * reporterVus).
 */
export function decouperPlages(texte: string, plages: PlageSection[]): SectionDerivee[] {
  const lignes = (texte ?? '').split('\n')
  const tri = ordonnerPlages(plages)
  const enfants = indexerEnfants(tri)
  return tri.map((p, i) => {
    const pris = new Set<number>()
    for (const j of enfants[i]) {
      for (let l = tri[j].debut; l <= tri[j].fin; l++) pris.add(l)
    }
    const propres: string[] = []
    for (let l = p.debut; l <= p.fin; l++) {
      if (!pris.has(l)) propres.push(lignes[l - 1] ?? '')
    }
    return { ordre: i + 1, niveau: p.niveau, titre: p.titre.trim(), texte: propres.join('\n') }
  })
}

interface SectionStockee { titre: string; niveau: number; texte: string }

// Balayage AVANT : première ligne ≥ `curseur` où le bloc apparaît tel quel, ou null.
function chercherBloc(lignes: string[], bloc: string[], curseur: number): number | null {
  for (let d = curseur; d + bloc.length - 1 <= lignes.length; d++) {
    if (lignes.slice(d - 1, d - 1 + bloc.length).join('\n') === bloc.join('\n')) return d
  }
  return null
}

// Lecture PLATE (modèle d'avant l'imbrication) : chaque section est un bloc
// contigu, retrouvé par balayage avant depuis la fin de la précédente.
function reconstruirePlat(lignes: string[], sections: SectionStockee[]): PlageSection[] | null {
  const plages: PlageSection[] = []
  let curseur = 1
  for (const s of sections) {
    const bloc = (s.texte ?? '').split('\n')
    const trouve = chercherBloc(lignes, bloc, curseur)
    if (trouve == null) return null
    plages.push({ debut: trouve, fin: trouve + bloc.length - 1, titre: s.titre, niveau: s.niveau === 2 ? 2 : 1 })
    curseur = trouve + bloc.length
  }
  return plages
}

/**
 * Lecture IMBRIQUÉE : les §§ qui suivent un § lui sont rattachés (l'ordre stocké
 * est canonique, un chapitre précède ses sous-chapitres). Les enfants sont des
 * blocs contigus, donc retrouvables ; le parent, lui, ne l'est pas (ses lignes
 * propres encadrent ses enfants). On le déduit : le nombre de ses lignes propres
 * est connu, les trous ENTRE enfants aussi, donc il ne reste qu'à répartir le
 * reste entre le chapeau (avant le premier enfant) et la chute (après le
 * dernier) — on essaie du plus grand chapeau au plus petit (lecture naturelle) et
 * on retient la première répartition qui redonne EXACTEMENT le texte stocké.
 */
function reconstruireImbrique(lignes: string[], sections: SectionStockee[]): PlageSection[] | null {
  const groupes: { parent: SectionStockee; enfants: SectionStockee[] }[] = []
  for (const s of sections) {
    const dernier = groupes[groupes.length - 1]
    if (s.niveau === 2 && dernier && dernier.parent.niveau === 1) dernier.enfants.push(s)
    else groupes.push({ parent: s, enfants: [] })
  }
  if (!groupes.some(g => g.enfants.length > 0)) return null // rien d'imbriqué : la lecture plate fait foi

  const plages: PlageSection[] = []
  let curseur = 1
  for (const g of groupes) {
    const niveauParent: 1 | 2 = g.parent.niveau === 2 ? 2 : 1
    if (g.enfants.length === 0) {
      const bloc = (g.parent.texte ?? '').split('\n')
      const trouve = chercherBloc(lignes, bloc, curseur)
      if (trouve == null) return null
      plages.push({ debut: trouve, fin: trouve + bloc.length - 1, titre: g.parent.titre, niveau: niveauParent })
      curseur = trouve + bloc.length
      continue
    }
    // 1. Les enfants, dans l'ordre, par balayage avant.
    const bornes: { debut: number; fin: number }[] = []
    let c = curseur
    for (const e of g.enfants) {
      const bloc = (e.texte ?? '').split('\n')
      const trouve = chercherBloc(lignes, bloc, c)
      if (trouve == null) return null
      bornes.push({ debut: trouve, fin: trouve + bloc.length - 1 })
      c = trouve + bloc.length
    }
    // 2. Les bornes du parent. `texte` vide = zéro ligne propre (une ligne propre
    // vide donnerait la même chaîne ; les deux lectures dérivent le même texte,
    // on retient la plus serrée).
    const propresStockees = g.parent.texte === '' ? 0 : (g.parent.texte ?? '').split('\n').length
    const trous = bornes.slice(1).reduce((n, b, i) => n + (b.debut - bornes[i].fin - 1), 0)
    const reste = propresStockees - trous
    if (reste < 0) return null
    const pris = new Set<number>()
    for (const b of bornes) for (let l = b.debut; l <= b.fin; l++) pris.add(l)
    let retenu: { debut: number; fin: number } | null = null
    for (let chapeau = reste; chapeau >= 0 && !retenu; chapeau--) {
      const debut = bornes[0].debut - chapeau
      const fin = bornes[bornes.length - 1].fin + (reste - chapeau)
      if (debut < curseur || fin > lignes.length) continue
      const propres: string[] = []
      for (let l = debut; l <= fin; l++) if (!pris.has(l)) propres.push(lignes[l - 1] ?? '')
      if (propres.join('\n') === (g.parent.texte ?? '')) retenu = { debut, fin }
    }
    if (!retenu) return null
    plages.push({ debut: retenu.debut, fin: retenu.fin, titre: g.parent.titre, niveau: niveauParent })
    g.enfants.forEach((e, i) => plages.push({
      debut: bornes[i].debut, fin: bornes[i].fin, titre: e.titre, niveau: e.niveau === 2 ? 2 : 1,
    }))
    curseur = retenu.fin + 1
  }
  return plages
}

/**
 * Reconstruit les plages depuis des sections EXISTANTES (ré-édition d'une découpe).
 * Chaque section stocke ses lignes PROPRES : on les RETROUVE dans le texte courant
 * par balayage AVANT (à partir de la fin de la section précédente — les trous entre
 * sections sont tolérés, premier bloc correspondant retenu → déterministe), lecture
 * imbriquée d'abord, plate en repli (découpes d'avant l'imbrication). Si une
 * section est introuvable ou si les sections sont vides → null (texte changé /
 * jamais découpé) : l'éditeur repart d'une feuille vierge avec un avis.
 */
export function reconstruirePlages(
  texte: string,
  sections: SectionStockee[],
): PlageSection[] | null {
  if (sections.length === 0) return null
  const lignes = (texte ?? '').split('\n')
  return reconstruireImbrique(lignes, sections) ?? reconstruirePlat(lignes, sections)
}

// ── Report des « vus » à la re-matérialisation (SPEC L2, risque §15.7) ────────

export interface VuPorte { vuAt: string; vuPar: string | null }

/** Élément d'instance AVANT re-découpe, réduit à ce qui décide le report du « vu ». */
export interface AncienElementVu {
  refType: 'contenu' | 'section'
  titre: string | null   // titre de la section référencée (null pour un élément 'contenu')
  vuAt: string | null
  vuPar: string | null
}

/**
 * Report des « vus » d'un créneau re-matérialisé, section par section :
 *  - un ancien élément 'contenu' VU (le cours entier avait été vu avant découpe)
 *    diffuse son vu à TOUTES les nouvelles sections ;
 *  - sinon, correspondance EXACTE de titre (trim), chaque ancien consommé une seule
 *    fois dans l'ordre (deux sections homonymes → report dans l'ordre) ;
 *  - titre renommé ou section neuve → null (élément neuf non vu — assumé PO).
 */
export function reporterVus(anciens: AncienElementVu[], titresNouveaux: string[]): (VuPorte | null)[] {
  const entier = anciens.find(a => a.refType === 'contenu' && a.vuAt != null)
  if (entier) return titresNouveaux.map(() => ({ vuAt: entier.vuAt as string, vuPar: entier.vuPar }))

  const consommes = new Set<number>()
  return titresNouveaux.map(titre => {
    const cible = titre.trim()
    for (let i = 0; i < anciens.length; i++) {
      if (consommes.has(i)) continue
      const a = anciens[i]
      if (a.refType !== 'section') continue
      if ((a.titre ?? '').trim() !== cible) continue
      consommes.add(i)
      return a.vuAt != null ? { vuAt: a.vuAt, vuPar: a.vuPar } : null
    }
    return null
  })
}

/**
 * Agrégat du « vu » quand une découpe est EFFACÉE (sections → retour à un élément
 * 'contenu' entier) : un ancien élément 'contenu' transmet son état tel quel ;
 * des sections transmettent « vu » seulement si TOUTES l'étaient (le cours entier
 * a été vu), en portant le vu le plus RÉCENT ; sinon non vu.
 */
export function vuVersContenu(anciens: AncienElementVu[]): VuPorte | null {
  const contenu = anciens.find(a => a.refType === 'contenu')
  if (contenu) return contenu.vuAt != null ? { vuAt: contenu.vuAt, vuPar: contenu.vuPar } : null
  const sections = anciens.filter(a => a.refType === 'section')
  if (sections.length === 0 || sections.some(a => a.vuAt == null)) return null
  let dernier = sections[0]
  for (const s of sections) {
    if ((s.vuAt as string) > (dernier.vuAt as string)) dernier = s
  }
  return { vuAt: dernier.vuAt as string, vuPar: dernier.vuPar }
}
