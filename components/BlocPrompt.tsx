'use client'

import type { ReactNode } from 'react'

const TEXTAREA = 'w-full px-3 py-2 border border-bordure rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

// Éditeur d'un prompt IA : libellé + bouton « restaurer le défaut » + zone de saisie.
// Partagé par les paramètres Aletheia (/prof/aletheia) et Scriptorium (carte/référence).
export default function BlocPrompt({ label, value, onChange, defaut, hint, rows = 18, warn }: {
  label: string; value: string; onChange: (v: string) => void; defaut: string; hint: ReactNode; rows?: number; warn?: ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-encre-douce">{label}</label>
        <button type="button" onClick={() => onChange(defaut)} className="text-xs text-muet hover:text-encre-douce underline">Restaurer la version par défaut</button>
      </div>
      <p className="text-xs text-muet mb-2">{hint}</p>
      {warn && <p className="text-xs text-retard mb-2">{warn}</p>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={TEXTAREA} />
    </div>
  )
}
