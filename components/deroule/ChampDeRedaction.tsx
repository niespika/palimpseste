'use client'
// ============================================================================
// C4 · L3 — LE CHAMP DE RÉDACTION : la contrainte d'interface qui n'est pas
//            cosmétique.
// ----------------------------------------------------------------------------
// ⭐⭐ LES PARAGRAPHES — LA CONTRAINTE DE LA MISSION. « Le champ ENCOURAGE le
//    découpage et le CONSERVE DE BOUT EN BOUT, de la saisie à l'extraction »
//    (`07-` §3) : *une copie sans retour à la ligne est lue comme DÉPOURVUE
//    D'ARCHITECTURE — défaillance forte —, même si elle articule parfaitement
//    dans son bloc unique.* C'est la **condition de fermeture d'un pari**
//    déclaré à `competences/structure.md` §8.
//
// ⚠️⚠️ **LES TUEURS SILENCIEUX SONT TROIS** (piège 24) : un `trim`, une
//    normalisation d'espaces, une sérialisation qui écrase les `\n`. Et un
//    quatrième, déjà payé une fois : **la soumission d'un formulaire HTML
//    normalise la valeur d'un `<textarea>` en CRLF** — `blocs()` cherche
//    `\n[ \t]*\n`, `\r\n\r\n` ne matche pas, et une copie de quatre
//    paragraphes se lit comme UN SEUL BLOC. *Ni la recette ni les tests Node,
//    qui envoient des `\n`, ne le voient.*
//    → **CE COMPOSANT N'UTILISE PAS DE `<form>`** : il envoie la valeur de son
//      état React par une action typée, où aucune normalisation n'a lieu. Et le
//      serveur re-normalise par prudence (`normaliserRetours`), parce que deux
//      gardes valent mieux qu'une sur une défaillance forte silencieuse.
//    → C'est un `<textarea>`, ET RIEN D'AUTRE : pas de `contenteditable`, pas de
//      normalisation à la frappe, pas de `trim` sur les lignes.
//
// ⭐ LE COLLAGE EST REFUSÉ SUR LES TROIS VECTEURS — raccourci clavier,
//    glisser-déposer, menu contextuel —, et **CHAQUE TENTATIVE BLOQUÉE EST
//    JOURNALISÉE** (`06-` §1). ⚠️ **Réserve écrite noir sur blanc dans la
//    source : le blocage est CÔTÉ NAVIGATEUR SEULEMENT.** Il arrête le geste
//    paresseux, qui est le geste majoritaire ; il n'arrête pas l'élève
//    déterminé. **Effet de bord assumé : l'élève qui rédige hors ligne ne peut
//    plus coller son texte — on ne le "répare" pas en réintroduisant un
//    collage.**
//
// ⚠️ **LE CORRECTEUR ORTHOGRAPHIQUE DU NAVIGATEUR RESTE ACTIF** (`06-` §1) : il
//    ne se désactive pas. `spellCheck` est posé EXPLICITEMENT, et pas laissé au
//    défaut du navigateur — une règle nommée par une source ne se confie pas à
//    un défaut d'implémentation qui peut changer.
//
// ⭐ L'INSTRUMENTATION DU FAISCEAU VIT DANS CE CHAMP (`06-` §6) : le rythme de
//    frappe, l'apparition du texte par blocs, le nombre de sessions.
//    **Sans cette collecte, des signaux du faisceau n'existent pas.** Tous
//    tagués, aucun bloquant, jamais un verdict — rien ici ne juge, rien ne
//    bloque, et l'élève n'en voit rien.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { blocs } from '@/utils/passation/transcription-calcul'
import {
  nouvelleTelemetrie, accumuler, type EvenementDeSaisie,
} from '@/utils/deroule/telemetrie'
import type { TelemetrieSaisie } from '@/utils/deroule/types'
import { actionCollageBloque } from '@/app/deroule/actions'

/** L'intervalle d'enregistrement du brouillon — assez lâche pour ne pas marteler. */
const AUTO_MS = 15_000

/**
 * @param avantDeRendre ⭐ HANDOFF « Codex Exercices (élève) » §4 — « sous le
 *        champ, les trois gestes de la remise, et le bouton "Rendre ma v1" à
 *        droite ». Le parent y passe `<GestesDeLaRemise>`, qui ne porte plus son
 *        cadre : les deux tiennent dans UNE carte, au lieu de deux sections
 *        empilées que l'élève lisait comme deux étapes.
 *        ⚠️ **L'ÉTAT DU TEXTE NE REMONTE PAS POUR AUTANT.** Le bouton de remise
 *        reste ici, avec la valeur et la télémétrie — les faire voyager par un
 *        `<form>` ou par un parent normaliserait la valeur en CRLF, et une copie
 *        de quatre paragraphes se relirait comme UN SEUL BLOC (piège 24).
 * @param aide la mention du pied, à gauche du compte de signes.
 */
export function ChampDeRedaction({
  depotId, valeurInitiale, telemetrieInitiale = null, lectureSeule, rows = 20,
  onEnregistrer, onRemettre, libelleRemise, avantDeRendre = null, pied = null,
  sansRemise = false, avantLaRemise = null,
}: {
  depotId: string
  valeurInitiale: string
  /**
   * ⭐ 01/09 — LE RELEVÉ DÉJÀ EN BASE pour cette version. Le champ s'en sème et
   * porte ensuite le relevé CUMULÉ ; la base garde le plus avancé des deux
   * (`leReleveLePlusAvance`). Avant : un delta par envoi, remis à zéro, et la
   * base écrasée par le dernier — vide dans 15 dépôts sur 16 en production.
   */
  telemetrieInitiale?: TelemetrieSaisie | null
  lectureSeule: boolean
  rows?: number
  onEnregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  onRemettre: (texte: string, t: TelemetrieSaisie) => Promise<void>
  libelleRemise: string
  avantDeRendre?: React.ReactNode
  /** La mention sous le champ, à droite du compte de signes. */
  pied?: React.ReactNode
  /**
   * ⭐ 04/09 — SUR UNE PAIRE, LE PREMIER CAS NE SE REND PAS : il se déclare (la
   *    crédence), puis on passe au second, et la remise vient à la fin. Le champ
   *    enregistre tout seul ; la carte « Avant de rendre » n'a pas lieu d'être.
   */
  sansRemise?: boolean
  /**
   * ⭐ 04/09 — CE QUI SE FAIT ENTRE ÉCRIRE ET RENDRE : la crédence, « une chance
   *    sur 100 à ta propre réponse, celle que tu viens d'écrire » — elle se
   *    déclare APRÈS le texte, et AVANT la remise. Un créneau, pour que l'ordre
   *    de l'écran soit l'ordre du geste.
   */
  avantLaRemise?: React.ReactNode
}) {
  const [texte, setTexte] = useState(valeurInitiale)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  /** ⭐ « brouillon enregistré · 14:02 » — l'heure du DERNIER succès, pas une
   *     promesse : tant qu'aucun enregistrement n'a abouti, on ne dit rien. */
  const [enregistreA, setEnregistreA] = useState<string | null>(null)

  // La télémétrie s'accumule en `ref` : elle ne doit JAMAIS provoquer un rendu.
  // ⭐ Semée du relevé de la base, et jamais remise à zéro ensuite : chaque envoi
  //    porte le CUMUL, et la base garde le plus avancé (`leReleveLePlusAvance`).
  const releve = useRef<TelemetrieSaisie>(telemetrieInitiale ?? nouvelleTelemetrie())
  // ⚠️ Un relevé semé qui porte déjà des sessions vient d'une page PRÉCÉDENTE :
  //    la première frappe d'ici est une REPRISE, et elle doit compter une
  //    session de plus. `instant: 0` dit à `accumuler` que la dernière frappe
  //    remonte à très loin — l'intervalle passe le seuil de pause, sans ajouter
  //    une milliseconde de temps actif.
  const dernier = useRef<{ longueur: number; instant: number | null }>(
    { longueur: valeurInitiale.length,
      instant: telemetrieInitiale && telemetrieInitiale.sessions > 0 ? 0 : null })
  const sale = useRef(false)

  const nbBlocs = blocs(texte).length

  /**
   * ⚠️ `preventDefault` D'ABORD, journalisation ENSUITE — et jamais l'inverse :
   *    si la journalisation échoue, le collage doit rester refusé.
   * ⚠️ `onContextMenu` bloque TOUT le menu contextuel, pas seulement le collage
   *    (constat de C4-L4). C'est le prix du vecteur, et il est assumé : la
   *    source nomme le « menu contextuel », pas « l'entrée Coller du menu ».
   */
  const refuserLeCollage = useCallback(
    (moyen: 'raccourci' | 'glisser-deposer' | 'menu-contextuel') =>
      (e: React.SyntheticEvent) => {
        e.preventDefault()
        void actionCollageBloque(depotId, moyen)
      },
    [depotId],
  )

  function surSaisie(v: string) {
    const instant = Date.now()
    const evenement: EvenementDeSaisie = {
      longueurAvant: dernier.current.longueur,
      longueurApres: v.length,
      instant,
      dernierInstant: dernier.current.instant,
    }
    releve.current = accumuler(releve.current, evenement)
    dernier.current = { longueur: v.length, instant }
    sale.current = true
    setTexte(v)
  }

  // L'enregistrement automatique. ⚠️ Il n'envoie QUE si quelque chose a bougé —
  // une écriture inutile est une écriture qui peut échouer, et supabase-js ne
  // lève pas.
  useEffect(() => {
    if (lectureSeule) return
    const id = setInterval(() => {
      if (!sale.current) return
      sale.current = false
      // ⭐ On envoie le CUMUL, sans remettre le relevé à zéro : un envoi perdu
      //    n'a rien à rattraper, le suivant porte tout. Et un envoi rejoué ne
      //    compte rien deux fois, la base ne garde que le plus avancé.
      void onEnregistrer(texte, releve.current)
        .then(() => setEnregistreA(
          new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })))
        .catch(() => { sale.current = true })
    }, AUTO_MS)
    return () => clearInterval(id)
  }, [texte, lectureSeule, onEnregistrer])

  async function remettre() {
    if (enCours) return
    setEnCours(true)
    setMessage(null)
    try {
      await onRemettre(texte, releve.current)
      sale.current = false
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'La remise a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ⭐ HANDOFF §4 — LE CHAMP OCCUPE LA COLONNE, PLEINE HAUTEUR : 322 px au
          minimum sur l'ordinateur, et le texte en EB Garamond 17/1,68. Le cadre
          est celui d'une page, pas d'un formulaire.
          ⚠️ C'est un `<textarea>`, ET RIEN D'AUTRE (piège 24) : ni
             `contenteditable`, ni normalisation à la frappe. */}
      <div className="rounded-xl border border-bordure-bouton bg-surface p-1
                      focus-within:border-pigment">
        <textarea
          value={texte}
          onChange={(e) => surSaisie(e.target.value)}
          readOnly={lectureSeule}
          rows={rows}
          // ⚠️ EXPLICITE, et pas laissé au défaut du navigateur : « le correcteur
          //    orthographique du navigateur RESTE ACTIF » (`06-` §1) est une règle
          //    de source, et une règle nommée ne se confie pas à un défaut.
          spellCheck
          onPaste={refuserLeCollage('raccourci')}
          onDrop={refuserLeCollage('glisser-deposer')}
          onDragOver={(e) => e.preventDefault()}
          onContextMenu={refuserLeCollage('menu-contextuel')}
          // ⚠️ Le fond passe par `style` : la règle nue de `globals.css` sur
          //    `input, textarea, select` n'est dans aucune couche Tailwind et
          //    l'emporte sur une classe `bg-*` (constat de C4-L4, dont le
          //    `bg-parchemin` est inopérant).
          style={{ backgroundColor: 'var(--surface)' }}
          className="min-h-[300px] w-full resize-y rounded-[10px] border-0 px-4 py-3.5
                     font-corps text-[17px] leading-[1.68] text-encre outline-none
                     sm:min-h-[322px]"
        />
        {/* Le pied du champ : ce que l'écran a fait tout seul, et le poids du
            texte. ⚠️ Aucun décompte de mots attendus, aucune cible : il n'y en
            a pas, et en afficher une inventerait une note. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-bordure
                        px-4 py-2.5 font-ui text-xs text-muet">
          <span className="text-encre-douce">
            {enregistreA ? `brouillon enregistré · ${enregistreA}` : 'enregistré tout seul'}
          </span>
          <span className="ml-auto tabular-nums">{signes(texte)} signes</span>
        </div>
      </div>

      {/* ⭐ « Le champ ENCOURAGE le découpage » : le compteur le dit, il ne le
          corrige pas — aucun ajout automatique de ligne vide, aucun refus. */}
      <p className="text-xs text-muet">
        {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
        {nbBlocs <= 1 && texte.trim() !== '' && (
          <span className="text-attention">
            {' '}Pense à aller à la ligne : c’est ce qui donne son architecture à ton devoir.
          </span>
        )}
        {' '}Tu écris au clavier : <strong>le collage est désactivé</strong>, ce texte doit être
        le tien.
      </p>

      {avantLaRemise}

      {!lectureSeule && !sansRemise && (
        // ⭐ HANDOFF §4 — UNE SEULE CARTE « Avant de rendre » : les trois gestes
        //    à gauche, le bouton à droite. Sur téléphone, le bouton passe
        //    dessous, en pleine largeur.
        <div className="rounded-xl border border-bordure bg-surface-retrait px-4 py-4">
          {/* ⚠️ Le sur-titre ne se pose QUE s'il coiffe quelque chose : à la
              révision il n'y a plus de gestes — ils se font à la v1 (`06-` §3) —
              et « Avant de rendre » au-dessus d'un seul bouton ne dirait rien. */}
          {avantDeRendre && (
            <p className="font-marque text-[11px] font-semibold uppercase tracking-[0.11em]
                          text-muet">
              Avant de rendre
            </p>
          )}
          {/* ⭐ 04/09 — LES GESTES PRENNENT TOUTE LA LARGEUR, le bouton vient
              DESSOUS. En ligne, le bouton (180 px) laissait ~190 px aux trois
              gestes : quinze boutons de confiance s'empilaient un par ligne.
              *« Éviter l'effet d'empilement »* — le bouton ne s'aligne à droite
              que quand il est seul. */}
          <div className={`flex flex-col gap-4 ${avantDeRendre ? 'mt-2.5' : 'sm:flex-row sm:items-center sm:gap-5'}`}>
            {avantDeRendre && <div className="min-w-0">{avantDeRendre}</div>}
            {!avantDeRendre && <div className="min-w-0 flex-1" />}
            <button
              type="button" onClick={remettre} disabled={enCours || texte.trim() === ''}
              className={`min-h-12 shrink-0 rounded-[10px] bg-bouton px-6 py-4 font-ui text-[15px]
                         font-semibold text-bouton-texte disabled:opacity-40 sm:py-3.5
                         ${avantDeRendre ? 'sm:self-end' : ''}`}
            >
              {enCours ? 'Envoi…' : libelleRemise}
            </button>
          </div>
        </div>
      )}
      {pied && (
        <p className="text-center font-corps text-[13.5px] italic text-muet">{pied}</p>
      )}
      {message && <p className="text-sm text-retard">{message}</p>}
    </div>
  )
}

/**
 * Le poids du texte, EN SIGNES et groupé par milliers — « 1 240 signes ».
 * ⚠️ **Ce n'est pas une cible.** Aucun minimum, aucun maximum, aucune couleur :
 *    un compteur qui vire au rouge invente une longueur attendue, et il n'y en a
 *    pas. Il dit ce qui est écrit, rien de plus.
 */
function signes(texte: string): string {
  return texte.length.toLocaleString('fr-CA')
}
