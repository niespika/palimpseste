'use client'

// ============================================================================
// LA FRISE DES ÉCRANS — une tuile par écran servi ; cliquer une tuile montre
// cet écran, tel que l'élève l'a vu, avec ce qu'il y a répondu.
// ----------------------------------------------------------------------------
// ⚠️ La suite des écrans est celle du compteur de l'élève (`suiteDeLaVue`), la
//    vue de chaque écran vient du rembobineur pur. `key` force le remontage :
//    l'écran garde de l'état local (page tournée, volet) qui ne doit pas survivre.
// ============================================================================

import { useState } from 'react'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import { titreDeLEtape } from '@/utils/deroule/etapes'
import { formeDuTravail } from '@/utils/deroule/plan-de-travail'
import { ecransRejoues, vueALEcran, traceDeLEtape, estUnEcranDApres, titreDeLEcranDApres } from '@/utils/deroule/rembobinage'
import { EcranDeroule } from '@/components/deroule/EcranDeroule'

export default function FriseDesEcrans({ vue, nom, resume }: { vue: VueDuDeroule; nom: string; resume: string }) {
  const suite = [...ecransRejoues(vue), { etape: 'apres' as const, cas: null }]
  const forme = formeDuTravail({
    credenceEstLaReponse: vue.credenceEstLaReponse,
    designationDemandee: vue.cas.some((c) => c.designationDemandee),
  })
  // On s'ouvre sur le dernier écran atteint : c'est là que l'élève en est.
  const traces = suite.map((s) => traceDeLEtape(vue, s))
  const dernierAtteint = Math.max(0, traces.reduce((m, t, i) => (t.faite ? i : m), 0))
  const [kBrut, setK] = useState(dernierAtteint)
  const k = Math.min(kBrut, suite.length - 1)
  const ici = suite[k]
  const vueIci = ici.etape === 'apres' ? vue : vueALEcran(vue, suite, k)

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-bordure px-4 py-3">
        <h3 className="font-titre text-xl text-encre">
          Les écrans de {nom}
          <span className="ml-2 font-ui text-[13px] text-muet" title={vue.titre}>{resume} · {suite.length} écrans · lecture seule{vue.fermee ? ' · semaine comptée' : ''}</span>
        </h3>
        <span className="flex gap-2 font-ui text-xs">
          <button type="button" disabled={k === 0} onClick={() => setK(k - 1)}
            className="rounded border border-bordure-bouton bg-parchemin px-2 py-1 text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40">‹ précédent</button>
          <button type="button" disabled={k === suite.length - 1} onClick={() => setK(k + 1)}
            className="rounded border border-bordure-bouton bg-parchemin px-2 py-1 text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40">suivant ›</button>
        </span>
      </div>

      <div className="border-b border-bordure px-4 py-3 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {suite.map((s, i) => {
            const t = traces[i]
            const titre = s.etape === 'apres' ? 'Où il en est'
              : estUnEcranDApres(s.etape) ? titreDeLEcranDApres(s.etape) : titreDeLEtape(s.etape, forme)
            return (
              <button key={i} type="button" onClick={() => setK(i)} aria-current={i === k ? 'step' : undefined}
                className={`flex min-w-[124px] flex-1 flex-col gap-0.5 rounded-[3px] border px-2.5 py-2 text-left font-ui
                  ${i === k ? 'border-liseret bg-pigment-teinte' : 'border-bordure bg-surface hover:bg-parchemin'}
                  ${t.faite ? '' : 'opacity-60'}`}>
                <span className="text-[10px] uppercase tracking-[.06em] text-muet-clair">
                  {i + 1}{s.cas ? ` · cas ${s.cas}` : ''}
                </span>
                <span className="truncate text-[13px] font-bold text-encre">{titre}</span>
                <span className={`truncate text-xs ${t.faite ? 'text-encre-douce' : 'text-muet'}`}>{t.resume}</span>
              </button>
            )
          })}
        </div>
        <div className="h-[3px] rounded bg-parchemin-fonce">
          <div className="h-full rounded bg-liseret transition-[width]" style={{ width: `${((k + 1) / suite.length) * 100}%` }} />
        </div>
      </div>

      {/* ⚠️ Le déroulé porte des marges négatives pensées pour la colonne élève
          (`-mx-4`) ; on l'enferme dans un cadre qui les absorbe. */}
      <div className="bg-parchemin p-4 sm:p-5">
        <EcranDeroule key={k} vue={vueIci} atelier="codex" lectureSeule
          etapeForcee={ici.etape === 'apres' ? null : ici} />
      </div>
    </div>
  )
}
