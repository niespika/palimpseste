import { test } from 'node:test'
import assert from 'node:assert/strict'
import { texteSansMarkdown, aDesFragilites } from './quazian-rapports'

test('le Markdown rendu au bac à sable se lit en texte simple', () => {
  const brut = '## Rapport de fragilités – Classe Test\n\n**Diagnostic général :** rien.\n\n- **Suggestion** : *vérifier* les seuils\n* seconde puce\n\n\n---\n> ⚠️ Fin.'
  assert.equal(texteSansMarkdown(brut),
    'Rapport de fragilités – Classe Test\n\nDiagnostic général : rien.\n\n• Suggestion : vérifier les seuils\n• seconde puce\n\n⚠️ Fin.')
})

test('un texte déjà propre ne bouge pas, et nettoyer deux fois ne change rien', () => {
  const propre = 'Deux idées fausses dominent : la liberté et le désir.\n\n• Reprendre Spinoza en classe.\n3 * 4 = 12, et 5*6 aussi.'
  assert.equal(texteSansMarkdown(propre), propre)
  assert.equal(texteSansMarkdown('note (*) importante et (*) autre'), 'note (*) importante et (*) autre')
  assert.equal(texteSansMarkdown('avant\n***\naprès'), 'avant\n\naprès')
  const une = texteSansMarkdown('## A\n**b** et *c*')
  assert.equal(texteSansMarkdown(une), une)
})

test('sans idée fausse ni lacune, pas de rapport à demander', () => {
  assert.equal(aDesFragilites({}), false)
  assert.equal(aDesFragilites({ liberte: { idee_fausse: 0, lacune: 0 } }), false)
  assert.equal(aDesFragilites({ liberte: { idee_fausse: 0, lacune: 2 } }), true)
  assert.equal(aDesFragilites({ liberte: { idee_fausse: 1, lacune: 0 } }), true)
})
