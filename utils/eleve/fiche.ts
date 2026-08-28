// ============================================================================
// C6 · L2 — LA FICHE DE COMPÉTENCE DITE À L'ÉLÈVE. Les règles, pures.
// ----------------------------------------------------------------------------
// `06-Palimpseste.md` §5 :
//   « Chaque compétence a une FICHE D'UNE PAGE, écrite pour l'élève, servie une
//     fois — à la rentrée — et consultable toute l'année. Elle porte deux
//     choses : CE QUE LA COMPÉTENCE REGARDE, en un paragraphe de langue
//     courante, et LES DIMENSIONS SUR LESQUELLES ON LA LIT, dans les mots mêmes
//     où le retour les nommera.
//     Elle ne porte NI OBSERVABLE, NI SEUIL, NI DÉCOMPTE — c'est la coupure de
//     RR4. […] Elle n'est pas un retour : ELLE NE PARLE JAMAIS DE CE QUE CET
//     ÉLÈVE-LÀ A PRODUIT. »
//
// ⭐⭐ LA FICHE EST GÉNÉRIQUE, LE PROFIL EST PERSONNEL — et c'est la source qui
//    les sépare, sous le même onglet. **Une fiche qui affiche « travaillé 4
//    fois » est un profil déguisé.** Deux écrans voisins, aucun mélange : c'est
//    pourquoi RIEN ici ne prend un `eleveId`.
//
// ⭐ SES DEUX CONTENUS SONT DÉJÀ EN BASE, ET AUCUN NE SE SAISIT :
//    (a) « ce que la compétence regarde » — le `### 1.1` de chaque fiche, dans
//        `competences_fiches.contenu`, déposé par la fabrique (C4-L8) ;
//    (b) « les dimensions » — `competences_correspondance.dimension_eleve`, dans
//        l'ordre de la colonne `ordre`, qui est « l'ordre de la table dans la
//        fiche ».
//    ⛔ RIEN NE SE DÉRIVE, RIEN NE SE TAPE, RIEN NE SE REFORMULE. « Le texte est
//       PRÊT À SERVIR : ne le résume pas, ne le reformule pas, ne l'augmente pas. »
//
// ⚠️ SIX FICHES, PAS SEPT. `competences_fiches` porte SEPT lignes dans les deux
//    bases — les six compétences PLUS `monitoring`, qui n'a PAS de `### 1.1`
//    (vérifié le 28/08 sur les deux bases). Le Monitoring n'est pas une
//    compétence du référentiel — « jamais cible du routeur, jamais noté, il a
//    ses deux tables à lui » (`01-` §2) — et le `06-` §5 dit « CHAQUE
//    COMPÉTENCE » : ce sont les six. La septième ligne est ÉCARTÉE, et l'écran
//    le dit à la trace plutôt que de la faire disparaître en silence.
//
// ⚠️ CE FICHIER EST PUR (voir l'en-tête de `profil.ts`).
// ============================================================================

import { COMPETENCES, type Competence } from '../chaine/types'
import type { DimensionDite } from './profil'

/**
 * Le titre de la sous-section, identique aux six fiches — le patron de lecture
 * est celui de `sectionTelemetrie` (`utils/routeur/fiche-observables.ts`), qui
 * analyse CE MÊME MARKDOWN.
 */
const TITRE_1_1 = "### 1.1 La compétence expliquée à l'élève"

/** ⛔ Le Monitoring n'est pas une compétence du référentiel (`01-` §2). */
export function estUneCompetenceDuReferentiel(x: string): x is Competence {
  return (COMPETENCES as readonly string[]).includes(x)
}

export interface FicheDeCompetence {
  competence: Competence
  /** `competences_fiches.version` — pour la trace, pas pour l'élève. */
  version: string
  /**
   * ⭐ « CE QUE LA COMPÉTENCE REGARDE », tel que la fiche l'écrit. Markdown
   *    restreint : le rendu est celui de `C4-L3` — GRAS ET ITALIQUE SEULEMENT
   *    (`utils/deroule/balisage.ts` + `components/deroule/TexteBalise.tsx`).
   *    ⛔ On n'ajoute pas un second rendu.
   */
  texte: string
  /** ⭐ « LES DIMENSIONS SUR LESQUELLES ON LA LIT », dans l'ordre de la fiche. */
  dimensions: string[]
}

/**
 * ⭐ LE PARAGRAPHE SERVI À L'ÉLÈVE — le bloc de citation du `### 1.1`.
 *
 * La forme que les six fiches partagent, et c'est elle qu'on lit :
 *   `### 1.1 La compétence expliquée à l'élève`
 *   une ligne en italique — le rappel de la règle, POUR LE PROFESSEUR ;
 *   un bloc de citation `>` — LE TEXTE SERVI.
 * La sous-section est close par le `###` suivant.
 *
 * ⛔ ON NE PREND QUE LE BLOC DE CITATION. La ligne en italique dit « Le texte
 *    servi à l'élève, avec la colonne "la dimension, dite à l'élève" du §5. Ni
 *    observable, ni seuil, ni décompte. » : c'est une CONSIGNE DE FABRICATION,
 *    pas le texte. La servir à l'élève lui montrerait les coulisses.
 *
 * ⚠️ `null` quand la fiche ne porte pas la section — c'est le cas du
 *    `monitoring`, et il se DIT, il ne se devine pas.
 */
export function competenceExpliqueeALEleve(contenuFiche: string): string | null {
  const debut = contenuFiche.indexOf(TITRE_1_1)
  if (debut < 0) return null
  const apres = contenuFiche.slice(debut + TITRE_1_1.length)
  const fin = apres.indexOf('\n### ')
  const section = fin < 0 ? apres : apres.slice(0, fin)

  const lignes = section.split('\n')
    .filter((l) => l.startsWith('>'))
    .map((l) => l.slice(1).trim())
  // Un bloc de citation peut porter des lignes vides : elles séparent des
  // paragraphes, on les garde comme telles et on coupe le reste.
  const texte = lignes.join('\n').trim()
  return texte === '' ? null : texte
}

/**
 * ⚠️ « Les dimensions », dans l'ordre de `competences_correspondance.ordre` —
 *    « l'ordre de la table dans la fiche ». ⛔ Un observable sans
 *    `dimension_eleve` n'entre pas : il n'a pas de nom pour l'élève, et on ne
 *    lui sert JAMAIS son `code`.
 *
 * ⚠️ Les doublons sont écartés : deux observables peuvent partager une
 *    formulation, et la lister deux fois ferait croire à deux choses à surveiller.
 */
export function dimensionsDeLaFiche(dimensions: readonly DimensionDite[]): string[] {
  const vues = new Set<string>()
  return [...dimensions]
    .sort((a, b) => a.ordre - b.ordre)
    .map((d) => d.dimensionEleve.trim())
    .filter((nom) => {
      if (!nom || vues.has(nom)) return false
      vues.add(nom)
      return true
    })
}

/**
 * ⭐ L'ASSEMBLAGE, et il ÉCARTE ce qui n'est pas une compétence du référentiel.
 *
 * ⚠️ La clause granulaire du `07-` §2 s'applique : une fiche absente ou sans
 *    `### 1.1` bloque CETTE compétence, pas l'écran. `ecartees` porte le motif,
 *    et l'appelant le dit à la trace.
 */
export interface InventaireDesFiches {
  fiches: FicheDeCompetence[]
  /** Ce qui n'a pas été rendu, et POURQUOI. Jamais un silence. */
  ecartees: Array<{ competence: string; motif: string }>
}

export function inventaireDesFiches(
  lignes: ReadonlyArray<{ competence: string; version: string; contenu: string }>,
  dimensionsPar: ReadonlyMap<string, readonly DimensionDite[]>,
): InventaireDesFiches {
  const fiches: FicheDeCompetence[] = []
  const ecartees: Array<{ competence: string; motif: string }> = []

  for (const l of lignes) {
    if (!estUneCompetenceDuReferentiel(l.competence)) {
      ecartees.push({ competence: l.competence,
        motif: 'pas une compétence du référentiel — « jamais cible du routeur, jamais noté, '
          + 'il a ses deux tables à lui » (`01-` §2)' })
      continue
    }
    const texte = competenceExpliqueeALEleve(l.contenu)
    if (!texte) {
      ecartees.push({ competence: l.competence,
        motif: `la fiche v${l.version} ne porte pas « ${TITRE_1_1} » : rien à servir, `
          + 'et un texte ne se fabrique pas' })
      continue
    }
    fiches.push({
      competence: l.competence,
      version: l.version,
      texte,
      dimensions: dimensionsDeLaFiche(dimensionsPar.get(l.competence) ?? []),
    })
  }

  // L'ordre est celui du référentiel, pas celui de la base : deux lectures de la
  // même table ne rendent pas forcément les lignes dans le même ordre.
  fiches.sort((a, b) => COMPETENCES.indexOf(a.competence) - COMPETENCES.indexOf(b.competence))
  return { fiches, ecartees }
}
