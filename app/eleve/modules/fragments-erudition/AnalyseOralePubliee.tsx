'use client'

import { useState, useEffect } from 'react'
import { getSignedUrlAudioEleve } from '@/app/prof/fragments-erudition/actions'
import type { FragmentOral, FragmentAnalyseOrale } from '@/types/fragments'

interface Props {
  oral: FragmentOral
  analyseOrale: FragmentAnalyseOrale
}

export default function AnalyseOralePubliee({ oral, analyseOrale }: Props) {
  const [transcriptionOuverte, setTranscriptionOuverte] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!oral.storage_path || oral.audio_supprime) return
    getSignedUrlAudioEleve(oral.storage_path, oral.eleve_id).then(url => setAudioUrl(url))
  }, [oral.storage_path, oral.audio_supprime, oral.eleve_id])

  const sections = [
    { label: 'En un mot', contenu: analyseOrale.commentaire_general },
    { label: 'Prise en compte de tes retours écrits', contenu: analyseOrale.retour_integration },
    { label: 'Pistes mobilisées', contenu: analyseOrale.retour_pistes },
    { label: 'Complétude', contenu: analyseOrale.retour_completude },
    { label: 'Qualités orales', contenu: analyseOrale.retour_oral },
  ]

  return (
    <div className="space-y-4">
      {/* Notes */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Contenu', note: analyseOrale.note_contenu },
          { label: 'Structure', note: analyseOrale.note_structure },
          { label: 'Expression', note: analyseOrale.note_expression },
        ].map(({ label, note }) => (
          <div key={label} className="bg-stone-50 rounded-lg p-2.5 text-center">
            <p className="text-xl font-serif text-stone-800">{note ?? '—'}<span className="text-xs text-stone-400">/4</span></p>
            <p className="text-xs text-stone-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      {oral.nb_mots && (
        <p className="text-xs text-stone-400">
          {oral.duree_secondes ? `${Math.floor(oral.duree_secondes / 60)}min${oral.duree_secondes % 60}s` : ''}{' '}
          · {oral.nb_mots} mots · {oral.debit_mots_minute} mots/min
        </p>
      )}

      {/* Sections de retour */}
      {sections.map(({ label, contenu }) =>
        contenu ? (
          <div key={label}>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">{label}</p>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{contenu}</p>
          </div>
        ) : null
      )}

      {/* Note prof */}
      {analyseOrale.notes_prof && (
        <div className="bg-stone-50 rounded-lg px-3 py-2">
          <p className="text-xs text-stone-400 mb-0.5">Note de ton professeur</p>
          <p className="text-sm text-stone-700">{analyseOrale.notes_prof}</p>
        </div>
      )}

      {/* Lecteur audio */}
      {!oral.audio_supprime && audioUrl && (
        <div>
          <p className="text-xs text-stone-400 mb-1">Réecouter ta présentation</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* Transcription */}
      {oral.transcription && (
        <div>
          <button
            onClick={() => setTranscriptionOuverte(o => !o)}
            className="text-xs text-stone-400 hover:text-stone-600 underline"
          >
            {transcriptionOuverte ? 'Masquer la transcription' : 'Voir la transcription'}
          </button>
          {transcriptionOuverte && (
            <p className="text-xs text-stone-500 mt-2 leading-relaxed whitespace-pre-wrap">
              {oral.transcription}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
