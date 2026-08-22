// « Deux étages, et DEUX SEUILS QUI NE SE CONFONDENT JAMAIS » (`01-` §8.2).
// Le seuil de réussite est celui de la fiche (C4-L5 le tient) ; le seuil
// d'acquisition, ~2/3, se lit ici et nulle part ailleurs.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  estAcquis, etatDesObservables, candidatsSousDefautDominant, ilYAProgression,
  ilYAStagnation, preconditionBasse, preconditionHaute, stabiliteAcquise,
  type InstrumentLu,
} from './observables'
import type { Mesure } from './mesure'

/** Un instrument minimal : deux proportions à seuil, plus un binaire. */
const instrument: InstrumentLu = {
  observablesMesure: {
    garant_present: { famille: 'proportion', reussie: 'au_moins', seuil: 0.5 },
    lien_explicite: { famille: 'proportion', reussie: 'au_moins', seuil: 0.5 },
    objection_traitee: { famille: 'binaire', reussie: 'vaut', valeur_reussie: true },
  },
  parametres: {},
}
const REQUIS = ['garant_present', 'lien_explicite', 'objection_traitee']

let n = 0
function mes(observables: Record<string, number | string | boolean> | null): Mesure {
  n++
  return {
    id: `m${n}`, competence: 'argumentation', modes: ['composer'], lettreEquivalente: 'C',
    observables, lieu: 'maison', forme: 'formatif', classeId: null, genre: null,
    sondeMontee: false, distanceContexte: null, delaiJours: null, delaiMesures: null,
    deltaV1Vf: null, paireCorrectionJuste: null, paireNouveauCasDetecte: null,
    depotId: null, bonus: false, instrumentVersion: null,
    mesureAt: `2026-09-${String(n).padStart(2, '0')}T10:00:00Z`,
  }
}

const par = (code: string, etats: ReturnType<typeof etatDesObservables>) =>
  etats.find((e) => e.code === code)!

// ── Le seuil d'acquisition ─────────────────────────────────────────────────

test('acquis = le taux DÉPASSE ~2/3 — strictement', () => {
  assert.equal(estAcquis(0.75), true)
  assert.equal(estAcquis(2 / 3), false, 'exactement 2/3 ne dépasse pas 2/3')
  assert.equal(estAcquis(0.5), false)
  assert.equal(estAcquis(null), false, 'sans taux, jamais acquis')
})

test('4 mesures dont 3 réussies → acquis ; 2 sur 4 → non acquis', () => {
  const troisSurQuatre = [mes({ garant_present: 0.9 }), mes({ garant_present: 0.9 }),
    mes({ garant_present: 0.9 }), mes({ garant_present: 0.1 })]
  assert.equal(par('garant_present', etatDesObservables(troisSurQuatre, instrument, REQUIS)).acquis,
    true)
  const deuxSurQuatre = [mes({ garant_present: 0.9 }), mes({ garant_present: 0.9 }),
    mes({ garant_present: 0.1 }), mes({ garant_present: 0.1 })]
  assert.equal(par('garant_present', etatDesObservables(deuxSurQuatre, instrument, REQUIS)).acquis,
    false)
})

test('« `n/a` n\'est jamais 0 » — la mesure sans objet SORT DU DÉNOMINATEUR', () => {
  const avecNa = [mes({ garant_present: 0.9 }), mes({ garant_present: 0.9 }),
    mes({ garant_present: 'n/a' }), mes({ garant_present: 'n/a' })]
  const e = par('garant_present', etatDesObservables(avecNa, instrument, REQUIS))
  assert.equal(e.denominateur, 2, 'deux mesures seulement ont un objet')
  assert.equal(e.taux, 1, 'et non 0,5 — les `n/a` ne comptent pas comme des échecs')
  assert.equal(e.acquis, true)
})

test('« un observable sans taux NE SE CLASSE PAS » — et il n\'est pas acquis pour autant', () => {
  const rien = [mes({ garant_present: 'n/a' }), mes({ garant_present: 'n/a' })]
  const e = par('garant_present', etatDesObservables(rien, instrument, REQUIS))
  assert.equal(e.taux, null)
  assert.equal(e.sansTaux, true)
  assert.equal(e.acquis, false, 'l\'état initial est NON ACQUIS')
})

test('« tout observable est réputé NON ACQUIS au départ » — fenêtre vide comprise', () => {
  const etats = etatDesObservables([], instrument, REQUIS)
  assert.equal(etats.length, 3, 'les trois observables de l\'instrument sont là')
  assert.ok(etats.every((e) => !e.acquis && e.sansTaux))
})

// ── Le sous-défaut dominant ────────────────────────────────────────────────

test('le sous-défaut dominant est le NON ACQUIS au taux LE PLUS BAS', () => {
  const f = [mes({ garant_present: 0.1, lien_explicite: 0.4 }),
    mes({ garant_present: 0.1, lien_explicite: 0.6 }),
    mes({ garant_present: 0.1, lien_explicite: 0.6 }),
    mes({ garant_present: 0.1, lien_explicite: 0.6 })]
  const c = candidatsSousDefautDominant(etatDesObservables(f, instrument, REQUIS))
  assert.equal(c.length, 1)
  assert.equal(c[0].code, 'garant_present', 'taux 0 contre 0,75')
})

test('un observable SANS TAUX est écarté de l\'élection — elle se départage au taux', () => {
  const f = [mes({ garant_present: 'n/a', lien_explicite: 0.1 }),
    mes({ garant_present: 'n/a', lien_explicite: 0.1 })]
  const c = candidatsSousDefautDominant(etatDesObservables(f, instrument, REQUIS))
  assert.deepEqual(c.map((e) => e.code), ['lien_explicite'])
})

test('à égalité, TOUS les ex æquo sortent — le tirage se fait ailleurs, et se journalise', () => {
  const f = [mes({ garant_present: 0.1, lien_explicite: 0.1 }),
    mes({ garant_present: 0.1, lien_explicite: 0.1 })]
  const c = candidatsSousDefautDominant(etatDesObservables(f, instrument, REQUIS))
  assert.equal(c.length, 2, 'le module ne tranche pas seul')
})

test('quand tout est acquis, il n\'y a pas de sous-défaut', () => {
  const f = [mes({ garant_present: 0.9, lien_explicite: 0.9, objection_traitee: true }),
    mes({ garant_present: 0.9, lien_explicite: 0.9, objection_traitee: true })]
  assert.deepEqual(candidatsSousDefautDominant(etatDesObservables(f, instrument, REQUIS)), [])
})

// ── Progression et stagnation ──────────────────────────────────────────────

test('PROGRESSION : au moins un observable passe à acquis', () => {
  const bas = [mes({ garant_present: 0.1 }), mes({ garant_present: 0.1 })]
  const haut = [mes({ garant_present: 0.9 }), mes({ garant_present: 0.9 })]
  const avant = etatDesObservables(bas, instrument, REQUIS)
  const apres = etatDesObservables(haut, instrument, REQUIS)
  assert.equal(ilYAProgression(avant, apres), true)
  assert.equal(ilYAProgression(apres, avant), false, 'perdre un acquis n\'est pas progresser')
  assert.equal(ilYAProgression(apres, apres), false, 'rester acquis non plus')
})

test('STAGNATION : aucun changement de statut **ET** valeur non plafonnée immobile', () => {
  const bas = [mes({ garant_present: 0.1 }), mes({ garant_present: 0.1 })]
  const e = etatDesObservables(bas, instrument, REQUIS)
  assert.equal(ilYAStagnation(e, e, true), true)
  assert.equal(ilYAStagnation(e, e, false), false, 'la lettre a bougé : ce n\'est pas du sur-place')

  const haut = etatDesObservables([mes({ garant_present: 0.9 }), mes({ garant_present: 0.9 })],
    instrument, REQUIS)
  assert.equal(ilYAStagnation(e, haut, true), false, 'un statut a changé')
})

// ── Les deux préconditions du §8.3 ─────────────────────────────────────────

test('BASSE : une seule mesure réussie suffit — l\'échec se sépare de l\'inconnu', () => {
  const h = [mes({ garant_present: 0.9 }), mes({ garant_present: 0.1 })]
  const p = preconditionBasse('garant_present', h, instrument, 4)
  assert.equal(p.satisfaite, true)
  assert.match(p.motif, /au moins une mesure réussie/)
})

test('BASSE : aucune réussite et moins de deux fenêtres → NON satisfaite', () => {
  const h = [mes({ garant_present: 0.1 }), mes({ garant_present: 0.1 })]
  const p = preconditionBasse('garant_present', h, instrument, 4)
  assert.equal(p.satisfaite, false)
  assert.match(p.motif, /enseigné, pas escaladé/)
})

test('BASSE : aucune réussite sur DEUX FENÊTRES PLEINES → satisfaite', () => {
  const h = Array.from({ length: 8 }, () => mes({ garant_present: 0.1 }))
  assert.equal(preconditionBasse('garant_present', h, instrument, 4).satisfaite, true)
})

test('BASSE : huit mesures dont six SANS OBJET ne font pas deux fenêtres pleines', () => {
  const h = [...Array.from({ length: 6 }, () => mes({ garant_present: 'n/a' })),
    mes({ garant_present: 0.1 }), mes({ garant_present: 0.1 })]
  assert.equal(preconditionBasse('garant_present', h, instrument, 4).satisfaite, false)
})

test('BASSE : un observable que l\'instrument ne déclare pas ne satisfait rien', () => {
  const p = preconditionBasse('inconnu', [mes({ inconnu: 1 })], instrument, 4)
  assert.equal(p.satisfaite, false)
  assert.match(p.motif, /ne déclare pas/)
})

test('HAUTE : il faut au moins un observable REQUIS non acquis', () => {
  const f = [mes({ garant_present: 0.1, lien_explicite: 0.9, objection_traitee: true }),
    mes({ garant_present: 0.1, lien_explicite: 0.9, objection_traitee: true })]
  assert.equal(preconditionHaute(etatDesObservables(f, instrument, REQUIS)), true)
  // Le même état, mais la fiche ne déclare PAS `garant_present` requis.
  const sansCeRequis = etatDesObservables(f, instrument, ['lien_explicite', 'objection_traitee'])
  assert.equal(preconditionHaute(sansCeRequis), false,
    'un non-acquis HORS ESCALADE ne déclenche rien — la fiche fait foi')
})

test('la STABILITÉ ACQUISE produit entretien ou rien, JAMAIS N1', () => {
  const f = [mes({ garant_present: 0.9, lien_explicite: 0.9, objection_traitee: true }),
    mes({ garant_present: 0.9, lien_explicite: 0.9, objection_traitee: true })]
  const e = etatDesObservables(f, instrument, REQUIS)
  assert.equal(stabiliteAcquise(e), true)
  assert.equal(preconditionHaute(e), false, 'et la précondition haute la refuse')
})

test('sans aucun requis (la Connaissance), la stabilité ne se déclare pas — et rien n\'escalade', () => {
  const f = [mes({ garant_present: 0.1 }), mes({ garant_present: 0.1 })]
  const e = etatDesObservables(f, instrument, [])
  assert.equal(stabiliteAcquise(e), false)
  assert.equal(preconditionHaute(e), false, 'aucun requis → la précondition haute ne passe jamais')
})
