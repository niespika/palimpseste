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
  /** Vrai quand PB3 a départagé — pour le journal. */
  departageParPB3: boolean
  /** Le tour de PB5 : 0 au premier parcours de la liste, 1 au second, etc. */
  tour: number
}

export interface SemainePosee {
  exercices: ExercicePose[]
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
): SemainePosee {
  const exercices: ExercicePose[] = []
  let minutes = 0
  let permutations = 0
  let motifArret = 'liste et budget épuisés.'

  if (liste.length === 0) {
    return {
      exercices, minutesAssignees: 0, ecart: ecartAuPlancher(0, budget),
      journal: { permutationsALaCouture: 0, reliquatPerdu: budget.plafond, voieMixte: true,
        motifArret: 'aucune compétence ciblable : la semaine entière revient à la voie mixte.' },
    }
  }

  // PB5 — on reparcourt la liste dans le MÊME ORDRE, tour après tour.
  let tour = 0
  let i = 0
  let garde = 0
  const GARDE = 500 // filet : jamais une boucle infinie sur un budget non consommé

  while (garde++ < GARDE) {
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
      const elu = tries[0]
      const aDepartage = tries.length > 1 && rangGrain[tries[0].grain] === rangGrain[tries[1].grain]

      exercices.push({ candidat: elu, regle: entree.regle, departageParPB3: aDepartage, tour })
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
