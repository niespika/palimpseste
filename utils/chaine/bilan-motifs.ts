// ============================================================================
// LES MOTIFS DU BILAN D'UN DÉPÔT — la part PURE, donc éprouvable.
// ----------------------------------------------------------------------------
// ⛔ CE FICHIER N'IMPORTE RIEN DE `chaine.ts`, ET C'EST TOUT SON INTÉRÊT.
//    `chaine.ts` porte `import 'server-only'`, ce qui le rend INTESTABLE sous
//    `npm test` — c'est pour cela que `motifDesEcartees`, son voisin, n'a jamais
//    eu de vecteur et n'est éprouvé que par un script de couture. Ce qui est ici
//    est du texte pur : ça s'importe, donc ça se prouve.
// ============================================================================

/**
 * ⛔⛔ CE QUI PRÉFIXE UNE ÉCRITURE D'ÉTAT PERDUE — et il a UN domicile, parce que
 * les deux bouts doivent l'écrire pareil : celui qui pousse l'alerte
 * (`chaine.ts`, après `ecrireLEtatApresMesure`) et celui qui la retrouve pour la
 * dire (`motifDesEtatsPerdus`). Deux copies divergeraient, et la seconde se
 * tairait sans que rien ne le montre.
 */
export const PREFIXE_ETAT_PERDU = 'état après mesure : '

/**
 * ⛔⛔ UNE ÉCRITURE D'ÉTAT PERDUE SE DIT AU BILAN, ET SANS CONDITION.
 *
 * ⚠️ **Le défaut que cette fonction ferme.** `bilanEtat.erreurs` entrait bien
 * dans `alertes`, mais le résumé ne les retrouvait que par
 * `motifDuRetourManquant` — qui ne s'exécute **que si le retour MANQUE**, et ne
 * garde que les alertes portant le mot « retour ». Une perte survenue alors
 * qu'un retour avait été écrit **restait invisible** au `dernier_message` du
 * job, seul canal durable qu'un écran lise.
 *
 * *Le 27/08, treize élèves ont perdu leur lettre de Synthèse — et leur lettre
 * d'Expression avec — et le job a affiché « … retour écrit, 6 appel(s), 64 s ».
 * Pas un mot.* (Registre des ouverts, item 85, troisième volet.)
 *
 * ⛔ ELLE NE DIT QUE LES PERTES, JAMAIS LES ÉCARTEMENTS. Une compétence
 * légitimement écartée porte `état de X non réécrit — …` et relève de
 * `motifDesEcartees` : le préfixe les sépare, et c'est pour cela qu'il est
 * constant plutôt que deviné à la lecture.
 */
export function motifDesEtatsPerdus(alertes: readonly string[]): string {
  const siennes = alertes.filter((a) => a.startsWith(PREFIXE_ETAT_PERDU))
  if (!siennes.length) return ''
  // ⭐ LA MÊME DISCIPLINE QUE `motifDesEcartees`, ET POUR LA MÊME RAISON, apprise
  //   par l'épreuve : le FAIT d'abord, en entier ; le détail ensuite, borné. Un
  //   professeur doit savoir QU'IL A PERDU quelque chose même quand le message
  //   est tronqué — le compte survit toujours à la troncature.
  const detail = siennes.map((a) => a.slice(PREFIXE_ETAT_PERDU.length).trim()).join(' | ')
  return `, ⚠️ ${siennes.length} ÉCRITURE(S) D'ÉTAT PERDUE(S) — `
    + (detail.length > 400 ? `${detail.slice(0, 400)}…` : detail)
}
