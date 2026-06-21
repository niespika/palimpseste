'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirCouleurClasse } from './actions'

// Palette par défaut (assignée par index quand la classe n'a pas de couleur).
const PALETTE = ['#7C9CBF', '#C08552', '#7FA67F', '#B07FA6', '#C0A35E', '#6FA8A8', '#B5736B']

function LigneClasse({
  classe,
  defaut,
}: {
  classe: { id: string; nom: string; couleur: string | null }
  defaut: string
}) {
  const router = useRouter()
  const initiale = classe.couleur ?? defaut
  const [valeur, setValeur] = useState(initiale)
  const [busy, setBusy] = useState(false)
  const modifiee = valeur.toLowerCase() !== (classe.couleur ?? '').toLowerCase()

  async function enregistrer() {
    setBusy(true)
    const res = await definirCouleurClasse(classe.id, valeur)
    setBusy(false)
    if (res.error) {
      alert(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="color"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="h-8 w-10 rounded border border-stone-200 cursor-pointer bg-white"
          aria-label={`Couleur de ${classe.nom}`}
        />
        <span className="font-medium text-stone-900 truncate">{classe.nom}</span>
        {!classe.couleur && (
          <span className="text-xs text-stone-400">(défaut)</span>
        )}
      </div>
      {modifiee && (
        <button
          onClick={enregistrer}
          disabled={busy}
          className="text-xs bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-700 disabled:opacity-50 flex-shrink-0"
        >
          {busy ? '…' : 'Enregistrer'}
        </button>
      )}
    </div>
  )
}

export default function CouleursClasses({
  classes,
}: {
  classes: { id: string; nom: string; couleur: string | null }[]
}) {
  if (classes.length === 0) {
    return <p className="text-sm text-stone-400">Aucune classe active.</p>
  }
  return (
    <div className="space-y-2">
      {classes.map((c, i) => (
        <LigneClasse key={c.id} classe={c} defaut={PALETTE[i % PALETTE.length]} />
      ))}
    </div>
  )
}
