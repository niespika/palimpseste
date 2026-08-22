// ============================================================================
// C4 · L8 — LA GARDE DES ÉCRANS DE LA FABRIQUE.
// ----------------------------------------------------------------------------
// « La fabrique doit MARCHER pendant que les trois interrupteurs sont à OFF —
//   `exercices_actif`, `routeur_actif`, `competences_affichage_actif` commandent
//   les ÉLÈVES, le ROUTEUR et l'AFFICHAGE, AUCUN NE NOMME LE PROFESSEUR QUI
//   PRÉPARE : ne mets pas ses écrans derrière eux » (piège 41).
//
// La convention du dépôt reste due — « toute fonctionnalité nouvelle naît
// derrière un flag OFF » — et elle se tient avec UN INTERRUPTEUR PROPRE, au même
// emplacement que les existants : `scriptorium_params.fabrique_actif`.
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export interface AccesFabrique {
  admin: ReturnType<typeof createAdminClient>
  userId: string
  /** L'interrupteur PROPRE du lot. Les trois du `07-` §1.5 ne sont pas lus ici. */
  actif: boolean
}

/**
 * Le professeur, et lui seul. Redirige un élève, refuse un anonyme.
 * `redirection` à `false` pour les actions serveur, qui jettent au lieu de rediriger.
 */
export async function garderProf(redirection = true): Promise<AccesFabrique> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (redirection) redirect('/login')
    throw new Error('Non authentifié')
  }
  const { data: moi } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') {
    if (redirection) redirect('/eleve')
    throw new Error('Accès refusé')
  }
  const admin = createAdminClient()
  const { data: params } = await admin
    .from('scriptorium_params').select('fabrique_actif').limit(1).maybeSingle()
  return { admin, userId: user.id, actif: !!params?.fabrique_actif }
}

/** L'état des trois interrupteurs du `07-` §1.5 — LU pour être MONTRÉ, jamais
 *  pour garder ces écrans : ils commandent les élèves, le routeur et
 *  l'affichage, et « la fabrique doit fonctionner ainsi » (piège 41). */
export async function lireLesTroisInterrupteurs(
  admin: ReturnType<typeof createAdminClient>,
): Promise<{ exercices: boolean; routeur: boolean; affichage: boolean }> {
  const { data } = await admin
    .from('scriptorium_params')
    .select('exercices_actif, routeur_actif, competences_affichage_actif')
    .limit(1).maybeSingle()
  return {
    exercices: !!data?.exercices_actif,
    routeur: !!data?.routeur_actif,
    affichage: !!data?.competences_affichage_actif,
  }
}
