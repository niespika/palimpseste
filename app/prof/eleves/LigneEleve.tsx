'use client'

import { useState } from 'react'
import { modifierEleve, reinitialiserMotDePasse, supprimerEleve } from './actions'
import type { EleveAvecEmail } from '@/types'

export default function LigneEleve({ eleve }: { eleve: EleveAvecEmail }) {
  const [modeEdition, setModeEdition] = useState(false)
  const [modeReset, setModeReset] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleModifier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('id', eleve.id)
    const resultat = await modifierEleve(formData)
    if (resultat?.error) setMessage(resultat.error)
    else { setModeEdition(false); setMessage(null) }
    setChargement(false)
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('id', eleve.id)
    const resultat = await reinitialiserMotDePasse(formData)
    if (resultat?.error) setMessage(resultat.error)
    else { setModeReset(false); setMessage('Mot de passe réinitialisé.') }
    setChargement(false)
  }

  async function handleSupprimer() {
    if (!confirm(`Supprimer le compte de ${eleve.display_name} ? Cette action est irréversible.`)) return
    setChargement(true)
    const formData = new FormData()
    formData.append('id', eleve.id)
    const resultat = await supprimerEleve(formData)
    if (resultat?.error) { setMessage(resultat.error); setChargement(false) }
  }

  const modulesNoms = eleve.modules_assignes
    .map(a => a.modules?.nom)
    .filter(Boolean)
    .join(', ')

  if (modeEdition) {
    return (
      <tr className="bg-stone-50">
        <td colSpan={5} className="px-4 py-3">
          <form onSubmit={handleModifier} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Prénom / pseudonyme</label>
              <input
                name="displayName"
                defaultValue={eleve.display_name}
                required
                className="px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Classe</label>
              <input
                name="classe"
                defaultValue={eleve.classe ?? ''}
                className="px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="Ex. : Terminale HLP"
              />
            </div>
            {message && <p className="text-red-600 text-sm">{message}</p>}
            <button
              type="submit"
              disabled={chargement}
              className="bg-stone-800 text-white px-3 py-1.5 rounded text-sm hover:bg-stone-700 disabled:opacity-50"
            >
              {chargement ? '…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setModeEdition(false)}
              className="px-3 py-1.5 rounded text-sm text-stone-600 hover:bg-stone-200"
            >
              Annuler
            </button>
          </form>
        </td>
      </tr>
    )
  }

  if (modeReset) {
    return (
      <tr className="bg-stone-50">
        <td colSpan={5} className="px-4 py-3">
          <form onSubmit={handleReset} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-stone-500 mb-1">
                Nouveau mot de passe pour {eleve.display_name}
              </label>
              <input
                name="nouveauMotDePasse"
                type="text"
                required
                minLength={8}
                className="px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="Au moins 8 caractères"
              />
            </div>
            {message && <p className="text-red-600 text-sm">{message}</p>}
            <button
              type="submit"
              disabled={chargement}
              className="bg-stone-800 text-white px-3 py-1.5 rounded text-sm hover:bg-stone-700 disabled:opacity-50"
            >
              {chargement ? '…' : 'Réinitialiser'}
            </button>
            <button
              type="button"
              onClick={() => setModeReset(false)}
              className="px-3 py-1.5 rounded text-sm text-stone-600 hover:bg-stone-200"
            >
              Annuler
            </button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-stone-100 hover:bg-stone-50">
      <td className="px-4 py-3 text-sm text-stone-900 font-medium">{eleve.display_name}</td>
      <td className="px-4 py-3 text-sm text-stone-600">{eleve.classe ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-stone-600">{eleve.email}</td>
      <td className="px-4 py-3 text-sm text-stone-500">{modulesNoms || '—'}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setModeEdition(true)}
            className="text-stone-600 hover:text-stone-900 text-xs px-2 py-1 rounded hover:bg-stone-200"
          >
            Modifier
          </button>
          <button
            onClick={() => setModeReset(true)}
            className="text-stone-600 hover:text-stone-900 text-xs px-2 py-1 rounded hover:bg-stone-200"
          >
            Mot de passe
          </button>
          <button
            onClick={handleSupprimer}
            disabled={chargement}
            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
        {message && <p className="text-green-600 text-xs mt-1">{message}</p>}
      </td>
    </tr>
  )
}
