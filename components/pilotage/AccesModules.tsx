'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Pastille, { type ModuleSceau } from '@/components/Pastille'
import Interrupteur from './Interrupteur'
import FeuillePanneau from './FeuillePanneau'
import { definirModulesClasse } from '@/app/prof/classes/actions'

export interface ModuleAcces {
  id: string // id DB du module
  slug: string
  sceau: ModuleSceau
  nom: string
  description: string | null
  accessible: boolean
}

interface Props {
  classeId: string
  modules: ModuleAcces[]
  /** Actions supplémentaires posées à droite de la barre (ex. gestion élèves). */
  children?: React.ReactNode
}

// Barre « MODULES ACCESSIBLES » : chips à bascule rapide + panneau « Gérer les
// accès » (dialog desktop / feuille mobile). Source de vérité unique :
// `classe_modules` via `definirModulesClasse` (set complet) ; après écriture on
// `router.refresh()` pour resynchroniser chips, panneau ET colonnes de la matrice.
export default function AccesModules({ classeId, modules, children }: Props) {
  const router = useRouter()
  const verite = modules.filter((m) => m.accessible).map((m) => m.id).join(',')
  const [accessibles, setAccessibles] = useState<Set<string>>(
    () => new Set(modules.filter((m) => m.accessible).map((m) => m.id)),
  )
  // Resynchronise l'état local sur la vérité serveur quand les props changent
  // (router.refresh recharge la page) : évite tout désalignement sur écriture
  // concurrente/échouée. Pattern « ajuster l'état au rendu » (pas d'effet).
  const [veriteVue, setVeriteVue] = useState(verite)
  if (verite !== veriteVue) {
    setVeriteVue(verite)
    setAccessibles(new Set(modules.filter((m) => m.accessible).map((m) => m.id)))
  }
  const [pending, setPending] = useState(false)
  const [panneau, setPanneau] = useState(false)
  const [brouillon, setBrouillon] = useState<Set<string>>(new Set())

  async function persister(prochains: Set<string>) {
    setPending(true)
    const fd = new FormData()
    fd.append('classeId', classeId)
    prochains.forEach((id) => fd.append('moduleIds', id))
    await definirModulesClasse(fd)
    setPending(false)
    router.refresh()
  }

  async function basculerChip(id: string) {
    const prochains = new Set(accessibles)
    if (prochains.has(id)) prochains.delete(id)
    else prochains.add(id)
    setAccessibles(prochains)
    await persister(prochains)
  }

  function ouvrirPanneau() {
    setBrouillon(new Set(accessibles))
    setPanneau(true)
  }

  function basculerBrouillon(id: string) {
    setBrouillon((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function enregistrer() {
    setAccessibles(new Set(brouillon))
    setPanneau(false)
    await persister(brouillon)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 bg-surface border border-bordure rounded-xl px-3 py-2.5">
        <span className="font-ui text-[11px] tracking-[0.06em] text-muet">MODULES ACCESSIBLES</span>
        {modules.map((m) => {
          const actif = accessibles.has(m.id)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => basculerChip(m.id)}
              disabled={pending}
              aria-pressed={actif}
              aria-label={`Accès ${m.nom}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-ui text-xs transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
                actif
                  ? 'bg-ok-teinte border border-ok/30 text-encre'
                  : 'bg-parchemin border border-dashed border-bordure text-muet'
              }`}
            >
              <span data-module={m.sceau} className="w-2 h-2 rounded-full bg-pigment" aria-hidden />
              {m.nom}
              <span className={actif ? 'text-ok font-bold' : 'text-muet'} aria-hidden>{actif ? '✓' : '☐'}</span>
            </button>
          )
        })}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={ouvrirPanneau}
            className="font-ui text-xs text-encre bg-surface border border-bordure rounded-lg px-3 py-1.5 hover:bg-parchemin-fonce transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            ⚙ Gérer les accès
          </button>
          {children}
        </div>
      </div>

      {panneau && (
        <FeuillePanneau
          titre="Modules accessibles"
          sousTitre="Les mondes ouverts à cette classe."
          onFermer={() => setPanneau(false)}
        >
          <div className="divide-y divide-bordure">
            {modules.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <Pastille module={m.sceau} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="font-marque text-sm font-semibold tracking-wide" data-module={m.sceau}>
                    <span className="text-pigment">{m.nom.toUpperCase()}</span>
                  </p>
                  {m.description && <p className="font-corps text-sm text-encre-douce truncate">{m.description}</p>}
                </div>
                <Interrupteur
                  checked={brouillon.has(m.id)}
                  onChange={() => basculerBrouillon(m.id)}
                  label={`Accès ${m.nom}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setPanneau(false)}
              className="font-ui text-sm text-encre-douce px-3 py-1.5 rounded-lg hover:bg-parchemin-fonce focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={enregistrer}
              disabled={pending}
              className="font-ui text-sm bg-bouton text-surface px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
            >
              Enregistrer
            </button>
          </div>
        </FeuillePanneau>
      )}
    </>
  )
}
