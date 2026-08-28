// ============================================================================
// C6 · L1 — LE FAISCEAU D'INTÉGRITÉ : sept signaux, une convergence, et
//           JAMAIS UN VERDICT.
// Module PUR — aucun `server-only`, aucun accès base, aucune I/O, et AUCUNE
// horloge implicite : le temps se PASSE en argument, jamais `Date.now()`.
// ----------------------------------------------------------------------------
// « **Quand les signaux convergent**, un drapeau d'intégrité part au professeur,
//   par le canal de signalement existant, **qui exige une confirmation
//   humaine**. **Aucun signal, aucune convergence, ne produit de verdict.** »
//                                                                — `06-` §6
//
// ⭐⭐ CE QUE CE MODULE FAIT, ET LE MOT COMPTE : IL CONCLUT. `telemetrie.ts`
//    refuse explicitement de le faire — « ce module COMPTE, il ne conclut
//    rien » —, et il a raison : une bibliothèque n'écrit pas dans le dossier
//    d'un élève. **Conclure veut dire ici : lever un drapeau qui EXIGE une
//    confirmation humaine.** Jamais rendre un verdict, jamais bloquer un dépôt,
//    jamais compter un strike.
//
// ⛔⛔ DEUX GARDES QUE LE FAISCEAU NE FRANCHIT PAS.
//   (1) **IL NE REGARDE QUE LE FORMATIF FAIT À LA MAISON.** « Les deux examens
//       diagnostiques et l'essai Fragments se font en classe, à la main, sous
//       surveillance » (`06-` §6) : une passation en classe n'entre JAMAIS dans
//       le compte. `estRegardable()` est la porte, et elle est en tête.
//   (2) **`delta_v1_vf` NULL N'EST PAS ZÉRO.** « Une passation en classe n'a pas
//       de version finale, et lire son NULL comme un zéro fabriquerait un faux
//       signal » (`06-` §6 ; `01-` §11). ⚠️ **Le même piège vaut pour TOUS les
//       compteurs** : `nouvelleTelemetrie()` part à zéro, et « zéro n'est pas
//       "pas de mesure" ». D'où le troisième état de chaque signal — `null`.
//
// ⛔ UNE TENTATIVE D'INJECTION N'EST PAS UN SIGNAL DU FAISCEAU (`07-` §1.2,
//    écrit exprès pour éviter qu'on l'y range). « Les sept signaux disent tous
//    la même chose — quelqu'un d'autre a fait le travail — tandis qu'une
//    injection dit que l'élève a essayé de MANIPULER LE CORRECTEUR : autre
//    phénomène. » La remonter serait un HUITIÈME signal au `06-` §6, une
//    décision de doctrine, plus une ligne à la table de traitement de la lettre
//    d'information (`06-` §7). ⛔ Ne l'ajoute pas en passant.
//
// ⛔ AUCUN SEUIL EN DUR AU MILIEU D'UNE COMPARAISON. « Enfoui dans une boucle,
//    il deviendrait une règle que personne n'aurait prise » (`telemetrie.ts`,
//    sur `SEUIL_PAUSE_MS`). Les quatre nombres de ce module sont en tête, nommés,
//    avec leur source quand elle existe et **la direction de leur erreur** quand
//    elle n'existe pas.
// ============================================================================

import { signesParMinute } from './deroule/telemetrie'
import type { TelemetrieSaisie } from './deroule/types'

// ════════════════════════════════════════════════════════════════════════════
// LES SEPT SIGNAUX — l'énuméré du `06-` §6, dans son ordre
// ════════════════════════════════════════════════════════════════════════════

export const SIGNAUX_FAISCEAU = [
  'duree',
  'rythme',
  'sessions',
  'collages',
  'autojugement',
  'delta_nul',
  'style',
] as const
export type SignalFaisceau = (typeof SIGNAUX_FAISCEAU)[number]

/** La phrase de chaque signal — le seul endroit où elle s'écrit. */
export const PHRASE_SIGNAL: Record<SignalFaisceau, string> = {
  duree: 'durée très inférieure à la durée indicative du type',
  rythme: 'rythme de frappe et apparition du texte par blocs',
  sessions: 'texte entier écrit d’une seule traite',
  collages: 'tentatives de collage bloquées',
  autojugement: 'incohérence entre la qualité de la v1 et l’auto-jugement',
  delta_nul: 'delta v1 → version finale nul sur un retour précis',
  style: 'style discordant avec l’historique',
}

/**
 * L'ÉTAT D'UN SIGNAL — et il en faut TROIS, pas deux.
 *   · `true`  — le signal se lève ;
 *   · `false` — il a été MESURÉ et ne se lève pas ;
 *   · `null`  — **il n'a pas pu être mesuré.** ⚠️ Ce n'est pas `false` : un
 *     dépôt sans télémétrie n'est pas un dépôt au rythme normal.
 */
export type EtatSignal = true | false | null

export type Faisceau = Record<SignalFaisceau, EtatSignal>

// ════════════════════════════════════════════════════════════════════════════
// LES QUATRE NOMBRES — en clair, nommés, et discutables
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ **CELUI-CI VIENT DE LA SOURCE, mot pour mot** : « un texte qui apparaît à
 * NEUF CENTS SIGNES PAR MINUTE n'est pas tapé par un élève » (`06-` §6).
 * Ce n'est donc pas une décision d'implémentation — c'est une citation.
 */
export const SIGNES_PAR_MINUTE_SUSPECTS = 900

/**
 * **L'APPARITION PAR BLOCS — la source ne la chiffre pas.** Elle nomme le
 * phénomène (« l'apparition du texte par blocs ») sans dire à partir de quelle
 * taille un ajout cesse d'être une frappe ou une correction.
 *
 * ⭐ Le nombre est donc une PART, jamais une taille absolue : **la moitié du
 * texte produit, arrivée d'un seul tenant.** Une part se met à l'échelle toute
 * seule — une taille absolue serait juste pour une dissertation et fausse pour
 * une phrase.
 *
 * Ce que le réglage déplace : **plus haut**, on ne voit plus qu'un copier-coller
 * intégral (l'erreur va dans le sens de l'élève) ; **plus bas**, une reprise de
 * paragraphe entier devient suspecte, et on fabrique du bruit.
 */
export const PART_DU_TEXTE_EN_UN_BLOC = 0.5

/**
 * **LE PLANCHER DE LONGUEUR — sans lui, les deux signaux ci-dessus mordent sur
 * du vide.** Un texte de trente signes est écrit d'un seul tenant par tout le
 * monde, et sa moitié arrive forcément d'un bloc. En dessous, les signaux de
 * saisie rendent `null` — **pas mesurable**, jamais `false`.
 *
 * 400 signes ≈ un paragraphe court : le premier grain où la manière d'écrire
 * commence à dire quelque chose. L'erreur va dans le sens de l'élève.
 */
export const SIGNES_MINIMUM_POUR_JUGER = 400

/**
 * **LE NOMBRE DE SESSIONS — la source le nomme SANS DIRE DANS QUEL SENS.**
 * « Le nombre de sessions d'écriture » est un signal ; le §6 ne dit pas si c'est
 * beaucoup ou peu qui alerte.
 *
 * ⭐ La lecture retenue, et elle est écrite pour être contredite : **c'est PEU
 * qui alerte** — un texte long produit sans une seule pause franche de deux
 * minutes (`SEUIL_PAUSE_MS`, `telemetrie.ts`) n'a pas été composé, il a été
 * transcrit. Beaucoup de sessions dit le contraire : un élève qui revient.
 *
 * ⚠️ Le signal ne joue qu'au-dessus du plancher de longueur, et il est FAIBLE :
 *    il ne conclut rien seul — c'est tout l'objet d'un faisceau.
 */
export const SESSIONS_MINIMUM_ATTENDUES = 2

// ════════════════════════════════════════════════════════════════════════════
// CE QU'ON LUI DONNE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Un dépôt, tel que le faisceau a besoin de le voir. **Rien de plus** : ce
 * module ne lit pas la base, on le lui donne.
 */
export interface DepotAuFaisceau {
  depotId: string
  eleveId: string
  /** `exercices.lieu` — `maison` ou `classe`. La première garde le lit. */
  lieu: string | null
  /** La `forme` de la mesure — `formatif` ou `sommatif`. La première garde aussi. */
  forme: string | null
  /** `exercices_depots.duree_taguee` — le tag, jamais un verdict. */
  dureeTaguee: string | null
  /** `saisie_telemetrie.v1` — la v1 seule : le delta est un signal à part. */
  telemetrieV1: TelemetrieSaisie | null
  /** La longueur du texte de la v1, en signes. */
  signesV1: number
  /** `exercices_depots.collages_bloques` — combien de tentatives journalisées. */
  collagesBloques: number
  /** `exercices_metacognition.calibration` — `null` quand rien n'a été calculé. */
  calibration: string | null
  /**
   * Les `delta_v1_vf` des mesures de ce dépôt. ⚠️ **Une entrée `null` reste
   * `null`** : elle ne se convertit jamais en 0. Liste VIDE = aucune mesure.
   */
  deltas: ReadonlyArray<number | null>
}

/**
 * LA PREMIÈRE GARDE — « le faisceau ne regarde QUE le formatif fait à la
 * maison » (`06-` §6). ⛔ Une passation en classe n'entre jamais dans le compte.
 *
 * ⚠️ `lieu` inconnu vaut REFUS, pas acceptation : « sans ligne de plan, la
 *    `forme` vaut `formatif` » (`07-` §1.2) donne un défaut pour la forme, mais
 *    rien ne donne de défaut pour le lieu — et se tromper de côté ferait entrer
 *    une copie surveillée dans un compte de triche.
 */
export function estRegardable(d: Pick<DepotAuFaisceau, 'lieu' | 'forme'>): boolean {
  if (d.lieu !== 'maison') return false
  // La `forme` par défaut est `formatif` (`07-` §1.2) : `null` passe, `sommatif` non.
  return d.forme === null || d.forme === 'formatif'
}

// ════════════════════════════════════════════════════════════════════════════
// LES SIGNAUX, UN PAR UN
// ════════════════════════════════════════════════════════════════════════════

/** `06-` §6 — « la durée, très inférieure à la durée indicative du type ». */
export function signalDuree(dureeTaguee: string | null): EtatSignal {
  if (dureeTaguee === null) return null
  return dureeTaguee === 'tres_courte'
}

/**
 * `06-` §6 — « le rythme de frappe ET l'apparition du texte par blocs ». Un seul
 * signal, deux manières de le lever — la source les met dans la même puce.
 *
 * ⚠️ `signesParMinute` rend `null` sur un dénominateur vide, JAMAIS 0 : « un 0
 *    rendu ici ferait d'un texte collé d'un seul geste l'élève le plus lent de
 *    la classe » (`telemetrie.ts`). Ce cas-là se lit sur `plus_grand_ajout`.
 */
export function signalRythme(t: TelemetrieSaisie | null, signes: number): EtatSignal {
  if (t === null) return null
  if (signes < SIGNES_MINIMUM_POUR_JUGER) return null
  const parBlocs = t.plus_grand_ajout >= signes * PART_DU_TEXTE_EN_UN_BLOC
  if (parBlocs) return true
  const rythme = signesParMinute(t)
  // Aucun temps actif compté et aucun bloc : on ne sait pas, on ne conclut pas.
  if (rythme === null) return null
  return rythme >= SIGNES_PAR_MINUTE_SUSPECTS
}

/** `06-` §6 — « le nombre de sessions d'écriture ». Voir `SESSIONS_MINIMUM_ATTENDUES`. */
export function signalSessions(t: TelemetrieSaisie | null, signes: number): EtatSignal {
  if (t === null) return null
  if (signes < SIGNES_MINIMUM_POUR_JUGER) return null
  // Zéro session n'est pas « une seule » : c'est « rien de compté encore ».
  if (t.sessions === 0) return null
  return t.sessions < SESSIONS_MINIMUM_ATTENDUES
}

/**
 * `06-` §6 — « les tentatives de collage bloquées — chacune est journalisée ».
 * ⚠️ La colonne naît `not null default '[]'` : zéro tentative est une MESURE, et
 *    se lit `false`, jamais `null`.
 */
export function signalCollages(n: number): EtatSignal {
  return n > 0
}

/**
 * `06-` §6 — « l'incohérence forte entre la qualité de la v1 et l'auto-jugement
 * — **un texte excellent, et un élève incapable de dire pourquoi ce qu'il a
 * écrit marche** ».
 *
 * ⭐ C'est `sous_confiant` de l'instrument du Monitoring, et pas un autre :
 *    l'élève s'attribue moins que ce que son squelette porte. `surconfiant` dit
 *    l'inverse — un élève qui se croit meilleur qu'il n'est —, ce que la triche
 *    ne produit pas.
 * ⚠️ `indetermine` n'est PAS un signal : « il dit qu'UN CÔTÉ DE LA COMPARAISON
 *    MANQUE » (`monitoring-calcul.ts`), et un côté manquant n'est pas une
 *    incohérence. Il rend `null`.
 */
export function signalAutojugement(calibration: string | null): EtatSignal {
  if (calibration === null || calibration === 'indetermine' || calibration === 'n/a') return null
  return calibration === 'sous_confiant'
}

/**
 * `06-` §6 — « un delta v1 → version finale NUL sur un retour précis — une
 * réceptivité zéro, répétée ».
 *
 * ⛔⛔ **`delta_v1_vf` NULL N'EST PAS ZÉRO.** Une liste qui ne porte que des
 *    `null` rend `null` : le dépôt n'a pas de version finale, ce n'est pas une
 *    réceptivité nulle.
 */
export function signalDeltaNul(deltas: ReadonlyArray<number | null>): EtatSignal {
  const connus = deltas.filter((d): d is number => typeof d === 'number')
  if (connus.length === 0) return null
  return connus.some((d) => d === 0)
}

/**
 * `06-` §6 — « un style discordant avec l'historique — **signal faible** ».
 *
 * ⛔⛔ **IL N'A AUCUN PRODUCTEUR, ET CE LOT N'EN FABRIQUE PAS UN.** Vérifié le
 *    28/08 : rien dans le dépôt ne compare le style d'une copie à l'historique
 *    de l'élève. Il rend donc `null` — **pas mesuré**, jamais `false` : un
 *    `false` dirait « le style concorde », ce que personne n'a regardé.
 *    *Renvoi de périmètre, nommé au relevé.*
 */
export function signalStyle(): EtatSignal {
  return null
}

/** LE FAISCEAU D'UN DÉPÔT — les sept signaux, chacun dans son état. */
export function faisceauDuDepot(d: DepotAuFaisceau): Faisceau {
  return {
    duree: signalDuree(d.dureeTaguee),
    rythme: signalRythme(d.telemetrieV1, d.signesV1),
    sessions: signalSessions(d.telemetrieV1, d.signesV1),
    collages: signalCollages(d.collagesBloques),
    autojugement: signalAutojugement(d.calibration),
    delta_nul: signalDeltaNul(d.deltas),
    style: signalStyle(),
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LA CONVERGENCE
// ════════════════════════════════════════════════════════════════════════════

/**
 * LE SEUIL DE CONVERGENCE — **il n'est chiffré nulle part.** « Quand les signaux
 * convergent » : le `06-` §6 ne dit pas combien.
 *
 * ⭐ **On prend le patron que l'entrée donne pour l'autre seuil non chiffré**
 *    (`07-` §2, C6-L1, sur les contestations répétées) : *un réglage de
 *    configuration, dont l'absence de valeur ne bloque pas l'écran*. Le motif
 *    est le même, et il est écrit : « un seuil posé d'avance deviendrait la
 *    cible que le dispositif apprend à viser » (`00-` §5).
 *
 * ⛔ NULL vaut donc **aucun drapeau** — et non « une valeur par défaut cachée ».
 *    L'écran continue de montrer, dépôt par dépôt, **quels signaux se lèvent** :
 *    c'est cette distribution-là qui permettra de régler le seuil. *Personne ne
 *    peut régler ce qu'il ne voit pas.*
 */
export interface ReglageFaisceau {
  /** `scriptorium_params.faisceau_convergence_seuil`. `null` ⇒ pas de drapeau. */
  seuil: number | null
}

export interface Convergence {
  /** Les signaux qui se lèvent. */
  leves: SignalFaisceau[]
  /** Ceux qui ont été mesurés et ne se lèvent pas. */
  eteints: SignalFaisceau[]
  /** Ceux qu'on n'a PAS PU mesurer — jamais confondus avec les précédents. */
  nonMesures: SignalFaisceau[]
  /** `true` quand le compte atteint le seuil réglé. `false` si aucun seuil. */
  converge: boolean
}

export function convergence(f: Faisceau, reglage: ReglageFaisceau): Convergence {
  const leves: SignalFaisceau[] = []
  const eteints: SignalFaisceau[] = []
  const nonMesures: SignalFaisceau[] = []
  for (const s of SIGNAUX_FAISCEAU) {
    if (f[s] === true) leves.push(s)
    else if (f[s] === false) eteints.push(s)
    else nonMesures.push(s)
  }
  const converge = reglage.seuil !== null && reglage.seuil > 0 && leves.length >= reglage.seuil
  return { leves, eteints, nonMesures, converge }
}

/**
 * LE MOTIF — **ce que le drapeau JOURNALISE.** C'est lui qui part dans
 * `integrite_signalements.motif`, « phrase courte affichée au prof ».
 *
 * ⚠️ **Il porte ce qui a été COMPTÉ, pas un score.** Sans lui, personne ne
 *    pourrait régler un seuil qu'il ne voit pas — et le professeur confirmerait
 *    à l'aveugle un drapeau qui ne dit pas d'où il vient.
 * ⛔ Aucun nombre de 0 à 100, aucune « confiance » : un décompte réel de signaux
 *    nommés (`06-` §5).
 */
export function motifDuFaisceau(c: Convergence): string {
  const liste = c.leves.map((s) => PHRASE_SIGNAL[s]).join(' · ')
  const reste = c.nonMesures.length > 0
    ? ` — ${c.nonMesures.length} signal(aux) non mesuré(s) : ${c.nonMesures.map((s) => PHRASE_SIGNAL[s]).join(', ')}`
    : ''
  return `${c.leves.length} signal(aux) sur ${SIGNAUX_FAISCEAU.length} : ${liste}${reste}`
}

// ════════════════════════════════════════════════════════════════════════════
// LA DISTRIBUTION OBSERVÉE — ce sur quoi le seuil se réglera
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ SANS ELLE, LE SEUIL EST INRÉGLABLE, ET LA DOCTRINE SE MORD LA QUEUE.
 *
 * Le seuil de convergence naît `null`, et NULL vaut « aucun drapeau » — c'est
 * voulu : *« un seuil posé d'avance deviendrait la cible que le dispositif
 * apprend à viser »*. Mais la contrepartie de ce refus est une PROMESSE : le
 * seuil *« se lira sur la distribution observée »*. ⛔ **Si l'écran ne montre
 * rien tant qu'aucun seuil n'est réglé, il n'y a rien à lire, et le seuil ne se
 * règle jamais.** *Personne ne peut régler ce qu'il ne voit pas.*
 *
 * D'où ce relevé : il se calcule **sur tous les dépôts regardables**, et
 * **indépendamment du seuil**. C'est le pendant exact de
 * `distributionDesContestations`.
 *
 * ⛔ CE N'EST PAS UN DRAPEAU, ET ÇA N'EN DEVIENT JAMAIS UN. Aucun dépôt n'est
 *    nommé, aucun élève n'est désigné : ce sont des DÉCOMPTES, et « un écran
 *    n'affiche un nombre que si ce nombre compte quelque chose » (`06-` §5).
 */
export interface DistributionFaisceau {
  /** Combien de dépôts ont passé la première garde (maison + formatif). */
  depotsRegardes: number
  /**
   * Combien de dépôts lèvent exactement N signaux, pour N de 0 à 7.
   * ⭐ C'est CETTE courbe qui dit où poser le seuil.
   */
  parNombreDeSignaux: number[]
  /** Combien de fois chaque signal se lève, tous dépôts confondus. */
  parSignal: Array<{ signal: SignalFaisceau; leve: number; eteint: number; nonMesure: number }>
  /** Ce que le seuil réglé attraperait — ou attraperait, s'il était réglé. */
  simulation: Array<{ seuil: number; depots: number }>
}

export function distributionDuFaisceau(
  faisceaux: readonly Faisceau[],
): DistributionFaisceau {
  const parNombreDeSignaux = new Array(SIGNAUX_FAISCEAU.length + 1).fill(0)
  const compte = new Map<SignalFaisceau, { leve: number; eteint: number; nonMesure: number }>(
    SIGNAUX_FAISCEAU.map((s) => [s, { leve: 0, eteint: 0, nonMesure: 0 }]))

  for (const f of faisceaux) {
    let leves = 0
    for (const s of SIGNAUX_FAISCEAU) {
      const c = compte.get(s)!
      if (f[s] === true) { c.leve += 1; leves += 1 }
      else if (f[s] === false) c.eteint += 1
      else c.nonMesure += 1
    }
    parNombreDeSignaux[leves] += 1
  }

  // ⭐ La simulation : combien de dépôts CHAQUE seuil possible attraperait.
  //    C'est la lecture la plus directe de la distribution — et elle se lit sans
  //    avoir rien réglé.
  const simulation = []
  for (let seuil = 1; seuil <= SIGNAUX_FAISCEAU.length; seuil += 1) {
    let depots = 0
    for (let n = seuil; n < parNombreDeSignaux.length; n += 1) depots += parNombreDeSignaux[n]
    simulation.push({ seuil, depots })
  }

  return {
    depotsRegardes: faisceaux.length,
    parNombreDeSignaux,
    parSignal: SIGNAUX_FAISCEAU.map((signal) => ({ signal, ...compte.get(signal)! })),
    simulation,
  }
}
