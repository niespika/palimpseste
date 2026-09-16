'use client'

import { cleBrouillon, type PhaseBrouillon, type ValeursBrouillon } from '@/utils/aletheia/brouillon'
import { useBrouillonLocalParCle } from '@/app/eleve/brouillon/useBrouillonLocal'

/**
 * Brouillon local d'un formulaire Aletheia (cf. `utils/aletheia/brouillon.ts`) : la clé porte
 * l'élève, le livre, la semaine, la phase — et le travail pour les relances. Le mécanisme est
 * celui de `useBrouillonLocalParCle`, partagé avec le déroulé des exercices depuis le 15/09.
 */
export function useBrouillonLocal<T extends ValeursBrouillon>(
  ids: { eleveId: string; livreId: string; semaine: number; phase: PhaseBrouillon; travailId?: string },
  valeurs: T,
  appliquer: (fusion: T) => void,
) {
  const cle = cleBrouillon(ids.eleveId, ids.livreId, ids.semaine, ids.phase, ids.travailId)
  const { purger } = useBrouillonLocalParCle(cle, valeurs, appliquer)
  return { purger }
}
