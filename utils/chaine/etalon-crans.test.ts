// ============================================================================
// ⭐⭐ QUELS CRANS SERVENT LEUR ÉTALON AU CORRECTEUR — la règle, et ses bords.
// ----------------------------------------------------------------------------
// ⛔ CE TEST EXISTE PARCE QUE LA RÈGLE ÉTAIT MUETTE. Le 31/08, le `02-` §2.2 a
//    fait passer `reponse_attendue` de `null` à `présent` aux crans 7 et 9, et
//    264 réponses ont été écrites. Celles du cran 7 — 88 — ne parvenaient à
//    PERSONNE : `etalonDeProduction` filtrait en dur sur 2, 6 et 8, l'élève ne
//    les voit jamais (`etalonServi`), et rien ne le disait.
// ⚠️ Les deux bords comptent autant que le cas central : un filtre qui laisserait
//    passer les crans à candidats ferait lire LA réponse comme un modèle.
// ============================================================================
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CRANS_A_ETALON } from '../cran'

test('⭐ l’étalon est servi au correcteur aux crans 2, 6, 8 — et au 7', () => {
  for (const n of [2, 6, 8]) assert.ok(CRANS_A_ETALON.has(n), `le cran ${n} produit`)
  assert.ok(CRANS_A_ETALON.has(7), 'le cran 7 — sa réponse n’a QUE ce chemin')
})

test('⛔ et jamais aux crans qui isolent, ni au 9', () => {
  for (const n of [1, 3, 4, 5]) {
    assert.ok(!CRANS_A_ETALON.has(n),
      `le cran ${n} isole : sa réponse est LA réponse, pas un modèle`)
  }
  assert.ok(!CRANS_A_ETALON.has(9),
    'le cran 9 sert sa réponse à l’ÉLÈVE, comme correction de la paire')
  assert.equal(CRANS_A_ETALON.size, 4, 'quatre crans, pas un de plus')
})
