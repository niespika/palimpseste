// L'OUVERTURE DES SYNTHÈSES DE FIN DE COURS — l'intention du professeur, à la maille
// (assignation parcours×classe, cours). Table `scriptorium_syntheses_reglages`.
//
// ⭐ POURQUOI CE MODULE EXISTE. Jusqu'ici, une synthèse naissait TOUTE SEULE dès qu'un
//    cours entrait dans le parcours d'une classe à plan vivant (§5.4-S3), et le seul
//    interrupteur au-dessus éteignait tout le plan d'évaluation. Louis en voulait un
//    troisième cran, cours par cours et classe par classe : « dans l'instance du
//    parcours d'une classe, juste à côté du dernier chapitre d'un cours, je peux couper
//    ou ouvrir la synthèse » (01/09).
//
// ⭐ DEUX LECTEURS, DEUX USAGES — et c'est la même intention qui les gouverne :
//    · les HOOKS de création (`plan-synthese-hooks.ts`) ne créent que si c'est ouvert ;
//    · les SURFACES prof (à préparer, à-faire, calendrier, panoptique) mettent en
//      SOURDINE les synthèses des cours coupés — sans jamais les détruire.
//
// ⛔ LE DÉFAUT EST « COUPÉE ». Ligne absente ⇒ pas de synthèse. La table naît vide :
//    après la migration, plus rien ne se crée tant qu'un cours n'a pas été ouvert.
//
// ⚠️ MAIS LE REPLI, LUI, EST « TOUT OUVERT ». Si la table est absente (migration pas
//    encore jouée), on ne peut pas distinguer « coupé » de « pas encore migré » : on
//    retombe alors sur le comportement d'AVANT ce module — création automatique,
//    aucune sourdine. Un code poussé avant son SQL ne doit jamais faire disparaître
//    des synthèses de l'écran sur la foi d'une table qui n'existe pas.

import type { SupabaseClient } from '@supabase/supabase-js'

/** Clé de réglage : une assignation (parcours × classe) et un cours. */
const cle = (pcId: string, contenuId: string) => `${pcId}:${contenuId}`

/**
 * Réglages d'un lot d'assignations. `absente = true` ⇒ table illisible (migration pas
 * jouée) ⇒ TOUT est considéré ouvert par les appelants (repli = comportement d'avant).
 */
async function lireReglages(
  client: SupabaseClient, pcIds: string[],
): Promise<{ absente: boolean; ouvertes: Set<string> }> {
  const ouvertes = new Set<string>()
  if (pcIds.length === 0) return { absente: false, ouvertes }
  const { data, error } = await client
    .from('scriptorium_syntheses_reglages')
    .select('parcours_classe_id, contenu_id, ouverte')
    .in('parcours_classe_id', pcIds)
  // `error` non nul = table absente (42P01) ou lecture refusée : repli tout-ouvert.
  if (error) return { absente: true, ouvertes }
  for (const r of (data ?? []) as { parcours_classe_id: string; contenu_id: string; ouverte: boolean }[]) {
    if (r.ouverte) ouvertes.add(cle(r.parcours_classe_id, r.contenu_id))
  }
  return { absente: false, ouvertes }
}

/**
 * Les cours OUVERTS d'une instance, pour l'écran qui les affiche. Rend `null` si la
 * table est absente — l'écran l'affiche alors comme « migration pas encore jouée »
 * plutôt que de mentir en montrant tout coupé.
 */
export async function ouverturesDInstance(
  client: SupabaseClient, pcId: string,
): Promise<Set<string> | null> {
  const { absente, ouvertes } = await lireReglages(client, [pcId])
  if (absente) return null
  const out = new Set<string>()
  for (const k of ouvertes) out.add(k.slice(pcId.length + 1))
  return out
}

/** Ce cours est-il ouvert dans CETTE instance ? Table absente ⇒ true (repli). */
export async function estSyntheseOuverte(
  client: SupabaseClient, pcId: string, contenuId: string,
): Promise<boolean> {
  const { absente, ouvertes } = await lireReglages(client, [pcId])
  return absente || ouvertes.has(cle(pcId, contenuId))
}

/**
 * Pose l'intention. `ouverte` est écrit explicitement même à `false` : la ligne
 * distingue « coupé par le professeur » de « jamais réglé », ce que l'écran affiche
 * et ce qu'un futur défaut inverse pourrait avoir à respecter.
 */
export async function reglerSyntheseOuverte(
  client: SupabaseClient, pcId: string, contenuId: string, ouverte: boolean,
): Promise<{ error?: string }> {
  const { error } = await client
    .from('scriptorium_syntheses_reglages')
    .upsert(
      { parcours_classe_id: pcId, contenu_id: contenuId, ouverte, updated_at: new Date().toISOString() },
      { onConflict: 'parcours_classe_id,contenu_id' },
    )
  if (error) {
    // 42P01 : la table n'existe pas encore. Le dire, plutôt qu'un message brut de PostgREST.
    if (error.code === '42P01') {
      return { error: 'Réglage impossible : la migration `synthese_ouverture_par_cours.sql` n’est pas encore jouée sur cette base.' }
    }
    return { error: error.message }
  }
  return {}
}

/**
 * FILTRE DES SURFACES — parmi des synthèses à afficher, celles dont le cours est
 * OUVERT. Rend l'ensemble des `cle` à garder ; les autres sont mises en sourdine.
 *
 * ⚠️ Une synthèse dont l'assignation n'est plus ACTIVE est GARDÉE ici : son cours n'a
 *    plus de réglage lisible, et c'est la résolution de date (`resoudreDatesSyntheses`,
 *    S6) qui la déclarera non datable et l'écartera. Ce filtre ne tranche que ce qu'il
 *    sait ; il ne devine pas.
 */
export async function clesSynthesesOuvertes(
  admin: SupabaseClient,
  demandes: { cle: string; parcoursId: string; contenuId: string; classeId: string }[],
): Promise<Set<string>> {
  const garde = new Set<string>(demandes.map((d) => d.cle))
  if (demandes.length === 0) return garde

  const parcoursIds = [...new Set(demandes.map((d) => d.parcoursId).filter(Boolean))]
  const classeIds = [...new Set(demandes.map((d) => d.classeId).filter(Boolean))]
  if (parcoursIds.length === 0 || classeIds.length === 0) return garde

  const { data: assigns } = await admin
    .from('scriptorium_parcours_classes')
    .select('id, parcours_id, classe_id')
    .in('parcours_id', parcoursIds).in('classe_id', classeIds).eq('statut', 'active')
  const pcParPaire = new Map(
    ((assigns ?? []) as { id: string; parcours_id: string; classe_id: string }[])
      .map((a) => [`${a.parcours_id}:${a.classe_id}`, a.id]),
  )
  const pcIds = [...new Set([...pcParPaire.values()])]
  const { absente, ouvertes } = await lireReglages(admin, pcIds)
  if (absente) return garde // repli : tout ouvert, comme avant ce module

  for (const d of demandes) {
    const pcId = pcParPaire.get(`${d.parcoursId}:${d.classeId}`)
    if (!pcId) continue // assignation inactive → laissée à la résolution de date (S6)
    if (!ouvertes.has(cle(pcId, d.contenuId))) garde.delete(d.cle)
  }
  return garde
}
