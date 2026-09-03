import { test } from 'node:test'
import assert from 'node:assert/strict'
import { segmenterEnCouches } from './couches'

const texte = 'Les vacances représentent un échappatoire, un temps de répit.'

test('sans couche : un seul segment, le texte intact', () => {
  const s = segmenterEnCouches(texte, [])
  assert.deepEqual(s, [{ texte, ids: [], debuts: [] }])
})

test('la concaténation rend la copie à l’octet près, quelles que soient les couches', () => {
  const s = segmenterEnCouches(texte, [
    { id: 'E1', intervalles: [[29, 42]] },
    { id: 'St1', intervalles: [[0, 61]] },
    { id: 'A1', intervalles: [[43, 58], [4, 12]] },
  ])
  assert.equal(s.map((x) => x.texte).join(''), texte)
})

test('un segment partagé porte les deux couches, et le numéro se pose au DÉBUT seulement', () => {
  const s = segmenterEnCouches(texte, [
    { id: 'St1', intervalles: [[0, 61]] },
    { id: 'E1', intervalles: [[29, 42]] },
  ])
  const partage = s.find((x) => x.texte === 'échappatoire,')
  assert.ok(partage)
  assert.deepEqual(partage.ids, ['St1', 'E1'])
  assert.deepEqual(partage.debuts, ['E1'])
  assert.deepEqual(s[0]!.debuts, ['St1'])
  // après le mot partagé, on retombe sur St1 seule, sans nouveau départ
  const apres = s[s.indexOf(partage) + 1]!
  assert.deepEqual(apres.ids, ['St1'])
  assert.deepEqual(apres.debuts, [])
})

test('deux couches côte à côte ne fusionnent pas : chacune garde son départ', () => {
  const s = segmenterEnCouches('un deux', [
    { id: 'a', intervalles: [[0, 2]] },
    { id: 'b', intervalles: [[3, 7]] },
  ])
  assert.deepEqual(s.map((x) => [x.texte, x.ids, x.debuts]), [
    ['un', ['a'], ['a']], [' ', [], []], ['deux', ['b'], ['b']],
  ])
})

test('les bornes hors du texte sont rabattues, les intervalles vides ignorés', () => {
  const s = segmenterEnCouches('abc', [{ id: 'x', intervalles: [[2, 99], [5, 5]] }])
  assert.deepEqual(s.map((x) => [x.texte, x.ids]), [['ab', []], ['c', ['x']]])
})

test('une même couche élidée (deux intervalles) se pose deux fois, avec deux départs', () => {
  const s = segmenterEnCouches('aaa bbb ccc', [{ id: 'e', intervalles: [[0, 3], [8, 11]] }])
  assert.deepEqual(s.filter((x) => x.debuts.includes('e')).map((x) => x.texte), ['aaa', 'ccc'])
})
