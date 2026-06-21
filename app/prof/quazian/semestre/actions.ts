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

  // Semestre cible : explicite (formData) sinon le semestre actif.
  let semestreId = (formData.get('semester_id') as string) || null
  if (!semestreId) {
    const { data: semActif } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    semestreId = semActif?.id ?? null
  }
  if (!semestreId) return { error: 'Aucun semestre actif. Définis-en un dans le Calendrier.' }

  // Récupérer les quizz fermés DU SEMESTRE (optionnellement filtrés par classe)
  let quizzQuery = supabase
    .from('quazian_quizzes')
    .select('id, classe_id, moyenne_cohorte, ecart_type_cohorte')
    .eq('statut', 'ferme')
    .eq('semester_id', semestreId)

  if (classe) quizzQuery = quizzQuery.eq('classe_id', classe)
  const { data: quizzes } = await quizzQuery

  if (!quizzes || quizzes.length === 0) return { error: 'Aucun quizz terminé pour ce semestre.' }

  const quizIds = quizzes.map((q) => q.id)

  // Récupérer les scores de tous les élèves pour ces quizz
  const { data: scores } = await supabase
    .from('quazian_quiz_scores')
    .select('quiz_id, eleve_id, score_moyen, z_quiz')
    .in('quiz_id', quizIds)

  if (!scores || scores.length === 0) return { error: 'Aucun score trouvé.' }

  // Carte quizz → classe (un quizz appartient à une classe).
  const quizClasse: Record<string, string> = {}
  for (const q of quizzes) quizClasse[q.id] = q.classe_id as string

  // Grouper par (classe, élève) : un élève bi-classe obtient une note PAR classe, et on
  // n'écrit jamais classe_id = null (qui, en « toutes les classes », mélangeait les scores
  // et cassait l'upsert onConflict car NULL est distinct en Postgres).
  const parCle: Record<string, { classeId: string; eleveId: string; scoreMoyens: number[]; zQuizzes: number[] }> = {}
  for (const s of scores) {
    const classeId = quizClasse[s.quiz_id]
    if (!classeId) continue
    const cle = `${classeId}:${s.eleve_id}`
    if (!parCle[cle]) parCle[cle] = { classeId, eleveId: s.eleve_id, scoreMoyens: [], zQuizzes: [] }
    parCle[cle].scoreMoyens.push(s.score_moyen)
    if (s.z_quiz != null) parCle[cle].zQuizzes.push(s.z_quiz)
  }

  // Calculer la note finale pour chaque (classe, élève)
  const rows = []
  for (const { classeId, eleveId, scoreMoyens, zQuizzes } of Object.values(parCle)) {
    const zMoyen = zQuizzes.length > 0
      ? zQuizzes.reduce((a, b) => a + b, 0) / zQuizzes.length
      : 0

    const scoreMoyenSemestre = scoreMoyens.reduce((a, b) => a + b, 0) / scoreMoyens.length

    const noteRelative = Math.min(20, Math.max(0, params.centre + params.pente * zMoyen))
    const noteAbsolue = Math.min(20, Math.max(0, params.a + params.b * scoreMoyenSemestre))
    const noteFinale = params.w * noteRelative + (1 - params.w) * noteAbsolue

    rows.push({
      semester_id: semestreId,
      classe_id: classeId,
      eleve_id: eleveId,
      z_moyen: zMoyen,
      note_relative_20: noteRelative,
      note_absolue_20: noteAbsolue,
      note_finale_20: noteFinale,
    })
  }

  await supabase.from('quazian_semester').upsert(rows, { onConflict: 'semester_id,classe_id,eleve_id' })

  revalidatePath('/prof/quazian/semestre')
  return { success: true, nb: rows.length }
}
