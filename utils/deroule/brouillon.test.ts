import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleBrouillonDeroule } from './brouillon'
import { avecBase, ecrireBrouillon, estRestaurableSur, fusionnerBrouillon, lireBrouillon, toutVideHorsBase, type StockageBrouillon } from '../aletheia/brouillon'

function stockage(): StockageBrouillon {
  const m = new Map<string, string>()
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v) }, removeItem: k => { m.delete(k) } }
}

test('la clé porte l’élève, le dépôt, la version et le cas', () => {
  assert.equal(cleBrouillonDeroule('e1', 'd1', 'v1'), 'deroule:brouillon:e1:d1:v1')
  assert.equal(cleBrouillonDeroule('e1', 'd1', 'vf', 2), 'deroule:brouillon:e1:d1:vf:2')
  assert.notEqual(cleBrouillonDeroule('e1', 'd1', 'v1'), cleBrouillonDeroule('e2', 'd1', 'v1'))
  assert.notEqual(cleBrouillonDeroule('e1', 'd1', 'v1', 1), cleBrouillonDeroule('e1', 'd1', 'v1', 2))
  assert.notEqual(cleBrouillonDeroule('e1', 'd1', 'v1'), cleBrouillonDeroule('e1', 'd1', 'vf'))
})

test('un texte du déroulé se garde et se relit sous sa clé, séparé d’Aletheia', () => {
  const s = stockage()
  const cle = cleBrouillonDeroule('e1', 'd1', 'v1')
  ecrireBrouillon(s, cle, { texte: 'Ma thèse, en trois lignes.' })
  assert.deepEqual(lireBrouillon(s, cle), { texte: 'Ma thèse, en trois lignes.' })
  assert.equal(lireBrouillon(s, 'aletheia:brouillon:e1:l1:9:v1'), null)
  ecrireBrouillon(s, cle, { texte: '   ' })
  assert.equal(lireBrouillon(s, cle), null, 'un texte vide n’est pas un brouillon')
})

test('un brouillon pris sur un AUTRE état serveur n’est pas restaurable — le serveur a bougé', () => {
  const s = stockage()
  const cle = cleBrouillonDeroule('e1', 'd1', 'v1')
  const baseTelephone = JSON.stringify({ texte: 'Début écrit au téléphone.' })
  ecrireBrouillon(s, cle, avecBase({ texte: 'Début écrit au téléphone, et huit secondes de plus.' }, baseTelephone))
  const brouillon = lireBrouillon(s, cle)!
  assert.equal(estRestaurableSur(brouillon, baseTelephone), true, 'même base : restaurable')
  const baseOrdinateur = JSON.stringify({ texte: 'Début écrit au téléphone, puis deux paragraphes à l’école.' })
  assert.equal(estRestaurableSur(brouillon, baseOrdinateur), false, 'la base a bougé : on jette')
})

test('un brouillon SANS base (d’avant le 15/09) reste restaurable, et la base ne fuit pas dans la fusion', () => {
  const brouillon = { texte: 'ancien brouillon' }
  assert.equal(estRestaurableSur(brouillon, JSON.stringify({ texte: 'n’importe quoi' })), true)
  const avec = avecBase({ texte: 'nouveau' }, JSON.stringify({ texte: 'serveur' }))
  const fusion = fusionnerBrouillon({ texte: 'serveur' }, avec)
  assert.deepEqual(fusion, { texte: 'nouveau' }, 'la fusion ne garde que les clés de l’écran')
})

test('tout vide hors base ⇒ le brouillon n’existe pas ; la base seule ne le fait pas exister', () => {
  assert.equal(toutVideHorsBase(avecBase({ texte: '  ' }, 'x')), true)
  assert.equal(toutVideHorsBase(avecBase({ texte: 'a' }, 'x')), false)
  assert.equal(toutVideHorsBase({ texte: '' }), true)
})
