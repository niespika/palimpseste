import 'server-only'
// ============================================================================
// C7 · L1 — « LE JUGE REÇOIT LES DOCUMENTS » : L'INTERRUPTEUR.
// Patron : `utils/copie/porte.ts` (la copie annotée, 03/09).
// ----------------------------------------------------------------------------
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// Colonne `scriptorium_params.juge_documents_actif` (`c7_l1_juge_documents.sql`).
// ⚠️ Requête SÉPARÉE et TOLÉRANTE : colonne absente (migration non jouée) ou
//    illisible ⇒ OFF. « Une porte illisible se ferme, jamais l'inverse. »
// ⛔ Ce n'est PAS `gabarit_actif` (`07-` §2, chapitre C7) : ce lot « ne dépend
//    pas du gabarit et sert la banque du 31/08 dès qu'il est déployé ». Un
//    interrupteur unique aurait couplé le juge à la console neuve — « un
//    interrupteur unique rendait le diagnostic impossible sans tout allumer »
//    (`07-` §5). Un lot lit LE SIEN, jamais celui d'un voisin.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lireLaPorteJugeDocuments(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('juge_documents_actif').eq('id', 1).maybeSingle()
  if (error) return false
  return !!(data as { juge_documents_actif?: boolean } | null)?.juge_documents_actif
}

/**
 * La bascule — depuis Paramètres de Scriptorium, où vivent déjà `rag_actif` et
 * `copie_annotee_actif`. Patron : `basculerLaPorteCopieAnnotee`.
 */
export async function basculerLaPorteJugeDocuments(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ juge_documents_actif: actif })
    .eq('id', 1).select('juge_documents_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Le juge reçoit les documents : aux crans 4, 5, 7 et 9, il tranche l’exercice contre ce qu’on tient pour vrai, et Calame cite le passage.'
    : 'Le juge ne reçoit plus les documents : la chaîne reprend son cours d’avant, aucun verdict de cran n’est écrit.' }
}
