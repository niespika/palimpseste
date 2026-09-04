'use client'
// ============================================================================
// ITEM 77 — L'ÉLÈVE DÉSIGNE DANS LE MATÉRIAU, au lieu de recopier.
// ----------------------------------------------------------------------------
// ⭐ LA RÈGLE (`02-` §5, v5.8) : aux crans 4, 7 et 9, l'élève SÉLECTIONNE le
//    passage puis dit ce qui cloche. *« Au moins on est sûr de sa réponse, et il
//    n'y a aucune possibilité de se dire "ok, mais j'ai peut-être mal compris ce
//    qu'il voulait dire" »* — Louis, 27/08.
//
// ⛔⛔ « RIEN À SIGNALER » EST UNE RÉPONSE, ET IL EST AUSSI FACILE À DONNER
//    QU'UNE SÉLECTION. *« Les élèves peuvent se sentir obligés de le faire »* :
//    une aire de sélection vide qui attend est une INVITATION, et un élève qui
//    ne trouve rien surlignerait au hasard plutôt que de rendre blanc —
//    **l'exercice mesurerait alors sa docilité**. Le bouton est donc au même
//    rang visuel que la sélection, pas en petit dessous.
//
// ⚠️ ET IL N'Y A QU'UN SEUL BOUTON, DÉLIBÉRÉMENT. Un « effacer ma sélection »
//    à côté ferait le MÊME geste en disant autre chose — il enregistrerait
//    « rien à surligner », qui EST une réponse. *Se raviser, c'est
//    re-sélectionner ; dire qu'il n'y a rien, c'est répondre. Deux boutons pour
//    un seul écrit auraient appris à l'élève que les deux se valent.*
//
// ⛔⛔ ET L'ÉCRAN NE BASCULE PAS — LE JUGEMENT BASCULE. La sélection est offerte
//    aux trois crans et à TOUS leurs cas, les 30 absences comprises (`02-` §5).
//    *Un écran qui retirerait la sélection là où il n'y a rien à trouver
//    répondrait à la place de l'élève : il lui apprendrait, par la seule forme
//    de la page, que le défaut est une absence.* Ce composant ne sait donc
//    RIEN de la cible, et c'est voulu — elle ne descend jamais ici.
//
// ⭐ LA PHRASE À L'ÉLÈVE EST ARRÊTÉE MOT POUR MOT (Louis, 27/08), et elle vit
//    ICI — avec la saisie —, **jamais dans les 336 consignes**, qu'il faudrait
//    sinon toutes réécrire pour y répéter la même chose. ⚠️ Sa dernière phrase
//    dit à l'élève, en clair, ce que le détecteur cherche : *un dispositif qui
//    punit un comportement sans l'avoir annoncé mesure la ruse plutôt que le
//    travail.*
//
// ⚠️ AUCUN `dangerouslySetInnerHTML`, comme partout dans le déroulé : on rend
//    des SEGMENTS de texte nu, et c'est React qui met la zone en évidence. Le
//    matériau vient d'un import de fichier (`08-` §4).
// ============================================================================

// ⭐ HANDOFF « Codex Exercices (élève) » §4, écran 2c — LA MATIÈRE PORTE LE
//    GESTE. Le geste se dit EN UNE LIGNE AU-DESSUS DU TEXTE (« glisse sur le
//    texte pour surligner »), la sélection prend le surlignage DE L'ÉLÈVE
//    (`MARQUE_ELEVE`, jamais celui du professeur), et une pastille « passage
//    surligné » dit l'état sous le texte.
//
// ⛔⛔ **LE HANDOFF DEMANDE AUSSI UN BOUTON « EFFACER MA SÉLECTION », ET IL N'EST
//    PAS POSÉ.** Son §1 pose pourtant le périmètre : *« aucune règle de doctrine
//    ne change »* — or c'en serait une, et elle a été tranchée le 27/08 (voir
//    l'en-tête ci-dessus) : *« se raviser, c'est re-sélectionner ; dire qu'il n'y
//    a rien, c'est répondre »*. Un « Effacer » n'a que deux implémentations
//    possibles, et les deux sont mauvaises :
//      · il enregistre `null` — c'est-à-dire « rien à surligner », **qui EST une
//        réponse** : deux boutons pour un seul écrit, et l'élève apprend qu'ils
//        se valent ;
//      · il efface SANS enregistrer — l'écran ment alors sur ce que la base
//        porte, et la zone désignée survit au « Effacer ».
//    **La pastille d'état, elle, est posée** : c'est la moitié du handoff qui ne
//    coûte aucune doctrine. À rapporter à Louis.
//
// ⭐⭐ 01/09 — DEUX CHEMINS VERS LA MÊME ÉCRITURE, ET UN RETOUR QUAND RIEN NE
//    PASSE. Avant : la seule capture était le `mouseup`/`touchend` sur le
//    paragraphe. Au doigt, seule la sélection AU MOMENT DU LEVER était prise —
//    les poignées natives qu'on ajuste ensuite n'émettent rien sur le `<p>` —,
//    puis la page se revalidait et REMONTAIT ce composant, poignées perdues.
//    Une sélection débordant le cadre, ou relâchée hors du texte, était ignorée
//    EN SILENCE. *« C'est difficile de surligner. »*
//    Désormais :
//      · à la souris, le relâchement sur le texte enregistre toujours ;
//      · un bouton « Garder ce passage » lit la sélection AU MOMENT DU CLIC —
//        c'est lui qui rend le doigt et le clavier possibles : on sélectionne,
//        on ajuste, PUIS on garde ;
//      · quand il n'y a rien à garder, l'écran le DIT (« sélectionne d'abord… »,
//        « la sélection doit rester dans le texte ») au lieu de se taire ;
//      · `touchend` ne capture plus : au doigt, l'écriture attend le bouton.
//    Et l'action serveur ne revalide plus la page : la zone tient ici.
//
// ⭐⭐ 04/09 — LE BOUTON NE LISAIT LA SÉLECTION QU'AU CLIC, ET SUR UN iPHONE ELLE
//    N'Y EST PLUS. Deux signalements d'élèves (03 et 04/09) : « à chaque fois que
//    je garde pour surligner, ça ne le fait pas ». Mesuré en production : un
//    dépôt ouvert quatre minutes, zéro pose écrite, et 9 dépôts sur 47 aux crans
//    4·7·9 sans aucune désignation. Rejoué en bac à sable : sur iOS Safari, un
//    tap hors de la sélection l'EFFACE avant tout `click` — le bouton lisait
//    alors « rien » et répondait « sélectionne d'abord… » à un élève qui venait
//    de le faire. (Le smoke du 01/09 posait la sélection par script et cliquait
//    dans un Chrome sans fenêtre, où elle survit au clic : il ne pouvait pas
//    le voir.)
//    Désormais l'écran ÉCOUTE `selectionchange` et RETIENT la dernière sélection
//    faite dans le texte : le bouton garde celle-là quand la sélection vivante a
//    disparu. Ce qui est retenu se LIT sous le texte (« Ta sélection : “…” »), pour
//    que l'élève sache, poignées disparues, que son geste a été vu.
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { MARQUE_ELEVE } from './TexteBalise'
import { demandeUneConfirmation, PHRASE_SOUS_LE_MATERIAU } from '@/utils/deroule/designation'

/** Ce que la sélection courante donne, lue depuis le conteneur du matériau. */
type LectureDeSelection =
  | { etat: 'vide' }
  | { etat: 'hors' }
  | { etat: 'bornes'; bornes: [number, number] }

/**
 * ⭐ LES BORNES D'UNE SÉLECTION, EN CARACTÈRES DU MATÉRIAU.
 *
 * ⚠️ **On ne lit PAS `anchorOffset` tel quel** : il compte dans le nœud de
 * texte, et ce conteneur en porte plusieurs dès que la zone est déjà posée (le
 * matériau se découpe alors en trois segments). On additionne donc la longueur
 * de tous les nœuds qui précèdent — c'est la seule façon d'obtenir un offset
 * qui parle du MATÉRIAU et non du DOM.
 *
 * Trois issues, et l'écran les distingue : `vide` (rien de sélectionné),
 * `hors` (la sélection sort du conteneur — elle a commencé ou fini ailleurs),
 * `bornes` (une zone dans le matériau).
 */
function lireLaSelection(conteneur: HTMLElement): LectureDeSelection {
  const sel = typeof window === 'undefined' ? null : window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return { etat: 'vide' }
  const plage = sel.getRangeAt(0)
  if (!conteneur.contains(plage.commonAncestorContainer)) return { etat: 'hors' }

  const avant = plage.cloneRange()
  avant.selectNodeContents(conteneur)
  avant.setEnd(plage.startContainer, plage.startOffset)
  const debut = avant.toString().length
  const fin = debut + plage.toString().length
  return fin > debut ? { etat: 'bornes', bornes: [debut, fin] } : { etat: 'vide' }
}

export function DesignationDansLeMateriau({
  contenu, zoneDonnee, repondu, enregistrer, gele = false,
}: {
  /** Le matériau, tel qu'il est stocké — la concaténation des segments servis. */
  contenu: string
  zoneDonnee: [number, number] | null
  /** ⚠️ « Rien à signaler » EST une réponse : ce drapeau la sépare du silence. */
  repondu: boolean
  /** `confirmee` : l'élève a répondu « oui » à la question sur une zone qui couvre presque tout. */
  enregistrer: (zone: [number, number] | null, confirmee?: boolean) => Promise<{ ok: boolean; message: string }>
  gele?: boolean
}) {
  const boite = useRef<HTMLParagraphElement>(null)
  const [zone, setZone] = useState<[number, number] | null>(zoneDonnee)
  const [aRepondu, setARepondu] = useState(repondu)
  const [refus, setRefus] = useState<string | null>(null)
  /** ⭐ 01/09 — ce que l'écran dit quand un geste n'a rien donné. Jamais un refus : une aide. */
  const [aide, setAide] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()
  /**
   * ⭐ 01/09 — LA ZONE QUI ATTEND SA CONFIRMATION. « Tu as surligné presque
   *    tout le texte. C'est bien ce que tu veux désigner ? » — une QUESTION,
   *    jamais un refus : dans 46 matériaux sur 516, la bonne réponse EST de tout
   *    surligner. La question sépare le geste voulu du « tout sélectionner »
   *    accidentel d'un téléphone. ⚠️ Rien n'est écrit tant qu'elle attend, et
   *    le serveur tient la même garde (`actionDesignation`).
   */
  const [aConfirmer, setAConfirmer] = useState<[number, number] | null>(null)
  /**
   * ⭐ 04/09 — LA DERNIÈRE SÉLECTION FAITE DANS LE TEXTE, retenue par
   *    `selectionchange`. Elle survit au tap qui l'efface sur iOS, et c'est elle
   *    que « Garde ce passage » garde quand la sélection vivante est vide. Le
   *    `ref` sert au clic (jamais en retard d'un rendu), l'état sert à l'écran.
   */
  const retenue = useRef<[number, number] | null>(null)
  const [retenueAffichee, setRetenueAffichee] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (gele || typeof document === 'undefined') return
    const ecoute = () => {
      if (!boite.current) return
      const lecture = lireLaSelection(boite.current)
      if (lecture.etat !== 'bornes') return       // vide ou ailleurs : on garde ce qu'on a
      const b = lecture.bornes
      const r = retenue.current
      if (r && r[0] === b[0] && r[1] === b[1]) return
      retenue.current = b
      setRetenueAffichee(b)
    }
    document.addEventListener('selectionchange', ecoute)
    return () => document.removeEventListener('selectionchange', ecoute)
  }, [gele])

  const oublierLaRetenue = useCallback(() => {
    retenue.current = null
    setRetenueAffichee(null)
  }, [])

  // ⚠️ PAS D'EFFET DE SYNCHRONISATION, ET C'EST VOULU. La vue serveur fait foi
  //    au rechargement, mais on ne la recopie pas dans l'état à chaque rendu :
  //    l'appelant monte ce composant avec une `key` tirée de la zone stockée, et
  //    **c'est la `key` qui réinitialise**. Depuis le 01/09 l'action de
  //    désignation ne revalide plus la page : la clé ne change qu'au prochain
  //    rendu serveur, et la zone tenue ici EST celle de la base entre-temps.

  const poser = useCallback((z: [number, number] | null, confirmee = false) => {
    setRefus(null)
    setAide(null)
    // ⚠️ Une pose pendant qu'une autre s'écrit : on attend la première. Deux
    //    écritures concurrentes laisseraient la DERNIÈRE RÉPONSE décider de
    //    l'état, et ce n'est pas toujours le dernier geste.
    if (enCours) return
    demarrer(async () => {
      const r = await enregistrer(z, confirmee)
      if (r.ok) {
        setZone(z); setARepondu(true); setAConfirmer(null)
        oublierLaRetenue()
        // La zone est maintenant PEINTE dans le texte : la sélection vivante
        // ne dirait plus rien de plus, et elle cache la marque sur ordinateur.
        if (typeof window !== 'undefined') window.getSelection()?.removeAllRanges()
      } else { setRefus(r.message) }
    })
  }, [enregistrer, enCours, oublierLaRetenue])

  /** Garde une zone lue — en passant par la question si elle couvre presque tout. */
  const garderLesBornes = useCallback((b: [number, number]) => {
    // ⭐ Presque tout le texte : on demande avant d'écrire. La barre est celle du
    //    ratissage, mesurée sur le seul terme que l'écran connaît — la part du
    //    matériau. La cible, elle, ne descend jamais ici.
    if (demandeUneConfirmation(contenu.length, b)) { setRefus(null); setAide(null); setAConfirmer(b); return }
    setAConfirmer(null)
    poser(b)
  }, [poser, contenu.length])

  /** Le relâchement de la souris sur le texte : on garde ce qui est sélectionné, sans un mot si rien ne l'est. */
  const surRelachement = useCallback(() => {
    if (gele || !boite.current) return
    const lecture = lireLaSelection(boite.current)
    if (lecture.etat !== 'bornes') return
    garderLesBornes(lecture.bornes)
  }, [gele, garderLesBornes])

  /** ⭐ Le bouton : il lit la sélection AU MOMENT DU CLIC, et il dit quand il n'y a rien. */
  const garder = useCallback(() => {
    if (gele || !boite.current) return
    const lecture = lireLaSelection(boite.current)
    if (lecture.etat === 'bornes') { garderLesBornes(lecture.bornes); return }
    // ⭐ 04/09 — la sélection vivante a disparu (le tap l'a effacée) : on garde
    //    la dernière faite dans le texte, celle que l'écran affiche.
    if (retenue.current) { garderLesBornes(retenue.current); return }
    if (lecture.etat === 'hors') {
      setAide('La sélection doit rester dans le texte ci-dessus. Recommence en partant d’un mot du texte.')
      return
    }
    setAide('Sélectionne d’abord un passage dans le texte, puis garde-le.')
  }, [gele, garderLesBornes])

  const recommencer = useCallback(() => {
    setAConfirmer(null)
    oublierLaRetenue()
    if (typeof window !== 'undefined') window.getSelection()?.removeAllRanges()
  }, [oublierLaRetenue])

  /** « Il n'y a rien à surligner » : une réponse, qui efface aussi ce qui était retenu. */
  const rienASurligner = useCallback(() => {
    oublierLaRetenue()
    poser(null)
  }, [oublierLaRetenue, poser])

  // Ce que l'écran dit de la sélection retenue — seulement si elle diffère de
  // la zone déjà gardée (sinon la pastille « passage surligné » suffit).
  const retenueAMontrer = retenueAffichee && !(zone && zone[0] === retenueAffichee[0] && zone[1] === retenueAffichee[1])
    ? retenueAffichee : null
  const extraitRetenu = retenueAMontrer ? contenu.slice(retenueAMontrer[0], retenueAMontrer[1]).trim() : ''

  // ⭐ Le matériau, découpé par la zone. Trois segments au plus, et leur
  //    concaténation EST le matériau — même promesse que `MateriauMarque`.
  const segments = zone
    ? [{ t: contenu.slice(0, zone[0]), marque: false },
      { t: contenu.slice(zone[0], zone[1]), marque: true },
      { t: contenu.slice(zone[1]), marque: false }].filter((s) => s.t !== '')
    : [{ t: contenu, marque: false }]

  return (
    <div>
      {/* ⭐ LE GESTE SE DIT AU-DESSUS DU TEXTE, en une ligne (handoff §4, 2c) —
          au doigt comme à la souris, les deux verbes ne sont pas les mêmes. */}
      {!gele && (
        <p className="mb-2 font-corps text-sm italic text-muet">
          <span className="hidden sm:inline">
            Glisse sur le texte pour surligner, ou sélectionne puis « Garde ce passage ». Un seul
            passage à la fois : pour deux endroits, surligne d’un seul trait du premier au second.
          </span>
          <span className="sm:hidden">
            Appuie longuement sur un mot, ajuste les poignées, puis touche « Garde ce passage ».
            Un seul passage à la fois : si la consigne parle de deux endroits, surligne d’un seul
            trait du premier au second.
          </span>
        </p>
      )}

      <div className="rounded-[9px] border border-bordure-bouton bg-parchemin-fonce p-3.5">
        {/* ⚠️ `onMouseUp` seulement : au doigt, la capture au lever prenait un
            mot et perdait les poignées. Le bouton fait le geste au doigt. */}
        <p
          ref={boite}
          onMouseUp={surRelachement}
          className={`whitespace-pre-wrap font-corps text-[16.5px] leading-[1.68] text-encre${
            gele ? '' : ' cursor-text'}`}
        >
          {segments.map((s, i) => (
            s.marque
              ? <strong key={i} className={MARQUE_ELEVE}>{s.t}</strong>
              : <span key={i}>{s.t}</span>
          ))}
        </p>
      </div>

      {/* ⭐ 01/09 — LA QUESTION, quand la sélection couvre presque tout le texte.
          Elle ne dit pas si c'est juste ; elle demande si c'est voulu. « Oui »
          écrit la zone, confirmée ; « non » n'écrit rien et défait la sélection. */}
      {aConfirmer && !gele && (
        <div
          role="group"
          aria-label="Confirmer la sélection"
          className="mt-2.5 rounded-[9px] border border-attention/40 bg-attention-teinte px-3.5 py-3"
        >
          <p className="font-corps text-[15px] leading-snug text-encre">
            Tu as surligné presque tout le texte. C’est bien ce que tu veux désigner ?
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => poser(aConfirmer, true)}
              disabled={enCours}
              className="min-h-11 rounded-[9px] bg-bouton px-4 py-2 font-ui text-sm text-bouton-texte disabled:opacity-40"
            >
              Oui, c’est mon choix
            </button>
            <button
              type="button"
              onClick={recommencer}
              disabled={enCours}
              className="min-h-11 rounded-[9px] border border-bordure-bouton bg-surface px-4 py-2
                         font-ui text-sm text-encre-douce disabled:opacity-40"
            >
              Non, je recommence
            </button>
          </div>
        </div>
      )}

      {/* ⭐ 04/09 — CE QUI EST RETENU SE LIT, poignées disparues ou non : l'élève
          sait que son geste a été vu, et ce que « Garde ce passage » gardera. */}
      {retenueAMontrer && !gele && !aConfirmer && (
        <p aria-live="polite" className="mt-2.5 font-corps text-[15px] leading-snug text-encre">
          <span className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em] text-pigment">
            Ta sélection
          </span>
          {' '}
          <span className="italic text-encre-douce">
            « {extraitRetenu.length > 90 ? `${extraitRetenu.slice(0, 90)}…` : extraitRetenu} »
          </span>
          {' '}— touche « Garde ce passage » pour la garder.
        </p>
      )}

      {/* ⭐ L'ÉTAT SE LIT SOUS LE TEXTE, en pastille — handoff §4. Il reste
          affiché APRÈS la remise, gelé : l'élève relit sa correction en voyant
          ce QU'IL avait désigné. Ce n'est pas une fuite, c'est sa réponse. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <span
          aria-live="polite"
          className={`rounded-full border px-3 py-1.5 font-ui text-xs ${zone
            ? 'border-pigment/30 bg-pigment-teinte text-pigment'
            : 'border-bordure bg-surface text-muet'}`}
        >
          {enCours ? 'enregistrement…'
            : zone ? 'passage surligné'
              : aRepondu ? 'tu as répondu : rien à surligner'
                : 'rien de surligné pour l’instant'}
        </span>

        {/* ⭐ 01/09 — LE BOUTON QUI LIT LA SÉLECTION AU CLIC. C'est lui le
            geste au doigt et au clavier ; à la souris il double le relâchement
            sans le contredire : même lecture, même écriture. */}
        {!gele && (
          <button
            type="button"
            onClick={garder}
            disabled={enCours}
            className="min-h-11 rounded-[9px] bg-bouton px-4 py-2 font-ui text-sm text-bouton-texte
                       disabled:opacity-40"
          >
            Garde ce passage
          </button>
        )}

        {/* ⛔⛔ UN SEUL BOUTON D'ABSENCE, DÉLIBÉRÉMENT — voir l'en-tête. « Rien à
            signaler » EST une réponse, et elle est aussi facile à donner qu'une
            sélection : le bouton est au même rang visuel, pas en petit dessous. */}
        {!gele && (
          <button
            type="button"
            onClick={rienASurligner}
            disabled={enCours}
            className="min-h-11 rounded-[9px] border border-bordure-bouton bg-surface px-4 py-2
                       font-ui text-sm text-encre-douce disabled:opacity-40"
          >
            Il n’y a rien à surligner
          </button>
        )}
      </div>

      {/* ⭐ 01/09 — quand un geste n'a rien donné, l'écran le dit. `aria-live`
          pour qu'un lecteur d'écran l'entende aussi. */}
      {aide && !gele && (
        <p aria-live="polite" className="mt-2 font-corps text-sm text-encre-douce">{aide}</p>
      )}

      {!gele && (
        /* ⭐ La rédaction est ARRÊTÉE, mot pour mot — Louis, 27/08. Elle vit en
           module pur (`designation.ts`) : le panneau de preuve du professeur
           cite la même phrase. */
        <p className="mt-2 text-xs text-encre-douce">{PHRASE_SOUS_LE_MATERIAU}</p>
      )}

      {refus && <p className="mt-2 text-sm text-retard">{refus}</p>}
    </div>
  )
}
