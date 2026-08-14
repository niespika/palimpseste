import 'server-only'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { COOKIE_CLASSE_ELEVE, VALEUR_TOUTES, type InscriptionEleve } from './contexte-classe-valeurs'

// Contexte de classe côté élève (Lot 9, ⭐ référencé par les Lots 10/11). Un
// élève bi-classe a un travail distinct par classe (Lot 1) ; ce contexte scope
// TOUTE l'expérience élève à une classe (= une inscription) à la fois. Mémorisé
// en cookie ; défaut = première inscription active. Mono-classe : pas de choix.
//
// C7·L2 — le commutateur passe à TROIS états : « Toutes les classes » s'ajoute
// aux deux classes. Ce troisième état ne veut pas dire la même chose partout :
//   • tableau de bord et calendrier AGRÈGENT (toutes les classes à la fois) ;
//   • les modules restent par classe (v1) et demandent laquelle à l'entrée.
// Il n'existe que pour un élève bi-classe : un mono-classe n'a pas de choix à
// faire, et le commutateur reste masqué pour lui.
// Le nom du cookie, la valeur « Toutes » et le type d'inscription vivent dans un
// module sans `server-only` : le commutateur est un composant client et en a
// besoin. Ré-exportés ici pour que les appelants serveur gardent une seule porte.
export { COOKIE_CLASSE_ELEVE, VALEUR_TOUTES } from './contexte-classe-valeurs'
export type { InscriptionEleve } from './contexte-classe-valeurs'

export interface ContexteClasseEleve {
  inscriptions: InscriptionEleve[]
  /**
   * Inscription en contexte. `null` dans DEUX cas qui ne se confondent pas :
   * l'élève n'a aucune classe (`inscriptions` vide), ou il est en état
   * « Toutes » (`toutes` à true) — c'est `toutes` qui les départage.
   */
  active: InscriptionEleve | null
  /** État « Toutes les classes ». Toujours false pour un mono-classe. */
  toutes: boolean
}

export async function contexteClasseEleve(
  supabase: SupabaseClient,
  userId: string
): Promise<ContexteClasseEleve> {
  const { data } = await supabase
    .from('inscriptions')
    .select('id, classe_id, classe:classes(nom)')
    .eq('eleve_id', userId)
    .eq('statut', 'active')

  const inscriptions: InscriptionEleve[] = (data ?? []).map((r) => {
    const c = r.classe as { nom: string } | { nom: string }[] | null
    const nom = Array.isArray(c) ? c[0]?.nom : c?.nom
    return { id: r.id as string, classe_id: r.classe_id as string, classe_nom: nom ?? '—' }
  })
  inscriptions.sort((a, b) => a.classe_nom.localeCompare(b.classe_nom))

  if (inscriptions.length === 0) return { inscriptions, active: null, toutes: false }

  const cookieStore = await cookies()
  const voulu = cookieStore.get(COOKIE_CLASSE_ELEVE)?.value

  // « Toutes » n'est offert qu'au bi-classe : pour un mono-classe, un cookie
  // resté sur cette valeur (classe retirée depuis) retombe sur sa seule classe.
  if (voulu === VALEUR_TOUTES && inscriptions.length > 1) {
    return { inscriptions, active: null, toutes: true }
  }

  const active = inscriptions.find((i) => i.id === voulu) ?? inscriptions[0]
  return { inscriptions, active, toutes: false }
}

/**
 * Classes en contexte, pour les lectures qui scopent par classe :
 * une seule (état classe), toutes celles de l'élève (état « Toutes »), ou
 * aucune. C'est LE point de passage du scoping élève — les modules et le
 * tableau de bord y lisent leur périmètre au lieu de prendre l'union des
 * classes (`classeIdsActives`), qui montrait à un bi-classe le travail de son
 * autre classe quel que soit le contexte affiché (C7·L2, item 3).
 */
export async function classeIdsDuContexte(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { inscriptions, active, toutes } = await contexteClasseEleve(supabase, userId)
  if (toutes) return inscriptions.map((i) => i.classe_id)
  return active ? [active.classe_id] : []
}
