'use client'

import Link from 'next/link'
import DossierIntegriteEleve from './DossierIntegriteEleve'
import type { HistoriqueLigne, DossierVue } from './types'

// ════════════════════════════════════════════════════════════════════════════
// Onglet « Historique » de /prof/integrite : tableau récapitulatif par élève
// (calqué sur la charte de MatricePilotage — colonne élève figée, parchemin/encre)
// + dossier en détail (master-detail piloté par ?eleve=, comme l'atelier l'est par
// ?sel=). La trace ne disparaît plus : les avis traités restent comptés ici.
// ════════════════════════════════════════════════════════════════════════════

const TH = 'px-2 py-2 border-l border-bordure font-ui text-[10px] font-semibold tracking-[0.06em] text-muet'

export default function HistoriqueIntegrite({
  lignes, dossier, eleveSelId, selExplicit,
}: {
  lignes: HistoriqueLigne[]
  dossier: DossierVue | null
  eleveSelId: string | null
  selExplicit: boolean
}) {
  return (
    <div className="space-y-4">
      {/* ── Tableau (master) ─────────────────────────────────────────────── */}
      <div className={selExplicit ? 'hidden lg:block' : 'block'}>
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="bg-parchemin-fonce border-b border-bordure">
                  <th scope="col" className="sticky left-0 z-10 bg-parchemin-fonce text-left px-4 py-2.5 w-[150px] sm:w-[210px] border-r border-bordure">
                    <span className="font-ui text-[10px] tracking-[0.06em] text-muet">ÉLÈVE</span>
                  </th>
                  <th scope="col" className={TH}>AVIS RETENUS</th>
                  <th scope="col" className={TH}>ÉCARTÉS</th>
                  <th scope="col" className={TH}>DÉBLOCAGES</th>
                  <th scope="col" className={TH}>STATUT</th>
                  <th scope="col" className={TH}>DERNIER</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => {
                  const actif = l.eleveId === eleveSelId
                  return (
                    <tr key={l.eleveId} className={`border-b border-bordure last:border-0 ${actif ? 'bg-parchemin-fonce/40' : ''}`}>
                      <th scope="row" className={`sticky left-0 z-10 text-left p-0 border-r border-bordure ${actif ? 'bg-parchemin-fonce' : 'bg-surface'}`}>
                        <Link
                          href={`/prof/integrite?vue=historique&eleve=${l.eleveId}`}
                          scroll={false}
                          aria-current={actif ? 'true' : undefined}
                          className={`flex items-center gap-2 px-4 py-2.5 hover:bg-parchemin-fonce/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${actif ? 'border-l-4 border-l-pigment' : ''}`}
                        >
                          {l.bloque ? (
                            <span className="w-[18px] h-[18px] shrink-0 rounded-full bg-retard text-surface font-ui text-[11px] font-bold flex items-center justify-center" aria-label="bloqué">!</span>
                          ) : (
                            <span className="w-[18px] shrink-0" aria-hidden />
                          )}
                          <span className="min-w-0">
                            <span className="block font-corps text-[15px] text-encre truncate">{l.nom}</span>
                            <span className="block font-ui text-[11px] text-muet truncate">{l.classes}</span>
                          </span>
                        </Link>
                      </th>
                      <td className="px-2 py-2.5 border-l border-bordure align-middle">
                        {l.confirmes > 0 ? (
                          <span className="font-ui text-[12px] px-2 py-0.5 rounded-full bg-retard-teinte text-retard">{l.confirmes}</span>
                        ) : (
                          <span className="font-ui text-[12px] text-muet">0</span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 border-l border-bordure align-middle font-ui text-[12px] text-encre-douce">
                        {l.ecartes}
                        {l.enAttente > 0 && <span className="block font-ui text-[10px] text-attention">{l.enAttente} en attente</span>}
                      </td>
                      <td className="px-2 py-2.5 border-l border-bordure align-middle font-ui text-[12px] text-encre-douce">{l.deblocages}</td>
                      <td className="px-2 py-2.5 border-l border-bordure align-middle">
                        {l.bloque ? (
                          <span className="font-ui text-[11px] px-2 py-0.5 rounded-full bg-retard-teinte text-retard">bloqué·e</span>
                        ) : (
                          <span className="font-ui text-[11px] text-ok">actif</span>
                        )}
                        <span className="block font-ui text-[10px] text-muet mt-0.5">{l.strikes}/{l.seuil}</span>
                      </td>
                      <td className="px-2 py-2.5 border-l border-bordure align-middle font-ui text-[12px] text-muet">{l.dernierCourt ?? '—'}</td>
                    </tr>
                  )
                })}
                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-corps text-sm text-muet">
                      Aucun historique pour l’instant. Les avis traités apparaîtront ici.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-parchemin-fonce/60 border-t border-bordure px-4 py-2.5 font-ui text-xs text-muet">
            {lignes.length} élève{lignes.length > 1 ? 's' : ''} avec un historique · clique un nom pour le détail
          </div>
          {lignes.length > 0 && (
            <p className="sm:hidden text-center font-ui text-[11px] text-muet px-4 pb-2">glisser pour voir les colonnes →</p>
          )}
        </div>
      </div>

      {/* ── Dossier (detail) ─────────────────────────────────────────────── */}
      {dossier && (
        <div className={selExplicit ? 'block' : 'hidden lg:block'}>
          <Link
            href="/prof/integrite?vue=historique"
            scroll={false}
            className="lg:hidden inline-flex items-center font-ui text-sm text-muet hover:text-encre-douce mb-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            ← Historique
          </Link>
          <DossierIntegriteEleve dossier={dossier} avecTitre />
        </div>
      )}
    </div>
  )
}
