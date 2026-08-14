'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { definirClasseEleve } from './actions'
import type { InscriptionEleve } from './contexte-classe-valeurs'

// ----------------------------------------------------------------------------
// C7·L2 — écran d'entrée d'un module quand le commutateur est sur « Toutes les
// classes ». Le tableau de bord et le calendrier agrègent ; les modules, eux,
// restent par classe (v1) et ne peuvent pas deviner laquelle : plutôt que de
// retomber en silence sur la première (un bi-classe lirait alors le travail
// d'une classe en croyant les voir toutes), le module demande.
//
// Choisir ici SORT de l'état « Toutes » — c'est le même contexte global, donc le
// commutateur de l'en-tête suit, et il reste disponible pour en changer sans
// repasser par le tableau de bord (décision du 13/08).
// ----------------------------------------------------------------------------
export default function ChoixClasseModule({
  inscriptions,
  nomModule,
}: {
  inscriptions: InscriptionEleve[]
  /** Nom affiché du module, pour que la phrase dise de quoi on parle. */
  nomModule: string
}) {
  const router = useRouter()
  const [chargement, setChargement] = useState<string | null>(null)

  async function choisir(id: string) {
    setChargement(id)
    await definirClasseEleve(id)
    router.refresh()
    setChargement(null)
  }

  return (
    <div className="max-w-lg">
      <h3 className="font-titre text-xl text-encre">Quelle classe ?</h3>
      <p className="text-sm text-encre-douce mt-1">
        Tu es sur « Toutes les classes ». {nomModule} se travaille une classe à la fois — choisis
        laquelle.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
        {inscriptions.map((i) => (
          <button
            key={i.id}
            type="button"
            onClick={() => choisir(i.id)}
            disabled={chargement !== null}
            className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl px-4 py-3 text-left transition-colors hover:border-pigment hover:shadow-sm disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-ui font-medium text-encre truncate">{i.classe_nom}</span>
              <span className="text-bordure flex-shrink-0" aria-hidden>
                {chargement === i.id ? '…' : '→'}
              </span>
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-muet mt-4">
        Tu peux changer de classe à tout moment depuis le commutateur, en haut.
      </p>
    </div>
  )
}
