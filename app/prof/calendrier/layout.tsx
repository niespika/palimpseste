import Link from 'next/link'
import SousNavModule from '@/components/SousNavModule'

export default function CalendrierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6">
        <Link href="/prof" className="text-sm text-muet hover:text-encre-douce">
          ← Tableau de bord
        </Link>
        <h2 className="text-xl font-serif text-encre mt-2">Calendrier</h2>
      </div>

      <SousNavModule onglets={[
        { href: '/prof/calendrier', label: 'Vue' },
        { href: '/prof/calendrier/config', label: 'Configuration' },
      ]} />

      {children}
    </div>
  )
}
