// Tests du PLAFOND de génération Quazian (fonctions PURES). `npm test`.
// Encode ce que le garde-fou décide :
//  (1) le plafond appartient à la CIBLE, pas au lot — 12 sous-sections ne font
//      pas 12 × N cartes ;
//  (2) un cours court reçoit MOINS que le plafond (la densité décide) ;
//  (3) la répartition rend exactement le total, jamais un de plus ;
//  (4) tout lot non vide est servi tant qu'il reste des cartes ; au-delà, seuls
//      les plus longs le sont — les autres à 0, donc sans appel IA ;
//  (5) le réglage prof est borné, y compris quand la base porte n'importe quoi.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  compterMots,
  plafondValide,
  quotaCible,
  repartirQuotas,
  quotasDesLots,
  MOTS_PAR_CARTE,
  PLAFOND_DEFAUT,
  PLAFOND_MAX,
  PLAFOND_MIN,
} from './quazian-quotas'

// Mesuré en prod le 2026-08-31 — le cours qui a produit ~150 cartes.
// « Qu'est-ce que la Connaissance ? » : 12 sous-sections, tailles réelles.
const SECTIONS_REELLES = [2208, 158, 1101, 1204, 1509, 581, 2078, 1991, 1593, 1389, 1513, 1130]
const MOTS_REELS = 2766

test('le cas réel : 7 pages, 12 sous-sections → 25 cartes en tout, pas 150', () => {
  const total = quotaCible(MOTS_REELS, PLAFOND_DEFAUT)
  assert.equal(total, 25)
  const quotas = repartirQuotas(SECTIONS_REELLES, total)
  assert.equal(quotas.reduce((a, b) => a + b, 0), 25)
  assert.equal(quotas.length, 12)
  // La sous-section de 158 caractères ne pèse pas comme celle de 2 208.
  assert.equal(quotas[1], 1)
  assert.ok(quotas[0] >= 3, `la plus longue devrait être la mieux servie, reçu ${quotas[0]}`)
})

test('un cours court reçoit moins que le plafond', () => {
  assert.equal(quotaCible(800, PLAFOND_DEFAUT), Math.round(800 / MOTS_PAR_CARTE)) // 7
  assert.equal(quotaCible(1100, PLAFOND_DEFAUT), 10)
  assert.ok(quotaCible(1100, PLAFOND_DEFAUT) < PLAFOND_DEFAUT)
})

test('un cours très long est plafonné, pas proportionnel', () => {
  assert.equal(quotaCible(50_000, PLAFOND_DEFAUT), PLAFOND_DEFAUT)
  assert.equal(quotaCible(50_000, 12), 12)
})

test('un corpus vide ne donne aucune carte ; un corpus minuscule en donne peu', () => {
  assert.equal(quotaCible(0, PLAFOND_DEFAUT), 0)
  assert.equal(quotaCible(40, PLAFOND_DEFAUT), 3) // plancher
  assert.equal(quotaCible(40, 2), 2) // …mais jamais au-dessus du plafond
})

test('la répartition rend exactement le total demandé', () => {
  for (const total of [1, 3, 7, 12, 25, 40]) {
    const q = repartirQuotas(SECTIONS_REELLES, total)
    assert.equal(q.reduce((a, b) => a + b, 0), total, `total=${total}`)
    assert.ok(q.every((x) => x >= 0))
  }
})

test('un lot vide ne reçoit rien et ne vole rien aux autres', () => {
  const q = repartirQuotas([1000, 0, 1000], 10)
  assert.deepEqual(q, [5, 0, 5])
})

test('plus de lots que de cartes : les plus longs servis, les autres à 0', () => {
  const q = repartirQuotas([100, 900, 50, 700], 2)
  assert.deepEqual(q, [0, 1, 0, 1])
  assert.equal(q.reduce((a, b) => a + b, 0), 2)
})

test('un lot minuscule à côté d’un lot énorme garde sa carte, sans faire déborder', () => {
  const q = repartirQuotas([10_000, 20, 20], 4)
  assert.equal(q.reduce((a, b) => a + b, 0), 4)
  assert.deepEqual(q, [2, 1, 1])
})

test('cas dégénérés : aucun lot, total nul, longueurs toutes nulles', () => {
  assert.deepEqual(repartirQuotas([], 10), [])
  assert.deepEqual(repartirQuotas([100, 200], 0), [0, 0])
  assert.deepEqual(repartirQuotas([0, 0], 10), [0, 0])
})

test('le réglage prof est borné, quoi que porte la base', () => {
  assert.equal(plafondValide(undefined), PLAFOND_DEFAUT)
  assert.equal(plafondValide(null), PLAFOND_DEFAUT)
  assert.equal(plafondValide('rien'), PLAFOND_DEFAUT)
  assert.equal(plafondValide(0), PLAFOND_MIN)
  assert.equal(plafondValide(-4), PLAFOND_MIN)
  assert.equal(plafondValide(1000), PLAFOND_MAX)
  assert.equal(plafondValide('20'), 20)
  assert.equal(plafondValide(20.6), 21)
})

test('compterMots ignore l’espace et le vide', () => {
  assert.equal(compterMots(''), 0)
  assert.equal(compterMots('   \n  '), 0)
  assert.equal(compterMots('un  deux\ntrois'), 3)
})

// ── Répartition sur les LOTS réels de `genererCartes` ────────────────────────
// Le bras contenu ne mêle jamais cours et texte source ; le bras unité hérité,
// si — un lot de cours plus N extraits. Le quota du cours ne doit pas fondre.

test('un cours découpé : le plafond vaut pour le COURS, pas par sous-section', () => {
  const lots = SECTIONS_REELLES.map((n) => ({ texte: 'mot '.repeat(Math.round(n / 6)), texteSource: false }))
  const q = quotasDesLots(lots, PLAFOND_DEFAUT)
  assert.ok(q.reduce((a, b) => a + b, 0) <= PLAFOND_DEFAUT, `reçu ${q.reduce((a, b) => a + b, 0)}`)
  assert.ok(q.length === 12)
})

test('un cours NON découpé prend tout son quota en un seul lot', () => {
  const q = quotasDesLots([{ texte: 'mot '.repeat(2800), texteSource: false }], PLAFOND_DEFAUT)
  assert.deepEqual(q, [PLAFOND_DEFAUT])
})

test('les textes sources gardent 2 et ne mangent pas le quota du cours', () => {
  const q = quotasDesLots([
    { texte: 'mot '.repeat(2800), texteSource: false },
    { texte: 'extrait court', texteSource: true },
    { texte: 'autre extrait', texteSource: true },
  ], PLAFOND_DEFAUT)
  assert.deepEqual(q, [PLAFOND_DEFAUT, 2, 2])
})

test('une cible sans lot de cours ne calcule aucun quota de cours', () => {
  assert.deepEqual(quotasDesLots([{ texte: 'extrait', texteSource: true }], PLAFOND_DEFAUT), [2])
  assert.deepEqual(quotasDesLots([], PLAFOND_DEFAUT), [])
})

test('un plafond bas se respecte même sur 12 sous-sections (lots à 0, sans appel IA)', () => {
  const lots = SECTIONS_REELLES.map((n) => ({ texte: 'mot '.repeat(Math.round(n / 6)), texteSource: false }))
  const q = quotasDesLots(lots, PLAFOND_MIN)
  assert.equal(q.reduce((a, b) => a + b, 0), PLAFOND_MIN)
  assert.equal(q.filter((x) => x === 0).length, 7)
})
