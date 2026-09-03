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

/**
 * La bascule — depuis Paramètres de Scriptorium (demande de Louis, 03/09), où
 * vivent déjà `rag_actif` et les autres colonnes de `scriptorium_params`.
 * Patron : `basculerLaPorteDuSignalement` (`utils/signalements/serveur.ts`).
 */
export async function basculerLaPorteCopieAnnotee(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ copie_annotee_actif: actif })
    .eq('id', 1).select('copie_annotee_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'La copie annotée est ouverte : la passation liste les noms, chaque nom ouvre sa copie.'
    : 'La copie annotée est fermée : la passation reprend sa liste d’avant, les pages de copie disent « à OFF ».' }
}
