'use client'
// ============================================================================
// C4 · L3 — LES SIX TEMPS À L'ÉCRAN.
// (⭐ Handoff « Codex Exercices (élève) » §4 à §6 — l'écran devient un PLAN DE
//  TRAVAIL : à gauche la matière, à droite le travail. Il empilait tout dans une
//  colonne unique, et la consigne se perdait dès qu'on descendait.)
// ----------------------------------------------------------------------------
// « À la maison, les six temps sont ceux du régime PLEIN — les trois crans de
//   production : les temps 5 et 6 suivent le `regime_v1vf` du cran, et ne sont
//   pas servis là où il n'y a pas de version finale » (`06-` §2).
//
// ⚠️ CE QUE CET ÉCRAN NE FAIT JAMAIS :
//   · **il n'appelle aucun modèle** — la génération des retours est à C4-L5 ;
//     ici on met en file, on attend visiblement, on affiche ;
//   · **il ne découpe pas le retour** : il arrive SEGMENTÉ, et c'est un contrat
//     sur celui qui l'engendre (`07-` §1.2) — on boucle sur les points ;
//   · **il ne demande JAMAIS à l'élève de signaler ce qu'il n'a pas compris** —
//     aucune consigne, aucun champ, aucun bouton (`02-` §5) : la lucidité est de
//     la métacognition SPONTANÉE, relevée ailleurs. *C'est la CALIBRATION que le
//     retour nomme, jamais la lucidité* ;
//   · **il n'affiche aucune note, aucune lettre, aucune moyenne** (`07-` §1.1,
//     §4 règle 6) — et rien qui y ressemble.
//
// ⭐⭐ **TROIS FORMES, UNE RÈGLE : LA COLONNE QUI PORTE LE TRAVAIL EST LA PLUS
//    LARGE** (handoff §4). Rédiger → l'écriture (400 / 640) ; choisir → les
//    quatre lectures REMPLACENT le champ, colonnes égales ; surligner → le
//    travail est DANS la matière, colonnes égales. Le choix vit dans
//    `utils/deroule/plan-de-travail.ts`, module PUR et éprouvé : cet écran ne
//    lit ni le cran, ni la cible, ni `indexAttendue` pour se mettre en page.
//
// ⚠️ **SUR TÉLÉPHONE, LA MATIÈRE ET LE TRAVAIL NE SE DISPUTENT PLUS L'ÉCRAN** :
//    une bascule `Lire` / `Écrire` de 48 px, et la consigne COLLÉE EN HAUT,
//    dépliable au pouce — elle reste lisible pendant toute la rédaction.
//    *« L'écran est souvent un téléphone » (`07-` §3) n'est pas une note de
//    confort : c'est l'écran principal de l'élève.*
// ============================================================================

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TexteBalise, TexteBrut, MateriauMarque, MARQUE_ELEVE } from './TexteBalise'
import { ChampDeRedaction } from './ChampDeRedaction'
import { CredenceSaisie } from './CredenceSaisie'
import { DesignationDansLeMateriau } from './DesignationDansLeMateriau'
import { GestesDeLaRemise } from './GestesDeLaRemise'
import { SeJuger } from './SeJuger'
import { RetourSegmente } from './RetourSegmente'
import { SignalerUnProbleme } from './SignalerUnProbleme'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import type { TelemetrieSaisie, Temps } from '@/utils/deroule/types'
import type { Atelier } from '@/utils/codex-onglets/regles'
import {
  formeDuTravail, voletInitial, ecranDuDeroule, tempsAffiche, libelleDuTemps, etatDuTemps,
  rangDuTemps, colonnesDuPlan, titreDuTravail, type FormeDuTravail, type Volet,
} from '@/utils/deroule/plan-de-travail'
import { segmentsDuRenvoi } from '@/utils/deroule/renvoi'
import { lireLaRepartition, rappelDeLaRepartition } from '@/utils/deroule/repartition'
import {
  actionOuvrir, actionEnregistrerBrouillon, actionRemettre, actionMicroQuestion,
  actionCompterUneAide, actionEtatDeLAttente, actionDesignation,
} from '@/app/deroule/actions'

/** Le sondage de l'attente — « jamais un écran muet » (`01-` §12). */
const SONDAGE_MS = 5_000

export function EcranDeroule(
  { vue, atelier = 'codex' }: { vue: VueDuDeroule; atelier?: Atelier },
) {
  const router = useRouter()

  // L'ouverture est idempotente côté serveur : `ouvert_at` ne se réécrit jamais.
  useEffect(() => { void actionOuvrir(vue.depotId) }, [vue.depotId])

  const enregistrer = useCallback(
    async (texte: string, t: TelemetrieSaisie) => {
      await actionEnregistrerBrouillon(vue.depotId, versionEnCours(vue), texte, t)
    }, [vue])

  const remettre = useCallback(
    async (texte: string, t: TelemetrieSaisie) => {
      const r = await actionRemettre(vue.depotId, versionEnCours(vue), texte, t)
      if (!r.ok) throw new Error(r.message)
      router.refresh()
    }, [vue, router])

  // ⚠️ La FORME se dérive avant les états d'écran : le volet initial du
  //    téléphone en dépend (`voletInitial`).
  const forme = formeDuTravail({
    credenceEstLaReponse: vue.credenceEstLaReponse,
    designationDemandee: vue.cas.some((c) => c.designationDemandee),
  })

  // ── L'état d'écran, et rien d'autre ──────────────────────────────────────
  // ⚠️ AUCUN de ces trois états ne décide de ce qui s'enregistre : ils décident
  //    de ce qu'on REGARDE. Le serveur reste seul maître du temps courant.
  /** Téléphone : `Lire` (la matière) ou `Écrire` (le travail). ⭐ 01/09 — il
   *  s'ouvre sur la MATIÈRE quand le travail est d'y surligner : l'élève
   *  ouvrait « surligne l'endroit » sur un champ vide, sans le texte. */
  const [volet, setVolet] = useState<Volet>(() => voletInitial(forme))
  /** La citation du retour que la colonne de gauche met en évidence. */
  const [renvoi, setRenvoi] = useState<string | null>(null)
  /**
   * ⭐ « Reprendre mon texte » (handoff §6) — tant que l'élève ne l'a pas
   *    cliqué, sa v1 et son retour restent CÔTE À CÔTE et rien ne s'intercale.
   * ⚠️ Vrai d'emblée si une version finale est déjà commencée : sinon un
   *    rechargement cacherait un brouillon en cours.
   */
  const [reprise, setReprise] = useState((vue.texteVf ?? '') !== '')

  const ecran = ecranDuDeroule({
    ouvert: vue.ouvert, tempsCourant: vue.tempsCourant, forme, corrections: vue.corrections,
    aUnRetour: vue.retourChaud !== null || vue.retourFinal !== null,
    // ⚠️ « servie » ne suffit pas : l'offre peut sortir VIDE, et l'écran de
    //    « se juger » est exclusif — il rendrait une page blanche.
    seJugerAServir: vue.seJuger.servie && (vue.seJuger.offre?.questions.length ?? 0) > 0,
  })

  // ⭐ C7-L3 — PORTE FERMÉE sur un exercice au format 1.5 : l'écran ne compose
  //    pas ce qu'il ne sait pas servir (les candidats du 1 seraient des clés et
  //    des identifiants). Il le dit, et n'enregistre rien.
  if (vue.gabarit.exercice15 && !vue.gabarit.actif) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Carte titre="Cet exercice n’est pas encore ouvert">
          <p className="font-corps text-[15px] leading-relaxed text-encre-douce">
            Il attend une console que ton professeur n’a pas encore ouverte. Reviens quand il
            l’aura fait : rien n’est perdu, et rien ne t’est demandé d’ici là.
          </p>
        </Carte>
      </div>
    )
  }

  return (
    <div className="-mx-4 overflow-hidden border-y border-bordure bg-fond-module
                    sm:mx-0 sm:rounded-2xl sm:border">
      <BarreDeContenu vue={vue} atelier={atelier} ecran={ecran} reprise={reprise} />
      <FilDesTemps vue={vue} forme={forme} ecran={ecran} reprise={reprise} />

      {ecran === 'ferme' && (
        <div className="p-5">
          <Encart ton="attention">
            <p className="text-sm text-encre">
              Les exercices ne sont pas encore ouverts. Ton travail t’attend ici dès qu’ils le
              seront.
            </p>
          </Encart>
        </div>
      )}

      {ecran === 'travail' && (
        <PlanDeTravail
          vue={vue} forme={forme} volet={volet} setVolet={setVolet}
          enregistrer={enregistrer} remettre={remettre}
        />
      )}

      {/* ── ⭐ TEMPS 3 — « SE JUGER » EST UN ÉCRAN À LUI SEUL (handoff §5) :
          ni matière, ni champ. *L'ordre est la mesure — se juger après avoir lu
          le retour ne mesurerait plus la métacognition* (`06-` §2). */}
      {ecran === 'se_juger' && vue.seJuger.offre && (
        <div className="px-4 py-8 sm:px-6 sm:py-10">
          <SeJuger depotId={vue.depotId} offre={vue.seJuger.offre} texteRendu={vue.texteV1} />
        </div>
      )}

      {ecran === 'retour_texte' && (
        <RetourDUnTexte
          vue={vue} renvoi={renvoi} setRenvoi={setRenvoi} reprise={reprise} setReprise={setReprise}
          enregistrer={enregistrer} remettre={remettre}
        />
      )}

      {ecran === 'retour_choix' && <RetourDUnChoix vue={vue} atelier={atelier} />}

      {/* ⭐⭐ « SIGNALER QUE L'EXERCICE A UN PROBLÈME » — EN PIED, ET HORS DU FIL.
          « Il peut le faire avant le passage, ou après le passage » (Louis,
          31/08) : le bloc ne dépend d'aucun `ecran`, y compris `ferme` — un
          élève qui découvre un exercice cassé avant l'ouverture doit pouvoir le
          dire. ⛔ Il ne parle jamais de ce que l'élève a compris (`02-` §5) :
          c'est l'OBJET qui est mis en cause, pas lui. */}
      {vue.signalement.ouvert && (
        <SignalerUnProbleme depotId={vue.depotId} mien={vue.signalement.mien} />
      )}
    </div>
  )
}

function versionEnCours(vue: VueDuDeroule): 'v1' | 'vf' {
  return vue.tempsCourant === 'reviser' ? 'vf' : 'v1'
}

const quand = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' })

/** « ven. 12 » — la forme courte des pastilles d'échéance (handoff §3 et §4). */
const jourCourt = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric' })

// ── La barre de contenu ─────────────────────────────────────────────────────

/**
 * « ← Exercices · titre · durée indicative · échéance » (handoff §4).
 *
 * ⭐ LE LIEN DE RETOUR VIT ICI, ET PLUS AU-DESSUS DE LA CARTE : c'était une
 *    ligne flottante que rien ne rattachait à l'écran. Il nomme sa destination
 *    — « Exercices », l'onglet — au lieu d'un « Retour » qui ne dit pas où.
 */
function BarreDeContenu({
  vue, atelier, ecran, reprise,
}: {
  vue: VueDuDeroule; atelier: Atelier
  ecran: ReturnType<typeof ecranDuDeroule>; reprise: boolean
}) {
  const rang = rangDuTemps(tempsAffiche(ecran, vue.tempsCourant, reprise), vue.temps)
  return (
    <div className="flex items-center gap-3 border-b border-bordure bg-surface px-4 py-3
                    sm:gap-4 sm:px-6">
      <Link
        href={`/eleve/modules/${atelier}`}
        className="min-h-11 shrink-0 whitespace-nowrap font-ui text-[13px] text-muet
                   hover:text-encre-douce sm:flex sm:items-center"
      >
        ← <span className="hidden sm:inline">Exercices</span>
      </Link>
      <span aria-hidden className="hidden h-5 w-px shrink-0 bg-bordure sm:block" />
      <h1 className="min-w-0 flex-1 truncate font-titre text-lg font-bold text-encre
                     sm:text-[23px]">
        {vue.titre}
      </h1>
      {vue.dureeIndicativeMin !== null && (
        <span className="hidden shrink-0 font-corps text-sm italic text-muet lg:inline">
          environ {vue.dureeIndicativeMin} min
        </span>
      )}
      {vue.echeance && (
        <PastilleEcheance iso={vue.echeance} className="hidden shrink-0 sm:inline-block" />
      )}
      {/* Le compteur discret du téléphone — « 2 / 6 » (handoff §4). */}
      {rang && (
        <span className="shrink-0 rounded-full bg-pigment-teinte px-2.5 py-1 font-ui text-[11.5px]
                         font-semibold text-pigment sm:hidden">
          {rang.rang} / {rang.total}
        </span>
      )}
      {/* ⚠️ L'INSTANT DE LA REMISE, quand il y en a un : la barre dit alors où en
          est la copie, plutôt qu'une échéance déjà passée. */}
      {!vue.echeance && vue.v1RemiseLe && (
        <span className="hidden shrink-0 font-corps text-sm italic text-muet sm:inline">
          v1 rendue {jourCourt(vue.v1RemiseLe)}
        </span>
      )}
    </div>
  )
}

function PastilleEcheance({ iso, className = '' }: { iso: string; className?: string }) {
  return (
    <span className={`whitespace-nowrap rounded-full border border-attention/30
                      bg-attention-teinte px-3 py-1 font-ui text-xs font-semibold
                      text-attention ${className}`}>
      à rendre {jourCourt(iso)}
    </span>
  )
}

// ── Le fil des temps ────────────────────────────────────────────────────────

/**
 * ⭐ **LE FIL N'AFFICHE QUE LES TEMPS RÉELLEMENT SERVIS** (handoff §4) : quatre
 *    sur une paire ou un exercice au jugement algorithmique, six au régime
 *    plein. C'est `tempsServis` qui le décide, en amont.
 *
 * ⚠️ **LES TEMPS PASSÉS NE SONT PAS CLIQUABLES, ET C'EST DÉLIBÉRÉ.** Le handoff
 *    §7 les voulait cliquables « (retour en arrière) » ; ce qu'ils rendraient est
 *    déjà là, autrement et mieux : *« les temps passés se replient en une ligne,
 *    jamais supprimés »* (§4). La consigne, le texte de départ et la copie rendue
 *    restent tous sur l'écran courant, dépliables. Un fil cliquable rejouerait un
 *    ÉTAT que le serveur dérive (`tempsCourantDe`) — il faudrait le forcer côté
 *    client, et un temps « écrire » rouvert après la remise offrirait un champ
 *    qui ne peut plus rien enregistrer. **À rapporter à Louis.**
 */
function FilDesTemps({
  vue, forme, ecran, reprise,
}: {
  vue: VueDuDeroule; forme: FormeDuTravail
  ecran: ReturnType<typeof ecranDuDeroule>; reprise: boolean
}) {
  const courant = tempsAffiche(ecran, vue.tempsCourant, reprise)
  return (
    <nav
      aria-label="Les temps de l’exercice"
      className="flex items-center gap-3.5 overflow-x-auto border-b border-bordure
                 bg-surface-retrait px-4 py-2.5 sm:px-6"
    >
      <ol className="flex shrink-0 gap-1.5">
        {vue.temps.map((t) => <PastilleDeTemps
          key={t} temps={t} etat={etatDuTemps(t, courant, vue.temps)} forme={forme} />)}
      </ol>
      {vue.echeanceVf.quand && (
        <span className="ml-auto hidden shrink-0 whitespace-nowrap rounded-full
                         border border-attention/30 bg-attention-teinte px-3 py-1 font-ui text-xs
                         font-semibold text-attention lg:inline-block">
          version finale avant {jourCourt(vue.echeanceVf.quand)}
        </span>
      )}
    </nav>
  )
}

function PastilleDeTemps(
  { temps, etat, forme }:
  { temps: Temps; etat: 'fait' | 'courant' | 'a_venir'; forme: FormeDuTravail },
) {
  const cls = etat === 'courant'
    ? 'bg-pigment text-[color:var(--fond-module)] font-semibold'
    : etat === 'fait'
      ? 'bg-pigment-teinte text-pigment'
      : 'border border-bordure text-muet'
  return (
    <li
      aria-current={etat === 'courant' ? 'step' : undefined}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-ui text-xs ${cls}`}
    >
      {etat === 'fait' && <span aria-hidden>✓ </span>}
      <span className="sr-only">{etat === 'fait' ? 'fait : ' : etat === 'courant' ? 'en cours : ' : 'à venir : '}</span>
      {libelleDuTemps(temps, forme)}
    </li>
  )
}

// ── Écrans 2a / 2b / 2c — LE PLAN DE TRAVAIL ────────────────────────────────

function PlanDeTravail({
  vue, forme, volet, setVolet, enregistrer, remettre,
}: {
  vue: VueDuDeroule
  forme: FormeDuTravail
  volet: 'lire' | 'ecrire'
  setVolet: (v: 'lire' | 'ecrire') => void
  enregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  remettre: (texte: string, t: TelemetrieSaisie) => Promise<void>
}) {
  return (
    <div>
      <ConsigneCollante vue={vue} />

      {/* ⭐ LA BASCULE DU TÉLÉPHONE (handoff §4) — 48 px, deux moitiés égales.
          Sur un exercice à surligner, on surligne dans `Lire` et le bouton du
          bas fait passer à `Écrire`. */}
      <div className="px-4 pt-3.5 lg:hidden">
        <div className="flex overflow-hidden rounded-[10px] border border-bordure-bouton
                        bg-surface">
          {([
            ['lire', forme === 'surligner' ? 'Lire · surligner' : 'Lire'],
            ['ecrire', forme === 'choisir' ? 'Répondre' : 'Écrire'],
          ] as const).map(([v, libelle]) => (
            <button
              key={v} type="button" onClick={() => setVolet(v)} aria-pressed={volet === v}
              className={`min-h-12 flex-1 px-3 font-ui text-sm ${volet === v
                ? 'bg-bouton font-semibold text-bouton-texte'
                : 'text-muet'}`}
            >
              {libelle}
            </button>
          ))}
        </div>
      </div>

      <div className={`lg:grid lg:items-stretch ${colonnesDuPlan(forme)}`}>
        <ColonneMatiere vue={vue} forme={forme} cache={volet !== 'lire'}>
          {/* ⭐ Sur un exercice à surligner, le pont vers la réponse est DANS la
              vue `Lire` : le passage désigné vient d'être posé, et l'élève passe
              à ce qu'il en dit sans chercher la bascule du haut. */}
          {forme === 'surligner' && (
            <button
              type="button" onClick={() => setVolet('ecrire')}
              className="min-h-12 rounded-[10px] bg-bouton px-4 py-3.5 font-ui text-[15px]
                         font-semibold text-bouton-texte lg:hidden"
            >
              Passer à ma réponse →
            </button>
          )}
        </ColonneMatiere>

        <ColonneTravail
          vue={vue} forme={forme} cache={volet !== 'ecrire'}
          enregistrer={enregistrer} remettre={remettre}
        />
      </div>
    </div>
  )
}

/**
 * ⭐ « Consigne collée en haut : une ligne dépliable au pouce, qui reste pendant
 *    toute la rédaction » (handoff §4). C'est le manque que le plan de travail
 *    ferme sur téléphone : dans la colonne unique, la consigne partait en haut
 *    de page et l'élève écrivait sans elle.
 * ⚠️ `<details>` natif, donc sans état client ni hydratation, et le texte reste
 *    dans le document.
 */
function ConsigneCollante({ vue }: { vue: VueDuDeroule }) {
  return (
    <details className="group sticky top-0 z-10 border-b border-bordure bg-surface-retrait
                        lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 px-4 py-2.5">
        <span aria-hidden className="text-[11px] text-muet group-open:hidden">▸</span>
        <span aria-hidden className="hidden text-[11px] text-muet group-open:inline">▾</span>
        <span className="shrink-0 font-marque text-[11px] font-semibold uppercase
                         tracking-[0.11em] text-muet">
          La consigne
        </span>
        <span className="min-w-0 flex-1 truncate font-corps text-sm text-encre-douce
                         group-open:hidden">
          <TexteBalise jetons={vue.consigne} />
        </span>
      </summary>
      <p className="px-4 pb-3 font-corps text-[15px] leading-relaxed text-encre">
        <TexteBalise jetons={vue.consigne} />
      </p>
    </details>
  )
}

// ── La colonne de gauche : LA MATIÈRE ───────────────────────────────────────

function ColonneMatiere({
  vue, forme, cache, children,
}: {
  vue: VueDuDeroule; forme: FormeDuTravail; cache: boolean; children?: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-3 border-bordure bg-fond-module p-4 sm:p-5
                     lg:border-r ${cache ? 'hidden lg:flex' : ''}`}>
      <div className="flex items-center gap-3">
        {/* ⭐⭐ C7-L3 — DEUX ESPACES (`10-` §3, décision 15) : le cadre « Les
            documents », à sections nommées, et l'exercice. Le titre suit. */}
        <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet">
          {vue.gabarit.actif ? 'Les documents' : 'La matière'}
        </h2>
        {/* ⛔ Aux crans 4, 7 et 9, l'écran DIT que le passage est à trouver — il
            ne le montre pas : « l'y trouver EST le travail » (`02-` §5). */}
        {forme === 'surligner' && (
          <span className="ml-auto whitespace-nowrap rounded-full border border-attention/30
                           bg-attention-teinte px-3 py-1 font-ui text-xs font-semibold
                           text-attention">
            à toi de trouver le passage
          </span>
        )}
      </div>

      {/* ⚠️ SUR UNE PAIRE, PAS DE CONSIGNE EN EN-TÊTE — trouvé au smoke élève du
          24/08. « Pour une paire il y a DEUX consignes, une pour chaque
          exercice » (Louis) : chaque cas porte déjà la sienne, plus bas. */}
      <Carte titre={vue.estUnePaire ? 'Deux cas, l’un après l’autre' : 'La consigne'}>
        {vue.estUnePaire ? (
          <p className="font-corps text-base leading-relaxed text-encre">
            Tu traites le premier cas, tu reçois sa correction, puis tu passes au second.
            {' '}<strong>Chacun porte sa propre consigne.</strong>
          </p>
        ) : (
          /* ⭐ Le balisage SE REND : « le gras est du SENS » (piège 36). */
          <p className="font-corps text-base leading-[1.5] text-encre">
            <TexteBalise jetons={vue.consigne} />
          </p>
        )}
      </Carte>

      {/* ── ⭐⭐ C5-L2 — LE TEXTE D'AUTEUR, QUAND L'EXERCICE EN PORTE UN.
          ⭐ Ce qui s'affiche est l'ENGLOBANT — « l'étendue réellement lue »
          (`02-` §6 B.1) — et la SÉLECTION du professeur est marquée dedans :
          ⛔ le texte n'est pas retouché d'un octet, la concaténation des
          segments EST la tranche. */}
      {/* ── ⭐⭐ LE SUJET — 01/09. 452 exercices sur 576 sont bâtis sur un sujet
          de dissertation et 23 consignes disent « ce sujet » ; l'écran ne le
          montrait nulle part. Il vient EN PREMIER : c'est de lui que parlent le
          texte, le matériau et la consigne. Un énoncé, pas un texte — pas de
          cadre de lecture, pas de défilement. */}
      {/* ⭐ C7-L3 — au 1(b), AUCUN DOCUMENT : les quatre devoirs sont l'exercice
          (`10-` §3). Le cadre le dit, au lieu de s'ouvrir vide. */}
      {vue.gabarit.sansDocuments && (
        <p className="font-corps text-[15px] leading-relaxed text-encre-douce">
          Aucun document pour cet exercice : les quatre devoirs d’élève sont dans l’exercice,
          à droite.
        </p>
      )}
      {vue.sujet && !vue.gabarit.sansDocuments && (
        <Carte titre="Le sujet">
          <p className="font-corps text-[16.5px] font-semibold leading-[1.5] text-encre">
            {vue.sujet}
          </p>
        </Carte>
      )}

      {vue.texteSupport && (
        <Carte
          titre={vue.gabarit.actif ? "Le texte d'auteur" : 'Le texte'}
          appoint={[vue.texteSupport.auteur, vue.texteSupport.titre, vue.texteSupport.reference]
            .filter(Boolean).join(' · ') || undefined}
        >
          <MateriauMarque
            segments={vue.texteSupport.segments}
            className="max-h-[52vh] overflow-y-auto rounded-[9px] border border-bordure-bouton
                       bg-parchemin-fonce p-3.5 font-corps text-[15.5px] leading-[1.62] text-encre"
          />
          {vue.texteSupport.segments.some((s) => s.marque) && (
            <p className="mt-2 font-ui text-xs text-muet">
              Le passage surligné est celui que ton professeur a choisi.
            </p>
          )}
        </Carte>
      )}

      {/* ── ⭐⭐ LE CO-TEXTE — LA MATIÈRE DES CRANS DE PRODUCTION (2·6·8).
          Les consignes de ces crans DÉSIGNENT ce texte — « Voici l'argument à
          illustrer », « Écris la transition entre ces deux paragraphes » : sans
          ce bloc, l'élève cherchait à l'écran une pièce qui n'y était pas.
          ⚠️ Il ne porte NI auteur NI sélection : c'est un texte fabriqué, servi
          entier et tel qu'il est stocké — d'où le `whitespace-pre-wrap` et
          l'absence d'`appoint`, contrairement au texte d'auteur juste au-dessus. */}
      {vue.coTexte && (
        <Carte titre={vue.gabarit.actif ? 'Le matériel' : 'Le texte de départ'}>
          <p className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap rounded-[9px] border
                        border-bordure-bouton bg-parchemin-fonce p-3.5 font-corps text-[15.5px]
                        leading-[1.62] text-encre">
            {vue.coTexte}
          </p>
        </Carte>
      )}

      {/* ── LE MATÉRIAU DE CHAQUE CAS, ET CE QUE L'ÉCRAN Y MET EN ÉVIDENCE ── */}
      {vue.cas.map((c) => (
        (vue.estUnePaire || c.materiau?.length) ? (
          <Carte
            key={c.ordre}
            titre={vue.gabarit.actif
              ? (vue.gabarit.sansDocuments
                ? (c.ordre === 1 ? 'Premier cas' : 'Second cas, de la même famille')
                : vue.estUnePaire
                  ? `Le devoir d'élève — ${c.ordre === 1 ? 'premier cas' : 'second cas, de la même famille'}`
                  : "Le devoir d'élève")
              : (vue.estUnePaire
                ? (c.ordre === 1 ? 'Premier cas' : 'Un cas neuf, de la même famille')
                : (forme === 'surligner' ? 'La copie' : 'Le passage'))}
          >
            {vue.estUnePaire && (
              <p className="mb-3 font-corps text-base leading-[1.5] text-encre">
                <TexteBalise jetons={c.consigne} />
              </p>
            )}
            {/* ⚠️ C4-L15 — `c.materiau` est une LISTE DE SEGMENTS, et une liste
                vide est VRAIE en JavaScript : sans `?.length`, un cas sans
                matériau ouvrirait une section vide. */}
            {c.materiau && c.materiau.length > 0 && (
              c.designationDemandee ? (
                /* ⭐ ITEM 77 — AUX CRANS 4, 7 ET 9, LE MATÉRIAU SE DÉSIGNE.
                   ⚠️ La `key` porte la zone stockée : c'est elle qui
                   réinitialise l'état quand le serveur change sous nous.
                   ⭐ Il reste APRÈS la remise, gelé : l'élève relit sa
                   correction en voyant ce QU'IL avait désigné. */
                <DesignationDansLeMateriau
                  key={`${c.ordre}-${c.zoneDonnee?.join(':') ?? (c.designationDonnee ? 'rien' : 'vide')}`}
                  contenu={c.materiau.map((sg) => sg.texte).join('')}
                  zoneDonnee={c.zoneDonnee}
                  repondu={c.designationDonnee}
                  enregistrer={(zone, confirmee) => actionDesignation(vue.depotId, c.ordre, zone, confirmee)}
                  gele={vue.tempsCourant !== 'ecrire' && vue.tempsCourant !== 'preparer'}
                />
              ) : (
                <MateriauMarque
                  segments={c.materiau}
                  className="rounded-[9px] border border-bordure-bouton bg-parchemin-fonce p-3.5
                             font-corps text-base leading-[1.62] text-encre"
                />
              )
            )}
          </Carte>
        ) : null
      ))}

      {/* ── LES AIDES, REPLIÉES — et chaque dépliage compte comme aujourd'hui ── */}
      {vue.guide && (
        <Depliable titre="De quoi t’aider" depotId={vue.depotId} aide="guide">
          <TexteBrut texte={vue.guide} className="text-sm text-encre" />
        </Depliable>
      )}
      {/* ⚠️ LA DÉMONSTRATION N'EST PAS LE GUIDE (`02-` §2.3.4) : deux objets,
          deux mécanismes. Le guide porte sur la matière MÊME de l'exercice ;
          la démonstration porte sur un AUTRE cours et d'autres notions. */}
      {vue.demonstration.demonstration && vue.demonstrationAvantLaTentative && (
        <Depliable titre="Un exemple, sur un autre sujet" depotId={vue.depotId} aide="demonstration">
          <ContenuDemonstration contenu={vue.contenuDemonstration} />
        </Depliable>
      )}
      {/* Le rappel des observables les plus faibles — EN LANGUE ÉLÈVE, jamais
          par leur code, et dosé par le palier (`06-` §2). */}
      {vue.rappel.observables.length > 0 && (
        <Depliable
          titre="Ce sur quoi tu butais"
          depotId={vue.depotId} aide={null}
          compteur={`${vue.rappel.observables.length} point${vue.rappel.observables.length > 1 ? 's' : ''}`}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-encre">
            {vue.rappel.observables.map((o) => <li key={o.code}>{o.dimension_eleve}</li>)}
          </ul>
        </Depliable>
      )}

      {children}
    </div>
  )
}

// ── La colonne de droite : LE TRAVAIL ───────────────────────────────────────

function ColonneTravail({
  vue, forme, cache, enregistrer, remettre,
}: {
  vue: VueDuDeroule
  forme: FormeDuTravail
  cache: boolean
  enregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  remettre: (texte: string, t: TelemetrieSaisie) => Promise<void>
}) {
  const enRedactionV1 = vue.tempsCourant === 'ecrire' || vue.tempsCourant === 'preparer'

  return (
    <div className={`flex flex-col gap-3 p-4 sm:p-5 ${cache ? 'hidden lg:flex' : ''}`}>
      <div className="flex items-baseline gap-3">
        <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet">
          {titreDuTravail(forme)}
        </h2>
        {forme === 'rediger' && enRedactionV1 && (
          <span className="ml-auto font-ui text-xs text-muet">v1</span>
        )}
        {forme === 'choisir' && (
          <span className="ml-auto font-corps text-[13px] italic text-muet">
            tu peux tout mettre sur une seule, ou étaler
          </span>
        )}
      </div>

      {/* ⭐ Sur un exercice à surligner, le passage désigné est RAPPELÉ en haut
          de la vue `Écrire` (handoff §4) : l'élève écrit ce qu'il en dit sans
          rebasculer pour se relire. */}
      {forme === 'surligner' && <RappelDuPassage vue={vue} />}

      <Attente vue={vue} />

      {/* ⭐⭐ LA CORRECTION — servie APRÈS la crédence DE CE CAS, et pour LES
          DEUX cas de la paire : le second est celui du transfert. */}
      {vue.corrections.map((correction, i) => (
        correction ? <Correction key={i} correction={correction} /> : null
      ))}

      {/* ⭐ La crédence. Aux deux crans guidés elle REMPLACE le champ (handoff
          §4, écran 2b) : elle est la réponse, et elle prend la colonne.
          ⛔⛔ **ELLE NE SE PRÉSENTE PLUS APRÈS LA REMISE** — défaut vu au smoke
          du 30/08 : sur un cran par paires déjà rendu, l'écran servait DEUX
          formulaires de crédence au temps « Retour », et leur bouton était mort
          d'avance — `enregistrerLaCredence` refuse dès que `v1_remis_at` existe
          (« la crédence se déclare PENDANT l'exercice, avant de savoir si tu as
          raison »). *L'écran promettait un geste que le serveur refusait.*
          ⚠️ Aux crans guidés `v1_remis_at` n'est JAMAIS posé — la crédence EST
          la réponse —, donc `enRedactionV1` y reste vrai et rien ne disparaît. */}
      {enRedactionV1 && vue.cas.map((c) => (
        c.credence && !c.credence.empechement && !c.credenceDonnee
          ? <CredenceSaisie
            key={c.ordre} depotId={vue.depotId} cas={c.ordre} offre={c.credence}
            nu={forme === 'choisir'} />
          : null
      ))}

      {/* La micro-question de dépassement. ⚠️ JAMAIS notée, jamais renvoyée
          comme jugement, et `motif_depassement` reste NULL si on n'y répond
          pas (`02-` §2.4 ; `07-` §1.1). */}
      {enRedactionV1 && vue.microQuestionDue && !vue.motifDepassement && (
        <MicroQuestion depotId={vue.depotId} />
      )}

      {/* ⛔ AUCUN CHAMP DE RÉDACTION AUX CRANS GUIDÉS — c'était le défaut que le
          handoff §4 ferme : l'élève y voyait un champ qu'il n'avait pas à
          remplir, à côté des quatre lectures qui portaient sa réponse. */}
      {forme !== 'choisir' && enRedactionV1 && (
        <ChampDeRedaction
          depotId={vue.depotId}
          valeurInitiale={vue.texteV1 ?? ''}
          telemetrieInitiale={vue.telemetrie.v1 ?? null}
          lectureSeule={false}
          rows={forme === 'surligner' ? 9 : 14}
          onEnregistrer={enregistrer}
          onRemettre={remettre}
          libelleRemise={forme === 'surligner' ? 'Rendre ma réponse' : 'Rendre ma v1'}
          /* ⭐ LES TROIS GESTES DE LA REMISE, DANS CET ORDRE (`06-` §3), et
             AVANT tout envoi à l'IA — dans la carte « Avant de rendre ». */
          avantDeRendre={<GestesDeLaRemise vue={vue} />}
          pied={vue.regime === 'plein' ? 'Tu pourras la reprendre après le retour.' : null}
        />
      )}

      {/* ⭐ CE QUI A ÉTÉ RENDU, EN LECTURE SEULE — « jamais un écran muet »
          (`01-` §12). La copie est partie, le champ a disparu, et tant que le
          retour n'est pas là il ne reste RIEN à faire : la colonne de travail
          se retrouvait alors vide sous son sur-titre. *Trouvé au smoke du
          30/08, sur un « se juger » servi sans question.*
          ⚠️ Elle ne s'affiche PAS pendant la rédaction — le champ la porte déjà
             —, ni aux crans guidés, où l'élève ne rédige rien. */}
      {!enRedactionV1 && forme !== 'choisir' && (vue.texteV1 ?? '').trim() !== '' && (
        <div>
          <p className="mb-2 font-ui text-xs text-muet">
            {vue.estUnePaire ? 'Premier cas' : 'Ta v1'} · lecture seule
          </p>
          <TexteBrut
            texte={vue.texteV1 ?? ''}
            className="rounded-xl border border-bordure bg-surface-retrait p-4 font-corps
                       text-[16.5px] leading-[1.7] text-encre-douce"
          />
        </div>
      )}

      <Etalon vue={vue} />
    </div>
  )
}

/** Le rappel du passage désigné, en tête de la vue `Écrire` du téléphone. */
function RappelDuPassage({ vue }: { vue: VueDuDeroule }) {
  const cas = vue.cas.find((c) => c.designationDemandee && c.zoneDonnee)
  if (!cas?.zoneDonnee || !cas.materiau) return null
  const contenu = cas.materiau.map((sg) => sg.texte).join('')
  const extrait = contenu.slice(cas.zoneDonnee[0], cas.zoneDonnee[1])
  if (extrait.trim() === '') return null
  return (
    <div className="rounded-xl border border-bordure bg-pigment-teinte p-3 lg:hidden">
      <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-pigment">
        Le passage que tu as surligné
      </p>
      <p className="mt-1 line-clamp-3 font-corps text-sm italic leading-relaxed text-encre">
        « {extrait} »
      </p>
    </div>
  )
}

// ── Écran 2e — LE RETOUR D'UN TEXTE ─────────────────────────────────────────

/**
 * ⭐ « Ce qu'il faut comparer, c'est SON TEXTE et CE QU'ON LUI EN DIT »
 *    (handoff §6) : colonnes égales, et **rien ne s'intercale entre les deux**.
 *    L'unique action de révision passe SOUS les deux colonnes, pleine largeur.
 */
function RetourDUnTexte({
  vue, renvoi, setRenvoi, reprise, setReprise, enregistrer, remettre,
}: {
  vue: VueDuDeroule
  renvoi: string | null
  setRenvoi: (c: string | null) => void
  reprise: boolean
  setReprise: (v: boolean) => void
  enregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  remettre: (texte: string, t: TelemetrieSaisie) => Promise<void>
}) {
  const [ongletMobile, setOngletMobile] = useState<'texte' | 'retour'>('retour')
  const enRevision = vue.tempsCourant === 'reviser'
  const retours = [vue.retourFinal, vue.retourChaud].filter((r) => r !== null)
  const nbPoints = retours.reduce((n, r) => n + r.points.length, 0)

  /**
   * ⚠️⚠️ **SUR UNE PAIRE, `texteVf` N'EST PAS UNE VERSION FINALE** : c'est la
   *    réponse au SECOND cas. `etapeDeLaPaire` lit `[texte_v1, texte_vf]` comme
   *    « les réponses aux deux cas » (`utils/deroule/regime.ts`). Ne montrer que
   *    `texteV1` cacherait donc le cas du transfert — celui qui porte toute la
   *    raison d'être de la paire.
   */
  const copies = vue.estUnePaire
    ? [{ libelle: 'Premier cas', texte: vue.texteV1 ?? '' },
      { libelle: 'Un cas neuf, de la même famille', texte: vue.texteVf ?? '' }]
      .filter((c) => c.texte.trim() !== '')
    : [{ libelle: null,
      texte: (vue.tempsCourant === 'retour_final' ? vue.texteVf ?? vue.texteV1 : vue.texteV1) ?? '' }]

  return (
    <div>
      {/* Bandeau collé en haut du téléphone — « À rendre : version finale avant
          ven. 12 » (handoff §6). Il ne se déplie pas : c'est une échéance. */}
      {enRevision && vue.echeanceVf.quand && (
        <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-attention/30
                        bg-attention-teinte px-4 py-2.5 lg:hidden">
          <span className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                           text-attention">
            À rendre
          </span>
          <span className="font-corps text-sm text-encre-douce">
            version finale avant {jourCourt(vue.echeanceVf.quand)}
          </span>
        </div>
      )}

      {/* Bascule du téléphone — « Mon texte » / « Le retour · 3 ». */}
      <div className="px-4 pt-3.5 lg:hidden">
        <div className="flex overflow-hidden rounded-[10px] border border-bordure-bouton bg-surface">
          {([['texte', 'Mon texte'],
            ['retour', nbPoints > 0 ? `Le retour · ${nbPoints}` : 'Le retour']] as const)
            .map(([v, libelle]) => (
              <button
                key={v} type="button" onClick={() => setOngletMobile(v)}
                aria-pressed={ongletMobile === v}
                className={`min-h-12 flex-1 px-3 font-ui text-sm ${ongletMobile === v
                  ? 'bg-bouton font-semibold text-bouton-texte'
                  : 'text-muet'}`}
              >
                {libelle}
              </button>
            ))}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:items-stretch">
        {/* ── LA COPIE, EN LECTURE SEULE ─────────────────────────────────── */}
        <div className={`flex flex-col gap-3 border-bordure bg-fond-module p-4 sm:p-5
                         lg:border-r ${ongletMobile === 'texte' ? '' : 'hidden lg:flex'}`}>
          <div className="flex items-baseline gap-3">
            <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em]
                           text-muet">
              Ce que tu as écrit
            </h2>
            <span className="ml-auto font-ui text-xs text-muet">
              {vue.estUnePaire ? 'les deux cas'
                : vue.tempsCourant === 'retour_final' ? 'version finale' : 'v1'} · lecture seule
            </span>
          </div>
          {copies.length === 0 ? (
            <p className="rounded-xl border border-bordure bg-surface-retrait p-4 text-sm
                          italic text-muet">
              Rien n’a été rendu à l’écrit sur cet exercice.
            </p>
          ) : copies.map((c, i) => (
            <div key={i}>
              {c.libelle && (
                <p className="mb-1.5 font-marque text-[11px] font-semibold uppercase
                              tracking-[0.11em] text-muet">
                  {c.libelle}
                </p>
              )}
              {/* ⭐ LE RENVOI D'UN POINT SURLIGNE ICI (handoff §6). Le découpage
                 est celui du matériau — **pas un octet retouché** —, et une
                 citation introuvable ne surligne RIEN plutôt que d'à-peu-près. */}
              <MateriauMarque
                segments={segmentsDuRenvoi(c.texte, renvoi)}
                className="rounded-xl border border-bordure bg-surface-retrait p-4 font-corps
                           text-[16.5px] leading-[1.7] text-encre-douce"
              />
            </div>
          ))}
        </div>

        {/* ── LE RETOUR, OU LA VERSION FINALE EN COURS ──────────────────── */}
        <div className={`flex flex-col gap-4 p-4 sm:p-5
                         ${ongletMobile === 'retour' ? '' : 'hidden lg:flex'}`}>
          {reprise && enRevision ? (
            <>
              <div className="flex items-baseline gap-3">
                <h2 className="font-marque text-[11px] font-semibold uppercase
                               tracking-[0.13em] text-muet">
                  Ta version finale
                </h2>
              </div>
              {vue.retourChaud?.actionRevision && (
                <EncartDeRevision vue={vue}>{vue.retourChaud.actionRevision}</EncartDeRevision>
              )}
              <ChampDeRedaction
                depotId={vue.depotId}
                valeurInitiale={vue.texteVf ?? vue.texteV1 ?? ''}
                telemetrieInitiale={vue.telemetrie.vf ?? null}
                lectureSeule={false}
                rows={14}
                onEnregistrer={enregistrer}
                onRemettre={remettre}
                libelleRemise="Rendre ma version finale"
              />
            </>
          ) : (
            retours.map((r) => (
              <RetourSegmente
                key={r.moment}
                depotId={vue.depotId} retour={r} vue={vue} nu
                titre={r.moment === 'final' ? 'Ce qui a bougé' : 'Ton retour'}
                onRenvoi={setRenvoi}
                renvoiActif={renvoi}
              />
            ))
          )}
        </div>
      </div>

      {/* ── SOUS LES DEUX COLONNES, PLEINE LARGEUR : L'UNIQUE ACTION ────── */}
      {!reprise && enRevision && (
        <div className="flex flex-col gap-3 border-t border-bordure bg-surface px-4 py-4 sm:px-6">
          {vue.retourChaud?.actionRevision && (
            <EncartDeRevision vue={vue} action={() => setReprise(true)}>
              {vue.retourChaud.actionRevision}
            </EncartDeRevision>
          )}
          {!vue.retourChaud?.actionRevision && (
            <button
              type="button" onClick={() => setReprise(true)}
              className="min-h-12 self-start rounded-[10px] bg-bouton px-6 py-3.5 font-ui
                         text-[15px] font-semibold text-bouton-texte"
            >
              Reprendre mon texte
            </button>
          )}
        </div>
      )}

      {/* ── EN BAS, REPLIÉS CÔTE À CÔTE : la consigne et le texte de départ ─ */}
      <div className="flex flex-col gap-2.5 border-t border-bordure bg-surface px-4 pb-5 pt-4
                      sm:flex-row sm:px-6">
        <details className="group flex-1 rounded-xl border border-bordure bg-surface-retrait">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-3">
            <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
            <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
            <span className="font-corps text-[15px] text-encre-douce">La consigne</span>
          </summary>
          <p className="border-t border-bordure px-4 py-3 font-corps text-[15px] leading-relaxed
                        text-encre">
            <TexteBalise jetons={vue.consigne} />
          </p>
        </details>
        <MatiereRepliee vue={vue} />
      </div>

      <div className="px-4 pb-5 sm:px-6"><Etalon vue={vue} /></div>
    </div>
  )
}

/**
 * ⭐ « En bas, repliés côte à côte : ▸ La consigne et ▸ Le texte de départ »
 *    (handoff §6). Ce composant porte le SECOND — celui de la matière.
 *
 * ⚠️ **DEUX SOURCES, ET IL NE FAUT PAS EN OUBLIER UNE.** Le texte d'auteur
 *    (`texteSupport`) est celui des exercices de lecture ; le MATÉRIAU DES CAS
 *    est celui des crans qui font travailler sur une copie. Aux crans 4, 7 et 9
 *    le second porte, en plus, **la zone que l'élève a désignée** : *« la
 *    sélection reste gelée et visible après la remise »* (handoff §4) — la
 *    laisser tomber ici priverait l'élève, au moment du retour, de ce qu'il
 *    avait pointé.
 * ⭐ Elle se marque avec le surlignage DE L'ÉLÈVE, jamais celui de l'écran :
 *    les deux ne se confondent pas (`TexteBalise`).
 */
function MatiereRepliee({ vue }: { vue: VueDuDeroule }) {
  const casDesigne = vue.cas.filter((c) => c.materiau?.length)
  // ⭐⭐ TROIS SOURCES, PAS DEUX. Le co-texte des crans de production est la
  //    TROISIÈME, et l'oublier ici rendrait au moment du retour un exercice
  //    dont la consigne parle d'un argument que l'élève ne peut plus relire.
  if (!vue.texteSupport && !vue.coTexte && casDesigne.length === 0) return null

  const titre = vue.texteSupport
    ? `Le texte de départ${vue.texteSupport.auteur ? ` · ${vue.texteSupport.auteur}` : ''}`
    : vue.cas.some((c) => c.designationDemandee && c.zoneDonnee)
      ? 'Le texte, et ce que tu avais surligné'
      : 'Le texte de départ'

  return (
    <details className="group flex-1 rounded-xl border border-bordure bg-surface-retrait">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-3">
        <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
        <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
        <span className="min-w-0 truncate font-corps text-[15px] text-encre-douce">{titre}</span>
      </summary>
      <div className="flex flex-col gap-3 border-t border-bordure px-4 py-3">
        {vue.texteSupport && (
          <MateriauMarque
            segments={vue.texteSupport.segments}
            className="font-corps text-[15.5px] leading-[1.62] text-encre"
          />
        )}
        {vue.coTexte && (
          <p className="whitespace-pre-wrap font-corps text-[15.5px] leading-[1.62] text-encre">
            {vue.coTexte}
          </p>
        )}
        {!vue.texteSupport && casDesigne.map((c) => (
          <div key={c.ordre}>
            {vue.estUnePaire && (
              <p className="mb-1.5 font-marque text-[11px] font-semibold uppercase
                            tracking-[0.11em] text-muet">
                {c.ordre === 1 ? 'Premier cas' : 'Un cas neuf, de la même famille'}
              </p>
            )}
            <MateriauMarque
              segments={segmentsDeLaZone(c)}
              marque={MARQUE_ELEVE}
              className="font-corps text-[15.5px] leading-[1.62] text-encre"
            />
          </div>
        ))}
      </div>
    </details>
  )
}

/**
 * Le matériau d'un cas, découpé par la zone que l'élève avait désignée.
 * ⚠️ Sans zone, le matériau sort d'un seul segment NON marqué : « rien à
 *    surligner » est une réponse, et elle ne se peint pas.
 */
function segmentsDeLaZone(c: VueDuDeroule['cas'][number]) {
  const contenu = (c.materiau ?? []).map((sg) => sg.texte).join('')
  const z = c.zoneDonnee
  if (!z) return [{ texte: contenu, marque: false }]
  return [
    { texte: contenu.slice(0, z[0]), marque: false },
    { texte: contenu.slice(z[0], z[1]), marque: true },
    { texte: contenu.slice(z[1]), marque: false },
  ].filter((s) => s.texte !== '')
}

/**
 * ⭐ « L'UNIQUE ACTION DE RÉVISION » (handoff §6) — encart `attention`, filet
 *    gauche de 3 px, et le bouton à droite. *Une seule chose à faire.*
 */
function EncartDeRevision(
  { vue, children, action }:
  { vue: VueDuDeroule; children: React.ReactNode; action?: () => void },
) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-attention/35 border-l-[3px]
                    border-l-attention bg-attention-teinte px-4 py-4 sm:flex-row sm:items-center
                    sm:gap-5">
      <div className="min-w-0 flex-1">
        <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                      text-attention">
          Ce que tu as à reprendre — une seule chose
        </p>
        <p className="mt-1.5 font-corps text-[17px] leading-[1.5] text-encre">{children}</p>
        {vue.echeanceVf.quand && (
          <p className="mt-2 font-ui text-xs text-encre-douce">
            À rendre avant le {quand(vue.echeanceVf.quand)}.
          </p>
        )}
      </div>
      {action && (
        <button
          type="button" onClick={action}
          className="min-h-12 shrink-0 rounded-[10px] bg-bouton px-6 py-3.5 font-ui text-[15px]
                     font-semibold text-bouton-texte"
        >
          Reprendre mon texte
        </button>
      )}
    </div>
  )
}

// ── Écran 2f — LE RETOUR D'UN CHOIX ─────────────────────────────────────────

/**
 * ⭐ « Ce qu'il faut comparer, c'est SA RÉPONSE et LA BONNE LECTURE »
 *    (handoff §6) : la correction prend la grande colonne, et la consigne reste
 *    posée à droite avec la répartition que l'élève avait faite.
 */
function RetourDUnChoix({ vue, atelier }: { vue: VueDuDeroule; atelier: Atelier }) {
  const dernier = vue.cas[vue.cas.length - 1]
  const lectures = lireLaRepartition(dernier?.credenceDonnee)

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
      {/* ── LA CORRECTION ─────────────────────────────────────────────── */}
      <div className="order-2 flex flex-col gap-3 p-4 sm:p-5 lg:order-1">
        <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet">
          Ton retour
        </h2>
        {vue.corrections.map((correction, i) => (
          correction ? <Correction key={i} correction={correction} /> : null
        ))}

        <div className="mt-1 flex flex-col gap-3.5 sm:flex-row sm:items-center">
          {/* ⚠️ La phrase ne se dit QUE si le régime ne sert pas de version
              finale : une escalade peut en avoir ajouté une, et refermer là
              dirait à l'élève qu'il n'a plus rien à faire alors qu'il doit
              encore reprendre. */}
          {vue.regime !== 'plein' && (
            <p className="flex-1 font-corps text-[15px] italic text-muet">
              Cet exercice s’arrête ici — il n’y a pas de version finale à rendre.
            </p>
          )}
          <Link
            href={`/eleve/modules/${atelier}`}
            className="inline-flex min-h-12 items-center justify-center rounded-[10px] border
                       border-bordure-bouton bg-surface px-5 py-3 font-ui text-sm font-semibold
                       text-encre-douce"
          >
            ← Retour à mes exercices
          </Link>
        </div>
      </div>

      {/* ── LA CONSIGNE, ET CE QUE L'ÉLÈVE AVAIT POSÉ ─────────────────── */}
      <div className="order-1 flex flex-col gap-3 border-bordure bg-fond-module p-4 sm:p-5
                      lg:order-2 lg:border-l">
        <Carte titre="La consigne">
          <p className="font-corps text-base leading-[1.5] text-encre">
            <TexteBalise jetons={vue.consigne} />
          </p>
        </Carte>

        {lectures && <CeQueTuAvaisPose lectures={lectures} />}

        {dernier?.materiau && dernier.materiau.length > 0 && (
          <details className="group rounded-xl border border-bordure bg-surface-retrait">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5
                                px-4 py-3">
              <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
              <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
              <span className="font-corps text-[15px] text-encre-douce">Le passage</span>
            </summary>
            <MateriauMarque
              segments={dernier.materiau}
              className="border-t border-bordure px-4 py-3 font-corps text-[15.5px]
                         leading-[1.62] text-encre"
            />
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * ⭐ « Ce que tu avais posé » — les quatre lectures, DANS L'ORDRE SERVI, avec
 *    les jetons. La bonne lecture est marquée **APRÈS COUP** par une barre `ok` ;
 *    les autres restent `muet` (handoff §6, validé).
 *
 * ⛔ Tout vient de l'ENTRÉE DÉJÀ ÉCRITE (`lireLaRepartition`) : `indexAttendue`
 *    ne traverse jamais l'écran de saisie, et il n'y a rien à fuiter tant que le
 *    geste n'a pas eu lieu.
 */
function CeQueTuAvaisPose(
  { lectures }: { lectures: NonNullable<ReturnType<typeof lireLaRepartition>> },
) {
  return (
    <>
      {/* Sur téléphone, le rappel tient sur une ligne et le détail se déplie. */}
      <details className="group rounded-xl border border-bordure bg-surface-retrait lg:hidden">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2.5 px-4 py-3">
          <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
          <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
          <span className="flex-1 font-corps text-[15px] text-encre-douce">
            Ce que tu avais posé
          </span>
          <span className="rounded-full border border-bordure bg-surface px-2.5 py-1 font-ui
                           text-[11.5px] text-muet group-open:hidden">
            {rappelDeLaRepartition(lectures)}
          </span>
        </summary>
        <div className="border-t border-bordure px-4 py-3">
          <BarresPosees lectures={lectures} />
        </div>
      </details>

      <div className="hidden lg:block">
        <Carte titre="Ce que tu avais posé">
          <BarresPosees lectures={lectures} />
          {lectures.some((l) => l.attendue) && (
            <p className="mt-3 font-corps text-[13.5px] italic text-muet">
              La barre verte marque la lecture qu’il fallait voir.
            </p>
          )}
        </Carte>
      </div>
    </>
  )
}

function BarresPosees(
  { lectures }: { lectures: NonNullable<ReturnType<typeof lireLaRepartition>> },
) {
  return (
    <ul className="flex flex-col gap-2.5">
      {lectures.map((l, i) => (
        <li key={`${i}-${l.candidat}`} className="flex items-center gap-2.5">
          <span className={`min-w-0 flex-1 font-corps text-[15px] ${
            l.jetons > 0 ? 'text-encre' : 'text-muet'}`}>
            {l.candidat}
          </span>
          <span
            aria-hidden
            className="h-2 w-[108px] shrink-0 overflow-hidden rounded-full bg-bordure"
          >
            <span
              className={`block h-full rounded-full ${l.attendue ? 'bg-ok' : 'bg-muet'}`}
              style={{ width: `${Math.max(0, Math.min(100, l.jetons))}%` }}
            />
          </span>
          <span className={`w-8 shrink-0 text-right font-ui text-sm font-semibold tabular-nums ${
            l.jetons > 0 ? 'text-encre' : 'text-muet'}`}>
            {l.jetons}
          </span>
        </li>
      ))}
    </ul>
  )
}

// ── La correction, commune aux deux écrans qui la servent ───────────────────

function Correction(
  { correction }: { correction: NonNullable<VueDuDeroule['corrections'][number]> },
) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-ok/25 bg-ok-teinte p-4 sm:px-[18px]">
        <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-ok">
          Ce qu’il fallait voir
        </p>
        <TexteBrut texte={correction.reponse}
          className="mt-1.5 font-corps text-[17px] font-semibold leading-[1.45] text-encre" />
      </div>

      {/* ⭐ LE POURQUOI. Aux crans à candidats la réponse ci-dessus est un
          CANDIDAT NU : elle ne peut rien dire d'elle-même. */}
      {correction.pourquoiJuste && (
        <div className="rounded-xl border border-bordure bg-surface p-4 sm:px-[18px]">
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                        text-muet">
            Pourquoi c’est celle-là
          </p>
          <TexteBrut texte={correction.pourquoiJuste}
            className="mt-1.5 font-corps text-base leading-[1.55] text-encre" />
        </div>
      )}

      {/* ⚠️ LA RÉFUTATION DU SEUL CANDIDAT LE PLUS CHARGÉ — jamais des trois :
          la rétroaction élaborée surcharge l'élève à faible bagage et devient
          redondante pour l'avancé. */}
      {correction.refutation && (
        <div className="rounded-xl border border-bordure bg-surface-retrait p-4 sm:px-[18px]">
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                        text-muet">
            Ce que tu avais retenu — « {correction.refutation.candidat} »
          </p>
          <TexteBrut texte={correction.refutation.pourquoiFaux}
            className="mt-1.5 font-corps text-base leading-[1.55] text-encre-douce" />
        </div>
      )}

      {/* ⭐ L'ÉGALITÉ SE DIT, elle ne se tait pas : « servir la réfutation d'un
          candidat que l'élève n'a pas choisi est pire que n'en servir aucune ».
          L'absence est honnête. */}
      {correction.silence === 'egalite' && (
        <p className="font-ui text-xs text-encre-douce">
          Tu avais réparti tes jetons à égalité : aucun candidat n’était celui que tu tenais le
          plus pour vrai. Rien n’est donc repris ici en particulier.
        </p>
      )}
    </div>
  )
}

// ── L'étalon des crans de production ────────────────────────────────────────

/**
 * ⭐⭐ L'ÉTALON — item 86, `02-` 6.0 §2.3.4 : « une production modèle : à quoi
 *    peut ressembler une bonne réponse ». ⛔ **La vue ne le rend qu'après la
 *    version finale** — servi plus tôt, il donnerait une réponse à recopier et
 *    le `delta_v1_vf` ne mesurerait plus rien. La garde est côté serveur
 *    (`etalonServi`) : ici on affiche, on ne décide pas.
 *
 * ⭐ Au cran 2 `deplie` vaut `true` et le bloc est OUVERT — l'élève ne l'a pas
 *    demandé, il n'y a rien à compter. Au cran 6 il est REPLIÉ, et le déplier
 *    compte une aide. Au cran 8 la vue rend `null`.
 */
function Etalon({ vue }: { vue: VueDuDeroule }) {
  if (!vue.etalon) return null
  return (
    <Depliable
      titre="Un exemple de ce qui était attendu"
      depotId={vue.depotId} aide="etalon" ouvertParDefaut={vue.etalon.deplie}
    >
      <TexteBrut texte={vue.etalon.texte} className="text-sm text-encre" />
      {/* ⚠️ Le titre ne dit pas « la bonne réponse » — « une production a
          plusieurs bonnes formes, et l'étalon en donne UNE, jamais la seule ». */}
      <p className="mt-2 text-xs text-encre-douce">
        Ce n’est pas la seule bonne réponse : un devoir peut être réussi autrement. Sers-t’en
        pour voir ce qui était attendu, pas pour comparer mot à mot.
      </p>
    </Depliable>
  )
}

// ── L'attente : un ÉTAT EXPLICITE, jamais un écran muet ─────────────────────

function Attente({ vue }: { vue: VueDuDeroule }) {
  const router = useRouter()
  const [etat, setEtat] = useState(vue.attente)

  useEffect(() => {
    if (!etat.enCours) return
    const id = setInterval(async () => {
      const frais = await actionEtatDeLAttente(vue.depotId)
      if (!frais) return
      setEtat((v) => ({ ...v, enCours: frais.enCours, echecDefinitif: frais.echecDefinitif,
        message: frais.message }))
      if (frais.retourPret || frais.echecDefinitif) router.refresh()
    }, SONDAGE_MS)
    return () => clearInterval(id)
  }, [etat.enCours, vue.depotId, router])

  if (etat.echecDefinitif) {
    return (
      <Encart ton="attention">
        <p className="text-sm text-encre">
          <strong>Ton retour n’a pas pu être préparé.</strong> Préviens ton professeur — ton
          travail est enregistré, rien n’est perdu.
        </p>
        {etat.message && <p className="mt-1 text-xs text-muet">{etat.message}</p>}
      </Encart>
    )
  }
  if (!etat.enCours) return null
  return (
    <Encart>
      <p className="text-sm text-encre">
        <strong>Ton retour est en préparation.</strong> Cet écran se met à jour tout seul — tu
        n’as rien à recharger.
      </p>
    </Encart>
  )
}

// ── La micro-question ───────────────────────────────────────────────────────

function MicroQuestion({ depotId }: { depotId: string }) {
  const [fait, setFait] = useState(false)
  if (fait) return null
  return (
    <Encart>
      <p className="text-sm text-encre">Tu y es depuis un moment — pause, ou difficulté ?</p>
      <div className="mt-2 flex gap-2">
        {([['pause', 'J’ai fait une pause'], ['difficulte', 'Je bute']] as const).map(
          ([v, libelle]) => (
            <button
              key={v} type="button"
              onClick={() => { void actionMicroQuestion(depotId, v); setFait(true) }}
              className="min-h-11 rounded-[9px] border border-bordure-bouton px-3 py-1
                         font-ui text-sm text-encre-douce"
            >
              {libelle}
            </button>
          ))}
      </div>
      {/* ⚠️ « Jamais notée, jamais renvoyée comme jugement » (`02-` §2.4). */}
      <p className="mt-2 text-xs text-muet">Ça ne compte pas dans ton travail.</p>
    </Encart>
  )
}

// ── Les deux boîtes communes ────────────────────────────────────────────────

/** Une carte de la colonne de gauche : sur-titre en Cinzel, contenu dessous. */
function Carte(
  { titre, appoint, children }:
  { titre: string; appoint?: string; children: React.ReactNode },
) {
  return (
    <section className="rounded-xl border border-bordure bg-surface p-4">
      <div className="mb-2 flex items-baseline gap-2.5">
        <h3 className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-muet">
          {titre}
        </h3>
        {appoint && (
          <span className="min-w-0 truncate font-corps text-[13px] italic text-muet">
            {appoint}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

// ── Le dépliable, qui compte une aide ───────────────────────────────────────

/**
 * ⭐ Chaque dépliage compte pour `aide_consommee` (décision du PO, 22/08) —
 * mais **une seule fois** : rouvrir un panneau qu'on vient de fermer n'est pas
 * une seconde consultation.
 *
 * ⚠️ `ouvertParDefaut` OUVRE **ET** DÉSARME LE COMPTEUR, et les deux vont
 *    ensemble. Un bloc servi ouvert n'a pas été demandé : le compter ferait
 *    passer pour « aide consommée » ce que le dispositif a donné de lui-même,
 *    et `aide_consommee` (`01-` §11) cesserait de dire ce qu'il dit.
 *
 * ⚠️ **CE N'EST PAS UN `<details>`, ET C'EST POUR ÇA.** Les blocs sans compteur
 *    de l'écran en sont ; celui-ci doit savoir QUAND l'élève l'ouvre, pour
 *    l'appeler UNE fois — et un `<details>` natif ne le dirait qu'au prix d'un
 *    `onToggle` qui se déclenche aussi à la fermeture.
 */
/**
 * @param aide `null` = **CE BLOC NE COMPTE PAS**, et il ne faut pas l'y forcer.
 *        `AIDES_COMPTEES` (`utils/deroule/depot.ts`) est une liste FERMÉE de
 *        quatre valeurs, et `aide_consommee` est un signal MESURÉ (`01-` §11) :
 *        y verser un cinquième dépliage changerait ce que le compteur veut dire.
 *        ⭐ C'est le cas du RAPPEL — « ce sur quoi tu butais » —, que ce lot
 *           replie (handoff §4) alors qu'il était toujours ouvert : le replier
 *           ne doit rien coûter de plus qu'avant, où il était gratuit.
 */
function Depliable({
  titre, depotId, aide, children, ouvertParDefaut = false, compteur,
}: {
  titre: string; depotId: string; aide: string | null; children: React.ReactNode
  ouvertParDefaut?: boolean; compteur?: string
}) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  const [compte, setCompte] = useState(ouvertParDefaut || aide === null)
  return (
    <section className="rounded-xl border border-bordure bg-surface-retrait">
      <button
        type="button"
        aria-expanded={ouvert}
        onClick={() => {
          setOuvert((v) => !v)
          if (!compte && aide !== null) {
            void actionCompterUneAide(depotId, aide); setCompte(true)
          }
        }}
        className="flex min-h-12 w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <span aria-hidden className="text-xs text-muet">{ouvert ? '▾' : '▸'}</span>
        <span className="flex-1 font-corps text-[15px] text-encre-douce">{titre}</span>
        {compteur && (
          <span className="rounded-full border border-bordure bg-surface px-2.5 py-1 font-ui
                           text-[11.5px] text-muet">
            {compteur}
          </span>
        )}
      </button>
      {ouvert && <div className="border-t border-bordure px-4 py-3">{children}</div>}
    </section>
  )
}

function ContenuDemonstration(
  { contenu }: { contenu: VueDuDeroule['contenuDemonstration'] },
) {
  if (!contenu) {
    return <p className="text-sm text-muet">L’exemple n’est pas lisible.</p>
  }
  if (contenu.forme === 'exemple') {
    return <TexteBrut texte={contenu.texte} className="font-corps text-sm text-encre" />
  }
  if (contenu.forme === 'checklist') {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-encre">
        {contenu.points.map((p, i) => <li key={i}>{p}</li>)}
      </ul>
    )
  }
  // Le modelage : « un brouillon commenté qui montre la genèse, ou deux plans
  // annotés à comparer » (`06-` §2). ⚠️ Ses volets sont des objets LIBRES — le
  // contrôle d'import n'en garantit que la forme (`{ volets: object[] }`), pas
  // les clés. On rend les deux qu'on sait nommer, et on ne devine pas les autres.
  return (
    <ol className="space-y-3 text-sm text-encre">
      {contenu.volets.map((v, i) => {
        const titre = typeof v.titre === 'string' ? v.titre : null
        const texte = typeof v.texte === 'string' ? v.texte : null
        return (
          <li key={i} className="rounded border border-bordure p-3">
            {titre && <p className="font-marque text-xs uppercase text-muet">{titre}</p>}
            {texte && <p className="mt-1 whitespace-pre-wrap">{texte}</p>}
          </li>
        )
      })}
    </ol>
  )
}

export function Encart(
  { children, ton = 'info' }: { children: React.ReactNode; ton?: 'info' | 'attention' | 'ok' },
) {
  const cls = ton === 'attention' ? 'border-attention/35 bg-attention-teinte'
    : ton === 'ok' ? 'border-ok/25 bg-ok-teinte'
      : 'border-bordure bg-surface'
  return <div className={`rounded-xl border p-4 ${cls}`}>{children}</div>
}
