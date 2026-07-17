// Résolution de la DATE d'une synthèse de fin de cours (plan d'évaluation, §5.4 S1-S2).
// La synthèse est le seul exercice à ancrage 'parcours' : sa date n'est PAS stockée
// (régime figé du bras 'semaine'), elle est RÉSOLUE à la lecture — déplacer un créneau
// déplace la synthèse par construction, sans écriture. I/O : client `admin` en paramètre
// (scriptorium_parcours* en RLS prof-only) ; le jour précis passe par coursParJour (prof).

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDaysUTC, toISODate } from './calendrier-grille'
import { construireApercuAssign, type AssignParcours, type ApercuSemaine } from './parcours-apercu'
import { coursParJour } from './calendrier-cours'

/**
 * S1 — Semaine-cible (fin de cours = dernier créneau). Un « cours » = un contenu
 * `type='cours'` référencé par ≥1 créneau du parcours. Semaine-cible = max(semaine)
 * des créneaux VIVANTS du parcours référençant ce contenu (un cours étalé se synthétise
 * après son dernier créneau). `semaine` est RELATIVE au parcours (1..nb_semaines).
 * null si le parcours ou le contenu est retiré, ou si aucun créneau ne le référence.
 */
export async function semaineCibleSynthese(
  admin: SupabaseClient, parcoursId: string, contenuId: string,
): Promise<number | null> {
  const { data: parc } = await admin.from('scriptorium_parcours')
    .select('supprime_at').eq('id', parcoursId).maybeSingle()
  if (!parc || (parc as { supprime_at?: string | null }).supprime_at != null) return null
  const { data: cont } = await admin.from('scriptorium_contenus')
    .select('supprime_at').eq('id', contenuId).maybeSingle()
  if (!cont || (cont as { supprime_at?: string | null }).supprime_at != null) return null
  const { data: creneaux } = await admin.from('scriptorium_parcours_creneaux')
    .select('semaine').eq('parcours_id', parcoursId).eq('ref_type', 'contenu').eq('contenu_id', contenuId)
  const semaines = (creneaux ?? []).map((c) => c.semaine as number)
  if (semaines.length === 0) return null
  return Math.max(...semaines)
}

// Charge l'assignation ACTIVE d'un parcours à une classe (nb_semaines + date_debut +
// snapshot horaire), tolérant si les colonnes snapshot n'existent pas (migration non
// jouée → repli sans snapshot). null si la classe n'est pas assignée activement.
async function chargerAssignSynthese(
  admin: SupabaseClient, parcoursId: string, classeId: string,
): Promise<AssignParcours | null> {
  const { data: parc } = await admin.from('scriptorium_parcours')
    .select('nb_semaines').eq('id', parcoursId).maybeSingle()
  if (!parc) return null
  const nbSemaines = ((parc as { nb_semaines?: number }).nb_semaines as number) ?? 0
  let row: Record<string, unknown> | null = null
  const withSnap = await admin.from('scriptorium_parcours_classes')
    .select('date_debut, horaire_snapshot')
    .eq('parcours_id', parcoursId).eq('classe_id', classeId).eq('statut', 'active').maybeSingle()
  if (withSnap.error) {
    const noSnap = await admin.from('scriptorium_parcours_classes')
      .select('date_debut')
      .eq('parcours_id', parcoursId).eq('classe_id', classeId).eq('statut', 'active').maybeSingle()
    row = (noSnap.data as Record<string, unknown> | null) ?? null
  } else {
    row = (withSnap.data as Record<string, unknown> | null) ?? null
  }
  if (!row) return null
  const snap = row.horaire_snapshot as ApercuSemaine[] | null | undefined
  return {
    parcoursId,
    nbSemaines,
    dateDebut: (row.date_debut as string | null) ?? null,
    snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
  }
}

// DERNIER jour de cours de la classe dans la semaine du LUNDI donné (la synthèse a lieu
// en classe, en fin de cours). Repli VENDREDI (lundi+4) si la classe n'a aucun cours
// cette semaine-là. coursParJour lit teaching_patterns/exceptions (client prof).
async function dernierJourDeCours(classeId: string, lundi: string): Promise<string> {
  const base = new Date(lundi + 'T00:00:00Z')
  const fin = toISODate(addDaysUTC(base, 6))
  const jours = await coursParJour({ debut: lundi, fin })
  let dernier: string | null = null
  for (let i = 0; i < 7; i++) {
    const d = toISODate(addDaysUTC(base, i))
    if ((jours.get(d) ?? []).some((c) => c.id === classeId)) dernier = d
  }
  return dernier ?? toISODate(addDaysUTC(base, 4)) // repli vendredi
}

/**
 * S2 — Date réelle d'une synthèse pour LA classe du plan : semaine-cible (S1) → aperçu de
 * l'assignation (SNAPSHOT publié prioritaire, repli FRISE recalculée ; une semaine ne
 * porte une date que si statut='definie') → LUNDI de la semaine → DERNIER jour de cours
 * de la classe (repli vendredi). null si non résoluble (pas d'assignation active, semaine
 * non définie, parcours/contenu retiré). Recalculée à CHAQUE lecture (régime S1) : déplacer
 * un créneau ou re-dater l'assignation déplace la synthèse sans écriture.
 */
export async function resoudreDateSynthese(
  admin: SupabaseClient, parcoursId: string, contenuId: string, classeId: string,
): Promise<string | null> {
  const semaineCible = await semaineCibleSynthese(admin, parcoursId, contenuId)
  if (semaineCible == null) return null
  const assign = await chargerAssignSynthese(admin, parcoursId, classeId)
  if (!assign) return null
  const ap = await construireApercuAssign(admin, assign)
  if (!ap) return null
  const e = ap.apercu.find((a) => a.semaine === semaineCible)
  if (!e || e.statut !== 'definie' || !e.dateReelle) return null
  return dernierJourDeCours(classeId, e.dateReelle)
}
