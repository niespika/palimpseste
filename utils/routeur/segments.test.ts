// « Les cinq segments se DÉRIVENT du Calendrier, et le calcul est écrit »
// (`01-` §4, couche 1).
//
// ⚠️ LE CAS CHIFFRÉ DE LA SOURCE EST PÉRIMÉ — le `01-` §4 écrit « C = 32 → 10,
//    9, 9 », qui suppose une tête de QUATRE semaines (1 + 3). Le segment 2 est
//    passé à DEUX semaines le 28/08 : la tête vaut 3, R = C − 3, et le même
//    C = 32 donne 10, 9, 10. **Le §4 est à amender.** Ce qui fait foi ici, c'est
//    le calendrier réel 2026-2027 — 32 semaines de cours, C = 30 → 9, 9, 9.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  decouperEnSegments, partageDuReste, segmentDuLundi,
  fractionDAnneeParcourue, fractionDeSegmentParcourue,
} from './segments'

/** N semaines de cours consécutives, lundis fictifs mais ordonnés. */
function semaines(n: number) {
  const out = []
  const d = new Date(Date.UTC(2026, 8, 7)) // un lundi
  for (let i = 0; i < n; i++) {
    const lundi = new Date(d.getTime() + i * 7 * 86400000)
    const dimanche = new Date(lundi.getTime() + 6 * 86400000)
    out.push({
      dateDebutLundi: lundi.toISOString().slice(0, 10),
      dateFinDimanche: dimanche.toISOString().slice(0, 10),
    })
  }
  return out
}

const tailles = (d: ReturnType<typeof decouperEnSegments>) => d.segments.map((s) => s.semaines.length)

// ── Le cas de la source ─────────────────────────────────────────────────────

test('le calendrier 2026-2027 : 32 semaines de cours → C = 30, R = 27, et 9, 9, 9', () => {
  const d = decouperEnSegments(semaines(32))
  assert.equal(d.C, 30)
  assert.equal(d.R, 27, 'R = C − 3 depuis que la tête vaut 3 semaines')
  assert.deepEqual(tailles(d), [1, 2, 9, 9, 9],
    'la semaine rendue par le segment 2 s\'en va au partage des tiers')
  assert.deepEqual(d.signaux, [], 'un calendrier complet ne signale rien')
})

test('C = 32 → R = 29, et les trois derniers segments valent 10, 9 et 10', () => {
  const d = decouperEnSegments(semaines(34)) // 34 semaines de cours → C = 32
  assert.equal(d.C, 32)
  assert.equal(d.R, 29)
  assert.deepEqual(tailles(d), [1, 2, 10, 9, 10])
})

test('le partage du reste : ⌈R/3⌉, ⌊R/3⌋, le solde — et la somme vaut R', () => {
  for (let r = 0; r <= 40; r++) {
    const [a, b, c] = partageDuReste(r)
    assert.equal(a + b + c, r, `le partage de ${r} ne se referme pas`)
    assert.equal(a, Math.ceil(r / 3))
    assert.equal(b, Math.floor(r / 3))
    assert.ok(a >= b && b >= c - 1, `partage non décroissant à R = ${r}`)
  }
  assert.deepEqual(partageDuReste(27), [9, 9, 9], 'le cas du calendrier 2026-2027')
  assert.deepEqual(partageDuReste(29), [10, 9, 10])
})

test('les segments 1 et 2 prennent TROIS semaines — 1 puis 2', () => {
  const d = decouperEnSegments(semaines(34))
  assert.equal(d.segments[0].semaines.length, 1, 'le segment 1 est la semaine du diagnostic')
  assert.equal(d.segments[1].semaines.length, 2, 'le segment 2 est la calibration, semaines 2 et 3')
  assert.equal(d.segments[0].regime, 'diagnostic')
  assert.equal(d.segments[1].regime, 'calibration')
})

test('les DEUX semaines du principe 2 sortent : la 1re est le diagnostic, la dernière est perdue', () => {
  const s = semaines(34)
  const d = decouperEnSegments(s)
  const prises = d.segments.flatMap((x) => x.semaines)
  assert.equal(prises.length, 32)
  assert.equal(prises[0].dateDebutLundi, s[0].dateDebutLundi, 'la semaine 1 est bien prise')
  assert.equal(prises[31].dateDebutLundi, s[31].dateDebutLundi)
  assert.ok(!prises.some((w) => w.dateDebutLundi === s[33].dateDebutLundi),
    'la dernière semaine de l\'année est perdue, jamais assignée à un segment')
})

// ── Le calendrier trop court — SIGNAL, jamais une borne inventée ────────────

test('en dessous de C = 5, les segments 3, 4 et 5 n\'ont AUCUNE semaine, et ça se signale', () => {
  for (const nb of [3, 4, 5]) { // C = 1, 2, 3 — R = C − 3 est nul jusque-là
    const d = decouperEnSegments(semaines(nb))
    assert.equal(d.R, 0, `R devrait être nul à ${nb} semaines`)
    assert.deepEqual(tailles(d).slice(2), [0, 0, 0])
    assert.equal(d.signaux.length, 1, 'un signal, et un seul')
    assert.match(d.signaux[0], /trop court/)
  }
})

test('le signal ne BLOQUE rien : la découpe se rend quand même, bornes à null', () => {
  const d = decouperEnSegments(semaines(4))
  assert.equal(d.segments.length, 5, 'les cinq segments existent toujours')
  assert.equal(d.segments[2].premierLundi, null, 'aucune borne inventée')
  assert.equal(d.segments[4].dernierDimanche, null)
  assert.equal(d.segments[0].premierLundi, semaines(4)[0].dateDebutLundi, 'ce qui tient, tient')
})

test('un segment vide alors que R > 0 (C = 5 ou 6) se dit aussi, sans rien bloquer', () => {
  const d5 = decouperEnSegments(semaines(6)) // C = 4, R = 1 → 1, 0, 0
  assert.deepEqual(tailles(d5).slice(2), [1, 0, 0])
  assert.equal(d5.signaux.length, 1)
  assert.match(d5.signaux[0], /segment\(s\) 4 et 5/)

  const d7 = decouperEnSegments(semaines(8)) // C = 6, R = 3 → 1, 1, 1
  assert.deepEqual(tailles(d7).slice(2), [1, 1, 1])
  assert.deepEqual(d7.signaux, [], 'dès que chaque segment a sa semaine, plus rien à signaler')
})

test('aucune semaine de cours : on le dit, on ne rend pas une découpe muette', () => {
  const d = decouperEnSegments([])
  assert.equal(d.C, 0)
  assert.equal(d.signaux.length, 1)
  assert.match(d.signaux[0], /aucune semaine de cours/)
})

test('un calendrier de 2 semaines ne fabrique pas un segment 1 fantôme', () => {
  const d = decouperEnSegments(semaines(2)) // C = 0
  assert.deepEqual(tailles(d), [0, 0, 0, 0, 0])
  assert.equal(d.segments[0].premierLundi, null)
})

// ── Ce que les autres règles lisent d'ici ───────────────────────────────────

test('le segment d\'un lundi se lit, et vaut null hors des bornes', () => {
  const s = semaines(34)
  const d = decouperEnSegments(s)
  assert.equal(segmentDuLundi(d, s[0].dateDebutLundi), 1)
  assert.equal(segmentDuLundi(d, s[1].dateDebutLundi), 2)
  assert.equal(segmentDuLundi(d, s[2].dateDebutLundi), 2, 'la semaine 3 clôt la calibration')
  assert.equal(segmentDuLundi(d, s[3].dateDebutLundi), 3, 'le segment 3 s\'ouvre en semaine 4')
  assert.equal(segmentDuLundi(d, s[12].dateDebutLundi), 3, 'le segment 3 court jusqu\'à la 13e')
  assert.equal(segmentDuLundi(d, s[13].dateDebutLundi), 4)
  assert.equal(segmentDuLundi(d, s[22].dateDebutLundi), 5)
  assert.equal(segmentDuLundi(d, s[33].dateDebutLundi), null, 'la semaine perdue n\'a pas de segment')
  assert.equal(segmentDuLundi(d, '2001-01-01'), null)
})

test('p — « l\'année court à partir du segment 3 », et vaut 0 à son premier cycle', () => {
  const s = semaines(34)
  const d = decouperEnSegments(s)
  assert.equal(fractionDAnneeParcourue(d, s[3].dateDebutLundi), 0, 'premier cycle du segment 3')
  assert.equal(fractionDAnneeParcourue(d, s[1].dateDebutLundi), null,
    'la calibration n\'est pas dans la période — le §7 la commence au segment 3')
  const p = fractionDAnneeParcourue(d, s[17].dateDebutLundi)
  assert.ok(p !== null && p > 0 && p < 1, 'p reste dans [0, 1[')
  assert.equal(p, 14 / 29)
})

test('la période de la table du GRAIN est le segment, pas l\'année', () => {
  const s = semaines(34)
  const d = decouperEnSegments(s)
  assert.equal(fractionDeSegmentParcourue(d, s[3].dateDebutLundi), 0, 'entrée du segment 3')
  assert.equal(fractionDeSegmentParcourue(d, s[13].dateDebutLundi), 0, 'entrée du segment 4 : on repart à 0')
  assert.equal(fractionDeSegmentParcourue(d, s[8].dateDebutLundi), 5 / 10)
})
