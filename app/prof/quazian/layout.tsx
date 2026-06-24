import Link from 'next/link'
import Pastille from '@/components/Pastille'
import { TuileAccentModule } from '@/components/TuileAccent'
import SousNavModule from '@/components/SousNavModule'

export default function QuazianLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="quazian">
      <Link href="/prof" className="font-ui text-sm text-muet hover:text-encre transition-colors">
        ← Tableau de bord
      </Link>
      <div className="mt-2 mb-6 flex items-center gap-3">
        <Pastille module="quazian" size={44} />
        <h2 className="font-marque text-xl font-semibold tracking-wide text-pigment">QUAZIAN</h2>
      </div>

      <SousNavModule onglets={[
        { href: '/prof/quazian', label: 'Flashcards' },
        { href: '/prof/quazian/quizz', label: 'Quizz' },
        { href: '/prof/quazian/diagnostic', label: 'Diagnostic' },
        { href: '/prof/quazian/semestre', label: 'Semestre' },
        { href: '/prof/quazian/parametres', label: 'Paramètres' },
      ]} />

      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
