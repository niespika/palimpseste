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
  nouvelleTelemetrie, accumuler, fusionner, type EvenementDeSaisie,
} from '@/utils/deroule/telemetrie'
import type { TelemetrieSaisie } from '@/utils/deroule/types'
import { actionCollageBloque } from '@/app/deroule/actions'

/** L'intervalle d'enregistrement du brouillon — assez lâche pour ne pas marteler. */
const AUTO_MS = 15_000

export function ChampDeRedaction({
  depotId, valeurInitiale, lectureSeule, rows = 20,
  onEnregistrer, onRemettre, libelleRemise,
}: {
  depotId: string
  valeurInitiale: string
  lectureSeule: boolean
  rows?: number
  onEnregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  onRemettre: (texte: string, t: TelemetrieSaisie) => Promise<void>
  libelleRemise: string
}) {
  const [texte, setTexte] = useState(valeurInitiale)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // La télémétrie s'accumule en `ref` : elle ne doit JAMAIS provoquer un rendu.
  const releve = useRef<TelemetrieSaisie>(nouvelleTelemetrie())
  const dernier = useRef<{ longueur: number; instant: number | null }>(
    { longueur: valeurInitiale.length, instant: null })
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
      const t = releve.current
      releve.current = nouvelleTelemetrie()
      void onEnregistrer(texte, t).catch(() => {
        // Best-effort : on rend la télémétrie au relevé pour ne pas la perdre.
        releve.current = fusionner(releve.current, t)
        sale.current = true
      })
    }, AUTO_MS)
    return () => clearInterval(id)
  }, [texte, lectureSeule, onEnregistrer])

  async function remettre() {
    if (enCours) return
    setEnCours(true)
    setMessage(null)
    try {
      await onRemettre(texte, releve.current)
      releve.current = nouvelleTelemetrie()
      sale.current = false
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'La remise a échoué.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <section className="rounded-lg border border-bordure bg-surface p-4">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        Ta rédaction
      </h2>
      <p className="mt-2 text-sm text-encre-douce">
        Tu écris au clavier. <strong>Le collage est désactivé</strong> : ce texte doit être le tien.
      </p>

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
        style={{ backgroundColor: 'var(--parchemin)' }}
        className="mt-3 w-full rounded border border-bordure-bouton p-3 font-corps text-base
                   leading-relaxed text-encre"
      />

      {/* ⭐ « Le champ ENCOURAGE le découpage » : le compteur le dit, il ne le
          corrige pas — aucun ajout automatique de ligne vide, aucun refus. */}
      <p className="mt-1 text-xs text-muet">
        {nbBlocs} paragraphe{nbBlocs > 1 ? 's' : ''} — une ligne vide sépare deux paragraphes.
        {nbBlocs <= 1 && texte.trim() !== '' && (
          <span className="text-attention">
            {' '}Pense à aller à la ligne : c’est ce qui donne son architecture à ton devoir.
          </span>
        )}
      </p>

      {!lectureSeule && (
        <button
          type="button" onClick={remettre} disabled={enCours || texte.trim() === ''}
          className="mt-3 rounded bg-bouton px-4 py-2 text-sm text-parchemin disabled:opacity-40"
        >
          {enCours ? 'Envoi…' : libelleRemise}
        </button>
      )}
      {message && <p className="mt-2 text-sm text-retard">{message}</p>}
    </section>
  )
}
