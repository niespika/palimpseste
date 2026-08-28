// ============================================================================
// C4 · L2 — LA CONSTRUCTION DE LA SEMAINE (§5). TROIS PHASES QUI NE SE MÉLANGENT PAS.
// ----------------------------------------------------------------------------
// « La PHASE A construit un pool et NE REGARDE JAMAIS LE TEMPS ; la PHASE B
//   ordonne et pose, et NE ROUVRE JAMAIS L'ÉLECTION ; la PHASE C place les sondes
//   sur la semaine posée, et NE POSE AUCUN EXERCICE. »
//
// ⚠️ « TOUT SE DÉCIDE À LA CONSTRUCTION DU CYCLE, avant qu'aucun exercice ne soit
//    servi. AUCUNE MESURE DU CYCLE EN COURS N'ALIMENTE SA PROPRE CONSTRUCTION :
//    `delai_mesures`, `delai_jours`, `etat_escalade` et la fenêtre d'évidence sont
//    lus UNE FOIS, à cet instant. SEUL `historique_cibles` S'ACCUMULE PENDANT LA
//    POSE — c'est le journal des décisions du routeur lui-même, celui que PB2 et
//    PB5 consultent. »
//
// ⚠️ « LE PLAFOND BORNE, LE PLANCHER SIGNALE » : le plafond est une borne dure,
//    opérée par PB6 ; quand la boucle s'arrête sous le plancher, l'écart SE
//    JOURNALISE et le solde revient aux exercices communs — LA VOIE MIXTE EST UN
//    RÉGIME NORMAL, PAS UN REPLI.
//
// Ce fichier est PUR.
// ============================================================================

import { PLAFOND_SONDES_PAR_CYCLE, RELIQUAT_PERDU_MIN } from './config'
import { ecartAuPlancher } from './budget'
import type { BudgetMinutes } from './config'
import { PLAFOND_CIBLES_PAR_GRAIN, type Competence, type Couverture, type Geste, type Grain }
  from './types'
import type { EntreeDePriorite } from './ciblage'
import type { SondeClassee } from './sondes'

// ════════════════════════════════════════════════════════════════════════════
// LA LARGEUR DE MESURE — « elle SE DÉRIVE, elle ne se déclare pas »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §5 — « COMBIEN DE COMPÉTENCES UN EXERCICE PORTE NE SE DÉCLARE PAS : CELA
 * SE DÉRIVE. »
 *   · l'OBJET fixe `competences[]` — le plafond de ce qui est mesurable ;
 *   · le GESTE dit ce qu'on en fait : `produire` déclare `exerce` — PLUSIEURS
 *     CIBLES POSSIBLES ; `transformer` et `diagnostiquer` déclarent `isole`, et
 *     l'instance choisit UN SEUL défaut injecté — DONC UNE SEULE CIBLE ;
 *   · une compétence en `observable_seul` est MATÉRIAU DE MESURE, JAMAIS CIBLE.
 *
 * « Le grain borne LE RETOUR, pas la mesure. »
 */
export function ciblesPossibles(
  geste: Geste, grain: Grain,
  couvertureParCompetence: Readonly<Record<string, Couverture>>,
): { ciblables: Competence[]; plafond: number; observableSeul: Competence[] } {
  const ciblables: Competence[] = []
  const observableSeul: Competence[] = []
  for (const [c, couverture] of Object.entries(couvertureParCompetence)) {
    if (couverture === 'observable_seul') observableSeul.push(c as Competence)
    else ciblables.push(c as Competence)
  }
  // `transformer` et `diagnostiquer` isolent : une seule cible, quel que soit le grain.
  const plafond = geste === 'produire' ? PLAFOND_CIBLES_PAR_GRAIN[grain] : 1
  return { ciblables, plafond, observableSeul }
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE B — LES SIX RÈGLES DE POSE
// ════════════════════════════════════════════════════════════════════════════

/** Un exercice candidat, tel que la couche 4 le rend à la phase B. */
export interface Candidat {
  exerciceId: string
  competence: Competence
  grain: Grain
  geste: Geste
  cran: string
  mode: string
  /** `07-` §1.1 — « la SEULE valeur que le budget décompte », dérivée du geste et du grain. */
  dureeMin: number
  /** Les cibles secondaires que PB4 peut ajouter. */
  ciblesSecondaires: Competence[]
}

export interface ExercicePose {
  candidat: Candidat
  /** La règle qui l'a fait entrer dans la liste de priorité. */
  regle: EntreeDePriorite['regle']
  /**
   * Vrai quand PB3 a **réellement** départagé — c'est-à-dire quand, à grain
   * égal, la valeur de `change` a séparé les candidats.
   *
   * ⛔ Il valait `true` dès que les deux premiers triés partageaient leur grain,
   *    donc AUSSI quand PB3 n'avait rien tranché du tout : le journal désignait
   *    PB3 comme l'auteur d'un choix que personne n'avait fait. C'est exactement
   *    le cas où le tirage doit avoir lieu, et le confondre le cachait.
   */
  departageParPB3: boolean
  /**
   * `01-` §11, point 5 — vrai quand le choix s'est fait AU TIRAGE, PB1 et PB3
   * ayant laissé plusieurs ex æquo. Même champ que `SondePosee.tirage`, et la
   * même raison : « un départage non journalisé rend le routeur irreproductible ».
   */
  tirage: boolean
  /** Le tour de PB5 : 0 au premier parcours de la liste, 1 au second, etc. */
  tour: number
}

export interface SemainePosee {
  /** ⚠️ À la reprise, les DÉJÀ-POSÉS y sont aussi, en tête et dans leur ordre. */
  exercices: ExercicePose[]
  /**
   * ⭐ Ce que CETTE passe a ajouté, et rien d'autre. Sans reprise, c'est
   *   `exercices` à l'identique. ⛔ Il existe pour qu'aucun appelant n'ait à
   *   faire un `slice()` sur une longueur qu'il aurait recalculée de son côté.
   */
  posesDeCettePasse: ExercicePose[]
  minutesAssignees: number
  ecart: ReturnType<typeof ecartAuPlancher>
  /** `01-` §5 — ce qui n'a pas tenu, et pourquoi. */
  journal: {
    permutationsALaCouture: number
    reliquatPerdu: number
    voieMixte: boolean
    motifArret: string
  }
}

/**
 * ⭐⭐ C6 · L3 — LE PARAMÈTRE QUI MANQUAIT À LA PHASE B, ET RIEN DE PLUS.
 *
 * `01-` §5, LE BUDGET OPTIONNEL : « PB5 s'y applique EXERCICE PAR EXERCICE —
 * chaque demande sert LE SUIVANT DANS L'ORDRE QUE LA PHASE B AURAIT PRODUIT. »
 *
 * ⛔ Une seconde fonction aurait été une seconde phase B, donc une seconde
 *    lecture de PB1 à PB6 — et deux lectures d'une même règle finissent par
 *    diverger. Ce que le pull demandait n'était pas un algorithme : c'était de
 *    pouvoir REPRENDRE la pose là où le budget l'avait arrêtée, et de s'arrêter
 *    au premier posé.
 *
 * ⚠️ CE QUE LA REPRISE FAIT EXACTEMENT :
 *   · les exercices déjà posés entrent dans `exercices` AVANT la boucle — donc
 *     **PB2 voit la dernière compétence de la semaine** et ne la redonne pas de
 *     suite, et **PB3 compare au dernier exercice réellement servi** ;
 *   · leurs minutes entrent dans le compteur — donc **PB6 borne sur le total**,
 *     et l'appelant élargit le plafond du quota : « jamais au-delà » devient
 *     mécanique, il ne se re-vérifie pas ailleurs ;
 *   · la marche reprend à un **TOUR DE PLUS**, au début de la liste. C'est PB5
 *     en toutes lettres — « quand la liste est épuisée et qu'il reste du budget,
 *     ON LA REPARCOURT DANS LE MÊME ORDRE ». *La position exacte où la semaine
 *     s'était arrêtée n'est journalisée nulle part (`routeur_decisions` porte le
 *     tour, pas l'index) ; reprendre au début du tour suivant est la lecture que
 *     PB5 sanctionne, et c'est celle-ci qui est retenue.*
 *
 * ⛔ Les instances déjà servies ne peuvent pas revenir : elles sont sorties du
 *    vivier par `instancesDejaDeposees` — « resservir la même instance au MÊME
 *    élève serait un défaut silencieux ». La reprise ne relâche AUCUN filtre.
 */
export interface RepriseDeLaPose {
  /** Ce que la semaine a déjà posé, DANS L'ORDRE où elle l'a posé. */
  dejaPoses: readonly ExercicePose[]
  /**
   * Combien d'exercices AU PLUS cette passe ajoute. ⛔ Le pull en pose **UN** :
   * « l'élève demande UN exercice à la fois » — pas une liste, pas un choix
   * entre trois, pas un lot de deux.
   */
  maxAPoser: number
}

/**
 * `01-` §5, PHASE B — l'ordre et la pose. « ELLE NE ROUVRE JAMAIS L'ÉLECTION. »
 *
 *   PB1  COMMENCER PAR LE PLUS PETIT GRAIN DISPONIBLE — sauf si un exercice d'un
 *        grain supérieur est PRIORITAIRE *et* ne tiendrait plus dans le cycle une
 *        fois le petit posé.
 *   PB2  JAMAIS DEUX FOIS DE SUITE LA MÊME COMPÉTENCE. Contrainte DURE, SANS EXCEPTION.
 *   PB3  À priorité égale, préférer l'exercice QUI CHANGE de cran, de mode ou de
 *        grain. Départage, JAMAIS interdiction.
 *   PB4  On cible PLUSIEURS compétences quand le couple (geste, objet) le permet
 *        et que le grain l'autorise. « CE N'EST PAS UN INSTRUMENT DE COMPRESSION. »
 *   PB5  Liste épuisée et budget restant → ON LA REPARCOURT DANS LE MÊME ORDRE.
 *        À LA COUTURE, si la dernière du tour et la première du suivant coïncident,
 *        ON PERMUTE AVEC LA SUIVANTE — PB2 vaut aussi là.
 *   PB6  On ajoute tant qu'il existe un exercice qui TIENNE SOUS LE PLAFOND ; le
 *        reliquat sous 5 MINUTES est perdu.
 *
 * `candidatsPour` rend, pour une compétence, les exercices que la couche 4 lui
 * laisse — déjà filtrés (parcours, cours vu, non-spoiler) et déjà consommés au fur
 * et à mesure par l'appelant.
 */
export function poserLaSemaine(
  liste: readonly EntreeDePriorite[],
  budget: BudgetMinutes,
  candidatsPour: (c: Competence, dejaPoses: readonly ExercicePose[]) => Candidat[],
  /**
   * `01-` §11, point 5 — le départage des ex æquo que PB1 et PB3 laissent.
   * ⭐ Il se reçoit EN PARAMÈTRE, comme celui de `poserLesSondes` et pour la
   *   même raison : « pour que le tirage soit REPRODUCTIBLE et JOURNALISABLE,
   *   le module ne tire pas seul ».
   * ⚠️ Le défaut prend le premier — c'est l'ancien comportement, DÉTERMINISTE,
   *    et il ne convient qu'aux tests unitaires : en production, la pose reçoit
   *    `journalDuTirage().tirer('phase_b')`. Le défaut sert la lisibilité des
   *    tests, jamais un appel réel.
   */
  tirer: (exAequo: readonly string[]) => string = (exAequo) => exAequo[0],
  /**
   * ⭐ C6 · L3 — la reprise du budget optionnel. Absente, la pose est celle de
   *   la semaine, à l'identique : ce paramètre n'a AUCUN effet sur l'appel
   *   hebdomadaire, qui ne le passe pas.
   */
  reprise?: RepriseDeLaPose,
): SemainePosee {
  // ⭐ Les déjà-posés entrent AVANT la boucle : PB2 voit la dernière compétence
  //   servie, PB3 compare au dernier exercice réel, et PB6 borne sur le total.
  const exercices: ExercicePose[] = reprise ? [...reprise.dejaPoses] : []
  const posesAvant = exercices.length
  let minutes = exercices.reduce((n, e) => n + e.candidat.dureeMin, 0)
  let permutations = 0
  let motifArret = 'liste et budget épuisés.'

  if (liste.length === 0) {
    return {
      exercices, posesDeCettePasse: [], minutesAssignees: minutes,
      ecart: ecartAuPlancher(minutes, budget),
      journal: { permutationsALaCouture: 0, reliquatPerdu: budget.plafond - minutes,
        voieMixte: true,
        motifArret: 'aucune compétence ciblable : la semaine entière revient à la voie mixte.' },
    }
  }

  // PB5 — on reparcourt la liste dans le MÊME ORDRE, tour après tour.
  // ⭐ À la reprise, on repart AU TOUR SUIVANT et au début de la liste : « quand
  //   la liste est épuisée et qu'il reste du budget, on la reparcourt dans le
  //   même ordre ».
  let tour = reprise && posesAvant > 0
    ? Math.max(...reprise.dejaPoses.map((e) => e.tour)) + 1
    : 0
  let i = 0
  let garde = 0
  const GARDE = 500 // filet : jamais une boucle infinie sur un budget non consommé

  while (garde++ < GARDE) {
    // ⛔ « L'élève demande UN exercice à la fois » — la passe s'arrête au
    //    plafond qu'on lui a fixé, avant même de regarder le budget.
    if (reprise && exercices.length - posesAvant >= reprise.maxAPoser) {
      motifArret = `${reprise.maxAPoser} exercice(s) posé(s) : c'est le plafond de cette passe.`
      break
    }
    if (i >= liste.length) {
      // La couture entre deux tours.
      tour += 1
      i = 0
    }
    let entree = liste[i]

    // PB2 — jamais deux fois de suite la même compétence. À la couture comme ailleurs.
    const derniere = exercices[exercices.length - 1]?.candidat.competence
    if (derniere === entree.competence && liste.length > 1) {
      const suivante = liste[(i + 1) % liste.length]
      if (suivante.competence !== entree.competence) {
        entree = suivante
        permutations += 1
        i += 1 // on a consommé la suivante ; le tour reprendra à celle qu'on saute
      }
    }

    const candidats = candidatsPour(entree.competence, exercices)
      // PB2, encore : un candidat qui redonnerait la même compétence de suite est écarté.
      .filter((c) => c.competence !== derniere || liste.length === 1)
      // ⭐ LES BORNES DE L'ENTRÉE — le grain de calibration (`01-` §6, segment 2)
      //   et la bande de crans du palier de la cible (`01-` §4, couche 3, la part
      //   DURE : « tout cran absent d'une ligne vaut 0 % »). Elles se lisent SUR
      //   L'ENTRÉE parce qu'elles dépendent de la CIBLE, jamais du vivier : la
      //   couche 4 rend ce qui existe, la couche 2-3 dit ce qui a le droit.
      // ⚠️ Absentes, elles ne bornent rien — hors calibration, le grain relève des
      //    proportions du §7, qui sont une préférence et jamais un filtre.
      .filter((c) => !entree.grains || entree.grains.includes(c.grain))
      .filter((c) => !entree.crans || entree.crans.includes(c.cran))
      // PB6 — il doit TENIR SOUS LE PLAFOND.
      .filter((c) => minutes + c.dureeMin <= budget.plafond)

    if (candidats.length > 0) {
      // PB1 — le plus petit grain disponible. PB3 départage à priorité égale :
      // préférer celui qui CHANGE de cran, de mode ou de grain.
      const rangGrain: Record<Grain, number> = { micro: 0, meso: 1, macro: 2 }
      const precedent = exercices[exercices.length - 1]?.candidat
      const change = (c: Candidat) => precedent
        ? Number(c.cran !== precedent.cran) + Number(c.mode !== precedent.mode)
          + Number(c.grain !== precedent.grain)
        : 0
      const tries = [...candidats].sort((a, b) =>
        rangGrain[a.grain] - rangGrain[b.grain] || change(b) - change(a))

      // ⭐ CE QUE CHAQUE RÈGLE LAISSE DERRIÈRE ELLE. `memeGrain` est ce que PB1
      //   n'a pas tranché ; `exAequo` est ce que PB3 ne tranche pas NON PLUS —
      //   même grain ET même valeur de `change`. PB3 n'a donc départagé que si
      //   le second ensemble est STRICTEMENT PLUS PETIT que le premier.
      const meilleurGrain = rangGrain[tries[0].grain]
      const meilleurChange = change(tries[0])
      const memeGrain = tries.filter((c) => rangGrain[c.grain] === meilleurGrain)
      const exAequo = memeGrain.filter((c) => change(c) === meilleurChange)
      const aDepartage = memeGrain.length > exAequo.length

      // ⛔⛔ `01-` §11, point 5 — « TRANCHER AU HASARD **ET LOGGUER LE TIRAGE** ».
      //   PB3 était LA SEULE des cinq règles de départage du corpus à ne pas le
      //   prescrire, et le silence coûtait cher : `tries[0]` sortait de l'ordre
      //   du vivier, IDENTIQUE d'un élève à l'autre. Deux élèves de même profil
      //   recevaient donc le MÊME exercice, la même semaine, toute l'année.
      // ⚠️ C'est un DÉPARTAGE, jamais un filtre : « entre élèves, une instance
      //    se ressert » — le tirage disperse, il n'interdit rien.
      const tirage = exAequo.length > 1
      const idElu = tirage ? tirer(exAequo.map((c) => c.exerciceId)) : exAequo[0].exerciceId
      const elu = exAequo.find((c) => c.exerciceId === idElu) ?? exAequo[0]

      exercices.push({ candidat: elu, regle: entree.regle, departageParPB3: aDepartage,
        tirage, tour })
      minutes += elu.dureeMin
    }

    i += 1

    // PB6 — « on s'arrête quand il n'en reste AUCUN qui tienne ».
    const reste = budget.plafond - minutes
    if (reste < RELIQUAT_PERDU_MIN) {
      motifArret = `reliquat de ${reste} min sous le seuil des ${RELIQUAT_PERDU_MIN} min : perdu.`
      break
    }
    // Un tour entier sans rien poser : plus rien ne tient, on arrête.
    if (i >= liste.length && exercices.filter((e) => e.tour === tour).length === 0) {
      motifArret = 'un tour complet sans qu\'aucun exercice ne tienne : plus rien à poser.'
      break
    }
  }

  const ecart = ecartAuPlancher(minutes, budget)
  return {
    exercices,
    posesDeCettePasse: exercices.slice(posesAvant),
    minutesAssignees: minutes,
    ecart,
    journal: {
      permutationsALaCouture: permutations,
      reliquatPerdu: budget.plafond - minutes,
      // « Le solde revient aux exercices communs » — un régime NORMAL, pas un repli.
      voieMixte: ecart.souSLePlancher,
      motifArret,
    },
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PHASE C — LA POSE DES SONDES SECONDAIRES
// ════════════════════════════════════════════════════════════════════════════

/** Ce qu'un exercice posé offre à la phase C. */
export interface Substrat {
  exerciceId: string
  /** `02-` §1 — les compétences que l'objet liste. */
  competences: Competence[]
  /** Les cibles de cet exercice — une sonde n'est JAMAIS une cible du même exercice. */
  cibles: Competence[]
  geste: Geste
  grain: Grain
  /** Combien de sondes cet exercice porte déjà. */
  sondesDeja: number
}

export interface SondePosee {
  competence: Competence
  exerciceId: string
  motif: SondeClassee['motif']
  priorite: SondeClassee['priorite']
  /** Vrai quand PC3 a tiré au sort — et le tirage se journalise (§11). */
  tirage: boolean
}

const RANG_GESTE: Record<Geste, number> = { produire: 0, transformer: 1, diagnostiquer: 2 }
const RANG_GRAIN_DESC: Record<Grain, number> = { macro: 0, meso: 1, micro: 2 }

/**
 * `01-` §5, PHASE C — « la semaine est posée. LES SONDES SE PLACENT MAINTENANT, LA
 * SEMAINE ENTIÈRE EN MAIN — jamais exercice par exercice. »
 *
 *   PC1  ON PARCOURT LES COMPÉTENCES, PAS LES EXERCICES, dans l'ordre du §8.9.
 *        Chacune passe UNE FOIS.
 *   PC2  Une compétence prend LE MEILLEUR SUBSTRAT ENCORE LIBRE. Est substrat un
 *        exercice qui la liste dans `competences[]` ET DONT ELLE N'EST PAS LA
 *        CIBLE. Est meilleur celui qui EN MONTRE LE PLUS : d'abord le GESTE —
 *        `produire`, `transformer`, `diagnostiquer` —, ensuite le GRAIN — `macro`,
 *        `meso`, `micro`.
 *   PC3  À égalité, L'EXERCICE QUI NE PORTE PAS ENCORE DE SONDE. À égalité
 *        persistante, TIRAGE ALÉATOIRE JOURNALISÉ.
 *   PC4  Une compétence SANS SUBSTRAT n'est pas sondée. ELLE GARDE SON RANG.
 *   PC5  On s'arrête AU PLAFOND DE SONDES DU CYCLE. « LE GRAIN NE BORNE PAS LES
 *        SONDES : il borne le retour, et une sonde n'en produit aucun. »
 */
export function poserLesSondes(
  ordre: readonly SondeClassee[],
  substrats: readonly Substrat[],
  tirer: (exAequo: readonly string[]) => string,
  plafond: number = PLAFOND_SONDES_PAR_CYCLE,
): { posees: SondePosee[]; sansSubstrat: Competence[] } {
  const etat = substrats.map((s) => ({ ...s }))
  const posees: SondePosee[] = []
  const sansSubstrat: Competence[] = []

  for (const s of ordre) {
    if (posees.length >= plafond) break // PC5

    // PC2 — le substrat : il la liste, et elle n'en est PAS la cible.
    let libres = etat.filter((e) =>
      e.competences.includes(s.competence) && !e.cibles.includes(s.competence))

    if (libres.length === 0) { sansSubstrat.push(s.competence); continue } // PC4

    // « Est meilleur celui qui EN MONTRE LE PLUS » : le geste, puis le grain.
    const meilleurGeste = Math.min(...libres.map((e) => RANG_GESTE[e.geste]))
    libres = libres.filter((e) => RANG_GESTE[e.geste] === meilleurGeste)
    const meilleurGrain = Math.min(...libres.map((e) => RANG_GRAIN_DESC[e.grain]))
    libres = libres.filter((e) => RANG_GRAIN_DESC[e.grain] === meilleurGrain)

    // PC3 — à égalité, celui qui ne porte pas encore de sonde.
    const minSondes = Math.min(...libres.map((e) => e.sondesDeja))
    libres = libres.filter((e) => e.sondesDeja === minSondes)

    const tirage = libres.length > 1
    const elu = tirage ? tirer(libres.map((e) => e.exerciceId)) : libres[0].exerciceId

    posees.push({ competence: s.competence, exerciceId: elu, motif: s.motif,
      priorite: s.priorite, tirage })
    const cible = etat.find((e) => e.exerciceId === elu)
    if (cible) cible.sondesDeja += 1
  }

  return { posees, sansSubstrat }
}

// ════════════════════════════════════════════════════════════════════════════
// LE BUDGET OPTIONNEL — « un PULL, un exercice à la fois »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §5 — « PB5 s'y applique EXERCICE PAR EXERCICE : chaque demande sert le
 * suivant dans l'ordre que la phase B aurait produit. » Le bonus est un exercice
 * NORMAL, mesures comprises — « il compte dans les tables de proportion, dans la
 * couverture R5 et dans les compteurs d'escalade ».
 *
 * ⚠️ « IL NE PORTE EN REVANCHE AUCUNE SONDE SECONDAIRE : la phase C a placé les
 *    siennes à la construction, QUAND IL N'EXISTAIT PAS. »
 *
 * ⚠️ La CONSOMMATION du budget optionnel est C6-L3 (`PLAN_DE_CHANTIER.md` §3) —
 *    ici, seule la VALEUR se règle (écran des budgets). Cette fonction existe pour
 *    que la règle soit lisible et éprouvée dès maintenant.
 */
export function bonusNePortePasDeSonde(): boolean {
  return true
}
