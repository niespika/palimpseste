// C7-L3 — les consignes du gabarit, mot pour mot (`10-` §3), et les trois règles.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { consigneDuGabarit, demandeUneDesignationAuGabarit, marqueLePassage, sansDocuments } from './consigne'

const E = "Entre ce qui sert d'appui à l'argument et la conclusion, il y a juste un « donc »."
const c = (cran: number, variante: 'a' | 'b' | null = null, insertion = false) =>
  consigneDuGabarit({ cran, variante, enonce: E, insertion })

test('les huit consignes des crans qui isolent, telles que Louis les a écrites', () => {
  assert.equal(c(1, 'a'), "Lis les documents ci-joints. Dans le devoir d'élève, le passage en gras a un problème. Lequel ?")
  assert.equal(c(1, 'b'), `Voici une erreur courante : « ${E} » Lequel de ces quatre devoirs d'élève la commet ?`)
  assert.equal(c(3), `Lis les documents ci-joints. Le passage en gras du devoir d'élève a ce problème : « ${E} » Laquelle de ces quatre versions n'a plus ce problème ?`)
  assert.equal(c(4, 'a'), "Lis les documents ci-joints. Le passage en gras du devoir d'élève a un problème. Dis lequel.")
  assert.equal(c(4, 'b'), `Lis les documents ci-joints. Le devoir d'élève a ce problème : « ${E} » Surligne le passage qui le porte.`)
  assert.equal(c(5), `Lis les documents ci-joints. Le passage en gras du devoir d'élève a ce problème : « ${E} » Réécris ce passage pour qu'il n'ait plus ce problème.`)
  assert.equal(c(7), "Lis les documents ci-joints. Le devoir d'élève a un problème. Surligne le passage qui le porte, et corrige-le.")
  assert.equal(c(9), "Lis les documents ci-joints. Le devoir d'élève a-t-il un problème ? Si oui, surligne le passage qui le porte et dis lequel. S'il n'en a pas, dis-le.")
})

test('le point d’insertion change la consigne aux quatre crans qui marquent, et à eux seuls', () => {
  for (const [cran, variante] of [[1, 'a'], [3, null], [4, 'a'], [5, null]] as const) {
    assert.match(c(cran, variante, true)!, /il manque quelque chose/)
    assert.equal(c(cran, variante, true)!.includes('a un problème'), false)
  }
  assert.match(c(5, null, true)!, /Écris ce qui manque\.$/)
  for (const [cran, variante] of [[1, 'b'], [4, 'b'], [7, null], [9, null]] as const) {
    assert.equal(c(cran, variante, true), c(cran, variante, false))
  }
})

test('les trois règles : surligne jamais recopie ; le 9 demande ; le 7 corrige sans réécrire en entier', () => {
  for (const cran of [7, 9]) assert.equal(c(cran)!.includes('recopie'), false)
  assert.match(c(4, 'b')!, /Surligne/)
  assert.match(c(9)!, /a-t-il un problème \?/)
  assert.equal(c(9)!.startsWith('Lis les documents ci-joints. Surligne'), false)
  assert.equal(c(7)!.includes('en entier'), false)
  assert.match(c(7)!, /corrige-le/)
})

test('les crans de production n’ont pas encore leur consigne ici ; un énoncé absent ne casse rien', () => {
  for (const cran of [2, 6, 8]) assert.equal(c(cran), null)
  assert.match(consigneDuGabarit({ cran: 3, variante: null, enonce: null, insertion: false })!, /« … »/)
})

test('marquer, désigner, servir des documents — par cran et variante (`10-` §2 et §5)', () => {
  assert.deepEqual([1, 3, 4, 5].map((k) => marqueLePassage(k, k === 1 || k === 4 ? 'a' : null)), [true, true, true, true])
  assert.deepEqual([[1, 'b'], [4, 'b'], [7, null], [9, null]].map(([k, v]) => marqueLePassage(k as number, v as never)), [false, false, false, false])
  assert.deepEqual([[4, 'b'], [7, null], [9, null]].map(([k, v]) => demandeUneDesignationAuGabarit(k as number, v as never)), [true, true, true])
  assert.deepEqual([[4, 'a'], [1, 'b'], [3, null], [5, null]].map(([k, v]) => demandeUneDesignationAuGabarit(k as number, v as never)), [false, false, false, false])
  assert.equal(sansDocuments(1, 'b'), true)
  assert.equal(sansDocuments(1, 'a'), false)
})
