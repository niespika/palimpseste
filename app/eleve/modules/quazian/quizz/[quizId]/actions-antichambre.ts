'use server'

// ============================================================================
// L'ÉLÈVE DANS L'ANTICHAMBRE — il se signale, et apprend si le quiz est lancé
// (retours de classe du 22/09/2026). Appelé toutes les 4 s par l'écran d'attente.
// ⛔ Fichier à part : `actions.ts` est chargé tel quel par le banc de fiabilité,
//    qui simule chacun de ses imports.
// ⛔ Aucun type exporté d'un fichier `'use server'` (il tuerait le module).
// ============================================================================

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classeIdsActives } from '@/utils/acces'
import { lireAntichambreAt, lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'

export async function signalerPresence(quizId: string): Promise<{ etat: 'attente' | 'lance' | 'fermee' | 'introuvable' }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { etat: 'introuvable' }
  const admin = createAdminClient()
  // Le brouillon est caché par la RLS élève : on le lit au service-role, et la
  // garde est ici — la CLASSE de l'élève, comme partout ailleurs dans le quiz.
  const [{ data: profil }, { data: quizz }, classeIds, porte] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    admin.from('quazian_quizzes').select('statut, classe_id').eq('id', quizId).maybeSingle(),
    classeIdsActives(supabase, user.id),
    lirePorteAntichambre(admin),
  ])
  if (profil?.role !== 'eleve') return { etat: 'introuvable' }
  if (!quizz?.classe_id || !classeIds.includes(quizz.classe_id as string)) return { etat: 'introuvable' }
  if (quizz.statut !== 'brouillon') return { etat: 'lance' }
  if (!porte || !(await lireAntichambreAt(admin, quizId))) return { etat: 'fermee' }

  // `arrive_at` garde son défaut d'insertion ; seul `vu_at` se rafraîchit.
  const { error } = await admin.from('quazian_antichambre').upsert(
    { quiz_id: quizId, eleve_id: user.id, vu_at: new Date().toISOString() },
    { onConflict: 'quiz_id,eleve_id' },
  )
  if (error) console.error(`[quazian] présence non enregistrée (quiz ${quizId}) — ${error.code} ${error.message}`)
  return { etat: 'attente' }
}
