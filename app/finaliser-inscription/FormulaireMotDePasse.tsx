'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirMotDePasse } from './actions'

export default function FormulaireMotDePasse({ email }: { email: string }) {
  const router = useRouter()
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    const mdp = fd.get('motDePasse') as string
    const confirme = fd.get('confirmer') as string
    if (mdp !== confirme) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setChargement(true)
    const r = await definirMotDePasse(fd)
    if (r?.error) {
      setErreur(r.error)
      setChargement(false)
    } else {
      router.replace('/eleve')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {email && (
        <p className="font-corps text-sm text-muet text-center -mt-2">
          Compte : <span className="text-encre-douce">{email}</span>
        </p>
      )}

      <div>
        <label htmlFor="motDePasse" className="block font-ui text-sm font-medium text-encre-douce mb-1.5">
          Nouveau mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          required
          minLength={8}
          maxLength={64}
          autoComplete="new-password"
          className="w-full px-3 py-2.5 border border-bordure rounded-lg text-encre focus:outline-none focus:ring-2 focus:ring-pigment focus:border-transparent text-sm"
          placeholder="Au moins 8 caractères"
        />
      </div>

      <div>
        <label htmlFor="confirmer" className="block font-ui text-sm font-medium text-encre-douce mb-1.5">
          Confirme le mot de passe
        </label>
        <input
          id="confirmer"
          name="confirmer"
          type="password"
          required
          minLength={8}
          maxLength={64}
          autoComplete="new-password"
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
        {chargement ? 'Validation…' : 'Valider et accéder à Palimpseste'}
      </button>
    </form>
  )
}
