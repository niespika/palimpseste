import Link from 'next/link'

// ----------------------------------------------------------------------------
// En-tête mobile factorisé de l'espace prof. Visible uniquement < sm (le header
// à déroulants reprend la main ≥ sm). Porte le titre de l'écran et — si fourni —
// un lien de retour.
//
//   [← retour]   titre / sousTitre
//
// ⚠️ Le médaillon N'EST PLUS ICI : il est passé dans le bandeau de
// `app/prof/layout.tsx`, qui SURVIT à l'écran d'attente. Ce bloc-ci est du
// contenu de page, il disparaît pendant le chargement — c'est justement ce qui
// donnait l'impression d'un écran cassé.
// ----------------------------------------------------------------------------

interface Props {
  titre: string
  sousTitre?: string
  retourHref?: string
}

export default function EnTeteMobileProf({ titre, sousTitre, retourHref }: Props) {
  return (
    <div className="sm:hidden mb-4">
      <div className="min-w-0">
        {retourHref && (
          <Link href={retourHref} className="font-ui text-sm text-muet hover:text-encre-douce transition-colors">
            ← Retour
          </Link>
        )}
        <h2 className="font-titre text-2xl text-encre leading-tight truncate">{titre}</h2>
        {sousTitre && <p className="font-corps text-sm text-muet mt-0.5 truncate">{sousTitre}</p>}
      </div>
    </div>
  )
}
