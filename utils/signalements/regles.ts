// ============================================================================
// LE SIGNALEMENT D'UN EXERCICE — LES RÈGLES, ET RIEN QUE LES RÈGLES.
// ----------------------------------------------------------------------------
// « L'élève coche "Signaler que l'exercice a un problème", explique dans ses
//   mots, avant ou après le passage ; je reçois la file au Pilotage ; si
//   plusieurs élèves signalent le même exercice, je ne vois qu'UN exercice mais
//   TOUS les commentaires ; et j'arbitre l'effet sur l'assiduité. »
//                                                — demande de Louis, 31/08/2026
//
// ⚠️ CE FICHIER EST PUR — aucun `server-only`, aucun accès base. Le glob de
//    `npm test` est `utils/**/*.test.ts` : une règle posée sous `app/` ne serait
//    JAMAIS éprouvée, sans qu'aucun message ne le dise (leçon C4-L13).
//
// ⛔ IL NE RECOPIE AUCUNE RÈGLE D'ASSIDUITÉ. `estRendu` et `entreAuDenominateur`
//    vivent à `utils/routeur/assiduite.ts` depuis C4-L2, éprouvées ; on les
//    IMPORTE. « Deux domiciles pour la même règle sont deux domiciles qui
//    divergent. »
//
// ⭐⭐ CE QUE MESURE LA PRODUCTION, ET QUI COMMANDE TOUT L'ÉCRAN (31/08) :
//    **4 instances portent 86 dépôts — 16, 23, 23 et 24 élèves sur la MÊME.**
//    Un exercice cassé n'est donc pas « un signalement » : c'est jusqu'à
//    VINGT-QUATRE. D'où `grouperParExercice`, et d'où le fait que le retrait du
//    pool doive DIRE combien de copies il emporte avant de les emporter.
// ============================================================================

import { addDaysUTC, lundiOnOrBefore, toISODate } from '../calendrier-grille'
import { estRendu } from '../routeur/assiduite'

// ════════════════════════════════════════════════════════════════════════════
// L'ÉTAT D'UN SIGNALEMENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * `null` en base = EN ATTENTE, et c'est l'état qui commande la file. On ne
 * stocke pas `en_attente` : un troisième littéral en base voudrait dire qu'on
 * peut « remettre en attente », ce que personne n'a demandé.
 */
export type Arbitrage = 'confirme' | 'ecarte'
export type EtatDeSignalement = 'en_attente' | 'confirme' | 'ecarte'

export interface Signalement {
  id: string
  depotId: string
  exerciceId: string
  eleveId: string
  texte: string
  signaleAt: string
  majAt: string | null
  arbitrage: Arbitrage | null
  arbitreAt: string | null
  /** Le statut ACTUEL du dépôt — c'est lui, jamais l'arbitrage, qui dit l'assiduité. */
  statutDepot: string
}

export function etatDuSignalement(s: Pick<Signalement, 'arbitrage'>): EtatDeSignalement {
  return s.arbitrage ?? 'en_attente'
}

/**
 * ⭐ L'ÉLÈVE PEUT SE RÉTRACTER — TANT QUE PERSONNE N'A TRANCHÉ.
 *
 * La case se décoche, et la ligne part. Après l'arbitrage, elle reste : effacer
 * la parole sur laquelle une décision s'est appuyée rendrait cette décision
 * inexplicable, et le professeur verrait un dépôt retiré sans savoir pourquoi.
 */
export function peutSeRetracter(s: Pick<Signalement, 'arbitrage'>): boolean {
  return s.arbitrage === null
}

// ════════════════════════════════════════════════════════════════════════════
// LE REGROUPEMENT — « je ne vois qu'UN exercice, mais TOUS les commentaires »
// ════════════════════════════════════════════════════════════════════════════

export interface ExerciceSignale {
  exerciceId: string
  /** Tous les signalements portant sur cette instance, du plus ancien au plus récent. */
  signalements: Signalement[]
  /** Combien attendent encore une décision. C'est ce nombre qui fait monter la ligne. */
  enAttente: number
  confirmes: number
  ecartes: number
  /** Le signalement le plus récent — c'est lui qui date la ligne à l'écran. */
  dernierSignaleAt: string
}

/**
 * ⭐ L'ORDRE EST UNE RÈGLE, PAS UN GOÛT : ce qui attend une décision passe
 *    devant, et à égalité c'est le plus signalé — « quatre élèves bloqués sur le
 *    même exercice » est plus urgent qu'un élève sur un autre. Le plus récent
 *    départage, pour qu'un exercice tranché ne remonte jamais tout seul.
 *
 * ⚠️ Le tri est TOTAL et DÉTERMINISTE (l'identifiant départage en dernier
 *    ressort) : sans quoi deux rechargements donneraient deux ordres, et le
 *    professeur cliquerait sur la ligne d'à côté.
 */
export function grouperParExercice(
  signalements: readonly Signalement[],
): ExerciceSignale[] {
  const par = new Map<string, Signalement[]>()
  for (const s of signalements) {
    par.set(s.exerciceId, [...(par.get(s.exerciceId) ?? []), s])
  }

  const out: ExerciceSignale[] = []
  for (const [exerciceId, brut] of par) {
    const liste = [...brut].sort((a, b) =>
      a.signaleAt === b.signaleAt ? cmp(a.id, b.id) : cmp(a.signaleAt, b.signaleAt))
    out.push({
      exerciceId,
      signalements: liste,
      enAttente: liste.filter((s) => s.arbitrage === null).length,
      confirmes: liste.filter((s) => s.arbitrage === 'confirme').length,
      ecartes: liste.filter((s) => s.arbitrage === 'ecarte').length,
      dernierSignaleAt: liste[liste.length - 1]!.signaleAt,
    })
  }

  return out.sort((a, b) => {
    if ((a.enAttente > 0) !== (b.enAttente > 0)) return a.enAttente > 0 ? -1 : 1
    if (a.signalements.length !== b.signalements.length) {
      return b.signalements.length - a.signalements.length
    }
    if (a.dernierSignaleAt !== b.dernierSignaleAt) {
      return cmp(b.dernierSignaleAt, a.dernierSignaleAt)
    }
    return cmp(a.exerciceId, b.exerciceId)
  })
}

const cmp = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

// ════════════════════════════════════════════════════════════════════════════
// L'ÉCHÉANCE — ⛔⛔ CE QUI SE PÉRIME, ET C'EST LE POINT DUR DU DISPOSITIF
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ L'HEURE DU CRON HEBDOMADAIRE, EN UTC, ET ELLE EST RECOPIÉE DE `vercel.json`
 *    (`{ "path": "/api/assiduite/hebdo", "schedule": "0 18 * * 1" }`).
 *
 * ⛔ Elle n'est pas déductible du code : Vercel lit `vercel.json`, pas ce
 *    fichier. **Si la cadence du cron change, cette constante change avec** —
 *    sans quoi l'écran promettrait au professeur un délai qu'il n'a plus.
 */
export const HEURE_DU_COMPTAGE_UTC = 18

/**
 * ⭐⭐ L'INSTANT APRÈS LEQUEL UN ARBITRAGE NE CHANGE PLUS RIEN, pour la semaine
 *    d'un dépôt donné.
 *
 * La règle qu'on ne touche pas : *« un exercice retiré par le professeur sort du
 * dénominateur, MAIS POUR L'AVENIR SEULEMENT : une semaine dont le compte est
 * déjà arrêté ne se recalcule pas. Un chiffre déjà montré au professeur ne bouge
 * plus »* (`06-` §5 ; `utils/routeur/assiduite.ts`). Le compte d'une semaine est
 * arrêté par le cron du LUNDI SUIVANT — il compte la semaine ÉCOULÉE
 * (`lundiSemaineEcoulee`). Donc : `cycleLundi + 7 jours, à 18:00 UTC`.
 *
 * ⚠️ **CE N'EST PAS UNE INTERDICTION, C'EST UNE INERTIE.** Rien n'empêche
 *    d'arbitrer après ; simplement, l'assiduité de cette semaine-là ne bougera
 *    plus. L'écran le DIT au lieu de laisser croire à un geste sans effet —
 *    c'est tout ce que cette fonction sert à écrire.
 *
 * @param cycleLundi la DATE PURE du lundi de la semaine du dépôt (`YYYY-MM-DD`).
 */
export function echeanceDArbitrage(cycleLundi: string): string {
  const lundiSuivant = addDaysUTC(lundiOnOrBefore(cycleLundi), 7)
  lundiSuivant.setUTCHours(HEURE_DU_COMPTAGE_UTC, 0, 0, 0)
  return lundiSuivant.toISOString()
}

export interface FenetreDArbitrage {
  /** L'instant où la semaine du dépôt se fige. */
  echeance: string
  /** Vrai quand il est passé : arbitrer reste possible, mais l'assiduité ne bougera plus. */
  depassee: boolean
  /** Les heures qui restent, arrondies vers le bas. `0` dès que l'échéance est passée. */
  heuresRestantes: number
}

export function fenetreDArbitrage(cycleLundi: string, maintenant: string): FenetreDArbitrage {
  const echeance = echeanceDArbitrage(cycleLundi)
  const restantMs = new Date(echeance).getTime() - new Date(maintenant).getTime()
  return {
    echeance,
    depassee: restantMs <= 0,
    heuresRestantes: restantMs <= 0 ? 0 : Math.floor(restantMs / 3_600_000),
  }
}

/** Le lundi d'une DATE PURE — la même définition que partout ailleurs. */
export function lundiDeLaDate(date: string): string {
  return toISODate(lundiOnOrBefore(date))
}

// ════════════════════════════════════════════════════════════════════════════
// LE RETRAIT DU POOL — et les copies qu'il emporte
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ ARBITRAGE DE LOUIS (31/08) : sortir un exercice du pool emporte AUSSI les
 *    copies déjà distribuées et NON RENDUES. « Un seul geste : l'exercice sort
 *    du pool ET les copies en cours sortent du dénominateur. »
 *
 * ⛔ **CE QUI EST RENDU NE BOUGE JAMAIS.** Un élève qui a fait le travail l'a
 *    fait : retirer sa copie effacerait son geste du numérateur ET du
 *    dénominateur, c'est-à-dire le punirait d'avoir travaillé sur un exercice
 *    imparfait. Les quatre statuts rendus sont ceux de `STATUTS_RENDUS`, et on
 *    ne les redéfinit pas ici.
 *
 * ⛔ `clos` est hors d'atteinte par ailleurs — « le retrait reste permis TANT QUE
 *    le dépôt n'est pas `clos` » (`retirerLExercice`) —, et `retire` l'est déjà.
 *    `abandonne` et `non_fait`, eux, PARTENT : ce sont des dépôts non rendus, et
 *    la question posée est celle de l'exercice, pas celle de l'élève.
 */
export function emportesParLeRetraitDuPool<T extends { id: string; statut: string }>(
  depots: readonly T[],
): T[] {
  return depots.filter((d) =>
    d.statut !== 'clos' && d.statut !== 'retire' && !estRendu(d.statut))
}

/**
 * ⭐ CE QUE LE PROFESSEUR DOIT LIRE AVANT DE CLIQUER. Un geste qui touche
 *    jusqu'à 24 élèves d'un coup ne s'annonce pas par « Retirer » : il s'annonce
 *    par SON COMPTE. *« L'écran devra dire combien avant de le faire. »*
 */
export interface BilanDuRetrait {
  emportes: number
  rendusIntouches: number
  closIntouches: number
  dejaRetires: number
}

export function bilanDuRetraitDuPool<T extends { id: string; statut: string }>(
  depots: readonly T[],
): BilanDuRetrait {
  return {
    emportes: emportesParLeRetraitDuPool(depots).length,
    rendusIntouches: depots.filter((d) => estRendu(d.statut) && d.statut !== 'clos').length,
    closIntouches: depots.filter((d) => d.statut === 'clos').length,
    dejaRetires: depots.filter((d) => d.statut === 'retire').length,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LA MARQUE DANS `exercices.blocages` — posée, relue, retirée
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ LE RETRAIT DU POOL RÉEMPLOIE `exercices.bloque`, ET C'EST DÉLIBÉRÉ.
 *    Cette colonne fait DÉJÀ sortir une instance du vivier
 *    (`constituerLeVivier` : « instance bloquée »), et elle se voit déjà à
 *    l'écran de conception et dans la file de validation. Poser une seconde
 *    colonne « retirée du pool » ferait deux domiciles pour un seul état.
 *
 * ⚠️ Mais `blocages[]` porte aussi les motifs de LA FABRIQUE, écrits à l'import.
 *    On ne les efface pas : notre ligne se reconnaît à son PRÉFIXE, et c'est la
 *    seule qu'on retire quand l'exercice revient au pool.
 */
export const MARQUE_RETRAIT_POOL = '[signalement]'

export function motifDuRetraitDuPool(nSignalements: number, quand: string): string {
  const n = nSignalements === 1 ? '1 élève' : `${nSignalements} élèves`
  return `${MARQUE_RETRAIT_POOL} Retiré du pool le ${quand.slice(0, 10)} — signalé par ${n}.`
}

export function estUnMotifDeSignalement(motif: string): boolean {
  return motif.startsWith(MARQUE_RETRAIT_POOL)
}

/** Les blocages SANS les nôtres — ce qui reste quand l'exercice revient au pool. */
export function blocagesSansLesNotres(blocages: readonly string[]): string[] {
  return blocages.filter((b) => !estUnMotifDeSignalement(b))
}

/**
 * ⛔⛔ LA GARDE QUI ÉVITE DE ROUVRIR CE QUE LA FABRIQUE A FERMÉ. Décocher
 *    « dans le pool » remet `bloque = false` — mais **seulement s'il ne reste
 *    aucun blocage d'une autre origine**. Sinon, l'exercice a été bloqué par
 *    l'import pour une raison qui n'est pas la nôtre, et la remettre au pool
 *    passerait par-dessus une décision qu'on n'a pas prise.
 */
export function peutRevenirAuPool(blocages: readonly string[]): boolean {
  return blocagesSansLesNotres(blocages).length === 0
}
