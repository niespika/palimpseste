// ============================================================================
// LA RÉPARTITION RELUE (écran 2f). Ce que ce test GARDE :
//   · ⭐⭐ que la lecture part de l'ENTRÉE ÉCRITE, produite par
//     `saisieARegistrer` — donc qu'il n'y a RIEN à lire tant que l'élève n'a pas
//     répondu, et que `indexAttendue` n'a jamais à traverser l'écran de saisie ;
//   · ⭐ que l'ORDRE SERVI est conservé — un tri par jetons ferait lire la
//     première comme « la bonne » ;
//   · ⚠️ que `index_correct` absent rend `attendue: false` PARTOUT : aucune
//     barre verte devinée ;
//   · ⛔ qu'une entrée dépareillée (jetons ≠ candidats) ne s'affiche PAS.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lireLaRepartition, rappelDeLaRepartition } from './repartition'
import { saisieARegistrer, type OffreCredence } from './credence'

const OFFRE: OffreCredence = {
  forme: 'repartition',
  candidats: ['Lecture A', 'Lecture B', 'Lecture C', 'Lecture D'],
  indexAttendue: 1,
  empechement: null,
}

test('⭐ la lecture part de l’entrée que le serveur a écrite', () => {
  const { valeur, refus } = saisieARegistrer(1, OFFRE, { jetons: [60, 30, 10, 0] }, 'x')
  assert.equal(refus, null)

  const lectures = lireLaRepartition(valeur)
  assert.deepEqual(lectures, [
    { candidat: 'Lecture A', jetons: 60, attendue: false },
    { candidat: 'Lecture B', jetons: 30, attendue: true },
    { candidat: 'Lecture C', jetons: 10, attendue: false },
    { candidat: 'Lecture D', jetons: 0, attendue: false },
  ])
})

test('⭐ l’ordre servi est conservé, jamais un classement', () => {
  const { valeur } = saisieARegistrer(1, OFFRE, { jetons: [0, 10, 30, 60] }, 'x')
  const lectures = lireLaRepartition(valeur)!
  assert.deepEqual(lectures.map((l) => l.candidat),
    ['Lecture A', 'Lecture B', 'Lecture C', 'Lecture D'])
})

test('⚠️ sans `index_correct`, aucune barre verte n’est devinée', () => {
  const lectures = lireLaRepartition({
    forme: 'repartition', candidats: ['A', 'B'], jetons: [70, 30],
  })
  assert.deepEqual(lectures?.map((l) => l.attendue), [false, false])
})

test('⛔ rien à afficher hors d’une répartition donnée', () => {
  assert.equal(lireLaRepartition(null), null)
  assert.equal(lireLaRepartition(undefined), null)
  // La forme `pourcentage` : aucun candidat n'a été servi, il n'y a rien à relire.
  const { valeur } = saisieARegistrer(1, { ...OFFRE, forme: 'pourcentage', candidats: [] },
    { pourcentage: 50 }, 'x')
  assert.equal(lireLaRepartition(valeur), null)
  // Dépareillé : on n'affiche pas les jetons d'une lecture sous le libellé d'une autre.
  assert.equal(lireLaRepartition(
    { forme: 'repartition', candidats: ['A', 'B', 'C'], jetons: [50, 50] }), null)
  assert.equal(lireLaRepartition({ forme: 'repartition', candidats: [], jetons: [] }), null)
})

test('le rappel du téléphone tient sur une ligne et tait les zéros', () => {
  const lectures = lireLaRepartition(
    saisieARegistrer(1, OFFRE, { jetons: [60, 30, 10, 0] }, 'x').valeur)!
  assert.equal(rappelDeLaRepartition(lectures), 'A 60 · B 30 · C 10')
  assert.equal(rappelDeLaRepartition([]), '')
})
