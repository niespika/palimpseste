// Découpe d'un COURS de bibliothèque en sections (RAG L2, SPEC_scriptorium_rag.md §2
// décision 3 — amendement PO : marquage MANUEL, pas de proposition IA).
// Une découpe = des PLAGES {début, fin} de lignes (1-based, bornes incluses), chacune
// avec un titre et un niveau — le modèle de la découpe livre (semaines à bornes).
// Les plages ne se CHEVAUCHENT jamais (validé) ; les TROUS sont tolérés : une ligne
// hors de toute section n'entre pas dans la matière du cours découpé (utile pour
// écarter le bruit d'extraction PDF), l'éditeur le signale.
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
  ordre: number          // 1..n dans l'ordre du TEXTE (tri par début)
  niveau: 1 | 2
  titre: string
  texte: string
}

/**
 * Valide un jeu de plages contre un texte de `nbLignes` lignes. Renvoie un message
 * d'erreur (français, affichable) ou null si valide. Un jeu VIDE est valide : il
 * signifie « effacer la découpe » (retour à l'élément 'contenu' entier). L'ordre
 * de saisie est libre : la validation trie par début (l'ordre canonique est celui
 * du texte) et interdit tout CHEVAUCHEMENT ; les trous restent permis.
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
  const tri = [...plages].sort((a, b) => a.debut - b.debut)
  for (let i = 1; i < tri.length; i++) {
    if (tri[i].debut <= tri[i - 1].fin) {
      return `Deux sections se chevauchent (l. ${tri[i - 1].debut}–${tri[i - 1].fin} et l. ${tri[i].debut}–${tri[i].fin}).`
    }
  }
  return null
}

/**
 * Dérive les sections d'un texte depuis des plages VALIDES (appeler validerPlages
 * avant). Tri par début (l'ordre canonique des sections est celui du texte),
 * texte = lignes [début..fin] incluses, titres trimés (la correspondance des
 * « vus » se fait sur titre trimé, cf. reporterVus).
 */
export function decouperPlages(texte: string, plages: PlageSection[]): SectionDerivee[] {
  const lignes = (texte ?? '').split('\n')
  return [...plages]
    .sort((a, b) => a.debut - b.debut)
    .map((p, i) => ({
      ordre: i + 1,
      niveau: p.niveau,
      titre: p.titre.trim(),
      texte: lignes.slice(p.debut - 1, p.fin).join('\n'),
    }))
}

/**
 * Reconstruit les plages depuis des sections EXISTANTES (ré-édition d'une découpe).
 * Chaque section stocke sa part du texte : on la RETROUVE dans le texte courant par
 * balayage AVANT (à partir de la fin de la section précédente — les trous entre
 * sections sont tolérés, premier bloc correspondant retenu → déterministe). Si une
 * section est introuvable ou si les sections sont vides → null (texte changé /
 * jamais découpé) : l'éditeur repart d'une feuille vierge avec un avis.
 */
export function reconstruirePlages(
  texte: string,
  sections: { titre: string; niveau: number; texte: string }[],
): PlageSection[] | null {
  if (sections.length === 0) return null
  const lignes = (texte ?? '').split('\n')
  const plages: PlageSection[] = []
  let curseur = 1 // 1-based : première ligne candidate pour la section courante
  for (const s of sections) {
    const bloc = (s.texte ?? '').split('\n')
    let trouve: number | null = null
    for (let d = curseur; d + bloc.length - 1 <= lignes.length; d++) {
      if (lignes.slice(d - 1, d - 1 + bloc.length).join('\n') === s.texte) { trouve = d; break }
    }
    if (trouve == null) return null
    plages.push({ debut: trouve, fin: trouve + bloc.length - 1, titre: s.titre, niveau: s.niveau === 2 ? 2 : 1 })
    curseur = trouve + bloc.length
  }
  return plages
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
