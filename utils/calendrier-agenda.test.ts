// Tests de garde de l'agenda de classe (fonctions PURES). Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validerEvenementAgenda, normaliserIntitule, libelleExercicePlanifie, filtrerEvenementsAgenda, estUneDate, TITRE_MAX,
} from './calendrier-agenda'

const C1 = '11111111-1111-4111-8111-111111111111'
const C2 = '22222222-2222-4222-8222-222222222222'

test('validerEvenementAgenda : titre, date et classe obligatoires', () => {
  assert.equal(validerEvenementAgenda({ titre: '  ', date: '2026-10-01', classe_ids: [C1] }).ok, false)
  assert.equal(validerEvenementAgenda({ titre: 'Finir Candide', date: '2026-13-01', classe_ids: [C1] }).ok, false)
  assert.equal(validerEvenementAgenda({ titre: 'Finir Candide', date: '01/10/2026', classe_ids: [C1] }).ok, false)
  assert.equal(validerEvenementAgenda({ titre: 'Finir Candide', date: '2026-10-01', classe_ids: [] }).ok, false)
  assert.equal(validerEvenementAgenda({ titre: 'Finir Candide', date: '2026-10-01', classe_ids: ['pas-un-uuid'] }).ok, false)
  assert.equal(validerEvenementAgenda({ titre: 'x'.repeat(TITRE_MAX + 1), date: '2026-10-01', classe_ids: [C1] }).ok, false)
})

test('validerEvenementAgenda : normalise, dédoublonne, visible par défaut', () => {
  const r = validerEvenementAgenda({ titre: '  Finir   Candide ', date: '2026-10-01', detail: '  ', classe_ids: [C1, C1, C2] })
  assert.ok(r.ok)
  if (!r.ok) return
  assert.deepEqual(r.valeur, { titre: 'Finir Candide', date: '2026-10-01', detail: null, visible_eleves: true, classe_ids: [C1, C2] })
  const prive = validerEvenementAgenda({ titre: 'Note', date: '2026-10-01', visible_eleves: '0', classe_ids: [C1] })
  assert.ok(prive.ok && prive.valeur.visible_eleves === false)
})

test('normaliserIntitule : vide ⇒ null, trop long ⇒ erreur', () => {
  assert.deepEqual(normaliserIntitule('   '), { ok: true, valeur: null })
  assert.deepEqual(normaliserIntitule(' Les  Lumières '), { ok: true, valeur: 'Les Lumières' })
  assert.equal(normaliserIntitule('x'.repeat(TITRE_MAX + 1)).ok, false)
})

test('libelleExercicePlanifie : le générique reste la base, l’intitulé suit la porte', () => {
  const base = { generique: 'quiz', titre: 'Les Lumières', statut: 'a_concevoir' } as const
  assert.equal(libelleExercicePlanifie({ ...base, surface: 'eleve', agendaActif: false }), 'Quiz')
  assert.equal(libelleExercicePlanifie({ ...base, surface: 'eleve', agendaActif: true, annonce: true }), 'Quiz — Les Lumières')
  assert.equal(libelleExercicePlanifie({ ...base, surface: 'prof', agendaActif: false }), 'Quiz · à concevoir')
  assert.equal(libelleExercicePlanifie({ ...base, surface: 'prof', agendaActif: true, statut: 'concu' }), 'Quiz — Les Lumières · conçu')
  assert.equal(libelleExercicePlanifie({ generique: 'examen diagnostique — écriture', titre: null, statut: 'concu', surface: 'eleve', agendaActif: true }),
    'Examen diagnostique — écriture')
})

test('filtrerEvenementsAgenda : fenêtre, classe, visibilité, fail-closed', () => {
  const lignes = [
    { id: 'a', classe_id: C1, date: '2026-10-01', titre: 'A', detail: null, visible_eleves: true },
    { id: 'b', classe_id: C1, date: '2026-10-02', titre: 'B', detail: null, visible_eleves: false },
    { id: 'c', classe_id: C2, date: '2026-10-03', titre: 'C', detail: null, visible_eleves: true },
    { id: 'd', classe_id: C1, date: '2026-11-01', titre: 'D', detail: null, visible_eleves: true },
  ]
  const fen = { debut: '2026-10-01', fin: '2026-10-31' }
  assert.deepEqual(filtrerEvenementsAgenda(lignes, { ...fen, surface: 'prof' }).map((l) => l.id), ['a', 'b', 'c'])
  assert.deepEqual(filtrerEvenementsAgenda(lignes, { ...fen, surface: 'eleve', classeIds: [C1] }).map((l) => l.id), ['a'])
  assert.deepEqual(filtrerEvenementsAgenda(lignes, { ...fen, surface: 'eleve' }).map((l) => l.id), [])
})

test('estUneDate : le format ne suffit pas, le calendrier compte (passe adversariale 18/09)', () => {
  assert.equal(estUneDate('2026-02-30'), false)
  assert.equal(estUneDate('2026-04-31'), false)
  assert.equal(estUneDate('2026-02-28'), true)
  assert.equal(estUneDate('2028-02-29'), true)
  assert.equal(validerEvenementAgenda({ titre: 'x', date: '2026-02-30', classe_ids: [C1] }).ok, false)
})

test('validerEvenementAgenda : les formes textuelles de « non visible », et les bornes du titre', () => {
  for (const v of ['false', 'off', '0', 'non', false]) {
    const r = validerEvenementAgenda({ titre: 'x', date: '2026-10-01', visible_eleves: v, classe_ids: [C1] })
    assert.ok(r.ok && r.valeur.visible_eleves === false, String(v))
  }
  assert.equal(validerEvenementAgenda({ titre: 'x'.repeat(TITRE_MAX), date: '2026-10-01', classe_ids: [C1] }).ok, true)
  assert.equal(validerEvenementAgenda({ titre: 'x'.repeat(TITRE_MAX + 1), date: '2026-10-01', classe_ids: [C1] }).ok, false)
  // Les émojis comptent deux unités en JS et une en SQL : TS est toujours au moins aussi strict.
  assert.equal(validerEvenementAgenda({ titre: 'x'.repeat(TITRE_MAX - 2) + '😀', date: '2026-10-01', classe_ids: [C1] }).ok, true)
})

test('libelleExercicePlanifie : à l’élève, l’intitulé ne part QUE sur un examen annoncé par le prof', () => {
  const base = { generique: 'quiz', titre: 'Contrôle surprise', statut: 'concu', surface: 'eleve', agendaActif: true } as const
  assert.equal(libelleExercicePlanifie({ ...base }), 'Quiz')                    // quiz servi par le réglage global D5
  assert.equal(libelleExercicePlanifie({ ...base, annonce: false }), 'Quiz')
  assert.equal(libelleExercicePlanifie({ ...base, annonce: true }), 'Quiz — Contrôle surprise')
  assert.equal(libelleExercicePlanifie({ ...base, surface: 'prof' }), 'Quiz — Contrôle surprise · conçu') // le prof voit tout
})

test('filtrerEvenementsAgenda : bornes incluses, classeIds vide explicite', () => {
  const lignes = [
    { id: 'a', classe_id: C1, date: '2026-10-01', titre: 'A', detail: null, visible_eleves: true },
    { id: 'b', classe_id: C1, date: '2026-10-31', titre: 'B', detail: null, visible_eleves: true },
    { id: 'c', classe_id: C1, date: '2026-11-01', titre: 'C', detail: null, visible_eleves: true },
  ]
  const fen = { debut: '2026-10-01', fin: '2026-10-31' }
  assert.deepEqual(filtrerEvenementsAgenda(lignes, { ...fen, surface: 'eleve', classeIds: [C1] }).map((l) => l.id), ['a', 'b'])
  assert.deepEqual(filtrerEvenementsAgenda(lignes, { ...fen, surface: 'eleve', classeIds: [] }), [])
})

test('normaliserIntitule : un non-texte vaut « sans intitulé »', () => {
  assert.deepEqual(normaliserIntitule(null), { ok: true, valeur: null })
  assert.deepEqual(normaliserIntitule(123), { ok: true, valeur: null })
})
