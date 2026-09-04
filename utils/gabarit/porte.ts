import 'server-only'
// ============================================================================
// C7 — LE GABARIT DES EXERCICES : L'INTERRUPTEUR DU CHAPITRE, `gabarit_actif`.
// Patron : `utils/copie/porte.ts`. Colonne `scriptorium_params.gabarit_actif`
// (`c7_l2_gabarit_base.sql`), à OFF.
// ----------------------------------------------------------------------------
// « Rien de ceci ne s'allume sans son interrupteur : `gabarit_actif`, à OFF,
//   propre au chapitre C7 — la banque du 31/08 se sert sous l'ancien régime tant
//   qu'un objet n'a pas sa vague neuve, et la bascule est PAR OBJET » (`07-` §1.1).
// ⚠️ Requête SÉPARÉE et TOLÉRANTE : colonne absente ou illisible ⇒ OFF.
// ⛔ Le juge du cran a LE SIEN (`juge_documents_actif`) : ce lot-ci ne le lit pas.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lireLaPorteGabarit(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('gabarit_actif').eq('id', 1).maybeSingle()
  if (error) return false
  return !!(data as { gabarit_actif?: boolean } | null)?.gabarit_actif
}

export async function basculerLaPorteGabarit(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ gabarit_actif: actif })
    .eq('id', 1).select('gabarit_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Le gabarit est ouvert : les exercices entrés au format 1.5 se servent sous le régime du gabarit, objet par objet.'
    : 'Le gabarit est fermé : toute la banque se sert sous le régime d’avant.' }
}
