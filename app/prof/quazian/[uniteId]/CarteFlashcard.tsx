'use client'

import { useState } from 'react'
import { validerCarte, archiverCarte, modifierCarte } from '../actions'

const TYPE_OPTIONS = ['philosophe', 'concept', 'mouvement', 'these'] as const
const TYPE_LABELS: Record<string, string> = {
  philosophe: 'Philosophe',
  concept: 'Concept',
  mouvement: 'Mouvement',
  these: 'Thèse',
}
const TYPE_COULEURS: Record<string, string> = {
  philosophe: 'bg-blue-50 text-blue-700 border-blue-200',
  concept: 'bg-violet-50 text-violet-700 border-violet-200',
  mouvement: 'bg-teal-50 text-teal-700 border-teal-200',
  these: 'bg-amber-50 text-amber-700 border-amber-200',
}
const STATUT_COULEURS: Record<string, string> = {
  suggere: 'border-amber-300 bg-amber-50/30',
  valide: 'border-stone-200 bg-white',
  archive: 'border-stone-100 bg-stone-50 opacity-60',
  a_verifier: 'border-red-300 bg-red-50/30',
}

interface Carte {
  id: string
  type: string
  format: string
  recto: string
  verso: string
  concept_tag: string
  statut: string
  source: string
  unite_id: string
}

export function CarteFlashcard({ carte, uniteId }: { carte: Carte; uniteId: string }) {
  const [mode, setMode] = useState<'vue' | 'edit'>('vue')
  const [recto, setRecto] = useState(carte.recto)
  const [verso, setVerso] = useState(carte.verso)
  const [type, setType] = useState(carte.type)
  const [tag, setTag] = useState(carte.concept_tag)
  const [pending, setPending] = useState(false)

  async function handleValider() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', carte.id)
    fd.append('uniteId', uniteId)
    await validerCarte(fd)
    setPending(false)
  }

  async function handleArchiver() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', carte.id)
    fd.append('uniteId', uniteId)
    await archiverCarte(fd)
    setPending(false)
  }

  async function handleSauvegarder() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', carte.id)
    fd.append('uniteId', uniteId)
    fd.append('recto', recto)
    fd.append('verso', verso)
    fd.append('type', type)
    fd.append('concept_tag', tag)
    await modifierCarte(fd)
    setMode('vue')
    setPending(false)
  }

  const couleurBordure = STATUT_COULEURS[carte.statut] ?? STATUT_COULEURS.valide

  if (mode === 'edit') {
    return (
      <div className={`border rounded-xl p-4 ${couleurBordure}`}>
        <div className="flex gap-2 mb-3 flex-wrap">
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                type === t ? TYPE_COULEURS[t] : 'bg-stone-50 text-stone-400 border-stone-200'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="concept_tag"
            className="ml-auto px-2 py-0.5 text-xs border border-stone-200 rounded-lg w-32"
          />
        </div>
        <textarea
          value={recto}
          onChange={(e) => setRecto(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg mb-2 resize-none"
          placeholder="Recto (question ou texte à trous)"
        />
        <textarea
          value={verso}
          onChange={(e) => setVerso(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg mb-3 resize-none"
          placeholder="Verso (réponse)"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSauvegarder}
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
    <div className={`border rounded-xl p-4 ${couleurBordure}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${TYPE_COULEURS[carte.type] ?? 'bg-stone-100 text-stone-500 border-stone-200'}`}>
          {TYPE_LABELS[carte.type] ?? carte.type}
        </span>
        {carte.concept_tag && (
          <span className="text-xs text-stone-400 truncate">{carte.concept_tag}</span>
        )}
        <span className="ml-auto text-xs text-stone-300 shrink-0">
          {carte.format === 'cloze' ? 'cloze' : 'Q→R'}
        </span>
      </div>

      <p className="text-sm text-stone-900 font-medium mb-1">{carte.recto}</p>
      <p className="text-sm text-stone-500">{carte.verso}</p>

      <div className="flex gap-2 mt-3">
        {carte.statut === 'suggere' && (
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
        {carte.statut !== 'archive' && (
          <button
            onClick={handleArchiver}
            disabled={pending}
            className="px-3 py-1 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg transition-colors"
          >
            Archiver
          </button>
        )}
        {carte.source === 'ia' && (
          <span className="ml-auto text-xs text-stone-300">IA</span>
        )}
      </div>
    </div>
  )
}
