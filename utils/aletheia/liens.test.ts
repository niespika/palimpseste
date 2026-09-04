// Tests de garde des liens de la carte en phrases. Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { phraseDuLienCarte } from './liens'

test('un verbe nu devient une phrase, avec les séances nommées', () => {
  assert.equal(phraseDuLienCarte(1, 2, 'prépare : poser le problème (la tutelle) appelle la question de ce qu’il faut pour en sortir'),
    'La séance 1 prépare la séance 2 : poser le problème (la tutelle) appelle la question de ce qu’il faut pour en sortir.')
  assert.equal(phraseDuLienCarte(1, 4, 'répond à : la fin boucle sur le début'), 'La séance 1 répond à la séance 4 : la fin boucle sur le début.')
  assert.equal(phraseDuLienCarte(2, 3, 'approfondit'), 'La séance 2 approfondit la séance 3.')
})

test('une phrase déjà écrite passe telle quelle ; les titres de chapitre sont cités', () => {
  assert.equal(phraseDuLienCarte(1, 2, 'La séance 1 prépare la séance 2 : la tutelle appelle la liberté'), 'La séance 1 prépare la séance 2 : la tutelle appelle la liberté.')
  assert.equal(phraseDuLienCarte('Le mythe', 'Diotime', 'prépare : le manque appelle la montée'), '« Le mythe » prépare « Diotime » : le manque appelle la montée.')
  assert.equal(phraseDuLienCarte(1, 2, ''), 'La séance 1 mène à la séance 2.')
})
