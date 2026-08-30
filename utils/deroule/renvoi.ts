// ============================================================================
// LE RENVOI D'UN POINT DU RETOUR VERS LE PASSAGE DE LA COPIE.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// Handoff « Codex Exercices (élève) » §6 : *« chaque point porte un renvoi
// ▸ voir le passage de mon texte qui surligne le passage concerné à gauche »*.
// Le retour arrive déjà ancré — `point.ancrage.citation` est un VERBATIM de la
// copie (RR3, `01-` §12) —, il n'y a donc rien à deviner : il y a à RETROUVER.
//
// ⚠️⚠️ **ON NE DEVINE PAS, ET UNE CITATION INTROUVABLE NE S'ANCRE NULLE PART.**
//    C'est la règle d'`ancrerLigneALigne` (`utils/deroule/langue.ts`) et celle
//    de `citationsIntrouvables` (`utils/chaine/anti-injection.ts`) : *elles
//    alertent, elles ne réparent pas.* Ici, `null` veut dire « pas de renvoi » —
//    l'écran n'offre alors AUCUN lien, plutôt que d'en offrir un qui surlignerait
//    un passage approchant. **Surligner à côté serait pire que ne rien
//    surligner : l'élève corrigerait une phrase qu'on ne lui reproche pas.**
//
// ⭐ **LE TEXTE N'EST PAS RETOUCHÉ D'UN OCTET**, même promesse que
//    `marquage.ts` : la sortie est une liste de SEGMENTS dont la concaténation
//    rend la copie à l'identique. La comparaison, elle, se fait sur une forme
//    APLATIE — mais l'aplatissement garde un index vers l'original, et ce sont
//    des BORNES qui ressortent, jamais du texte réécrit.
//
// ⚠️ **L'APLATISSEMENT EST CELUI DE `anti-injection.ts:aplatir`, RENDU
//    INDEXABLE.** Il fallait le réécrire ici, et le motif est de forme, pas de
//    goût : `aplatir` fait `replace(/\s+/g, ' ')` puis `trim()` — deux gestes
//    qui CHANGENT LES LONGUEURS et rendent impossible tout retour vers l'offset
//    d'origine. On applique donc les mêmes règles caractère par caractère, en
//    tenant la table des positions. *Les deux doivent rester d'accord : une
//    citation que le contrôle de la chaîne tient pour présente doit se retrouver
//    ici, sinon le retour parlerait d'un passage que l'écran ne sait pas montrer.*
// ============================================================================

import { segmenterParIntervalles, type SegmentMateriau } from './marquage'

/** Les apostrophes se ramènent à une seule forme — 1 caractère pour 1. */
const APOSTROPHES = /[‘’ʼ]/
/** Les guillemets TOMBENT, droits comme français — 1 caractère pour 1 blanc. */
const GUILLEMETS = /[“”«»"]/

interface Plat {
  /** Le texte aplati, prêt pour `indexOf`. */
  texte: string
  /** Pour chaque caractère aplati, l'offset de DÉBUT dans le texte d'origine. */
  debuts: number[]
  /** Pour chaque caractère aplati, l'offset de FIN (exclu) dans l'origine. */
  fins: number[]
}

/**
 * Aplatit en gardant la trace des positions.
 *
 * ⚠️ **UNE SUITE DE BLANCS DEVIENT UN SEUL ESPACE**, dont l'intervalle d'origine
 *    couvre TOUTE la suite : sans quoi une citation à cheval sur un retour à la
 *    ligne se surlignerait en laissant le saut dehors, et le cadre s'ouvrirait.
 *
 * ⚠️ **LA MINUSCULE SE PREND CARACTÈRE PAR CARACTÈRE, ET ON REFUSE CELLES QUI
 *    CHANGENT DE LONGUEUR** (İ → i̇ en fait deux) : garder l'original coûte au
 *    plus une non-correspondance, quand la table des positions fausse coûterait
 *    un surlignage décalé sur tout ce qui suit.
 */
function aplatirIndexable(source: string): Plat {
  const texte: string[] = []
  const debuts: number[] = []
  const fins: number[] = []
  let i = 0
  while (i < source.length) {
    const c = source[i]!
    if (/\s/.test(c)) {
      let j = i
      while (j < source.length && /\s/.test(source[j]!)) j++
      texte.push(' ')
      debuts.push(i)
      fins.push(j)
      i = j
      continue
    }
    const remplace = APOSTROPHES.test(c) ? "'" : GUILLEMETS.test(c) ? ' ' : c
    const bas = remplace.toLowerCase()
    texte.push(bas.length === 1 ? bas : remplace)
    debuts.push(i)
    fins.push(i + 1)
    i++
  }
  return { texte: texte.join(''), debuts, fins }
}

/** La citation, aplatie de la même façon — sans table : on ne remonte pas dedans. */
function aplatirCitation(citation: string): string {
  return aplatirIndexable(citation).texte.trim()
}

/**
 * ⭐ LES BORNES DE LA CITATION DANS LE TEXTE — `[début, fin[`, en caractères du
 *    TEXTE D'ORIGINE.
 *
 * @returns `null` quand la citation est vide, ou quand elle ne se retrouve pas.
 *          **Ce `null` n'est pas une panne** : le retour peut citer une phrase
 *          que l'élève a réécrite depuis (cas de la version finale), et la loi
 *          veut alors un examen humain, pas un surlignage approximatif
 *          (`06-` §2 et §7).
 */
export function intervalleDeLaCitation(
  texte: string | null | undefined, citation: string | null | undefined,
): [number, number] | null {
  if (!texte || !citation || citation.trim() === '') return null

  // Le cas nominal, et de loin le plus fréquent : le verbatim est exact.
  const exact = texte.indexOf(citation)
  if (exact >= 0) return [exact, exact + citation.length]

  const cible = aplatirCitation(citation)
  if (cible === '') return null
  const plat = aplatirIndexable(texte)
  const k = plat.texte.indexOf(cible)
  if (k < 0) return null
  const debut = plat.debuts[k]
  const fin = plat.fins[k + cible.length - 1]
  if (debut === undefined || fin === undefined || fin <= debut) return null
  return [debut, fin]
}

/**
 * ⭐ LA COPIE, DÉCOUPÉE PAR LE PASSAGE RENVOYÉ — mêmes segments que le matériau,
 *    donc **même promesse** : la concaténation des `texte` rend la copie à
 *    l'octet près.
 *
 * @param citation `null` = aucun renvoi actif ; le texte sort en un seul segment
 *                 non marqué, et l'écran le rend tel quel.
 */
export function segmentsDuRenvoi(
  texte: string | null | undefined, citation: string | null | undefined,
): SegmentMateriau[] {
  if (!texte) return []
  const bornes = intervalleDeLaCitation(texte, citation)
  return segmenterParIntervalles(texte, bornes ? [bornes] : [])
}
