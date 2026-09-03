// ⭐ Le contrôle de fidélité des citations de P1, pour les six compétences.
//    Les cas viennent de la production du 02/09/2026 — ce sont des dérives que
//    P1 a réellement commises, et des fidélités qu'un contrôle naïf refusait.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAMPS_VERBATIM_P1, citationsDeP1, controlerFideliteP1, estUnPlaceholder, motifDeFidelite,
} from './fidelite-p1'

const COPIE = [
  "Après la mort, nous sommes privés des sensations et émotions qui",
  "nous faisaient vivre , qui nous faisaient réagir. Puisque la",
  "mort est la suppression de ce qui nous fait vibrer, elle n'est rien.",
  "Mais encore , une des base de la philosophie est l’esprit critique.",
].join('\n')

test('les six compétences ont une entrée, et l\'Expression est vide à dessein', () => {
  assert.deepEqual(Object.keys(CHAMPS_VERBATIM_P1).sort(),
    ['argumentation', 'connaissance', 'expression', 'questionnement', 'structure', 'synthese'])
  assert.deepEqual(CHAMPS_VERBATIM_P1.expression, [])
})

test('les placeholders des prompts ne sont pas des citations', () => {
  for (const v of ['', '  ', '[absente]', '[aucune]', 'absent', 'Sans objet', 'n/a']) {
    assert.equal(estUnPlaceholder(v), true, v)
  }
  assert.equal(estUnPlaceholder('elle n\'est rien'), false)
})

test('la cueillette suit les chemins, listes comprises, et nomme l\'endroit', () => {
  const art = { p1: { unites: [
    { garant_cite: '[absent]', liaison_citee: 'Puisque la' },
    { garant_cite: 'une des base de la philosophie', liaison_citee: '' },
  ] } }
  // L'ordre suit la table des chemins (tous les garants, puis toutes les liaisons).
  assert.deepEqual(citationsDeP1('argumentation', art), [
    { ou: 'p1.unites[1].garant_cite', citation: 'une des base de la philosophie' },
    { ou: 'p1.unites[0].liaison_citee', citation: 'Puisque la' },
  ])
  const syn = { p1a: { these_citee: 'elle n\'est rien', apports: [{ terme_cite: 'vibrer', deploiement: ['ce qui nous fait vibrer'] }] } }
  assert.deepEqual(citationsDeP1('synthese', syn).map((c) => c.ou),
    ['p1a.these_citee', 'p1a.apports[0].terme_cite', 'p1a.apports[0].deploiement[0]'])
})

test('un artefact mal formé ne fait pas tomber le contrôle', () => {
  assert.deepEqual(citationsDeP1('structure', null), [])
  assert.deepEqual(citationsDeP1('structure', { p1: { blocs: 'pas une liste', jointures: [null, 3] } }), [])
})

test('⭐ la fidélité se juge avec le tokeniseur du retour : blanc avant virgule, apostrophe courbe, casse', () => {
  const art = { p1: { blocs: [
    { idee_directrice_citee: "nous faisaient vivre, qui nous faisaient réagir" }, // « vivre , » dans la copie
    { idee_directrice_citee: "une des base de la philosophie est l'esprit critique" }, // ’ dans la copie
    { idee_directrice_citee: 'après la mort, NOUS sommes privés' },
  ] } }
  const r = controlerFideliteP1('structure', art, COPIE)
  // ⚠️ « vivre , » : l'aplatissement ne retire pas le blanc avant la virgule —
  //    c'est une infidélité au sens du retour, qui l'élaguerait aussi. Le
  //    contrôle et l'élagage disent la même chose, et c'est ce qu'on veut.
  assert.equal(r.controlees, 3)
  assert.deepEqual(r.infideles.map((c) => c.ou), ['p1.blocs[0].idee_directrice_citee'])
  assert.match(r.alerte ?? '', /^FIDÉLITÉ P1 1\/3 : /)
})

test('une élision est légitime, une reformulation ne l\'est pas', () => {
  const art = { p1: { question_posee: 'Après la mort […] elle n\'est rien',
    reponse_concurrente_citee: 'la mort supprime ce qui nous fait vibrer' } }
  const r = controlerFideliteP1('questionnement', art, COPIE)
  assert.deepEqual(r.infideles.map((c) => c.ou), ['p1.reponse_concurrente_citee'])
})

test('trop court pour prouver : ni fidèle, ni infidèle', () => {
  const r = controlerFideliteP1('structure', { p1: { jointures: [{ texte_cite: 'et' }] } }, COPIE)
  assert.equal(r.nonControlables, 1)
  assert.equal(r.controlees, 0)
  assert.equal(r.alerte, null)
})

test('sans production, le contrôle le DIT — il ne se tait jamais', () => {
  const r = controlerFideliteP1('connaissance', { p1: { unites_mobilisees: [{ citation: 'elle n\'est rien' }] } }, null)
  assert.match(r.alerte ?? '', /NON EXÉCUTÉ sur 1 citation/)
  assert.equal(controlerFideliteP1('connaissance', { p1: { unites_mobilisees: [] } }, null).alerte, null)
})

test('l\'abrégé du job lit les alertes préfixées par la compétence, et se tait quand tout tient', () => {
  const alertes = [
    'argumentation : mode réceptif · FIDÉLITÉ P1 3/12 : citation(s) introuvable(s) dans la copie — …',
    'structure : FIDÉLITÉ P1 1/9 : citation(s) introuvable(s) dans la copie — …',
    'synthese : autre chose',
  ]
  assert.equal(motifDeFidelite(alertes), ', fidélité P1 — argumentation 3/12, structure 1/9')
  assert.equal(motifDeFidelite(['synthese : autre chose']), '')
})
