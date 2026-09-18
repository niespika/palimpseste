'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supprimerEvenementAgenda } from './actions'
import FormulaireEvenement, { type EvenementAModifier } from './FormulaireEvenement'

// Vue jour du calendrier prof : modifier / retirer UN évènement de l'agenda.
// Confirmation DANS la page (jamais `confirm()` natif — muet dans un aperçu).
export default function ControlesEvenementAgenda({ evenement }: { evenement: EvenementAModifier }) {
  const router = useRouter()
  const [mode, setMode] = useState<'repos' | 'modifier' | 'retirer'>('repos')
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function retirer() {
    setBusy(true); setErreur(null)
    const res = await supprimerEvenementAgenda(evenement.id)
    setBusy(false)
    if (res.error) { setErreur(res.error); return }
    setMode('repos')
    router.refresh()
  }

  if (mode === 'modifier') {
    return (
      <div className="w-full mt-1">
        <FormulaireEvenement classes={[]} couleurs={{}} dateDefaut={evenement.date} existant={evenement} onFermer={() => setMode('repos')} />
      </div>
    )
  }
  if (mode === 'retirer') {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-encre-douce">Retirer cet évènement ?</span>
        <button onClick={retirer} disabled={busy} className="bg-bouton text-surface px-2 py-0.5 rounded hover:opacity-90 disabled:opacity-50">{busy ? '…' : 'Oui, retirer'}</button>
        <button onClick={() => setMode('repos')} className="text-muet hover:text-encre-douce">annuler</button>
        {erreur && <span className="text-retard">{erreur}</span>}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <button onClick={() => setMode('modifier')} className="text-muet hover:text-encre-douce underline">modifier</button>
      <button onClick={() => setMode('retirer')} className="text-muet hover:text-retard underline">retirer</button>
    </span>
  )
}
