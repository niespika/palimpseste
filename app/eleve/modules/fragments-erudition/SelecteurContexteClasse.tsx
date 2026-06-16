import Link from 'next/link'
import type { InscriptionContexte } from '@/types/fragments'

interface Props {
  inscriptions: InscriptionContexte[]
  inscriptionActiveId: string
}

// Sélecteur de contexte classe côté élève : n'apparaît que pour un élève
// inscrit dans plusieurs classes (un flux de fragments par classe).
export default function SelecteurContexteClasse({ inscriptions, inscriptionActiveId }: Props) {
  if (inscriptions.length < 2) return null

  return (
    <div className="flex flex-wrap items-center gap-1 bg-stone-100 rounded-xl p-1">
      {inscriptions.map((i) => {
        const actif = i.id === inscriptionActiveId
        return (
          <Link
            key={i.id}
            href={`/eleve/modules/fragments-erudition?ctx=${i.id}`}
            scroll={false}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              actif
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {i.classe_nom}
          </Link>
        )
      })}
    </div>
  )
}
