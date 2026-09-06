// ============================================================================
// C7 — LE TEXTE À TROU, sur la page « Écrire » du cran 2 (`10-Gabarit.md` v0.9
// §2 bis.1 : « l'écran sert le devoir entier, dans l'ordre du texte, avec un
// trou à la place de la pièce ; l'écran dit où est le trou ; l'élève n'écrit
// que ce qui le comble »).
// ----------------------------------------------------------------------------
// ⭐ 06/09 — LES ARBITRAGES DE LOUIS SUR LA MAQUETTE INTERACTIVE : le texte est
//    DANS LE FIL — les morceaux se suivent sans saut de ligne, le trou est
//    entre eux, et c'est le champ lui-même ; dans le cadre vert il n'y a que
//    « Écris ici » ; les morceaux servis sont encadrés d'une autre couleur — la
//    teinte info, bleu-gris clair (« tout est en brun, il faudrait que ce soit
//    plus clair », Louis) ;
//    les noms des moments ne sont pas en gras dans le texte (« ça ne marche pas
//    au fil du texte ») mais dans une LÉGENDE sous le texte — « ce bloc = telle
//    chose », pour que le texte coule et qu'on comprenne que chaque moment
//    remplit une fonction. Les pièces ne sont plus dans la barre latérale.
// ⭐ Dessiné sur les longueurs RÉELLES de `gabarit-c2.json` (24 exercices à
//    trou, 06/09) : un morceau fait 39 à 519 caractères, un trou 55 à 218 ;
//    21 trous au milieu du texte, 3 en fin, 0 en tête.
// ⛔ Le trou est un `<textarea>`, ET RIEN D'AUTRE (piège 24 de
//    `ChampDeRedaction.tsx`) : ce composant ne rend que ce qui l'entoure — le
//    champ lui est passé par le parent, déjà instrumenté (télémétrie, collage
//    refusé, enregistrement). Il ne décide rien : la place et le nom du trou
//    viennent des données (`utils/gabarit/pieces.ts`, côté serveur).
// ⛔ Les noms des morceaux sont les mots de la CONSIGNE (« ce que l'argument
//    conclut »), jamais ceux de la fiche (`09-` §0) ; le mot « manque » n'y est
//    pas : la consigne dit « Complète … » (`10-` §3).
// ============================================================================
import type { PiecesServies } from '@/utils/gabarit/pieces'

/** Les repères de la légende — un par morceau servi, dans l'ordre du texte. */
const REPERES = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧']

export function TexteATrou({ pieces, children }: { pieces: PiecesServies; children: React.ReactNode }) {
  const place = Math.max(0, Math.min(pieces.place, pieces.pieces.length))
  const avant = pieces.pieces.slice(0, place)
  const apres = pieces.pieces.slice(place)
  const morceau = (p: { nom: string; texte: string }, i: number) => (
    <span
      key={`${i}-${p.nom}`}
      // ⚠️ Pas de `box-decoration-break: clone` : il encadrait CHAQUE LIGNE d'un
      //    morceau à part, et le texte se lisait haché (smoke du 06/09). Le cadre
      //    est continu : il s'ouvre au premier mot, se ferme au dernier.
      className="rounded-[5px] border border-info/30 bg-info-teinte px-1.5 py-0.5"
    >
      <sup className="mr-1 select-none font-ui text-[11px] text-info" aria-hidden>{REPERES[i] ?? '·'}</sup>
      {p.texte}
    </span>
  )
  return (
    <div className="flex flex-col gap-3">
      {/* ⭐ Le texte, dans le fil : les morceaux et le trou dans un seul paragraphe.
          `leading` large parce que les cadres et le champ se posent sur la ligne. */}
      <div className="rounded-xl border border-bordure bg-surface px-4 py-3.5 font-corps text-[16.5px]
                      leading-[2.05] text-encre focus-within:border-pigment"
           aria-label="Le texte à compléter">
        {avant.map((p, i) => <span key={`a${i}`}>{morceau(p, i)}{' '}</span>)}
        {children}
        {apres.map((p, i) => <span key={`b${i}`}>{' '}{morceau(p, place + i)}</span>)}
      </div>

      {/* ⭐ LA LÉGENDE — « ce bloc = telle chose » (Louis, 06/09). Les repères
          renvoient aux morceaux ; la dernière ligne nomme le trou, en mots
          d'élève, et dit que c'est lui qu'on écrit. */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 font-corps text-[14px] leading-snug text-encre-douce">
        {pieces.pieces.map((p, i) => (
          <div key={`l${i}`} className="contents">
            <dt className="select-none font-ui text-[13px] text-info" aria-hidden>{REPERES[i] ?? '·'}</dt>
            <dd className="m-0">{p.nom}</dd>
          </div>
        ))}
        <div className="contents">
          <dt className="select-none font-ui text-[13px] text-pigment" aria-hidden>▢</dt>
          <dd className="m-0 font-semibold text-encre">
            {pieces.trou ?? 'ta pièce'}
            <span className="font-normal text-encre-douce"> — c’est ce que tu écris, dans le cadre vert.</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
