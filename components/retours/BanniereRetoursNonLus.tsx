import Link from 'next/link'
import type { RetourNonLu, ModuleRetour } from '@/utils/retours-lus'

// Bannière de blocage « des retours t'attendent » (serveur). Affichée en tête des
// pages de rendu bloquables ; on peut exclure le module de la page courante pour
// éviter le doublon avec le bloc de validation juste en dessous.
interface Props {
  retours: RetourNonLu[]
  excludeModule?: ModuleRetour
}

export default function BanniereRetoursNonLus({ retours, excludeModule }: Props) {
  const liste = retours.filter((r) => r.module !== excludeModule)
  if (liste.length === 0) return null

  return (
    <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 mb-5">
      <p className="text-sm font-medium text-attention">
        {liste.length > 1 ? 'Des retours t’attendent' : 'Un retour t’attend'}
      </p>
      <p className="text-xs text-attention mt-1">
        Lis et valide {liste.length > 1 ? 'ces retours' : 'ce retour'} avant de pouvoir rendre quoi que ce soit.
      </p>
      <ul className="mt-2 space-y-1">
        {liste.map((r) => (
          <li key={r.module}>
            <Link href={r.href} className="text-sm text-attention underline underline-offset-2 hover:opacity-80">
              {r.label} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
