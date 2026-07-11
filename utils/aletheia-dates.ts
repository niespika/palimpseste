// Résolveur de dates Aletheia « mode b » : traduit un ORDINAL DE SÉANCE d'un livre
// en une échéance calendaire, LORSQUE ce livre est planifié via un PARCOURS assigné
// (actif) à la classe. Mode a (livre hors parcours) → aucune date (retour null) :
// la séance reste lisible, déblocage séquentiel pur (cf. SPEC_aletheia_seances.md).
//
// Conventions verrouillées (addendum du SPEC) :
//  • ÉCHÉANCE = DIMANCHE (Q4). L'aperçu (snapshot publié OU frise recalculée) porte le
//    LUNDI dans `dateReelle` → on ajoute 6 jours. UNE seule convention pour les deux
//    sources (le snapshot et la frise passent tous deux par ApercuSemaine.dateReelle).
//  • Une semaine ne porte une date que si `statut === 'definie'` (le snapshot réécrit
//    le 'resolue' INTERNE de la frise en 'definie' — cf. frise-serveur.ts:70-72).
//    Tester 'resolue' sur un snapshot ne matcherait jamais → repli frise systématique.
//  • SNAPSHOT publié PRIORITAIRE (LD6), repli sur la frise recalculée.
//  • Distribution séance→semaine (addendum A / LD4) : une tranche de créneau GROUPE ses
//    séances dans LA semaine du créneau (même date). Pour étaler, le prof pose plusieurs
//    créneaux. Donc une séance couverte prend la date de la semaine de SON créneau.
//
// Fonctions PURES (couvre / echeanceDepuisApercu / resoudreDepuisCandidats /
// formatEcheanceFr) testées dans aletheia-dates.test.ts. Les fonctions à I/O prennent
// le client `admin` en paramètre (scriptorium_parcours* est en RLS prof-only).

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDaysUTC, toISODate } from './calendrier-grille'
import {
  anneeScolaireDe, friseEnseignementContinue, resoudreAncre, mapperParcours,
  type SemestreFrise,
} from './frise-enseignement'
import type { Holiday } from '../types/calendrier'

// Miroir de ApercuSemaine (frise-serveur.ts), redéfini ici pour découpler le PUR du
// serveur. dateReelle = LUNDI (YYYY-MM-DD), null si non résolue.
export interface ApercuSemaine {
  semaine: number
  dateReelle: string | null
  statut: 'definie' | 'a_definir' | 'non_planifiable'
  semestreNom: string | null
  pedaDansSemestre: number | null
}

export interface ResolutionDate {
  valeur: string | null              // ISO YYYY-MM-DD (dimanche/échéance) ou null (pas de date)
  source: 'snapshot' | 'frise' | null
  ambigu: boolean                    // ≥2 dates DISTINCTES résolues → désaccord signalé au prof
}

export interface CandidatCreneau {
  creneauId: string
  parcoursId: string
  semParcours: number                // semaine de parcours du créneau (1..nb)
  debut: number | null               // borne de tranche = ORDINAL DE SÉANCE
  fin: number | null
  apercu: ApercuSemaine[]
  source: 'snapshot' | 'frise'
}

// ── PUR ──────────────────────────────────────────────────────────────────────

/** Un créneau couvre-t-il cette séance ? (bornes ouvertes = null = illimitée.) */
export function couvre(c: { debut: number | null; fin: number | null }, seance: number): boolean {
  return (c.debut == null || seance >= c.debut) && (c.fin == null || seance <= c.fin)
}

/** Largeur de tranche (spécificité) : plus PETITE = plus spécifique. Bornes ouvertes = ±∞. */
function largeur(c: { debut: number | null; fin: number | null }): number {
  const lo = c.debut ?? Number.NEGATIVE_INFINITY
  const hi = c.fin ?? Number.POSITIVE_INFINITY
  return hi - lo
}

/**
 * Échéance (DIMANCHE) d'une semaine de parcours depuis un aperçu : `dateReelle` est
 * le LUNDI → +6. null si la semaine n'est pas 'definie' / absente / sans date.
 */
export function echeanceDepuisApercu(apercu: ApercuSemaine[], semParcours: number): string | null {
  const e = apercu.find(a => a.semaine === semParcours)
  if (!e || e.statut !== 'definie' || !e.dateReelle) return null
  return toISODate(addDaysUTC(new Date(e.dateReelle + 'T00:00:00Z'), 6))
}

/**
 * Résout la date d'une séance depuis les créneaux candidats (déjà chargés avec leur
 * aperçu). Ordre total DÉTERMINISTE (addendum Q2) : tranche la plus SPÉCIFIQUE →
 * date la plus PRÉCOCE → tie-break stable (parcoursId, creneauId). `ambigu` = ≥2
 * dates DISTINCTES (désaccord réel, pas simple pluralité de candidats concordants).
 */
export function resoudreDepuisCandidats(candidats: CandidatCreneau[], seance: number): ResolutionDate {
  const resolus = candidats
    .filter(c => couvre(c, seance))
    .map(c => ({ c, date: echeanceDepuisApercu(c.apercu, c.semParcours) }))
    .filter((r): r is { c: CandidatCreneau; date: string } => r.date != null)
  if (resolus.length === 0) return { valeur: null, source: null, ambigu: false }
  const ambigu = new Set(resolus.map(r => r.date)).size > 1
  resolus.sort((a, b) => {
    const wa = largeur(a.c), wb = largeur(b.c)
    if (wa !== wb) return wa - wb
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    if (a.c.parcoursId !== b.c.parcoursId) return a.c.parcoursId < b.c.parcoursId ? -1 : 1
    return a.c.creneauId < b.c.creneauId ? -1 : a.c.creneauId > b.c.creneauId ? 1 : 0
  })
  return { valeur: resolus[0].date, source: resolus[0].c.source, ambigu }
}

/** ISO YYYY-MM-DD → « JJ/MM/AAAA » (UTC, déterministe). '' si vide/invalide. */
export function formatEcheanceFr(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

// ── I/O (client admin en paramètre) ──────────────────────────────────────────

// Aperçu frise (recalcul) pour une date de début — miroir de resoudreFrisePourDate
// mais via `admin` (RLS) et ne renvoyant que l'ApercuSemaine[].
async function friseApercu(admin: SupabaseClient, dateDebut: string, nbSemaines: number): Promise<ApercuSemaine[]> {
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

interface AssignParcours {
  parcoursId: string
  nbSemaines: number
  dateDebut: string | null
  snapshot: ApercuSemaine[] | null
}

// Charge les créneaux-livre + parcours vivants + assignations ACTIVES à la classe,
// et construit l'aperçu (snapshot publié sinon frise) de chaque parcours-classe.
async function chargerCandidats(
  admin: SupabaseClient, livreId: string, classeId: string,
): Promise<{ candidats: CandidatCreneau[]; gouverne: boolean }> {
  const { data: creneaux } = await admin.from('scriptorium_parcours_creneaux')
    .select('id, parcours_id, semaine, livre_semaine_debut, livre_semaine_fin')
    .eq('ref_type', 'livre').eq('livre_id', livreId)
  if (!creneaux || creneaux.length === 0) return { candidats: [], gouverne: false }

  const parcoursIds = [...new Set(creneaux.map(c => c.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours')
    .select('id, nb_semaines, supprime_at').in('id', parcoursIds)
  const nbParParcours = new Map<string, number>()
  for (const p of parcours ?? []) {
    if ((p.supprime_at as string | null) == null) nbParParcours.set(p.id as string, (p.nb_semaines as number) ?? 0)
  }
  const vivants = [...nbParParcours.keys()]
  if (vivants.length === 0) return { candidats: [], gouverne: false }

  // Assignations ACTIVES à cette classe. Tolérant si les colonnes snapshot n'existent
  // pas (migration parcours_snapshot_horaire.sql non jouée) → repli sans snapshot.
  let assignData: Record<string, unknown>[] = []
  const withSnap = await admin.from('scriptorium_parcours_classes')
    .select('parcours_id, date_debut, statut, horaire_snapshot, snapshot_version, snapshot_genere_le')
    .eq('classe_id', classeId).eq('statut', 'active').in('parcours_id', vivants)
  if (withSnap.error) {
    const noSnap = await admin.from('scriptorium_parcours_classes')
      .select('parcours_id, date_debut, statut')
      .eq('classe_id', classeId).eq('statut', 'active').in('parcours_id', vivants)
    assignData = (noSnap.data ?? []) as Record<string, unknown>[]
  } else {
    assignData = (withSnap.data ?? []) as Record<string, unknown>[]
  }

  const assignParParcours = new Map<string, AssignParcours>()
  for (const a of assignData) {
    const pid = a.parcours_id as string
    const snap = a.horaire_snapshot as ApercuSemaine[] | null | undefined
    assignParParcours.set(pid, {
      parcoursId: pid,
      nbSemaines: nbParParcours.get(pid) ?? 0,
      dateDebut: (a.date_debut as string | null) ?? null,
      snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
    })
  }

  // gouverne = ≥1 créneau dans un parcours vivant ASSIGNÉ ACTIF à la classe (même si
  // date non résoluble) → distingue le mode b du mode a (badge « sans échéances »).
  const gouverne = creneaux.some(c => assignParParcours.has(c.parcours_id as string))
  if (!gouverne) return { candidats: [], gouverne: false }

  // Aperçu par parcours-classe (MÉMOÏSÉ : toutes les séances d'un livre le partagent).
  const apercuCache = new Map<string, { apercu: ApercuSemaine[]; source: 'snapshot' | 'frise' } | null>()
  async function apercuDe(a: AssignParcours) {
    if (apercuCache.has(a.parcoursId)) return apercuCache.get(a.parcoursId) ?? null
    let res: { apercu: ApercuSemaine[]; source: 'snapshot' | 'frise' } | null = null
    if (a.snapshot) res = { apercu: a.snapshot, source: 'snapshot' }
    else if (a.dateDebut) res = { apercu: await friseApercu(admin, a.dateDebut, a.nbSemaines), source: 'frise' }
    apercuCache.set(a.parcoursId, res)
    return res
  }

  const candidats: CandidatCreneau[] = []
  for (const c of creneaux) {
    const a = assignParParcours.get(c.parcours_id as string)
    if (!a) continue
    const ap = await apercuDe(a)
    if (!ap) continue // assigné sans date ni snapshot → date non résoluble
    candidats.push({
      creneauId: c.id as string,
      parcoursId: c.parcours_id as string,
      semParcours: c.semaine as number,
      debut: (c.livre_semaine_debut as number | null) ?? null,
      fin: (c.livre_semaine_fin as number | null) ?? null,
      apercu: ap.apercu,
      source: ap.source,
    })
  }
  return { candidats, gouverne }
}

/** Résout les dates de PLUSIEURS séances d'un livre pour une classe (un seul chargement). */
export async function resoudreDatesLivre(
  admin: SupabaseClient, livreId: string, classeId: string, seances: number[],
): Promise<{ dates: Map<number, ResolutionDate>; gouverne: boolean }> {
  const { candidats, gouverne } = await chargerCandidats(admin, livreId, classeId)
  const dates = new Map<number, ResolutionDate>()
  for (const s of seances) dates.set(s, resoudreDepuisCandidats(candidats, s))
  return { dates, gouverne }
}

/** Résout la date d'UNE séance d'un livre pour une classe. */
export async function resoudreDateSeance(
  admin: SupabaseClient, livreId: string, classeId: string, seance: number,
): Promise<ResolutionDate> {
  const { candidats } = await chargerCandidats(admin, livreId, classeId)
  return resoudreDepuisCandidats(candidats, seance)
}

/**
 * (L5 — garde-fou) Classes pour lesquelles ce livre est assigné EN TOTALITÉ à la fois
 * en DIRECT (scriptorium_unite_classes) ET via un parcours (créneau-livre ENTIER =
 * bornes null/null, parcours vivant assigné actif). C'est le seul cas confus (LD5) :
 * une tranche PARTIELLE est une coexistence légitime → pas de conflit. Renvoie des
 * classeIds distincts ; l'appelant les libelle et propose le choix (garder direct si
 * rien à ajouter ; passer par le parcours s'il ajoute des ressources).
 */
export async function classesConflitWholeBook(admin: SupabaseClient, livreId: string): Promise<string[]> {
  const { data: directs } = await admin.from('scriptorium_unite_classes').select('classe_id').eq('unite_id', livreId)
  const classesDirectes = new Set((directs ?? []).map(d => d.classe_id as string))
  if (classesDirectes.size === 0) return []
  // Créneaux LIVRE ENTIER (bornes null/null) de ce livre.
  const { data: creneaux } = await admin.from('scriptorium_parcours_creneaux')
    .select('parcours_id').eq('ref_type', 'livre').eq('livre_id', livreId)
    .is('livre_semaine_debut', null).is('livre_semaine_fin', null)
  if (!creneaux || creneaux.length === 0) return []
  const parcoursIds = [...new Set(creneaux.map(c => c.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours').select('id, supprime_at').in('id', parcoursIds)
  const vivants = (parcours ?? []).filter(p => (p.supprime_at as string | null) == null).map(p => p.id as string)
  if (vivants.length === 0) return []
  const { data: assigns } = await admin.from('scriptorium_parcours_classes')
    .select('classe_id').eq('statut', 'active').in('parcours_id', vivants)
  const enConflit = new Set<string>()
  for (const a of assigns ?? []) {
    if (classesDirectes.has(a.classe_id as string)) enConflit.add(a.classe_id as string)
  }
  return [...enConflit]
}

/**
 * (L4 — exposition union) Ids des livres GOUVERNÉS pour un ensemble de classes : un
 * créneau-livre d'un parcours vivant assigné ACTIF à l'une de ces classes. Sert à
 * l'exposition (supersède la décision 9 : un livre planifié via parcours est lisible,
 * même sans lien scriptorium_unite_classes direct). Ne filtre PAS supprime_at du livre
 * (l'appelant le fait) ; renvoie des ids distincts.
 */
export async function livresGouvernesPourClasses(admin: SupabaseClient, classeIds: string[]): Promise<string[]> {
  if (classeIds.length === 0) return []
  const { data: assigns } = await admin.from('scriptorium_parcours_classes')
    .select('parcours_id').eq('statut', 'active').in('classe_id', classeIds)
  const parcoursIds = [...new Set((assigns ?? []).map(a => a.parcours_id as string))]
  if (parcoursIds.length === 0) return []
  const { data: parcours } = await admin.from('scriptorium_parcours').select('id, supprime_at').in('id', parcoursIds)
  const vivants = (parcours ?? []).filter(p => (p.supprime_at as string | null) == null).map(p => p.id as string)
  if (vivants.length === 0) return []
  const { data: creneaux } = await admin.from('scriptorium_parcours_creneaux')
    .select('livre_id').eq('ref_type', 'livre').in('parcours_id', vivants)
  return [...new Set((creneaux ?? []).map(c => c.livre_id as string))]
}

/**
 * Toutes les paires (livre, classe) GOUVERNÉES : un créneau-livre d'un parcours vivant
 * ASSIGNÉ ACTIF à la classe. Sert au calendrier (mode b) à savoir quelles lectures
 * datées émettre. Ne résout pas les dates — appeler resoudreDatesLivre par paire.
 */
export async function pairesLivresGouvernes(admin: SupabaseClient, classeIds?: string[]): Promise<Array<{ livreId: string; classeId: string }>> {
  const { data: creneaux } = await admin.from('scriptorium_parcours_creneaux')
    .select('parcours_id, livre_id').eq('ref_type', 'livre')
  if (!creneaux || creneaux.length === 0) return []
  const parcoursIds = [...new Set(creneaux.map(c => c.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours').select('id, supprime_at').in('id', parcoursIds)
  const vivants = new Set((parcours ?? []).filter(p => (p.supprime_at as string | null) == null).map(p => p.id as string))
  if (vivants.size === 0) return []
  let qAssigns = admin.from('scriptorium_parcours_classes')
    .select('parcours_id, classe_id').eq('statut', 'active').in('parcours_id', [...vivants])
  if (classeIds && classeIds.length) qAssigns = qAssigns.in('classe_id', classeIds) // (perf) scope au spectateur
  const { data: assigns } = await qAssigns
  const classesParParcours = new Map<string, Set<string>>()
  for (const a of assigns ?? []) {
    const pid = a.parcours_id as string
    const set = classesParParcours.get(pid) ?? new Set<string>()
    set.add(a.classe_id as string)
    classesParParcours.set(pid, set)
  }
  const paires = new Map<string, { livreId: string; classeId: string }>()
  for (const c of creneaux) {
    const pid = c.parcours_id as string
    if (!vivants.has(pid)) continue
    const livreId = c.livre_id as string
    for (const classeId of classesParParcours.get(pid) ?? []) {
      paires.set(`${livreId}|${classeId}`, { livreId, classeId })
    }
  }
  return [...paires.values()]
}
