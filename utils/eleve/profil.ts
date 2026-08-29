// ============================================================================
// C6 · L2 — CE QUE L'ÉLÈVE VOIT DE LUI-MÊME. Les règles, pures.
// ----------------------------------------------------------------------------
// « Par défaut, sa trajectoire et sa cible — "travaillé quatre fois · en
//   progrès · prochaine étape : …". Les lettres et les courbes ne s'affichent
//   que s'il choisit de les afficher. » (`06-Palimpseste.md` §5)
//
// ⛔⛔ RR4 EST LA RÈGLE QUI COMMANDE TOUT CE FICHIER (`01-routeur.md` §12) :
//    « le retour ne révèle jamais les observables eux-mêmes. Il nomme un point
//      de travail et l'action qui le corrige ; il n'expose ni le nom des
//      observables, ni les seuils, ni ce qui fait basculer un palier. »
//    Et sa contrepartie positive : « ce que RR4 n'interdit pas : nommer les
//    DIMENSIONS, en langue élève ». **La coupure passe entre le barème et ce
//    qui doit se trouver dans une copie.**
//
//    ⭐ CONSÉQUENCE DE FORME, ET C'EST POURQUOI CE MODULE EXISTE : les types
//    d'ici ne portent AUCUN des six champs interdits d'`ObservableEleve`
//    (`code`, `sens`, `taux`, `tauxFenetre`, `reussies`/`denominateur`,
//    `serie`). La coupure est dans le TYPE, pas dans le JSX — un écran qui
//    oublierait un champ ne pourrait pas le trouver.
//
// ⚠️ CE FICHIER EST PUR — aucun `server-only`, aucun accès base. Le glob de
//    `npm test` est `utils/**/*.test.ts` : une règle posée sous `app/` ne
//    serait JAMAIS éprouvée, sans qu'aucun message ne le dise. Le lecteur, lui,
//    vit à `profil-serveur.ts`, à côté (modèle : `utils/assiduite/collecte.ts`).
//
// ⛔ AUCUNE RÈGLE N'EST RECOPIÉE ICI. `estAcquis`, `etatDesObservables`,
//    `ilYAProgression`, `ilYAStagnation`, `fenetreDEvidence` et
//    `mesuresQuiComptent` vivent chez `C4-L2` et s'importent. Ce module les
//    ASSEMBLE pour un écran ; il n'en réécrit pas une ligne.
// ============================================================================

import type { Competence } from '../chaine/types'
import { FENETRE_EVIDENCE } from '../routeur/config'
import { mesuresQuiComptent, parDate } from '../routeur/mesure'
import { fenetreDEvidence } from '../routeur/profil'
import {
  etatDesObservables, ilYAProgression, ilYAStagnation,
  type EtatObservable, type InstrumentLu,
} from '../routeur/observables'

/** Ce dont ces règles ont besoin d'une mesure — et rien de plus. */
export interface MesurePourLEleve {
  competence: string
  observables: Record<string, unknown> | null
  mesureAt: string
  sondeMontee: boolean
}

/** La correspondance, réduite à ce qui SORT à l'écran (`utils/deroule/rappel.ts`). */
export interface DimensionDite {
  observableCode: string
  /** ⚠️ `competences_correspondance.dimension_eleve` — le seul mot qui sort. */
  dimensionEleve: string
  ordre: number
}

// ════════════════════════════════════════════════════════════════════════════
// « EN PROGRÈS » — le deuxième mot, et le seul qui se CALCULE à la lecture
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ QUATRE ÉTATS, PAS DEUX — et le quatrième est l'absence.
 *
 * `01-` §5 PA3 renvoie au §8 : « progression au sens du §8 : AU MOINS UN
 * OBSERVABLE PASSE À ACQUIS ». Et le §8.2 pose la stagnation comme sa jumelle,
 * jamais comme son contraire : « aucun changement de statut sur la fenêtre ET
 * valeur de ciblage immobile ». Il reste donc un entre-deux — et, avant tout,
 * le cas où la fenêtre ne suffit pas à le dire.
 *
 * ⛔ « NE DIS JAMAIS "EN PROGRÈS" PAR DÉFAUT. » Au 28/08/2026, AUCUNE paire
 *    (élève × compétence) n'atteint la fenêtre de quatre : production, 162
 *    paires — 147 à une mesure, 14 à deux, 1 à trois, ZÉRO à quatre ; bac à
 *    sable, 3 paires à une mesure. `pas_assez_de_mesures` est donc l'état de
 *    TOUT LE MONDE à la rentrée, et un mot qui ne se lève jamais doit DIRE
 *    POURQUOI, pas disparaître.
 */
export type EtatDeProgression =
  | 'progres'
  | 'stagnation'
  | 'ni_progres_ni_stagnation'
  | 'pas_assez_de_mesures'

export interface Progression {
  etat: EtatDeProgression
  /** Le nombre de mesures QUI COMPTENT — c'est le `n` de « travaillé N fois ». */
  n: number
  /** Combien il en manque pour que la question ait un sens. 0 dès que la fenêtre est pleine. */
  manquePourLeDire: number
  /** Pour la trace serveur — jamais pour l'élève. */
  motif: string | null
}

/**
 * ⭐⭐ CE QUE L'ÉCRAN A LE DROIT DE FAIRE, ET QUE LE MOTEUR N'A PAS : CALCULER LA
 *     PROGRESSION À LA LECTURE.
 *
 * `utils/moteur/cycle-serveur.ts` pose `aProgresse: false` en dur, et c'est un
 * REFUS D'AFFIRMER, déjà déposé (`C4L12-23`) : « `aProgresse: true` sans
 * instrument ferait POSER UN EXERCICE DE PLUS au nom d'un progrès que personne
 * n'a mesuré ». **Le motif du refus est une conséquence de ROUTAGE.**
 *
 * ⭐ Cet écran n'a aucune conséquence de ce genre : il dit un mot à l'élève, et
 *    il dit « pas encore » quand il ne sait pas. C'est le précédent de `C6-L1`,
 *    qui a calculé le drapeau de cadence d'ancre À LA LECTURE plutôt que de
 *    l'écrire.
 *
 * ⚠️ LA FENÊTRE « AVANT » EST CELLE DES MESURES QUI COMPTENT MOINS LA DERNIÈRE.
 *    `ilYAProgression` « se lit d'une fenêtre à la suivante, jamais dans
 *    l'absolu » : sans un avant et un après, la question n'a pas d'objet.
 *
 * ⚠️ IL FAUT LA FENÊTRE PLEINE, ET C'EST LA MÊME CONDITION QUE `C4L12-23` :
 *    « une fenêtre d'évidence remplie — quatre mesures d'une même compétence
 *    chez un même élève ». À trois mesures, l'« avant » n'en porte que deux :
 *    un observable pourrait « passer à acquis » par le seul effet du
 *    dénominateur qui grandit. Ce serait un progrès fabriqué par l'arithmétique.
 *
 * @param mesures            TOUTES les mesures de la compétence, brutes.
 * @param statutRecettePoseLe la borne de recette (`mesuresQuiComptent`).
 * @param instrument         ce que la fiche déclare ; `null` = compétence non
 *                           entrée dans la chaîne, et alors on s'abstient.
 * @param requis             les observables requis (`observablesRequis`).
 * @param valeurNonPlafonneeImmobile la seconde condition de la stagnation
 *                           (`01-` §8.2) — la valeur de ciblage n'a pas bougé.
 */
export function progressionALaLecture(
  mesures: readonly MesurePourLEleve[],
  statutRecettePoseLe: string | null,
  instrument: InstrumentLu | null,
  requis: readonly string[],
  valeurNonPlafonneeImmobile: boolean,
): Progression {
  const comptent = parDate(mesuresQuiComptent(mesures, statutRecettePoseLe))
  const n = comptent.length
  const manque = Math.max(0, FENETRE_EVIDENCE - n)

  if (!instrument || Object.keys(instrument.observablesMesure).length === 0) {
    return { etat: 'pas_assez_de_mesures', n, manquePourLeDire: manque,
      motif: 'aucun instrument ouvert : les taux ne se calculent pas, et un observable '
        + 'sans taux ne se classe pas (`01-` §8.2)' }
  }
  // ⛔ La fenêtre PLEINE, et pas « au moins deux mesures » : voir ci-dessus.
  if (n < FENETRE_EVIDENCE) {
    return { etat: 'pas_assez_de_mesures', n, manquePourLeDire: manque,
      motif: `${n} mesure(s) qui comptent : la fenêtre d'évidence en demande `
        + `${FENETRE_EVIDENCE} pour qu'un avant et un après existent` }
  }

  const apres = etatsSur(fenetreDEvidence(comptent), instrument, requis)
  const avant = etatsSur(fenetreDEvidence(comptent.slice(0, -1)), instrument, requis)

  if (ilYAProgression(avant, apres)) {
    return { etat: 'progres', n, manquePourLeDire: 0, motif: null }
  }
  if (ilYAStagnation(avant, apres, valeurNonPlafonneeImmobile)) {
    return { etat: 'stagnation', n, manquePourLeDire: 0, motif: null }
  }
  return { etat: 'ni_progres_ni_stagnation', n, manquePourLeDire: 0, motif: null }
}

const etatsSur = (
  fenetre: readonly MesurePourLEleve[], instrument: InstrumentLu, requis: readonly string[],
): EtatObservable[] =>
  // `etatDesObservables` ne lit que `observables` sur chaque mesure.
  etatDesObservables(fenetre as never, instrument, requis)

/**
 * La phrase que l'élève lit. ⛔ Elle ne porte AUCUN taux, AUCUN seuil, et elle
 * ne se tait jamais : « un mot qui ne se lève jamais doit dire pourquoi ».
 */
export function motDeLaProgression(p: Progression): string {
  switch (p.etat) {
    case 'progres': return 'en progrès'
    case 'stagnation': return 'sur un palier'
    case 'ni_progres_ni_stagnation': return 'en cours de travail'
    case 'pas_assez_de_mesures':
      return p.n === 0
        ? 'pas encore travaillé'
        : `pas encore assez d'exercices pour le dire (${p.n} sur ${FENETRE_EVIDENCE})`
  }
}

/** « Travaillé N fois » — un décompte RÉEL, jamais une confiance agrégée (`06-` §5). */
export function motDuDecompte(n: number): string {
  if (n === 0) return 'jamais travaillé'
  if (n === 1) return 'travaillé 1 fois'
  return `travaillé ${n} fois`
}

// ════════════════════════════════════════════════════════════════════════════
// LES TROIS CONDITIONS D'UNE LETTRE — et il les faut TOUTES LES TROIS
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ `07-` §5 (`competences_affichage_actif`, « les lettres sont-elles
 *    visibles ? ») · `01-` §9 (`profil_provisoire`, « tant qu'il est vrai,
 *    AUCUNE LETTRE NE S'AFFICHE ») · `06-` §5 (« c'est l'élève qui choisit d'en
 *    voir plus… le système ne le décide pas pour lui »).
 *
 * ⛔ ARBITRAGE ① DE LOUIS, 28/08 : sous `profil_provisoire`, SEULES LES LETTRES
 *    SE TAISENT. La trajectoire, la cible et « quoi travailler » s'affichent dès
 *    le premier jour. C'est la lecture du `01-` §9 — que le `06-` §5 cite comme
 *    son autorité.
 *
 * ⚠️ L'ORDRE COMPTE POUR CE QUE L'ÉCRAN DIT : sous `profil_provisoire`, la
 *    phrase est « ton profil se stabilise », jamais « les lettres sont fermées ».
 *    **L'élève n'a JAMAIS à connaître le nom d'un interrupteur** (`07-` §5).
 */
export type RaisonSansLettre = 'porte_fermee' | 'profil_provisoire' | 'choix_de_l_eleve' | null

export interface VerdictDeLettre {
  visible: boolean
  raison: RaisonSansLettre
  /** Ce que l'écran DIT — jamais le nom d'un interrupteur. */
  phrase: string | null
}

export function lettreVisible(
  affichageActif: boolean, profilProvisoire: boolean, choixDeLEleve: boolean,
): VerdictDeLettre {
  // ⚠️ L'ordre est celui de la CAUSE, pas celui du confort : une porte fermée
  //    par le professeur n'est pas la même chose qu'un profil qui se stabilise,
  //    et ni l'une ni l'autre n'est le choix de l'élève.
  if (!affichageActif) {
    return { visible: false, raison: 'porte_fermee',
      phrase: 'Les lettres ne sont pas ouvertes cette année pour l’instant.' }
  }
  if (profilProvisoire) {
    return { visible: false, raison: 'profil_provisoire',
      phrase: 'Ton profil se stabilise encore : les lettres arriveront quand il sera posé.' }
  }
  if (!choixDeLEleve) {
    return { visible: false, raison: 'choix_de_l_eleve', phrase: null }
  }
  return { visible: true, raison: null, phrase: null }
}

// ════════════════════════════════════════════════════════════════════════════
// LES FORCES — « ce qu'il réussit déjà », et le NOM seul
// ════════════════════════════════════════════════════════════════════════════

/**
 * `02-` §6.C — « SES FORCES DANS CES COMPÉTENCES : ce qu'il réussit déjà ».
 *
 * ⛔ « ACQUIS » N'EST PAS « RÉUSSI » : la réussite porte sur UNE mesure,
 *    l'acquisition sur LA FENÊTRE — « ne jamais les confondre »
 *    (`utils/routeur/observables.ts`). C'est donc `EtatObservable.acquis`, qui
 *    vient d'`estAcquis` (taux > 2/3 sur la fenêtre d'évidence), et rien d'autre.
 *
 * ⛔ ON REND LE NOM, JAMAIS LE TAUX. Et un observable SANS `dimension_eleve`
 *    est ÉCARTÉ ET SIGNALÉ, jamais rendu par son `code`, qui est la grille :
 *    « il n'a pas de nom pour lui » — le patron est `rappelDuTemps1`.
 */
export interface ForcesEtManques {
  /** Les dimensions acquises, dans l'ordre de la fiche. ⚠️ Des NOMS, rien d'autre. */
  forces: string[]
  /** Les codes élus dont la formulation manque en base — pour la trace, jamais l'écran. */
  formulationsManquantes: string[]
}

export function forcesDeLaCompetence(
  etats: readonly EtatObservable[], dimensions: readonly DimensionDite[],
): ForcesEtManques {
  return nommer(etats.filter((e) => e.acquis), dimensions)
}

/**
 * ⭐⭐ L'AMORCE DE LA PHRASE DES FORCES — et pourquoi ce n'est plus
 *     « Tu réussis déjà ».
 *
 * ⛔ LE DÉFAUT, VU À L'ÉCRAN (décor élève du 29/08) : « **Tu réussis déjà** tes
 *    raisons qui tournent en rond. » Un `dimension_eleve` nomme une DIMENSION,
 *    pas un verdict — et la moitié du corpus la nomme PAR SON DÉFAUT. Placé
 *    après un verbe de réussite, le libellé devient son propre contraire.
 *    Relevé aussi sur `charniere_formule` *(« les transitions toutes faites »)*,
 *    `apport_vide` *(« les formules qui ne tiennent rien »)*, `recadrage_verbal`
 *    *(« les questions de façade »)* et `garant_vague`.
 *
 * ⛔⛔ ET LA DIRECTION DE L'OBSERVABLE NE SUFFIT PAS À LES TRIER — c'est la
 *    fausse piste, et elle coûte cher si on la prend. Les libellés des
 *    observables `au_plus` / `moins_de` sont de **trois formes mêlées** :
 *      · le DÉFAUT      — `garant_circulaire` « tes raisons qui tournent en rond »
 *      · la DIMENSION   — `densite_friction` « la construction de tes phrases »
 *      · l'ALTERNATIVE  — `copie_verbatim`   « recopier, ou reformuler »
 *    Un « tu évites déjà » réservé aux négatifs réparerait la première forme et
 *    CASSERAIT la deuxième *(« tu évites déjà la construction de tes phrases »,
 *    « tu évites déjà la variété de ton vocabulaire »)*. Il n'existe aucun verbe
 *    juste pour les trois.
 *
 * ⭐ LA PARADE EST DE CADRER, PAS DE QUALIFIER. « Sur X » fait de `X` un SUJET
 *    et non un prédicat, et redevient donc juste quelle que soit la forme du
 *    libellé — « tu es au point **sur** tes raisons qui tournent en rond »,
 *    « **sur** la construction de tes phrases », « **sur** recopier, ou
 *    reformuler ». Aucun observable n'a besoin d'être classé, et une fiche qui
 *    reformule sa dimension demain ne rouvre pas le sujet.
 *
 * ⛔⛔ ET LA PRÉPOSITION DOIT SURVIVRE AU PASSAGE EN LISTE — c'est l'erreur que
 *    ce fichier a faite une fois, entre deux corrections du même jour. En
 *    passant l'énumération en puces, l'intitulé était devenu *« Ce que tu as
 *    tenu, comme d'habitude : »* — et **« ce que » est un objet direct** : la
 *    puce retombait dans la position exacte dont on venait de la sortir
 *    *(« tu as tenu tes raisons qui tournent en rond »)*. Le deux-points ne
 *    protège rien par lui-même.
 *    ⭐ **Un intitulé de liste de forces se termine donc par « sur : »**, jamais
 *       par « Ce que… : ». La règle vaut pour les deux écrans et pour le bilan.
 *    ⚠️ L'intitulé des MANQUES, lui, n'en a pas besoin : « Ce qui reste à
 *       travailler : » met la puce en position de SUJET *(« ta problématique
 *       reste à travailler »)*, et cette position-là est juste pour les trois
 *       formes. Les deux intitulés n'ont pas la même forme parce qu'ils n'ont
 *       pas la même syntaxe — pas par négligence.
 *
 * ⚠️ Le registre reste celui de `C6-L2` : on nomme ce qui va, jamais ce qui ne
 *    va pas. « Rien à te reprocher sur… » cadrerait aussi bien et a été écarté
 *    pour cela.
 */
export const INTITULE_DES_FORCES = 'Tu es au point sur :'

/**
 * Les forces d'une compétence, PRÊTES POUR UNE LISTE — et le seul endroit où
 * leur intitulé s'écrit.
 *
 * ⚠️ Il vivait en DEUX exemplaires — `app/eleve/moi/page.tsx` et
 *    `app/eleve/semaine/page.tsx` —, chacun avec sa propre jointure, et le
 *    défaut ci-dessus était donc à corriger deux fois. Un mot que l'élève lit
 *    n'a qu'un domicile, comme `motDeLaProgression` et `motDuDecompte`.
 *
 * ⭐ EN LISTE, PAS EN PHRASE, et ce n'est pas qu'une affaire de longueur : les
 *    libellés portent LEUR PROPRE PONCTUATION. `question_propre` finit par
 *    « ? » et `apport_decoratif` contient un « : » — enfilés à la virgule, la
 *    ponctuation de la liste et celle des libellés ne se distinguaient plus, et
 *    la phrase se coupait en deux au milieu. La puce rend chaque libellé
 *    VERBATIM, sans rien lui ajouter.
 *
 * @returns `null` quand il n'y a rien à dire — l'appelant n'affiche alors rien.
 */
export function listeDesForces(
  forces: readonly string[],
): { intitule: string; noms: string[] } | null {
  const noms = forces.map((f) => f.trim()).filter(Boolean)
  if (noms.length === 0) return null
  return { intitule: INTITULE_DES_FORCES, noms }
}

/**
 * ⛔⛔ CECI NE SE SERT QU'AU BILAN DE FIN (`02-` §6.C), JAMAIS AU RÉCAPITULATIF.
 *    « Le récapitulatif ne nomme AUCUNE faiblesse. Elles viennent au bilan, à la
 *    fin : les nommer d'entrée DONNERAIT À L'ÉLÈVE LA RÉPONSE À LA PHASE
 *    "SE JUGER", dont tout l'intérêt est qu'il la trouve seul. »
 *
 * ⚠️ Le motif est MÉCANIQUE, pas pédagogique : « se juger » est la matière du
 *    Monitoring. Un récapitulatif qui nomme la faiblesse FABRIQUE LA RÉPONSE et
 *    DÉTRUIT LA MESURE EN SILENCE — le régime exact du `07-` §3.
 *
 * ⚠️ « Sans taux » n'est pas « non acquis » : un observable que la fenêtre ne
 *    mesure pas ne se classe pas (`01-` §8.2). Il est écarté, pas compté faible.
 */
export function manquesDeLaCompetence(
  etats: readonly EtatObservable[], dimensions: readonly DimensionDite[],
): ForcesEtManques {
  return nommer(etats.filter((e) => !e.acquis && !e.sansTaux), dimensions)
}

/**
 * `45` — « CE QU'IL DOIT SURVEILLER » : LES DIMENSIONS QUE LA SEMAINE MESURE,
 * nommées en langue élève et SANS VERDICT (arbitrage ② de Louis, 28/08).
 *
 * ⛔ Jamais « tu es faible sur… », jamais un observable non acquis, jamais un
 *    taux : ce sont TOUTES les dimensions de la compétence, dans l'ordre de la
 *    fiche. C'est ce que la semaine REGARDE, pas ce qu'elle reproche.
 */
export function dimensionsRegardees(dimensions: readonly DimensionDite[]): string[] {
  return [...dimensions]
    .sort((a, b) => a.ordre - b.ordre)
    .map((d) => d.dimensionEleve.trim())
    .filter(Boolean)
}

function nommer(
  elus: readonly EtatObservable[], dimensions: readonly DimensionDite[],
): ForcesEtManques {
  const parCode = new Map(dimensions.map((d) => [d.observableCode, d]))
  const forces: Array<{ nom: string; ordre: number }> = []
  const formulationsManquantes: string[] = []
  for (const e of elus) {
    const d = parCode.get(e.code)
    // ⛔ « Ne lui invente pas de libellé, et ne lui sers pas son `code`. »
    if (!d || !d.dimensionEleve.trim()) { formulationsManquantes.push(e.code); continue }
    forces.push({ nom: d.dimensionEleve.trim(), ordre: d.ordre })
  }
  forces.sort((a, b) => a.ordre - b.ordre)
  return { forces: forces.map((f) => f.nom), formulationsManquantes }
}

// ════════════════════════════════════════════════════════════════════════════
// « PROCHAINE ÉTAPE » — le geste concret, et à quoi il se rattache
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️⚠️ UN RETOUR N'EST PAS PAR COMPÉTENCE, ET LE RATTACHER EST UN GESTE, PAS UNE
 *      LECTURE. `exercices_retours` est par DÉPÔT × MOMENT ; un dépôt peut
 *      mesurer plusieurs compétences. Le seul rattachement ÉCRIT est la cible
 *      primaire — `routeur_decisions.cible_retenue`, à défaut
 *      `exercices.cible_primaire` (`utils/deroule/mesure.ts`, ordre du `07-` §1.1).
 *
 * ⛔⛔ ET LES DEUX SONT VIDES — mesuré le 28/08/2026 : `routeur_decisions` compte
 *      0 ligne dans les deux bases, et `exercices.cible_primaire` est NULL sur
 *      251/251 en production et 259/261 en bac à sable. Mieux : les 14 retours
 *      PUBLIÉS de production portent tous un dépôt qui mesure DEUX OU TROIS
 *      compétences — aucun n'en mesure une seule. `competences_mesures.depot_id`
 *      ne peut donc pas non plus servir de rattachement : il en désignerait trois.
 *
 * ⭐ D'OÙ LA RÈGLE D'HONNÊTETÉ : « le dernier conseil que Calame t'a donné » est
 *    vrai ; « ton geste pour l'Argumentation » ne l'est pas si rien ne le dit.
 *    Le geste s'affiche donc SANS COMPÉTENCE tant que la cible n'est pas écrite,
 *    et AVEC quand elle l'est.
 */
export interface GesteConcret {
  /** Le texte, tel que la chaîne l'a écrit. ⛔ Ne le reformule pas. */
  texte: string
  /** `null` quand rien ne rattache le geste à une compétence — le cas de TOUS aujourd'hui. */
  competence: Competence | null
  /** `published_at` — un retour non publié ne se montre JAMAIS. */
  publieLe: string
  /** Où l'élève retourne le lire en entier. */
  href: string
}

export function phraseDuGeste(g: GesteConcret | null): string {
  if (!g) return 'Tu n’as pas encore reçu de retour : ta prochaine étape viendra avec lui.'
  return g.competence
    ? 'Ta prochaine étape, sur ' + g.competence + ' :'
    : 'Le dernier conseil que Calame t’a donné :'
}
