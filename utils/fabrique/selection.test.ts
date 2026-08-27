// ============================================================================
// C5 · L1 — La sélection dans le texte : ce qu'elle couvre, ce qui l'empêche.
// ============================================================================

import test from 'node:test'
import assert from 'node:assert/strict'

import { etendueDe, empechementsDeLaSelection } from './selection'

const T = 'Le premier mot compte. La deuxième phrase suit. Puis la troisième.'

test('une sélection sur un seul mot vaut `mot`', () => {
  const i = T.indexOf('premier')
  assert.equal(etendueDe(T, [i, i + 'premier'.length]), 'mot')
})

test('une sélection qui couvre une phrase entière vaut `phrase`', () => {
  assert.equal(etendueDe(T, [0, 'Le premier mot compte.'.length]), 'phrase')
})

test('plusieurs mots d’une même phrase valent `phrase` — pas `mot`', () => {
  const i = T.indexOf('premier mot')
  assert.equal(etendueDe(T, [i, i + 'premier mot'.length]), 'phrase')
})

test('une sélection à cheval sur deux phrases vaut `extrait`', () => {
  const i = T.indexOf('compte')
  const f = T.indexOf('phrase') + 'phrase'.length
  assert.equal(etendueDe(T, [i, f]), 'extrait')
})

test('une sélection qui touche TOUTES les phrases vaut `texte`', () => {
  assert.equal(etendueDe(T, [0, T.length]), 'texte')
})

test('un intervalle vide, inversé ou absent ne rend aucune étendue', () => {
  assert.equal(etendueDe(T, null), null)
  assert.equal(etendueDe(T, [5, 5]), null)
  assert.equal(etendueDe(T, [9, 3]), null)
  assert.equal(etendueDe('', [0, 3]), null)
})

test('l’englobant doit CONTENIR la sélection — « la portion affichée autour »', () => {
  const e = empechementsDeLaSelection(T, [5, 40], [0, 22], null)
  assert.equal(e.length, 1)
  assert.match(e[0], /doit la contenir/)
  assert.deepEqual(empechementsDeLaSelection(T, [5, 20], [0, 22], null), [])
})

test('des bornes hors du texte, ou vides, se disent', () => {
  assert.ok(empechementsDeLaSelection(T, [0, T.length + 5], null, null)
    .some((x) => x.includes('sortent du texte')))
  assert.ok(empechementsDeLaSelection(T, [4, 4], null, null)
    .some((x) => x.includes('vide')))
})

test('sur l’objet « la phrase », l’englobant est OBLIGATOIRE et non vide', () => {
  assert.ok(empechementsDeLaSelection(T, [0, 22], null, 'phrase')
    .some((x) => x.includes('obligatoire et non vide')))
  assert.deepEqual(empechementsDeLaSelection(T, [0, 22], [0, 47], 'phrase'), [])
  // Sur un autre objet, rien n'est exigé.
  assert.deepEqual(empechementsDeLaSelection(T, [0, 22], null, 'argument'), [])
})
