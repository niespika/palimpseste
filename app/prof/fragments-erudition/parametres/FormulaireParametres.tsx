'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderConfig, sauvegarderConfigOrale } from '../actions'

interface Props {
  promptInitial: string
  baremeInitial: string
  promptDefaut: string
  baremeDefaut: string
  promptOralInitial: string
  promptOralDefaut: string
  supprimerAudioInitial: boolean
}

export default function FormulaireParametres({
  promptInitial,
  baremeInitial,
  promptDefaut,
  baremeDefaut,
  promptOralInitial,
  promptOralDefaut,
  supprimerAudioInitial,
}: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState(promptInitial)
  const [bareme, setBareme] = useState(baremeInitial)
  const [promptOral, setPromptOral] = useState(promptOralInitial)
  const [supprimerAudio, setSupprimerAudio] = useState(supprimerAudioInitial)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const [r1, r2] = await Promise.all([
      sauvegarderConfig(prompt, bareme),
      sauvegarderConfigOrale(promptOral, supprimerAudio),
    ])
    setEnregistrement(false)
    if (r1.error || r2.error) {
      setMessage({ type: 'err', texte: r1.error ?? r2.error ?? 'Erreur' })
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

      {/* Section oral */}
      <hr className="border-stone-200" />
      <h3 className="text-sm font-medium text-stone-700">Évaluation orale</h3>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Variables disponibles :{' '}
        {['{{theme}}', '{{description_theme}}', '{{numero_semaine}}', '{{duree}}', '{{nb_mots}}', '{{debit}}', '{{transcription_orale}}', '{{dossier}}', '{{bareme}}'].map(v => (
          <code key={v} className="font-mono mr-1">{v}</code>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt d'évaluation orale</label>
          <button
            type="button"
            onClick={() => setPromptOral(promptOralDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={promptOral || promptOralDefaut}
          onChange={e => setPromptOral(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={supprimerAudio}
            onChange={e => setSupprimerAudio(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-stone-700">
            Supprimer automatiquement l'audio à la publication (case pré-cochée par défaut)
          </span>
        </label>
      </div>

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
