'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderTheme } from '../actions'
import { toggleEssaiActif, sauvegarderQuestion } from '../essai-actions'
import type { Profile } from '@/types'
import type { FragmentTheme } from '@/types/fragments'

interface Props {
  eleve: Profile
  inscriptionId: string
  theme: FragmentTheme | null
}

export default function LigneTheme({ eleve, inscriptionId, theme }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [essaiActif, setEssaiActif] = useState<boolean>(!!(theme as unknown as { essai_actif?: boolean })?.essai_actif)
  const [question, setQuestion] = useState<string>((theme as unknown as { question?: string | null })?.question ?? '')
  const [editionQuestion, setEditionQuestion] = useState(false)
  const [chargementEssai, setChargementEssai] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('inscriptionId', inscriptionId)
    const resultat = await sauvegarderTheme(formData)
    if (resultat.success) {
      setEdition(false)
      setMessage('Enregistré.')
      setTimeout(() => setMessage(null), 2000)
    }
    setChargement(false)
  }

  async function handleToggleEssai() {
    setChargementEssai(true)
    const nouvelEtat = !essaiActif
    await toggleEssaiActif(inscriptionId, nouvelEtat)
    setEssaiActif(nouvelEtat)
    setChargementEssai(false)
  }

  async function handleSauvegarderQuestion() {
    setChargementEssai(true)
    await sauvegarderQuestion(inscriptionId, question)
    setEditionQuestion(false)
    setChargementEssai(false)
    router.refresh()
  }

  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50">
      <td className="px-4 py-3 text-sm font-medium text-stone-900">
        {eleve.display_name}
        {eleve.classe && <span className="text-stone-400 ml-2 font-normal text-xs">{eleve.classe}</span>}
      </td>
      <td className="px-4 py-3">
        {edition ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              name="theme"
              required
              defaultValue={theme?.theme ?? ''}
              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
              placeholder="Ex. : La piraterie dans l'océan Indien"
            />
            <textarea
              name="description"
              defaultValue={theme?.description ?? ''}
              rows={2}
              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
              placeholder="Cadrage du thème (optionnel)"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={chargement}
                className="bg-stone-800 text-white px-3 py-1 rounded text-sm hover:bg-stone-700 disabled:opacity-50"
              >
                {chargement ? '…' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={() => setEdition(false)}
                className="px-3 py-1 rounded text-sm text-stone-600 hover:bg-stone-200"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {theme?.theme ? (
                <>
                  <p className="text-sm text-stone-800">{theme.theme}</p>
                  {theme.description && (
                    <p className="text-xs text-stone-400 mt-0.5">{theme.description}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-stone-400 italic">Non défini</p>
              )}
              {message && <p className="text-xs text-green-600 mt-0.5">{message}</p>}
            </div>
            <button
              onClick={() => setEdition(true)}
              className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded hover:bg-stone-200 flex-shrink-0"
            >
              {theme?.theme ? 'Modifier' : 'Définir'}
            </button>
          </div>
        )}
      </td>

      {/* Essai actif */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={handleToggleEssai}
          disabled={chargementEssai}
          className={`text-xs px-2 py-1 rounded-full font-medium transition-colors ${
            essaiActif
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          {chargementEssai ? '…' : essaiActif ? 'Actif' : 'Non'}
        </button>
      </td>

      {/* Question d'essai */}
      <td className="px-4 py-3">
        {editionQuestion ? (
          <div className="flex gap-2 items-start">
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={2}
              className="flex-1 px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-stone-900"
              placeholder="Question posée à cet élève"
            />
            <div className="flex flex-col gap-1">
              <button
                onClick={handleSauvegarderQuestion}
                disabled={chargementEssai}
                className="bg-stone-800 text-white px-2 py-1 rounded text-xs hover:bg-stone-700 disabled:opacity-50"
              >
                {chargementEssai ? '…' : 'OK'}
              </button>
              <button
                onClick={() => setEditionQuestion(false)}
                className="text-xs text-stone-500 hover:text-stone-700"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm text-stone-600 italic">{question || '—'}</p>
            <button
              onClick={() => setEditionQuestion(true)}
              className="text-xs text-stone-400 hover:text-stone-700 flex-shrink-0"
            >
              {question ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
