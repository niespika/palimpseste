// ============================================================================
// C5 · L1 — La borne d'amont, à la conception : ce qu'on dit, ce qu'on n'invente pas.
// ============================================================================

import test from 'node:test'
import assert from 'node:assert/strict'

import { borneDeConception, phraseDeLaBorne } from './non-spoiler-conception'

test('un texte HORS LIVRE ne porte aucune borne — c’est le repli, pas un défaut', () => {
  const b = borneDeConception({ id: 't1', planLivreReferenceId: null, planSeance: null })
  assert.equal(b.regime, 'hors_livre')
  assert.equal(b.seanceMaxExigee, null)
  assert.deepEqual(b.bornes, [])
  assert.match(phraseDeLaBorne(b), /rien à comparer/)
})

test('un texte du plan porte le COUPLE et son ordinal — jamais la semaine seule', () => {
  const b = borneDeConception({ id: 't2', planLivreReferenceId: 'livre-1', planSeance: 3 })
  assert.equal(b.seanceMaxExigee, 3)
  assert.equal(b.bornes.length, 1)
  assert.equal(b.bornes[0].livreReferenceId, 'livre-1')
  assert.equal(b.bornes[0].planSeance, 3)
  // AUCUN élève : la position reste inconnue, et c'est la vérité de l'écran.
  assert.equal(b.bornes[0].positionEleve, null)
})

test('le couple ne se sépare jamais : une séance sans livre ne borne rien', () => {
  // Le `CHECK` `textes_plan_couple_chk` l'interdit en base ; le code ne s'y fie
  // pas et lit le couple — une moitié seule ne fabrique pas une borne.
  const sansLivre = borneDeConception({ id: 't3', planLivreReferenceId: null, planSeance: 4 })
  assert.equal(sansLivre.regime, 'hors_livre')
  const sansSeance = borneDeConception({ id: 't4', planLivreReferenceId: 'livre-1', planSeance: null })
  assert.equal(sansSeance.regime, 'hors_livre')
})

test('la phrase dite au professeur ne prétend JAMAIS savoir où en est un élève', () => {
  const b = borneDeConception({ id: 't5', planLivreReferenceId: 'livre-1', planSeance: 2 })
  const p = phraseDeLaBorne(b, 'Les Méditations')
  assert.ok(p.includes('séance 2'))
  assert.ok(p.includes('Les Méditations'))
  assert.match(p, /PAR ÉLÈVE/)
  assert.match(p, /la borne de la classe n’est pas la sienne/)
  // Aucune « position de la classe » n'apparaît nulle part.
  assert.ok(!/position de la classe/i.test(p))
})

test('un livre sans titre lisible ne fait pas disparaître la borne', () => {
  const b = borneDeConception({ id: 't6', planLivreReferenceId: 'livre-1', planSeance: 5 })
  assert.ok(phraseDeLaBorne(b, null).includes('séance 5'))
  assert.ok(phraseDeLaBorne(b, '   ').includes('le livre déclaré'))
})
