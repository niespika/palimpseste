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

import { useCallback, useRef, useState, useTransition } from 'react'
import { MARQUE } from './TexteBalise'

/**
 * ⭐ LES BORNES D'UNE SÉLECTION, EN CARACTÈRES DU MATÉRIAU.
 *
 * ⚠️ **On ne lit PAS `anchorOffset` tel quel** : il compte dans le nœud de
 * texte, et ce conteneur en porte plusieurs dès que la zone est déjà posée (le
 * matériau se découpe alors en trois segments). On additionne donc la longueur
 * de tous les nœuds qui précèdent — c'est la seule façon d'obtenir un offset
 * qui parle du MATÉRIAU et non du DOM.
 *
 * @returns `null` si la sélection est vide, ou si elle sort du conteneur.
 */
function bornesDeLaSelection(conteneur: HTMLElement): [number, number] | null {
  const sel = typeof window === 'undefined' ? null : window.getSelection()
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null
  const plage = sel.getRangeAt(0)
  if (!conteneur.contains(plage.commonAncestorContainer)) return null

  const avant = plage.cloneRange()
  avant.selectNodeContents(conteneur)
  avant.setEnd(plage.startContainer, plage.startOffset)
  const debut = avant.toString().length
  const fin = debut + plage.toString().length
  return fin > debut ? [debut, fin] : null
}

export function DesignationDansLeMateriau({
  contenu, zoneDonnee, repondu, enregistrer, gele = false,
}: {
  /** Le matériau, tel qu'il est stocké — la concaténation des segments servis. */
  contenu: string
  zoneDonnee: [number, number] | null
  /** ⚠️ « Rien à signaler » EST une réponse : ce drapeau la sépare du silence. */
  repondu: boolean
  enregistrer: (zone: [number, number] | null) => Promise<{ ok: boolean; message: string }>
  gele?: boolean
}) {
  const boite = useRef<HTMLParagraphElement>(null)
  const [zone, setZone] = useState<[number, number] | null>(zoneDonnee)
  const [aRepondu, setARepondu] = useState(repondu)
  const [refus, setRefus] = useState<string | null>(null)
  const [enCours, demarrer] = useTransition()

  // ⚠️ PAS D'EFFET DE SYNCHRONISATION, ET C'EST VOULU. La vue serveur fait foi
  //    au rechargement, mais on ne la recopie pas dans l'état à chaque rendu :
  //    l'appelant monte ce composant avec une `key` tirée de la zone stockée, et
  //    **c'est la `key` qui réinitialise**. *Un `useEffect` qui appellerait
  //    `setState` provoquerait des rendus en cascade, et `CredenceSaisie` s'en
  //    passe déjà — elle n'est simplement montée que tant qu'elle attend.*

  const poser = useCallback((z: [number, number] | null) => {
    setRefus(null)
    demarrer(async () => {
      const r = await enregistrer(z)
      if (r.ok) { setZone(z); setARepondu(true) } else { setRefus(r.message) }
    })
  }, [enregistrer])

  const surSelection = useCallback(() => {
    if (gele || !boite.current) return
    const b = bornesDeLaSelection(boite.current)
    if (b) poser(b)
  }, [gele, poser])

  // ⭐ Le matériau, découpé par la zone. Trois segments au plus, et leur
  //    concaténation EST le matériau — même promesse que `MateriauMarque`.
  const segments = zone
    ? [{ t: contenu.slice(0, zone[0]), marque: false },
      { t: contenu.slice(zone[0], zone[1]), marque: true },
      { t: contenu.slice(zone[1]), marque: false }].filter((s) => s.t !== '')
    : [{ t: contenu, marque: false }]

  return (
    <div className="mt-3">
      <p
        ref={boite}
        onMouseUp={surSelection}
        onTouchEnd={surSelection}
        className={`whitespace-pre-wrap font-corps text-sm text-encre${
          gele ? '' : ' cursor-text'}`}
      >
        {segments.map((s, i) => (
          s.marque
            ? <strong key={i} className={MARQUE}>{s.t}</strong>
            : <span key={i}>{s.t}</span>
        ))}
      </p>

      {!gele && (
        <>
          {/* ⭐ La rédaction est ARRÊTÉE, mot pour mot — Louis, 27/08. */}
          <p className="mt-2 text-xs text-encre-douce">
            Sélectionne dans le texte le passage qui cloche.
            {' '}Parfois il n’y a rien à surligner — le dire est une réponse.
            {' '}Et un mot de trop de chaque côté ne coûte rien : ne bloque pas sur la
            {' '}frontière exacte. Mais ne surligne pas tout, cela ne sert à rien.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => poser(null)}
              disabled={enCours}
              className="min-h-11 rounded border border-bordure-bouton px-4 py-2
                         text-sm text-encre disabled:opacity-40"
            >
              Il n’y a rien à surligner
            </button>
            <span className="text-xs text-encre-douce" aria-live="polite">
              {enCours ? 'enregistrement…'
                : zone ? 'passage désigné'
                  : aRepondu ? 'tu as répondu : rien à surligner'
                    : 'rien de désigné pour l’instant'}
            </span>
          </div>

          {refus && <p className="mt-2 text-sm text-retard">{refus}</p>}
        </>
      )}
    </div>
  )
}
