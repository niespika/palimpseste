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
