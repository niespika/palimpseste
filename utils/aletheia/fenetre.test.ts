// Tests de garde des formes et du barème (E6). Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { construireDecoupeSemaine } from './decoupage'
import { fenetreMontre, fenetreCherche, demiSection, bareme, hasard, fenetrePour, LIGNES_MONTRE_MIN_CAR } from './fenetre'
import type { PassageCle } from './passages'

// 40 phrases de ~12 mots (≈ 70 caractères), pivot = phrase 20.
const T = Array.from({ length: 40 }, (_, i) => `Phrase numéro ${i + 1} qui parle de choses assez longues pour compter des mots.`).join(' ')
const D = construireDecoupeSemaine(5, T)
const id = (n: number) => `s5-${String(n).padStart(3, '0')}`
const P: PassageCle = { id: 'k5-1', role: 'these', libelle: 'la phrase', phrase_debut: id(17), phrase_fin: id(24), pivots: [[id(20)]], pivots_texte: [] }

test('montre : pivot ± 1 phrase, étendue jusqu’à dix lignes, pivot mise en évidence', () => {
  const f = fenetreMontre(D, T, P)!
  assert.equal(f.forme, 'montre')
  assert.ok(f.phrases.some(p => p.id === id(19)) && f.phrases.some(p => p.id === id(21)))
  assert.ok(f.phrases.reduce((n, p) => n + p.texte.length + 1, 0) >= LIGNES_MONTRE_MIN_CAR)
  assert.deepEqual(f.enEvidence, [id(20)])
  assert.ok(f.phrases.length <= 14)
})

test('fenêtre : ≥ 400 mots arrondis à la phrase, pivot dedans, position qui dépend de la graine', () => {
  const a = fenetreCherche(D, T, P, 'travail-A')!, b = fenetreCherche(D, T, P, 'travail-B')!
  for (const f of [a, b]) {
    assert.equal(f.forme, 'fenetre')
    assert.ok(f.phrases.reduce((n, p) => n + p.texte.split(' ').length, 0) >= 400)
    assert.ok(f.phrases.some(p => p.id === id(20)))
    assert.equal(f.enEvidence, undefined)
  }
  assert.notEqual(hasard('travail-A'), hasard('travail-B'))
})

test('demi-section : la moitié qui contient la pivot, sans couper de phrase', () => {
  const f = demiSection(D, T, P)!
  assert.equal(f.forme, 'demi_section')
  assert.ok(f.phrases.some(p => p.id === id(20)))
  assert.ok(f.phrases.length >= 18 && f.phrases.length <= 22)
  const f2 = demiSection(D, T, { ...P, pivots: [[id(3)]], phrase_debut: id(1), phrase_fin: id(6) })!
  assert.equal(f2.phrases[0].id, id(1))
  assert.equal(fenetrePour('demi_section', D, T, P, 'x')!.forme, 'demi_section')
})

test('barème en phrases : juste / trop large / presque / bon endroit / ailleurs', () => {
  assert.equal(bareme(D, P, [id(20)]).verdict, 'juste')
  assert.equal(bareme(D, P, [id(19), id(20), id(21)]).verdict, 'juste')      // une phrase de chaque côté
  assert.equal(bareme(D, P, [id(18), id(19), id(20), id(21)]).verdict, 'trop_large')
  assert.equal(bareme(D, P, [id(21)]).verdict, 'bon_endroit')                  // dans le passage, à côté
  assert.equal(bareme(D, P, [id(30)]).verdict, 'ailleurs')
  const P2 = { ...P, pivots: [[id(20), id(21)]] }
  assert.equal(bareme(D, P2, [id(21)]).verdict, 'presque')                     // chevauche sans couvrir
  assert.equal(bareme(D, P2, [id(20), id(21)]).verdict, 'juste')
  assert.equal(bareme(D, P, []).verdict, 'ailleurs')
})

test('barème : plusieurs alternatives, la meilleure gagne', () => {
  const P3 = { ...P, pivots: [[id(18)], [id(22)]] }
  assert.equal(bareme(D, P3, [id(22)]).verdict, 'juste')
  assert.equal(bareme(D, P3, [id(20)]).verdict, 'bon_endroit')
})

test('pivot introuvable dans la découpe ⇒ pas de fenêtre', () => {
  assert.equal(fenetreMontre(D, T, { ...P, pivots: [['s5-999']] }), null)
})

test('barème : vingt surlignages contre la table du § 7.3', () => {
  const P2 = { ...P, pivots: [[id(20), id(21)]], phrase_debut: id(17), phrase_fin: id(24) }
  const cas: [PassageCle, number[], string][] = [
    [P, [20], 'juste'], [P, [19, 20], 'juste'], [P, [20, 21], 'juste'], [P, [19, 20, 21], 'juste'],
    [P, [18, 19, 20], 'trop_large'], [P, [20, 21, 22], 'trop_large'], [P, [17, 18, 19, 20, 21, 22, 23, 24], 'trop_large'],
    [P, [19], 'bon_endroit'], [P, [17], 'bon_endroit'], [P, [24], 'bon_endroit'], [P, [22, 23], 'bon_endroit'],
    [P, [16], 'ailleurs'], [P, [25], 'ailleurs'], [P, [1, 2], 'ailleurs'], [P, [40], 'ailleurs'],
    [P2, [20], 'presque'], [P2, [21], 'presque'], [P2, [19, 20], 'presque'], [P2, [20, 21], 'juste'], [P2, [18, 19, 20, 21], 'trop_large'],
  ]
  assert.equal(cas.length, 20)
  for (const [p, sel, attendu] of cas) assert.equal(bareme(D, p, sel.map(id)).verdict, attendu, `sélection ${sel.join(',')}`)
})
