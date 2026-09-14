// ============================================================================
// Vestigia · l'onglet Semaine — QUELLE SEMAINE S'OUVRE quand le professeur arrive.
// ----------------------------------------------------------------------------
// La frise montre les dix-sept semaines ; l'écran en charge UNE. Sans choix
// explicite (`?semaine=`), on prend dans l'ordre : la semaine OUVERTE aux élèves
// (c'est là que les dépôts tombent), sinon celle qui contient aujourd'hui, sinon
// la dernière déjà commencée, sinon la première que Vestigia réclame.
//
// ⚠️ Fichier PUR (aucun accès base, le jour est passé en argument) : c'est ce
//    qui le rend éprouvable par `npm test` (glob `utils/**/*.test.ts`).
// ============================================================================

import { estSemaineComptee, type SemaineComptable } from './fragments-semaines'

export interface SemaineChoisissable extends SemaineComptable {
  id: string
  /** Date pure `YYYY-MM-DD` (premier jour de la semaine). */
  date_debut: string
  ouverte: boolean
}

/**
 * @param semaines   toutes les semaines du semestre, vacances comprises, dans l'ordre du calendrier
 * @param premiere   `fragments_premiere_semaine` du semestre
 * @param aujourdHui jour local `YYYY-MM-DD` (cf. `jourDansFuseau`)
 * @param voulueId   la semaine demandée par l'URL, si elle existe
 */
export function semaineCourante<T extends SemaineChoisissable>(
  semaines: readonly T[],
  premiere: number,
  aujourdHui: string,
  voulueId?: string | null,
): T | null {
  if (semaines.length === 0) return null
  if (voulueId) {
    // Une semaine de vacances n'est pas une case de la frise : on n'y va pas.
    const voulue = semaines.find((s) => s.id === voulueId && !s.is_vacation)
    if (voulue) return voulue
  }
  const comptees = semaines.filter((s) => estSemaineComptee(s, premiere))
  const ouvertes = comptees.filter((s) => s.ouverte)
  if (ouvertes.length > 0) return ouvertes[ouvertes.length - 1]

  // Celle qui contient aujourd'hui : la dernière dont le début est passé, parmi
  // TOUTES les semaines (une semaine de vacances contient aussi des jours) — mais
  // on ne l'ouvre que si elle est comptée ; sinon on remonte à la précédente comptée.
  const commencees = comptees.filter((s) => s.date_debut <= aujourdHui)
  if (commencees.length > 0) return commencees[commencees.length - 1]

  return comptees[0] ?? semaines[0]
}
