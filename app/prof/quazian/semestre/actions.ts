'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { lireParametres } from '../parametres/actions'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

export async function calculerNotesSemestre(formData: FormData) {
  const { supabase } = await verifierProf()
  const classe = (formData.get('classe') as string) || null
  const params = await lireParametres()

  // Récupérer tous les quizz fermés (optionnellement filtrés par classe)
  let quizzQuery = supabase
    .from('quazian_quizzes')
    .select('id, classe_id, moyenne_cohorte, ecart_type_cohorte')
    .eq('statut', 'ferme')

  if (classe) quizzQuery = quizzQuery.eq('classe_id', classe)
  const { data: quizzes } = await quizzQuery

  if (!quizzes || quizzes.length === 0) return { error: 'Aucun quizz terminé.' }

  const quizIds = quizzes.map((q) => q.id)

  // Récupérer les scores de tous les élèves pour ces quizz
  const { data: scores } = await supabase
    .from('quazian_quiz_scores')
    .select('quiz_id, eleve_id, score_moyen, z_quiz')
    .in('quiz_id', quizIds)

  if (!scores || scores.length === 0) return { error: 'Aucun score trouvé.' }

  // Grouper par élève
  const parEleve: Record<string, { scoreMoyens: number[]; zQuizzes: number[] }> = {}
  for (const s of scores) {
    if (!parEleve[s.eleve_id]) parEleve[s.eleve_id] = { scoreMoyens: [], zQuizzes: [] }
    parEleve[s.eleve_id].scoreMoyens.push(s.score_moyen)
    if (s.z_quiz != null) parEleve[s.eleve_id].zQuizzes.push(s.z_quiz)
  }

  // Calculer la note finale pour chaque élève
  const rows = []
  for (const [eleveId, data] of Object.entries(parEleve)) {
    const { scoreMoyens, zQuizzes } = data

    const zMoyen = zQuizzes.length > 0
      ? zQuizzes.reduce((a, b) => a + b, 0) / zQuizzes.length
      : 0

    const scoreMoyenSemestre = scoreMoyens.reduce((a, b) => a + b, 0) / scoreMoyens.length

    const noteRelative = Math.min(20, Math.max(0, params.centre + params.pente * zMoyen))
    const noteAbsolue = Math.min(20, Math.max(0, params.a + params.b * scoreMoyenSemestre))
    const noteFinale = params.w * noteRelative + (1 - params.w) * noteAbsolue

    rows.push({
      classe_id: classe,
      eleve_id: eleveId,
      z_moyen: zMoyen,
      note_relative_20: noteRelative,
      note_absolue_20: noteAbsolue,
      note_finale_20: noteFinale,
    })
  }

  await supabase.from('quazian_semester').upsert(rows, { onConflict: 'classe_id,eleve_id' })

  revalidatePath('/prof/quazian/semestre')
  return { success: true, nb: rows.length }
}
