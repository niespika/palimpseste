import Link from 'next/link'
import Pastille from '@/components/Pastille'

export default function ScriptoriumLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="scriptorium">
      <Link href="/prof" className="font-ui text-sm text-muet hover:text-encre transition-colors">
        ← Tableau de bord
      </Link>
      <div className="mt-2 mb-6 flex items-center gap-3">
        <Pastille module="scriptorium" size={44} />
        <div>
          <h2 className="font-marque text-xl font-semibold tracking-wide text-pigment">SCRIPTORIUM</h2>
          <p className="font-corps text-sm text-muet">Contenu partagé entre les modules</p>
        </div>
      </div>
      {children}
    </div>
  )
}
