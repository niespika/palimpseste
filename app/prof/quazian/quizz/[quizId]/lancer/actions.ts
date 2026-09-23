'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { calculerScoreBrier, JETONS_NEUTRE } from '@/utils/brier'
import { lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'

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

  // Aucune question en attente de validation ne part aux élèves (revue du 22/09) :
  // la page le contrôle, mais un lancement depuis l'antichambre passe par ici
  // sans la recharger — et des questions IA peuvent être arrivées entre-temps.
  const { count: aValider, error: eCompte } = await supabase
    .from('quazian_questions').select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId).eq('statut_validation', 'suggere')
  if (eCompte) return { error: `Lecture des questions impossible : ${eCompte.message}` }
  if ((aValider ?? 0) > 0) return { error: `${aValider} question${(aValider ?? 0) > 1 ? 's attendent' : ' attend'} encore ta validation : le quiz ne se lance pas.` }

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
 * Ouvrir l'antichambre (retours de classe du 22/09) : le premier des deux temps.
 * Le statut RESTE `brouillon` — aucune question ne sort — et `ferme_at` ne se
 * pose pas : le chrono ne part qu'au lancement (`lancerQuizz`, inchangé).
 */
export async function ouvrirAntichambre(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string
  if (!(await lirePorteAntichambre(createAdminClient()))) {
    return { error: 'L’antichambre est fermée dans les paramètres de Quazian : le quiz se lance en un geste.' }
  }
  // Même contrôle que la page : on n'ouvre pas la salle d'un quiz inachevé.
  const { count, error: eCompte } = await supabase
    .from('quazian_questions').select('id', { count: 'exact', head: true })
    .eq('quiz_id', quizId).eq('statut_validation', 'suggere')
  if (eCompte) return { error: `Lecture des questions impossible : ${eCompte.message}` }
  if ((count ?? 0) > 0) return { error: 'Des questions restent à valider : l’antichambre ne s’ouvre pas encore.' }

  // Pas de `.is('antichambre_at', null)` : une antichambre expirée (3 h) se rouvre,
  // et un double clic ne fait que rafraîchir l'instant d'ouverture.
  const { data, error } = await supabase.from('quazian_quizzes')
    .update({ antichambre_at: new Date().toISOString() })
    .eq('id', quizId).eq('statut', 'brouillon')
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    const { data: q } = await supabase.from('quazian_quizzes').select('statut').eq('id', quizId).maybeSingle()
    return { error: q ? `Ce quizz est « ${q.statut} » : seul un brouillon ouvre son antichambre.` : 'Quizz introuvable.' }
  }
  revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

/** Refermer l'antichambre sans lancer : le quiz redevient un simple brouillon. */
export async function fermerAntichambre(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string
  const { error } = await supabase.from('quazian_quizzes')
    .update({ antichambre_at: null }).eq('id', quizId).eq('statut', 'brouillon')
  if (error) return { error: error.message }
  // Les présences ne servent plus : la table est au service-role (aucune policy).
  const { error: eMenage } = await createAdminClient().from('quazian_antichambre').delete().eq('quiz_id', quizId)
  if (eMenage) console.error(`[quazian] présences non effacées (quiz ${quizId}) — ${eMenage.message}`)
  revalidatePath(`/prof/quazian/quizz/${quizId}/lancer`)
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
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

  // ⭐ LES SCORES PAR RÉPONSE S'ÉCRIVENT ICI (revue du 23/09) : pendant le quiz,
  //    un élève qui avait soumis pouvait lire son score par question et en tirer
  //    la bonne réponse. `soumettreQuizz` ne les écrit donc plus tant que le quiz
  //    tourne ; on complète ici toute réponse encore sans score, AVANT de figer —
  //    un échec laisse le quiz ouvert, réparable (même doctrine que plus haut).
  const eParReponse = await ecrireScoresParReponse(supabase, quizId, questions)
  if (eParReponse) return { error: `Écriture des scores par question impossible (${eParReponse}) — le quizz reste ouvert. Réessaie.` }

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

  // Seconde passe, quiz figé : un élève qui envoyait pendant la fermeture a pu
  // écrire ses lignes après la première. Rien de grave si elle échoue (la note
  // et l'écran de note se recalculent depuis les points) : on le dit au journal.
  const eSeconde = await ecrireScoresParReponse(supabase, quizId, questions)
  if (eSeconde) console.error(`[quazian] seconde passe des scores (quiz ${quizId}) — ${eSeconde}`)

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
 * Le score de chaque réponse encore sans score, pour toutes les copies soumises
 * du quiz. Lecture paginée (PostgREST s'arrête à 1000 lignes sans le dire), puis
 * écriture groupée par `upsert` sur la clé (session, question) — les lignes
 * existent, seules `score` et `brier_brut` changent. Renvoie le message d'erreur,
 * ou null.
 */
async function ecrireScoresParReponse(
  supabase: Awaited<ReturnType<typeof import('@/utils/supabase/server').createClient>>,
  quizId: string,
  questions: { id: string; index_correct: number }[],
): Promise<string | null> {
  const correcte = new Map(questions.map((q) => [q.id, q.index_correct]))
  const { data: sessions, error: eSessions } = await supabase
    .from('quazian_sessions').select('id').eq('quiz_id', quizId).not('submitted_at', 'is', null)
  if (eSessions) return eSessions.message
  const ids = (sessions ?? []).map((s) => s.id as string)
  if (ids.length === 0) return null

  const PAGE = 1000
  const aEcrire: Record<string, unknown>[] = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await supabase
      .from('quazian_answers')
      .select('session_id, question_id, p_a, p_b, p_c, p_d, repondu')
      .in('session_id', ids).is('score', null)
      .order('session_id', { ascending: true }).order('question_id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) return error.message
    for (const r of data ?? []) {
      const ok = correcte.get(r.question_id as string)
      if (ok === undefined) continue
      const score = calculerScoreBrier([r.p_a * 100, r.p_b * 100, r.p_c * 100, r.p_d * 100], ok)
      aEcrire.push({ ...r, score, brier_brut: score / 10 })
    }
    if ((data ?? []).length < PAGE) break
  }
  for (let i = 0; i < aEcrire.length; i += 500) {
    const { error } = await supabase.from('quazian_answers')
      .upsert(aEcrire.slice(i, i + 500), { onConflict: 'session_id,question_id' })
    if (error) return error.message
  }
  return null
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

    // Les scores PAR RÉPONSE ne s'écrivent plus ici : `ecrireScoresParReponse`
    // les pose tous à la fin de la fermeture (revue finale du 23/09 — sans quoi,
    // une fermeture interrompue laissait des copies scorées lisibles).
    if (!rep) {
      answersToInsert.push({
        session_id: sessionId,
        question_id: q.id,
        p_a: 0.25,
        p_b: 0.25,
        p_c: 0.25,
        p_d: 0.25,
        repondu: false,
      })
    }

    scoreMoyen += scoreBrut
  }

  if (answersToInsert.length > 0) {
    // `ignoreDuplicates` : si l'élève envoie au même instant, son propre envoi a
    // pu insérer ces lignes — l'insertion ne doit pas échouer en « duplicate key ».
    const { error } = await supabase.from('quazian_answers')
      .upsert(answersToInsert, { onConflict: 'session_id,question_id', ignoreDuplicates: true })
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
