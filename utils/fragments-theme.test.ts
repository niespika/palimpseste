// C8 — le thème proposé par l'élève, validé par le professeur : la règle pure.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { themeAValider, statutDuTheme, libelleEleve, themePropose, commentaireEnAttente, commentaireProf } from './fragments-theme'

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
  assert.match(libelleEleve('commente'), /commentaire/)
})

test('le thème proposé est nettoyé, borné, et vide devient null', () => {
  assert.equal(themePropose('  Le   doute\n\n'), 'Le doute')
  assert.equal(themePropose(''), null)
  assert.equal(themePropose(null), null)
  assert.equal(themePropose('x'.repeat(400))!.length, 300)
})

// ── Le commentaire du professeur (« ni valider, ni modifier ») ──────────────

test('un commentaire posé APRÈS la proposition rend le thème « commenté », devant « à valider »', () => {
  const t = { theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: null, commentaire_prof: 'Trop large : resserre.', commente_at: '2026-09-02T12:00:00Z' }
  assert.equal(commentaireEnAttente(t), true)
  assert.equal(themeAValider(t), true)
  assert.equal(statutDuTheme(t), 'commente')
})

test('l’élève re-propose APRÈS le commentaire : le commentaire s’éteint, le thème redevient « à valider »', () => {
  const t = { theme: 'Le doute chez Descartes', propose_at: '2026-09-03T08:00:00Z', valide_at: null, commentaire_prof: 'Trop large : resserre.', commente_at: '2026-09-02T12:00:00Z' }
  assert.equal(commentaireEnAttente(t), false)
  assert.equal(statutDuTheme(t), 'a_valider')
})

test('le professeur valide APRÈS son commentaire : validé, le commentaire ne compte plus', () => {
  const t = { theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: '2026-09-02T13:00:00Z', commentaire_prof: 'Bon, finalement ça va.', commente_at: '2026-09-02T12:00:00Z' }
  assert.equal(commentaireEnAttente(t), false)
  assert.equal(statutDuTheme(t), 'valide')
})

test('un commentaire sur un thème posé par le professeur lui-même compte aussi (l’élève doit répondre)', () => {
  const t = { theme: 'La piraterie', propose_at: null, valide_at: '2026-09-01T10:00:00Z', commentaire_prof: 'Précise la période.', commente_at: '2026-09-02T12:00:00Z' }
  assert.equal(statutDuTheme(t), 'commente')
})

test('un commentaire vide, ou un thème vide, ne fait pas un « commenté »', () => {
  assert.equal(commentaireEnAttente({ theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: null, commentaire_prof: '   ', commente_at: '2026-09-02T12:00:00Z' }), false)
  assert.equal(commentaireEnAttente({ theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: null, commentaire_prof: 'x', commente_at: null }), false)
  assert.equal(statutDuTheme({ theme: '', propose_at: null, valide_at: null, commentaire_prof: 'x', commente_at: '2026-09-02T12:00:00Z' }), 'vide')
})

test('les lecteurs d’avant, sans les champs du commentaire, gardent leur statut', () => {
  assert.equal(statutDuTheme({ theme: 'Le doute', propose_at: '2026-09-02T10:00:00Z', valide_at: null }), 'a_valider')
})

test('le commentaire est nettoyé, borné, et vide devient null', () => {
  assert.equal(commentaireProf('  Trop large.\r\nResserre.  '), 'Trop large.\nResserre.')
  assert.equal(commentaireProf(''), null)
  assert.equal(commentaireProf(undefined), null)
  assert.equal(commentaireProf('x'.repeat(1200))!.length, 1000)
})
