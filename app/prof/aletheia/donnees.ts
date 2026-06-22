import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { StatutAletheia, TravailAletheia } from '@/app/eleve/modules/aletheia/types'

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
