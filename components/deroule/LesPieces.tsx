// ============================================================================
// C7 — « LES PIÈCES », la section du cran 2 dans le cadre « Les documents »
// (`10-Gabarit.md` §2 bis.1 : « les pièces servies s'affichent à leur place
// dans l'objet, la place vide entre elles ; l'élève n'écrit que la pièce »).
// ----------------------------------------------------------------------------
// ⭐ Dessiné sur les longueurs RÉELLES de `gabarit-c2.json` (38 exercices,
//    mesurés le 06/09 avant toute ligne de code) : une pièce fait de 37 à 519
//    caractères (médiane 71 à 187 selon l'objet), un cas en sert de une à
//    quatre. Chaque pièce est donc un BLOC à part entière, jamais une ligne ;
//    et les blocs s'empilent — sur téléphone comme sur grand écran, la colonne
//    des documents est une colonne.
// ⛔ Le nom d'une pièce est un mot de la CONSIGNE (« ce que l'argument
//    conclut »), jamais un nom de constituant (`09-` §0). La place vide se
//    nomme par la DEMANDE du geste ; le mot « manque » n'y est pas : le cran 2
//    dit « voici », jamais « il manque » (`10-` §2 bis.1).
// ⚠️ Ce composant AFFICHE. Où va la place vide, ce qu'elle dit : c'est la règle
//    pure de `utils/gabarit/pieces.ts` qui l'a décidé, côté serveur.
// ============================================================================
import type { PiecesServies } from '@/utils/gabarit/pieces'

export function LesPieces({ pieces }: { pieces: PiecesServies }) {
  const place = Math.max(0, Math.min(pieces.place, pieces.pieces.length))
  const rangs: Array<{ type: 'piece'; nom: string; texte: string } | { type: 'vide' }> = [
    ...pieces.pieces.slice(0, place).map((p) => ({ type: 'piece' as const, ...p })),
    { type: 'vide' as const },
    ...pieces.pieces.slice(place).map((p) => ({ type: 'piece' as const, ...p })),
  ]
  return (
    <ol className="flex flex-col gap-2.5" aria-label="Les pièces, chacune à sa place">
      {rangs.map((r, i) => r.type === 'piece' ? (
        <li key={i} className="flex flex-col gap-1">
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-muet">
            {r.nom}
          </p>
          <p className="whitespace-pre-wrap rounded-[9px] border border-bordure-bouton
                        bg-parchemin-fonce p-3.5 font-corps text-[15.5px] leading-[1.62] text-encre">
            {r.texte}
          </p>
        </li>
      ) : (
        <li key={i} className="flex flex-col gap-1" aria-label="La place de ta pièce">
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-pigment">
            Ta pièce
          </p>
          <div className="rounded-[9px] border-2 border-dashed border-pigment/50 bg-pigment-teinte
                          px-3.5 py-3 font-corps text-[15px] leading-[1.55] text-encre">
            {pieces.demande
              ? <p className="font-semibold">{pieces.demande}</p>
              : <p className="font-semibold">C’est ici que ta pièce prend place.</p>}
            <p className="mt-1 text-[13.5px] text-encre-douce">
              Tu l’écris dans la colonne de travail ; elle viendra ici, entre les autres.
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
