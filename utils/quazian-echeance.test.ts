// Tests du prédicat « à réviser aujourd'hui » de Quazian (fonction PURE).
// Exécution : `npm test`. Encode la décision du 05/09 :
//  (1) une carte due plus tard DANS LA JOURNÉE (heure de l'école) est déjà due ;
//  (2) une carte due demain 00 h 00 heure de l'école ne l'est pas ;
//  (3) le fuseau décide du jour : même instant, deux réponses ;
//  (4) la comparaison est numérique — `+00:00` et `Z` disent la même chose.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estEchue, seuilEcheanceDuJour } from './quazian-echeance'

const TORONTO = 'America/Toronto'

test('(1) due plus tard dans la journée, heure de l\'école → déjà due', () => {
  // Le 4 septembre 2026, 18 h 00 à Toronto (EDT, UTC-4) = 22:00Z.
  const seuil = seuilEcheanceDuJour(new Date('2026-09-04T22:00:00Z'), TORONTO)
  // Carte due le 4 à 18 h 40 Toronto = 22:40Z.
  assert.equal(estEchue('2026-09-04T22:40:00+00:00', seuil), true)
  // Carte due le 4 à 23 h 59 Toronto = 03:59Z le 5.
  assert.equal(estEchue('2026-09-05T03:59:00+00:00', seuil), true)
})

test('(2) due demain à 00 h 00 heure de l\'école → pas encore', () => {
  const seuil = seuilEcheanceDuJour(new Date('2026-09-04T22:00:00Z'), TORONTO)
  // Le 5 à 00 h 00 Toronto = 04:00Z le 5.
  assert.equal(estEchue('2026-09-05T04:00:00+00:00', seuil), false)
})

test('(3) le fuseau décide du jour', () => {
  // 01:00Z le 5 : c'est encore le 4 à Toronto (21 h), déjà le 5 à Paris (03 h).
  const instant = new Date('2026-09-05T01:00:00Z')
  const due = '2026-09-05T10:00:00+00:00' // le 5 à 06 h Toronto, 12 h Paris
  assert.equal(estEchue(due, seuilEcheanceDuJour(instant, TORONTO)), false)
  assert.equal(estEchue(due, seuilEcheanceDuJour(instant, 'Europe/Paris')), true)
})

test('(4) « +00:00 » et « Z » sont le même instant', () => {
  const seuil = new Date('2026-09-05T03:59:59.999Z').getTime()
  assert.equal(estEchue('2026-09-05T03:59:59.9+00:00', seuil), true)
  assert.equal(estEchue('2026-09-05T03:59:59.9Z', seuil), true)
  assert.equal(estEchue('2026-09-05T04:00:00+00:00', seuil), false)
})
