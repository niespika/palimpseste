'use client'

import { useState } from 'react'
import { sauvegarderTheme } from '../actions'
import type { Profile } from '@/types'
import type { FragmentTheme } from '@/types/fragments'

interface Props {
  eleve: Profile
  theme: FragmentTheme | null
}

export default function LigneTheme({ eleve, theme }: Props) {
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('eleveId', eleve.id)
    const resultat = await sauvegarderTheme(formData)
    if (resultat.success) {
      setEdition(false)
      setMessage('Enregistré.')
      setTimeout(() => setMessage(null), 2000)
    }
    setChargement(false)
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
              className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
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
              {theme ? (
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
              {theme ? 'Modifier' : 'Définir'}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
