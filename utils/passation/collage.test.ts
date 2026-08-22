// ============================================================================
// C4 · L4 — CE QUE LE JOURNAL DES COLLAGES DOIT TENIR.
// ----------------------------------------------------------------------------
// « Chaque tentative de collage bloquée est journalisée. »       — `06-` §1
// ⭐ Et, depuis le 22/08 : elle est RAPPORTÉE AU PROFESSEUR.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MOYENS_DE_COLLAGE, NOM_DU_MOYEN, estUnMoyen, lireLesCollages, resumerCollages,
  phraseDesCollages, type CollageBloque,
} from './collage'

const c = (moyen: string, at: string) => ({ moyen, at }) as unknown as CollageBloque

// ── Les trois vecteurs, et eux seuls ────────────────────────────────────────

test('les trois vecteurs de la source, et rien d’autre', () => {
  assert.deepEqual([...MOYENS_DE_COLLAGE], ['raccourci', 'glisser-deposer', 'menu-contextuel'])
  for (const m of MOYENS_DE_COLLAGE) assert.ok(estUnMoyen(m), m)
  assert.ok(!estUnMoyen('telepathie'))
  assert.ok(!estUnMoyen(''))
  assert.ok(!estUnMoyen(null))
})

test('chaque vecteur porte un nom lisible par un humain', () => {
  for (const m of MOYENS_DE_COLLAGE) {
    assert.equal(typeof NOM_DU_MOYEN[m], 'string')
    assert.notEqual(NOM_DU_MOYEN[m].trim(), '')
  }
})

// ── La lecture : tolérante, jamais fatale ───────────────────────────────────
// Une colonne `jsonb` lue par du code qui suppose sa forme, c'est un écran de
// correction qui tombe en pleine classe.

test('une colonne vide, nulle ou d’une autre forme se lit sans jamais lever', () => {
  assert.deepEqual(lireLesCollages(null), [])
  assert.deepEqual(lireLesCollages(undefined), [])
  assert.deepEqual(lireLesCollages([]), [])
  assert.deepEqual(lireLesCollages({ moyen: 'raccourci' }), [])
  assert.deepEqual(lireLesCollages('raccourci'), [])
})

test('une entrée illisible est écartée — elle n’emporte pas les autres', () => {
  const lu = lireLesCollages([
    { moyen: 'raccourci', at: '2026-08-22T12:00:00Z' },
    { moyen: 'telepathie', at: '2026-08-22T12:00:01Z' },   // vecteur inconnu
    { moyen: 'raccourci', at: '   ' },                     // instant vide
    { moyen: 'raccourci' },                                // instant absent
    'raccourci',                                           // scalaire
    null,
    { moyen: 'menu-contextuel', at: '2026-08-22T12:00:02Z' },
  ])
  assert.equal(lu.length, 2)
  assert.deepEqual(lu.map((x) => x.moyen), ['raccourci', 'menu-contextuel'])
})

// ── Le résumé ───────────────────────────────────────────────────────────────

test('aucune tentative : rien à compter, et RIEN À DIRE', () => {
  const r = resumerCollages([])
  assert.equal(r.total, 0)
  assert.deepEqual(r.parMoyen, [])
  assert.equal(r.dernier, null)
  // ⚠️ `null` et pas « 0 tentative » : un zéro afficherait une garantie que le
  //    blocage, côté navigateur seulement, ne donne pas.
  assert.equal(phraseDesCollages(r), null)
})

test('le résumé compte par moyen, du plus fréquent au moins fréquent', () => {
  const r = resumerCollages([
    c('glisser-deposer', '2026-08-22T12:00:00Z'),
    c('raccourci', '2026-08-22T12:00:01Z'),
    c('raccourci', '2026-08-22T12:00:02Z'),
    c('raccourci', '2026-08-22T12:00:03Z'),
    c('glisser-deposer', '2026-08-22T12:00:04Z'),
  ])
  assert.equal(r.total, 5)
  assert.deepEqual(r.parMoyen.map((x) => [x.moyen, x.n]),
    [['raccourci', 3], ['glisser-deposer', 2]])
  assert.equal(r.dernier, '2026-08-22T12:00:04Z')
})

test('à égalité, l’ordre est celui de la source — il ne danse pas d’un écran à l’autre', () => {
  const r = resumerCollages([
    c('menu-contextuel', '2026-08-22T12:00:00Z'),
    c('glisser-deposer', '2026-08-22T12:00:01Z'),
    c('raccourci', '2026-08-22T12:00:02Z'),
  ])
  assert.deepEqual(r.parMoyen.map((x) => x.moyen),
    ['raccourci', 'glisser-deposer', 'menu-contextuel'])
})

test('un moyen jamais tenté n’apparaît pas — on ne montre pas des zéros', () => {
  const r = resumerCollages([c('raccourci', '2026-08-22T12:00:00Z')])
  assert.equal(r.parMoyen.length, 1)
})

test('le dernier instant est le plus TARDIF, quel que soit l’ordre du tableau', () => {
  const r = resumerCollages([
    c('raccourci', '2026-08-22T12:00:09Z'),
    c('raccourci', '2026-08-22T12:00:01Z'),
  ])
  assert.equal(r.dernier, '2026-08-22T12:00:09Z')
})

// ── La phrase ───────────────────────────────────────────────────────────────

test('une seule tentative se dit au singulier', () => {
  const p = phraseDesCollages(resumerCollages([c('raccourci', '2026-08-22T12:00:00Z')]))
  assert.equal(p, '1 tentative de collage bloquée — 1 au raccourci clavier')
})

test('la phrase nomme LE MOYEN, pas seulement le compte', () => {
  const p = phraseDesCollages(resumerCollages([
    c('raccourci', '2026-08-22T12:00:00Z'),
    c('raccourci', '2026-08-22T12:00:01Z'),
    c('glisser-deposer', '2026-08-22T12:00:02Z'),
  ]))
  assert.equal(p, '3 tentatives de collage bloquées — 2 au raccourci clavier, 1 au glisser-déposer')
})

test('la phrase ne porte AUCUN verdict — ni triche, ni fraude, ni signalement', () => {
  const p = phraseDesCollages(resumerCollages([
    c('raccourci', '2026-08-22T12:00:00Z'),
    c('menu-contextuel', '2026-08-22T12:00:01Z'),
  ])) ?? ''
  for (const mot of ['trich', 'fraud', 'signal', 'plagiat', 'copié', 'suspect']) {
    assert.ok(!p.toLowerCase().includes(mot), `la phrase ne doit pas porter « ${mot} » : ${p}`)
  }
})
