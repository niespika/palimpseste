'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ----------------------------------------------------------------------------
// Barre d'onglets fixe en bas — navigation tactile de l'espace élève (Piste A).
// Visible uniquement < sm (le header à déroulants reprend la main ≥ sm).
//
//   • 4 onglets : Aujourd'hui · Modules · Agenda · Moi.
//   • Onglet actif : text-encre + pictogramme plein. Inactif : text-muet, trait.
//   • Cibles tactiles ≥ 44 px ; safe-area iOS ; print:hidden.
//   • Icônes : SVG inline (pas de dépendance, pas d'emoji). Le même path sert au
//     plein (fill) et au trait (stroke) selon l'état actif.
// ----------------------------------------------------------------------------

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

function IconeAujourdhui({ actif }: IconeProps) {
  return (
    <svg {...commun(actif)}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
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

function IconeAgenda({ actif }: IconeProps) {
  // Actif : corps plein + ergots débordant en haut (visibles sur le fond) ; le
  // trait du milieu n'est rendu qu'à l'état non plein (sinon invisible).
  return (
    <svg {...commun(actif)}>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      {!actif && <path d="M4 9.5h16" />}
      <path d="M8 3.5v3.5M16 3.5v3.5" />
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

interface Onglet {
  label: string
  href: string
  Icone: (p: IconeProps) => React.ReactNode
  actif: (pathname: string) => boolean
}

const ONGLETS: Onglet[] = [
  { label: "Aujourd'hui", href: '/eleve', Icone: IconeAujourdhui, actif: (p) => p === '/eleve' },
  { label: 'Modules', href: '/eleve/modules', Icone: IconeModules, actif: (p) => p === '/eleve/modules' || p.startsWith('/eleve/modules/') },
  { label: 'Agenda', href: '/eleve/calendrier', Icone: IconeAgenda, actif: (p) => p === '/eleve/calendrier' || p.startsWith('/eleve/calendrier/') },
  { label: 'Moi', href: '/eleve/moi', Icone: IconeMoi, actif: (p) => p === '/eleve/moi' || p.startsWith('/eleve/moi/') },
]

export default function BarreOngletsMobile() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation principale"
      className="sm:hidden fixed inset-x-0 bottom-0 z-20 bg-surface border-t border-bordure print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {ONGLETS.map(({ label, href, Icone, actif }) => {
          const estActif = actif(pathname)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={estActif ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1.5 transition-colors ${
                  estActif ? 'text-encre' : 'text-muet'
                }`}
              >
                <Icone actif={estActif} />
                <span className={`font-ui text-[11px] leading-none ${estActif ? 'font-medium' : ''}`}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
