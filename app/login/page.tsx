'use client'

import { useState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreur(null)
    const formData = new FormData(e.currentTarget)
    const resultat = await login(formData)
    if (resultat?.error) {
      setErreur(resultat.error)
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-serif text-stone-900 mb-1">Palimpseste</h1>
          <p className="text-stone-500 text-sm">Plateforme pédagogique</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
              Adresse courriel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm"
              placeholder="prenom.nom@exemple.fr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent text-sm"
            />
          </div>

          {erreur && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <p className="text-red-700 text-sm">{erreur}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-stone-800 text-white py-2.5 px-4 rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {chargement ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
