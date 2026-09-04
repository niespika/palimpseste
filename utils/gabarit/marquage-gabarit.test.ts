// C7-L3 — le marquage du gabarit : la phrase du 10- §5, et le point d'insertion.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { marquerLeMateriau, pointDInsertion, regimeDeMarquage } from '../deroule/marquage'

const REGLE = 'le passage qui porte le problème'

test('la phrase de la table du 10- §5 vaut « passage fautif » ; « rien : … » vaut rien', () => {
  assert.equal(regimeDeMarquage(REGLE), 'passage_fautif')
  assert.equal(regimeDeMarquage("rien : l'élève désigne"), 'rien')
  assert.equal(regimeDeMarquage(null), null)
})

test('un remplacement marque la phrase qui porte le diff', () => {
  const contenu = "Les révisions gardent les notions. Donc elles sont nécessaires. C'est utile."
  const corrige = "Les révisions gardent les notions. Comme perdre ces bases coûte, elles sont nécessaires. C'est utile."
  const seg = marquerLeMateriau(contenu, REGLE, { versionCorrigee: corrige })!
  assert.deepEqual(seg.filter((x) => x.marque).map((x) => x.texte), ['Donc elles sont nécessaires.'])
  assert.equal(seg.map((x) => x.texte).join(''), contenu)
})

test('une insertion marque le dernier mot avant et le premier après — jamais rien', () => {
  const contenu = 'Il conclut vite. La preuve est là. Rien ne les relie.'
  const corrige = 'Il conclut vite. La preuve est là. Or une preuve seule ne suffit pas. Rien ne les relie.'
  assert.deepEqual(pointDInsertion(contenu, corrige), [6, 8])
  const seg = marquerLeMateriau(contenu, REGLE, { versionCorrigee: corrige })!
  assert.deepEqual(seg.filter((x) => x.marque).map((x) => x.texte), ['là. Rien'])
  assert.equal(seg.map((x) => x.texte).join(''), contenu)
})

test('une insertion à la fin marque le dernier mot ; au début, le premier', () => {
  assert.deepEqual(pointDInsertion('Un deux trois.', 'Un deux trois. Quatre.'), [2, 3])
  assert.deepEqual(pointDInsertion('Un deux trois.', 'Zéro. Un deux trois.'), [0, 1])
  assert.equal(pointDInsertion('Un deux trois.', 'Un DEUX trois.'), null)
  assert.equal(pointDInsertion('Un deux trois.', 'Un deux trois.'), null)
  assert.equal(pointDInsertion('', 'x'), null)
})
