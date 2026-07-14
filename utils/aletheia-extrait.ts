/**
 * Renumérotation d'AFFICHAGE 1..K d'un extrait de livre (Aletheia mode C). PUR, sans
 * état persistant : l'unique intrant est `exposees` = les ordinaux d'ORIGINE des séances
 * exposées, triés croissant. Tout est dérivé à la volée, JAMAIS écrit.
 *
 * MC2 (0 migration) : le travail élève reste keyé par l'ordinal d'ORIGINE
 * (`aletheia_travaux.semaine_index`), le param d'URL `[semaine]` reste l'origine, l'ancrage
 * IA et le résolveur de dates restent en ordinal d'origine. Le 1..K est une NOUVELLE couche
 * d'affichage, jamais une nouvelle clé — miroir du contrat de `aletheia-seance.ts`.
 *
 * FRONTIÈRE STRICTE : ces fonctions ne servent QU'À L'AFFICHAGE (libellé « Séance N », barre
 * d'avancement, stepper) et à la GARDE d'appartenance. Ne JAMAIS propager `numeroAffiche`
 * dans les assembleurs IA (`aletheia-retours.ts`) ni dans le résolveur de dates : ce serait
 * franchir la frontière et corrompre le travail élève.
 *
 * Non-régression A/B prouvable par identité : en modes A/B, `exposees == [1..N]` →
 * `numeroAffiche(o) == o` et `dansExtrait(o) == true` pour tout `o` → affichage byte-identique.
 */

import type { SeanceOrdinal } from './aletheia-seance'

/** Position affichée (1..K) d'un ordinal d'ORIGINE dans l'extrait. 0 si absent. */
export function numeroAffiche(exposees: SeanceOrdinal[], origine: SeanceOrdinal): number {
  const i = exposees.indexOf(origine)
  return i < 0 ? 0 : i + 1
}

/** Ordinal d'ORIGINE correspondant à une position affichée 1..K, ou null hors bornes. */
export function origineDepuisNumero(exposees: SeanceOrdinal[], position: number): SeanceOrdinal | null {
  return exposees[position - 1] ?? null
}

/** L'ordinal d'ORIGINE appartient-il à l'extrait exposé ? (garde d'appartenance lecture/écriture.) */
export function dansExtrait(exposees: SeanceOrdinal[], origine: SeanceOrdinal): boolean {
  return exposees.includes(origine)
}

/**
 * Titre d'affichage d'une séance, ANTI-FUITE en mode C. Le titre par défaut d'une séance
 * (prof laissant le champ vide → `scriptorium_documents.titre` persisté à « Séance {origine} »,
 * cf. app/prof/scriptorium/actions.ts:429/450 ; ou repli NULL de data.ts) contient l'ORDINAL
 * D'ORIGINE. Affiché tel quel à côté du numéro renuméroté 1..K, il révèle l'existence et la
 * numérotation des séances hors extrait (fuite anti-spoiler). En mode C, on remplace ce
 * placeholder par « Séance {position} ». Un vrai titre saisi par le prof reste INCHANGÉ.
 * En A/B (position == origine) l'appel est neutre → non-régression.
 */
export function titreSeanceAffiche(titre: string, origine: SeanceOrdinal, numero: number, estModeC: boolean): string {
  if (estModeC && titre === `Séance ${origine}`) return `Séance ${numero}`
  return titre
}
