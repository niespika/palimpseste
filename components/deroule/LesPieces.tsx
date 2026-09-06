// ============================================================================
// C7 — « LE TEXTE À COMPLÉTER », la section du cran 2 dans le cadre « Les
// documents » (`10-Gabarit.md` v0.9 §2 bis.1 : « l'écran sert le devoir entier,
// dans l'ordre du texte, avec un trou à la place de la pièce ; l'écran dit où
// est le trou ; l'élève n'écrit que ce qui le comble »).
// ----------------------------------------------------------------------------
// ⭐ Dessiné sur les longueurs RÉELLES de `gabarit-c2.json` (24 exercices à
//    trou, mesurés le 06/09) : un devoir de 440 à 670 caractères, un trou de 55
//    à 218 ; 21 trous au milieu du texte, 3 en fin, 0 en tête. Le texte est donc
//    UN paragraphe continu, et le blanc y est en ligne — jamais un bloc à part.
// ⛔ Le blanc porte le NOM DU TROU en mots d'élève (« ce qui fait que cet appui
//    soutient cette conclusion »), jamais un nom de constituant (`09-` §0). Le
//    mot « manque » n'y est pas : la consigne dit « Complète … » (`10-` §3).
// ⚠️ Ce composant AFFICHE. Où est le trou, comment il se nomme : la règle pure
//    de `utils/gabarit/pieces.ts`, côté serveur, à partir des données.
// ============================================================================
import type { PiecesServies } from '@/utils/gabarit/pieces'

export function LesPieces({ pieces }: { pieces: PiecesServies }) {
  const place = Math.max(0, Math.min(pieces.place, pieces.pieces.length))
  const avant = pieces.pieces.slice(0, place)
  const apres = pieces.pieces.slice(place)
  const etiquette = pieces.trou ?? 'ta pièce'
  return (
    <div className="flex flex-col gap-2" aria-label="Le texte à compléter">
      <p className="whitespace-pre-wrap rounded-[9px] border border-bordure-bouton bg-parchemin-fonce
                    p-3.5 font-corps text-[15.5px] leading-[1.75] text-encre">
        {avant.map((p, i) => <span key={`a${i}`}>{p.texte}{' '}</span>)}
        <span
          className="mx-0.5 inline-block min-w-[9rem] border-b-2 border-dashed border-pigment/70 px-1.5
                     align-baseline font-marque text-[11px] font-semibold uppercase tracking-[0.09em] text-pigment"
          aria-label="Le trou, à combler"
        >
          {etiquette}
        </span>
        {apres.map((p, i) => <span key={`b${i}`}>{' '}{p.texte}</span>)}
      </p>
      <p className="text-[13.5px] text-encre-douce">
        Le pointillé marque l’endroit du trou. Tu écris ce qui le comble dans la colonne de travail ; il viendra là.
      </p>
    </div>
  )
}
