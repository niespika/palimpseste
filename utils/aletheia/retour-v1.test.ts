// Tests de garde du retour V1 recomposé (E5). Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { blocRappel, blocPassages, lireRelances, lireRappel, motsDuRetour, memeLemme, lemmeDeCarte, normaliserLemme, assemblerBlocs } from './retour-v1'

test('blocRappel : vide sans rappel ; sinon porte la fiche N−1 et le placeholder du texte élève', () => {
  assert.equal(blocRappel({ these_canonique: 'T', synthese_modele: 'S' }, null), '')
  assert.equal(blocRappel({ these_canonique: 'T', synthese_modele: 'S' }, '   '), '')
  const b = blocRappel({ these_canonique: 'Thèse N−1', synthese_modele: 'Synthèse N−1' }, 'mon rappel')
  assert.ok(b.includes('{rappel_eleve}') && b.includes('Thèse N−1') && b.includes('"rappel"'))
  assert.ok(b.startsWith('\n') && b.endsWith('\n'))
  assert.ok(blocRappel(null, 'x').includes('(thèse indisponible)'))
})

test('blocPassages : liste les identifiants ; sans passage, dit null partout ; porte le budget', () => {
  const b = blocPassages([{ id: 'k12-1', libelle: 'la phrase où la règle est formulée', role: 'these' }])
  assert.ok(b.includes('- k12-1 (these) : la phrase où la règle est formulée'))
  assert.ok(b.includes('300 mots'))
  assert.ok(blocPassages([]).includes('"passage" = null'))
})

test('lireRelances : chaînes d’avant et objets E5, identifiants inconnus ramenés à null', () => {
  const ids = new Set(['k1-1'])
  const r = lireRelances(['Question A ?', { question: 'Question B ?', passage: 'k1-1', libelle_a_trouver: 'la phrase où…' }, { question: 'C ?', passage: 'k1-9' }, { passage: 'k1-1' }, ''], ids)
  assert.deepEqual(r.relances, ['Question A ?', 'Question B ?', 'C ?'])
  assert.deepEqual(r.detail[0], { question: 'Question A ?', passage: null, libelle: null })
  assert.deepEqual(r.detail[1], { question: 'Question B ?', passage: 'k1-1', libelle: 'la phrase où…' })
  assert.equal(r.detail[2].passage, null)
  assert.deepEqual(lireRelances(null), { relances: [], detail: [] })
})

test('lireRappel : verdict normalisé, phrase requise', () => {
  assert.deepEqual(lireRappel({ verdict: 'A côté', phrase: 'Il manque X.' }), { verdict: 'a_cote', phrase: 'Il manque X.' })
  assert.deepEqual(lireRappel({ verdict: 'juste', phrase: 'Oui.' }), { verdict: 'juste', phrase: 'Oui.' })
  assert.equal(lireRappel({ verdict: 'juste' }), null)
  assert.equal(lireRappel(null), null)
})

test('motsDuRetour compte les mots des quatre parties, pas la ponctuation seule', () => {
  assert.equal(motsDuRetour({ relances: ['Un deux ?', 'trois'], accord: 'quatre — cinq', reponses_questions: ['six'], vocabulaire: [{ definition: 'sept huit.' }] }), 8)
})

test('lemmes : accents, articles, formes proches (D9)', () => {
  assert.equal(normaliserLemme("L'Apollinien"), 'apollinien')
  assert.ok(memeLemme('apollinien', 'apolliniennes'))
  assert.ok(memeLemme('Apollinien', 'apollinisme') === false)
  assert.ok(memeLemme('dionysiaque', 'dionysiaques'))
  assert.ok(!memeLemme('sophiste', 'sophisme'))
  assert.ok(!memeLemme('choeur', 'coeur'))
  assert.ok(memeLemme('dithyrambe', 'dithyrambes'))
  assert.ok(!memeLemme('aurige', 'aurgie'))   // pas de tolérance aux fautes : ce n'est pas au code de deviner
  assert.equal(lemmeDeCarte('apolliniennes', 'apollinien'), 'apollinien')
  assert.equal(lemmeDeCarte('apolliniennes', 'dieu grec'), 'apolliniennes')   // dérive du modèle → le terme
  assert.equal(lemmeDeCarte('Retorse sagacité', null), 'retorse sagacite')
})

test('assemblerBlocs : chaque placeholder remplacé, un bloc vide efface le placeholder, un nom absent est ignoré', () => {
  assert.equal(assemblerBlocs('A\n{bloc_rappel}\nB{bloc_x}', { bloc_rappel: '', bloc_passages: 'P' }), 'A\n\nB{bloc_x}')
  assert.equal(assemblerBlocs('A{bloc_rappel}B', { bloc_rappel: '\nR\n' }), 'A\nR\nB')
})
