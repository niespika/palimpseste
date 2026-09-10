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
//
// ⭐⭐ **04/09 (soir) — « UN ÉCRAN, UNE TÂCHE » (Louis, dix commentaires sur la
//    galerie des écrans).** La colonne de droite est désormais **UNE PAGE QUI
//    TOURNE** : le champ et son bouton « Enregistrer », OU la crédence, OU un
//    geste de la remise, OU le bouton de remise, OU un point du retour — jamais
//    deux ensemble. La page courante se lit dans `utils/deroule/etapes.ts`
//    (module PUR) ; le seul état d'écran qui la fait tourner est
//    `redactionFinie` — l'élève a enregistré et passé la main —, et il ne
//    s'écrit nulle part (recharger revient au champ tant que la crédence n'est
//    pas donnée ; une fois donnée, le texte est gelé et la page est celle des
//    gestes). Sur téléphone, la bascule a **trois entrées — Lire · Écrire ·
//    Crédence —** tant que ces trois-là coexistent. ⛔ Rien de ce qui
//    s'enregistre n'a changé : mêmes actions, mêmes moments.
// ============================================================================

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TexteBalise, TexteBrut, MateriauMarque, MARQUE_ELEVE } from './TexteBalise'
import { ChampDeRedaction, type PoigneeDuChamp } from './ChampDeRedaction'
import { CredenceSaisie } from './CredenceSaisie'
import { DesignationDansLeMateriau } from './DesignationDansLeMateriau'
import { GestesDeLaRemise } from './GestesDeLaRemise'
import { PreparationArgument, RelectureArgument } from './PiloteArgument'
import { SeJuger } from './SeJuger'
import { RetourSegmente } from './RetourSegmente'
import { TexteATrou } from './TexteATrou'
import { PlanAOrdonner } from './PlanAOrdonner'
import { SignalerUnProbleme } from './SignalerUnProbleme'
import type { VueDuDeroule } from '@/utils/deroule/vue'
import type { TelemetrieSaisie, Temps } from '@/utils/deroule/types'
import type { Atelier } from '@/utils/codex-onglets/regles'
import {
  formeDuTravail, voletInitial, ecranDuDeroule, tempsAffiche, libelleDuTemps, etatDuTemps,
  rangDuTemps, colonnesDuPlan, type FormeDuTravail, type Volet,
} from '@/utils/deroule/plan-de-travail'
import {
  etapeDuTravail, etapesServies, rangDeLEtape, gestesServis, titreDeLEtape,
  libelleDuVoletDeTravail, tempsDeLaPage, type EtapeDuTravail,
} from '@/utils/deroule/etapes'
import { segmentsDuRenvoi } from '@/utils/deroule/renvoi'
import { momentDeLaPaire, casDuMoment, versionDuCas, type MomentDeLaPaire } from '@/utils/deroule/paire'
import { lireLaRepartition } from '@/utils/deroule/repartition'
import {
  actionOuvrir, actionEnregistrerBrouillon, actionRemettre, actionMicroQuestion,
  actionCompterUneAide, actionEtatDeLAttente, actionDesignation,
} from '@/app/deroule/actions'

/** Le sondage de l'attente — « jamais un écran muet » (`01-` §12). */
const SONDAGE_MS = 5_000

/** Ce que le champ porte à l'instant — pour la remise, qui se fait sur sa propre page. */
type EtatDuChamp = { texte: string; t: TelemetrieSaisie | null }

export function EcranDeroule(
  { vue, atelier = 'codex' }: { vue: VueDuDeroule; atelier?: Atelier },
) {
  const router = useRouter()

  // L'ouverture est idempotente côté serveur : `ouvert_at` ne se réécrit jamais.
  useEffect(() => { void actionOuvrir(vue.depotId) }, [vue.depotId])

  // ── ⭐⭐ 04/09 — UNE PAIRE, UN CAS À LA FOIS (`utils/deroule/paire.ts`) ─────
  //    « Il faut un cas par écran » (Louis). Le moment se lit sur l'étape du
  //    serveur ; « passer au second cas » est le geste de l'élève, tenu ici.
  const [passeAuSecond, setPasseAuSecond] = useState(false)
  const moment: MomentDeLaPaire | null = vue.estUnePaire
    ? momentDeLaPaire(vue.etapePaire, passeAuSecond) : null
  const casAffiche: 1 | 2 | null = moment ? casDuMoment(moment) : null
  /** Le texte de chaque cas est-il ENREGISTRÉ ? La crédence d'un cas se déclare après. */
  const [texteSauve, setTexteSauve] = useState<Record<number, boolean>>(() => ({
    1: (vue.texteV1 ?? '').trim() !== '', 2: (vue.texteVf ?? '').trim() !== '',
  }))

  // ── ⭐⭐ 04/09 (soir) — LA PAGE QUI TOURNE ────────────────────────────────
  //    `redactionFinie` : l'élève a cliqué « Enregistrer » (ou basculé sur la
  //    crédence) et passé la main. Par cas (une paire en a deux), et pour la
  //    version finale. ⚠️ ÉTAT D'ÉCRAN, pas une donnée : au rechargement, une
  //    crédence déjà donnée vaut « fini » — le texte est gelé —, sinon on
  //    revient au champ.
  const [redactionFinie, setRedactionFinie] = useState<Record<string, boolean>>(() => ({
    1: vue.cas.find((c) => c.ordre === 1)?.credenceDonnee != null,
    2: vue.cas.find((c) => c.ordre === 2)?.credenceDonnee != null,
    vf: false,
  }))
  /** Le champ a-t-il du texte ? — pour que la bascule « Crédence » du téléphone ne mène pas au vide. */
  const [aDuTexte, setADuTexte] = useState<Record<string, boolean>>(() => ({
    1: (vue.texteV1 ?? '').trim() !== '', 2: (vue.texteVf ?? '').trim() !== '',
    vf: (vue.texteVf ?? vue.texteV1 ?? '').trim() !== '',
  }))
  /**
   * ⭐ L'ÉTAT DU CHAMP, POUR LA REMISE — une `ref`, jamais un état : la frappe ne
   *    provoque aucun rendu ici. Ce qui part à la remise est la chaîne que le
   *    champ porte, à l'octet, comme quand le bouton vivait dans le champ
   *    (piège 24 : pas de `<form>`, aucune normalisation sur ce chemin).
   */
  const etatDuChamp = useRef<Record<string, EtatDuChamp>>({})
  /** La poignée du champ courant — pour enregistrer à la demande (bascule « Crédence »). */
  const champ = useRef<PoigneeDuChamp | null>(null)

  // ⚠️ La FORME se dérive avant les états d'écran : le volet initial du
  //    téléphone en dépend (`voletInitial`).
  const forme = formeDuTravail({
    credenceEstLaReponse: vue.credenceEstLaReponse,
    designationDemandee: vue.cas.some((c) => c.designationDemandee),
  })

  // ── ⭐⭐ LA PAGE DE LA COLONNE DE TRAVAIL (`utils/deroule/etapes.ts`) ──────
  const enRedactionV1 = vue.tempsCourant === 'ecrire' || vue.tempsCourant === 'preparer'
  const casCourant = vue.cas.find((c) => casAffiche === null || c.ordre === casAffiche) ?? null
  const credenceASaisir = !!casCourant?.credence && !casCourant.credence.empechement
    && casCourant.credenceDonnee == null
  const cleCourante = cleDuChamp(vue.estUnePaire, versionEnCours(vue, casAffiche), casAffiche)
  const etape: EtapeDuTravail = etapeDuTravail({
    moment,
    credenceEstLaReponse: vue.credenceEstLaReponse,
    enRedaction: enRedactionV1,
    credenceASaisir,
    gesteRestant: vue.gestesRestants[0] ?? null,
    // ⭐ Sur une paire, le premier cas ne se REND pas : il se déclare, puis on
    //    passe au second ; et le second ne se rend qu'une fois sa crédence donnée.
    sansRemise: vue.estUnePaire
      && (casAffiche === 1 || (casAffiche === 2 && casCourant?.credenceDonnee == null)),
    // ⭐⭐ 07/09 — PAR CAS, jamais par exercice : sur une paire 4(a)/4(b), le
    //    cas 1 écrit et le cas 2 surligne. Lire `vue.cas.some(…)` ici servirait
    //    la même forme aux deux — c'est la faute que ce lot répare.
    sansEcriture: casCourant?.sansEcriture ?? false,
    aucuneRemise: vue.aucuneRemise,
    // ⭐ Sur un cas sans écriture, « la rédaction est finie » veut dire « la
    //    zone est posée » : c'est la désignation qui tourne la page.
    // ⛔⛔ LES DEUX SOURCES, ET C'EST LE CORRECTIF DU 07/09 AU SOIR. Le seul
    //    `casCourant.designationDonnee` vient du SERVEUR, et `actionDesignation`
    //    ne revalide pas (01/09) : l'élève surlignait, la page ne tournait pas,
    //    l'onglet Crédence restait inerte, et il n'avait plus aucune sortie.
    //    L'état d'écran (`redactionFinie`, posé par `apresPose`) tourne la page
    //    tout de suite ; la valeur serveur la garde tournée au rechargement.
    redactionFinie: (redactionFinie[cleCourante] ?? false)
      || (casCourant?.sansEcriture ? casCourant.designationDonnee : false),
  })
  const suite = etapesServies({
    estUnePaire: vue.estUnePaire, credenceEstLaReponse: vue.credenceEstLaReponse,
    credenceDemandee: vue.cas.some((c) => c.credence !== null && !c.credence.empechement),
    gestes: gestesServis({
      confianceDemandee: vue.competencesDeLaConfiance.length > 0,
      // ⚠️ Ce que la vue sert, ou a déjà reçu : la restitution n'est due qu'au produire.
      restitutionDemandee: vue.gestesRestants.includes('restitution') || vue.restitutionAChaud !== null,
    }),
    versionFinale: false,
    sansEcriture: vue.cas.map((c) => c.sansEcriture),
    aucuneRemise: vue.aucuneRemise,
  })
  const rang = rangDeLEtape(suite, etape, casAffiche)

  // ⚠️ Pas de `useCallback` ici : le compilateur React mémoïse lui-même, et il
  //    refusait de préserver une mémoïsation manuelle sur ces deux fonctions.
  async function enregistrer(texte: string, t: TelemetrieSaisie) {
    const version = versionEnCours(vue, casAffiche)
    const r = await actionEnregistrerBrouillon(vue.depotId, version, texte, t)
    if (!r.ok) throw new Error(r.message)
    if (casAffiche !== null) {
      setTexteSauve((s) => ({ ...s, [casAffiche]: texte.trim() !== '' }))
    }
  }

  function surEtatDuChamp(texte: string, t: TelemetrieSaisie) {
    etatDuChamp.current[cleCourante] = { texte, t }
    const plein = texte.trim() !== ''
    setADuTexte((s) => (s[cleCourante] === plein ? s : { ...s, [cleCourante]: plein }))
  }

  /**
   * ⭐⭐ LA REMISE, SUR SA PROPRE PAGE. Elle part avec ce que le champ porte —
   *    `etatDuChamp` —, ou, si le champ n'a pas été touché sur cette page, avec
   *    ce que la vue a lu en base : même texte, même relevé.
   */
  async function remettre() {
    {
      const version = versionEnCours(vue, casAffiche)
      const cle = cleDuChamp(vue.estUnePaire, version, casAffiche)
      const etat: EtatDuChamp = etatDuChamp.current[cle] ?? {
        texte: (version === 'vf' || casAffiche === 2 ? vue.texteVf : vue.texteV1) ?? '',
        t: (version === 'vf' || casAffiche === 2 ? vue.telemetrie.vf : vue.telemetrie.v1) ?? null,
      }
      // ⭐⭐ SUR UNE PAIRE, LA REMISE SE FAIT AU SECOND CAS : sa réponse va en
      //    `texte_vf` — « la réponse au second cas » (regime.ts) — et la remise
      //    scelle la v1, celle du premier cas, telle qu'elle a été écrite.
      //    ⚠️ La chaîne mesure la v1 comme hier ; le second cas est désormais
      //    ÉCRIT (il ne l'était jamais : 0 `texte_vf` sur 28 paires en prod).
      if (vue.estUnePaire && casAffiche === 2 && vue.tempsCourant !== 'reviser') {
        // ⛔⛔ 07/09 — AU 4(b), IL N'Y A AUCUN TEXTE À SCELLER, et il ne faut
        //    surtout pas en écrire un. Le champ n'étant plus monté, `etat`
        //    retombe sur `vue.texteVf ?? ''` : on aurait déposé une CHAÎNE VIDE
        //    en `texte_vf`, c'est-à-dire fait passer une absence pour une
        //    réponse. La réponse du second cas est sa ZONE, déjà en base.
        if (!casCourant?.sansEcriture) {
          const b = await actionEnregistrerBrouillon(vue.depotId, 'vf', etat.texte, etat.t)
          if (!b.ok) throw new Error(b.message)
        }
        const r = await actionRemettre(vue.depotId, 'v1', vue.texteV1 ?? '', null)
        if (!r.ok) throw new Error(r.message)
        router.refresh()
        return
      }
      const r = await actionRemettre(vue.depotId, version, etat.texte, etat.t)
      if (!r.ok) throw new Error(r.message)
      router.refresh()
    }
  }

  // ── L'état d'écran, et rien d'autre ──────────────────────────────────────
  // ⚠️ AUCUN de ces états ne décide de ce qui s'enregistre : ils décident de ce
  //    qu'on REGARDE. Le serveur reste seul maître du temps courant.
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
  // ⭐ 05/09 — les gestes et la remise se lisent « Se juger » au fil (Louis).
  const tempsPage = ecran === 'travail' ? tempsDeLaPage(etape) : null

  const tournerLaPage = (finie: boolean) =>
    setRedactionFinie((s) => ({ ...s, [cleCourante]: finie }))

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
      <BarreDeContenu
        vue={vue} atelier={atelier} ecran={ecran} reprise={reprise}
        rangDeLaPage={ecran === 'travail' ? rang : null} tempsPage={tempsPage}
      />
      <FilDesTemps vue={vue} forme={forme} ecran={ecran} reprise={reprise} tempsPage={tempsPage} />

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
          enregistrer={enregistrer} remettre={remettre} surEtatDuChamp={surEtatDuChamp}
          champ={champ}
          textePourRelecture={() => etatDuChamp.current[cleCourante]?.texte ?? vue.texteV1 ?? ''}
          moment={moment} casAffiche={casAffiche} texteSauve={texteSauve}
          passerAuSecond={() => setPasseAuSecond(true)}
          etape={etape} rang={rang} credenceASaisir={credenceASaisir}
          aDuTexte={aDuTexte[cleCourante] ?? false}
          tournerLaPage={tournerLaPage}
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
          enregistrer={enregistrer} remettre={remettre} surEtatDuChamp={surEtatDuChamp}
          redactionFinie={redactionFinie.vf ?? false}
          tournerLaPage={(finie) => setRedactionFinie((s) => ({ ...s, vf: finie }))}
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

function versionEnCours(vue: VueDuDeroule, casAffiche: 1 | 2 | null): 'v1' | 'vf' {
  if (vue.tempsCourant === 'reviser') return 'vf'
  return versionDuCas(vue.estUnePaire, casAffiche)
}

/** La clé sous laquelle l'écran tient l'état d'un champ : le cas (1 ou 2), ou la version finale. */
function cleDuChamp(estUnePaire: boolean, version: 'v1' | 'vf', cas: 1 | 2 | null): string {
  return version === 'vf' && !estUnePaire ? 'vf' : String(cas ?? 1)
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
  vue, atelier, ecran, reprise, rangDeLaPage, tempsPage,
}: {
  vue: VueDuDeroule; atelier: Atelier
  ecran: ReturnType<typeof ecranDuDeroule>; reprise: boolean
  /** ⭐ 04/09 (soir) — le rang de la PAGE de travail (« 3 / 7 »), quand il y en a une. */
  rangDeLaPage: { rang: number; total: number } | null
  /** ⭐ 05/09 — le temps que la page fait lire (« Se juger » pendant les gestes). */
  tempsPage: Temps | null
}) {
  // ⭐ Le compteur du téléphone dit la page — l'étape fine — quand la colonne de
  //    travail en tourne une ; sinon le temps du fil, comme avant. Un seul
  //    compteur par écran : celui de la colonne ne s'affiche qu'à partir de `lg`.
  const rang = rangDeLaPage
    ?? rangDuTemps(tempsPage ?? tempsAffiche(ecran, vue.tempsCourant, reprise), vue.temps)
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
  vue, forme, ecran, reprise, tempsPage,
}: {
  vue: VueDuDeroule; forme: FormeDuTravail
  ecran: ReturnType<typeof ecranDuDeroule>; reprise: boolean
  /** ⭐ 05/09 — « on est toujours dans Se juger » (Louis) : les gestes et la
   *  remise se lisent au temps 3, quoi que dise `tempsCourant`. Présentation. */
  tempsPage: Temps | null
}) {
  const courant = tempsPage ?? tempsAffiche(ecran, vue.tempsCourant, reprise)
  return (
    <nav
      aria-label="Les temps de l’exercice"
      className="flex items-center gap-3.5 overflow-x-auto border-b border-bordure
                 bg-surface-retrait px-4 py-2.5 sm:px-6"
    >
      <ol className="flex shrink-0 gap-1.5">
        {vue.temps.map((t) => <PastilleDeTemps
          key={t} temps={t} etat={etatDuTemps(t, courant, vue.temps)} forme={forme} aucuneRemise={vue.aucuneRemise}
          libelle={vue.piloteArgument && t === 'se_juger' ? (vue.piloteArgument.cran === 6 ? 'Relire et rendre' : 'Rendre') : undefined} />)}
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
  { temps, etat, forme, aucuneRemise = false, libelle }:
  { temps: Temps; etat: 'fait' | 'courant' | 'a_venir'; forme: FormeDuTravail
    /** ⭐ 07/09 — sur un exercice qui ne se remet pas, le temps 2 ne « répond » pas. */
    aucuneRemise?: boolean; libelle?: string },
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
      {libelle ?? libelleDuTemps(temps, forme, aucuneRemise)}
    </li>
  )
}

// ── Écrans 2a / 2b / 2c — LE PLAN DE TRAVAIL ────────────────────────────────

/** Ce que les pages de la colonne de travail reçoivent de l'écran. */
type PagesDuTravail = {
  textePourRelecture: () => string
  enregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  remettre: () => Promise<void>
  surEtatDuChamp: (texte: string, t: TelemetrieSaisie) => void
  champ: React.MutableRefObject<PoigneeDuChamp | null>
  moment: MomentDeLaPaire | null
  casAffiche: 1 | 2 | null
  texteSauve: Record<number, boolean>
  passerAuSecond: () => void
  etape: EtapeDuTravail
  rang: { rang: number; total: number } | null
  credenceASaisir: boolean
  aDuTexte: boolean
  tournerLaPage: (finie: boolean) => void
}

function PlanDeTravail({
  vue, forme, volet, setVolet, ...pages
}: {
  vue: VueDuDeroule
  forme: FormeDuTravail
  volet: Volet
  setVolet: (v: Volet) => void
} & PagesDuTravail) {
  const { etape, credenceASaisir, aDuTexte, tournerLaPage, champ } = pages

  // ⭐⭐ 04/09 (soir) — LA BASCULE DU TÉLÉPHONE A TROIS ENTRÉES — Lire · Écrire ·
  //    Crédence — « quand ces trois-là coexistent » : on écrit, et une crédence
  //    est à déclarer. Sinon deux, et la seconde suit la page (« Rendre » pour
  //    les gestes et la remise, « La correction » entre les deux cas).
  type Entree = 'lire' | 'ecrire' | 'credence'
  // ⭐ 07/09 — le cas MONTRÉ décide du mot, jamais l'exercice : sur une paire
  //    4(a)/4(b), le cas 1 écrit et le cas 2 surligne.
  const casMuet = vue.cas.find((c) => pages.casAffiche === null || c.ordre === pages.casAffiche)?.sansEcriture
  // Sans rédaction, la deuxième entrée porte déjà la crédence : une troisième
  // ferait apparaître « Surligner » et « Crédence » pour le même volet.
  const troisEntrees = !casMuet && credenceASaisir && (etape === 'ecrire' || etape === 'credence')
  const entrees: Array<[Entree, string]> = [
    ['lire', forme === 'surligner' ? 'Lire · surligner' : 'Lire'],
    // ⛔ « Écrire » sur un 4(b) nommait une tâche que la consigne ne demande pas.
    ['ecrire', troisEntrees ? (casMuet ? 'Surligner' : 'Écrire') : libelleDuVoletDeTravail(etape)],
    ...(troisEntrees ? [['credence', 'Crédence'] as [Entree, string]] : []),
  ]
  const active: Entree = volet === 'lire' ? 'lire'
    : (troisEntrees && etape === 'credence' ? 'credence' : 'ecrire')

  async function basculer(v: Entree) {
    if (v === 'lire') { setVolet('lire'); return }
    setVolet('ecrire')
    if (!troisEntrees) return
    if (v === 'ecrire') { tournerLaPage(false); return }
    // « Crédence » depuis le champ : on enregistre d'abord — c'est le geste du
    // bouton, sans le bouton —, et la page tourne si l'enregistrement a abouti.
    if (etape === 'ecrire') {
      const ok = await champ.current?.enregistrer()
      if (ok) tournerLaPage(true)
    }
  }

  return (
    <div>
      <ConsigneCollante vue={vue} casAffiche={pages.casAffiche} />

      {/* ⭐ LA BASCULE DU TÉLÉPHONE (handoff §4) — 48 px, deux ou trois parts
          égales. Sur un exercice à surligner, on surligne dans `Lire` et le
          bouton du bas fait passer à `Écrire`. */}
      <div className="px-4 pt-3.5 lg:hidden">
        <div
          role="group" aria-label="Lire ou travailler"
          className="flex overflow-hidden rounded-[10px] border border-bordure-bouton bg-surface"
        >
          {entrees.map(([v, libelle]) => {
            // La crédence ne se déclare que sur une réponse DONNÉE : sans elle,
            // l'entrée se voit mais ne mène nulle part — et elle le dit à l'œil.
            // ⭐ 07/09 — au 4(b) la réponse est la ZONE, pas un texte : tant que
            //    la page est `designer`, rien n'a encore été désigné (l'étape
            //    passe à `credence` dès que la zone est posée).
            const inerte = v === 'credence'
              && (etape === 'designer' || (etape === 'ecrire' && !aDuTexte))
            return (
              <button
                key={v} type="button" onClick={() => { void basculer(v) }}
                aria-pressed={active === v} disabled={inerte}
                className={`min-h-12 flex-1 px-2 font-ui text-sm ${active === v
                  ? 'bg-bouton font-semibold text-bouton-texte'
                  : 'text-muet disabled:opacity-40'}`}
              >
                {libelle}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`lg:grid lg:items-stretch ${colonnesDuPlan(forme)}`}>
        <ColonneMatiere
          vue={vue} forme={forme} cache={volet !== 'lire'} moment={pages.moment}
          casAffiche={pages.casAffiche}
          /* ⭐ 07/09 — sur un cas SANS ÉCRITURE, poser la zone tourne la page :
             c'est le seul geste de réponse, il n'y a pas de bouton
             « Enregistrer » pour le faire. `ColonneMatiere` ne le transmet
             qu'aux cas muets — aux crans 7 et 9, l'élève a encore à écrire. */
          apresPose={() => tournerLaPage(true)}
        >
          {/* Après le surlignage, la suite reste accessible sous le texte :
              réponse écrite, ou crédence si le cas ne demande que de désigner.
              Tourner la page de travail ne suffit pas : sur téléphone, ce
              volet est encore caché tant que l'élève reste dans `Lire`. */}
          {forme === 'surligner' && (etape === 'ecrire' || etape === 'credence') && (
            <button
              type="button" onClick={() => setVolet('ecrire')}
              className="min-h-12 rounded-[10px] bg-bouton px-4 py-3.5 font-ui text-[15px]
                         font-semibold text-bouton-texte lg:hidden"
            >
              {etape === 'credence' ? 'Continuer vers la validation →' : 'Passer à ma réponse →'}
            </button>
          )}
        </ColonneMatiere>

        <ColonneTravail vue={vue} forme={forme} cache={volet !== 'ecrire'} {...pages} />
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
function ConsigneCollante({ vue, casAffiche }: { vue: VueDuDeroule; casAffiche: 1 | 2 | null }) {
  // ⭐ 04/09 — sur une paire, la consigne collée est celle du CAS MONTRÉ.
  const jetons = casAffiche !== null
    ? (vue.cas.find((c) => c.ordre === casAffiche)?.consigne ?? vue.consigne)
    : vue.consigne
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
          <TexteBalise jetons={jetons} />
        </span>
      </summary>
      <p className="px-4 pb-3 font-corps text-[15px] leading-relaxed text-encre">
        <TexteBalise jetons={jetons} />
      </p>
    </details>
  )
}

// ── La colonne de gauche : LA MATIÈRE ───────────────────────────────────────

function ColonneMatiere({
  vue, forme, cache, children, moment = null, casAffiche = null, apresPose,
}: {
  vue: VueDuDeroule; forme: FormeDuTravail; cache: boolean; children?: React.ReactNode
  moment?: MomentDeLaPaire | null; casAffiche?: 1 | 2 | null
  /** ⭐ 07/09 — la zone vient d'être posée sur un cas SANS ÉCRITURE. */
  apresPose?: () => void
}) {
  // ⭐⭐ 04/09 — UN CAS À LA FOIS : la colonne ne montre que le cas du moment.
  const casMontres = vue.cas.filter((c) => casAffiche === null || c.ordre === casAffiche)
  // ⭐ 04/09 — « aucun document » se lit sur le CAS montré : le second cas d'un 1(a) est un 1(b).
  const sansDocuments = casMontres.length > 0 && casMontres.every((c) => c.sansDocuments)
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
      {/* ⭐ C7-L5 — LA FICHE DE L'OBJET, en tête des documents. Ouverte d'elle-même
          en semaine de méthode (« la fiche présentée, puis les exercices », `10-`
          §7) ; repliable ensuite, sans compter comme une aide (`aide={null}`). */}
      {vue.fiche && (!vue.estUnePaire || moment === 'cas_1') && (
        <Depliable
          titre={`${vue.fiche.libelle} — ce que c’est`} depotId={vue.depotId} aide={null}
          ouvertParDefaut={vue.fiche.methode}
        >
          <FicheDeLObjet fiche={vue.fiche} />
        </Depliable>
      )}

      {/* ⭐ 04/09 — l'annonce des deux cas ne se dit qu'au PREMIER : au second,
          le titre du cas suffit, et l'écran ne répète pas ce qui est fait. */}
      {(!vue.estUnePaire || moment === 'cas_1') && (
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
      )}

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
      {sansDocuments && (
        <p className="font-corps text-[15px] leading-relaxed text-encre-douce">
          Aucun document pour cet exercice : les quatre devoirs d’élève sont dans l’exercice,
          à droite.
        </p>
      )}
      {vue.sujet && !sansDocuments && (
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

      {/* ⭐ 06/09 — AU CRAN 2, LES MORCEAUX DU DEVOIR NE SONT PAS ICI : le texte à
          trou vit sur la page « Écrire », et le trou est le champ (`TexteATrou`).
          Décision de Louis sur la maquette : « les pièces n'ont pas besoin
          d'apparaître dans la barre latérale ». */}

      {/* ── LE MATÉRIAU DU CAS MONTRÉ, ET CE QUE L'ÉCRAN Y MET EN ÉVIDENCE ── */}
      {/* ⭐ 06/09 — quand le texte à trou vient de la BANQUE (cran 2), il est le
          document : le devoir n'a rien à faire ici. Au cran 5 — une TRANSFORMATION —
          le devoir RESTE dans « Les documents », son passage en gras, et le texte à
          trou de la colonne de travail le redonne avec le champ à la place du gras
          (Louis, 06/09 : « un mix entre le cran 2 et les crans 3-4 »). */}
      {casMontres.map((c) => (
        (vue.estUnePaire || c.materiau?.length) && c.pieces?.origine !== 'pieces' ? (
          <Carte
            key={c.ordre}
            titre={vue.gabarit.actif
              ? (c.sansDocuments
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
                  /* ⛔ Aux crans 7 et 9 la page ne doit PAS tourner sur la seule
                     zone : l'élève doit encore dire ce qui cloche. */
                  apresPose={c.sansEcriture ? apresPose : undefined}
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
      {!vue.piloteArgument && vue.demonstration.demonstration && vue.demonstrationAvantLaTentative && (
        <Depliable titre="Un exemple, sur un autre sujet" depotId={vue.depotId} aide="demonstration">
          <ContenuDemonstration contenu={vue.contenuDemonstration} />
        </Depliable>
      )}
      {/* Le rappel des observables les plus faibles — EN LANGUE ÉLÈVE, jamais
          par leur code, et dosé par le palier (`06-` §2). */}
      {!vue.piloteArgument && vue.rappel.observables.length > 0 && (
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

      {/* ⭐ 05/09 — « Il faut voir où c'est le plus judicieux de mettre la correction
          du cas précédent » (Louis). Elle est une RÉFÉRENCE, pas une tâche : elle
          vit avec les documents du second cas, repliée, et plus en tête de la
          colonne de travail. */}
      {vue.estUnePaire && casAffiche === 2 && vue.corrections[0] && (
        <Depliable titre="La correction du premier cas" depotId={vue.depotId} aide={null}>
          <Correction correction={vue.corrections[0]} reponse={reponseDeLEleve(vue, 1)} />
        </Depliable>
      )}

      {vue.piloteArgument && <PreparationArgument offre={vue.piloteArgument} />}
      {children}
    </div>
  )
}

// ── La colonne de droite : LE TRAVAIL — UNE PAGE QUI TOURNE ─────────────────

/**
 * ⭐⭐ 04/09 (soir) — « UN ÉCRAN, UNE TÂCHE ». La colonne rend LA page de
 *    l'étape courante (`utils/deroule/etapes.ts`), et rien d'autre :
 *      · `ecrire`     — le champ et « Enregistrer » ;
 *      · `credence`   — « À quel point es-tu sûr ? », seule ;
 *      · un geste     — « Comment te sens-tu ? », les conditions, la thèse ;
 *      · `rendre`     — le bouton ;
 *      · `correction` — la correction du premier cas, et « Passer au second » ;
 *      · `repondre`   — les quatre lectures (crans 1 et 3) ;
 *      · `apres`      — la copie est rendue : l'attente, ce qui a été rendu.
 *
 * ⚠️ **LE CHAMP RESTE MONTÉ, CACHÉ, sur les pages qui suivent l'écriture** du
 *    même cas : son enregistrement automatique continue, son état ne se perd
 *    pas, et « Revenir à mon texte » le retrouve tel quel. Il n'est démonté
 *    qu'au changement de cas (`key`) ou après la remise.
 */
function ColonneTravail({
  vue, forme, cache, enregistrer, remettre, surEtatDuChamp, champ, casAffiche, texteSauve,
  passerAuSecond, etape, rang, credenceASaisir, tournerLaPage, textePourRelecture,
}: {
  vue: VueDuDeroule
  forme: FormeDuTravail
  cache: boolean
} & PagesDuTravail) {
  const [texteRelu, setTexteRelu] = useState<string | null>(null)
  const enRedactionV1 = vue.tempsCourant === 'ecrire' || vue.tempsCourant === 'preparer'
  const casMontres = vue.cas.filter((c) => casAffiche === null || c.ordre === casAffiche)
  const casCourant = casMontres[0] ?? null
  const cadre = `flex flex-col gap-3 p-4 sm:p-5 ${cache ? 'hidden lg:flex' : ''}`

  // ── ⭐⭐ 04/09 — LE MOMENT DE LA CORRECTION DU PREMIER CAS, SEUL À L'ÉCRAN.
  //    « La correction du premier cas est servie AVANT le second » (`02-`
  //    §2.3.1 a) : elle a son écran, et le second cas s'ouvre d'un geste.
  if (etape === 'correction') {
    const c1 = vue.corrections[0] ?? null
    return (
      <div className={cadre}>
        <EnTeteDePage titre={titreDeLEtape(etape, forme)} rang={rang} />
        <div key="correction" className="page-tourne flex flex-col gap-4">
          {/* ⭐ 05/09 — « l'élève voit sa réponse, pourquoi c'est bon ou pas, et la
              bonne réponse expliquée » (Louis) : la correction PART de ce qu'il a
              choisi ou écrit. Sur une rédaction, c'est une comparaison — le
              jugement du texte appartient à la chaîne, à la remise. */}
          {c1 ? <Correction correction={c1} reponse={reponseDeLEleve(vue, 1)} /> : (
            <p className="font-corps text-[15px] italic text-muet">
              Rien à corriger sur ce cas : passe au second.
            </p>
          )}
          <JetonsPoses vue={vue} ordre={1} />
          <button
            type="button" onClick={passerAuSecond}
            className="min-h-12 self-start rounded-[10px] bg-bouton px-6 py-3.5 font-ui text-[15px]
                       font-semibold text-bouton-texte"
          >
            Passer au second cas →
          </button>
        </div>
      </div>
    )
  }

  // ── APRÈS LA REMISE : l'attente, puis ce qui a été rendu, en lecture seule ──
  if (etape === 'apres') {
    return (
      <div className={cadre}>
        <EnTeteDePage titre={titreDeLEtape(etape, forme)} rang={null} />
        <Attente vue={vue} />

        {/* ⭐ 04/09 — FINI SANS RETOUR : l'écran le dit, au lieu d'un fil à « Retour »
            au-dessus de rien. Ni chiffre ni emplacement du passage (`02-` §5). */}
        {vue.fin === 'hors_cible' && (
          <Encart ton="attention">
            <p className="text-sm text-encre">
              {/* ⛔ 07/09, vu au smoke — cet encart disait « le passage que tu avais
                  surligné n’est pas celui qui posait problème », et la précision du
                  verdict, trois lignes plus bas, disait LA MÊME PHRASE. Le verdict
                  est désormais servi au bon endroit — sous la réponse de l’élève —,
                  donc l’encart n’a plus qu’à dire que c’est fini, et pourquoi il n’y
                  a pas de retour. */}
              <strong>Cet exercice est terminé.</strong> Il n’y a pas de retour à attendre :
              la correction est ci-dessous. La prochaine fois, relis le document avant de
              choisir où pointer.
            </p>
          </Encart>
        )}
        {/* ⭐ 07/09 — LA CLÔTURE ALGORITHMIQUE D'UN 4(b)/4(b). ⛔ On ne dit RIEN
            de la justesse : le verdict de zone vit au registre, et l'écran qui
            annoncerait « tu t'es trompé » sur un `clos` mentait à un élève sur
            deux (c'est ce que faisait `hors_cible`, faute d'un discriminant). */}
        {vue.fin === 'sans_remise' && (
          <Encart>
            <p className="text-sm text-encre">
              {/* ⛔ 08/09 — disait « tu as surligné, c’était tout ce qui était
                  demandé » JUSTE AU-DESSUS de « ce n’est pas répondre ». L’encart
                  dit la FIN de l’exercice ; le verdict, lui, est plus bas et
                  n’a pas à être contredit trois lignes plus haut. */}
              <strong>Cet exercice est terminé.</strong> Il n’y a rien à rendre et pas de
              retour à attendre : la correction est ci-dessous.
            </p>
          </Encart>
        )}
        {vue.fin === 'non_fait' && (
          <Encart ton="attention">
            <p className="text-sm text-encre">
              <strong>Cet exercice ne compte pas.</strong> Surligner presque tout le texte, ce n’est
              pas répondre — ton professeur est prévenu, et il n’y a pas de retour à attendre.
            </p>
          </Encart>
        )}

        {/* ⭐⭐ LA CORRECTION — servie APRÈS la crédence DE CE CAS ; sur une paire,
            celle du second n'apparaît qu'une fois la copie rendue. */}
        {vue.estUnePaire ? (
          <>
            {vue.corrections[1] && (
              <Correction correction={vue.corrections[1]} reponse={reponseDeLEleve(vue, 2)}
                verdict={vue.verdictParCas[1] ?? null}
                  precision={vue.precisionParCas[1] ?? null}
                  passage={vue.passageParCas[1] ?? null} />
            )}
            {vue.corrections[0] && (
              <Depliable titre="La correction du premier cas" depotId={vue.depotId} aide={null}>
                <Correction correction={vue.corrections[0]} reponse={reponseDeLEleve(vue, 1)}
                  verdict={vue.verdictParCas[0] ?? null}
                  precision={vue.precisionParCas[0] ?? null}
                  passage={vue.passageParCas[0] ?? null} />
              </Depliable>
            )}
          </>
        ) : vue.corrections.map((correction, i) => (
          correction
            ? <Correction key={i} correction={correction} reponse={reponseDeLEleve(vue, i === 0 ? 1 : 2)}
                verdict={vue.verdictParCas[i] ?? null}
                precision={vue.precisionParCas[i] ?? null}
                passage={vue.passageParCas[i] ?? null} />
            : null
        ))}

        {/* ⭐ CE QUI A ÉTÉ RENDU, EN LECTURE SEULE — « jamais un écran muet »
            (`01-` §12). ⭐ 04/09 — sur une paire, LES DEUX réponses.
            ⭐ 05/09 — PAS PENDANT L'ATTENTE : « sur cet écran d'attente, on voit
            déjà la réponse » (Louis) — l'encart suffit ; la copie revient quand
            il n'y a plus rien à attendre, et seulement si aucune correction ne
            la montre déjà (« Ta réponse »). */}
        {forme !== 'choisir' && !vue.attente.enCours && !vue.corrections.some((c) => c !== null)
          && (vue.texteV1 ?? '').trim() !== '' && (
          (vue.estUnePaire
            ? [{ libelle: 'Premier cas', texte: vue.texteV1 ?? '' },
              { libelle: 'Second cas', texte: vue.texteVf ?? '' }].filter((c) => c.texte.trim() !== '')
            : [{ libelle: 'Ta v1', texte: vue.texteV1 ?? '' }]
          ).map((c) => (
            <div key={c.libelle}>
              <p className="mb-2 font-ui text-xs text-muet">{c.libelle} · lecture seule</p>
              <TexteBrut
                texte={c.texte}
                className="rounded-xl border border-bordure bg-surface-retrait p-4 font-corps
                           text-[16.5px] leading-[1.7] text-encre-douce"
              />
            </div>
          ))
        )}
        <Etalon vue={vue} />
      </div>
    )
  }

  // ── LES QUATRE LECTURES (crans 1 et 3) : la crédence EST la réponse ────────
  if (etape === 'repondre') {
    return (
      <div className={cadre}>
        <EnTeteDePage
          titre={titreDeLEtape(etape, forme)} rang={rang}
          appoint="tu peux tout mettre sur une seule, ou étaler"
        />
        {/* ⭐ La crédence REMPLACE le champ (handoff §4, écran 2b) : elle est la
            réponse, et elle prend la colonne.
            ⚠️ Aux crans guidés `v1_remis_at` n'est JAMAIS posé — la crédence EST
            la réponse —, donc `enRedactionV1` y reste vrai et rien ne disparaît. */}
        {credenceASaisir && casCourant?.credence && (
          <div key={casCourant.ordre} className="page-tourne">
            <CredenceSaisie
              depotId={vue.depotId} cas={casCourant.ordre} offre={casCourant.credence} nu />
          </div>
        )}
        {enRedactionV1 && vue.microQuestionDue && !vue.motifDepassement && (
          <MicroQuestion depotId={vue.depotId} />
        )}
        <Etalon vue={vue} />
      </div>
    )
  }

  // ── LES PAGES DE LA RÉDACTION : écrire → crédence → gestes → rendre ────────
  const versionDuChamp = casAffiche === 2 ? 'vf' : 'v1'
  const cleDuCas = casAffiche ?? 'seul'
  // ⛔⛔ SUR UN CAS SANS ÉCRITURE, LE CHAMP N'EST PAS « CACHÉ » : IL N'EXISTE PAS.
  //    Le monter caché suffirait à le faire revivre au premier `hidden` oublié,
  //    et surtout `ChampDeRedaction` porte des gardes qui EXIGENT un texte
  //    (bouton désactivé, enregistrement refusé) — c'est par elles que l'élève
  //    se trouvait obligé d'écrire « il ne devrait rien y avoir ici ».
  const champDu = !casCourant?.sansEcriture
  const surLaPageDuChamp = champDu && etape === 'ecrire'
  /** Le texte se modifie encore tant que la crédence n'est pas donnée (ou qu'aucune n'est demandée). */
  const modifiable = !casCourant?.credenceDonnee
  // ⛔⛔ 07/09 — NE PROMETS PAS UNE REMISE QUI N'EXISTE PAS. Sur une paire
  //    4(b)/4(b) il n'y a AUCUN bouton « Rendre » : l'exercice se clôt à la
  //    dernière crédence. La phrase disait « puis tu pourras rendre » sur les
  //    18 dépôts que ce lot vient précisément de rendre inrendables.
  const phraseDeSuite = vue.piloteArgument
    ? (vue.piloteArgument.cran === 6 ? 'Ensuite : relis ton argument, puis rends-le.' : 'Ensuite : tu pourras rendre ton argument.')
    : credenceASaisir
    ? (vue.estUnePaire && casAffiche === 1
      ? 'Ensuite : ta crédence, puis la correction de ce premier cas.'
      : vue.aucuneRemise
        ? 'Ensuite : ta crédence, et ce sera terminé.'
        : 'Ensuite : ta crédence, puis tu pourras rendre.')
    : vue.estUnePaire && casAffiche === 1
      ? 'Ensuite : la correction de ce premier cas.'
      : 'Ensuite : quelques questions rapides, puis tu pourras rendre.'

  return (
    <div className={cadre}>
      <EnTeteDePage titre={titreDeLEtape(etape, forme)} rang={rang} />

      {/* ── PAGE « SURLIGNER » (4(b)) — le travail est dans le devoir, à gauche ── */}
      {etape === 'designer' && (
        <div className="page-tourne flex flex-col gap-3">
          <p className="font-corps text-base leading-relaxed text-encre-douce">
            Surligne le passage dans le devoir, puis touche « Garde ce passage ».
            Il n’y a rien à écrire ici.
          </p>
          <p className="font-ui text-sm text-muet">{phraseDeSuite}</p>
        </div>
      )}

      {/* ── PAGE « ÉCRIRE » — le champ reste monté (caché) sur les pages suivantes ── */}
      {champDu && (
      <div className={surLaPageDuChamp ? 'page-tourne flex flex-col gap-3' : 'hidden'}>
        {/* ⭐ Sur un exercice à surligner, le passage désigné est RAPPELÉ en haut
            de la vue `Écrire` (handoff §4) : l'élève écrit ce qu'il en dit sans
            rebasculer pour se relire. */}
        {forme === 'surligner' && <RappelDuPassage vue={vue} casAffiche={casAffiche} />}

        {/* La micro-question de dépassement. ⚠️ JAMAIS notée, jamais renvoyée
            comme jugement, et `motif_depassement` reste NULL si on n'y répond
            pas (`02-` §2.4 ; `07-` §1.1). Elle se pose PENDANT l'écriture, et
            nulle part ailleurs : c'est la seule chose qui s'ajoute à cette page. */}
        {vue.microQuestionDue && !vue.motifDepassement && <MicroQuestion depotId={vue.depotId} />}

        {/* ⭐ 06/09 — LE CRAN 2 EST UN TEXTE À TROU : la demande du geste en une
            ligne, puis le devoir dans le fil, et le trou est le champ lui-même
            (`forme="trou"`, enveloppé par `TexteATrou`). Ailleurs, la page d'hier. */}
        {casCourant?.pieces?.demande && (
          <p className="font-corps text-[15.5px] leading-snug text-encre-douce">{casCourant.pieces.demande}</p>
        )}
        {/* ⭐ 06/09 — LE PLAN : le trou est un ORDRE. Les thèses à déplacer, le mot
            qui lie devant chacune ; la production est le plan assemblé. */}
        {casCourant?.pieces?.forme === 'ordre' ? (
          <PlanAOrdonner
            key={`plan-${cleDuCas}`}
            ref={champ}
            depotId={vue.depotId}
            theses={casCourant.pieces.pieces}
            valeurInitiale={(versionDuChamp === 'vf' ? vue.texteVf : vue.texteV1) ?? ''}
            telemetrieInitiale={(versionDuChamp === 'vf' ? vue.telemetrie.vf : vue.telemetrie.v1) ?? null}
            lectureSeule={!modifiable}
            onEnregistrer={enregistrer}
            onEtat={surEtatDuChamp}
            apresEnregistrement={() => tournerLaPage(true)}
            suite={phraseDeSuite}
          />
        ) : (
        <ChampDeRedaction
          /* ⭐ 04/09 — sur une paire, le champ CHANGE avec le cas : `key` le remonte. */
          key={cleDuCas}
          ref={champ}
          depotId={vue.depotId}
          valeurInitiale={(versionDuChamp === 'vf' ? vue.texteVf : vue.texteV1) ?? ''}
          telemetrieInitiale={(versionDuChamp === 'vf' ? vue.telemetrie.vf : vue.telemetrie.v1) ?? null}
          lectureSeule={!modifiable}
          rows={forme === 'surligner' ? 9 : 14}
          onEnregistrer={enregistrer}
          onEtat={surEtatDuChamp}
          apresEnregistrement={() => tournerLaPage(true)}
          suite={phraseDeSuite}
          forme={casCourant?.pieces ? 'trou' : 'page'}
          enveloppe={casCourant?.pieces
            ? (champ) => <TexteATrou pieces={casCourant.pieces!}>{champ}</TexteATrou>
            : undefined}
        />
        )}
      </div>
      )}

      {/* ── PAGE « CRÉDENCE » — seule, avec son bouton « Enregistrer » ─────── */}
      {etape === 'credence' && casCourant?.credence && (
        <div key={`credence-${casCourant.ordre}`} className="page-tourne flex flex-col gap-3">
          {/* Sur une paire, la crédence porte sur le texte ENREGISTRÉ : sans
              enregistrement, l'étape serveur ne peut pas avancer. Le bouton
              « Enregistrer » du champ y a veillé ; on le redit ici sans le cacher. */}
          {vue.estUnePaire && !casCourant.sansEcriture && !texteSauve[casCourant.ordre] ? (
            <Encart ton="attention">
              <p className="text-sm text-encre">
                Ta réponse n’est pas encore enregistrée : reviens à ton texte et enregistre-le.
              </p>
            </Encart>
          ) : (
            <CredenceSaisie
              depotId={vue.depotId} cas={casCourant.ordre} offre={casCourant.credence} nu />
          )}
          <RetourAuTexte onClick={() => tournerLaPage(false)} />
        </div>
      )}

      {/* ── LES TROIS GESTES, UN PAR PAGE (`06-` §3 : avant tout envoi à l'IA) ── */}
      {(etape === 'confiance' || etape === 'conditions' || etape === 'restitution') && (
        <div key={etape} className="page-tourne flex flex-col gap-3">
          <GestesDeLaRemise vue={vue} />
          {modifiable && <RetourAuTexte onClick={() => tournerLaPage(false)} libelle="Modifier mon texte" />}
        </div>
      )}

      {/* ── PAGE « RENDRE » — le bouton, et rien d'autre à faire ───────────── */}
      {etape === 'rendre' && vue.piloteArgument?.cran === 6 && texteRelu !== textePourRelecture() ? (
        <RelectureArgument depotId={vue.depotId} offre={vue.piloteArgument}
          texte={textePourRelecture()} initiale={vue.piloteArgument.trace} apres={() => setTexteRelu(textePourRelecture())} />
      ) : etape === 'rendre' && (
        <PageDeRemise
          key="rendre"
          libelle={vue.estUnePaire ? 'Rendre mes deux réponses'
            : forme === 'surligner' ? 'Rendre ma réponse' : 'Rendre ma v1'}
          phrase={vue.gestesRestants.length === 0 && vue.competencesDeLaConfiance.length + 2 > 0
            ? 'Les gestes sont faits. Il ne reste qu’à rendre : ta copie partira à la lecture, et ton retour se préparera.'
            : 'Il ne reste qu’à rendre : ta copie partira à la lecture, et ton retour se préparera.'}
          textes={vue.estUnePaire
            ? [{ libelle: 'Premier cas', texte: vue.texteV1 ?? '' },
              { libelle: 'Second cas', texte: vue.texteVf ?? '' }]
            : [{ libelle: 'Ta réponse', texte: vue.texteV1 ?? '' }]}
          depotId={vue.depotId}
          remettre={remettre}
          modifier={modifiable ? () => tournerLaPage(false) : null}
          pied={vue.regime === 'plein' ? 'Tu pourras la reprendre après le retour.' : null}
        />
      )}
    </div>
  )
}

/** Le sur-titre de la page, et son rang dans la suite — « 3 / 7 ». */
function EnTeteDePage(
  { titre, rang, appoint }:
  { titre: string; rang: { rang: number; total: number } | null; appoint?: string },
) {
  return (
    <div className="flex items-baseline gap-3">
      <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet">
        {titre}
      </h2>
      {appoint && (
        <span className="min-w-0 truncate font-corps text-[13px] italic text-muet">{appoint}</span>
      )}
      {/* ⚠️ À partir de `lg` seulement : sous `lg`, c'est la barre de contenu qui
          porte ce rang (`BarreDeContenu`), et un écran n'a qu'un compteur. */}
      {rang && rang.total > 1 && (
        <span className="ml-auto hidden shrink-0 rounded-full bg-pigment-teinte px-2.5 py-1 font-ui
                         text-[11.5px] font-semibold tabular-nums text-pigment lg:inline">
          {rang.rang} / {rang.total}
        </span>
      )}
    </div>
  )
}

/** « ← Revenir à mon texte » — le seul chemin arrière, tant que le texte se modifie encore. */
function RetourAuTexte({ onClick, libelle = 'Revenir à mon texte' }: { onClick: () => void; libelle?: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className="min-h-11 self-start font-ui text-[13px] text-pigment/80 hover:text-pigment"
    >
      ← {libelle}
    </button>
  )
}

/**
 * ⭐ LA PAGE DE LA REMISE — « Rendre : le bouton, et rien d'autre à faire ».
 *    Ce qui va partir se relit, replié ; le bouton est seul en pleine largeur.
 * ⚠️ Le texte part de l'état du champ (`remettre` le tient), pas de ce que cette
 *    page affiche : elle ne fait que montrer.
 */
function PageDeRemise({
  libelle, phrase, textes, depotId, remettre, modifier, pied,
}: {
  libelle: string
  phrase: string
  textes: Array<{ libelle: string; texte: string }>
  depotId: string
  remettre: () => Promise<void>
  modifier: (() => void) | null
  pied: string | null
}) {
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const pleins = textes.filter((t) => t.texte.trim() !== '')

  async function rendre() {
    if (enCours) return
    setEnCours(true)
    setMessage(null)
    try {
      await remettre()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'La remise a échoué.')
      setEnCours(false)
    }
  }

  return (
    <div className="page-tourne flex flex-col gap-4">
      <p className="font-titre text-[22px] font-semibold leading-tight text-encre">Tout est prêt.</p>
      <p className="font-corps text-[16px] leading-relaxed text-encre-douce">{phrase}</p>
      {pleins.length > 0 && (
        <Depliable
          titre={pleins.length > 1 ? 'Relire mes réponses' : 'Relire ma réponse'}
          depotId={depotId} aide={null}
        >
          <div className="flex flex-col gap-3">
            {pleins.map((t) => (
              <div key={t.libelle}>
                {pleins.length > 1 && (
                  <p className="mb-1.5 font-marque text-[11px] font-semibold uppercase
                                tracking-[0.11em] text-muet">
                    {t.libelle}
                  </p>
                )}
                <TexteBrut
                  texte={t.texte}
                  className="font-corps text-[15.5px] leading-[1.65] text-encre"
                />
              </div>
            ))}
          </div>
        </Depliable>
      )}
      <button
        type="button" onClick={() => { void rendre() }} disabled={enCours || pleins.length === 0}
        className="min-h-12 w-full rounded-[10px] bg-bouton px-6 py-4 font-ui text-[15px]
                   font-semibold text-bouton-texte disabled:opacity-40 sm:w-auto sm:self-start
                   sm:py-3.5"
      >
        {enCours ? 'Envoi…' : libelle}
      </button>
      {pied && <p className="font-corps text-[13.5px] italic text-muet">{pied}</p>}
      {modifier && <RetourAuTexte onClick={modifier} libelle="Modifier mon texte" />}
      {message && <p className="text-sm text-retard">{message}</p>}
    </div>
  )
}

/**
 * ⭐ C7-L5 — LA FICHE DE L'OBJET : ce que c'est, les constituants et leurs
 *    questions, ce que la fiche dit à l'élève, l'exemplaire, le contre-exemple.
 *    Tout vient du `09-` dérivé ; rien n'est réécrit ici.
 */
/**
 * Le gras et l'italique du `09-`, RENDUS — sans `dangerouslySetInnerHTML` : des
 * segments, comme `TexteBalise`. Seuls `**gras**` et `*italique*` sont lus.
 */
function RenduLeger({ texte }: { texte: string }) {
  const morceaux = texte.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*)/g).filter((m) => m !== '')
  return (
    <>
      {morceaux.map((m, i) => m.startsWith('**') && m.endsWith('**') && m.length > 4
        ? <strong key={i}>{m.slice(2, -2)}</strong>
        : m.startsWith('*') && m.endsWith('*') && m.length > 2
          ? <em key={i}>{m.slice(1, -1)}</em>
          : <span key={i}>{m}</span>)}
    </>
  )
}

function FicheDeLObjet({ fiche }: { fiche: NonNullable<VueDuDeroule['fiche']> }) {
  return (
    <div className="flex flex-col gap-3 font-corps text-[15.5px] leading-[1.55] text-encre">
      {fiche.definition && <p><RenduLeger texte={fiche.definition} /></p>}
      {fiche.constituants.length > 0 && (
        <div>
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-muet">
            Ce qui le compose, dans l’ordre
          </p>
          <ol className="mt-1.5 flex list-decimal flex-col gap-1.5 pl-5">
            {fiche.constituants.map((c) => (
              <li key={c.n}>
                <strong>{c.nom}</strong>{c.facultatif ? ' (facultatif)' : ''}
                {c.question && <span className="text-encre-douce"> — <RenduLeger texte={c.question} /></span>}
              </li>
            ))}
          </ol>
        </div>
      )}
      {fiche.ditALEleve && (
        <p className="rounded-[9px] border border-pigment/30 bg-pigment-teinte px-3.5 py-2.5 font-semibold">
          <RenduLeger texte={fiche.ditALEleve} />
        </p>
      )}
      {fiche.test && (
        <div>
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-muet">Le test</p>
          <p className="mt-1"><RenduLeger texte={fiche.test} /></p>
        </div>
      )}
      {fiche.exemplaire && (
        <div>
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-muet">Un exemplaire</p>
          <p className="mt-1 rounded-[9px] border border-bordure-bouton bg-parchemin-fonce p-3"><RenduLeger texte={fiche.exemplaire} /></p>
        </div>
      )}
      {fiche.contreExemple && (
        <div>
          <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-muet">Un contre-exemple</p>
          <p className="mt-1 rounded-[9px] border border-bordure-bouton bg-parchemin-fonce p-3"><RenduLeger texte={fiche.contreExemple} /></p>
        </div>
      )}
    </div>
  )
}

/** Le rappel du passage désigné, en tête de la vue `Écrire` du téléphone. */
function RappelDuPassage({ vue, casAffiche }: { vue: VueDuDeroule; casAffiche: 1 | 2 | null }) {
  const cas = vue.cas.find((c) => c.designationDemandee && c.zoneDonnee
    && (casAffiche === null || c.ordre === casAffiche))
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
 *
 * ⭐⭐ 04/09 (soir) — « CHAQUE POINT DOIT AVOIR SON ÉCRAN » (Louis). La colonne
 *    de droite tourne les pages du retour : un point par page, puis « pour
 *    finir » — la prochaine fois, la langue, la validation de lecture, et, au
 *    régime plein, ce qu'il y a à reprendre. La version finale a ses deux pages
 *    à elle : écrire, rendre.
 */
function RetourDUnTexte({
  vue, renvoi, setRenvoi, reprise, setReprise, enregistrer, remettre, surEtatDuChamp,
  redactionFinie, tournerLaPage,
}: {
  vue: VueDuDeroule
  renvoi: string | null
  setRenvoi: (c: string | null) => void
  reprise: boolean
  setReprise: (v: boolean) => void
  enregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  remettre: () => Promise<void>
  surEtatDuChamp: (texte: string, t: TelemetrieSaisie) => void
  redactionFinie: boolean
  tournerLaPage: (finie: boolean) => void
}) {
  const [ongletMobile, setOngletMobile] = useState<'texte' | 'retour'>('retour')
  const enRevision = vue.tempsCourant === 'reviser'
  // ⚠️ Le retour qui se lit est LE PLUS RÉCENT ; l'autre, s'il existe, se replie
  //    sur la dernière page — deux retours empilés feraient deux fois la pile.
  const attendFinal = vue.piloteArgument?.vfRemise && !vue.retourFinal
  const recent = attendFinal ? null : vue.retourFinal ?? vue.retourChaud
  const ancien = vue.retourFinal ? vue.retourChaud : null
  const nbPoints = recent?.points.length ?? 0
  const enVersionFinale = reprise && enRevision

  /**
   * ⚠️⚠️ **SUR UNE PAIRE, `texteVf` N'EST PAS UNE VERSION FINALE** : c'est la
   *    réponse au SECOND cas. `etapeDeLaPaire` lit `[texte_v1, texte_vf]` comme
   *    « les réponses aux deux cas » (`utils/deroule/regime.ts`). Ne montrer que
   *    `texteV1` cacherait donc le cas du transfert — celui qui porte toute la
   *    raison d'être de la paire.
   */
  // ⭐⭐ 07/09 (soir) — LE VERDICT SUIT LA COPIE JUSQUE DANS LE RETOUR.
  //    Il ne vivait que dans `ColonneTravail` (étape `apres`), et `ecranDuDeroule`
  //    bascule ici DÈS QU'UN RETOUR EXISTE : mesuré en prod, 22 à 48 secondes
  //    après l'écriture du verdict. Aux crans par paires la bascule est
  //    TERMINALE — l'élève ne serait jamais revenu le lire. **Le lot ne servait
  //    que la fenêtre d'attente.** Trouvé par la passe adversariale.
  // ⛔ Le verdict est attaché AVANT le `filter` : filtrer d'abord décalerait les
  //    index et collerait le verdict du cas 1 sous la réponse du cas 2.
  const copies = vue.estUnePaire
    ? [{ libelle: 'Premier cas', texte: vue.texteV1 ?? '', ordre: 0 },
      { libelle: 'Un cas neuf, de la même famille', texte: vue.texteVf ?? '', ordre: 1 }]
      .filter((c) => c.texte.trim() !== '')
    : [{ libelle: null, ordre: 0,
      texte: (vue.tempsCourant === 'retour_final' ? vue.texteVf ?? vue.texteV1 : vue.texteV1) ?? '' }]

  const suiteVf = etapesServies({
    estUnePaire: false, credenceEstLaReponse: false, credenceDemandee: false, gestes: [],
    versionFinale: true,
  })
  const etapeVf: 'ecrire' | 'rendre' = redactionFinie ? 'rendre' : 'ecrire'

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

      {/* Bascule du téléphone — « Mon texte » / « Le retour · 3 » (ou « Ma version finale »). */}
      <div className="px-4 pt-3.5 lg:hidden">
        <div
          role="group" aria-label="Mon texte ou le retour"
          className="flex overflow-hidden rounded-[10px] border border-bordure-bouton bg-surface"
        >
          {([['texte', 'Mon texte'],
            ['retour', enVersionFinale ? 'Ma version finale'
              : nbPoints > 0 ? `Le retour · ${nbPoints}` : 'Le retour']] as const)
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
              {/* ⭐ Le verdict, au-dessus de la copie qu'il juge — mêmes jetons
                  que partout ailleurs dans le déroulé. */}
              {vue.verdictParCas[c.ordre] !== null && vue.verdictParCas[c.ordre] !== undefined && (
                <p className={`mb-1.5 font-corps text-[15.5px] font-semibold
                  ${vue.verdictParCas[c.ordre] ? 'text-ok' : 'text-attention'}`}>
                  {vue.verdictParCas[c.ordre] ? 'Ta réponse est juste.' : 'Ta réponse n’est pas la bonne.'}
                  {vue.verdictParCas[c.ordre] === false && vue.precisionParCas[c.ordre]
                    ? ` ${vue.precisionParCas[c.ordre]}` : ''}
                </p>
              )}
              <MateriauMarque
                segments={segmentsDuRenvoi(c.texte, renvoi)}
                className="rounded-xl border border-bordure bg-surface-retrait p-4 font-corps
                           text-[16.5px] leading-[1.7] text-encre-douce"
              />
            </div>
          ))}
        </div>

        {/* ── LE RETOUR, PAGE PAR PAGE — OU LA VERSION FINALE EN COURS ──── */}
        <div className={`flex flex-col gap-4 p-4 sm:p-5
                         ${ongletMobile === 'retour' ? '' : 'hidden lg:flex'}`}>
          {enVersionFinale ? (
            <>
              <EnTeteDePage titre="Ta version finale" rang={rangDeLEtape(suiteVf, etapeVf, null)} />
              <div className={etapeVf === 'ecrire' ? 'page-tourne flex flex-col gap-3' : 'hidden'}>
                {vue.piloteArgument?.aideRevision.map((aide, i) => <p key={i} className="rounded-xl border border-bordure bg-surface p-4 font-corps text-base text-encre">{aide}</p>)}
                {vue.retourChaud?.actionRevision && (
                  <EncartDeRevision vue={vue}>{vue.retourChaud.actionRevision}</EncartDeRevision>
                )}
                {vue.cas[0]?.pieces?.forme === 'ordre' ? (
                  <PlanAOrdonner
                    depotId={vue.depotId}
                    theses={vue.cas[0].pieces.pieces}
                    valeurInitiale={vue.texteVf ?? vue.texteV1 ?? ''}
                    telemetrieInitiale={vue.telemetrie.vf ?? null}
                    lectureSeule={false}
                    onEnregistrer={enregistrer}
                    onEtat={surEtatDuChamp}
                    apresEnregistrement={() => tournerLaPage(true)}
                    suite="Ensuite : rendre ta version finale."
                  />
                ) : (
                <ChampDeRedaction
                  depotId={vue.depotId}
                  valeurInitiale={vue.texteVf ?? vue.texteV1 ?? ''}
                  telemetrieInitiale={vue.telemetrie.vf ?? null}
                  lectureSeule={false}
                  rows={14}
                  onEnregistrer={enregistrer}
                  onEtat={surEtatDuChamp}
                  apresEnregistrement={() => tournerLaPage(true)}
                  suite="Ensuite : rendre ta version finale."
                  /* ⭐ 06/09 — au cran 2, la version finale se récrit DANS LE TROU,
                     le devoir autour : le même texte à trou qu'à la v1. */
                  forme={vue.cas[0]?.pieces ? 'trou' : 'page'}
                  enveloppe={vue.cas[0]?.pieces
                    ? (champ) => <TexteATrou pieces={vue.cas[0]!.pieces!}>{champ}</TexteATrou>
                    : undefined}
                />
                )}
              </div>
              {etapeVf === 'rendre' && (
                <PageDeRemise
                  key="rendre-vf"
                  libelle="Rendre ma version finale"
                  phrase="Il ne reste qu’à rendre : ta version finale partira à la lecture, et ton retour final se préparera."
                  textes={[{ libelle: 'Ta version finale', texte: vue.texteVf ?? vue.texteV1 ?? '' }]}
                  depotId={vue.depotId}
                  remettre={remettre}
                  modifier={() => tournerLaPage(false)}
                  pied={null}
                />
              )}
            </>
          ) : attendFinal ? <Attente vue={vue} /> : recent ? (
            <RetourSegmente
              key={recent.moment}
              depotId={vue.depotId} retour={recent} vue={vue} nu parPages
              titre={recent.moment === 'final' ? 'Ce qui a bougé' : 'Ton retour'}
              onRenvoi={setRenvoi}
              renvoiActif={renvoi}
              /* ⭐ Au régime plein, ce qu'il y a à reprendre vient SUR LA DERNIÈRE
                 PAGE, une fois la lecture validée : une seule chose à faire. */
              apresLecture={!reprise && enRevision ? (
                vue.retourChaud?.actionRevision ? (
                  <EncartDeRevision vue={vue} action={() => setReprise(true)}>
                    {vue.retourChaud.actionRevision}
                  </EncartDeRevision>
                ) : (
                  <button
                    type="button" onClick={() => setReprise(true)}
                    className="min-h-12 self-start rounded-[10px] bg-bouton px-6 py-3.5 font-ui
                               text-[15px] font-semibold text-bouton-texte"
                  >
                    Reprendre mon texte
                  </button>
                )
              ) : null}
              ancien={ancien ? (
                <Depliable titre="Ton premier retour" depotId={vue.depotId} aide={null}>
                  <RetourSegmente
                    depotId={vue.depotId} retour={ancien} vue={vue} nu titre="Ton premier retour" />
                </Depliable>
              ) : null}
            />
          ) : null}
        </div>
      </div>

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
  const ordreDuDernier: 1 | 2 = dernier?.ordre === 2 ? 2 : 1

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
      {/* ── LA CORRECTION — la MÊME présentation qu'à la correction du premier cas
          (Louis, 05/09 : « ça devrait être la même chose aux deux cas, et le
          retour du premier cas est mieux ») : ta réponse, bonne ou pas, pourquoi ;
          la bonne réponse expliquée ; tes jetons repliés dessous. ──────────── */}
      <div className="order-2 flex flex-col gap-3 p-4 sm:p-5 lg:order-1">
        <h2 className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet">
          {vue.estUnePaire ? 'Ton retour — second cas' : 'Ton retour'}
        </h2>
        {vue.estUnePaire ? (
          <>
            {vue.corrections[1] && (
              <Correction correction={vue.corrections[1]} reponse={reponseDeLEleve(vue, 2)} />
            )}
            <JetonsPoses vue={vue} ordre={2} />
            {vue.corrections[0] && (
              <Depliable titre="La correction du premier cas" depotId={vue.depotId} aide={null}>
                <Correction correction={vue.corrections[0]} reponse={reponseDeLEleve(vue, 1)} />
              </Depliable>
            )}
          </>
        ) : (
          <>
            {vue.corrections.map((correction, i) => (
              correction
                ? <Correction key={i} correction={correction} reponse={reponseDeLEleve(vue, i === 0 ? 1 : 2)} />
                : null
            ))}
            <JetonsPoses vue={vue} ordre={ordreDuDernier} />
          </>
        )}

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

      {/* ── LA CONSIGNE ET LE PASSAGE, en référence ──────────────────────── */}
      <div className="order-1 flex flex-col gap-3 border-bordure bg-fond-module p-4 sm:p-5
                      lg:order-2 lg:border-l">
        <Carte titre={vue.estUnePaire ? 'La consigne du second cas' : 'La consigne'}>
          <p className="font-corps text-base leading-[1.5] text-encre">
            {/* ⭐ 04/09 — sur une paire, la consigne montrée est celle du DERNIER cas. */}
            <TexteBalise jetons={vue.estUnePaire && dernier ? dernier.consigne : vue.consigne} />
          </p>
        </Carte>

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
 * ⭐ 05/09 — « Tes jetons, réponse par réponse » : les quatre lectures DANS
 *    L'ORDRE SERVI, chacune avec ses jetons DESSOUS — « les pourcentages à
 *    droite des textes… on perd trop d'espace » (Louis). La bonne lecture est
 *    marquée après coup par une barre `ok` ; repliée, parce que la correction
 *    dit déjà l'essentiel.
 * ⛔ Tout vient de l'ENTRÉE DÉJÀ ÉCRITE (`lireLaRepartition`) : `indexAttendue`
 *    ne traverse jamais l'écran de saisie.
 */
function JetonsPoses({ vue, ordre }: { vue: VueDuDeroule; ordre: 1 | 2 }) {
  const cas = vue.cas.find((c) => c.ordre === ordre)
  const lectures = cas ? lireLaRepartition(cas.credenceDonnee) : null
  if (!lectures) return null
  return (
    <Depliable titre="Tes jetons, réponse par réponse" depotId={vue.depotId} aide={null}>
      <ul className="flex flex-col gap-3.5">
        {lectures.map((l, i) => (
          <li key={`${i}-${l.candidat}`}>
            <p className={`font-corps text-[15px] leading-[1.45] ${
              l.jetons > 0 ? 'text-encre' : 'text-muet'}`}>
              {l.candidat}
            </p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span aria-hidden className="h-2 w-[140px] shrink-0 overflow-hidden rounded-full bg-bordure">
                <span
                  className={`block h-full rounded-full ${l.attendue ? 'bg-ok' : 'bg-muet'}`}
                  style={{ width: `${Math.max(0, Math.min(100, l.jetons))}%` }}
                />
              </span>
              <span className={`font-ui text-sm font-semibold tabular-nums ${
                l.jetons > 0 ? 'text-encre' : 'text-muet'}`}>
                {l.jetons} jeton{l.jetons > 1 ? 's' : ''}
              </span>
              {l.attendue && <span className="font-ui text-xs text-ok">— la bonne</span>}
            </div>
          </li>
        ))}
      </ul>
    </Depliable>
  )
}

// ── La correction, commune aux deux écrans qui la servent ───────────────────

/**
 * ⭐ 05/09 — CE QUE L'ÉLÈVE A RÉPONDU, lu sur ce qui est ÉCRIT : aux crans à
 *    candidats, la lecture la plus chargée (et si c'est la bonne — l'entrée porte
 *    `index_correct`, écrit APRÈS la saisie) ; ailleurs, son texte et le passage
 *    qu'il a surligné. `egalite` quand aucune lecture ne se détache.
 */
type ReponseDeLEleve =
  | { forme: 'candidat'; candidat: string; jetons: number; juste: boolean }
  | { forme: 'egalite' }
  | { forme: 'texte'; texte: string; zone: string | null }

function reponseDeLEleve(vue: VueDuDeroule, ordre: 1 | 2): ReponseDeLEleve | null {
  const cas = vue.cas.find((c) => c.ordre === ordre)
  if (!cas) return null
  if (vue.credenceEstLaReponse) {
    const lectures = lireLaRepartition(cas.credenceDonnee)
    if (!lectures) return null
    const plusHaut = Math.max(...lectures.map((l) => l.jetons))
    const tetes = lectures.filter((l) => l.jetons === plusHaut)
    if (plusHaut <= 0 || tetes.length !== 1) return { forme: 'egalite' }
    return { forme: 'candidat', candidat: tetes[0].candidat, jetons: plusHaut, juste: tetes[0].attendue }
  }
  const texte = (ordre === 2 ? vue.texteVf : vue.texteV1) ?? ''
  const contenu = (cas.materiau ?? []).map((sg) => sg.texte).join('')
  const zone = cas.zoneDonnee ? contenu.slice(cas.zoneDonnee[0], cas.zoneDonnee[1]) : null
  if (texte.trim() === '' && !zone) return null
  return { forme: 'texte', texte, zone: zone && zone.trim() !== '' ? zone : null }
}

const SUR_TITRE = 'font-marque text-[11px] font-semibold uppercase tracking-[0.11em]'

/**
 * ⭐ 05/09 — LA CORRECTION PART DE LA RÉPONSE DE L'ÉLÈVE (Louis, sur la galerie) :
 *    « il voit sa réponse, pourquoi c'est une bonne réponse si c'est la bonne, et
 *    pourquoi c'est une mauvaise réponse si c'est une mauvaise ; et si c'est une
 *    mauvaise réponse, il voit aussi la bonne réponse et son explication. »
 *      · aux crans à candidats, le jugement est algorithmique : sa lecture, le
 *        verdict, la réfutation ; puis la bonne lecture et son pourquoi ;
 *      · sur une rédaction, il n'y a pas de verdict avant la chaîne : sa réponse
 *        et ce qu'on tient pour vrai se lisent CÔTE À CÔTE, avec le pourquoi —
 *        « on prend le temps d'expliquer, toujours ».
 * ⚠️ La réfutation ne vaut que pour le candidat le plus chargé (jamais des
 *    trois) : c'est ce que la vue sert, et ce que cette page montre.
 */
function Correction({
  correction, reponse = null, verdict = null, precision = null, passage = null,
}: {
  correction: NonNullable<VueDuDeroule['corrections'][number]>
  reponse?: ReponseDeLEleve | null
  /**
   * ⭐⭐ 07/09/2026 — LE VERDICT DU JUGE, DIT À L'ÉLÈVE (Louis : « si on dit à
   *    l'élève quelle est la bonne réponse, on ne lui dit pas si l'exercice est
   *    réussi »). `null` = aucun verdict, on ne dit rien.
   * ⛔ Aux crans à candidats, ce n'est PAS ce chemin : `juste` le dit déjà
   *    depuis la crédence. Celui-ci sert les crans où l'élève RÉDIGE — 2, 4, 5,
   *    7, 9 — où le verdict existait en base et n'atteignait aucun écran.
   */
  verdict?: boolean | null
  /** ⭐ 07/09 — ce que la ZONE a manqué. Une explication de l'écart, jamais un
   *  second verdict : le verdict reste celui du registre. */
  precision?: string | null
  /**
   * ⭐⭐ LE PASSAGE QU'IL FALLAIT SURLIGNER — au 4(b), et là seulement.
   * ⛔ Il REMPLACE « Ce qu'il fallait voir », qui y resservait l'ÉNONCÉ — le
   *    texte même que la consigne venait de citer (« Le devoir a ce problème :
   *    "…" »). L'élève relisait la consigne au lieu de voir ce qu'il cherchait.
   *    *Relevé par Louis sur le smoke du 08/09.*
   */
  passage?: string | null
}) {
  const juste = reponse?.forme === 'candidat' ? reponse.juste : null
  const refutation = correction.refutation
    && reponse?.forme === 'candidat' && !reponse.juste
    && correction.refutation.candidat === reponse.candidat
    ? correction.refutation.pourquoiFaux : null

  return (
    <div className="flex flex-col gap-3">
      {reponse?.forme === 'candidat' && (
        <div className={`rounded-xl border p-4 sm:px-[18px] ${juste
          ? 'border-ok/25 bg-ok-teinte' : 'border-attention/35 bg-attention-teinte'}`}>
          <p className={`${SUR_TITRE} ${juste ? 'text-ok' : 'text-attention'}`}>
            Ta réponse · {reponse.jetons} jetons sur 100
          </p>
          <TexteBrut texte={reponse.candidat}
            className="mt-1.5 font-corps text-[16px] leading-[1.45] text-encre" />
          <p className={`mt-2 font-corps text-[15.5px] font-semibold ${juste ? 'text-ok' : 'text-attention'}`}>
            {juste ? 'C’est la bonne réponse.' : 'Ce n’est pas la bonne réponse.'}
          </p>
          {refutation && (
            <TexteBrut texte={refutation}
              className="mt-1.5 font-corps text-base leading-[1.55] text-encre" />
          )}
        </div>
      )}

      {/* ⭐ L'ÉGALITÉ SE DIT, elle ne se tait pas : « servir la réfutation d'un
          candidat que l'élève n'a pas choisi est pire que n'en servir aucune ». */}
      {reponse?.forme === 'egalite' && (
        <p className="font-corps text-[15px] leading-relaxed text-encre-douce">
          Tu avais réparti tes jetons à égalité : aucune réponse n’était celle que tu tenais le
          plus pour vraie. Voici celle qu’il fallait voir.
        </p>
      )}

      {reponse?.forme === 'texte' && (
        <div className="rounded-xl border border-bordure bg-surface-retrait p-4 sm:px-[18px]">
          <p className={`${SUR_TITRE} text-muet`}>Ta réponse</p>
          {/* ⛔ 08/09 — BORNÉE. Sur un ratissage, l'écran recitait les 668 signes
              du matériau pour dire « tu en as pris trop » : la démonstration par
              l'absurde, et tout le reste repoussé sous la ligne de flottaison.
              On en montre le début, et on dit qu'il y en a plus. */}
          {reponse.zone && (
            <p className="mt-1.5 font-corps text-[15px] italic leading-[1.5] text-encre-douce">
              Le passage que tu as surligné : « {reponse.zone.length > 180
                ? `${reponse.zone.slice(0, 180).trimEnd()}…` : reponse.zone} »
              {reponse.zone.length > 180 && (
                <span className="not-italic text-muet"> ({reponse.zone.length} signes)</span>
              )}
            </p>
          )}
          {reponse.texte.trim() !== '' && (
            <TexteBrut texte={reponse.texte}
              className="mt-1.5 font-corps text-[16px] leading-[1.55] text-encre" />
          )}
          {/* ⭐⭐ 07/09 — LE VERDICT. Mêmes jetons que la branche à candidats
              (`text-ok` / `text-attention`) : une seule grammaire de couleur
              pour « juste » et « pas juste » dans tout le déroulé. */}
          {verdict !== null && (
            <p className={`mt-2.5 font-corps text-[15.5px] font-semibold
              ${verdict ? 'text-ok' : 'text-attention'}`}>
              {/* ⛔ 07/09, vu au smoke par Louis — ce verdict disait « compare-la à
                  ce qui suit », et le titre juste en dessous dit « Ce qu’il fallait
                  voir — COMPARE AVEC TA RÉPONSE ». La même consigne deux fois, plus
                  l’écho de « ce qu’il fallait ». Le titre la porte déjà, et mieux
                  placée : le verdict se contente de juger.
                  ⭐ Et il reprend les mots de la branche à candidats (« Ce n’est pas
                  la bonne réponse ») — une seule grammaire dans tout le déroulé. */}
              {verdict ? 'Ta réponse est juste.' : 'Ta réponse n’est pas la bonne.'}
            </p>
          )}
          {/* ⛔ L'explication vient APRÈS le verdict et ne le contredit jamais :
              « tu étais au bon endroit » ne veut pas dire « c'est juste ». */}
          {verdict === false && precision && (
            <p className="mt-1 font-corps text-[15px] leading-[1.5] text-encre-douce">
              {precision}
            </p>
          )}
        </div>
      )}

      {/* Ce qu'on tient pour vrai — sauf quand la réponse de l'élève l'EST déjà. */}
      {juste !== true && passage && (
        <div className="rounded-xl border border-ok/25 bg-ok-teinte p-4 sm:px-[18px]">
          <p className={`${SUR_TITRE} text-ok`}>Le passage qu’il fallait surligner</p>
          <TexteBrut texte={passage}
            className="mt-1.5 font-corps text-[16px] leading-[1.55] text-encre" />
        </div>
      )}

      {juste !== true && !passage && (
        <div className="rounded-xl border border-ok/25 bg-ok-teinte p-4 sm:px-[18px]">
          <p className={`${SUR_TITRE} text-ok`}>
            {reponse?.forme === 'texte' ? 'Ce qu’il fallait voir — compare avec ta réponse'
              : 'Ce qu’il fallait voir'}
          </p>
          <TexteBrut texte={correction.reponse}
            className="mt-1.5 font-corps text-[17px] font-semibold leading-[1.45] text-encre" />
        </div>
      )}

      {/* ⭐ LE POURQUOI. Aux crans à candidats la réponse ci-dessus est un
          CANDIDAT NU : elle ne peut rien dire d'elle-même. */}
      {correction.pourquoiJuste && (
        <div className="rounded-xl border border-bordure bg-surface p-4 sm:px-[18px]">
          <p className={`${SUR_TITRE} text-muet`}>
            {juste ? 'Pourquoi c’est la bonne' : 'Pourquoi c’est celle-là'}
          </p>
          <TexteBrut texte={correction.pourquoiJuste}
            className="mt-1.5 font-corps text-base leading-[1.55] text-encre" />
        </div>
      )}

      {/* Sans réponse lisible (une entrée d'avant le 05/09, ou vide) : la
          réfutation et l'égalité se disent comme hier. */}
      {!reponse && correction.refutation && (
        <div className="rounded-xl border border-bordure bg-surface-retrait p-4 sm:px-[18px]">
          <p className={`${SUR_TITRE} text-muet`}>
            Ce que tu avais retenu — « {correction.refutation.candidat} »
          </p>
          <TexteBrut texte={correction.refutation.pourquoiFaux}
            className="mt-1.5 font-corps text-base leading-[1.55] text-encre-douce" />
        </div>
      )}
      {!reponse && correction.silence === 'egalite' && (
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

  // ⭐⭐ 04/09 — L'ÉTAT SUIT LA VUE. Ce composant est monté AVANT la remise, avec
  //    une attente à « rien en cours » ; la remise rafraîchit la vue, mais un
  //    `useState` ne relit pas sa valeur initiale : l'encart « ton retour est en
  //    préparation » ne venait jamais, le sondage ne partait pas, et l'écran
  //    restait muet jusqu'à un rechargement à la main. Vu au parcours du 04/09
  //    en bac à sable, sur la remise d'un cran 5.
  useEffect(() => { setEtat(vue.attente) }, [vue.attente])

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
        {/* ⛔⛔ 08/09/2026 — LE MESSAGE DU JOB NE DESCEND PLUS ICI. Il était rendu
            en petit sous l'encart ; il est écrit POUR LE PROFESSEUR et c'est son
            seul domicile, donc il porte le motif technique. Or un motif de refus
            peut NOMMER DES OBSERVABLES — « RR4 : le texte nomme des observables
            — lien_explicite » —, et le vocabulaire de la grille ne va jamais à
            l'élève (RR4). Le chemin est devenu atteignable le 08/09 avec la
            clôture des rejeux épuisés (`clorePourEpuisement`) : avant, seuls des
            motifs d'infrastructure y passaient. ⭐ Ce que l'élève a besoin de
            savoir est déjà dit au-dessus : préviens ton professeur, rien n'est
            perdu. */}
      </Encart>
    )
  }
  if (!etat.enCours) return null
  // ⭐ 06/09 (Louis) — « il faut prévoir un écran "ton retour est en construction" » :
  //    une PAGE, avec son titre, et non un encart posé sur une colonne vide.
  return (
    <div className="page-tourne flex flex-col gap-4 rounded-xl border border-bordure bg-surface-retrait
                    px-5 py-6 sm:px-7 sm:py-8">
      <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-pigment">
        Ton retour est en construction
      </p>
      <p className="font-titre text-[24px] font-semibold leading-tight text-encre">
        Ta copie est partie à la lecture.
      </p>
      <p className="font-corps text-[16px] leading-relaxed text-encre-douce">
        Ton retour se prépare — cela prend une ou deux minutes. Cet écran se met à jour tout seul,
        tu n’as rien à recharger ; tu peux aussi fermer la page et revenir plus tard, ton retour
        t’attendra ici.
      </p>
      <p aria-hidden className="font-ui text-[13px] text-muet">
        <span className="inline-block animate-pulse">● ● ●</span>
      </p>
      <p className="text-sm text-encre">
        <strong>En attendant :</strong> ne réécris pas ta réponse — c’est celle-là que ton
        retour commentera.
      </p>
    </div>
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
