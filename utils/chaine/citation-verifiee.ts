/**
 * ⭐⭐⭐ 31/08/2026 — LE CODE DÉCIDE CE QUI EST CITABLE, PAS LE MODÈLE.
 *
 * *« Le modèle ne doit pas citer le texte de l'élève. On vire cette option. »*
 *                                                            — Louis, 31/08
 *
 * **CE QUE CE MODULE GARANTIT, ET C'EST LA SEULE CHOSE QU'IL PROMET :** aucun
 * texte ne parvient à l'élève sous l'étiquette *« Tu écris »* s'il n'est pas
 * **verbatim dans sa copie**. Le modèle continue d'écrire une citation ; elle
 * ne franchit l'écran que si le code l'a retrouvée. Ce qui ne tient pas est
 * **écarté** — silencieusement, sans rejeu, sans un appel de plus.
 *
 * ⭐ **POURQUOI ÉCARTER PLUTÔT QUE REFUSER.** Un refus rejoue le retour : c'est
 * un appel brûlé, un retour qui arrive plus tard, et — mesuré sur les 67 retours
 * de production — **40 retours sur 67 refusés au premier essai**, soit un coût
 * de phase à peu près doublé. Écarter coûte zéro et donne la MÊME garantie : le
 * point garde son texte, il perd son bloc de citation.
 *
 * ⚠️⚠️ **LA MESURE QUI A DÉCIDÉ DE CE MODULE — 31/08, 67 retours, 187 squelettes.**
 *
 *   · Calame **recopie fidèlement** : **94,6 %** de ses 278 citations viennent
 *     du squelette de P1, 2,9 % seulement sont de son cru.
 *   · ⛔ **C'est P1 qui dérive** : ses citations ne sont pas verbatim dans
 *     **5,0 %** des cas — **18,5 % en argumentation**, 8,2 % en synthèse.
 *   · Donc « le code cite depuis le squelette » NE SUFFIT PAS : il hériterait de
 *     la dérive. Le contrôle porte sur **la copie**, jamais sur le squelette.
 *
 * ⭐⭐ **L'ÉLISION EST LÉGITIME, ET LE CONTRÔLE STRICT LA REFUSAIT.** Une citation
 * qui saute un morceau — *« une certaine déshumanisation [...] une certaine
 * fermeture d'esprit »* — n'est PAS une fabrication : c'est la façon normale de
 * citer trois occurrences d'un même tic. **Mesuré : 7 des 56 citations que le
 * contrôle verbatim strict refusait étaient des élisions**, donc 7 refus à tort,
 * sur 3 retours. On découpe sur les marques d'élision et on exige chaque morceau.
 *
 * ⭐ **ON N'ÉCRIT PAS UN SECOND TOKENISEUR.** Tout passe par
 * `citationsIntrouvables` (`anti-injection.ts`), qui aplatit apostrophes,
 * guillemets et suites de blancs — *« sans quoi « oui » et "oui" ne seraient
 * jamais la même citation »*. Ce module ne fait que DÉCOUPER avant de l'appeler.
 */
import { citationsIntrouvables } from './anti-injection'

/**
 * Les marques d'élision qu'un modèle emploie, dans les trois formes qu'on a vues
 * en production : `…`, `...`, et l'une ou l'autre entre crochets.
 */
const ELISION = /\s*(?:\[\s*(?:…|\.\.\.)\s*\]|…|\.\.\.)\s*/

/**
 * ⚠️ **LE PLANCHER D'UN MORCEAU, ET POURQUOI IL EXISTE.** Sous quatre
 * caractères, un morceau ne prouve plus rien : « et », « la », « il » se
 * retrouvent dans n'importe quelle copie, et les exiger reviendrait à tout
 * laisser passer. Quatre est le même plancher que celui du repérage des
 * citations dans la prose (`CITE`, `retour.ts`) — un seul chiffre, un seul sens.
 */
const PLANCHER = 4

/**
 * La citation tient-elle contre cette source ?
 *
 * ⛔ **ELLE ÉCHOUE FERMÉ, TOUJOURS.** Source absente, citation vide, citation
 * réduite à des miettes sous le plancher : la réponse est NON. *Un contrôle qui
 * ne peut pas s'exécuter ne dit jamais « c'est bon » — il dit « je ne sers
 * pas ».* C'est l'inverse du réflexe de `citationsIntrouvables`, qui rend une
 * liste vide quand la production manque : là-bas le résultat est une ALERTE
 * qu'on journalise, ici c'est une décision qui atteint l'élève.
 */
export function citationTient(source: string | null | undefined, citation: string): boolean {
  if (source == null || source.trim() === '') return false
  const morceaux = morceauxControlables(citation)
  if (morceaux.length === 0) return false
  return citationsIntrouvables(source, morceaux).introuvables.length === 0
}

/**
 * Les morceaux d'une citation qu'on peut exiger de la source : découpés sur
 * l'élision, chacun au-dessus du plancher. ⭐ Partagé avec le contrôle de
 * fidélité de P1 (`fidelite-p1.ts`) — *on n'écrit pas un second découpage*.
 * Une liste vide dit « rien de contrôlable », et chaque appelant décide ce
 * qu'il en fait : ici un refus, là-bas une citation qu'on ne compte pas.
 */
export function morceauxControlables(citation: string): string[] {
  return citation.split(ELISION).map((m) => m.trim()).filter((m) => m.length >= PLANCHER)
}

export interface AncrageBrut {
  source: 'copie' | 'texte_support'
  citation: string
}

/** Ce que le contrôle a fait d'un ancrage, et pourquoi — le motif part au bilan. */
export interface AncrageJuge {
  /** L'ancrage à servir, ou `null` : le point garde son texte et perd sa citation. */
  ancrage: AncrageBrut | null
  motif: string | null
}

/**
 * ⭐⭐ LE POINT DE PASSAGE UNIQUE. Un ancrage franchit l'écran ou il est écarté.
 *
 * ⚠️ **LES DEUX SOURCES NE SE COMPARENT PAS AU MÊME TEXTE, ET C'EST TOUT RR3** :
 * `copie` se vérifie contre la production de l'élève, `texte_support` contre la
 * tranche de texte d'auteur RÉELLEMENT SERVIE. Une citation étiquetée `copie`
 * qu'on retrouve dans le texte d'auteur est **la faute que RR3 nomme** — elle
 * s'écarte comme les autres, mais son motif la désigne, parce que le professeur
 * doit pouvoir la distinguer d'un simple écart de fidélité.
 */
export function jugerLAncrage(
  ancrage: AncrageBrut | null | undefined,
  a: { production: string | null; texteSupport: string | null; coTexte?: string | null },
): AncrageJuge {
  if (!ancrage || typeof ancrage.citation !== 'string' || ancrage.citation.trim() === '') {
    return { ancrage: null, motif: null }
  }
  const court = ancrage.citation.length > 60 ? `${ancrage.citation.slice(0, 60)}…` : ancrage.citation
  const contre = ancrage.source === 'copie' ? a.production : a.texteSupport

  if (citationTient(contre, ancrage.citation)) return { ancrage, motif: null }

  if (ancrage.source === 'copie' && citationTient(a.texteSupport, ancrage.citation)) {
    return {
      ancrage: null,
      motif: `citation écartée — étiquetée « copie », c'est une phrase DU TEXTE SUPPORT : « ${court} »`,
    }
  }
  // ⭐⭐ 31/08 — LE TROISIÈME TEXTE. Aux crans de production, l'exercice DONNE une
  //    matière (l'argument à illustrer, les paragraphes à coudre). Une citation
  //    qu'on y retrouve n'est pas de l'élève : c'est l'énoncé qu'on lui rendrait
  //    sous « tu écris ». ⚠️ Le co-texte n'est PAS une source d'ancrage — il n'y
  //    a que `copie` et `texte_support` — donc ce cas n'a qu'un effet : écarter,
  //    en NOMMANT la vraie provenance pour que le professeur ne cherche pas.
  if (ancrage.source === 'copie' && citationTient(a.coTexte, ancrage.citation)) {
    return {
      ancrage: null,
      motif: `citation écartée — étiquetée « copie », c'est une phrase DU TEXTE DE DÉPART `
        + `que l'exercice avait donnée : « ${court} »`,
    }
  }
  return {
    ancrage: null,
    motif: `citation écartée — introuvable dans ${
      ancrage.source === 'copie' ? 'la copie' : 'le texte servi'} : « ${court} »`,
  }
}
