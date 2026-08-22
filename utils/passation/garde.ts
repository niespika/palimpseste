import 'server-only'
// ============================================================================
// C4 · L4 — QUI ENTRE, ET SOUS QUELLE PORTE.
// ----------------------------------------------------------------------------
// « TOUTES LES ÉCRITURES PASSENT PAR LE SERVEUR » (`07-` §1 ; piège 52), et
// C4-L1 est allé plus loin : AUCUNE policy élève sur les vingt tables — vérifié
// par requête le 22/08, une seule policy `*_prof_all` par table. La règle vit
// donc dans le code, à un seul endroit, et c'est ici.
//
// Patron : `utils/fabrique/acces.ts` (C4-L8).
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireLesPortes } from './acces'

type Admin = ReturnType<typeof createAdminClient>

export interface AccesProf {
  admin: Admin
  userId: string
  /** L'interrupteur propre du lot. LU pour être MONTRÉ, jamais deviné. */
  actif: boolean
}

export async function garderProf(redirection = true): Promise<AccesProf> {
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
  const portes = await lireLesPortes(admin)
  return { admin, userId: user.id, actif: portes.passationActive }
}

export interface AccesEleve {
  admin: Admin
  userId: string
  /** Les DEUX portes, et le plus fermé gagne (`utils/passation/acces.ts`). */
  ouvert: boolean
}

export async function garderEleve(redirection = true): Promise<AccesEleve> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (redirection) redirect('/login')
    throw new Error('Non authentifié')
  }
  const admin = createAdminClient()
  const portes = await lireLesPortes(admin)
  return { admin, userId: user.id, ouvert: portes.passationActive && portes.exercicesActifs }
}
