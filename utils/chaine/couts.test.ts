// Les garde-fous de la facture. Le seuil d'alerte est un chiffre DU DISPOSITIF
// (70 %) ; le plafond, lui, vit à la configuration. Et « 2N + 4 » ne pilote rien :
// aucun de ces nombres n'en dérive.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SEUIL_ALERTE, debutDuMois, depotAAtteintSonPlafond, etatFacture, partConsommee } from './couts'

test('le seuil d\'alerte est celui que la mission écrit : 70 %', () => {
  assert.equal(SEUIL_ALERTE, 0.70)
})

test('normal, alerte, coupure — dans cet ordre et sur ces bornes', () => {
  assert.equal(etatFacture({ depenseMois: 10, plafondMensuel: 25 }), 'normal')
  assert.equal(etatFacture({ depenseMois: 17.5, plafondMensuel: 25 }), 'alerte')
  assert.equal(etatFacture({ depenseMois: 24.99, plafondMensuel: 25 }), 'alerte')
  assert.equal(etatFacture({ depenseMois: 25, plafondMensuel: 25 }), 'coupure')
})

test('sans plafond configuré, il n\'y a pas de coupure — et pas de part à annoncer', () => {
  assert.equal(etatFacture({ depenseMois: 1000, plafondMensuel: 0 }), 'normal')
  assert.equal(partConsommee({ depenseMois: 1000, plafondMensuel: 0 }), null)
})

test('une facture illisible rend +∞ côté serveur : la coupure tombe, elle ne s\'ouvre pas', () => {
  assert.equal(etatFacture({ depenseMois: Number.POSITIVE_INFINITY, plafondMensuel: 25 }), 'coupure')
})

test('le plafond d\'appels par dépôt compte les LIGNES du journal', () => {
  assert.equal(depotAAtteintSonPlafond(39, 40), false)
  assert.equal(depotAAtteintSonPlafond(40, 40), true)
  assert.equal(depotAAtteintSonPlafond(1000, 0), false)  // pas de plafond configuré
})

test('le mois se borne en UTC, au premier jour', () => {
  assert.equal(debutDuMois(new Date('2026-08-21T23:30:00Z')), '2026-08-01T00:00:00.000Z')
})
