import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dureeOralSecondes, formaterDuree, messageTirage, MESSAGES_TIRAGE, cadenceDefilement, suiteDuRalenti } from './fragments-oral'

test('durée : 3 min en première, 4 min sinon (terminale, inconnu, nul)', () => {
  assert.equal(dureeOralSecondes('1ere'), 180)
  assert.equal(dureeOralSecondes('Première'), 180)
  assert.equal(dureeOralSecondes('terminale'), 240)
  assert.equal(dureeOralSecondes(null), 240)
  assert.equal(dureeOralSecondes(undefined), 240)
})

test('formaterDuree', () => {
  assert.equal(formaterDuree(0), '0:00')
  assert.equal(formaterDuree(180), '3:00')
  assert.equal(formaterDuree(239), '3:59')
})

test('messageTirage ne répète pas le précédent', () => {
  for (const prec of MESSAGES_TIRAGE) {
    for (let i = 0; i < 20; i++) assert.notEqual(messageTirage(prec, () => i / 20), prec)
  }
  assert.ok(MESSAGES_TIRAGE.includes(messageTirage(null, () => 0.999)))
  assert.ok(MESSAGES_TIRAGE.includes(messageTirage(null, () => 0)))
})

test('cadence : croissante, de ~60 ms à ~520 ms', () => {
  const c = Array.from({ length: 14 }, (_, i) => cadenceDefilement(i, 14))
  for (let i = 1; i < c.length; i++) assert.ok(c[i] >= c[i - 1])
  assert.equal(c[0], 60)
  assert.equal(c[13], 520)
  assert.equal(cadenceDefilement(0, 1), 80)
})

test('suiteDuRalenti finit sur le gagnant et tourne dans la liste', () => {
  const s = suiteDuRalenti(['A', 'B', 'C'], 'B', 5)
  assert.equal(s.length, 5)
  assert.equal(s[s.length - 1], 'B')
  assert.deepEqual(s, ['A', 'B', 'C', 'A', 'B'])
  assert.deepEqual(suiteDuRalenti([], 'X'), ['X'])
  // Un gagnant absent de la liste (exclu entre-temps) : la suite finit quand même sur lui.
  assert.equal(suiteDuRalenti(['A', 'B'], 'Z', 3).at(-1), 'Z')
})
