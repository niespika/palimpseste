import 'server-only'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// Contexte semestre du module Fragments. Le semestre est désormais GLOBAL
// (table `semesters`, propriété du calendrier) ; un sélecteur au niveau du
// module mémorise le semestre consulté (cookie), par défaut le semestre actif.
// Les passés restent consultables. (On conserve le vocabulaire « courant »
// côté Fragments via un alias sur is_active pour ne pas toucher au reste.)
export const COOKIE_SEMESTRE_FRAGMENTS = 'fragments_semestre'

export interface SemestreRef {
  id: string
  label: string
  courant: boolean
}

export interface ContexteSemestre {
  semestre: SemestreRef | null
  semestres: SemestreRef[]
}

export async function semestreFragmentsActif(
  supabase: SupabaseClient
): Promise<ContexteSemestre> {
  const { data } = await supabase
    .from('semesters')
    .select('id, label:name, courant:is_active')
    .order('start_date', { ascending: false })

  const semestres = (data ?? []) as SemestreRef[]
  if (semestres.length === 0) return { semestre: null, semestres }

  const cookieStore = await cookies()
  const voulu = cookieStore.get(COOKIE_SEMESTRE_FRAGMENTS)?.value
  const semestre =
    semestres.find((s) => s.id === voulu) ??
    semestres.find((s) => s.courant) ??
    semestres[0]

  return { semestre, semestres }
}
