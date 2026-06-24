// ----------------------------------------------------------------------------
// AtelierDeuxColonnes — disposition « atelier » partagée (Aletheia & Codex).
//
// Problème résolu : pendant la réécriture, l'élève doit garder son retour sous
// les yeux sans scroller. Un seul geste à apprendre, le même dans les deux
// modules.
//
//   • Desktop (lg ≥ 1024) : 2 colonnes. Gauche = retour ÉPINGLÉ (lg:sticky),
//     reste visible pendant qu'on remplit le formulaire à droite.
//   • Mobile (< lg) : pas de 2 colonnes. Le retour devient un bandeau dépliable
//     épinglé (<details> sticky) au-dessus du formulaire ; le formulaire reste
//     l'élément principal.
//
// `formulaire` n'est rendu QU'UNE FOIS (il peut contenir des champs/ids :
// CaptureManuscrit côté Codex). `retour` est sans état (affichage seul) et peut
// être rendu deux fois sans risque (colonne sticky + bandeau mobile).
//
// Composant « partagé » (ni 'use client' ni import serveur) → utilisable depuis
// un arbre serveur (Aletheia) comme client (Codex).
// ----------------------------------------------------------------------------

interface Props {
  /** Contenu du retour (affichage seul, rendu en double : colonne + bandeau). */
  retour: React.ReactNode
  /** Le formulaire de réécriture (rendu une seule fois). */
  formulaire: React.ReactNode
  /** Intitulé de la colonne « retour » (sans le losange). */
  labelRetour: string
  /** Intitulé de la colonne « formulaire » (sans la plume). */
  labelFormulaire: string
  /** Suffixe du sur-titre desktop (def « reste visible » pour l'atelier ;
   *  passer null pour la revue d'une semaine terminée). */
  suffixeRetour?: string | null
  /** Le bandeau retour est-il ouvert par défaut sur mobile ? (def true ;
   *  false pour la revue, où la version finale prime). */
  retourOuvertMobile?: boolean
}

const SUR_TITRE = 'font-ui text-xs tracking-[0.1em] text-muet uppercase'

export default function AtelierDeuxColonnes({
  retour, formulaire, labelRetour, labelFormulaire,
  suffixeRetour = 'reste visible', retourOuvertMobile = true,
}: Props) {
  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
      {/* Colonne gauche (desktop) — retour épinglé, reste à l'écran. */}
      <aside className="hidden lg:block lg:sticky lg:top-24 space-y-3 min-w-0">
        <p className={SUR_TITRE}>◆ {labelRetour}{suffixeRetour ? ` — ${suffixeRetour}` : ''}</p>
        {retour}
      </aside>

      {/* Colonne droite (desktop) / pleine largeur (mobile). */}
      <div className="min-w-0">
        {/* Mobile : retour en bandeau dépliable épinglé. */}
        <details
          open={retourOuvertMobile}
          className="lg:hidden mb-4 bg-surface border border-bordure rounded-xl sticky top-14 z-10"
        >
          <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden px-4 py-3 min-h-[44px] flex items-center justify-between gap-2">
            <span className={SUR_TITRE}>◆ {labelRetour}</span>
            <span className="text-muet text-xs underline">afficher / masquer</span>
          </summary>
          <div className="px-4 pb-4 max-h-[45vh] overflow-y-auto">{retour}</div>
        </details>

        <p className={`${SUR_TITRE} mb-2`}>✎ {labelFormulaire}</p>
        {formulaire}
      </div>
    </div>
  )
}
