'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { calculerScoreBrier, JETONS_NEUTRE } from '@/utils/brier'

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

  // `select()` : sans lui, un quizz déjà lancé (double-clic, second onglet) rendait
  // 0 ligne SANS erreur — indiscernable d'un succès. Symétrique de `fermerQuizz`.
  const { data: lances, error } = await supabase.from('quazian_quizzes').update({
    statut: 'lance',
    lance_at: maintenant.toISOString(),
    ferme_at: fermeAt.toISOString(),
  }).eq('id', quizId).eq('statut', 'brouillon').select('id')

  if (error) return { error: error.message }
  if (!lances || lances.length === 0) {
    const { data: q } = await supabase.from('quazian_quizzes').select('statut').eq('id', quizId).maybeSingle()
    if (q?.statut === 'lance') return { success: true } // déjà lancé ailleurs
    return { error: q ? `Ce quizz est « ${q.statut} » : seul un brouillon se lance.` : 'Quizz introuvable.' }
  }
  revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
  return { success: true }
}

/**
 * Fermer le quizz : auto-soumettre les retardataires, figer les stats de cohorte,
 * poser les notes.
 *
 * FAIL-VISIBLE (C7·L1). Avant, cette fonction renvoyait `{ success: true }` quoi
 * qu'il arrive : supabase-js ne LÈVE pas sur erreur d'écriture, il retourne
 * `{ error }` — et aucune des cinq écritures ne le regardait. Une fermeture qui
 * échouait laissait donc le quizz ouvert **en silence**, sans une ligne à l'écran
 * ni dans les logs. Même piège que celui qui a rendu `api_couts` muet de juin à
 * juillet (cf. l'en-tête de `utils/cout-api.ts`). Chaque écriture est désormais
 * vérifiée, et l'appelant AFFICHE ce qui revient.
 *
 * Une auto-soumission ratée n'est pas rattrapable après coup : elle vaudrait une
 * note fausse pour cet élève et fausserait la cohorte de tous les autres. On
 * s'arrête donc AVANT de figer quoi que ce soit, et le quizz reste ouvert — un
 * état réparable, contrairement à des notes publiées de travers.
 */
export async function fermerQuizz(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string

  const maintenant = new Date().toISOString()

  // Récupérer les questions
  const { data: questions, error: eQuestions } = await supabase
    .from('quazian_questions')
    .select('id, index_correct')
    .eq('quiz_id', quizId)

  if (eQuestions) return { error: `Lecture des questions impossible : ${eQuestions.message}` }
  // `length === 0` autant que `null` : sans question, `_soumettrSession` diviserait
  // par zéro et écrirait des notes NaN.
  if (!questions || questions.length === 0) return { error: 'Ce quizz n’a aucune question — rien à corriger.' }

  // Auto-soumettre les sessions non soumises
  const { data: sessionsOuvertes, error: eSessions } = await supabase
    .from('quazian_sessions')
    .select('id, eleve_id')
    .eq('quiz_id', quizId)
    .is('submitted_at', null)

  if (eSessions) return { error: `Lecture des sessions impossible : ${eSessions.message}` }

  for (const session of sessionsOuvertes ?? []) {
    const echec = await soumettreSession(supabase, session.id, session.eleve_id, quizId, questions, true, maintenant)
    if (echec) {
      return { error: `Auto-soumission d’un élève impossible (${echec}) — le quizz reste ouvert, rien n’a été figé. Réessaie.` }
    }
  }

  // Calculer les stats de cohorte (sur les sessions soumises)
  const { data: scores, error: eScores } = await supabase
    .from('quazian_quiz_scores')
    .select('id, score_moyen')
    .eq('quiz_id', quizId)

  if (eScores) return { error: `Lecture des scores impossible : ${eScores.message}` }

  const scoresMoyens = (scores ?? []).map((s) => s.score_moyen).filter((s) => s != null)
  let moyenneCohorte = 0
  let ecartTypeCohorte = 0

  if (scoresMoyens.length > 0) {
    moyenneCohorte = scoresMoyens.reduce((a, b) => a + b, 0) / scoresMoyens.length
    const variance = scoresMoyens.reduce((a, b) => a + Math.pow(b - moyenneCohorte, 2), 0) / scoresMoyens.length
    ecartTypeCohorte = Math.sqrt(variance)
  }

  // Calculer les z_quiz et note formative pour chaque session
  for (const s of scores ?? []) {
    const zQuiz = ecartTypeCohorte > 0
      ? (s.score_moyen - moyenneCohorte) / ecartTypeCohorte
      : 0
    const noteFormative = Math.min(Math.max(10 + s.score_moyen, 0), 20)

    const { error: eNote } = await supabase.from('quazian_quiz_scores').update({
      z_quiz: zQuiz,
      note_formative_20: noteFormative,
    }).eq('id', s.id)
    if (eNote) return { error: `Écriture d’une note impossible (${eNote.message}) — le quizz reste ouvert. Réessaie.` }
  }

  // Figer le quizz. Garde `statut='lance'` + `select()` : un double-clic ou un
  // second onglet ne recalcule pas la cohorte, et un UPDATE qui ne touche AUCUNE
  // ligne cesse d'être indiscernable d'un succès.
  const { data: fermes, error: eFermeture } = await supabase
    .from('quazian_quizzes')
    .update({
      statut: 'ferme',
      ferme_at: maintenant,
      moyenne_cohorte: moyenneCohorte,
      ecart_type_cohorte: ecartTypeCohorte,
    })
    .eq('id', quizId)
    .eq('statut', 'lance')
    .select('id')

  if (eFermeture) return { error: `La fermeture a échoué : ${eFermeture.message}` }

  if (!fermes || fermes.length === 0) {
    // Zéro ligne : soit un autre onglet a fermé entre-temps (succès), soit le
    // quizz n'est pas dans un état fermable — deux cas très différents à dire.
    const { data: q } = await supabase.from('quazian_quizzes').select('statut').eq('id', quizId).maybeSingle()
    if (q?.statut === 'ferme') {
      revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
      revalidatePath(`/prof/quazian/quizz/${quizId}`)
      return { success: true }
    }
    return {
      error: q
        ? `Ce quizz est « ${q.statut} » : seul un quizz lancé se ferme.`
        : 'Quizz introuvable.',
    }
  }

  revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

/**
 * Soumettre une session (ici : toujours en auto, à la fermeture).
 *
 * Renvoie `null` si tout s'est écrit, sinon le message d'erreur — cette fonction
 * décide d'une NOTE : un échec muet vaudrait un 0 imputé à un élève qui avait
 * répondu. Elle n'est plus exportée : un export d'un fichier `'use server'` est
 * un point d'entrée HTTP, et celle-ci n'a jamais eu d'appelant hors de ce fichier.
 */
async function soumettreSession(
  supabase: Awaited<ReturnType<typeof import('@/utils/supabase/server').createClient>>,
  sessionId: string,
  eleveId: string,
  quizId: string,
  questions: { id: string; index_correct: number }[],
  autoSubmit: boolean,
  maintenant: string
): Promise<string | null> {
  // Réponses existantes
  const { data: reponsesExistantes, error: eLecture } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu')
    .eq('session_id', sessionId)

  if (eLecture) return eLecture.message

  const repMap: Record<string, typeof reponsesExistantes extends (infer T)[] | null ? T : never> = {}
  for (const r of reponsesExistantes ?? []) repMap[r.question_id] = r

  // Calculer les scores pour chaque question
  const answersToInsert = []
  let scoreMoyen = 0

  for (const q of questions) {
    const rep = repMap[q.id]
    let jetons: [number, number, number, number] = JETONS_NEUTRE

    if (rep) {
      jetons = [rep.p_a * 100, rep.p_b * 100, rep.p_c * 100, rep.p_d * 100]
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
      const { error } = await supabase.from('quazian_answers').update({
        brier_brut: scoreBrut / 10,
        score: scoreBrut,
      }).eq('session_id', sessionId).eq('question_id', q.id)
      if (error) return error.message
    }

    scoreMoyen += scoreBrut
  }

  if (answersToInsert.length > 0) {
    const { error } = await supabase.from('quazian_answers').insert(answersToInsert)
    if (error) return error.message
  }

  scoreMoyen /= questions.length

  // Le score agrégé AVANT le verrou de session : si l'upsert échoue, la session
  // reste ouverte et l'appelant peut rejouer. Dans l'autre ordre, une session
  // marquée soumise sans score serait un élève sans note, invisible à l'écran.
  const { error: eScore } = await supabase.from('quazian_quiz_scores').upsert({
    quiz_id: quizId,
    eleve_id: eleveId,
    score_moyen: scoreMoyen,
    note_formative_20: Math.min(Math.max(10 + scoreMoyen, 0), 20),
    z_quiz: 0,  // sera recalculé à la fermeture
  }, { onConflict: 'quiz_id,eleve_id' })
  if (eScore) return eScore.message

  // Marquer la session comme soumise
  const { error: eSession } = await supabase.from('quazian_sessions').update({
    submitted_at: maintenant,
    auto_submitted: autoSubmit,
  }).eq('id', sessionId)
  if (eSession) return eSession.message

  return null
}
