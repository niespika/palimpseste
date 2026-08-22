import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import type { CompteursTokens } from '@/utils/cout-usage'

// Partie PURE (tarifs, prix d'un appel, normalisation d'usage) extraite dans
// utils/cout-usage.ts pour être TESTABLE sous `node --test` — ce fichier-ci
// importe 'server-only' (client service_role) et ne l'est donc pas. Ré-export
// intégral : les appelants continuent d'importer depuis '@/utils/cout-api'.
export {
  coutMessage, coutSelonModele, TARIFS, normaliserUsage,
  type TarifModele, type UsageAnthropic, type UsageNormalise, type CompteursTokens,
} from '@/utils/cout-usage'

/**
 * Attribution d'un coût — TOUT est optionnel, TOUT est best-effort (C11a-bis).
 * Règle : on ne renseigne que ce qui est DÉJÀ en scope à l'appel. Aucun champ ne
 * justifie une requête en base : un coût non attribué reste une ligne valide
 * (module + montant), et c'est la réalité de certaines générations (fiche de
 * référence d'un livre, capstone, cartes Quazian d'une unité partagée).
 */
export interface ContexteCout {
  eleveId?: string | null
  classeId?: string | null
  modele?: string | null
  tokens?: CompteursTokens | null
  /**
   * C4-L5 — le rattachement à l'exercice, ajouté par `c4_l1_existant.sql`.
   * « La `phase` dit L'ÉTAGE, pas le nombre d'appels : `p1`, `p2`, `retour`,
   * NULL hors exercices ; le nombre d'appels d'un étage se lit AU NOMBRE DE
   * LIGNES » (`07-` §1.2). Tous nullables, au mieux : un coût non attribuable
   * reste une ligne valide. Un lot RÉUTILISE ce journal, il n'en crée pas un second.
   */
  phase?: 'p1' | 'p2' | 'retour' | null
  depotId?: string | null
  competence?: string | null
  version?: 'v1' | 'vf' | null
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
export async function enregistrerCoutApi(module: string, cout: number, ctx?: ContexteCout): Promise<void> {
  if (!cout || cout <= 0) return
  const attribution = decrireAttribution(ctx)
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('api_couts').insert(ligneCout(module, cout, ctx))
    if (error) {
      console.error(
        `[cout-api] journalisation PERDUE — module=${module} cout=${cout.toFixed(6)}$${attribution}`,
        { code: error.code, message: error.message, details: error.details, hint: error.hint },
      )
    }
  } catch (e) {
    console.error(
      `[cout-api] journalisation PERDUE (exception) — module=${module} cout=${cout.toFixed(6)}$${attribution}`,
      e,
    )
  }
}

/** Ligne à insérer : les colonnes d'attribution ne sont posées que si elles sont fournies. */
function ligneCout(module: string, cout: number, ctx?: ContexteCout): Record<string, unknown> {
  const ligne: Record<string, unknown> = { module, cout }
  if (ctx?.eleveId) ligne.eleve_id = ctx.eleveId
  if (ctx?.classeId) ligne.classe_id = ctx.classeId
  if (ctx?.modele) ligne.modele = ctx.modele
  if (ctx?.tokens) {
    ligne.tokens_entree = ctx.tokens.entree
    ligne.tokens_sortie = ctx.tokens.sortie
    ligne.tokens_cache_lecture = ctx.tokens.cacheLecture
    ligne.tokens_cache_ecriture = ctx.tokens.cacheEcriture
  }
  if (ctx?.phase) ligne.phase = ctx.phase
  if (ctx?.depotId) ligne.depot_id = ctx.depotId
  if (ctx?.competence) ligne.competence = ctx.competence
  if (ctx?.version) ligne.version = ctx.version
  return ligne
}

// Un coût perdu se retrouve à la main dans les logs Vercel : le message doit
// dire DE QUI il s'agit, sinon la ligne est irrécupérable (leçon de juin-juillet).
function decrireAttribution(ctx?: ContexteCout): string {
  const bouts: string[] = []
  if (ctx?.eleveId) bouts.push(`eleveId=${ctx.eleveId}`)
  if (ctx?.classeId) bouts.push(`classeId=${ctx.classeId}`)
  if (ctx?.modele) bouts.push(`modele=${ctx.modele}`)
  if (ctx?.phase) bouts.push(`phase=${ctx.phase}`)
  if (ctx?.depotId) bouts.push(`depotId=${ctx.depotId}`)
  if (ctx?.competence) bouts.push(`competence=${ctx.competence}`)
  if (ctx?.version) bouts.push(`version=${ctx.version}`)
  return bouts.length ? ` ${bouts.join(' ')}` : ''
}
