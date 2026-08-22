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

export function SeJuger({ depotId, offre }: { depotId: string; offre: OffreSeJuger }) {
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

  return (
    <section
      aria-labelledby={idTitre}
      className="rounded-lg border border-bordure bg-surface p-4"
    >
      <h2 id={idTitre} className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        Avant de voir ton retour
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        {COMBIEN[questions.length] ?? `${questions.length} questions`} sur ce que tu viens de
        rendre. <strong>Ça ne se note pas</strong> : se tromper en se jugeant ne coûte rien.
      </p>

      <div className="mt-4 space-y-4">
        {questions.map((q) => {
          const clef = cle(q)
          const choisie = reponses[clef]
          return (
            <div
              key={clef}
              role="radiogroup"
              aria-label={q.question}
              className="rounded border border-bordure bg-parchemin-fonce p-3"
            >
              {/* ⚠️ La DIMENSION en langue élève, jamais `observable_code`. */}
              <p className="font-marque text-xs uppercase tracking-wide text-muet-clair">
                {q.dimension_eleve}
              </p>
              <p className="mt-1 text-base text-encre">{q.question}</p>

              {/* ⚠️ La liste FERMÉE, telle quelle et dans l'ordre reçu. */}
              <div className="mt-2 flex flex-wrap gap-2">
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
                      // ⚠️ 44 px de haut au moins : « l'écran est souvent un
                      //    téléphone » (`07-` §3).
                      className={`min-h-[44px] rounded border border-bordure-bouton px-4 py-2
                                  text-sm ${active
                        ? 'bg-pigment-teinte font-semibold text-pigment'
                        : 'text-encre-douce'}`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ⭐ UN SEUL BOUTON ENVOIE TOUT — le geste est un, la phase est une. */}
      <button
        type="button"
        onClick={envoyer}
        disabled={enCours || !complet}
        className="mt-4 min-h-[44px] rounded bg-bouton px-4 py-2 text-sm text-parchemin
                   disabled:opacity-40"
      >
        {enCours ? 'Envoi…' : 'Envoyer mes réponses'}
      </button>
      {!complet && (
        <p className="mt-2 text-xs text-muet">
          Réponds à chaque question pour pouvoir envoyer.
        </p>
      )}
      {message && <p className="mt-2 text-sm text-retard">{message}</p>}
    </section>
  )
}
