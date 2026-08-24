// ============================================================================
// LE STATUT DE RECETTE — SA SOURCE UNIQUE, ET LE SEUL ENDROIT OÙ IL SE LIT.
// ----------------------------------------------------------------------------
// « Une compétence déclarée `evaluee` l'est POUR TOUTES LES CLASSES » (`07-`
// §1.3) : le statut est une propriété DE LA COMPÉTENCE, pas de l'élève.
//
// ⛔ IL A ÉTÉ STOCKÉ PAR ÉLÈVE, ET ÇA A COÛTÉ UN DÉFAUT SILENCIEUX. `poser_
//    statut_recette` était un INSTANTANÉ sur les inscriptions actives : tout
//    élève inscrit APRÈS la pose n'avait aucune ligne. Or `lireLesNiveaux` ne
//    rend que les lignes existantes — ses compétences n'étaient pas
//    `mesuree_silencieusement`, elles étaient ABSENTES, et le routeur n'avait
//    rien à cibler. Les élèves de la rentrée seraient partis hors du routeur,
//    sans « se juger » et sans palier, EN SILENCE.
//    Migration `c4_statut_recette_global.sql`.
//
// ⛔ NE PAS EN ÉCRIRE UNE COPIE PRIVÉE. C'est exactement ce qui est arrivé au
//    `cran` — une copie locale écrite pour l'ancienne forme a survécu à la
//    migration et a cassé un écran entier (`C4L11-F`). Un seul module lit la
//    forme ; les appelants reçoivent une valeur.
//
// ⛔ ET NE PLUS LIRE `competences_niveaux.statut_recette` NI
//    `monitoring_niveaux.statut_recette` : les deux colonnes sont DORMANTES,
//    la base le dit dans leur commentaire, et elles DÉRIVERONT.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { COMPETENCES, type Competence, type StatutRecette } from '@/utils/chaine/types'

type Admin = ReturnType<typeof createAdminClient>

/** Les sept lignes de la table : les six compétences, plus le Monitoring. */
export type CleStatut = Competence | 'monitoring'

/**
 * Le défaut quand une ligne manque. Il ne devrait jamais servir — la migration
 * verse les sept — mais « absent » ne doit jamais se lire comme « évalué ».
 */
export const STATUT_PAR_DEFAUT: StatutRecette = 'mesuree_silencieusement'

/**
 * Les statuts de recette, tous, lus à leur source unique.
 *
 * ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture ratée qui
 *    passerait pour une base vide ferait tenir toutes les compétences pour non
 *    évaluées — ce qui FERME au lieu d'ouvrir, donc dégrade dans le bon sens,
 *    mais se dit plutôt que se devine.
 */
export async function lireLesStatutsDeRecette(
  admin: Admin,
): Promise<Record<CleStatut, StatutRecette>> {
  const out = {} as Record<CleStatut, StatutRecette>
  for (const c of COMPETENCES) out[c] = STATUT_PAR_DEFAUT
  out.monitoring = STATUT_PAR_DEFAUT

  const { data, error } = await admin
    .from('competences_statut_recette')
    .select('competence, statut_recette')
  if (error) {
    console.error('[statut-recette] statuts illisibles — '
      + `${error.code} ${error.message}. Aucune compétence n'est tenue pour évaluée.`)
    return out
  }
  for (const l of (data ?? []) as unknown as Array<{ competence: string; statut_recette: string }>) {
    out[l.competence as CleStatut] = l.statut_recette as StatutRecette
  }
  return out
}

/** Le statut d'UNE compétence — même source, même défaut. */
export async function lireLeStatutDeRecette(
  admin: Admin, competence: CleStatut,
): Promise<StatutRecette> {
  const tous = await lireLesStatutsDeRecette(admin)
  return tous[competence] ?? STATUT_PAR_DEFAUT
}

/**
 * Les statuts AVEC leur date de pose — pour l'écran de la fabrique, seul
 * lecteur de la date (`07-` §1.3 : « son seul lecteur est le recalcul de la
 * lettre, depuis les seules mesures postérieures à la recette »).
 */
export async function lireLesStatutsAvecDate(
  admin: Admin,
): Promise<Array<{ competence: CleStatut; statut: StatutRecette; poseLe: string | null }>> {
  const { data, error } = await admin
    .from('competences_statut_recette')
    .select('competence, statut_recette, statut_recette_pose_le')
  if (error) {
    console.error(`[statut-recette] statuts illisibles — ${error.code} ${error.message}`)
    return []
  }
  return ((data ?? []) as unknown as Array<{
    competence: string; statut_recette: string; statut_recette_pose_le: string | null
  }>).map((l) => ({
    competence: l.competence as CleStatut,
    statut: l.statut_recette as StatutRecette,
    poseLe: l.statut_recette_pose_le,
  }))
}
