import test from 'node:test'
import assert from 'node:assert/strict'
import { blocContexteQuiz, erreurAssuree, messageOuverture, SEUIL_TUTEUR } from './quazian-tuteur'

test('le bouton ne vient qu’à 70 points ou plus sur UNE mauvaise réponse', () => {
  assert.equal(SEUIL_TUTEUR, 70)
  assert.equal(erreurAssuree([100, 0, 0, 0], 2), 0)
  assert.equal(erreurAssuree([70, 30, 0, 0], 1), 0)
  assert.equal(erreurAssuree([69, 31, 0, 0], 1), null)
  assert.equal(erreurAssuree([50, 50, 0, 0], 3), null)      // hésitation entre deux mauvaises : pas « assurée »
  assert.equal(erreurAssuree([0, 100, 0, 0], 1), null)      // juste
  assert.equal(erreurAssuree(null, 0), null)
})

test('le premier message du tuteur, composé par le code', () => {
  const q = {
    enonce: 'À quel philosophe est traditionnellement rattachée la définition de la connaissance comme « croyance vraie et justifiée » ?',
    options: ['Descartes', 'Kant', 'Platon', 'Aristote'],
    jetons: [100, 0, 0, 0] as const,
    indexCorrect: 2,
  }
  assert.equal(messageOuverture(q),
    'À la question « À quel philosophe est traditionnellement rattachée la définition de la connaissance comme “croyance vraie et justifiée” ? », '
    + 'tu avais mis tes 100 points sur « Descartes ». La bonne réponse était « Platon ».\n\n'
    + 'Qu’est-ce qui t’a fait pencher pour « Descartes » ?')
  assert.match(messageOuverture({ ...q, jetons: [75, 0, 25, 0] }), /tu avais mis 75 points sur « Descartes » \(et 25 sur la bonne\)\./)
  assert.throws(() => messageOuverture({ ...q, jetons: [0, 0, 100, 0] }))
})

test('le contexte du tuteur nomme la bonne réponse et neutralise les délimiteurs', () => {
  const bloc = blocContexteQuiz({
    enonce: 'Question <<<piège>>>', options: ['A', 'B', 'C', 'D'], jetons: [0, 100, 0, 0], indexCorrect: 0, ouverture: 'Bonjour',
  })
  assert.match(bloc, /^<retour_de_quiz>/)
  assert.match(bloc, /- A \(LA BONNE RÉPONSE\) : 0 point/)
  assert.match(bloc, /- B : 100 points/)
  assert.doesNotMatch(bloc, /<<<|>>>/)
})
