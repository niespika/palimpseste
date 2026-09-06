import 'server-only'
// ============================================================================
// C7 · L8 — « LA CHAÎNE À L'HEURE DE LA CLÉ » : L'INTERRUPTEUR, `chaine_cle_actif`.
// Patron : `utils/juge/porte.ts` (le juge, C7-L1), `utils/copie/porte.ts`.
// ----------------------------------------------------------------------------
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// Colonne `scriptorium_params.chaine_cle_actif` (`c7_l8_chaine_cle.sql`).
// ⚠️ Requête SÉPARÉE et TOLÉRANTE : colonne absente (migration non jouée) ou
//    illisible ⇒ OFF. « Une porte illisible se ferme, jamais l'inverse. »
// ⛔ Ce n'est PAS `chaine_actif` (la coupure de facture), ni `gabarit_actif`, ni
//    `juge_documents_actif` : « un lot lit LE SIEN, jamais celui d'un voisin »
//    (`07-` §5). Décision de Louis, 06/09 au soir : « le lot change le retour de
//    tous les dépôts, un lot lit le sien ».
// Ce qu'elle protège, et RIEN d'autre (porte fermée, la chaîne d'hier à l'octet,
// et les tests le prouvent — `cle.test.ts`, `retour-cle.test.ts`, `juger.test.ts`) :
//   (1) le signal de recopie du devoir aux crans 3·5·7 ;
//   (2) la mesure et le retour restreints à l'observable de la clé sur un
//       exercice qui isole avec une clé ;
//   (3) le « se juger » sur la seule compétence de la clé, son observable en tête ;
//   (4) l'élagage d'une citation présente dans le matériau ET la copie, hors du
//       passage à corriger.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lireLaPorteChaineCle(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('chaine_cle_actif').eq('id', 1).maybeSingle()
  if (error) return false
  return !!(data as { chaine_cle_actif?: boolean } | null)?.chaine_cle_actif
}

/** La bascule — depuis Paramètres de Scriptorium. Patron : `basculerLaPorteJugeDocuments`. */
export async function basculerLaPorteChaineCle(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ chaine_cle_actif: actif })
    .eq('id', 1).select('chaine_cle_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'La chaîne lit la clé : sur un exercice qui isole, elle ne mesure que l’observable de la clé et le retour ne parle que de lui ; une citation recopiée du devoir s’écarte ; une copie qui reproduit le devoir se signale.'
    : 'La chaîne ne lit plus la clé : elle mesure et commente comme avant, et rien de ce lot ne s’applique.' }
}
