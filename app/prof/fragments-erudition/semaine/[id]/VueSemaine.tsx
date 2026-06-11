'use client'

import { useState } from 'react'
import Link from 'next/link'
import VisionneusModal from './VisionneusModal'
import type { EleveAvecDepot, AnalyseResumee } from '@/types/fragments'

interface Props {
  eleves: EleveAvecDepot[]
  semaineId: string
}

function badgeStatutDepot(depot: EleveAvecDepot['depot']) {
  if (!depot) return (
    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Manquant</span>
  )
  if (depot.statut === 'en_retard') return (
    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">En retard</span>
  )
  return (
    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Déposé ✓</span>
  )
}

function badgeAnalyse(analyse: AnalyseResumee | null, depotId: string, semaineId: string) {
  if (!analyse) return <span className="text-xs text-stone-300">—</span>

  const classes: Record<string, string> = {
    en_cours: 'bg-blue-100 text-blue-700',
    generee:  'bg-amber-100 text-amber-700',
    erreur:   'bg-red-100 text-red-700',
    publiee:  'bg-green-100 text-green-700',
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
          <span className="text-xs text-stone-400">
            {analyse.note_decouvertes ?? '?'} / {analyse.note_sources ?? '?'} / {analyse.note_reflexions ?? '?'}
          </span>
        )}
      </Link>
    )
  }

  return badge
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VueSemaine({ eleves, semaineId }: Props) {
  const [eleveVisu, setEleveVisu] = useState<EleveAvecDepot | null>(null)

  const nbDeposes = eleves.filter(e => e.depot && e.depot.statut === 'depose').length
  const nbRetard = eleves.filter(e => e.depot && e.depot.statut === 'en_retard').length
  const nbManquants = eleves.filter(e => !e.depot).length
  const nbAValider = eleves.filter(e => e.analyse?.statut === 'generee').length
  const nbPublies = eleves.filter(e => e.analyse?.statut === 'publiee').length

  return (
    <div>
      {/* Stats rapides */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-green-800">{nbDeposes}</p>
          <p className="text-xs text-green-600 mt-0.5">Déposé</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-orange-800">{nbRetard}</p>
          <p className="text-xs text-orange-600 mt-0.5">En retard</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-red-800">{nbManquants}</p>
          <p className="text-xs text-red-600 mt-0.5">Manquant</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-amber-800">{nbAValider}</p>
          <p className="text-xs text-amber-600 mt-0.5">À valider</p>
        </div>
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-stone-800">{nbPublies}</p>
          <p className="text-xs text-stone-500 mt-0.5">Publié</p>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Élève</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Dépôt</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide hidden sm:table-cell">Le</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Analyse</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Photos</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map(eleve => (
              <tr
                key={eleve.id}
                className={`border-t border-stone-100 ${!eleve.depot ? 'bg-red-50/30' : 'hover:bg-stone-50'}`}
              >
                <td className="px-4 py-3 text-sm font-medium text-stone-900">
                  <Link
                    href={`/prof/fragments-erudition/eleve/${eleve.id}`}
                    className="hover:text-blue-700 hover:underline"
                  >
                    {eleve.display_name}
                  </Link>
                  {eleve.classe && <span className="text-xs text-stone-400 ml-1">{eleve.classe}</span>}
                </td>
                <td className="px-4 py-3">{badgeStatutDepot(eleve.depot)}</td>
                <td className="px-4 py-3 text-sm text-stone-500 hidden sm:table-cell">
                  {eleve.depot ? formatDate(eleve.depot.created_at) : '—'}
                </td>
                <td className="px-4 py-3">
                  {eleve.depot
                    ? badgeAnalyse(eleve.analyse, eleve.depot.id, semaineId)
                    : <span className="text-xs text-stone-300">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {eleve.depot && eleve.depot.photos.length > 0 ? (
                    <button
                      onClick={() => setEleveVisu(eleve)}
                      className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors"
                    >
                      Voir ({eleve.depot.photos.length})
                    </button>
                  ) : (
                    <span className="text-xs text-stone-400">—</span>
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
