import Link from 'next/link'

// ----------------------------------------------------------------------------
// Primitif de tuile partagé (Lot 3, réutilisé par les Lots 4-8). Présentationnel
// et paramétrable : `nom` constant, `resume` (badges / chiffres) et `couleur`
// injectés par l'appelant. Même langage visuel pour les tuiles de classe (Lot 3)
// et de module (Lot 4), sans réécrire le shell.
// ----------------------------------------------------------------------------

export type CouleurTuile = 'vert' | 'neutre' | 'rouge'

const BORDURE: Record<CouleurTuile, string> = {
  vert: 'border-l-green-400',
  neutre: 'border-l-stone-300',
  rouge: 'border-l-red-400',
}

interface Props {
  nom: string
  sousTitre?: string
  /** Résumé injecté (badges, chiffres…). */
  resume?: React.ReactNode
  couleur?: CouleurTuile
  /** Si fourni, la tuile devient cliquable (Link). */
  href?: string
  selectionnee?: boolean
}

export default function Tuile({ nom, sousTitre, resume, couleur = 'neutre', href, selectionnee }: Props) {
  const contenu = (
    <div
      className={`bg-white border border-stone-200 border-l-4 ${BORDURE[couleur]} rounded-xl px-4 py-3 h-full transition-colors ${
        href ? 'hover:border-stone-400 hover:shadow-sm' : ''
      } ${selectionnee ? 'ring-2 ring-stone-400' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-stone-900 truncate">{nom}</p>
          {sousTitre && <p className="text-xs text-stone-400 mt-0.5 truncate">{sousTitre}</p>}
        </div>
        {href && <span className="text-stone-300 flex-shrink-0">→</span>}
      </div>
      {resume && <div className="mt-2">{resume}</div>}
    </div>
  )

  return href ? <Link href={href} className="block">{contenu}</Link> : contenu
}
