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
  type SemestreFrise, type FriseResult,
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

// Socle de frise d'une AY : les semestres non archivés + leurs vacances, réduits par le
// moteur PUR. Ne dépend QUE de l'AY — donc partageable entre toutes les résolutions
// d'une même requête HTTP (cf. memoSocleFrise). L'I/O (2 requêtes) est ici, le mapping
// vers une date de début est pur (apercuDepuisSocle).
export async function chargerSocleFrise(admin: SupabaseClient, y: number): Promise<FriseResult> {
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
  return friseEnseignementContinue(semestres, holidaysParSemestre)
}

// Mémo de portée REQUÊTE des socles de frise, par AY. À créer une fois par loader et à
// passer aux résolutions (construireApercuAssign) : sans lui, chaque résolution relit
// `semesters`+`holidays` — identiques pour toute l'AY. Mémoïse la PROMESSE (et non la
// valeur) pour dédupliquer aussi les appels concurrents. Portée volontairement locale :
// aucun cache inter-requêtes (le calendrier est éditable en cours de session).
export function memoSocleFrise(admin: SupabaseClient): (y: number) => Promise<FriseResult> {
  const cache = new Map<number, Promise<FriseResult>>()
  return (y: number) => {
    let p = cache.get(y)
    if (!p) {
      p = chargerSocleFrise(admin, y)
      cache.set(y, p)
    }
    return p
  }
}

// PUR — mappe un socle de frise vers l'aperçu d'un parcours démarrant à `dateDebut`.
export function apercuDepuisSocle(frise: FriseResult, dateDebut: string, nbSemaines: number): ApercuSemaine[] {
  const { ancreIdx } = resoudreAncre(frise, dateDebut)
  return mapperParcours(frise, ancreIdx, nbSemaines).map(c =>
    c.statut === 'resolue'
      ? { semaine: c.k, dateReelle: c.dateDebutLundi, statut: 'definie' as const, semestreNom: c.semestreNom, pedaDansSemestre: c.pedagogicalNumber }
      : { semaine: c.k, dateReelle: null, statut: c.statut, semestreNom: null, pedaDansSemestre: null },
  )
}

// Aperçu frise (recalcul) pour une date de début — miroir de resoudreFrisePourDate mais
// via `admin` (RLS) et ne renvoyant que l'ApercuSemaine[].
export async function friseApercu(admin: SupabaseClient, dateDebut: string, nbSemaines: number): Promise<ApercuSemaine[]> {
  const frise = await chargerSocleFrise(admin, anneeScolaireDe(dateDebut))
  return apercuDepuisSocle(frise, dateDebut, nbSemaines)
}

// Aperçu résolu d'une assignation : SNAPSHOT publié prioritaire, repli FRISE recalculée,
// sinon null (assigné sans date ni snapshot → non résoluble). `socleDe` (optionnel) =
// mémo de portée requête (memoSocleFrise) : le fournir évite de relire semesters/holidays
// à chaque résolution ; l'omettre conserve le comportement d'origine (1 socle par appel).
// La règle snapshot/frise reste ici et NULLE PART AILLEURS — la dupliquer chez un
// appelant batch la ferait diverger silencieusement.
export async function construireApercuAssign(
  admin: SupabaseClient, a: AssignParcours, socleDe?: (y: number) => Promise<FriseResult>,
): Promise<{ apercu: ApercuSemaine[]; source: 'snapshot' | 'frise' } | null> {
  if (a.snapshot) return { apercu: a.snapshot, source: 'snapshot' }
  if (a.dateDebut) {
    const y = anneeScolaireDe(a.dateDebut)
    const frise = socleDe ? await socleDe(y) : await chargerSocleFrise(admin, y)
    return { apercu: apercuDepuisSocle(frise, a.dateDebut, a.nbSemaines), source: 'frise' }
  }
  return null
}
