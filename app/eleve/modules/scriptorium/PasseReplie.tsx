'use client'

import { useState, type ReactNode } from 'react'

// Le PASSÉ REPLIÉ d'une frise de parcours (handoff plan_cours_eleve §3) : toutes les
// semaines « vues » fusionnent en UNE rangée — « ✓ 3 semaines vues · 5 éléments » +
// les créneaux à la suite, tronqués — et « déplier ⌄ » restitue les rangées
// existantes (rendues par le serveur, passées en `children`). Replié par défaut ;
// le parcours TERMINÉ ne passe pas par ici (tout est passé : on déplie tout).
//
// Seul état client de l'onglet : un booléen. Aucune donnée n'est chargée ici.

const ENCRE_META = '#6E5A3E'

export default function PasseReplie({
  nbSemaines, nbElements, premiereK, derniereK, libelles, dernier, children,
}: {
  nbSemaines: number
  nbElements: number
  premiereK: number
  derniereK: number
  libelles: string[]
  dernier: boolean            // rien ne suit : l'axe s'arrête sous la pastille
  children: ReactNode
}) {
  const [ouvert, setOuvert] = useState(false)
  const bouton = (libelle: string) => (
    <button
      type="button"
      onClick={() => setOuvert(o => !o)}
      aria-expanded={ouvert}
      className="font-ui text-[12.5px] font-semibold text-bouton-parcours hover:text-encre focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-sm whitespace-nowrap"
    >
      {libelle}
    </button>
  )

  if (ouvert) {
    return (
      <div>
        {children}
        <div className="flex items-stretch pb-3">
          <div className="w-[72px] sm:w-[104px] flex-none" />
          {/* l'axe continue jusqu'à la semaine suivante */}
          <div className="w-6 flex-none relative">
            {!dernier && <span aria-hidden className="absolute left-1/2 -translate-x-1/2 -top-3 bottom-0 w-0.5 bg-bordure" />}
          </div>
          <div className="flex-1">{bouton('replier ⌃')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-stretch">
      {/* gouttière : l'intervalle des semaines vues */}
      <div className="w-[72px] sm:w-[104px] flex-none text-right pr-3 sm:pr-4 pt-0.5">
        <div className="font-ui text-[10px] font-bold uppercase tracking-[.09em] text-muet">
          {premiereK === derniereK ? `S${premiereK}` : `S${premiereK} – S${derniereK}`}
        </div>
      </div>
      {/* axe */}
      <div className="w-6 flex-none relative flex justify-center">
        <span aria-hidden className="absolute left-1/2 -translate-x-1/2 top-0 w-0.5 bg-bordure" style={{ bottom: dernier ? 16 : 0 }} />
        <span aria-hidden className="relative mt-[3px] w-3 h-3 rounded-full bg-ok border-2 border-parchemin" />
      </div>
      {/* carte de repli */}
      <div className="flex-1 min-w-0 pb-3">
        <div className="rounded-[10px] border border-bordure bg-surface-retrait px-4 py-[10px] flex items-baseline gap-3 min-w-0">
          <div className="flex-1 min-w-0">
            <span className="font-ui text-[13px] font-semibold text-ok">
              ✓ {nbSemaines} semaine{nbSemaines > 1 ? 's' : ''} vue{nbSemaines > 1 ? 's' : ''} · {nbElements} élément{nbElements > 1 ? 's' : ''}
            </span>
            {libelles.length > 0 && (
              <span className="block font-corps text-[14px] italic truncate" style={{ color: ENCRE_META }} title={libelles.join(' · ')}>
                {libelles.join(' · ')}
              </span>
            )}
          </div>
          {bouton('déplier ⌄')}
        </div>
      </div>
    </div>
  )
}
