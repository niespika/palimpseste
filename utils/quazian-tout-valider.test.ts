import test from 'node:test'
import assert from 'node:assert/strict'
import { libelleConfirmerToutValider, phraseEditionsOuvertes, phraseToutValider } from './quazian-tout-valider'

test('tout valider — la phrase dit combien il en reste, accords compris', () => {
  assert.equal(phraseToutValider(14, 17), '14 questions sur 17 ne sont pas encore validées. Les valider sans les relire une à une ?')
  assert.equal(phraseToutValider(1, 17), '1 question sur 17 n’est pas encore validée. La valider sans la relire ?')
  assert.equal(phraseToutValider(15, 15), 'Aucune des 15 questions n’est encore validée. Les valider toutes sans les relire une à une ?')
  assert.equal(phraseToutValider(1, 1), 'La question n’est pas encore validée. La valider sans la relire ?')
})
test('tout valider — le bouton de confirmation dit ce qu’il fait', () => {
  assert.equal(libelleConfirmerToutValider(14), 'Valider les 14')
  assert.equal(libelleConfirmerToutValider(1), 'Valider la question')
})
test('tout valider — une correction en cours se signale, sans bloquer', () => {
  assert.equal(phraseEditionsOuvertes([]), '')
  assert.equal(phraseEditionsOuvertes([3]), 'Q3 est ouverte en modification : sa correction n’est pas enregistrée, c’est la version enregistrée qui sera validée.')
  assert.equal(phraseEditionsOuvertes([3, 8, 12]), 'Q3, Q8 et Q12 sont ouvertes en modification : leurs corrections ne sont pas enregistrées, ce sont les versions enregistrées qui seront validées.')
})
