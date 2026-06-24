'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  const jetonsActuels = useMemo<[number, number, number, number]>(
    () => reponses[question?.id] ?? [25, 25, 25, 25],
    [reponses, question?.id]
  )
  const restants = 100 - jetonsActuels.reduce((a, b) => a + b, 0)
  const peutSoumettre = restants === 0

  // Ref vers la dernière version de handleSoumettre, pour l'auto-soumission au
  // temps écoulé (évite une closure périmée dans le timer).
  const handleSoumettreRef = useRef<() => void>(() => {})

  // Verrou de page (T2) : tant que le quiz n'est pas soumis, on empêche la sortie
  // (avertissement natif sur fermeture/rechargement) et on piège le bouton retour
  // (tout popstate ré-empile l'état courant). Soft-lock : dissuasif, non infaillible.
  useEffect(() => {
    if (soumis) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [soumis])

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
        <h3 className="text-lg font-serif text-encre mb-2">Quizz soumis !</h3>
        <p className="text-sm text-encre-douce">
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
                  ? 'bg-bouton text-surface'
                  : reponses[questions[i].id]
                  ? 'bg-ok-teinte text-ok'
                  : 'bg-parchemin-fonce text-muet'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muet inline-flex items-center gap-1" title="Ne quitte pas la page pendant le quiz">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 1a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4Zm2 6V5a2 2 0 1 0-4 0v2h4Z" clipRule="evenodd" />
            </svg>
            Page verrouillée
          </span>
          {secondesRestantes !== null && (
            <span className={`text-sm font-mono font-bold ${secondesRestantes < 120 ? 'text-retard' : 'text-encre-douce'}`}>
              {formatTemps(secondesRestantes)}
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="bg-surface border border-bordure rounded-2xl p-6 mb-5 shadow-sm">
        <p className="text-xs text-muet mb-3">Question {indexQuestion + 1}/{questions.length}</p>
        <p className="text-base font-medium text-encre leading-relaxed">{question.enonce}</p>
      </div>

      {/* Jetons */}
      <div className="bg-surface border border-bordure rounded-2xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-encre-douce">Répartis 100 points entre les réponses</p>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold tabular-nums ${restants > 0 ? 'text-attention' : 'text-ok'}`}>
              {100 - restants} / 100 placés{restants === 0 ? ' ✓' : ''}
            </span>
            <button
              onClick={resetNeutral}
              className="text-xs text-muet hover:text-encre-douce underline"
            >
              Je ne sais pas
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold text-muet shrink-0">{LETTRES[i]}</span>
              <p className="flex-1 text-sm text-encre leading-snug">{opt}</p>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => modifierJeton(i, -5)}
                  disabled={jetonsActuels[i] <= 0}
                  aria-label={`Retirer 5 points à la réponse ${LETTRES[i]}`}
                  className="w-11 h-11 sm:w-8 sm:h-8 rounded-lg bg-parchemin-fonce text-encre-douce hover:bg-bordure disabled:opacity-30 text-lg font-bold leading-none"
                >
                  −
                </button>
                <span className={`w-10 text-center text-sm font-bold tabular-nums ${jetonsActuels[i] > 50 ? 'text-pigment' : 'text-encre-douce'}`}>
                  {jetonsActuels[i]}
                </span>
                <button
                  onClick={() => modifierJeton(i, 5)}
                  disabled={restants <= 0}
                  aria-label={`Ajouter 5 points à la réponse ${LETTRES[i]}`}
                  className="w-11 h-11 sm:w-8 sm:h-8 rounded-lg bg-parchemin-fonce text-encre-douce hover:bg-bordure disabled:opacity-30 text-lg font-bold leading-none"
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
            className="px-4 py-2.5 text-sm bg-parchemin-fonce text-encre-douce rounded-xl hover:bg-bordure"
          >
            ← Précédent
          </button>
        )}

        {indexQuestion < questions.length - 1 ? (
          <button
            onClick={validerEtSuivant}
            disabled={!peutSoumettre || pending}
            className="flex-1 py-2.5 text-sm bg-bouton text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors"
          >
            {pending ? 'Sauvegarde…' : 'Suivant →'}
          </button>
        ) : (
          <button
            onClick={handleSoumettre}
            disabled={pending}
            className="flex-1 py-2.5 text-sm bg-ok text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors font-medium"
          >
            {pending ? 'Envoi…' : 'Soumettre le quizz'}
          </button>
        )}
      </div>
    </div>
  )
}
