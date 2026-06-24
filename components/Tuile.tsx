import Link from 'next/link'
import Pastille, { type ModuleSceau } from './Pastille'

// ----------------------------------------------------------------------------
// Tuile — version « charte ». Mêmes props que l'original, repeinte avec les
// jetons de la charte (parchemin / encre / états) + une option `module` qui
// pose le pigment du module en bord gauche et, si demandé, son sceau.
//
// Bord gauche :
//   • couleur d'état (vert/neutre/rouge)  → fait / neutre / en retard
//   • OU module (aletheia, codex, …)      → pigment du module (prioritaire)
// ----------------------------------------------------------------------------

export type CouleurTuile = 'vert' | 'neutre' | 'rouge'

// États mappés sur les jetons (classes Tailwind générées par globals.css @theme)
const BORDURE_ETAT: Record<CouleurTuile, string> = {
  vert:   'border-l-ok',
  neutre: 'border-l-bordure',
  rouge:  'border-l-retard',
}

interface Props {
  nom: string
  sousTitre?: string
  resume?: React.ReactNode
  couleur?: CouleurTuile
  /** Si fourni : bord gauche = pigment du module (prioritaire sur `couleur`). */
  module?: ModuleSceau
  /** Affiche le sceau du module à gauche du titre. Nécessite `module`. */
  avecSceau?: boolean
  href?: string
  selectionnee?: boolean
}

export default function Tuile({
  nom, sousTitre, resume, couleur = 'neutre',
  module, avecSceau, href, selectionnee,
}: Props) {
  // Le pigment de module l'emporte sur la couleur d'état pour le bord gauche.
  const bordGauche = module ? 'border-l-pigment' : BORDURE_ETAT[couleur]

  const contenu = (
    <div
      // data-module fait hériter --pigment à la tuile (et donc à border-l-pigment)
      data-module={module}
      className={`bg-surface border border-bordure border-l-4 ${bordGauche} rounded-xl px-4 py-3 h-full transition-colors ${
        href ? 'hover:border-muet hover:shadow-sm' : ''
      } ${selectionnee ? 'ring-2 ring-muet' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {avecSceau && module && <Pastille module={module} size={36} />}
          <div className="min-w-0">
            {/* nom de module en capitale lapidaire, sinon titre d'interface */}
            <p className={module
              ? 'font-marque font-semibold tracking-wide text-pigment truncate'
              : 'font-ui font-medium text-encre truncate'}>
              {module ? nom.toUpperCase() : nom}
            </p>
            {sousTitre && <p className="font-corps text-sm text-muet mt-0.5 truncate">{sousTitre}</p>}
          </div>
        </div>
        {href && <span className="text-bordure flex-shrink-0">→</span>}
      </div>
      {resume && <div className="mt-2">{resume}</div>}
    </div>
  )

  return href ? <Link href={href} className="block">{contenu}</Link> : contenu
}

// Exemples :
//   <Tuile nom="Terminale HLP" sousTitre="…" couleur="vert" resume={…} href="…" />
//   <Tuile nom="Aletheia" module="aletheia" avecSceau sousTitre="Retours socratiques" href="…" />
