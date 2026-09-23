import type { SupabaseClient } from '@supabase/supabase-js'
import { composerTableauLive, type LigneTableauLive } from '@/utils/quazian-tableau-live'

// PostgREST rend 1000 lignes au plus, sans erreur : une classe de 35 élèves sur
// un quiz de 30 questions en porte 1 050. La lecture des réponses se pagine.
const PAGE = 1000

/**
 * Lecteur UNIQUE du tableau en direct : la page de lancement et la route de
 * sondage l'appellent toutes deux (voir `utils/quazian-tableau-live.ts`).
 * Client du professeur : la RLS prof borne déjà la lecture.
 */
export async function chargerTableauLive(
  supabase: SupabaseClient,
  quizId: string,
  classeId: string | null,
): Promise<{ eleves: LigneTableauLive[]; nbQuestions: number } | { error: string }> {
  const [inscriptionsLues, sessionsLues, scoresLus, questionsLues] = await Promise.all([
    // Lu ici plutôt que par `eleveIdsInscritsClasse`, qui ignore l'erreur : une
    // panne y devient « classe vide », et le tableau se viderait sans un mot.
    classeId
      ? supabase.from('inscriptions').select('eleve_id').eq('classe_id', classeId).eq('statut', 'active')
      : Promise.resolve({ data: [] as { eleve_id: string }[], error: null }),
    supabase.from('quazian_sessions').select('id, eleve_id, submitted_at, auto_submitted').eq('quiz_id', quizId),
    supabase.from('quazian_quiz_scores').select('eleve_id, score_moyen').eq('quiz_id', quizId),
    // Le nombre de questions se COMPTE : `nb_questions` est un compteur écrit à
    // côté des lignes, et c'est d'elles que dépend « 9 sur 15 ».
    supabase.from('quazian_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId),
  ])
  // supabase-js ne lève pas : une lecture ratée rendrait un tableau vide, que le
  // professeur lirait « personne n'a commencé » en pleine passation.
  if (inscriptionsLues.error) return { error: `Lecture de la classe impossible : ${inscriptionsLues.error.message}` }
  const inscrits = [...new Set((inscriptionsLues.data ?? []).map((r) => r.eleve_id as string))]
  if (sessionsLues.error) return { error: `Lecture des sessions impossible : ${sessionsLues.error.message}` }
  if (scoresLus.error) return { error: `Lecture des notes impossible : ${scoresLus.error.message}` }
  if (questionsLues.error) return { error: `Lecture des questions impossible : ${questionsLues.error.message}` }
  const sessions = sessionsLues.data ?? []

  const reponduesParSession: Record<string, number> = {}
  if (sessions.length > 0) {
    const ids = sessions.map((s) => s.id as string)
    for (let debut = 0; ; debut += PAGE) {
      const { data, error } = await supabase
        .from('quazian_answers')
        .select('session_id')
        .in('session_id', ids)
        .eq('repondu', true)
        .order('session_id', { ascending: true })
        .order('question_id', { ascending: true })
        .range(debut, debut + PAGE - 1)
      if (error) return { error: `Lecture des réponses impossible : ${error.message}` }
      for (const r of data ?? []) {
        const id = r.session_id as string
        reponduesParSession[id] = (reponduesParSession[id] ?? 0) + 1
      }
      if ((data ?? []).length < PAGE) break
    }
  }

  const ids = [...new Set([...inscrits, ...sessions.map((s) => s.eleve_id as string)])]
  const { data: profils, error: eProfils } = ids.length > 0
    ? await supabase.from('profiles').select('id, display_name').in('id', ids)
    : { data: [], error: null }
  if (eProfils) return { error: `Lecture des noms impossible : ${eProfils.message}` }

  return {
    eleves: composerTableauLive({
      inscrits,
      profils: (profils ?? []) as { id: string; display_name: string | null }[],
      sessions: sessions as { id: string; eleve_id: string; submitted_at: string | null; auto_submitted: boolean | null }[],
      scores: (scoresLus.data ?? []) as { eleve_id: string; score_moyen: number | null }[],
      reponduesParSession,
      sansClasse: !classeId,
    }),
    nbQuestions: questionsLues.count ?? 0,
  }
}
