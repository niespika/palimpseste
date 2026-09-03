// Tests de garde des gabarits (E3). Exécution : `npm test`.
// (1) l'argumentatif est le gabarit d'AVANT (libellés et bloc vide) ; (2) le cycle de la
// tournante ne répète jamais deux fois de suite ; (3) les blocs des autres gabarits portent
// les placeholders que l'appelant remplit ; (4) assemblerPrompt est neutre sans placeholder.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFINITIONS, GABARITS, BLOCS_DEFAUT, estGabarit, questionTournante, libellesSeance, blocGabarit, assemblerPrompt,
} from './gabarits'
import { AIDES_V1_DEFAUT } from '../../app/eleve/modules/aletheia/aides-v1'

test('l’argumentatif reprend les aides ACTUELLES des cinq champs, à l’octet près', () => {
  const a = DEFINITIONS.argumentatif
  assert.equal(a.champ1.aide, AIDES_V1_DEFAUT.these)
  assert.equal(a.champ2.aide, AIDES_V1_DEFAUT.arguments)
  assert.equal(a.tournantes[0].aide, AIDES_V1_DEFAUT.accord)
  assert.equal(a.questions.aide, AIDES_V1_DEFAUT.questions)
  assert.equal(a.vocabulaire.aide, AIDES_V1_DEFAUT.vocabulaire)
  assert.deepEqual(a.bulles, { relances: 'Pour creuser ton idée et tes arguments', tournante: 'Sur ton accord' })
})

test('l’argumentatif a des blocs de prompt VIDES : le tronc est le prompt d’avant', () => {
  for (const v of Object.values(BLOCS_DEFAUT.argumentatif)) assert.equal(v, '')
  assert.equal(assemblerPrompt('A\n{bloc_gabarit}\nB', ''), 'A\n\nB')
})

test('les quatre gabarits sont définis, avec cinq emplacements et au moins deux tournantes', () => {
  for (const g of GABARITS) {
    const d = DEFINITIONS[g]
    assert.ok(d.champ1.question.endsWith('?') || d.champ1.question.endsWith('.'), g)
    assert.ok(d.tournantes.length >= 2, g)
    assert.ok(d.questions.question && d.vocabulaire.question)
  }
  assert.ok(DEFINITIONS.dialogue.champFixe)
  assert.equal(DEFINITIONS.argumentatif.champFixe, null)
  assert.ok(estGabarit('dialogue') && !estGabarit('poetique') && !estGabarit(null))
})

test('cycle fixe : rang 0, 1, 2… parcourt les tournantes, jamais la même deux fois de suite', () => {
  const t = [0, 1, 2, 3, 4].map(r => questionTournante('argumentatif', null, r).cle)
  assert.deepEqual(t, ['accord', 'objection', 'destinataire', 'exemple', 'accord'])
  for (let i = 1; i < t.length; i++) assert.notEqual(t[i], t[i - 1])
})

test('un cycle de livre restreint et réordonne ; les clés inconnues sont ignorées ; vide ⇒ défaut', () => {
  assert.equal(questionTournante('argumentatif', ['objection', 'accord'], 0).cle, 'objection')
  assert.equal(questionTournante('argumentatif', ['objection', 'accord'], 1).cle, 'accord')
  assert.equal(questionTournante('argumentatif', ['objection', 'accord'], 2).cle, 'objection')
  assert.equal(questionTournante('argumentatif', ['inconnue'], 0).cle, 'accord')
  assert.equal(questionTournante('dialogue', [], 1).cle, 'faible')
})

test('libellesSeance porte la tournante du rang et la question fixe du dialogué', () => {
  const l = libellesSeance('dialogue', null, 2)
  assert.equal(l.tournante.cle, 'hesitation')
  assert.ok(l.champFixe?.question.includes('l’auteur préfère'))
  assert.equal(libellesSeance('argumentatif', null, 0).champFixe, null)
})

test('les blocs non argumentatifs portent {question_tournante} en v1/vf, et {champ_fixe_eleve} pour le dialogué', () => {
  for (const g of ['dialogue', 'aphoristique', 'analytique'] as const) {
    assert.ok(BLOCS_DEFAUT[g].v1.includes('{question_tournante}'), g)
    assert.ok(BLOCS_DEFAUT[g].vf.includes('{question_tournante}'), g)
    assert.ok(BLOCS_DEFAUT[g].v1.startsWith('\n') && BLOCS_DEFAUT[g].v1.endsWith('\n'), g)
  }
  assert.ok(BLOCS_DEFAUT.dialogue.v1.includes('{champ_fixe_eleve}'))
  assert.ok(BLOCS_DEFAUT.dialogue.diag_inventaire.includes('{champ_fixe_eleve}'))
  assert.ok(!BLOCS_DEFAUT.analytique.v1.includes('{champ_fixe_eleve}'))
})

test('blocGabarit : l’override prof gagne s’il est non vide, sinon le défaut', () => {
  assert.equal(blocGabarit('dialogue', 'v1', { dialogue: { v1: 'MON BLOC' } }), 'MON BLOC')
  assert.equal(blocGabarit('dialogue', 'v1', { dialogue: { v1: '   ' } }), BLOCS_DEFAUT.dialogue.v1)
  assert.equal(blocGabarit('dialogue', 'v1', null), BLOCS_DEFAUT.dialogue.v1)
  assert.equal(blocGabarit('argumentatif', 'vf', { argumentatif: { vf: 'X' } }), 'X')
})

test('assemblerPrompt sans placeholder rend le tronc inchangé', () => {
  assert.equal(assemblerPrompt('pas de placeholder', 'BLOC'), 'pas de placeholder')
})
