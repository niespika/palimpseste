import { test } from 'node:test'
import assert from 'node:assert/strict'
import { casDuMoment, momentDeLaPaire, versionDuCas } from './paire'

test('le moment suit l’étape, et « passer au second » n’agit qu’à la correction', () => {
  assert.equal(momentDeLaPaire(null, false), 'cas_1')
  assert.equal(momentDeLaPaire('cas_1', true), 'cas_1')
  assert.equal(momentDeLaPaire('credence_1', true), 'cas_1')
  assert.equal(momentDeLaPaire('correction', false), 'correction_1')
  assert.equal(momentDeLaPaire('correction', true), 'cas_2')
  assert.equal(momentDeLaPaire('cas_2', false), 'cas_2')
  assert.equal(momentDeLaPaire('credence_2', false), 'cas_2')
  assert.equal(momentDeLaPaire('correction_2', false), 'fin')
})

test('le cas du moment, et la version que le champ écrit', () => {
  assert.equal(casDuMoment('cas_1'), 1)
  assert.equal(casDuMoment('correction_1'), 1)
  assert.equal(casDuMoment('cas_2'), 2)
  assert.equal(casDuMoment('fin'), 2)
  assert.equal(versionDuCas(true, 2), 'vf')
  assert.equal(versionDuCas(true, 1), 'v1')
  assert.equal(versionDuCas(false, 2), 'v1')
  assert.equal(versionDuCas(false, null), 'v1')
})
