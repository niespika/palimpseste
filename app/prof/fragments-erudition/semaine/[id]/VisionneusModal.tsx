'use client'

import { useState, useEffect, useMemo } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { getSignedUrlsProf } from '../../actions'
import type { FragmentPhoto } from '@/types/fragments'

interface Props {
  nomEleve: string
  photos: FragmentPhoto[]
  onFermer: () => void
}

export default function VisionneusModal({ nomEleve, photos, onFermer }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [indexActuel, setIndexActuel] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [chargement, setChargement] = useState(true)

  const photosSorted = useMemo(
    () => [...photos].sort((a, b) => a.ordre - b.ordre),
    [photos]
  )

  useEffect(() => {
    async function charger() {
      const chemins = photosSorted.map(p => p.storage_path)
      const nouvellesUrls = await getSignedUrlsProf(chemins)
      setUrls(nouvellesUrls)
      setChargement(false)
    }
    charger()
  }, [photosSorted])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onFermer()
      if (e.key === 'ArrowRight') setIndexActuel(i => Math.min(i + 1, photosSorted.length - 1))
      if (e.key === 'ArrowLeft') setIndexActuel(i => Math.max(i - 1, 0))
      if (e.key === 'r') setRotation(r => (r + 90) % 360)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [photosSorted.length, onFermer])

  const photoActuelle = photosSorted[indexActuel]
  const urlActuelle = photoActuelle ? urls[photoActuelle.storage_path] : null

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col"
      onClick={e => { if (e.target === e.currentTarget) onFermer() }}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 text-white flex-shrink-0">
        <div>
          <span className="font-medium text-sm">{nomEleve}</span>
          <span className="text-stone-400 text-sm ml-2">
            Photo {indexActuel + 1}/{photosSorted.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="px-3 py-1.5 text-sm text-white hover:bg-white/10 rounded transition-colors"
            title="Rotation (R)"
          >
            ↻ Rotation
          </button>
          {urlActuelle && (
            <a
              href={urlActuelle}
              download={`photo-${indexActuel + 1}.jpg`}
              className="px-3 py-1.5 text-sm text-white hover:bg-white/10 rounded transition-colors"
            >
              ↓ Télécharger
            </a>
          )}
          <button
            onClick={onFermer}
            className="px-3 py-1.5 text-sm text-white hover:bg-white/10 rounded transition-colors"
          >
            ✕ Fermer
          </button>
        </div>
      </div>

      {/* Zone image */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {chargement ? (
          <div className="text-white text-sm">Chargement…</div>
        ) : urlActuelle ? (
          <TransformWrapper
            key={`${indexActuel}-${rotation}`}
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            centerOnInit
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <img
                src={urlActuelle}
                alt={`Photo ${indexActuel + 1}`}
                style={{ transform: `rotate(${rotation}deg)`, maxHeight: '80vh', maxWidth: '90vw', objectFit: 'contain' }}
                className="select-none"
                draggable={false}
              />
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="text-white text-sm">Photo non disponible</div>
        )}

        {/* Navigation précédent/suivant */}
        {photosSorted.length > 1 && (
          <>
            <button
              onClick={() => { setIndexActuel(i => Math.max(i - 1, 0)); setRotation(0) }}
              disabled={indexActuel === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center disabled:opacity-20 hover:bg-black/70 transition-colors text-lg"
            >
              ‹
            </button>
            <button
              onClick={() => { setIndexActuel(i => Math.min(i + 1, photosSorted.length - 1)); setRotation(0) }}
              disabled={indexActuel === photosSorted.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center disabled:opacity-20 hover:bg-black/70 transition-colors text-lg"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* Miniatures */}
      {photosSorted.length > 1 && (
        <div className="flex gap-2 justify-center py-3 bg-black/60 flex-shrink-0 px-4 overflow-x-auto">
          {photosSorted.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => { setIndexActuel(i); setRotation(0) }}
              className={`flex-shrink-0 w-12 h-16 rounded overflow-hidden border-2 transition-colors ${
                i === indexActuel ? 'border-white' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              {urls[photo.storage_path] && (
                <img
                  src={urls[photo.storage_path]}
                  alt={`Miniature ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
