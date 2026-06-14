'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { sauvegarderReponse, soumettreQuizz, type QuestionPassation } from './actions'

const LETTRES = ['A', 'B', 'C', 'D']

interface Props {
  sessionId: string
  quizId: string
  questions: QuestionPassation[]
  reponsesInitiales: Record<string, [number, number, number, number]>
  fermeAt: string | null
}

export function PassationJetons({ sessionId, quizId, questions, reponsesInitiales, fermeAt }: Props) {
  const [indexQuestion, setIndexQuestion] = useState(0)
  const [reponses, setReponses] = useState<Record<string, [number, number, number, number]>>(reponsesInitiales)
  const [pending, setPending] = useState(false)
  const [soumis, setSoumis] = useState(false)
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)

  const question = questions[indexQuestion]
  const jetonsActuels: [number, number, number, number] = reponses[question?.id] ?? [25, 25, 25, 25]
  const restants = 100 - jetonsActuels.reduce((a, b) => a + b, 0)
  const peutSoumettre = restants === 0

  // Ref vers la dernière version de handleSoumettre, pour l'auto-soumission au
  // temps écoulé (évite une closure périmée dans le timer).
  const handleSoumettreRef = useRef<() => void>(() => {})

  // Timer
  useEffect(() => {
    if (!fermeAt) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(fermeAt).getTime() - Date.now()) / 1000))
      setSecondesRestantes(diff)
      if (diff === 0 && !soumis) handleSoumettreRef.current()
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [fermeAt, soumis])

  function modifierJeton(index: number, delta: number) {
    setReponses((prev) => {
      const actuel = [...(prev[question.id] ?? [25, 25, 25, 25])] as [number, number, number, number]
      const restant = 100 - actuel.reduce((a, b) => a + b, 0)
      const nouvelleValeur = actuel[index] + delta

      if (nouvelleValeur < 0) return prev
      if (delta > 0 && restant <= 0) return prev

      actuel[index] = nouvelleValeur
      return { ...prev, [question.id]: actuel }
    })
  }

  function resetNeutral() {
    setReponses((prev) => ({ ...prev, [question.id]: [25, 25, 25, 25] }))
  }

  async function validerEtSuivant() {
    if (!peutSoumettre || pending) return
    setPending(true)
    await sauvegarderReponse(sessionId, question.id, jetonsActuels, question.optionMapping)
    setPending(false)
    if (indexQuestion < questions.length - 1) {
      setIndexQuestion(indexQuestion + 1)
    }
  }

  const handleSoumettre = useCallback(async () => {
    if (soumis || pending) return
    setPending(true)
    // Sauvegarder la question courante si complète
    if (peutSoumettre) {
      await sauvegarderReponse(sessionId, question.id, jetonsActuels, question.optionMapping)
    }
    await soumettreQuizz(sessionId, quizId)
    setSoumis(true)
    setPending(false)
  }, [soumis, pending, peutSoumettre, sessionId, question, jetonsActuels, quizId])

  // Garder la ref à jour (toujours la dernière closure)
  useEffect(() => {
    handleSoumettreRef.current = handleSoumettre
  }, [handleSoumettre])

  function formatTemps(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  if (soumis) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-lg font-serif text-stone-900 mb-2">Quizz soumis !</h3>
        <p className="text-sm text-stone-500">
          Le retour sera disponible une fois que ton professeur aura fermé le quizz.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndexQuestion(i)}
              className={`w-7 h-7 text-xs rounded-md transition-colors ${
                i === indexQuestion
                  ? 'bg-stone-800 text-white'
                  : reponses[questions[i].id]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        {secondesRestantes !== null && (
          <span className={`text-sm font-mono font-bold ${secondesRestantes < 120 ? 'text-red-600' : 'text-stone-500'}`}>
            {formatTemps(secondesRestantes)}
          </span>
        )}
      </div>

      {/* Question */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-5 shadow-sm">
        <p className="text-xs text-stone-400 mb-3">Question {indexQuestion + 1}/{questions.length}</p>
        <p className="text-base font-medium text-stone-900 leading-relaxed">{question.enonce}</p>
      </div>

      {/* Jetons */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-stone-500">Répartis 100 points entre les réponses</p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${restants > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {restants} restant{restants > 1 ? 's' : ''}
            </span>
            <button
              onClick={resetNeutral}
              className="text-xs text-stone-400 hover:text-stone-600 underline"
            >
              Je ne sais pas
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold text-stone-400 shrink-0">{LETTRES[i]}</span>
              <p className="flex-1 text-sm text-stone-800 leading-snug">{opt}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => modifierJeton(i, -5)}
                  disabled={jetonsActuels[i] <= 0}
                  className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-30 text-lg font-bold leading-none"
                >
                  −
                </button>
                <span className={`w-10 text-center text-sm font-bold tabular-nums ${jetonsActuels[i] > 50 ? 'text-violet-600' : 'text-stone-700'}`}>
                  {jetonsActuels[i]}
                </span>
                <button
                  onClick={() => modifierJeton(i, 5)}
                  disabled={restants <= 0}
                  className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-30 text-lg font-bold leading-none"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {indexQuestion > 0 && (
          <button
            onClick={() => setIndexQuestion(indexQuestion - 1)}
            className="px-4 py-2.5 text-sm bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200"
          >
            ← Précédent
          </button>
        )}

        {indexQuestion < questions.length - 1 ? (
          <button
            onClick={validerEtSuivant}
            disabled={!peutSoumettre || pending}
            className="flex-1 py-2.5 text-sm bg-stone-800 text-white rounded-xl hover:bg-stone-900 disabled:opacity-40 transition-colors"
          >
            {pending ? 'Sauvegarde…' : 'Suivant →'}
          </button>
        ) : (
          <button
            onClick={handleSoumettre}
            disabled={pending}
            className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 transition-colors font-medium"
          >
            {pending ? 'Envoi…' : 'Soumettre le quizz'}
          </button>
        )}
      </div>
    </div>
  )
}
