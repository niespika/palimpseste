import test from 'node:test'
import assert from 'node:assert/strict'
import { composerTableauLive } from './quazian-tableau-live'

test('le tableau en direct liste la CLASSE du quiz, pas tous les élèves du module', () => {
  const lignes = composerTableauLive({
    inscrits: ['a', 'b'],
    profils: [{ id: 'a', display_name: 'Alma' }, { id: 'b', display_name: 'Basile' }],
    sessions: [],
    scores: [],
    reponduesParSession: {},
  })
  assert.deepEqual(lignes.map((l) => l.id), ['a', 'b'])
  assert.ok(lignes.every((l) => !l.commence && l.repondues === 0 && !l.horsClasse))
})

test('un élève avec une session mais sans inscription active reste au tableau, marqué', () => {
  const lignes = composerTableauLive({
    inscrits: ['a'],
    profils: [{ id: 'a', display_name: 'Alma' }, { id: 'z', display_name: 'Zoé' }],
    sessions: [{ id: 's-z', eleve_id: 'z', submitted_at: '2026-09-22T14:20:00Z', auto_submitted: false }],
    scores: [{ eleve_id: 'z', score_moyen: 6.5 }],
    reponduesParSession: { 's-z': 15 },
  })
  const zoe = lignes.find((l) => l.id === 'z')!
  assert.equal(zoe.horsClasse, true)
  assert.equal(zoe.soumis, true)
  assert.equal(zoe.score_moyen, 6.5)
  assert.equal(zoe.repondues, 15)
})

test('les réponses enregistrées se comptent PAR SESSION, et un élève sans session est à zéro', () => {
  const lignes = composerTableauLive({
    inscrits: ['a', 'b', 'c'],
    profils: [{ id: 'a', display_name: 'Alma' }, { id: 'b', display_name: 'Basile' }, { id: 'c', display_name: 'Célia' }],
    sessions: [
      { id: 's-a', eleve_id: 'a', submitted_at: null, auto_submitted: null },
      { id: 's-b', eleve_id: 'b', submitted_at: null, auto_submitted: false },
    ],
    scores: [],
    reponduesParSession: { 's-a': 9 },
  })
  assert.deepEqual(lignes.map((l) => [l.id, l.commence, l.repondues]), [
    ['a', true, 9], ['b', true, 0], ['c', false, 0],
  ])
})

test('tri alphabétique à la française, et un nom manquant ne fait pas tomber la ligne', () => {
  const lignes = composerTableauLive({
    inscrits: ['e', 'x', 'd'],
    profils: [{ id: 'e', display_name: 'Élodie' }, { id: 'd', display_name: 'David' }],
    sessions: [],
    scores: [],
    reponduesParSession: {},
  })
  assert.deepEqual(lignes.map((l) => l.display_name), ['David', 'Élève sans nom', 'Élodie'])
})
