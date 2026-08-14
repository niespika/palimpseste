// Tests de la RÈGLE de visibilité des cartes Quazian (C7 · L3, fonction PURE).
// Exécution : `npm test`. Encode ce que le lot décide :
//  (1) carte née d'une SOUS-SECTION → il faut que CETTE sous-section soit vue ;
//  (2) carte au grain CONTENU → il suffit que le contenu soit ENTAMÉ (R7) ;
//  (3) une sous-section vue n'ouvre PAS les autres sous-sections du même cours ;
//  (4) plus aucune publication ne joue au bras contenu — seul le « vu » décide ;
//  (5) bras UNITÉ hérité inchangé (tuple (unité, semaine), semaine nulle = tout).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  carteVisible,
  compterVisibles,
  perimetreVide,
  type PerimetreCartes,
  type CarteAncree,
} from './quazian-visibilite'

const COURS = 'contenu-cours'
const TEXTE = 'contenu-texte'
const S1 = 'section-1'
const S2 = 'section-2'
const UNITE = 'unite-heritee'

/** Cours découpé dont SEULE la première sous-section est vue ; texte non entamé. */
function perimetre(): PerimetreCartes {
  return {
    ...perimetreVide(),
    contenusEntames: new Set([COURS]),
    sectionsVues: new Set([S1]),
  }
}

// ── Bras contenu : les deux grains ───────────────────────────────────────────

test('carte de sous-section : visible si CETTE sous-section est vue, sinon non', () => {
  const p = perimetre()
  assert.equal(carteVisible({ contenu_id: COURS, section_id: S1 }, p), true)
  assert.equal(carteVisible({ contenu_id: COURS, section_id: S2 }, p), false)
})

test('carte au grain contenu : il suffit que le contenu soit ENTAMÉ (R7)', () => {
  const p = perimetre()
  // Le cours a une sous-section vue → il est entamé : ses cartes « cours entier »
  // (ajout manuel, carte d'avant L3, carte dé-granulée par une re-découpe) passent.
  assert.equal(carteVisible({ contenu_id: COURS, section_id: null }, p), true)
  // Le texte source n'a aucun élément vu → rien ne passe.
  assert.equal(carteVisible({ contenu_id: TEXTE, section_id: null }, p), false)
})

test('un contenu jamais entamé ne laisse rien passer, quel que soit le grain', () => {
  const p = perimetreVide()
  assert.equal(carteVisible({ contenu_id: COURS, section_id: null }, p), false)
  assert.equal(carteVisible({ contenu_id: COURS, section_id: S1 }, p), false)
})

test('la publication ne joue plus au bras contenu : une unité publiée n’ouvre rien', () => {
  const p: PerimetreCartes = { ...perimetreVide(), unitesPubliees: [COURS, UNITE] }
  assert.equal(carteVisible({ contenu_id: COURS, section_id: null }, p), false)
})

// ── Bras unité hérité — inchangé ─────────────────────────────────────────────

test('bras unité : tuple (unité, semaine) exigé ; semaine nulle = toute l’unité', () => {
  const p: PerimetreCartes = {
    ...perimetreVide(),
    unitesPubliees: [UNITE],
    tuplesVisibles: new Set([`${UNITE}:3`]),
  }
  assert.equal(carteVisible({ scriptorium_unite_id: UNITE, semaine: 3 }, p), true)
  assert.equal(carteVisible({ scriptorium_unite_id: UNITE, semaine: 4 }, p), false)
  assert.equal(carteVisible({ scriptorium_unite_id: UNITE, semaine: null }, p), true)
})

test('le « vu » d’un contenu n’ouvre pas une carte du bras hérité', () => {
  const p = perimetre()
  assert.equal(carteVisible({ scriptorium_unite_id: UNITE, semaine: 3 }, p), false)
})

// ── Comptage (écran prof) ────────────────────────────────────────────────────

test('compterVisibles applique EXACTEMENT la même règle que l’élève', () => {
  const cartes: CarteAncree[] = [
    { contenu_id: COURS, section_id: S1 },   // vue
    { contenu_id: COURS, section_id: S1 },   // vue
    { contenu_id: COURS, section_id: S2 },   // pas vue
    { contenu_id: COURS, section_id: null }, // cours entamé → visible
    { contenu_id: TEXTE, section_id: null }, // pas entamé
  ]
  assert.equal(compterVisibles(cartes, perimetre()), 3)
  assert.equal(compterVisibles(cartes, perimetreVide()), 0)
})
