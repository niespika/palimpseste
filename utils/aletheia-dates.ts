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
import { construireApercuAssign, type AssignParcours, type ApercuSemaine } from './parcours-apercu'

// ApercuSemaine + l'aperçu (snapshot/frise) vivent désormais dans parcours-apercu.ts
// (partagés avec la résolution des synthèses, plan d'évaluation). Ré-exporté ici pour
// les consommateurs historiques (dont aletheia-dates.test.ts).
export type { ApercuSemaine } from './parcours-apercu'

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

// ── PUR : détection du mode d'exposition (mode C) ─────────────────────────────

/**
 * Verdict de classification d'un couple (livre, classe). `exposees` = ordinaux d'ORIGINE
 * exposés, triés croissant. `complet` ⇔ `exposees` couvre toutes les séances-docs (mode B).
 * `gouverneParcoursId` = parcours UNIQUE gouvernant l'extrait (mode C, ancrage IA C2) ; null sinon.
 */
export interface VerdictMode {
  mode: 'A' | 'B' | 'C' | 'MALCONFIG'
  exposees: number[]
  complet: boolean
  gouverneParcoursId: string | null
}

/** Créneau-livre réduit à ce qui décide la COUVERTURE : bornes de tranche (ordinaux) + parcours. */
export interface CreneauCouvrant {
  parcoursId: string
  debut: number | null
  fin: number | null
}

/**
 * Un créneau à bornes EXPLICITES couvrant EXACTEMENT tout le livre courant (debut ≤ 1 ∧
 * fin ≥ max des séances-docs) vaut « livre entier » → traité comme (null,null) → mode B.
 * Redondant avec l'égalité ensembliste au moment présent (un tel créneau donne couvertes=S),
 * mais nomme l'intention et sert de hook à l'audit R-EXPO. La vraie protection contre une
 * re-découpe qui ALLONGE le livre (un [1-5] figé devenant sous-ensemble strict d'un livre
 * re-coupé à 10) reste la normalisation authoring en (null,null) + l'audit : un test runtime
 * ne peut PAS distinguer un [1-N] « livre entier » d'un [1-N] « extrait » une fois N agrandi.
 */
export function estFullRangeExplicite(c: { debut: number | null; fin: number | null }, maxSeance: number): boolean {
  return c.debut != null && c.fin != null && c.debut <= 1 && c.fin >= maxSeance
}

/**
 * Classifie le mode d'exposition d'un couple (livre, classe) — PUR, TOTAL, SANS I/O ni gate
 * (le gate `mode_c_actif` est appliqué par `modeExposition`). Algorithme §4.3 du SPEC mode C :
 *  • S vide (livre non découpé) → A neutre, JAMAIS MALCONFIG.
 *  • non gouverné → A (livre entier si lien direct, sinon non exposé).
 *  • précédence directe (lien scriptorium_unite_classes) → B (livre entier, jamais C).
 *  • créneau ouvert / pleine plage explicite → B (livre entier).
 *  • union des tranches == S → B (inclut le B-distribué).
 *  • couverture vide → MALCONFIG.
 *  • sous-ensemble strict + UN seul parcours → C (extrait) ; + ≥2 parcours → MALCONFIG (§4.6).
 */
export function classifierMode(
  s: Set<number>,
  direct: boolean,
  creneaux: CreneauCouvrant[],
): VerdictMode {
  const sSorted = [...s].sort((a, b) => a - b)

  // (0) livre non découpé (0 ligne scriptorium_documents) → neutre, PAS MALCONFIG (§4.7).
  if (sSorted.length === 0) return { mode: 'A', exposees: [], complet: false, gouverneParcoursId: null }

  const gouverne = creneaux.length > 0

  // (a) non gouverné : A si assigné en direct (livre entier), sinon non exposé.
  if (!gouverne) {
    return direct
      ? { mode: 'A', exposees: sSorted, complet: true, gouverneParcoursId: null }
      : { mode: 'A', exposees: [], complet: false, gouverneParcoursId: null }
  }

  // (b) PRÉCÉDENCE DIRECTE (§4.5) : un lien direct octroie le livre ENTIER → jamais C.
  if (direct) return { mode: 'B', exposees: sSorted, complet: true, gouverneParcoursId: null }

  // (c) Garde full-range (§9.3, Q4) : créneau ouvert (null,null) OU pleine plage explicite → B.
  const maxSeance = sSorted[sSorted.length - 1]
  if (creneaux.some(c => (c.debut == null && c.fin == null) || estFullRangeExplicite(c, maxSeance)))
    return { mode: 'B', exposees: sSorted, complet: true, gouverneParcoursId: null }

  // (d) Couverture par UNION des tranches, comparée à S (couvertes ⊆ S par construction).
  const couvertes = sSorted.filter(seance => creneaux.some(c => couvre(c, seance)))
  if (couvertes.length === sSorted.length)                 // union ⊇ S → B (inclut B-distribué)
    return { mode: 'B', exposees: sSorted, complet: true, gouverneParcoursId: null }
  if (couvertes.length === 0)                              // bornes hors plage → MALCONFIG (§4.7)
    return { mode: 'MALCONFIG', exposees: [], complet: false, gouverneParcoursId: null }

  // (e) couvertes ⊊ S, non vide → extrait candidat. Mode C exige UN parcours gouvernant
  //     unique (§4.6) ; ≥2 parcours distincts couvrant l'extrait → MALCONFIG.
  const parcoursCouvrants = [...new Set(
    creneaux.filter(c => couvertes.some(seance => couvre(c, seance))).map(c => c.parcoursId),
  )]
  if (parcoursCouvrants.length >= 2)
    return { mode: 'MALCONFIG', exposees: couvertes, complet: false, gouverneParcoursId: null }
  return { mode: 'C', exposees: couvertes, complet: false, gouverneParcoursId: parcoursCouvrants[0] }
}

// ── I/O (client admin en paramètre) ──────────────────────────────────────────
// L'aperçu frise (friseApercu) + le résolveur snapshot/frise (construireApercuAssign)
// + le type AssignParcours vivent dans parcours-apercu.ts (partagés avec les synthèses).

// Créneau-livre BRUT (bornes de tranche = ordinaux de séance) + son parcours, tel que chargé
// AVANT toute résolution de date. `id`/`semParcours` alimentent la datation ; `debut`/`fin`
// alimentent la DÉTECTION de couverture (mode C).
interface CreneauLivre {
  id: string
  parcoursId: string
  semParcours: number
  debut: number | null
  fin: number | null
}

// Étape COMMUNE à la détection de mode (creneauxGouvernants, niveau `gouverne` — arbitrage
// A1) et à la datation (chargerCandidats) : charge les créneaux-livre BRUTS + parcours vivants
// + assignations ACTIVES à la classe (avec snapshot/date_debut). Ne résout AUCUNE date — c'est
// le socle brut, AVANT le filtrage `if (!apercu) continue` de chargerCandidats.
// RAG L1 : les créneaux lus sont ceux de l'INSTANCE de la classe
// (scriptorium_parcours_classe_creneaux) — le couple (livre, classe) est natif, plus de
// jointure créneaux modèle × assignations. Même précédence, mêmes verdicts (l'instance
// est une copie conforme du modèle à l'assignation, divergente ensuite PAR CLASSE).
async function chargerCreneauxEtAssignations(
  admin: SupabaseClient, livreId: string, classeId: string,
): Promise<{ creneaux: CreneauLivre[]; assignParParcours: Map<string, AssignParcours> }> {
  const vide = { creneaux: [] as CreneauLivre[], assignParParcours: new Map<string, AssignParcours>() }

  // Assignations ACTIVES à cette classe (id d'instance inclus). Tolérant si les colonnes
  // snapshot n'existent pas (migration parcours_snapshot_horaire.sql non jouée) → repli.
  let assignData: Record<string, unknown>[] = []
  const withSnap = await admin.from('scriptorium_parcours_classes')
    .select('id, parcours_id, date_debut, statut, horaire_snapshot, snapshot_version, snapshot_genere_le, decalages')
    .eq('classe_id', classeId).eq('statut', 'active')
  if (withSnap.error) {
    const noSnap = await admin.from('scriptorium_parcours_classes')
      .select('id, parcours_id, date_debut, statut')
      .eq('classe_id', classeId).eq('statut', 'active')
    assignData = (noSnap.data ?? []) as Record<string, unknown>[]
  } else {
    assignData = (withSnap.data ?? []) as Record<string, unknown>[]
  }
  if (assignData.length === 0) return vide

  // Créneaux-livre de l'INSTANCE de ces assignations pour CE livre.
  const pcIds = assignData.map(a => a.id as string)
  const { data: creneauxRaw } = await admin.from('scriptorium_parcours_classe_creneaux')
    .select('id, parcours_classe_id, semaine, livre_semaine_debut, livre_semaine_fin')
    .eq('ref_type', 'livre').eq('livre_id', livreId).in('parcours_classe_id', pcIds)
  if (!creneauxRaw || creneauxRaw.length === 0) return vide

  // Parcours VIVANTS (nb_semaines pour l'aperçu) ; un parcours soft-deleté sort
  // d'assignParParcours → ses créneaux d'instance sont filtrés en aval (inchangé).
  const parcoursParPc = new Map(assignData.map(a => [a.id as string, a.parcours_id as string]))
  const parcoursIds = [...new Set(assignData.map(a => a.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours')
    .select('id, nb_semaines, supprime_at').in('id', parcoursIds)
  const nbParParcours = new Map<string, number>()
  for (const p of parcours ?? []) {
    if ((p.supprime_at as string | null) == null) nbParParcours.set(p.id as string, (p.nb_semaines as number) ?? 0)
  }
  if (nbParParcours.size === 0) return vide

  const assignParParcours = new Map<string, AssignParcours>()
  for (const a of assignData) {
    const pid = a.parcours_id as string
    if (!nbParParcours.has(pid)) continue // parcours soft-deleté
    const snap = a.horaire_snapshot as ApercuSemaine[] | null | undefined
    assignParParcours.set(pid, {
      parcoursId: pid,
      nbSemaines: nbParParcours.get(pid) ?? 0,
      dateDebut: (a.date_debut as string | null) ?? null,
      snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
      decalages: (a.decalages as Record<string, number> | null) ?? null,
    })
  }

  const creneaux: CreneauLivre[] = creneauxRaw.map(c => ({
    id: c.id as string,
    parcoursId: parcoursParPc.get(c.parcours_classe_id as string) ?? '',
    semParcours: c.semaine as number,
    debut: (c.livre_semaine_debut as number | null) ?? null,
    fin: (c.livre_semaine_fin as number | null) ?? null,
  }))
  return { creneaux, assignParParcours }
}

/**
 * (Mode C — détection §4.2) Créneaux-livre GOUVERNANTS BRUTS pour un couple (livre, classe) :
 * ceux dont le parcours est vivant ET assigné ACTIF à la classe, AVANT toute résolution de date
 * (arbitrage A1). Un créneau qui gouverne l'exposition mais dont la date n'est pas résoluble
 * (parcours sans snapshot ni date_debut) DOIT être compté dans la couverture — sinon un livre
 * entier gouverné sans dates basculerait à tort en mode C. Renvoie `debut/fin` (bornes de tranche
 * = ordinaux) + `parcoursId` (nécessaire au comptage multi-parcours §4.6).
 */
export async function creneauxGouvernants(
  admin: SupabaseClient, livreId: string, classeId: string,
): Promise<CreneauCouvrant[]> {
  const { creneaux, assignParParcours } = await chargerCreneauxEtAssignations(admin, livreId, classeId)
  return creneaux
    .filter(c => assignParParcours.has(c.parcoursId))
    .map(c => ({ parcoursId: c.parcoursId, debut: c.debut, fin: c.fin }))
}

// Charge les créneaux-livre + parcours vivants + assignations ACTIVES à la classe,
// et construit l'aperçu (snapshot publié sinon frise) de chaque parcours-classe.
// Renvoie AUSSI les créneaux gouvernants BRUTS (`gouvernants`) — mutualise la détection
// de mode (§4.2) avec la datation en un seul chargement parcours/classe (R5).
async function chargerCandidats(
  admin: SupabaseClient, livreId: string, classeId: string,
): Promise<{ candidats: CandidatCreneau[]; gouverne: boolean; gouvernants: CreneauCouvrant[] }> {
  const { creneaux, assignParParcours } = await chargerCreneauxEtAssignations(admin, livreId, classeId)
  const gouvernants: CreneauCouvrant[] = creneaux
    .filter(c => assignParParcours.has(c.parcoursId))
    .map(c => ({ parcoursId: c.parcoursId, debut: c.debut, fin: c.fin }))
  // gouverne = ≥1 créneau dans un parcours vivant ASSIGNÉ ACTIF à la classe (même si
  // date non résoluble) → distingue le mode b du mode a (badge « sans échéances »).
  const gouverne = gouvernants.length > 0
  if (!gouverne) return { candidats: [], gouverne: false, gouvernants }

  // Aperçu par parcours-classe (MÉMOÏSÉ : toutes les séances d'un livre le partagent).
  // Cœur snapshot-prioritaire/repli-frise déporté dans parcours-apercu.ts (réutilisé
  // par les synthèses) ; le cache local reste propre à cette résolution multi-séances.
  const apercuCache = new Map<string, { apercu: ApercuSemaine[]; source: 'snapshot' | 'frise' } | null>()
  async function apercuDe(a: AssignParcours) {
    if (apercuCache.has(a.parcoursId)) return apercuCache.get(a.parcoursId) ?? null
    const res = await construireApercuAssign(admin, a)
    apercuCache.set(a.parcoursId, res)
    return res
  }

  const candidats: CandidatCreneau[] = []
  for (const c of creneaux) {
    const a = assignParParcours.get(c.parcoursId)
    if (!a) continue
    const ap = await apercuDe(a)
    if (!ap) continue // assigné sans date ni snapshot → date non résoluble
    candidats.push({
      creneauId: c.id,
      parcoursId: c.parcoursId,
      semParcours: c.semParcours,
      debut: c.debut,
      fin: c.fin,
      apercu: ap.apercu,
      source: ap.source,
    })
  }
  return { candidats, gouverne, gouvernants }
}

/**
 * Résout les dates de PLUSIEURS séances d'un livre pour une classe (un seul chargement).
 * Renvoie AUSSI `creneauxGouvernants` (bruts) pour que l'appelant classe le mode SANS
 * recharger les parcours/assignations (R5, cf. modeExposition(..., prealable)).
 */
export async function resoudreDatesLivre(
  admin: SupabaseClient, livreId: string, classeId: string, seances: number[],
): Promise<{ dates: Map<number, ResolutionDate>; gouverne: boolean; creneauxGouvernants: CreneauCouvrant[] }> {
  const { candidats, gouverne, gouvernants } = await chargerCandidats(admin, livreId, classeId)
  const dates = new Map<number, ResolutionDate>()
  for (const s of seances) dates.set(s, resoudreDepuisCandidats(candidats, s))
  return { dates, gouverne, creneauxGouvernants: gouvernants }
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
  // Créneaux d'INSTANCE « livre entier » (bornes null/null) de ce livre (RAG L1).
  const { data: creneaux } = await admin.from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id').eq('ref_type', 'livre').eq('livre_id', livreId)
    .is('livre_semaine_debut', null).is('livre_semaine_fin', null)
  if (!creneaux || creneaux.length === 0) return []
  const pcIds = [...new Set(creneaux.map(c => c.parcours_classe_id as string))]
  const { data: assigns } = await admin.from('scriptorium_parcours_classes')
    .select('parcours_id, classe_id').eq('statut', 'active').in('id', pcIds)
  const rows = assigns ?? []
  if (rows.length === 0) return []
  const parcoursIds = [...new Set(rows.map(a => a.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours').select('id, supprime_at').in('id', parcoursIds)
  const vivants = new Set((parcours ?? []).filter(p => (p.supprime_at as string | null) == null).map(p => p.id as string))
  const enConflit = new Set<string>()
  for (const a of rows) {
    if (!vivants.has(a.parcours_id as string)) continue
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
    .select('id, parcours_id').eq('statut', 'active').in('classe_id', classeIds)
  const rows = assigns ?? []
  if (rows.length === 0) return []
  const parcoursIds = [...new Set(rows.map(a => a.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours').select('id, supprime_at').in('id', parcoursIds)
  const vivants = new Set((parcours ?? []).filter(p => (p.supprime_at as string | null) == null).map(p => p.id as string))
  const pcIds = rows.filter(a => vivants.has(a.parcours_id as string)).map(a => a.id as string)
  if (pcIds.length === 0) return []
  // Créneaux-livre d'INSTANCE des assignations vivantes (RAG L1).
  const { data: creneaux } = await admin.from('scriptorium_parcours_classe_creneaux')
    .select('livre_id').eq('ref_type', 'livre').in('parcours_classe_id', pcIds)
  return [...new Set((creneaux ?? []).map(c => c.livre_id as string))]
}

/**
 * Toutes les paires (livre, classe) GOUVERNÉES : un créneau-livre d'un parcours vivant
 * ASSIGNÉ ACTIF à la classe. Sert au calendrier (mode b) à savoir quelles lectures
 * datées émettre. Ne résout pas les dates — appeler resoudreDatesLivre par paire.
 */
export async function pairesLivresGouvernes(admin: SupabaseClient, classeIds?: string[]): Promise<Array<{ livreId: string; classeId: string }>> {
  let qAssigns = admin.from('scriptorium_parcours_classes')
    .select('id, parcours_id, classe_id').eq('statut', 'active')
  if (classeIds && classeIds.length) qAssigns = qAssigns.in('classe_id', classeIds) // (perf) scope au spectateur
  const { data: assigns } = await qAssigns
  const rows = assigns ?? []
  if (rows.length === 0) return []
  const parcoursIds = [...new Set(rows.map(a => a.parcours_id as string))]
  const { data: parcours } = await admin.from('scriptorium_parcours').select('id, supprime_at').in('id', parcoursIds)
  const vivants = new Set((parcours ?? []).filter(p => (p.supprime_at as string | null) == null).map(p => p.id as string))
  const classeParPc = new Map<string, string>()
  for (const a of rows) {
    if (!vivants.has(a.parcours_id as string)) continue
    classeParPc.set(a.id as string, a.classe_id as string)
  }
  if (classeParPc.size === 0) return []
  // Créneaux-livre d'INSTANCE (RAG L1) : chaque créneau porte nativement sa classe.
  const { data: creneaux } = await admin.from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id, livre_id').eq('ref_type', 'livre')
    .in('parcours_classe_id', [...classeParPc.keys()])
  const paires = new Map<string, { livreId: string; classeId: string }>()
  for (const c of creneaux ?? []) {
    const classeId = classeParPc.get(c.parcours_classe_id as string)
    if (!classeId) continue
    const livreId = c.livre_id as string
    paires.set(`${livreId}|${classeId}`, { livreId, classeId })
  }
  return [...paires.values()]
}

// ── I/O : source de vérité du mode d'exposition (mode C) ──────────────────────

/** Séances-docs d'un livre : DISTINCT scriptorium_documents.semaine (ordinaux d'origine). */
export async function seancesDocs(admin: SupabaseClient, livreId: string): Promise<Set<number>> {
  const { data } = await admin.from('scriptorium_documents')
    .select('semaine').eq('unite_id', livreId).not('semaine', 'is', null)
  return new Set((data ?? []).map(d => d.semaine as number))
}

/** Lien DIRECT livre↔classe (scriptorium_unite_classes) : octroie le livre entier (A/B). */
async function lienDirect(admin: SupabaseClient, livreId: string, classeId: string): Promise<boolean> {
  const { data } = await admin.from('scriptorium_unite_classes')
    .select('unite_id').eq('unite_id', livreId).eq('classe_id', classeId).limit(1)
  return (data ?? []).length > 0
}

/**
 * Kill-switch global du mode C (`aletheia_params.mode_c_actif`, id=1). Défaut false ; colonne
 * absente tolérée → false (dégrade AVANT la migration aletheia_mode_c.sql).
 */
export async function lireModeCActif(admin: SupabaseClient): Promise<boolean> {
  const { data } = await admin.from('aletheia_params').select('mode_c_actif').eq('id', 1).maybeSingle()
  return !!(data as { mode_c_actif?: boolean } | null)?.mode_c_actif
}

/**
 * SOURCE DE VÉRITÉ UNIQUE du mode d'exposition d'un couple (livre, classe), consommée par TOUTE
 * l'exposition (C1) ET le choix d'ancrage IA (C2). Charge S / lien direct / créneaux gouvernants
 * BRUTS (A1), classe via `classifierMode` (PUR), PUIS applique le GATE : sous `mode_c_actif = false`,
 * TOUT verdict non-A/B (mode C ET MALCONFIG) retombe sur le repli-B whole-book — reproduit à l'octet
 * le comportement prod actuel (§8.2). Gate INCONTOURNABLE : les appelants passent toujours par ici,
 * jamais par `classifierMode` brut.
 */
export async function modeExposition(
  admin: SupabaseClient, livreId: string, classeId: string,
  // (R5) Entrées déjà chargées par l'appelant (ex. livresPourClasse via resoudreDatesLivre) :
  // chaque champ fourni COURT-CIRCUITE sa requête → 0 rechargement. `?? ` gère correctement
  // `false` / Set vide (non nullish). Absent → modeExposition charge tout lui-même.
  prealable?: { seances?: Set<number>; direct?: boolean; creneaux?: CreneauCouvrant[]; modeCActif?: boolean },
): Promise<VerdictMode> {
  const [s, direct, creneaux, modeCActif] = await Promise.all([
    prealable?.seances ?? seancesDocs(admin, livreId),
    prealable?.direct ?? lienDirect(admin, livreId, classeId),
    prealable?.creneaux ?? creneauxGouvernants(admin, livreId, classeId),
    prealable?.modeCActif ?? lireModeCActif(admin),
  ])
  const verdict = classifierMode(s, direct, creneaux)
  if (!modeCActif && (verdict.mode === 'C' || verdict.mode === 'MALCONFIG')) {
    // Repli-B whole-book : livre entier exposé (dates éventuellement nulles), statu quo prod.
    return { mode: 'B', exposees: [...s].sort((a, b) => a - b), complet: true, gouverneParcoursId: null }
  }
  return verdict
}
