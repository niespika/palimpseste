import Link from 'next/link'
import LogoPalimpseste from './nav/LogoPalimpseste'

// ----------------------------------------------------------------------------
// En-tête mobile factorisé de l'espace prof. Visible uniquement < sm (le header
// à déroulants reprend la main ≥ sm). Pose le médaillon Palimpseste en haut à
// droite de CHAQUE écran prof (tableau de bord, détail classe, à-risque, fiche
// élève), et — si fourni — un lien de retour à gauche.
//
//   [← retour]   titre / sousTitre            [médaillon]
// ----------------------------------------------------------------------------

interface Props {
  titre: string
  sousTitre?: string
  retourHref?: string
}

export default function EnTeteMobileProf({ titre, sousTitre, retourHref }: Props) {
  return (
    <div className="sm:hidden flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        {retourHref && (
          <Link href={retourHref} className="font-ui text-sm text-muet hover:text-encre-douce transition-colors">
            ← Retour
          </Link>
        )}
        <h2 className="font-titre text-2xl text-encre leading-tight truncate">{titre}</h2>
        {sousTitre && <p className="font-corps text-sm text-muet mt-0.5 truncate">{sousTitre}</p>}
      </div>
      <LogoPalimpseste size={28} />
    </div>
  )
}
