'use client'

import { useEffect, useRef } from 'react'
import { cleBrouillon, ecrireBrouillon, fusionnerBrouillon, lireBrouillon, purgerBrouillon, type PhaseBrouillon, type ValeursBrouillon } from '@/utils/aletheia/brouillon'

/** Le délai avant d'écrire — assez court pour survivre à un départ précipité de la page. */
const DELAI_MS = 300

/**
 * Brouillon local d'un formulaire Aletheia (cf. `utils/aletheia/brouillon.ts`).
 *
 * - au montage, s'il existe un brouillon pour cet élève / livre / semaine / phase, il est
 *   fusionné aux valeurs initiales et rendu par `appliquer` ;
 * - ensuite, chaque changement de `valeurs` est écrit (après un court délai) ;
 * - `purger()` à la soumission acceptée.
 *
 * Rien n'est écrit tant que la lecture initiale n'a pas eu lieu : sinon le premier rendu
 * écraserait le brouillon avec les valeurs vides de la base.
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

  useEffect(() => {
    if (!lu.current) {
      // Première passe : lire. S'il y a un brouillon, on l'applique et on N'ÉCRIT PAS —
      // le rendu qui suit, avec les valeurs restaurées, écrira.
      lu.current = true
      const brouillon = lireBrouillon(window.localStorage, cle)
      if (brouillon) { appliquer(fusionnerBrouillon(JSON.parse(serialise) as T, brouillon)); return }
    }
    const t = setTimeout(() => ecrireBrouillon(window.localStorage, cle, JSON.parse(serialise) as ValeursBrouillon), DELAI_MS)
    return () => clearTimeout(t)
    // `appliquer` est une fermeture du formulaire, recréée à chaque rendu : la dépendance
    // ferait relire à chaque frappe. Elle n'est appelée qu'à la première passe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, serialise])

  return { purger: () => purgerBrouillon(window.localStorage, cle) }
}
