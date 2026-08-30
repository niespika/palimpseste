// ============================================================================
// LA RÉPARTITION RELUE — « ce que tu avais posé », APRÈS le retour.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O.
// ----------------------------------------------------------------------------
// Handoff « Codex Exercices (élève) » §6, écran 2f : *« à droite, en haut : la
// consigne, puis "Ce que tu avais posé" — les quatre lectures avec les jetons
// posés »*, et *« la bonne lecture est marquée APRÈS COUP par une barre verte ;
// les autres barres restent `--muet` »*.
//
// ⛔⛔ **CE MODULE NE LIT PAS L'OFFRE, IL LIT L'ENTRÉE DÉJÀ ÉCRITE.** C'est la
//    seule façon d'obéir à l'interdit qui gouverne `CredenceSaisie` :
//    *« `offre.indexAttendue` n'est lu par AUCUN rendu, jamais »* — à l'écran de
//    saisie il est du poison. L'entrée de `exercices_metacognition.credence`,
//    elle, N'EXISTE QU'UNE FOIS LA RÉPONSE DONNÉE : elle porte `candidats`,
//    `jetons` et `index_correct` (`credence.ts:saisieARegistrer`), et lire
//    là-dedans ne peut RIEN révéler avant que l'élève ait répondu.
//    *La garde est structurelle, pas déclarative : il n'y a pas de donnée à
//    fuiter tant que le geste n'a pas eu lieu.*
//
// ⚠️ **ET CE MODULE NE SUFFIT PAS À AUTORISER L'AFFICHAGE.** Il rend ce qu'il
//    trouve ; c'est l'ÉCRAN qui décide de ne le montrer qu'au temps du retour —
//    la même garde que `corrections`, qui ne se sert qu'après la crédence.
//
// ⚠️ **`index_correct` PEUT MANQUER, ET CE N'EST PAS UNE PANNE** : une entrée
//    écrite avant que la clé n'existe, ou une forme `pourcentage` (les quatre
//    crans qui isolent : aucun candidat n'est servi). On rend alors `null`, et
//    l'écran n'affiche AUCUNE barre verte — il ne devine pas laquelle l'était.
// ============================================================================

/** Une lecture servie, telle que l'élève l'avait sous les yeux. */
export interface LecturePosee {
  /** Le libellé du candidat, DANS L'ORDRE OÙ IL A ÉTÉ SERVI — jamais retrié. */
  candidat: string
  /** Les jetons que l'élève y avait posés, sur 100. */
  jetons: number
  /**
   * ⭐ Marquée APRÈS COUP : c'est la lecture qu'il fallait voir.
   * ⛔ Elle ne dit RIEN de ce que l'élève avait posé — les deux se lisent côte
   *    à côte, et c'est tout l'objet de l'écran 2f.
   */
  attendue: boolean
}

const nombre = (x: unknown): number | null =>
  typeof x === 'number' && Number.isFinite(x) ? x : null

/**
 * ⭐ CE QUE L'ÉLÈVE AVAIT POSÉ, relu de son entrée de crédence.
 *
 * @param entree l'entrée de `exercices_metacognition.credence` pour CE cas —
 *               `CasServi.credenceDonnee`, tel quel.
 * @returns `null` hors d'une répartition donnée : pas d'entrée, forme
 *          `pourcentage`, candidats manquants, ou jetons dépareillés. **On ne
 *          rafistole pas une entrée mal formée : on ne l'affiche pas.**
 */
export function lireLaRepartition(entree: unknown): LecturePosee[] | null {
  if (typeof entree !== 'object' || entree === null) return null
  const e = entree as Record<string, unknown>
  if (e.forme !== 'repartition') return null

  const candidats = Array.isArray(e.candidats)
    ? e.candidats.filter((c): c is string => typeof c === 'string')
    : []
  const jetons = Array.isArray(e.jetons)
    ? e.jetons.map(nombre).filter((n): n is number => n !== null)
    : []
  // ⚠️ Les deux longueurs doivent CORRESPONDRE. Un décalage ferait lire les
  //    jetons d'une lecture sous le libellé d'une autre — pire qu'un écran vide.
  if (candidats.length === 0 || candidats.length !== jetons.length) return null

  const attendue = nombre(e.index_correct)
  return candidats.map((candidat, i) => ({
    candidat,
    jetons: jetons[i] ?? 0,
    attendue: attendue !== null && attendue === i,
  }))
}

/**
 * Le rappel court du téléphone — « A 60 · B 30 · C 10 » (handoff §6, 2f).
 *
 * ⚠️ **LES LECTURES À ZÉRO NE S'Y ÉCRIVENT PAS** : le rappel tient sur une
 *    ligne, et « D 0 » n'apprend rien — la liste complète est juste dessous,
 *    dépliable. ⚠️ Les lettres suivent L'ORDRE SERVI, jamais un classement :
 *    trier par jetons décroissants ferait lire la première comme « la bonne ».
 */
export function rappelDeLaRepartition(lectures: readonly LecturePosee[]): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return lectures
    .map((l, i) => ({ lettre: alphabet[i] ?? String(i + 1), jetons: l.jetons }))
    .filter((l) => l.jetons > 0)
    .map((l) => `${l.lettre} ${l.jetons}`)
    .join(' · ')
}
