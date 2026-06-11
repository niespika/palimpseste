'use client'

import { useState } from 'react'
import VisionneusModal from './VisionneusModal'
import type { EleveAvecDepot } from '@/types/fragments'

interface Props {
  eleves: EleveAvecDepot[]
}

function badgeStatut(depot: EleveAvecDepot['depot']) {
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VueSemaine({ eleves }: Props) {
  const [eleveVisu, setEleveVisu] = useState<EleveAvecDepot | null>(null)

  const nbDeposes = eleves.filter(e => e.depot && e.depot.statut === 'depose').length
  const nbRetard = eleves.filter(e => e.depot && e.depot.statut === 'en_retard').length
  const nbManquants = eleves.filter(e => !e.depot).length

  return (
    <div>
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
      </div>

      {/* Tableau */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Élève</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Statut</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide hidden sm:table-cell">Déposé le</th>
              <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide hidden sm:table-cell">Commentaire</th>
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
                  {eleve.display_name}
                  {eleve.classe && <span className="text-xs text-stone-400 ml-1">{eleve.classe}</span>}
                </td>
                <td className="px-4 py-3">{badgeStatut(eleve.depot)}</td>
                <td className="px-4 py-3 text-sm text-stone-500 hidden sm:table-cell">
                  {eleve.depot ? formatDate(eleve.depot.created_at) : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-stone-500 hidden sm:table-cell max-w-xs truncate">
                  {eleve.depot?.commentaire_eleve ?? '—'}
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
