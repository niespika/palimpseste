'use client'
// ============================================================================
// C8 · FRAGMENTS — L'ÉLÈVE ÉCRIT SON THÈME ; le professeur le relit et le valide.
// ----------------------------------------------------------------------------
// Demande de Louis (02/09). L'état se lit par `statutDuTheme` (règle pure),
// l'écriture passe par `proposerTheme` (action serveur, inscription vérifiée).
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { proposerTheme } from './actions'
import { libelleEleve, type StatutDuTheme } from '@/utils/fragments-theme'

interface Props {
  inscriptionId: string
  semestreId: string | null
  theme: string | null
  description: string | null
  statut: StatutDuTheme
}

export default function ThemeEleve({ inscriptionId, semestreId, theme, description, statut }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(statut === 'vide')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!semestreId) { setErreur('Aucun semestre en cours.'); return }
    setChargement(true); setErreur(null)
    const fd = new FormData(e.currentTarget)
    fd.append('inscriptionId', inscriptionId)
    fd.append('semestreId', semestreId)
    const r = await proposerTheme(fd)
    setChargement(false)
    if ('error' in r && r.error) { setErreur(r.error); return }
    setEdition(false)
    router.refresh()
  }

  const couleur = statut === 'a_valider' ? 'text-attention' : statut === 'valide' ? 'text-ok' : 'text-muet'

  if (edition) {
    return (
      <form onSubmit={handleSubmit} className="bg-parchemin-fonce rounded-xl px-4 py-3 space-y-2 border border-bordure">
        <p className="text-xs text-muet">Ton thème</p>
        <p className="text-sm text-encre-douce">{libelleEleve('vide')}</p>
        <input
          name="theme" required maxLength={300} defaultValue={theme ?? ''}
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre bg-surface"
          placeholder="Ex. : La piraterie dans l’océan Indien au XVIIIe siècle"
        />
        <textarea
          name="description" rows={2} maxLength={1000} defaultValue={description ?? ''}
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-none text-encre bg-surface"
          placeholder="En deux lignes : pourquoi ce thème, et par où tu comptes commencer (optionnel)"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" disabled={chargement}
            className="bg-bouton text-surface px-3 py-1 rounded text-sm hover:opacity-90 disabled:opacity-50">
            {chargement ? '…' : theme ? 'Proposer ce nouveau thème' : 'Proposer ce thème'}
          </button>
          {statut !== 'vide' && (
            <button type="button" onClick={() => setEdition(false)}
              className="px-3 py-1 rounded text-sm text-encre-douce hover:bg-parchemin">Annuler</button>
          )}
          {erreur && <span className="text-sm text-retard">{erreur}</span>}
        </div>
      </form>
    )
  }

  return (
    <div className="bg-parchemin-fonce rounded-xl px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muet mb-0.5">Ton thème</p>
          <p className="font-medium text-encre">{theme}</p>
          {description && <p className="text-sm text-muet mt-1">{description}</p>}
          <p className={`text-xs mt-1 ${couleur}`}>{libelleEleve(statut)}</p>
        </div>
        <button type="button" onClick={() => setEdition(true)}
          className="text-xs text-muet hover:text-encre px-2 py-1 rounded hover:bg-parchemin flex-shrink-0">
          Modifier
        </button>
      </div>
    </div>
  )
}
