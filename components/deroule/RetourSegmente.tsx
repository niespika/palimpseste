'use client'
// ============================================================================
// C4 · L3 — LE RETOUR À L'ÉCRAN : des POINTS ANCRÉS, contestables un par un.
// ----------------------------------------------------------------------------
// ⭐⭐ **LE RETOUR ARRIVE SEGMENTÉ — ON NE LE DÉCOUPE PAS, ON L'AFFICHE**
//    (`07-` §1.2 ; piège 29). `retour.points` est une **liste de points**,
//    chacun avec son **identifiant STABLE**, son **ancrage**, son **texte**, sa
//    compétence et sa nature. Ce composant **BOUCLE DESSUS** : il ne parse
//    aucun bloc, il ne fabrique aucun identifiant, il ne recompose rien.
//    *Sans cette forme, la contestation redevient un commentaire libre* — et le
//    drapeau des contestations répétées (C6-L1) n'a plus rien à compter.
//
// ⚠️ **RR3 — LES CITATIONS PORTENT LEUR SOURCE** (`01-` §12) : « la copie de
//    l'élève d'un côté, le texte support de l'autre ». Les deux se distinguent
//    À L'ÉCRAN — « tu écris : … » contre « le texte dit : … ». *Sans cela, le
//    retour finit par attribuer à l'élève une phrase de l'auteur qu'il citait*,
//    et l'élève conteste une faute qu'il n'a pas commise.
//
// ⭐ **SUR CHAQUE POINT ANCRÉ, UN BOUTON « JE NE SUIS PAS D'ACCORD » ET UN CHAMP
//    COURT** (`06-` §2). L'action journalise, **et rien d'autre** : la
//    contestation **N'ALTÈRE RIEN AUTOMATIQUEMENT**, l'écran le DIT en toutes
//    lettres, à chaque fois. Et quand la citation ne se retrouve pas dans la
//    copie, le message de l'action annonce l'**EXAMEN HUMAIN** que la loi exige
//    (`06-` §2 et §7) — on affiche donc le message QUE L'ACTION REND, jamais un
//    message d'écran qui dirait autre chose qu'elle.
//
// ⭐ **L'ENCART LANGUE EST SÉPARÉ** (`06-` §2) — hors du retour de compétence,
//    ancré ligne à ligne. C'est de l'**HYGIÈNE**, « hors lettre, hors
//    calibration » : jamais un jugement. ⚠️ `phrase === null` → **rien ne
//    s'affiche**, et c'est le CAS NOMINAL du jour (la chaîne ne produit encore
//    aucun relevé de langue) : **ce n'est pas une panne** (`utils/deroule/langue.ts`).
//
// ⚠️ **CE QUE CET ÉCRAN N'AFFICHE JAMAIS** :
//    · **aucune note, aucune lettre, aucune moyenne**, ni rien qui y ressemble
//      (`07-` §1.1 et §4 règle 6) ;
//    · **ni le nom de la compétence, ni le code d'un observable, ni la grille**
//      (RR4 ; la fiche §4) — `point.competence` sert au tri en aval, PAS à
//      l'affichage : le nommer à l'élève, c'est lui montrer la grille ;
//    · **aucune question sur ce qu'il n'a pas compris** (`02-` §5).
// ============================================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actionContester, actionValiderLaLecture, type Reponse } from '@/app/deroule/actions'
import type { RetourServi, VueDuDeroule } from '@/utils/deroule/vue'

/**
 * ⚠️ **LA BORNE EST UN MIROIR, ET C'EST UNE DETTE À REMONTER.** La source de
 *    vérité est `CONTESTATION_MAX` de `utils/deroule/contestation.ts` — c'est
 *    elle qui REFUSE au serveur. Mais ce module porte `import 'server-only'` :
 *    en importer une VALEUR depuis un composant client est une erreur de build
 *    Next (`'server-only' cannot be imported from a Client Component`). D'où ce
 *    miroir, qui ne borne QUE le confort de saisie — jamais la règle.
 *    *Rapporté au fil principal : la constante gagnerait à vivre dans le module
 *    PUR `utils/deroule/types.ts`, que `contestation.ts` réexporterait.*
 */
const CONTESTATION_MAX = 600

type PointServi = RetourServi['points'][number]
type ActeDeContestation = VueDuDeroule['contestations'][number]
type EncartDeLangue = VueDuDeroule['langue']

export function RetourSegmente({
  depotId, retour, vue, titre,
}: { depotId: string; retour: RetourServi; vue: VueDuDeroule; titre: string }) {
  // ⚠️ Le parent rend CE composant DEUX FOIS — le retour chaud, puis le retour
  //    final. L'encart de langue, lui, est UN relevé, fait sur la v1, « et sa
  //    correction est attendue dans la version finale » (`06-` §2) : il se pose
  //    donc sur le retour CHAUD, celui qui précède la révision. Le porter deux
  //    fois demanderait deux fois la même correction.
  const porteLEncartDeLangue = retour.moment === 'chaud' || vue.retourChaud === null

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-bordure bg-surface p-4">
        <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">{titre}</h2>
        {retour.publieLe && (
          <p className="mt-1 text-xs text-muet">Reçu le {quand(retour.publieLe)}.</p>
        )}

        {/* ⚠️ Dit UNE FOIS, en tête, et redit à chaque contestation : contester
            n'est pas corriger. C'est la promesse que le module tient vraiment —
            `contester()` n'écrit que dans `exercices_metacognition`. */}
        <p className="mt-2 text-sm text-encre-douce">
          Chaque remarque s’appuie sur un passage précis. Si l’une te semble fausse, dis-le :
          elle part à ton professeur, et <strong>rien ne change tout seul</strong>.
        </p>

        {/* ⭐ ON BOUCLE. Le découpage a été fait en amont, par celui qui a écrit
            le retour — c'est un contrat sur lui, pas sur l'écran (`07-` §1.2). */}
        {retour.points.length === 0 ? (
          <p className="mt-3 text-sm italic text-muet">
            Ce retour ne porte aucune remarque ancrée.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {retour.points.map((point) => (
              <PointAncre
                key={point.id}
                depotId={depotId}
                point={point}
                contestation={vue.contestations.find((c) => c.point_id === point.id) ?? null}
              />
            ))}
          </ul>
        )}

        {/* ⚠️⚠️ LE VERDICT DE CALIBRATION S'AFFICHERAIT ICI — « nous n'avons pas
            vu la même chose », JAMAIS un verdict, et il NOMME LA DIMENSION en
            langage pédagogique, jamais l'observable ni la grille (`06-` §2 ; la
            fiche §4 ; RR4). **Il n'est pas rendu, faute de quoi le porter.**
            `utils/deroule/juger.ts:verdictDeCalibration()` le calcule déjà, et
            rend exactement `{ lignes, phrase }` — mais `chargerLeDeroule` ne
            l'appelle jamais et `VueDuDeroule` n'a AUCUN champ pour lui.
            **On n'invente pas le champ ici** : le manque est rapporté au fil
            principal, qui l'ajoutera à `utils/deroule/vue.ts`. Le jour où il
            arrive, il se rend entre les points et le pont, et nulle part
            ailleurs — le verdict appartient au retour. */}

        {/* ⭐ LE PONT — la quatrième chose que le retour final doit dire :
            « la prochaine fois, X » (`06-` §2). Les trois autres — ce qui s'est
            amélioré, ce qui n'a pas bougé, le delta — sont DANS LES POINTS, que
            le modèle y écrit. Le pont, lui, a son champ : il se rend À LA FIN,
            EN ÉVIDENCE. */}
        {retour.feedForward && (
          <div className="mt-4 rounded border border-bordure bg-pigment-teinte p-3">
            <p className="font-marque text-xs uppercase tracking-wide text-pigment">
              La prochaine fois
            </p>
            <p className="mt-1 font-corps text-base leading-relaxed text-encre">
              {retour.feedForward}
            </p>
          </div>
        )}
      </section>

      {porteLEncartDeLangue && <EncartLangue langue={vue.langue} />}

      <ValidationDeLecture depotId={depotId} retour={retour} />
    </div>
  )
}

const quand = (iso: string) =>
  new Date(iso).toLocaleString('fr-CA', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

// ── UN POINT ANCRÉ, ET SON GESTE DE DÉSACCORD ───────────────────────────────

function PointAncre({
  depotId, point, contestation,
}: { depotId: string; point: PointServi; contestation: ActeDeContestation | null }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [texte, setTexte] = useState('')
  const [enCours, setEnCours] = useState(false)
  // ⚠️ La réponse de l'action est GARDÉE, et affichée HORS des trois branches :
  //    `router.refresh()` fait apparaître la contestation et referme le champ,
  //    et le message — celui qui annonce l'examen humain — disparaîtrait avec
  //    lui alors que c'est précisément ce que l'élève doit lire.
  const [reponse, setReponse] = useState<Reponse | null>(null)

  const estUneReussite = point.nature === 'reussite'

  async function envoyer() {
    if (enCours) return
    setEnCours(true)
    try {
      // ⚠️ L'identifiant part TEL QUEL — il vient du retour, on ne le fabrique
      //    pas. L'action refuse un point qui n'est pas dans ce retour.
      const r = await actionContester(depotId, point.id, texte)
      setReponse(r)
      if (r.ok) {
        setTexte('')
        setOuvert(false)
        router.refresh()
      }
    } finally {
      setEnCours(false)
    }
  }

  return (
    <li className="rounded border border-bordure p-3">
      {/* La marque de nature — DISCRÈTE, et sans aucun degré : une réussite se
          distingue d'un point de travail, elle ne se chiffre pas. */}
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs ${estUneReussite
          ? 'bg-ok-teinte text-ok'
          : 'bg-parchemin-fonce text-muet-clair'}`}
      >
        {estUneReussite ? 'Réussi' : 'À travailler'}
      </span>

      {/* ⚠️ RR3 — LA CITATION PORTE SA SOURCE, et les deux ne se ressemblent
          pas à l'écran. Une citation vide n'est pas montrée : un chapeau
          « tu écris » suivi de rien ferait porter à l'élève une phrase vide. */}
      {point.ancrage?.citation && (
        <blockquote
          className={`mt-2 rounded border-l-2 bg-parchemin-fonce py-2 pl-3 pr-2 ${
            point.ancrage.source === 'copie' ? 'border-liseret' : 'border-bordure-bouton'}`}
        >
          <p className="text-xs uppercase tracking-wide text-muet-clair">
            {point.ancrage.source === 'copie' ? 'Tu écris' : 'Le texte dit'}
          </p>
          <p className="mt-1 font-corps text-sm italic leading-relaxed text-encre">
            « {point.ancrage.citation} »
          </p>
        </blockquote>
      )}

      <p className="mt-2 font-corps text-base leading-relaxed text-encre">{point.texte}</p>

      {contestation ? (
        <div className="mt-3 rounded border border-bordure-bouton bg-parchemin-fonce p-3">
          <p className="text-xs uppercase tracking-wide text-muet-clair">
            Tu n’étais pas d’accord
          </p>
          <p className="mt-1 text-sm text-encre">{contestation.texte}</p>
          {/* ⚠️ REDIT ICI, au plus près du geste : la contestation N'ALTÈRE RIEN
              AUTOMATIQUEMENT. Elle est lue par un humain, elle ne corrige pas. */}
          <p className="mt-2 text-xs text-muet">
            C’est enregistré et ton professeur le verra. Le retour, lui, n’a pas bougé :
            une contestation se lit, elle ne corrige rien toute seule.
          </p>
        </div>
      ) : ouvert ? (
        <div className="mt-3">
          <label
            htmlFor={`contestation-${point.id}`}
            className="block text-sm text-encre-douce"
          >
            En une phrase ou deux : qu’est-ce qui ne va pas ?
          </label>
          <textarea
            id={`contestation-${point.id}`}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={3}
            maxLength={CONTESTATION_MAX}
            // ⚠️ Le fond passe par `style` : la règle nue de `globals.css` sur
            //    `input, textarea, select` n'est dans aucune couche Tailwind et
            //    l'emporte sur une classe `bg-*` (constat de C4-L4).
            style={{ backgroundColor: 'var(--parchemin)' }}
            className="mt-1 w-full rounded border border-bordure-bouton p-2 text-sm text-encre"
          />
          <p className="mt-1 text-xs text-muet">
            {texte.length} / {CONTESTATION_MAX} caractères — c’est un champ court.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Cibles tactiles ≥ 44 px : « l'écran est souvent un téléphone »
                (`07-` §3). C'est une règle de source, pas du confort. */}
            <button
              type="button"
              onClick={() => { void envoyer() }}
              disabled={enCours || texte.trim() === ''}
              className="min-h-[44px] rounded bg-bouton px-4 py-2 text-sm text-parchemin
                         disabled:opacity-40"
            >
              {enCours ? 'Envoi…' : 'Envoyer'}
            </button>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="min-h-[44px] rounded border border-bordure-bouton px-3 py-1
                         text-sm text-encre-douce"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="mt-3 min-h-[44px] rounded border border-bordure-bouton px-3 py-1
                     text-sm text-encre-douce"
        >
          Je ne suis pas d’accord
        </button>
      )}

      {/* ⭐ LE MESSAGE DE L'ACTION, TEL QU'ELLE LE REND. C'est lui qui dit à
          l'élève quand sa contestation part DIRECTEMENT au professeur — la
          citation ne se retrouve pas dans sa copie, et la loi exige alors un
          EXAMEN HUMAIN (`06-` §2 et §7). L'écran ne le paraphrase pas. */}
      {reponse && (
        <p className={`mt-2 text-sm ${reponse.ok ? 'text-ok' : 'text-retard'}`}>
          {reponse.message}
        </p>
      )}
    </li>
  )
}

// ── L'ENCART LANGUE — SÉPARÉ, ET DE L'HYGIÈNE ───────────────────────────────

/**
 * ⚠️ **HORS DU RETOUR DE COMPÉTENCE** (`06-` §2) : sa propre section, son propre
 *    ton. « Hors lettre, hors calibration » — rien ici n'entre dans une lettre,
 *    et l'élève ne se juge pas là-dessus.
 *
 * ⚠️ **`phrase === null` → RIEN.** C'est le cas nominal aujourd'hui : la chaîne
 *    ne produit aucun relevé de langue, et `phraseDeLaChasse` rend `null` aussi
 *    bien quand personne n'a regardé que quand il n'y a rien à signaler.
 *    **Ce n'est pas une panne**, et il ne faut surtout pas afficher « 0 faute ».
 */
function EncartLangue({ langue }: { langue: EncartDeLangue }) {
  if (!langue.phrase) return null

  const ancres = langue.ancrages.filter((a) => a.trouvee && a.ligne > 0)
  const perdues = langue.ancrages.filter((a) => !a.trouvee || a.ligne <= 0)

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h3 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        La chasse aux fautes
      </h3>
      <p className="mt-2 text-sm text-encre">{langue.phrase}</p>
      <p className="mt-1 text-xs text-muet">
        C’est de l’hygiène, rien de plus : ça ne compte pas dans ton travail, et ça ne se juge
        pas. La correction est attendue dans ta version finale.
      </p>

      {/* ⭐ ANCRÉ LIGNE À LIGNE (`06-` §2). Le numéro de ligne est celui de TA
          copie, pas une numérotation interne. */}
      {ancres.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-encre">
          {ancres.map((a, i) => (
            <li key={`${a.ligne}-${i}`}>
              <span className="text-muet-clair">Ligne {a.ligne} — </span>
              <span className="font-corps italic">« {a.citation} »</span>
            </li>
          ))}
        </ul>
      )}

      {/* ⚠️ ON NE DEVINE PAS : une citation qu'on ne retrouve pas SE DIT, elle
          ne s'ancre nulle part. L'élève relit ; il ne poursuit pas une ligne
          inventée (`utils/deroule/langue.ts:ancrerLigneALigne`). */}
      {perdues.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muet">
            {perdues.length > 1
              ? 'Ces passages n’ont pas pu être situés dans ta copie — relis-les :'
              : 'Ce passage n’a pas pu être situé dans ta copie — relis-le :'}
          </p>
          <ul className="mt-1 space-y-1 text-sm text-encre">
            {perdues.map((a, i) => (
              <li key={`perdue-${i}`} className="font-corps italic">« {a.citation} »</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

// ── LA VALIDATION « LU » — CE QUI CLÔT LE RETOUR ────────────────────────────

/**
 * « Le retour final **SE CLÔT PAR LA VALIDATION "lu"** » (`06-` §2), et cette
 * validation « ne vit pas sur le dépôt mais SUR LE RETOUR : un seul domicile
 * pour un seul geste » (`07-` §1.2 ; piège 32) — d'où le `moment`, qui dit
 * lequel des deux retours on valide.
 *
 * ⚠️ Elle est le geste qui DÉVERROUILLE : « un retour non lu bloque tous les
 *    rendus ». On le dit à l'élève, sinon le bouton n'a l'air de servir à rien.
 */
function ValidationDeLecture({
  depotId, retour,
}: { depotId: string; retour: RetourServi }) {
  const router = useRouter()
  const [enCours, setEnCours] = useState(false)
  const [reponse, setReponse] = useState<Reponse | null>(null)

  if (retour.luLe) {
    return (
      <p className="text-xs text-muet">
        Lecture validée le {quand(retour.luLe)}.
      </p>
    )
  }

  async function valider() {
    if (enCours) return
    setEnCours(true)
    try {
      const r = await actionValiderLaLecture(depotId, retour.moment)
      setReponse(r)
      if (r.ok) router.refresh()
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="rounded-lg border border-bordure bg-surface p-4">
      <p className="text-sm text-encre-douce">
        <strong>Il te reste à valider ta lecture.</strong> Tant que tu ne l’as pas fait, tu ne
        peux rien rendre d’autre — c’est la seule chose qu’elle bloque.
      </p>
      <button
        type="button"
        onClick={() => { void valider() }}
        disabled={enCours}
        className="mt-3 min-h-[44px] rounded bg-bouton px-4 py-2 text-sm text-parchemin
                   disabled:opacity-40"
      >
        {enCours ? '…' : 'J’ai lu mon retour'}
      </button>
      {reponse && (
        <p className={`mt-2 text-sm ${reponse.ok ? 'text-ok' : 'text-retard'}`}>
          {reponse.message}
        </p>
      )}
    </div>
  )
}
