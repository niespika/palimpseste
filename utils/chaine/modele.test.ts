// Le régime de modèle (`07-` §6). Deux pièges coûtent une facture ou une lettre :
//   · « un FORMATIF PASSÉ EN CLASSE est de la trajectoire — modèle économique » ;
//   · « les trois étages d'une chaîne prennent LE MÊME MODÈLE ».
// Et le partage est DÉBRAYABLE : tout-au-fort tant que la contre-épreuve du §6
// n'a pas tranché.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  etagesAccordes, formeDepuisLePlan, modeleDeLaChaine, regimeDeLaMesure,
  type ConfigModeles,
} from './modele'

const PARTAGE: ConfigModeles = { fort: 'FORT', economique: 'ECO', partageActif: true }
const DEBRAYE: ConfigModeles = { ...PARTAGE, partageActif: false }

test('une ancre est `classe` ET `sommatif` — les deux, jamais l\'un', () => {
  assert.equal(regimeDeLaMesure({ lieu: 'classe', forme: 'sommatif' }), 'ancre')
  assert.equal(regimeDeLaMesure({ lieu: 'classe', forme: 'formatif' }), 'trajectoire')
  assert.equal(regimeDeLaMesure({ lieu: 'maison', forme: 'sommatif' }), 'trajectoire')
  assert.equal(regimeDeLaMesure({ lieu: 'maison', forme: 'formatif' }), 'trajectoire')
})

test('la synthèse en classe est une mesure EN CLASSE qui n\'est PAS une ancre', () => {
  // `01-` §10 : elle se passe en classe, sa `forme` vaut `formatif`.
  assert.equal(regimeDeLaMesure({ lieu: 'classe', forme: 'formatif' }), 'trajectoire')
  assert.equal(modeleDeLaChaine({ lieu: 'classe', forme: 'formatif' }, PARTAGE), 'ECO')
})

test('les diagnostics tournent au modèle fort, que `07-` §6 nomme à part', () => {
  assert.equal(modeleDeLaChaine({ lieu: 'classe', forme: 'sommatif', diagnostic: true }, PARTAGE), 'FORT')
})

test('le partage est DÉBRAYABLE, et son défaut est TOUT AU FORT', () => {
  assert.equal(modeleDeLaChaine({ lieu: 'maison', forme: 'formatif' }, DEBRAYE), 'FORT')
  assert.equal(modeleDeLaChaine({ lieu: 'maison', forme: 'formatif' }, PARTAGE), 'ECO')
})

test('les trois étages accordés passent ; un étage qui diverge se dit', () => {
  assert.equal(etagesAccordes({ p1: 'A', p2: 'A', retour: 'A' }), null)
  assert.match(etagesAccordes({ p1: 'A', p2: 'B', retour: 'A' }) ?? '', /le même modèle/)
})

test('le plan dit `evaluatif` / `formatif` ; la mesure dit `sommatif` / `formatif`', () => {
  assert.equal(formeDepuisLePlan('evaluatif'), 'sommatif')
  assert.equal(formeDepuisLePlan('formatif'), 'formatif')
  // Sans ligne de plan, la mesure est de la trajectoire : un exercice de la
  // maison n'est jamais une ancre (`07-` §6).
  assert.equal(formeDepuisLePlan(null), 'formatif')
})
