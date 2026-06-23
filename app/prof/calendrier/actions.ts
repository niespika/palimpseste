'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

/**
 * Édition légère d'une date depuis le calendrier : délègue l'écriture au module
 * propriétaire (le calendrier ne stocke aucune échéance). Seuls les événements
 * déclarés `is_editable` par l'agrégateur sont modifiables.
 */
export async function modifierDateEvenement(input: {
  source_module: string
  source_id: string
  classe_id: string | null
  date: string
}): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { error: 'Date invalide.' }

  switch (input.source_module) {
    case 'fragments': {
      // Essai : la date est portée par classe (fragments_essais_classes).
      if (!input.classe_id) return { error: 'Classe manquante.' }
      const { error } = await supabase
        .from('fragments_essais_classes')
        .update({ date_essai: input.date })
        .eq('essai_id', input.source_id)
        .eq('classe_id', input.classe_id)
      if (error) return { error: error.message }
      break
    }
    default:
      return { error: 'Cet événement n’est pas modifiable depuis le calendrier.' }
  }

  revalidatePath('/prof/calendrier')
  revalidatePath('/prof')
  return {}
}
