'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { genererQuestions, regenererQuestion } from '@/utils/generer-questions'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// Créer un quizz + générer ses questions
export async function creerQuizz(formData: FormData) {
  const { supabase } = await verifierProf()

  const classeId = (formData.get('classe_id') as string) || null
  const dureeMin = parseInt(formData.get('duree_min') as string) || 25
  const nbQuestions = parseInt(formData.get('nb_questions') as string) || 20
  const scopeRaw = formData.getAll('scope_unites') as string[]

  if (scopeRaw.length === 0) return { error: 'Sélectionne au moins une unité.' }
  if (!classeId) return { error: 'Sélectionne une classe.' }

  // Garde-fou : un quizz ne porte JAMAIS sur un « livre » Aletheia — seules les
  // unités de cours (cours + textes) alimentent les questions. L'UI filtre déjà
  // type='unite', ceci est une défense en profondeur côté serveur.
  const { data: unitesScope } = await supabase
    .from('scriptorium_unites')
    .select('id, type')
    .in('id', scopeRaw)
  if ((unitesScope ?? []).some(u => u.type === 'livre')) {
    return { error: 'Un quizz ne peut pas porter sur un livre (lecture Aletheia). Choisis des unités de cours.' }
  }

  // Récupérer les cartes validées des unités choisies (partagées uniquement)
  const { data: cartes } = await supabase
    .from('quazian_flashcards')
    .select('recto, verso, type, concept_tag')
    .in('scriptorium_unite_id', scopeRaw)
    .eq('statut', 'valide')
    .is('eleve_id', null)

  if (!cartes || cartes.length < 5) {
    return { error: `Pas assez de cartes validées dans les unités sélectionnées (${cartes?.length ?? 0} carte${(cartes?.length ?? 0) > 1 ? 's' : ''} trouvée${(cartes?.length ?? 0) > 1 ? 's' : ''}, minimum 5).` }
  }

  // Générer les questions via IA
  let questions
  try {
    questions = await genererQuestions(cartes, Math.min(nbQuestions, cartes.length * 2))
  } catch (e) {
    console.error('[quazian] génération questions :', e)
    return { error: "La génération IA a échoué (réponse inattendue du modèle). Réessaie." }
  }

  // Semestre actif (le quizz est ancré au semestre courant pour les notes de
  // semestre). Refuser sinon : un quizz sans semestre n'entrerait dans aucune note.
  const { data: semActif } = await supabase
    .from('semesters')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  if (!semActif) return { error: 'Aucun semestre actif. Définis-en un dans le Calendrier avant de créer un quizz.' }

  // Créer le quizz en brouillon
  const { data: quizz, error: errQuizz } = await supabase
    .from('quazian_quizzes')
    .insert({
      classe_id: classeId,
      semester_id: semActif.id,
      statut: 'brouillon',
      scope_unites: scopeRaw,
      duree_min: dureeMin,
      nb_questions: questions.length,
    })
    .select('id')
    .single()

  if (errQuizz || !quizz) return { error: errQuizz?.message ?? 'Erreur création quizz' }

  // Insérer les questions
  const rows = questions.map((q) => ({
    quiz_id: quizz.id,
    enonce: q.enonce,
    options: q.options,
    index_correct: q.index_correct,
    concept_tag: q.concept_tag,
    statut_validation: 'suggere',
  }))

  const { error: errQ } = await supabase.from('quazian_questions').insert(rows)
  if (errQ) return { error: errQ.message }

  revalidatePath('/prof/quazian/quizz')
  return { success: true, quizId: quizz.id }
}

// Valider une question
export async function validerQuestion(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string

  await supabase
    .from('quazian_questions')
    .update({ statut_validation: 'valide' })
    .eq('id', id)

  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Modifier une question manuellement
export async function modifierQuestion(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string
  const enonce = formData.get('enonce') as string
  const opt0 = formData.get('opt0') as string
  const opt1 = formData.get('opt1') as string
  const opt2 = formData.get('opt2') as string
  const opt3 = formData.get('opt3') as string
  const indexCorrect = parseInt(formData.get('index_correct') as string, 10)
  if (!Number.isInteger(indexCorrect) || indexCorrect < 0 || indexCorrect > 3) {
    return { error: 'Réponse correcte invalide (attendu : 0 à 3).' }
  }
  const conceptTag = formData.get('concept_tag') as string

  await supabase
    .from('quazian_questions')
    .update({
      enonce,
      options: [opt0, opt1, opt2, opt3],
      index_correct: indexCorrect,
      concept_tag: conceptTag,
      statut_validation: 'valide',
    })
    .eq('id', id)

  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Régénérer les distracteurs d'une question
export async function regenererDisctracteurs(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string

  const { data: question } = await supabase
    .from('quazian_questions')
    .select('enonce, options, index_correct, concept_tag')
    .eq('id', id)
    .single()

  if (!question) return { error: 'Question introuvable' }

  const bonneReponse = question.options[question.index_correct]
  const nouvelle = await regenererQuestion(question.enonce, bonneReponse, question.concept_tag)

  await supabase
    .from('quazian_questions')
    .update({
      options: nouvelle.options,
      index_correct: nouvelle.index_correct,
      statut_validation: 'valide',
    })
    .eq('id', id)

  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Valider toutes les questions d'un quizz
export async function validerToutesQuestions(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string

  await supabase
    .from('quazian_questions')
    .update({ statut_validation: 'valide' })
    .eq('quiz_id', quizId)

  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Supprimer un quizz (brouillon seulement)
export async function supprimerQuizz(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string

  const { data: q } = await supabase
    .from('quazian_quizzes')
    .select('statut')
    .eq('id', id)
    .single()

  if (q?.statut !== 'brouillon') return { error: 'Seuls les brouillons peuvent être supprimés.' }

  await supabase.from('quazian_quizzes').delete().eq('id', id)

  revalidatePath('/prof/quazian/quizz')
  return { success: true }
}
