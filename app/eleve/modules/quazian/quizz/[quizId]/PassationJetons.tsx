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
  const reponsesSauvees = useRef(reponsesInitiales)
  const [pending, setPending] = useState(false)
  const envoiEnCours = useRef(false)
  const [avisSoumission, setAvisSoumission] = useState<string | null>(null)
  const [soumis, setSoumis] = useState(false)
  // ⚠️ Distinct de `soumis` : une soumission REFUSÉE n'est pas une soumission.
  const [erreur, setErreur] = useState<string | null>(null)
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

  // Tous les chemins de navigation passent par la sauvegarde, y compris les
  // numéros et « Précédent ». En cas d'échec, la réponse reste à l'écran.
  async function allerA(index: number) {
    if (envoiEnCours.current || index === indexQuestion) return
    if (!peutSoumettre) { setErreur('Répartis les 100 points avant de changer de question.'); return }
    envoiEnCours.current = true
    setPending(true)
    setErreur(null)
    try {
      const retour = await sauvegarderReponse(sessionId, question.id, jetonsActuels, question.optionMapping)
      if (retour.error) { setErreur(retour.error); return }
      reponsesSauvees.current = { ...reponsesSauvees.current, [question.id]: jetonsActuels }
      setReponses((prev) => ({ ...prev, [question.id]: jetonsActuels }))
      setIndexQuestion(index)
    } catch {
      setErreur('La sauvegarde n’a pas pu être confirmée. Réessaie.')
    } finally {
      envoiEnCours.current = false
      setPending(false)
    }
  }

  const handleSoumettre = useCallback(async (automatique = false) => {
    if (soumis || envoiEnCours.current) return
    envoiEnCours.current = true
    setPending(true)
    setErreur(null)
    try {
      // Ce gestionnaire s'exécute au clic ou au timer, jamais pendant le rendu.
      // eslint-disable-next-line react-hooks/purity
      const expire = !!fermeAt && new Date(fermeAt).getTime() <= Date.now()
      let avis = expire ? 'Le temps est écoulé : les réponses enregistrées avant l’échéance ont été soumises.' : null
      if (!expire) {
        // Vérifier toutes les réponses présentes. Ne renvoyer que celles qui
        // ont changé, pour ne pas consommer le temps restant en doubles envois.
        const aSauver = { ...reponses, [question.id]: jetonsActuels }
        const incomplet = questions.findIndex((q) => aSauver[q.id] && aSauver[q.id].reduce((a, b) => a + b, 0) !== 100)
        if (incomplet >= 0 && !automatique) {
          setIndexQuestion(incomplet)
          setErreur('Répartis les 100 points de cette question avant de soumettre.')
          return
        }
        for (const q of questions) {
          const jetons = aSauver[q.id]
          if (!jetons || jetons.reduce((a, b) => a + b, 0) !== 100) continue
          if (reponsesSauvees.current[q.id]?.every((v, i) => v === jetons[i])) continue
          const retour = await sauvegarderReponse(sessionId, q.id, jetons, q.optionMapping)
          if (retour.ferme) {
            avis = retour.error ?? null
            break // L'échéance serveur fait foi, même si l'horloge locale diffère.
          }
          if (retour.error) { setErreur(retour.error); return }
          reponsesSauvees.current = { ...reponsesSauvees.current, [q.id]: jetons }
        }
      }
      const retour = await soumettreQuizz(sessionId, quizId)
      if (retour.error) { setErreur(retour.error); return }
      setAvisSoumission(avis)
      setSoumis(true)
    } catch {
      setErreur('L’envoi n’a pas pu être confirmé. Réessaie.')
    } finally {
      envoiEnCours.current = false
      setPending(false)
    }
  }, [soumis, fermeAt, reponses, questions, sessionId, question, jetonsActuels, quizId])

  useEffect(() => {
    handleSoumettreRef.current = () => { void handleSoumettre(true) }
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
        {avisSoumission && <p role="status" className="text-sm text-attention mb-4">{avisSoumission}</p>}
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
              onClick={() => allerA(i)}
              disabled={pending}
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
              disabled={pending}
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
                  disabled={pending || jetonsActuels[i] <= 0}
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
                  disabled={pending || restants <= 0}
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
            onClick={() => allerA(indexQuestion - 1)}
            disabled={pending}
            className="px-4 py-2.5 text-sm bg-parchemin-fonce text-encre-douce rounded-xl hover:bg-bordure"
          >
            ← Précédent
          </button>
        )}

        {indexQuestion < questions.length - 1 ? (
          <button
            onClick={() => allerA(indexQuestion + 1)}
            disabled={!peutSoumettre || pending}
            className="flex-1 py-2.5 text-sm bg-bouton text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors"
          >
            {pending ? 'Sauvegarde…' : 'Suivant →'}
          </button>
        ) : (
          <button
            onClick={() => handleSoumettre()}
            disabled={pending}
            className="flex-1 py-2.5 text-sm bg-ok text-surface rounded-xl hover:opacity-90 disabled:opacity-40 transition-colors font-medium"
          >
            {pending ? 'Envoi…' : 'Soumettre le quizz'}
          </button>
        )}
      </div>
      {/* ⛔ Le refus se DIT. Sans cela l'élève lisait « Quizz soumis ! » sur un
          envoi que le serveur avait refusé, et repartait — sa session restant
          ouverte, sa note jamais posée. Le ton reste celui d'un contretemps :
          rien n'est perdu, sa copie est intacte, il peut recommencer. */}
      {erreur && (
        <p role="alert" className="mt-4 text-sm text-attention text-center">
          {erreur}
          <span className="block text-muet mt-1">
            Tes réponses restent à l’écran. Garde cette page ouverte pour réessayer.
          </span>
        </p>
      )}
    </div>
  )
}
