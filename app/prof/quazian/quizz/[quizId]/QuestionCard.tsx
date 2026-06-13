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
      <div className="bg-white border border-stone-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-stone-400 font-mono">Q{numero}</span>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="ml-auto px-2 py-0.5 text-xs border border-stone-200 rounded-lg w-36"
            placeholder="concept_tag"
          />
        </div>
        <textarea
          value={enonce}
          onChange={(e) => setEnonce(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg mb-3 resize-none"
        />
        <div className="space-y-2 mb-4">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(i)}
                className={`w-6 h-6 rounded-full text-xs font-bold border transition-colors ${
                  correct === i
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-stone-400 border-stone-300 hover:border-stone-500'
                }`}
              >
                {LETTRES[i]}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))}
                className="flex-1 px-3 py-1.5 text-sm border border-stone-300 rounded-lg"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleModifier}
            disabled={pending}
            className="px-3 py-1 text-xs bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50"
          >
            Sauvegarder
          </button>
          <button
            onClick={() => setMode('vue')}
            className="px-3 py-1 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border rounded-xl p-4 ${estValide ? 'border-stone-200' : 'border-amber-300'}`}>
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xs text-stone-400 font-mono shrink-0">Q{numero}</span>
        {question.concept_tag && (
          <span className="text-xs text-stone-400 truncate">{question.concept_tag}</span>
        )}
        {estValide ? (
          <span className="ml-auto text-xs text-green-600 shrink-0">✓</span>
        ) : (
          <span className="ml-auto text-xs text-amber-500 shrink-0">à valider</span>
        )}
      </div>

      <p className="text-sm font-medium text-stone-900 mb-3">{question.enonce}</p>

      <div className="space-y-1.5 mb-4">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              i === question.index_correct
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-stone-50 text-stone-600'
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
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              ✓ Valider
            </button>
          )}
          <button
            onClick={() => setMode('edit')}
            className="px-3 py-1 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200"
          >
            Modifier
          </button>
          <button
            onClick={handleRegenerer}
            disabled={pending}
            className="px-3 py-1 text-xs text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
          >
            ↻ Nouveaux distracteurs
          </button>
        </div>
      )}
    </div>
  )
}
