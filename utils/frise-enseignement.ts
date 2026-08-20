// Frise de semaines d'enseignement CONTINUE à travers les semestres — fonctions
// pures (aucun accès DB). Traduit un « numéro de semaine de parcours » (1..N) en
// date réelle, en SAUTANT les vacances et en débordant proprement d'un semestre à
// l'autre AU SEIN D'UNE MÊME ANNÉE SCOLAIRE. Réutilise calculerGrilleSemaines
// (utils/calendrier-grille.ts). Voir SPEC_parcours_scriptorium.md §5.
//
// Discipline fuseau : TOUT est en DATE PURE (YYYY-MM-DD), régime UTC. Aucun
// timestamptz, aucune dérive DST. Comparaisons lexicales sûres sur des chaînes
// YYYY-MM-DD (l'ordre lexical == l'ordre chronologique pour ce format).

import { addDaysUTC, calculerGrilleSemaines, toISODate } from './calendrier-grille'
import type { Holiday } from '../types/calendrier'

// Semestre tel qu'attendu par la frise. Le caller (server action) fournit les
// semestres DÉJÀ filtrés (AY de date_debut + archived_at IS NULL) ; ici on trie
// défensivement par start_date et on ne s'appuie sur aucun `is_active`.
export interface SemestreFrise {
  id: string
  name: string
  start_date: string
  end_date: string
  archived_at?: string | null
}

export interface SemaineEnseignement {
  indexContinu: number // 1..N GLOBAL, sans reset inter-semestre — INTERNE (mapping, off-by-one)
  semestreId: string
  semestreNom: string
  pedagogicalNumber: number // n° LOCAL au semestre — AFFICHAGE (« S1 · sem. 3 »)
  dateDebutLundi: string // YYYY-MM-DD (lundi)
  dateFinDimanche: string // YYYY-MM-DD (dimanche)
}

export interface FriseResult {
  frise: SemaineEnseignement[]
  avis?: string // signalement(s) non bloquant(s) : troncature, gap aberrant…
  avisBloquant?: boolean // configuration incohérente (chevauchement) → aperçu bloqué
}

// Résultat du mapping d'une semaine de parcours (k) vers la frise.
export type CreneauMap =
  | ({ statut: 'resolue'; k: number } & SemaineEnseignement)
  // 'a_definir'      = déborde sur un semestre de la MÊME AY encore à créer (RÉSOLUBLE)
  // 'non_planifiable'= déborde au-delà de l'AY (frontière août) — DÉFINITIF, non résoluble
  | { statut: 'a_definir' | 'non_planifiable'; k: number }

// Année scolaire (AY) d'une date pure. Convention VERROUILLÉE (SPEC §5.1, maths-M1) :
// AY = [Y-08-01, (Y+1)-07-31]. AOÛT ⇒ NOUVELLE année scolaire.
//   mois >= 8 (août..décembre) → Y = année(date)
//   mois <  8 (janvier..juillet) → Y = année(date) - 1
export function anneeScolaireDe(dateISO: string): number {
  const d = new Date(dateISO + 'T00:00:00Z')
  const annee = d.getUTCFullYear()
  const mois = d.getUTCMonth() + 1 // 1..12
  return mois >= 8 ? annee : annee - 1
}

// Libellé d'affichage d'une année scolaire (« 2026-2027 ») — DÉRIVÉ de la seule
// définition qui fait foi, `anneeScolaireDe`. Une seconde implémentation vivait
// dans `app/prof/calendrier/config/page.tsx` (même frontière d'août, code séparé) :
// l'écran Année fait de cette notion sa maille, elle ne doit exister qu'une fois.
export function libelleAnneeScolaire(ay: number): string {
  return `${ay}-${ay + 1}`
}

/** Raccourci : libellé de l'année scolaire d'une date pure. */
export function libelleAnneeScolaireDe(dateISO: string): string {
  return libelleAnneeScolaire(anneeScolaireDe(dateISO))
}

/**
 * Concatène, dans l'ordre chronologique des semestres, les semaines
 * d'enseignement (hors vacances) de chaque `calculerGrilleSemaines`, et les
 * RENUMÉROTE en continu (`indexContinu`, sans reset inter-semestre).
 *
 * Durcissements (SPEC §5) :
 *  - maths-M3 : une semaine n'est comptée que si son DIMANCHE ≤ end_date du
 *    semestre (semaine calendaire entièrement dans le semestre). Une `end_date`
 *    non dominicale ⇒ la dernière semaine partielle est TRONQUÉE + `avis`.
 *  - maths-M4 : deux semestres qui se chevauchent (`start[i] ≤ end[i-1]`) ⇒
 *    `avisBloquant` (« configuration semestres incohérente »).
 *  - anti-doublon de frontière : `lundiOnOrBefore(next.start)` peut recouvrir la
 *    dernière semaine déjà émise ; on saute toute semaine dont le lundi ≤ dernier
 *    lundi émis.
 */
export function friseEnseignementContinue(
  semestres: SemestreFrise[],
  holidaysParSemestre: Map<string, Holiday[]>
): FriseResult {
  const avisList: string[] = []
  let avisBloquant = false

  // Tri défensif (le caller les fournit triés, on ne s'en remet pas).
  const tries = [...semestres].sort((a, b) =>
    a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0
  )

  // maths-M4 : détection de chevauchement — bloquant.
  for (let i = 1; i < tries.length; i++) {
    if (tries[i].start_date <= tries[i - 1].end_date) {
      avisBloquant = true
      avisList.push(
        `configuration semestres incohérente : « ${tries[i].name} » chevauche « ${tries[i - 1].name} »`
      )
    }
  }

  const frise: SemaineEnseignement[] = []
  let index = 0
  let dernierLundiEmis: string | null = null

  for (const sem of tries) {
    const holidays = holidaysParSemestre.get(sem.id) ?? []
    const grille = calculerGrilleSemaines(
      { start_date: sem.start_date, end_date: sem.end_date },
      holidays
    )
    let tronquee = false
    for (const semaine of grille) {
      if (semaine.isVacation || semaine.pedagogicalNumber == null) continue
      // maths-M3 : dimanche de la semaine au-delà de la fin réelle du semestre → tronquer.
      if (semaine.end > sem.end_date) {
        tronquee = true
        continue
      }
      // anti-doublon de frontière.
      if (dernierLundiEmis != null && semaine.start <= dernierLundiEmis) continue
      index += 1
      frise.push({
        indexContinu: index,
        semestreId: sem.id,
        semestreNom: sem.name,
        pedagogicalNumber: semaine.pedagogicalNumber,
        dateDebutLundi: semaine.start,
        dateFinDimanche: semaine.end,
      })
      dernierLundiEmis = semaine.start
    }
    if (tronquee) {
      avisList.push(`dernière semaine de « ${sem.name} » tronquée : end_date non dominicale`)
    }
  }

  const result: FriseResult = { frise }
  if (avisList.length) result.avis = avisList.join(' ; ')
  if (avisBloquant) result.avisBloquant = true
  return result
}

/**
 * Ancre : date de début du prof → `indexContinu` de la semaine d'enseignement
 * qui la CONTIENT, sinon la SUIVANTE (date en vacances/gap/avant la 1re).
 * Règle unique (SPEC §5.1) : première semaine `W` telle que `W.dimanche ≥ date`.
 *  - frise bloquante → ancreIdx null (aperçu bloqué).
 *  - frise vide (maths-M1, cas c″) → avis explicite.
 *  - date avant la 1re semaine (cas c) → ancre = 1re semaine + avis.
 *  - date après la dernière (cas c′) → ancreIdx null + avis.
 */
export function resoudreAncre(
  friseResult: FriseResult,
  dateDebut: string
): { ancreIdx: number | null; avis?: string } {
  if (friseResult.avisBloquant) {
    return { ancreIdx: null, avis: friseResult.avis }
  }
  const { frise } = friseResult
  if (frise.length === 0) {
    return { ancreIdx: null, avis: 'aucun semestre pour l’année scolaire de cette date' }
  }
  const w = frise.find((s) => s.dateFinDimanche >= dateDebut)
  if (!w) {
    return {
      ancreIdx: null,
      avis: 'date postérieure au dernier semestre défini de l’année scolaire — définir le semestre suivant',
    }
  }
  if (dateDebut < frise[0].dateDebutLundi) {
    return { ancreIdx: w.indexContinu, avis: 'date antérieure au programme (ramenée à la 1re semaine)' }
  }
  return { ancreIdx: w.indexContinu }
}

/**
 * Mappe chaque semaine de parcours k (1..nbSemaines) vers la frise.
 * Off-by-one (SPEC §5.1) : la semaine d'ancre EST la semaine 1 du parcours →
 * `indexContinu = ancreIdx + (k − 1)`.
 * Débordement (décision 8 / schema-S5) : on projette la date de la semaine
 * manquante pour distinguer
 *   'a_definir'       (même AY, semestre à créer — résoluble) de
 *   'non_planifiable' (au-delà de l'AY, frontière août — définitif).
 */
export function mapperParcours(
  friseResult: FriseResult,
  ancreIdx: number | null,
  nbSemaines: number
): CreneauMap[] {
  const { frise } = friseResult
  const out: CreneauMap[] = []
  if (frise.length === 0 || ancreIdx == null) {
    // Rien à ancrer : le caller s'appuie sur l'avis de resoudreAncre.
    for (let k = 1; k <= nbSemaines; k++) out.push({ statut: 'a_definir', k })
    return out
  }
  const parIndex = new Map<number, SemaineEnseignement>()
  for (const s of frise) parIndex.set(s.indexContinu, s)
  const derniere = frise[frise.length - 1]
  const ayFrise = anneeScolaireDe(frise[0].dateDebutLundi)

  for (let k = 1; k <= nbSemaines; k++) {
    const idx = ancreIdx + (k - 1)
    const s = parIndex.get(idx)
    if (s) {
      out.push({ statut: 'resolue', k, ...s })
      continue
    }
    // idx > N (indexContinu contigu) → débordement. Projeter la date.
    const semainesAuDela = idx - derniere.indexContinu // ≥ 1
    const lundiProjete = toISODate(
      addDaysUTC(new Date(derniere.dateDebutLundi + 'T00:00:00Z'), semainesAuDela * 7)
    )
    const statut = anneeScolaireDe(lundiProjete) > ayFrise ? 'non_planifiable' : 'a_definir'
    out.push({ statut, k })
  }
  return out
}
