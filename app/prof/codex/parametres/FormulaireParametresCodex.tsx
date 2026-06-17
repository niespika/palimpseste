'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderPromptsCodex } from './actions'

interface Props {
  promptV1Initial: string
  promptVfInitial: string
  promptV1Defaut: string
  promptVfDefaut: string
}

const TEXTAREA = 'w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900'

export default function FormulaireParametresCodex({ promptV1Initial, promptVfInitial, promptV1Defaut, promptVfDefaut }: Props) {
  const router = useRouter()
  const [v1, setV1] = useState(promptV1Initial || promptV1Defaut)
  const [vf, setVf] = useState(promptVfInitial || promptVfDefaut)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderPromptsCodex(v1, vf)
    setEnregistrement(false)
    if (res.error) setMessage({ type: 'err', texte: res.error })
    else {
      setMessage({ type: 'ok', texte: 'Prompts enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Prompts de génération des retours IA de Codex (consolidation). Distincts des prompts d&apos;évaluation des Fragments — pas de rubrique d&apos;axes ici.
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt du retour IA en V1 (suggestions)</label>
          <button type="button" onClick={() => setV1(promptV1Defaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">
            Restaurer la version par défaut
          </button>
        </div>
        <textarea value={v1} onChange={e => setV1(e.target.value)} rows={18} className={TEXTAREA} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt du retour IA en V-Finale</label>
          <button type="button" onClick={() => setVf(promptVfDefaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">
            Restaurer la version par défaut
          </button>
        </div>
        <textarea value={vf} onChange={e => setVf(e.target.value)} rows={18} className={TEXTAREA} />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les prompts'}
      </button>
    </div>
  )
}
