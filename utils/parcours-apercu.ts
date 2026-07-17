// Aperçu d'un parcours assigné à une classe : traduit une SEMAINE DE PARCOURS (1..nb)
// en sa date réelle (LUNDI), selon le SNAPSHOT publié en priorité, repli sur la FRISE
// recalculée. Extrait d'aletheia-dates.ts (mode b Aletheia) pour être RÉUTILISÉ par la
// résolution de date des synthèses de fin de cours (plan d'évaluation, §5.4 S2). Le
// comportement (priorité snapshot / repli frise / statut 'definie') est verrouillé —
// cf. aletheia-dates.ts pour les conventions. Fonctions à I/O : client `admin` en
// paramètre (scriptorium_parcours*/semesters via RLS prof-only).

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  anneeScolaireDe, friseEnseignementContinue, resoudreAncre, mapperParcours,
  type SemestreFrise,
} from './frise-enseignement'
import type { Holiday } from '../types/calendrier'

// dateReelle = LUNDI (YYYY-MM-DD), null si non résolue. Une semaine ne porte une date
// que si statut === 'definie' (le snapshot réécrit le 'resolue' interne de la frise en
// 'definie' — cf. frise-serveur.ts). Miroir découplé de frise-serveur.ts.
export interface ApercuSemaine {
  semaine: number
  dateReelle: string | null
  statut: 'definie' | 'a_definir' | 'non_planifiable'
  semestreNom: string | null
  pedaDansSemestre: number | null
}

// Assignation d'un parcours à une classe, réduite au strict nécessaire pour l'aperçu.
export interface AssignParcours {
  parcoursId: string
  nbSemaines: number
  dateDebut: string | null
  snapshot: ApercuSemaine[] | null
}

// Aperçu frise (recalcul) pour une date de début — miroir de resoudreFrisePourDate mais
// via `admin` (RLS) et ne renvoyant que l'ApercuSemaine[].
export async function friseApercu(admin: SupabaseClient, dateDebut: string, nbSemaines: number): Promise<ApercuSemaine[]> {
  const y = anneeScolaireDe(dateDebut)
  const { data: sems } = await admin.from('semesters')
    .select('id, name, start_date, end_date, archived_at')
    .is('archived_at', null)
    .gte('start_date', `${y}-08-01`).lte('start_date', `${y + 1}-07-31`)
    .order('start_date', { ascending: true })
  const semestres = (sems ?? []) as SemestreFrise[]
  const holidaysParSemestre = new Map<string, Holiday[]>()
  if (semestres.length) {
    const { data: hols } = await admin.from('holidays')
      .select('id, semester_id, label, start_date, end_date, created_at')
      .in('semester_id', semestres.map(s => s.id))
    for (const h of (hols ?? []) as Holiday[]) {
      const arr = holidaysParSemestre.get(h.semester_id) ?? []
      arr.push(h)
      holidaysParSemestre.set(h.semester_id, arr)
    }
  }
  const friseResult = friseEnseignementContinue(semestres, holidaysParSemestre)
  const { ancreIdx } = resoudreAncre(friseResult, dateDebut)
  return mapperParcours(friseResult, ancreIdx, nbSemaines).map(c =>
    c.statut === 'resolue'
      ? { semaine: c.k, dateReelle: c.dateDebutLundi, statut: 'definie' as const, semestreNom: c.semestreNom, pedaDansSemestre: c.pedagogicalNumber }
      : { semaine: c.k, dateReelle: null, statut: c.statut, semestreNom: null, pedaDansSemestre: null },
  )
}

// Aperçu résolu d'une assignation : SNAPSHOT publié prioritaire, repli FRISE recalculée,
// sinon null (assigné sans date ni snapshot → non résoluble). N'inclut PAS de cache :
// l'appelant mémoïse par parcoursId s'il partage l'aperçu entre plusieurs résolutions.
export async function construireApercuAssign(
  admin: SupabaseClient, a: AssignParcours,
): Promise<{ apercu: ApercuSemaine[]; source: 'snapshot' | 'frise' } | null> {
  if (a.snapshot) return { apercu: a.snapshot, source: 'snapshot' }
  if (a.dateDebut) return { apercu: await friseApercu(admin, a.dateDebut, a.nbSemaines), source: 'frise' }
  return null
}
