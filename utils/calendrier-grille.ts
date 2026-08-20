// Grille de semaines du calendrier — fonctions pures (aucun accès DB).
// Source de vérité unique pour la numérotation lundi→dimanche, le saut des
// vacances et l'étiquetage des semaines de vacances. Réutilisée par la
// génération (config/actions) et par les vues (dashboard, mois/semaine/jour).

// Helpers de date en espace « date pure » (UTC) — évite tout décalage DST.
export function lundiOnOrBefore(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00Z')
  const jour = d.getUTCDay() // 0 = dimanche … 6 = samedi
  const delta = jour === 0 ? -6 : 1 - jour
  d.setUTCDate(d.getUTCDate() + delta)
  return d
}

export function addDaysUTC(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCDate(c.getUTCDate() + n)
  return c
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// NB : le « jour calendaire d'un instant dans le fuseau de l'école » est désormais
// `jourDansFuseau(d, tz)` dans utils/fuseau.ts (fuseau configurable par le prof),
// alimenté côté serveur par lireFuseau().

export interface SemaineGrille {
  start: string // lundi (YYYY-MM-DD)
  end: string // dimanche
  isVacation: boolean
  pedagogicalNumber: number | null // null si vacances
  vacanceLabel: string | null
}

/**
 * Découpe l'intervalle d'un semestre en semaines calendaires (lundi→dimanche),
 * marque les semaines de vacances (chevauchement ≥ 1 jour) et numérote en
 * continu les semaines de travail (les vacances sont sautées).
 */
export function calculerGrilleSemaines(
  semestre: { start_date: string; end_date: string },
  holidays: { label: string; start_date: string; end_date: string }[]
): SemaineGrille[] {
  const out: SemaineGrille[] = []
  let cursor = lundiOnOrBefore(semestre.start_date)
  let ped = 0
  let garde = 0
  while (toISODate(cursor) <= semestre.end_date && garde < 1000) {
    garde++
    const start = toISODate(cursor)
    const end = toISODate(addDaysUTC(cursor, 6))
    // Comparaison lexicale sûre sur des dates YYYY-MM-DD.
    const hol = holidays.find((h) => h.start_date <= end && start <= h.end_date)
    const isVacation = !!hol
    let pedagogicalNumber: number | null = null
    if (!isVacation) {
      ped += 1
      pedagogicalNumber = ped
    }
    out.push({ start, end, isVacation, pedagogicalNumber, vacanceLabel: hol?.label ?? null })
    cursor = addDaysUTC(cursor, 7)
  }
  return out
}

// ── Année scolaire : trois dates saisies → les bornes des DEUX semestres ─────
//
// Ce qui se conçoit, c'est l'ANNÉE (rentrée · fin du 1er semestre · fin d'année) ;
// les semestres s'en déduisent. Les bornes sont CALÉES sur la semaine calendaire
// (lundi → dimanche) : sans ce calage, une fin de S1 un mercredi donne une semaine
// à cheval que `calculerGrilleSemaines` compte dans les DEUX semestres — et la
// synchronisation, qui réconcilie par `semestre_id` + `date_debut`, crée alors deux
// lignes `fragments_semaines` pour le même lundi (deux numéros, deux échéances,
// une seule semaine réelle).
//
// Fonction PURE, dates pures YYYY-MM-DD en régime UTC (aucune dérive de fuseau).

export interface BornesSemestre {
  start: string // lundi (YYYY-MM-DD)
  end: string // dimanche
}

export interface BornesAnnee {
  s1: BornesSemestre
  s2: BornesSemestre
}

/** Dimanche de la semaine calendaire (lundi→dimanche) qui contient `dateStr`. */
export function dimancheDeLaSemaine(dateStr: string): string {
  return toISODate(addDaysUTC(lundiOnOrBefore(dateStr), 6))
}

/**
 * Cale les trois dates de l'année sur la semaine calendaire :
 *   s1.start = lundi de la semaine de `rentree`
 *   s1.end   = dimanche de la semaine de `finS1`
 *   s2.start = lendemain de s1.end (donc un lundi)
 *   s2.end   = dimanche de la semaine de `finAnnee`
 * Aucune validation ici (l'ordre des dates est vérifié par l'action serveur) :
 * la fonction ne fait que dire ce que l'app RETIENDRA, pour que l'écran le montre
 * avant l'enregistrement.
 */
export function calerAnnee(rentree: string, finS1: string, finAnnee: string): BornesAnnee {
  const s1Start = toISODate(lundiOnOrBefore(rentree))
  const s1End = dimancheDeLaSemaine(finS1)
  const s2Start = toISODate(addDaysUTC(new Date(s1End + 'T00:00:00Z'), 1))
  const s2End = dimancheDeLaSemaine(finAnnee)
  return { s1: { start: s1Start, end: s1End }, s2: { start: s2Start, end: s2End } }
}

// ── Semestre actif : déduit de la date du jour, jamais saisi ────────────────
//
// `is_active` reste une colonne matérialisée (trop de lecteurs font
// `.eq('is_active', true)` pour qu'on la remplace), mais elle n'est plus un choix
// du prof : elle se CALCULE. Règle, dans l'ordre :
//   1. le semestre qui contient aujourd'hui ;
//   2. sinon le prochain à commencer — c'est celle qui compte à l'usage : le S1
//      de la rentrée devient actif dès sa saisie en août, sans y revenir le jour J ;
//   3. sinon le dernier terminé ;
//   4. sinon aucun.
// Fonction PURE (la date du jour est passée en argument — elle se lit dans le
// fuseau de l'école, jamais en heure locale du serveur).

export interface SemestreBornes {
  id: string
  start_date: string
  end_date: string
}

/** Tri stable : start_date, puis end_date, puis id — deux appels rendent le même id. */
function trierBornes<T extends SemestreBornes>(semestres: T[]): T[] {
  return [...semestres].sort(
    (a, b) =>
      (a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0) ||
      (a.end_date < b.end_date ? -1 : a.end_date > b.end_date ? 1 : 0) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )
}

/**
 * Identifiant du semestre qui DEVRAIT porter `is_active`, parmi les semestres
 * vivants (non archivés) fournis. `null` si la liste est vide.
 */
export function semestreActifAttendu(
  semestresVivants: SemestreBornes[],
  aujourdhui: string
): string | null {
  const tries = trierBornes(semestresVivants)
  // 1. En cours (comparaisons lexicales sûres sur YYYY-MM-DD).
  const enCours = tries.find((s) => s.start_date <= aujourdhui && aujourdhui <= s.end_date)
  if (enCours) return enCours.id
  // 2. Le prochain à commencer (plus petit start_date > aujourd'hui).
  const prochain = tries.find((s) => s.start_date > aujourdhui)
  if (prochain) return prochain.id
  // 3. Le dernier terminé (plus grand end_date < aujourd'hui).
  const termines = tries.filter((s) => s.end_date < aujourdhui)
  if (termines.length > 0) {
    return termines.reduce((a, b) => (b.end_date > a.end_date ? b : a)).id
  }
  // 4. Aucun.
  return null
}
