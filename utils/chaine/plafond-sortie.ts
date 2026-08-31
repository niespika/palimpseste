// ============================================================================
// C4 · L5 — LE PLAFOND DE SORTIE, ET CE QU'UNE TRONCATURE EN FAIT.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⛔⛔ POURQUOI CETTE RÈGLE A SON PROPRE DOMICILE, ET NE VIT PAS DANS `appel.ts`.
//    `appel.ts` est `server-only` : rien de ce qu'il contient n'est éprouvé par
//    `npm test`, et la recette qui l'exerce DÉPENSE. Or ce qu'on répare ici est
//    précisément un défaut qui ne s'est vu qu'en production, une fois, sur un
//    seul dépôt — le genre de défaut qu'aucune relecture n'attrape et qu'aucune
//    recette occasionnelle ne reproduit. **Une règle qu'on ne peut pas éprouver
//    est une règle qu'on croit tenir.** D'où ce module, et le patron du lot :
//    « les fichiers purs n'importent jamais `server-only` » (`LISEZ-MOI.md`).
//
// ⛔⛔ CE QUE LE PLAFOND FIGÉ COÛTAIT — mesuré en PRODUCTION le 31/08/2026.
//    `max_tokens` valait 2 000 à l'appel ET à la relance. Quand P1 dépassait, la
//    sortie tronquée était rejetée par le schéma, la relance repartait avec le
//    MÊME plafond, et retombait dessus. La compétence disparaissait alors des
//    mesures **sans que rien ne le dise** : le job restait `abouti`.
//      · dépôt `c1431dc5` — deux appels `p1 / structure` à exactement 2 000
//        jetons, **zéro appel `p2`**, et `structure` absente du retour d'un
//        élève qui l'avait pourtant travaillée ;
//      · dépôt `22322ca8` — même troncature au premier appel, relance à 1 906,
//        et la mesure passe.
//    **Le défaut est INTERMITTENT** : il ne se voit pas en relisant les journaux
//    d'un bon jour, et c'est pourquoi il a survécu à 487 appels.
//
// ⭐ LA RÈGLE — une troncature DOUBLE le plafond, jusqu'à une borne haute.
//    On ne part pas d'emblée au plafond haut : la sortie se facture au jeton, et
//    2 000 suffisent à la quasi-totalité des appels (mesuré sur les 487 appels
//    de production — médiane **750**, p90 **1 192**). *On paie le plafond haut
//    seulement là où il est nécessaire, et on ne perd plus rien nulle part.*
// ============================================================================

/**
 * Le plafond de sortie du PREMIER appel, quand l'appelant n'en impose pas.
 * La valeur d'origine, et elle ne bouge pas — voir les mesures ci-dessus.
 */
export const PLAFOND_SORTIE_DEFAUT = 2000

/**
 * La borne haute, atteinte par doublements successifs sur troncature.
 *
 * ⚠️ C'est une BORNE DE SÉCURITÉ, pas une cible : elle existe pour qu'une sortie
 *    qui partirait en boucle coûte cher une fois, jamais indéfiniment.
 */
export const PLAFOND_SORTIE_MAX = 8000

/**
 * ⭐ LE PLAFOND DE LA RELANCE, APRÈS UNE SORTIE COUPÉE.
 *
 * ⛔ IL NE FAIT JAMAIS BAISSER CE QUE L'APPELANT A DEMANDÉ, et ce n'est pas une
 *    précaution théorique : trois appelants passent déjà un plafond explicite —
 *    `utils/generateur/generateur-serveur.ts` en demande **16 000**,
 *    `utils/passation/transcription.ts` **8 000**. Un `Math.min` nu contre la
 *    borne les ramènerait à 8 000, et **la relance serait plus courte que
 *    l'appel qu'elle répare** : on aurait transformé une troncature réparable en
 *    troncature garantie.
 *
 * ⭐⭐ ET LA BORNE SE CALCULE SUR `initial * 2`, PAS SUR `initial`. C'est le test
 *    qui a tranché, pas le raisonnement : borner à `max(PLAFOND, initial)` rend
 *    la fonction **inerte pour tout appelant explicite** — celui qui demande
 *    16 000 se voyait rendre 16 000, c'est-à-dire exactement le plafond qui
 *    venait de le couper. Il retombait dessus, et on n'avait rien réparé pour
 *    lui : on avait seulement déplacé le défaut d'origine plus haut.
 *    **La règle juste donne à CHAQUE appelant un doublement de marge au-dessus
 *    de sa propre demande**, et à personne davantage.
 *
 * @param courant  le plafond du dernier appel — celui qui vient d'être atteint.
 * @param initial  ce que l'appelant avait demandé au départ. La borne haute ne
 *                 descend jamais sous cette valeur, et lui laisse un doublement.
 * @returns le plafond de la relance. **Égal à `courant`** quand on est déjà au
 *          plafond haut : l'appelant lit alors qu'il n'y a plus de marge, au
 *          lieu de croire à une relance qui n'en est pas une.
 */
export function plafondApresTroncature(courant: number, initial: number): number {
  const haut = Math.max(PLAFOND_SORTIE_MAX, initial * 2)
  return Math.min(courant * 2, haut)
}

/**
 * Le motif porté au journal et à l'alerte — dit dans la langue du bilan.
 *
 * ⭐ LA TRONCATURE SE DIT, et c'est la moitié du correctif. Sans cette phrase,
 *    l'alerte annoncerait « sortie non conforme » sur un modèle qui n'avait rien
 *    fait de mal, et **personne ne chercherait du côté du plafond** — c'est
 *    exactement ce qui s'est produit pendant 487 appels.
 */
export function motifDeTroncature(avant: number, apres: number): string {
  return apres > avant
    ? `⚠️ sortie COUPÉE au plafond de ${avant} jetons — la relance repart à ${apres}`
    : `⚠️ sortie COUPÉE au plafond de ${avant} jetons, qui est déjà le plafond haut`
}
