import test from 'node:test'
import assert from 'node:assert/strict'
import { shuffleArray } from './brier'
import { melangerReponses } from './quazian-melange'

test('le mélange de session : les 24 ordres sortent, chaque position à 25 % (± 1,5)', () => {
  const positions = [0, 0, 0, 0]
  const ordres = new Set<string>()
  const N = 40_000
  for (let k = 0; k < N; k++) {
    const m = shuffleArray([0, 1, 2, 3], `eleve-${k}-quiz-${k * 7919}`)
    positions[m.indexOf(0)]++
    ordres.add(m.join(''))
  }
  assert.equal(ordres.size, 24)
  for (const p of positions) assert.ok(Math.abs(p / N - 0.25) < 0.015, `position à ${((100 * p) / N).toFixed(1)} %`)
})

test('le mélange de session reste déterministe pour une même graine', () => {
  assert.deepEqual(shuffleArray([0, 1, 2, 3], 'abc'), shuffleArray([0, 1, 2, 3], 'abc'))
})

test('à l’enregistrement, la bonne réponse quitte la tête — et reste la bonne', () => {
  const q = { enonce: 'Q', options: ['juste', 'b', 'c', 'd'] as [string, string, string, string], index_correct: 0, concept_tag: 't' }
  const positions = [0, 0, 0, 0]
  for (let k = 0; k < 20_000; k++) {
    const m = melangerReponses(q)
    assert.equal(m.options[m.index_correct], 'juste')
    assert.deepEqual([...m.options].sort(), ['b', 'c', 'd', 'juste'])
    positions[m.index_correct]++
  }
  for (const p of positions) assert.ok(Math.abs(p / 20_000 - 0.25) < 0.02)
  // Tirage imposé : l'ordre est exactement celui de Fisher-Yates.
  const fixe = melangerReponses(q, () => 0)
  assert.deepEqual(fixe.options, ['b', 'c', 'd', 'juste'])
  assert.equal(fixe.index_correct, 3)
})
