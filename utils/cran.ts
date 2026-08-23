// ============================================================================
// C4 · L11 — LA FORME DU `cran`, ET L'ARBITRAGE QUI LA FIXE.
// ----------------------------------------------------------------------------
// ⭐ L'ARBITRAGE — LE NUMÉRO FAIT FOI EN BASE.
//
// Le `02-` §2.1 et §2.2 donnent LES DEUX : la table des crans porte un `#` de 1
// à 9 ET un code (`diagnostic_guide`, `production_guidee`…). La source ne tranche
// pas — elle n'a pas à le faire : elle décrit une échelle, pas un stockage. La
// représentation EN BASE se tranchait ici, et elle est tranchée :
//
//   1. `exercices_crans.cran` est un `int PRIMARY KEY` (`c4_l8_doctrine.sql`) :
//      le numéro EST déjà la clé de la table des crans. Le code y vit à côté,
//      `text not null unique` — il reste disponible d'une jointure, toujours.
//   2. Trois des quatre tables de doctrine le portent déjà en entier —
//      `exercices_crans`, `exercices_routes`, `exercices_consignes_production`,
//      toutes sous `check (cran between 1 and 9)`. La quatrième,
//      `exercices_types_crans`, est DÉRIVÉE : elle suit son dériveur.
//   3. L'échelle est ORDINALE — « l'échelle d'autonomie » (`02-` §2) —, et le
//      `04-` §14 parle « des crans 2, 6 et 8 ». Un `check between 1 and 9` dit
//      la forme en un mot ; sur du texte il faudrait énumérer neuf chaînes.
//   4. TOUS LES CHEMINS D'ÉCRITURE RÉELS écrivent déjà le numéro : l'écran de
//      conception (`app/prof/conception/actions.ts`, `String(Number(...))`) et
//      l'import (`utils/fabrique/import-ecriture.ts`, dont le refus n° 5 exige
//      `Number.isInteger(cran)`). Les lignes au code ne viennent QUE des scripts
//      de recette — c'est un décor, pas une voie de production.
//
// ⚠️ CE N'EST PAS UNE DÉCISION DE DOCTRINE, et le `02-` §2 ne bouge pas : il est
//    GELÉ, il donne les deux formes, et il a raison de le faire. L'arbitrage
//    porte sur la REPRÉSENTATION EN BASE, et sur elle seule.
//
// ⚠️ LA CONTRAINTE DE FORME N'EST PAS LA GARDE DE PRÉSENCE. `exercices_cran_chk`
//    — « `statut = 'a_concevoir'` ou `cran is not null` » — a été SUPPRIMÉE par
//    C4-L9, parce qu'« un `CHECK` ne pouvait pas lire `exercices_types.nature` » ;
//    ce qui la remplace est le trigger `trg_exercices_cran_selon_le_type`, et le
//    drapeau de vérification de C4-L9 EXIGE que le CHECK ait disparu.
//    ⛔ On ne réintroduit donc JAMAIS `exercices_cran_chk` sous un autre nom.
//    Le `CHECK` de FORME, lui, reste possible et souhaitable — il ne regarde que
//    la colonne — À CONDITION DE TOLÉRER `NULL` : un examen diagnostique (type
//    de nature `complet`) n'a PAS DE CRAN DU TOUT (`07-` §1.1).
//
// Ce module est PUR, et il est le SEUL endroit où la forme se lit.
// ============================================================================

/** Les neuf crans — `02-` §2.1. Le domaine, et rien d'autre. */
export const CRAN_MIN = 1
export const CRAN_MAX = 9

/**
 * Le numéro d'un `cran` tel que la base le porte — ou `null`.
 *
 * `null` a DEUX causes, et elles ne se confondent pas :
 *  · l'instance n'a pas de cran (examen diagnostique) — c'est légitime ;
 *  · la valeur est illisible (un code, une forme inconnue) — c'est un reste
 *    d'avant la conversion, et `cranEstUnCode()` le distingue.
 *
 * ⚠️ `Number('')` vaut 0 et `Number('diagnostic_guide')` vaut NaN : ni l'un ni
 *    l'autre n'est un cran, et les laisser passer est exactement ce qui faisait
 *    partir `.eq('cran', NaN)` — un 400 avalé par PostgREST, et cinq champs
 *    vides sur une instance parfaitement valide.
 */
export function cranNumero(brut: unknown): number | null {
  if (typeof brut === 'number') {
    return Number.isInteger(brut) && brut >= CRAN_MIN && brut <= CRAN_MAX ? brut : null
  }
  if (typeof brut !== 'string') return null
  const t = brut.trim()
  if (t === '' || !/^[1-9]$/.test(t)) return null
  return Number(t)
}

/**
 * Vrai quand la valeur est un CODE de cran plutôt qu'un numéro — la forme
 * d'avant la conversion. Un appelant qui la rencontre doit la résoudre par
 * `exercices_crans.code`, pas la deviner.
 */
export function cranEstUnCode(brut: unknown): boolean {
  return typeof brut === 'string' && brut.trim() !== '' && cranNumero(brut) === null
}
