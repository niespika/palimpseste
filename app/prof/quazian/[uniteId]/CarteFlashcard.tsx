'use client'

import { useState } from 'react'
import { validerCarte, archiverCarte, modifierCarte, supprimerCarte } from '../actions'

const TYPE_OPTIONS = ['philosophe', 'concept', 'mouvement', 'these'] as const
const TYPE_LABELS: Record<string, string> = {
  philosophe: 'Philosophe',
  concept: 'Concept',
  mouvement: 'Mouvement',
  these: 'Thèse',
}
const TYPE_COULEURS: Record<string, string> = {
  philosophe: 'bg-info-teinte text-info border-info',
  concept: 'bg-pigment-teinte text-pigment border-pigment',
  mouvement: 'bg-ok-teinte text-ok border-ok',
  these: 'bg-attention-teinte text-attention border-attention',
}
const STATUT_COULEURS: Record<string, string> = {
  suggere: 'border-attention bg-attention-teinte/30',
  valide: 'border-bordure bg-surface',
  archive: 'border-bordure bg-parchemin-fonce opacity-60',
  a_verifier: 'border-retard bg-retard-teinte/30',
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

  async function handleSupprimer() {
    setPending(true)
    const fd = new FormData()
    fd.append('id', carte.id)
    fd.append('uniteId', uniteId)
    await supprimerCarte(fd)
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
                type === t ? TYPE_COULEURS[t] : 'bg-parchemin-fonce text-muet border-bordure'
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
            className="ml-auto px-2 py-0.5 text-xs border border-bordure rounded-lg w-32"
          />
        </div>
        <textarea
          value={recto}
          onChange={(e) => setRecto(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-bordure rounded-lg mb-2 resize-none"
          placeholder="Recto (question ou texte à trous)"
        />
        <textarea
          value={verso}
          onChange={(e) => setVerso(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm border border-bordure rounded-lg mb-3 resize-none"
          placeholder="Verso (réponse)"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSauvegarder}
            disabled={pending}
            className="px-3 py-1 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Sauvegarder
          </button>
          <button
            onClick={() => setMode('vue')}
            className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:opacity-90"
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
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${TYPE_COULEURS[carte.type] ?? 'bg-parchemin-fonce text-muet border-bordure'}`}>
          {TYPE_LABELS[carte.type] ?? carte.type}
        </span>
        {carte.concept_tag && (
          <span className="text-xs text-muet truncate">{carte.concept_tag}</span>
        )}
        <span className="ml-auto text-xs text-muet shrink-0">
          {carte.format === 'cloze' ? 'cloze' : 'Q→R'}
        </span>
      </div>

      <p className="text-sm text-encre font-medium mb-1">{carte.recto}</p>
      <p className="text-sm text-muet">{carte.verso}</p>

      <div className="flex gap-2 mt-3">
        {carte.statut === 'suggere' && (
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
          className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:opacity-90"
        >
          Modifier
        </button>
        {carte.statut !== 'archive' && (
          <button
            onClick={handleArchiver}
            disabled={pending}
            className="px-3 py-1 text-xs text-muet hover:text-encre-douce hover:bg-parchemin-fonce rounded-lg transition-colors"
          >
            Archiver
          </button>
        )}
        <button
          onClick={handleSupprimer}
          disabled={pending}
          className="px-3 py-1 text-xs text-retard hover:opacity-80 hover:bg-retard-teinte rounded-lg transition-colors ml-auto disabled:opacity-50"
        >
          Supprimer
        </button>
        {carte.source === 'ia' && (
          <span className="text-xs text-muet">IA</span>
        )}
      </div>
    </div>
  )
}
