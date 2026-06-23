'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { NavTab } from './configNavigation'

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

  // Fermer le menu après une navigation.
  useEffect(() => {
    setOuvert(null)
  }, [pathname])

  const classeOnglet = (actif: boolean) =>
    `px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${
      actif
        ? 'bg-stone-200 text-stone-900 font-medium'
        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
    }`

  return (
    <nav ref={ref} className="flex flex-wrap items-center gap-1">
      {tabs.map((tab) => {
        const actif = ongletActif(tab, pathname)

        if (!tab.items?.length) {
          return (
            <Link key={tab.label} href={tab.href ?? '#'} className={classeOnglet(actif)}>
              {tab.label}
            </Link>
          )
        }

        const estOuvert = ouvert === tab.label
        return (
          <div key={tab.label} className="relative">
            <button
              type="button"
              onClick={() => setOuvert(estOuvert ? null : tab.label)}
              aria-expanded={estOuvert}
              className={`${classeOnglet(actif)} inline-flex items-center gap-1`}
            >
              {tab.label}
              <span className="text-stone-400 text-[10px]" aria-hidden>▾</span>
            </button>
            {estOuvert && (
              <div className="absolute left-0 top-full mt-1 min-w-44 bg-white border border-stone-200 rounded-lg shadow-lg py-1 z-20">
                {tab.items.map((it) => {
                  const itemActif = correspond(it.href, pathname)
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        itemActif
                          ? 'bg-stone-100 text-stone-900 font-medium'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
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
