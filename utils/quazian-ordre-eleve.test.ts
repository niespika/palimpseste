import test from 'node:test'
import assert from 'node:assert/strict'
import { remettreDansOrdreEleve } from './quazian-ordre-eleve'

const questions = [
  { id: 'q1', enonce: 'Première', options: ['A0', 'A1', 'A2', 'A3'], index_correct: 2 },
  { id: 'q2', enonce: 'Seconde', options: ['B0', 'B1', 'B2', 'B3'], index_correct: 0 },
]

test('le retour suit l’ordre des questions ET des réponses de la session de l’élève', () => {
  const r = remettreDansOrdreEleve(
    questions,
    [{ question_id: 'q1', p_a: 0, p_b: 0, p_c: 0.75, p_d: 0.25, repondu: true, score: 8.75 }],
    ['q2', 'q1'],
    { q1: [3, 2, 0, 1], q2: [1, 0, 3, 2] },
  )
  assert.deepEqual(r.map((q) => q.id), ['q2', 'q1'])
  const q1 = r[1]
  // L'élève a vu, dans l'ordre : A3, A2, A0, A1 — et la bonne (A2) en deuxième.
  assert.deepEqual(q1.options, ['A3', 'A2', 'A0', 'A1'])
  assert.equal(q1.indexCorrect, 1)
  // Ses points suivent : 25 sur A3, 75 sur A2.
  assert.deepEqual(q1.mesJetons, [25, 75, 0, 0])
  assert.equal(q1.options[q1.indexCorrect], 'A2')
  const q2 = r[0]
  assert.equal(q2.mesJetons, null)
  assert.equal(q2.options[q2.indexCorrect], 'B0')
})

test('sans ordre de session lisible, l’ordre de la base — et rien ne se perd', () => {
  const r = remettreDansOrdreEleve(questions, [], null, { q1: [0, 0, 1, 2] })
  assert.deepEqual(r.map((q) => q.id), ['q1', 'q2'])
  assert.deepEqual(r[0].options, ['A0', 'A1', 'A2', 'A3'])
  assert.equal(r[0].indexCorrect, 2)
})

test('un mélange corrompu (hors 0..3) retombe sur l’ordre de la base', () => {
  const r = remettreDansOrdreEleve([questions[0]], [], ['q1'], { q1: [1, 2, 3, 4] })
  assert.deepEqual(r[0].options, ['A0', 'A1', 'A2', 'A3'])
  assert.equal(r[0].indexCorrect, 2)
})

test('une question absente de l’ordre de session va à la fin', () => {
  const r = remettreDansOrdreEleve(questions, [], ['q2'], null)
  assert.deepEqual(r.map((q) => q.id), ['q2', 'q1'])
})

test('les jetons se lisent en points entiers (0,35 × 100 ne vaut pas 35,000000000000004)', () => {
  const r = remettreDansOrdreEleve(
    [questions[0]],
    [{ question_id: 'q1', p_a: 0.35, p_b: 0.65, p_c: 0, p_d: 0, repondu: true, score: 0 }],
    ['q1'], { q1: [0, 1, 2, 3] },
  )
  assert.deepEqual(r[0].mesJetons, [35, 65, 0, 0])
})
