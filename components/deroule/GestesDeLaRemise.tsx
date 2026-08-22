'use client'
// ============================================================================
// C4 · L3 — LES TROIS GESTES DE LA REMISE, À L'ÉCRAN.
// ----------------------------------------------------------------------------
// « À la remise de la v1, l'élève fait TROIS GESTES COURTS, DANS CET ORDRE : la
//   confiance, les conditions, la restitution » (`06-` §3). Ils coûtent **DES
//   SECONDES**, pas des minutes. **Aucun des trois n'est noté, et aucun ne
//   revient à l'élève comme un jugement** — rien ici n'affiche de note, de
//   lettre ni de moyenne (`07-` §1.1 ; §4 règle 6).
//
// ⭐ **UN GESTE À LA FOIS, ET C'EST CE QUI LES REND COURTS.** L'ordre vient du
//    serveur — `vue.gestesRestants` est DÉJÀ ORDONNÉ (`utils/deroule/gestes.ts`)
//    — et cet écran ne présente **que le premier restant**. Trois panneaux
//    empilés feraient un formulaire ; un panneau à la fois fait un geste.
//
// ⭐ LA RESTITUTION SE PLACE **AVANT TOUT ENVOI À L'IA** (`06-` §3). Ce n'est
//    pas une politesse d'écran : **le serveur REFUSE la remise tant que la
//    restitution et les conditions manquent**. L'encart « Tu peux rendre ta
//    copie. » est donc le seul endroit qui dit à l'élève que la porte est
//    ouverte — il ne décore pas, il informe.
//
// ⚠️ **LES LIBELLÉS À L'ÉCRAN SONT LIBRES ; LA VALEUR STOCKÉE EST CELLE DE
//    L'ENUM** (`06-` §3 ; la fiche §2). Les deux tables ci-dessous sont donc
//    indexées par l'enum de `utils/deroule/types.ts`, jamais par une chaîne
//    réécrite ici : changer un mot à l'écran ne peut pas changer la mesure.
//
// ⚠️ **`non_exprimee` N'EST PAS UN BOUTON.** C'est une valeur d'EXTRACTION — on
//    ne demande rien à l'élève pour l'obtenir. Il y a **trois boutons, jamais un
//    quatrième « je ne sais pas »**, et `CONFIANCES` ne la porte pas.
//
// ⚠️ **CE QUE LES CONDITIONS COMMANDENT NE S'AFFICHE JAMAIS.** Une mesure
//    déclarée bâclée ne fait pas monter une lettre, et trois `pas_pu` d'affilée
//    lèvent un drapeau professeur — **jamais un allègement** (`01-` §9 ; C6-L1).
//    Dire l'une ou l'autre à l'élève le rendrait STRATÉGIQUE, et la déclaration
//    cesserait de mesurer quoi que ce soit. Les deux règles jouent **en aval**.
//
// ⚠️ **LA LUCIDITÉ N'A AUCUN ÉCRAN** (`02-` §5) : rien ici ne demande à l'élève
//    de signaler ce qu'il n'a pas compris — aucune consigne, aucun champ, aucun
//    bouton, et rien ne doit jamais s'y ajouter.
//
// ⚠️ **L'ÉCRAN EST SOUVENT UN TÉLÉPHONE** (`07-` §3) : tout ce qui se touche
//    tient 44 px de haut. C'est une règle de source, pas du confort.
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONFIANCES, CONDITIONS } from '@/utils/deroule/types'
import type { Competence, Condition, Confiance } from '@/utils/deroule/types'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import { actionConfiance, actionConditions, actionRestitution } from '@/app/deroule/actions'

/**
 * ⚠️ RECOPIÉ, ET NON IMPORTÉ : `utils/deroule/gestes.ts` ouvre sur
 *    `import 'server-only'`, et un composant client qui l'importerait casserait
 *    le build. **Le serveur reste l'autorité** — il refuse au-delà de la borne ;
 *    ici la borne n'est qu'un confort de saisie. Les deux valeurs se suivent.
 */
const RESTITUTION_MAX = 400

/** Les six compétences EN FRANÇAIS LISIBLE — jamais l'identifiant nu (RR4). */
const NOM_COMPETENCE: Record<Competence, string> = {
  expression: 'Expression',
  argumentation: 'Argumentation',
  structure: 'Structure',
  connaissance: 'Connaissance',
  synthese: 'Synthèse',
  questionnement: 'Questionnement',
}

/** Libellés LIBRES ; les clés, elles, sont l'enum stocké. */
const LIBELLE_CONFIANCE: Record<Confiance, string> = {
  elevee: 'Sûr de moi',
  moyenne: 'Moyennement sûr',
  faible: 'Pas sûr',
}

const LIBELLE_CONDITION: Record<Condition, string> = {
  temps_mis: 'J’y ai mis le temps',
  au_plus_vite: 'Fait au plus vite',
  pas_pu: 'Pas pu m’y mettre',
}

export function GestesDeLaRemise({ vue }: { vue: VueDuDeroule }) {
  // `gestesRestants` est déjà dans l'ordre de la doctrine : on prend le premier.
  const geste = vue.gestesRestants[0]

  if (geste === undefined) {
    return (
      <div className="rounded-lg border border-bordure bg-surface p-4">
        <p className="text-sm text-encre-douce">Tu peux rendre ta copie.</p>
      </div>
    )
  }

  if (geste === 'confiance') {
    // ⚠️ AUCUNE compétence évaluée → LE GESTE NE SE PRÉSENTE PAS, et ce n'est
    //    pas une erreur (la fiche §6, flux 2). Le serveur le sait déjà — il ne
    //    met pas « confiance » dans les restants —, mais l'écran ne se repose
    //    pas là-dessus : une liste vide ne doit jamais produire un panneau muet.
    if (vue.competencesDeLaConfiance.length === 0) return null
    return <LaConfiance depotId={vue.depotId} competences={vue.competencesDeLaConfiance} />
  }

  if (geste === 'conditions') return <LesConditions depotId={vue.depotId} />

  return <LaRestitution depotId={vue.depotId} />
}

// ── Geste 1 — LA CONFIANCE ──────────────────────────────────────────────────

/**
 * ⚠️ **UNE VALEUR PAR COMPÉTENCE, JAMAIS UN SCALAIRE** (`07-` §1.1) : une
 *    passation en mesure trois ou quatre, et une sûreté moyenne ne dit rien de
 *    celle qu'on avait sur l'Argumentation.
 *
 * ⚠️ **LES TROIS BOUTONS SONT OBLIGATOIRES** : on n'envoie qu'une fois TOUTES
 *    les compétences renseignées, et **d'un seul coup**. Compléter un manque par
 *    un défaut fabriquerait une confiance que l'élève n'a pas déclarée.
 */
function LaConfiance(
  { depotId, competences }: { depotId: string; competences: Competence[] },
) {
  const router = useRouter()
  const [choix, setChoix] = useState<Partial<Record<Competence, Confiance>>>({})
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const complet = competences.every((c) => choix[c] !== undefined)

  async function envoyer() {
    if (enCours || !complet) return
    setEnCours(true)
    setMessage(null)
    try {
      const valeurs: Record<string, string> = {}
      for (const c of competences) {
        const v = choix[c]
        if (v === undefined) return
        valeurs[c] = v
      }
      const r = await actionConfiance(depotId, valeurs)
      if (!r.ok) { setMessage(r.message); return }
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'La confiance n’a pas été enregistrée.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        Avant de rendre — comment te sens-tu ?
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Une réponse par point de travail. C’est l’affaire de quelques secondes.
      </p>

      <div className="mt-3 space-y-4">
        {competences.map((c) => (
          <fieldset key={c}>
            <legend className="text-sm text-encre">{NOM_COMPETENCE[c] ?? c}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONFIANCES.map((v) => (
                <Bouton
                  key={v}
                  actif={choix[c] === v}
                  onClick={() => setChoix((prec) => ({ ...prec, [c]: v }))}
                >
                  {LIBELLE_CONFIANCE[v]}
                </Bouton>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button" onClick={envoyer} disabled={enCours || !complet}
        className="mt-4 min-h-[44px] rounded bg-bouton px-4 py-2 text-sm text-parchemin
                   disabled:opacity-40"
      >
        {enCours ? 'Envoi…' : 'Continuer'}
      </button>
      {/* ⚠️ Le ton reste NEUTRE : ce n'est pas un jugement, et l'élève ne doit
          pas lire ici qu'une réponse vaudrait mieux qu'une autre. */}
      <p className="mt-2 text-xs text-muet">Ça ne compte pas dans ton travail.</p>
      {message && <p className="mt-2 text-sm text-retard">{message}</p>}
    </section>
  )
}

// ── Geste 2 — LES CONDITIONS DE TRAVAIL ─────────────────────────────────────

/**
 * ⚠️ **IL NE SE CONFOND PAS AVEC LA MICRO-QUESTION DE DÉPASSEMENT** (`06-` §3) :
 *    celle-là porte sur **LE TEMPS** — « tu y es depuis un moment : pause, ou
 *    difficulté ? » —, celui-ci porte sur **L'EFFORT**. Deux questions, deux
 *    colonnes, deux moments : la première pendant l'écriture, celle-ci à la
 *    remise. Les fondre en une seule perdrait les deux mesures.
 *
 * ⚠️ Un geste UNIQUE, TROIS VALEURS : un clic suffit, et il vaut envoi.
 */
function LesConditions({ depotId }: { depotId: string }) {
  const router = useRouter()
  const [enCours, setEnCours] = useState<Condition | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function envoyer(valeur: Condition) {
    if (enCours !== null) return
    setEnCours(valeur)
    setMessage(null)
    try {
      const r = await actionConditions(depotId, valeur)
      if (!r.ok) { setMessage(r.message); return }
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Les conditions n’ont pas été enregistrées.')
    } finally {
      setEnCours(null)
    }
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        Dans quelles conditions as-tu travaillé ?
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Dis-le franchement : personne ne te le reprochera.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CONDITIONS.map((v) => (
          <Bouton key={v} actif={enCours === v} onClick={() => { void envoyer(v) }}>
            {LIBELLE_CONDITION[v]}
          </Bouton>
        ))}
      </div>
      {/* ⚠️ On ne dit RIEN de ce que cette déclaration commande en aval — le
          dire rendrait l'élève stratégique, et la mesure serait perdue. */}
      <p className="mt-2 text-xs text-muet">Ça ne compte pas dans ton travail.</p>
      {message && <p className="mt-2 text-sm text-retard">{message}</p>}
    </section>
  )
}

// ── Geste 3 — LA RESTITUTION À CHAUD ────────────────────────────────────────

/**
 * ⭐ « **Ta thèse en une phrase ?** — TRENTE SECONDES AU CLAVIER », et **AVANT
 *    TOUT ENVOI À L'IA** (`06-` §3). Le champ est donc COURT par construction :
 *    deux lignes et une borne, parce qu'un grand cadre appelle un paragraphe et
 *    qu'un paragraphe n'est plus une restitution.
 *
 * ⚠️ Rien ne se compare ici, et rien ne bloque : l'incohérence avec le squelette
 *    est un signal du faisceau qui se lit **en aval** (`01-` §9).
 */
function LaRestitution({ depotId }: { depotId: string }) {
  const router = useRouter()
  const [texte, setTexte] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function envoyer() {
    if (enCours || texte.trim() === '') return
    setEnCours(true)
    setMessage(null)
    try {
      const r = await actionRestitution(depotId, texte)
      if (!r.ok) { setMessage(r.message); return }
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'La restitution n’a pas été enregistrée.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        Ta thèse en une phrase ?
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Trente secondes, de mémoire, sans relire ta copie.
      </p>
      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={2}
        maxLength={RESTITUTION_MAX}
        // ⚠️ Le fond passe par `style` : la règle nue de `globals.css` sur
        //    `input, textarea, select` n'est dans aucune couche Tailwind et
        //    l'emporte sur une classe `bg-*`.
        style={{ backgroundColor: 'var(--parchemin)' }}
        className="mt-3 w-full rounded border border-bordure-bouton p-3 font-corps text-base
                   leading-relaxed text-encre"
      />
      <p className="mt-1 text-xs text-muet">{texte.length} / {RESTITUTION_MAX} caractères.</p>
      <button
        type="button" onClick={envoyer} disabled={enCours || texte.trim() === ''}
        className="mt-3 min-h-[44px] rounded bg-bouton px-4 py-2 text-sm text-parchemin
                   disabled:opacity-40"
      >
        {enCours ? 'Envoi…' : 'Continuer'}
      </button>
      <p className="mt-2 text-xs text-muet">Ça ne compte pas dans ton travail.</p>
      {message && <p className="mt-2 text-sm text-retard">{message}</p>}
    </section>
  )
}

// ── Le bouton de choix, commun aux deux gestes à boutons ────────────────────

/** ⚠️ 44 px de haut : « l'écran est souvent un téléphone » (`07-` §3). */
function Bouton(
  { actif, onClick, children }:
  { actif: boolean; onClick: () => void; children: React.ReactNode },
) {
  return (
    <button
      type="button" onClick={onClick} aria-pressed={actif}
      className={`min-h-[44px] rounded border border-bordure-bouton px-3 py-1 text-sm ${
        actif ? 'bg-pigment-teinte font-semibold text-pigment' : 'text-encre-douce'}`}
    >
      {children}
    </button>
  )
}
