// Tests de la RÈGLE « cette conception est-elle un résidu » (fonction PURE).
// Exécution : `npm test`.
//
// ⭐ Le défaut qu'elle ferme, relevé sur la prod de 1HLP le 26/08 : une instance
//    résiduelle porte QUAND MÊME un `exercice_planifie_id` — celui d'une ligne
//    ANNULÉE. Tester « la colonne est-elle nulle » répondait donc « elle est au
//    plan », et l'écran refusait de proposer la suppression du résidu même.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { etatDeConception, phraseEtat } from './residu'

test('une ligne vivante et conçue : ce n’est pas un résidu', () => {
  assert.deepEqual(etatDeConception({ statut: 'concu', supprime_at: null }), { residu: false })
})

test('une ligne encore à concevoir n’est pas un résidu non plus', () => {
  assert.deepEqual(etatDeConception({ statut: 'a_concevoir', supprime_at: null }), { residu: false })
})

test('aucune ligne du tout → résidu « sans ligne »', () => {
  assert.deepEqual(etatDeConception(null), { residu: true, motif: 'sans-ligne' })
})

test('⭐ une ligne ANNULÉE → résidu : c’est l’état que « Retirer du plan » laissait', () => {
  assert.deepEqual(
    etatDeConception({ statut: 'annule', supprime_at: null }),
    { residu: true, motif: 'ligne-annulee' },
  )
})

test('une ligne tombstonée (`supprime_at`) → résidu, quel que soit son statut', () => {
  assert.deepEqual(
    etatDeConception({ statut: 'concu', supprime_at: '2026-08-25T17:29:00Z' }),
    { residu: true, motif: 'ligne-annulee' },
  )
})

test('chaque état a sa phrase, et elles diffèrent', () => {
  const p = [
    phraseEtat({ residu: false }),
    phraseEtat({ residu: true, motif: 'sans-ligne' }),
    phraseEtat({ residu: true, motif: 'ligne-annulee' }),
  ]
  assert.equal(new Set(p).size, 3)
  assert.ok(p.every((x) => x.length > 20))
})
