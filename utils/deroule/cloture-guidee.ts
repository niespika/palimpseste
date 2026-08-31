// ============================================================================
// C4 · L3 — LA CLÔTURE DES CRANS GUIDÉS : quand l'exercice à candidats est fini.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⛔⛔ LE TROU QUE CE MODULE FERME, ET IL A ÉTÉ MESURÉ.
//
//    Aux deux crans guidés — `diagnostic_guide` (1) et `transformation_guidee`
//    (3) —, **l'élève ne remet rien** : `formeDuTravail` rend `choisir`, l'écran
//    ne sert aucun champ de rédaction, `actionRemettre` n'est jamais appelée, et
//    le code l'assume (`plan-de-travail.ts` : « aux crans guidés, `v1_remis_at`
//    n'est JAMAIS posé »). **Sa crédence EST sa réponse.**
//
//    Conséquence, jamais voulue : le dépôt restait au statut `ouvert` **à
//    jamais**. Or `STATUTS_RENDUS` (`utils/routeur/assiduite.ts`) ne compte que
//    `v1_remis · retour_publie · vf_remis · clos`, tandis qu'`entreAuDenominateur`
//    accepte tout sauf `retire`. **Un exercice de cran 1 parfaitement fait
//    comptait donc au dénominateur de l'assiduité, et jamais au numérateur.**
//    ⭐ La portée est mesurée : **177 des 576 exercices de la banque 1.3 — 30,7 %
//    — sont à ces deux crans** (cran 1 : 89 · cran 3 : 88). Un élève dont un
//    quart du travail tombe là passait sous les trois quarts de `semaineFaite`
//    en ayant tout fait.
//
// ⭐ CE QUE LA CLÔTURE N'EST PAS. Ce n'est pas une remise : rien ne part à la
//    chaîne, aucun appel de modèle n'a lieu, aucun retour n'est attendu — « le
//    jugement algorithmique […] rien ne vient derrière » (`correction.ts`). Le
//    statut posé est donc **`clos`**, et pas `v1_remis` : `clos` dit « terminé »
//    à l'élève (`codex-onglets/regles.ts`), il compte comme rendu, et
//    `utils/passation/depots.ts` l'exclut de tout re-traitement. *Poser
//    `v1_remis` promettrait un retour qui ne viendra pas.*
//
// ⛔ ET LE VERDICT NE SE STOCKE PAS. Il est ENTIÈREMENT DÉRIVABLE de ce que la
//    crédence journalise déjà — `jetons` et `index_correct` —, et la fonction
//    qui le calcule existe : `accordCredenceReussite` (`monitoring-calcul.ts`).
//    L'écrire dans l'entrée en ferait un SECOND DOMICILE, qui divergerait le
//    jour où l'un des deux changerait. « L'écran saisit, il ne calcule rien »
//    (`credence.ts`) reste vrai : ce module ne calcule pas le verdict non plus,
//    il dit seulement QUAND l'exercice est fini.
// ============================================================================

/**
 * ⭐ TOUS LES CAS ONT-ILS REÇU LEUR CRÉDENCE ?
 *
 * ⚠️ **On exige la RÉPARTITION, pas une entrée quelconque.** Une entrée de cas
 *    peut exister sans crédence : depuis la désignation (`02-` §5), la zone et
 *    la crédence se posent en deux gestes séparés et fusionnent dans la même
 *    entrée (`gestes.ts`). Se contenter de compter les entrées fermerait
 *    l'exercice sur une zone seule — donc **avant que l'élève ait répondu**.
 *    ⛔ Aux crans guidés il n'y a pas de zone ; la garde reste, parce qu'un
 *    module pur ne suppose pas ce que son appelant lui envoie.
 *
 * ⚠️ **Les cas sont numérotés à partir de 1**, et on les exige TOUS — pas « au
 *    moins n entrées ». *Deux crédences posées deux fois sur le cas 1 ne font
 *    pas une paire faite.*
 *
 * @param credences le tableau `exercices_metacognition.credence`, tel quel.
 * @param nombreDeCas ce que le geste commande — 2 en diagnostic, 1 ailleurs
 *   (`regime.ts:nombreDeCas`). ⚠️ Un compte nul ou négatif rend `false` : on ne
 *   clôt pas un exercice dont on ne sait pas combien de cas il porte.
 */
export function credencesCompletes(credences: unknown, nombreDeCas: number): boolean {
  if (!Number.isInteger(nombreDeCas) || nombreDeCas < 1) return false
  if (!Array.isArray(credences)) return false

  const vus = new Set<number>()
  for (const c of credences) {
    if (!c || typeof c !== 'object') continue
    const o = c as Record<string, unknown>
    const cas = typeof o.cas === 'number' ? o.cas : null
    if (cas === null) continue
    // La répartition, et sa forme exacte — celle que `lireCredence` attend
    // (`monitoring.ts`) et que `accordCredenceReussite` sait lire.
    const jetons = o.jetons
    if (!Array.isArray(jetons) || jetons.length !== 4) continue
    if (!jetons.every((j) => typeof j === 'number' && Number.isFinite(j))) continue
    if (typeof o.index_correct !== 'number') continue
    vus.add(cas)
  }
  for (let cas = 1; cas <= nombreDeCas; cas += 1) if (!vus.has(cas)) return false
  return true
}

/**
 * ⭐ LA CLÔTURE EST-ELLE DUE, POUR CE DÉPÔT ?
 *
 * Trois conditions, et elles sont toutes nécessaires :
 *   · la forme du travail est **`choisir`** — c'est la marque des deux crans
 *     guidés, et la SEULE : on ne clôt jamais un exercice où l'élève rédige,
 *     sa remise est son geste ;
 *   · le dépôt n'est **pas déjà remis ou clos** — la clôture est idempotente,
 *     et un second passage ne doit pas réécrire une date ;
 *   · **toutes** les crédences sont là.
 *
 * ⚠️ `dejaRemis` couvre les deux : `v1_remis_at` non nul, OU un statut qui n'est
 *    plus `ouvert`. *Un dépôt `retire` ou `abandonne` ne se clôt pas non plus.*
 */
export function clotureDue(a: {
  forme: string
  dejaRemis: boolean
  credences: unknown
  nombreDeCas: number
}): boolean {
  if (a.forme !== 'choisir') return false
  if (a.dejaRemis) return false
  return credencesCompletes(a.credences, a.nombreDeCas)
}
