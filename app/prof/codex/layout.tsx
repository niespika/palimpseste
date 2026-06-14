import Link from 'next/link'

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <Link href="/prof" className="text-sm text-stone-500 hover:text-stone-700">
          ← Tableau de bord
        </Link>
        <h2 className="text-xl font-serif text-stone-900 mt-2">Codex</h2>
        <p className="text-sm text-stone-500 mt-1">Synthèse de consolidation, par unité</p>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-stone-200 pb-0 overflow-x-auto">
        {[
          { href: '/prof/codex', label: 'Séances' },
          { href: '/prof/codex/validation', label: 'Validation' },
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
