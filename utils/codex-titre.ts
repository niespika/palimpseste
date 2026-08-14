import 'server-only'
// Résolution BI-SOURCE des titres de session Codex (§6.2), SÉPARÉE de la requête
// principale pour la garder STATIQUE et byte-identique à l'avant-lot-5 (les selects
// dynamiques cassent l'inférence de types Supabase). Le `client` doit pouvoir lire
// scriptorium_contenus (admin, ou client prof — RLS prof-only).
//
// ⚠️ DÉGATÉE le 14/08, avec le recâblage de la création de synthèse Codex.
// Elle sautait sur `lireGatePlanActif` au motif que « gate OFF ⇒ aucune session
// ancrée contenu n'existe » : c'était vrai tant que le seul producteur de ces
// sessions était le plan d'évaluation, qui est gaté. Depuis que l'écran Codex crée
// nominalement des sessions ancrées `contenu_id`, la prémisse est fausse — garder
// le gate rendrait toute synthèse neuve SANS TITRE, partout (liste prof, écran
// élève, calendrier), gate OFF.
//
// Repli conservé : si `plan_evaluation_phase_a.sql` n'a pas été jouée, la colonne
// `contenu_id` manque, la requête échoue et `data` est null → map vide, comme
// avant. Aucun crash, seulement des titres absents — état déjà couvert par les
// appelants, qui retombent tous sur `|| ''`.

import type { SupabaseClient } from '@supabase/supabase-js'

export async function titresCoursParSession(client: SupabaseClient, sessionIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (sessionIds.length === 0) return out
  const { data } = await client
    .from('codex_sessions')
    .select('id, scriptorium_contenus(titre)')
    .in('id', sessionIds)
    .not('contenu_id', 'is', null)
  for (const r of data ?? []) {
    const rel = r.scriptorium_contenus
    const c = (Array.isArray(rel) ? rel[0] : rel) as { titre?: string } | null | undefined
    if (c?.titre) out.set(r.id as string, c.titre)
  }
  return out
}
