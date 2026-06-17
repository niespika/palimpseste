import 'server-only'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// Contexte semestre du module Fragments (Lot 5 — 5.0). Tout est scopé à un
// semestre ; un sélecteur au niveau du module mémorise le semestre consulté
// (cookie), par défaut le semestre « courant ». Les passés restent consultables.
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
    .from('fragments_semestres')
    .select('id, label, courant')
    .order('date_debut', { ascending: false })

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
