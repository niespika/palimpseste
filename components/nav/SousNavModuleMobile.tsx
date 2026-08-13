'use client'

// =========================================================================
// components/nav/SousNavModuleMobile.tsx
// Sous-navigation d'un module SUR MOBILE (< sm). La Barre 2 de l'en-tête
// (EnTeteSite) est `hidden sm:block` : elle porte les sous-onglets seulement
// en desktop. Ce composant restitue les mêmes sous-onglets (source unique :
// configModules) en dessous de 640px, sinon les sous-pages seraient
// inatteignables. Rendu une fois dans la coquille du rôle ; null hors module.
//
// C8·L3 : le composant prend un `role`. Côté élève, Fragments a désormais ses
// onglets (Écrit · Oral · Essai [· Synthèse]) et l'élève est sur téléphone —
// cette barre est donc sa navigation principale dans le module.
// =========================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  moduleDepuisPathname,
  ongletActifParRoute,
  sousOngletsPour,
  vueDefaut,
  type ModuleConfig,
  type SousOnglet,
} from './configModules'
import OngletsFragmentsEleve, { classePastille, type PastilleOnglet } from './OngletsFragmentsEleve'

interface BarreProps {
  mod: ModuleConfig
  onglets: SousOnglet[]
  actif: (o: SousOnglet) => boolean
  pastille?: PastilleOnglet
}

function Barre({ mod, onglets, actif, pastille }: BarreProps) {
  const c = mod.couleurs
  return (
    <nav className="sm:hidden flex gap-1 mb-6 border-b border-bordure overflow-x-auto -mx-4 px-4">
      {onglets.map((o) => {
        const est = actif(o)
        const p = pastille?.(o) ?? null
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={est ? 'page' : undefined}
            // min-h 44px : cible tactile (l'élève est sur téléphone).
            className="font-ui whitespace-nowrap rounded-t-lg px-4 min-h-[44px] inline-flex items-center gap-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
            style={{
              fontWeight: est ? 500 : 400,
              background: est ? c.ongletActifFond : 'transparent',
              color: est ? c.ongletActifTexte : c.ongletInactif,
              borderBottom: `2px solid ${est ? c.ongletActifTexte : 'transparent'}`,
            }}
          >
            {o.label}
            {p && (
              <>
                <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${classePastille(p.couleur)}`} />
                <span className="sr-only">— {p.libelle}</span>
              </>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// Onglets pilotés par `?vue=` (Scriptorium, Fragments élève) — useSearchParams
// isolé sous Suspense.
function BarreParam({ mod, onglets, pastille }: Omit<BarreProps, 'actif'>) {
  const vue = useSearchParams().get('vue') ?? vueDefaut(onglets)
  // Cf. EnTeteSite : actif = la vue courante appartient au groupe `vues` (repli `[vue]`).
  const estActif = (o: SousOnglet) => {
    const groupe = o.vues ?? (o.vue ? [o.vue] : [])
    return vue != null && groupe.includes(vue)
  }
  return <Barre mod={mod} onglets={onglets} actif={estActif} pastille={pastille} />
}

export default function SousNavModuleMobile({ role = 'prof' }: { role?: 'prof' | 'eleve' }) {
  const pathname = usePathname()
  const mod = moduleDepuisPathname(pathname)
  if (!mod) return null

  const onglets = sousOngletsPour(mod, role)
  if (onglets.length === 0) return null

  const parParam = onglets.some((o) => !!o.vue)

  // Fragments élève : la liste (3 ou 4 onglets) et les pastilles viennent de la base.
  if (mod.cle === 'fragments' && role === 'eleve') {
    return (
      <OngletsFragmentsEleve
        base={onglets}
        rendu={(liste, pastille) => (
          <Suspense fallback={<Barre mod={mod} onglets={liste} actif={(o) => o.vue === vueDefaut(liste)} pastille={pastille} />}>
            <BarreParam mod={mod} onglets={liste} pastille={pastille} />
          </Suspense>
        )}
      />
    )
  }

  if (parParam) {
    return (
      <Suspense fallback={<Barre mod={mod} onglets={onglets} actif={(o) => o.vue === vueDefaut(onglets)} />}>
        <BarreParam mod={mod} onglets={onglets} />
      </Suspense>
    )
  }

  const actifHref = ongletActifParRoute(onglets, pathname)
  return <Barre mod={mod} onglets={onglets} actif={(o) => o.href === actifHref} />
}
