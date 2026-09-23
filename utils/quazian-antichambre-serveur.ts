import 'server-only'
// ============================================================================
// L'ANTICHAMBRE — la porte et les lectures (retours de classe du 22/09/2026).
// Patron de la porte : `utils/copie/porte.ts`. Migration : `quazian_antichambre.sql`.
// ⚠️ « Une porte illisible se ferme, jamais l'inverse. » Porte fermée, AUCUNE
//    lecture ne touche `antichambre_at` ni `quazian_antichambre` : le code peut
//    partir avant la migration, et une base sans elle se comporte comme hier.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLesReglages } from '@/utils/scriptorium-params'
import { ANTICHAMBRE_MAX_MS, antichambreEnCours, composerAntichambre, type LigneAntichambre } from '@/utils/quazian-antichambre'

/** Le seuil d'expiration, pour les requêtes qui filtrent en base. */
export function seuilAntichambre(): string {
  return new Date(Date.now() - ANTICHAMBRE_MAX_MS).toISOString()
}

export async function lirePorteAntichambre(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await lireLesReglages(admin)
  if (error) return false
  return !!(data as { quazian_antichambre_actif?: boolean } | null)?.quazian_antichambre_actif
}

export async function basculerPorteAntichambre(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ quazian_antichambre_actif: actif })
    .eq('id', 1).select('quazian_antichambre_actif')
  // Code parti avant le SQL : la colonne n'existe pas encore sur cette base.
  if (error && /quazian_antichambre_actif/.test(error.message)) {
    return { ok: false, message: 'Cette base n’a pas encore reçu la migration `quazian_antichambre.sql` : l’interrupteur ne peut pas s’ouvrir.' }
  }
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  if (!actif) {
    // Fermer la porte REFERME aussi les antichambres ouvertes (revue du 22/09) :
    // sans cela, la rouvrir un autre jour faisait réapparaître aux élèves une
    // salle que personne n'avait rouverte. Un quiz lancé n'est pas touché.
    const { data: ouvertes, error: eLire } = await admin.from('quazian_quizzes')
      .select('id').eq('statut', 'brouillon').not('antichambre_at', 'is', null)
    const ids = (ouvertes ?? []).map((q) => q.id as string)
    if (!eLire && ids.length) {
      await admin.from('quazian_quizzes').update({ antichambre_at: null }).in('id', ids).eq('statut', 'brouillon')
      await admin.from('quazian_antichambre').delete().in('quiz_id', ids)
    }
  }
  return { ok: true, message: actif
    ? 'L’antichambre est ouverte : un quiz se lance désormais en deux temps.'
    : 'L’antichambre est fermée : un quiz se lance en un geste, comme avant.' }
}

/**
 * L'instant d'ouverture de l'antichambre d'un quiz, ou null. TOLÉRANT : une
 * colonne absente (migration non jouée) ou une lecture ratée ⇒ null, c'est-à-dire
 * « pas d'antichambre » — le comportement d'hier.
 */
export async function lireAntichambreAt(admin: SupabaseClient, quizId: string): Promise<string | null> {
  const { data, error } = await admin.from('quazian_quizzes').select('antichambre_at').eq('id', quizId).maybeSingle()
  if (error) return null
  const at = (data as { antichambre_at?: string | null } | null)?.antichambre_at ?? null
  // Au-delà de 3 h, l'antichambre est oubliée : elle ne compte plus nulle part.
  return antichambreEnCours(at, Date.now()) ? at : null
}

/** Qui est dans l'antichambre, parmi les inscrits de la classe du quiz. */
export async function chargerAntichambre(
  admin: SupabaseClient, quizId: string, classeId: string | null, maintenant: number = Date.now(),
): Promise<{ lignes: LigneAntichambre[]; presents: number; total: number } | { error: string }> {
  if (!classeId) return { lignes: [], presents: 0, total: 0 }
  const [inscriptions, presences] = await Promise.all([
    admin.from('inscriptions').select('eleve_id').eq('classe_id', classeId).eq('statut', 'active'),
    admin.from('quazian_antichambre').select('eleve_id, vu_at').eq('quiz_id', quizId),
  ])
  // supabase-js ne lève pas : une lecture ratée afficherait « 0 présent » au
  // professeur, qui attendrait une classe déjà là.
  if (inscriptions.error) return { error: `Lecture de la classe impossible : ${inscriptions.error.message}` }
  if (presences.error) return { error: `Lecture des présences impossible : ${presences.error.message}` }
  const inscrits = (inscriptions.data ?? []).map((r) => r.eleve_id as string)
  const { data: profils, error: eProfils } = inscrits.length
    ? await admin.from('profiles').select('id, display_name').in('id', inscrits)
    : { data: [], error: null }
  if (eProfils) return { error: `Lecture des noms impossible : ${eProfils.message}` }
  return composerAntichambre({
    inscrits,
    profils: (profils ?? []) as { id: string; display_name: string | null }[],
    presences: (presences.data ?? []) as { eleve_id: string; vu_at: string }[],
    maintenant,
  })
}
