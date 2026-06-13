import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { initialiserSession, chargerRetourQuizz } from './actions'
import { PassationJetons } from './PassationJetons'

const LETTRES = ['A', 'B', 'C', 'D']

export default async function PassationPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('statut, ferme_at, classe_id')
    .eq('id', quizId)
    .single()

  if (!quizz) {
    return <div className="text-center py-16 text-stone-400">Quizz introuvable.</div>
  }

  // Retour post-quizz si fermé et soumis
  if (quizz.statut === 'ferme') {
    const retour = await chargerRetourQuizz(quizId)

    if ('error' in retour) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 text-stone-500 text-sm">
          <p>{retour.error}</p>
          <Link href="/eleve/modules/quazian" className="mt-4 inline-block text-stone-400 underline text-sm">
            Retour
          </Link>
        </div>
      )
    }

    return (
      <div className="max-w-xl mx-auto">
        <Link href="/eleve/modules/quazian" className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-block">
          ← Retour
        </Link>
        <h2 className="text-xl font-serif text-stone-900 mb-2 mt-2">Résultats du quizz</h2>

        {retour.scoreMoyen !== null && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-serif text-stone-900">{retour.scoreMoyen.toFixed(1)}</p>
              <p className="text-xs text-stone-400 mt-1">score moyen /10</p>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-serif text-stone-900">
                {retour.noteFormative?.toFixed(1)}/20
              </p>
              <p className="text-xs text-stone-400 mt-1">note formative</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {retour.questions.map((q, i) => {
            const correct = q.indexCorrect
            const score = q.score
            const couleurScore = score === null ? '' : score > 5 ? 'text-green-700' : score > 0 ? 'text-amber-600' : 'text-red-600'

            return (
              <div key={i} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-stone-400">Q{i + 1}</p>
                  {score !== null && (
                    <span className={`text-sm font-bold ${couleurScore}`}>
                      {score > 0 ? '+' : ''}{score.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-stone-900 mb-3">{q.enonce}</p>

                <div className="space-y-1.5">
                  {q.options.map((opt, j) => {
                    const estCorrect = j === correct
                    const mesJetons = q.mesJetons?.[j] ?? 25
                    return (
                      <div
                        key={j}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          estCorrect
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-stone-50 text-stone-600'
                        }`}
                      >
                        <span className="font-mono text-xs font-bold w-4">{LETTRES[j]}</span>
                        <span className="flex-1">{opt}</span>
                        <span className={`text-xs font-bold tabular-nums ${mesJetons > 50 ? 'text-violet-600' : 'text-stone-400'}`}>
                          {mesJetons}
                        </span>
                        {estCorrect && <span className="text-xs text-green-600">✓</span>}
                      </div>
                    )
                  })}
                </div>
                {!q.repondu && (
                  <p className="text-xs text-stone-400 mt-2">Non répondu (25/25/25/25 appliqué)</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Passation en cours
  const donnees = await initialiserSession(quizId)

  if ('error' in donnees) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        <p>{donnees.error}</p>
        <Link href="/eleve/modules/quazian" className="mt-4 inline-block underline">Retour</Link>
      </div>
    )
  }

  if (donnees.soumis) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">✓</div>
        <h3 className="text-lg font-serif text-stone-900 mb-2">Quizz soumis</h3>
        <p className="text-sm text-stone-500 mb-4">
          Le retour sera disponible une fois que ton professeur ferme le quizz.
        </p>
        <Link href="/eleve/modules/quazian" className="text-sm text-stone-400 underline">
          Retour
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PassationJetons
        sessionId={donnees.sessionId}
        quizId={quizId}
        questions={donnees.questions}
        reponsesInitiales={donnees.reponsesExistantes}
        fermeAt={quizz.ferme_at}
      />
    </div>
  )
}
