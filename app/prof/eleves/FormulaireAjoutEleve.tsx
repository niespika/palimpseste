'use client'

import { useState } from 'react'
import { creerEleve } from './actions'

export default function FormulaireAjoutEleve() {
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const resultat = await creerEleve(formData)
    if (resultat?.error) {
      setMessage({ type: 'erreur', texte: resultat.error })
    } else {
      setMessage({ type: 'ok', texte: 'Compte créé avec succès.' })
      ;(e.target as HTMLFormElement).reset()
    }
    setChargement(false)
  }

  return (
    <div className="mb-6">
      {!ouvert ? (
        <button
          onClick={() => setOuvert(true)}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition-colors"
        >
          + Ajouter un élève
        </button>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6">
          <h3 className="font-medium text-stone-900 mb-4">Nouveau compte élève</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Adresse courriel <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="prenom@exemple.fr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Mot de passe provisoire <span className="text-red-500">*</span>
              </label>
              <input
                name="motDePasse"
                type="text"
                required
                minLength={8}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="Au moins 8 caractères"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Prénom / pseudonyme <span className="text-red-500">*</span>
              </label>
              <input
                name="displayName"
                type="text"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="Ex. : Camille"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Classe
              </label>
              <input
                name="classe"
                type="text"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                placeholder="Ex. : Terminale HLP"
              />
            </div>

            {message && (
              <div className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${
                message.type === 'ok'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.texte}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={chargement}
                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
              >
                {chargement ? 'Création…' : 'Créer le compte'}
              </button>
              <button
                type="button"
                onClick={() => { setOuvert(false); setMessage(null) }}
                className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
