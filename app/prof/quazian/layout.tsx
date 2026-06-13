import Link from 'next/link'

export default function QuazianLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <Link href="/prof" className="text-sm text-stone-500 hover:text-stone-700">
          ← Tableau de bord
        </Link>
        <h2 className="text-xl font-serif text-stone-900 mt-2">Quazian</h2>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-stone-200 pb-0 overflow-x-auto">
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
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-t-lg border-b-2 border-transparent hover:border-stone-300 transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
