import Link from 'next/link'
import Pastille from '@/components/Pastille'
import { TuileAccentModule } from '@/components/TuileAccent'
import SousNavModule from '@/components/SousNavModule'

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="codex">
      <Link href="/prof" className="font-ui text-sm text-muet hover:text-encre transition-colors">
        ← Tableau de bord
      </Link>
      <div className="mt-2 mb-4 flex items-center gap-3">
        <Pastille module="codex" size={44} />
        <div>
          <h2 className="font-marque text-xl font-semibold tracking-wide text-pigment">CODEX</h2>
          <p className="font-corps text-sm text-muet">Synthèse de consolidation, par unité</p>
        </div>
      </div>

      <SousNavModule onglets={[
        { href: '/prof/codex', label: 'Synthèses' },
        { href: '/prof/codex/validation', label: 'Validation' },
        { href: '/prof/codex/parametres', label: 'Paramètres' },
      ]} />

      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
