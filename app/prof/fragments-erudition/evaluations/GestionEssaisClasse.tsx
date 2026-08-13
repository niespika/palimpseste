'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { assignerEssaiClasse, retirerEssaiClasse } from '../essai-actions'
import { formatJour } from '@/utils/fuseau'

interface EssaiAssigne { id: string; titre: string; date_essai: string; depots_ouverts: boolean }
interface EssaiDispo { id: string; titre: string }

interface Props {
  classeId: string
  classeNom: string
  assignees: EssaiAssigne[]
  disponibles: EssaiDispo[]
}

const formatDate = (d: string) => formatJour(d, { day: 'numeric', month: 'long', year: 'numeric' })

export default function GestionEssaisClasse({ classeId, classeNom, assignees, disponibles }: Props) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [ajout, setAjout] = useState(false)
  const [epreuveId, setEpreuveId] = useState('')
  const [date, setDate] = useState('')

  async function handleAssigner() {
    if (!epreuveId || !date) return
    setChargement(true)
    await assignerEssaiClasse(epreuveId, classeId, date)
    setChargement(false)
    setAjout(false); setEpreuveId(''); setDate('')
    router.refresh()
  }

  async function handleRetirer(id: string) {
    setChargement(true)
    await retirerEssaiClasse(id, classeId)
    setChargement(false)
    router.refresh()
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-bordure">
        <h3 className="font-medium text-encre">{classeNom}</h3>
        <p className="text-xs text-muet mt-0.5">Essais de cette classe · date et ouverture propres</p>
      </div>

      {assignees.length === 0 ? (
        <div className="px-5 py-6 text-sm text-muet">Aucun essai assigné à cette classe.</div>
      ) : (
        <ul className="divide-y divide-bordure">
          {assignees.map(e => (
            <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <Link href={`/prof/fragments-erudition/essais/${e.id}?classe=${classeId}`} className="min-w-0 group">
                <p className="text-sm font-medium text-encre group-hover:text-info group-hover:underline">{e.titre}</p>
                <p className="text-xs text-muet mt-0.5">{formatDate(e.date_essai)}</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${e.depots_ouverts ? 'bg-ok-teinte text-ok' : 'bg-parchemin-fonce text-muet'}`}>
                  {e.depots_ouverts ? 'Ouverte' : 'Fermée'}
                </span>
                <button
                  onClick={() => handleRetirer(e.id)}
                  disabled={chargement}
                  title="Retirer cet essai de la classe"
                  className="text-xs text-muet hover:text-retard disabled:opacity-50"
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Assigner un essai existant à cette classe */}
      {disponibles.length > 0 && (
        <div className="px-5 py-3 border-t border-bordure bg-parchemin-fonce">
          {ajout ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={epreuveId}
                onChange={e => setEpreuveId(e.target.value)}
                className="px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
              >
                <option value="">Essai…</option>
                {disponibles.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
              </select>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
              />
              <button
                onClick={handleAssigner}
                disabled={chargement || !epreuveId || !date}
                className="bg-bouton text-surface px-3 py-1.5 rounded text-sm hover:opacity-90 disabled:opacity-50"
              >
                {chargement ? '…' : 'Assigner'}
              </button>
              <button onClick={() => setAjout(false)} className="text-sm text-muet hover:text-encre-douce">Annuler</button>
            </div>
          ) : (
            <button onClick={() => setAjout(true)} className="text-sm text-encre-douce hover:text-encre">
              + Assigner un essai existant
            </button>
          )}
        </div>
      )}
    </div>
  )
}
