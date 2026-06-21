'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderPromptsAletheia } from './actions'

interface Props {
  promptFeedback1Initial: string
  promptFeedback1Defaut: string
}

const TEXTAREA = 'w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900'

export default function FormulaireParametresAletheia({ promptFeedback1Initial, promptFeedback1Defaut }: Props) {
  const router = useRouter()
  const [p1, setP1] = useState(promptFeedback1Initial || promptFeedback1Defaut)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderPromptsAletheia(p1)
    setEnregistrement(false)
    if (res.error) setMessage({ type: 'err', texte: res.error })
    else {
      setMessage({ type: 'ok', texte: 'Prompt enregistré.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Prompt du <strong>retour 1 (socratique)</strong> d&apos;Aletheia. Variables disponibles :
        <code className="mx-1">{'{texte_unite}'}</code>,
        <code className="mx-1">{'{resume_eleve}'}</code>,
        <code className="mx-1">{'{questions_eleve}'}</code>,
        <code className="mx-1">{'{syntheses_precedentes}'}</code>. La sortie doit rester un JSON
        <code className="mx-1">{'{ questions_pour_avancer, reponses_a_tes_questions, remarque_questions }'}</code>.
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Retour 1 — socratique (par semaine)</label>
          <button type="button" onClick={() => setP1(promptFeedback1Defaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">
            Restaurer la version par défaut
          </button>
        </div>
        <textarea value={p1} onChange={e => setP1(e.target.value)} rows={22} className={TEXTAREA} />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer le prompt'}
      </button>
    </div>
  )
}
