'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { creerUrlUploadAudio, confirmerUploadAudio } from '../../actions'

interface Props {
  presentationId: string
  eleveId: string
}

type Mode = 'choix' | 'enregistrement' | 'import' | 'apercu' | 'upload'

function formaterDuree(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

const MAX_SECONDES = 600 // 10 minutes

export default function EnregistreurAudio({ presentationId, eleveId }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choix')
  const [, setEnregistrement] = useState(false)
  const [enPause, setEnPause] = useState(false)
  const [duree, setDuree] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [progression, setProgression] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [audioUrl])

  function demarrerTimer() {
    timerRef.current = setInterval(() => {
      setDuree(d => {
        if (d + 1 >= MAX_SECONDES) {
          arreterEnregistrement()
          return d
        }
        return d + 1
      })
    }, 1000)
  }

  function arreterTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function getMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
    }
    return 'audio/webm'
  }

  async function demarrerEnregistrement() {
    setErreur(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      streamRef.current = stream
      const mimeType = getMimeType()
      const mr = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        stream.getTracks().forEach(t => t.stop())
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setMode('apercu')
      }
      mr.start(500)
      mediaRecorderRef.current = mr
      setEnregistrement(true)
      setEnPause(false)
      setDuree(0)
      setMode('enregistrement')
      demarrerTimer()
    } catch {
      setErreur("Impossible d'accéder au microphone. Vérifie les autorisations du navigateur.")
    }
  }

  function arreterEnregistrement() {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setEnregistrement(false)
    arreterTimer()
  }

  function pauseReprendre() {
    const mr = mediaRecorderRef.current
    if (!mr) return
    if (mr.state === 'recording') {
      mr.pause()
      setEnPause(true)
      arreterTimer()
    } else if (mr.state === 'paused') {
      mr.resume()
      setEnPause(false)
      demarrerTimer()
    }
  }

  function handleFichierChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 25 * 1024 * 1024) {
      setErreur('Le fichier dépasse 25 Mo (limite Whisper).')
      return
    }
    setErreur(null)
    setAudioBlob(file)
    setAudioUrl(URL.createObjectURL(file))
    setMode('apercu')
  }

  function recommencer() {
    setAudioBlob(null)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setDuree(0)
    setMode('choix')
  }

  async function handleEnvoyer() {
    if (!audioBlob) return
    setChargement(true)
    setErreur(null)
    setMode('upload')

    try {
      const mimeType = audioBlob.type
      let ext = 'webm'
      if (mimeType.includes('mp4') || mimeType.includes('m4a')) ext = 'm4a'
      else if (mimeType.includes('ogg')) ext = 'ogg'
      else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) ext = 'mp3'
      else if (mimeType.includes('wav')) ext = 'wav'

      setProgression('Préparation…')
      const res = await creerUrlUploadAudio(presentationId, eleveId, ext)
      if (res.error || !res.data) throw new Error(res.error ?? 'Erreur serveur')

      const { oralId, path, token } = res.data

      setProgression('Envoi de l\'audio…')
      const supabase = createClient()
      const { error: upErr } = await supabase.storage
        .from('oraux')
        .uploadToSignedUrl(path, token, audioBlob, { contentType: mimeType, upsert: true })

      if (upErr) throw new Error(upErr.message)

      setProgression('Lancement de la transcription…')
      await confirmerUploadAudio(oralId)

      router.refresh()
      router.push(`/prof/fragments-erudition/presentation/${presentationId}`)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue')
      setMode('apercu')
      setChargement(false)
    }
  }

  // ── Rendu ────────────────────────────────────────────────────────────────

  if (mode === 'upload') {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mx-auto" />
        <p className="text-stone-600 text-sm">{progression}</p>
        <p className="text-stone-400 text-xs">La transcription et l'analyse démarrent en arrière-plan.</p>
      </div>
    )
  }

  if (mode === 'apercu') {
    const tailleMo = audioBlob ? (audioBlob.size / 1024 / 1024).toFixed(1) : '?'
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
        <h3 className="font-medium text-stone-900">Écouter avant d'envoyer</h3>
        {audioUrl && (
          <audio controls src={audioUrl} className="w-full" />
        )}
        <div className="text-sm text-stone-500 flex gap-4">
          {duree > 0 && <span>Durée : {formaterDuree(duree)}</span>}
          <span>Taille : {tailleMo} Mo</span>
        </div>
        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
        <div className="flex gap-3">
          <button
            onClick={handleEnvoyer}
            disabled={chargement}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            Envoyer pour transcription
          </button>
          <button
            onClick={recommencer}
            disabled={chargement}
            className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'enregistrement') {
    const depasse = duree >= MAX_SECONDES - 60
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-5 text-center">
        <div className={`text-5xl font-mono font-light ${depasse ? 'text-orange-600' : 'text-stone-900'}`}>
          {formaterDuree(duree)}
        </div>
        {depasse && (
          <p className="text-orange-600 text-sm">Moins d'une minute restante (limite 10 min)</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            onClick={pauseReprendre}
            className="px-4 py-2 rounded-lg text-sm border border-stone-300 hover:bg-stone-50 transition-colors"
          >
            {enPause ? 'Reprendre' : 'Pause'}
          </button>
          <button
            onClick={arreterEnregistrement}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Arrêter
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
          <span className={`w-2 h-2 rounded-full ${enPause ? 'bg-stone-400' : 'bg-red-500 animate-pulse'}`} />
          {enPause ? 'En pause' : 'Enregistrement en cours'}
        </div>
        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      </div>
    )
  }

  // mode === 'choix' ou 'import'
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
      <h3 className="font-medium text-stone-900">Enregistrement de la présentation</h3>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('choix')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${mode === 'choix' ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          Enregistrer
        </button>
        <button
          onClick={() => setMode('import')}
          className={`px-3 py-1.5 rounded text-sm transition-colors ${mode === 'import' ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
        >
          Importer un fichier
        </button>
      </div>

      {mode === 'choix' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            L'enregistrement utilisera le microphone de cet appareil. Limite : 10 minutes / 25 Mo.
          </p>
          <button
            onClick={demarrerEnregistrement}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            <span className="w-2 h-2 bg-white rounded-full" />
            Commencer l'enregistrement
          </button>
          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
        </div>
      )}

      {mode === 'import' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">
            Formats acceptés : m4a, mp3, webm, wav, ogg. Taille max : 25 Mo.
          </p>
          <input
            type="file"
            accept="audio/mp4,audio/m4a,audio/mpeg,audio/mp3,audio/webm,audio/wav,audio/ogg,.m4a,.mp3,.webm,.wav,.ogg"
            onChange={handleFichierChange}
            className="block text-sm text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-stone-300 file:text-sm file:bg-white file:text-stone-700 hover:file:bg-stone-50"
          />
          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
        </div>
      )}
    </div>
  )
}
