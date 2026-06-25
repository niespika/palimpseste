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
  /** Seuil anti-triche en heures (éditable par le prof). */
  seuilHeures: number
}

export default function FormulaireDepot({ semaineId, eleveId, inscriptionId, depotExistant, seuilHeures }: Props) {
  const seuilMs = seuilHeures * 60 * 60 * 1000
  const router = useRouter()
  const [images, setImages] = useState<ImageTraitee[]>([])
  const [traitement, setTraitement] = useState(false)
  const [upload, setUpload] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)
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
      let echecs = 0
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la photo ${i + 1}/${fichiers.length}…`)
        try {
          nouvelles.push(await traiterImage(fichiers[i], seuilMs))
        } catch {
          echecs++ // une photo qui échoue (HEIC illisible…) ne doit plus faire perdre tout le lot
        }
      }
      if (nouvelles.length > 0) setImages(prev => [...prev, ...nouvelles])
      if (echecs > 0) setErreur(`${echecs} photo(s) n'ont pas pu être traitées (format non supporté ?). Les autres ont bien été ajoutées.`)
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
      // Date EXIF de la photo la plus ancienne (pour le délai prise → dépôt côté prof).
      const prisesAt = images.map(img => img.priseAtMs).filter((x): x is number => x != null)
      if (prisesAt.length > 0) formData.append('photo_prise_at', new Date(Math.min(...prisesAt)).toISOString())
      chemins.forEach(c => formData.append('chemins', c))

      const resultat = await deposerCompteRendu(formData)
      if (resultat.error) {
        setErreur(resultat.error)
      } else {
        images.forEach(img => libererPreview(img.previewUrl))
        setImages([])
        setCommentaire('')
        // Dépôt accepté mais signalé « petit malin » : message cheeky (le dépôt est bien pris).
        setAvertissement(resultat.avertissement ?? null)
        router.refresh()
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
              ? 'border-bordure text-muet cursor-wait'
              : 'border-bordure text-encre-douce hover:border-pigment hover:bg-parchemin-fonce'
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
        <p className="text-xs text-muet mt-1 text-center">
          JPEG, PNG ou HEIC · Max 4 photos · Compressées automatiquement
        </p>
      </div>

      {/* Anti-triche : photo(s) probablement issues de la galerie (EXIF ancien) */}
      {images.some(img => img.priseSuspecte) && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-3 py-2">
          <p className="text-attention text-sm">
            ⚠ Une photo semble ancienne (prise il y a plus de {seuilHeures >= 48 ? `${Math.round(seuilHeures / 24)} jours` : `${seuilHeures} h`} d&apos;après ses métadonnées).
            Utilise une photo prise au moment du dépôt. Ce dépôt sera signalé à ton professeur.
          </p>
        </div>
      )}

      {/* Aperçu des photos */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-encre-douce">
            Photos ({images.length}/4) — dans cet ordre :
          </p>
          {images.map((img, index) => (
            <div
              key={img.previewUrl}
              className="flex items-center gap-3 bg-parchemin-fonce rounded-xl p-2"
            >
              <span className="text-xs text-muet w-4 text-center font-medium">
                {index + 1}
              </span>
              <img
                src={img.previewUrl}
                alt={`Photo ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <span className="text-xs text-muet flex-1 truncate">{img.nom}</span>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => monterImage(index)}
                  disabled={index === 0}
                  className="w-7 h-7 flex items-center justify-center text-muet hover:text-encre-douce disabled:opacity-20 text-sm"
                  title="Monter"
                >▲</button>
                <button
                  onClick={() => descendreImage(index)}
                  disabled={index === images.length - 1}
                  className="w-7 h-7 flex items-center justify-center text-muet hover:text-encre-douce disabled:opacity-20 text-sm"
                  title="Descendre"
                >▼</button>
                <button
                  onClick={() => supprimerImage(index)}
                  className="w-7 h-7 flex items-center justify-center text-retard hover:opacity-80 text-sm"
                  title="Supprimer"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commentaire */}
      <div>
        <label className="block text-sm font-medium text-encre-douce mb-1">
          Commentaire <span className="text-muet font-normal">(optionnel)</span>
        </label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-bordure rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-none"
          placeholder="Ex. : la photo 2 est un peu floue, désolé"
        />
      </div>

      {erreur && (
        <div className="bg-retard-teinte border border-retard rounded-xl px-3 py-2">
          <p className="text-retard text-sm">{erreur}</p>
        </div>
      )}

      {avertissement && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-3 py-2">
          <p className="text-attention text-sm">{avertissement}</p>
        </div>
      )}

      {upload && (
        <div className="bg-info-teinte border border-info rounded-xl px-3 py-2">
          <p className="text-info text-sm">{progression}</p>
        </div>
      )}

      <button
        onClick={handleSoumettre}
        disabled={upload || traitement || images.length === 0}
        className="w-full bg-bouton text-surface py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {upload ? 'Envoi en cours…' : depotExistant ? 'Remplacer mon dépôt' : 'Déposer mon compte-rendu'}
      </button>
    </div>
  )
}
