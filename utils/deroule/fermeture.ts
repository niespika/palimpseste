// ============================================================================
// C10 · L1 — LA SEMAINE COMPTÉE SE FERME : la règle, et elle est PURE.
// ----------------------------------------------------------------------------
// ⭐⭐ « FERMÉ » N'EST PAS UN STATUT, ET RIEN N'EST ÉCRIT NULLE PART. Un exercice
//    que le ROUTEUR a assigné sur le cycle `C` est fermé **si et seulement si la
//    ligne `assiduite_hebdo (eleve_id, C)` existe** — c'est exactement « l'as-
//    siduité de cette semaine a été jouée pour cet élève » (`07-` §1.5 ; `C4-L13`).
//    Aucune colonne, aucune migration, aucun cron, aucun statut tamponné : les
//    statuts gardent leur sens, et la collecte, le pilotage, les faits/imposés
//    de Scriptorium et les règles de stagnation continuent de les lire.
//
// ⛔⛔ LE PRÉDICAT PORTE SUR **L'EXISTENCE DE LA LIGNE**, JAMAIS SUR UNE DATE.
//    « La garde porte sur l'existence de la ligne, pas sur la date » (`07-` §1.5).
//    Le reformuler en « la date du cycle est passée » fermerait DEUX choses que
//    personne ne veut fermer :
//      · **la semaine EN COURS** — elle n'est jamais en base, le déclencheur ne
//        compte que la semaine ÉCOULÉE ;
//      · **les semaines de VACANCES** — elles n'ont jamais de ligne et n'en
//        auront jamais (« elles sortent du dénominateur PAR OMISSION »).
//    Les deux tombent du prédicat, sans une garde à écrire.
//
// ⭐ ET LA FERMETURE EST RÉTROACTIVE, DONC ELLE SE DÉRIVE À CHAQUE LECTURE.
//    « Une ligne manquante se rattrape, parce qu'une semaine jamais comptée n'a
//    jamais été montrée à personne » (`07-` §1.5) : un rattrapage tardif ferme
//    d'un coup les exercices d'une vieille semaine. ⛔ Jamais un cache, jamais
//    une valeur écrite, jamais un champ dénormalisé — et l'idempotence est
//    acquise par construction (le déclencheur passe DEUX fois le même lundi,
//    18:00 puis 18:20 UTC : une dérivation ne s'en aperçoit pas).
// ============================================================================

import { toISODate } from '../calendrier-grille'
import { lundiDuCycle } from './echeance'
import type { VueDuDeroule } from './vue'

/**
 * ⛔⛔ LE MESSAGE DE LOUIS, MOT POUR MOT (`07-` §2, chapitre `C10`). Il est
 *    UNIQUE — un seul refus pour les dix-huit gestes de travail — et il ne se
 *    récrit pas au site d'appel : deux formulations diraient à l'élève que deux
 *    choses différentes lui arrivent.
 */
export const MESSAGE_SEMAINE_FERMEE =
  'Il n’est plus possible de travailler sur les exercices de cette semaine. '
  + 'De nouveaux exercices t’attendent.'

/** Ce que la règle a besoin de savoir d'un dépôt — et rien de plus. */
export interface DepotAFermer {
  /**
   * ⛔⛔ `exercices_depots.assigne_at`, ET C'EST LE SEUL CHEMIN. Le rattachement
   *    d'un dépôt à sa semaine **se dérive d'`assigne_at`, et il n'a pas de
   *    colonne** (`07-` §1.1, ligne 157) : « une colonne de cycle sur le dépôt
   *    serait un SECOND DOMICILE de ce qu'`assigne_at` dit déjà, et deux
   *    domiciles finissent par diverger ».
   *
   * ⚠️ `routeur_decisions.cycle_lundi` donnerait aujourd'hui la même valeur —
   *    `C4-L12` pose `assigne_at` à MIDI UTC du lundi servi, à l'INSERT et
   *    jamais ensuite (mesuré en prod le 07/09 : `2026-08-31T12:00:00+00`).
   *    ⭐ **Mais c'est d'`assigne_at` que la COLLECTE dérive**
   *    (`utils/assiduite/collecte.ts`, `comptesDeLaSemaine`). Fermer sur un
   *    autre chemin que celui qui COMPTE, c'est risquer que la fermeture et le
   *    comptage désignent deux semaines différentes — exactement le mode de
   *    panne que ce lot existe pour supprimer. **On dérive comme elle dérive.**
   */
  assigneAt: string | null
  /**
   * ⭐ LE DISCRIMINANT DE « ASSIGNÉ PAR LE ROUTEUR », ET C'EST CELUI DE LA
   *    SOURCE : `exercices_depots.routeur_decision_id` — « un dépôt sans
   *    décision — toute la voie du professeur — vaut donc `false` » (`07-` §1.5).
   *
   * ⚠️ Le code en porte un second, `origine` (`not null`, `check in
   *    ('routeur','prof')`). Les deux CONCORDENT (mesuré le 07/09 : zéro
   *    divergence dans les deux bases), mais ils peuvent diverger **dans un
   *    seul sens** — la clé étrangère est `ON DELETE SET NULL`, donc une
   *    décision supprimée laisserait un dépôt `origine = 'routeur'` SANS
   *    décision. C'est la source qui tranche : on prend celui qu'elle nomme, et
   *    `couture-c10l1.mjs` compte les divergences à chaque passage.
   */
  routeurDecisionId: string | null
}

/** Les arguments de la règle — nommés, parce qu'ils se confondraient sinon. */
export interface QuestionDeFermeture extends DepotAFermer {
  /** Le fuseau de l'école, tel que `lireFuseau()` le rend. */
  fuseau: string
  /**
   * Les cycles pour lesquels l'assiduité de CET élève a été jouée — les
   * `cycle_lundi` de ses lignes `assiduite_hebdo`, en `YYYY-MM-DD`.
   *
   * ⚠️⚠️ `null` VEUT DIRE « JE N'AI PAS PU LIRE », ET CE N'EST PAS UN ENSEMBLE
   *    VIDE. Une lecture en ERREUR ne ferme rien : dans le doute l'exercice
   *    reste ouvert — fermer sur une panne priverait un élève d'un travail qui
   *    compte encore. ⛔⛔ **Mais un ensemble VIDE n'est pas une erreur** : c'est
   *    précisément ce que rend une lecture faite avec le mauvais client (la
   *    table n'a AUCUNE policy élève : lue depuis une session élève elle rend
   *    zéro ligne, SANS erreur). Le fail-open protège d'une panne ; il ne
   *    protège pas d'un mauvais client, et il transformerait ce défaut-là en
   *    « tout va bien ». **Les deux cas se distinguent ici, et s'éprouvent
   *    séparément.**
   */
  cyclesComptes: ReadonlySet<string> | null
}

/**
 * ⭐ LA RÈGLE. Trois refus avant le test, et chacun a son motif :
 *   1. `cyclesComptes === null` — la lecture a échoué : **on n'ose pas fermer** ;
 *   2. pas de décision de routeur — **la voie du professeur n'est jamais fermée
 *      par ce lot** (passations en classe, assignations à la main : c'est `C10-L2`) ;
 *   3. `assigne_at` absent ou illisible — sans lui il n'y a pas de semaine, et
 *      une semaine devinée serait pire qu'aucune.
 *
 * ⛔⛔ ET JAMAIS EN UTC. Ni `date_trunc('week', …)`, ni `getUTCDay()`, ni un
 *    `.slice(0, 10)` : « un dépôt du dimanche 20 h 30 à Toronto est le lundi
 *    00 h 30 UTC » — lu en UTC il bascule d'une semaine, **à l'heure exacte à
 *    laquelle les élèves déposent**. `lundiDuCycle(instant, fuseau)` est la
 *    composition déjà éprouvée, et c'est la MÊME que la collecte appelle.
 *
 * ⭐ Un BONUS se ferme comme un imposé, et par ce même test, sans branche : le
 *    pull écrit une décision (`bonus = true`) sur le cycle courant. Il ne compte
 *    ni au numérateur ni au dénominateur de l'assiduité, et `momentDeLaSemaine`
 *    l'exclut du calcul du moment — donc un bonus fermé ne retient pas le bilan,
 *    et ne l'ouvre pas non plus. Rien à faire de plus.
 */
export function estFermee(q: QuestionDeFermeture): boolean {
  if (q.cyclesComptes === null) return false
  if (!q.routeurDecisionId) return false
  if (!q.assigneAt) return false
  const instant = new Date(q.assigneAt)
  if (Number.isNaN(instant.getTime())) return false
  return q.cyclesComptes.has(toISODate(lundiDuCycle(instant, q.fuseau)))
}

// ════════════════════════════════════════════════════════════════════════════
// LA VUE RÉDUITE — une LISTE BLANCHE, et c'est le point
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔⛔ CE QUE L'ÉLÈVE NE DOIT PAS VOIR NE PART PAS DU SERVEUR. « La vue fermée se
 *    réduit là où elle se construit, pas à l'écran » (`07-` §2, `C10`) : un
 *    composant serveur sérialise dans la charge RSC **tout ce qu'il reçoit**, et
 *    un champ « seulement pas affiché » est un champ qui voyage.
 *
 * ⛔⛔ ET C'EST UNE LISTE BLANCHE, JAMAIS UNE LISTE NOIRE. `VueDuDeroule` porte
 *    **52 champs** (mesuré le 07/09 ; le prompt du lot en annonçait 50 — la
 *    dérive de deux champs en deux jours EST l'argument). Une liste noire serait
 *    fausse le jour où un lot ajoute le 53ᵉ, et **personne ne le verrait** : le
 *    champ partirait dans la charge, en silence. Ici, l'objet est construit
 *    CHAMP PAR CHAMP — un champ neuf ne compile pas tant que son auteur n'a pas
 *    dit s'il survit à la fermeture. *Le motif est écrit à la source :*
 *    « l'exercice peut être resservi » — à un autre élève, ou au même dans un
 *    autre cycle.
 *
 * ⭐ CE QUI RESTE, ET POURQUOI (mission, effet 2) : **la consigne**, **la
 *    réponse de l'élève** (sa v1, sa vf si elle existe, son brouillon s'il n'a
 *    rien remis) et **son retour** — la lecture reste possible, et reste due.
 *
 * ⛔⛔ `regime` RESTE, ET IL N'A L'AIR DE RIEN. `actionValiderLaLecture` charge
 *    la vue puis lit `vue.regime` pour décider si la lecture CLÔT le dépôt
 *    (`app/deroule/actions.ts:661`). Vidé, la lecture cesserait de clore : le
 *    dépôt resterait `retour_publie` pour toujours, la ligne `a_lire` pour
 *    toujours, **et le bilan ne s'ouvrirait jamais**. C'est le champ qui tient
 *    la seule porte de sortie de l'exercice fermé.
 *
 * ⛔ `ouvert` reste, et il ne porte PAS la fermeture : il porte l'interrupteur
 *    `exercices_actif` (« Faux, l'écran se ferme poliment »). Deux causes sous
 *    un drapeau, et le message de Louis s'afficherait quand le professeur éteint
 *    le module. La fermeture a son propre champ, `fermee`.
 *
 * ⚠️ À VIDER NOMMÉMENT, entre autres : `texteSupport`, `sujet`, `coTexte`,
 *    `cas` — **c'est là que vivent les distracteurs, sous le nom `candidats`**,
 *    et chercher « distracteurs » dans la vue ne rend rien —, `corrections`,
 *    `etalon`, `demonstration`, `contenuDemonstration`, `guide`, `rappel`,
 *    `langue`, `verdictCalibration`, `seJuger.offre`, `gestesRestants`,
 *    `competencesDeLaConfiance`. ⭐ Et sous le gabarit, `fiche` (le problème,
 *    les constituants) et les pièces servies du cran 2 : **la liste blanche les
 *    couvre par construction**, sans que personne ait à y penser.
 */
export function vueFermee(v: VueDuDeroule): VueDuDeroule {
  return {
    // ── CE QUI RESTE ────────────────────────────────────────────────────────
    depotId: v.depotId,
    ouvert: v.ouvert,
    fermee: true,
    titre: v.titre,
    consigne: v.consigne,
    texteV1: v.texteV1,
    texteVf: v.texteVf,
    retourChaud: v.retourChaud,
    retourFinal: v.retourFinal,
    contestations: v.contestations,
    regime: v.regime,
    echeance: v.echeance,
    v1RemiseLe: v.v1RemiseLe,

    // ── TOUT LE RESTE, VIDÉ ─────────────────────────────────────────────────
    telemetrie: {},
    credenceEstLaReponse: false,
    vfRequiseParEscalade: false,
    temps: [],
    tempsCourant: 'retour',
    grain: 'micro',
    cranCode: null,
    geste: null,
    verdictParCas: [], precisionParCas: [], passageParCas: [],
    aucuneRemise: false,
    estUnePaire: false,
    etapePaire: null,
    rappel: { observables: [], motif: null, formulationsManquantes: [] },
    demonstration: { demonstration: null, avertissement: null, ecartees: [] },
    demonstrationAvantLaTentative: false,
    contenuDemonstration: null,
    guide: null,
    etalon: null,
    texteSupport: null,
    sujet: null,
    coTexte: null,
    cas: [],
    corrections: [],
    dureeIndicativeMin: null,
    microQuestionDue: false,
    motifDepassement: null,
    collages: [],
    competencesDeLaConfiance: [],
    gestesRestants: [],
    confianceDeclaree: null,
    conditionsDeclarees: null,
    restitutionAChaud: null,
    seJuger: { servie: false, motif: null, offre: null },
    attente: { jobs: [], enCours: false, echecDefinitif: false, message: null },
    langue: { phrase: null, n: null, ancrages: [] },
    verdictCalibration: { lignes: [], phrase: null },
    echeanceVf: { quand: null, rognee: false, motif: null },
    signalement: { ouvert: false, mien: null },
    gabarit: { actif: false, exercice15: false, variante: null, sansDocuments: false },
    fiche: null,
    fin: null,
    avertissements: [],
  }
}
