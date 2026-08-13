// ----------------------------------------------------------------------------
// Validation par LOT (C8·L2) — répartition d'une sélection.
//
// Module PUR : c'est ici que se décide CE QUE chaque bouton touchera vraiment.
// Une erreur à cet endroit ne casse rien de visible — elle publie simplement le
// mauvais retour à un élève, ou en oublie un dans la pile. D'où l'extraction
// hors du composant et les tests de garde (utils/validation-lot.test.ts).
//
// Règle générale : la sélection est indexée par DÉPÔT (une ligne = une case),
// et chaque action en déduit le sous-ensemble qui la concerne. Une case cochée
// n'implique donc pas qu'une action donnée s'y applique — l'écran annonce à
// chaque bouton le nombre qu'il traitera réellement, plutôt que d'ignorer en
// silence ce qui ne le concerne pas.
// ----------------------------------------------------------------------------

import type { EleveAvecDepot } from '../types/fragments'

export interface RepartitionLot {
  /** Lignes cochées qui portent un dépôt (les seules sélectionnables). */
  choisis: EleveAvecDepot[]
  /** Analyses à publier : uniquement celles en attente (`generee`). */
  aPublier: EleveAvecDepot[]
  /** Analyses à dépublier : uniquement celles déjà publiées. */
  aDepublier: EleveAvecDepot[]
  /** Relance : tout dépôt coché, analyse existante ou non. */
  cibles: { depotId: string; eleveId: string }[]
}

export function repartirSelection(
  eleves: EleveAvecDepot[],
  selection: ReadonlySet<string>
): RepartitionLot {
  const choisis = eleves.filter(e => e.depot !== null && selection.has(e.depot.id))
  return {
    choisis,
    aPublier: choisis.filter(e => e.analyse?.statut === 'generee'),
    aDepublier: choisis.filter(e => e.analyse?.statut === 'publiee'),
    cibles: choisis.map(e => ({ depotId: e.depot!.id, eleveId: e.id })),
  }
}

/** Les lignes que « tout sélectionner » vise : la pile réelle du prof. */
export function elevesAValider(eleves: EleveAvecDepot[]): EleveAvecDepot[] {
  return eleves.filter(e => e.depot !== null && e.analyse?.statut === 'generee')
}

/**
 * La case d'en-tête est cochée quand TOUTE la pile « à valider » l'est. Pile
 * vide → jamais cochée : sans ce garde, `every` sur un tableau vide rendrait
 * `true` et la case s'afficherait cochée alors que rien ne l'est.
 */
export function toutAValiderEstChoisi(
  eleves: EleveAvecDepot[],
  selection: ReadonlySet<string>
): boolean {
  const pile = elevesAValider(eleves)
  return pile.length > 0 && pile.every(e => selection.has(e.depot!.id))
}

/** Bascule de la case d'en-tête : ajoute toute la pile, ou l'en retire. */
export function basculerPile(
  eleves: EleveAvecDepot[],
  selection: ReadonlySet<string>
): Set<string> {
  const pile = elevesAValider(eleves)
  const suivant = new Set(selection)
  const toutChoisi = toutAValiderEstChoisi(eleves, selection)
  for (const e of pile) {
    if (toutChoisi) suivant.delete(e.depot!.id)
    else suivant.add(e.depot!.id)
  }
  return suivant
}
