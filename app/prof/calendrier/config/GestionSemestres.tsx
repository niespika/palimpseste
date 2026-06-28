'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Semestre } from '@/types/calendrier'
import { formatJour } from '@/utils/fuseau'
import {
  creerSemestre,
  modifierSemestre,
  definirSemestreActif,
  supprimerSemestre,
} from './actions'

const INPUT =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment'

const fmt = (d: string) => formatJour(d, { day: 'numeric', month: 'short', year: 'numeric' })

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
      {erreur && <p className="text-retard text-sm">{erreur}</p>}

      {semestres.length === 0 && !creation && (
        <p className="text-sm text-muet">Aucun semestre. Crée le premier ci-dessous.</p>
      )}

      <div className="space-y-2">
        {semestres.map((s) =>
          editId === s.id ? (
            <form
              key={s.id}
              onSubmit={(e) => handleModifier(e, s.id)}
              className="bg-surface border border-bordure rounded-xl p-4 space-y-3"
            >
              <input name="name" defaultValue={s.name} required placeholder="Nom" className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <input name="start_date" type="date" defaultValue={s.start_date} required className={INPUT} />
                <input name="end_date" type="date" defaultValue={s.end_date} required className={INPUT} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEditId(null)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div
              key={s.id}
              className="bg-surface border border-bordure rounded-xl px-5 py-4 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-encre truncate">{s.name}</p>
                  {s.is_active && (
                    <span className="text-xs bg-ok-teinte text-ok px-2 py-0.5 rounded-full">Actif</span>
                  )}
                </div>
                <p className="text-sm text-muet mt-0.5">
                  {fmt(s.start_date)} → {fmt(s.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                {!s.is_active && (
                  <button onClick={() => handleActif(s.id)} disabled={busy} className="text-muet hover:text-encre underline disabled:opacity-50">
                    Définir actif
                  </button>
                )}
                <button onClick={() => setEditId(s.id)} className="text-muet hover:text-encre underline">
                  Éditer
                </button>
                <button onClick={() => handleSupprimer(s.id, s.name)} disabled={busy} className="text-retard hover:opacity-80 underline disabled:opacity-50">
                  Supprimer
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {creation ? (
        <form onSubmit={handleCreer} className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-medium text-encre">Nouveau semestre</h4>
          <input name="name" required placeholder="Ex. : Semestre 1" className={INPUT} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muet mb-1">Début (lundi de S1)</label>
              <input name="start_date" type="date" required className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muet mb-1">Fin</label>
              <input name="end_date" type="date" required className={INPUT} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
              {busy ? '…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setCreation(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCreation(true)}
          className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
        >
          + Nouveau semestre
        </button>
      )}
    </div>
  )
}
