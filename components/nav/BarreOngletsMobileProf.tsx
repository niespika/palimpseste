'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { NAV_PROF, type NavTab } from './configNavigation'
import { deconnexion } from '@/app/prof/actions'

// ----------------------------------------------------------------------------
// Barre d'onglets fixe en bas — navigation tactile de l'espace prof (Option A).
// Visible uniquement < sm (le header à déroulants reprend la main ≥ sm).
//
//   • 4 onglets : Tableau de bord · Pilotage · Modules · Moi.
//   • « Tableau de bord » = lien direct. « Pilotage » / « Modules » ouvrent une
//     feuille (bottom-sheet) peuplée depuis NAV_PROF (source de vérité unique).
//     « Moi » ouvre une feuille profil + déconnexion.
//   • Onglet actif : text-encre + pictogramme plein. Inactif : text-muet, trait.
//   • Cibles tactiles ≥ 44 px ; safe-area iOS ; print:hidden.
//   • Icônes : SVG inline (pas de dépendance, pas d'emoji).
// ----------------------------------------------------------------------------

function correspond(href: string, pathname: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
}

// Récupère un groupe de NAV_PROF par son libellé (robuste au réordonnancement).
function groupe(label: string): NavTab | undefined {
  return NAV_PROF.find((t) => t.label === label)
}

type Feuille = 'Pilotage' | 'Modules' | 'Moi' | null

type IconeProps = { actif: boolean }

function commun(actif: boolean) {
  return {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: actif ? 'currentColor' : 'none',
    stroke: 'currentColor',
    strokeWidth: actif ? 1.5 : 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

function IconeTableau({ actif }: IconeProps) {
  return (
    <svg {...commun(actif)}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
    </svg>
  )
}

function IconePilotage({ actif }: IconeProps) {
  // Curseurs/réglages — la « console de pilotage ».
  return (
    <svg {...commun(actif)}>
      <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="8" cy="16" r="2.2" />
    </svg>
  )
}

function IconeModules({ actif }: IconeProps) {
  return (
    <svg {...commun(actif)}>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  )
}

function IconeMoi({ actif }: IconeProps) {
  return (
    <svg {...commun(actif)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0z" />
    </svg>
  )
}

export default function BarreOngletsMobileProf({ nom }: { nom?: string }) {
  const pathname = usePathname()
  const [feuille, setFeuille] = useState<Feuille>(null)

  const pilotage = groupe('Pilotage')
  const modules = groupe('Modules')

  const tableauActif = correspond('/prof', pathname, true)
  const pilotageActif = !!pilotage?.items?.some((it) => correspond(it.href, pathname))
  const modulesActif = !!modules?.items?.some((it) => correspond(it.href, pathname))

  // Description d'un onglet pour le rendu uniforme de la barre.
  const onglets: { cle: string; label: string; Icone: (p: IconeProps) => React.ReactNode; actif: boolean; href?: string; ouvre?: Feuille }[] = [
    { cle: 'tableau', label: 'Tableau', Icone: IconeTableau, actif: tableauActif, href: '/prof' },
    { cle: 'pilotage', label: 'Pilotage', Icone: IconePilotage, actif: pilotageActif || feuille === 'Pilotage', ouvre: 'Pilotage' },
    { cle: 'modules', label: 'Modules', Icone: IconeModules, actif: modulesActif || feuille === 'Modules', ouvre: 'Modules' },
    { cle: 'moi', label: 'Moi', Icone: IconeMoi, actif: feuille === 'Moi', ouvre: 'Moi' },
  ]

  // Items de la feuille ouverte (Pilotage / Modules).
  const feuilleGroupe = feuille === 'Pilotage' ? pilotage : feuille === 'Modules' ? modules : undefined

  return (
    <>
      {/* Feuille (bottom-sheet) — overlay au-dessus de la barre. */}
      {feuille && (
        <div
          className="sm:hidden fixed inset-0 z-30 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={feuille}
          onClick={() => setFeuille(null)}
        >
          <div className="absolute inset-0 bg-encre/30" />
          <div
            className="absolute inset-x-0 bottom-0 bg-surface border-t border-bordure rounded-t-2xl shadow-lg pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="h-1 w-10 rounded-full bg-bordure" aria-hidden />
            </div>
            <p className="font-ui text-xs uppercase tracking-wide text-muet px-5 pt-1 pb-2">{feuille}</p>

            {feuilleGroupe ? (
              <ul className="pb-3">
                {feuilleGroupe.items?.map((it) => {
                  const actif = correspond(it.href, pathname)
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        onClick={() => setFeuille(null)}
                        aria-current={actif ? 'page' : undefined}
                        className={`font-ui flex items-center min-h-[48px] px-5 text-base transition-colors ${
                          actif ? 'bg-parchemin-fonce text-encre font-medium' : 'text-encre-douce hover:bg-parchemin-fonce/60'
                        }`}
                      >
                        {it.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              // Feuille « Moi ».
              <div className="pb-3">
                {nom && <p className="font-corps text-base text-encre px-5 pb-2">{nom}</p>}
                <form action={deconnexion}>
                  <button
                    type="submit"
                    className="font-ui flex items-center w-full min-h-[48px] px-5 text-base text-encre-douce hover:bg-parchemin-fonce/60 transition-colors"
                  >
                    Se déconnecter
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Barre d'onglets fixe. */}
      <nav
        aria-label="Navigation principale"
        className="sm:hidden fixed inset-x-0 bottom-0 z-20 bg-surface border-t border-bordure print:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex items-stretch">
          {onglets.map(({ cle, label, Icone, actif, href, ouvre }) => {
            const contenu = (
              <>
                <Icone actif={actif} />
                <span className={`font-ui text-[11px] leading-none ${actif ? 'font-medium' : ''}`}>{label}</span>
              </>
            )
            const classe = `flex flex-col items-center justify-center gap-0.5 w-full min-h-[56px] py-1.5 transition-colors ${
              actif ? 'text-encre' : 'text-muet'
            }`
            return (
              <li key={cle} className="flex-1">
                {href ? (
                  <Link href={href} aria-current={actif ? 'page' : undefined} className={classe}>
                    {contenu}
                  </Link>
                ) : (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={feuille === ouvre}
                    onClick={() => setFeuille(feuille === ouvre ? null : (ouvre ?? null))}
                    className={classe}
                  >
                    {contenu}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
