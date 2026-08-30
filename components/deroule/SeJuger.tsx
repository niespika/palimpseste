'use client'
// ============================================================================
// C4 · L3 — TEMPS 3 : « SE JUGER ». Deux à trois questions, AU DOIGT, et
//            **AVANT que l'élève voie son retour** (`06-` §2 ; la fiche §4).
// ----------------------------------------------------------------------------
// L'ordre est la mesure : *se juger après avoir lu le retour ne mesurerait plus
// la métacognition, seulement la capacité à recopier ce qu'on vient de lire.*
// C'est le parent qui tient cet ordre (`tempsCourant === 'se_juger'`) ; cet
// écran, lui, ne sert QUE les questions et le geste d'envoi.
//
// ⚠️⚠️ RÉPONSES AU DOIGT, AUCUNE SAISIE LONGUE — « l'écran est souvent un
//    téléphone » (`07-` §3). *Une phase qui coûte cher se bâcle, et une
//    calibration bâclée ne mesure pas la métacognition : elle mesure la
//    fatigue.* Donc **des boutons, jamais un champ de texte**, et des cibles
//    d'au moins 44 px sur tout ce qui se touche — règle de source, pas confort.
//
// ⭐ TOUTES LES QUESTIONS SUR UN SEUL ÉCRAN, PAS UN STEPPER — décision, et
//    voici pourquoi : elles sont DEUX À TROIS (la fiche §4), chacune tient en
//    une ligne et une rangée de boutons. Un pas-à-pas ajouterait sa propre
//    quincaillerie (avancer, revenir, compter les pas), soit plus de touches
//    pour moins de texte lu ; et il cacherait le coût total, alors qu'ici
//    l'élève voit d'un coup d'œil qu'il en a pour trois gestes. Un seul bouton
//    envoie tout, comme le geste le demande.
//
// ⚠️ LES RÉPONSES SONT UNE LISTE FERMÉE (`07-` §1.1) : *une réponse libre ne se
//    compare à rien.* On rend EXACTEMENT `question.reponses`, dans l'ordre
//    reçu — **aucun ajout** : pas de « je ne sais pas », pas de « autre », pas
//    de champ libre. Une option de plus ici, et la comparaison au squelette
//    n'aurait plus de côté élève à confronter.
//
// ⚠️ LA QUESTION PORTE SUR UNE DIMENSION, JAMAIS SUR UN OBSERVABLE. On affiche
//    `dimension_eleve` et `question` ; **`observable_code` ne paraît NULLE PART
//    à l'écran** — le code EST la grille, et RR4 l'interdit (`01-` §12). Il ne
//    sert ici qu'à fabriquer la clé de la réponse, qui ne se lit pas.
//    Même raison pour `offre.sansQuestion` : c'est une liste de codes, elle va
//    au journal du professeur, jamais sous les yeux de l'élève.
//
// ⚠️ ÇA NE SE NOTE PAS, ET ON LE DIT : « se tromper en se jugeant ne coûte
//    rien » (`06-` §2). **Aucune note, aucune lettre, aucune moyenne** nulle
//    part (`07-` §1.1 et §4 règle 6) — et rien qui y ressemble : ni bonne
//    réponse, ni score, ni retour immédiat sur ce que l'élève vient de cocher.
//    D'ailleurs l'écran NE SAURAIT PAS le dire : la correspondance en base ne
//    déclare nulle part laquelle des réponses vaut « réussi »
//    (cf. le bandeau de `utils/deroule/juger.ts`).
//
// ⚠️ ON NE DEMANDE JAMAIS À L'ÉLÈVE CE QU'IL N'A PAS COMPRIS (`02-` §5) :
//    aucune consigne, aucun champ, aucun bouton de ce genre ici. La lucidité
//    est de la métacognition SPONTANÉE, relevée ailleurs ; *c'est la
//    CALIBRATION que cette phase mesure, jamais la lucidité.*
// ============================================================================

import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { actionOuvrirSeJuger, actionSeJuger } from '@/app/deroule/actions'
import type { OffreSeJuger } from '@/utils/deroule/juger'
import type { QuestionServie } from '@/utils/deroule/types'

/**
 * ⚠️ LA CLÉ D'UNE RÉPONSE EST `competence|observable_code`, et ce n'est pas un
 *    choix d'écran : c'est ce que `comparerAuSquelette` va chercher
 *    (`utils/deroule/juger.ts` — `const clef = \`${q.competence}|${...}\``).
 *    Une clé sur le seul code perdrait les questions de deux compétences qui
 *    portent le même observable : la seconde écraserait la première, et la
 *    comparaison lirait `''` — donc « pas répondu » — sur une réponse donnée.
 */
const cle = (q: QuestionServie) => `${q.competence}|${q.observable_code}`

/**
 * Le compte en toutes lettres. « Deux à trois questions » (la fiche §4) — mais
 * l'offre en sert moins quand la banque n'en porte pas davantage, et un écran
 * qui annoncerait « Trois questions » devant deux mentirait à l'élève.
 */
const COMBIEN: Record<number, string> = {
  1: 'Une question', 2: 'Deux questions', 3: 'Trois questions',
}

/**
 * @param texteRendu ⭐ HANDOFF §5 — la ligne repliée « ▸ Relire ce que tu as
 *        rendu ». L'écran ne montre plus ni la matière ni le champ, mais l'élève
 *        doit pouvoir relire CE QU'IL VIENT DE RENDRE pour se juger dessus :
 *        c'est l'objet même de la phase. ⚠️ En LECTURE SEULE, et replié —
 *        déplié, il repeuplerait l'écran de ce que 2d range.
 *        `null` aux crans où l'élève n'a rien rédigé : rien à relire, rien à
 *        replier.
 */
export function SeJuger({
  depotId, offre, texteRendu = null,
}: { depotId: string; offre: OffreSeJuger; texteRendu?: string | null }) {
  const router = useRouter()
  const [reponses, setReponses] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const idTitre = useId()

  const questions = offre.questions

  /**
   * ⭐ L'OUVERTURE DE LA PHASE EST HORODATÉE — `juger_debut_at` (`07-` §1.1) :
   * la phase commence quand l'élève la VOIT, pas quand il l'envoie, sans quoi
   * le temps passé à se juger vaudrait zéro. L'écriture est idempotente côté
   * serveur (`ouvrirSeJuger` n'écrit que si la colonne est nulle) : un
   * rechargement ne redémarre pas le chronomètre.
   */
  useEffect(() => {
    if (questions.length === 0) return
    void actionOuvrirSeJuger(depotId)
  }, [depotId, questions.length])

  // Rien à servir : la banque ne portait aucune question pour les observables
  // élus. On n'affiche pas une section vide — et surtout pas la liste des
  // codes, qui est du ressort du journal.
  if (questions.length === 0) return null

  // ⭐ TOUT OU RIEN : l'envoi reste fermé tant qu'une question n'a pas sa
  //    réponse. Une réponse manquante partirait en `''`, que la comparaison lit
  //    comme « pas répondu » — un trou silencieux dans la mesure.
  const complet = questions.every((q) => reponses[cle(q)] !== undefined)

  async function envoyer() {
    if (enCours || !complet) return
    setEnCours(true)
    setMessage(null)
    try {
      const r = await actionSeJuger(depotId, reponses)
      if (!r.ok) {
        setMessage(r.message || 'L’enregistrement n’a pas abouti. Réessaie.')
        setEnCours(false)
        return
      }
      // Le temps suivant s'ouvre côté serveur : on relit, on n'invente pas
      // l'état d'après à l'écran.
      router.refresh()
    } catch {
      setMessage('L’enregistrement n’a pas abouti. Réessaie.')
      setEnCours(false)
    }
  }

  const combien = COMBIEN[questions.length] ?? `${questions.length} questions`

  return (
    // ⭐ HANDOFF §5 — UNE COLONNE CENTRÉE DE 660 px, et rien autour : ni matière,
    //    ni champ. C'est le parent qui les range (`ecranDuDeroule === 'se_juger'`).
    <section aria-labelledby={idTitre} className="mx-auto flex w-full max-w-[660px] flex-col gap-4">
      <div>
        <h2 id={idTitre} className="font-titre text-[25px] font-bold leading-tight text-encre
                                    sm:text-[30px]">
          Avant de voir ton retour
        </h2>
        <p className="mt-2 font-corps text-[16.5px] leading-[1.55] text-encre-douce">
          {combien} sur ce que tu viens de rendre.{' '}
          <strong className="text-encre">Ça ne se note pas</strong> : se tromper en se jugeant
          ne coûte rien.
        </p>
      </div>

      {/* ⭐ Relire, oui — REPLIÉ. `<details>` natif : aucun état client, et le
          texte reste dans le document, donc trouvable au `Ctrl+F`. */}
      {texteRendu && texteRendu.trim() !== '' && (
        <details className="group rounded-xl border border-bordure bg-surface">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-3">
            <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
            <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
            <span className="font-corps text-[15px] text-encre-douce">
              Relire ce que tu as rendu
            </span>
          </summary>
          <p className="whitespace-pre-wrap border-t border-bordure px-4 py-3 font-corps
                        text-[15.5px] leading-[1.7] text-encre-douce">
            {texteRendu}
          </p>
        </details>
      )}

      {questions.map((q) => {
        const clef = cle(q)
        const choisie = reponses[clef]
        return (
          <div
            key={clef}
            role="radiogroup"
            aria-label={q.question}
            className="rounded-xl border border-bordure bg-surface p-4 sm:px-5 sm:py-[17px]"
          >
            {/* ⚠️ La DIMENSION en langue élève, jamais `observable_code`. */}
            <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                          text-muet">
              {q.dimension_eleve}
            </p>
            <p className="mb-3 mt-[7px] font-corps text-[17px] leading-[1.45] text-encre
                          sm:text-[18px]">
              {q.question}
            </p>

            {/* ⚠️ La liste FERMÉE, telle quelle et dans l'ordre reçu.
                ⭐ À PARTS ÉGALES sur l'ordinateur, EMPILÉES sur le téléphone
                   (handoff §5) — jamais un enroulement qui couperait la
                   troisième réponse hors de l'écran. */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2.5">
              {q.reponses.map((r) => {
                const active = choisie === r
                return (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={enCours}
                    onClick={() => setReponses((v) => ({ ...v, [clef]: r }))}
                    // ⚠️ 48 px de haut : « l'écran est souvent un téléphone »
                    //    (`07-` §3 ; handoff §5).
                    className={`min-h-12 flex-1 rounded-[9px] border px-4 py-3.5 font-ui
                                text-[15px] ${active
                      ? 'border-pigment/40 bg-pigment-teinte font-semibold text-pigment'
                      : 'border-bordure-bouton bg-parchemin text-encre-douce'}`}
                  >
                    {r}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* ⭐ UN SEUL BOUTON ENVOIE TOUT — le geste est un, la phase est une.
          ⚠️ Il reste MONTÉ et VISIBLE quand il est fermé (42 % d'opacité,
             handoff §5) : un bouton qui apparaîtrait à la troisième réponse
             cacherait à l'élève ce que l'écran attend de lui. */}
      <button
        type="button"
        onClick={envoyer}
        disabled={enCours || !complet}
        className="min-h-12 rounded-[10px] bg-bouton px-4 py-4 font-ui text-[15px] font-semibold
                   text-bouton-texte disabled:opacity-[.42]"
      >
        {enCours ? 'Envoi…' : 'Envoyer mes réponses'}
      </button>
      {!complet && (
        <p className="text-center font-corps text-sm italic text-muet">
          Réponds {questions.length > 1 ? `aux ${MOTS[questions.length] ?? questions.length} questions` : 'à la question'} pour pouvoir envoyer.
        </p>
      )}
      {message && <p className="text-sm text-retard">{message}</p>}
    </section>
  )
}

/**
 * Le compte EN TOUTES LETTRES, comme `COMBIEN` — pour la même raison : l'offre
 * en sert deux ou trois, et « Réponds aux 3 questions » à côté de « Deux
 * questions » se contredirait à l'œil.
 */
const MOTS: Record<number, string> = { 2: 'deux', 3: 'trois' }
