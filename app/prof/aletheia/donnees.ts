import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StatutAletheia, TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

export interface SemaineProf { semaine: number; titre: string; chapitres: string | null }
export interface LivreProf { id: string; titre: string; nb_semaines: number | null; semaines: SemaineProf[] }

// Livres (type='livre') assignés à une classe + leurs semaines (titre/chapitres).
// Côté prof : tout passe par le client admin (Scriptorium est en RLS prof-only,
// mais on garde admin pour cohérence avec le reste du module).
export async function livresDeClasse(admin: SupabaseClient, classeId: string): Promise<LivreProf[]> {
  const { data: liens } = await admin
    .from('scriptorium_unite_classes').select('unite_id').eq('classe_id', classeId)
  const bookIds = [...new Set((liens ?? []).map(l => l.unite_id as string))]
  if (bookIds.length === 0) return []

  const [{ data: unites }, { data: docs }] = await Promise.all([
    admin.from('scriptorium_unites')
      .select('id, label, nb_semaines').eq('type', 'livre').in('id', bookIds).order('ordre', { ascending: true }),
    admin.from('scriptorium_documents')
      .select('unite_id, semaine, titre, chapitres').in('unite_id', bookIds)
      .not('semaine', 'is', null).order('semaine', { ascending: true }),
  ])

  const semParLivre = new Map<string, SemaineProf[]>()
  for (const d of docs ?? []) {
    const uid = d.unite_id as string
    const arr = semParLivre.get(uid) ?? []
    arr.push({ semaine: d.semaine as number, titre: (d.titre as string) ?? `Semaine ${d.semaine}`, chapitres: (d.chapitres as string | null) ?? null })
    semParLivre.set(uid, arr)
  }

  return (unites ?? []).map(u => ({
    id: u.id as string,
    titre: u.label as string,
    nb_semaines: (u.nb_semaines as number | null) ?? null,
    semaines: semParLivre.get(u.id as string) ?? [],
  }))
}

// Les travaux d'un élève pour un livre, indexés par semaine (lecture prof via admin).
export async function travauxEleve(admin: SupabaseClient, eleveId: string, livreId: string): Promise<Map<number, TravailAletheia>> {
  const { data } = await admin
    .from('aletheia_travaux').select('*')
    .eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId)
  const m = new Map<number, TravailAletheia>()
  for (const t of (data ?? []) as TravailAletheia[]) m.set(t.semaine_index, t)
  return m
}

export interface Progression {
  total: number
  done: number
  semaineCourante: number | null
  statutCourant: StatutAletheia | null
}

// Avancée d'un élève sur un livre : X/N terminées + la semaine « en cours »
// (1re semaine non DONE dans l'ordre) et son statut.
export function progression(semaines: SemaineProf[], travaux: Map<number, TravailAletheia>): Progression {
  const ordre = [...new Set(semaines.map(s => s.semaine))].sort((a, b) => a - b)
  const total = ordre.length
  const done = ordre.filter(s => travaux.get(s)?.statut === 'DONE').length
  const courante = ordre.find(s => (travaux.get(s)?.statut ?? 'DRAFT') !== 'DONE') ?? null
  const statutCourant = courante != null ? (travaux.get(courante)?.statut ?? 'DRAFT') : null
  return { total, done, semaineCourante: courante, statutCourant }
}

export const STATUT_LABEL: Record<StatutAletheia, string> = {
  DRAFT: 'À commencer',
  V1_SUBMITTED: 'Retour 1 en préparation',
  FEEDBACK1_READY: 'Retour 1 lu — à réécrire',
  VF_SUBMITTED: 'Retour final en préparation',
  FEEDBACK2_READY: 'Retour final à valider',
  DONE: 'Terminée',
}

// ── Diagnostic (prof-only) ──────────────────────────────────────────────────

// Diagnostics d'un livre indexés par élève → semaine.
export async function chargerDiagnostics(
  admin: SupabaseClient, eleveIds: string[], livreId: string,
): Promise<Map<string, Map<number, DiagnosticTravail>>> {
  const m = new Map<string, Map<number, DiagnosticTravail>>()
  if (eleveIds.length === 0) return m
  const { data } = await admin.from('aletheia_diagnostic')
    .select('travail_id, eleve_id, semaine_index, inventaire_v1, niveau_these_v1, niveau_arguments_v1, these_mal_definie_v1, inventaire_vf, niveau_these_vf, niveau_arguments_vf, these_mal_definie_vf, erreur_at')
    .eq('scriptorium_livre_id', livreId).in('eleve_id', eleveIds)
  for (const d of (data ?? []) as DiagnosticTravail[]) {
    const parSem = m.get(d.eleve_id) ?? new Map<number, DiagnosticTravail>()
    parSem.set(d.semaine_index, d)
    m.set(d.eleve_id, parSem)
  }
  return m
}

// Une phase de diagnostic est EN ATTENTE si le travail porte la donnée mais que
// l'inventaire correspondant manque (V1 = idée présente ; VF = version finale).
export function diagnosticEnAttente(t: TravailAletheia, d: DiagnosticTravail | undefined): boolean {
  const needV1 = !!(t.these && t.these.trim()) && !d?.inventaire_v1
  const needVf = !!(t.these_vf && t.these_vf.trim()) && !d?.inventaire_vf
  return needV1 || needVf
}

// Un travail est « rendu » pour une semaine dès que la V1 est soumise (≠ DRAFT).
export const estRendu = (t: TravailAletheia | undefined): boolean => !!t && t.statut !== 'DRAFT'

export interface SignalSemaine { semaine: number; pctRendu: number; aFaire: boolean }
export interface EtatDiagnosticLivre { signaux: SignalSemaine[]; totalEnAttente: number; aFaire: boolean }

// Signal « diagnostic à faire » : par semaine, ≥60 % de la classe a rendu ET il
// reste des phases en attente. `totalEnAttente` = nb de travaux à diagnostiquer
// (tous élèves × toutes semaines), car les rythmes sont décalés (SPEC §2).
export function etatDiagnosticLivre(
  semaines: number[],
  classeSize: number,
  travauxParEleveSem: Map<string, Map<number, TravailAletheia>>,
  diagParEleveSem: Map<string, Map<number, DiagnosticTravail>>,
): EtatDiagnosticLivre {
  const SEUIL = 0.6
  const signaux: SignalSemaine[] = []
  let totalEnAttente = 0
  for (const semaine of [...new Set(semaines)].sort((a, b) => a - b)) {
    let rendus = 0
    let enAttente = 0
    for (const [eleveId, parSem] of travauxParEleveSem) {
      const t = parSem.get(semaine)
      if (estRendu(t)) {
        rendus++
        if (t && diagnosticEnAttente(t, diagParEleveSem.get(eleveId)?.get(semaine))) enAttente++
      }
    }
    totalEnAttente += enAttente
    const pctRendu = classeSize > 0 ? rendus / classeSize : 0
    signaux.push({ semaine, pctRendu, aFaire: pctRendu >= SEUIL && enAttente > 0 })
  }
  return { signaux, totalEnAttente, aFaire: signaux.some(s => s.aFaire) }
}
