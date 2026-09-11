import test from 'node:test'
import assert from 'node:assert/strict'
import { cheminsCampagne } from './chemins-banc-pilote-argument.mjs'

const bons = ['--campagne=scripts/recette/pilote-argument/campagnes/essai', '--prive=/tmp/argument-essai', '--registre=/tmp/argument-essai.json']
test('une campagne exige trois chemins isolés et explicites', () => {
  assert.ok(cheminsCampagne(bons).racine.endsWith('/campagnes/essai'))
  for (let i = 0; i < 3; i++) assert.throws(() => cheminsCampagne(bons.filter((_, j) => i !== j)))
  assert.throws(() => cheminsCampagne([...bons, bons[0]]))
})
test('les résultats et registres initiaux sont protégés', () => {
  for (const [i, valeur] of [
    [0, '--campagne=scripts/recette/pilote-argument/banc'],
    [0, '--campagne=scripts/recette/pilote-argument/campagnes/../banc'],
    [1, '--prive=/tmp/pilote-argument-banc'],
    [2, '--registre=/tmp/pilote-argument-banc-decor.json'],
    [1, '--prive=scripts/recette/prive'],
  ]) assert.throws(() => cheminsCampagne(bons.map((a, j) => i === j ? valeur : a)))
})
