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

/**
 * DÉCALAGES d'une assignation parcours×classe — ce qui permet à DEUX PARCOURS
 * d'une même classe de s'ALTERNER au lieu de se superposer.
 *
 * Par défaut, la semaine k d'un parcours occupe la k-ième semaine d'enseignement
 * à partir de l'ancre : les semaines d'un parcours sont CONSÉCUTIVES. Un décalage
 * insère des semaines d'enseignement VIDES (pour ce parcours-là) : la semaine k
 * saute `d(k)` semaines de plus.
 *
 * Représentation (jsonb `scriptorium_parcours_classes.decalages`) : dictionnaire
 * CLAIRSEMÉ `{ "4": 1, "5": 3 }` — clé = numéro de semaine du parcours, valeur =
 * décalage CUMULÉ à partir de cette semaine (et non un pas). `{}` = consécutif,
 * c'est-à-dire le comportement d'avant ce champ. La suite des valeurs est
 * NON DÉCROISSANTE : deux semaines ne peuvent pas se croiser.
 *
 * Exemple du parcours A (5 sem.) alterné avec B (3 sem.) sur 8 semaines
 * d'enseignement — A occupe 1,2,3,5,8 :  A.decalages = { "4": 1, "5": 3 }.
 */
export type Decalages = Record<string, number>

/** Décalages → tableau DENSE d0..d(nb−1) (d[i] = décalage de la semaine i+1).
 *  Tolérant : ignore les clés non entières, < 2 ou > nb, et les valeurs < 0 ou
 *  non entières ; force la monotonie (une valeur qui reculerait est relevée). */
export function densifierDecalages(dec: Decalages | null | undefined, nbSemaines: number): number[] {
  const n = Math.max(0, Math.floor(nbSemaines))
  const dense = new Array<number>(n).fill(0)
  if (!dec || typeof dec !== 'object') return dense
  const points: { k: number; v: number }[] = []
  for (const [cle, val] of Object.entries(dec)) {
    const k = Number(cle)
    const v = Number(val)
    if (!Number.isInteger(k) || k < 2 || k > n) continue
    if (!Number.isInteger(v) || v < 0) continue
    points.push({ k, v })
  }
  points.sort((a, b) => a.k - b.k)
  let courant = 0
  let iPoint = 0
  for (let i = 0; i < n; i++) {
    const k = i + 1
    while (iPoint < points.length && points[iPoint].k === k) {
      courant = Math.max(courant, points[iPoint].v) // monotonie forcée
      iPoint++
    }
    dense[i] = courant
  }
  return dense
}

/** Tableau dense → dictionnaire clairsemé (n'écrit que les RUPTURES). */
export function clairsemerDecalages(dense: number[]): Decalages {
  const out: Decalages = {}
  let precedent = 0
  for (let i = 0; i < dense.length; i++) {
    const v = Math.max(0, Math.floor(dense[i]))
    if (i > 0 && v !== precedent) out[String(i + 1)] = v
    precedent = v
  }
  return out
}

/** Décalage de la semaine k (1-indexée). 0 si aucun. */
export function decalageDe(dec: Decalages | null | undefined, k: number, nbSemaines: number): number {
  const dense = densifierDecalages(dec, nbSemaines)
  return dense[k - 1] ?? 0
}

/**
 * Décale la semaine `k` et TOUTES LES SUIVANTES de `delta` semaines
 * d'enseignement (delta = +1 : insère une semaine vide avant k ; −1 : la retire).
 * `refuse` est renseigné quand le geste ferait reculer k sur la semaine k−1
 * (les semaines d'un parcours restent strictement ordonnées) ou passerait
 * sous zéro. La semaine 1 ne se décale pas : c'est la date de début qui la porte.
 */
export function decalerDepuis(
  dec: Decalages | null | undefined,
  k: number,
  delta: number,
  nbSemaines: number,
): { decalages: Decalages; refuse?: string } {
  const dense = densifierDecalages(dec, nbSemaines)
  if (!Number.isInteger(k) || k < 2 || k > nbSemaines) {
    return {
      decalages: clairsemerDecalages(dense),
      refuse: 'La semaine 1 se déplace par la date de début, pas par un décalage.',
    }
  }
  const plancher = dense[k - 2] // décalage de la semaine k−1
  if (dense[k - 1] + delta < plancher) {
    return { decalages: clairsemerDecalages(dense), refuse: `La semaine ${k} rattraperait la semaine ${k - 1}.` }
  }
  for (let i = k - 1; i < dense.length; i++) dense[i] += delta
  return { decalages: clairsemerDecalages(dense) }
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
 *
 * `decalages` (optionnel) rompt la consécutivité : la semaine k saute `d(k)`
 * semaines d'enseignement de plus, ce qui laisse la place à un AUTRE parcours de
 * la même classe. `{}` / omis ⇒ comportement d'origine, à l'identique.
 */
export function mapperParcours(
  friseResult: FriseResult,
  ancreIdx: number | null,
  nbSemaines: number,
  decalages?: Decalages | null
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
  const dense = densifierDecalages(decalages, nbSemaines)

  for (let k = 1; k <= nbSemaines; k++) {
    const idx = ancreIdx + (k - 1) + (dense[k - 1] ?? 0)
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
