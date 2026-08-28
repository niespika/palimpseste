// ============================================================================
// C4 · L2 — LES CHIFFRES ARRÊTÉS. Un domicile, et un seul.
// ----------------------------------------------------------------------------
// « *provisoire, réglage empirique* NE VEUT PAS DIRE NÉGOCIABLE EN SÉANCE » : les
// tables du §4, X, Y, T et p (§7), les plafonds et seuils du §5, du §8.9 et du §9
// s'implémentent TELS QUELS. Chaque valeur cite la section qui la porte, et la
// source a raison contre ce fichier.
//
// DEUX valeurs seulement sont déclarées RÉGLAGES, et elles ne sont pas ici :
// le seuil de « semaine faite » et la borne basse de la frise — « jamais une
// constante en dur » (`06-` §5). Elles vivent en configuration : `assiduite.ts`.
//
// Les BUDGETS par situation sont un cas mitoyen : ce sont des valeurs PAR DÉFAUT
// « réglables par élève et par lot » (`01-` §4, couche 0) — proposées, jamais
// imposées. Le défaut est ici, la valeur réglée vit sur l'élève : `budget.ts`.
//
// Ce fichier est PUR : que des constantes et des lectures de table.
// ============================================================================

import type { CodeCran, Grain, Palier, Segment, ZoneCran } from './types'

// ════════════════════════════════════════════════════════════════════════════
// §4, couche 0 — LE BUDGET, propriété de l'ÉLÈVE et jamais de la classe
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §4 — les trois situations, et elles seules : « on ne traitera que de ces cas ». */
export type Situation = 'tc_seul' | 'hlp_seul' | 'bi_classe'

export interface BudgetMinutes { plancher: number; plafond: number; optionnel: number }

/** `01-` §4, couche 0 — *provisoire (réglage empirique)*, réglable par élève et par lot. */
export const BUDGET_PAR_DEFAUT: Record<Situation, BudgetMinutes> = {
  tc_seul: { plancher: 45, plafond: 60, optionnel: 30 },
  hlp_seul: { plancher: 60, plafond: 90, optionnel: 30 },
  bi_classe: { plancher: 90, plafond: 120, optionnel: 30 },
}

/** `01-` §5, PB6 — « le plus petit exercice du dispositif dure 5 minutes ». */
export const RELIQUAT_PERDU_MIN = 5

// ════════════════════════════════════════════════════════════════════════════
// §4, couche 1 — LES PROPORTIONS DE GRAIN, par segment × palier de la CIBLE
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §4 — « les neuf valeurs sont ARRÊTÉES ». Le palier qui indexe est celui de la CIBLE. */
export type BandePalier = 'E-D' | 'C' | 'B-A'

/** `01-` §4 — « le micro n'est jamais PROGRAMMÉ chez B-A » : N1 l'y injecte à la demande. */
export const MICRO_N1_SEUL = 'n1_seul' as const

export type PartGrain = Record<Grain, number | typeof MICRO_N1_SEUL>

export const PROPORTIONS_GRAIN: Record<3 | 4 | 5, Record<BandePalier, PartGrain>> = {
  3: {
    'E-D': { micro: 0.60, meso: 0.40, macro: 0 },
    C: { micro: 0.40, meso: 0.50, macro: 0.10 },
    'B-A': { micro: MICRO_N1_SEUL, meso: 0.60, macro: 0.40 },
  },
  4: {
    'E-D': { micro: 0.40, meso: 0.50, macro: 0.10 },
    C: { micro: 0.25, meso: 0.50, macro: 0.25 },
    'B-A': { micro: MICRO_N1_SEUL, meso: 0.45, macro: 0.55 },
  },
  5: {
    'E-D': { micro: 0.25, meso: 0.50, macro: 0.25 },
    C: { micro: 0.15, meso: 0.40, macro: 0.45 },
    'B-A': { micro: MICRO_N1_SEUL, meso: 0.30, macro: 0.70 },
  },
}

/** `01-` §4 — la bande de la table du grain : trois bandes, B et A confondus. */
export function bandeDuPalier(p: Palier): BandePalier {
  if (p === 'E' || p === 'D') return 'E-D'
  if (p === 'C') return 'C'
  return 'B-A'
}

/**
 * `01-` §4 — les trois invariants « que les chiffres ne font que réaliser ».
 * Ils se vérifient, ils ne se recodent pas : la table les porte déjà.
 */
export const INVARIANTS_GRAIN = {
  microJamaisProgrammeChezBA: true,
  macroChezEDSeulementDesLeSegment4: true,
  plancherMacroSegment5: 0.25,
} as const

// ════════════════════════════════════════════════════════════════════════════
// §4, couche 3 — L'INDEXATION DU CRAN SUR LE PALIER
// « Une DISTRIBUTION, pas une assignation » · « en noms de crans, jamais en numéros »
// ════════════════════════════════════════════════════════════════════════════

/** Une bande de palier, zone par zone. « Tout cran absent d'une ligne vaut 0 %. » */
export interface BandeCrans {
  sous_la_bande: { crans: CodeCran[]; part: number }
  centre: { crans: CodeCran[]; part: number }
  au_dessus: { crans: CodeCran[]; part: number }
}

/**
 * `01-` §4, couche 3 — quatre paliers, et B et A y sont SÉPARÉS : « B sonde
 * encore et A ne sonde plus ». La zone haute est celle des sondes de montée (M-b).
 */
export const BANDES_CRANS: Record<Palier, BandeCrans> = {
  E: {
    sous_la_bande: { crans: [], part: 0 },
    centre: {
      crans: ['diagnostic_guide', 'production_guidee', 'transformation_guidee',
        'diagnostic_nomme', 'transformation_nommee'],
      part: 0.80,
    },
    au_dessus: {
      crans: ['production_etayee', 'transformation_aveugle', 'production_autonome'],
      part: 0.20,
    },
  },
  // E et D partagent la même ligne — la table les écrit « E-D ».
  D: {
    sous_la_bande: { crans: [], part: 0 },
    centre: {
      crans: ['diagnostic_guide', 'production_guidee', 'transformation_guidee',
        'diagnostic_nomme', 'transformation_nommee'],
      part: 0.80,
    },
    au_dessus: {
      crans: ['production_etayee', 'transformation_aveugle', 'production_autonome'],
      part: 0.20,
    },
  },
  C: {
    sous_la_bande: { crans: ['diagnostic_nomme', 'transformation_nommee'], part: 0.20 },
    centre: { crans: ['production_etayee', 'transformation_aveugle'], part: 0.60 },
    au_dessus: { crans: ['production_autonome'], part: 0.20 },
  },
  B: {
    sous_la_bande: { crans: ['transformation_aveugle'], part: 0.30 },
    centre: { crans: ['production_autonome'], part: 0.60 },
    au_dessus: { crans: ['diagnostic_fin'], part: 0.10 },
  },
  A: {
    sous_la_bande: { crans: [], part: 0 },
    centre: { crans: ['production_autonome', 'diagnostic_fin'], part: 1.00 },
    // « A n'a pas de zone haute, et ce n'est pas un oubli » — sa montée passe au grain (M-c).
    au_dessus: { crans: [], part: 0 },
  },
}

/**
 * `01-` §4, couche 3 — **« TOUT CRAN ABSENT D'UNE LIGNE VAUT 0 % »**, et les deux
 * bornes que la source en tire sans les écrire : « `diagnostic_fin` n'est servi
 * qu'à partir de B », « `diagnostic_guide`, `production_guidee` et
 * `transformation_guidee` ne sortent pas d'E-D ».
 *
 * ⭐ C'est la SEULE part de la table qui soit une borne DURE. Le reste — 80/20
 *   chez E-D, 20/60/20 chez C — est une DISTRIBUTION sous contrôle de
 *   trajectoire (§7), qui se compte « en exercices sur l'ANNÉE dès le segment
 *   3 » : elle n'a donc pas sa place dans un filtre de sélection, et ce module
 *   ne la pose pas.
 * ⚠️ Le palier qui indexe est celui de LA COMPÉTENCE CIBLE, jamais « le palier
 *    de l'élève », qui n'existe pas : un élève est à B en Structure et à E en
 *    Questionnement, et reçoit les deux bandes la même semaine.
 */
export function cransDuPalier(palier: Palier): CodeCran[] {
  const b = BANDES_CRANS[palier]
  return [...b.sous_la_bande.crans, ...b.centre.crans, ...b.au_dessus.crans]
}

/** La zone d'un cran dans la bande d'un palier — `null` quand la ligne ne le porte pas (0 %). */
export function zoneDuCran(palier: Palier, cran: CodeCran): ZoneCran | null {
  const b = BANDES_CRANS[palier]
  if (b.sous_la_bande.crans.includes(cran)) return 'sous_la_bande'
  if (b.centre.crans.includes(cran)) return 'centre'
  if (b.au_dessus.crans.includes(cran)) return 'au_dessus'
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// §7 — LA PROPORTION DES MODES et son contrôle de trajectoire
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §7, étage 1 — « au moins X = 40 % des mesures portent un mode de l'échelle réceptive ». */
export const X_RECEPTIF = 0.40

/** `01-` §7, étage 1 — « au moins Y = 15 % portent `interroger` ». */
export const Y_INTERROGER = 0.15

/** `01-` §7 — « T se règle en RAPPORT à l'objectif, pas en points ». */
export const FACTEUR_T = 1.5

/** `01-` §7, étage 2 — « plancher p = 25 % par mode ». */
export const PLANCHER_MODE = 0.25

/** `01-` §7, étage 1 — l'échelle réceptive. `interroger` est HORS de l'échelle. */
export const ECHELLE_RECEPTIVE = ['restituer', 'expliquer', 'évaluer'] as const

/** `01-` §7, étage 2 — la table du groupe réceptif, centrée sur le palier de la CIBLE. */
export const PROPORTIONS_ECHELLE_RECEPTIVE: Record<Palier, Record<'restituer' | 'expliquer' | 'évaluer', number>> = {
  E: { restituer: 0.45, expliquer: 0.30, 'évaluer': 0.25 },
  D: { restituer: 0.45, expliquer: 0.30, 'évaluer': 0.25 },
  C: { restituer: 0.35, expliquer: 0.40, 'évaluer': 0.25 },
  B: { restituer: 0.27, expliquer: 0.38, 'évaluer': 0.35 },
  A: { restituer: 0.25, expliquer: 0.30, 'évaluer': 0.45 },
}

// ════════════════════════════════════════════════════════════════════════════
// §3 — LES DÉRIVÉES : « les valeurs sont ICI, ET NULLE PART AILLEURS »
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §3 — « la médiane des lettres-équivalentes des 3 dernières mesures du contexte ». */
export const MESURES_DU_SIGNAL = 3

/** `01-` §3 — « la fenêtre d'évidence : LES QUATRE DERNIÈRES MESURES », sondes de montée exclues. */
export const FENETRE_EVIDENCE = 4

// ════════════════════════════════════════════════════════════════════════════
// §6 — LE CIBLAGE
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §6, calibration — « jusqu'à en avoir AU MOINS TROIS chacune ». */
export const MESURES_DE_CALIBRATION = 3

/** `01-` §6, R1 — « cible primaire d'un exercice sur DEUX » tant qu'Expression ≤ D. */
export const PART_R1 = 1 / 2

/** `01-` §6, R1 — la borne d'`exception_expression` : « un sur TROIS », au palier D SEULEMENT. */
export const PART_R1_EXCEPTION = 1 / 3

/** `01-` §6, R1 — « au-delà de SIX CYCLES sans progrès ». Se compte en cycles, pas en mesures. */
export const CYCLES_SANS_PROGRES_EXCEPTION = 6

/** `01-` §6, R3 — la cadence C du palier de la Synthèse. Certitude à 2C. */
export const CADENCE_R3: Record<Palier, number> = { E: 4, D: 4, C: 4, B: 6, A: 8 }

/**
 * `01-` §6, R2 — l'ordre de levier, et son inversion nommée.
 * « Argumentation > Structure > Questionnement », inversé « quand les TROIS
 * lettres du trio sont ≥ B ».
 */
export const ORDRE_LEVIER = ['argumentation', 'structure', 'questionnement'] as const
export const ORDRE_LEVIER_INVERSE = ['questionnement', 'argumentation', 'structure'] as const

/** `01-` §6, R2 — le seuil d'entrée du Questionnement, lu sur la lettre AFFICHÉE des gardiens. */
export const GARDIENS_DU_QUESTIONNEMENT = ['argumentation', 'structure'] as const
export const SEUIL_ENTREE_QUESTIONNEMENT: Palier = 'C'

/** `01-` §6, R5 — « une mesure par compétence ciblée tous les TROIS cycles ». */
export const CYCLES_DU_PLANCHER_DE_MESURE = 3

// ════════════════════════════════════════════════════════════════════════════
// §8 — LA STAGNATION ET L'ESCALADE. « Les seuils se comptent en MESURES. »
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §8.2 — « acquis ≈ 2/3 sur la fenêtre d'évidence », sondes de montée exclues. */
export const SEUIL_ACQUISITION = 2 / 3

/** `01-` §8.3, précondition basse — « ou dont aucune mesure n'est réussie sur DEUX fenêtres ». */
export const FENETRES_SANS_REUSSITE = 2

/** `01-` §8.4 — « N1 après 3 mesures plates ». */
export const MESURES_N1 = 3

/** `01-` §8.4 — « N2 après 6 mesures malgré N1 ». N2 ne lit que les mesures `formatif`. */
export const MESURES_N2 = 6

/** `01-` §8.4 — « N3 : DOUBLE condition — 8 mesures plates ET au moins 5 SEMAINES depuis N1 ». */
export const MESURES_N3 = 8
export const SEMAINES_N3 = 5

/** `01-` §8.4 — « passé TROIS SEMAINES sans traitement, le dossier remonte en tête ». */
export const SEMAINES_RESIGNALEMENT_N3 = 3

/** `01-` §8.7 — le retour au défaut : « dès que les 2 DERNIÈRES MESURES portent un signal bon ». */
export const MESURES_RECEPTIVITE_RETROUVEE = 2

/** `01-` §8.8, M-d — « DEUX sondes de montée réussies à la même case déplacent la masse ». */
export const SONDES_MONTEE_POUR_DEPLACER = 2

// ── §8.7 — la table du registre : palier de la CIBLE × position de la case ──

/** `01-` §8.7 — le DÉFAUT, quand ni le statut de recette ni l'escalade ne parlent. */
export const REGISTRE_PAR_DEFAUT: Record<Palier, Record<ZoneCran, 'descriptif' | 'demonstratif' | 'interrogatif' | null>> = {
  E: { sous_la_bande: 'descriptif', centre: 'descriptif', au_dessus: 'demonstratif' },
  D: { sous_la_bande: 'descriptif', centre: 'descriptif', au_dessus: 'demonstratif' },
  C: { sous_la_bande: 'descriptif', centre: 'descriptif', au_dessus: 'demonstratif' },
  B: { sous_la_bande: 'descriptif', centre: 'descriptif', au_dessus: 'interrogatif' },
  // « A : rien n'existe au-dessus de `diagnostic_fin` — la montée d'A passe au grain. »
  A: { sous_la_bande: 'descriptif', centre: 'interrogatif', au_dessus: null },
}

// ════════════════════════════════════════════════════════════════════════════
// §8.9 — LA RÈGLE D'ESPACEMENT DES MESURES SECONDAIRES
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §8.9 — « plafond de sondes par cycle : 4. C'est lui qui borne la facture ». */
export const PLAFOND_SONDES_PAR_CYCLE = 4

/** `01-` §8.9, priorité 2 — « palier cible atteint, non vérifié depuis plus de 5 SEMAINES ». */
export const SEMAINES_SANS_VERIFICATION = 5

// ════════════════════════════════════════════════════════════════════════════
// §9 — LES LETTRES
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §9 — « 2 mesures ≥ lettre+1 SUR LES 3 DERNIÈRES ou dans la fenêtre de montée ». */
export const MESURES_POUR_MONTER = 2
export const DERNIERES_MESURES_POUR_MONTER = 3

/**
 * `01-` §9 — « la fenêtre de montée vaut 2 × la période du plancher de mesure,
 * soit 6 cycles — LES DEUX PARAMÈTRES NE SE RÈGLENT JAMAIS SÉPARÉMENT ».
 * D'où la dérivation, plutôt qu'un second chiffre à côté.
 */
export const CYCLES_FENETRE_DE_MONTEE = 2 * CYCLES_DU_PLANCHER_DE_MESURE

/** `01-` §9 — « la lettre ne monte pas au-delà de ancre + 2 ». Borne l'AFFICHAGE seul. */
export const PLAFOND_INFLATION = 2

/** `01-` §9 — sans ancre réelle : « le plafond vaut valeur initiale + 1 », descente impossible. */
export const PLAFOND_SANS_ANCRE = 1

/** `01-` §9 — « discordance ≥ 2 paliers → la lettre suit l'ancre ET un drapeau part ». */
export const PALIERS_DE_DISCORDANCE = 2

/** `01-` §9 — « une ancre par compétence `evaluee` tous les 6 cycles », portée par le plan. */
export const CYCLES_CADENCE_ANCRE = 6

/** `01-` §9, clôture de la calibration — « 2 confirmations concordantes → ±1 palier ». */
export const CONFIRMATIONS_DE_CLOTURE = 2

// ════════════════════════════════════════════════════════════════════════════
// §4 — le segment qui ouvre chaque régime
// ════════════════════════════════════════════════════════════════════════════

/** `01-` §6 — « R1 démarre au segment 3 ». `01-` §8.1 — les compteurs aussi. */
export const SEGMENT_OUVERTURE_DES_REGLES: Segment = 3

/** `01-` §6 — la règle de calibration : « segment 2 SEULEMENT ». */
export const SEGMENT_CALIBRATION: Segment = 2
