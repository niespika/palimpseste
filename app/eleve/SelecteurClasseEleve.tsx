'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirClasseEleve } from './actions'
import type { InscriptionEleve } from './contexte-classe'

// Commutateur de contexte de classe (élève bi-classe). Masqué pour un élève
// mono-classe (cf. spec Lot 9).
export default function SelecteurClasseEleve({ inscriptions, activeId }: { inscriptions: InscriptionEleve[]; activeId: string }) {
  const router = useRouter()
  const [chargement, setChargement] = useState<string | null>(null)
  if (inscriptions.length < 2) return null

  async function choisir(id: string) {
    if (id === activeId) return
    setChargement(id)
    await definirClasseEleve(id)
    router.refresh()
    setChargement(null)
  }

  return (
    <div className="flex flex-wrap items-center gap-1 bg-stone-100 rounded-xl p-1">
      {inscriptions.map((i) => {
        const actif = i.id === activeId
        return (
          <button
            key={i.id}
            onClick={() => choisir(i.id)}
            disabled={chargement !== null}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              actif ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {chargement === i.id ? '…' : i.classe_nom}
          </button>
        )
      })}
    </div>
  )
}
