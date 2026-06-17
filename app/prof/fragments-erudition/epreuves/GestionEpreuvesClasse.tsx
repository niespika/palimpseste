'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { assignerEpreuveClasse, retirerEpreuveClasse } from '../essai-actions'

interface EpreuveAssignee { id: string; titre: string; date_epreuve: string; depots_ouverts: boolean }
interface EpreuveDispo { id: string; titre: string }

interface Props {
  classeId: string
  classeNom: string
  assignees: EpreuveAssignee[]
  disponibles: EpreuveDispo[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function GestionEpreuvesClasse({ classeId, classeNom, assignees, disponibles }: Props) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [ajout, setAjout] = useState(false)
  const [epreuveId, setEpreuveId] = useState('')
  const [date, setDate] = useState('')

  async function handleAssigner() {
    if (!epreuveId || !date) return
    setChargement(true)
    await assignerEpreuveClasse(epreuveId, classeId, date)
    setChargement(false)
    setAjout(false); setEpreuveId(''); setDate('')
    router.refresh()
  }

  async function handleRetirer(id: string) {
    setChargement(true)
    await retirerEpreuveClasse(id, classeId)
    setChargement(false)
    router.refresh()
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <h3 className="font-medium text-stone-900">{classeNom}</h3>
        <p className="text-xs text-stone-400 mt-0.5">Épreuves de cette classe · date et ouverture propres</p>
      </div>

      {assignees.length === 0 ? (
        <div className="px-5 py-6 text-sm text-stone-400">Aucune épreuve assignée à cette classe.</div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {assignees.map(e => (
            <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <Link href={`/prof/fragments-erudition/epreuves/${e.id}?classe=${classeId}`} className="min-w-0 group">
                <p className="text-sm font-medium text-stone-800 group-hover:text-blue-700 group-hover:underline">{e.titre}</p>
                <p className="text-xs text-stone-400 mt-0.5">{formatDate(e.date_epreuve)}</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${e.depots_ouverts ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                  {e.depots_ouverts ? 'Ouverte' : 'Fermée'}
                </span>
                <button
                  onClick={() => handleRetirer(e.id)}
                  disabled={chargement}
                  title="Retirer cette épreuve de la classe"
                  className="text-xs text-stone-400 hover:text-red-600 disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Assigner une épreuve existante à cette classe */}
      {disponibles.length > 0 && (
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50">
          {ajout ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={epreuveId}
                onChange={e => setEpreuveId(e.target.value)}
                className="px-2 py-1.5 border border-stone-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
              >
                <option value="">Épreuve…</option>
                {disponibles.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
              </select>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-2 py-1.5 border border-stone-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
              />
              <button
                onClick={handleAssigner}
                disabled={chargement || !epreuveId || !date}
                className="bg-stone-800 text-white px-3 py-1.5 rounded text-sm hover:bg-stone-700 disabled:opacity-50"
              >
                {chargement ? '…' : 'Assigner'}
              </button>
              <button onClick={() => setAjout(false)} className="text-sm text-stone-500 hover:text-stone-700">Annuler</button>
            </div>
          ) : (
            <button onClick={() => setAjout(true)} className="text-sm text-stone-600 hover:text-stone-900">
              + Assigner une épreuve existante
            </button>
          )}
        </div>
      )}
    </div>
  )
}
