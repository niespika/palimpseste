'use client'
// ============================================================================
// C4 · L3 — LA CRÉDENCE À L'ÉCRAN : le geste qui se déclare AVANT de savoir.
// ----------------------------------------------------------------------------
// « La probabilité que l'élève accorde à sa propre réponse, déclarée PENDANT
//   l'exercice, AVANT QU'IL SACHE S'IL A RAISON » (`06-` §3). Ce composant est
//   la main de `utils/deroule/credence.ts`, qui porte toute la doctrine :
//   **il SAISIT, il ne calcule rien** — « le Monitoring ne reçoit que l'accord
//   crédence ↔ réussite, calculé EN AVAL » (`07-` §1.4 ; piège 23).
//
// SA FORME SUIT LE CRAN, et le `02-` §5 est exact :
//   · `repartition` — les DEUX crans guidés (`diagnostic_guide`,
//     `transformation_guidee`) : QUATRE candidats sont servis, et l'élève
//     RÉPARTIT DES JETONS SUR 100 entre eux ;
//   · `pourcentage` — les QUATRE crans qui isolent (`diagnostic_nomme`,
//     `transformation_nommee`, `transformation_aveugle`, `diagnostic_fin`) :
//     AUCUN candidat n'est servi, l'élève a répondu ailleurs et il donne ici UN
//     POURCENTAGE UNIQUE sur SA propre réponse.
//
// ⚠️⚠️ **`offre.indexAttendue` N'EST LU PAR AUCUN RENDU. JAMAIS.** Il voyage
//    dans l'offre parce que le SERVEUR en a besoin pour journaliser
//    `index_correct` (`saisieARegistrer`) ; **à l'écran, il est du poison**. Ni
//    classe, ni ordre, ni tri, ni `key`, ni `aria-*`, ni `title`, ni un point
//    discret : *une seule de ces fuites et la crédence ne mesure plus rien* —
//    l'élève lit la bonne réponse dans son écran et pose 100 jetons dessus.
//    **C'est LE mode de panne de ce composant, et il est silencieux** : rien ne
//    casse, aucun test ne rougit, la mesure devient simplement fausse, et elle
//    le reste. Si un jour ce fichier doit lire `indexAttendue`, c'est que la
//    doctrine a changé — pas que le rendu avait besoin d'un raccourci.
//
// ⭐ LES CANDIDATS SE RENDENT DANS L'ORDRE REÇU — ils sont **déjà mêlés** par le
//    serveur (décision de Louis, piège 37 : le mêlage réel de la passation vit
//    dans `offreDeCredence`, semé sur (dépôt × cas), « sans quoi un élève
//    apprend que la dernière est la bonne »). ⚠️ **Cet écran ne remêle RIEN et
//    ne retrie RIEN** : un second mêlage au rendu ferait désigner par
//    `index_correct` un autre candidat que celui affiché, et l'accord versé au
//    Monitoring porterait sur la mauvaise case.
//
// ⚠️ « TROIS DISTRACTEURS EN BANQUE SONT LE PLANCHER ; en dessous, l'instance ne
//    peut pas composer son écran — **signale, ne complète pas** » (piège 23) :
//    sur un `empechement`, ce composant ne rend RIEN. Le parent ne le monte pas
//    dans ce cas — la garde est ici quand même, parce qu'une garde qui dépend de
//    son appelant n'est pas une garde.
//
// ⚠️ RIEN ICI NE JUGE, ET RIEN NE REVIENT : la phase est silencieuse, elle ne
//    produit aucun retour (la fiche §4). L'écran ne dit JAMAIS à l'élève s'il
//    avait raison — c'est la définition même du geste —, et **aucune note,
//    aucune lettre, aucune moyenne** n'y paraît (`07-` §1.1 ; §4 règle 6).
//
// ⚠️ L'ÉCRAN EST SOUVENT UN TÉLÉPHONE (`07-` §3) : toute cible touchable fait
//    44 px de haut, curseurs et boutons de pas compris. Ce n'est pas du confort,
//    c'est une règle de source.
//
// ⚠️ Une fois la crédence envoyée, ce composant n'est plus monté : le parent le
//    retire sur `credenceDonnee`. Il n'y a donc AUCUN état « déjà donnée » à
//    porter ici — et il ne faut pas en inventer un, sous peine de servir deux
//    vérités contradictoires sur la même saisie.
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actionCredence } from '@/app/deroule/actions'
import { CANDIDATS_SERVIS, type OffreCredence } from '@/utils/deroule/credence'

/** Le budget de jetons à répartir — « SUR 100 » (`02-` §5), jamais autre chose. */
const BUDGET = 100

/**
 * ⭐ LE PAS DES BOUTONS EST DE 1, PAS DE 5. Un pas de 5 est plus agréable au
 * doigt, mais il laisse des restes inatteignables : à 97 placés, « +5 » dépasse
 * et l'élève ne peut plus fermer sa répartition sans revenir au curseur. Le pas
 * de 1 garantit qu'on tombe TOUJOURS sur 100 au doigt seul ; le curseur, lui,
 * fait le gros du trajet.
 */
const PAS = 1

/** Le défaut du pourcentage : le milieu, seul défaut qui ne pousse nulle part. */
const DEFAUT_POURCENTAGE = 50

/**
 * @param nu handoff « Codex Exercices (élève) » §4, écran 2b — aux deux crans
 *        guidés, **les quatre lectures REMPLACENT le champ de rédaction** et
 *        occupent la colonne de droite : la crédence n'y est plus une section
 *        de plus dans une pile, elle EST le travail. Le parent porte alors le
 *        cadre et le sur-titre, et ce composant ne rend que son contenu.
 *        ⚠️ Aux quatre crans qui isolent, l'élève a répondu ailleurs : la
 *           crédence garde son propre cadre, et `nu` reste faux.
 */
export function CredenceSaisie({
  depotId, cas, offre, nu = false,
}: { depotId: string; cas: number; offre: OffreCredence; nu?: boolean }) {
  const router = useRouter()

  // ⚠️ Les jetons partent de ZÉRO, pas de 25 chacun : un défaut déjà valide
  //    (4 × 25 = 100) laisserait envoyer sans avoir rien décidé, et une crédence
  //    non décidée est du bruit versé dans la chaîne. À zéro, le geste est
  //    obligatoirement posé — et l'écran dit combien il reste à placer.
  const [jetons, setJetons] = useState<number[]>(
    () => Array.from({ length: CANDIDATS_SERVIS }, () => 0))
  const [pourcentage, setPourcentage] = useState(DEFAUT_POURCENTAGE)
  const [enCours, setEnCours] = useState(false)
  const [refus, setRefus] = useState<string | null>(null)

  const total = jetons.reduce((a, b) => a + b, 0)
  const reste = BUDGET - total

  // ⚠️ LA GARDE DE L'EMPÊCHEMENT — « signale, ne complète pas ».
  if (offre.empechement) return null
  // Et la garde jumelle : aux crans guidés, l'écran sert QUATRE candidats ou
  // rien. Une offre mal formée ne se rafistole pas ici, elle ne se rend pas.
  if (offre.forme === 'repartition' && offre.candidats.length !== CANDIDATS_SERVIS) return null

  const repartition = offre.forme === 'repartition'

  /**
   * ⭐ LE BUDGET EST UN PLAFOND DUR : on ne peut pas placer plus de 100 jetons
   * en tout. Le curseur bute au lieu de dépasser — donner davantage à un
   * candidat oblige à en retirer à un autre, ce qui EST la nature d'une
   * répartition de probabilités. Le prix assumé : le curseur cesse de bouger
   * quand le budget est épuisé, et le total juste dessous dit pourquoi.
   */
  function poser(i: number, valeur: number) {
    setJetons((prev) => {
      const autres = prev.reduce((a, x, k) => (k === i ? a : a + x), 0)
      const borne = Math.max(0, Math.min(valeur, BUDGET - autres))
      return prev.map((x, k) => (k === i ? borne : x))
    })
  }

  async function envoyer() {
    if (enCours) return
    setEnCours(true)
    setRefus(null)
    try {
      const r = repartition
        ? await actionCredence(depotId, cas, { jetons })
        : await actionCredence(depotId, cas, { pourcentage })
      if (!r.ok) {
        setRefus(r.message)
        setEnCours(false)
        return
      }
      // ⚠️ `enCours` RESTE vrai après un succès, volontairement : la crédence est
      //    prise, le parent va retirer ce composant au rafraîchissement, et d'ici
      //    là le bouton ne doit pas pouvoir repartir — « UNE PAR DIAGNOSTIC »
      //    (`07-` §1.2).
      router.refresh()
    } catch {
      setRefus('L’envoi n’a pas abouti. Réessaie dans un instant — rien n’est perdu.')
      setEnCours(false)
    }
  }

  // ⭐ LE CANDIDAT LE PLUS CHARGÉ SE DÉTACHE — **effet de la saisie, jamais un
  //    indice** (handoff §4). Il ne se calcule que sur `jetons`, l'état local :
  //    rien de `offre.indexAttendue` n'y entre, ni ici ni ailleurs.
  // ⚠️ Une ÉGALITÉ ne désigne personne : `-1` tant que le maximum est partagé,
  //    sans quoi l'écran mettrait en avant le premier ex æquo — c'est-à-dire
  //    l'ordre de service, qui ne veut rien dire.
  const plusHaut = Math.max(...jetons)
  const seul = plusHaut > 0 && jetons.filter((j) => j === plusHaut).length === 1
  const charge = seul ? jetons.indexOf(plusHaut) : -1

  const contenu = (
    <>
      {repartition ? (
        <>
          <p className="font-corps text-base leading-relaxed text-encre">
            Répartis <strong>100 jetons</strong> entre ces quatre réponses. Plus tu en poses sur
            une, plus tu la crois juste. Tu peux tout mettre sur une seule, ou étaler.
          </p>

          {/* ⚠️ `offre.candidats` DANS L'ORDRE REÇU. Pas de tri, pas de mêlage,
              pas de mise en avant — et surtout rien qui vienne de
              `offre.indexAttendue`, y compris la `key`. */}
          <div className="mt-3 flex flex-col gap-2.5">
            {offre.candidats.map((candidat, i) => (
              <Curseur
                key={`${i}-${candidat}`}
                id={`credence-${cas}-${i}`}
                libelle={candidat}
                valeur={jetons[i] ?? 0}
                plafond={(jetons[i] ?? 0) + Math.max(0, reste)}
                suffixe=""
                gele={enCours}
                retenu={charge === i}
                surValeur={(v) => poser(i, v)}
              />
            ))}
          </div>

          {/* Le total, EN PERMANENCE. Écrit « sur 100 » et non « / 100 » : une
              barre de fraction se lit comme une note, et il n'y a pas de note. */}
          <div
            className="mt-3 flex items-center justify-between rounded-[10px] bg-parchemin-fonce
                       px-4 py-3"
          >
            <span className="font-ui text-sm text-encre-douce">Jetons placés</span>
            <span className="font-ui text-[15px] font-semibold tabular-nums text-encre">
              {total} sur {BUDGET}
            </span>
          </div>
          {total !== BUDGET && (
            <p className="mt-2 text-sm text-attention">
              {reste > 0
                ? `Il t’en reste ${reste} à placer avant de pouvoir envoyer.`
                : `Tu en as placé ${-reste} de trop : retires-en ${-reste}.`}
            </p>
          )}
        </>
      ) : (
        <>
          {/* ⚠️ AUCUN CANDIDAT N'EST SERVI À CES QUATRE CRANS : l'élève a répondu
              ailleurs, et la crédence porte sur SA propre réponse. */}
          <p className="font-corps text-base leading-relaxed text-encre">
            Donne une chance sur 100 à <strong>ta propre réponse</strong>, celle que tu viens
            d’écrire : 0 si tu es certain de t’être trompé, 100 si tu es certain d’avoir juste.
          </p>
          <div className="mt-3">
            <Curseur
              id={`credence-${cas}-surete`}
              libelle="Ma chance d’avoir juste"
              valeur={pourcentage}
              plafond={BUDGET}
              suffixe=" %"
              gele={enCours}
              surValeur={setPourcentage}
            />
          </div>
        </>
      )}

      {/* ⭐ UN SEUL BOUTON (handoff §4) : la répartition EST la réponse, il n'y
          a donc pas deux gestes à distinguer. 48 px au pouce. */}
      <button
        type="button"
        onClick={() => { void envoyer() }}
        disabled={enCours || (repartition && total !== BUDGET)}
        className="mt-3 min-h-12 w-full rounded-[10px] bg-bouton px-4 py-3 font-ui text-[15px]
                   font-semibold text-bouton-texte disabled:opacity-40"
      >
        {enCours ? 'Envoi…' : repartition ? 'Enregistrer ma réponse' : 'Enregistrer'}
      </button>

      {/* Le texte dit ce que le geste MESURE, sans le juger — et il ne promet
          aucun verdict en retour : l'élève ne saura pas ici s'il avait raison. */}
      <p className="mt-2.5 text-center font-corps text-[13.5px] italic leading-relaxed text-muet">
        Ça ne compte pas dans une note — il n’y en a pas. Ce que ça regarde, c’est l’écart
        entre ce que tu crois savoir et ce que tu sais : réponds comme tu le sens vraiment.
      </p>

      {/* Le refus vient de l'action : on l'affiche tel quel, on ne le réécrit
          pas — c'est le serveur qui sait pourquoi la saisie n'a pas été prise. */}
      {refus && <p className="mt-2 text-sm text-retard">{refus}</p>}
    </>
  )

  if (nu) return <div>{contenu}</div>

  return (
    <section className="rounded-xl border border-bordure bg-surface p-4">
      <h2 className="mb-2 font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                     text-muet">
        À quel point es-tu sûr ?
      </h2>
      {contenu}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CURSEUR — la seule pièce tactile, et elle sert aux deux formes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un curseur entier de 0 à 100, flanqué de deux boutons de pas.
 *
 * ⚠️ TOUTES LES CIBLES FONT 44 px (`h-11`, `w-11`) : « l'écran est souvent un
 *    téléphone » (`07-` §3). Un curseur de 20 px se rate au doigt, et un geste
 *    raté fausse la déclaration qu'on prétend mesurer.
 *
 * ⚠️ Les valeurs sont des ENTIERS de bout en bout : `step={1}` au curseur,
 *    `Math.round` à l'entrée, et `saisieARegistrer` refuse tout le reste côté
 *    serveur. Deux gardes, parce qu'un flottant qui passe casse la somme à 100.
 */
function Curseur({
  id, libelle, valeur, plafond, suffixe, gele, surValeur, retenu = false,
}: {
  id: string
  libelle: string
  valeur: number
  /** La valeur maximale atteignable AU BOUTON, budget restant compris. */
  plafond: number
  suffixe: string
  gele: boolean
  surValeur: (v: number) => void
  /**
   * ⭐ La carte porte le plus de jetons — **effet de la saisie, jamais un
   *    indice** (handoff §4). ⛔ Elle ne se calcule QUE sur ce que l'élève a
   *    posé : `offre.indexAttendue` n'entre dans aucun rendu, et surtout pas
   *    dans celui-ci.
   */
  retenu?: boolean
}) {
  const borner = (v: number) => Math.max(0, Math.min(100, Math.round(v)))
  return (
    <div className={`rounded-[11px] border p-3.5 ${retenu
      ? 'border-saisie-retenue-bordure bg-saisie-retenue'
      : 'border-bordure bg-surface'}`}>
      {/* Le libellé EST le nom accessible du curseur : pas d'`aria-label` qui
          l'écraserait, et surtout rien d'autre à dire sur ce candidat. */}
      <label htmlFor={id} className="block font-corps text-[15.5px] leading-[1.45] text-encre">
        {libelle}
      </label>
      <div className="mt-2.5 flex items-center gap-2.5">
        {/* ⚠️ 48 px au pouce, 44 px au-delà (handoff §7) : « l'écran est souvent
            un téléphone » (`07-` §3). Un geste raté fausse la déclaration
            qu'on prétend mesurer. */}
        <button
          type="button"
          onClick={() => surValeur(borner(valeur - PAS))}
          disabled={gele || valeur <= 0}
          aria-label={`Retirer ${PAS} à « ${libelle} »`}
          className="size-12 shrink-0 rounded-[9px] border border-bordure-bouton bg-surface
                     text-lg text-muet disabled:opacity-40 sm:size-11"
        >
          −
        </button>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={valeur}
          disabled={gele}
          onChange={(e) => surValeur(borner(Number(e.target.value)))}
          // ⚠️ Le fond et la teinte passent par `style`, jamais par une classe :
          //    la règle nue de `globals.css` sur `input, textarea, select`
          //    (fond blanc) n'est dans aucune couche Tailwind et l'emporte sur un
          //    `bg-*` — même constat que `ChampDeRedaction` (hérité de C4-L4).
          style={{ backgroundColor: 'transparent', accentColor: 'var(--bouton)' }}
          className="h-11 min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={() => surValeur(borner(valeur + PAS))}
          disabled={gele || valeur >= plafond}
          aria-label={`Ajouter ${PAS} à « ${libelle} »`}
          className="size-12 shrink-0 rounded-[9px] border border-bordure-bouton bg-surface
                     text-lg text-muet disabled:opacity-40 sm:size-11"
        >
          +
        </button>
        <span className={`w-9 shrink-0 text-right font-ui text-[15px] font-semibold tabular-nums
                          ${valeur > 0 ? 'text-encre' : 'text-muet'}`}>
          {valeur}{suffixe}
        </span>
      </div>
    </div>
  )
}
