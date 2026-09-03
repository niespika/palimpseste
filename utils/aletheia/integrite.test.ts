// Tests de garde « je ne sais pas » et petits malins (E8). Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { signalRendu, matiere, estJeNeSaisPas, texteJeNeSaisPas, questionDeBlocage, propositionsChamp1 } from './integrite'

const TRAVAIL = 'Nietzsche oppose Apollon et Dionysos : l’art tragique naît de leur union, le rêve et l’ivresse. Le chœur est la scène primitive, le spectateur s’y reconnaît, et la tragédie meurt quand Socrate et Euripide y font entrer la raison.'

test('les quatre rendus réels de la prod ne valent aucun strike porte ouverte', () => {
  assert.equal(signalRendu([TRAVAIL, TRAVAIL, 'Je sais pas sur quoi commenter'], true), null)
  assert.equal(signalRendu([TRAVAIL, TRAVAIL, 'Je sais pas'], true), null)
  assert.equal(signalRendu([TRAVAIL, TRAVAIL, 'Je ne sais pas avec quoi être en accord ou désaccord'], true), null)
  assert.equal(signalRendu(['L’auteur qualifie Dionysos', TRAVAIL, TRAVAIL], true), null)
})

test('porte ouverte : strike si les TROIS emplacements sont sans matière, ou sur un aveu de non-lecture', () => {
  assert.equal(signalRendu(['jsp', 'je sais pas', '.'], true)?.type, 'vide')
  assert.equal(signalRendu(['Je ne sais pas.', 'Je ne sais pas.', 'aucune idée'], true)?.type, 'vide')
  assert.equal(signalRendu(['Je ne sais pas.\nCe qui me bloque : je ne vois pas où est la thèse dans ce chapitre', 'jsp', 'jsp'], true), null)
  assert.equal(signalRendu(['j’ai pas lu le chapitre', 'désolé', ''], true)?.type, 'aveu_non_travail')
  assert.equal(signalRendu([TRAVAIL, 'je n’ai pas lu', TRAVAIL], true), null)   // aveu noyé dans un vrai travail (texte long)
  assert.equal(signalRendu(['', '', ''], true), null)
})

test('porte fermée : la règle d’avant (concaténation < 25 caractères)', () => {
  assert.equal(signalRendu(['jsp', 'jsp', 'jsp'], false)?.type, 'vide')
  assert.equal(signalRendu([TRAVAIL, 'jsp', 'jsp'], false), null)
})

test('matière et détection', () => {
  assert.equal(matiere('Je sais pas'), 0)
  assert.ok(matiere('Je sais pas sur quoi commenter') < 25)
  assert.ok(matiere(TRAVAIL) > 25)
  assert.equal(estJeNeSaisPas('Je ne sais pas trop.'), true)
  assert.equal(estJeNeSaisPas('JSP'), true)
  assert.equal(estJeNeSaisPas(TRAVAIL), false)
})

test('composition du « je ne sais pas » et question de blocage', () => {
  const t = texteJeNeSaisPas({ blocage: 'je ne vois pas où est la thèse', choix: 'L’art naît de deux pulsions', pourquoi: 'il parle tout le temps de deux dieux' })
  assert.ok(t.startsWith('Je ne sais pas.\nCe qui me bloque : je ne vois pas où est la thèse'))
  assert.ok(t.includes('je choisis : « L’art naît de deux pulsions » — parce que il parle'))
  assert.equal(texteJeNeSaisPas({ blocage: 'x', phrase: 'Le rêve est le père de l’art plastique.' }).split('\n').length, 3)
  assert.equal(questionDeBlocage('je ne vois pas où est la thèse.'), 'je ne vois pas où est la thèse ?')
  assert.equal(questionDeBlocage('Pourquoi Apollon ?'), 'Pourquoi Apollon ?')
  assert.equal(questionDeBlocage('  '), '')
})

test('propositions : trois, mélangées de façon déterministe, rien sans deux distracteurs', () => {
  const p = propositionsChamp1('A', ['B', 'C'], 7)
  assert.equal(p.length, 3)
  assert.deepEqual([...p].sort(), ['A', 'B', 'C'])
  assert.deepEqual(propositionsChamp1('A', ['B', 'C'], 7), p)
  assert.notDeepEqual(propositionsChamp1('A', ['B', 'C'], 8), p)
  assert.deepEqual(propositionsChamp1('A', ['B'], 1), [])
})
