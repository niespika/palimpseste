import Link from 'next/link'
import BulleRisque from './BulleRisque'
import CelluleModule from './CelluleModule'
import type { ColonneModule, RowPilotage, TriPilotage } from '@/utils/matrice-pilotage'

// Matrice Activité — élèves × modules. Table sémantique ; colonne élève figée
// (sticky left-0) pour le défilement horizontal mobile.

interface Props {
  colonnes: ColonneModule[]
  lignes: RowPilotage[]
  tri: TriPilotage
  base: string // /prof/classes/<id>
}

export default function MatricePilotage({ colonnes, lignes, tri, base }: Props) {
  const triLien = (t: TriPilotage, label: string) =>
    tri === t ? (
      <span className="text-encre">{label}</span>
    ) : (
      <Link href={`${base}?vue=activite&tri=${t}`} className="hover:text-encre">{label}</Link>
    )

  return (
    <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr className="bg-parchemin-fonce border-b border-bordure">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-parchemin-fonce text-left px-4 py-2.5 w-[150px] sm:w-[190px] border-r border-bordure"
              >
                <span className="font-ui text-[10px] tracking-[0.06em] text-muet">ÉLÈVE</span>
              </th>
              {colonnes.map((col) => (
                <th
                  key={col.slug}
                  scope="col"
                  data-module={col.accessible ? col.sceau : undefined}
                  className={`px-2 py-2 min-w-[108px] border-l border-bordure ${col.accessible ? '' : 'bg-parchemin/60'}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${col.accessible ? 'bg-pigment' : 'bg-bordure'}`}
                      aria-hidden
                    />
                    <span
                      className={`font-marque text-[10.5px] font-semibold tracking-[0.06em] ${
                        col.accessible ? 'text-pigment' : 'text-muet'
                      }`}
                    >
                      {col.nom.toUpperCase()}
                    </span>
                  </div>
                  {!col.accessible && (
                    <span className="font-ui text-[9px] font-normal text-muet">non activé</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.inscriptionId} className="border-b border-bordure last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-surface text-left p-0 border-r border-bordure">
                  <Link
                    href={`/prof/eleves/${l.eleveId}`}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-parchemin-fonce/50 transition-colors"
                  >
                    {l.enDifficulte ? (
                      <BulleRisque raisons={l.raisons} />
                    ) : (
                      <span className="w-[18px] shrink-0" aria-hidden />
                    )}
                    <span className="font-corps text-[15px] text-encre truncate">{l.nom}</span>
                  </Link>
                </th>
                {colonnes.map((col) => {
                  const c = l.cellules[col.slug]
                  return (
                    <td
                      key={col.slug}
                      className={`px-2 py-3 border-l border-bordure align-middle ${c.kind === 'absent' ? 'bg-parchemin/60' : ''}`}
                    >
                      <CelluleModule cellule={c} />
                    </td>
                  )
                })}
              </tr>
            ))}
            {lignes.length === 0 && (
              <tr>
                <td
                  colSpan={colonnes.length + 1}
                  className="px-4 py-8 text-center font-corps text-sm text-muet"
                >
                  Aucun élève inscrit dans cette classe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-parchemin-fonce/60 border-t border-bordure px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 font-ui text-xs text-muet">
        <span>{lignes.length} élève{lignes.length > 1 ? 's' : ''}</span>
        <span>trier&nbsp;: {triLien('risque', 'à risque')} · {triLien('nom', 'nom')}</span>
      </div>
      <p className="sm:hidden text-center font-ui text-[11px] text-muet px-4 pb-2">
        glisser pour voir les modules →
      </p>
    </div>
  )
}
