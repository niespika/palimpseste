// ============================================================================
// L'APERÇU CÔTÉ ÉLÈVE — l'instance telle que LES RÈGLES LA PLACENT.
// ----------------------------------------------------------------------------
// « C'est tout le sens de "une consigne juste au mauvais endroit est une
//   consigne fausse" » (piège 33) :
//   · le `materiau_source` s'affiche DANS LES TEXTES DE SUPPORT, « pas dans la
//     consigne » ;
//   · le `materiau_cible` est CE SUR QUOI L'ÉLÈVE TRAVAILLE ;
//   · le `guide` se sert AVANT la v1 ;
//   · aux crans 1 et 3, QUATRE candidats — trois distracteurs tirés de la
//     banque, plus la `reponse_attendue` — et JAMAIS QUINZE ;
//   · aux crans 4, 5, 7 et 9, AUCUN candidat ;
//   · aux crans de diagnostic, LE CAS 1 PUIS LE CAS 2, la correction du premier
//     SERVIE AVANT le second ;
//   · la durée indicative, un entier.
//
// ⚠️ « RIEN DE CE QUE LE ROUTEUR OU LE DÉROULÉ ÉLISENT : ni rappel des
//    observables faibles, ni démonstration du temps 1, ni registre — l'aperçu est
//    L'INSTANCE, pas la semaine de l'élève. »
//
// ⚠️ « Les textes s'affichent TELS QU'ILS SONT STOCKÉS » — les retours à la ligne
//    d'un matériau, d'une démonstration, d'un texte d'auteur sont CONSERVÉS.
//
// ⭐⭐ C4-L15 — ET CE QUE L'ÉCRAN MET EN ÉVIDENCE DANS LE MATÉRIAU S'Y VOIT.
//    Le professeur doit voir CE QUE L'ÉLÈVE VERRA : au cran 1 les quatre
//    candidats servis, la bonne réponse comprise ; aux crans 3 et 5 le passage
//    fautif, et lui seul ; aux crans 4, 7 et 9 rien — « l'y trouver EST le
//    travail » (`02-` §5). ⚠️ Le texte n'est PAS retouché : marquer n'est pas
//    baliser, la concaténation des segments EST le matériau, et le
//    `whitespace-pre-wrap` reste. ⚠️ Le TIRAGE des candidats n'a pas bougé — il
//    reste déterministe, « pour qu'un rechargement ne change pas ce que le
//    professeur relit ».
// ============================================================================

import type { Apercu as TypeApercu } from '@/utils/fabrique/conception'
// ⭐ LA MÊME classe de marque que l'écran élève, IMPORTÉE et jamais recopiée :
//    deux listes de classes qui divergeraient feraient mentir « l'aperçu rend ce
//    que l'élève verra » dès le premier ajustement.
import { MARQUE } from '@/components/deroule/TexteBalise'

export default function Apercu({ apercu }: { apercu: TypeApercu }) {
  return (
    <section className="rounded-xl border-2 border-dashed border-bordure-bouton bg-parchemin p-4 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-titre text-lg text-encre">Aperçu — ce que l&apos;élève verra</h2>
        <p className="font-ui text-xs text-muet">
          {apercu.dureeMin !== null && <>durée indicative <strong>{apercu.dureeMin} min</strong> · </>}
          régime {apercu.regimeV1vf}
        </p>
      </div>

      {/* LE GUIDE, SERVI AVANT LA V1. « Le guide n'est pas le retour. » */}
      {apercu.guide && (
        <div className="rounded-lg border border-info bg-info-teinte p-3">
          <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
            Avant d&apos;écrire
          </p>
          <p className="whitespace-pre-wrap font-serif text-sm text-encre">{apercu.guide}</p>
        </div>
      )}

      {apercu.cas.map((cs, i) => (
        <div key={cs.ordre} className="space-y-3 rounded-lg border border-bordure bg-surface p-3">
          {apercu.cas.length === 2 && (
            <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
              {i === 0 ? 'Premier cas — traité sur indication' : 'Second cas — un cas neuf, traité seul'}
            </p>
          )}

          {/* LES TEXTES DE SUPPORT — c'est là que la SOURCE s'affiche, jamais
              dans la consigne. */}
          {cs.materiauSource && (
            <div>
              <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
                Textes de support
              </p>
              <p className="whitespace-pre-wrap font-serif text-sm text-encre">{cs.materiauSource}</p>
            </div>
          )}

          {/* LA CONSIGNE. */}
          <p className="font-ui text-base text-encre">{cs.consigne}</p>

          {/* CE SUR QUOI L'ÉLÈVE TRAVAILLE — le texte à corriger, la copie à juger,
              AVEC ce que l'écran y met en évidence (C4-L15). */}
          {cs.materiauCible && (
            <div className="rounded-md border border-bordure-bouton bg-parchemin-fonce p-3">
              <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
                Ce sur quoi tu travailles
              </p>
              <p className="whitespace-pre-wrap font-serif text-sm text-encre">
                {(cs.materiauCibleMarque ?? [{ texte: cs.materiauCible, marque: false }])
                  .map((seg, k) => (seg.marque
                    ? <strong key={k} className={MARQUE}>{seg.texte}</strong>
                    : <span key={k}>{seg.texte}</span>))}
              </p>
            </div>
          )}

          {/* QUATRE CANDIDATS, mêlés — jamais quinze. Aucun aux quatre autres
              crans qui isolent. */}
          {cs.candidats.length > 0 && (
            <ul className="space-y-1">
              {cs.candidats.map((x, k) => (
                <li key={k} className="flex items-start gap-2 font-ui text-sm text-encre">
                  <input type="radio" disabled className="mt-1" aria-hidden />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          )}
          {cs.candidats.length === 0 && (
            <p className="font-ui text-xs text-muet">
              <em>Aucun candidat à ce cran : l&apos;élève répond, puis donne un pourcentage unique
              sur sa propre réponse.</em>
            </p>
          )}

          {/* ⭐ C4-L14 — LE POURQUOI DE LA BONNE RÉPONSE, aux deux crans à
              candidats. Il se montre ICI parce que la correction que l'élève
              lira le porte ; le TIRAGE, lui, n'a pas bougé (piège 38). */}
          {cs.pourquoiJuste && (
            <div className="rounded-md border border-bordure bg-parchemin-fonce p-2">
              <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
                Pourquoi ce candidat-là est le bon
              </p>
              <p className="font-serif text-sm text-encre">{cs.pourquoiJuste}</p>
            </div>
          )}
          {cs.candidats.length > 0 && !cs.pourquoiJuste && (
            <p className="font-ui text-xs text-attention">
              <em>Aucun <code>pourquoi_juste</code> : la correction ne montrera que la réponse,
              pas pourquoi elle est la bonne.</em>
            </p>
          )}

          {/* « La correction du premier cas est SERVIE AVANT LE SECOND — c'est
              elle qui rend l'écart des deux crédences interprétable. » */}
          {cs.correctionServieAvantLeSuivant && (
            <div className="rounded-md border border-ok bg-ok-teinte p-2">
              <p className="font-ui text-xs uppercase tracking-wide text-muet-clair">
                La correction, servie avant le second cas
              </p>
              <p className="font-serif text-sm text-encre">{cs.correctionServieAvantLeSuivant}</p>
            </div>
          )}
        </div>
      ))}

      <div className="border-t border-bordure pt-2">
        <p className="font-ui text-xs text-muet">
          <strong>Ce que cet aperçu ne montre pas, et c&apos;est voulu</strong> — il rend
          l&apos;<em>instance</em>, pas la semaine de l&apos;élève :
        </p>
        <ul className="mt-1 list-disc pl-5 font-ui text-xs text-muet">
          {apercu.horsChamp.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </div>
    </section>
  )
}
