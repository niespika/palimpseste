import test from 'node:test'
import assert from 'node:assert/strict'
import { clotureDue, credencesCompletes } from './cloture-guidee'

const CAS = (cas: number, jetons = [70, 10, 10, 10]) =>
  ({ cas, forme: 'repartition', jetons, choix: 0, index_correct: 1, candidats: ['a', 'b', 'c', 'd'] })

test('⭐ une paire n’est complète qu’avec SES DEUX crédences', () => {
  assert.equal(credencesCompletes([CAS(1)], 2), false)
  assert.equal(credencesCompletes([CAS(1), CAS(2)], 2), true)
  // Un cran de transformation guidée n'a qu'un cas.
  assert.equal(credencesCompletes([CAS(1)], 1), true)
})

test('⛔ deux crédences sur le MÊME cas ne font pas une paire faite', () => {
  assert.equal(credencesCompletes([CAS(1), CAS(1)], 2), false)
})

test('⛔ une entrée SANS répartition ne compte pas — la zone se pose à part', () => {
  // Depuis la désignation (`02-` §5), l'entrée d'un cas se remplit en deux
  // gestes qui fusionnent. Compter les ENTRÉES fermerait l'exercice avant que
  // l'élève ait répondu.
  assert.equal(credencesCompletes([{ cas: 1, zone: [0, 12], zone_at: 'x' }], 1), false)
  assert.equal(credencesCompletes([{ cas: 1, forme: 'pourcentage', pourcentage: 80 }], 1), false)
})

test('⛔ une répartition mal formée ne clôt rien', () => {
  assert.equal(credencesCompletes([{ ...CAS(1), jetons: [50, 50] }], 1), false)
  assert.equal(credencesCompletes([{ ...CAS(1), jetons: [1, 2, 3, 'x'] }], 1), false)
  assert.equal(credencesCompletes([{ ...CAS(1), index_correct: null }], 1), false)
})

test('⛔ on ne clôt pas un exercice dont on ignore le nombre de cas', () => {
  assert.equal(credencesCompletes([CAS(1)], 0), false)
  assert.equal(credencesCompletes([CAS(1)], -1), false)
  assert.equal(credencesCompletes([CAS(1)], 1.5), false)
})

test('la lecture ne casse jamais sur une base illisible', () => {
  assert.equal(credencesCompletes(null, 1), false)
  assert.equal(credencesCompletes('pas un tableau', 1), false)
  assert.equal(credencesCompletes([null, 42, 'x'], 1), false)
})

test('⭐⭐ la clôture ne vaut QUE pour la forme `choisir`', () => {
  const base = { dejaRemis: false, credences: [CAS(1)], nombreDeCas: 1 }
  assert.equal(clotureDue({ ...base, forme: 'choisir' }), true)
  // ⛔ Là où l'élève RÉDIGE, sa remise est son geste : on ne clôt jamais à sa place.
  assert.equal(clotureDue({ ...base, forme: 'rediger' }), false)
  assert.equal(clotureDue({ ...base, forme: 'surligner' }), false)
})

test('⭐ la clôture est IDEMPOTENTE — un second passage ne réécrit rien', () => {
  const base = { forme: 'choisir', credences: [CAS(1)], nombreDeCas: 1 }
  assert.equal(clotureDue({ ...base, dejaRemis: false }), true)
  assert.equal(clotureDue({ ...base, dejaRemis: true }), false)
})
