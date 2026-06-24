import Link from 'next/link'
import Pastille from '@/components/Pastille'

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

      <nav className="flex gap-1 mb-6 border-b border-bordure pb-0 overflow-x-auto">
        {[
          { href: '/prof/quazian', label: 'Flashcards' },
          { href: '/prof/quazian/quizz', label: 'Quizz' },
          { href: '/prof/quazian/diagnostic', label: 'Diagnostic' },
          { href: '/prof/quazian/semestre', label: 'Semestre' },
          { href: '/prof/quazian/parametres', label: 'Paramètres' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="font-ui px-4 py-2 text-sm text-encre-douce hover:text-encre hover:bg-pigment-teinte rounded-t-lg border-b-2 border-transparent transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
