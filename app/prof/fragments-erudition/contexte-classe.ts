import 'server-only'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { classesAvecModule } from '@/utils/acces'

// Côté prof, le module Fragments se travaille une classe à la fois. La classe
// active est mémorisée dans un cookie ; toutes les vues prof scopent leur
// contenu sur cette classe (chaque élève d'une classe = une seule inscription).
export const COOKIE_CLASSE_FRAGMENTS = 'fragments_classe'

export interface ContexteClasseFragments {
  /** Classe active (cookie valide, sinon 1ʳᵉ classe du module). null si aucune. */
  classe: { id: string; nom: string } | null
  /** Toutes les classes ayant accès au module (pour le sélecteur). */
  classes: Array<{ id: string; nom: string }>
}

/**
 * Résout la classe active du module Fragments : lit le cookie, le valide contre
 * les classes ayant le module, retombe sur la première sinon.
 */
export async function classeFragmentsActive(
  supabase: SupabaseClient
): Promise<ContexteClasseFragments> {
  const { data: mod } = await supabase
    .from('modules')
    .select('id')
    .eq('slug', 'fragments-erudition')
    .maybeSingle()

  if (!mod) return { classe: null, classes: [] }

  const classes = await classesAvecModule(supabase, mod.id)
  if (classes.length === 0) return { classe: null, classes }

  const cookieStore = await cookies()
  const voulue = cookieStore.get(COOKIE_CLASSE_FRAGMENTS)?.value
  const classe = classes.find((c) => c.id === voulue) ?? classes[0]
  return { classe, classes }
}
