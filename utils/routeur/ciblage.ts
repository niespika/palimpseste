// ============================================================================
// C4 · L2 — LES RÈGLES DE CIBLAGE (§6, couche 2). LE CŒUR.
// ----------------------------------------------------------------------------
// « Ces règles NE SONT PAS PROPRES À UN MODE : le constructeur demande une cible,
//   et ce sont les mêmes règles qui répondent. »
//
// ⚠️ « "Les cinq règles" de la mission SE LISENT AU §6, QUI PORTE DAVANTAGE » :
//    la RÈGLE DE CALIBRATION (segment 2), le FILTRE R0, R1 à R5, et la BRANCHE
//    D'ÉCHEC. « Tout ce que la section porte s'implémente ; LE COMPTE DE LA
//    MISSION NE BORNE RIEN. »
//
// ⚠️ R0 EST UN FILTRE, PAS UNE RÈGLE D'ÉLECTION : « AUCUNE règle ne peut proposer
//    une compétence dont le statut n'est pas `evaluee` ».
//
// ⚠️ R5 « INSCRIT la compétence en dette dans la liste de priorité de la phase A ;
//    ELLE N'ÉLIT JAMAIS ELLE-MÊME ».
//
// Ce fichier est PUR : il reçoit le profil déjà dérivé, il ne le calcule pas.
// ============================================================================

import {
  CADENCE_R3, CYCLES_DU_PLANCHER_DE_MESURE, CYCLES_SANS_PROGRES_EXCEPTION,
  GARDIENS_DU_QUESTIONNEMENT, MESURES_DE_CALIBRATION, ORDRE_LEVIER, ORDRE_LEVIER_INVERSE,
  PART_R1, PART_R1_EXCEPTION, SEUIL_ENTREE_QUESTIONNEMENT, cransDuPalier,
} from './config'
import { moinsRecemmentCiblee } from './profil'
import {
  rangPalier, type Competence, type Grain, type Lettre, type Palier, type Parcours,
  type RegleCiblage,
} from './types'

/** Ce que le ciblage lit d'une compétence — déjà dérivé (§3). */
export interface EtatPourCiblage {
  competence: Competence
  statutRecette: string
  /** La lettre AFFICHÉE — celle que lisent les gardiens du Questionnement et le palier cible. */
  lettre: Lettre
  /** `01-` §3 — ce sur quoi R2 élit quand la proportion réclame un groupe. */
  signal: Lettre
  /** `01-` §3 — le repli de R2 quand la proportion ne réclame aucun groupe. */
  valeurNonPlafonnee: Lettre
  /** `01-` §8.4 — N3 retire la compétence des cibles PRIMAIRES. */
  enEntretienN3: boolean
  /** `01-` §8.2 — au moins un observable est-il passé à acquis ? */
  aProgresse: boolean
}

/** Le trio de R2, et rien d'autre. */
export const TRIO: Competence[] = ['questionnement', 'argumentation', 'structure']

// ════════════════════════════════════════════════════════════════════════════
// R0 — LE FILTRE DE RECETTE
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §6, R0 — « AUCUNE RÈGLE ne peut proposer une compétence dont le statut
 * n'est pas `evaluee` ».
 *
 * ⚠️ « AUCUNE LISTE DES COMPÉTENCES PRÊTES, NULLE PART » (`07-` §1.3) : ce qui est
 *    ciblable est une CONSÉQUENCE de `statut_recette`. Et une compétence sans
 *    lettre n'est pas ciblable non plus (§3).
 */
export function filtreR0(etats: readonly EtatPourCiblage[]): EtatPourCiblage[] {
  return etats.filter((e) => e.statutRecette === 'evaluee' && e.lettre !== null)
}

/**
 * `01-` §5, PA2 — LE FILTRE N3, et il s'exécute **AVANT R2** : « N3 est une
 * opération de COUCHE 2 : il retire la compétence du pool des cibles ».
 *
 * ⚠️ « IL NE FILTRE EN REVANCHE JAMAIS R1 » : quand l'Expression entre en régime
 *    d'entretien, le canal continue de lui donner un exercice sur deux.
 */
export function filtreN3(etats: readonly EtatPourCiblage[]): EtatPourCiblage[] {
  return etats.filter((e) => !e.enEntretienN3)
}

// ════════════════════════════════════════════════════════════════════════════
// R1 — LE CANAL (Expression)
// ════════════════════════════════════════════════════════════════════════════

export interface RegimeR1 {
  actif: boolean
  /** La part d'exercices réservée — « la part SE COMPTE EN EXERCICES, pas en semaines ». */
  part: number
  /** `01-` §6 — à C, Expression prend EN PLUS une place de cible SECONDAIRE. */
  secondaireSurProduire: boolean
  motif: string
}

/**
 * `01-` §6, R1 — le canal de l'Expression.
 *
 * « Tant qu'EXPRESSION ≤ D, elle est cible primaire d'UN EXERCICE SUR DEUX. »
 * « À C, LA PART RÉSERVÉE TOMBE » — elle redevient une candidate ordinaire, « et
 *   elle prend EN PLUS une place de cible secondaire sur tout exercice de grain
 *   MÉSO ou MACRO qui peut la porter » — l'objet la liste, elle n'est pas déjà
 *   primaire, ET LE GESTE EST `produire`.
 * « ON SORT DE R1 QUAND EXPRESSION ATTEINT B. »
 *
 * LA BORNE — `exception_expression` : « au-delà de 6 CYCLES sans progrès, la part
 * passe d'un sur deux à UN SUR TROIS. LA BORNE NE JOUE QU'AU PALIER D » — à C la
 * part réservée a déjà disparu, il n'y a plus de créneau à soulager.
 */
export function regimeR1(
  lettreExpression: Lettre,
  exceptionExpression: boolean,
  cyclesSansProgres: number,
  segment: number,
): RegimeR1 {
  if (segment < 3) {
    return { actif: false, part: 0, secondaireSurProduire: false,
      motif: 'R1 démarre au segment 3.' }
  }
  if (lettreExpression === null) {
    return { actif: false, part: 0, secondaireSurProduire: false,
      motif: 'Expression sans lettre : ni ciblable ni comptée.' }
  }
  const rang = rangPalier(lettreExpression)
  if (rang >= rangPalier('B')) {
    return { actif: false, part: 0, secondaireSurProduire: false,
      motif: 'Expression a atteint B : on sort de R1.' }
  }
  if (lettreExpression === 'C') {
    return { actif: false, part: 0, secondaireSurProduire: true,
      motif: 'À C, la part réservée tombe ; l\'Expression redevient candidate ordinaire et prend '
        + 'en plus une place de cible secondaire sur tout méso/macro dont le geste est `produire`.' }
  }
  // E ou D — la part réservée court.
  const borne = exceptionExpression && lettreExpression === 'D'
    && cyclesSansProgres > CYCLES_SANS_PROGRES_EXCEPTION
  return {
    actif: true,
    part: borne ? PART_R1_EXCEPTION : PART_R1,
    secondaireSurProduire: false,
    motif: borne
      ? `\`exception_expression\` au palier D : ${cyclesSansProgres} cycles sans progrès, la part `
        + 'passe d\'un exercice sur deux à un sur trois.'
      : `Expression à ${lettreExpression} : cible primaire d'un exercice sur deux.`,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// R2 — LE TRIO
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §6, R2 — LE SEUIL D'ENTRÉE DU QUESTIONNEMENT.
 *
 * « Le Questionnement ne devient cible primaire que si Argumentation **ET**
 *   Structure ont atteint C — LU SUR LA LETTRE AFFICHÉE DES DEUX GARDIENS, PAS
 *   SUR LE SIGNAL DE CIBLAGE — même quand il porte la plus basse lettre du trio.
 *   LE SEUIL VAUT DANS LES CINQ MODES. »
 */
export function questionnementEstEntre(etats: readonly EtatPourCiblage[]): boolean {
  return GARDIENS_DU_QUESTIONNEMENT.every((g) => {
    const e = etats.find((x) => x.competence === g)
    return e?.lettre != null && rangPalier(e.lettre) >= rangPalier(SEUIL_ENTREE_QUESTIONNEMENT)
  })
}

/**
 * `01-` §6, R2 — l'ordre de levier, et son inversion nommée.
 * « Argumentation > Structure > Questionnement — AVEC UNE EXCEPTION NOMMÉE :
 *   quand LES TROIS LETTRES du trio sont ≥ B, l'ordre s'inverse. »
 */
export function ordreDeLevier(etats: readonly EtatPourCiblage[]): readonly Competence[] {
  const troisHautes = TRIO.every((c) => {
    const e = etats.find((x) => x.competence === c)
    return e?.lettre != null && rangPalier(e.lettre) >= rangPalier('B')
  })
  return (troisHautes ? ORDRE_LEVIER_INVERSE : ORDRE_LEVIER) as readonly Competence[]
}

export interface ElectionR2 {
  cible: Competence | null
  ecartees: Competence[]
  /** Vrai quand le départage a joué — pour le journal. */
  departageParAnciennete: boolean
  departageParLevier: boolean
  motif: string
}

/**
 * `01-` §6, R2 — « cible = LA PLUS FAIBLE DU TRIO, au SIGNAL DE CIBLAGE du groupe
 * de modes que la proportion réclame pour elle, et à la VALEUR DE CIBLAGE NON
 * PLAFONNÉE quand elle n'en réclame aucun ».
 *
 * « À GROUPES DIFFÉRENTS, ON COMPARE QUAND MÊME — C'EST LE RETARD QUI PRIME SUR
 *   L'HOMOGÉNÉITÉ : chaque compétence du trio est lue LÀ OÙ ELLE EST EN RETARD,
 *   et ce sont ces lectures-là qu'on met en concurrence. »
 *
 * « JAMAIS SUR LA LETTRE AFFICHÉE. »
 */
export function elireR2(
  etats: readonly EtatPourCiblage[],
  historiqueDesCibles: readonly Competence[],
  parcours: readonly Parcours[],
): ElectionR2 {
  // R0 a déjà filtré : « si un membre du trio n'est pas `evaluee`, R0 l'écarte
  // d'office — le trio se réduit sans règle spéciale ».
  let candidates = etats.filter((e) => TRIO.includes(e.competence))

  if (!questionnementEstEntre(etats)) {
    candidates = candidates.filter((e) => e.competence !== 'questionnement')
  }
  if (candidates.length === 0) {
    return { cible: null, ecartees: [], departageParAnciennete: false, departageParLevier: false,
      motif: 'aucun membre du trio n\'est éligible.' }
  }

  // Le retard se lit sur le signal ; à défaut, sur la valeur non plafonnée.
  const retard = (e: EtatPourCiblage): number => {
    const v = e.signal ?? e.valeurNonPlafonnee
    return v === null ? Number.POSITIVE_INFINITY : rangPalier(v)
  }
  const min = Math.min(...candidates.map(retard))
  let bloc = candidates.filter((e) => retard(e) === min)
  const ecartees = candidates.filter((e) => retard(e) !== min).map((e) => e.competence)

  let departageParAnciennete = false
  let departageParLevier = false

  if (bloc.length > 1) {
    // (a) « la moins récemment ciblée — l'ancienneté se compte comme à R5 ».
    const anciennes = moinsRecemmentCiblee(historiqueDesCibles, bloc.map((e) => e.competence))
    if (anciennes.length < bloc.length) departageParAnciennete = true
    bloc = bloc.filter((e) => anciennes.includes(e.competence))
  }
  if (bloc.length > 1) {
    // (b) l'ordre de levier, éventuellement inversé.
    const ordre = ordreDeLevier(etats)
    const rang = (c: Competence) => { const i = ordre.indexOf(c); return i < 0 ? 99 : i }
    const meilleur = Math.min(...bloc.map((e) => rang(e.competence)))
    bloc = bloc.filter((e) => rang(e.competence) === meilleur)
    departageParLevier = true
  }

  const cible = bloc[0]?.competence ?? null
  void parcours // la clause HLP borne le MODE, pas l'élection — cf. `questionnementHorsComposer`
  return {
    cible, ecartees, departageParAnciennete, departageParLevier,
    motif: `plus faible du trio au signal de ciblage${departageParAnciennete ? ', départagée à '
      + 'l\'ancienneté' : ''}${departageParLevier ? ', puis à l\'ordre de levier' : ''}.`,
  }
}

/**
 * `01-` §6, R2 — « CHEZ LES HLP, LE QUESTIONNEMENT N'EST CIBLÉ QU'EN MODES AUTRES
 * QUE `composer` » — `restituer`, `expliquer`, `évaluer` ou `interroger`.
 *
 * C'est une contrainte de MODE, pas d'élection : elle borne la couche 3.
 */
export function questionnementHorsComposer(
  cible: Competence, parcours: readonly Parcours[],
): boolean {
  return cible === 'questionnement' && parcours.includes('hlp')
}

// ════════════════════════════════════════════════════════════════════════════
// R3 — SYNTHÈSE PÉRIODIQUE ASSERVIE
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §6, R3 — « CE N'EST PAS UNE HORLOGE, C'EST UNE DETTE QUI MONTE » : à chaque
 * cycle, la probabilité d'insertion vaut **(d / 2C)²**, où `d` est le nombre de
 * cycles écoulés depuis la dernière insertion et `C` la CADENCE DU PALIER —
 * 4 tant que Synthèse ≤ C stable, 6 à B, 8 à A. « CERTITUDE À 2C CYCLES. »
 *
 * « LE TIRAGE EST JOURNALISÉ » (§11) — d'où le tirage injecté.
 * « SUSPENDUE SI L'ÉLÈVE EST EN R1. »
 */
export function probabiliteR3(cyclesDepuisDerniereInsertion: number, palierSynthese: Palier): number {
  const C = CADENCE_R3[palierSynthese]
  const d = Math.max(0, cyclesDepuisDerniereInsertion)
  if (d >= 2 * C) return 1 // certitude à 2C
  return (d / (2 * C)) ** 2
}

export interface TirageR3 {
  insere: boolean
  probabilite: number
  /** Le tirage brut, journalisé tel quel (§11, point 5). */
  tirage: number | null
  motif: string
}

export function insertionR3(
  cyclesDepuisDerniereInsertion: number,
  palierSynthese: Lettre,
  enR1: boolean,
  tirer: () => number,
): TirageR3 {
  if (enR1) {
    return { insere: false, probabilite: 0, tirage: null, motif: 'R3 est suspendue si l\'élève est en R1.' }
  }
  if (palierSynthese === null) {
    return { insere: false, probabilite: 0, tirage: null,
      motif: 'Synthèse sans lettre : ni ciblable, ni cadencée.' }
  }
  const p = probabiliteR3(cyclesDepuisDerniereInsertion, palierSynthese)
  if (p >= 1) {
    return { insere: true, probabilite: 1, tirage: null,
      motif: `certitude à 2C : ${cyclesDepuisDerniereInsertion} cycles depuis la dernière insertion.` }
  }
  const t = tirer()
  return { insere: t < p, probabilite: p, tirage: t,
    motif: `dette (d / 2C)² = ${p.toFixed(3)}, tirage ${t.toFixed(3)}.` }
}

// ════════════════════════════════════════════════════════════════════════════
// R4 — LA CONNAISSANCE HORS RAYON
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §6, R4 — « la Connaissance N'EST JAMAIS CIBLE PRIMAIRE du routeur ».
 * « L'EFFONDREMENT → RENVOI HORS ROUTEUR : signal vers Quazian + drapeau
 *   professeur. Le routeur sait dire "ce n'est pas mon rayon". »
 * Et « QUAZIAN N'ÉCRIT PAS DANS LE PROFIL » (§2).
 */
export function ecarterLaConnaissance(etats: readonly EtatPourCiblage[]): EtatPourCiblage[] {
  return etats.filter((e) => e.competence !== 'connaissance')
}

export interface RenvoiHorsRouteur {
  renvoyer: boolean
  motif: string
}

export function renvoiConnaissance(effondrement: boolean): RenvoiHorsRouteur {
  return effondrement
    ? { renvoyer: true,
      motif: 'Effondrement de la Connaissance : signal vers Quazian (volume et réglage de '
        + 'révision) et drapeau professeur. Ce n\'est pas le rayon du routeur.' }
    : { renvoyer: false, motif: '' }
}

// ════════════════════════════════════════════════════════════════════════════
// R5 — LA DETTE DE COUVERTURE
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §6, R5 — K.
 *
 * ⚠️ « LA FORMULE NE S'INSTANCIE PAS EN UN NOMBRE, ET C'EST DÉLIBÉRÉ : ELLE SE
 *    REMPLIT D'ELLE-MÊME. » Une constante K écraserait R1, R2, R3 et l'escalade à
 *    chaque tour — « le routeur devient un tourniquet ».
 *
 * « K ≥ le nombre de compétences `evaluee`, PLUS UNE MARGE. La marge n'est pas
 *   libre non plus : elle se règle pour que K corresponde AU PLANCHER DE MESURE —
 *   une mesure par compétence ciblée tous les TROIS cycles. Soit : K ≈ LE NOMBRE
 *   D'EXERCICES QUE TROIS CYCLES PRODUISENT, et la marge est ce qui reste une fois
 *   retiré le nombre de compétences `evaluee`. »
 */
export function KdeR5(exercicesParCycle: number, nombreDeCompetencesEvaluees: number): number {
  const parTroisCycles = Math.round(exercicesParCycle * CYCLES_DU_PLANCHER_DE_MESURE)
  // Le plancher de la formule : K ne descend jamais sous N + 1, sans quoi la dette
  // écrase toutes les autres règles.
  return Math.max(parTroisCycles, nombreDeCompetencesEvaluees + 1)
}

export interface DetteR5 {
  competence: Competence
  ancienneteEnExercices: number
  K: number
}

/**
 * `01-` §6, R5 — « AUCUNE COMPÉTENCE `evaluee` NE RESTE PLUS DE K EXERCICES SANS
 * ÊTRE CIBLÉE. La règle SE COMPTE EN EXERCICES, la suite se lisant À CHEVAL SUR
 * LES CYCLES. »
 *
 * « Elle INSCRIT la compétence en dette dans la liste de priorité de la phase A ;
 *   ELLE N'ÉLIT JAMAIS ELLE-MÊME. »
 */
export function dettesDeR5(
  etats: readonly EtatPourCiblage[],
  historique: readonly Competence[],
  K: number,
): DetteR5[] {
  const anciennete = (c: Competence) => {
    for (let i = historique.length - 1; i >= 0; i--) {
      if (historique[i] === c) return historique.length - 1 - i
    }
    return Number.POSITIVE_INFINITY
  }
  return etats
    .map((e) => ({ competence: e.competence, ancienneteEnExercices: anciennete(e.competence), K }))
    .filter((d) => d.ancienneteEnExercices > K)
    .sort((a, b) => b.ancienneteEnExercices - a.ancienneteEnExercices)
}

// ════════════════════════════════════════════════════════════════════════════
// LA RÈGLE DE CALIBRATION — segment 2 seulement
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §6 — « ÉPROUVER LE DIAGNOSTIC, PAS CIBLER ».
 *
 * « R0 s'applique. R1, R2 ET R3 NE S'APPLIQUENT PAS. »
 * « Cible : les compétences `evaluee` ayant LE MOINS DE MESURES, jusqu'à en avoir
 *   AU MOINS TROIS chacune. »
 * « Grain, INDEXÉ SUR CE QU'ON ÉPROUVE : micro et méso pour l'Argumentation, la
 *   Structure et le Questionnement · MÉSO SEUL pour l'Expression et la Synthèse. »
 * « AUCUNE LETTRE AFFICHÉE, aucun compteur d'escalade ne court. »
 */
export const GRAIN_DE_CALIBRATION: Record<Competence, Array<'micro' | 'meso'>> = {
  argumentation: ['micro', 'meso'],
  structure: ['micro', 'meso'],
  questionnement: ['micro', 'meso'],
  expression: ['meso'],
  synthese: ['meso'],
  // La Connaissance n'est jamais cible primaire (R4) ; la ligne existe pour que
  // la table soit totale, jamais pour la cibler.
  connaissance: ['meso'],
}

export interface CibleDeCalibration {
  competence: Competence
  mesures: number
  grains: Array<'micro' | 'meso'>
}

export function ciblesDeCalibration(
  etats: readonly EtatPourCiblage[],
  nombreDeMesures: (c: Competence) => number,
): CibleDeCalibration[] {
  return ecarterLaConnaissance(filtreR0(etats))
    .map((e) => ({
      competence: e.competence,
      mesures: nombreDeMesures(e.competence),
      grains: GRAIN_DE_CALIBRATION[e.competence],
    }))
    .filter((c) => c.mesures < MESURES_DE_CALIBRATION)
    .sort((a, b) => a.mesures - b.mesures)
}

// ════════════════════════════════════════════════════════════════════════════
// LA LISTE DE PRIORITÉ — PA2, « construite UNE SEULE FOIS PAR CYCLE »
// ════════════════════════════════════════════════════════════════════════════

export interface EntreeDePriorite {
  competence: Competence
  regle: RegleCiblage
  motif: string
  /**
   * ⭐ `01-` §6 — LE GRAIN DE LA CALIBRATION, au segment 2 SEULEMENT : « micro et
   * méso pour l'Argumentation, la Structure et le Questionnement · MÉSO SEUL pour
   * l'Expression et la Synthèse ».
   *
   * ⛔ `ciblesDeCalibration` le calculait déjà, et `listeDePriorite` LE JETAIT :
   *   la borne n'a jamais mordu. Sans elle, PB1 prenant toujours le plus petit
   *   grain, la première semaine servait 14 à 19 micro-exercices de 2 à 8 minutes.
   * `undefined` hors calibration : le grain y relève des proportions du §7, qui
   * sont une préférence, jamais un filtre.
   */
  grains?: readonly Grain[]
  /**
   * ⭐ `01-` §4, couche 3 — les crans que le palier de CETTE cible peut recevoir.
   * C'est le seul volet DUR de la table (`cransDuPalier`) : « tout cran absent
   * d'une ligne vaut 0 % ». La distribution 80/20 qui l'accompagne n'est pas ici.
   */
  crans?: readonly string[]
}

export interface ContextePriorite {
  segment: number
  parcours: readonly Parcours[]
  historique: readonly Competence[]
  lettreExpression: Lettre
  exceptionExpression: boolean
  cyclesSansProgresExpression: number
  palierSynthese: Lettre
  cyclesDepuisR3: number
  K: number
  tirer: () => number
  nombreDeMesures: (c: Competence) => number
}

/**
 * `01-` §5, PA2 — « LA LISTE DE PRIORITÉ DES COMPÉTENCES, construite UNE SEULE
 * FOIS PAR CYCLE : filtre R0, FILTRE N3, puis R1, R2, R3 et la dette de
 * couverture de R5 ».
 *
 * L'ordre des filtres n'est pas décoratif : N3 s'exécute AVANT R2 (§8.4).
 */
export function listeDePriorite(
  etats: readonly EtatPourCiblage[], ctx: ContextePriorite,
): { liste: EntreeDePriorite[]; journal: Record<string, unknown> } {
  const apresR0 = filtreR0(etats)

  // ⭐ LES BORNES DE COUCHE 3 — le palier de LA CIBLE, jamais celui de l'élève.
  //   R0 garantit `lettre !== null` sur tout ce qui sort d'ici, donc la bande
  //   est toujours calculable.
  const cransDe = (c: Competence): readonly string[] | undefined => {
    const l = apresR0.find((e) => e.competence === c)?.lettre
    return l ? cransDuPalier(l) : undefined
  }

  // Le segment 2 a sa règle à lui, et elle écarte R1, R2 et R3.
  if (ctx.segment === 2) {
    const cibles = ciblesDeCalibration(apresR0, ctx.nombreDeMesures)
    return {
      liste: cibles.map((c) => ({ competence: c.competence, regle: 'calibration' as const,
        motif: `calibration : ${c.mesures} mesure(s), on vise ${MESURES_DE_CALIBRATION}.`,
        // ⭐ LA BORNE QUI SE PERDAIT : `ciblesDeCalibration` la rend, on la GARDE.
        grains: c.grains,
        crans: cransDe(c.competence) })),
      journal: { regle: 'calibration', ecartees: ['R1', 'R2', 'R3'] },
    }
  }

  const apresN3 = filtreN3(apresR0)
  const pool = ecarterLaConnaissance(apresN3) // R4
  const liste: EntreeDePriorite[] = []
  const journal: Record<string, unknown> = {}

  // R1 — le canal. Il ne se filtre JAMAIS par N3 : on le lit sur `apresR0`.
  const r1 = regimeR1(ctx.lettreExpression, ctx.exceptionExpression,
    ctx.cyclesSansProgresExpression, ctx.segment)
  journal.R1 = r1
  if (r1.actif && apresR0.some((e) => e.competence === 'expression')) {
    liste.push({ competence: 'expression', regle: 'R1', motif: r1.motif })
  }

  // R3 — la dette de Synthèse, avant R2 : c'est une insertion D'OFFICE.
  const r3 = insertionR3(ctx.cyclesDepuisR3, ctx.palierSynthese, r1.actif, ctx.tirer)
  journal.R3 = r3
  if (r3.insere && pool.some((e) => e.competence === 'synthese')) {
    liste.push({ competence: 'synthese', regle: 'R3', motif: r3.motif })
  }

  // R2 — le trio.
  const r2 = elireR2(pool, ctx.historique, ctx.parcours)
  journal.R2 = r2
  if (r2.cible && !liste.some((x) => x.competence === r2.cible)) {
    liste.push({ competence: r2.cible, regle: 'R2', motif: r2.motif })
  }

  // R5 — la dette de couverture. Elle INSCRIT, elle n'élit pas.
  const dettes = dettesDeR5(pool, ctx.historique, ctx.K)
  journal.R5 = { K: ctx.K, dettes }
  for (const d of dettes) {
    if (liste.some((x) => x.competence === d.competence)) continue
    liste.push({ competence: d.competence, regle: 'R5',
      motif: `dette de couverture : ${d.ancienneteEnExercices === Number.POSITIVE_INFINITY
        ? 'jamais ciblée' : `${d.ancienneteEnExercices} exercices`} sans être ciblée, K = ${ctx.K}.` })
  }

  // ⭐ La bande de crans s'attache à CHAQUE entrée, quelle que soit la règle qui
  //   l'a inscrite : elle dépend de la cible, pas de la règle.
  return { liste: liste.map((e) => ({ ...e, crans: cransDe(e.competence) })), journal }
}

/**
 * `01-` §5, PA3 — « une compétence EN PROGRESSION est inscrite UNE SECONDE FOIS,
 * EN FIN DE LISTE — AU PLUS UNE PAR CYCLE, la mieux placée dans l'ordre de
 * priorité. La seconde inscription n'est atteinte QUE SI LE BUDGET ÉPUISE LA
 * LISTE, donc la règle ne joue que dans les cycles longs. »
 */
export function secondeInscriptionPA3(
  liste: readonly EntreeDePriorite[], etats: readonly EtatPourCiblage[],
): EntreeDePriorite | null {
  for (const e of liste) {
    const etat = etats.find((x) => x.competence === e.competence)
    if (etat?.aProgresse) {
      // ⚠️ On RECOPIE l'entrée : la seconde inscription vise la même cible, donc
      //    les mêmes bornes de grain et de cran. Les reconstruire ici en ferait
      //    un second domicile.
      return { ...e, regle: 'PA3',
        motif: 'seconde inscription : au moins un observable est passé à acquis.' }
    }
  }
  return null
}
