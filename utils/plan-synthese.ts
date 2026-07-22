// Résolution de la DATE des synthèses de fin de cours (plan d'évaluation, §5.4 S1-S2).
// La synthèse est le seul exercice à ancrage 'parcours' : sa date n'est PAS stockée
// (régime figé du bras 'semaine'), elle est RÉSOLUE à la lecture — déplacer un créneau
// déplace la synthèse par construction, sans écriture. I/O : client `admin` en paramètre
// (scriptorium_parcours* en RLS prof-only) ; le jour précis passe par coursParJour (prof).
//
// L'API est délibérément EN LOT : la date n'étant pas stockée, aucun consommateur ne peut
// élaguer avant résolution (le calendrier prospectif et le à-faire doivent résoudre TOUTES
// les synthèses vivantes pour n'en afficher qu'une fenêtre). Résolues une par une, les
// requêtes se multiplient par N (≈10 chacune, sérielles) et saturent /prof — qui n'a pas
// de maxDuration. Ici le coût est CONSTANT : ~10 requêtes en 3 vagues, quel que soit N.

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDaysUTC, toISODate } from './calendrier-grille'
import { fenetresPourLundis } from './plan-cadence'
import { construireApercuAssign, memoSocleFrise, type AssignParcours, type ApercuSemaine } from './parcours-apercu'
import { coursParJour } from './calendrier-cours'

// Une synthèse à dater. `cle` = identifiant de l'appelant (exerciceId en pratique) :
// il la retrouve dans la Map de sortie.
export interface DemandeSynthese {
  cle: string
  parcoursId: string
  contenuId: string
  classeId: string
}

const paire = (a: string, b: string) => `${a}:${b}`

/**
 * Méta parcours/contenus : parcours vivants (avec nb_semaines) + contenus vivants.
 * Une cible n'existe que pour un parcours ET un contenu vivants (S1).
 */
async function chargerMeta(
  admin: SupabaseClient, parcoursIds: string[], contenuIds: string[],
): Promise<{ parcoursVivants: Set<string>; contenusVivants: Set<string>; nbSemaines: Map<string, number> }> {
  const [{ data: parcs }, { data: conts }] = await Promise.all([
    admin.from('scriptorium_parcours').select('id, supprime_at, nb_semaines').in('id', parcoursIds),
    admin.from('scriptorium_contenus').select('id, supprime_at').in('id', contenuIds),
  ])
  const nbSemaines = new Map<string, number>()
  const parcoursVivants = new Set<string>()
  for (const p of (parcs ?? []) as { id: string; supprime_at?: string | null; nb_semaines?: number }[]) {
    if (p.supprime_at != null) continue
    parcoursVivants.add(p.id)
    nbSemaines.set(p.id, p.nb_semaines ?? 0)
  }
  const contenusVivants = new Set(
    ((conts ?? []) as { id: string; supprime_at?: string | null }[])
      .filter((c) => c.supprime_at == null).map((c) => c.id),
  )
  return { parcoursVivants, contenusVivants, nbSemaines }
}

/**
 * Assignations ACTIVES (parcours × classe) : id d'INSTANCE + date_debut + snapshot
 * horaire. Tolérant si les colonnes snapshot n'existent pas (migration non jouée →
 * repli sans snapshot). Absent de la Map si la classe n'est pas assignée activement
 * au parcours. `nb_semaines` n'est PAS lu ici (il vient de chargerMeta) : cette
 * requête reste ainsi indépendante et part dans la même vague.
 */
async function chargerAssignations(
  admin: SupabaseClient, parcoursIds: string[], classeIds: string[],
): Promise<Map<string, { pcId: string } & Omit<AssignParcours, 'nbSemaines'>>> {
  let rows: Record<string, unknown>[] = []
  const withSnap = await admin.from('scriptorium_parcours_classes')
    .select('id, parcours_id, classe_id, date_debut, horaire_snapshot')
    .in('parcours_id', parcoursIds).in('classe_id', classeIds).eq('statut', 'active')
  if (withSnap.error) {
    const noSnap = await admin.from('scriptorium_parcours_classes')
      .select('id, parcours_id, classe_id, date_debut')
      .in('parcours_id', parcoursIds).in('classe_id', classeIds).eq('statut', 'active')
    rows = (noSnap.data as Record<string, unknown>[] | null) ?? []
  } else {
    rows = (withSnap.data as Record<string, unknown>[] | null) ?? []
  }

  const out = new Map<string, { pcId: string } & Omit<AssignParcours, 'nbSemaines'>>()
  for (const row of rows) {
    const parcoursId = row.parcours_id as string
    const classeId = row.classe_id as string
    const snap = row.horaire_snapshot as ApercuSemaine[] | null | undefined
    out.set(paire(parcoursId, classeId), {
      pcId: row.id as string,
      parcoursId,
      dateDebut: (row.date_debut as string | null) ?? null,
      snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
    })
  }
  return out
}

/**
 * S1 (en lot, RAG L1) — Semaine-cible de chaque (instance, contenu) : fin de cours =
 * dernier créneau. Les créneaux lus sont ceux de l'INSTANCE de la classe
 * (scriptorium_parcours_classe_creneaux) : la semaine-cible est PAR CLASSE — déplacer
 * un créneau dans l'instance d'une classe déplace SA synthèse seulement. Semaine-cible
 * = max(semaine) des créneaux de l'instance référençant ce contenu (un cours étalé se
 * synthétise après son dernier créneau). `semaine` est RELATIVE au parcours
 * (1..nb_semaines). Clé absente si aucun créneau d'instance ne référence le contenu.
 */
async function semainesCiblesInstances(
  admin: SupabaseClient, pcIds: string[], contenuIds: string[], contenusVivants: Set<string>,
): Promise<Map<string, number>> {
  const cibles = new Map<string, number>() // clé = paire(pcId, contenuId)
  if (pcIds.length === 0) return cibles
  const { data: creneaux } = await admin.from('scriptorium_parcours_classe_creneaux')
    .select('parcours_classe_id, contenu_id, semaine')
    .in('parcours_classe_id', pcIds).eq('ref_type', 'contenu').in('contenu_id', contenuIds)
  for (const c of (creneaux ?? []) as { parcours_classe_id: string; contenu_id: string; semaine: number }[]) {
    if (!contenusVivants.has(c.contenu_id)) continue
    const k = paire(c.parcours_classe_id, c.contenu_id)
    const cur = cibles.get(k)
    if (cur == null || c.semaine > cur) cibles.set(k, c.semaine)
  }
  return cibles
}

// Jours de cours couvrant les semaines des lundis donnés : 1 appel (4 requêtes) par
// fenêtre — une seule en pratique (fenetresPourLundis, moteur pur).
async function joursDeCoursPourLundis(lundis: string[]): Promise<Map<string, { id: string; nom: string }[]>> {
  const out = new Map<string, { id: string; nom: string }[]>()
  for (const f of fenetresPourLundis(lundis)) {
    const m = await coursParJour(f)
    for (const [k, v] of m) out.set(k, v)
  }
  return out
}

// DERNIER jour de cours de la classe dans la semaine du LUNDI donné (la synthèse a lieu
// en classe, en fin de cours). Repli VENDREDI (lundi+4) si la classe n'a aucun cours
// cette semaine-là. PUR : lit la carte des jours déjà chargée.
function dernierJourDeCours(
  jours: Map<string, { id: string; nom: string }[]>, classeId: string, lundi: string,
): string {
  const base = new Date(lundi + 'T00:00:00Z')
  let dernier: string | null = null
  for (let i = 0; i < 7; i++) {
    const d = toISODate(addDaysUTC(base, i))
    if ((jours.get(d) ?? []).some((c) => c.id === classeId)) dernier = d
  }
  return dernier ?? toISODate(addDaysUTC(base, 4)) // repli vendredi
}

/**
 * S2 (en lot) — Date réelle de chaque synthèse pour LA classe de son plan : semaine-cible
 * (S1, PAR CLASSE depuis les créneaux d'instance — RAG L1) → aperçu de l'assignation
 * (SNAPSHOT publié prioritaire, repli FRISE recalculée ; une semaine ne porte une date
 * que si statut='definie') → LUNDI de la semaine → DERNIER jour de cours de la classe
 * (repli vendredi). `null` si non résoluble (pas d'assignation active, semaine non
 * définie, parcours/contenu retiré) — S6 : ni événement, ni tâche. Recalculée à CHAQUE
 * lecture (régime S1) : déplacer un créneau dans l'INSTANCE ou re-dater l'assignation
 * déplace la synthèse de cette classe sans écriture.
 *
 * Coût CONSTANT (~10 requêtes, 4 vagues) quel que soit le nombre de demandes : les socles
 * de frise sont mémoïsés par AY, les jours de cours chargés en un appel sur la fenêtre
 * englobante. Toute clé demandée est présente en sortie (valeur `null` si non résoluble).
 */
export async function resoudreDatesSyntheses(
  admin: SupabaseClient, demandes: DemandeSynthese[],
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>(demandes.map((d) => [d.cle, null]))
  // Une synthèse est ancrée 'parcours', donc parcours_id/contenu_id NOT NULL
  // (exercices_ancrage_chk) — mais le CHECK ne l'impose que dans ce sens : une synthèse
  // ancrée 'semaine' resterait DB-valide avec des ids nuls. On les écarte ici (→ `null`,
  // non résoluble) plutôt que de les laisser polluer les `.in()` de la vague 1.
  const vivantes = demandes.filter((d) => d.parcoursId && d.contenuId && d.classeId)
  if (vivantes.length === 0) return out

  const parcoursIds = [...new Set(vivantes.map((d) => d.parcoursId))]
  const contenuIds = [...new Set(vivantes.map((d) => d.contenuId))]
  const classeIds = [...new Set(vivantes.map((d) => d.classeId))]

  // Vague 1 — méta parcours/contenus (2 requêtes) + assignations (1) : indépendantes.
  const [{ parcoursVivants, contenusVivants, nbSemaines }, assignations] = await Promise.all([
    chargerMeta(admin, parcoursIds, contenuIds),
    chargerAssignations(admin, parcoursIds, classeIds),
  ])

  // Vague 1bis — semaines-cibles depuis les créneaux d'INSTANCE (RAG L1) : dépend des
  // ids d'instance de la vague 1 (coût constant : 1 requête quel que soit N).
  const pcIds = [...new Set([...assignations.values()].map((a) => a.pcId))]
  const cibles = await semainesCiblesInstances(admin, pcIds, contenuIds, contenusVivants)

  // Vague 2 — aperçus : snapshot (0 requête) ou frise recalculée (socle mémoïsé par AY).
  // Mémoïsé par (parcours, classe) : deux synthèses du même parcours partagent l'aperçu.
  const socleDe = memoSocleFrise(admin)
  const apercus = new Map<string, Promise<{ apercu: ApercuSemaine[] } | null>>()
  const apercuDe = (a: AssignParcours, classeId: string) => {
    const k = paire(a.parcoursId, classeId)
    let p = apercus.get(k)
    if (!p) {
      p = construireApercuAssign(admin, a, socleDe)
      apercus.set(k, p)
    }
    return p
  }

  const lundis: { cle: string; classeId: string; lundi: string }[] = []
  await Promise.all(vivantes.map(async (d) => {
    if (!parcoursVivants.has(d.parcoursId)) return // parcours soft-deleté → non résoluble
    const brut = assignations.get(paire(d.parcoursId, d.classeId))
    if (!brut) return
    const cible = cibles.get(paire(brut.pcId, d.contenuId))
    if (cible == null) return
    const assign: AssignParcours = { ...brut, nbSemaines: nbSemaines.get(d.parcoursId) ?? 0 }
    const res = await apercuDe(assign, d.classeId)
    if (!res) return
    const e = res.apercu.find((a) => a.semaine === cible)
    if (!e || e.statut !== 'definie' || !e.dateReelle) return
    lundis.push({ cle: d.cle, classeId: d.classeId, lundi: e.dateReelle })
  }))
  if (lundis.length === 0) return out

  // Vague 3 — jours de cours (1 appel sur la fenêtre englobante).
  const jours = await joursDeCoursPourLundis(lundis.map((l) => l.lundi))
  for (const l of lundis) out.set(l.cle, dernierJourDeCours(jours, l.classeId, l.lundi))
  return out
}
