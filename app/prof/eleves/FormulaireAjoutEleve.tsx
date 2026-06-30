'use client'

import { useState } from 'react'
import { creerEleve, creerEleveEtInviter } from './actions'
import { genererMotDePasse } from '@/utils/password'

type Mode = 'invitation' | 'manuel'

export default function FormulaireAjoutEleve() {
  const [ouvert, setOuvert] = useState(false)
  const [mode, setMode] = useState<Mode>('invitation')
  const [chargement, setChargement] = useState(false)
  const [mdp, setMdp] = useState('')
  const [message, setMessage] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const prenom = ((formData.get('prenom') as string) ?? '').trim()
    const nom = ((formData.get('nom') as string) ?? '').trim()
    const email = ((formData.get('email') as string) ?? '').trim()
    const displayName = [prenom, nom].filter(Boolean).join(' ')
    if (!displayName) {
      setMessage({ type: 'erreur', texte: 'Indique au moins un prénom ou un nom.' })
      setChargement(false)
      return
    }
    formData.set('displayName', displayName)

    const resultat = mode === 'invitation'
      ? await creerEleveEtInviter(formData)
      : await creerEleve(formData)

    if (resultat?.error) {
      setMessage({ type: 'erreur', texte: resultat.error })
      setChargement(false)
      return
    }

    // Compte créé mais courriel non parti (mode test Resend, config, etc.).
    const avertissement = (resultat as { avertissement?: string }).avertissement
    if (mode === 'invitation' && avertissement) {
      setMessage({ type: 'erreur', texte: avertissement })
    } else {
      setMessage({
        type: 'ok',
        texte: mode === 'invitation'
          ? `Invitation envoyée à ${email}.`
          : `Compte créé pour ${displayName}.`,
      })
    }
    ;(e.target as HTMLFormElement).reset()
    setMdp('')
    setChargement(false)
  }

  const ongletActif = 'bg-bouton text-surface'
  const ongletInactif = 'bg-surface text-encre-douce border border-bordure hover:bg-parchemin-fonce'

  return (
    <div className={ouvert ? 'w-full' : ''}>
      {!ouvert ? (
        <button
          onClick={() => setOuvert(true)}
          className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-colors"
        >
          + Ajouter un élève
        </button>
      ) : (
        <div className="bg-surface border border-bordure rounded-xl p-6">
          <h3 className="font-medium text-encre mb-4">Nouveau compte élève</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Choix du mode d'activation */}
            <div className="sm:col-span-2">
              <div className="inline-flex rounded-lg overflow-hidden gap-2">
                <button
                  type="button"
                  onClick={() => setMode('invitation')}
                  className={`font-ui text-sm px-3 py-1.5 rounded-lg transition-colors ${mode === 'invitation' ? ongletActif : ongletInactif}`}
                >
                  Inviter par courriel
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manuel')}
                  className={`font-ui text-sm px-3 py-1.5 rounded-lg transition-colors ${mode === 'manuel' ? ongletActif : ongletInactif}`}
                >
                  Définir un mot de passe
                </button>
              </div>
              <p className="text-xs text-muet mt-1.5">
                {mode === 'invitation'
                  ? "L'élève reçoit un courriel et choisit lui-même son mot de passe."
                  : 'Tu définis le mot de passe et le communiques toi-même à l’élève (sans courriel).'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-encre-douce mb-1">
                Prénom <span className="text-retard">*</span>
              </label>
              <input
                name="prenom"
                type="text"
                className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
                placeholder="Ex. : Camille"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-encre-douce mb-1">
                Nom
              </label>
              <input
                name="nom"
                type="text"
                className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
                placeholder="Ex. : Dupont"
              />
            </div>
            <div className={mode === 'manuel' ? '' : 'sm:col-span-2'}>
              <label className="block text-sm font-medium text-encre-douce mb-1">
                Adresse courriel <span className="text-retard">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
                placeholder="prenom@exemple.fr"
              />
            </div>
            {mode === 'manuel' && (
              <div>
                <label className="block text-sm font-medium text-encre-douce mb-1">
                  Mot de passe provisoire <span className="text-retard">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    name="motDePasse"
                    type="text"
                    required
                    minLength={8}
                    value={mdp}
                    onChange={(e) => setMdp(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
                    placeholder="Au moins 8 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setMdp(genererMotDePasse())}
                    className="shrink-0 font-ui text-sm text-encre border border-bordure rounded-lg px-3 py-2 bg-surface hover:bg-parchemin-fonce transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
                  >
                    Générer
                  </button>
                </div>
              </div>
            )}
            <p className="sm:col-span-2 text-xs text-muet -mt-1">
              Tu inscriras l&apos;élève dans une ou plusieurs classes depuis le tableau (colonne Classes) ou l&apos;onglet Classes.
            </p>

            {message && (
              <div className={`sm:col-span-2 rounded-lg px-3 py-2 text-sm ${
                message.type === 'ok'
                  ? 'bg-ok-teinte border border-ok text-ok'
                  : 'bg-retard-teinte border border-retard text-retard'
              }`}>
                {message.texte}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={chargement}
                className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {chargement ? 'Création…' : (mode === 'invitation' ? 'Créer et inviter' : 'Créer le compte')}
              </button>
              <button
                type="button"
                onClick={() => { setOuvert(false); setMessage(null) }}
                className="px-4 py-2 rounded-lg text-sm text-encre-douce hover:bg-parchemin-fonce transition-colors"
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
