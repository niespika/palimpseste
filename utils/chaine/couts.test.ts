// Les garde-fous de la facture. Le seuil d'alerte est un chiffre DU DISPOSITIF
// (70 %) ; le plafond, lui, vit à la configuration. Et « 2N + 4 » ne pilote rien :
// aucun de ces nombres n'en dérive.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SEUIL_ALERTE, appelsDeLErreur, debutDuMois, depotAAtteintSonPlafond,
  etatFacture, partConsommee,
} from './couts'

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

// ── C4-L11 — le BILAN ne perd plus les appels d'une compétence qui a levé ────

test("une erreur qui PORTE ses appels les rend — le bilan ne les jette plus", () => {
  // `SortieNonConforme(motifs, appels)` et `AppelInterrompu(message, appels)`
  // exposent tous deux un `readonly appels` : « les appels RÉELLEMENT dépensés
  // avant l'abandon — l'appelant les compte ». Il ne les comptait pas.
  class SortieNonConformeFactice extends Error {
    readonly appels: number
    constructor(appels: number) { super('x'); this.appels = appels }
  }
  assert.equal(appelsDeLErreur(new SortieNonConformeFactice(3)), 3)
  assert.equal(appelsDeLErreur(Object.assign(new Error('transport'), { appels: 2 })), 2)
})

test("une erreur SANS appels rend 0 — elle n'a rien dépensé au modèle", () => {
  assert.equal(appelsDeLErreur(new Error('bug')), 0)
  assert.equal(appelsDeLErreur(null), 0)
  assert.equal(appelsDeLErreur(undefined), 0)
  assert.equal(appelsDeLErreur('une chaîne'), 0)
  // Ni un compte négatif, ni NaN, ni un « 3 » textuel ne passent pour un compte.
  assert.equal(appelsDeLErreur(Object.assign(new Error('x'), { appels: -1 })), 0)
  assert.equal(appelsDeLErreur(Object.assign(new Error('x'), { appels: Number.NaN })), 0)
  assert.equal(appelsDeLErreur(Object.assign(new Error('x'), { appels: '3' })), 0)
})

test("le bilan reste un CHIFFRE DE DIAGNOSTIC — la garde par dépôt ne bouge pas", () => {
  // « Aucune décision n'en dépend — le plafond par dépôt se lit au nombre de
  //   lignes en base. » La garde lit un compte de lignes, jamais ce bilan.
  assert.equal(depotAAtteintSonPlafond(40, 40), true)
  assert.equal(depotAAtteintSonPlafond(39, 40), false)
})
