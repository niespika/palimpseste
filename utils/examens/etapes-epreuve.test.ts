import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  suiteDesEtapes, etapeCourante, rangDeLEtape, resteUneEtapeApres, enLettres,
  type FaitsDeLEpreuve,
} from './etapes-epreuve'

const base: FaitsDeLEpreuve = {
  transcrit: false, valide: false,
  credenceServie: false, credenceFaite: false,
  jugerServi: true, jugerFait: false,
  confianceServie: true, confianceFaite: false,
}

test('le cas de prod (se juger ET confiance ouverts) : quatre étapes, dans l’ordre', () => {
  assert.deepEqual(suiteDesEtapes(base).map((e) => e.libelle),
    ['Déposer', 'Relire', 'Te juger', 'Ta confiance'])
})

test('sans geste servi, le fil se réduit à Déposer · Relire', () => {
  const f = { ...base, jugerServi: false, confianceServie: false }
  assert.deepEqual(suiteDesEtapes(f).map((e) => e.etape), ['deposer', 'relire'])
})

test('la crédence, quand un cran la demande, passe AVANT se juger', () => {
  const f = { ...base, credenceServie: true }
  assert.deepEqual(suiteDesEtapes(f).map((e) => e.etape),
    ['deposer', 'relire', 'credence', 'juger', 'confiance'])
})

test('avant la validation : déposer, puis relire dès que la machine a rendu un texte', () => {
  assert.equal(etapeCourante(base), 'deposer')
  assert.equal(etapeCourante({ ...base, transcrit: true }), 'relire')
})

test('après la validation : un geste par page, dans l’ordre, puis la fin', () => {
  const v = { ...base, transcrit: true, valide: true }
  assert.equal(etapeCourante(v), 'juger')
  assert.equal(etapeCourante({ ...v, jugerFait: true }), 'confiance')
  assert.equal(etapeCourante({ ...v, jugerFait: true, confianceFaite: true }), 'fini')
})

test('un geste fait AVANT (ordre inverse) ne fait pas revenir en arrière', () => {
  const v = { ...base, transcrit: true, valide: true, confianceFaite: true }
  assert.equal(etapeCourante(v), 'juger')
  assert.equal(resteUneEtapeApres(v, 'juger'), false)
})

test('validée sans aucun geste servi : directement la fin', () => {
  const v = { ...base, transcrit: true, valide: true, jugerServi: false, confianceServie: false }
  assert.equal(etapeCourante(v), 'fini')
})

test('le rang dit « 3 / 4 » pour se juger, rien pour la fin', () => {
  const suite = suiteDesEtapes(base)
  assert.deepEqual(rangDeLEtape(suite, 'juger'), { rang: 3, total: 4 })
  assert.deepEqual(rangDeLEtape(suite, 'confiance'), { rang: 4, total: 4 })
  assert.equal(rangDeLEtape(suite, 'fini'), null)
})

test('le bouton dit « continuer » tant qu’une étape reste, « terminer » sur la dernière', () => {
  const v = { ...base, transcrit: true, valide: true }
  assert.equal(resteUneEtapeApres(v, 'juger'), true)
  assert.equal(resteUneEtapeApres(v, 'confiance'), false)
  assert.equal(resteUneEtapeApres({ ...v, confianceServie: false }, 'juger'), false)
})

test('les nombres en lettres', () => {
  assert.equal(enLettres(1), 'une')
  assert.equal(enLettres(2), 'deux')
  assert.equal(enLettres(7), '7')
})
