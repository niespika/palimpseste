'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Semestre, Holiday } from '@/types/calendrier'
import { creerHoliday, modifierHoliday, supprimerHoliday, regenererSemaines } from './actions'

const INPUT =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function GestionHolidays({
  semestres,
  selectedId,
  holidays,
}: {
  semestres: Semestre[]
  selectedId: string | null
  holidays: Holiday[]
}) {
  const router = useRouter()
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [genMsg, setGenMsg] = useState<string | null>(null)

  if (semestres.length === 0) {
    return <p className="text-sm text-muet">Crée d&apos;abord un semestre.</p>
  }

  async function handleRegenerer() {
    if (!selectedId) return
    setBusy(true)
    setErreur(null)
    setGenMsg(null)
    const res = await regenererSemaines(selectedId)
    setBusy(false)
    if (res.error) return setErreur(res.error)
    const d = res.data!
    const parts = [`${d.ajoutees} ajoutée(s)`, `${d.revues} mise(s) à jour`]
    if (d.horsCalendrier > 0) parts.push(`${d.horsCalendrier} hors calendrier (conservée(s))`)
    setGenMsg(`Semaines régénérées : ${parts.join(', ')}.`)
    router.refresh()
  }

  async function handleCreer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedId) return
    setBusy(true)
    setErreur(null)
    const form = e.currentTarget
    const f = new FormData(form)
    const res = await creerHoliday({
      semester_id: selectedId,
      label: f.get('label') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    form.reset()
    router.refresh()
  }

  async function handleModifier(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault()
    setBusy(true)
    setErreur(null)
    const f = new FormData(e.currentTarget)
    const res = await modifierHoliday(id, {
      label: f.get('label') as string,
      start_date: f.get('start_date') as string,
      end_date: f.get('end_date') as string,
    })
    setBusy(false)
    if (res.error) return setErreur(res.error)
    setEditId(null)
    router.refresh()
  }

  async function handleSupprimer(id: string, label: string) {
    if (!confirm(`Supprimer « ${label} » ?`)) return
    setBusy(true)
    setErreur(null)
    const res = await supprimerHoliday(id)
    setBusy(false)
    if (res.error) return setErreur(res.error)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {semestres.length > 1 && (
        <select
          value={selectedId ?? ''}
          onChange={(e) => router.push(`/prof/calendrier/config?sem=${e.target.value}`)}
          className="px-3 py-2 border border-bordure rounded-lg text-sm bg-surface"
        >
          {semestres.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.is_active ? ' (actif)' : ''}
            </option>
          ))}
        </select>
      )}

      {erreur && <p className="text-retard text-sm">{erreur}</p>}

      <div className="space-y-2">
        {holidays.length === 0 && (
          <p className="text-sm text-muet">Aucune période de vacances pour ce semestre.</p>
        )}
        {holidays.map((h) =>
          editId === h.id ? (
            <form
              key={h.id}
              onSubmit={(e) => handleModifier(e, h.id)}
              className="bg-surface border border-bordure rounded-xl p-4 space-y-3"
            >
              <input name="label" defaultValue={h.label} required placeholder="Libellé" className={INPUT} />
              <div className="grid grid-cols-2 gap-3">
                <input name="start_date" type="date" defaultValue={h.start_date} required className={INPUT} />
                <input name="end_date" type="date" defaultValue={h.end_date} required className={INPUT} />
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
              key={h.id}
              className="bg-surface border border-bordure rounded-xl px-5 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-encre truncate">{h.label}</p>
                <p className="text-sm text-muet mt-0.5">
                  {fmt(h.start_date)} → {fmt(h.end_date)}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                <button onClick={() => setEditId(h.id)} className="text-muet hover:text-encre underline">
                  Éditer
                </button>
                <button onClick={() => handleSupprimer(h.id, h.label)} disabled={busy} className="text-retard hover:opacity-80 underline disabled:opacity-50">
                  Supprimer
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <form onSubmit={handleCreer} className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-medium text-encre">Ajouter une période</h4>
        <input name="label" required placeholder="Ex. : Vacances de Noël" className={INPUT} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muet mb-1">Début</label>
            <input name="start_date" type="date" required className={INPUT} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muet mb-1">Fin</label>
            <input name="end_date" type="date" required className={INPUT} />
          </div>
        </div>
        <button type="submit" disabled={busy} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {busy ? '…' : 'Ajouter'}
        </button>
      </form>

      {/* (Re)génération des semaines de travail à partir du semestre + vacances. */}
      <div className="bg-parchemin-fonce border border-bordure rounded-xl p-4">
        <h4 className="text-sm font-medium text-encre">Semaines du semestre</h4>
        <p className="text-xs text-muet mt-1 mb-3">
          Génère / met à jour les semaines de travail (lundi → dimanche), numérotées
          en continu en sautant les vacances. Sans suppression : les semaines existantes
          non alignées sont conservées et signalées.
        </p>
        <button
          onClick={handleRegenerer}
          disabled={busy}
          className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          {busy ? '…' : 'Régénérer les semaines'}
        </button>
        {genMsg && <p className="text-ok text-sm mt-2">{genMsg}</p>}
      </div>
    </div>
  )
}
