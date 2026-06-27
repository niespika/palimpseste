'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import FeuillePanneau from '@/components/pilotage/FeuillePanneau'
import PanneauPreuve from '@/components/integrite/PanneauPreuve'
import type { SelectionVue } from '@/components/integrite/types'
import { actionDebloquerEleve } from '@/app/prof/integrite/actions'

// Section « Intégrité » de la fiche élève : strikes + état bloqué + signalements
// de cet élève. Un signalement ouvre la PREUVE en volet (FeuillePanneau), même
// composant que la page Intégrité. Après une action, on ferme et on rafraîchit.

export default function IntegriteEleveVolet({
  eleveId, strikesEleve, seuil, eleveBloque, selections,
}: {
  eleveId: string
  strikesEleve: number
  seuil: number
  eleveBloque: boolean
  selections: SelectionVue[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [ouvert, setOuvert] = useState<SelectionVue | null>(null)
  const fermer = () => { setOuvert(null); router.refresh() }

  return (
    <div className="bg-surface border border-bordure border-l-4 border-l-retard rounded-xl px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-retard">Intégrité — petits malins</span>
        <span className="font-ui text-xs text-muet">
          {strikesEleve} / {seuil} strike{seuil > 1 ? 's' : ''}{eleveBloque && <span className="text-retard"> · bloqué·e</span>}
        </span>
      </div>

      {selections.length > 0 ? (
        <ul className="mt-2.5 space-y-1.5">
          {selections.map((sel) => {
            const s = sel.signalement
            const teinte = s.source === 'ia' ? 'bg-attention-teinte text-attention' : 'bg-retard-teinte text-retard'
            return (
              <li key={s.id} data-module={s.moduleSlug}>
                <button
                  type="button"
                  onClick={() => setOuvert(sel)}
                  className="w-full flex items-center gap-2 text-left rounded-lg border border-bordure bg-surface px-3 py-2 hover:bg-parchemin-fonce transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5 font-marque text-[10px] font-semibold tracking-[0.06em] text-pigment shrink-0">
                    <span className="w-2 h-2 rounded-full bg-pigment" aria-hidden />
                    {s.moduleLabel.toUpperCase()}
                  </span>
                  <span className={`font-ui text-[11px] px-2 py-0.5 rounded-full ${teinte} shrink-0`}>{s.typeLabel}</span>
                  <span className="font-ui text-[11px] text-muet ml-auto shrink-0">{s.dateCourt}</span>
                  <span className="font-ui text-muet shrink-0" aria-hidden>›</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="font-ui text-sm text-muet mt-2">Aucun signalement en attente.</p>
      )}

      {eleveBloque && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await actionDebloquerEleve(eleveId); router.refresh() })}
          className="mt-3 font-ui text-sm font-medium px-3 py-1.5 rounded-lg bg-ok-teinte text-ok hover:opacity-85 disabled:opacity-50"
        >
          Débloquer (−1 strike)
        </button>
      )}

      {ouvert && (
        <FeuillePanneau titre="Preuve" sousTitre={ouvert.signalement.moduleLabel} onFermer={() => setOuvert(null)}>
          <PanneauPreuve key={ouvert.signalement.id} selection={ouvert} variante="volet" onApresAction={fermer} />
        </FeuillePanneau>
      )}
    </div>
  )
}
