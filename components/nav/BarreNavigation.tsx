'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { NavTab } from './configNavigation'
import LibelleSuivi from './LibelleSuivi'

function correspond(href: string, pathname: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
}

function ongletActif(tab: NavTab, pathname: string): boolean {
  if (tab.items?.length) return tab.items.some((it) => correspond(it.href, pathname))
  return tab.href ? correspond(tab.href, pathname, tab.exact) : false
}

export default function BarreNavigation({ tabs }: { tabs: NavTab[] }) {
  const pathname = usePathname()
  const [ouvert, setOuvert] = useState<string | null>(null)
  const ref = useRef<HTMLElement>(null)

  // Fermer le menu en cliquant ailleurs.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(null)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Fermer le menu après une navigation : ajustement d'état au changement de route
  // (pattern « You Might Not Need an Effect » — pas de setState dans un effet).
  const [prevPath, setPrevPath] = useState(pathname)
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    setOuvert(null)
  }

  // Onglets de la Barre 1 (en-tête « seuil du module »). Valeurs de la maquette
  // handoff (blocs 4A–4L) transcrites au pixel : padding 7×14, radius 8, gap 6,
  // actif #ECE4D6/#221C16, inactif #6E5A3E (hex exacts, ≠ tokens globals).
  const classeOnglet = (actif: boolean) =>
    `relative font-ui text-[14px] rounded-[8px] px-[14px] py-[7px] transition-colors whitespace-nowrap ${
      actif
        ? 'bg-[#ECE4D6] text-[#221C16] font-medium'
        : 'text-[#6E5A3E] hover:bg-[#ECE4D6]/50'
    }`

  return (
    <nav ref={ref} className="flex items-center gap-[6px]">
      {tabs.map((tab) => {
        const actif = ongletActif(tab, pathname)

        if (!tab.items?.length) {
          return (
            <Link key={tab.label} href={tab.href ?? '#'} aria-current={actif ? 'page' : undefined} className={classeOnglet(actif)}>
              <LibelleSuivi>{tab.label}</LibelleSuivi>
            </Link>
          )
        }

        const estOuvert = ouvert === tab.label
        return (
          <div
            key={tab.label}
            className="relative"
            onKeyDown={(e) => {
              // Échap ferme le menu et rend le focus au déclencheur (a11y clavier).
              if (e.key === 'Escape' && estOuvert) {
                setOuvert(null)
                e.currentTarget.querySelector('button')?.focus()
              }
            }}
          >
            <button
              type="button"
              onClick={() => setOuvert(estOuvert ? null : tab.label)}
              aria-expanded={estOuvert}
              aria-haspopup="menu"
              className={`${classeOnglet(actif)} inline-flex items-center gap-1`}
            >
              {tab.label}
              <span aria-hidden>▾</span>
            </button>
            {estOuvert && (
              <div className="absolute left-0 top-full mt-1 min-w-44 bg-surface border border-bordure rounded-lg shadow-lg py-1 z-20">
                {tab.items.map((it) => {
                  const itemActif = correspond(it.href, pathname)
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      aria-current={itemActif ? 'page' : undefined}
                      className={`font-ui block px-4 py-2 text-sm transition-colors ${
                        itemActif
                          ? 'bg-parchemin-fonce text-encre font-medium'
                          : 'text-encre-douce hover:bg-parchemin-fonce/50 hover:text-encre'
                      }`}
                    >
                      {it.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
