'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirClasseEleve } from './actions'
import type { InscriptionEleve } from './contexte-classe'

// Commutateur de contexte de classe (élève bi-classe). Masqué pour un élève
// mono-classe (cf. spec Lot 9).
//   - variant 'pills' : groupe de boutons (bandeau mobile — comportement historique).
//   - variant 'chip'  : puce déroulante « 2de B ▾ » (Barre 1 de l'en-tête desktop).
export default function SelecteurClasseEleve({
  inscriptions,
  activeId,
  variant = 'pills',
}: {
  inscriptions: InscriptionEleve[]
  activeId: string
  variant?: 'pills' | 'chip'
}) {
  const router = useRouter()
  const [chargement, setChargement] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  if (inscriptions.length < 2) return null

  async function choisir(id: string) {
    if (id === activeId) return
    setChargement(id)
    await definirClasseEleve(id)
    router.refresh()
    setChargement(null)
  }

  if (variant === 'chip') {
    return (
      <span className="relative inline-flex items-center transition-opacity" style={{ opacity: enCours ? 0.6 : 1 }}>
        <select
          value={activeId}
          onChange={(e) => demarrer(() => choisir(e.target.value))}
          disabled={enCours}
          aria-label="Classe"
          className="font-ui text-[13px] max-w-[9rem] truncate appearance-none rounded-[7px] pl-[10px] pr-[24px] py-[4px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-pigment"
          style={{ color: '#5A4632', background: '#F6F1E7', border: '1px solid #E4DBC9' }}
        >
          {inscriptions.map((i) => (
            <option key={i.id} value={i.id}>{i.classe_nom}</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-[9px] text-[10px]" style={{ color: '#5A4632' }}>▾</span>
      </span>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1 bg-parchemin-fonce rounded-xl p-1">
      {inscriptions.map((i) => {
        const actif = i.id === activeId
        return (
          <button
            key={i.id}
            onClick={() => choisir(i.id)}
            disabled={chargement !== null}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              actif ? 'bg-bouton text-surface shadow-sm' : 'text-muet hover:text-encre'
            }`}
          >
            {chargement === i.id ? '…' : i.classe_nom}
          </button>
        )
      })}
    </div>
  )
}
