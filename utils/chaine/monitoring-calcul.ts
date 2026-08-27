// ============================================================================
// C4 · L5 — LE MONITORING : le juge de cette compétence est LE CODE.
// ----------------------------------------------------------------------------
// « Il n'y a PAS de phase de jugement pour le Monitoring : le juge de cette
//   compétence est le code. »           — `competences/monitoring.md` §7
//
// « Le Monitoring tourne EN DERNIER, jamais en parallèle : `calibration` ingère
//   les sorties de jugement des autres axes. »          — §2, §7 ; `07-` §1.4
//
// Ce module est PUR — il ne fait que compter et comparer. L'appel d'extraction,
// les écritures et l'ordre d'exécution vivent dans `monitoring.ts`.
//
// ⚠️ « Tant que la table de conversion n'est pas écrite, le calcul rend `n/a` »
//    — sur l'amplitude, sur la direction et sur la calibration (§7 ; §9 ;
//    PROMPT, piège 42). CE N'EST PAS UN TROU : `n/a` est une valeur déclarée
//    dans l'échelle, et le jour où la table arrive, le calcul cesse de la rendre.
//    « `indetermine` est autre chose et n'attend rien » : il dit qu'un CÔTÉ DE
//    LA COMPARAISON manquait, ce qui restera vrai après la table.
// ============================================================================

import { calculerScoreBrier } from '../brier'
import type { Competence, Palier } from './types'

/** `competences/monitoring.md` §2 — les listes fermées, telles que le catalogue les porte. */
export type Aveu = 'signale' | 'tout_lisse'
export type Supposition = 'distingue' | 'tout_assertif'
export type Confiance = 'elevee' | 'moyenne' | 'faible' | 'non_exprimee'

/** §2 — la valeur `n/a` est déclarée dans l'échelle, comme les autres. */
export const NA = 'n/a' as const
export type Calibration = 'bien_calibre' | 'surconfiant' | 'sous_confiant' | 'indetermine' | typeof NA
export type Amplitude = 0 | 1 | 2 | 3 | typeof NA
export type Direction = 'surconfiance' | 'sous_confiance' | typeof NA | null

/**
 * La table de conversion vers l'amplitude — §9 : elle se règle sur la collecte
 * 2026-27, avec TROIS TROUS nommés. Tant qu'elle est absente, tout rend `n/a`.
 *
 * Le drapeau vit ici, dans le code, et non en configuration : le jour où la
 * table existe, ce n'est pas un réglage qu'on bascule, c'est un calcul qu'on
 * écrit — et il s'écrira sous ce nom.
 */
export const TABLE_DE_CONVERSION_ECRITE: boolean = false

// ── La calibration — dérivée, de trois sources (§4) ──────────────────────────

export interface EntreeCalibration {
  competence: Competence
  /** Ce que l'élève a déclaré à la remise. `null` = il n'a rien déclaré. */
  confiance: Confiance | null
  /** Le niveau que l'instrument de la compétence a rendu. `null` = aucun niveau. */
  niveau: Palier | null
  /**
   * §7, troisième cas : « l'élève, à une question "se juger", affirme un
   * observable QUE LE SQUELETTE NE PORTE PAS DU TOUT ».
   */
  affirmeUnObservableAbsent?: boolean
}

export interface ResultatCalibration {
  calibration: Calibration
  amplitude: Amplitude
  direction: Direction
  /** Le motif, quand le verdict n'est pas composé. Il se journalise, il ne se tait pas. */
  motif: string | null
}

/**
 * §7 — « `indetermine` se rend chaque fois qu'UN CÔTÉ DE LA COMPARAISON MANQUE.
 * Trois cas […]. La règle est la même dans les trois : un côté manquant ne
 * produit JAMAIS de verdict, et surtout jamais un "surconfiant" injuste fabriqué
 * par un faux négatif d'extraction. »
 */
export function calibrationDe(e: EntreeCalibration): ResultatCalibration {
  if (e.confiance == null || e.confiance === 'non_exprimee') {
    return { calibration: 'indetermine', amplitude: NA, direction: NA, motif: "l'élève n'a pas déclaré sa confiance" }
  }
  if (e.niveau == null) {
    return { calibration: 'indetermine', amplitude: NA, direction: NA, motif: "l'instrument de la compétence n'a rendu aucun niveau" }
  }
  if (e.affirmeUnObservableAbsent) {
    return { calibration: 'indetermine', amplitude: NA, direction: NA, motif: "l'élève affirme un observable que le squelette ne porte pas" }
  }
  if (!TABLE_DE_CONVERSION_ECRITE) {
    // Les deux côtés sont là : la comparaison EST possible, c'est sa conversion
    // vers l'échelle qui ne l'est pas encore. On collecte, on ne convertit pas.
    return { calibration: NA, amplitude: NA, direction: NA, motif: 'table de conversion non écrite (fiche §9)' }
  }
  /* c8 ignore next */
  throw new Error('La table de conversion est déclarée écrite mais son calcul n\'existe pas encore.')
}

/**
 * §1.4 — « Sa validité est plafonnée par celle des compétences couvertes : la
 * calibration NE COMPTE QUE SUR LES `evaluee`, et `competences_couvertes[]`
 * enregistre LESQUELLES ont compté — faute de quoi on ne saura jamais relire la
 * mesure. »
 */
export function competencesQuiComptent(
  entrees: readonly EntreeCalibration[],
  statutRecette: Readonly<Record<string, string>>,
  /**
   * ⭐⭐ C5-L3 — LES COMPÉTENCES QUI ONT RÉELLEMENT MESURÉ, par leur seule marque
   *    fiable : **la présence de la CLÉ** dans `niveauxObtenus`. Une compétence
   *    mesurée sans lettre y a sa clé avec `null` ; une compétence **écartée**
   *    n'y est **pas du tout**. *Distinguer « mesurée sans lettre » de « jamais
   *    mesurée » ne se fait qu'ainsi — comparer la valeur les confondrait.*
   *
   * ⚠️ Omis, le contrôle ne s'applique pas : c'est le comportement d'avant, et
   *    il vaut pour tout appelant qui n'a pas de chaîne derrière lui.
   */
  mesurees?: Readonly<Record<string, unknown>>,
): { retenues: EntreeCalibration[]; ecartees: Array<{ competence: Competence; motif: string }> } {
  const retenues: EntreeCalibration[] = []
  const ecartees: Array<{ competence: Competence; motif: string }> = []
  for (const e of entrees) {
    if (statutRecette[e.competence] !== 'evaluee') {
      ecartees.push({ competence: e.competence, motif: `statut de recette « ${statutRecette[e.competence] ?? 'inconnu'} », pas evaluee` })
      continue
    }
    // ⛔⛔ C5-L3 — ET LA COMPÉTENCE DOIT AVOIR MESURÉ. « Sa validité est plafonnée
    //    par celle des compétences couvertes […] `competences_couvertes[]`
    //    enregistre LESQUELLES ONT COMPTÉ — faute de quoi on ne saura jamais
    //    relire la mesure » (`07-` §1.4).
    //
    // ⚠️⚠️ TROUVÉ EN PRODUCTION LE 27/08, SUR TREIZE COPIES RÉELLES, et c'est un
    //    défaut que le bac à sable NE POUVAIT PAS montrer : là-bas le Monitoring
    //    ne produisait aucune ligne, et le contrôle qui l'affirmait passait donc
    //    **à vide**. En prod, `argumentation` et `structure` — écartées par la
    //    porte de mode, ni squelette ni mesure ni appel payé — **figuraient quand
    //    même dans `competences_couvertes`**, avec un `niveau` à `null` : la
    //    calibration comparait une confiance déclarée à un niveau qui n'existait
    //    pas, et la ligne prétendait couvrir ce qu'elle n'avait pas mesuré.
    //
    // ⭐ La cause est plus large que la porte, et le correctif aussi : les
    //    entrées viennent de `ctx.confianceDeclaree` — ce que l'ÉLÈVE a déclaré à
    //    la remise —, et rien ne garantit que la chaîne ait mesuré ce qu'il a
    //    déclaré. *L'écran filtre désormais, mais une remise ANTÉRIEURE à ce
    //    filtre porte quatre déclarations pour deux mesures.*
    if (mesurees !== undefined && !(e.competence in mesurees)) {
      ecartees.push({
        competence: e.competence,
        motif: 'la chaîne ne l\'a pas mesurée sur ce dépôt — elle ne peut pas compter dans la '
          + 'calibration, ni entrer dans `competences_couvertes[]` (07- §1.4)',
      })
      continue
    }
    retenues.push(e)
  }
  return { retenues, ecartees }
}

// ── La porte 2 — l'accord entre la crédence et la réussite (§4) ──────────────

/**
 * La crédence prend la forme des distracteurs (`02-` §5) : aux crans GUIDÉS, une
 * répartition de jetons sur 100 entre QUATRE candidats ; aux crans nommés,
 * aveugles et fin, un POURCENTAGE UNIQUE sur sa propre réponse.
 */
export type Credence =
  | { forme: 'repartition'; jetons: [number, number, number, number]; indexCorrect: number }
  | { forme: 'pourcentage'; pourcentage: number; reussi: boolean }

/**
 * Ce que la porte 2 verse au Monitoring : LES INGRÉDIENTS, jamais le verdict.
 *
 * ⚠️ La fiche §4 dit « *sûr et juste → bien calibré · sûr et faux → surconfiant ·
 *    hésitant et juste → sous-confiant* » — et RIEN DE PLUS : aucun chiffre ne
 *    dit où commence « sûr », ni où finit « hésitant ». Poser 0,7 et 0,4 aurait
 *    été inventer deux seuils que rien ne nomme (piège 5), dans le seul
 *    instrument dont la fiche répète que « l'année 2026-27 est l'épreuve » et
 *    que sa table de conversion n'est pas écrite (§9).
 *
 *    On conserve donc les DEUX CÔTÉS de la comparaison — la crédence portée par
 *    la réponse donnée, et sa justesse — plus le score de Brier, qui est
 *    dénombrable et que la fiche nomme. Le label se calculera le jour où la
 *    table existera, rétroactivement : « collecter d'abord, convertir ensuite ».
 */
export interface AccordPorte2 {
  /** ∈ [-10, +10], à l'échelle de `utils/brier.ts` — un lot réutilise. */
  score: number
  /** La part de crédence que l'élève a mise sur la réponse qu'il a donnée. */
  credence_portee: number
  reussi: boolean
}

/**
 * L'accord crédence ↔ réussite. « La compétence IGNORE la crédence : la donnée
 * versée au Monitoring est donc NEUVE, jamais un décalque » (§4).
 */
export function accordCredenceReussite(c: Credence): AccordPorte2 {
  if (c.forme === 'repartition') {
    const total = c.jetons.reduce((a, b) => a + b, 0) || 100
    // « Le candidat LE PLUS CHARGÉ **est** la réponse (→ compétence), la
    //   distribution **est** la crédence (→ Monitoring) » (fiche §2).
    const max = Math.max(...c.jetons)
    const choisi = c.jetons.indexOf(max)
    return {
      score: calculerScoreBrier(c.jetons, c.indexCorrect),
      credence_portee: max / total,
      reussi: choisi === c.indexCorrect,
    }
  }
  const p = Math.min(1, Math.max(0, c.pourcentage / 100))
  const bs = Math.pow(p - (c.reussi ? 1 : 0), 2)
  return {
    score: Math.round((1 - 2 * bs) * 10 * 1000) / 1000,
    credence_portee: p,
    reussi: c.reussi,
  }
}

// ── La lucidité — un taux sur fenêtre, à dénominateur restreint (§3) ─────────

/** §3, acté — « la fenêtre vaut 5 exercices, comptés en exercices et jamais en cycles ». */
export const FENETRE_LUCIDITE = 5

export interface ExerciceDeLaFenetre {
  /** Le squelette montre-t-il un échec sur AU MOINS UN observable ? */
  auMoinsUnEchec: boolean
  aveu: Aveu | null
  supposition: Supposition | null
}

/**
 * « Parmi les exercices de la fenêtre où le squelette montre un échec sur au
 * moins un observable, dans combien l'élève a-t-il signalé un incompris OU
 * marqué une supposition ? » (§3)
 *
 * ⚠️ « Le dénominateur restreint est essentiel : l'élève qui "lisse tout" et n'a
 *    rien raté a un dénominateur vide → TAUX NULL, JAMAIS 0. Pas un mauvais
 *    score » (§3 ; `07-` §1.4).
 */
export function tauxDeLucidite(
  fenetre: readonly ExerciceDeLaFenetre[],
): { taux: number | null; denominateur: number; numerateur: number } {
  const retenus = fenetre.slice(-FENETRE_LUCIDITE).filter((e) => e.auMoinsUnEchec)
  const numerateur = retenus.filter((e) => e.aveu === 'signale' || e.supposition === 'distingue').length
  const denominateur = retenus.length
  return { taux: denominateur === 0 ? null : numerateur / denominateur, denominateur, numerateur }
}

// ── Le catalogue — « une valeur hors liste fermée : alerte, jamais de défaut » ─

export function dansLeCatalogue(
  valeur: unknown,
  liste: ReadonlyArray<string | number>,
): boolean {
  return liste.includes(valeur as string | number)
}
