// ============================================================================
// C4 · L2 — LES LETTRES (§9) : montée, descente, garde-fous.
// ----------------------------------------------------------------------------
// LA COUPURE QUI GOUVERNE TOUT CE FICHIER — « le plafond ancre + 2 borne
// L'AFFICHAGE, JAMAIS le ciblage ni la stagnation, qui lisent les valeurs non
// plafonnées ». D'où deux sorties, et jamais une seule :
//   · `lettre` — ce qui s'affiche, et ce que lisent les gardiens du §6 R2 et le
//     palier cible du §8.9 ;
//   · `valeurNonPlafonnee` — « la lettre que les règles du §9 donneraient SANS le
//     plafond, mêmes mesures » (§3). C'est elle que lit la stagnation (§8.2), et
//     elle qui sert de repli au signal de ciblage.
//
// LES QUATRE RÈGLES, dans l'ordre où elles s'appliquent :
//   1. la MONTÉE par la trajectoire — 2 mesures ≥ lettre+1 sur les 3 dernières OU
//      dans la fenêtre de montée (6 cycles). Jamais plus d'un palier à la fois.
//   2. la DESCENTE — PAR LES ANCRES UNIQUEMENT.
//   3. l'ANCRE FAIT FOI et réinitialise dans les deux sens : discordance ≥ 2
//      paliers → la lettre suit l'ancre ET un drapeau part. Jamais d'écrasement
//      silencieux.
//   4. le PLAFOND — ancre + 2 ; et « valeur initiale + 1 » tant qu'aucune ancre
//      réelle n'existe, où la descente est en outre IMPOSSIBLE et où AUCUN
//      drapeau de discordance ne se lève.
//
// ⭐ QUAND CHACUNE JOUE — et c'est la seule lecture où les deux clauses du §9
//    sont vraies ensemble. Les règles 1 et 4 tournent À CHAQUE CYCLE ; les règles
//    2 et 3 ne jouent QU'À L'ARRIVÉE D'UNE ANCRE.
//    Le cas « Le fort au mauvais jour » (Annexe A) l'impose : diagnostic raté à D,
//    plafond D + 2 = B, « sa trajectoire maison monte et BUTE AU PLAFOND ; AUCUN
//    DRAPEAU — c'est le comportement voulu, l'anti-inflation ; LA PREMIÈRE ANCRE
//    ou le diagnostic suivant RELÈVE LE PLAFOND ». Or buter au plafond, c'est
//    précisément se tenir à ancre + 2, donc à un écart de 2 : si la discordance
//    se mesurait à chaque cycle, ce cas lèverait le drapeau que la source lui
//    refuse. Le drapeau et la descente sont donc l'affaire de l'ancre QUI ARRIVE
//    — « l'ancre fait foi et RÉINITIALISE » —, le plafond celle des cycles qui
//    séparent deux ancres. *Lecture portée au relevé du lot.*
//
// ⚠️ L'ASYMÉTRIE DES SONDES : « une sonde réussie compte pour la montée ; une
//    sonde échouée NE COMPTE JAMAIS CONTRE LA LETTRE ». À ne pas confondre avec la
//    sonde de MONTÉE (§8.8, M-e), qui est neutre partout et déjà écartée des
//    mesures qui comptent (`mesure.ts`).
//
// ⚠️ `profil_provisoire` : « AUCUNE lettre ne s'affiche et AUCUNE escalade ne se
//    déclenche ». Le retour formatif, lui, est actif dès le premier exercice.
//
// Ce fichier est PUR.
// ============================================================================

import {
  CONFIRMATIONS_DE_CLOTURE, CYCLES_CADENCE_ANCRE, CYCLES_FENETRE_DE_MONTEE,
  DERNIERES_MESURES_POUR_MONTER, MESURES_POUR_MONTER, PALIERS_DE_DISCORDANCE,
  PLAFOND_INFLATION, PLAFOND_SANS_ANCRE,
} from './config'
import { estDeLaTrajectoire, estUneAncre, parDate, rangDeLaMesure, type Mesure } from './mesure'
import { PALIERS, palierDeRang, rangPalier, type Lettre, type Palier } from './types'

/** `07-` §1.3 — l'état affiché, plus ce que ce lot y ajoute (`lettreInitiale`). */
export interface EtatNiveau {
  lettre: Lettre
  /** `01-` §3 — la dernière ANCRE : sa date et sa valeur. Jamais la médiane d'un absent (§4). */
  ancreDerniereDate: string | null
  ancreDerniereValeur: Palier | null
  /**
   * `01-` §9 — « le plafond vaut VALEUR INITIALE + 1 » tant qu'aucune ancre réelle
   * n'existe. La valeur n'est nulle part dérivable — la ligne d'état est écrasée à
   * chaque écriture — donc elle se stocke. *Ajoutée par ce lot au `07-` §1.3,
   * depuis son relevé : le §1 est ouvert à l'implémentation.*
   */
  lettreInitiale: Palier | null
  profilProvisoire: boolean
  statutRecettePoseLe: string | null
}

/** Ce que le §9 rend — et il rend TOUJOURS les deux valeurs. */
export interface Verdict {
  /** Ce qui s'affiche. `null` sous `profil_provisoire`, ou faute de lettre. */
  lettre: Lettre
  /** `01-` §3 — non plafonnée par construction ; ciblage et stagnation lisent ELLE. */
  valeurNonPlafonnee: Lettre
  /** Le plafond effectif, ou `null` quand aucun ne s'applique. */
  plafond: Palier | null
  /** `01-` §9 — jamais d'écrasement silencieux. */
  drapeaux: string[]
  /** Ce que la règle a fait, pour le journal. */
  mouvement: 'aucun' | 'montee' | 'descente_par_ancre' | 'suit_ancre'
}

/**
 * `01-` §9 — le PLAFOND, et lequel des deux régimes s'applique.
 * « Compétence sans ancre réelle — un régime propre, JUSQU'À SA PREMIÈRE ANCRE
 *   VÉRITABLE » : plafond = valeur initiale + 1, descente impossible, aucun
 *   drapeau de discordance. *(Le cas naît au cold start, §4.)*
 */
export function plafondApplicable(etat: EtatNiveau): { plafond: Palier | null; sansAncre: boolean } {
  if (etat.ancreDerniereValeur) {
    return { plafond: palierDeRang(rangPalier(etat.ancreDerniereValeur) + PLAFOND_INFLATION),
      sansAncre: false }
  }
  if (etat.lettreInitiale) {
    return { plafond: palierDeRang(rangPalier(etat.lettreInitiale) + PLAFOND_SANS_ANCRE),
      sansAncre: true }
  }
  // Ni ancre ni valeur initiale : rien à plafonner, et rien à inventer.
  return { plafond: null, sansAncre: true }
}

/**
 * `01-` §9 — la MONTÉE par la trajectoire.
 * « 2 mesures dont la lettre-équivalente est ≥ lettre+1, SUR LES 3 DERNIÈRES **OU**
 *   dans la fenêtre de montée » — les deux fenêtres sont alternatives, jamais
 *   cumulatives. « Jamais plus d'un palier à la fois. »
 *
 * `cyclesEcoules` compte les cycles depuis chaque mesure : la fenêtre de montée
 * vaut 6 cycles, « soit 2 × la période du plancher de mesure — LES DEUX
 * PARAMÈTRES NE SE RÈGLENT JAMAIS SÉPARÉMENT » (d'où sa dérivation au `config.ts`).
 */
export function monteParTrajectoire(
  lettreCourante: Palier,
  mesures: readonly Mesure[],
  cyclesDepuis: (m: Mesure) => number,
): boolean {
  const seuil = rangPalier(lettreCourante) + 1
  if (seuil >= PALIERS.length) return false // A ne monte pas.

  // « La trajectoire, c'est tout ce qui n'est pas une ancre. »
  const trajectoire = parDate(mesures.filter(estDeLaTrajectoire))
  const compte = (lot: readonly Mesure[]) =>
    lot.filter((m) => { const r = rangDeLaMesure(m); return r !== null && r >= seuil }).length

  const troisDernieres = trajectoire.slice(-DERNIERES_MESURES_POUR_MONTER)
  if (compte(troisDernieres) >= MESURES_POUR_MONTER) return true

  const fenetre = trajectoire.filter((m) => cyclesDepuis(m) < CYCLES_FENETRE_DE_MONTEE)
  return compte(fenetre) >= MESURES_POUR_MONTER
}

/** Ce que l'appelant doit dire au §9 en plus des mesures. */
export interface ContexteLettre {
  /** Combien de cycles séparent une mesure du cycle en construction. */
  cyclesDepuis: (m: Mesure) => number
  /**
   * `01-` §9 — « une INCOHÉRENCE RÉPÉTÉE entre la restitution à chaud et le
   * squelette BLOQUE LA MONTÉE et lève aussi un drapeau professeur ».
   * Le constat se fait sur `exercices_metacognition`, hors de ce module.
   */
  incoherenceRepetee?: boolean
  /** Combien de cycles depuis la dernière ancre — pour le signal de cadence. */
  cyclesDepuisDerniereAncre?: number | null
  /**
   * `01-` §9 — L'ANCRE QUI VIENT D'ARRIVER, et elle seule fait jouer la descente
   * et la discordance : « l'ancre fait foi et RÉINITIALISE dans les deux sens ».
   * Entre deux ancres, seuls la montée et le plafond tournent (cf. l'en-tête, et
   * le cas « Le fort au mauvais jour »). Absente ou `null` = aucune ancre neuve
   * à ce cycle.
   */
  ancreNouvelle?: Palier | null
}

/**
 * `01-` §9 — le verdict complet sur une compétence.
 *
 * L'ordre importe : on calcule d'abord la valeur NON PLAFONNÉE (montée par la
 * trajectoire, descente par les ancres), puis on applique le plafond à
 * L'AFFICHAGE SEUL.
 */
export function jugerLaLettre(
  etat: EtatNiveau, mesures: readonly Mesure[], ctx: ContexteLettre,
): Verdict {
  const drapeaux: string[] = []
  // « LA PREMIÈRE ANCRE ou le diagnostic suivant RELÈVE LE PLAFOND » (Annexe A) :
  // l'ancre qui arrive à ce cycle est celle qui borne, avant même d'être écrite.
  const plafond = ctx.ancreNouvelle
    ? palierDeRang(rangPalier(ctx.ancreNouvelle) + PLAFOND_INFLATION)
    : plafondApplicable(etat).plafond

  // Sans lettre, rien ne se juge : « une compétence sans lettre n'est ni ciblable,
  // ni sondable, ni plafonnée, et n'entre dans aucun départage » (§3).
  if (!etat.lettre) {
    return { lettre: null, valeurNonPlafonnee: null, plafond, drapeaux, mouvement: 'aucun' }
  }

  let valeur: Palier = etat.lettre
  let mouvement: Verdict['mouvement'] = 'aucun'

  // ── 1. La montée par la trajectoire ──────────────────────────────────────
  if (ctx.incoherenceRepetee) {
    drapeaux.push(
      'Montée bloquée : la restitution à chaud et le squelette se contredisent de façon répétée. '
      + 'À regarder avant de faire bouger la lettre.')
  } else if (monteParTrajectoire(valeur, mesures, ctx.cyclesDepuis)) {
    valeur = palierDeRang(rangPalier(valeur) + 1) // jamais plus d'un palier à la fois
    mouvement = 'montee'
  }

  // ── 2 et 3. L'ancre QUI ARRIVE : la descente, et la discordance ──────────
  // « Sans ancre réelle : la DESCENTE EST IMPOSSIBLE, et AUCUN drapeau de
  //   discordance ne se lève » — le régime propre tient jusqu'à la première ancre
  //   véritable, celle-là comprise, qui l'en fait sortir.
  const nouvelle = ctx.ancreNouvelle ?? null
  if (nouvelle) {
    const ecart = Math.abs(rangPalier(valeur) - rangPalier(nouvelle))
    if (ecart >= PALIERS_DE_DISCORDANCE) {
      // « La lettre suit l'ancre ET un drapeau part — jamais d'écrasement silencieux. »
      drapeaux.push(
        `Discordance de ${ecart} paliers entre la trajectoire (${valeur}) et l'ancre qui vient `
        + `d'arriver (${nouvelle}). La lettre suit l'ancre. `
        + 'Aide extérieure ? stress ? conditions de passation ?')
      valeur = nouvelle
      mouvement = 'suit_ancre'
    } else if (rangPalier(nouvelle) < rangPalier(valeur)) {
      // « Descente : PAR LES ANCRES UNIQUEMENT. »
      valeur = nouvelle
      mouvement = 'descente_par_ancre'
    }
  }

  // ── 4. Le plafond — l'AFFICHAGE seul ────────────────────────────────────
  const valeurNonPlafonnee: Palier = valeur
  let affichee: Palier = valeur
  if (plafond && rangPalier(affichee) > rangPalier(plafond)) affichee = plafond

  // `01-` §9 — la cadence d'ancre manquée : SIGNAL NON BLOQUANT, et LA LETTRE NE
  // GÈLE PAS — « elle continue de monter jusqu'au plafond ancre + 2 ».
  const d = ctx.cyclesDepuisDerniereAncre
  if (typeof d === 'number' && d > CYCLES_CADENCE_ANCRE) {
    drapeaux.push(
      `Cadence d'ancre manquée : ${d} cycles sans mesure en classe sommative, quand le plan en `
      + `demande une tous les ${CYCLES_CADENCE_ANCRE}. Rien n'est bloqué et la lettre ne gèle pas.`)
  }

  // `01-` §9 — sous `profil_provisoire`, AUCUNE lettre ne s'affiche. La valeur non
  // plafonnée, elle, reste calculée : le ciblage et la stagnation la lisent.
  return {
    lettre: etat.profilProvisoire ? null : affichee,
    valeurNonPlafonnee,
    plafond,
    drapeaux,
    mouvement,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// La CLÔTURE DE LA CALIBRATION — « segment 2 seulement, l'exception meurt à la bascule »
// ════════════════════════════════════════════════════════════════════════════

/** Ce qu'une confirmation du segment 2 vaut, par rapport à la lettre du diagnostic. */
export type Confirmation = 'sous' | 'au_dessus' | 'concordante'

export interface ClotureCalibration {
  lettre: Lettre
  lettreInitiale: Palier | null
  mouvement: 'reste' | 'monte' | 'descend' | 'sans_lettre'
  motif: string
}

/**
 * `01-` §9 — « À la bascule, CHAQUE LETTRE EST JUGÉE UNE FOIS : elle RESTE par
 * défaut ; 2 confirmations concordantes SOUS la lettre → −1 palier ; 2 AU-DESSUS
 * → +1 palier ; jamais plus d'un palier. »
 *
 * ⚠️ « L'asymétrie des sondes tient : une sonde réussie vaut confirmation haute,
 *    une sonde ÉCHOUÉE NE COMPTE PAS POUR LA DESCENTE. »
 * ⚠️ « Une compétence SANS ANCRE RÉELLE garde son régime, et les confirmations
 *    hautes la montent DANS SON PLAFOND. »
 * ⚠️ « Une compétence SANS LETTRE n'en reçoit pas ici : sa première lettre vient
 *    de sa première ancre (§10). »
 */
export function cloturerLaCalibration(
  etat: EtatNiveau,
  mesuresDuSegment: readonly Mesure[],
  /** Vrai quand la mesure est une sonde SECONDAIRE (§8.9), et qu'elle a échoué. */
  estSondeEchouee: (m: Mesure) => boolean,
): ClotureCalibration {
  if (!etat.lettre) {
    return { lettre: null, lettreInitiale: etat.lettreInitiale, mouvement: 'sans_lettre',
      motif: 'Aucune lettre au diagnostic : la première viendra de la première ancre.' }
  }

  const rang = rangPalier(etat.lettre)
  let sous = 0
  let auDessus = 0
  for (const m of mesuresDuSegment) {
    const r = rangDeLaMesure(m)
    if (r === null) continue
    if (r > rang) auDessus++
    else if (r < rang && !estSondeEchouee(m)) sous++
  }

  const { plafond } = plafondApplicable(etat)

  if (auDessus >= CONFIRMATIONS_DE_CLOTURE) {
    let monte = palierDeRang(rang + 1)
    if (plafond && rangPalier(monte) > rangPalier(plafond)) monte = plafond
    return { lettre: monte, lettreInitiale: etat.lettreInitiale ?? etat.lettre, mouvement: 'monte',
      motif: `${auDessus} confirmations au-dessus de ${etat.lettre} pendant la calibration.` }
  }
  if (sous >= CONFIRMATIONS_DE_CLOTURE) {
    return { lettre: palierDeRang(rang - 1), lettreInitiale: etat.lettreInitiale ?? etat.lettre,
      mouvement: 'descend',
      motif: `${sous} confirmations sous ${etat.lettre} pendant la calibration `
        + '(les sondes échouées ne comptent pas).' }
  }
  return { lettre: etat.lettre, lettreInitiale: etat.lettreInitiale ?? etat.lettre,
    mouvement: 'reste',
    motif: `Le diagnostic tient : ${auDessus} confirmation(s) au-dessus, ${sous} sous.` }
}

/** `01-` §10 — la médiane de classe d'un absent NE S'ÉCRIT JAMAIS dans `derniere_ancre`. */
export function medianeDeClasse(lettres: readonly Palier[]): Palier | null {
  const rangs = lettres.map(rangPalier).sort((a, b) => a - b)
  if (rangs.length === 0) return null
  return palierDeRang(rangs[Math.floor((rangs.length - 1) / 2)])
}

/** `01-` §9 — l'ancre la plus récente d'un lot de mesures, s'il y en a une. */
export function derniereAncre(mesures: readonly Mesure[]): Mesure | null {
  const ancres = parDate(mesures.filter(estUneAncre))
  return ancres[ancres.length - 1] ?? null
}
