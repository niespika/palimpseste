'use client'

import { useState } from 'react'

// Toggle client isolé : permet à AnalysePubliee de rester un module SERVEUR (pour
// que tuilesAnalyseEcrite soit appelable depuis la page serveur).
export default function TranscriptionRepliable({ texte }: { texte: string }) {
  const [ouverte, setOuverte] = useState(false)
  return (
    <div className="border border-bordure rounded-xl overflow-hidden">
      <button
        onClick={() => setOuverte(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-encre-douce hover:bg-parchemin-fonce transition-colors"
      >
        <span>Consulter la transcription de mon manuscrit</span>
        <span className="text-muet">{ouverte ? '▲' : '▼'}</span>
      </button>
      {ouverte && (
        <div className="px-4 pb-4">
          <p className="text-sm text-encre-douce whitespace-pre-wrap font-mono leading-relaxed">{texte}</p>
        </div>
      )}
    </div>
  )
}
