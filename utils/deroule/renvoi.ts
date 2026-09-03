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
import { retrouverCitation } from '../chaine/citation-approchee'

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
  const bornes = intervallesDeLaCitation(texte, citation)
  if (!bornes.length) return null
  return [bornes[0]![0], bornes[bornes.length - 1]![1]]
}

/**
 * ⭐⭐ 02/09 — LES BORNES, MORCEAU PAR MORCEAU, PAR LE REPÉRAGE DE LA CHAÎNE.
 *    Une citation élidée (« A [...] B ») rend deux intervalles, et l'écran
 *    surligne les deux sans le passage sauté. Une citation à un détail près
 *    (accent, blanc d'OCR) se retrouve par `citation-approchee.ts` — le même
 *    code qui l'a réparée avant qu'elle ne soit servie, donc l'écran et la
 *    chaîne ne divergent pas. Ce qui reste introuvable rend `[]` : rien n'est
 *    surligné, et c'est voulu — « surligner à côté serait pire ».
 */
export function intervallesDeLaCitation(
  texte: string | null | undefined, citation: string | null | undefined,
): Array<[number, number]> {
  if (!texte || !citation || citation.trim() === '') return []
  const exact = texte.indexOf(citation)
  if (exact >= 0) return [[exact, exact + citation.length]]
  const r = retrouverCitation(texte, citation)
  if ('echec' in r) return []
  return r.intervalles.filter(([d, f]) => f > d)
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
  return segmenterParIntervalles(texte, intervallesDeLaCitation(texte, citation))
}
