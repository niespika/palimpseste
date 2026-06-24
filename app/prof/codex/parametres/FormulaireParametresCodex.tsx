'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderPromptsCodex } from './actions'

interface Props {
  promptV1Initial: string
  promptVfInitial: string
  promptV1Defaut: string
  promptVfDefaut: string
  consigneV1Initial: string
  consigneVfInitial: string
  consigneV1Defaut: string
  consigneVfDefaut: string
}

const TEXTAREA = 'w-full px-3 py-2 border border-bordure rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

export default function FormulaireParametresCodex({
  promptV1Initial, promptVfInitial, promptV1Defaut, promptVfDefaut,
  consigneV1Initial, consigneVfInitial, consigneV1Defaut, consigneVfDefaut,
}: Props) {
  const router = useRouter()
  const [v1, setV1] = useState(promptV1Initial || promptV1Defaut)
  const [vf, setVf] = useState(promptVfInitial || promptVfDefaut)
  const [consigneV1, setConsigneV1] = useState(consigneV1Initial || consigneV1Defaut)
  const [consigneVf, setConsigneVf] = useState(consigneVfInitial || consigneVfDefaut)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderPromptsCodex(v1, vf, consigneV1, consigneVf)
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
      <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 text-sm text-attention">
        Prompts de génération des retours IA de Codex (consolidation). Distincts des prompts d&apos;évaluation des Fragments — pas de rubrique d&apos;axes ici.
      </div>

      {/* Consignes affichées à l'élève (bulles « comment faire », T6) */}
      <div className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-encre-douce">Consignes élève</h4>
          <p className="text-xs text-muet mt-0.5">Bulles d&apos;aide affichées à l&apos;élève au moment d&apos;écrire (V1) et de réécrire (V-finale).</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-encre-douce">Consigne V1 (avant d&apos;écrire)</label>
            <button type="button" onClick={() => setConsigneV1(consigneV1Defaut)} className="text-xs text-muet hover:text-encre-douce underline">Restaurer la version par défaut</button>
          </div>
          <textarea value={consigneV1} onChange={e => setConsigneV1(e.target.value)} rows={2} className={TEXTAREA} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-encre-douce">Consigne V-finale (avant de réécrire)</label>
            <button type="button" onClick={() => setConsigneVf(consigneVfDefaut)} className="text-xs text-muet hover:text-encre-douce underline">Restaurer la version par défaut</button>
          </div>
          <textarea value={consigneVf} onChange={e => setConsigneVf(e.target.value)} rows={2} className={TEXTAREA} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-encre-douce">Prompt du retour IA en V1 (suggestions)</label>
          <button type="button" onClick={() => setV1(promptV1Defaut)} className="text-xs text-muet hover:text-encre-douce underline">
            Restaurer la version par défaut
          </button>
        </div>
        <textarea value={v1} onChange={e => setV1(e.target.value)} rows={18} className={TEXTAREA} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-encre-douce">Prompt du retour IA en V-Finale</label>
          <button type="button" onClick={() => setVf(promptVfDefaut)} className="text-xs text-muet hover:text-encre-douce underline">
            Restaurer la version par défaut
          </button>
        </div>
        <textarea value={vf} onChange={e => setVf(e.target.value)} rows={18} className={TEXTAREA} />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-ok-teinte border border-ok text-ok' : 'bg-retard-teinte border border-retard text-retard'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-bouton text-surface px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les prompts'}
      </button>
    </div>
  )
}
