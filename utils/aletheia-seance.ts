/**
 * Contrat de terminologie Aletheia — « séance » vs « semaine ».
 *
 * Une SÉANCE est un morceau auto-suffisant de la découpe d'un livre : un ORDINAL
 * (1, 2, 3 …), un index de découpe. Ce n'est JAMAIS une date, JAMAIS une semaine
 * calendaire.
 *
 * Historique : les colonnes DB portent le nom hérité « semaine » / « semaine_index »
 * (`scriptorium_documents.semaine`, `aletheia_travaux.semaine_index`,
 * `aletheia_diagnostic.semaine_index`, la clé jsonb `semaine` de
 * `aletheia_livre_reference`, et les bornes de tranche
 * `scriptorium_parcours_creneaux.livre_semaine_debut/fin`). Le renommage
 * « semaines → séances » est UI-only : on NE renomme PAS ces colonnes (zéro
 * migration sur du travail élève en prod). Elles SIGNIFIENT désormais « ordinal de
 * séance ».
 *
 * Règle (à tenir dans tout NOUVEAU code) : le mot « semaine » est réservé au
 * CALENDAIRE — frise d'enseignement, semaine de parcours, dates. Ne JAMAIS
 * introduire un nouveau champ nommé `semaine` pour un ordinal ; utiliser `seance`
 * / `SeanceOrdinal`. Cela évite le télescopage futur « une semaine calendaire peut
 * contenir plusieurs séances ».
 *
 * Choix de type : simple alias de `number` (PAS un « branded type »). Il documente
 * l'intention et rend l'ordinal grep-able, sans imposer un cast à chaque frontière
 * (un brand nu ne compilerait pas sans `as` partout, ce qui vide sa garantie).
 * `asSeance` est le seul point de conversion recommandé au bord DB → TS.
 */
export type SeanceOrdinal = number

/**
 * Convertit une valeur de colonne héritée (`semaine` / `semaine_index`, ou une
 * borne de tranche `livre_semaine_*`) en `SeanceOrdinal`. Point de conversion
 * unique et explicite au bord DB → TS.
 */
export function asSeance(n: number): SeanceOrdinal {
  return n
}
