'use client'

import { useEffect, useRef } from 'react'
import { cleBrouillon, ecrireBrouillon, fusionnerBrouillon, lireBrouillon, purgerBrouillon, type PhaseBrouillon, type ValeursBrouillon } from '@/utils/aletheia/brouillon'

/** Le délai avant d'écrire — assez lâche pour ne pas marteler, et le démontage écrit tout de suite. */
const DELAI_MS = 300

/**
 * `window.localStorage` peut LEVER à l'accès même (Safari « bloquer tous les cookies », profils
 * gérés) : on n'y touche que par ici, et sans stockage le brouillon n'existe pas — la page vit.
 */
function stockage(): Storage | null {
  try { return window.localStorage } catch { return null }
}

/**
 * Brouillon local d'un formulaire Aletheia (cf. `utils/aletheia/brouillon.ts`).
 *
 * - au montage, s'il existe un brouillon pour cet élève / livre / semaine / phase, il est
 *   fusionné aux valeurs initiales et rendu par `appliquer` ;
 * - ensuite, chaque changement de `valeurs` est écrit (après un court délai, ou tout de
 *   suite si le composant se démonte avant) ;
 * - `purger()` à la soumission acceptée.
 *
 * Rien n'est écrit avant la première frappe : ni au montage (les valeurs de la base ne sont
 * pas un brouillon), ni par la passe de restauration.
 */
export function useBrouillonLocal<T extends ValeursBrouillon>(
  ids: { eleveId: string; livreId: string; semaine: number; phase: PhaseBrouillon },
  valeurs: T,
  appliquer: (fusion: T) => void,
) {
  const cle = cleBrouillon(ids.eleveId, ids.livreId, ids.semaine, ids.phase)
  // Le contenu sérialisé sert de dépendance : l'objet `valeurs` change à chaque rendu.
  const serialise = JSON.stringify(valeurs)
  const lu = useRef(false)
  const initial = useRef<string | null>(null)
  const enAttente = useRef<(() => void) | null>(null)

  useEffect(() => {
    const s = stockage()
    if (!s) return
    if (!lu.current) {
      // Première passe : lire, jamais écrire. S'il y a un brouillon, on l'applique et le rendu
      // qui suit (valeurs restaurées) écrira ; sinon on retient l'état initial pour ne pas
      // l'écrire tel quel.
      lu.current = true
      initial.current = serialise
      const brouillon = lireBrouillon(s, cle)
      if (brouillon) appliquer(fusionnerBrouillon(JSON.parse(serialise) as T, brouillon))
      return
    }
    // Revenu à l'état de la base (tout effacé, ou retapé à l'identique) : plus de brouillon.
    if (serialise === initial.current) { enAttente.current = null; purgerBrouillon(s, cle); return }
    const ecrire = () => { enAttente.current = null; ecrireBrouillon(s, cle, JSON.parse(serialise) as ValeursBrouillon) }
    enAttente.current = ecrire
    const t = setTimeout(ecrire, DELAI_MS)
    return () => clearTimeout(t)
    // `appliquer` est une fermeture du formulaire, recréée à chaque rendu : la dépendance
    // ferait relire à chaque frappe. Elle n'est appelée qu'à la première passe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, serialise])

  // Au démontage (l'élève part valider ailleurs), l'écriture en attente part tout de suite.
  useEffect(() => () => { enAttente.current?.() }, [])

  return { purger: () => { const s = stockage(); if (s) purgerBrouillon(s, cle) } }
}
