'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderConfig } from '../actions'

interface Props {
  promptInitial: string
  baremeInitial: string
  promptDefaut: string
  baremeDefaut: string
}

export default function FormulaireParametres({
  promptInitial,
  baremeInitial,
  promptDefaut,
  baremeDefaut,
}: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState(promptInitial)
  const [bareme, setBareme] = useState(baremeInitial)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderConfig(prompt, bareme)
    setEnregistrement(false)
    if (res.error) {
      setMessage({ type: 'err', texte: res.error })
    } else {
      setMessage({ type: 'ok', texte: 'Paramètres enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Les variables disponibles dans le prompt sont :{' '}
        <code className="font-mono">{'{{theme}}'}</code>,{' '}
        <code className="font-mono">{'{{description_theme}}'}</code>,{' '}
        <code className="font-mono">{'{{numero_semaine}}'}</code>,{' '}
        <code className="font-mono">{'{{historique}}'}</code>,{' '}
        <code className="font-mono">{'{{bareme}}'}</code>.
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Barème (0–4)</label>
          <button
            type="button"
            onClick={() => setBareme(baremeDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={bareme}
          onChange={e => setBareme(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt d'évaluation</label>
          <button
            type="button"
            onClick={() => setPrompt(promptDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={30}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.texte}
        </div>
      )}

      <button
        onClick={handleSauvegarder}
        disabled={enregistrement}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
      >
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </button>
    </div>
  )
}
