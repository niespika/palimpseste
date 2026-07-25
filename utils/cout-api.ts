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

// ── Tarifs PAR MODÈLE (RAG L5, SPEC §8.3) — USD / MILLION de tokens ──────────
// entree / sortie / cacheLecture / cacheEcriture5m / cacheEcriture1h. Valeurs
// juillet 2026. Gemini : cache implicite, aucune écriture facturée (null).
// `coutMessage` ci-dessus reste inchangé (rétro-compatibilité Sonnet).
export interface TarifModele {
  entree: number
  sortie: number
  cacheLecture: number
  cacheEcriture5m: number | null
  cacheEcriture1h: number | null
}

export const TARIFS: Record<string, TarifModele> = {
  'claude-sonnet-4-6':     { entree: 3,    sortie: 15,   cacheLecture: 0.30, cacheEcriture5m: 3.75, cacheEcriture1h: 6 },
  'claude-haiku-4-5':      { entree: 1,    sortie: 5,    cacheLecture: 0.10, cacheEcriture5m: 1.25, cacheEcriture1h: 2 },
  'gemini-3.5-flash-lite': { entree: 0.30, sortie: 2.50, cacheLecture: 0.03, cacheEcriture5m: null, cacheEcriture1h: null },
}

/**
 * Coût (USD) d'un appel depuis l'usage NORMALISÉ du fournisseur (UsageIA de
 * utils/ia-fournisseur). Modèle inconnu → tarif du préfixe le plus proche,
 * repli Sonnet (on préfère SUR-estimer un coût que le perdre).
 */
export function coutSelonModele(
  modele: string,
  usage: { entree: number; sortie: number; cacheLecture: number; cacheEcriture5m: number; cacheEcriture1h: number },
): number {
  const tarif = TARIFS[modele]
    ?? Object.entries(TARIFS).find(([id]) => modele.startsWith(id.split('-').slice(0, 2).join('-')))?.[1]
    ?? TARIFS['claude-sonnet-4-6']
  const M = 1_000_000
  return usage.entree * tarif.entree / M
    + usage.sortie * tarif.sortie / M
    + usage.cacheLecture * tarif.cacheLecture / M
    + usage.cacheEcriture5m * (tarif.cacheEcriture5m ?? 0) / M
    + usage.cacheEcriture1h * (tarif.cacheEcriture1h ?? 0) / M
}

/**
 * Journalise un coût API pour un module sans ligne « hôte » (Quazian, Aletheia,
 * Scriptorium/RAG). Best-effort : n'interrompt JAMAIS le flux principal — un
 * coût perdu ne doit pas coûter son retour à un élève.
 *
 * ⚠️ C11a — le piège qui a rendu ce suivi muet de juin à juillet 2026 :
 * supabase-js ne LÈVE pas sur erreur d'insertion, il retourne `{ error }`. Le
 * `try/catch` seul ne captait donc que l'échec de `createAdminClient()` (env vars
 * manquantes), et l'absence de la table `api_couts` passait totalement inaperçue.
 * D'où le `const { error }` ci-dessous : best-effort, mais jamais silencieux.
 */
export async function enregistrerCoutApi(module: string, cout: number): Promise<void> {
  if (!cout || cout <= 0) return
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('api_couts').insert({ module, cout })
    if (error) {
      console.error(
        `[cout-api] journalisation PERDUE — module=${module} cout=${cout.toFixed(6)}$`,
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
      )
    }
  } catch (e) {
    console.error(`[cout-api] journalisation PERDUE (exception) — module=${module} cout=${cout.toFixed(6)}$`, e)
  }
}
