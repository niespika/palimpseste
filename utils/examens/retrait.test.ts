// Tests de la RÈGLE « qu'est-ce qui empêche de retirer un exercice du plan »
// (fonctions PURES). Exécution : `npm test`. Encode ce que le correctif décide :
//  (1) une ASSIGNATION nue ne bloque rien — c'est le cas réel de 1HLP (25 dépôts
//      à `assigne`, aucune copie), et le compter rendait toute assignation
//      irréversible ;
//  (2) tout statut qui a dépassé l'assignation bloque, même sans contenu ;
//  (3) tout contenu bloque, même sous un statut resté `assigne` (brouillon) ;
//  (4) `retire` ne bloque pas — le professeur l'a déjà sorti ;
//  (5) ⚠️ `ouvert` BLOQUE : l'élève a ouvert l'exercice, télémétrie comprise ;
//  (6) une chaîne vide ou un tableau vide ne sont pas du contenu.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { depotPorteDuTravail, depotsQuiBloquent, type DepotPourRetrait } from './retrait'

/** Un dépôt tel qu'il naît à l'assignation : statut par défaut, tout à null. */
const nu = (statut = 'assigne'): DepotPourRetrait => ({
  statut,
  texte_v1: null, texte_vf: null,
  transcription_v1: null, transcription_vf: null,
  photos_v1: null, photos_vf: null,
})

// ── (1) et (4) Ce qui ne bloque pas ─────────────────────────────────────────

test('une assignation nue ne bloque pas le retrait', () => {
  assert.equal(depotPorteDuTravail(nu('assigne')), false)
})

test('un dépôt déjà retiré par le professeur ne bloque pas', () => {
  assert.equal(depotPorteDuTravail(nu('retire')), false)
})

test('⭐ le cas réel de 1HLP : 25 assignations nues, rien ne bloque', () => {
  const classe = Array.from({ length: 25 }, () => nu())
  assert.equal(depotsQuiBloquent(classe), 0)
})

// ── (2) et (5) Les statuts qui bloquent ─────────────────────────────────────

test('tout statut au-delà de l’assignation bloque, même sans contenu', () => {
  for (const s of ['ouvert', 'v1_remis', 'retour_publie', 'vf_remis', 'clos', 'abandonne']) {
    assert.equal(depotPorteDuTravail(nu(s)), true, `statut ${s}`)
  }
})

test('⚠️ `ouvert` bloque — l’élève a ouvert l’exercice, la télémétrie court', () => {
  assert.equal(depotPorteDuTravail(nu('ouvert')), true)
})

// ── (3) Le contenu bloque, quel que soit le statut ──────────────────────────

test('un brouillon sous un statut resté `assigne` bloque quand même', () => {
  assert.equal(depotPorteDuTravail({ ...nu(), texte_v1: 'trois mots écrits' }), true)
})

test('chaque champ de contenu bloque à lui seul', () => {
  const champs: (keyof DepotPourRetrait)[] = [
    'texte_v1', 'texte_vf', 'transcription_v1', 'transcription_vf',
  ]
  for (const c of champs) {
    assert.equal(depotPorteDuTravail({ ...nu(), [c]: 'x' }), true, String(c))
  }
  assert.equal(depotPorteDuTravail({ ...nu(), photos_v1: [{ chemin: 'a.jpg' }] }), true)
  assert.equal(depotPorteDuTravail({ ...nu(), photos_vf: [{ chemin: 'b.jpg' }] }), true)
})

// ── (6) Ce qui ressemble à du contenu et n'en est pas ───────────────────────

test('une chaîne vide ou blanche n’est pas du contenu', () => {
  assert.equal(depotPorteDuTravail({ ...nu(), texte_v1: '' }), false)
  assert.equal(depotPorteDuTravail({ ...nu(), texte_v1: '   \n  ' }), false)
})

test('un tableau de photos VIDE n’est pas du contenu', () => {
  assert.equal(depotPorteDuTravail({ ...nu(), photos_v1: [] }), false)
})

// ── Le comptage mêlé ────────────────────────────────────────────────────────

test('le compte ne retient que les dépôts qui portent quelque chose', () => {
  const lot: DepotPourRetrait[] = [
    nu(), nu(), nu('retire'),
    nu('v1_remis'),
    { ...nu(), texte_v1: 'une copie' },
    { ...nu(), photos_v1: [] },
  ]
  assert.equal(depotsQuiBloquent(lot), 2)
})
