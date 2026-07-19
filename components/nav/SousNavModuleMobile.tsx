'use client'

// =========================================================================
// components/nav/SousNavModuleMobile.tsx
// Sous-navigation d'un module SUR MOBILE (< sm). La Barre 2 de l'en-tête
// (EnTeteSite) est `hidden sm:block` : elle porte les sous-onglets seulement
// en desktop. Ce composant restitue les mêmes sous-onglets (source unique :
// configModules.sousOngletsProf) en dessous de 640px, sinon les sous-pages
// prof (Paramètres, Validation, Diagnostic, ?vue=…) seraient inatteignables.
// Rendu une fois dans la coquille /prof ; renvoie null hors module.
// =========================================================================

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { moduleDepuisPathname, type ModuleConfig } from './configModules'

function Barre({ mod, actif }: { mod: ModuleConfig; actif: (o: { href: string; vue?: string }) => boolean }) {
  const c = mod.couleurs
  return (
    <nav className="sm:hidden flex gap-1 mb-6 border-b border-bordure overflow-x-auto -mx-4 px-4">
      {mod.sousOngletsProf.map((o) => {
        const est = actif(o)
        return (
          <Link
            key={o.href}
            href={o.href}
            aria-current={est ? 'page' : undefined}
            className="font-ui whitespace-nowrap rounded-t-lg px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
            style={{
              fontWeight: est ? 500 : 400,
              background: est ? c.ongletActifFond : 'transparent',
              color: est ? c.ongletActifTexte : c.ongletInactif,
              borderBottom: `2px solid ${est ? c.ongletActifTexte : 'transparent'}`,
            }}
          >
            {o.label}
          </Link>
        )
      })}
    </nav>
  )
}

// Onglets pilotés par `?vue=` (Scriptorium) — useSearchParams isolé sous Suspense.
function BarreParam({ mod }: { mod: ModuleConfig }) {
  const vue = useSearchParams().get('vue') ?? mod.sousOngletsProf[0]?.vue
  // Cf. EnTeteSite : actif = la vue courante appartient au groupe `vues` (repli `[vue]`).
  const estActif = (o: { vue?: string; vues?: string[] }) => {
    const groupe = o.vues ?? (o.vue ? [o.vue] : [])
    return vue != null && groupe.includes(vue)
  }
  return <Barre mod={mod} actif={estActif} />
}

export default function SousNavModuleMobile() {
  const pathname = usePathname()
  const mod = moduleDepuisPathname(pathname)
  if (!mod || mod.sousOngletsProf.length === 0) return null

  if (mod.sousOngletsProf.some((o) => o.vue)) {
    return (
      <Suspense fallback={<Barre mod={mod} actif={(o) => o.vue === mod.sousOngletsProf[0]?.vue} />}>
        <BarreParam mod={mod} />
      </Suspense>
    )
  }

  const actifHref = mod.sousOngletsProf.reduce<string | null>((best, o) => {
    const match = pathname === o.href || pathname.startsWith(o.href + '/')
    return match && o.href.length > (best?.length ?? -1) ? o.href : best
  }, null)
  return <Barre mod={mod} actif={(o) => o.href === actifHref} />
}
