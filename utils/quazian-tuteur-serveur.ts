import 'server-only'
// ============================================================================
// LE TUTEUR ET LE QUIZ — la porte, la pause pendant un quiz, le contexte d'une
// question (retours de classe du 22-23/09/2026). Migration : `quazian_tuteur.sql`.
// ⚠️ « Une porte illisible se ferme. » Porte fermée, rien ne lit
//    `scriptorium_conversations.quiz_question_id` : le code part avant le SQL.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLesReglages } from '@/utils/scriptorium-params'
import { remettreDansOrdreEleve } from '@/utils/quazian-ordre-eleve'

export async function lirePorteTuteur(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await lireLesReglages(admin)
  if (error) return false
  return !!(data as { quazian_tuteur_actif?: boolean } | null)?.quazian_tuteur_actif
}

export async function basculerPorteTuteur(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ quazian_tuteur_actif: actif })
    .eq('id', 1).select('quazian_tuteur_actif')
  // Code parti avant le SQL : la colonne n'existe pas encore sur cette base.
  if (error && /quazian_tuteur_actif/.test(error.message)) {
    return { ok: false, message: 'Cette base n’a pas encore reçu la migration `quazian_tuteur.sql` : l’interrupteur ne peut pas s’ouvrir.' }
  }
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'Le bouton « En parler avec le tuteur » apparaît sous les questions ratées avec 70 points ou plus.'
    : 'Plus de bouton vers le tuteur sur l’écran de note.' }
}

/**
 * Un quiz est-il EN COURS dans une des classes de l'élève ? (décision de Louis,
 * 23/09 : le tuteur se met en pause pendant un quiz — sans cela, un élève
 * pouvait lui poser les questions dans un autre onglet.)
 * ⭐ Borné par l'échéance du quiz, pas par sa fermeture : un quiz que le
 *    professeur oublie de fermer ne prive pas la classe de son tuteur au-delà.
 * ⚠️ Une lecture ratée ne met PAS le tuteur en pause (on le dit au journal) :
 *    c'est une aide d'étude, pas une porte de sécurité.
 */
export async function quizEnCoursPourClasses(
  admin: SupabaseClient, classeIds: string[],
): Promise<{ fermeAt: string } | null> {
  if (classeIds.length === 0) return null
  const { data, error } = await admin.from('quazian_quizzes')
    .select('ferme_at').in('classe_id', classeIds).eq('statut', 'lance')
    .gt('ferme_at', new Date().toISOString())
    .order('ferme_at', { ascending: false }).limit(1).maybeSingle()
  if (error) { console.error(`[tuteur] quiz en cours illisible — ${error.message}`); return null }
  return data?.ferme_at ? { fermeAt: data.ferme_at as string } : null
}

/** La question de quiz d'une conversation, ou null (porte à vérifier AVANT). Tolérant. */
export async function lireAncrage(admin: SupabaseClient, conversationId: string): Promise<string | null> {
  const { data, error } = await admin.from('scriptorium_conversations')
    .select('quiz_question_id').eq('id', conversationId).maybeSingle()
  if (error) return null
  return (data as { quiz_question_id?: string | null } | null)?.quiz_question_id ?? null
}

export interface ContexteQuestion {
  questionId: string
  quizId: string
  classeId: string
  enonce: string
  /** Dans l'ordre où l'élève les a vues. */
  options: string[]
  jetons: [number, number, number, number]
  indexCorrect: number
}

/**
 * La question telle que CET élève l'a vue et répondue — seulement sur un quiz
 * FERMÉ où sa copie est SOUMISE (la bonne réponse sort ; mêmes gardes que
 * `chargerRetourQuizz`). null sinon.
 */
export async function chargerContexteQuestion(
  admin: SupabaseClient, questionId: string, eleveId: string,
): Promise<ContexteQuestion | null> {
  const { data: q } = await admin.from('quazian_questions')
    .select('id, quiz_id, enonce, options, index_correct').eq('id', questionId).maybeSingle()
  if (!q) return null
  const [{ data: quiz }, { data: session }] = await Promise.all([
    admin.from('quazian_quizzes').select('statut, classe_id').eq('id', q.quiz_id).maybeSingle(),
    admin.from('quazian_sessions').select('id, submitted_at, ordre_options')
      .eq('quiz_id', q.quiz_id).eq('eleve_id', eleveId).maybeSingle(),
  ])
  if (!quiz || quiz.statut !== 'ferme' || !quiz.classe_id || !session?.submitted_at) return null
  const { data: rep } = await admin.from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu, score')
    .eq('session_id', session.id).eq('question_id', questionId).maybeSingle()
  const [vue] = remettreDansOrdreEleve(
    [{ id: q.id as string, enonce: q.enonce as string, options: q.options as string[], index_correct: q.index_correct as number }],
    rep ? [rep as never] : [],
    [q.id as string],
    session.ordre_options as Record<string, number[]> | null,
  )
  if (!vue?.mesJetons) return null
  return {
    questionId: q.id as string, quizId: q.quiz_id as string, classeId: quiz.classe_id as string,
    enonce: vue.enonce, options: vue.options, jetons: vue.mesJetons, indexCorrect: vue.indexCorrect,
  }
}
