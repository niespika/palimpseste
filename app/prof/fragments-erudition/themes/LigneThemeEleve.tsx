'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderTheme } from '../actions'
import { toggleEssaiActif } from '../essai-actions'

export interface ThemeEleve {
  theme: string | null
  description: string | null
  essai_actif: boolean | null
}

interface Props {
  inscriptionId: string
  semestreId: string
  theme: ThemeEleve | null
}

// Ligne de thème « déroulante » : le prof voit le thème de l'élève (champ
// unique — le thème EST sa question d'essai) et l'édite à la demande. Le badge
// « essai » active/désactive l'essai final pour cet élève sur ce semestre.
export default function LigneThemeEleve({ inscriptionId, semestreId, theme }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [essaiActif, setEssaiActif] = useState<boolean>(!!theme?.essai_actif)
  const [chargementEssai, setChargementEssai] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('inscriptionId', inscriptionId)
    formData.append('semestreId', semestreId)
    const resultat = await sauvegarderTheme(formData)
    setChargement(false)
    if (resultat.success) {
      setEdition(false)
      setMessage('Enregistré.')
      setTimeout(() => setMessage(null), 2000)
      router.refresh()
    }
  }

  async function handleToggleEssai() {
    setChargementEssai(true)
    const nouvel = !essaiActif
    await toggleEssaiActif(inscriptionId, semestreId, nouvel)
    setEssaiActif(nouvel)
    setChargementEssai(false)
    router.refresh()
  }

  if (edition) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2 mt-1">
        <input
          name="theme"
          required
          defaultValue={theme?.theme ?? ''}
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          placeholder="Thème / question travaillée — ex. : La piraterie dans l'océan Indien"
        />
        <textarea
          name="description"
          defaultValue={theme?.description ?? ''}
          rows={2}
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-none text-encre"
          placeholder="Cadrage du thème (optionnel)"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={chargement}
            className="bg-bouton text-surface px-3 py-1 rounded text-sm hover:opacity-90 disabled:opacity-50"
          >
            {chargement ? '…' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => setEdition(false)}
            className="px-3 py-1 rounded text-sm text-encre-douce hover:bg-parchemin-fonce"
          >
            Annuler
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1 min-w-0">
        {theme?.theme ? (
          <>
            <p className="text-sm text-encre">{theme.theme}</p>
            {theme.description && <p className="text-xs text-muet mt-0.5">{theme.description}</p>}
          </>
        ) : (
          <p className="text-sm text-muet italic">Thème non défini</p>
        )}
        {message && <p className="text-xs text-ok mt-0.5">{message}</p>}
      </div>
      <button
        onClick={handleToggleEssai}
        disabled={chargementEssai}
        title="Activer l'essai final pour cet élève"
        className={`text-xs px-2 py-1 rounded-full font-medium transition-colors flex-shrink-0 ${
          essaiActif
            ? 'bg-ok-teinte text-ok hover:opacity-90'
            : 'bg-parchemin-fonce text-muet hover:opacity-90'
        }`}
      >
        {chargementEssai ? '…' : essaiActif ? 'Essai actif' : 'Essai'}
      </button>
      <button
        onClick={() => setEdition(true)}
        className="text-xs text-muet hover:text-encre px-2 py-1 rounded hover:bg-parchemin-fonce flex-shrink-0"
      >
        {theme?.theme ? 'Modifier' : 'Définir'}
      </button>
    </div>
  )
}
