'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BlocPrompt from '@/components/BlocPrompt'
import { sauvegarderReglagesRag } from './actions'

// Réglages du Scriptorium ÉLÈVE (RAG L5, SPEC §8.3) : gate global, modèles par
// simple réglage (bascule Anthropic ↔ Gemini sans redéploiement), quota souple,
// overrides des prompts (chat + synthèse hebdo). Un prompt identique au défaut
// (ou vide) est enregistré comme « défaut » (null) et suivra ses évolutions.

export default function FormulaireReglagesRag({
  initial, defauts,
}: {
  initial: {
    actif: boolean
    modele: string
    modeleSynthese: string
    quotaJour: number
    prompt: string | null
    promptSynthese: string | null
  }
  defauts: { prompt: string; promptSynthese: string }
}) {
  const router = useRouter()
  const [actif, setActif] = useState(initial.actif)
  const [modele, setModele] = useState(initial.modele)
  const [modeleSynthese, setModeleSynthese] = useState(initial.modeleSynthese)
  const [quota, setQuota] = useState(String(initial.quotaJour))
  const [prompt, setPrompt] = useState(initial.prompt || defauts.prompt)
  const [promptSynthese, setPromptSynthese] = useState(initial.promptSynthese || defauts.promptSynthese)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderReglagesRag({
      actif,
      modele,
      modeleSynthese,
      quotaJour: Number(quota),
      prompt: prompt.trim() === defauts.prompt.trim() ? null : prompt,
      promptSynthese: promptSynthese.trim() === defauts.promptSynthese.trim() ? null : promptSynthese,
    })
    setEnregistrement(false)
    if (res.error) setMessage({ type: 'err', texte: res.error })
    else {
      setMessage({ type: 'ok', texte: 'Réglages enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h3 className="font-titre text-lg text-encre">Scriptorium élève (tuteur du cours)</h3>

      <label className="flex items-center gap-3 bg-surface border border-bordure rounded-xl px-4 py-3">
        <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} className="w-4 h-4 accent-pigment" />
        <span className="text-sm text-encre">
          <b>Activer l’espace élève</b> — la tuile Scriptorium apparaît côté élève et le chat répond.
          <span className="block text-xs text-muet mt-0.5">Décision après calibration (SPEC §11) : ne l’active qu’après un run sans fuite de sentinelle.</span>
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-muet">Modèle du chat</span>
          <input value={modele} onChange={e => setModele(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
          <span className="text-[11px] text-muet">claude-… ou gemini-… (Gemini exige GEMINI_API_KEY)</span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muet">Modèle de la synthèse hebdo</span>
          <input value={modeleSynthese} onChange={e => setModeleSynthese(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muet">Quota (messages / élève / jour)</span>
          <input type="number" min={1} max={500} value={quota} onChange={e => setQuota(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
        </label>
      </div>

      <BlocPrompt
        label="Prompt du tuteur (chat élève)" value={prompt} onChange={setPrompt} defaut={defauts.prompt} rows={18}
        hint={<>Variable : <code>{'{registre}'}</code> (le REGISTRE transversal partagé avec Aletheia). Le corpus (plan, matière, livres) est ajouté automatiquement après ces instructions.</>}
      />

      <BlocPrompt
        label="Prompt de la synthèse hebdomadaire (prof)" value={promptSynthese} onChange={setPromptSynthese} defaut={defauts.promptSynthese} rows={14}
        hint={<>Variable : <code>{'{transcripts_semaine}'}</code>. Sortie JSON (thèmes anonymes chiffrés, petits malins nominatifs, observation). Génération : cron du lundi (lot L7).</>}
      />

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-ok-teinte border border-ok text-ok' : 'bg-retard-teinte border border-retard text-retard'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-bouton text-surface px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les réglages'}
      </button>
    </div>
  )
}
