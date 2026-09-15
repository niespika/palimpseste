import { test } from 'node:test'
import assert from 'node:assert/strict'
import { suiteDeLaVue, vueALEtape, traceDeLEtape, ecransRejoues, vueALEcran } from './rembobinage'
import type { VueDuDeroule } from './vue'

// Une paire 4(a)/4(b) : le cas 1 s'écrit, le cas 2 se surligne ; crédence aux deux ;
// une confiance à déclarer ; tout a été fait, jusqu'à la remise.
const paire = {
  temps: ['preparer', 'ecrire', 'se_juger', 'retour'], tempsCourant: 'retour',
  estUnePaire: true, etapePaire: 'correction_2', v1RemiseLe: '2026-09-10T10:00:00Z',
  credenceEstLaReponse: false, aucuneRemise: false,
  texteV1: 'réponse au cas 1', texteVf: 'réponse au cas 2', microQuestionDue: false, motifDepassement: null,
  cas: [
    { ordre: 1, consigne: [], materiau: [], credence: { forme: 'pourcentage', empechement: null },
      credenceDonnee: { cas: 1, forme: 'pourcentage', pourcentage: 80 }, designationDemandee: false,
      sansEcriture: false, sansDocuments: false, zoneDonnee: null, designationDonnee: false, pieces: null },
    { ordre: 2, consigne: [], materiau: [], credence: { forme: 'pourcentage', empechement: null },
      credenceDonnee: { cas: 2, forme: 'pourcentage', pourcentage: 40 }, designationDemandee: true,
      sansEcriture: true, sansDocuments: false, zoneDonnee: [3, 9], designationDonnee: true, pieces: null },
  ],
  corrections: [{ x: 1 }, { x: 2 }], verdictParCas: [true, false], precisionParCas: ['a', 'b'], passageParCas: ['p', 'q'],
  etalon: null, gestesRestants: [], competencesDeLaConfiance: ['argumentation'],
  confianceDeclaree: { argumentation: 'elevee' }, conditionsDeclarees: { valeur: 'temps_mis' }, restitutionAChaud: null,
  seJuger: { servie: false, motif: null, offre: null },
  attente: { jobs: [], enCours: false, echecDefinitif: false, message: null },
  retourChaud: null, retourFinal: null, contestations: [], langue: { phrase: null, n: null, ancrages: [] },
  verdictCalibration: { lignes: [], phrase: null }, fin: null, piloteArgument: null,
} as unknown as VueDuDeroule

test('la suite d’une paire 4(a)/4(b) : écrire, crédence, correction, surligner, crédence, gestes, rendre', () => {
  assert.deepEqual(suiteDeLaVue(paire).map((s) => `${s.etape}${s.cas ?? ''}`),
    ['ecrire1', 'credence1', 'correction1', 'designer2', 'credence2', 'confiance', 'conditions', 'rendre'])
})

test('sur « surligner cas 2 », le cas 1 est entier, la correction est là, la zone est posée, la crédence 2 pas encore', () => {
  const suite = suiteDeLaVue(paire)
  const v = vueALEtape(paire, suite, 3)
  assert.equal(v.tempsCourant, 'ecrire')
  assert.equal(v.etapePaire, 'cas_2')
  assert.equal(v.texteV1, 'réponse au cas 1')
  assert.deepEqual(v.cas[0].credenceDonnee, { cas: 1, forme: 'pourcentage', pourcentage: 80 })
  // ⚠️ Audit du 14/09 : la correction porte `cas: 1` dans la suite — elle doit être gardée.
  assert.deepEqual(v.corrections, [{ x: 1 }, null])
  assert.deepEqual(v.verdictParCas, [true, null])
  assert.deepEqual(v.cas[1].zoneDonnee, [3, 9])
  assert.equal(v.cas[1].designationDonnee, true)
  assert.equal(v.cas[1].credenceDonnee, null)
  assert.deepEqual(v.gestesRestants, ['confiance', 'conditions'])
  assert.equal(v.confianceDeclaree, null)
  assert.equal(v.v1RemiseLe, null)
})

test('sur « la correction du premier cas », le moment est celui de la correction et le cas 2 est vide', () => {
  const v = vueALEtape(paire, suiteDeLaVue(paire), 2)
  assert.equal(v.etapePaire, 'correction')
  assert.deepEqual(v.corrections, [{ x: 1 }, null])
  assert.equal(v.texteVf, null)
  assert.equal(v.cas[1].designationDonnee, false)
})

test('sur « conditions », la confiance déclarée est gardée, les conditions aussi (c’est l’écran courant), la remise non', () => {
  const v = vueALEtape(paire, suiteDeLaVue(paire), 6)
  assert.deepEqual(v.gestesRestants, ['conditions'])
  assert.deepEqual(v.confianceDeclaree, { argumentation: 'elevee' })
  assert.deepEqual(v.conditionsDeclarees, { valeur: 'temps_mis' })
  assert.equal(v.v1RemiseLe, null)
})

test('les tuiles disent ce que l’élève a fait, en clair', () => {
  const suite = suiteDeLaVue(paire)
  assert.deepEqual(traceDeLEtape(paire, suite[2]), { faite: true, resume: 'servie' })
  assert.deepEqual(traceDeLEtape(paire, suite[3]), { faite: true, resume: 'une zone surlignée' })
  assert.deepEqual(traceDeLEtape(paire, suite[5]), { faite: true, resume: 'sûr' })
  assert.deepEqual(traceDeLEtape(paire, suite[6]), { faite: true, resume: 'le temps qu’il fallait' })
  assert.deepEqual(traceDeLEtape(paire, suite[7]), { faite: true, resume: 'v1 remise' })
})

test('un écran jamais atteint : la vue rembobinée est vide là, sans planter', () => {
  const arretee = { ...paire, texteVf: null, v1RemiseLe: null, confianceDeclaree: null, conditionsDeclarees: null,
    cas: [paire.cas[0], { ...paire.cas[1], credenceDonnee: null, zoneDonnee: null, designationDonnee: false }] } as VueDuDeroule
  const suite = suiteDeLaVue(arretee)
  const v = vueALEtape(arretee, suite, 7)
  assert.equal(v.texteV1, 'réponse au cas 1')
  assert.equal(v.texteVf, null)
  assert.deepEqual(v.gestesRestants, [])
  assert.deepEqual(traceDeLEtape(arretee, suite[3]), { faite: false, resume: 'pas de zone posée' })
})

// Une rédaction simple au régime plein, tout est fait : v1, retour, vf, retour final.
const pleine = {
  ...paire, estUnePaire: false, regime: 'plein', etapePaire: null, tempsCourant: 'retour_final',
  cas: [paire.cas[0]], corrections: [null], verdictParCas: [null], precisionParCas: [null], passageParCas: [null],
  texteV1: 'ma v1', texteVf: 'ma version finale', vfRemiseLe: '2026-09-12T10:00:00Z',
  retourChaud: { moment: 'chaud', points: [{}, {}], luLe: '2026-09-11T10:00:00Z' },
  retourFinal: { moment: 'final', points: [{}] },
} as unknown as VueDuDeroule

test('au régime plein, la frise continue après la remise : retour, version finale, rendre, retour final', () => {
  assert.deepEqual(ecransRejoues(pleine).map((s) => s.etape),
    ['ecrire', 'credence', 'confiance', 'conditions', 'rendre', 'retour', 'vf_ecrire', 'vf_rendre', 'retour_final'])
  // Une paire n'a pas de version finale : `texteVf` y est la réponse au second cas.
  assert.deepEqual(ecransRejoues(paire).map((s) => s.etape).slice(-2), ['rendre', 'retour'])
})

test('sur « ton retour », la vf n’est pas encore écrite ; sur « ta version finale », elle l’est, sans retour final', () => {
  const ecrans = ecransRejoues(pleine)
  const retour = vueALEcran(pleine, ecrans, 5)
  assert.equal(retour.tempsCourant, 'retour')
  assert.equal(retour.texteVf, null)
  assert.equal(retour.retourFinal, null)
  assert.deepEqual(retour.retourChaud, pleine.retourChaud)
  const vf = vueALEcran(pleine, ecrans, 6)
  assert.equal(vf.tempsCourant, 'reviser')
  assert.equal(vf.texteVf, 'ma version finale')
  assert.equal(vf.vfRemiseLe, null)
  assert.equal(vf.retourFinal, null)
  // Un écran de travail passe toujours par le rembobineur du travail.
  assert.equal(vueALEcran(pleine, ecrans, 0).texteV1, 'ma v1')
  assert.equal(vueALEcran(pleine, ecrans, 0).v1RemiseLe, null)
})

test('les tuiles d’après la remise', () => {
  const ecrans = ecransRejoues(pleine)
  assert.deepEqual(traceDeLEtape(pleine, ecrans[5]), { faite: true, resume: '2 points · lu' })
  assert.deepEqual(traceDeLEtape(pleine, ecrans[6]), { faite: true, resume: '17 caractères' })
  assert.deepEqual(traceDeLEtape(pleine, ecrans[7]), { faite: true, resume: 'vf remise' })
  assert.deepEqual(traceDeLEtape(pleine, ecrans[8]), { faite: true, resume: '1 point' })
})
