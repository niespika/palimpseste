import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { validerToutesQuestions } from '../actions'
import { QuestionCard } from './QuestionCard'

async function actionValiderToutes(formData: FormData): Promise<void> {
  'use server'
  await validerToutesQuestions(formData)
}

export default async function QuizzDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('id, statut, classe_id, classes(nom), scope_unites, duree_min, nb_questions, lance_at, ferme_at, moyenne_cohorte, ecart_type_cohorte')
    .eq('id', quizId)
    .single()

  if (!quizz) notFound()

  const classeNom = (() => {
    const c = Array.isArray(quizz.classes) ? quizz.classes[0] : quizz.classes
    return c ? (c as { nom: string }).nom : null
  })()

  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('id, enonce, options, index_correct, concept_tag, statut_validation')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })

  const { data: unitesLabels } = await supabase
    .from('scriptorium_unites')
    .select('id, label')
    .in('id', quizz.scope_unites as string[])

  const labelsMap: Record<string, string> = {}
  for (const u of unitesLabels ?? []) labelsMap[u.id] = u.label

  const nbValidees = (questions ?? []).filter((q) => q.statut_validation === 'valide').length
  const total = (questions ?? []).length
  const toutValide = nbValidees === total && total > 0
  const readOnly = quizz.statut !== 'brouillon'

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/prof/quazian/quizz" className="text-sm text-stone-500 hover:text-stone-700">
            ← Quizz
          </Link>
          <h3 className="text-lg font-serif text-stone-900 mt-2">
            {classeNom ?? 'Quizz'} — {total} questions
          </h3>
          <p className="text-sm text-stone-400 mt-0.5">
            {(quizz.scope_unites as string[]).map((id) => labelsMap[id] ?? id).join(' · ')}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              quizz.statut === 'brouillon' ? 'bg-stone-100 text-stone-600' :
              quizz.statut === 'lance' ? 'bg-green-100 text-green-700' :
              'bg-blue-50 text-blue-600'
            }`}>
              {quizz.statut === 'brouillon' ? 'Brouillon' : quizz.statut === 'lance' ? 'En cours' : 'Terminé'}
            </span>
            <span className="text-xs text-stone-400">{quizz.duree_min} min</span>
            {!readOnly && (
              <span className="text-xs text-stone-400">{nbValidees}/{total} validées</span>
            )}
          </div>
        </div>

        {/* Actions principales */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          {!readOnly && (
            <form action={actionValiderToutes}>
              <input type="hidden" name="quizId" value={quizId} />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                ✓ Tout valider
              </button>
            </form>
          )}
          {toutValide && quizz.statut === 'brouillon' && (
            <Link
              href={`/prof/quazian/quizz/${quizId}/lancer`}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Lancer le quizz →
            </Link>
          )}
          {quizz.statut === 'lance' && (
            <Link
              href={`/prof/quazian/quizz/${quizId}/lancer`}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Tableau de bord live →
            </Link>
          )}
        </div>
      </div>

      {!toutValide && !readOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-700">
          {total - nbValidees} question{total - nbValidees > 1 ? 's' : ''} encore à valider avant de pouvoir lancer le quizz.
        </div>
      )}

      <div className="space-y-3">
        {(questions ?? []).map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            numero={i + 1}
            quizId={quizId}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}
