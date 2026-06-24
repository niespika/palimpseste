'use client'

import { useState } from 'react'
import { login } from './actions'
import Pastille from '@/components/Pastille'

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
    <div data-module="palimpseste" className="min-h-screen flex items-center justify-center bg-parchemin px-4">
      <div className="bg-surface p-8 rounded-xl shadow-sm border border-bordure w-full max-w-md">
        <div className="mb-8 text-center flex flex-col items-center">
          <Pastille module="palimpseste" size={84} className="mb-4" />
          <h1 className="font-marque text-2xl font-semibold tracking-[0.12em] text-encre">PALIMPSESTE</h1>
          <p className="font-corps text-muet text-sm mt-1">Plateforme pédagogique</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block font-ui text-sm font-medium text-encre-douce mb-1.5">
              Adresse courriel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-bordure rounded-lg text-encre placeholder-muet/60 focus:outline-none focus:ring-2 focus:ring-pigment focus:border-transparent text-sm"
              placeholder="prenom.nom@exemple.fr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-ui text-sm font-medium text-encre-douce mb-1.5">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-bordure rounded-lg text-encre focus:outline-none focus:ring-2 focus:ring-pigment focus:border-transparent text-sm"
            />
          </div>

          {erreur && (
            <div className="bg-[var(--retard-teinte)] border border-retard/30 rounded-lg px-3 py-2.5">
              <p className="text-retard text-sm">{erreur}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-bouton text-surface py-2.5 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-ui text-sm font-semibold"
          >
            {chargement ? 'Connexion en cours…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
