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

/**
 * ⭐ UNE TEINTE PAR MOMENT (Louis, 06/09 : « il faut une couleur différente par
 *    moment ») — les jetons `--moment-n` de `globals.css`, dans l'ordre du texte,
 *    qui tournent au-delà de cinq. Les classes sont écrites EN TOUTES LETTRES :
 *    Tailwind ne compose pas un nom de classe à l'exécution.
 */
export const TEINTES_DES_MOMENTS = [
  { fond: 'bg-moment-1 border-moment-1-trait/30', trait: 'text-moment-1-trait', puce: 'bg-moment-1 border-moment-1-trait/40' },
  { fond: 'bg-moment-2 border-moment-2-trait/30', trait: 'text-moment-2-trait', puce: 'bg-moment-2 border-moment-2-trait/40' },
  { fond: 'bg-moment-3 border-moment-3-trait/30', trait: 'text-moment-3-trait', puce: 'bg-moment-3 border-moment-3-trait/40' },
  { fond: 'bg-moment-4 border-moment-4-trait/30', trait: 'text-moment-4-trait', puce: 'bg-moment-4 border-moment-4-trait/40' },
  { fond: 'bg-moment-5 border-moment-5-trait/30', trait: 'text-moment-5-trait', puce: 'bg-moment-5 border-moment-5-trait/40' },
] as const
export const teinteDuMoment = (i: number) => TEINTES_DES_MOMENTS[i % TEINTES_DES_MOMENTS.length]!

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
      className={`rounded-[5px] border px-1.5 py-0.5 ${teinteDuMoment(i).fond}`}
    >
      <sup className={`mr-1 select-none font-ui text-[11px] ${teinteDuMoment(i).trait}`} aria-hidden>{REPERES[i] ?? '·'}</sup>
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
            <dt className={`flex select-none items-center gap-1 font-ui text-[13px] ${teinteDuMoment(i).trait}`} aria-hidden>
              <span className={`inline-block size-3 rounded-[3px] border ${teinteDuMoment(i).puce}`} />
              {REPERES[i] ?? '·'}
            </dt>
            <dd className="m-0">{p.nom}</dd>
          </div>
        ))}
        <div className="contents">
          <dt className="flex select-none items-center gap-1 font-ui text-[13px] text-pigment" aria-hidden>
            <span className="inline-block size-3 rounded-[3px] border-2 border-dashed border-pigment/60 bg-pigment-teinte" />
          </dt>
          <dd className="m-0 font-semibold text-encre">
            {pieces.trou ?? 'ta pièce'}
            <span className="font-normal text-encre-douce"> — c’est ce que tu écris, dans le cadre vert.</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
