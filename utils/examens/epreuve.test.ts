// ============================================================================
// CODEX — L'ÉPREUVE MINUTÉE : CE QUE LA FRISE DOIT PROUVER SANS BASE (24/09).
// ----------------------------------------------------------------------------
// La frise est calculée À TROIS ENDROITS — le serveur (ouverture automatique du
// dépôt), la projection, la tablette — à partir des mêmes trois valeurs. Ces
// tests tiennent le calcul commun, et les deux arbitrages qu'il porte : la
// moitié arrondie à la minute pleine SUPÉRIEURE, et les paliers arrondis vers
// le HAUT (la valeur affichée est toujours une borne vraie).
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MINUTE, etatDeLEpreuve, ouvertureAutomatique, palierMinutes, libelleDuree, heureMurale,
  lireDuree, BORNES_REDACTION, BORNES_RELECTURE, TEXTES_EPREUVE, avecHeure,
} from './epreuve'

const DEBUT = '2026-09-29T13:02:00.000Z'   // 9 h 02 à Montréal (EDT), à la minute pleine
const T0 = Date.parse(DEBUT)
const R = { debut: DEBUT, redactionMin: 90, relectureMin: 15 }

// ── L'OUVERTURE AUTOMATIQUE : la moitié, à la minute pleine supérieure ────────

test('le dépôt s’ouvre à la MOITIÉ du temps de rédaction (90 min → 45 min)', () => {
  assert.equal(ouvertureAutomatique(T0, 90), T0 + 45 * MINUTE)
})

test('une durée impaire s’arrondit à la minute SUPÉRIEURE (45 min → 23), jamais avant la moitié', () => {
  assert.equal(ouvertureAutomatique(T0, 45), T0 + 23 * MINUTE)
  assert.ok(ouvertureAutomatique(T0, 45) >= T0 + 22.5 * MINUTE)
})

test('l’INSTANT s’arrondit aussi à la minute pleine : l’heure annoncée est l’heure où il s’ouvre', () => {
  const lanceA = Date.parse('2026-09-29T14:00:40.000Z')   // 10 h 00 min 40 s
  const ouv = ouvertureAutomatique(lanceA, 90)
  assert.equal(new Date(ouv).toISOString(), '2026-09-29T14:46:00.000Z')
  assert.equal(heureMurale(ouv, 'America/Toronto'), '10 h 46')
  assert.ok(ouv >= lanceA + 45 * MINUTE)
})

test('l’heure d’ouverture POSÉE au lancement fait foi : un « +5 min » ne la déplace pas', () => {
  const pose = { ...R, ouverture: new Date(T0 + 45 * MINUTE).toISOString() }
  const apres = etatDeLEpreuve({ ...pose, redactionMin: 95 }, T0 + 46 * MINUTE)
  assert.equal(apres.ouvertureVenue, true)
  assert.equal(apres.ouvertureMs, T0 + 45 * MINUTE)
  assert.equal(apres.finRedactionMs, T0 + 95 * MINUTE)
})

// ── LA FRISE ──────────────────────────────────────────────────────────────────

test('non lancée : phase « avant », aucun instant, aucune ouverture', () => {
  const e = etatDeLEpreuve({ ...R, debut: null }, T0)
  assert.equal(e.phase, 'avant')
  assert.equal(e.debutMs, null)
  assert.equal(e.ouvertureVenue, false)
  assert.equal(e.restantMs, null)
})

test('un début illisible vaut « non lancée » — jamais une frise fabriquée', () => {
  assert.equal(etatDeLEpreuve({ ...R, debut: 'pas une date' }, T0).phase, 'avant')
})

test('pendant la rédaction, avant la moitié : dépôt fermé, temps restant de RÉDACTION', () => {
  const e = etatDeLEpreuve(R, T0 + 10 * MINUTE)
  assert.equal(e.phase, 'redaction')
  assert.equal(e.ouvertureVenue, false)
  assert.equal(e.restantMs, 80 * MINUTE)
})

test('à la moitié pile, le dépôt est ouvert — et la rédaction continue', () => {
  const e = etatDeLEpreuve(R, T0 + 45 * MINUTE)
  assert.equal(e.phase, 'redaction')
  assert.equal(e.ouvertureVenue, true)
})

test('à X pile, la RELECTURE commence : son temps restant est celui de la relecture', () => {
  const e = etatDeLEpreuve(R, T0 + 90 * MINUTE)
  assert.equal(e.phase, 'relecture')
  assert.equal(e.restantMs, 15 * MINUTE)
  assert.equal(e.finRelectureMs, T0 + 105 * MINUTE)
})

test('à X + Y, la fin — rien ne se ferme, c’est un affichage', () => {
  const e = etatDeLEpreuve(R, T0 + 105 * MINUTE)
  assert.equal(e.phase, 'fin')
  assert.equal(e.restantMs, null)
  assert.equal(e.ouvertureVenue, true)
})

test('sans temps de relecture (Y = 0), la rédaction finie mène droit à la fin', () => {
  assert.equal(etatDeLEpreuve({ ...R, relectureMin: 0 }, T0 + 90 * MINUTE).phase, 'fin')
})

// ── LES PALIERS : 10, puis 5, puis 1 — arrondis vers le HAUT ──────────────────

test('au-delà de 30 min : par dizaines, et la valeur est une borne vraie', () => {
  assert.equal(palierMinutes(80 * MINUTE), 80)
  assert.equal(palierMinutes(79 * MINUTE), 80)
  assert.equal(palierMinutes(30 * MINUTE + 1), 40)
})

test('30 min pile s’affiche « 30 » à l’instant exact où c’est vrai', () => {
  assert.equal(palierMinutes(30 * MINUTE), 30)
})

test('de 30 à 10 min : par cinq', () => {
  assert.equal(palierMinutes(29 * MINUTE), 30)
  assert.equal(palierMinutes(25 * MINUTE), 25)
  assert.equal(palierMinutes(24 * MINUTE + 30_000), 25)
  assert.equal(palierMinutes(10 * MINUTE + 1), 15)
})

test('sous 10 min : à la minute ; la dernière minute s’affiche « 1 »', () => {
  assert.equal(palierMinutes(10 * MINUTE), 10)
  assert.equal(palierMinutes(9 * MINUTE + 1), 10)
  assert.equal(palierMinutes(59_000), 1)
  assert.equal(palierMinutes(1), 1)
})

test('à zéro ou en dessous : 0 (jamais un nombre négatif)', () => {
  assert.equal(palierMinutes(0), 0)
  assert.equal(palierMinutes(-5 * MINUTE), 0)
  assert.equal(palierMinutes(Number.NaN), 0)
})

test('le palier ne REMONTE jamais quand le temps passe (monotone, seconde par seconde)', () => {
  let precedent = Infinity
  for (let ms = 120 * MINUTE; ms >= 0; ms -= 1000) {
    const p = palierMinutes(ms)
    assert.ok(p <= precedent, `remonté à ${ms} ms : ${p} > ${precedent}`)
    precedent = p
  }
})

// ── LES LIBELLÉS ──────────────────────────────────────────────────────────────

test('les durées se lisent « 45 min », « 1 h », « 1 h 20 », « 2 h 05 »', () => {
  assert.equal(libelleDuree(45), '45 min')
  assert.equal(libelleDuree(60), '1 h')
  assert.equal(libelleDuree(80), '1 h 20')
  assert.equal(libelleDuree(125), '2 h 05')
  assert.equal(libelleDuree(0), '0 min')
})

test('l’heure murale se lit DANS LE FUSEAU, à la québécoise', () => {
  assert.equal(heureMurale(T0, 'America/Toronto'), '09 h 02')
  // Le même instant, lu à Paris : la page ne dépend pas du fuseau du poste.
  assert.equal(heureMurale(T0, 'Europe/Paris'), '15 h 02')
})

test('les textes à heure portent leur marque, et elle se remplace', () => {
  assert.ok(TEXTES_EPREUVE.eleveEnCours.includes('{heure}'))
  assert.ok(TEXTES_EPREUVE.projectionAvantOuverture.includes('{heure}'))
  assert.ok(avecHeure(TEXTES_EPREUVE.eleveEnCours, '09 h 47').includes('09 h 47'))
})

// ── LA SAISIE DES DURÉES : un refus nommé, jamais une correction muette ──────

test('une durée vide vaut « non posée »', () => {
  assert.deepEqual(lireDuree('', BORNES_REDACTION), { ok: true, valeur: null })
  assert.deepEqual(lireDuree(null, BORNES_REDACTION), { ok: true, valeur: null })
})

test('une durée dans ses bornes est lue ; hors bornes ou non entière, refusée', () => {
  assert.deepEqual(lireDuree(' 90 ', BORNES_REDACTION), { ok: true, valeur: 90 })
  assert.deepEqual(lireDuree('0', BORNES_RELECTURE), { ok: true, valeur: 0 })
  assert.equal(lireDuree('4', BORNES_REDACTION).ok, false)
  assert.equal(lireDuree('301', BORNES_REDACTION).ok, false)
  assert.equal(lireDuree('121', BORNES_RELECTURE).ok, false)
  assert.equal(lireDuree('1,5', BORNES_REDACTION).ok, false)
  assert.equal(lireDuree('-10', BORNES_RELECTURE).ok, false)
})

test('les bornes du code sont celles de la contrainte `exercices_epreuve_chk`', () => {
  assert.deepEqual(BORNES_REDACTION, { min: 5, max: 300 })
  assert.deepEqual(BORNES_RELECTURE, { min: 0, max: 120 })
})
