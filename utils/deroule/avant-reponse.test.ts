import { test } from 'node:test'
import assert from 'node:assert/strict'
import { vueAvantReponse } from './avant-reponse'
import type { VueDuDeroule } from './vue'

// Une vue au temps du retour, avec tout ce que l'élève a produit.
const vue = {
  temps: ['preparer', 'ecrire', 'se_juger', 'retour'], tempsCourant: 'retour',
  estUnePaire: true, etapePaire: 'correction_2', v1RemiseLe: '2026-09-10T10:00:00Z',
  texteV1: 'ma réponse', texteVf: 'ma vf', microQuestionDue: true, motifDepassement: 'pause',
  cas: [{ ordre: 1, consigne: [], materiau: [{ texte: 'Le texte.', marque: false }],
    credence: null, credenceDonnee: { index: 2 }, designationDemandee: true, sansEcriture: false,
    sansDocuments: false, zoneDonnee: [0, 3], designationDonnee: true, pieces: null }],
  corrections: [{ x: 1 }], verdictParCas: [true], precisionParCas: ['juste'], passageParCas: ['Le'],
  etalon: { texte: 'attendu', deplie: true }, gestesRestants: ['confiance'],
  confianceDeclaree: { a: 'b' }, conditionsDeclarees: {}, restitutionAChaud: 'r',
  seJuger: { servie: true, motif: null, offre: { questions: [] } },
  attente: { jobs: [{}], enCours: true, echecDefinitif: false, message: 'm' },
  retourChaud: { points: [] }, retourFinal: { points: [] }, contestations: [{}],
  langue: { phrase: 'p', n: 2, ancrages: [{}] }, verdictCalibration: { lignes: [{}], phrase: 'v' },
  fin: 'hors_cible', piloteArgument: null, guide: 'le guide', sujet: 'Le sujet ?',
} as unknown as VueDuDeroule

test('la vue revient au premier temps, sans rien de ce que l’élève a produit', () => {
  const v = vueAvantReponse(vue)
  assert.equal(v.tempsCourant, 'preparer')
  assert.equal(v.etapePaire, 'cas_1')
  assert.equal(v.texteV1, null)
  assert.equal(v.texteVf, null)
  assert.equal(v.retourChaud, null)
  assert.equal(v.retourFinal, null)
  assert.equal(v.etalon, null)
  assert.equal(v.attente.enCours, false)
  assert.equal(v.seJuger.servie, false)
  assert.deepEqual(v.corrections, [null])
  assert.deepEqual(v.gestesRestants, [])
  assert.equal(v.cas[0]!.credenceDonnee, null)
  assert.equal(v.cas[0]!.zoneDonnee, null)
  assert.equal(v.cas[0]!.designationDonnee, false)
})

test('la MATIÈRE est intacte : consigne, matériau marqué, guide, sujet', () => {
  const v = vueAvantReponse(vue)
  assert.deepEqual(v.cas[0]!.materiau, [{ texte: 'Le texte.', marque: false }])
  assert.equal(v.guide, 'le guide')
  assert.equal(v.sujet, 'Le sujet ?')
  assert.equal(v.cas[0]!.designationDemandee, true)
})

test('l’original n’est pas modifié', () => {
  vueAvantReponse(vue)
  assert.equal(vue.texteV1, 'ma réponse')
  assert.equal(vue.cas[0]!.credenceDonnee !== null, true)
})
