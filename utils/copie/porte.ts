import 'server-only'
// ============================================================================
// LA COPIE ANNOTÉE — L'INTERRUPTEUR. Patron : `utils/passation/acces.ts`.
// ----------------------------------------------------------------------------
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// Colonne `scriptorium_params.copie_annotee_actif` (`copie_annotee_actif.sql`).
// ⚠️ Requête SÉPARÉE et TOLÉRANTE : colonne absente (migration non jouée) ou
//    illisible ⇒ OFF. « Une porte illisible se ferme, jamais l'inverse. »
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lireLaPorteCopieAnnotee(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('copie_annotee_actif').eq('id', 1).maybeSingle()
  if (error) return false
  return !!(data as { copie_annotee_actif?: boolean } | null)?.copie_annotee_actif
}
