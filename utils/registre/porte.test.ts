// C7-L5 — la porte des crans : « deux et deux », les sondes, la semaine de méthode.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { porteDeLObjet, statutDeService, motifDeFermeture, SONDES_DE_MONTEE_MAX } from './porte'
import { cransDebloques, type LigneRegistre } from './reussites'

const ligne = (cran: number, serie: Array<'reussi' | 'rate'>, objet = 'argument'): LigneRegistre => ({
  objet, cran, variante: null,
  reussites: serie.filter((x) => x === 'reussi').length,
  echecs: serie.filter((x) => x === 'rate').length,
  serie, dernierAt: '2026-09-04T00:00:00Z',
})

test('un objet jamais servi est en semaine de méthode : 1, 3 et 4 seulement', () => {
  const p = porteDeLObjet([], 'argument', false)
  assert.equal(p.methode, true)
  assert.equal(statutDeService(p, 1), 'methode')
  assert.equal(statutDeService(p, 4), 'methode')
  assert.equal(statutDeService(p, 2), 'ferme')     // « pas encore produire »
  assert.equal(statutDeService(p, 9), 'ferme')
  assert.match(motifDeFermeture(p, [], 2), /semaine de méthode/)
})

test('après la semaine de méthode, seul le bas des échelles est ouvert', () => {
  const p = porteDeLObjet([], 'argument', true)
  assert.deepEqual(p.ouverts, [1, 2, 3])
  assert.equal(statutDeService(p, 4), 'ferme')
  assert.match(motifDeFermeture(p, [], 4), /cran 1 compte 0 réussite\(s\) sur 2/)
  assert.equal(statutDeService(p, null), 'ouvert')
})

test('deux réussites au cran 1 ouvrent le 4 ; une seule ne suffit pas', () => {
  assert.equal(statutDeService(porteDeLObjet([ligne(1, ['reussi'])], 'argument', true), 4), 'ferme')
  const p = porteDeLObjet([ligne(1, ['reussi', 'rate', 'reussi'])], 'argument', true)
  assert.equal(statutDeService(p, 4), 'ouvert')
  assert.equal(statutDeService(p, 9), 'ferme')
})

test('deux échecs de suite au cran 1 servent le 4 en SONDE, bornée à trois', () => {
  const p = porteDeLObjet([ligne(1, ['reussi', 'rate', 'rate'])], 'argument', true)
  assert.deepEqual(p.sondes, [4])
  assert.equal(statutDeService(p, 4), 'sonde')
  const epuisee = porteDeLObjet([ligne(1, ['rate', 'rate'])], 'argument', true, new Map([[4, SONDES_DE_MONTEE_MAX]]))
  assert.deepEqual(epuisee.sondes, [])
  assert.equal(statutDeService(epuisee, 4), 'ferme')
})

test('deux sondes réussies au 4 tiennent le 1 pour acquis : le 4 est ouvert, et le 9 aussi', () => {
  const registre = [ligne(1, ['rate', 'rate']), ligne(4, ['reussi', 'reussi'])]
  assert.deepEqual(cransDebloques(registre, 'argument'), [1, 2, 3, 4, 9])
  const p = porteDeLObjet(registre, 'argument', true)
  assert.equal(statutDeService(p, 4), 'ouvert')
  assert.deepEqual(p.sondes, [])
})

test('les objets ne se mélangent pas', () => {
  const p = porteDeLObjet([ligne(1, ['reussi', 'reussi'], 'phrase')], 'argument', true)
  assert.equal(statutDeService(p, 4), 'ferme')
})
