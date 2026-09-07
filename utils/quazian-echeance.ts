// ════════════════════════════════════════════════════════════════════════════
// Quazian — QUAND une carte est « à réviser aujourd'hui » (fonction PURE).
//
// Le FSRS pose l'échéance à l'INSTANT près : une carte revue le 1er à 18 h 40
// avec un intervalle de trois jours est due le 4 à 18 h 40. Comparer à « maintenant »
// la cachait donc à l'élève qui revient le 4 à 18 h 00, et la lui servait le 5 —
// un jour de glissement à chaque séance un peu plus tôt que la précédente. La
// règle de tous les outils de répétition espacée est la JOURNÉE : est due toute
// carte dont l'échéance tombe avant la fin du jour en cours, heure de l'école.
//
// Lecteurs : la file de révision, la consultation par cours et les compteurs
// (`app/eleve/modules/quazian/actions.ts`) — un seul prédicat pour les trois,
// sinon l'écran annonce un nombre que la file ne sert pas (recette C7·L3, 14/08).
// ════════════════════════════════════════════════════════════════════════════

import { finDeJourDansFuseau, jourDansFuseau } from './fuseau'

/**
 * Instant (ms epoch) de la fin de la journée en cours dans le fuseau donné —
 * 23:59:59.999 locales. Tout ce qui est dû AVANT cet instant est à réviser.
 */
export function seuilEcheanceDuJour(maintenant: Date, tz: string): number {
  return new Date(finDeJourDansFuseau(jourDansFuseau(maintenant, tz), tz)).getTime()
}

/**
 * La carte est-elle due ? Comparaison NUMÉRIQUE : PostgREST rend `due` en
 * `…+00:00`, JS en `…Z` — une comparaison de chaînes n'est juste que par
 * accident quand les fractions de seconde n'ont pas la même longueur.
 */
export function estEchue(due: string, seuil: number): boolean {
  return new Date(due).getTime() <= seuil
}
