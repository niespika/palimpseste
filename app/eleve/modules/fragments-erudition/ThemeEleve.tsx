'use client'
// ============================================================================
// C8 · FRAGMENTS — L'ÉLÈVE ÉCRIT SON THÈME ; le professeur le relit et le valide.
// ----------------------------------------------------------------------------
// Demande de Louis (02/09). L'état se lit par `statutDuTheme` (règle pure),
// l'écriture passe par `proposerTheme` (action serveur, inscription vérifiée).
// Le soir même : le professeur peut aussi COMMENTER (« ni valider, ni
// modifier ») — le commentaire arrive ici, sous le thème, et dans le « à faire »
// du tableau de bord ; il ne se montre que tant qu'il attend une réponse.
//
// 03/09 — handoff `design_handoff_fragments_eleve` (A·1) : LE THÈME EST LE TITRE
// DE LA PAGE (Cormorant), avec son état en dessous — l'identité du monde, elle,
// est portée par la Barre 2 (convention des modules). Mesuré : 48 à 63 car. en
// base, plafond 300. Sans thème : « Ton thème sera défini avec ton professeur »
// (état limite H), et le formulaire s'ouvre de lui-même.
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
  /** Le commentaire du professeur, seulement s'il attend une réponse (statut `commente`). */
  commentaire?: string | null
}

function Commentaire({ texte }: { texte: string }) {
  return (
    <div className="bg-attention-teinte border-l-4 border-attention rounded-r-xl px-4 py-3">
      <p className="font-ui text-xs text-attention font-medium mb-0.5">Commentaire de ton professeur</p>
      <p className="font-corps text-sm text-encre whitespace-pre-line">{texte}</p>
    </div>
  )
}

export default function ThemeEleve({ inscriptionId, semestreId, theme, description, statut, commentaire = null }: Props) {
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

  const couleur = statut === 'a_valider' || statut === 'commente' ? 'text-attention' : statut === 'valide' ? 'text-ok' : 'text-muet'

  return (
    // `scroll-mt` : la carte « à faire maintenant » y mène par l'ancre #theme.
    <div id="theme" className="scroll-mt-24 space-y-3">
      <div className="min-w-0">
        <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet">Ton thème du semestre</p>
        <h2 className={`font-titre text-2xl sm:text-3xl leading-tight mt-0.5 ${theme ? 'text-encre' : 'text-muet italic'}`}>
          {theme ?? 'Ton thème sera défini avec ton professeur.'}
        </h2>
        {statut !== 'vide' && (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mt-1">
            <span className={`font-corps text-sm ${couleur}`}>{libelleEleve(statut)}</span>
            {!edition && (
              <button type="button" onClick={() => setEdition(true)}
                className="font-ui text-xs text-muet hover:text-encre underline underline-offset-2">
                Modifier
              </button>
            )}
          </p>
        )}
        {description && !edition && <p className="font-corps text-sm text-muet mt-1">{description}</p>}
      </div>

      {commentaire && !edition && (
        <div className="space-y-2">
          <Commentaire texte={commentaire} />
          <button type="button" onClick={() => setEdition(true)}
            className="bg-bouton text-surface px-4 py-2 rounded-lg font-ui text-sm font-semibold hover:opacity-90">
            Proposer mon thème à nouveau
          </button>
        </div>
      )}

      {edition && (
        <form onSubmit={handleSubmit} className="bg-parchemin-fonce rounded-xl px-4 py-3 space-y-2 border border-bordure">
          {commentaire && <Commentaire texte={commentaire} />}
          <p className="font-corps text-sm text-encre-douce">{libelleEleve(commentaire ? 'commente' : 'vide')}</p>
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
              className="bg-bouton text-surface px-4 py-2 rounded-lg font-ui text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {chargement ? '…' : theme ? 'Proposer ce nouveau thème' : 'Proposer ce thème'}
            </button>
            {statut !== 'vide' && (
              <button type="button" onClick={() => setEdition(false)}
                className="px-3 py-2 rounded-lg font-ui text-sm text-encre-douce hover:bg-parchemin">Annuler</button>
            )}
            {erreur && <span className="text-sm text-retard">{erreur}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
