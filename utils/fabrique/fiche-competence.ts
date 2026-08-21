// ============================================================================
// C4 · L8 — LA FICHE DE COMPÉTENCE DÉPOSÉE : ce qu'on en lit, et rien de plus.
// ----------------------------------------------------------------------------
// « Une fiche est un fichier markdown, et SA FORME EST CONNUE. En tête, une
//   ligne VERSION et une ligne Statut (`07-` §2 : « l'en-tête des documents s'y
//   lit » ; `03-` §2 : « la version et le statut d'une fiche vivent DANS LA
//   FICHE, jamais ici ») ; dix sections (`03-` §1) ; et au §5, sous le titre
//   « La correspondance observable → formulation », une table — LA MÊME SUR LES
//   SIX FICHES — à quatre colonnes » (piège 5).
//
// « C'est la seule donnée que le §1.1 nomme » : par compétence × observable, la
// dimension dite à l'élève, la question « se juger », la liste FERMÉE des
// réponses, et une VERSION — la ligne VERSION de la fiche AU MOMENT DU DÉPÔT,
// celle que `exercices_metacognition.questions_version` cite.
//
// ⚠️ « Rien de cette table ne s'écrit à la main, et AUCUN LOT N'INVENTE UNE
//    QUESTION » (`07-` §1.1). Ce module LIT ; il ne complète rien, il ne devine
//    rien, et il prend les lignes TELLES QU'ELLES SONT — `orthographe` n'a pas
//    de bloc à l'Expression, et c'est délibéré (piège 5).
//
// ⚠️ « La compétence se RECONNAÎT — titre et nom du fichier — et s'écrit en
//    IDENTIFIANT NU, l'un des six du §1.2 ; LE PARSEUR NE DEMANDE RIEN »
//    (piège 5).
// ============================================================================

/** Les six du `07-` §1.2, plus le Monitoring, qui a sa fiche et sa ligne. */
export const COMPETENCES_FICHE = ['expression', 'argumentation', 'structure',
  'connaissance', 'synthese', 'questionnement', 'monitoring'] as const
export type CompetenceFiche = (typeof COMPETENCES_FICHE)[number]

/** Ce que le titre et le nom du fichier peuvent porter, accents compris. */
const RECONNAISSANCE: Array<[CompetenceFiche, RegExp]> = [
  ['expression', /expression/i],
  ['argumentation', /argumentation/i],
  ['structure', /structure/i],
  ['connaissance', /connaissance/i],
  ['synthese', /synth[eè]se/i],
  ['questionnement', /questionnement/i],
  ['monitoring', /monitoring/i],
]

export interface BlocCorrespondance {
  observable_code: string
  dimension_eleve: string
  question: string
  /** La liste FERMÉE — « une réponse libre ne se compare à rien » (§1.1). */
  reponses: string[]
  ordre: number
}

export interface FicheLue {
  competence: CompetenceFiche
  version: string
  /** Le statut nu — « RELUE ET VALIDÉE ». */
  statut: string
  /** La ligne de statut entière, telle que la fiche la porte. */
  statutLigne: string
  correspondance: BlocCorrespondance[]
  /** Ce que le professeur doit voir avant de déposer, et ce qui l'arrête. */
  avertissements: string[]
}

export class FicheIllisible extends Error {}

/** « … `truc` … » → truc ; le gras, l'italique et les backticks tombent. */
function nu(s: string): string {
  return (s ?? '')
    .replace(/\*\((.*?)\)\*/g, '')
    .replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '')
    .trim()
}

/** Les lignes utiles d'une table markdown — ni l'en-tête, ni le séparateur. */
function lignesTable(bloc: string): string[][] {
  const out: string[][] = []
  for (const brut of bloc.split('\n')) {
    const ligne = brut.trim()
    if (!ligne.startsWith('|')) continue
    if (/^[|\-: ]+$/.test(ligne)) continue
    out.push(ligne.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
  }
  return out
}

/**
 * Lit une fiche déposée. `nomFichier` sert la reconnaissance, avec le titre.
 *
 * Jette `FicheIllisible` quand la forme connue n'y est pas — une fiche qu'on ne
 * sait pas lire ne se dépose pas à moitié.
 */
export function lireFiche(contenu: string, nomFichier: string): FicheLue {
  const avertissements: string[] = []
  const texte = contenu ?? ''

  // ── La compétence — titre ET nom du fichier ───────────────────────────────
  const titre = (texte.match(/^#\s+(.+)$/m)?.[1] ?? '')
  const candidats = new Set<CompetenceFiche>()
  for (const [cle, motif] of RECONNAISSANCE) {
    if (motif.test(titre) || motif.test(nomFichier)) candidats.add(cle)
  }
  if (candidats.size === 0) {
    throw new FicheIllisible(
      `Aucune des sept compétences ne se reconnaît dans « ${nomFichier} » ni dans son titre. `
      + 'La compétence se reconnaît au titre et au nom du fichier (07- §1.2).')
  }
  if (candidats.size > 1) {
    throw new FicheIllisible(
      `Plusieurs compétences se reconnaissent dans « ${nomFichier} » : ${[...candidats].join(', ')}. `
      + 'Le parseur ne devine pas.')
  }
  const competence = [...candidats][0]

  // ── La ligne VERSION ──────────────────────────────────────────────────────
  const mv = texte.match(/^\s*\*\*VERSION\s+([0-9]+(?:\.[0-9]+)*)\.?\*\*/m)
  if (!mv) {
    throw new FicheIllisible(
      "La ligne VERSION est introuvable en tête de la fiche. « La version et le statut d'une "
      + "fiche vivent dans la fiche, jamais ailleurs » (03- §2).")
  }
  const version = mv[1]

  // ── La ligne Statut ───────────────────────────────────────────────────────
  // Le STATUT est le premier segment en gras de la ligne — « RELUE ET
  // VALIDÉE », « VALIDÉ ET GELÉ ». Ce qui suit est le commentaire de la fiche,
  // et « il y lit ce qu'elles portent : sa version, son statut, sa
  // correspondance — ET RIEN QUI NE SOIT DANS LE FICHIER » (piège 8) : la ligne
  // entière reste lisible à l'écran, mais le statut, lui, est cette valeur-là.
  const ms = texte.match(/^\s*\*\*Statut\*\*\s*:\s*(.+)$/m)
  if (!ms) {
    throw new FicheIllisible('La ligne Statut est introuvable en tête de la fiche (07- §2).')
  }
  const statut = (ms[1].match(/\*\*(.+?)\*\*/)?.[1] ?? nu(ms[1])).replace(/\s+/g, ' ').trim()
  const statutLigne = nu(ms[1]).replace(/\s+/g, ' ').trim()

  // ── La correspondance observable → formulation (§5) ───────────────────────
  // Le Monitoring N'EN A PAS, et ce n'est pas un manque : « la correspondance
  // observable → formulation vit dans la fiche de CHAQUE COMPÉTENCE, en section
  // dédiée » (`competences/monitoring.md` §4 ; piège 4).
  const correspondance: BlocCorrespondance[] = []
  // ⚠️ La section peut être LA DERNIÈRE de la fiche : la borne de fin est donc
  //    « un titre de même niveau ou plus haut, OU LA FIN DU TEXTE ». En
  //    JavaScript, la fin du texte s'écrit `(?![\s\S])` — `\Z` n'existe pas, et
  //    s'y glisserait comme un « Z » littéral, qui ne se rencontre jamais.
  const mSection = texte.match(
    /^#{2,4}[ \t]+La correspondance observable[ \t]*→[ \t]*formulation[ \t]*$([\s\S]*?)(?=^#{1,4}[ \t]|(?![\s\S]))/m)
  if (competence === 'monitoring') {
    if (mSection) {
      avertissements.push(
        'Cette fiche du Monitoring porte une section de correspondance, alors que la source dit '
        + "qu'il n'en a pas (competences/monitoring.md §4). Elle n'est PAS versée.")
    }
  } else if (!mSection) {
    avertissements.push(
      'Aucune section « La correspondance observable → formulation » dans cette fiche. '
      + 'La compétence sera déposée, mais elle ne sera PAS déclarable `evaluee` : '
      + 'la correspondance est le second plancher mécanique (03- §9).')
  } else {
    const lignes = lignesTable(mSection[1])
    let ordre = 0
    for (const c of lignes) {
      if (c.length !== 4) continue
      const code = nu(c[0])
      // L'en-tête de la table, et rien d'autre, se saute.
      if (!code || /^Observable$/i.test(code)) continue
      if (!/^[a-z][a-z0-9_]*$/.test(code)) continue
      // « Réponses possibles (fermées, séparées par « · ») » (piège 5).
      const reponses = nu(c[3]).split('·').map((x) => x.trim()).filter(Boolean)
      if (reponses.length < 2) {
        avertissements.push(
          `L'observable \`${code}\` porte moins de deux réponses possibles — `
          + 'la liste est FERMÉE, et « une réponse libre ne se compare à rien » (07- §1.1). '
          + "Le bloc n'est pas versé.")
        continue
      }
      correspondance.push({
        observable_code: code,
        dimension_eleve: nu(c[1]),
        question: nu(c[2]),
        reponses,
        ordre: ordre++,
      })
    }
    if (correspondance.length === 0) {
      avertissements.push(
        'La section de correspondance existe mais aucune ligne ne s\'y lit. '
        + 'La compétence ne sera pas déclarable `evaluee`.')
    }
  }

  return { competence, version, statut, statutLigne, correspondance, avertissements }
}
