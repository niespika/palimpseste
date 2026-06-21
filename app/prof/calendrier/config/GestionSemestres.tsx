'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Semestre } from '@/types/calendrier'
import {
  creerSemestre,
  modifierSemestre,
  definirSemestreActif,
  supprimerSemestre,
} from './actions'

const INPUT =
  'w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GestionSemestres({ semestres }: { semestres: Semestre[] }) {
  const router = useRouter()
  const [creation, setCreation] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleCreer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const res = await creerSemestre({
      name: f.get('name') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setCreation(false)
    router.refresh()
  }

  async function handleModifier(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    setBusy(true)
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const res = await modifierSemestre(id, {
      name: f.get('name') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setEditId(null)
    router.refresh()
  }

  async function handleActif(id: string) {
    setBusy(true)
    setErreur(null)
    const res = await definirSemestreActif(id)
    setBusy(false)
    if (res.error) return setErreur(res.error)
    router.refresh()
  }

  async function handleSupprimer(id: string, nom: string) {
    if (!confirm(`Supprimer le semestre « ${nom} » ?`)) return
    setBusy(true)
    setErreur(null)
    const res = await supprimerSemestre(id)
    setBusy(false)
    if (res.error) return setErreur(res.error)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      {semestres.length === 0 && !creation && (
        <p className="text-sm text-stone-400">Aucun semestre. Crée le premier ci-dessous.</p>
      )}

      <div className="space-y-2">
        {semestres.map((s) =>
          editId === s.id ? (
            <form
              key={s.id}
              onSubmit={(e) => handleModifier(e, s.id)}
              className="bg-white border border-stone-200 rounded-xl p-4 space-y-3"
            >
              <input name="name" defaultValue={s.name} required placeholder="Nom" className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <input name="start_date" type="date" defaultValue={s.start_date} required className={INPUT} />
                <input name="end_date" type="date" defaultValue={s.end_date} required className={INPUT} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div
              key={s.id}
              className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-stone-900 truncate">{s.name}</p>
                  {s.is_active && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actif</span>
                  )}
                </div>
                <p className="text-sm text-stone-500 mt-0.5">
                  {fmt(s.start_date)} → {fmt(s.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                {!s.is_active && (
                  <button onClick={() => handleActif(s.id)} disabled={busy} className="text-stone-500 hover:text-stone-800 underline disabled:opacity-50">
                    Définir actif
                  </button>
                )}
                <button onClick={() => setEditId(s.id)} className="text-stone-500 hover:text-stone-800 underline">
                  Éditer
                </button>
                <button onClick={() => handleSupprimer(s.id, s.name)} disabled={busy} className="text-red-400 hover:text-red-600 underline disabled:opacity-50">
                  Supprimer
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {creation ? (
        <form onSubmit={handleCreer} className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-stone-900">Nouveau semestre</h4>
          <input name="name" required placeholder="Ex. : Semestre 1" className={INPUT} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Début (lundi de S1)</label>
              <input name="start_date" type="date" required className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1">Fin</label>
              <input name="end_date" type="date" required className={INPUT} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50">
              {busy ? '…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setCreation(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCreation(true)}
          className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
        >
          + Nouveau semestre
        </button>
      )}
    </div>
  )
}
