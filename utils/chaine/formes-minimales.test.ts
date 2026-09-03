import { test } from 'node:test'
import assert from 'node:assert/strict'
import { valider } from './schema'
import { FORMES_MINIMALES, formeMinimale, releveVide } from './formes-minimales'
import { COMPETENCES } from './types'

test('chaque compétence déclare au moins un P1 et un P2', () => {
  for (const c of COMPETENCES) {
    const formes = FORMES_MINIMALES[c]
    assert.ok(formes.P2, c)
    assert.ok(formes.P1 || formes.P1A, c)
    for (const f of Object.values(formes)) assert.equal(f.type, 'objet_ouvert')
  }
})

test('⭐ un P1 vide est refusé — le trou de l\'audit', () => {
  for (const c of COMPETENCES) {
    const tete = FORMES_MINIMALES[c].P1 ? 'P1' : 'P1A'
    assert.equal(valider({}, formeMinimale(c, tete)).ok, false, c)
  }
})

test('les clés exigées sont celles que les branchements lisent en premier ; le reste passe', () => {
  assert.equal(valider({ unites: [], these_generale: 'x', objections: [] }, formeMinimale('argumentation', 'P1')).ok, true)
  assert.equal(valider({ crible: { requalifications: [] }, levier: 'x', confiance: 'élevée' }, formeMinimale('argumentation', 'P2')).ok, true)
  assert.equal(valider({ blocs: [], jointures: [], promesse: {} }, formeMinimale('structure', 'P1')).ok, true)
  assert.equal(valider({ blocs: [] }, formeMinimale('structure', 'P1')).ok, false)
  assert.equal(valider({ niveau: 'Acquis', grades: { fluidite: 4 }, etiquettes_rejetees: [], reussites_rejetees: [] }, formeMinimale('expression', 'P2')).ok, true)
})

test('un prompt inconnu de la table garde `objet_libre` — il ne casse pas', () => {
  assert.deepEqual(formeMinimale('expression', 'P9'), { type: 'objet_libre' })
})

test('relevé vide : alerte sur une copie qui a des mots, silence sur une copie vide ou un relevé plein', () => {
  assert.match(releveVide('argumentation', 'P1', { unites: [] }, 'Une copie de sept mots, pas plus.') ?? '', /RELEVÉ VIDE/)
  assert.equal(releveVide('argumentation', 'P1', { unites: [{}] }, 'Une copie.'), null)
  assert.equal(releveVide('argumentation', 'P1', { unites: [] }, '   '), null)
  assert.equal(releveVide('questionnement', 'P1', { recadrages: [] }, 'Une copie.'), null)
  assert.equal(releveVide('structure', 'P1', null, 'Une copie.'), null)
})
