// ============================================================================
// LE RENVOI VERS LE PASSAGE DE LA COPIE. Ce que ce test GARDE :
//   · ⭐⭐ que la copie reste OCTET POUR OCTET la copie — la concaténation des
//     segments la rend à l'identique, sur chaque vecteur ;
//   · ⭐ que l'aplatissement RESTE D'ACCORD avec celui de la chaîne
//     (`citationsIntrouvables`) : une citation que le contrôle tient pour
//     présente doit se retrouver ici, sinon le retour parlerait d'un passage que
//     l'écran ne sait pas montrer ;
//   · ⛔ qu'une citation introuvable rend `null` — **on ne surligne pas à
//     côté** : l'élève corrigerait une phrase qu'on ne lui reproche pas ;
//   · ⚠️ le passage À CHEVAL sur un retour à la ligne, qui doit sortir d'un seul
//     tenant, saut compris.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { intervalleDeLaCitation, segmentsDuRenvoi } from './renvoi'
import { citationsIntrouvables } from '../chaine/anti-injection'

const COPIE = 'Descartes cherche une vérité qui résiste à tout.\n\n'
  + 'Mais il remarque une chose : pendant qu’il doute, il pense.\n'
  + 'Et s’il pense, alors il existe au moins comme celui qui pense.'

test('le verbatim exact se retrouve, et le texte n’est pas retouché', () => {
  const citation = 'pendant qu’il doute, il pense'
  const bornes = intervalleDeLaCitation(COPIE, citation)
  assert.notEqual(bornes, null)
  assert.equal(COPIE.slice(bornes![0], bornes![1]), citation)

  const segments = segmentsDuRenvoi(COPIE, citation)
  assert.equal(segments.map((s) => s.texte).join(''), COPIE)
  assert.deepEqual(segments.filter((s) => s.marque).map((s) => s.texte), [citation])
})

test('l’apostrophe et les guillemets ne cassent pas le renvoi', () => {
  // Le retour cite avec l'apostrophe droite et des guillemets ; la copie, non.
  const citation = '"pendant qu\'il doute, il pense"'
  assert.equal(citationsIntrouvables(COPIE, [citation]).introuvables.length, 0,
    'prémisse : la chaîne tient cette citation pour présente')
  const bornes = intervalleDeLaCitation(COPIE, citation)
  assert.notEqual(bornes, null)
  assert.equal(COPIE.slice(bornes![0], bornes![1]), 'pendant qu’il doute, il pense')
})

test('un passage à cheval sur un retour à la ligne sort d’un seul tenant', () => {
  const citation = 'il pense. Et s’il pense'
  assert.equal(citationsIntrouvables(COPIE, [citation]).introuvables.length, 0)
  const segments = segmentsDuRenvoi(COPIE, citation)
  assert.equal(segments.map((s) => s.texte).join(''), COPIE)
  const marques = segments.filter((s) => s.marque)
  assert.equal(marques.length, 1, 'un seul segment, saut compris')
  assert.match(marques[0]!.texte, /\n/)
})

test('les espaces multiples de la copie n’empêchent pas la reconnaissance', () => {
  const copie = 'Il  doute   de   tout.'
  const bornes = intervalleDeLaCitation(copie, 'doute de tout.')
  assert.notEqual(bornes, null)
  assert.equal(copie.slice(bornes![0], bornes![1]), 'doute   de   tout.')
})

test('⛔ une citation introuvable ne s’ancre nulle part', () => {
  assert.equal(intervalleDeLaCitation(COPIE, 'une phrase que l’élève n’a jamais écrite'), null)
  const segments = segmentsDuRenvoi(COPIE, 'une phrase que l’élève n’a jamais écrite')
  assert.equal(segments.map((s) => s.texte).join(''), COPIE)
  assert.equal(segments.some((s) => s.marque), false)
})

test('les cas vides ne lèvent pas et ne marquent rien', () => {
  assert.equal(intervalleDeLaCitation(null, 'x'), null)
  assert.equal(intervalleDeLaCitation(COPIE, null), null)
  assert.equal(intervalleDeLaCitation(COPIE, '   '), null)
  assert.deepEqual(segmentsDuRenvoi(null, 'x'), [])
  assert.deepEqual(segmentsDuRenvoi('', 'x'), [])
  assert.deepEqual(segmentsDuRenvoi(COPIE, null).map((s) => s.marque), [false])
})
