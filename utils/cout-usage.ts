// Tarification et NORMALISATION D'USAGE des appels IA — partie PURE de cout-api.
// Aucune I/O : ce module ne fait que compter et multiplier. Il est TESTÉ sous
// `node --test` (utils/cout-usage.test.ts) → il n'importe JAMAIS 'server-only'
// (paquet résolu par Next seul : un module qui l'importe ne s'exécute pas hors
// bundle — cf. l'en-tête d'utils/scriptorium-corpus.ts). L'écriture en base vit
// dans utils/cout-api.ts, qui ré-exporte tout ce fichier : les appelants
// existants continuent d'importer depuis '@/utils/cout-api'.

// Tarif Claude Sonnet (USD / million de tokens) — aligné sur les calculs inline
// existants (Fragments, Codex). Centralisé ici pour les nouveaux modules.
const PRIX_INPUT = 3 / 1_000_000
const PRIX_OUTPUT = 15 / 1_000_000

/** Usage BRUT du SDK Anthropic (la forme que lisent les 12 sites Aletheia/Quazian). */
export interface UsageAnthropic {
  input_tokens?: number
  output_tokens?: number
  cache_read_input_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_creation?: {
    ephemeral_5m_input_tokens?: number | null
    ephemeral_1h_input_tokens?: number | null
  } | null
}

/** Usage NORMALISÉ par fournisseur (UsageIA d'utils/ia-fournisseur — RAG L5). */
export interface UsageNormalise {
  entree: number
  sortie: number
  cacheLecture: number
  cacheEcriture5m: number
  cacheEcriture1h: number
}

/** Les 4 compteurs journalisés dans `api_couts` (écriture cache = tous TTL confondus). */
export interface CompteursTokens {
  entree: number
  sortie: number
  cacheLecture: number
  cacheEcriture: number
}

/**
 * Coût (USD) d'un appel à partir de son usage de tokens.
 * Prend en compte le prompt caching : lecture cache ~0,1× le prix d'entrée,
 * écriture cache 1,25× (TTL 5 min) ou 2× (TTL 1 h). Rétro-compatible : un usage
 * sans champ de cache se price exactement comme avant.
 */
export function coutMessage(usage?: UsageAnthropic | null): number {
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
export function coutSelonModele(modele: string, usage: UsageNormalise): number {
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

const nb = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0)

/**
 * Normalise les DEUX formes d'usage en circulation vers les 4 compteurs
 * journalisés (C11a-bis) :
 *  • l'usage BRUT Anthropic (celui que lit `coutMessage`, `cache_creation` inclus) ;
 *  • l'`UsageIA` déjà normalisé d'utils/ia-fournisseur (Anthropic OU Gemini).
 * L'écriture de cache est TOTALISÉE, tous TTL confondus : le détail 5 min / 1 h
 * sert au PRIX (cf. `coutSelonModele`), jamais au suivi.
 *
 * Renvoie `null` quand il n'y a PAS d'usage : « non mesuré » (colonnes NULL en
 * base) ne se confond pas avec « 0 token » — c'est exactement la distinction que
 * C11a a payé cher pour rendre visible.
 */
export function normaliserUsage(usage: UsageAnthropic | UsageNormalise | null | undefined): CompteursTokens | null {
  if (!usage || typeof usage !== 'object') return null

  // Forme normalisée (UsageIA) : reconnue à ses champs français.
  if ('entree' in usage || 'cacheEcriture5m' in usage || 'cacheEcriture1h' in usage) {
    const u = usage as Partial<UsageNormalise>
    return {
      entree: nb(u.entree),
      sortie: nb(u.sortie),
      cacheLecture: nb(u.cacheLecture),
      cacheEcriture: nb(u.cacheEcriture5m) + nb(u.cacheEcriture1h),
    }
  }

  // Forme brute Anthropic. `cache_creation_input_tokens` est le TOTAL d'écriture ;
  // le détail par TTL peut l'accompagner (ou le remplacer sur certains SDK) → on
  // garde le plus grand des deux plutôt que d'en perdre une partie.
  const u = usage as UsageAnthropic
  const w5 = nb(u.cache_creation?.ephemeral_5m_input_tokens)
  const w1 = nb(u.cache_creation?.ephemeral_1h_input_tokens)
  return {
    entree: nb(u.input_tokens),
    sortie: nb(u.output_tokens),
    cacheLecture: nb(u.cache_read_input_tokens),
    cacheEcriture: Math.max(nb(u.cache_creation_input_tokens), w5 + w1),
  }
}
