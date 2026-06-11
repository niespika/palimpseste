'use client'

import { useState } from 'react'
import type { FragmentAnalyse, FragmentPiste } from '@/types/fragments'

interface Props {
  analyse: FragmentAnalyse
  pistes: FragmentPiste[]
}

const LABELS_NOTE: Record<number, string> = {
  0: 'Travail non fait',
  1: 'Le minimum',
  2: 'Travail fait',
  3: 'Un bon travail',
  4: 'Excellent',
}

function BadgeNote({ label, note }: { label: string; note: number | null }) {
  if (note === null) return null
  const couleurs = ['bg-red-50 text-red-700', 'bg-orange-50 text-orange-700', 'bg-stone-50 text-stone-600', 'bg-green-50 text-green-700', 'bg-emerald-50 text-emerald-700']
  return (
    <div className={`rounded-xl px-4 py-3 ${couleurs[note] ?? 'bg-stone-50 text-stone-600'}`}>
      <p className="text-xs font-medium mb-0.5">{label}</p>
      <p className="text-lg font-serif">{note}/4 — <span className="text-sm font-normal">{LABELS_NOTE[note]}</span></p>
    </div>
  )
}

function Section({ titre, contenu }: { titre: string; contenu: string | null }) {
  if (!contenu) return null
  return (
    <div>
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1.5">{titre}</p>
      <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{contenu}</p>
    </div>
  )
}

export default function AnalysePubliee({ analyse, pistes }: Props) {
  const [transcriptionOuverte, setTranscriptionOuverte] = useState(false)

  return (
    <div className="space-y-5">
      {/* Notes */}
      <div className="grid grid-cols-3 gap-2">
        <BadgeNote label="Découvertes" note={analyse.note_decouvertes} />
        <BadgeNote label="Sources" note={analyse.note_sources} />
        <BadgeNote label="Réflexions" note={analyse.note_reflexions} />
      </div>

      {/* Corps du retour */}
      <div className="bg-white border border-stone-200 rounded-xl px-4 py-4 space-y-5">
        <Section titre="Commentaire général" contenu={analyse.commentaire_general} />
        {analyse.retour_progres && <Section titre="Progrès" contenu={analyse.retour_progres} />}
        <Section titre="Langue" contenu={analyse.retour_langue} />
        <Section titre="Style" contenu={analyse.retour_style} />
        <Section titre="Contenu" contenu={analyse.retour_contenu} />
      </div>

      {/* Pistes */}
      {pistes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Pistes pour la suite</p>
          <div className="space-y-2">
            {pistes.map(piste => (
              <div key={piste.id} className="bg-stone-50 rounded-xl px-4 py-3 flex items-start gap-2">
                <span className="text-sm flex-shrink-0 mt-0.5">
                  {piste.est_rappel ? '🔁' : '💡'}
                </span>
                <div>
                  {piste.est_rappel && (
                    <p className="text-xs text-violet-600 font-medium mb-0.5">On en avait parlé</p>
                  )}
                  <p className="text-sm text-stone-700">{piste.contenu}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note du prof */}
      {analyse.notes_prof && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 font-medium mb-1">Ton professeur ajoute :</p>
          <p className="text-sm text-amber-900 italic">"{analyse.notes_prof}"</p>
        </div>
      )}

      {/* Transcription (repliée) */}
      {analyse.transcription && (
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setTranscriptionOuverte(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <span>Consulter la transcription de mon manuscrit</span>
            <span className="text-stone-400">{transcriptionOuverte ? '▲' : '▼'}</span>
          </button>
          {transcriptionOuverte && (
            <div className="px-4 pb-4">
              <p className="text-sm text-stone-600 whitespace-pre-wrap font-mono leading-relaxed">
                {analyse.transcription}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
