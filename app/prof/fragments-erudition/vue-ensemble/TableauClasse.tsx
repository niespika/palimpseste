'use client'

import { useState } from 'react'
import Link from 'next/link'

interface CelluleSemaine {
  semaineId: string
  note: number | null       // moyenne des 3 notes, null = non rendu
  enRetard: boolean
  depotId: string | null
}

interface LigneEleve {
  id: string
  display_name: string
  classe: string | null
  cellules: CelluleSemaine[]   // une par semaine, même ordre que `semaines`
  moyenne: number | null
  tauxDepot: number            // 0-100
  tendance: number | null      // diff moy dernière semaine vs 3 semaines avant, null si insuffisant
}

interface Alerte {
  eleveId: string
  display_name: string
  raison: string
}

interface Props {
  semaines: Array<{ id: string; numero: number; titre: string | null }>
  lignes: LigneEleve[]
  alertes: Alerte[]
  moyennesClasse: Array<{
    semaine: number
    decouvertes: number | null
    sources: number | null
    reflexions: number | null
  }>
}

type Tri = 'nom' | 'moyenne' | 'taux'

function couleurNote(note: number | null, enRetard: boolean): string {
  if (note === null) return enRetard ? 'bg-stone-200 text-stone-500' : 'bg-stone-100 text-stone-400'
  if (note < 1) return 'bg-red-200 text-red-800'
  if (note < 2) return 'bg-orange-200 text-orange-800'
  if (note < 3) return 'bg-yellow-200 text-yellow-800'
  return 'bg-green-200 text-green-800'
}

function telechargerCSV(semaines: Props['semaines'], lignes: LigneEleve[]) {
  const entete = ['Élève', 'Classe', ...semaines.map(s => `S${s.numero}_note`), ...semaines.map(s => `S${s.numero}_statut`), 'Moyenne', 'Taux_depot_%']
  const lignesCSV = lignes.map(l => {
    const notes = semaines.map((_, i) => {
      const c = l.cellules[i]
      return c?.note !== null && c?.note !== undefined ? c.note.toFixed(2) : ''
    })
    const statuts = semaines.map((_, i) => {
      const c = l.cellules[i]
      if (!c) return 'manquant'
      if (c.note === null) return c.enRetard ? 'en_retard' : 'manquant'
      return c.enRetard ? 'en_retard' : 'déposé'
    })
    return [
      `"${l.display_name}"`,
      `"${l.classe ?? ''}"`,
      ...notes,
      ...statuts,
      l.moyenne !== null ? l.moyenne.toFixed(2) : '',
      l.tauxDepot.toString(),
    ]
  })

  const csv = [entete, ...lignesCSV].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'fragments-erudition-suivi.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function TableauClasse({ semaines, lignes, alertes, moyennesClasse }: Props) {
  const [tri, setTri] = useState<Tri>('nom')
  const [desc, setDesc] = useState(false)

  function changerTri(t: Tri) {
    if (tri === t) setDesc(d => !d)
    else { setTri(t); setDesc(true) }
  }

  const lignesTri = [...lignes].sort((a, b) => {
    let diff = 0
    if (tri === 'nom') diff = a.display_name.localeCompare(b.display_name, 'fr')
    else if (tri === 'moyenne') diff = (a.moyenne ?? -1) - (b.moyenne ?? -1)
    else if (tri === 'taux') diff = a.tauxDepot - b.tauxDepot
    return desc ? -diff : diff
  })

  function icone(t: Tri) {
    if (tri !== t) return ' ↕'
    return desc ? ' ↓' : ' ↑'
  }

  return (
    <div className="space-y-6">
      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">À surveiller</p>
          <ul className="space-y-1">
            {alertes.map((a, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">·</span>
                <span>
                  <Link href={`/prof/fragments-erudition/eleve/${a.eleveId}`} className="font-medium hover:underline">
                    {a.display_name}
                  </Link>
                  {' — '}{a.raison}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Moyennes de classe par section */}
      {moyennesClasse.some(m => m.decouvertes !== null) && (
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Moyennes de classe par section
          </p>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr className="text-xs text-stone-400">
                  <th className="text-left pr-4 pb-1 font-normal">Section</th>
                  {semaines.map(s => (
                    <th key={s.id} className="px-2 pb-1 font-normal text-center">S{s.numero}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['decouvertes', 'sources', 'reflexions'] as const).map(section => {
                  const couleurs: Record<string, string> = {
                    decouvertes: 'text-blue-600',
                    sources: 'text-emerald-600',
                    reflexions: 'text-violet-600',
                  }
                  const labels: Record<string, string> = {
                    decouvertes: 'Découvertes',
                    sources: 'Sources',
                    reflexions: 'Réflexions',
                  }
                  return (
                    <tr key={section}>
                      <td className={`pr-4 py-1 font-medium ${couleurs[section]}`}>{labels[section]}</td>
                      {moyennesClasse.map((m, i) => (
                        <td key={i} className="px-2 py-1 text-center text-stone-700">
                          {m[section] !== null ? (m[section] as number).toFixed(1) : '—'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau principal + export */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between gap-3">
          <div className="flex gap-2 text-xs text-stone-500">
            Trier par :
            {(['nom', 'moyenne', 'taux'] as Tri[]).map(t => (
              <button
                key={t}
                onClick={() => changerTri(t)}
                className={`px-2 py-0.5 rounded hover:bg-stone-100 ${tri === t ? 'font-medium text-stone-800' : ''}`}
              >
                {t === 'nom' ? 'Nom' : t === 'moyenne' ? 'Moyenne' : 'Taux de dépôt'}
                {icone(t)}
              </button>
            ))}
          </div>
          <button
            onClick={() => telechargerCSV(semaines, lignes)}
            className="text-xs text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded border border-stone-200 hover:border-stone-400 transition-colors"
          >
            Exporter CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 uppercase tracking-wide sticky left-0 bg-stone-50">
                  Élève
                </th>
                {semaines.map(s => (
                  <th key={s.id} className="px-2 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide whitespace-nowrap">
                    S{s.numero}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Moy.
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Dépôt
                </th>
              </tr>
            </thead>
            <tbody>
              {lignesTri.map(l => (
                <tr key={l.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-medium text-stone-900 sticky left-0 bg-white hover:bg-stone-50 whitespace-nowrap">
                    <Link
                      href={`/prof/fragments-erudition/eleve/${l.id}`}
                      className="hover:text-blue-700 hover:underline"
                    >
                      {l.display_name}
                    </Link>
                    {l.classe && <span className="text-xs text-stone-400 ml-1">{l.classe}</span>}
                  </td>
                  {l.cellules.map((c, i) => (
                    <td key={i} className="px-1 py-1.5 text-center">
                      {c.depotId ? (
                        <Link href={`/prof/fragments-erudition/analyse/${c.depotId}`}>
                          <span className={`inline-block w-10 h-7 leading-7 rounded text-xs font-medium ${couleurNote(c.note, c.enRetard)} ${c.enRetard ? 'border border-orange-400' : ''} hover:opacity-80 transition-opacity`}>
                            {c.note !== null ? c.note.toFixed(1) : c.enRetard ? '↷' : '—'}
                          </span>
                        </Link>
                      ) : (
                        <span className={`inline-block w-10 h-7 leading-7 rounded text-xs ${couleurNote(null, false)}`}>
                          —
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-center text-stone-700 font-medium tabular-nums">
                    {l.moyenne !== null ? l.moyenne.toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center text-stone-500 tabular-nums">
                    {l.tauxDepot}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
