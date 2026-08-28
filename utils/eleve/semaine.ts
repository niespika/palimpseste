// ============================================================================
// C6 · L2 — L'ÉCRAN DE LA SEMAINE. Les règles, pures.
// ----------------------------------------------------------------------------
// `02-exercices.md` §6.C décrit UNE SEULE SÉQUENCE, et c'est elle qui commande
// la forme de cet écran :
//   « AVANT DE COMMENCER, l'élève reçoit le récapitulatif de sa semaine. Deux
//     choses, et deux seulement : 1. les trois compétences que la semaine
//     travaille en priorité ; 2. ses forces dans ces compétences — ce qu'il
//     réussit déjà. LE RÉCAPITULATIF NE NOMME AUCUNE FAIBLESSE. Elles viennent
//     AU BILAN, À LA FIN […] IL PASSE ENSUITE SES EXERCICES. […] À LA FIN, un
//     bilan court — ce qu'il a réussi, ce qu'il a moins bien fait. ET SURTOUT
//     LES DEUX ÉCARTS QUI INSTRUISENT. »
//
// ⭐ Récapitulatif et bilan SONT LE MÊME ÉCRAN, en deux temps, et jamais
//    ensemble. Le bilan n'est pas une page de plus : c'est le second temps.
//
// ⛔⛔ POURQUOI LE RÉCAPITULATIF SE TAIT SUR LES FAIBLESSES, ET POURQUOI CELA NE
//    SE NÉGOCIE PAS : la phase « SE JUGER » (`06-` §3) demande à l'élève de dire
//    lui-même où il a échoué — c'est LA MATIÈRE DU MONITORING. Un récapitulatif
//    qui nomme la faiblesse FABRIQUE LA RÉPONSE et détruit la mesure en
//    silence : « un écran qui viole l'une de ces règles ne casse rien de
//    visible : il falsifie la donnée en silence » (`07-` §3).
//
// ⛔ PAS DE BUDGET-TEMPS HEBDOMADAIRE (`06-` §2, en toutes lettres). Les trois
//    colonnes de minutes d'`assiduite_hebdo` sont AU PROFESSEUR. Une durée PAR
//    EXERCICE est permise, une minute hebdomadaire ne l'est pas.
//
// ⛔ LA FRISE D'ICI N'EST PAS CELLE DU `06-` §5. Celle-là est la frise à trois
//    couleurs DU PROFESSEUR — la part des élèves d'une classe dans chaque bande.
//    Celle-ci est « une frise du NOMBRE D'EXERCICES avec une barre de progrès »,
//    pour UN élève, sur SA semaine. ⛔ Aucun pourcentage de complétion.
//
// ⚠️ CE FICHIER EST PUR (voir l'en-tête de `profil.ts`). Le lecteur vit à
//    `semaine-serveur.ts`.
// ============================================================================

import { phraseDuRefus, type MotifDuRefus } from '../routeur/bonus'
import type { Atelier, TonEtat } from '../codex-onglets/regles'
import type { EtatObservable } from '../routeur/observables'
import type { DimensionDite } from './profil'

/**
 * Un exercice de la semaine, tel que l'écran le montre.
 *
 * ⚠️ `competences` vient d'`exercices.modes_par_competence` (`07-` §1.1) — les
 *    compétences que l'instance PEUT porter. C'est la vérité de ce qui a été
 *    POSÉ ; on ne rejoue pas `listeDePriorite()`, qui inventerait une semaine
 *    que le moteur n'a pas composée (piège 43).
 */
export interface ExerciceDeLaSemaine {
  depotId: string
  titre: string
  echeance: string | null
  assigneAt: string
  atelier: Atelier
  href: string
  ton: TonEtat
  libelle: string
  competences: string[]
  /**
   * ⭐⭐ C6 · L3 — CE QUE L'ÉLÈVE A **DEMANDÉ**, jamais ce qu'on lui a imposé. Il
   *    se lit au JOURNAL (`routeur_decisions.bonus`), jamais sur l'instance :
   *    « entre élèves, une instance se ressert », et le fait est par
   *    (élève × exercice).
   */
  bonus: boolean
}

// ⛔ AUCUNE DURÉE PAR EXERCICE SUR CET ÉCRAN, ET C'EST UN CHOIX MOTIVÉ.
//    Le `06-` §2 l'autorise — « sur chaque exercice, une durée indicative » —,
//    mais il la place SUR L'EXERCICE, où le déroulé la sert déjà (temps 2,
//    `dureeDeLInstance`). Ici, le `02-` §6.C est plus étroit que lui : « deux
//    choses, ET DEUX SEULEMENT ». ⚠️ Et l'y amener coûterait soit une copie
//    privée de `dureeDeLInstance` (qui n'est pas exportée), soit une lecture
//    directe d'une table de doctrine — les deux que les conventions écartent.

// ════════════════════════════════════════════════════════════════════════════
// « À LA FIN » — la définition, et elle est à moi
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ « À LA FIN » N'EST DÉFINI PAR AUCUNE SOURCE. Deux lectures tenaient : le
 *    cycle est passé, ou il ne reste rien à faire. **CELLE-CI EST RETENUE :**
 *
 *    ⭐ « À la fin » = PLUS AUCUN DÉPÔT DU CYCLE N'ATTEND UN GESTE DE L'ÉLÈVE.
 *
 *    Trois raisons. *(1)* Elle ne demande AUCUNE règle neuve : le geste attendu
 *    est déjà nommé par `etatDeLExercice`, dont les tons `a_lire`, `a_faire` et
 *    `en_cours` sont exactement « il reste quelque chose à faire », quand
 *    `attente` et `clos` sont « rien de ton côté ». *(2)* Elle couvre le cycle
 *    passé sans le dire deux fois : une semaine écoulée dont tout est rendu,
 *    abandonné ou clos n'attend plus rien. *(3)* Elle est JUSTE POUR L'ÉLÈVE qui
 *    finit le mercredi : son bilan ne l'attend pas jusqu'au dimanche.
 *
 * ⛔ ET LES DEUX TEMPS NE S'AFFICHENT JAMAIS ENSEMBLE — c'est ce que ce type
 *    rend impossible : un seul moment, jamais deux.
 *
 * ⚠️ `vide` N'EST PAS `bilan`. « Une semaine sans aucun exercice assigné est
 *    FAITE par construction » (`utils/routeur/assiduite.ts`), mais à l'écran de
 *    l'élève « faite » et « vide » ne se disent pas pareil : **une barre de
 *    progrès à 100 % sur zéro exercice est un mensonge poli.** Il y a DEUX VIDES
 *    à distinguer (`07-` §5), et le troisième — la porte fermée — se lit avant
 *    d'arriver ici.
 */
export type MomentDeLaSemaine = 'vide' | 'recapitulatif' | 'bilan'

/** Les tons qui appellent encore un geste de l'élève. */
const APPELLE_UN_GESTE: readonly TonEtat[] = ['a_lire', 'a_faire', 'en_cours']

/**
 * ⚠️⚠️ C6 · L3 — LE MOMENT SE LIT SUR LA SEMAINE **IMPOSÉE**, ET LE BONUS EN EST
 *    EXCLU. La séquence du `02-` §6.C est celle de LA SEMAINE : « avant de
 *    commencer, le récapitulatif […] il passe ensuite ses exercices […] à la
 *    fin, un bilan court. PUIS on lui offre d'en faire plus ». L'offre vient
 *    APRÈS le bilan — donc un exercice pris SUR l'offre ne peut pas, en
 *    revenant, faire retomber l'écran au récapitulatif et retirer à l'élève le
 *    bilan qu'il venait de lire.
 *
 * ⭐ Ce que le bonus fait à la place : il SUSPEND l'offre tant qu'il n'est pas
 *    fait (`offreDEnFairePlus`, motif `un_a_la_fois`). « Un exercice à la fois »
 *    devient alors structurel — on ne peut pas en demander un second avant
 *    d'avoir fait le premier — au lieu d'être un contrôle de plus quelque part.
 *
 * ⛔ Et le BILAN, lui, compte le bonus comme n'importe quel exercice : il se
 *    calcule sur les MESURES du cycle, pas sur cette liste — « le bonus est un
 *    exercice normal, MESURES COMPRISES » (`01-` §5).
 */
export function momentDeLaSemaine(
  exercices: readonly ExerciceDeLaSemaine[],
): MomentDeLaSemaine {
  const imposes = exercices.filter((e) => !e.bonus)
  if (imposes.length === 0) return 'vide'
  return imposes.some((e) => APPELLE_UN_GESTE.includes(e.ton)) ? 'recapitulatif' : 'bilan'
}

// ════════════════════════════════════════════════════════════════════════════
// LA FRISE — « le nombre d'exercices », et rien qui ressemble à un taux
// ════════════════════════════════════════════════════════════════════════════

export interface Frise {
  /** Une case par exercice IMPOSÉ, dans l'ordre de la liste. `true` = le geste est fait. */
  cases: boolean[]
  /** Un décompte réel (`06-` §5). */
  faits: number
  /** Un décompte réel. */
  total: number
  /**
   * ⭐⭐ C6 · L3 — CE QUE L'ÉLÈVE A DEMANDÉ EN PLUS, COMPTÉ À PART. La frise
   *    comptait TOUS les dépôts maison du cycle, `bonus` compris — elle était
   *    juste tant qu'aucun dépôt ne l'était, et le jour où le pull en pose,
   *    **« 3 sur 5 » mélangerait l'assigné et le demandé : l'élève lirait comme
   *    un retard ce qu'il a choisi en plus.** *Déposé nommément par `C6-L2`.*
   *
   * ⛔ Il ne rejoint JAMAIS `faits`/`total` : « faits sur total » dit la semaine
   *    qu'on lui a donnée, et ajouter au numérateur ce qui n'est pas au
   *    dénominateur — ou l'inverse — dirait faux dans les deux sens.
   */
  enPlus: { faits: number; total: number }
}

/**
 * ⛔ AUCUN POURCENTAGE NE SORT D'ICI, ET C'EST VOLONTAIRE. Les deux seuls
 *    nombres que le `06-` §5 autorise à l'élève sont `n` (« travaillé N fois »)
 *    et le nombre d'exercices de la semaine. « Un écran n'affiche un nombre que
 *    si ce nombre compte quelque chose » : `faits` et `total` comptent des
 *    exercices ; un pourcentage ne compte rien.
 *
 * ⛔ ET AUCUNE BANDE. `assiduite_seuil_semaine_faite` (0,75) et
 *    `assiduite_borne_basse_frise` (0,50) sont les seuils de LA FRISE DU
 *    PROFESSEUR (`06-` §5) — vert / orange / rouge sur une CLASSE. Les servir
 *    ici ferait de l'écran de l'élève un tableau de bord de conformité.
 */
export function friseDeLaSemaine(exercices: readonly ExerciceDeLaSemaine[]): Frise {
  const fait = (e: ExerciceDeLaSemaine) => !APPELLE_UN_GESTE.includes(e.ton)
  const cases = exercices.filter((e) => !e.bonus).map(fait)
  const enPlus = exercices.filter((e) => e.bonus).map(fait)
  return {
    cases,
    faits: cases.filter(Boolean).length,
    total: cases.length,
    enPlus: { faits: enPlus.filter(Boolean).length, total: enPlus.length },
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LE RÉCAPITULATIF — « deux choses, et deux seulement »
// ════════════════════════════════════════════════════════════════════════════

export interface CompetencePrioritaire {
  competence: string
  /**
   * Combien d'exercices IMPOSÉS de la semaine peuvent la porter. Un décompte réel.
   *
   * ⛔⛔ C6 · L3 — IL NE COMPTE PLUS LE BONUS, ET C'EST UN DÉFAUT TROUVÉ À L'ŒIL.
   *    Le récapitulatif annonçait « Argumentation · 3 exercices » pendant que la
   *    frise, deux blocs plus haut, disait « 1 exercice fait SUR 2 ». **Deux
   *    nombres, sur le même écran, comptant le même ensemble et ne tombant pas
   *    d'accord** — et rien ne disait lequel comptait quoi. Le récapitulatif est
   *    le PREMIER temps, celui de la semaine qu'on lui donne ; le demandé est le
   *    TROISIÈME. *Aucun test ne le voyait : les deux fonctions étaient justes
   *    séparément.*
   */
  nbExercices: number
  /**
   * ⭐ Et ce que le bonus y ajoute, compté à part — pour que l'appelant puisse
   *   décider sans recompter. ⛔ Il ne se montre pas au récapitulatif : « en
   *   faire plus » a son propre temps, et son propre décompte à la frise.
   */
  nbEnPlus: number
}

/**
 * `02-` §6.C, point 1 — « LES TROIS COMPÉTENCES QUE LA SEMAINE TRAVAILLE EN
 * PRIORITÉ », lues SUR LES EXERCICES POSÉS.
 *
 * ⛔ ON NE REJOUE PAS `listeDePriorite()` (`utils/routeur/ciblage.ts`). Elle est
 *    pure, mais elle demande le segment, le parcours, l'historique, K et un
 *    tirage aléatoire : c'est le travail du MOTEUR, et le rejouer à la lecture
 *    inventerait une semaine qui n'a pas été posée. La vérité de la semaine est
 *    dans `exercices_depots`.
 *
 * ⛔⛔ ET CET ÉCRAN NE BORNE RIEN À TROIS. Le « plafond dur de cibles par grain »
 *    (`01-` §5 — 1 au micro, 2 au méso, 3 au macro) borne ce qu'UN EXERCICE
 *    mesure, pas ce qu'une semaine travaille. **Si la semaine en travaille
 *    quatre, l'écran en dit quatre** : un écran qui tronque à trois ment sur la
 *    semaine. L'appelant relève l'écart, il ne le cache pas.
 */
export function competencesDeLaSemaine(
  exercices: readonly ExerciceDeLaSemaine[],
): CompetencePrioritaire[] {
  const compte = new Map<string, { nbExercices: number; nbEnPlus: number }>()
  for (const e of exercices) {
    for (const c of new Set(e.competences)) {
      const v = compte.get(c) ?? { nbExercices: 0, nbEnPlus: 0 }
      if (e.bonus) v.nbEnPlus += 1
      else v.nbExercices += 1
      compte.set(c, v)
    }
  }
  return [...compte.entries()]
    .map(([competence, v]) => ({ competence, ...v }))
    // ⚠️ LE TRI PORTE SUR LE TOTAL, pas sur le seul imposé : « les trois
    //    compétences que la semaine travaille en priorité » se lisent sur tout ce
    //    qui a été servi. ⭐ Et une compétence que SEUL un bonus porte reste dans
    //    la liste — c'est le BILAN qui en a besoin, « le bonus est un exercice
    //    normal, MESURES COMPRISES ». L'appelant écarte du RÉCAPITULATIF celles
    //    dont l'imposé est nul : « jamais 0, qui se lirait comme un score ».
    // À égalité, l'ordre alphabétique : un tri instable rendrait deux écrans
    // différents sur la même semaine.
    .sort((a, b) => (b.nbExercices + b.nbEnPlus) - (a.nbExercices + a.nbEnPlus)
      || a.competence.localeCompare(b.competence))
}

/** Ce que le premier temps rend, par compétence prioritaire. */
export interface BlocRecapitulatif {
  competence: string
  nbExercices: number
  /**
   * `02-` §6.C, point 2 — « SES FORCES DANS CES COMPÉTENCES : ce qu'il réussit
   * déjà ». Des NOMS de dimensions, jamais un taux.
   */
  forces: string[]
  /**
   * Arbitrage ② — « ce qu'il doit surveiller » = LES DIMENSIONS QUE LA SEMAINE
   * MESURE, en langue élève et SANS VERDICT. ⛔ Ce n'est pas une liste de
   * faiblesses : ce sont TOUTES les dimensions de la compétence.
   */
  dimensionsRegardees: string[]
}

// ════════════════════════════════════════════════════════════════════════════
// LE BILAN — « les deux écarts qui instruisent »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `02-` §6.C — « à la fin, un bilan court : CE QU'IL A RÉUSSI, CE QU'IL A MOINS
 * BIEN FAIT. ET SURTOUT LES DEUX ÉCARTS QUI INSTRUISENT : avoir bien réussi LÀ
 * OÙ IL ÉTAIT FAIBLE, et avoir moins bien réussi LÀ OÙ IL A DES FORCES. C'est là
 * que le bilan apprend quelque chose ; LE RESTE NE FAIT QUE CONFIRMER CE QU'IL
 * SAVAIT DÉJÀ. »
 *
 * ⭐ C'est ici, ET ICI SEULEMENT, qu'une faiblesse se dit à l'élève.
 * ⛔ RR4 NE BOUGE PAS POUR AUTANT : par `dimension_eleve`, jamais un code
 *    d'observable, jamais un taux, jamais un seuil.
 */
export interface Bilan {
  competence: string
  /** Ce qu'il a réussi cette semaine — et qui l'était déjà. Le « reste ». */
  confirme: string[]
  /** Ce qu'il a moins bien fait cette semaine — et qui l'était déjà. Le « reste ». */
  connu: string[]
  /** ⭐ ÉCART 1 — bien réussi LÀ OÙ IL ÉTAIT FAIBLE. */
  bonneSurprise: string[]
  /** ⭐ ÉCART 2 — moins bien réussi LÀ OÙ IL A DES FORCES. */
  angleMort: string[]
  /** Les codes élus sans `dimension_eleve` — trace serveur, jamais l'écran. */
  formulationsManquantes: string[]
}

/**
 * ⭐ « LES DEUX ÉCARTS QUI INSTRUISENT » DEMANDENT UN AVANT ET UN APRÈS —
 *    exactement la mécanique de « en progrès ». Deux appels à
 *    `etatDesObservables` : l'un sur la fenêtre d'évidence D'AVANT CE CYCLE,
 *    l'autre sur LES MESURES DU CYCLE.
 *
 * ⛔ ON NE RÉÉCRIT PAS `estAcquis`, et on ne confond pas « réussi » — UNE
 *    mesure — avec « acquis » — LA FENÊTRE. Ici, `apres` porte les mesures DE
 *    LA SEMAINE : « acquis » y signifie donc « bien réussi CETTE SEMAINE », ce
 *    qui est précisément ce que le §6.C demande. Le mot « faible », lui, se lit
 *    sur la fenêtre d'évidence d'avant — la seule qui ait un sens dans la durée.
 *
 * ⚠️ UN OBSERVABLE SANS TAUX NE SE CLASSE PAS (`01-` §8.2) — ni d'un côté ni de
 *    l'autre. La semaine qui ne l'a pas mesuré ne dit rien de lui, et un
 *    silence n'est pas une baisse.
 */
export function bilanDeLaCompetence(
  competence: string,
  avant: readonly EtatObservable[],
  cetteSemaine: readonly EtatObservable[],
  dimensions: readonly DimensionDite[],
): Bilan {
  const parCode = new Map(dimensions.map((d) => [d.observableCode, d]))
  const etaitAcquis = new Map(avant.map((e) => [e.code, e.sansTaux ? null : e.acquis]))

  const confirme: Array<{ nom: string; ordre: number }> = []
  const connu: Array<{ nom: string; ordre: number }> = []
  const bonneSurprise: Array<{ nom: string; ordre: number }> = []
  const angleMort: Array<{ nom: string; ordre: number }> = []
  const formulationsManquantes: string[] = []

  for (const e of cetteSemaine) {
    // La semaine ne l'a pas mesuré : elle n'en dit rien.
    if (e.sansTaux) continue
    const d = parCode.get(e.code)
    // ⛔ « Un observable sans `dimension_eleve` ne se montre pas à l'élève : il
    //    n'a pas de nom pour lui. » Jamais son `code`, qui est la grille.
    if (!d || !d.dimensionEleve.trim()) { formulationsManquantes.push(e.code); continue }
    const item = { nom: d.dimensionEleve.trim(), ordre: d.ordre }
    const avantAcquis = etaitAcquis.get(e.code)

    if (avantAcquis === null || avantAcquis === undefined) {
      // Rien d'établi avant : c'est une réussite ou un manque, pas un ÉCART.
      ;(e.acquis ? confirme : connu).push(item)
      continue
    }
    if (e.acquis && !avantAcquis) bonneSurprise.push(item)
    else if (!e.acquis && avantAcquis) angleMort.push(item)
    else if (e.acquis) confirme.push(item)
    else connu.push(item)
  }

  const trier = (xs: Array<{ nom: string; ordre: number }>) =>
    xs.sort((a, b) => a.ordre - b.ordre).map((x) => x.nom)

  return {
    competence,
    confirme: trier(confirme),
    connu: trier(connu),
    bonneSurprise: trier(bonneSurprise),
    angleMort: trier(angleMort),
    formulationsManquantes,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CE QUE LE BILAN NE SAIT PAS ENCORE — et le silence serait un mensonge
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔⛔ UNE COPIE NON MESURÉE N'A NI RÉUSSITE NI ÉCART, ET LE SILENCE EST UN
 *    MENSONGE. Le retour peut être ENCORE EN FILE quand la semaine se ferme :
 *    « le bilan ne dit "tu as réussi" que sur des mesures écrites, et IL DIT CE
 *    QUI MANQUE QUAND IL EN MANQUE ».
 *
 * ⭐ C'est la leçon que `C5-L4` a payée : « une mesure qui n'a pas eu lieu ne se
 *    voit pas » — un écran qui rendait « Traitement terminé. » taisait la moitié
 *    des compétences écartées.
 */
export interface CeQuiManqueAuBilan {
  /** Les dépôts rendus dont AUCUNE mesure n'est encore écrite. */
  copiesNonMesurees: number
  /** Vrai dès qu'il en reste une : l'écran doit le DIRE. */
  incomplet: boolean
}

/** Les statuts qui disent « l'élève a rendu » (`utils/routeur/assiduite.ts`). */
export function ceQuiManqueAuBilan(
  exercices: readonly ExerciceDeLaSemaine[], depotsMesures: ReadonlySet<string>,
): CeQuiManqueAuBilan {
  const rendus = exercices.filter((e) => !APPELLE_UN_GESTE.includes(e.ton))
  const nonMesurees = rendus.filter((e) => !depotsMesures.has(e.depotId)).length
  return { copiesNonMesurees: nonMesurees, incomplet: nonMesurees > 0 }
}

// ════════════════════════════════════════════════════════════════════════════
// LE TROISIÈME TEMPS — « PUIS on lui offre d'en faire plus s'il le veut »
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ C6 · L3 — L'OFFRE, ET ELLE EST LE TROISIÈME TEMPS D'UN ÉCRAN QUI EXISTE.
 *
 * `02-` §6.C décrit UNE SEULE SÉQUENCE, et elle se termine sur cette phrase :
 * « Avant de commencer, l'élève reçoit le récapitulatif […] IL PASSE ENSUITE SES
 *   EXERCICES […] À LA FIN, un bilan court […] **PUIS ON LUI OFFRE D'EN FAIRE
 *   PLUS S'IL LE VEUT.** C'est le budget optionnel du routeur : un pull, UN
 *   EXERCICE DEMANDÉ À LA FOIS, jamais imposé, et jamais reporté d'une semaine
 *   sur l'autre. »
 *
 * ⚠️⚠️ CE QUE LA SOURCE NE TRANCHE PAS, ET CE QUI EST RETENU ICI. Elle place
 *    l'offre APRÈS le bilan dans sa séquence ; elle ne dit pas si un élève qui a
 *    fini mardi doit attendre le dimanche. **L'OFFRE PARAÎT AU MOMENT `bilan`,
 *    ET SEULEMENT LÀ** — et cela répond déjà à l'élève de mardi, parce que
 *    `momentDeLaSemaine` rend `bilan` dès que **plus rien n'attend un geste**,
 *    pas quand la semaine est écoulée. Trois raisons de ne pas l'ouvrir plus tôt :
 *
 *    *(1)* **« En faire PLUS » présuppose d'avoir fait.** Le quota s'ajoute au
 *      plafond de la semaine ; l'offrir à un élève qui n'a pas commencé lui
 *      proposerait de contourner ce qu'on lui a donné.
 *    *(2)* **Le bonus compte dans la couverture R5 et les compteurs d'escalade**
 *      (`01-` §5). Le servir pendant que la semaine imposée est en cours
 *      brouillerait les deux, sur un cycle qui « se décide à la construction ».
 *    *(3)* **« UN exercice à la fois » devient alors structurel** : l'offre se
 *      suspend tant qu'un bonus attend un geste, donc on ne peut pas en demander
 *      un second avant d'avoir fait le premier.
 *
 * ⛔ ET AUCUN MOMENT NE SE TAIT. Le `vide` dit qu'il n'y a rien à faire de plus,
 *    le `recapitulatif` dit quand l'offre viendra, et la porte fermée le dit
 *    déjà pour tout l'écran : « le silence est un mensonge » — c'est la leçon que
 *    `C6-L2` a écrite phrase par phrase.
 */
export interface OffreDEnFairePlus {
  /** Vrai quand le bouton s'affiche. Faux = il y a une PHRASE à la place. */
  offerte: boolean
  /** Pourquoi elle ne s'offre pas. `null` quand elle s'offre. */
  motif: MotifDuRefus | null
  /** Ce que l'écran rend — en langue élève, sans nombre, sans nom d'interrupteur. */
  phrase: string
}

/**
 * ⚠️ `quota` VAUT `null` QUAND L'ÉLÈVE N'A AUCUN BUDGET — le piège de la
 *    vacuité : « un élève sans parcours ne reçoit RIEN, et le professeur en est
 *    averti » (`07-` §1.3). Ce n'est pas « quota épuisé », et cela ne se dit pas
 *    pareil.
 *
 * ⚠️ Le quota est le SEUL refus serveur pré-calculé ici, et c'est un arbitrage :
 *    il coûte deux requêtes, quand savoir d'avance que le vivier est vide
 *    coûterait de charger la doctrine et toutes les instances À CHAQUE
 *    AFFICHAGE. Les trois vides du pull — quota, vivier, liste — se disent tous,
 *    mais le premier AVANT le clic et les deux autres APRÈS.
 *
 * ⛔ ET LE QUOTA NE SE COMPTE JAMAIS PAR CLASSE. « Un élève inscrit dans deux
 *    classes a UN SEUL budget » (`01-` §4) : l'appelant le calcule UNE FOIS par
 *    élève, sur la liste fusionnée de ses inscriptions.
 */
export function offreDEnFairePlus(
  porteOuverte: boolean,
  moment: MomentDeLaSemaine,
  exercices: readonly ExerciceDeLaSemaine[],
  quota: { epuise: boolean } | null,
): OffreDEnFairePlus {
  const dire = (motif: MotifDuRefus): OffreDEnFairePlus =>
    ({ offerte: false, motif, phrase: phraseDuRefus(motif) })

  if (!porteOuverte) return dire('porte_fermee')
  if (moment === 'vide') return dire('semaine_vide')
  if (moment === 'recapitulatif') return dire('semaine_en_cours')
  // ⛔ « L'élève demande UN exercice à la fois » — un bonus qui attend encore un
  //    geste tient la place, et l'écran le DIT plutôt que de rester muet.
  if (exercices.some((e) => e.bonus && APPELLE_UN_GESTE.includes(e.ton))) {
    return dire('un_a_la_fois')
  }
  if (quota === null) return dire('aucun_budget')
  if (quota.epuise) return dire('quota_epuise')

  return {
    offerte: true,
    motif: null,
    // ⛔ AUCUN NOMBRE : ni minutes, ni « il t'en reste 2 ». « Le pull se compte en
    //    minutes CÔTÉ SERVEUR ; côté élève, il se dit en exercices, ou il ne se
    //    dit pas » — et ici, il ne se dit pas.
    phrase: 'Tu as fini ta semaine. Si tu veux, tu peux demander un exercice de plus.',
  }
}
