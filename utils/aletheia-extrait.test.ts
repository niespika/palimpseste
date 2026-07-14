// Tests de garde de la renumérotation d'affichage 1..K (Aletheia mode C, fonctions PURES).
// Exécution : `npm test`. Encode l'invariant central : le 1..K est un mapping d'affichage,
// jamais une clé ; et la NON-RÉGRESSION A/B (exposees == [1..N] → identité).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { numeroAffiche, origineDepuisNumero, dansExtrait, titreSeanceAffiche } from './aletheia-extrait'

// Extrait {3,5,7} d'un livre de 12 séances (K=3) — l'exemple canonique du SPEC §6.2.
const EXTRAIT = [3, 5, 7]

test('numeroAffiche : positions 1..K de l’extrait', () => {
  assert.equal(numeroAffiche(EXTRAIT, 3), 1)
  assert.equal(numeroAffiche(EXTRAIT, 5), 2)
  assert.equal(numeroAffiche(EXTRAIT, 7), 3)
})

test('numeroAffiche : 0 pour une séance hors extrait (jamais un index valide)', () => {
  assert.equal(numeroAffiche(EXTRAIT, 4), 0)
  assert.equal(numeroAffiche(EXTRAIT, 6), 0)
  assert.equal(numeroAffiche(EXTRAIT, 99), 0)
})

test('origineDepuisNumero : bijection inverse de numeroAffiche', () => {
  assert.equal(origineDepuisNumero(EXTRAIT, 1), 3)
  assert.equal(origineDepuisNumero(EXTRAIT, 2), 5)
  assert.equal(origineDepuisNumero(EXTRAIT, 3), 7)
  assert.equal(origineDepuisNumero(EXTRAIT, 4), null) // hors bornes
  assert.equal(origineDepuisNumero(EXTRAIT, 0), null) // position 0 invalide
})

test('bijection position ↔ origine sur tout l’extrait', () => {
  for (const o of EXTRAIT) {
    assert.equal(origineDepuisNumero(EXTRAIT, numeroAffiche(EXTRAIT, o)), o)
  }
})

test('dansExtrait : appartenance stricte', () => {
  assert.equal(dansExtrait(EXTRAIT, 3), true)
  assert.equal(dansExtrait(EXTRAIT, 7), true)
  assert.equal(dansExtrait(EXTRAIT, 4), false)
  assert.equal(dansExtrait(EXTRAIT, 0), false)
})

// ── NON-RÉGRESSION A/B : exposees == [1..N] → identité (affichage byte-identique) ──

test('modes A/B (exposees = [1..N]) : numeroAffiche(o) == o, dansExtrait == true', () => {
  const ab = [1, 2, 3, 4, 5]
  for (const o of ab) {
    assert.equal(numeroAffiche(ab, o), o)
    assert.equal(dansExtrait(ab, o), true)
    assert.equal(origineDepuisNumero(ab, o), o)
  }
})

// ── titreSeanceAffiche : anti-fuite du titre par défaut en mode C (finding #1) ──

test('titreSeanceAffiche : mode C neutralise le défaut « Séance {origine} » → position', () => {
  // Extrait {5,6,7} renuméroté {1,2,3}. Séance d'origine 5 sans titre custom.
  assert.equal(titreSeanceAffiche('Séance 5', 5, 1, true), 'Séance 1')
  assert.equal(titreSeanceAffiche('Séance 6', 6, 2, true), 'Séance 2')
})

test('titreSeanceAffiche : un vrai titre custom est INCHANGÉ en mode C', () => {
  assert.equal(titreSeanceAffiche('L’allégorie de la caverne', 5, 1, true), 'L’allégorie de la caverne')
  // Défaut « Semaine » (sans numéro, autre chemin d'authoring) : pas d'ordinal → inchangé.
  assert.equal(titreSeanceAffiche('Semaine', 5, 1, true), 'Semaine')
})

test('titreSeanceAffiche : hors mode C → toujours inchangé (non-régression A/B)', () => {
  assert.equal(titreSeanceAffiche('Séance 5', 5, 5, false), 'Séance 5')
  assert.equal(titreSeanceAffiche('Un titre', 5, 5, false), 'Un titre')
})
