// Les observables de télémétrie : la VALEUR s'écrit, LE VERDICT NE SE STOCKE
// JAMAIS (la mission ; `01-` §8.2). Deux règles paient cher si on les rate :
//   · « `n/a` n'est JAMAIS 0 » — une mesure sans objet SORT du dénominateur ;
//   · « un observable sans taux ne se classe pas » — dénominateur vide → NULL.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  NA, appliquerObservablesMesure, statutDeLaMesure, tauxDeReussite, valeurDe,
} from './observables'
import type { EntreeObservableMesure } from './instruments'

const PROPORTION: EntreeObservableMesure = {
  famille: 'proportion', reussie: 'au_moins', seuil: 0.5, statut: 'acté', sens: 'la moitié au moins',
}
const RAPPORTE: EntreeObservableMesure = {
  famille: 'comptage rapporté', rapporte_a: 'liens_total', reussie: 'au_moins', seuil: 0.6,
  statut: 'acté', sens: 'six liens sur dix justifiés',
}
const BINAIRE: EntreeObservableMesure = {
  famille: 'binaire', reussie: 'vaut', valeur_reussie: true, statut: 'acté', sens: 'présent',
}
const ORDINAL: EntreeObservableMesure = {
  famille: 'ordinal', echelle: ['absent', 'partiel', 'complet'], reussie: 'au_moins',
  seuil: 'partiel', statut: 'acté', sens: 'partiel au moins',
}
const INSTRUMENT: EntreeObservableMesure = {
  famille: 'proportion', reussie: 'sans_objet', statut: 'acté', sens: 'mesure l\'instrument',
}
const PARAMETRE: EntreeObservableMesure = {
  famille: 'comptage', reussie: 'plus_de', seuil_parametre: 'plancher', statut: 'provisoire (réglage empirique)',
  sens: 'strictement plus que le plancher',
}

// ── La valeur ───────────────────────────────────────────────────────────────

test('une entrée absente rend `n/a` — jamais 0, jamais null', () => {
  assert.equal(valeurDe('x', PROPORTION, {}).valeur, NA)
  assert.equal(valeurDe('x', PROPORTION, { x: null }).valeur, NA)
})

test('un comptage rapporté à DÉNOMINATEUR VIDE rend `n/a`, pas 0', () => {
  assert.equal(valeurDe('justifies', RAPPORTE, { justifies: 0, liens_total: 0 }).valeur, NA)
  assert.equal(valeurDe('justifies', RAPPORTE, { justifies: 3, liens_total: 5 }).valeur, 0.6)
})

test('un ordinal hors de son échelle rend `n/a` ET une alerte — jamais un défaut', () => {
  const r = valeurDe('x', ORDINAL, { x: 'excellent' })
  assert.equal(r.valeur, NA)
  assert.match(r.alerte?.motif ?? '', /hors de son échelle/)
})

test('appliquer le volet rend UNE entrée par observable déclaré : aucun trou silencieux', () => {
  const { observables } = appliquerObservablesMesure(
    { a: PROPORTION, b: BINAIRE, c: ORDINAL }, { a: 0.8 })
  assert.deepEqual(Object.keys(observables).sort(), ['a', 'b', 'c'])
  assert.equal(observables.b, NA)
  assert.equal(observables.c, NA)
})

// ── Le verdict, recalculé à chaque lecture ─────────────────────────────────

test('`n/a` n\'est ni réussi ni raté — il est SANS OBJET', () => {
  assert.equal(statutDeLaMesure(NA, PROPORTION), 'sans_objet')
  assert.equal(statutDeLaMesure(undefined, PROPORTION), 'sans_objet')
})

test('un observable `sans_objet` ne rend AUCUN verdict sur l\'élève', () => {
  assert.equal(statutDeLaMesure(0.99, INSTRUMENT), 'sans_objet')
})

test('les quatre comparateurs, dont les deux stricts', () => {
  const base = { famille: 'comptage', statut: 'acté', sens: 's' } as const
  assert.equal(statutDeLaMesure(3, { ...base, reussie: 'au_moins', seuil: 3 }), 'reussie')
  assert.equal(statutDeLaMesure(3, { ...base, reussie: 'plus_de', seuil: 3 }), 'ratee')
  assert.equal(statutDeLaMesure(3, { ...base, reussie: 'au_plus', seuil: 3 }), 'reussie')
  assert.equal(statutDeLaMesure(3, { ...base, reussie: 'moins_de', seuil: 3 }), 'ratee')
})

test('un binaire n\'a pas de seuil : il vaut ce que la fiche nomme', () => {
  assert.equal(statutDeLaMesure(true, BINAIRE), 'reussie')
  assert.equal(statutDeLaMesure(false, BINAIRE), 'ratee')
})

test('un ordinal se compare SUR SON ÉCHELLE, pas sur des nombres', () => {
  assert.equal(statutDeLaMesure('partiel', ORDINAL), 'reussie')
  assert.equal(statutDeLaMesure('absent', ORDINAL), 'ratee')
})

test('`seuil_parametre` lit `notation.parametres` — le pari vit là, pas ici', () => {
  assert.equal(statutDeLaMesure(4, PARAMETRE, { plancher: 3 }), 'reussie')
  assert.equal(statutDeLaMesure(3, PARAMETRE, { plancher: 3 }), 'ratee')
  // Paramètre absent : on ne devine pas de seuil, la mesure est sans objet.
  assert.equal(statutDeLaMesure(4, PARAMETRE, {}), 'sans_objet')
})

test('`sans_objet_si` met la mesure hors du dénominateur', () => {
  const e: EntreeObservableMesure = { ...PROPORTION, sans_objet_si: 0 }
  assert.equal(statutDeLaMesure(0, e), 'sans_objet')
})

// ── Le taux ────────────────────────────────────────────────────────────────

test('une fenêtre sans aucune mesure AYANT UN OBJET rend un taux NULL, jamais 0', () => {
  const r = tauxDeReussite([NA, NA, undefined], PROPORTION)
  assert.equal(r.taux, null)
  assert.equal(r.denominateur, 0)
})

test('les mesures sans objet sortent du dénominateur, elles n\'y comptent pas comme échecs', () => {
  const r = tauxDeReussite([0.9, NA, 0.1, NA], PROPORTION)
  assert.deepEqual([r.reussies, r.denominateur, r.taux], [1, 2, 0.5])
})

// ── ⭐ C7-L9 — le taux PONDÉRÉ par cran (`01-` §8.2, 07/09) ─────────────────────
test('C7-L9 — sans poids, le taux d\'hier à l\'octet ; avec, des SOMMES DE POIDS — et n/a sort toujours du dénominateur', () => {
  const hier = tauxDeReussite([0.9, NA, 0.1, 0.8], PROPORTION)
  assert.deepEqual(hier, { reussies: 2, denominateur: 3, taux: 2 / 3 })
  assert.deepEqual(tauxDeReussite([0.9, NA, 0.1, 0.8], PROPORTION, {}, undefined), hier)
  // une mesure réussie au cran 5 pèse 0,6 : le taux rend 0,6 / 0,6 = 1, et le « fait quand » (2) le veut à 0,6 de poids
  assert.deepEqual(tauxDeReussite([0.9], PROPORTION, {}, [0.6]), { reussies: 0.6, denominateur: 0.6, taux: 1 })
  // un 6·8 réussi (1) et un cran 1 raté (0,2) : 1 / 1,2
  const r = tauxDeReussite([0.9, 0.1], PROPORTION, {}, [1, 0.2])
  assert.equal(r.reussies, 1); assert.equal(r.denominateur, 1.2); assert.ok(Math.abs((r.taux ?? 0) - 1 / 1.2) < 1e-12)
  // n/a n'entre pas, quel que soit son poids ; un poids manquant ou invalide vaut 1
  assert.deepEqual(tauxDeReussite([NA, 0.9], PROPORTION, {}, [1, 0.5]), { reussies: 0.5, denominateur: 0.5, taux: 1 })
  assert.deepEqual(tauxDeReussite([0.9, 0.1], PROPORTION, {}, [0.5]), { reussies: 0.5, denominateur: 1.5, taux: 0.5 / 1.5 })
  assert.deepEqual(tauxDeReussite([0.9, 0.1], PROPORTION, {}, [NaN, -1]), { reussies: 1, denominateur: 2, taux: 0.5 })
  // rien qui ait un objet ⇒ NULL, jamais 0
  assert.deepEqual(tauxDeReussite([NA, NA], PROPORTION, {}, [1, 1]), { reussies: 0, denominateur: 0, taux: null })
})
