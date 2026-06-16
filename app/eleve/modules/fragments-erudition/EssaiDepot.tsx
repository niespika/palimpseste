'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import { creerUrlUploadEssaiPhotoEleve, confirmerDepotEssaiEleve, reinitialiserPhotosEssaiEleve } from '@/app/prof/fragments-erudition/essai-actions'

interface Props {
  epreuveId: string
  inscriptionId: string
  essaiExistantId: string | null
  analyseEnCours: boolean
}

export default function EssaiDepot({ epreuveId, inscriptionId, essaiExistantId, analyseEnCours }: Props) {
  const router = useRouter()
  const [images, setImages] = useState<ImageTraitee[]>([])
  const [traitement, setTraitement] = useState(false)
  const [upload, setUpload] = useState(false)
  const [progression, setProgression] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [essaiId, setEssaiId] = useState<string | null>(essaiExistantId)
  const [reinitialisation, setReinitialisation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (analyseEnCours) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        Analyse en cours… ton professeur recevra les résultats dès qu'elle sera terminée.
      </div>
    )
  }

  async function handleFichiersSelectionnes(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return
    if (images.length + fichiers.length > 12) {
      setErreur('Maximum 12 photos par essai.')
      return
    }
    setTraitement(true)
    setErreur(null)
    try {
      const nouvelles: ImageTraitee[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la photo ${images.length + i + 1}…`)
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
      const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n
    })
  }

  function descendreImage(index: number) {
    setImages(prev => {
      if (index === prev.length - 1) return prev
      const n = [...prev]; [n[index], n[index + 1]] = [n[index + 1], n[index]]; return n
    })
  }

  async function handleSoumettre() {
    if (images.length === 0) { setErreur('Ajoute au moins une photo.'); return }
    setUpload(true)
    setErreur(null)
    const supabase = createClient()
    let idEssai = essaiId

    try {
      // Réinitialiser si un essai existait déjà
      if (idEssai) {
        setProgression('Réinitialisation…')
        await reinitialiserPhotosEssaiEleve(idEssai)
      }

      for (let i = 0; i < images.length; i++) {
        setProgression(`Envoi de la photo ${i + 1}/${images.length}…`)
        const ext = 'jpg'
        const res = await creerUrlUploadEssaiPhotoEleve(epreuveId, inscriptionId, i + 1, ext)
        if (res.error || !res.data) { setErreur(res.error ?? 'Erreur'); return }
        if (!idEssai) { idEssai = res.data.essaiId; setEssaiId(idEssai) }

        const { error: uploadErr } = await supabase.storage
          .from('essais')
          .uploadToSignedUrl(res.data.path, res.data.token, images[i].file, { contentType: 'image/jpeg' })
        if (uploadErr) { setErreur(uploadErr.message); return }
      }

      setProgression('Confirmation…')
      const conf = await confirmerDepotEssaiEleve(idEssai!)
      if (conf.error) { setErreur(conf.error); return }

      images.forEach(img => libererPreview(img.previewUrl))
      setImages([])
      router.refresh()
    } catch (e) {
      setErreur(`Erreur lors de l'envoi : ${e instanceof Error ? e.message : 'inconnue'}`)
    } finally {
      setUpload(false)
      setProgression('')
    }
  }

  async function handleReinitialiser() {
    if (!essaiId) return
    if (!confirm('Supprimer toutes les photos et recommencer ?')) return
    setReinitialisation(true)
    await reinitialiserPhotosEssaiEleve(essaiId)
    setReinitialisation(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        multiple
        onChange={handleFichiersSelectionnes}
        className="hidden"
        id="input-essai-photos"
      />
      <label
        htmlFor="input-essai-photos"
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
              {images.length === 0 ? 'Photographier mon essai' : 'Ajouter d\'autres photos'}
            </span>
          </>
        )}
      </label>
      <p className="text-xs text-stone-400 text-center">
        Max 12 photos · Compressées automatiquement · Recto d'abord, puis verso
      </p>

      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">Photos ({images.length}/12) — dans cet ordre :</p>
          {images.map((img, index) => (
            <div key={img.previewUrl} className="flex items-center gap-3 bg-stone-50 rounded-xl p-2">
              <span className="text-xs text-stone-400 w-5 text-center font-medium">{index + 1}</span>
              <img src={img.previewUrl} alt={`Photo ${index + 1}`} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
              <span className="text-xs text-stone-500 flex-1 truncate">{img.nom}</span>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => monterImage(index)} disabled={index === 0} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-20 text-sm" title="Monter">▲</button>
                <button onClick={() => descendreImage(index)} disabled={index === images.length - 1} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 disabled:opacity-20 text-sm" title="Descendre">▼</button>
                <button onClick={() => supprimerImage(index)} className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 text-sm" title="Supprimer">✕</button>
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
        onClick={handleSoumettre}
        disabled={upload || traitement || images.length === 0}
        className="w-full bg-stone-800 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {upload ? 'Envoi en cours…' : essaiId ? 'Remplacer mon dépôt' : 'Déposer mon essai'}
      </button>

      {essaiId && images.length === 0 && (
        <button
          onClick={handleReinitialiser}
          disabled={reinitialisation}
          className="w-full text-xs text-stone-400 hover:text-red-600 py-1"
        >
          {reinitialisation ? '…' : 'Supprimer mon dépôt et recommencer'}
        </button>
      )}
    </div>
  )
}
