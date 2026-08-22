// ============================================================================
// C4 · L3 — L'ÉCHÉANCE DE LA VERSION FINALE, ET LE PLAFOND QUI LA ROGNE.
// Module PUR : aucune lecture en base, aucune I/O, aucun `Date.now()` implicite
// — l'instant, le fuseau et le réglage se PASSENT en argument.
// ----------------------------------------------------------------------------
// « La version finale se rend LE MÊME JOUR QUE LA V1 QUAND C'EST POSSIBLE,
//   SINON DANS LES TROIS À QUATRE JOURS — **ET JAMAIS À CHEVAL SUR DEUX
//   SEMAINES DE TRAVAIL**. *Acté sur le principe ; les modalités suivent
//   l'emploi du temps réel.* » (`06-` §2 ; `01-` §11.)
//
// ⭐ L'ÉCHÉANCE SE RÈGLE, ELLE NE SE GRAVE PAS EN DUR. Le délai vit en base —
//    `scriptorium_params.vf_delai_jours`, entier, défaut 3, borné 1..4 par
//    `params_vf_delai_chk` (migration `c4_l3_deroule.sql` §4). **Ce module le
//    REÇOIT ; il ne le lit jamais.** Un délai gravé ici rendrait le réglage
//    décoratif, et « les modalités suivent l'emploi du temps réel » deviendrait
//    faux le jour où le professeur change d'horaire.
//
// ⚠️ LE « JAMAIS À CHEVAL » N'EST PAS UN RÉGLAGE — c'est un PLAFOND que le code
//    applique PAR-DESSUS le délai, sur le calendrier réel. Le motif est de
//    MESURE, pas de confort : « un delta v1 → vf qui traverse une semaine ne
//    mesure plus la réception d'un retour, mais ce que l'élève a appris
//    entre-temps » (`01-` §11). `delta_v1_vf` est un observable du faisceau
//    (`06-` §6) — le laisser traverser une semaine ne le rend pas imprécis, il
//    le rend FAUX.
//
// ⭐ LE CYCLE **EST** LA SEMAINE DE TRAVAIL, ET IL COMMENCE LE LUNDI
//    (`01-` §1 ; `routeur_decisions.cycle_lundi`, dont la garde en base est
//    `check (extract(isodow from cycle_lundi) = 1)`).
//
// ⚠️ RIEN ICI NE BLOQUE. L'échéance S'AFFICHE et SE JOURNALISE ; **aucun dépôt
//    n'est refusé** parce qu'il la dépasse. Le retard est une mesure du
//    faisceau, jamais une porte fermée (`06-` §6 : « tous tagués, aucun
//    bloquant, jamais un verdict »).
//
// ⚠️ ON NE RÉÉCRIT PAS LE CALENDRIER. `lundiDuCycle` est la COMPOSITION de deux
//    fonctions qui existent déjà : `jourDansFuseau` (`utils/fuseau.ts`) dit
//    QUEL JOUR un instant fait à l'école, `lundiOnOrBefore`
//    (`utils/calendrier-grille.ts`) remonte au lundi de ce jour. Le dépôt tient
//    UNE SEULE numérotation lundi→dimanche ; une seconde, écrite ici, finirait
//    par diverger un jour de bascule d'heure — et deux calendriers qui ne
//    s'accordent pas donnent deux échéances pour le même dépôt.
//
// Règle projet appliquée sans exception : **les INSTANTS se lisent dans le
// fuseau, les DATES PURES restent en UTC.** `v1RemiseA`, `finDeSemaine` et
// l'échéance rendue sont des INSTANTS (`timestamptz`) ; le lundi rendu par
// `lundiDuCycle` est une DATE PURE, ancrée à minuit UTC — la forme exacte que
// `routeur_decisions.cycle_lundi` attend.
// ============================================================================

import { addDaysUTC, lundiOnOrBefore, toISODate } from '../calendrier-grille'
import { finDeJourDansFuseau, jourDansFuseau } from '../fuseau'

/** Un cycle fait sept jours, du lundi au dimanche (`01-` §1). */
export const JOURS_PAR_CYCLE = 7

const MS_PAR_JOUR = 86400000

// ════════════════════════════════════════════════════════════════════════════
// LE DÉLAI RÉGLÉ — son domaine vient de la source, pas de l'écran
// ════════════════════════════════════════════════════════════════════════════

/** Le plancher du réglage : « le même jour quand c'est possible » (`06-` §2). */
export const DELAI_VF_MIN = 1
/** Le plafond du réglage : « sinon dans les trois à QUATRE jours » (`06-` §2). */
export const DELAI_VF_MAX = 4
/** Le défaut, celui que la migration pose (`c4_l3_deroule.sql` §4). */
export const DELAI_VF_DEFAUT = 3

/**
 * ⚠️ Le délai reçu sort du domaine que la source pose et que la base garde.
 * On S'ARRÊTE : deviner un délai, c'est décider à la place du professeur du
 * temps qu'il laisse pour réviser.
 */
export class DelaiHorsDomaine extends Error {}

/**
 * Le réglage est-il dans le domaine de la source ? Miroir EXACT de
 * `params_vf_delai_chk` (`vf_delai_jours between 1 and 4`) — l'écran de réglage
 * s'en sert pour refuser une saisie AVANT que la base ne la refuse, et sans
 * jamais poser un second domaine à côté du premier.
 */
export function delaiRegleValide(delaiJours: number): boolean {
  return Number.isInteger(delaiJours)
    && delaiJours >= DELAI_VF_MIN && delaiJours <= DELAI_VF_MAX
}

// ════════════════════════════════════════════════════════════════════════════
// LA SEMAINE DE TRAVAIL — le lundi, et le dimanche soir
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ LE LUNDI DU CYCLE d'un instant — « le cycle EST la semaine de travail, et
 * il commence le lundi » (`01-` §1 ; garde en base sur
 * `routeur_decisions.cycle_lundi`).
 *
 * ⚠️ **Aucun calendrier n'est réécrit ici** : la fonction COMPOSE
 * `jourDansFuseau` (quel jour cet instant fait-il à l'école ?) et
 * `lundiOnOrBefore` (quel lundi ouvre la semaine de ce jour ?), toutes deux
 * déjà éprouvées ailleurs dans le dépôt.
 *
 * ⚠️ **Le fuseau décide.** Un dépôt du dimanche 20 h 30 à Toronto est le lundi
 * 00 h 30 UTC : lu en UTC il ouvrirait la semaine SUIVANTE, et le plafond du
 * « jamais à cheval » se tromperait de semaine sur tous les rendus du dimanche
 * soir — l'heure exacte à laquelle les élèves déposent.
 *
 * @param instant un INSTANT (`timestamptz`) — la remise, l'assignation, l'heure
 *                courante que l'appelant a lue.
 * @param fuseau  le fuseau de l'école, tel que `lireFuseau()` le rend.
 * @returns une DATE PURE ancrée à minuit UTC, dont le jour ISO vaut 1 (lundi).
 */
export function lundiDuCycle(instant: Date, fuseau: string): Date {
  return lundiOnOrBefore(jourDansFuseau(instant, fuseau))
}

/**
 * LA FIN DE LA SEMAINE DE TRAVAIL d'un instant : le DIMANCHE SOIR de son cycle,
 * 23 h 59 min 59 s à l'heure de l'école (`06-` §2, le plafond ; la forme d'une
 * date limite : `finDeJourDansFuseau`).
 *
 * ⭐ C'est la borne que `echeanceDeLaVersionFinale` attend en `finDeSemaine` —
 * offerte ici pour que chaque appelant ne la RECOMPOSE pas dans son coin (le
 * dépôt punit les doublons, et deux recompositions divergentes donneraient deux
 * échéances). ⚠️ **`echeanceDeLaVersionFinale` NE L'APPELLE PAS** : elle REÇOIT
 * sa borne et ne la devine jamais — un professeur peut vouloir la clore ailleurs
 * (« les modalités suivent l'emploi du temps réel »).
 *
 * ⚠️ Écrire la date pure telle quelle donnerait MINUIT UTC, soit 19 h ou 20 h la
 *    VEILLE à Toronto : quatre à cinq heures de rendus du dimanche soir comptés
 *    à cheval sur la semaine suivante.
 */
export function finDeSemaineDeTravail(instant: Date, fuseau: string): Date {
  const dimanche = toISODate(addDaysUTC(lundiDuCycle(instant, fuseau), JOURS_PAR_CYCLE - 1))
  return new Date(finDeJourDansFuseau(dimanche, fuseau))
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉCHÉANCE
// ════════════════════════════════════════════════════════════════════════════

/** Ce qu'il faut pour dater une version finale. Trois valeurs, toutes reçues. */
export interface DemandeEcheance {
  /** L'INSTANT de la remise de la v1 — `exercices_depots`, le fil du statut. */
  v1RemiseA: Date
  /** `scriptorium_params.vf_delai_jours`, tel quel. Jamais une constante d'écran. */
  delaiJours: number
  /**
   * La fin de la semaine de travail de la v1 — le dimanche soir de son cycle,
   * ou la borne que l'appelant lui donne. ⚠️ **Ne se devine pas ici** ;
   * `finDeSemaineDeTravail(v1RemiseA, fuseau)` la compose pour l'appelant.
   */
  finDeSemaine: Date
}

/** L'échéance servie à l'écran, et la trace de ce qui l'a produite. */
export interface EcheanceVersionFinale {
  /** L'INSTANT que l'écran affiche et que le journal garde. */
  echeance: Date
  /** Vrai quand le plafond a mordu — le délai nominal sortait de la semaine. */
  rognee: boolean
  /** Le motif, journalisable, qui CITE la règle. `null` quand rien n'a mordu. */
  motif: string | null
}

/**
 * ⭐ L'ÉCHÉANCE DE LA VERSION FINALE : le délai réglé, PUIS le plafond.
 *
 * « La vf se rend le même jour que la v1 quand c'est possible, sinon dans les
 * trois à quatre jours — et JAMAIS À CHEVAL SUR DEUX SEMAINES DE TRAVAIL »
 * (`06-` §2 ; `01-` §11).
 *
 * Deux temps, dans cet ordre et jamais l'inverse :
 *   1. l'échéance NOMINALE est `v1RemiseA + delaiJours` ;
 *   2. si elle DÉPASSE la fin de la semaine de travail de la v1, elle est
 *      **ROGNÉE à cette fin** — `rognee` vaut alors `true`.
 *
 * ⚠️ **CAS LIMITE VOULU — LA V1 REMISE LE DIMANCHE.** Le délai la ferait tomber
 *    la semaine suivante ; le plafond la rogne au dimanche soir même, donc AU
 *    MÊME JOUR. Ce n'est pas un bug, c'est la première branche de la règle :
 *    « le même jour que la v1 QUAND C'EST POSSIBLE ». Le plafond n'ampute pas la
 *    révision par sévérité — il protège la seule chose que `delta_v1_vf` sait
 *    mesurer, la réception d'un retour.
 *
 * ⚠️ Un délai est une DURÉE : `delaiJours × 24 h` sur l'instant de la v1. Sur un
 *    week-end de bascule d'heure, l'échéance nominale tombe donc une heure plus
 *    tôt ou plus tard à l'horloge de l'école. C'est SANS CONSÉQUENCE : rien ne
 *    bloque, et le plafond, lui, est calendaire — `finDeSemaine` est un instant
 *    que l'appelant a construit dans le fuseau (`finDeSemaineDeTravail`).
 *
 * ⚠️ La borne est RECOPIÉE et non aliasée : l'appelant peut garder sa `Date`
 *    sans qu'une mutation de l'échéance ne déplace sa fin de semaine.
 *
 * @throws {DelaiHorsDomaine} si `delaiJours` sort de 1..4. On signale, on ne
 *         complète pas : la base garde déjà ce domaine, un dépassement ici
 *         signale un délai gravé en dur ou une colonne non lue.
 */
export function echeanceDeLaVersionFinale(
  { v1RemiseA, delaiJours, finDeSemaine }: DemandeEcheance,
): EcheanceVersionFinale {
  if (!delaiRegleValide(delaiJours)) {
    throw new DelaiHorsDomaine(
      `Délai de version finale hors domaine : ${delaiJours}. La source en pose les bornes — `
      + `« le même jour quand c'est possible, sinon dans les trois à quatre jours » (\`06-\` §2) `
      + `—, la base les garde (\`params_vf_delai_chk\` : entre ${DELAI_VF_MIN} et `
      + `${DELAI_VF_MAX}), et ce module les REÇOIT. On s'arrête : deviner le délai, c'est `
      + 'décider à la place du professeur du temps laissé pour réviser.')
  }

  const nominale = new Date(v1RemiseA.getTime() + delaiJours * MS_PAR_JOUR)

  // Le plafond ne mord qu'au DÉPASSEMENT STRICT : une échéance qui tombe
  // exactement à la clôture de la semaine reste DANS la semaine.
  if (nominale.getTime() <= finDeSemaine.getTime()) {
    return { echeance: nominale, rognee: false, motif: null }
  }

  return {
    echeance: new Date(finDeSemaine.getTime()),
    rognee: true,
    motif:
      `Échéance rognée : le délai réglé (v1 + ${delaiJours} j → ${nominale.toISOString()}) `
      + `sortait de la semaine de travail de la v1, close le ${finDeSemaine.toISOString()}. `
      + '« JAMAIS À CHEVAL SUR DEUX SEMAINES DE TRAVAIL » (`06-` §2 ; `01-` §11) — un delta '
      + 'v1 → vf qui traverse une semaine ne mesure plus la réception d\'un retour, mais ce '
      + 'que l\'élève a appris entre-temps.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LA LECTURE D'APRÈS COUP
// ════════════════════════════════════════════════════════════════════════════

/**
 * LE DELTA A-T-IL TRAVERSÉ UNE SEMAINE ? La lecture d'après coup, celle qui dit
 * qu'un `delta_v1_vf` **ne mesure plus la réception d'un retour** (`01-` §11 ;
 * `06-` §6).
 *
 * ⚠️ **ELLE NE BLOQUE RIEN, ET NE REFUSE AUCUN DÉPÔT.** Elle sert le faisceau et
 *    l'analyse : un delta traversant se TAGUE, il ne s'écarte pas — et il ne se
 *    convertit pas non plus en 0. « NULL n'est pas 0 » (`01-` §11 ; `06-` §6) :
 *    une valeur qui a cessé de mesurer ce qu'elle prétend mesurer se signale,
 *    elle ne se remplace pas.
 *
 * ⚠️ La borne est celle de la semaine de travail DE LA V1 — la même que celle
 *    passée à `echeanceDeLaVersionFinale`, et que `finDeSemaineDeTravail`
 *    compose. Si l'appelant donne une borne qui n'est pas celle de la v1 (la v1
 *    tombe APRÈS elle), la lecture rend `false` : elle ne prétend pas lire ce
 *    qu'on ne lui a pas donné, et un faux positif entrerait dans le faisceau.
 *
 * @param v1RemiseA   l'instant de la remise de la v1.
 * @param vfRemiseA   l'instant de la remise de la version finale.
 * @param finDeSemaine la clôture de la semaine de travail de la v1.
 */
export function traverseDeuxSemaines(
  v1RemiseA: Date,
  vfRemiseA: Date,
  finDeSemaine: Date,
): boolean {
  const laV1EstDansCetteSemaine = v1RemiseA.getTime() <= finDeSemaine.getTime()
  // Dépassement STRICT, comme le plafond : déposer À la clôture, c'est déposer
  // dans la semaine.
  const laVfTombeApres = vfRemiseA.getTime() > finDeSemaine.getTime()
  return laV1EstDansCetteSemaine && laVfTombeApres
}
