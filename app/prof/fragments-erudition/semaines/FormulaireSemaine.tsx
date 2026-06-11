'use client'

import { useState } from 'react'
import { creerSemaine } from '../actions'

export default function FormulaireSemaine() {
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const resultat = await creerSemaine(formData)
    if (resultat?.error) {
      setMessage({ type: 'erreur', texte: resultat.error })
    } else {
      setMessage({ type: 'ok', texte: 'Semaine créée.' })
      ;(e.target as HTMLFormElement).reset()
      setOuvert(false)
    }
    setChargement(false)
  }

  // Date du jour pour les valeurs par défaut
  const aujourd_hui = new Date().toISOString().split('T')[0]
  const dimanche = new Date()
  dimanche.setDate(dimanche.getDate() + (7 - dimanche.getDay()))
  const dimancheStr = dimanche.toISOString().slice(0, 16)

  return (
    <div>
      {!ouvert ? (
        <button
          onClick={() => setOuvert(true)}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition-colors"
        >
          + Nouvelle semaine
        </button>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-medium text-stone-900 mb-4">Nouvelle semaine</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Titre <span className="text-stone-400 font-normal">(optionnel)</span>
              </label>
              <input
                name="titre"
                type="text"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
                placeholder="Ex. : Semaine du 14 septembre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                name="dateDebut"
                type="date"
                required
                defaultValue={aujourd_hui}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Date et heure limite <span className="text-red-500">*</span>
              </label>
              <input
                name="dateLimite"
                type="datetime-local"
                required
                defaultValue={dimancheStr}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
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
                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
              >
                {chargement ? 'Création…' : 'Créer la semaine'}
              </button>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:bg-stone-100"
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
