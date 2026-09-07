import 'server-only'
// ============================================================================
// C7 · L9 — « SUR UN CRAN QUI ISOLE, LE JUGE EST LA MESURE » : L'INTERRUPTEUR,
// `juge_mesure_actif`. Patron : `porte-cle.ts` (C7-L8), `utils/juge/porte.ts` (C7-L1).
// ----------------------------------------------------------------------------
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// Colonne `scriptorium_params.juge_mesure_actif` (`c7_l9_juge_mesure.sql`).
// ⚠️ Requête SÉPARÉE et TOLÉRANTE : colonne absente (migration non jouée) ou
//    illisible ⇒ OFF. « Une porte illisible se ferme, jamais l'inverse. »
// ⛔ Ce n'est PAS `chaine_actif`, ni `gabarit_actif`, ni `chaine_cle_actif`, ni
//    `juge_documents_actif` : « un lot lit LE SIEN, jamais celui d'un voisin »
//    (`07-` §5). ⚠️ Elle N'A DE SENS que `juge_documents_actif` ouvert : porte
//    ouverte et juge fermé, aucun verdict ne peut exister — la chaîne d'hier, et
//    une alerte nommée (`juge-mesure.ts`, `regimeJugeMesure`).
// Ce qu'elle protège, et RIEN d'autre (aux crans 1·2·3·4·5·7·9 servis par le
// routeur, sur un exercice qui isole avec une clé) :
//   (1) ni P1 ni P2 : la mesure est le verdict converti, lettre-équivalente NULLE ;
//   (2) aux 1·3, la clôture met le dépôt en file et la mesure s'écrit sans appel ;
//   (3) en vf, le juge rejoue à l'aveugle et le delta est celui des verdicts ;
//   (4) Calame reçoit le verdict, la copie, les documents et la dimension —
//       aucun squelette (`07-` §4 bis) ;
//   (5) le poids par cran dans le taux, et le signal de trajectoire au 6·8.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lireLaPorteJugeMesure(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('juge_mesure_actif').eq('id', 1).maybeSingle()
  if (error) return false
  return !!(data as { juge_mesure_actif?: boolean } | null)?.juge_mesure_actif
}

/** La bascule — depuis Paramètres de Scriptorium. Patron : `basculerLaPorteChaineCle`. */
export async function basculerLaPorteJugeMesure(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ juge_mesure_actif: actif })
    .eq('id', 1).select('juge_mesure_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Sur un cran qui isole servi par le routeur, le juge est la mesure : ni P1 ni P2, le verdict converti s’écrit sans lettre, Calame reçoit le verdict et les documents. N’a d’effet que si le juge est ouvert.'
    : 'La chaîne mesure comme avant sur les crans qui isolent : P1 et P2 tournent, la lettre-équivalente s’écrit, et rien de ce lot ne s’applique.' }
}
