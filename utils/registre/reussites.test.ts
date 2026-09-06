// C7-L1 — le registre des réussites : dérivé, jamais déclaré.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cranTenu, cransDebloques, cransOuLEleveStagne, cranSuivant, deriverLeRegistre, issueDuDepot,
  reussitesQuiComptent, type DepotPourLeRegistre,
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

const bon = { cas: 1, jetons: [100, 0, 0, 0], index_correct: 0 }

test('« deux et deux » : deux réussites en dessous, sur deux devoirs à un cycle d’écart, débloquent — le bas des échelles est toujours ouvert', () => {
  assert.deepEqual(cransDebloques([], 'argument'), [1, 2, 3])
  const deux = deriverLeRegistre([
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 1, credence: [bon], devoirs: ['dev-b'], at: '2026-09-08T10:00:00Z' }),
    depot({ cran: 3, credence: [bon], at: '2026-09-01T10:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(deux, 'argument'), [1, 2, 3, 4])
  assert.deepEqual(cransDebloques(deux, 'exemple'), [1, 2, 3])
  // Les variantes d'un même cran comptent ensemble — et deux réussites au 4
  // ouvrent le 9 ET tiennent le 4 pour acquis (C7-L5 : les sondes réussies).
  const ab = deriverLeRegistre([
    depot({ cran: 4, variante: 'a', verdicts: { v1: verdict(true) }, devoirs: ['dev-a'], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 4, variante: 'b', zones: [{ cas: 1, verdict: 'juste' }], devoirs: ['dev-b'], at: '2026-09-08T10:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(ab, 'argument'), [1, 2, 3, 4, 9])
})

// ⭐ C7-L7 — le point (4) du « fait quand » de C7-L6, devenu une épreuve de ce lot.
test('⛔ deux réussites LE MÊME JOUR sur LE MÊME DEVOIR n’en sont qu’une : le cran suivant reste fermé', () => {
  const memeTexte = deriverLeRegistre([
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-01T11:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(memeTexte, 'argument'), [1, 2, 3])
  assert.equal(reussitesQuiComptent(memeTexte[0]!.reussitesDatees!), 1)
  // Deux devoirs, mais la même semaine : pas encore un cycle d'écart.
  const memeSemaine = deriverLeRegistre([
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 1, credence: [bon], devoirs: ['dev-b'], at: '2026-09-04T10:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(memeSemaine, 'argument'), [1, 2, 3])
  // Le même devoir, à un cycle d'écart : le même texte, ce n'est pas deux.
  const memeDevoirPlusTard = deriverLeRegistre([
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-10T10:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(memeDevoirPlusTard, 'argument'), [1, 2, 3])
  // Deux devoirs, à un cycle d'écart : le 4 s'ouvre.
  const deuxDevoirs = deriverLeRegistre([
    depot({ cran: 1, credence: [bon], devoirs: ['dev-a'], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 1, credence: [bon], devoirs: ['dev-b'], at: '2026-09-08T10:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(deuxDevoirs, 'argument'), [1, 2, 3, 4])
  assert.equal(cranTenu(deuxDevoirs, 'argument', 1), true)
  assert.equal(cranTenu(memeTexte, 'argument', 1), false)
  // Trois réussites dont une paire valide : toutes comptent.
  assert.equal(reussitesQuiComptent([
    { at: '2026-09-01T10:00:00Z', devoirs: ['a'] }, { at: '2026-09-01T11:00:00Z', devoirs: ['a'] },
    { at: '2026-09-08T10:00:00Z', devoirs: ['b'] }]), 3)
})

test('un dépôt sans devoir connu (la banque 1.4) est SON PROPRE devoir — deux textes sont deux textes', () => {
  const r = deriverLeRegistre([
    depot({ cran: 1, credence: [bon], at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 1, credence: [bon], at: '2026-09-08T10:00:00Z' }),
  ])
  assert.deepEqual(cransDebloques(r, 'argument'), [1, 2, 3, 4])
  // Une ligne de décor d'avant ce lot, sans dates, compte comme hier.
  const decor = [{ objet: 'argument', cran: 1, variante: null, reussites: 2, echecs: 0, serie: ['reussi', 'reussi'] as const, dernierAt: null }]
  assert.deepEqual(cransDebloques(decor as never, 'argument'), [1, 2, 3, 4])
})

test('⭐ 06/09 — les sondes partent dès DEUX ÉCHECS, consécutifs ou non', () => {
  const stagne = deriverLeRegistre([
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-01T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-02T10:00:00Z' }),
  ])
  assert.deepEqual(cransOuLEleveStagne(stagne, 'argument'), [5])
  // Un succès entre deux ne remet plus à zéro : « l'élève ne séjourne pas aux crans de reconnaissance ».
  const coupe = deriverLeRegistre([
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-01T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(true) }, at: '2026-09-02T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-03T10:00:00Z' }),
  ])
  assert.deepEqual(cransOuLEleveStagne(coupe, 'argument'), [5])
  const unSeul = deriverLeRegistre([
    depot({ verdicts: { v1: verdict(false) }, at: '2026-09-01T10:00:00Z' }),
    depot({ verdicts: { v1: verdict(true) }, at: '2026-09-02T10:00:00Z' }),
  ])
  assert.deepEqual(cransOuLEleveStagne(unSeul, 'argument'), [])
  assert.equal(cranSuivant(5), 7)
  assert.equal(cranSuivant(9), null)
  assert.equal(cranSuivant(42), null)
})

// ── ⭐ 06/09 — LE CRAN 2 : le juge tranche, × constituant, et le joint seul ouvre le 6 ──

test('au cran 2, le juge tranche — et la ligne se range PAR CONSTITUANT', () => {
  assert.equal(issueDuDepot(depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'le garant', joint: true })), 'reussi')
  assert.equal(issueDuDepot(depot({ cran: 2, verdicts: { v1: verdict(false), vf: verdict(true, 'vf') } })), 'reussi')
  assert.equal(issueDuDepot(depot({ cran: 2, verdicts: {} })), null)
  const r = deriverLeRegistre([
    depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'le garant', joint: true, at: '2026-09-01T10:00:00Z' }),
    depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'la preuve', joint: false, at: '2026-09-02T10:00:00Z' }),
    depot({ cran: 2, verdicts: { v1: verdict(false) }, constituant: 'le garant', joint: true, at: '2026-09-03T10:00:00Z' }),
  ])
  const deux = r.filter((l) => l.cran === 2)
  assert.equal(deux.length, 2)
  const garant = deux.find((l) => l.constituant === 'le garant')!
  assert.deepEqual([garant.reussites, garant.echecs, garant.joint], [1, 1, true])
  const preuve = deux.find((l) => l.constituant === 'la preuve')!
  assert.deepEqual([preuve.reussites, preuve.echecs, preuve.joint], [1, 0, false])
})

test('« cran 2 réussi sur l’objet » se lit sur la pièce JOINT : deux réussites au joint ouvrent le 6, deux sur une autre pièce non', () => {
  const [t1, t2] = ['2026-09-01T10:00:00Z', '2026-09-08T10:00:00Z']
  const surLeJoint = deriverLeRegistre([
    depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'le garant', joint: true, at: t1 }),
    depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'le garant', joint: true, at: t2 }),
  ])
  assert.deepEqual(cransDebloques(surLeJoint, 'argument'), [1, 2, 3, 6])
  const surUneAutre = deriverLeRegistre([
    depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'la preuve', joint: false, at: t1 }),
    depot({ cran: 2, verdicts: { v1: verdict(true) }, constituant: 'la preuve', joint: false, at: t2 }),
  ])
  assert.deepEqual(cransDebloques(surUneAutre, 'argument'), [1, 2, 3])
  // Un lecteur d'avant ce lot ne dit ni constituant ni joint : la ligne compte comme le joint
  // (sur la banque du 06/09, la pièce servie EST le joint sur les 38 exercices).
  const sansRien = deriverLeRegistre([
    depot({ cran: 2, verdicts: { v1: verdict(true) }, at: t1 }),
    depot({ cran: 2, verdicts: { v1: verdict(true) }, at: t2 }),
  ])
  assert.deepEqual(cransDebloques(sansRien, 'argument'), [1, 2, 3, 6])
  assert.equal(sansRien[0]!.constituant, null)
})
