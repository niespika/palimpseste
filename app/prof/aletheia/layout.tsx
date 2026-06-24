import Link from 'next/link'
import Pastille from '@/components/Pastille'

export default function AletheiaProfLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="aletheia">
      <Link href="/prof" className="font-ui text-sm text-muet hover:text-encre transition-colors">
        ← Tableau de bord
      </Link>
      <div className="mt-2 mb-4 flex items-center gap-3">
        <Pastille module="aletheia" size={44} />
        <div>
          <h2 className="font-marque text-xl font-semibold tracking-wide text-pigment">ALETHEIA</h2>
          <p className="font-corps text-sm text-muet">Lecture autonome d&apos;un livre, semaine après semaine</p>
        </div>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-bordure pb-0 overflow-x-auto">
        {[
          { href: '/prof/aletheia', label: 'Classe' },
          { href: '/prof/aletheia/parametres', label: 'Paramètres' },
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
