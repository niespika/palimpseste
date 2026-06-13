'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { calculerScoreBrier, JETONS_NEUTRE, SCORE_NON_REPONDU } from '@/utils/brier'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

export async function lancerQuizz(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string
  const dureeMin = parseInt(formData.get('duree_min') as string) || 25

  const maintenant = new Date()
  const fermeAt = new Date(maintenant.getTime() + dureeMin * 60 * 1000)

  const { error } = await supabase.from('quazian_quizzes').update({
    statut: 'lance',
    lance_at: maintenant.toISOString(),
    ferme_at: fermeAt.toISOString(),
  }).eq('id', quizId).eq('statut', 'brouillon')

  if (error) return { error: error.message }
  revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
  return { success: true }
}

export async function fermerQuizz(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string

  const maintenant = new Date().toISOString()

  // Récupérer les questions
  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('id, index_correct')
    .eq('quiz_id', quizId)

  if (!questions) return { error: 'Questions introuvables' }

  const indexMap: Record<string, number> = {}
  for (const q of questions) indexMap[q.id] = q.index_correct

  // Auto-soumettre les sessions non soumises
  const { data: sessionsOuvertes } = await supabase
    .from('quazian_sessions')
    .select('id, eleve_id, ordre_questions, ordre_options')
    .eq('quiz_id', quizId)
    .is('submitted_at', null)

  for (const session of sessionsOuvertes ?? []) {
    await _soumettrSession(supabase, session.id, session.eleve_id, quizId, questions, true, maintenant)
  }

  // Calculer les stats de cohorte (sur les sessions soumises)
  const { data: scores } = await supabase
    .from('quazian_quiz_scores')
    .select('score_moyen')
    .eq('quiz_id', quizId)

  const scoresMoyens = (scores ?? []).map((s) => s.score_moyen).filter((s) => s != null)
  let moyenneCohorte = 0
  let ecartTypeCohorte = 0

  if (scoresMoyens.length > 0) {
    moyenneCohorte = scoresMoyens.reduce((a, b) => a + b, 0) / scoresMoyens.length
    const variance = scoresMoyens.reduce((a, b) => a + Math.pow(b - moyenneCohorte, 2), 0) / scoresMoyens.length
    ecartTypeCohorte = Math.sqrt(variance)
  }

  // Calculer les z_quiz et note formative pour chaque session
  const { data: tousScores } = await supabase
    .from('quazian_quiz_scores')
    .select('id, eleve_id, score_moyen')
    .eq('quiz_id', quizId)

  for (const s of tousScores ?? []) {
    const zQuiz = ecartTypeCohorte > 0
      ? (s.score_moyen - moyenneCohorte) / ecartTypeCohorte
      : 0
    const noteFormative = Math.min(Math.max(10 + s.score_moyen, 0), 20)

    await supabase.from('quazian_quiz_scores').update({
      z_quiz: zQuiz,
      note_formative_20: noteFormative,
    }).eq('id', s.id)
  }

  // Figer le quizz
  await supabase.from('quazian_quizzes').update({
    statut: 'ferme',
    ferme_at: maintenant,
    moyenne_cohorte: moyenneCohorte,
    ecart_type_cohorte: ecartTypeCohorte,
  }).eq('id', quizId)

  revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Factorisation : soumettre une session (normale ou auto)
async function _soumettrSession(
  supabase: Awaited<ReturnType<typeof import('@/utils/supabase/server').createClient>>,
  sessionId: string,
  eleveId: string,
  quizId: string,
  questions: { id: string; index_correct: number }[],
  autoSubmit: boolean,
  maintenant: string
) {
  // Réponses existantes
  const { data: reponsesExistantes } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu')
    .eq('session_id', sessionId)

  const repMap: Record<string, typeof reponsesExistantes extends (infer T)[] | null ? T : never> = {}
  for (const r of reponsesExistantes ?? []) repMap[r.question_id] = r

  // Calculer les scores pour chaque question
  const answersToInsert = []
  let scoreMoyen = 0

  for (const q of questions) {
    const rep = repMap[q.id]
    let jetons: [number, number, number, number] = JETONS_NEUTRE
    let repondu = false

    if (rep) {
      jetons = [rep.p_a * 100, rep.p_b * 100, rep.p_c * 100, rep.p_d * 100]
      repondu = rep.repondu
    }

    const scoreBrut = calculerScoreBrier(jetons, q.index_correct)

    if (!rep) {
      answersToInsert.push({
        session_id: sessionId,
        question_id: q.id,
        p_a: 0.25,
        p_b: 0.25,
        p_c: 0.25,
        p_d: 0.25,
        repondu: false,
        brier_brut: scoreBrut / 10,
        score: scoreBrut,
      })
    } else {
      await supabase.from('quazian_answers').update({
        brier_brut: scoreBrut / 10,
        score: scoreBrut,
      }).eq('session_id', sessionId).eq('question_id', q.id)
    }

    scoreMoyen += scoreBrut
  }

  if (answersToInsert.length > 0) {
    await supabase.from('quazian_answers').insert(answersToInsert)
  }

  scoreMoyen /= questions.length

  // Marquer la session comme soumise
  await supabase.from('quazian_sessions').update({
    submitted_at: maintenant,
    auto_submitted: autoSubmit,
  }).eq('id', sessionId)

  // Upsert le score agrégé
  await supabase.from('quazian_quiz_scores').upsert({
    quiz_id: quizId,
    eleve_id: eleveId,
    score_moyen: scoreMoyen,
    note_formative_20: Math.min(Math.max(10 + scoreMoyen, 0), 20),
    z_quiz: 0,  // sera recalculé à la fermeture
  }, { onConflict: 'quiz_id,eleve_id' })
}

export { _soumettrSession }
