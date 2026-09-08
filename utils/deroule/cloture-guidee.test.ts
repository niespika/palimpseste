import test from 'node:test'
import assert from 'node:assert/strict'
import { clotureDue, credencesCompletes } from './cloture-guidee'

const CAS = (cas: number, jetons = [70, 10, 10, 10]) =>
  ({ cas, forme: 'repartition', jetons, choix: 0, index_correct: 1, candidats: ['a', 'b', 'c', 'd'] })

test('⭐ une paire n’est complète qu’avec SES DEUX crédences', () => {
  assert.equal(credencesCompletes([CAS(1)], 2), false)
  assert.equal(credencesCompletes([CAS(1), CAS(2)], 2), true)
  // Un cran de transformation guidée n'a qu'un cas.
  assert.equal(credencesCompletes([CAS(1)], 1), true)
})

test('⛔ deux crédences sur le MÊME cas ne font pas une paire faite', () => {
  assert.equal(credencesCompletes([CAS(1), CAS(1)], 2), false)
})

test('⛔ une entrée SANS répartition ne compte pas — la zone se pose à part', () => {
  // Depuis la désignation (`02-` §5), l'entrée d'un cas se remplit en deux
  // gestes qui fusionnent. Compter les ENTRÉES fermerait l'exercice avant que
  // l'élève ait répondu.
  assert.equal(credencesCompletes([{ cas: 1, zone: [0, 12], zone_at: 'x' }], 1), false)
  assert.equal(credencesCompletes([{ cas: 1, forme: 'pourcentage', pourcentage: 80 }], 1), false)
})

test('⛔ une répartition mal formée ne clôt rien', () => {
  assert.equal(credencesCompletes([{ ...CAS(1), jetons: [50, 50] }], 1), false)
  assert.equal(credencesCompletes([{ ...CAS(1), jetons: [1, 2, 3, 'x'] }], 1), false)
  assert.equal(credencesCompletes([{ ...CAS(1), index_correct: null }], 1), false)
})

test('⛔ on ne clôt pas un exercice dont on ignore le nombre de cas', () => {
  assert.equal(credencesCompletes([CAS(1)], 0), false)
  assert.equal(credencesCompletes([CAS(1)], -1), false)
  assert.equal(credencesCompletes([CAS(1)], 1.5), false)
})

test('la lecture ne casse jamais sur une base illisible', () => {
  assert.equal(credencesCompletes(null, 1), false)
  assert.equal(credencesCompletes('pas un tableau', 1), false)
  assert.equal(credencesCompletes([null, 42, 'x'], 1), false)
})

test('⭐⭐ la clôture ne vaut QUE pour la forme `choisir`', () => {
  const base = { dejaRemis: false, credences: [CAS(1)], nombreDeCas: 1 }
  assert.equal(clotureDue({ ...base, forme: 'choisir' }), true)
  // ⛔ Là où l'élève RÉDIGE, sa remise est son geste : on ne clôt jamais à sa place.
  assert.equal(clotureDue({ ...base, forme: 'rediger' }), false)
  assert.equal(clotureDue({ ...base, forme: 'surligner' }), false)
})

test('⭐ la clôture est IDEMPOTENTE — un second passage ne réécrit rien', () => {
  const base = { forme: 'choisir', credences: [CAS(1)], nombreDeCas: 1 }
  assert.equal(clotureDue({ ...base, dejaRemis: false }), true)
  assert.equal(clotureDue({ ...base, dejaRemis: true }), false)
})

// ── ⭐⭐ LA SECONDE FAMILLE : LA PAIRE 4(b)/4(b) (Louis, 07/09/2026) ──────────
// Tous les cas se surlignent : plus aucun texte, `remettre` refuserait « Ta
// copie est vide », l'exercice se clôt donc à la dernière crédence.

const zoneEtCredence = (cas: number) => ({
  cas, forme: 'pourcentage', pourcentage: 70, at: 'x',
  zone: [10, 20], zone_at: '2026-09-07T20:00:00Z',
})

test('4(b)/4(b) — la clôture est due quand les DEUX cas ont zone ET crédence', () => {
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: false, nombreDeCas: 2, sansRemise: true,
    credences: [zoneEtCredence(1), zoneEtCredence(2)],
  }), true)
})

test('⛔ on ne clôt PAS sur la crédence seule — l’élève n’a pas encore surligné', () => {
  const sansZone = { cas: 2, forme: 'pourcentage', pourcentage: 50, at: 'x' }
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: false, nombreDeCas: 2, sansRemise: true,
    credences: [zoneEtCredence(1), sansZone],
  }), false)
})

test('⛔ ni sur la zone seule — la crédence manque', () => {
  const sansCredence = { cas: 2, zone: [1, 2], zone_at: '2026-09-07T20:00:00Z' }
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: false, nombreDeCas: 2, sansRemise: true,
    credences: [zoneEtCredence(1), sansCredence],
  }), false)
})

test('une zone NULLE est une réponse — « rien à signaler » clôt aussi', () => {
  const rienASignaler = {
    cas: 2, forme: 'pourcentage', pourcentage: 40, at: 'x',
    zone: null, zone_at: '2026-09-07T20:00:00Z',
  }
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: false, nombreDeCas: 2, sansRemise: true,
    credences: [zoneEtCredence(1), rienASignaler],
  }), true)
})

test('⛔⛔ sans le drapeau, rien ne change — un exercice à rédiger ne se clôt jamais', () => {
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: false, nombreDeCas: 2,
    credences: [zoneEtCredence(1), zoneEtCredence(2)],
  }), false)
  assert.equal(clotureDue({
    forme: 'rediger', dejaRemis: false, nombreDeCas: 2,
    credences: [zoneEtCredence(1), zoneEtCredence(2)],
  }), false)
})

test('un dépôt déjà remis ne se re-clôt pas, drapeau ou non', () => {
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: true, nombreDeCas: 2, sansRemise: true,
    credences: [zoneEtCredence(1), zoneEtCredence(2)],
  }), false)
})

test('⛔ la forme à JETONS des crans guidés ne clôt PAS un 4(b) — et l’inverse', () => {
  const jetons = (cas: number) => ({ cas, jetons: [25, 25, 25, 25], index_correct: 0 })
  // Des jetons sans zone : refusé sous le drapeau du 4(b).
  assert.equal(clotureDue({
    forme: 'surligner', dejaRemis: false, nombreDeCas: 2, sansRemise: true,
    credences: [jetons(1), jetons(2)],
  }), false)
  // Et les crans guidés gardent leur règle à eux, inchangée.
  assert.equal(clotureDue({
    forme: 'choisir', dejaRemis: false, nombreDeCas: 2,
    credences: [jetons(1), jetons(2)],
  }), true)
})
