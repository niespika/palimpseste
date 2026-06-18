'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import { deposerCompteRendu } from './actions'

interface Props {
  semaineId: string
  eleveId: string
  inscriptionId: string
  depotExistant: boolean
}

export default function FormulaireDepot({ semaineId, eleveId, inscriptionId, depotExistant }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<ImageTraitee[]>([])
  const [traitement, setTraitement] = useState(false)
  const [upload, setUpload] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [progression, setProgression] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFichiersSelectionnes(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return

    const total = images.length + fichiers.length
    if (total > 4) {
      setErreur('Maximum 4 photos par dépôt.')
      return
    }

    setTraitement(true)
    setErreur(null)

    try {
      const nouvelles: ImageTraitee[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la photo ${i + 1}/${fichiers.length}…`)
        const traitee = await traiterImage(fichiers[i])
        nouvelles.push(traitee)
      }
      setImages(prev => [...prev, ...nouvelles])
    } catch {
      setErreur('Erreur lors du traitement des photos. Réessaie.')
    } finally {
      setTraitement(false)
      setProgression('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function supprimerImage(index: number) {
    setImages(prev => {
      libererPreview(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function monterImage(index: number) {
    if (index === 0) return
    setImages(prev => {
      const nouvel = [...prev]
      ;[nouvel[index - 1], nouvel[index]] = [nouvel[index], nouvel[index - 1]]
      return nouvel
    })
  }

  function descendreImage(index: number) {
    setImages(prev => {
      if (index === prev.length - 1) return prev
      const nouvel = [...prev]
      ;[nouvel[index], nouvel[index + 1]] = [nouvel[index + 1], nouvel[index]]
      return nouvel
    })
  }

  async function handleSoumettre() {
    if (images.length === 0) {
      setErreur('Ajoute au moins une photo.')
      return
    }

    setUpload(true)
    setErreur(null)
    const supabase = createClient()
    const chemins: string[] = []

    try {
      for (let i = 0; i < images.length; i++) {
        setProgression(`Envoi de la photo ${i + 1}/${images.length}…`)
        const nomFichier = `${Date.now()}_${i + 1}.jpg`
        const chemin = `${eleveId}/${inscriptionId}/${semaineId}/${nomFichier}`

        const { error } = await supabase.storage
          .from('fragments')
          .upload(chemin, images[i].file, { contentType: 'image/jpeg', upsert: true })

        if (error) throw new Error(error.message)
        chemins.push(chemin)
      }

      setProgression('Enregistrement…')
      const formData = new FormData()
      formData.append('semaineId', semaineId)
      formData.append('inscriptionId', inscriptionId)
      if (commentaire) formData.append('commentaire', commentaire)
      if (images.some(img => img.priseSuspecte)) formData.append('photos_suspectes', 'true')
      chemins.forEach(c => formData.append('chemins', c))

      const resultat = await deposerCompteRendu(formData)
      if (resultat.error) {
        setErreur(resultat.error)
      } else {
        images.forEach(img => libererPreview(img.previewUrl))
        router.refresh()
        setImages([])
        setCommentaire('')
      }
    } catch (e: unknown) {
      setErreur(`Erreur lors de l'envoi : ${e instanceof Error ? e.message : 'inconnue'}`)
    } finally {
      setUpload(false)
      setProgression('')
    }
  }

  return (
    <div className="space-y-5">
      {/* Sélection des photos */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          capture="environment"
          multiple
          onChange={handleFichiersSelectionnes}
          className="hidden"
          id="input-photos"
        />
        <label
          htmlFor="input-photos"
          className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            traitement
              ? 'border-stone-200 text-stone-400 cursor-wait'
              : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
          }`}
        >
          {traitement ? (
            <span className="text-sm">{progression}</span>
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span className="text-sm font-medium">
                {images.length === 0 ? 'Ajouter des photos' : 'Ajouter d\'autres photos'}
              </span>
            </>
          )}
        </label>
        <p className="text-xs text-stone-400 mt-1 text-center">
          JPEG, PNG ou HEIC · Max 4 photos · Compressées automatiquement
        </p>
      </div>

      {/* Anti-triche : photo(s) probablement issues de la galerie (EXIF ancien) */}
      {images.some(img => img.priseSuspecte) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <p className="text-amber-800 text-sm">
            ⚠ Une photo semble ancienne (prise il y a plus de 2 jours d&apos;après ses métadonnées).
            Utilise une photo prise au moment du dépôt. Ce dépôt sera signalé à ton professeur.
          </p>
        </div>
      )}

      {/* Aperçu des photos */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">
            Photos ({images.length}/4) — dans cet ordre :
          </p>
          {images.map((img, index) => (
            <div
              key={img.previewUrl}
              className="flex items-center gap-3 bg-stone-50 rounded-xl p-2"
            >
              <span className="text-xs text-stone-400 w-4 text-center font-medium">
                {index + 1}
              </span>
              <img
                src={img.previewUrl}
                alt={`Photo ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <span className="text-xs text-stone-500 flex-1 truncate">{img.nom}</span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => monterImage(index)}
                  disabled={index === 0}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-20 text-sm"
                  title="Monter"
                >▲</button>
                <button
                  onClick={() => descendreImage(index)}
                  disabled={index === images.length - 1}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-20 text-sm"
                  title="Descendre"
                >▼</button>
                <button
                  onClick={() => supprimerImage(index)}
                  className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 text-sm"
                  title="Supprimer"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">
          Commentaire <span className="text-stone-400 font-normal">(optionnel)</span>
        </label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
          placeholder="Ex. : la photo 2 est un peu floue, désolé"
        />
      </div>

      {erreur && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          <p className="text-red-700 text-sm">{erreur}</p>
        </div>
      )}

      {upload && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
          <p className="text-blue-700 text-sm">{progression}</p>
        </div>
      )}

      <button
        onClick={handleSoumettre}
        disabled={upload || traitement || images.length === 0}
        className="w-full bg-stone-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {upload ? 'Envoi en cours…' : depotExistant ? 'Remplacer mon dépôt' : 'Déposer mon compte-rendu'}
      </button>
    </div>
  )
}
