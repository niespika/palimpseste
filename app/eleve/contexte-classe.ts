import 'server-only'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// Contexte de classe côté élève (Lot 9, ⭐ référencé par les Lots 10/11). Un
// élève bi-classe a un travail distinct par classe (Lot 1) ; ce contexte scope
// TOUTE l'expérience élève à une classe (= une inscription) à la fois. Mémorisé
// en cookie ; défaut = première inscription active. Mono-classe : pas de choix.
export const COOKIE_CLASSE_ELEVE = 'eleve_classe'

export interface InscriptionEleve {
  id: string
  classe_id: string
  classe_nom: string
}

export interface ContexteClasseEleve {
  inscriptions: InscriptionEleve[]
  active: InscriptionEleve | null
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

  if (inscriptions.length === 0) return { inscriptions, active: null }

  const cookieStore = await cookies()
  const voulu = cookieStore.get(COOKIE_CLASSE_ELEVE)?.value
  const active = inscriptions.find((i) => i.id === voulu) ?? inscriptions[0]
  return { inscriptions, active }
}
