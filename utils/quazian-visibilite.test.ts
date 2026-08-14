// Tests de la RÈGLE de visibilité des cartes Quazian (C7 · L3, fonction PURE).
// Exécution : `npm test`. Encode ce que le lot décide :
//  (1) carte née d'une SOUS-SECTION → il faut que CETTE sous-section soit vue ;
//  (2) carte au grain CONTENU → il suffit que le contenu soit ENTAMÉ (R7) ;
//  (3) une sous-section vue n'ouvre PAS les autres sous-sections du même cours ;
//  (4) plus aucune publication ne joue au bras contenu — seul le « vu » décide ;
//  (5) bras UNITÉ hérité inchangé (tuple (unité, semaine), semaine nulle = tout).
//  (6) Accès & classes · L1 — « Au parcours de… » ne parle que des classes AYANT
//      le module Quazian : `nomClasse` porte les classes éligibles, les autres
//      sont silencieuses.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  carteVisible,
  compterVisibles,
  lignesEtatVu,
  perimetreVide,
  type AvancementVuClasse,
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

// ── « Au parcours de… » : classes éligibles seulement (Accès & classes · L1) ──

/** Deux classes ont le cours au parcours ; une seule a le module Quazian. */
const avancement = (): AvancementVuClasse[] => [
  { classeId: 'classe-avec-quazian', total: 2, vus: 1, decoupe: true, sectionsVues: new Set([S1]), entame: true },
  { classeId: 'classe-sans-quazian', total: 2, vus: 2, decoupe: true, sectionsVues: new Set([S1, S2]), entame: true },
]
const cartesCours: CarteAncree[] = [
  { contenu_id: COURS, section_id: S1 },
  { contenu_id: COURS, section_id: S2 },
]

test('une classe sans le module Quazian ne s’annonce pas au prof', () => {
  const lignes = lignesEtatVu(COURS, cartesCours, avancement(), new Map([['classe-avec-quazian', 'Test']]))
  assert.deepEqual(lignes.map((l) => l.classe), ['Test'])
  assert.equal(lignes[0].nbVisibles, 1) // seule S1 est vue dans cette classe
})

test('aucune classe éligible → aucune ligne (jamais un « — » orphelin)', () => {
  assert.deepEqual(lignesEtatVu(COURS, cartesCours, avancement(), new Map()), [])
})

test('toutes éligibles → toutes annoncées, triées par nom de classe', () => {
  const lignes = lignesEtatVu(COURS, cartesCours, avancement(), new Map([
    ['classe-sans-quazian', 'THLP'],
    ['classe-avec-quazian', 'Test'],
  ]))
  assert.deepEqual(lignes.map((l) => l.classe), ['Test', 'THLP'])
  assert.deepEqual(lignes.map((l) => l.nbVisibles), [1, 2])
})
