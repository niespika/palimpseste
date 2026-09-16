'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mettreAJourPresentation, annulerPresentation } from './actions'
import type { FragmentPresentation } from '@/types/fragments'

// ----------------------------------------------------------------------------
// Le pli « Présentation orale » de l'onglet Semaine. ⭐ 15/09 : le tirage
// lui-même est parti sur une page à projeter (`./tirage`) — ici ne restent que
// le bouton qui l'ouvre (dans un nouvel onglet, pour le projecteur) et le suivi
// des orateurs tirés : a présenté, reporté, retiré.
// ----------------------------------------------------------------------------

interface EleveEligible {
  id: string
  display_name: string
  classe: string | null
  nbPresentations: number
}

interface PresentationAvecEleve extends FragmentPresentation {
  eleve: { display_name: string; classe: string | null } | null
}

interface Props {
  semaineId: string
  classeId: string
  eligibles: EleveEligible[]
  presentations: PresentationAvecEleve[]
}

export default function TirageAuSort({ semaineId, classeId, eligibles, presentations }: Props) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)

  async function handleStatut(presentationId: string, statut: 'presente' | 'reporte') {
    setChargement(true)
    await mettreAJourPresentation(presentationId, statut)
    setChargement(false)
    router.refresh()
  }

  async function handleAnnuler(presentationId: string) {
    setChargement(true)
    await annulerPresentation(presentationId)
    setChargement(false)
    router.refresh()
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-medium text-encre">Tirage au sort</h3>
          <p className="text-xs text-muet mt-0.5">
            {eligibles.length > 0
              ? `${eligibles.length} élève${eligibles.length > 1 ? 's' : ''} ${eligibles.length > 1 ? 'ont' : 'a'} déposé — le tirage se fait sur une page à part, à projeter.`
              : 'Aucun élève n’a déposé pour cette semaine — le tirage n’est pas disponible.'}
          </p>
        </div>
        {eligibles.length > 0 && (
          <Link
            href={`/prof/fragments-erudition/tirage?semaine=${semaineId}&classe=${classeId}`}
            target="_blank"
            rel="noopener"
            className="bg-bouton text-bouton-texte px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors whitespace-nowrap"
          >
            Ouvrir le tirage ↗
          </Link>
        )}
      </div>

      {presentations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muet uppercase tracking-wide">Présentations</p>
          <div className="space-y-1.5">
            {presentations.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-encre font-medium">{p.eleve?.display_name ?? '—'}</span>
                  <Link
                    href={`/prof/fragments-erudition/presentation/${p.id}`}
                    className="text-xs text-muet hover:text-encre-douce underline"
                  >
                    Fiche
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.statut === 'presente' ? 'bg-ok-teinte text-ok' :
                    p.statut === 'reporte' ? 'bg-attention-teinte text-attention' :
                    'bg-info-teinte text-info'
                  }`}>
                    {p.statut === 'presente' ? 'A présenté ✓' :
                     p.statut === 'reporte' ? 'Reporté' : 'Tiré'}
                  </span>
                  {p.statut === 'tire' && (
                    <>
                      <button
                        onClick={() => handleStatut(p.id, 'presente')}
                        disabled={chargement}
                        className="text-xs text-ok hover:bg-ok-teinte px-2 py-0.5 rounded border border-ok"
                      >
                        A présenté
                      </button>
                      <button
                        onClick={() => handleStatut(p.id, 'reporte')}
                        disabled={chargement}
                        className="text-xs text-attention hover:bg-attention-teinte px-2 py-0.5 rounded border border-attention"
                      >
                        Reporter
                      </button>
                      <button
                        onClick={() => handleAnnuler(p.id)}
                        disabled={chargement}
                        className="text-xs text-muet hover:text-encre-douce px-2 py-0.5 rounded hover:bg-parchemin-fonce"
                      >
                        Retirer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
