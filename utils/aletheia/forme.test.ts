// Tests de garde de la décision de forme (E2). Exécution : `npm test`.
// Encode D10 (axe arguments, hystérésis de deux séances, asymétrie vers plus d'aide)
// et D13 (séance 1 = montre pour tout le monde).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decider, cibleDuNiveau, niveauRetenu, type NiveauSeance } from './forme'

const s = (semaine: number, vf: number | null, v1: number | null = null): NiveauSeance =>
  ({ semaine, niveau_arguments_vf: vf, niveau_arguments_v1: v1 })

test('cible par niveau : E, D → montre ; C, B → fenêtre ; A → demi-section', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(cibleDuNiveau), ['montre', 'montre', 'fenetre', 'fenetre', 'demi_section'])
})

test('niveau retenu : la VF d’abord, la V1 à défaut, null si rien', () => {
  assert.equal(niveauRetenu(s(1, 3, 1)), 3)
  assert.equal(niveauRetenu(s(1, null, 1)), 1)
  assert.equal(niveauRetenu(s(1, null, null)), null)
})

test('séance 1 ou aucun diagnostic → montre, quelle que soit la forme courante', () => {
  assert.equal(decider([], null).forme, 'montre')
  assert.equal(decider([], 'demi_section').forme, 'montre')
  assert.equal(decider([s(1, null, null)], 'fenetre').forme, 'montre')
})

test('deux séances consécutives à C sortent de montre vers fenêtre ; une seule ne suffit pas', () => {
  assert.equal(decider([s(1, 2)], 'montre').forme, 'montre')
  assert.equal(decider([s(1, 2), s(2, 2)], 'montre').forme, 'fenetre')
  assert.equal(decider([s(1, 1), s(2, 2)], 'montre').forme, 'montre')
})

test('un E isolé après deux C ramène à montre tout de suite (asymétrie)', () => {
  const d = decider([s(1, 2), s(2, 2), s(3, 0)], 'fenetre')
  assert.equal(d.forme, 'montre')
  assert.match(d.motif, /plus d'aide tout de suite/)
})

test('de fenêtre à demi-section : deux A consécutifs ; un A puis un B reste en fenêtre', () => {
  assert.equal(decider([s(1, 2), s(2, 2), s(3, 4)], 'fenetre').forme, 'fenetre')
  assert.equal(decider([s(1, 2), s(2, 4), s(3, 4)], 'fenetre').forme, 'demi_section')
  assert.equal(decider([s(1, 4), s(2, 3)], 'fenetre').forme, 'fenetre')
})

test('la forme courante est confirmée quand la cible du dernier niveau la rejoint', () => {
  const d = decider([s(1, 2), s(2, 3)], 'fenetre')
  assert.equal(d.forme, 'fenetre')
  assert.match(d.motif, /confirmée/)
})

test('deux séances d’accord permettent de sauter un rang (montre → demi-section)', () => {
  assert.equal(decider([s(1, 4), s(2, 4)], 'montre').forme, 'demi_section')
})

test('ordre quelconque et doublons : le tri par semaine fait foi, le dernier doublon gagne', () => {
  const d = decider([s(2, 2), s(1, 0), s(2, 3)], 'montre')
  assert.deepEqual(d.niveaux, [{ semaine: 1, niveau: 0 }, { semaine: 2, niveau: 3 }])
  assert.equal(d.forme, 'montre')   // 1 → E, 2 → B : une seule séance au-dessus
})

test('niveaux hors bornes ou décimaux sont ramenés à 0…4', () => {
  assert.equal(niveauRetenu(s(1, 7)), 4)
  assert.equal(niveauRetenu(s(1, -2)), 0)
  assert.equal(niveauRetenu(s(1, 2.6)), 3)
})

test('variante symétrique : un D isolé après deux C ne ramène PAS à montre ; deux D le font', () => {
  const sym = { asymetrique: false }
  assert.equal(decider([s(1, 2), s(2, 2), s(3, 1)], 'fenetre', sym).forme, 'fenetre')
  assert.equal(decider([s(1, 2), s(2, 2), s(3, 1), s(4, 1)], 'fenetre', sym).forme, 'montre')
  // Le défaut reste asymétrique (D10).
  assert.equal(decider([s(1, 2), s(2, 2), s(3, 1)], 'fenetre').forme, 'montre')
})
