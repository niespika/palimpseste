'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { validerTravauxLot } from './actions'

export interface LigneValidation {
  id: string
  eleve: string
  unite: string
  classe: string | null
  nbErreurs: number
  nbAjouts: number
  confiance: number | null
  priorite: number
  valide: boolean
}

export function FileValidation({ lignes }: { lignes: LigneValidation[] }) {
  const router = useRouter()
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)

  const enAttente = lignes.filter((l) => !l.valide).sort((a, b) => b.priorite - a.priorite)
  const valides = lignes.filter((l) => l.valide)

  function toggle(id: string) {
    setSelection((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function toutSelectionner() {
    if (selection.size === enAttente.length) setSelection(new Set())
    else setSelection(new Set(enAttente.map((l) => l.id)))
  }

  async function validerSelection() {
    if (selection.size === 0) return
    if (!confirm(`Valider ${selection.size} retour${selection.size > 1 ? 's' : ''} en l'état ?`)) return
    setPending(true)
    await validerTravauxLot([...selection])
    setSelection(new Set())
    setPending(false)
    router.refresh()
  }

  if (lignes.length === 0) {
    return (
      <p className="text-center text-stone-400 text-sm py-12">
        Aucun retour de V-finale à valider pour le moment.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {enAttente.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-stone-700">À valider ({enAttente.length})</h3>
            <div className="flex items-center gap-3">
              <button onClick={toutSelectionner} className="text-xs text-stone-500 hover:text-stone-800">
                {selection.size === enAttente.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                onClick={validerSelection}
                disabled={pending || selection.size === 0}
                className="px-4 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                {pending ? '…' : `Valider la sélection (${selection.size})`}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {enAttente.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={selection.has(l.id)}
                  onChange={() => toggle(l.id)}
                  className="accent-green-600 w-4 h-4 shrink-0"
                />
                <Link href={`/prof/codex/validation/${l.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">{l.eleve}</p>
                  <p className="text-xs text-stone-400 truncate">
                    {l.unite}{l.classe ? ` · ${l.classe}` : ''}
                  </p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {l.confiance != null && l.confiance < 0.6 && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded" title="Confiance OCR faible">
                      OCR {Math.round(l.confiance * 100)}%
                    </span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">{l.nbErreurs} err.</span>
                  <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">{l.nbAjouts} ajout{l.nbAjouts > 1 ? 's' : ''}</span>
                  <Link href={`/prof/codex/validation/${l.id}`} className="text-xs text-stone-500 hover:text-stone-800 underline">
                    ouvrir
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {valides.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 mb-3">Validés ({valides.length})</h3>
          <div className="space-y-2">
            {valides.map((l) => (
              <Link
                key={l.id}
                href={`/prof/codex/validation/${l.id}`}
                className="flex items-center justify-between gap-3 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 hover:border-stone-300 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-700 truncate">{l.eleve}</p>
                  <p className="text-xs text-stone-400 truncate">{l.unite}</p>
                </div>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full shrink-0">Validé</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
