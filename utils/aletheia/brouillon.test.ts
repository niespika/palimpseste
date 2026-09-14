import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleBrouillon, ecrireBrouillon, fusionnerBrouillon, lireBrouillon, purgerBrouillon, type StockageBrouillon } from './brouillon'

function stockage(): StockageBrouillon & { m: Map<string, string> } {
  const m = new Map<string, string>()
  return { m, getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v) }, removeItem: k => { m.delete(k) } }
}

test('la clé porte l’élève, le livre, la semaine et la phase', () => {
  assert.equal(cleBrouillon('e1', 'l1', 9, 'v1'), 'aletheia:brouillon:e1:l1:9:v1')
  assert.notEqual(cleBrouillon('e1', 'l1', 9, 'v1'), cleBrouillon('e2', 'l1', 9, 'v1'))
  assert.notEqual(cleBrouillon('e1', 'l1', 9, 'v1'), cleBrouillon('e1', 'l1', 9, 'vf'))
  assert.equal(cleBrouillon('e1', 'l1', 9, 'relances', 't1'), 'aletheia:brouillon:e1:l1:9:relances:t1')
  assert.notEqual(cleBrouillon('e1', 'l1', 9, 'relances', 't1'), cleBrouillon('e1', 'l1', 9, 'relances', 't2'))
})

test('écrire puis lire rend les mêmes champs', () => {
  const s = stockage()
  ecrireBrouillon(s, 'k', { these: 'Nietzsche…', args: '' })
  assert.deepEqual(lireBrouillon(s, 'k'), { these: 'Nietzsche…', args: '' })
})

test('un brouillon tout vide n’existe pas : il est retiré', () => {
  const s = stockage()
  ecrireBrouillon(s, 'k', { these: 'x' })
  ecrireBrouillon(s, 'k', { these: '  ', args: '' })
  assert.equal(s.m.has('k'), false)
  assert.equal(lireBrouillon(s, 'k'), null)
})

test('un contenu illisible ou d’une autre forme donne null', () => {
  const s = stockage()
  s.setItem('k', '{pas du json')
  assert.equal(lireBrouillon(s, 'k'), null)
  s.setItem('k', '[1,2]')
  assert.equal(lireBrouillon(s, 'k'), null)
  s.setItem('k', JSON.stringify({ these: 3, args: 'ok' }))
  assert.deepEqual(lireBrouillon(s, 'k'), { args: 'ok' })
})

test('un stockage qui refuse ne casse rien', () => {
  const s: StockageBrouillon = { getItem: () => { throw new Error('quota') }, setItem: () => { throw new Error('quota') }, removeItem: () => { throw new Error('quota') } }
  assert.doesNotThrow(() => ecrireBrouillon(s, 'k', { these: 'x' }))
  assert.equal(lireBrouillon(s, 'k'), null)
  assert.doesNotThrow(() => purgerBrouillon(s, 'k'))
})

test('la fusion prend le brouillon là où il porte la clé, même vide, et l’initial ailleurs', () => {
  const initial = { these: 'V1 de la base', args: 'args V1', accord: 'accord V1' }
  assert.deepEqual(fusionnerBrouillon(initial, null), initial)
  assert.deepEqual(fusionnerBrouillon(initial, { these: 'réécrit', args: '', inconnu: 'ignoré' }), { these: 'réécrit', args: '', accord: 'accord V1' })
})

test('la fusion ne rend jamais undefined, même si l’initial en porte', () => {
  const initial = { these: 'x', args: undefined as unknown as string }
  assert.deepEqual(fusionnerBrouillon(initial, { these: 'y' }), { these: 'y', args: '' })
})

test('purger retire le brouillon', () => {
  const s = stockage()
  ecrireBrouillon(s, 'k', { these: 'x' })
  purgerBrouillon(s, 'k')
  assert.equal(lireBrouillon(s, 'k'), null)
})
