import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'

// Tarif Claude Sonnet (USD / million de tokens) — aligné sur les calculs inline
// existants (Fragments, Codex). Centralisé ici pour les nouveaux modules.
const PRIX_INPUT = 3 / 1_000_000
const PRIX_OUTPUT = 15 / 1_000_000

/**
 * Coût (USD) d'un appel à partir de son usage de tokens.
 * Prend en compte le prompt caching : lecture cache ~0,1× le prix d'entrée,
 * écriture cache 1,25× (TTL 5 min) ou 2× (TTL 1 h). Rétro-compatible : un usage
 * sans champ de cache se price exactement comme avant.
 */
export function coutMessage(usage?: {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_creation?: {
    ephemeral_5m_input_tokens?: number | null
    ephemeral_1h_input_tokens?: number | null
  } | null
} | null): number {
  if (!usage) return 0
  const write5m = usage.cache_creation?.ephemeral_5m_input_tokens ?? 0
  const write1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0
  // Détail par TTL absent → on price le total d'écriture restant au tarif 5 min.
  const writeReste = Math.max(0, (usage.cache_creation_input_tokens ?? 0) - write5m - write1h)
  return (usage.input_tokens ?? 0) * PRIX_INPUT
    + (usage.output_tokens ?? 0) * PRIX_OUTPUT
    + (usage.cache_read_input_tokens ?? 0) * PRIX_INPUT * 0.1
    + write5m * PRIX_INPUT * 1.25
    + write1h * PRIX_INPUT * 2.0
    + writeReste * PRIX_INPUT * 1.25
}

/**
 * Journalise un coût API pour un module sans ligne « hôte » (Quazian, Aletheia).
 * Best-effort : n'interrompt jamais le flux principal en cas d'erreur.
 */
export async function enregistrerCoutApi(module: string, cout: number): Promise<void> {
  if (!cout || cout <= 0) return
  try {
    const admin = createAdminClient()
    await admin.from('api_couts').insert({ module, cout })
  } catch (e) {
    console.error('[cout-api] échec journalisation', e)
  }
}
