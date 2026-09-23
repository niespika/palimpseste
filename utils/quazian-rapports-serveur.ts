import 'server-only'
// ============================================================================
// LES RAPPORTS DE FRAGILITÉS CONSERVÉS — la porte et la lecture (23/09/2026).
// Migration : `quazian_rapports_fragilites.sql`. Patron de la porte :
// `utils/quazian-antichambre-serveur.ts`. Porte fermée, rien ne lit la table.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLesReglages } from '@/utils/scriptorium-params'

export interface RapportFragilites { id: string; contenu: string; created_at: string }

export async function lirePorteRapport(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await lireLesReglages(admin)
  if (error) return false
  return !!(data as { quazian_rapport_actif?: boolean } | null)?.quazian_rapport_actif
}

export async function basculerPorteRapport(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ quazian_rapport_actif: actif })
    .eq('id', 1).select('quazian_rapport_actif')
  if (error && /quazian_rapport_actif/.test(error.message)) {
    return { ok: false, message: 'Cette base n’a pas encore reçu la migration `quazian_rapports_fragilites.sql` : l’interrupteur ne peut pas s’ouvrir.' }
  }
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Le rapport de fragilités se génère par classe et reste consultable, daté.'
    : 'Le rapport de fragilités redevient celui d’hier : toutes classes, non conservé.' }
}

/** Les derniers rapports d'une classe, du plus récent au plus ancien. */
export async function chargerRapports(
  client: SupabaseClient, classeId: string, limite = 10,
): Promise<{ rapports: RapportFragilites[]; error: string | null }> {
  const { data, error } = await client.from('quazian_rapports_fragilites')
    .select('id, contenu, created_at').eq('classe_id', classeId)
    .order('created_at', { ascending: false }).limit(limite)
  return { rapports: (data ?? []) as RapportFragilites[], error: error?.message ?? null }
}
