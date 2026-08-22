// ============================================================================
// C4 · L4 — `photos[]` : ce que la garde exige, et ce qu'elle ne peut pas tenir.
// ----------------------------------------------------------------------------
// « `photos[]` porte l'ORDRE, la ROTATION, une SOMME DE CONTRÔLE, et SAIT DIRE
//   QU'UNE PAGE MANQUE » ; « ton écran doit pouvoir dire qu'une page manque,
//   VRAIMENT — sans quoi la clé est là, typée, et toujours vide de sens. »
//                                                    — `07-` §1.1 ; piège 12
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  auQuartDeTour, estUnQuartDeTour, photoDeposee, marqueurPageManquante,
  renumeroter, refuserPhotos, pagesAvecFichier, rangsManquants, ROTATIONS,
} from './photos'

test('le domaine de `rotation` est le quart de tour, et rien d\'autre', () => {
  assert.deepEqual([...ROTATIONS], [0, 90, 180, 270])
  assert.equal(estUnQuartDeTour(90), true)
  assert.equal(estUnQuartDeTour(3), false)
  assert.equal(estUnQuartDeTour(-90), false)
  assert.equal(estUnQuartDeTour('90'), false)
})

test('auQuartDeTour ramène dans [0, 360[ — la ceinture, pas la bretelle', () => {
  assert.equal(auQuartDeTour(0), 0)
  assert.equal(auQuartDeTour(-90), 270)
  assert.equal(auQuartDeTour(450), 90)
  assert.equal(auQuartDeTour(89), 90)
  assert.equal(auQuartDeTour(Number.NaN), 0)
})

test('`null` et `[]` restent LÉGITIMES — un dépôt sans photo existe', () => {
  assert.equal(refuserPhotos(null), null)
  assert.equal(refuserPhotos([]), null)
})

test('une copie de trois pages passe la garde', () => {
  const p = [
    photoDeposee(1, 'passation/e/d/01.jpg', 'aaa'),
    photoDeposee(2, 'passation/e/d/02.jpg', 'bbb', 90),
    photoDeposee(3, 'passation/e/d/03.jpg', 'ccc', 270),
  ]
  assert.equal(refuserPhotos(p), null)
  assert.equal(pagesAvecFichier(p).length, 3)
  assert.deepEqual(rangsManquants(p), [])
})

test('UNE PAGE QUI MANQUE TIENT SON RANG — quatre pages, dont la troisième absente', () => {
  const p = [
    photoDeposee(1, 'a', 'aaa'),
    photoDeposee(2, 'b', 'bbb'),
    marqueurPageManquante(3),
    photoDeposee(4, 'd', 'ddd'),
  ]
  assert.equal(refuserPhotos(p), null)
  assert.deepEqual(rangsManquants(p), [3])
  // La copie fait bien QUATRE pages, dont trois lisibles — et non trois pages.
  assert.equal(p.length, 4)
  assert.equal(pagesAvecFichier(p).length, 3)
})

test('deux pages manquantes ne sont pas la même page — la somme porte le rang', () => {
  const a = marqueurPageManquante(2)
  const b = marqueurPageManquante(3)
  assert.notEqual(a.somme_controle, b.somme_controle)
  assert.notEqual(a.somme_controle.trim(), '')
})

test('un TROU dans l\'ordre est refusé — une page qui manque se DÉCLARE', () => {
  const p = [photoDeposee(1, 'a', 'aaa'), photoDeposee(3, 'c', 'ccc')]
  assert.ok(refuserPhotos(p)?.motif.includes('rang'))
})

test('deux pages au même rang sont refusées', () => {
  const p = [photoDeposee(1, 'a', 'aaa'), photoDeposee(1, 'b', 'bbb')]
  assert.ok(refuserPhotos(p)?.motif.includes('rang 1'))
})

test('une page manquante PORTEUSE d\'un fichier est refusée — et l\'inverse aussi', () => {
  const menteuse = { ...marqueurPageManquante(1), chemin: 'a' }
  assert.ok(refuserPhotos([menteuse])?.motif.includes('manquante'))
  const orpheline = { ...photoDeposee(1, 'a', 'aaa'), chemin: undefined }
  assert.ok(refuserPhotos([orpheline])?.motif.includes('sans fichier'))
})

test('une rotation hors quart de tour est refusée AVANT la base', () => {
  const p = [{ ...photoDeposee(1, 'a', 'aaa'), rotation: 3 as unknown as 0 }]
  assert.ok(refuserPhotos(p)?.motif.includes('quart de tour'))
})

test('une somme de contrôle vide est refusée — la garde en base l\'exige non vide', () => {
  assert.ok(refuserPhotos([photoDeposee(1, 'a', '   ')])?.motif.includes('somme de contrôle'))
})

test('renumeroter suit l\'ORDRE DU TABLEAU, qui est l\'ordre de lecture', () => {
  const p = renumeroter([
    photoDeposee(7, 'c', 'ccc'),
    photoDeposee(2, 'a', 'aaa'),
    marqueurPageManquante(9),
  ])
  assert.deepEqual(p.map((x) => x.ordre), [1, 2, 3])
  assert.equal(refuserPhotos(p), null)
  assert.deepEqual(rangsManquants(p), [3])
})

test('pagesAvecFichier rend les pages TRIÉES — « transcris dans l\'ordre des images »', () => {
  const p = [photoDeposee(3, 'c', 'ccc'), photoDeposee(1, 'a', 'aaa'), photoDeposee(2, 'b', 'bbb')]
  assert.deepEqual(pagesAvecFichier(p).map((x) => x.ordre), [1, 2, 3])
})
