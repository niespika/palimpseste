// Moteur PUR du plan annuel d'évaluation — aucune I/O, aucun accès DB.
// Génère la cadence formative (cycle écriture→écriture→lecture), place les
// exercices diagnostiques (fenêtres septembre/décembre/février) et calcule le
// budget temps élève. Consomme la frise d'enseignement (dates réelles, vacances
// sautées) produite par utils/frise-enseignement.ts. Voir
// SPEC_scriptorium_planification_exercices.md §5.2 (G) et §7.3 (budget).
//
// Discipline temporelle : TOUT est en DATE PURE (YYYY-MM-DD), régime UTC. Le
// `semaine_lundi` produit ici est FIGÉ (jamais recalculé, régime temporel du §5).

import type { SemaineEnseignement } from './frise-enseignement'
import { addDaysUTC, toISODate } from './calendrier-grille'

export type Gabarit = 'tc' | 'hlp' | 'vierge'
export type TypeExercice =
  | 'ecriture' | 'lecture' | 'synthese' | 'quiz' | 'examen_livre' | 'fragment' | 'essai'
export type ModuleConception = 'quazian' | 'codex' | 'aletheia' | 'fragments'
export type FenetreDiagnostique = 'septembre' | 'decembre' | 'fevrier'

// La cadence maison ne produit que des écritures/lectures formatives — les seules
// combinaisons formatif+maison admises par exercices_typologie_chk.
export type TypeCadence = 'ecriture' | 'lecture'

// Réglages fins portés par scriptorium_plans_evaluation.config (jsonb).
export interface PlanConfig {
  cycle?: TypeCadence[]                               // défaut ['ecriture','ecriture','lecture']
  compterFragments?: 'hebdo' | 'quinzaine' | 'non'   // budget (§7.3), défaut 'hebdo'
}

// Spécification d'un exercice à insérer (la couche I/O y ajoute plan_id, jour_prevu
// éventuel des diagnostics, etc.). Les champs correspondent aux colonnes de
// scriptorium_exercices_planifies contraintes par exercices_typologie_chk.
export interface ExerciceGenere {
  type_exercice: TypeExercice
  diagnostique: boolean
  nature: 'formatif' | 'evaluatif'
  lieu: 'classe' | 'maison'
  module: ModuleConception
  ancrage: 'semaine'
  semaine_lundi: string   // YYYY-MM-DD (lundi)
  origine: 'cadence' | 'diagnostic'
  fenetre_diagnostique?: FenetreDiagnostique
}

const CYCLE_DEFAUT: TypeCadence[] = ['ecriture', 'ecriture', 'lecture']

// Module de conception d'un type (cf. tableau §3 du PROMPT). La cadence n'émet
// que des écritures/lectures formatives maison ; la table couvre tous les types
// par robustesse (mais le CHECK DB reste l'autorité finale).
const MODULE_PAR_TYPE: Record<TypeExercice, ModuleConception> = {
  ecriture: 'codex',
  lecture: 'aletheia',
  synthese: 'codex',
  quiz: 'quazian',
  examen_livre: 'aletheia',
  fragment: 'fragments',
  essai: 'fragments',
}

// Libellé GÉNÉRIQUE d'un type d'exercice (nom commun, minuscule). Utilisé par les
// surfaces dérivées (à-faire prof, calendrier prospectif) qui n'exposent JAMAIS le
// `titre`/`note` d'un exercice (anti-spoiler, §8bis). Un type inconnu dégrade en
// « exercice » (jamais d'échec). L'appelant capitalise si besoin.
const LIBELLE_TYPE: Record<TypeExercice, string> = {
  ecriture: 'écriture',
  lecture: 'lecture',
  synthese: 'synthèse',
  quiz: 'quiz',
  examen_livre: 'examen',
  fragment: 'fragment',
  essai: 'essai',
}
export function libelleTypeExercice(type: string, diagnostique = false): string {
  const base = LIBELLE_TYPE[type as TypeExercice] ?? 'exercice'
  return diagnostique ? `${base} diagnostique` : base
}

// Durées indicatives (min) — §4 du PROMPT.
export const DUREES_EXERCICES = {
  ecriture: [30, 40] as [number, number],   // exercice d'écriture (maison)
  lecture: [30, 40] as [number, number],    // exercice de lecture (maison)
  flashcards: [15, 20] as [number, number], // révision Quazian ambiante — TOUJOURS comptée
  fragment: 30,                             // fragment écrit (maison)
  lectureLivre: 30,                         // par échéance de lecture mode b dans la semaine
}

// Cibles de travail hebdomadaire par gabarit (min) — §4 du PROMPT. Par gabarit
// SEUL (D9), jamais modulé par le volume horaire réel.
export const CIBLES_GABARIT: Record<Gabarit, [number, number] | null> = {
  tc: [45, 60],
  hlp: [60, 90],
  vierge: null,
}

// Mois civil (1..12) et année UTC d'une date pure YYYY-MM-DD.
function moisDe(iso: string): number {
  return new Date(iso + 'T00:00:00Z').getUTCMonth() + 1
}
function anneeDe(iso: string): number {
  return new Date(iso + 'T00:00:00Z').getUTCFullYear()
}

/**
 * Date effective d'un exercice ancré à une semaine (§4.6) — LA date unique du
 * fenêtrage calendrier, du à-faire et du retard. `jour_prevu` prime ; sinon
 * échéance MAISON = dimanche (semaine_lundi + 6, convention Aletheia mode b) ;
 * CLASSE = lundi (mention « jour à caler » côté UI). Le bras `parcours` (synthèse)
 * est résolu ailleurs (I/O, lot 5). Pure : réutilisée par le loader panoptique.
 */
export function dateEffectiveSemaine(
  semaineLundi: string,
  jourPrevu: string | null,
  lieu: 'classe' | 'maison',
): string {
  if (jourPrevu) return jourPrevu
  if (lieu === 'maison') return toISODate(addDaysUTC(new Date(semaineLundi + 'T00:00:00Z'), 6))
  return semaineLundi
}

/**
 * Cadence formative (G2). Pour chaque semaine d'enseignement COUVERTE (l'appelant
 * passe la frise DÉJÀ tranchée à partir de l'ancre/aPartirDe — le cycle redémarre
 * donc au début du tableau, cf. R1), un exercice maison selon le cycle. `vierge`
 * ne génère rien. L'alternance HLP fragment/lecture-de-livre n'est PAS générée
 * (PO 7) : elle ne compte qu'au budget.
 */
export function genererCadence(
  semainesCouvertes: SemaineEnseignement[],
  gabarit: Gabarit,
  config: PlanConfig,
): ExerciceGenere[] {
  if (gabarit === 'vierge') return []
  const cycle = config.cycle && config.cycle.length > 0 ? config.cycle : CYCLE_DEFAUT
  // Défense en profondeur : `config` vient d'un jsonb (le type TS ne garantit rien au
  // runtime). Un type de cadence hors {ecriture,lecture} produirait un tuple
  // {formatif,maison} qu'AUCUNE branche d'exercices_typologie_chk n'admet → 23514 brut
  // à l'INSERT. On échoue tôt et clairement (l'appelant traduit en message prof).
  for (const t of cycle as readonly string[]) {
    if (t !== 'ecriture' && t !== 'lecture') {
      throw new Error(
        `Cycle de cadence invalide : « ${t} » (seuls « ecriture » et « lecture » sont admis en cadence maison).`,
      )
    }
  }
  return semainesCouvertes.map((s, i) => {
    const type = cycle[i % cycle.length]
    return {
      type_exercice: type,
      diagnostique: false,
      nature: 'formatif',
      lieu: 'maison',
      module: MODULE_PAR_TYPE[type],
      ancrage: 'semaine',
      semaine_lundi: s.dateDebutLundi,
      origine: 'cadence',
    }
  })
}

// Mois civil cible de chaque fenêtre. Février tombe dans l'AY+1 (janvier..juillet).
const MOIS_FENETRE: Record<FenetreDiagnostique, number> = { septembre: 9, decembre: 12, fevrier: 2 }
const FENETRES: FenetreDiagnostique[] = ['septembre', 'decembre', 'fevrier']

/**
 * Diagnostics (G3) : par fenêtre (septembre AY, décembre AY, février AY+1), 1
 * écriture + 1 lecture diagnostiques (évaluatif, en classe), pour TC ET HLP
 * (l'appelant n'invoque pas pour `vierge`). Semaines candidates = semaines de la
 * frise COUVERTES (lundi ≥ aPartirDe) dont le lundi tombe dans le mois cible :
 * écriture → 1ʳᵉ candidate, lecture → 2ᵉ (ou la même s'il n'y en a qu'une).
 * Zéro candidate (fenêtre en vacances / hors semestre / antérieure à l'ancre) →
 * fenêtre NON générée. Le `jour_prevu` (1ᵉʳ jour de cours de la classe) est posé
 * par la couche I/O depuis coursParJour, PAS ici (fonction pure, §4.6).
 */
export function placerDiagnostics(
  frise: SemaineEnseignement[],
  anneeScolaire: number,
  aPartirDe: string,
): ExerciceGenere[] {
  const out: ExerciceGenere[] = []
  for (const fenetre of FENETRES) {
    const anneeCible = fenetre === 'fevrier' ? anneeScolaire + 1 : anneeScolaire
    const moisCible = MOIS_FENETRE[fenetre]
    const candidates = frise.filter(
      (s) => s.dateDebutLundi >= aPartirDe
        && moisDe(s.dateDebutLundi) === moisCible
        && anneeDe(s.dateDebutLundi) === anneeCible,
    )
    if (candidates.length === 0) continue // fenêtre non couverte → non générée (G3)
    const semaineEcriture = candidates[0]
    const semaineLecture = candidates[1] ?? candidates[0]
    out.push({
      type_exercice: 'ecriture', diagnostique: true, nature: 'evaluatif', lieu: 'classe',
      module: 'codex', ancrage: 'semaine', semaine_lundi: semaineEcriture.dateDebutLundi,
      origine: 'diagnostic', fenetre_diagnostique: fenetre,
    })
    out.push({
      type_exercice: 'lecture', diagnostique: true, nature: 'evaluatif', lieu: 'classe',
      module: 'aletheia', ancrage: 'semaine', semaine_lundi: semaineLecture.dateDebutLundi,
      origine: 'diagnostic', fenetre_diagnostique: fenetre,
    })
  }
  return out
}

export interface Budget {
  min: number
  max: number
  cibleMin: number | null
  cibleMax: number | null
  depasse: boolean
}

/**
 * Budget temps élève d'UNE semaine (§7.3) — indicatif, jamais bloquant. Assiette
 * MAISON uniquement : exercices maison du plan + flashcards ambiantes (toujours) +
 * lecture de livre (par échéance mode b résolue dans la semaine) + fragment écrit
 * (si attendu). Les exercices en classe (diagnostics, fragment oral) ne comptent pas.
 * Agrégée par semaine CALENDAIRE par l'appelant (jamais par numéro de semaine).
 */
export function budgetSemaine(
  exercicesMaison: TypeExercice[],
  lecturesLivre: number,
  fragmentEcritAttendu: boolean,
  gabarit: Gabarit,
): Budget {
  let min = DUREES_EXERCICES.flashcards[0]
  let max = DUREES_EXERCICES.flashcards[1]
  for (const t of exercicesMaison) {
    // écriture/lecture maison = 30–40 ; les autres types ne sont pas maison-formatifs.
    if (t === 'ecriture' || t === 'lecture') {
      min += DUREES_EXERCICES.ecriture[0]
      max += DUREES_EXERCICES.ecriture[1]
    }
  }
  if (lecturesLivre > 0) {
    min += lecturesLivre * DUREES_EXERCICES.lectureLivre
    max += lecturesLivre * DUREES_EXERCICES.lectureLivre
  }
  if (fragmentEcritAttendu) {
    min += DUREES_EXERCICES.fragment
    max += DUREES_EXERCICES.fragment
  }
  const cible = CIBLES_GABARIT[gabarit]
  return {
    min,
    max,
    cibleMin: cible ? cible[0] : null,
    cibleMax: cible ? cible[1] : null,
    depasse: cible != null && max > cible[1],
  }
}

// ── Fenêtrage des jours de cours (résolution des synthèses, §5.4 S2) ──────────
// coursParJour itère jour par jour derrière une garde de 400 tours : au-delà, il
// TRONQUE SILENCIEUSEMENT (pas d'erreur, juste une carte incomplète — des synthèses
// replieraient à tort sur vendredi). On borne donc les fenêtres sous ce seuil.
const TRANCHE_JOURS = 366

const ecartJours = (a: string, b: string) =>
  (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000

/**
 * Fenêtres [debut, fin] couvrant les SEMAINES (lundi→dimanche) des lundis donnés, en
 * aussi peu de fenêtres que possible — UNE seule en pratique (une année scolaire tient
 * largement sous la garde). C'est ce qui rend constant le coût de la résolution en lot :
 * un seul appel à coursParJour au lieu d'un par synthèse. Entrée non triée / dupliquée
 * tolérée. Ne perd jamais un lundi : tout lundi donné appartient à une fenêtre émise.
 */
export function fenetresPourLundis(lundis: string[]): { debut: string; fin: string }[] {
  const tries = [...new Set(lundis)].sort()
  const out: { debut: string; fin: string }[] = []
  let i = 0
  while (i < tries.length) {
    const debut = tries[i]
    let j = i
    while (j + 1 < tries.length && ecartJours(debut, tries[j + 1]) + 6 < TRANCHE_JOURS) j++
    out.push({ debut, fin: toISODate(addDaysUTC(new Date(tries[j] + 'T00:00:00Z'), 6)) })
    i = j + 1
  }
  return out
}
