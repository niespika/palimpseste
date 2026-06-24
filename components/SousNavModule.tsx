'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface Onglet {
  href: string
  label: string
}

// Sous-navigation d'un module (onglets). L'onglet actif garde en permanence le
// « halo » (bg-pigment-teinte) + un filet pigment sous l'onglet, pour indiquer
// clairement où l'on se trouve. Couleur héritée du module via data-module.
export default function SousNavModule({ onglets }: { onglets: Onglet[] }) {
  const pathname = usePathname()

  // Onglet actif = celui dont le href est le plus long préfixe du chemin courant
  // (évite que l'onglet racine s'active à tort sur une sous-page).
  const actifHref = onglets.reduce<string | null>((best, o) => {
    const match = pathname === o.href || pathname.startsWith(o.href + '/')
    return match && o.href.length > (best?.length ?? -1) ? o.href : best
  }, null)

  return (
    <nav className="flex gap-1 mb-6 border-b border-bordure pb-0 overflow-x-auto">
      {onglets.map(({ href, label }) => {
        const actif = href === actifHref
        return (
          <Link
            key={href}
            href={href}
            aria-current={actif ? 'page' : undefined}
            className={`font-ui px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
              actif
                ? 'bg-pigment-teinte text-encre border-liseret font-medium'
                : 'text-encre-douce hover:text-encre hover:bg-pigment-teinte border-transparent'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
