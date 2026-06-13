'use server'

import { createClient } from '@/utils/supabase/server'
import { calculerScoreBrier, JETONS_NEUTRE, shuffleArray } from '@/utils/brier'

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

export interface QuestionPassation {
  id: string             // id de la question originale
  enonce: string
  options: string[]      // dans l'ordre randomisé pour cet élève
  optionMapping: number[]  // optionMapping[i] = index dans options originales
  indexCorrecteRandomise: number  // index dans options randomisées (pour le retour post-quizz)
}

export interface DonneesPassation {
  sessionId: string
  questions: QuestionPassation[]
  reponsesExistantes: Record<string, [number, number, number, number]>
  soumis: boolean
  quizFerme: boolean
}

// Initialiser ou récupérer la session d'un élève
export async function initialiserSession(quizId: string): Promise<DonneesPassation | { error: string }> {
  const { supabase, userId } = await verifierEleve()

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('statut, ferme_at')
    .eq('id', quizId)
    .single()

  if (!quizz) return { error: 'Quizz introuvable' }
  if (quizz.statut === 'brouillon') return { error: 'Ce quizz n\'est pas encore lancé.' }

  const quizFerme = quizz.statut === 'ferme'

  // Session existante ?
  const { data: sessionExist } = await supabase
    .from('quazian_sessions')
    .select('id, ordre_questions, ordre_options, submitted_at')
    .eq('quiz_id', quizId)
    .eq('eleve_id', userId)
    .maybeSingle()

  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('id, enonce, options, index_correct')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })

  if (!questions || questions.length === 0) return { error: 'Aucune question trouvée.' }

  let sessionId: string
  let ordreQuestions: string[]
  let ordreOptions: Record<string, number[]>

  if (sessionExist) {
    sessionId = sessionExist.id
    ordreQuestions = sessionExist.ordre_questions as string[]
    ordreOptions = sessionExist.ordre_options as Record<string, number[]>
  } else {
    if (quizFerme) return { error: 'Ce quizz est terminé.' }

    // Créer la session avec randomisation par élève
    ordreQuestions = shuffleArray(questions.map((q) => q.id), userId + quizId)
    ordreOptions = {}
    for (const q of questions) {
      ordreOptions[q.id] = shuffleArray([0, 1, 2, 3], userId + q.id)
    }

    const { data: nouvelleSession, error } = await supabase
      .from('quazian_sessions')
      .insert({
        quiz_id: quizId,
        eleve_id: userId,
        started_at: new Date().toISOString(),
        ordre_questions: ordreQuestions,
        ordre_options: ordreOptions,
        est_rattrapage: false,
      })
      .select('id')
      .single()

    if (error || !nouvelleSession) return { error: 'Erreur création session' }
    sessionId = nouvelleSession.id
  }

  // Réponses existantes
  const { data: reponsesDB } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d')
    .eq('session_id', sessionId)

  const reponsesMap: Record<string, [number, number, number, number]> = {}
  for (const r of reponsesDB ?? []) {
    reponsesMap[r.question_id] = [r.p_a * 100, r.p_b * 100, r.p_c * 100, r.p_d * 100]
  }

  // Construire les questions dans l'ordre randomisé
  const qMap: Record<string, typeof questions[0]> = {}
  for (const q of questions) qMap[q.id] = q

  const questionsPassation: QuestionPassation[] = ordreQuestions.map((qId) => {
    const q = qMap[qId]
    const mapping = ordreOptions[qId] ?? [0, 1, 2, 3]
    const optionsRandomisees = mapping.map((i) => q.options[i])
    const indexCorrecteRandomise = mapping.indexOf(q.index_correct)

    return {
      id: q.id,
      enonce: q.enonce,
      options: optionsRandomisees,
      optionMapping: mapping,
      indexCorrecteRandomise,
    }
  })

  return {
    sessionId,
    questions: questionsPassation,
    reponsesExistantes: reponsesMap,
    soumis: !!sessionExist?.submitted_at,
    quizFerme,
  }
}

// Sauvegarder la réponse à une question (jetons dans l'ordre randomisé)
export async function sauvegarderReponse(
  sessionId: string,
  questionId: string,
  jetonsRandomises: [number, number, number, number],
  optionMapping: number[]
): Promise<void> {
  const { supabase } = await verifierEleve()

  // Remettre dans l'ordre original
  const jetonsOriginaux: [number, number, number, number] = [0, 0, 0, 0]
  for (let i = 0; i < 4; i++) {
    jetonsOriginaux[optionMapping[i]] = jetonsRandomises[i]
  }

  const [pa, pb, pc, pd] = jetonsOriginaux.map((j) => j / 100)

  await supabase.from('quazian_answers').upsert({
    session_id: sessionId,
    question_id: questionId,
    p_a: pa,
    p_b: pb,
    p_c: pc,
    p_d: pd,
    repondu: true,
  }, { onConflict: 'session_id,question_id' })
}

// Soumettre le quizz
export async function soumettreQuizz(sessionId: string, quizId: string): Promise<{ error?: string }> {
  const { supabase, userId } = await verifierEleve()

  const maintenant = new Date().toISOString()

  // Récupérer les questions et leurs bonnes réponses
  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('id, index_correct')
    .eq('quiz_id', quizId)

  if (!questions) return { error: 'Questions introuvables' }

  // Récupérer les réponses de cette session
  const { data: reponses } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu')
    .eq('session_id', sessionId)

  const repMap: Record<string, typeof reponses extends (infer T)[] | null ? T : never> = {}
  for (const r of reponses ?? []) repMap[r.question_id] = r

  let scoreMoyen = 0
  const answersToInsert = []
  const answersToUpdate = []

  for (const q of questions) {
    const rep = repMap[q.id]
    let jetons: [number, number, number, number] = JETONS_NEUTRE
    let repondu = false

    if (rep) {
      jetons = [rep.p_a * 100, rep.p_b * 100, rep.p_c * 100, rep.p_d * 100]
      repondu = rep.repondu
    }

    const score = calculerScoreBrier(jetons, q.index_correct)
    scoreMoyen += score

    if (!rep) {
      answersToInsert.push({
        session_id: sessionId,
        question_id: q.id,
        p_a: 0.25, p_b: 0.25, p_c: 0.25, p_d: 0.25,
        repondu: false,
        brier_brut: score / 10,
        score,
      })
    } else {
      answersToUpdate.push({ question_id: q.id, brier_brut: score / 10, score })
    }
  }

  scoreMoyen /= questions.length

  if (answersToInsert.length > 0) {
    await supabase.from('quazian_answers').insert(answersToInsert)
  }
  for (const a of answersToUpdate) {
    await supabase.from('quazian_answers')
      .update({ brier_brut: a.brier_brut, score: a.score })
      .eq('session_id', sessionId)
      .eq('question_id', a.question_id)
  }

  await supabase.from('quazian_sessions').update({
    submitted_at: maintenant,
    auto_submitted: false,
  }).eq('id', sessionId)

  // Récupérer les stats cohorte figées si quizz déjà fermé
  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('statut, moyenne_cohorte, ecart_type_cohorte')
    .eq('id', quizId)
    .single()

  let zQuiz = 0
  if (quizz?.statut === 'ferme' && quizz.ecart_type_cohorte && quizz.ecart_type_cohorte > 0) {
    zQuiz = (scoreMoyen - quizz.moyenne_cohorte!) / quizz.ecart_type_cohorte
  }

  await supabase.from('quazian_quiz_scores').upsert({
    quiz_id: quizId,
    eleve_id: userId,
    score_moyen: scoreMoyen,
    note_formative_20: Math.min(Math.max(10 + scoreMoyen, 0), 20),
    z_quiz: zQuiz,
  }, { onConflict: 'quiz_id,eleve_id' })

  return {}
}

// Récupérer le retour post-quizz
export async function chargerRetourQuizz(quizId: string): Promise<{
  questions: Array<{
    enonce: string
    options: string[]
    indexCorrect: number
    mesJetons: [number, number, number, number] | null
    score: number | null
    repondu: boolean
  }>
  scoreMoyen: number | null
  noteFormative: number | null
} | { error: string }> {
  const { supabase, userId } = await verifierEleve()

  const { data: session } = await supabase
    .from('quazian_sessions')
    .select('id, ordre_questions, ordre_options, submitted_at')
    .eq('quiz_id', quizId)
    .eq('eleve_id', userId)
    .maybeSingle()

  if (!session || !session.submitted_at) return { error: 'Pas de session soumise.' }

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('statut')
    .eq('id', quizId)
    .single()

  if (quizz?.statut !== 'ferme') return { error: 'Le quizz n\'est pas encore corrigé.' }

  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('id, enonce, options, index_correct')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })

  const { data: reponses } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu, score')
    .eq('session_id', session.id)

  const repMap: Record<string, typeof reponses extends (infer T)[] | null ? T : never> = {}
  for (const r of reponses ?? []) repMap[r.question_id] = r

  const { data: scoreData } = await supabase
    .from('quazian_quiz_scores')
    .select('score_moyen, note_formative_20')
    .eq('quiz_id', quizId)
    .eq('eleve_id', userId)
    .single()

  const result = (questions ?? []).map((q) => {
    const rep = repMap[q.id]
    return {
      enonce: q.enonce,
      options: q.options,
      indexCorrect: q.index_correct,
      mesJetons: rep
        ? [rep.p_a * 100, rep.p_b * 100, rep.p_c * 100, rep.p_d * 100] as [number, number, number, number]
        : null,
      score: rep?.score ?? null,
      repondu: rep?.repondu ?? false,
    }
  })

  return {
    questions: result,
    scoreMoyen: scoreData?.score_moyen ?? null,
    noteFormative: scoreData?.note_formative_20 ?? null,
  }
}
