import Link from 'next/link'
import Pastille from '@/components/Pastille'
import { TuileAccentModule } from '@/components/TuileAccent'
import SousNavModule from '@/components/SousNavModule'

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

      <SousNavModule onglets={[
        { href: '/prof/aletheia', label: 'Classe' },
        { href: '/prof/aletheia/parametres', label: 'Paramètres' },
      ]} />

      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
