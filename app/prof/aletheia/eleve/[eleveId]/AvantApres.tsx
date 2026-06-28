'use client'

import { useState } from 'react'
import type { TravailAletheia } from '@/app/eleve/modules/aletheia/types'

// Champ « avant/après » : la couleur du texte est héritée du bloc (V1 = muet
// italique, VF = encre), seul le label reste neutre.
function ChampInline({ label, valeur }: { label: string; valeur: string | null }) {
  if (!valeur) return null
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide not-italic text-muet mb-0.5">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{valeur}</p>
    </div>
  )
}

function BlocVersion({ t, variante }: { t: TravailAletheia; variante: 'v1' | 'vf' }) {
  if (variante === 'v1') {
    const vide = !t.these && !t.arguments
    return (
      <div className="bg-surface border border-bordure rounded-xl p-4 space-y-2 text-muet italic">
        <ChampInline label="Idée principale" valeur={t.these} />
        <ChampInline label="Arguments" valeur={t.arguments} />
        {vide && <p className="text-sm">Pas de premier jet.</p>}
      </div>
    )
  }
  const aVf = t.these_vf || t.arguments_vf
  return (
    <div className="bg-surface border border-bordure rounded-xl p-4 space-y-2 ring-1 ring-pigment/30 text-encre">
      {aVf ? (
        <>
          <ChampInline label="Idée principale" valeur={t.these_vf} />
          <ChampInline label="Arguments" valeur={t.arguments_vf} />
        </>
      ) : <p className="text-sm not-italic text-muet">Pas encore de version finale.</p>}
    </div>
  )
}

// Avant / après (V1 → VF) — la preuve du travail.
// Desktop : deux colonnes côte à côte (Premier jet | Version finale).
// Mobile : bascule segmentée (VF par défaut) → une seule version affichée, pas
// d'empilement (cf. maquette « Rendu Charte »).
export default function AvantApres({ travail }: { travail: TravailAletheia }) {
  const [vue, setVue] = useState<'v1' | 'vf'>('vf')
  return (
    <div>
      <p className="font-ui text-[11px] uppercase tracking-[0.1em] text-muet mb-2">Du premier jet à la version finale</p>

      {/* Desktop : 2 colonnes côte à côte */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
        <div className="min-w-0">
          <p className="font-ui text-[11px] uppercase tracking-[0.06em] text-muet mb-1.5">Premier jet (V1)</p>
          <BlocVersion t={travail} variante="v1" />
        </div>
        <div className="min-w-0">
          <p className="font-ui text-[11px] uppercase tracking-[0.06em] text-pigment mb-1.5">Version finale (VF)</p>
          <BlocVersion t={travail} variante="vf" />
        </div>
      </div>

      {/* Mobile : bascule segmentée — une seule version à la fois (VF par défaut) */}
      <div className="lg:hidden">
        <div className="flex bg-parchemin-fonce rounded-lg p-0.5 mb-3" role="group" aria-label="Version affichée">
          {([['vf', 'Version finale'], ['v1', 'Premier jet']] as const).map(([cle, label]) => {
            const actif = vue === cle
            return (
              <button
                key={cle}
                type="button"
                onClick={() => setVue(cle)}
                aria-pressed={actif}
                className={`flex-1 text-center rounded-md min-h-[44px] px-3 font-ui text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
                  actif ? 'bg-surface text-encre font-semibold shadow-sm' : 'text-muet'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <BlocVersion t={travail} variante={vue} />
      </div>
    </div>
  )
}
