'use client'

import { useState } from 'react'
import { validerQuestion, modifierQuestion, regenererDisctracteurs } from '../actions'

interface Question {
  id: string
  enonce: string
  options: string[]
  index_correct: number
  concept_tag: string
  statut_validation: string
}

const LETTRES = ['A', 'B', 'C', 'D']

export function QuestionCard({
  question,
  numero,
  quizId,
  readOnly,
}: {
  question: Question
  numero: number
  quizId: string
  readOnly: boolean
}) {
  const [mode, setMode] = useState<'vue' | 'edit'>('vue')
  const [pending, setPending] = useState(false)
  const [enonce, setEnonce] = useState(question.enonce)
  const [options, setOptions] = useState([...question.options])
  const [correct, setCorrect] = useState(question.index_correct)
  const [tag, setTag] = useState(question.concept_tag)

  async function handleValider() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', question.id)
    fd.append('quizId', quizId)
    await validerQuestion(fd)
    setPending(false)
  }

  async function handleModifier() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', question.id)
    fd.append('quizId', quizId)
    fd.append('enonce', enonce)
    options.forEach((o, i) => fd.append(`opt${i}`, o))
    fd.append('index_correct', String(correct))
    fd.append('concept_tag', tag)
    await modifierQuestion(fd)
    setMode('vue')
    setPending(false)
  }

  async function handleRegenerer() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', question.id)
    fd.append('quizId', quizId)
    await regenererDisctracteurs(fd)
    setPending(false)
  }

  const estValide = question.statut_validation === 'valide'

  if (mode === 'edit') {
    return (
      <div className="bg-surface border border-bordure rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muet font-mono">Q{numero}</span>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="ml-auto px-2 py-0.5 text-xs border border-bordure rounded-lg w-36"
            placeholder="concept_tag"
          />
        </div>
        <textarea
          value={enonce}
          onChange={(e) => setEnonce(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-bordure rounded-lg mb-3 resize-none"
        />
        <div className="space-y-2 mb-4">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold border transition-colors ${
                  correct === i
                    ? 'bg-ok text-surface border-ok'
                    : 'bg-surface text-muet border-bordure hover:border-encre-douce'
                }`}
              >
                {LETTRES[i]}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))}
                className="flex-1 px-3 py-1.5 text-sm border border-bordure rounded-lg"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleModifier}
            disabled={pending}
            className="px-3 py-1 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Sauvegarder
          </button>
          <button
            onClick={() => setMode('vue')}
            className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-surface border rounded-xl p-4 ${estValide ? 'border-bordure' : 'border-attention'}`}>
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xs text-muet font-mono shrink-0">Q{numero}</span>
        {question.concept_tag && (
          <span className="text-xs text-muet truncate">{question.concept_tag}</span>
        )}
        {estValide ? (
          <span className="ml-auto text-xs text-ok shrink-0">✓</span>
        ) : (
          <span className="ml-auto text-xs text-attention shrink-0">à valider</span>
        )}
      </div>

      <p className="text-sm font-medium text-encre mb-3">{question.enonce}</p>

      <div className="space-y-1.5 mb-4">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              i === question.index_correct
                ? 'bg-ok-teinte text-ok border border-ok'
                : 'bg-parchemin-fonce text-encre-douce'
            }`}
          >
            <span className="font-mono text-xs font-bold">{LETTRES[i]}</span>
            {opt}
            {i === question.index_correct && <span className="ml-auto text-xs">✓</span>}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2 flex-wrap">
          {!estValide && (
            <button
              onClick={handleValider}
              disabled={pending}
              className="px-3 py-1 text-xs bg-ok text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              ✓ Valider
            </button>
          )}
          <button
            onClick={() => setMode('edit')}
            className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure"
          >
            Modifier
          </button>
          <button
            onClick={handleRegenerer}
            disabled={pending}
            className="px-3 py-1 text-xs text-pigment hover:bg-pigment-teinte rounded-lg transition-colors disabled:opacity-50"
          >
            ↻ Nouveaux distracteurs
          </button>
        </div>
      )}
    </div>
  )
}
