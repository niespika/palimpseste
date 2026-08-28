// ============================================================================
// C6 · L1 — LE CANAL D'ATTENTION : un drapeau, quelle que soit sa nature.
// Module PUR — aucun `server-only`, aucun accès base, aucune I/O, et AUCUNE
// horloge implicite : le temps se PASSE en argument, jamais `Date.now()`.
// ----------------------------------------------------------------------------
// « **C'est la page où le professeur voit ce qui demande son attention**, et
//   elle porte donc **quatre drapeaux** » (`07-` §2, C6-L1).
//
// ⭐⭐ CE MODULE NE LÈVE AUCUN DRAPEAU. Il ne fait que deux choses : il donne
//    aux quatre UNE FORME COMMUNE, et il les ORDONNE. Chaque drapeau est levé
//    par celui qui sait le lever — `jugerLaLettre` pour la cadence d'ancre,
//    `dossierN3` pour la file, `contestation.ts` pour les actes, le faisceau
//    pour l'intégrité — et arrive ici DÉJÀ ÉCRIT.
//
// ⭐ POURQUOI UNE FORME COMMUNE. Les sources en nomment AU MOINS TROIS DE PLUS
//    que les quatre de ce lot — « trois `pas_pu` d'affilée » et l'incohérence de
//    la restitution à chaud (`06-` §3), la discordance de deux paliers entre la
//    trajectoire et l'ancre (`01-` §9). **Ce lot en pose quatre**, mais un canal
//    qui ne saurait porter que ceux-là devrait être rouvert au premier suivant.
//    Ici, un drapeau de plus est une `nature` de plus dans l'énuméré et une
//    phrase écrite par celui qui la lève : **aucun code d'affichage neuf**.
//
// ⛔ AUCUN SCORE, AUCUNE « CONFIANCE » AGRÉGÉE, AUCUNE NOTE. « Rien ne la
//    définit aujourd'hui, et un chiffre qui ne mesure rien attire pourtant des
//    décisions » (`06-` §5). Un drapeau porte une PHRASE et un DÉTAIL ; il ne
//    porte jamais un nombre de 0 à 100 qui les résumerait.
//
// ⛔ ET AUCUN PLAFOND D'AFFICHAGE. « Ni plafond ni file d'attente » (`01-` §8.4)
//    est une contrainte d'ÉCRAN : pas de « 5 premiers », pas de pagination qui
//    cache le reste. `ordonnerLesDrapeaux` trie, il ne coupe pas.
// ============================================================================

/**
 * Les quatre natures de ce lot. ⚠️ **L'énuméré est ouvert par construction** :
 * un lot de correctifs y ajoute une valeur et une phrase, et rien d'autre.
 */
export const NATURES_DRAPEAU = [
  'dossier_n3',
  'faisceau_integrite',
  'contestations_repetees',
  'fraicheur_ancre',
] as const
export type NatureDrapeau = (typeof NATURES_DRAPEAU)[number]

/** Le mot du drapeau, à l'écran. Le seul endroit où il s'écrit. */
export const LIBELLE_NATURE: Record<NatureDrapeau, string> = {
  dossier_n3: 'Dossier N3',
  faisceau_integrite: 'Faisceau d’intégrité',
  contestations_repetees: 'Contestations répétées',
  fraicheur_ancre: 'Fraîcheur d’ancre',
}

/** Le geste que le professeur peut faire sur un drapeau — quand il y en a un. */
export interface GesteDrapeau {
  /** L'action serveur qui l'exécute. */
  action: 'traiter_n3' | 'traiter_contestation' | 'confirmer_faisceau'
  /** Ce qu'elle vise, sous la forme que l'action sait lire. */
  ref: string
  /** Le mot du bouton. */
  mot: string
}

export interface Drapeau {
  nature: NatureDrapeau
  eleveId: string
  eleveNom: string
  /**
   * Ce qui distingue deux drapeaux de MÊME NATURE pour le MÊME élève — et il y
   * en a : « un élève peut porter plusieurs dossiers N3 à la fois, sur la même
   * compétence », la clé de l'escalade étant (élève × compétence × OBSERVABLE)
   * (`07-` §1.3). Ta file compte des DOSSIERS, pas des élèves.
   */
  cle: string
  /** La phrase affichée. Écrite par celui qui lève, jamais par l'écran. */
  phrase: string
  /** Ce que le drapeau porte en plus — le dossier, les actes, les signaux. */
  detail: string[]
  /** L'instant qui date le drapeau (ISO), pour l'ordre. `null` = sans date. */
  at: string | null
  /**
   * `01-` §8.4 — « passé 3 semaines sans traitement, il REMONTE EN TÊTE ».
   * ⛔ Remonter en tête n'est pas compter : le re-signalement ne s'accumule pas.
   */
  enTete: boolean
  geste: GesteDrapeau | null
}

/**
 * L'ORDRE DE LA PAGE. Trois clés, dans cet ordre :
 *   1. le RE-SIGNALEMENT d'abord — c'est la lettre du `01-` §8.4 ;
 *   2. puis la nature, dans l'ordre de `NATURES_DRAPEAU` — le dossier N3 est le
 *      transfert de charge, il passe avant le reste ;
 *   3. puis l'ancienneté : le plus ancien d'abord, parce que c'est celui qui
 *      attend depuis le plus longtemps. Un drapeau SANS DATE ferme la marche —
 *      il ne se range pas devant un fait daté.
 *
 * ⛔ Le tri ne borne rien : la liste rendue a exactement la longueur reçue.
 */
export function ordonnerLesDrapeaux(drapeaux: readonly Drapeau[]): Drapeau[] {
  const rang = new Map<NatureDrapeau, number>(NATURES_DRAPEAU.map((n, i) => [n, i]))
  return [...drapeaux].sort((a, b) => {
    if (a.enTete !== b.enTete) return a.enTete ? -1 : 1
    const ra = rang.get(a.nature) ?? 99
    const rb = rang.get(b.nature) ?? 99
    if (ra !== rb) return ra - rb
    if (a.at === b.at) return a.cle.localeCompare(b.cle, 'fr')
    if (a.at === null) return 1
    if (b.at === null) return -1
    return a.at < b.at ? -1 : 1
  })
}

/** Le décompte par nature — un décompte RÉEL, jamais un score (`06-` §5). */
export function compterParNature(
  drapeaux: readonly Drapeau[],
): Record<NatureDrapeau, number> {
  const out = Object.fromEntries(NATURES_DRAPEAU.map((n) => [n, 0])) as Record<NatureDrapeau, number>
  for (const d of drapeaux) if (d.nature in out) out[d.nature] += 1
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// LES CYCLES — et pourquoi ce n'est jamais une division par sept
// ════════════════════════════════════════════════════════════════════════════

/**
 * Une semaine d'ENSEIGNEMENT du Calendrier, telle que `calculerGrilleSemaines`
 * la rend une fois les vacances retirées. C'est ELLE le cycle (`01-` §1).
 */
export interface CycleDuCalendrier {
  /** Le lundi, en date pure `AAAA-MM-JJ` — jamais un instant (`utils/fuseau`). */
  dateDebutLundi: string
}

/**
 * COMBIEN DE CYCLES SÉPARENT DEUX JOURS.
 *
 * ⚠️⚠️ **UN COMPTE DE SEMAINES N'EST PAS UN COMPTE DE JOURS DIVISÉ PAR SEPT.**
 *    « Les semaines de vacances sortent du dénominateur PAR OMISSION »
 *    (`06-` §5 ; `07-` §1.5) : elles ne sont pas dans cette liste, donc elles ne
 *    se comptent pas. Une année où les vacances de Noël durent deux semaines
 *    ferait, à la division, deux cycles de plus qu'il n'y en a eu.
 *
 * `null` quand le calendrier ne permet pas de répondre — aucune semaine
 * d'enseignement, ou un jour antérieur à la première. ⛔ **`null` n'est pas
 * zéro** : l'écran doit dire qu'il ne sait pas, jamais afficher « 0 cycle ».
 *
 * Les deux jours sont des DATES PURES (`AAAA-MM-JJ`) : un instant se ramène à
 * son jour DANS LE FUSEAU DE L'ÉCOLE avant d'entrer ici.
 */
export function cyclesEcoules(
  cycles: readonly CycleDuCalendrier[], depuis: string, jusqua: string,
): number | null {
  if (cycles.length === 0) return null
  const tries = [...cycles].sort((a, b) => a.dateDebutLundi.localeCompare(b.dateDebutLundi))
  // Le cycle d'un jour : le dernier dont le lundi est ≤ ce jour. Un jour qui
  // tombe en vacances est donc rattaché au dernier cycle d'enseignement AVANT
  // lui — ce qui est exactement ce que « les vacances n'en sont pas » veut dire.
  const indice = (jour: string): number | null => {
    let trouve: number | null = null
    for (let i = 0; i < tries.length; i += 1) {
      if (tries[i].dateDebutLundi <= jour) trouve = i
      else break
    }
    return trouve
  }
  const a = indice(depuis)
  const b = indice(jusqua)
  if (a === null || b === null) return null
  return Math.max(0, b - a)
}

// ════════════════════════════════════════════════════════════════════════════
// LES CONTESTATIONS — le compte, et la file
// ════════════════════════════════════════════════════════════════════════════

/**
 * Un acte de contestation, tel que `exercices_metacognition.contestation_points`
 * le porte (`utils/deroule/types.ts:ActeContestation`), plus la marque de
 * traitement que ce lot y ajoute.
 *
 * ⚠️ **C'EST UNE LISTE D'ACTES, ET LE COMPTE PORTE SUR DES ACTES DISTINCTS.**
 *    « Un même point recontesté REMPLACE son acte : c'est une correction de
 *    saisie, pas une seconde contestation » (`07-` §1.2) — `contestation.ts`
 *    filtre déjà sur `point_id`. Compter des écritures gonflerait le signal
 *    sans qu'il se soit rien passé de neuf.
 */
export interface ActeLu {
  depotId: string
  eleveId: string
  pointId: string
  texte: string
  at: string
  citationAbsente: boolean
  /** Ce lot : l'instant où le professeur a regardé cet acte. `null` = en file. */
  traiteAt: string | null
}

/**
 * LE SEUIL DE RÉPÉTITION — **il n'est pas arrêté, et ce lot ne l'arrête pas.**
 *
 * « Le seuil de répétition se règle ; il n'est pas arrêté. Il se lira sur la
 *   DISTRIBUTION OBSERVÉE : combien d'élèves contestent, à quelle fréquence, et
 *   sur quoi — **un seuil posé d'avance deviendrait la cible que le dispositif
 *   apprend à viser** (`00-` §5). D'ici là, le drapeau **se règle en
 *   configuration**, et **son absence de valeur ne bloque pas l'écran**. »
 *                                                        — `07-` §2, C6-L1
 *
 * D'où la forme : un `number | null` lu de `scriptorium_params`, sur le patron
 * de `exercices_retour_longueur` — « NULL vaut la valeur par défaut », et **un
 * paramètre n'est pas un interrupteur** (`07-` §5). ⛔ Et NULL ne vaut PAS ici
 * « une valeur par défaut cachée » : il vaut **aucun drapeau de répétition**,
 * l'écran continuant de montrer la distribution qui servira à le régler.
 */
export interface ReglageContestations {
  /** `scriptorium_params.contestations_repetees_seuil`. `null` ⇒ pas de drapeau. */
  seuil: number | null
}

export interface DistributionContestations {
  /** Combien d'élèves de la classe ont contesté au moins une fois. */
  eleves: number
  /** Combien d'ACTES DISTINCTS, tous élèves confondus. */
  actes: number
  /** Combien de ces actes portent sur une citation absente. */
  citationsAbsentes: number
  /** Le compte d'actes par élève, du plus haut au plus bas — « à quelle fréquence ». */
  parEleve: Array<{ eleveId: string; actes: number }>
  /** Le compte d'actes par point de retour, du plus haut au plus bas — « sur quoi ». */
  parPoint: Array<{ pointId: string; actes: number }>
}

/**
 * LA DISTRIBUTION OBSERVÉE — c'est elle que l'entrée demande de montrer, et
 * c'est sur elle que le seuil se lira un jour. **Elle s'affiche même quand
 * aucun seuil n'est réglé** : sans elle, personne ne pourra régler ce qu'il ne
 * voit pas.
 */
export function distributionDesContestations(
  actes: readonly ActeLu[],
): DistributionContestations {
  const parEleve = new Map<string, number>()
  const parPoint = new Map<string, number>()
  let citationsAbsentes = 0
  for (const a of actes) {
    parEleve.set(a.eleveId, (parEleve.get(a.eleveId) ?? 0) + 1)
    parPoint.set(a.pointId, (parPoint.get(a.pointId) ?? 0) + 1)
    if (a.citationAbsente) citationsAbsentes += 1
  }
  const trier = <T extends { actes: number }>(l: T[], cle: (x: T) => string): T[] =>
    l.sort((x, y) => (y.actes - x.actes) || cle(x).localeCompare(cle(y), 'fr'))
  return {
    eleves: parEleve.size,
    actes: actes.length,
    citationsAbsentes,
    parEleve: trier([...parEleve].map(([eleveId, n]) => ({ eleveId, actes: n })), (x) => x.eleveId),
    parPoint: trier([...parPoint].map(([pointId, n]) => ({ pointId, actes: n })), (x) => x.pointId),
  }
}

/**
 * QUI DÉPASSE LE SEUIL. `null` en entrée ⇒ liste vide, et **l'écran ne se
 * bloque pas** : la file d'examen humain, elle, ne dépend d'aucun seuil.
 *
 * ⚠️ Le compte est celui des actes NON TRAITÉS : un professeur qui a regardé
 *    trois contestations ne doit pas être rappelé à l'ordre pour les mêmes.
 */
export function elevesQuiRepetent(
  actes: readonly ActeLu[], reglage: ReglageContestations,
): Array<{ eleveId: string; actes: ActeLu[] }> {
  if (reglage.seuil === null || reglage.seuil <= 0) return []
  const parEleve = new Map<string, ActeLu[]>()
  for (const a of actes) {
    if (a.traiteAt) continue
    const lot = parEleve.get(a.eleveId) ?? []
    lot.push(a)
    parEleve.set(a.eleveId, lot)
  }
  return [...parEleve]
    .filter(([, lot]) => lot.length >= reglage.seuil!)
    .map(([eleveId, lot]) => ({ eleveId, actes: lot }))
    .sort((a, b) => (b.actes.length - a.actes.length) || a.eleveId.localeCompare(b.eleveId))
}

/**
 * LA FILE D'EXAMEN HUMAIN — et **ce n'est pas le drapeau des répétitions.**
 *
 * « Toute contestation portant sur une CITATION ABSENTE part **directement** en
 *   file professeur — ce qui satisfait aussi l'exigence d'examen humain de la
 *   loi » (`06-` §2 et §7). ⛔ **Elle n'attend AUCUNE répétition**, et elle
 *   n'est pas un confort : c'est la loi 25.
 */
export function fileDExamenHumain(actes: readonly ActeLu[]): ActeLu[] {
  return actes
    .filter((a) => a.citationAbsente && !a.traiteAt)
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : a.pointId.localeCompare(b.pointId)))
}
