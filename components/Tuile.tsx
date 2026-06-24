'use client'

import Link from 'next/link'
import Pastille, { type ModuleSceau } from './Pastille'
import { useTuileAccent } from './TuileAccent'

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
  // À l'intérieur d'un module (voir <TuileAccentModule>), le bord gauche prend le
  // liseré du module par défaut ; on ne garde que le rouge comme signal de souci.
  // Hors module, on conserve le code couleur d'état (vert / neutre / rouge).
  const accentModule = useTuileAccent()
  const plein = !!selectionnee   // carte active → fond plein (un seul signal, plus d'anneau)

  const bordGauche = module
    ? 'border-l-liseret'
    : accentModule
      ? (couleur === 'rouge' ? 'border-l-retard' : 'border-l-liseret')
      : BORDURE_ETAT[couleur]

  // Survol : si la carte est déjà pleine, on se contente de l'ombre (pas de bordure
  // pigment qui doublonnerait). Sinon, léger rehaut de bordure comme avant.
  const survol = href
    ? (plein
        ? 'hover:shadow-sm'
        : `${accentModule || module ? 'hover:border-pigment' : 'hover:border-muet'} hover:shadow-sm`)
    : ''

  // Carte pleine = bloc au pigment du module (sépia général hors module), bord uni,
  // aucun liseré concurrent. Sinon, surface claire + liseré gauche habituel.
  const carte = plein
    ? `bg-pigment border border-pigment rounded-xl px-4 py-3 h-full transition-colors ${survol}`
    : `bg-surface border border-bordure border-l-4 ${bordGauche} rounded-xl px-4 py-3 h-full transition-colors ${survol}`

  const contenu = (
    <div data-module={module} className={carte}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {avecSceau && module && <Pastille module={module} size={36} />}
          <div className="min-w-0">
            {/* nom de module en capitale lapidaire, sinon titre d'interface */}
            <p className={
              plein
                ? `${module ? 'font-marque font-semibold tracking-wide' : 'font-ui font-medium'} text-surface truncate`
                : (module
                    ? 'font-marque font-semibold tracking-wide text-pigment truncate'
                    : 'font-ui font-medium text-encre truncate')
            }>
              {module ? nom.toUpperCase() : nom}
            </p>
            {sousTitre && (
              <p className={`font-corps text-sm mt-0.5 truncate ${plein ? 'text-surface/75' : 'text-muet'}`}>
                {sousTitre}
              </p>
            )}
          </div>
        </div>
        {href && <span className={`flex-shrink-0 ${plein ? 'text-surface/70' : 'text-bordure'}`}>→</span>}
      </div>
      {resume && <div className="mt-2">{resume}</div>}
    </div>
  )

  return href ? (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
    >
      {contenu}
    </Link>
  ) : contenu
}

// Exemples :
//   <Tuile nom="Terminale HLP" sousTitre="…" couleur="vert" resume={…} href="…" />
//   <Tuile nom="Aletheia" module="aletheia" avecSceau sousTitre="Retours socratiques" href="…" />
