'use client'

// ============================================================================
// C4 · L4 — L'ÉCRAN DE L'ÉLÈVE : photographier, relire, corriger, valider.
// ----------------------------------------------------------------------------
// Étapes 5 à 10 du `02-exercices.md` §6.D. UN SEUL composant pour les DEUX
// modules : « c'est le même flux dans deux modules, et ce qui commande le
// comportement est le `lieu`, jamais le module ».
//
// ⚠️ LE CHAMP D'ÉDITION PRÉSERVE LE DÉCOUPAGE (piège 14 ; `07-` §3 ; `06-` §4).
//    C'est un `<textarea>`, et RIEN d'autre : pas de contenteditable, pas de
//    normalisation à la frappe, pas de `trim` sur les lignes. « La Structure se
//    mesure sur le découpage en blocs tel qu'il est écrit sur la page », et
//    « une transcription qui fusionne deux paragraphes fabrique une copie sans
//    architecture ». Le compteur de blocs est là pour que l'élève VOIE son
//    découpage — il ne le corrige pas.
//
// ⚠️ LE COLLAGE N'EST PAS BLOQUÉ SUR CE CHAMP, et c'est une décision de séance
//    (piège 37, qui demande de trancher et de le dire). L'élève y recopie SA
//    PROPRE COPIE, sous les yeux du professeur, et la copie papier est ramassée :
//    un refus de collage l'empêcherait de remettre en ordre un paragraphe qu'il
//    a mal replacé, sans rien protéger que le terrain ne protège déjà. Le refus
//    du collage EST posé, lui, sur le champ de RÉDACTION AU CLAVIER de l'élève
//    exempté — là où l'enjeu de validité est réel, puisque sa copie est une ancre.
//
// ⚠️ AUCUN CHIFFRE DE CONFIANCE À L'ÉCRAN (piège 56 ; `06-` §5) : « un écran
//    n'affiche un nombre que si ce nombre compte quelque chose ». `confiance_ocr`
//    sert à ATTIRER L'ŒIL SUR UN PASSAGE, pas à afficher un score — d'où la
//    liste des endroits, et jamais le nombre.
//
// ⚠️ AUCUNE QUESTION SUR CE QUE L'ÉLÈVE N'A PAS COMPRIS (piège 26 ; `02-` §5) :
//    rien ici ne l'invite à signaler une incompréhension.
// ============================================================================

import { useState, useRef, useTransition, useActionState, useEffect, useId, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import {
  actionPreparerLesPhotos, actionEnvoyerLesPhotos, actionEnregistrerLaTranscription,
  actionValiderLaTranscription, actionValiderLaSaisieClavier, actionCollageBloque,
  actionSeJuger, actionConfianceRemise, actionCredence, actionValiderLaLecture,
  actionEtatDuDepot,
  type Reponse,
} from '@/app/passation/actions'
import { actionEtatDeMonEpreuve } from '@/app/passation/actions-epreuve'
import { TEXTES_EPREUVE, avecHeure, heureMurale } from '@/utils/examens/epreuve'
import {
  suiteDesEtapes, etapeCourante, rangDeLEtape, resteUneEtapeApres, enLettres, LIBELLES_ETAPES,
  type FaitsDeLEpreuve, type EtapeDuFil, type EtapeEpreuve,
} from '@/utils/examens/etapes-epreuve'
import { NOM_COMPETENCE } from '@/utils/deroule/types'
import { auQuartDeTour, marqueurPageManquante, photoDeposee, type Photo, type Rotation }
  from '@/utils/passation/photos'
import { blocs } from '@/utils/passation/transcription-calcul'
import type { Doute } from '@/utils/passation/transcription-calcul'
import type { MoyenDeCollage } from '@/utils/passation/collage'
import type { OffreSeJuger, OffreConfiance, OffreCredence } from '@/utils/passation/metacognition'

export interface VueEleve {
  depotId: string
  consigne: string
  ouvert: boolean
  /**
   * ⭐⭐ C10 · L2 — LE PROFESSEUR A CLOS LES DÉPÔTS DE CETTE PASSATION.
   *
   * ⛔ CE N'EST PAS `!ouvert`. `ouvert` vaut `d.ouvert_par_prof_at != null`, et
   *    la clôture ne touche PAS cette colonne : elle reste VRAIE après le clic.
   *    Sans ce champ, l'écran continuait de proposer le formulaire de dépôt
   *    entier à l'élève qui revenait par l'URL directe — pendant que le serveur,
   *    lui, refusait chacune de ses écritures.
   *
   * Posé par `chargerVueEleve`, qui réduit la vue là où elle se construit.
   */
  clos: boolean
  /** L'élève rédige-t-il au clavier ? — `profiles.mode_saisie_force`, jamais le motif. */
  auClavier: boolean
  photos: Photo[] | null
  /**
   * ⭐ C6-L4 — VRAI pour l'essai de Fragments : « manuscrit → photos →
   *    transcription », TROIS étapes (`06-` §1). L'élève ne se relit jamais, la
   *    copie a été mesurée telle que la machine l'a lue : l'écran montre cette
   *    lecture, sans l'inviter à corriger. Posé par la page de Fragments, jamais
   *    lu en base.
   */
  sansRelecture?: boolean
  transcription: string | null
  /**
   * La copie tapée AU CLAVIER par l'élève exempté — `texte_v1`, jamais
   * `transcription_v1` : il n'y a pas eu de photo, donc rien à transcrire.
   * ⚠️ Sans elle, l'élève qui rouvrait sa page après avoir validé trouvait un
   *    champ VIDE et verrouillé : sa copie avait disparu de son écran.
   */
  texteClavier: string | null
  doutes: Doute[] | null
  valide: boolean
  /** Le message reporté de la passation PRÉCÉDENTE (`06-` §1, règle 3). */
  messageReporte: string | null
  /** Le rappel de lisibilité — UNE LIGNE, du ton de Calame (`06-` §1, règle 1). */
  rappelLisibilite: string
  seJuger: OffreSeJuger
  confiance: OffreConfiance
  libellesConfiance: Record<string, string>
  credence: OffreCredence
  pagesMax: number
  /**
   * Le retour PUBLIÉ, quand il l'est. « L'élève DOIT valider sa lecture — `lu_at`.
   * La validation de lecture ne vit pas [sur le dépôt] mais SUR LE RETOUR : un
   * seul domicile pour un seul geste » (`07-` §1.1 ; piège 32).
   */
  retourPublie: {
    id: string
    points: Array<{ id: string; texte: string; competence: string; nature: string
      ancrage?: { source: string; citation: string } }>
    feedForward: string | null
    commentaireGeneral: string | null
    luLe: string | null
  } | null
  /** L'état de la file, quand la transcription se fait attendre. */
  attente: Array<{ etape: string; statut: string; echec_definitif: boolean; message: string | null }>
  /**
   * ⭐ 24/09 — L'ÉPREUVE MINUTÉE (porte `epreuve_minutee_actif`, examen de Codex
   *    dont la durée est fixée). Null : l'écran d'hier, sans horloge.
   */
  epreuve: {
    /** Une durée de rédaction est fixée : l'épreuve est minutée (sinon, seules les consignes pratiques). */
    preparee: boolean
    lancee: boolean
    /** L'heure d'ouverture automatique du dépôt (ISO), une fois lancée. */
    ouverture: string | null
    /** Montrées à l'élève, jamais envoyées à la correction. */
    consignesPratiques: string | null
    /** Le fuseau du professeur : l'heure se lit dans le sien, jamais dans celui de l'appareil. */
    fuseau: string
  } | null
  /**
   * ⭐ 24/09 — ses photos, LISIBLES (URL signées), dans l'ordre, pour relire son
   *    texte à côté de sa page. Vide avant l'ouverture et après la clôture.
   */
  photosLisibles: Array<{ ordre: number; rotation: Rotation; manquante: boolean; url: string | null }>
  /**
   * ⭐ 24/09 — les gestes d'après la validation déjà FAITS : l'écran de l'épreuve
   *    tourne ses pages sur ces faits (`utils/examens/etapes-epreuve.ts`).
   */
  gestes: { jugerFait: boolean; confianceFaite: boolean; credenceFaite: boolean }
}

/**
 * `confirmation` : la liste de points qu'une confirmation fait cocher avant
 * « Valider ma copie ». Posée par la page de CODEX seulement (24/09) ; absente,
 * la validation part au premier clic, comme hier.
 */
export function EcranEleve({ vue, confirmation, refonte = false }: {
  vue: VueEleve
  confirmation?: { titre: string; intro: string; points: readonly string[]; valider: string; retour: string }
  /**
   * ⭐ 24/09 — l'écran de dépôt et de relecture REFAIT (handoff), l'attente de
   *    la transcription et la page qui se relit seule. Posé par la page de CODEX,
   *    porte `epreuve_minutee_actif` ouverte ; absent, l'écran d'hier, à l'octet.
   */
  refonte?: boolean
}) {
  // ⭐⭐ C10 · L2 — LA CLÔTURE PASSE AVANT L'OUVERTURE, et l'ordre compte : un
  //    dépôt clos est TOUJOURS ouvert au sens d'`ouvert_par_prof_at`, donc le
  //    test d'en dessous ne l'attraperait jamais.
  //
  // ⭐ LE RETOUR RESTE LISIBLE. Structurellement, un dépôt que ce lot clôt n'en
  //    a aucun — `publier` ne bascule que `v1_remis` et `ouvert`, et la clôture
  //    les a quittés —, mais s'il en portait un, le lui retirer serait lui
  //    reprendre ce qu'il a le droit de lire.
  if (vue.clos) {
    return (
      <div className="space-y-6">
        <Encart>
          <p className="text-encre">
            <strong>Ce dépôt est clos.</strong> Ton professeur a clos les dépôts de cette
            passation : tu ne peux plus y déposer de copie ni modifier ta transcription.
          </p>
        </Encart>
        {vue.retourPublie && <RetourPublie vue={vue} />}
      </div>
    )
  }
  if (!vue.ouvert) {
    // ⭐ 24/09 — L'ÉPREUVE MINUTÉE : lancée, l'élève lit son sujet et l'heure où
    //    le dépôt s'ouvrira ; préparée mais pas lancée, il attend. Dans les deux
    //    cas la page SE RELIT SEULE (sondage) : elle passe au dépôt sans recharger.
    if (vue.epreuve?.lancee) return <EpreuveEnCours vue={vue} />
    if (vue.epreuve?.preparee) {
      return (
        <div className="space-y-5">
          <Encart><p className="text-encre">{TEXTES_EPREUVE.eleveAvant}</p></Encart>
          {vue.epreuve.consignesPratiques && <ConsignesPratiques texte={vue.epreuve.consignesPratiques} />}
          <SondeDeLEpreuve depotId={vue.depotId} lancee={false} ouverture={null} />
        </div>
      )
    }
    return (
      <div className="space-y-5">
        <Encart>
          <p className="text-encre">
            La rédaction est en cours. <strong>Le professeur ouvrira le dépôt</strong> quand le temps
            sera écoulé — c’est son geste, pas une minuterie.
          </p>
        </Encart>
        {vue.epreuve?.consignesPratiques && <ConsignesPratiques texte={vue.epreuve.consignesPratiques} />}
        {/* ⭐ Revue du 24/09 : même hors épreuve minutée (ou porte refermée en cours
            de route), la page refaite se relit seule et passe au dépôt quand il
            s'ouvre — sans elle, l'élève devait recharger. */}
        {refonte && <SondeDeLEpreuve depotId={vue.depotId} lancee={false} ouverture={null} />}
      </div>
    )
  }
  // ⭐ 24/09 — commentaires de Louis sur la planche : « le bouton prendre la photo
  //    devrait être la première chose qu'on voit. Si on veut garder le sujet, il
  //    faut avoir un toggle pour passer du sujet au dépôt. » Le sujet ne s'empile
  //    donc plus AU-DESSUS du dépôt : il vit derrière la bascule, un appui plus loin.
  // ⭐ 24/09 — et « l'élève devrait voir clairement les étapes de la vérification ;
  //    s'inspirer des exercices » (proposition dessinée, acceptée par Louis) : le
  //    FIL d'étapes en tête, puis une tâche par écran après la validation.
  if (refonte && !vue.auClavier) {
    const faits = faitsDeLEpreuve(vue)
    const suite = suiteDesEtapes(faits)
    const courante = etapeCourante(faits)
    return (
      <div className="space-y-6">
        <SuiviDeLEtape courante={courante} depotId={vue.depotId} />
        <FilDesEtapes suite={suite} courante={courante} depotId={vue.depotId} />
        {vue.valide
          ? <ApresLaValidation vue={vue} faits={faits} suite={suite} courante={courante} />
          : <DepotEtRelecture vue={vue} confirmation={confirmation} sujet={<SujetEtConsignes vue={vue} />} />}
        {vue.retourPublie && <RetourPublie vue={vue} />}
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {vue.messageReporte && (
        <Encart ton="attention">
          <p className="text-sm text-encre">
            <strong>De la dernière fois :</strong> {vue.messageReporte}
          </p>
        </Encart>
      )}
      <Consigne texte={vue.consigne} rappel={vue.rappelLisibilite} auClavier={vue.auClavier} />
      {vue.epreuve?.consignesPratiques && <ConsignesPratiques texte={vue.epreuve.consignesPratiques} />}
      {vue.auClavier ? <RedactionClavier vue={vue} /> : <DepotEtRelectureHier vue={vue} />}
      {vue.valide && <ApresValidation vue={vue} />}
      {vue.retourPublie && <RetourPublie vue={vue} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// L'OBLIGATION DE LECTURE — `lu_at`, et rien de dupliqué côté dépôt
// ─────────────────────────────────────────────────────────────────────────────

function RetourPublie({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionValiderLaLecture, null as Reponse | null)
  const r = vue.retourPublie!
  return (
    <section className="rounded-lg border border-liseret bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Ton retour
      </h2>
      {r.commentaireGeneral && (
        <p className="mt-2 whitespace-pre-wrap text-encre">{r.commentaireGeneral}</p>
      )}
      <ul className="mt-3 space-y-2 text-sm text-encre">
        {r.points.map((p) => (
          <li key={p.id} className="border-l-2 border-liseret pl-2">
            <p>{p.texte}</p>
            {p.ancrage?.citation && (
              <p className="text-xs italic text-encre-douce">« {p.ancrage.citation} »</p>
            )}
          </li>
        ))}
        {r.points.length === 0 && (
          <li className="italic text-muet">Ton professeur a relu ce retour et l’a laissé vide.</li>
        )}
      </ul>
      {r.feedForward && (
        <p className="mt-3 text-sm text-encre-douce"><strong>Pour la suite :</strong> {r.feedForward}</p>
      )}
      {r.luLe ? (
        <p className="mt-3 text-sm text-ok">
          Lecture validée le {new Date(r.luLe).toLocaleString('fr-CA')}.
        </p>
      ) : (
        <form action={action} className="mt-3">
          <input type="hidden" name="retour_id" value={r.id} />
          <p className="text-sm text-encre-douce">
            <strong>Tu dois valider ta lecture</strong> pour pouvoir rendre autre chose.
          </p>
          <button type="submit" disabled={enCours}
            className="mt-2 rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
            {enCours ? '…' : 'J’ai lu mon retour'}
          </button>
          {etat && <p className={`mt-2 text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
        </form>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function Consigne({ texte, rappel, auClavier }: { texte: string; rappel: string; auClavier: boolean }) {
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Le sujet</h2>
      <p className="mt-2 whitespace-pre-wrap text-encre">{texte}</p>
      {/* Règle 1 du `06-` §1 : UNE LIGNE, du ton de Calame — jamais un encart.
          Et elle ne se livre pas sans l'exemption (règle 4) : l'élève exempté
          ne la voit pas, puisqu'il n'écrit pas à la main. */}
      {!auClavier && <p className="mt-3 text-sm italic text-encre-douce">{rappel}</p>}
    </section>
  )
}

/**
 * ⭐ 24/09 — ce qu'on lit pour écrire : le message de la dernière fois, le sujet,
 *    les consignes pratiques. Pendant la rédaction, c'est tout l'écran ; une fois
 *    le dépôt ouvert, c'est l'onglet « Le sujet » de la bascule.
 */
function SujetEtConsignes({ vue }: { vue: VueEleve }) {
  return (
    <div className="space-y-5">
      {vue.messageReporte && (
        <Encart ton="attention">
          <p className="text-sm text-encre">
            <strong>De la dernière fois :</strong> {vue.messageReporte}
          </p>
        </Encart>
      )}
      <Consigne texte={vue.consigne} rappel={vue.rappelLisibilite} auClavier={vue.auClavier} />
      {vue.epreuve?.consignesPratiques && <ConsignesPratiques texte={vue.epreuve.consignesPratiques} />}
    </div>
  )
}

/**
 * ⭐ 24/09 — LA BASCULE de l'épreuve (commentaires de Louis sur la planche) :
 *    déposer ↔ le sujet, puis texte retranscrit ↔ ma copie ↔ le sujet. Elle
 *    COLLE sous l'en-tête quand l'élève descend dans son texte : passer du texte
 *    à la photo ne demande jamais de remonter. Hauteurs mesurées au 24/09 : le
 *    bandeau mobile fait 65 px (< sm), l'en-tête du site 194,5 px (≥ sm).
 * ⚠️ Revue du 24/09 :
 *    · la hauteur de l'en-tête SE MESURE (`useHauteurEntete`) : le bandeau mobile
 *      fait 49 px pour un élève d'UNE classe, 65 px pour deux — les chiffres
 *      ci-dessus ne restent que le repli d'avant la mesure ;
 *    · elle ne colle que sur un écran d'au moins 640 px de HAUT : en paysage, sur
 *      un téléphone, l'en-tête en prend déjà 194,5 ;
 *    · changer de volet ramène la bascule sous l'en-tête quand l'élève était
 *      descendu (le volet choisi est plus court : sans cela, il tombait sous la
 *      page, bascule comprise) ;
 *    · des boutons à bascule (`aria-pressed`), pas des onglets ARIA : aucun ne
 *      pilote de panneau.
 */
interface Onglet { cle: string; libelle: string; actif: boolean; choisir: () => void; classe?: string }

/** Le bas des en-têtes collants de la coquille élève — mesuré, suivi au redimensionnement. */
function useHauteurEntete(): number | null {
  const [haut, setHaut] = useState<number | null>(null)
  useEffect(() => {
    const entetes = Array.from(document.querySelectorAll<HTMLElement>('[data-coquille="eleve"] > .sticky'))
    if (entetes.length === 0) return
    // Le premier rappel d'un ResizeObserver tombe dès l'observation : il mesure.
    const ro = new ResizeObserver(() =>
      setHaut(Math.max(0, ...entetes.map((e) => e.getBoundingClientRect().height))))
    entetes.forEach((e) => ro.observe(e))
    return () => ro.disconnect()
  }, [])
  return haut
}

/** Si l'élève est descendu sous le haut du bloc, le ramener juste sous l'en-tête. */
function ramenerSousLEntete(bloc: HTMLElement | null, haut: number | null) {
  if (!bloc) return
  const ecart = bloc.getBoundingClientRect().top - (haut ?? 0)
  if (ecart < 0) window.scrollBy({ top: ecart, behavior: 'instant' })
}

function Bascule({ onglets }: { onglets: Onglet[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const haut = useHauteurEntete()
  return (
    <div ref={ref} role="group" aria-label="Ce que tu regardes"
      style={haut != null ? { top: haut } : undefined}
      className="top-[65px] z-[5] -mx-1 mb-4 flex gap-2 bg-parchemin px-1 py-2 sm:top-[194.5px]
                 [@media(min-height:640px)]:sticky">
      {onglets.map((o) => (
        <button key={o.cle} type="button" aria-pressed={o.actif}
          onClick={() => {
            o.choisir()
            // Après le rendu du volet choisi : le bloc de la bascule est son parent.
            requestAnimationFrame(() => ramenerSousLEntete(ref.current?.parentElement ?? null, haut))
          }}
          className={`min-h-11 flex-1 rounded-lg px-3 font-ui text-sm ${o.classe ?? ''} ${o.actif
            ? 'bg-bouton-parcours text-bouton-parcours-texte'
            : 'border border-bordure-bouton bg-surface text-encre-douce'}`}>
          {o.libelle}
        </button>
      ))}
    </div>
  )
}

type Volet = 'travail' | 'photo' | 'sujet'

/**
 * ⭐ 24/09 (3ᵉ revue) — UNE ACTION QUI NE FAIT PAS TOMBER LA PAGE. Un appel qui
 *    échoue au RÉSEAU (Wi-Fi de classe saturé, tablette verrouillée pendant
 *    l'appel, déploiement en cours) REJETTE sa promesse ; React 19 relance ce
 *    rejet au rendu suivant et, sans limite d'erreur dans `app/`, la page entière
 *    tombait — les corrections non enregistrées de la relecture avec elle. Ici,
 *    l'échec devient une réponse, et le texte reste à l'écran.
 */
const PANNE_RESEAU = 'La connexion a coupé : ce qui est à l’écran n’est pas perdu. Réessaie.'
type ActionDeFormulaire = (precedent: Reponse | null, form: FormData) => Promise<Reponse>
function sansPanne(action: ActionDeFormulaire): ActionDeFormulaire {
  return async (precedent, form) => {
    try {
      return await action(precedent, form)
    } catch {
      return { ok: false, message: PANNE_RESEAU }
    }
  }
}
const validerLaTranscription = sansPanne(actionValiderLaTranscription)
const seJuger = sansPanne(actionSeJuger)
const confianceRemise = sansPanne(actionConfianceRemise)

/**
 * ⭐ 24/09 (3ᵉ revue) — SOUMETTRE SANS RÉINITIALISER. Passée à `<form action>`,
 *    une action fait réinitialiser le formulaire par React 19 à la fin de l'appel
 *    (`form.reset()`) : les champs contrôlés gardent leur état React, mais le DOM
 *    revient à sa valeur de départ — après un refus, les réponses paraissaient
 *    choisies et ne partaient plus. On soumet donc par `onSubmit`, dans une
 *    transition : pas de réinitialisation, et `enCours` dit toujours l'attente.
 */
function soumettreSans(action: (form: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    startTransition(() => action(form))
  }
}

function Encart({ children, ton = 'info' }: { children: React.ReactNode; ton?: 'info' | 'attention' }) {
  const cls = ton === 'attention'
    ? 'border-attention bg-attention-teinte'
    : 'border-bordure bg-surface'
  return <div className={`rounded-lg border p-4 ${cls}`}>{children}</div>
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 5 — PHOTOGRAPHIER ; ÉTAPES 6 À 8 — RELIRE, CORRIGER, VALIDER
// ─────────────────────────────────────────────────────────────────────────────

interface Page { image: ImageTraitee | null; rotation: Rotation; manquante: boolean }

type Confirmation = NonNullable<Parameters<typeof EcranEleve>[0]['confirmation']>

/** Les boutons de l'élève : 44 px au moins, partout (handoff, § « Téléphone »). */
const PETIT = 'min-h-11 min-w-11 rounded-md border border-bordure-bouton bg-surface px-2 font-ui text-sm '
  + 'text-encre-douce hover:bg-parchemin-fonce disabled:opacity-30'
const SECONDAIRE = 'min-h-11 rounded-lg border border-bordure-bouton bg-surface px-4 py-2 font-ui text-sm '
  + 'text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40'
const VALIDER = 'min-h-12 rounded-lg bg-bouton-valider px-5 py-2 font-ui text-base font-semibold '
  + 'text-bouton-valider-texte hover:opacity-90 disabled:opacity-40'

function DepotEtRelecture({ vue, confirmation, sujet }: {
  vue: VueEleve; confirmation?: Confirmation; sujet: React.ReactNode
}) {
  const router = useRouter()
  const [volet, setVolet] = useState<Volet>('travail')
  const [pages, setPages] = useState<Page[]>([])
  const [envoi, setEnvoi] = useState(false)
  // ⭐ 24/09 — ENVOYÉ : l'écran passe à l'attente dès que les pages sont parties,
  //    au lieu d'un `window.location.reload()` qui rendait le formulaire VIDE
  //    tant que la transcription n'était pas revenue (22 s de médiane).
  const [envoye, setEnvoye] = useState(false)
  const [progression, setProgression] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const inputPhoto = useRef<HTMLInputElement>(null)
  const inputGalerie = useRef<HTMLInputElement>(null)

  const dejaTranscrit = (vue.transcription ?? '').trim() !== ''
  const echec = vue.attente.some((a) => a.echec_definitif)
  // ⭐ 24/09 — LA TRANSCRIPTION EST EN VOL : des photos sont déposées et le job de
  //    transcription attend, tourne, ou va réessayer. Avant, l'écran rendait ici
  //    le formulaire photo VIDE — et un second envoi EFFAÇAIT les photos que la
  //    machine était en train de lire (`preparerDepotDesPhotos` vide le dossier).
  const photosDeposees = (vue.photos ?? []).some((p) => !p.page_manquante)
  const enVol = vue.attente.some((a) => a.etape === 'transcription_v1'
    && (a.statut === 'en_attente' || a.statut === 'en_cours' || (a.statut === 'echoue' && !a.echec_definitif)))

  async function ajouter(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return
    if (pages.length + fichiers.length > vue.pagesMax) {
      setErreur(`Maximum ${vue.pagesMax} pages.`)
      return
    }
    setErreur(null)
    try {
      const neuves: Page[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la page ${pages.length + i + 1}…`)
        // `traiterImage` lit l'EXIF sur l'original PUIS le supprime à la
        // compression (`06-` §7, point 4). ⚠️ On n'en tire AUCUN signal : le
        // seuil « photo suspecte » de Fragments ne se recopie pas ici (piège 11).
        neuves.push({ image: await traiterImage(fichiers[i]), rotation: 0, manquante: false })
      }
      setPages((p) => [...p, ...neuves])
    } catch {
      setErreur('Erreur au traitement des photos. Réessaie.')
    } finally {
      setProgression('')
      if (inputPhoto.current) inputPhoto.current.value = ''
      if (inputGalerie.current) inputGalerie.current.value = ''
    }
  }

  /** « Ton écran doit pouvoir dire qu'une page manque, VRAIMENT » (piège 12). */
  function declarerPageManquante() {
    setPages((p) => [...p, { image: null, rotation: 0, manquante: true }])
  }

  function retirer(i: number) {
    setPages((p) => {
      const img = p[i].image
      if (img) libererPreview(img.previewUrl)
      return p.filter((_, k) => k !== i)
    })
  }

  function deplacer(i: number, delta: number) {
    setPages((p) => {
      const j = i + delta
      if (j < 0 || j >= p.length) return p
      const n = [...p]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }

  function tourner(i: number) {
    setPages((p) => p.map((x, k) => (k === i ? { ...x, rotation: auQuartDeTour(x.rotation + 90) } : x)))
  }

  async function envoyer() {
    if (pages.length === 0) { setErreur('Ajoute au moins une page.'); return }
    if (pages.every((p) => p.manquante)) {
      setErreur('Toutes les pages sont déclarées manquantes : il n’y a rien à transcrire.')
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const aDeposer = pages.filter((p) => !p.manquante)
      setProgression('Préparation…')
      const prep = await actionPreparerLesPhotos(vue.depotId, aDeposer.length)
      if (!prep.ok) { setErreur(prep.message); return }

      const supabase = createClient()
      const chemins: string[] = []
      for (let i = 0; i < aDeposer.length; i++) {
        setProgression(`Envoi de la page ${i + 1}/${aDeposer.length}…`)
        const { path, token } = prep.uploads[i]
        const { error } = await supabase.storage.from('codex')
          .uploadToSignedUrl(path, token, aDeposer[i].image!.file, { contentType: 'image/jpeg' })
        if (error) { setErreur(error.message); return }
        chemins.push(path)
      }

      // La forme que la garde exige — fabriquée en UN SEUL endroit
      // (`utils/passation/photos.ts`), jamais à la main dans un écran.
      let k = 0
      const photos: Photo[] = pages.map((p, i) => {
        if (p.manquante) return marqueurPageManquante(i + 1)
        const photo = photoDeposee(i + 1, chemins[k], sommeDe(p.image!), p.rotation)
        k++
        return photo
      })

      // Les pages sont parties : l'écran d'attente prend le relais pendant que la
      // machine lit (l'action rend la main quand la transcription est faite).
      setEnvoye(true)
      const r = await actionEnvoyerLesPhotos(vue.depotId, photos)
      if (!r.ok) { setEnvoye(false); setErreur(r.message); return }
      pages.forEach((p) => { if (p.image) libererPreview(p.image.previewUrl) })
      setPages([])
      // L'écran lit la transcription écrite en base : il n'invente pas le texte,
      // il le lit là où la mesure le lira.
      router.refresh()
    } catch {
      // ⭐ Revue du 24/09 : un réseau de classe saturé fait ÉCHOUER l'appel lui-même
      //    (pas un refus : une exception). Sans ce `catch`, l'écran restait figé sur
      //    « La machine lit ta copie » alors que rien ne tournait, et les pages
      //    choisies disparaissaient derrière l'attente. Elles reviennent, avec le motif.
      setEnvoye(false)
      setErreur('L’envoi n’a pas abouti (la connexion a peut-être coupé). Tes pages sont toujours là : réessaie.')
    } finally {
      setEnvoi(false)
      setProgression('')
    }
  }

  // `envoye` ne sert qu'AVANT que la base ait les photos (le temps de l'appel) ;
  // ensuite, c'est la base qui dit si la machine lit encore. ⚠️ Revue du 24/09 :
  // un RENVOI (après un échec, ou des photos que la machine n'a pas lues) trouvait
  // `photosDeposees` déjà vrai et `echec` encore vrai — l'attente ne s'affichait
  // pas. Pendant l'appel lui-même (`envoi`), c'est l'attente, quoi que dise la base.
  const lit = (envoi && envoye) || (!echec && ((envoye && !photosDeposees) || (photosDeposees && enVol)))
  // ⚠️ Revue du 24/09 : le volet revient au travail quand la PHASE change — un élève
  //    resté sur « Le sujet » pendant la lecture ne voyait pas sa transcription arriver.
  const phase = dejaTranscrit || vue.valide ? 'relire' : lit ? 'lit' : 'deposer'
  const [phaseVue, setPhaseVue] = useState(phase)
  if (phase !== phaseVue) {
    setPhaseVue(phase)
    setVolet('travail')
  }

  if (vue.sansRelecture && vue.valide) {
    return <CopieLue vue={vue} texte={vue.transcription ?? ''} />
  }
  if (dejaTranscrit || vue.valide) {
    return <Relecture vue={vue} confirmation={confirmation} sujet={sujet} volet={volet} setVolet={setVolet} />
  }
  const surLeSujet = volet === 'sujet'
  const onglets: Onglet[] = [
    // « Ma copie » désigne la PHOTO à l'étape suivante : pendant la lecture, « Mon dépôt ».
    { cle: 'travail', libelle: lit ? 'Mon dépôt' : 'Déposer ma copie', actif: !surLeSujet,
      choisir: () => setVolet('travail') },
    { cle: 'sujet', libelle: 'Le sujet', actif: surLeSujet, choisir: () => setVolet('sujet') },
  ]

  const nbPages = pages.filter((p) => !p.manquante).length
  return (
    <div>
      <Bascule onglets={onglets} />
      {/* Les deux volets restent MONTÉS : les pages choisies survivent à un aller-retour au sujet. */}
      <div className={surLeSujet ? '' : 'hidden'}>{sujet}</div>
      <div className={surLeSujet ? 'hidden' : ''}>
    {lit ? <AttenteTranscription depotId={vue.depotId} /> : (
    <section className="space-y-4 rounded-xl border border-bordure bg-surface p-4 sm:p-5">
      {/* ⭐ UN SEUL gros bouton, et il vient EN PREMIER : c'est le plus gros objet de
          l'écran (handoff, « Déposer ») et la première chose qu'on voit (Louis, 24/09). */}
      <input ref={inputPhoto} type="file" accept="image/*" multiple capture="environment"
        onChange={ajouter} disabled={envoi} className="sr-only" tabIndex={-1} aria-hidden />
      <input ref={inputGalerie} type="file" accept="image/*" multiple
        onChange={ajouter} disabled={envoi} className="sr-only" tabIndex={-1} aria-hidden />
      <button type="button" onClick={() => inputPhoto.current?.click()} disabled={envoi}
        className="flex min-h-[70px] w-full items-center justify-center gap-3 rounded-xl bg-bouton-plan
                   px-4 py-3 font-ui text-lg font-semibold text-bouton-plan-texte hover:opacity-90
                   disabled:opacity-40 sm:min-h-14">
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
        </svg>
        Prendre une photo
      </button>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button type="button" onClick={() => inputGalerie.current?.click()} disabled={envoi}
          className="min-h-11 font-ui text-sm text-encre-douce underline disabled:opacity-40">
          Choisir dans mes photos
        </button>
        <button type="button" onClick={declarerPageManquante} disabled={envoi}
          className="min-h-11 font-ui text-sm text-encre-douce underline disabled:opacity-40">
          Une page manque ou est illisible
        </button>
      </div>
      <p className="text-sm text-encre-douce">
        Photographie ta copie page par page, dans l’ordre. Si une page est illisible ou absente,
        dis-le : ta copie gardera son nombre de pages.
      </p>
      {photosDeposees && !enVol && !echec && (
        <p className="rounded-lg border border-attention bg-attention-teinte px-3 py-2 text-sm text-encre">
          Tes photos sont arrivées, mais la machine ne les a pas lues. Photographie de nouveau ta
          copie et renvoie-la.
        </p>
      )}

      {pages.length > 0 && (
        <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">Tes pages</h2>
      )}
      {pages.length > 0 && (
        <ol className="space-y-2">
          {pages.map((p, i) => (
            <li key={i} className={`flex flex-wrap items-center gap-3 rounded-lg border p-2 ${p.manquante
              ? 'border-attention bg-attention-teinte' : 'border-bordure bg-parchemin'}`}>
              <span className="w-6 text-center font-marque text-muet">{i + 1}</span>
              {p.manquante ? (
                <span className="min-w-0 flex-1 text-sm italic text-attention">Page déclarée manquante</span>
              ) : (
                <>
                  <img
                    src={p.image!.previewUrl} alt={`Page ${i + 1}`}
                    style={{ transform: `rotate(${p.rotation}deg)` }}
                    className="h-16 w-[50px] rounded border border-bordure-bouton object-cover"
                  />
                  <span className="min-w-0 flex-1 font-ui text-sm text-encre">Page {i + 1}</span>
                </>
              )}
              <span className="flex flex-wrap gap-1">
                {!p.manquante && (
                  <button type="button" onClick={() => tourner(i)} disabled={envoi} className={PETIT}>Tourner</button>
                )}
                <button type="button" onClick={() => deplacer(i, -1)} disabled={envoi || i === 0}
                  aria-label={`Monter la page ${i + 1}`} className={PETIT}>↑</button>
                <button type="button" onClick={() => deplacer(i, 1)} disabled={envoi || i === pages.length - 1}
                  aria-label={`Descendre la page ${i + 1}`} className={PETIT}>↓</button>
                <button type="button" onClick={() => retirer(i)} disabled={envoi}
                  className={`${PETIT} text-retard`}>Retirer</button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-4">
        {/* `min-w-48`, comme à la relecture : à 304 px, la phrase s'écrasait en colonne à côté du bouton. */}
        <p className="min-w-48 flex-1 text-sm italic text-muet">
          Après l’envoi, la machine lira ta copie : tu corrigeras ensuite ce qu’elle a mal lu.
        </p>
        <button type="button" onClick={envoyer} disabled={envoi || nbPages === 0} className={VALIDER}>
          {envoi ? 'Envoi…' : `Envoyer ${nbPages > 1 ? `mes ${nbPages} pages` : 'ma page'}`}
        </button>
      </div>
      {progression && <p className="text-sm text-muet">{progression}</p>}
      {erreur && <p className="text-sm text-retard">{erreur}</p>}
      {echec && (
        <Encart ton="attention">
          <p className="text-sm text-encre">
            La transcription n’a pas abouti. <strong>Préviens ton professeur</strong> : ta copie
            papier reste la preuve, rien n’est perdu.
          </p>
        </Encart>
      )}
      {/* ⚠️ Revue du 24/09 : en échec, la page se relit aussi — une transcription
          relancée par le professeur arrive sans que l'élève recharge. */}
      {echec && <SondeTranscription depotId={vue.depotId} />}
    </section>
    )}
      </div>
    </div>
  )
}

/**
 * ⭐ 24/09 — L'ATTENTE DE LA TRANSCRIPTION (handoff, « La machine lit ta
 *    copie »). Elle se relit seule toutes les quatre secondes : quand le texte
 *    est écrit en base, la page passe à la relecture. Toutes les trente
 *    secondes, elle relit aussi la page entière — un échec de la machine s'y
 *    lit alors, au lieu d'une attente sans fin.
 */
function useSondeTranscription(depotId: string) {
  const router = useRouter()
  useEffect(() => {
    let tour = 0
    let vivant = true
    const id = setInterval(async () => {
      tour++
      const r = await actionEtatDuDepot(depotId).catch(() => null)
      if (!vivant) return
      if ((r?.transcription ?? '').trim() !== '' || tour % 8 === 0) router.refresh()
    }, 4000)
    return () => { vivant = false; clearInterval(id) }
  }, [depotId, router])
}

/** La même sonde, sans écran : pour l'état d'échec, où le formulaire reste affiché. */
function SondeTranscription({ depotId }: { depotId: string }) {
  useSondeTranscription(depotId)
  return null
}

function AttenteTranscription({ depotId }: { depotId: string }) {
  useSondeTranscription(depotId)
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-10 text-center"
      aria-live="polite">
      <div className="h-20 w-16 rounded border border-bordure-bouton bg-parchemin-fonce" aria-hidden />
      <h2 className="font-titre text-2xl text-encre">La machine lit ta copie</h2>
      <p className="max-w-md text-sm text-encre-douce">
        Cela prend d’ordinaire une vingtaine de secondes. Ensuite, tu reliras le texte qu’elle a
        lu et tu corrigeras ce qu’elle a mal lu.
      </p>
      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-parchemin-fonce" aria-hidden>
        <div className="h-full w-1/3 animate-pulse rounded-full bg-bouton-plan" />
      </div>
      <p className="text-xs italic text-muet">Tu peux fermer l’écran : le travail continue.</p>
    </section>
  )
}

/** Une somme de contrôle stable, calculée sur ce que l'élève envoie vraiment. */
function sommeDe(img: ImageTraitee): string {
  return `${img.file.size}-${img.file.lastModified}-${img.nom}`
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⭐ C6-L4 — la copie TELLE QUE LA MACHINE L'A LUE, sans invitation à corriger :
 *    l'essai de Fragments n'a pas d'étape de contrôle (« manuscrit → photos →
 *    transcription », `06-` §1), et c'est cette lecture qui a été mesurée.
 *    Ni doutes à trancher, ni bouton : un élève qui « corrigerait » ici
 *    corrigerait une copie déjà jugée.
 */
function CopieLue({ vue, texte }: { vue: VueEleve; texte: string }) {
  const nbBlocs = blocs(texte).length
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Ta copie, telle que la machine l’a lue
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Tu n’as rien à corriger : c’est cette lecture qui a été mesurée, telle quelle.
        {vue.doutes && vue.doutes.length > 0 && (
          <> La machine a hésité sur {vue.doutes.length} passage{vue.doutes.length > 1 ? 's' : ''} ; ton
          professeur les voit.</>
        )}
      </p>
      <textarea
        value={texte} readOnly rows={20}
        className="mt-3 w-full rounded border border-bordure-bouton bg-parchemin p-3 font-mono text-sm
                   leading-relaxed text-encre"
      />
      <p className="mt-1 text-xs text-muet">
        {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
      </p>
    </section>
  )
}

/**
 * ÉTAPES 6 À 8 — RELIRE, CORRIGER, VALIDER. ⭐ 24/09, d'après le handoff
 * (« Relire ») éprouvé contre la base : les consignes EN TÊTE, la photo À CÔTÉ
 * du texte quand la place le permet (sinon une bascule « Mon texte / Ma
 * photo »), la liste des endroits où la machine a hésité — jusqu'à 24 en prod,
 * donc une liste qui défile, jamais un nombre de confiance.
 *
 * ⚠️ `@container` : la largeur vient de la PAGE, qui n'est pas la même dans les
 *    trois modules (Codex large, Aletheia et Fragments en `max-w-2xl`). Les deux
 *    colonnes suivent la place réelle, pas la taille de l'écran.
 */
function Relecture({ vue, confirmation, sujet, volet: voletChoisi, setVolet }: {
  vue: VueEleve; confirmation?: Confirmation; sujet: React.ReactNode
  volet: Volet; setVolet: (v: Volet) => void
}) {
  const [texte, setTexte] = useState(vue.transcription ?? '')
  const [etat, action, enCours] = useActionState(validerLaTranscription, null as Reponse | null)
  const [, demarrer] = useTransition()
  const [sauve, setSauve] = useState<string | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  const [coches, setCoches] = useState<boolean[]>(() => (confirmation?.points ?? []).map(() => false))
  // ⚠️ Revue du 24/09 : un id UNIQUE (deux épreuves peuvent être à l'écran), et le
  //    focus suit le geste — sur le titre de la confirmation à l'ouverture, sur
  //    « Valider ma copie » au retour ; sinon le bouton qui l'avait disparaissait.
  const idTitre = useId()
  const titreConfirmation = useRef<HTMLParagraphElement>(null)
  const boutonValider = useRef<HTMLButtonElement>(null)
  const nbBlocs = blocs(texte).length
  const photos = vue.photosLisibles
  const aDesPhotos = !vue.valide && photos.some((p) => p.url)
  // Validée, la copie ne se relit plus : ni bascule, ni sujet, le texte seul. Et
  // sans photo lisible, l'onglet « Ma copie » n'existe pas : on revient au texte.
  const volet: Volet = vue.valide || (voletChoisi === 'photo' && !aDesPhotos) ? 'travail' : voletChoisi
  const toutCoche = coches.every(Boolean)

  function enregistrer() {
    demarrer(async () => {
      // 3ᵉ revue : une panne de réseau ne fait plus tomber la page (voir `sansPanne`).
      try {
        const r = await actionEnregistrerLaTranscription(vue.depotId, texte)
        setSauve(r.ok ? 'Enregistré.' : r.message)
      } catch {
        setSauve(PANNE_RESEAU)
      }
    })
  }

  // ⭐ 24/09 — commentaire de Louis sur la planche : « s'assurer que l'élève navigue
  //    facilement entre sa copie et le texte retranscrit. Un toggle me semble une
  //    bonne option. » Étroit : trois onglets. Large (`@3xl`) : la photo est déjà À
  //    CÔTÉ du texte, il en reste deux — relire, ou le sujet.
  const surLeSujet = volet === 'sujet'
  const onglets: Onglet[] = [
    { cle: 'texte', libelle: 'Texte retranscrit', actif: volet === 'travail', choisir: () => setVolet('travail'),
      classe: aDesPhotos ? '@3xl:hidden' : undefined },
    ...(aDesPhotos ? [
      { cle: 'photo', libelle: 'Ma copie', actif: volet === 'photo', choisir: () => setVolet('photo'),
        classe: '@3xl:hidden' },
      { cle: 'relire', libelle: 'Ma copie et le texte', actif: !surLeSujet, choisir: () => setVolet('travail'),
        classe: 'hidden @3xl:block' },
    ] : []),
    { cle: 'sujet', libelle: 'Le sujet', actif: surLeSujet, choisir: () => setVolet('sujet') },
  ]

  return (
    <section className="@container">
      {!vue.valide && <Bascule onglets={onglets} />}
      {!vue.valide && <div className={surLeSujet ? '' : 'hidden'}>{sujet}</div>}

      <div className={`space-y-4 ${surLeSujet ? 'hidden' : ''}`}>
        {!vue.valide && (
          <div className={volet === 'photo' ? 'hidden @3xl:block' : ''}><ConsignesDeRelecture /></div>
        )}

        <div className={`grid gap-5 ${aDesPhotos ? '@3xl:grid-cols-[minmax(0,376px)_minmax(0,1fr)]' : ''}`}>
          {aDesPhotos && (
            <div className={`${volet === 'photo' ? '' : 'hidden'} @3xl:block`}>
              <PhotosDeLaCopie photos={photos} />
            </div>
          )}

          <div className={`${volet === 'photo' ? 'hidden' : ''} min-w-0 space-y-3 @3xl:block`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
                {vue.valide ? 'Ta copie' : 'Ce que la machine a lu'}
              </h2>
              {!vue.valide && <span className="font-ui text-xs text-muet">tu peux tout modifier</span>}
            </div>

            {/* `confiance_ocr` sert à ATTIRER L'ŒIL, jamais à afficher un score. */}
            {!vue.valide && vue.doutes && vue.doutes.length > 0 && (
              <div className="rounded-lg border border-attention bg-attention-teinte p-3">
                <p className="text-sm font-semibold text-encre">
                  Les endroits où la machine a hésité — vérifie-les sur ta copie :
                </p>
                <ul className="mt-2 max-h-56 list-disc space-y-1 overflow-y-auto pl-5 text-sm text-encre">
                  {vue.doutes.map((d, i) => (
                    <li key={i}>
                      « {d.extrait} »
                      {d.alternative ? <span className="text-encre-douce"> — ou peut-être « {d.alternative} »</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={soumettreSans(action)}>
              <input type="hidden" name="depot_id" value={vue.depotId} />
              {/* ⚠️ UN `<textarea>`, et rien d'autre : il préserve les retours à la
                  ligne et les lignes vides tels quels, de bout en bout. */}
              <textarea
                name="texte" value={texte} onChange={(e) => setTexte(e.target.value)}
                readOnly={vue.valide} rows={18} spellCheck
                className="w-full rounded-lg border border-bordure-bouton bg-surface p-3 font-corps text-[17px]
                           leading-[1.68] text-encre"
              />
              <p className="mt-1 font-ui text-xs text-muet">
                {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes
                · {texte.length} signes
              </p>
              {!vue.valide && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={enregistrer} className={SECONDAIRE}>
                    Enregistrer sans valider
                  </button>
                  {/* `min-w-48` : trop étroit, la phrase passe à la ligne ENTIÈRE (vu à 375 px :
                      un mot par ligne entre les deux boutons). */}
                  <span className="min-w-48 flex-1 text-sm italic text-muet">
                    Après validation, ton texte ne bouge plus.
                  </span>
                  {confirmation && !confirmer ? (
                    <button ref={boutonValider} type="button" disabled={enCours} className={VALIDER}
                      onClick={() => {
                        setConfirmer(true)
                        requestAnimationFrame(() => titreConfirmation.current?.focus())
                      }}>
                      Valider ma copie
                    </button>
                  ) : !confirmation ? (
                    <button type="submit" disabled={enCours} className={VALIDER}>
                      {enCours ? 'Validation…' : 'Valider ma copie'}
                    </button>
                  ) : null}
                </div>
              )}
              {!vue.valide && sauve && <p className="mt-2 text-sm text-muet">{sauve}</p>}

              {/* ⭐ 24/09 — LA CONFIRMATION (Codex) : un rappel, pas une garde. Rien de
                  ce qui est coché n'est enregistré ; la validation part par le MÊME
                  formulaire, avec le texte tel qu'il est à l'écran. */}
              {confirmation && confirmer && !vue.valide && (
                <div role="dialog" aria-labelledby={idTitre}
                  className="mt-4 space-y-3 rounded-xl border border-attention bg-surface-retrait p-4">
                  <p ref={titreConfirmation} id={idTitre} tabIndex={-1}
                    className="font-titre text-xl text-encre focus:outline-none">{confirmation.titre}</p>
                  <p className="text-sm text-encre">{confirmation.intro}</p>
                  <ul className="space-y-2">
                    {confirmation.points.map((point, i) => (
                      <li key={i}>
                        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-encre">
                          <input type="checkbox" checked={coches[i] ?? false}
                            onChange={(e) => setCoches((c) => c.map((x, k) => (k === i ? e.target.checked : x)))}
                            className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--bouton-valider)]" />
                          <span>{point}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" className={SECONDAIRE}
                      onClick={() => {
                        setConfirmer(false)
                        requestAnimationFrame(() => boutonValider.current?.focus())
                      }}>
                      {confirmation.retour}
                    </button>
                    <button type="submit" disabled={enCours || !toutCoche} className={VALIDER}>
                      {enCours ? 'Validation…' : confirmation.valider}
                    </button>
                  </div>
                </div>
              )}
              {etat && !etat.ok && <p className="mt-2 text-sm text-retard">{etat.message}</p>}
              {vue.valide && <p className="mt-2 text-sm text-ok">Copie validée. Tout est sauvegardé.</p>}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Les trois consignes de la relecture, EN TÊTE (handoff, « Relire »). ⚠️ Texte
 * élève : Louis le relit (22/09). Le point 2 est celui du handoff — la
 * relecture se fait en classe, devant le professeur, et la mesure porte sur la
 * version corrigée (`02-` §6.D) : ajouter une phrase y est permis.
 */
function ConsignesDeRelecture() {
  const CONSIGNES: Array<[string, string]> = [
    ['Corrige ce que la machine a mal lu.', 'C’est ce texte-là qui sera lu ensuite, pas ta photo.'],
    ['Tu peux ajouter du texte si tu veux :', 'finir une phrase, compléter une idée. C’est permis.'],
    ['Garde tes paragraphes tels que tu les as écrits :', 'une ligne vide entre deux paragraphes.'],
  ]
  return (
    <div className="rounded-xl border border-bordure bg-surface-retrait p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-marque text-xs uppercase tracking-[0.13em] text-muet">Avant de relire</p>
        <span className="rounded-full bg-attention-teinte px-2 py-0.5 font-ui text-xs text-attention">
          la machine se trompe parfois
        </span>
      </div>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {CONSIGNES.map(([fort, suite], i) => (
          <li key={i} className="flex gap-2 text-sm text-encre">
            <span className="font-titre text-xl leading-none text-bouton-plan">{i + 1}</span>
            <span><strong>{fort}</strong> {suite}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Ses photos, une page à la fois — de quoi relire son texte à côté de sa page. */
function PhotosDeLaCopie({ photos }: { photos: VueEleve['photosLisibles'] }) {
  const [i, setI] = useState(0)
  // Les dimensions de chaque photo, lues au chargement : une page tournée d'un
  // quart de tour se met en page sur SES dimensions tournées (revue du 24/09 :
  // `rotate()` ne change pas la mise en page, et la boîte coupait ses bords).
  const [tailles, setTailles] = useState<Record<number, { l: number; h: number }>>({})
  // 3ᵉ revue : une URL qui échoue (expirée, refusée) affichait l'icône cassée.
  const [ratees, setRatees] = useState<Record<number, boolean>>({})
  const p = photos[Math.min(i, photos.length - 1)]
  if (!p) return null
  const taille = tailles[i]
  const quart = p.rotation % 180 !== 0
  const mesurer = (img: HTMLImageElement | null) => {
    if (!img || !img.complete) return
    const { naturalWidth: l, naturalHeight: h } = img
    if (l > 0 && h > 0) setTailles((t) => (t[i] ? t : { ...t, [i]: { l, h } }))
  }
  const ratee = () => setRatees((r) => (r[i] ? r : { ...r, [i]: true }))
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">Ta copie</h2>
        <span className="font-ui text-xs text-muet">page {i + 1} sur {photos.length}</span>
      </div>
      <div className="flex min-h-[376px] items-center justify-center overflow-hidden rounded-lg border border-bordure-bouton bg-parchemin-fonce">
        {p.manquante ? (
          <p className="px-4 text-center text-sm italic text-attention">Page déclarée manquante</p>
        ) : p.url && !ratees[i] ? (
          quart && taille ? (
            // Une boîte aux proportions de la page TOURNÉE ; l'image y est posée à
            // plat (largeur ↔ hauteur échangées), puis tournée en son centre.
            <a href={p.url} target="_blank" rel="noopener noreferrer" title="Ouvrir la photo en grand"
              className="relative block w-full [container-type:size]"
              style={{ aspectRatio: `${taille.h} / ${taille.l}`, maxWidth: `calc(70vh * ${taille.h / taille.l})` }}>
              <img src={p.url} alt={`Ta page ${i + 1}`} onError={ratee}
                className="absolute left-1/2 top-1/2 max-w-none object-contain"
                style={{ width: '100cqh', height: '100cqw',
                  transform: `translate(-50%, -50%) rotate(${p.rotation}deg)` }} />
            </a>
          ) : (
            <a href={p.url} target="_blank" rel="noopener noreferrer" title="Ouvrir la photo en grand">
              {/* 3ᵉ revue : une photo déjà chargée AVANT l'hydratation ne déclenche plus
                  `onLoad` — le `ref` la mesure alors à la pose. */}
              <img ref={mesurer} src={p.url} alt={`Ta page ${i + 1}`} onError={ratee}
                onLoad={(e) => mesurer(e.currentTarget)}
                style={{ transform: `rotate(${p.rotation}deg)` }}
                className="max-h-[70vh] w-full object-contain" />
            </a>
          )
        ) : (
          <p className="px-4 text-center text-sm italic text-muet">Cette photo n’a pas pu s’afficher.</p>
        )}
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2">
          <button type="button" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}
            className={`${SECONDAIRE} flex-1`}>← Page précédente</button>
          <button type="button" onClick={() => setI((x) => Math.min(photos.length - 1, x + 1))}
            disabled={i >= photos.length - 1} className={`${SECONDAIRE} flex-1`}>Page suivante →</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ⭐ 24/09 — LES ÉTAPES DE LA VÉRIFICATION (épreuve de Codex, porte ouverte)
// ─────────────────────────────────────────────────────────────────────────────

/** Les faits que lit `utils/examens/etapes-epreuve.ts` — tous posés par le serveur. */
function faitsDeLEpreuve(vue: VueEleve): FaitsDeLEpreuve {
  return {
    transcrit: (vue.transcription ?? '').trim() !== '',
    valide: vue.valide,
    // Un geste servi SANS rien à demander n'est pas une étape : l'écran d'hier
    // ne rendait rien pour lui non plus.
    credenceServie: vue.credence.servie && vue.credence.cas.length > 0,
    credenceFaite: vue.gestes.credenceFaite,
    jugerServi: vue.seJuger.servie && vue.seJuger.questions.length > 0,
    jugerFait: vue.gestes.jugerFait,
    confianceServie: vue.confiance.servie && vue.confiance.competences.length > 0,
    confianceFaite: vue.gestes.confianceFaite,
  }
}

/**
 * ⚠️ Revue du 24/09 — QUAND LA PAGE TOURNE (validation, « se juger » enregistré,
 *    confiance enregistrée), le bouton qui avait le focus disparaît et l'élève
 *    reste à la hauteur de ce bouton, sous la nouvelle page. On ramène le fil
 *    sous l'en-tête s'il est passé au-dessus, et le focus va au titre de la
 *    nouvelle page. Rien au premier rendu : une page qu'on ouvre ne saute pas.
 */
function SuiviDeLEtape({ courante, depotId }: { courante: EtapeEpreuve; depotId: string }) {
  const precedente = useRef(courante)
  const haut = useHauteurEntete()
  useEffect(() => {
    if (precedente.current === courante) return
    precedente.current = courante
    requestAnimationFrame(() => {
      ramenerSousLEntete(document.getElementById(`fil-${depotId}`), haut)
      document.getElementById(`etape-${depotId}`)?.focus({ preventScroll: true })
    })
  }, [courante, depotId, haut])
  return null
}

/** Le fil : une barre par étape — faite (vert), en cours (ocre), à venir (bordure). */
function FilDesEtapes({ suite, courante, depotId }: {
  suite: EtapeDuFil[]; courante: EtapeEpreuve; depotId: string
}) {
  const ici = courante === 'fini' ? suite.length : suite.findIndex((e) => e.etape === courante)
  return (
    <ol id={`fil-${depotId}`} aria-label="Les étapes" className="flex gap-1.5">
      {suite.map((e, i) => {
        const faite = i < ici
        const enCours = i === ici
        return (
          <li key={e.etape} className="min-w-0 flex-1" aria-current={enCours ? 'step' : undefined}>
            <div className={`h-[5px] rounded-full ${faite ? 'bg-bouton-valider' : enCours ? 'bg-bouton-plan' : 'bg-bordure'}`} />
            <p className={`mt-1.5 font-ui text-[13px] leading-tight ${faite
              ? 'text-ok' : enCours ? 'font-semibold text-encre' : 'text-muet'}`}>
              {faite ? '✓ ' : `${i + 1}. `}{e.libelle}
              {faite && <span className="sr-only"> (fait)</span>}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/** Le sur-titre de la page et son rang — « 3 / 4 », comme les pages des exercices. */
function EnTeteDEtape({ titre, rang, id }: {
  titre: string; rang: { rang: number; total: number } | null; id: string
}) {
  return (
    <div className="flex items-baseline gap-3">
      {/* `tabIndex={-1}` : c'est là que va le focus quand la page tourne. */}
      <h2 id={id} tabIndex={-1}
        className="font-marque text-[11px] font-semibold uppercase tracking-[0.13em] text-muet focus:outline-none">
        {titre}
      </h2>
      {rang && (
        <span className="ml-auto shrink-0 rounded-full bg-pigment-teinte px-2.5 py-1 font-ui text-[11.5px]
                         font-semibold tabular-nums text-pigment">
          {rang.rang} / {rang.total}
        </span>
      )}
    </div>
  )
}

/**
 * Après la validation : UNE tâche par écran (« se juger », puis la confiance),
 * la copie validée à un appui (« Ma copie »), puis la fin. Chaque geste
 * enregistré revalide la page : c'est le serveur qui fait tourner la page.
 */
function ApresLaValidation({ vue, faits, suite, courante }: {
  vue: VueEleve; faits: FaitsDeLEpreuve; suite: EtapeDuFil[]; courante: EtapeEpreuve
}) {
  const [voirCopie, setVoirCopie] = useState(false)
  if (courante === 'fini') return <FinDeLEpreuve vue={vue} />
  if (courante === 'deposer' || courante === 'relire') return null
  const libelle = LIBELLES_ETAPES[courante]
  const continuer = resteUneEtapeApres(faits, courante)
  const onglets: Onglet[] = [
    { cle: 'etape', libelle, actif: !voirCopie, choisir: () => setVoirCopie(false) },
    // ⚠️ Revue du 24/09 : « Ma copie » désignait la PHOTO à la relecture, et la
    //    confirmation appelle « ma copie papier » la feuille. Ici, c'est le texte validé.
    { cle: 'copie', libelle: 'Mon texte', actif: voirCopie, choisir: () => setVoirCopie(true) },
  ]
  return (
    <div>
      <Bascule onglets={onglets} />
      <div className={voirCopie ? 'hidden' : ''}>
        {courante === 'credence' ? (
          // Jamais pour l'essai d'examen (sans cran) : l'écran d'hier, tel quel.
          <Credence vue={vue} />
        ) : (
          <section className="space-y-4 rounded-xl border border-bordure bg-surface p-4 sm:p-5">
            <EnTeteDEtape titre={libelle} rang={rangDeLEtape(suite, courante)} id={`etape-${vue.depotId}`} />
            {courante === 'juger'
              ? <EtapeSeJuger key="juger" vue={vue} continuer={continuer} />
              : <EtapeConfiance key="confiance" vue={vue} continuer={continuer} />}
          </section>
        )}
      </div>
      <div className={voirCopie ? '' : 'hidden'}><CopieValidee vue={vue} /></div>
    </div>
  )
}

/** Un choix de la liste FERMÉE : un bouton de 44 px, comme les gestes des exercices. */
function Choix({ name, value, coche, choisir, children }: {
  name: string; value: string; coche: boolean; choisir: () => void; children: React.ReactNode
}) {
  return (
    <label className={`inline-flex min-h-11 cursor-pointer items-center rounded border px-3 py-1.5 font-ui text-sm
      has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2
      has-[:focus-visible]:outline-bouton-plan ${coche
        ? 'border-pigment bg-pigment-teinte font-semibold text-pigment'
        : 'border-bordure-bouton bg-surface text-encre-douce'}`}>
      <input type="radio" name={name} value={value} checked={coche} onChange={choisir}
        className="sr-only" />
      {children}
    </label>
  )
}

/** Étape 9 — « se juger » : deux questions, jamais trois, et une liste fermée de réponses. */
function EtapeSeJuger({ vue, continuer }: { vue: VueEleve; continuer: boolean }) {
  const [etat, action, enCours] = useActionState(seJuger, null as Reponse | null)
  const [choix, setChoix] = useState<Record<string, string>>({})
  const questions = vue.seJuger.questions
  const complet = questions.every((q) => choix[q.observable_code])
  return (
    <form onSubmit={soumettreSans(action)} className="space-y-5">
      <input type="hidden" name="depot_id" value={vue.depotId} />
      <p className="text-encre-douce">
        Ta copie est validée : elle ne bouge plus. Relis-la dans « Mon texte » si tu veux, puis
        réponds {questions.length > 1 ? `à ces ${enLettres(questions.length)} questions` : 'à cette question'}.
      </p>
      {questions.map((q) => (
        <fieldset key={q.observable_code}>
          <legend className="font-titre text-[20px] leading-snug text-encre">{q.question}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.reponses.map((r) => (
              <Choix key={r} name={`q:${q.observable_code}`} value={r} coche={choix[q.observable_code] === r}
                choisir={() => setChoix((c) => ({ ...c, [q.observable_code]: r }))}>
                {r}
              </Choix>
            ))}
          </div>
        </fieldset>
      ))}
      <button type="submit" disabled={enCours || !complet} className={VALIDER}>
        {enCours ? 'Enregistrement…' : continuer ? 'Enregistrer et continuer' : 'Enregistrer et terminer'}
      </button>
      {etat && !etat.ok && <p className="text-sm text-retard">{etat.message}</p>}
    </form>
  )
}

/**
 * Étape 10 — la confiance de remise : UNE valeur par compétence. La question est
 * celle que Louis a récrite pour les exercices (05/09), reprise telle quelle.
 */
function EtapeConfiance({ vue, continuer }: { vue: VueEleve; continuer: boolean }) {
  const [etat, action, enCours] = useActionState(confianceRemise, null as Reponse | null)
  const [choix, setChoix] = useState<Record<string, string>>({})
  const competences = vue.confiance.competences
  const complet = competences.every((c) => choix[c])
  const plusieurs = competences.length > 1
  return (
    <form onSubmit={soumettreSans(action)} className="space-y-5">
      <input type="hidden" name="depot_id" value={vue.depotId} />
      <div>
        <h3 className="font-titre text-[22px] font-semibold leading-tight text-encre">
          {plusieurs
            ? 'Pour chacune des compétences suivantes, quel degré de confiance as-tu dans ton travail ?'
            : 'Quel degré de confiance as-tu dans ton travail ?'}
        </h3>
        <p className="mt-2 text-sm text-encre-douce">
          {plusieurs
            ? 'Une réponse par compétence. C’est l’affaire de quelques secondes.'
            : 'C’est l’affaire de quelques secondes.'}
        </p>
      </div>
      {competences.map((c) => (
        <fieldset key={c}>
          <legend className="text-encre">{NOM_COMPETENCE[c as keyof typeof NOM_COMPETENCE] ?? c}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {/* Le libellé est LIBRE ; la valeur stockée est celle de l'enum. */}
            {Object.entries(vue.libellesConfiance).map(([valeur, libelle]) => (
              <Choix key={valeur} name={`c:${c}`} value={valeur} coche={choix[c] === valeur}
                choisir={() => setChoix((x) => ({ ...x, [c]: valeur }))}>
                {libelle}
              </Choix>
            ))}
          </div>
        </fieldset>
      ))}
      <div>
        <button type="submit" disabled={enCours || !complet} className={VALIDER}>
          {enCours ? 'Enregistrement…' : continuer ? 'Enregistrer et continuer' : 'Enregistrer et terminer'}
        </button>
        {/* Le ton reste NEUTRE, comme dans les exercices : ce n'est pas un jugement. */}
        <p className="mt-2 text-xs text-muet">Ça ne compte pas dans ton travail.</p>
      </div>
      {etat && !etat.ok && <p className="text-sm text-retard">{etat.message}</p>}
    </form>
  )
}

/** Le texte validé, en lecture seule — le volet « Mon texte » après la validation. */
function CopieValidee({ vue }: { vue: VueEleve }) {
  const texte = vue.transcription ?? ''
  const n = blocs(texte).length
  return (
    <section className="space-y-2 text-left">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">Ton texte</h2>
      <textarea value={texte} readOnly rows={18} aria-label="Ton texte validé"
        className="w-full rounded-lg border border-bordure-bouton bg-surface p-3 font-corps text-[17px]
                   leading-[1.68] text-encre" />
      <p className="font-ui text-xs text-muet">
        {n} paragraphe{n > 1 ? 's' : ''} · {texte.length} signes
      </p>
      <p className="text-sm text-ok">Copie validée. Tout est sauvegardé.</p>
    </section>
  )
}

/** La fin : la copie est remise ; ce qui reste à venir, et où le trouver. */
function FinDeLEpreuve({ vue }: { vue: VueEleve }) {
  const [voir, setVoir] = useState(false)
  const avecGestes = vue.gestes.jugerFait || vue.gestes.confianceFaite || vue.gestes.credenceFaite
  return (
    <section className="flex flex-col items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-8
                        text-center sm:px-6">
      <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-ok-teinte
                                   text-2xl text-ok">✓</span>
      <h2 id={`etape-${vue.depotId}`} tabIndex={-1} className="font-titre text-2xl text-encre focus:outline-none">
        Ta copie est remise
      </h2>
      <p className="max-w-md text-encre-douce">
        {avecGestes ? 'Tes réponses sont enregistrées. ' : ''}
        {vue.retourPublie
          ? 'Ton retour est publié : il est juste en dessous.'
          : 'Tu retrouveras ta copie et son retour dans l’onglet Examens, quand ton professeur l’aura publié.'}
      </p>
      <button type="button" onClick={() => setVoir((v) => !v)} aria-expanded={voir}
        className="min-h-11 font-ui text-sm text-encre-douce underline">
        {voir ? 'Masquer mon texte' : 'Revoir mon texte'}
      </button>
      {voir && <div className="w-full"><CopieValidee vue={vue} /></div>}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ⭐ 24/09 — L'ÉPREUVE MINUTÉE, AVANT L'OUVERTURE DU DÉPÔT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'épreuve est lancée : le sujet, les consignes pratiques, et l'heure où le
 * dépôt s'ouvrira (`02-` §6.D, étape 2 : « il apparaît aussi à l'écran de la
 * tablette »). Le rappel de lisibilité est ICI, avant l'écriture — c'est là
 * qu'il sert.
 */
function EpreuveEnCours({ vue }: { vue: VueEleve }) {
  const e = vue.epreuve!
  const heure = e.ouverture ? heureMurale(Date.parse(e.ouverture), e.fuseau) : null
  return (
    <div className="space-y-5">
      <div className="rounded-xl border-l-4 border-l-bouton-plan bg-surface-retrait p-4">
        <p className="font-marque text-xs uppercase tracking-[0.15em] text-muet">L’épreuve est en cours</p>
        {heure && <p className="mt-1 text-encre">{avecHeure(TEXTES_EPREUVE.eleveEnCours, heure)}</p>}
      </div>
      <SujetEtConsignes vue={vue} />
      <SondeDeLEpreuve depotId={vue.depotId} lancee ouverture={e.ouverture} />
    </div>
  )
}

function ConsignesPratiques({ texte }: { texte: string }) {
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">Consignes</h2>
      <p className="mt-2 whitespace-pre-wrap text-encre">{texte}</p>
    </section>
  )
}

/**
 * La page se relit seule toutes les quinze secondes — et c'est ce sondage qui
 * OUVRE le dépôt le plus souvent : la première tablette qui passe après l'heure
 * ouvre la classe entière (`utils/examens/epreuve-serveur.ts`). Quand l'état
 * change (lancée, ouverte, close), la page se redessine sans rien perdre.
 */
function SondeDeLEpreuve({ depotId, lancee, ouverture }: {
  depotId: string; lancee: boolean; ouverture: string | null
}) {
  const router = useRouter()
  useEffect(() => {
    let vivant = true
    const id = setInterval(async () => {
      const r = await actionEtatDeMonEpreuve(depotId).catch(() => null)
      if (!vivant || !r) return
      // ⚠️ Revue du 24/09 : des INSTANTS, pas des chaînes — PostgREST rend `…+00:00`,
      //    `toISOString()` rend `….000Z` : la page se rechargeait toutes les 15 s.
      const ouvertureChangee = (r.ouverture ?? null) !== (ouverture ?? null)
        && Date.parse(r.ouverture ?? '') !== Date.parse(ouverture ?? '')
      if (r.lancee !== lancee || r.ouvert || r.clos || (lancee && ouvertureChangee)) router.refresh()
    }, 15_000)
    return () => { vivant = false; clearInterval(id) }
  }, [depotId, lancee, ouverture, router])
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCRAN D'HIER — DÉPÔT ET RELECTURE, TELS QU'AU 23/09.
// ⭐ 24/09 — gardé À L'OCTET pour Aletheia, l'essai de Fragments et Codex porte
//    fermée : l'écran refait (ci-dessus) naît derrière `epreuve_minutee_actif`,
//    posé par la seule page de Codex (« toute fonctionnalité nouvelle naît
//    derrière un flag OFF », `AGENTS.md`). À retirer le jour où la refonte vaudra
//    pour les trois modules — c'est une décision de Louis, pas de ce lot.
// ─────────────────────────────────────────────────────────────────────────────

function DepotEtRelectureHier({ vue }: { vue: VueEleve }) {
  const [pages, setPages] = useState<Page[]>([])
  const [envoi, setEnvoi] = useState(false)
  const [progression, setProgression] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [transcription, setTranscription] = useState(vue.transcription ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  const dejaTranscrit = (vue.transcription ?? '').trim() !== ''

  async function ajouter(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (fichiers.length === 0) return
    if (pages.length + fichiers.length > vue.pagesMax) {
      setErreur(`Maximum ${vue.pagesMax} pages.`)
      return
    }
    setErreur(null)
    try {
      const neuves: Page[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement de la page ${pages.length + i + 1}…`)
        // `traiterImage` lit l'EXIF sur l'original PUIS le supprime à la
        // compression (`06-` §7, point 4). ⚠️ On n'en tire AUCUN signal : le
        // seuil « photo suspecte » de Fragments ne se recopie pas ici (piège 11).
        neuves.push({ image: await traiterImage(fichiers[i]), rotation: 0, manquante: false })
      }
      setPages((p) => [...p, ...neuves])
    } catch {
      setErreur('Erreur au traitement des photos. Réessaie.')
    } finally {
      setProgression('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  /** « Ton écran doit pouvoir dire qu'une page manque, VRAIMENT » (piège 12). */
  function declarerPageManquante() {
    setPages((p) => [...p, { image: null, rotation: 0, manquante: true }])
  }

  function retirer(i: number) {
    setPages((p) => {
      const img = p[i].image
      if (img) libererPreview(img.previewUrl)
      return p.filter((_, k) => k !== i)
    })
  }

  function deplacer(i: number, delta: number) {
    setPages((p) => {
      const j = i + delta
      if (j < 0 || j >= p.length) return p
      const n = [...p]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }

  function tourner(i: number) {
    setPages((p) => p.map((x, k) => (k === i ? { ...x, rotation: auQuartDeTour(x.rotation + 90) } : x)))
  }

  async function envoyer() {
    if (pages.length === 0) { setErreur('Ajoute au moins une page.'); return }
    if (pages.every((p) => p.manquante)) {
      setErreur('Toutes les pages sont déclarées manquantes : il n’y a rien à transcrire.')
      return
    }
    setEnvoi(true)
    setErreur(null)
    try {
      const aDeposer = pages.filter((p) => !p.manquante)
      setProgression('Préparation…')
      const prep = await actionPreparerLesPhotos(vue.depotId, aDeposer.length)
      if (!prep.ok) { setErreur(prep.message); setEnvoi(false); return }

      const supabase = createClient()
      const chemins: string[] = []
      for (let i = 0; i < aDeposer.length; i++) {
        setProgression(`Envoi de la page ${i + 1}/${aDeposer.length}…`)
        const { path, token } = prep.uploads[i]
        const { error } = await supabase.storage.from('codex')
          .uploadToSignedUrl(path, token, aDeposer[i].image!.file, { contentType: 'image/jpeg' })
        if (error) { setErreur(error.message); setEnvoi(false); return }
        chemins.push(path)
      }

      // La forme que la garde exige — fabriquée en UN SEUL endroit
      // (`utils/passation/photos.ts`), jamais à la main dans un écran.
      let k = 0
      const photos: Photo[] = pages.map((p, i) => {
        if (p.manquante) return marqueurPageManquante(i + 1)
        const photo = photoDeposee(i + 1, chemins[k], sommeDe(p.image!), p.rotation)
        k++
        return photo
      })

      setProgression('Transcription en cours…')
      const r = await actionEnvoyerLesPhotos(vue.depotId, photos)
      if (!r.ok) { setErreur(r.message); setEnvoi(false); return }
      setProgression(r.message)
      // Le rechargement va chercher la transcription écrite en base : l'écran
      // n'invente pas le texte, il le lit là où la mesure le lira.
      window.location.reload()
    } finally {
      setEnvoi(false)
    }
  }

  if (vue.sansRelecture && vue.valide) {
    return <CopieLue vue={vue} texte={transcription} />
  }
  if (dejaTranscrit || vue.valide) {
    return <RelectureHier vue={vue} texte={transcription} setTexte={setTranscription} />
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Photographie ta copie
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Une photo par page, dans l’ordre. Si une page est illisible ou absente, dis-le : la copie
        gardera son compte de pages.
      </p>

      <ol className="mt-4 space-y-2">
        {pages.map((p, i) => (
          <li key={i} className="flex items-center gap-3 rounded border border-bordure-bouton p-2">
            <span className="w-6 text-center font-cinzel text-muet">{i + 1}</span>
            {p.manquante ? (
              <span className="flex-1 text-sm italic text-attention">Page déclarée manquante</span>
            ) : (
              <>
                <img
                  src={p.image!.previewUrl} alt={`Page ${i + 1}`}
                  style={{ transform: `rotate(${p.rotation}deg)` }}
                  className="h-16 w-16 object-cover"
                />
                <button type="button" onClick={() => tourner(i)}
                  className="text-sm text-encre-douce underline">Tourner</button>
              </>
            )}
            <button type="button" onClick={() => deplacer(i, -1)} disabled={i === 0}
              className="text-sm text-encre-douce disabled:opacity-30">↑</button>
            <button type="button" onClick={() => deplacer(i, 1)} disabled={i === pages.length - 1}
              className="text-sm text-encre-douce disabled:opacity-30">↓</button>
            <button type="button" onClick={() => retirer(i)}
              className="text-sm text-retard underline">Retirer</button>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/*" multiple capture="environment"
          onChange={ajouter} disabled={envoi} className="text-sm" />
        <button type="button" onClick={declarerPageManquante} disabled={envoi}
          className="rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce">
          Une page manque
        </button>
        <button type="button" onClick={envoyer} disabled={envoi || pages.length === 0}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {envoi ? 'Envoi…' : 'Envoyer'}
        </button>
      </div>
      {progression && <p className="mt-2 text-sm text-muet">{progression}</p>}
      {erreur && <p className="mt-2 text-sm text-retard">{erreur}</p>}
      {vue.attente.some((a) => a.echec_definitif) && (
        <Encart ton="attention">
          <p className="text-sm text-encre">
            La transcription n’a pas abouti. <strong>Préviens ton professeur</strong> : ta copie
            papier reste la preuve, rien n’est perdu.
          </p>
        </Encart>
      )}
    </section>
  )
}


function RelectureHier({
  vue, texte, setTexte,
}: { vue: VueEleve; texte: string; setTexte: (t: string) => void }) {
  const [etat, action, enCours] = useActionState(actionValiderLaTranscription, null as Reponse | null)
  const [, demarrer] = useTransition()
  const [sauve, setSauve] = useState<string | null>(null)
  const nbBlocs = blocs(texte).length

  function enregistrer() {
    demarrer(async () => {
      const r = await actionEnregistrerLaTranscription(vue.depotId, texte)
      setSauve(r.ok ? 'Enregistré.' : r.message)
    })
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Relis et corrige
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        La machine a lu ta copie. <strong>Corrige ce qu’elle a mal lu</strong> — c’est ce texte-là
        qui sera lu ensuite. Garde tes paragraphes tels que tu les as écrits.
      </p>

      {/* `confiance_ocr` sert à ATTIRER L'ŒIL, jamais à afficher un score. */}
      {vue.doutes && vue.doutes.length > 0 && (
        <div className="mt-3 rounded border border-attention bg-attention-teinte p-3">
          <p className="text-sm font-semibold text-encre">Ce que la machine a eu du mal à lire :</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-encre">
            {vue.doutes.map((d, i) => (
              <li key={i}>
                « {d.extrait} »
                {d.alternative ? <span className="text-encre-douce"> — ou peut-être « {d.alternative} »</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={action} className="mt-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {/* ⚠️ UN `<textarea>`, et rien d'autre : il préserve les retours à la
            ligne et les lignes vides tels quels, de bout en bout. */}
        <textarea
          name="texte" value={texte} onChange={(e) => setTexte(e.target.value)}
          readOnly={vue.valide} rows={20} spellCheck
          className="w-full rounded border border-bordure-bouton bg-parchemin p-3 font-mono text-sm
                     leading-relaxed text-encre"
        />
        <p className="mt-1 text-xs text-muet">
          {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
        </p>
        {!vue.valide && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={enregistrer}
              className="rounded border border-bordure-bouton px-3 py-1 text-sm text-encre-douce">
              Enregistrer sans valider
            </button>
            <button type="submit" disabled={enCours}
              className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
              {enCours ? 'Validation…' : 'Valider ma copie'}
            </button>
            {sauve && <span className="text-sm text-muet">{sauve}</span>}
            {etat && <span className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</span>}
          </div>
        )}
        {vue.valide && <p className="mt-2 text-sm text-ok">Copie validée. Tout est sauvegardé.</p>}
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉLÈVE EXEMPTÉ — au clavier, et le clavier a sa contrepartie
// ─────────────────────────────────────────────────────────────────────────────

function RedactionClavier({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionValiderLaSaisieClavier, null as Reponse | null)
  const [texte, setTexte] = useState(vue.texteClavier ?? '')
  const nbBlocs = blocs(texte).length

  /**
   * « Les champs de rédaction REFUSENT LE COLLAGE — raccourci clavier,
   * glisser-déposer, menu contextuel », et « chaque tentative bloquée est
   * journalisée » (`06-` §1 ; piège 37). ⚠️ Réserve écrite noir sur blanc dans
   * la source : le blocage n'est QUE côté navigateur.
   * ⚠️ En classe, la trace n'alimente PAS le faisceau, « qui ne regarde que la
   *    maison » (`06-` §6) : aucun signalement d'intégrité n'est levé. ⭐ Mais
   *    elle est JOURNALISÉE SUR LE DÉPÔT et RAPPORTÉE AU PROFESSEUR sur son
   *    écran de correction (décision de Louis, 22/08) — informer n'est pas
   *    accuser.
   * ⚠️ Le moyen est TYPÉ : il voyage jusqu'à une garde en base qui ferme le
   *    domaine aux trois vecteurs que la source nomme.
   */
  function refuserLeCollage(moyen: MoyenDeCollage) {
    return (e: React.SyntheticEvent) => {
      e.preventDefault()
      void actionCollageBloque(vue.depotId, moyen)
    }
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Rédige ta copie
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Tu écris au clavier. <strong>Le collage est désactivé</strong> : ce texte doit être le tien.
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        <textarea
          name="texte" value={texte} onChange={(e) => setTexte(e.target.value)}
          readOnly={vue.valide} rows={22}
          // ⚠️ EXPLICITE, et pas laissé au défaut du navigateur : « le correcteur
          //    orthographique du navigateur RESTE ACTIF — il n'est pas désactivé »
          //    (`06-` §1) est une règle de source, et une règle nommée ne se confie
          //    pas à un défaut d'implémentation qui peut changer.
          spellCheck
          onPaste={refuserLeCollage('raccourci')}
          onDrop={refuserLeCollage('glisser-deposer')}
          onContextMenu={refuserLeCollage('menu-contextuel')}
          className="w-full rounded border border-bordure-bouton bg-parchemin p-3 font-mono text-sm
                     leading-relaxed text-encre"
        />
        <p className="mt-1 text-xs text-muet">
          {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
        </p>
        {!vue.valide && (
          <button type="submit" disabled={enCours}
            className="mt-3 rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
            {enCours ? 'Validation…' : 'Valider ma copie'}
          </button>
        )}
        {etat && <p className={`mt-2 text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPES 9 ET 10 — LES DEUX DRAPEAUX, ET CE QU'ILS OUVRENT
// ─────────────────────────────────────────────────────────────────────────────

function ApresValidation({ vue }: { vue: VueEleve }) {
  return (
    <>
      {vue.credence.servie && <Credence vue={vue} />}
      {vue.seJuger.servie && <SeJuger vue={vue} />}
      {vue.confiance.servie && <ConfianceRemise vue={vue} />}
    </>
  )
}

function SeJuger({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionSeJuger, null as Reponse | null)
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Te juger</h2>
      <form action={action} className="mt-3 space-y-4">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {vue.seJuger.questions.map((q) => (
          <fieldset key={q.observable_code}>
            <legend className="text-sm text-encre">{q.question}</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {q.reponses.map((r) => (
                <label key={r} className="flex items-center gap-1 text-sm text-encre-douce">
                  <input type="radio" name={`q:${q.observable_code}`} value={r} required />
                  {r}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" disabled={enCours}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Enregistrer'}
        </button>
        {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

function ConfianceRemise({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionConfianceRemise, null as Reponse | null)
  if (vue.confiance.competences.length === 0) return null
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Comment te sens-tu ?
      </h2>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {/* UNE VALEUR PAR COMPÉTENCE, JAMAIS UN SCALAIRE — « parce qu'une
            passation en classe en mesure trois ou quatre » (`07-` §1.1). */}
        {vue.confiance.competences.map((c) => (
          <fieldset key={c}>
            <legend className="text-sm capitalize text-encre">{c}</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {Object.entries(vue.libellesConfiance).map(([valeur, libelle]) => (
                <label key={valeur} className="flex items-center gap-1 text-sm text-encre-douce">
                  {/* Le libellé est LIBRE ; la valeur stockée est celle de l'enum. */}
                  <input type="radio" name={`c:${c}`} value={valeur} required />
                  {libelle}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="submit" disabled={enCours}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Enregistrer'}
        </button>
        {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}

/**
 * LA CRÉDENCE — UNE PAR DIAGNOSTIC, DONC DEUX SUR UNE PAIRE.
 *
 * ⭐ Corrigé le 22/08 : l'écran n'en servait qu'UNE, avec les candidats du
 *    PREMIER cas quoi qu'il arrive. Sur une paire — « un exercice EN DEUX
 *    TEMPS », `02-` §2.3.1 a — la seconde crédence n'existait donc pas, et
 *    c'est elle qui porte la mesure : « l'ÉCART entre les deux dit si la
 *    confiance s'est déplacée juste après la correction ».
 *
 * ⚠️ CHAQUE CAS SERT SES PROPRES CANDIDATS : le second temps est « un cas NEUF
 *    de la même famille », et lui resservir les candidats du premier ferait de
 *    la seconde crédence une copie de la première.
 */
function Credence({ vue }: { vue: VueEleve }) {
  const [etat, action, enCours] = useActionState(actionCredence, null as Reponse | null)
  const jetons = vue.credence.forme === 'jetons_sur_100'
  const cas = vue.credence.cas
  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Quelle chance donnes-tu à ta réponse ?
      </h2>
      {vue.credence.paire && (
        <p className="mt-2 text-sm text-encre-douce">
          Cet exercice est une <strong>paire</strong> : une chance par cas, avant de savoir si tu as
          raison.
        </p>
      )}
      <form action={action} className="mt-3 space-y-4">
        <input type="hidden" name="depot_id" value={vue.depotId} />
        {cas.map((c) => (
          <fieldset key={c.ordre} className="space-y-2 rounded border border-bordure-bouton p-3">
            {cas.length > 1 && (
              <legend className="px-1 font-cinzel text-xs uppercase tracking-wide text-muet-clair">
                Cas {c.ordre}
              </legend>
            )}
            {cas.length > 1 && c.consigne && (
              <p className="text-xs text-muet">{c.consigne}</p>
            )}
            {jetons ? (
              <>
                <p className="text-sm text-encre-douce">
                  Répartis 100 jetons entre ces quatre réponses.
                </p>
                {c.candidats.map((cand) => (
                  <label key={cand} className="flex items-center gap-2 text-sm text-encre">
                    <input type="number" name={`j:${c.ordre}:${cand}`} min={0} max={100}
                      defaultValue={25}
                      className="w-20 rounded border border-bordure-bouton bg-parchemin p-1" />
                    {cand}
                  </label>
                ))}
              </>
            ) : (
              <label className="flex items-center gap-2 text-sm text-encre">
                <input type="number" name={`pourcentage:${c.ordre}`} min={0} max={100}
                  defaultValue={50}
                  className="w-20 rounded border border-bordure-bouton bg-parchemin p-1" />
                % de chances que ta réponse soit juste
              </label>
            )}
          </fieldset>
        ))}
        <button type="submit" disabled={enCours}
          className="rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40">
          {enCours ? '…' : 'Enregistrer'}
        </button>
        {etat && <p className={`text-sm ${etat.ok ? 'text-ok' : 'text-retard'}`}>{etat.message}</p>}
      </form>
    </section>
  )
}
