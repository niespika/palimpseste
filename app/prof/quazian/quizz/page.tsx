import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { supprimerQuizz } from './actions'
import { CreerQuizz } from './CreerQuizz'

async function actionSupprimer(formData: FormData): Promise<void> {
  'use server'
  await supprimerQuizz(formData)
}

const STATUT_LABELS: Record<string, { label: string; couleur: string }> = {
  brouillon: { label: 'Brouillon', couleur: 'bg-stone-100 text-stone-600' },
  lance: { label: 'En cours', couleur: 'bg-green-100 text-green-700' },
  ferme: { label: 'Terminé', couleur: 'bg-blue-50 text-blue-600' },
}

export default async function QuizzListePage() {
  const supabase = await createClient()

  const [{ data: quizzes }, { data: unites }] = await Promise.all([
    supabase
      .from('quazian_quizzes')
      .select('id, statut, classe_id, scope_unites, lance_at, ferme_at, nb_questions, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('scriptorium_unites')
      .select('id, label, classe, ordre')
      .order('ordre', { ascending: true }),
  ])

  // Compter les questions par quizz
  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('quiz_id, statut_validation')

  const qMap: Record<string, { total: number; validees: number }> = {}
  for (const q of questions ?? []) {
    if (!qMap[q.quiz_id]) qMap[q.quiz_id] = { total: 0, validees: 0 }
    qMap[q.quiz_id].total++
    if (q.statut_validation === 'valide') qMap[q.quiz_id].validees++
  }

  // Labels des unités
  const labelsUnites: Record<string, string> = {}
  for (const u of unites ?? []) labelsUnites[u.id] = u.label

  return (
    <div>
      <div className="mb-6">
        <Link href="/prof/quazian" className="text-sm text-stone-500 hover:text-stone-700">
          ← Flashcards
        </Link>
        <h3 className="text-lg font-serif text-stone-900 mt-2">Quizz</h3>
      </div>

      <CreerQuizz unites={unites ?? []} />

      <div className="mt-6 space-y-3">
        {(!quizzes || quizzes.length === 0) && (
          <p className="text-stone-400 text-sm text-center py-8">Aucun quizz pour l'instant.</p>
        )}
        {(quizzes ?? []).map((qz) => {
          const stats = qMap[qz.id] ?? { total: 0, validees: 0 }
          const statut = STATUT_LABELS[qz.statut] ?? STATUT_LABELS.brouillon
          const scope = (qz.scope_unites as string[]).map((id) => labelsUnites[id] ?? id)

          return (
            <div key={qz.id} className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statut.couleur}`}>
                    {statut.label}
                  </span>
                  {qz.classe_id && (
                    <span className="text-sm text-stone-700">{qz.classe_id}</span>
                  )}
                  <span className="text-xs text-stone-400">{stats.total} questions</span>
                  {qz.statut === 'brouillon' && stats.total > 0 && (
                    <span className="text-xs text-amber-600">
                      {stats.validees}/{stats.total} validées
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-1 truncate">
                  {scope.join(' · ')}
                </p>
                {qz.lance_at && (
                  <p className="text-xs text-stone-400">
                    Lancé le {new Date(qz.lance_at).toLocaleDateString('fr-FR')}
                    {qz.ferme_at && ` · Fermé le ${new Date(qz.ferme_at).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/prof/quazian/quizz/${qz.id}`}
                  className="px-3 py-1 text-xs bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors"
                >
                  {qz.statut === 'brouillon' ? 'Valider →' : 'Voir →'}
                </Link>
                {qz.statut === 'brouillon' && (
                  <form action={actionSupprimer}>
                    <input type="hidden" name="id" value={qz.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
