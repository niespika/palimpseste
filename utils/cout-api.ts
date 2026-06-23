import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'

// Tarif Claude Sonnet (USD / million de tokens) — aligné sur les calculs inline
// existants (Fragments, Codex). Centralisé ici pour les nouveaux modules.
const PRIX_INPUT = 3 / 1_000_000
const PRIX_OUTPUT = 15 / 1_000_000

/** Coût (USD) d'un appel à partir de son usage de tokens. */
export function coutMessage(usage?: { input_tokens?: number; output_tokens?: number } | null): number {
  if (!usage) return 0
  return (usage.input_tokens ?? 0) * PRIX_INPUT + (usage.output_tokens ?? 0) * PRIX_OUTPUT
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
