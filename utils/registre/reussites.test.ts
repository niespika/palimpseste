// C7-L1 — le registre des réussites : dérivé, jamais déclaré.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cransDebloques, cransOuLEleveStagne, cranSuivant, deriverLeRegistre, issueDuDepot,
  type DepotPourLeRegistre,
} from './reussites'
import type { VerdictCran } from '../chaine/juge-cran'

const verdict = (reussi: boolean, version: 'v1' | 'vf' = 'v1'): VerdictCran => ({
  reussi, probleme_present: !reussi, probleme_vu: null, passage: null, motif: 'm',
  version, cran: 5, at: '2026-09-03T10:00:00Z', modele: 'm',
})
let n = 0
const depot = (p: Partial<DepotPourLeRegistre>): DepotPourLeRegistre => ({
  depotId: `d${++n}`, objet: 'argument', cran: 5, variante: null,
  at: `2026-09-0${Math.min(9, n)}T10:00:00Z`, verdicts: {}, credence: [], zones: [], ...p,
})

test('aux crans 1 et 3, la majorité des jetons sur le bon candidat — et le SECOND cas seul', () => {
  const un = depot({ cran: 1, credence: [{ cas: 1, jetons: [70, 10, 10, 10], index_correct: 0 }] })
  assert.equal(issueDuDepot(un), 'reussi')
  const paire = depot({ cran: 3, credence: [
    { cas: 1, jetons: [70, 10, 10, 10], index_correct: 0 },
    { cas: 2, jetons: [10, 70, 10, 10], index_correct: 0 },
  ] })
  assert.equal(issueDuDepot(paire), 'rate')
  const egalite = depot({ cran: 1, credence: [{ cas: 1, jetons: [50, 50, 0, 0], index_correct: 0 }] })
  assert.equal(issueDuDepot(egalite), 'rate')
  assert.equal(issueDuDepot(depot({ cran: 1, credence: [{ cas: 1, pourcentage: 80 }] })), null)
})

test('aux crans 4(a), 5, 7 et 9, le juge tranche — et la version finale fait foi', () => {
  assert.equal(issueDuDepot(depot({ verdicts: { v1: verdict(false) } })), 'rate')
  assert.equal(issueDuDepot(depot({ verdicts: { v1: verdict(false), vf: verdict(true, 'vf') } })), 'reussi')
  assert.equal(issueDuDepot(depot({ cran: 9, verdicts: {} })), null)
  assert.equal(issueDuDepot(depot({ cran: 4, variante: 'a', verdicts: { v1: verdict(true) } })), 'reussi')
})

test('au cran 4(b), la porte de zone tranche seule ; aux 6 et 8, rien n’est dérivé ici', () => {
  assert.equal(issueDuDepot(depot({ cran: 4, variante: 'b', zones: [{ cas: 1, verdict: 'juste' }] })), 'reussi')
  assert.equal(issueDuDepot(depot({ cran: 4, variante: 'b', zones: [{ cas: 1, verdict: 'faux' }] })), 'rate')
  assert.equal(issueDuDepot(depot({ cran: 4, variante: 'b', zones: [] })), null)
  assert.equal(issueDuDepot(depot({ cran: 6, verdicts: { v1: verdict(true) } })), null)
  assert.equal(issueDuDepot(depot({ cran: 8 })), null)
})

test('le registre compte par objet × cran × variante, dans l’ordre du temps, et ignore ce qui n’a pas d’issue', () => {
  const r = deriverLeRegistre([
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-02T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(true) }, at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 9 }),                                       // sans verdict : ne compte pas
    depot({ objet: 'exemple', verdicts: { v1: verdict(true) }, at: '2026-09-03T10:00:00Z' }),
  ])
  const arg = r.find((l) => l.objet === 'argument' && l.cran === 5)!
  assert.deepEqual([arg.reussites, arg.echecs, arg.serie, arg.dernierAt],
    [1, 1, ['reussi', 'rate'], '2026-09-02T10:00:00Z'])
  assert.equal(r.length, 2)
})

test('« deux et deux » : deux réussites en dessous débloquent, le bas des échelles est toujours ouvert', () => {
  assert.deepEqual(cransDebloques([], 'argument'), [1, 2, 3])
  const deux = deriverLeRegistre([
    depot({ cran: 1, credence: [{ cas: 1, jetons: [100, 0, 0, 0], index_correct: 0 }] }),
    depot({ cran: 1, credence: [{ cas: 1, jetons: [100, 0, 0, 0], index_correct: 0 }] }),
    depot({ cran: 3, credence: [{ cas: 1, jetons: [100, 0, 0, 0], index_correct: 0 }] }),
  ])
  assert.deepEqual(cransDebloques(deux, 'argument'), [1, 2, 3, 4])
  assert.deepEqual(cransDebloques(deux, 'exemple'), [1, 2, 3])
  // Les variantes d'un même cran comptent ensemble.
  const ab = deriverLeRegistre([
    depot({ cran: 4, variante: 'a', verdicts: { v1: verdict(true) } }),
    depot({ cran: 4, variante: 'b', zones: [{ cas: 1, verdict: 'juste' }] }),
  ])
  assert.deepEqual(cransDebloques(ab, 'argument'), [1, 2, 3, 9])
})

test('deux échecs DE SUITE au même cran disent où l’élève stagne — un succès entre deux remet à zéro', () => {
  const stagne = deriverLeRegistre([
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-01T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-02T10:00:00Z' }),
  ])
  assert.deepEqual(cransOuLEleveStagne(stagne, 'argument'), [5])
  const coupe = deriverLeRegistre([
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-01T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(true) }, at: '2026-09-02T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-03T10:00:00Z' }),
  ])
  assert.deepEqual(cransOuLEleveStagne(coupe, 'argument'), [])
  assert.equal(cranSuivant(5), 7)
  assert.equal(cranSuivant(9), null)
  assert.equal(cranSuivant(42), null)
})
