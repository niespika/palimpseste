import test from 'node:test'
import assert from 'node:assert/strict'
import { bilanPartage, contributionsQuestion, detaillerQuestion, nombre, noteSur20, REPERES, signe } from './quazian-explication-note'
import { calculerScoreBrier } from './brier'

test('la décomposition rend EXACTEMENT le score de Brier, sur toutes les répartitions par pas de 5', () => {
  let n = 0
  for (let a = 0; a <= 100; a += 5)
    for (let b = 0; a + b <= 100; b += 5)
      for (let c = 0; a + b + c <= 100; c += 5) {
        const jetons: [number, number, number, number] = [a, b, c, 100 - a - b - c]
        for (let ok = 0; ok < 4; ok++) {
          const d = detaillerQuestion(jetons, ok)
          assert.ok(Math.abs(d.score - calculerScoreBrier(jetons, ok)) < 0.001, `${jetons} / ${ok}`)
          n++
        }
      }
  assert.equal(n, 1771 * 4)
})

test('les cas que l’élève lira', () => {
  assert.deepEqual(detaillerQuestion([100, 0, 0, 0], 0), { couts: [0, 0, 0, 0], perdu: 0, score: 10 })
  const sur = detaillerQuestion([0, 100, 0, 0], 0)
  assert.deepEqual(sur.couts, [10, 10, 0, 0])
  assert.equal(sur.score, -10)
  const partage = detaillerQuestion([75, 25, 0, 0], 0)
  assert.deepEqual(partage.couts, [0.625, 0.625, 0, 0])
  assert.equal(partage.score, 8.75)
  assert.equal(detaillerQuestion([25, 25, 25, 25], 2).score, 2.5)
})

test('la note /20 : 10 + la moyenne, bornée', () => {
  assert.equal(noteSur20(6.72), 16.72)
  assert.equal(noteSur20(-12), 0)
  assert.equal(noteSur20(10), 20)
})

test('ce que chaque réponse rapporte ou coûte : la somme EST le score, sur toutes les répartitions par pas de 5', () => {
  for (let a = 0; a <= 100; a += 5)
    for (let b = 0; a + b <= 100; b += 5)
      for (let c = 0; a + b + c <= 100; c += 5) {
        const jetons: [number, number, number, number] = [a, b, c, 100 - a - b - c]
        for (let ok = 0; ok < 4; ok++) {
          const parts = contributionsQuestion(jetons, ok)
          assert.ok(Math.abs(parts.reduce((x, y) => x + y, 0) - calculerScoreBrier(jetons, ok)) < 0.0015, `${jetons} / ${ok}`)
          parts.forEach((v, i) => assert.ok(i === ok ? v >= 0 : v <= 0, `signe ${jetons} / ${ok} / ${i}`))
        }
      }
})

test('les cas que Louis veut voir : +10, −0,625, 0', () => {
  assert.deepEqual(contributionsQuestion([100, 0, 0, 0], 0), [10, 0, 0, 0])
  assert.deepEqual(contributionsQuestion([0, 100, 0, 0], 0), [0, -10, 0, 0])
  assert.deepEqual(contributionsQuestion([75, 25, 0, 0], 0), [9.375, -0.625, 0, 0])
  assert.deepEqual(contributionsQuestion([25, 25, 25, 25], 2), [-0.625, -0.625, 4.375, -0.625])
  assert.equal(signe(9.375), '+9,375')
  assert.equal(signe(-0.625), '−0,625')
  assert.equal(signe(0), '0')
  assert.equal(signe(-0), '0')
  assert.equal(nombre(103.75 / 15), '6,92')
})

test('les six repères sont calculés, pas tapés', () => {
  assert.deepEqual(REPERES.map((r) => r.points), [10, 8.75, 5, 2.5, -5, -10])
})

test('la phrase personnelle vise ce qui a coûté le plus', () => {
  const juste = { jetons: [100, 0, 0, 0] as [number, number, number, number], indexCorrect: 0 }
  const toutFaux = { jetons: [0, 100, 0, 0] as [number, number, number, number], indexCorrect: 0 }
  const sur = { jetons: [30, 70, 0, 0] as [number, number, number, number], indexCorrect: 0 }
  assert.equal(bilanPartage([juste, toutFaux, toutFaux]),
    'Sur ce quiz, tu as mis tous tes points sur une mauvaise réponse 2 fois : ça t’a coûté 40 points, sur les 40 que tu as perdus. Si tu avais partagé 50/50 avec la bonne, chacune t’aurait rapporté +5 au lieu de −10.')
  // 30 sur la bonne (+6 − 0,9 = +5,1), 70 sur une mauvaise (−4,9) : +0,2, soit 9,8 perdus.
  assert.equal(bilanPartage([juste, sur]), 'Ta réponse où tu as misé 50 points ou plus sur une mauvaise réponse t’a coûté 9,8 points, sur les 9,8 que tu as perdus.')
  assert.equal(bilanPartage([sur, sur]), 'Tes 2 réponses où tu as misé 50 points ou plus sur une mauvaise réponse t’ont coûté 19,6 points, sur les 19,6 que tu as perdus.')
  assert.equal(bilanPartage([juste, juste]), 'Tu n’as jamais misé gros sur une mauvaise réponse : c’est ce qui protège une note.')
})
