// ============================================================================
// C6 · L3 — « EN FAIRE PLUS » : LE PULL ET LE PUSH, EN RÈGLES PURES.
// ----------------------------------------------------------------------------
// `01-routeur.md` §5, LE BUDGET OPTIONNEL — recopié pour que rien ne s'invente :
//
//   « Le quota "en faire plus" est un PULL : l'élève demande UN exercice à la
//     fois. PB5 s'y applique EXERCICE PAR EXERCICE — chaque demande sert le
//     suivant dans l'ordre que la phase B aurait produit. LES MINUTES NON
//     UTILISÉES SONT PERDUES, SANS REPORT NI ÉCRÊTAGE. Le bonus est un exercice
//     NORMAL, mesures comprises : il compte dans les tables de proportion, dans
//     la couverture R5 et dans les compteurs d'escalade. IL NE PORTE EN REVANCHE
//     AUCUNE SONDE SECONDAIRE : la phase C a placé les siennes à la
//     construction, quand il n'existait pas. »
//
//   « Un second canal, le PUSH. Le quota ci-dessus se consomme à la demande de
//     l'élève. Le push ne le remplace pas, IL L'AMORCE : une compétence SANS
//     MESURE DEPUIS LA PÉRIODE DU PLANCHER DE MESURE (§9), chez un élève À C OU
//     MOINS, apparaît en SUGGESTION sur son tableau de bord. C'EST UNE
//     SUGGESTION, JAMAIS UNE ASSIGNATION — l'élève la prend par le même pull,
//     ou l'ignore. »
//
// ⛔⛔ PAS DE BUDGET-TEMPS HEBDOMADAIRE (`06-Palimpseste.md` §2, en toutes
//    lettres). Le quota est en MINUTES et il se compte ICI, côté serveur ; côté
//    élève il se dit EN EXERCICES, ou il ne se dit pas. « Il te reste 12 minutes
//    de bonus » est exactement ce que la source interdit — et c'est pourquoi
//    AUCUNE des phrases de ce fichier ne porte un nombre de minutes.
//
// ⛔ « Un écran n'affiche un nombre que si ce nombre compte quelque chose »
//    (`06-` §5). Les seuls nombres autorisés chez l'élève sont `n` et le nombre
//    d'exercices de la semaine : aucune phrase d'ici n'en ajoute un troisième.
//
// Ce fichier est PUR. Les lectures et l'écriture vivent à
// `utils/moteur/bonus-serveur.ts` (le pull) et `utils/eleve/bonus-serveur.ts`
// (le push).
// ============================================================================

import { CYCLES_DU_PLANCHER_DE_MESURE, RELIQUAT_PERDU_MIN } from './config'
import { PALIERS, rangPalier, type Competence, type Lettre, type Palier } from './types'

// ════════════════════════════════════════════════════════════════════════════
// LE QUOTA — « les minutes non utilisées sont perdues, SANS REPORT NI ÉCRÊTAGE »
// ════════════════════════════════════════════════════════════════════════════

export interface QuotaOptionnel {
  /** `01-` §4 — le budget optionnel de l'élève. +30 min dans les trois situations. */
  optionnel: number
  /** Les minutes déjà servies EN BONUS sur CE cycle, et sur lui seul. */
  consomme: number
  /** Ce qui reste. Jamais négatif — un plafond est une borne dure. */
  restant: number
  /**
   * ⛔ PB6, transposé au quota : « le plus petit exercice du dispositif dure 5
   *    minutes ; LE RELIQUAT SOUS CE SEUIL EST PERDU ». Un reste de 3 minutes
   *    n'est pas un quota : c'est un quota épuisé qui n'a pas encore été dit.
   */
  epuise: boolean
}

/**
 * ⛔⛔ LE QUOTA NE SE REPORTE PAS, ET C'EST UN DÉFAUT SILENCIEUX QUAND ON L'OUBLIE :
 *    « les minutes non utilisées sont perdues, sans report ni écrêtage » (`01-`
 *    §5), « jamais reporté d'une semaine sur l'autre » (`02-` §6.C). C'est le
 *    `consomme` qui porte la règle : il se lit SUR LE CYCLE COURANT SEUL, jamais
 *    en cumul. Personne ne verrait un report avant l'analyse de fin d'année.
 *
 * ⚠️ `optionnel` vient de `budgetDeLEleve()`, jamais d'une constante d'ici : sa
 *    VALEUR se règle (`profiles.budget_optionnel_min`, écran du professeur,
 *    C4-L2), et seule sa CONSOMMATION est de ce lot.
 */
export function quotaOptionnel(optionnel: number, consomme: number): QuotaOptionnel {
  const restant = Math.max(0, optionnel - consomme)
  return { optionnel, consomme, restant, epuise: restant < RELIQUAT_PERDU_MIN }
}

/**
 * PB6 — « il doit TENIR SOUS LE PLAFOND ». Ici le plafond est le reliquat du
 * quota, et l'exercice doit y tenir ENTIÈREMENT : un bonus qui déborderait
 * serait un « jamais au-delà » cassé.
 */
export function tientDansLeQuota(dureeMin: number, quota: QuotaOptionnel): boolean {
  return dureeMin > 0 && dureeMin <= quota.restant
}

// ════════════════════════════════════════════════════════════════════════════
// CE QUE L'OFFRE RÉPOND — « le silence est un mensonge »
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ CHAQUE MANQUE A SA PHRASE, ET AUCUN N'A DE SILENCE. C'est le patron que
 *    `C6-L2` a posé et payé : « travaillé N fois » rend `jamais travaillé`,
 *    jamais « 0 fois » ; « en progrès » rend `pas encore assez d'exercices pour
 *    le dire (2 sur 4)` — LE DÉCOMPTE EST DIT. Un écran qui se tait laisse
 *    l'élève conclure ce qu'il veut, et il conclut toujours contre lui.
 *
 * ⛔ ET AUCUNE NE NOMME UN INTERRUPTEUR : « l'élève n'a JAMAIS à connaître le
 *    nom d'un interrupteur pour comprendre son écran » (règle de `C5-L4`).
 */
export type MotifDuRefus =
  /** `exercices_actif` est fermé. L'écran entier le dit déjà ; l'offre n'existe pas. */
  | 'porte_fermee'
  /** La semaine n'a rien posé : il n'y a pas de « plus » à faire de plus. */
  | 'semaine_vide'
  /** Il reste des exercices de la semaine à faire : l'offre vient APRÈS. */
  | 'semaine_en_cours'
  /** ⛔ « UN exercice à la fois » — un bonus attend déjà un geste. */
  | 'un_a_la_fois'
  /** Le quota du cycle est consommé. ⛔ Il ne se reporte pas. */
  | 'quota_epuise'
  /** Il reste du quota, mais aucun exercice servable n'y tient. */
  | 'ne_tient_pas'
  /** Le vivier est vide : aucune instance servable pour cet élève. */
  | 'vivier_vide'
  /** La liste de priorité est vide : aucune compétence `evaluee` à cibler. */
  | 'liste_vide'
  /**
   * ⛔ Le SEGMENT 1 est HORS ROUTAGE — « il sert les deux examens diagnostiques
   * imposés en classe » (`01-` §4, couche 1). ⚠️ C'est le cas de la SEMAINE DE
   * RENTRÉE, donc le premier que l'élève rencontrera : le confondre avec
   * `liste_vide` lui dirait « rien n'est ouvert au travail » quand la vraie
   * réponse est « pas encore, et voici quand ».
   */
  | 'hors_routage'
  /** ⛔ Le piège de la vacuité — aucun parcours, donc aucun budget (`07-` §1.3). */
  | 'aucun_budget'
  /** ⚠️ Une lecture a échoué. « Une écriture ratée n'est pas "rien à servir". » */
  | 'incident'

/**
 * ⭐ LES PHRASES, MOT POUR MOT — en langue élève, sans nombre, sans nom
 *    d'interrupteur, et sans jamais faire porter le manque à l'élève.
 *
 * ⚠️ `vivier_vide` et `liste_vide` NE SE DISENT PAS PAREIL, et c'est le cœur du
 *    piège : l'un dit « la réserve est vide », l'autre « rien n'est encore
 *    ouvert au travail ». Les confondre ferait croire à l'élève qu'il a fait le
 *    tour de ce qui existe, quand personne ne lui a rien préparé.
 */
export function phraseDuRefus(motif: MotifDuRefus): string {
  switch (motif) {
    case 'porte_fermee':
      return 'Les exercices ne sont pas encore ouverts. '
        + 'Ton professeur te préviendra quand ils le seront.'
    case 'semaine_vide':
      return 'Tu n’as pas eu d’exercice cette semaine : il n’y a rien à faire en plus.'
    case 'semaine_en_cours':
      return 'Quand tu auras fini les exercices de ta semaine, tu pourras en demander un de plus.'
    case 'un_a_la_fois':
      return 'Tu as déjà un exercice en plus à faire. Termine-le, et tu pourras en demander '
        + 'un autre.'
    case 'quota_epuise':
      return 'Tu as pris tout ce que tu pouvais prendre en plus cette semaine. '
        + 'Ça repart à zéro lundi : ce qui reste ne se garde pas d’une semaine sur l’autre.'
    case 'ne_tient_pas':
      return 'Il ne reste plus assez de place cette semaine pour un exercice de plus. '
        + 'Ça repart à zéro lundi.'
    case 'vivier_vide':
      return 'Il n’y a plus d’exercice à te donner en ce moment — ce n’est pas toi, '
        + 'c’est la réserve qui est vide. Reviens plus tard dans la semaine.'
    case 'liste_vide':
      return 'Aucune compétence n’est encore ouverte au travail : il n’y a rien de plus à te '
        + 'proposer pour l’instant.'
    case 'hors_routage':
      return 'Cette semaine est celle des évaluations de rentrée : le travail à la maison '
        + 'commence après. Tu pourras en demander plus dès la semaine prochaine.'
    case 'aucun_budget':
      return 'Ta classe n’est pas encore rattachée à un programme : ton professeur doit le '
        + 'faire avant que tu puisses demander un exercice de plus.'
    case 'incident':
      return 'On n’a pas pu vérifier ce qu’il te reste. Réessaie dans un moment, et dis-le à '
        + 'ton professeur si ça se répète.'
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LE TIRAGE DU PULL — déterministe, et c'est LA GARDE DU DOUBLE CLIC
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔⛔ UNE ÉCRITURE DÉCLENCHÉE PAR UN CLIC A UN MODE DE PANNE QUE LA POSE
 *    HEBDOMADAIRE N'AVAIT PAS : LE DOUBLE CLIC. Deux appels concurrents
 *    serviraient deux exercices sur un quota d'un.
 *
 * ⭐⭐ LA GARDE EST MÉCANIQUE, ET ELLE EXISTE DÉJÀ EN BASE :
 *    `uk_depots_eleve_exercice UNIQUE (eleve_id, exercice_id)`. C'est le même
 *    patron que « l'insertion de l'instance EST le claim de la ligne de plan —
 *    deux conceptions concurrentes, la seconde perd AVANT d'avoir rien écrit »
 *    (`07-` §1.1). ⚠️ **Mais elle ne suffit que si les deux appels élisent LE
 *    MÊME exercice** — et c'est ce que ce tirage garantit : à état égal, deux
 *    demandes concurrentes calculent rigoureusement la même élection.
 *
 * ⭐ ET LA DISPERSION ENTRE ÉLÈVES EST PRÉSERVÉE, qui est la raison d'être du
 *    tirage de la phase B : la graine porte l'identifiant de l'élève, donc deux
 *    élèves de même profil ne reçoivent pas le même exercice. Le déterminisme
 *    est PAR ÉLÈVE, jamais global.
 *
 * ⚠️ Le tirage reste JOURNALISÉ (`01-` §11, point 5) : cette fonction s'enveloppe
 *    dans `journalDuTirage(hasardDeterministe(graine))`, exactement comme la
 *    pose hebdomadaire s'enveloppe autour de `Math.random`.
 *
 * L'algorithme : FNV-1a sur la graine, puis mulberry32. Il n'a besoin d'être ni
 * cryptographique ni uniforme au-delà du raisonnable — il doit être REPRODUCTIBLE.
 */
export function hasardDeterministe(graine: string): () => number {
  // FNV-1a 32 bits.
  let h = 0x811c9dc5
  for (let i = 0; i < graine.length; i += 1) {
    h ^= graine.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  let etat = h >>> 0
  // mulberry32.
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * La graine d'une demande : (élève × cycle × rang de la demande). Le rang est le
 * nombre de bonus déjà servis ce cycle — donc deux demandes concurrentes, qui
 * voient le même rang, tirent pareil ; et la troisième demande d'un même cycle
 * ne rejoue pas le tirage de la première.
 */
export function graineDuPull(eleveId: string, cycleLundi: string, rang: number): string {
  return `bonus|${eleveId}|${cycleLundi}|${rang}`
}

// ════════════════════════════════════════════════════════════════════════════
// LE PUSH — « une suggestion, JAMAIS une assignation »
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ « À C OU MOINS » — et l'échelle est `E < D < C < B < A` (`00-` §3).
 *
 * ⛔⛔ `NULL` N'EST PAS « E », ET « À C OU MOINS » NE L'ATTRAPE PAS. « Une
 *    compétence sans lettre n'est ni ciblable, ni sondable, ni plafonnée, et
 *    n'entre dans aucun départage » (`01-` §3). Une suggestion posée sur une
 *    compétence sans lettre serait un ciblage déguisé.
 */
export const LETTRE_PLAFOND_DU_PUSH: Palier = 'C'

export function estACOuMoins(lettre: Lettre): boolean {
  if (lettre === null) return false
  return rangPalier(lettre) <= rangPalier(LETTRE_PLAFOND_DU_PUSH)
}

/** Le nombre de cycles ENTIERS entre deux lundis de cycle. Jamais négatif. */
export function cyclesEntre(lundiAncien: string, lundiRecent: string): number {
  const a = Date.parse(`${lundiAncien}T00:00:00Z`)
  const b = Date.parse(`${lundiRecent}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((b - a) / (7 * 86_400_000)))
}

/** Ce que le push lit d'un niveau. La lettre est celle de LA COLONNE. */
export interface NiveauPourLePush {
  competence: Competence
  /** `competences_niveaux.statut_recette` — R0 ne cible que les `evaluee`. */
  statutRecette: string
  /**
   * ⚠️ LA LETTRE DE L'ÉTAT, PAS CELLE DE L'AFFICHAGE. C'est ce que `C4-L12` lit
   *    pour R0, et « à C ou moins » veut dire celle-là. La valeur plafonnée
   *    d'affichage (`ancre + 2`) borne ce qu'on MONTRE, jamais ce qu'on cible.
   */
  lettre: Lettre
}

/** Ce que le push lit d'une mesure — déjà passée par `mesuresQuiComptent`. */
export interface MesurePourLePush {
  competence: Competence
  /** Le LUNDI DU CYCLE de la mesure, lu dans le fuseau de l'école. Jamais l'instant brut. */
  cycleLundi: string
}

export interface SuggestionDuPush {
  competence: Competence
  lettre: Palier
  /** Le nombre de cycles depuis la dernière mesure qui compte. `null` = aucune, jamais. */
  cyclesSansMesure: number | null
}

/**
 * `01-` §5 — LES DEUX CONDITIONS DU PUSH, ET ELLES SONT CUMULATIVES :
 *   (a) une compétence SANS MESURE DEPUIS LA PÉRIODE DU PLANCHER DE MESURE —
 *       trois cycles, `CYCLES_DU_PLANCHER_DE_MESURE`, jamais un `3` en dur ;
 *   (b) chez un élève À C OU MOINS.
 * Plus R0, qui traverse tout le routeur : « le routeur NE CIBLE QUE LES
 * `evaluee` » (`01-` §3) — une compétence `mesuree_silencieusement` ou `differee`
 * ne se suggère pas, « le verdict à l'élève : non ».
 *
 * ⭐ UNE COMPÉTENCE JAMAIS MESURÉE REMPLIT (a). Le §9 dit « au moins une mesure
 *    tous les 3 cycles sur toute compétence ciblée » : zéro mesure depuis
 *    toujours est le cas le plus franc du manque, pas son exception.
 *
 * ⛔ ET RIEN NE S'ÉCRIT ICI. Le push est une LECTURE qui produit une phrase et
 *    un bouton : « c'est une suggestion, jamais une assignation — l'élève la
 *    prend par le même pull, ou l'ignore ». L'unique écrivain du lot est le pull.
 *
 * ⚠️ Les mesures reçues sont celles que `mesuresQuiComptent` a laissées passer —
 *    donc PAS celles d'avant la borne de recette de leur compétence. Une
 *    compétence dont toutes les mesures sont pré-recette est donc suggérée, et
 *    c'est juste : pour le dispositif, elle n'a rien mesuré.
 */
export function suggestionsDuPush(
  niveaux: readonly NiveauPourLePush[],
  mesures: readonly MesurePourLePush[],
  cycleLundi: string,
  plancherEnCycles: number = CYCLES_DU_PLANCHER_DE_MESURE,
): SuggestionDuPush[] {
  const derniere = new Map<Competence, string>()
  for (const m of mesures) {
    const d = derniere.get(m.competence)
    if (!d || m.cycleLundi > d) derniere.set(m.competence, m.cycleLundi)
  }

  const out: SuggestionDuPush[] = []
  for (const n of niveaux) {
    // R0 — « le routeur ne cible que les `evaluee` ».
    if (n.statutRecette !== 'evaluee') continue
    // (b) — « à C ou moins », et `NULL` n'y est pas.
    if (!estACOuMoins(n.lettre)) continue

    const d = derniere.get(n.competence) ?? null
    const cycles = d === null ? null : cyclesEntre(d, cycleLundi)
    // (a) — sans mesure depuis la période du plancher. Jamais mesurée : oui.
    if (cycles !== null && cycles < plancherEnCycles) continue

    out.push({ competence: n.competence, lettre: n.lettre as Palier, cyclesSansMesure: cycles })
  }

  // ⚠️ L'ordre est STABLE — le plus ancien manque d'abord, puis la lettre la plus
  //    basse, puis l'alphabet. Un tri instable rendrait deux tuiles différentes
  //    sur le même état, et l'élève verrait « ça change tout seul ».
  return out.sort((a, b) =>
    (b.cyclesSansMesure ?? Number.MAX_SAFE_INTEGER) - (a.cyclesSansMesure ?? Number.MAX_SAFE_INTEGER)
    || rangPalier(a.lettre) - rangPalier(b.lettre)
    || a.competence.localeCompare(b.competence))
}

/** Garde de lisibilité : l'échelle du push est bien celle du référentiel. */
export const ECHELLE_DU_PUSH: readonly Palier[] = PALIERS
