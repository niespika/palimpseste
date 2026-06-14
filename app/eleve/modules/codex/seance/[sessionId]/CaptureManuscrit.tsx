'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import { creerUploadsPhotos, confirmerEnvoiPhotos } from '../../actions'

interface Props {
  sessionId: string
  phase: 'v1' | 'vf'
  ctaLabel: string
  onEnvoye: () => void
}

export function CaptureManuscrit({ sessionId, phase, ctaLabel, onEnvoye }: Props) {
  const [images, setImages] = useState<ImageTraitee[]>([])
  const [traitement, setTraitement] = useState(false)
  const [upload, setUpload] = useState(false)
  const [progression, setProgression] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return
    if (images.length + fichiers.length > 12) {
      setErreur('Maximum 12 photos.')
      return
    }
    setTraitement(true)
    setErreur(null)
    try {
      const nouvelles: ImageTraitee[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la photo ${images.length + i + 1}…`)
        nouvelles.push(await traiterImage(fichiers[i]))
      }
      setImages((prev) => [...prev, ...nouvelles])
    } catch {
      setErreur('Erreur lors du traitement des photos. Réessaie.')
    } finally {
      setTraitement(false)
      setProgression('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function supprimer(index: number) {
    setImages((prev) => {
      libererPreview(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  function monter(index: number) {
    if (index === 0) return
    setImages((prev) => {
      const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n
    })
  }

  function descendre(index: number) {
    setImages((prev) => {
      if (index === prev.length - 1) return prev
      const n = [...prev]; [n[index], n[index + 1]] = [n[index + 1], n[index]]; return n
    })
  }

  async function handleEnvoyer() {
    if (images.length === 0) { setErreur('Ajoute au moins une photo.'); return }
    setUpload(true)
    setErreur(null)
    const supabase = createClient()

    try {
      setProgression('Préparation…')
      const prep = await creerUploadsPhotos(sessionId, phase, images.length)
      if (prep.error || !prep.data) { setErreur(prep.error ?? 'Erreur'); setUpload(false); return }

      const paths: string[] = []
      for (let i = 0; i < images.length; i++) {
        setProgression(`Envoi de la photo ${i + 1}/${images.length}…`)
        const { path, token } = prep.data.uploads[i]
        const { error } = await supabase.storage
          .from('codex')
          .uploadToSignedUrl(path, token, images[i].file, { contentType: 'image/jpeg' })
        if (error) { setErreur(error.message); setUpload(false); return }
        paths.push(path)
      }

      setProgression('Analyse…')
      const conf = await confirmerEnvoiPhotos(sessionId, phase, paths)
      if (conf.error) { setErreur(conf.error); setUpload(false); return }

      images.forEach((img) => libererPreview(img.previewUrl))
      setImages([])
      onEnvoye()
    } catch (e) {
      setErreur(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`)
      setUpload(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        multiple
        onChange={handleFichiers}
        className="hidden"
        id={`input-codex-${phase}`}
      />
      <label
        htmlFor={`input-codex-${phase}`}
        className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          traitement ? 'border-stone-200 text-stone-400 cursor-wait' : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
        }`}
      >
        {traitement ? (
          <span className="text-sm">{progression}</span>
        ) : (
          <>
            <span className="text-2xl">📷</span>
            <span className="text-sm font-medium">
              {images.length === 0 ? 'Photographier ma feuille' : 'Ajouter une photo'}
            </span>
          </>
        )}
      </label>
      <p className="text-xs text-stone-400 text-center">Max 12 photos · pages dans l&apos;ordre</p>

      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img, index) => (
            <div key={img.previewUrl} className="flex items-center gap-3 bg-stone-50 rounded-xl p-2">
              <span className="text-xs text-stone-400 w-5 text-center font-medium">{index + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt={`Photo ${index + 1}`} className="w-16 h-16 object-cover rounded-lg shrink-0" />
              <span className="text-xs text-stone-500 flex-1 truncate">{img.nom}</span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => monter(index)} disabled={index === 0} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-20 text-sm">▲</button>
                <button onClick={() => descendre(index)} disabled={index === images.length - 1} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-20 text-sm">▼</button>
                <button onClick={() => supprimer(index)} className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 text-sm">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
        onClick={handleEnvoyer}
        disabled={upload || traitement || images.length === 0}
        className="w-full bg-stone-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {upload ? 'Envoi…' : ctaLabel}
      </button>
    </div>
  )
}
