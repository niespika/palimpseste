// `distance_contexte` SE CALCULE, elle ne se juge pas (`01-` §11). Trois points
// que la source insiste à écarter :
//   · l'opérande est le PARTAGE `composer` / pas-`composer`, et rien d'autre ;
//   · LE CRAN N'Y ENTRE PAS — « c'est un axe de difficulté, non de nouveauté » ;
//   · sans dépôt d'origine, NULL — et NULL n'est pas une valeur par défaut.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { distanceContexte, partageDesModes } from './distance-contexte'

test('la série se DÉRIVE des modes — aucune colonne `famille` nulle part', () => {
  assert.equal(partageDesModes(['composer']), 'composition')
  assert.equal(partageDesModes(['composer', 'restituer']), 'composition')
  assert.equal(partageDesModes(['expliquer', 'restituer']), 'reception')
})

test('même partage, même objet → meme_type', () => {
  assert.equal(
    distanceContexte({ modes: ['composer'], objet: 'argument' }, { modes: ['composer'], objet: 'argument' }),
    'meme_type')
})

test('même partage, objet différent → meme_famille', () => {
  assert.equal(
    distanceContexte({ modes: ['composer'], objet: 'argument' }, { modes: ['composer'], objet: 'transition' }),
    'meme_famille')
})

test('partage différent → transfert, MÊME SI l\'objet est le même', () => {
  assert.equal(
    distanceContexte({ modes: ['composer'], objet: 'argument' }, { modes: ['expliquer'], objet: 'argument' }),
    'transfert')
})

test('LE CRAN N\'Y ENTRE PAS : deux crans différents sur le même objet restent meme_type', () => {
  // N1 garde l'objet et change le cran ; si le cran entrait, la troisième
  // branche de N2 s'éteindrait pour les élèves que N1 vient de traiter.
  assert.equal(
    distanceContexte({ modes: ['composer'], objet: 'argument' }, { modes: ['composer'], objet: 'argument' }),
    'meme_type')
})

test('sans dépôt d\'origine — les devoirs ingérés — la valeur est NULL', () => {
  assert.equal(distanceContexte({ modes: ['composer'], objet: null }, { modes: ['composer'], objet: 'argument' }), null)
  assert.equal(distanceContexte({ modes: ['composer'], objet: 'argument' }, { modes: ['composer'], objet: null }), null)
})

test('sans mesure antérieure, il n\'y a pas de distance à mesurer : NULL', () => {
  assert.equal(distanceContexte({ modes: ['composer'], objet: 'argument' }, null), null)
})
