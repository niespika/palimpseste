'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { definirClasseEleve } from './actions'
import { VALEUR_TOUTES, type InscriptionEleve } from './contexte-classe-valeurs'

// Commutateur de contexte de classe (élève bi-classe). Masqué pour un élève
// mono-classe (cf. spec Lot 9).
//   - variant 'pills' : groupe de boutons (bandeau mobile — comportement historique).
//   - variant 'chip'  : puce déroulante « 2de B ▾ » (Barre 1 de l'en-tête desktop).
//
// C7·L2 — trois états : « Toutes les classes » précède les classes. Il reste
// disponible DANS un module (décision du 13/08) : l'élève qui a choisi sa classe
// à l'entrée doit pouvoir en changer sans repasser par le tableau de bord.
const LABEL_TOUTES = 'Toutes les classes'

export default function SelecteurClasseEleve({
  inscriptions,
  activeId,
  variant = 'pills',
}: {
  inscriptions: InscriptionEleve[]
  /** Id d'inscription, ou `VALEUR_TOUTES` pour l'état agrégé. */
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
          <option value={VALEUR_TOUTES}>{LABEL_TOUTES}</option>
          {inscriptions.map((i) => (
            <option key={i.id} value={i.id}>{i.classe_nom}</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-[9px] text-[10px]" style={{ color: '#5A4632' }}>▾</span>
      </span>
    )
  }

  // Bandeau mobile : « Toutes » suffit à côté des noms de classe, et le libellé
  // long ferait passer la rangée sur deux lignes sous 375px.
  const entrees = [
    { cle: VALEUR_TOUTES, label: 'Toutes' },
    ...inscriptions.map((i) => ({ cle: i.id, label: i.classe_nom })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-1 bg-parchemin-fonce rounded-xl p-1">
      {entrees.map((e) => {
        const actif = e.cle === activeId
        return (
          <button
            key={e.cle}
            onClick={() => choisir(e.cle)}
            disabled={chargement !== null}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
              actif ? 'bg-bouton text-surface shadow-sm' : 'text-muet hover:text-encre'
            }`}
          >
            {chargement === e.cle ? '…' : e.label}
          </button>
        )
      })}
    </div>
  )
}
