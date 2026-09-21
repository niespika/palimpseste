'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import { deposerPourEleve } from './actions'

// ----------------------------------------------------------------------------
// Vestigia · onglet Semaine — DÉPOSER À LA PLACE D'UN ÉLÈVE.
// Dans le panneau d'un élève « manquant ». Les photos passent par le même
// traitement que côté élève (HEIC → JPEG, compression), sans le seuil anti-triche :
// c'est le professeur qui a les photos en main. Fonctionne semaine fermée.
// ----------------------------------------------------------------------------

interface Props {
  semaineId: string
  eleveId: string
  classeId: string
  prenom: string
  /** Des photos choisies non envoyées : le parent ne change pas d'élève sans demander. */
  onModifie?: (modifie: boolean) => void
}

export default function FormulaireDepotProf({ semaineId, eleveId, classeId, prenom, onModifie }: Props) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [images, setImages] = useState<ImageTraitee[]>([])
  const [note, setNote] = useState('')
  const [aTemps, setATemps] = useState(true)
  const [traitement, setTraitement] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { onModifie?.(images.length > 0 || note.trim() !== '') }, [images.length, note, onModifie])

  async function surFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return
    if (images.length + fichiers.length > 4) { setErreur('Maximum 4 photos par dépôt.'); return }
    setTraitement(true)
    setErreur(null)
    try {
      const nouvelles: ImageTraitee[] = []
      let echecs = 0
      for (const f of fichiers) {
        try { nouvelles.push(await traiterImage(f, Number.POSITIVE_INFINITY)) } catch { echecs++ }
      }
      if (nouvelles.length > 0) setImages(prev => [...prev, ...nouvelles])
      if (echecs > 0) setErreur(`${echecs} photo(s) illisible(s) — les autres sont ajoutées.`)
    } finally {
      setTraitement(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function retirer(i: number) {
    setImages(prev => { libererPreview(prev[i].previewUrl); return prev.filter((_, j) => j !== i) })
  }

  async function envoyer() {
    if (images.length === 0) { setErreur('Ajoutez au moins une photo.'); return }
    setEnvoi(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('semaineId', semaineId)
      fd.append('eleveId', eleveId)
      fd.append('classeId', classeId)
      fd.append('note', note)
      fd.append('aTemps', aTemps ? 'true' : 'false')
      images.forEach((img, i) => fd.append('photos', img.file, `${i + 1}.jpg`))
      const r = await deposerPourEleve(fd)
      if (r.error) { setErreur(r.error); return }
      images.forEach(img => libererPreview(img.previewUrl))
      setImages([])
      setNote('')
      router.refresh()
    } catch (e: unknown) {
      setErreur(`Erreur lors de l'envoi : ${e instanceof Error ? e.message : 'inconnue'}`)
    } finally {
      setEnvoi(false)
    }
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="font-ui text-xs border border-bordure-bouton text-encre-douce px-3 py-1.5 rounded-lg hover:bg-parchemin-fonce transition-colors">
        Déposer à sa place…
      </button>
    )
  }

  return (
    <div className="mt-3 text-left space-y-3 rounded-xl bg-surface border border-bordure p-3">
      <p className="font-ui text-xs text-muet">
        Le dépôt sera enregistré au nom de {prenom} et analysé comme les autres, même si la semaine est fermée.
      </p>

      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple onChange={surFichiers} className="hidden" id={`photos-prof-${eleveId}`} />
      <label htmlFor={`photos-prof-${eleveId}`} className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors font-ui text-sm ${traitement ? 'border-bordure text-muet cursor-wait' : 'border-bordure text-encre-douce hover:border-pigment hover:bg-parchemin-fonce'}`}>
        {traitement ? 'Traitement…' : <><span>📷</span><span>{images.length === 0 ? 'Choisir les photos' : 'Ajouter des photos'}</span></>}
      </label>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="relative">
              <img src={img.previewUrl} alt={`Photo ${i + 1}`} className="w-14 h-[74px] object-cover rounded-md border border-bordure-bouton" />
              <button onClick={() => retirer(i)} title="Retirer" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-surface border border-bordure text-retard text-[11px] leading-none">✕</button>
            </div>
          ))}
        </div>
      )}

      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Note (optionnel) : ex. « photos reçues par courriel »"
        className="w-full px-3 py-1.5 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment"
      />

      <label className="flex items-center gap-2 font-ui text-xs text-encre-douce cursor-pointer">
        <input type="checkbox" checked={aTemps} onChange={e => setATemps(e.target.checked)} className="accent-pigment" />
        Compter comme rendu à temps
      </label>

      {erreur && <p className="text-sm text-retard bg-retard-teinte border border-retard rounded-lg px-3 py-1.5">{erreur}</p>}

      <div className="flex items-center gap-2">
        <button onClick={envoyer} disabled={envoi || traitement || images.length === 0} className="bg-bouton text-bouton-texte px-4 py-1.5 rounded-lg font-ui text-sm hover:opacity-90 disabled:opacity-40 transition-colors">
          {envoi ? 'Envoi…' : `Déposer (${images.length})`}
        </button>
        <button onClick={() => { images.forEach(img => libererPreview(img.previewUrl)); setImages([]); setOuvert(false); setErreur(null) }} disabled={envoi} className="font-ui text-xs text-muet hover:text-encre-douce underline">
          Annuler
        </button>
      </div>
    </div>
  )
}
