'use client'

import { useState } from 'react'
import Link from 'next/link'
import VisionneusModal from './VisionneusModal'
import { noteVersLettre } from '@/utils/notation'
import { formatInstant } from '@/utils/fuseau'
import type { EleveAvecDepot, AnalyseResumee } from '@/types/fragments'

interface Props {
  eleves: EleveAvecDepot[]
  semaineId: string
  tz: string
}

function badgeStatutDepot(depot: EleveAvecDepot['depot']) {
  if (!depot) return (
    <span className="text-xs bg-retard-teinte text-retard px-2 py-0.5 rounded-full font-medium">Manquant</span>
  )
  if (depot.statut === 'en_retard') return (
    <span className="text-xs bg-attention-teinte text-attention px-2 py-0.5 rounded-full">En retard</span>
  )
  return (
    <span className="text-xs bg-ok-teinte text-ok px-2 py-0.5 rounded-full">Déposé ✓</span>
  )
}

function badgeAnalyse(analyse: AnalyseResumee | null, depotId: string, semaineId: string) {
  if (!analyse) return <span className="text-xs text-bordure">—</span>

  const classes: Record<string, string> = {
    en_cours: 'bg-info-teinte text-info',
    generee:  'bg-attention-teinte text-attention',
    erreur:   'bg-retard-teinte text-retard',
    publiee:  'bg-ok-teinte text-ok',
  }
  const labels: Record<string, string> = {
    en_cours: 'En cours…',
    generee:  'À valider',
    erreur:   'Erreur',
    publiee:  'Publiée ✓',
  }

  const badge = (
    <span className={`text-xs px-2 py-0.5 rounded-full ${classes[analyse.statut] ?? ''}`}>
      {labels[analyse.statut] ?? analyse.statut}
    </span>
  )

  if (analyse.statut === 'generee' || analyse.statut === 'publiee' || analyse.statut === 'erreur') {
    return (
      <Link
        href={`/prof/fragments-erudition/analyse/${depotId}?semaine=${semaineId}`}
        className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        {badge}
        {(analyse.statut === 'generee' || analyse.statut === 'publiee') && (
          <span className="text-xs text-muet">
            {noteVersLettre(analyse.note_decouvertes) ?? '?'} / {noteVersLettre(analyse.note_sources) ?? '?'} / {noteVersLettre(analyse.note_reflexions) ?? '?'}
          </span>
        )}
      </Link>
    )
  }

  return badge
}

export default function VueSemaine({ eleves, semaineId, tz }: Props) {
  const [eleveVisu, setEleveVisu] = useState<EleveAvecDepot | null>(null)

  // « Déposés » est cumulatif (les retards sont aussi des dépôts) — cohérent avec la tuile
  // de classe et la spec (en retard ⊆ déposés). « En retard » reste un sous-compteur.
  const nbDeposes = eleves.filter(e => e.depot).length
  const nbRetard = eleves.filter(e => e.depot && e.depot.statut === 'en_retard').length
  const nbManquants = eleves.filter(e => !e.depot).length
  const nbAValider = eleves.filter(e => e.analyse?.statut === 'generee').length
  const nbPublies = eleves.filter(e => e.analyse?.statut === 'publiee').length

  return (
    <div>
      {/* Stats rapides */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-ok-teinte border border-ok rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-ok">{nbDeposes}</p>
          <p className="text-xs text-ok mt-0.5">Déposé</p>
        </div>
        <div className="bg-attention-teinte border border-attention rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-attention">{nbRetard}</p>
          <p className="text-xs text-attention mt-0.5">En retard</p>
        </div>
        <div className="bg-retard-teinte border border-retard rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-retard">{nbManquants}</p>
          <p className="text-xs text-retard mt-0.5">Manquant</p>
        </div>
        <div className="bg-attention-teinte border border-attention rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-attention">{nbAValider}</p>
          <p className="text-xs text-attention mt-0.5">À valider</p>
        </div>
        <div className="bg-parchemin-fonce border border-bordure rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-encre">{nbPublies}</p>
          <p className="text-xs text-muet mt-0.5">Publié</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-surface border border-bordure rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-parchemin-fonce border-b border-bordure">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Élève</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Dépôt</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide hidden sm:table-cell">Le</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Analyse</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Photos</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map(eleve => (
              <tr
                key={eleve.id}
                className={`border-t border-bordure ${!eleve.depot ? 'bg-retard-teinte/30' : 'hover:bg-parchemin-fonce'}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-encre">
                  <Link
                    href={`/prof/fragments-erudition/eleve/${eleve.id}`}
                    className="hover:text-info hover:underline"
                  >
                    {eleve.display_name}
                  </Link>
                  {eleve.classe && <span className="text-xs text-muet ml-1">{eleve.classe}</span>}
                </td>
                <td className="px-4 py-3">{badgeStatutDepot(eleve.depot)}</td>
                <td className="px-4 py-3 text-sm text-muet hidden sm:table-cell">
                  {eleve.depot ? formatInstant(eleve.depot.created_at, tz, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  {eleve.depot
                    ? badgeAnalyse(eleve.analyse, eleve.depot.id, semaineId)
                    : <span className="text-xs text-bordure">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {eleve.depot && eleve.depot.photos.length > 0 ? (
                    <button
                      onClick={() => setEleveVisu(eleve)}
                      className="text-xs bg-bouton text-surface px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors"
                    >
                      Voir ({eleve.depot.photos.length})
                    </button>
                  ) : (
                    <span className="text-xs text-muet">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal visionneuse */}
      {eleveVisu && eleveVisu.depot && (
        <VisionneusModal
          nomEleve={eleveVisu.display_name}
          photos={eleveVisu.depot.photos}
          onFermer={() => setEleveVisu(null)}
        />
      )}
    </div>
  )
}
