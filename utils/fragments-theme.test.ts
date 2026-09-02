// C8 — le thème proposé par l'élève, validé par le professeur : la règle pure.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { themeAValider, statutDuTheme, libelleEleve, themePropose } from './fragments-theme'

test('un thème posé par le professeur (sans proposition) n’est JAMAIS « à valider » — la migration est inerte', () => {
  assert.equal(themeAValider({ theme: 'La piraterie', propose_at: null, valide_at: null }), false)
  assert.equal(statutDuTheme({ theme: 'La piraterie', propose_at: null, valide_at: null }), 'pose_par_le_prof')
})

test('un thème proposé par l’élève et jamais validé est « à valider »', () => {
  const t = { theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: null }
  assert.equal(themeAValider(t), true)
  assert.equal(statutDuTheme(t), 'a_valider')
})

test('validé APRÈS la proposition : validé ; re-proposé APRÈS la validation : de nouveau à valider', () => {
  assert.equal(statutDuTheme({ theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: '2026-09-02T11:00:00Z' }), 'valide')
  assert.equal(statutDuTheme({ theme: 'Le doute, encore', propose_at: '2026-09-03T08:00:00Z', valide_at: '2026-09-02T11:00:00Z' }), 'a_valider')
})

test('un thème vide n’est ni à valider ni validé', () => {
  assert.equal(statutDuTheme({ theme: '', propose_at: '2026-09-02T10:00:00Z', valide_at: null }), 'vide')
  assert.equal(statutDuTheme(null), 'vide')
  assert.equal(themeAValider({ theme: '   ', propose_at: '2026-09-02T10:00:00Z', valide_at: null }), false)
})

test('le libellé de l’élève dit l’état, et invite à écrire quand il n’y a rien', () => {
  assert.match(libelleEleve('a_valider'), /en attente/)
  assert.match(libelleEleve('valide'), /Validé/)
  assert.match(libelleEleve('vide'), /Écris ici/)
})

test('le thème proposé est nettoyé, borné, et vide devient null', () => {
  assert.equal(themePropose('  Le   doute\n\n'), 'Le doute')
  assert.equal(themePropose(''), null)
  assert.equal(themePropose(null), null)
  assert.equal(themePropose('x'.repeat(400))!.length, 300)
})
