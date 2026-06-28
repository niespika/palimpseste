'use client'

import { useState } from 'react'
import CourbeEvolution, { type SerieCourbe, type PointCourbe } from '@/components/CourbeEvolution'
import { niveauThese, niveauArgs } from '@/app/prof/aletheia/diagnostic'
import type { DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

export interface LivreGraphe {
  id: string
  titre: string
  couleur: string
  semaines: number[]
}

// Graphe unique « tous les livres » de la fiche élève prof : une série par livre
// (diagnostic prof-only), bascule Thèse/Arguments (état client). Axe X = indice de
// semaine, échelle commune → lignes continues (le repli par date casserait les
// lignes, `connectNulls=false`). Clic sur un point → sélectionne la semaine (URL).
export default function GrapheProgression({
  livres,
  diagParLivre,
  basePath,
}: {
  livres: LivreGraphe[]
  diagParLivre: Record<string, Record<number, DiagnosticTravail>>
  basePath: string
}) {
  const [axe, setAxe] = useState<'arguments' | 'these'>('arguments')

  // Seuls les livres déjà découpés en semaines portent une courbe : un livre
  // assigné mais non encore structuré n'apparaît pas en série fantôme (légende).
  const livresG = livres.filter(l => l.semaines.length > 0)

  // Union triée des indices de semaine (tous livres confondus).
  const semaines = [...new Set(livresG.flatMap(l => l.semaines))].sort((a, b) => a - b)
  const series: SerieCourbe[] = livresG.map(l => ({ cle: l.id, label: l.titre, couleur: l.couleur }))
  const niveau = axe === 'arguments' ? niveauArgs : niveauThese

  // Une ligne par indice de semaine ; chaque livre y porte son niveau (ou null →
  // trou). href = 1er livre (ordre palette) possédant cette semaine — sélecteur
  // précis assuré par la liste pour les autres livres.
  const data: PointCourbe[] = semaines.map(w => {
    const row: PointCourbe = { x: `S${w}` }
    for (const l of livresG) {
      row[l.id] = l.semaines.includes(w) ? niveau(diagParLivre[l.id]?.[w]) : null
    }
    const principal = livresG.find(l => l.semaines.includes(w))
    if (principal) row.href = `${basePath}?l=${principal.id}&s=${w}`
    return row
  })

  // Le graphe s'affiche dès qu'un diagnostic est exploitable sur l'un OU l'autre
  // axe (indépendant de la bascule) : basculer sur « Thèse » quand toutes les
  // thèses sont « mal définies » montre alors un cadre vide, pas « pas diagnostiqué ».
  const aDiag = livresG.some(l => l.semaines.some(w => {
    const d = diagParLivre[l.id]?.[w]
    return niveauThese(d) != null || niveauArgs(d) != null
  }))

  return (
    <section className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h4 className="text-sm font-medium text-encre">
            Diagnostic de compréhension <span className="font-normal text-muet">— prof, jamais montré à l&apos;élève</span>
          </h4>
          <p className="text-xs text-muet mt-0.5">Niveau E→A (V1→VF) · la tendance prime sur le point isolé.</p>
        </div>
        <div className="inline-flex bg-parchemin-fonce border border-bordure rounded-lg p-0.5 shrink-0" role="group" aria-label="Axe du diagnostic">
          {([['arguments', 'Arguments'], ['these', 'Thèse']] as const).map(([cle, label]) => {
            const actif = axe === cle
            return (
              <button
                key={cle}
                type="button"
                onClick={() => setAxe(cle)}
                aria-pressed={actif}
                className={`font-ui text-sm rounded-md px-4 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
                  actif ? 'bg-pigment text-surface font-medium' : 'text-encre-douce hover:text-encre'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      {aDiag ? (
        <CourbeEvolution data={data} series={series} cleX="x" axeY="lettres" domaine={[0, 4]} hauteur={220} />
      ) : (
        <p className="text-sm text-muet">Pas encore diagnostiqué — lance le diagnostic depuis la vue classe.</p>
      )}
    </section>
  )
}
