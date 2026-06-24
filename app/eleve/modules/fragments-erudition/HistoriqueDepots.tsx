'use client'

import { useState } from 'react'
import { getSignedUrls } from './actions'
import type { FragmentDepot, FragmentPhoto, FragmentSemaine } from '@/types/fragments'

interface DepotHistorique extends FragmentDepot {
  semaine: FragmentSemaine
  photos: FragmentPhoto[]
}

interface Props {
  depots: DepotHistorique[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function badgeStatut(statut: string) {
  if (statut === 'depose') return (
    <span className="text-xs bg-ok-teinte text-ok px-2 py-0.5 rounded-full">✓ Déposé</span>
  )
  return (
    <span className="text-xs bg-retard-teinte text-retard px-2 py-0.5 rounded-full">⚠ En retard</span>
  )
}

export default function HistoriqueDepots({ depots }: Props) {
  const [photosOuvertes, setPhotosOuvertes] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [chargement, setChargement] = useState(false)

  async function ouvrirPhotos(depotId: string, photos: FragmentPhoto[]) {
    if (photosOuvertes === depotId) {
      setPhotosOuvertes(null)
      return
    }

    setChargement(true)
    const chemins = photos.map(p => p.storage_path)
    const nouvellesUrls = await getSignedUrls(chemins)
    setUrls(prev => ({ ...prev, ...nouvellesUrls }))
    setPhotosOuvertes(depotId)
    setChargement(false)
  }

  if (depots.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-medium text-encre-douce mb-3">Historique</h3>
      <div className="space-y-2">
        {depots.map(depot => (
          <div key={depot.id} className="bg-surface border border-bordure rounded-xl overflow-hidden">
            <button
              onClick={() => ouvrirPhotos(depot.id, depot.photos)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-parchemin-fonce transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-encre-douce">
                  Semaine {depot.semaine.numero}
                  {depot.semaine.titre ? ` — ${depot.semaine.titre}` : ''}
                </span>
                {badgeStatut(depot.statut)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muet">{depot.photos.length} photo{depot.photos.length > 1 ? 's' : ''}</span>
                <span className="text-muet text-xs">{photosOuvertes === depot.id ? '▲' : '▼'}</span>
              </div>
            </button>

            {photosOuvertes === depot.id && (
              <div className="px-4 pb-4 border-t border-bordure">
                <p className="text-xs text-muet mt-2 mb-3">
                  Déposé le {formatDate(depot.created_at)}
                  {depot.commentaire_eleve && ` · « ${depot.commentaire_eleve} »`}
                </p>
                {chargement ? (
                  <p className="text-sm text-muet">Chargement…</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {depot.photos.sort((a, b) => a.ordre - b.ordre).map(photo => (
                      <a
                        key={photo.id}
                        href={urls[photo.storage_path]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={urls[photo.storage_path]}
                          alt={`Photo ${photo.ordre}`}
                          className="w-full aspect-[3/4] object-cover rounded-lg"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
