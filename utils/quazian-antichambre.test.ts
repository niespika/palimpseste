import test from 'node:test'
import assert from 'node:assert/strict'
import { antichambreEnCours, ANTICHAMBRE_MAX_MS, composerAntichambre, expliquerEssai, PRESENCE_MS } from './quazian-antichambre'

const T = Date.parse('2026-09-23T14:00:00Z')

test('l’antichambre compte les présents de LA CLASSE, et distingue parti / pas arrivé', () => {
  const r = composerAntichambre({
    inscrits: ['a', 'b', 'c'],
    profils: [{ id: 'a', display_name: 'Alma' }, { id: 'b', display_name: 'Basile' }, { id: 'c', display_name: 'Célia' }],
    presences: [
      { eleve_id: 'a', vu_at: new Date(T - 3_000).toISOString() },
      { eleve_id: 'b', vu_at: new Date(T - PRESENCE_MS - 1).toISOString() },
      { eleve_id: 'z', vu_at: new Date(T).toISOString() }, // pas de la classe : ignoré
    ],
    maintenant: T,
  })
  assert.deepEqual(r.lignes.map((l) => [l.id, l.etat]), [['a', 'present'], ['b', 'parti'], ['c', 'absent']])
  assert.equal(r.presents, 1)
  assert.equal(r.total, 3)
})

test('l’essai : chaque réponse dit ce qu’elle rapporte ou coûte, et le calcul tombe juste', () => {
  const sydney = expliquerEssai([100, 0, 0, 0])
  assert.equal(sydney.score, '−10')
  assert.deepEqual(sydney.lignes, ['Sydney : 100 points → −10', 'Canberra, la bonne réponse : 0 point → 0'])
  assert.equal(sydney.calcul, '')
  const canberra = expliquerEssai([0, 100, 0, 0])
  assert.equal(canberra.score, '+10')
  assert.deepEqual(canberra.lignes, ['Canberra, la bonne réponse : 100 points → +10'])
  const nuance = expliquerEssai([30, 70, 0, 0])
  assert.deepEqual(nuance.lignes, ['Sydney : 30 points → −0,9', 'Canberra, la bonne réponse : 70 points → +9,1'])
  assert.equal(nuance.calcul, '−0,9 + 9,1 = +8,2')
  assert.equal(expliquerEssai([50, 50, 0, 0]).calcul, '−2,5 + 7,5 = +5')
  const neutre = expliquerEssai([25, 25, 25, 25])
  assert.equal(neutre.calcul, '−0,625 + 4,375 − 0,625 − 0,625 = +2,5')
})

test('une antichambre oubliée expire au bout de 3 h', () => {
  assert.equal(antichambreEnCours(new Date(T - 60_000).toISOString(), T), true)
  assert.equal(antichambreEnCours(new Date(T - ANTICHAMBRE_MAX_MS - 1).toISOString(), T), false)
  assert.equal(antichambreEnCours(null, T), false)
  assert.equal(antichambreEnCours('n’importe quoi', T), false)
})
