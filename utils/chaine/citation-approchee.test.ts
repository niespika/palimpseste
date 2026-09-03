// ⭐⭐ Le repérage d'une citation dans le texte de l'élève, en trois étages.
//    Les cas sont TIRÉS DE LA PRODUCTION du 02/09/2026 : chacun est une citation
//    qu'un retour a réellement portée, contre la copie réelle (transcription d'OCR).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plierFort, retrouverCitation, retrouverMorceau, morceauxControlables } from './citation-approchee'

const COPIE = [
  "Après la mort, nous sommes privés des sensations et émotions qui",
  "nous faisaient vivre , qui nous faisaient réagir. Puisque la",
  "mort est la suppression de ce qui nous fait vibrer, elle n'est rien.",
  "Mais encore , une des base de la philosophie est l’esprit critique.",
  "cultiver son esprit critique pour le développer est presque l ' essence",
  "même des recherches. ce qui fait travailler notre réfléxion et nous",
  "permet ainsi de la pousser plus loin. La philo ne peut pas tout.",
  "Il est possible de suivre un cours de philo au lycée. Il est possible de suivre un cours de philo au lycée.",
].join('\n')

test('le pliage fort garde une table de positions juste', () => {
  const p = plierFort("Été  , « l ' essence »\n réfléxion")
  assert.equal(p.texte, "ete l'essence reflexion")
  // chaque caractère plié remonte à un caractère d'origine, dans l'ordre
  for (let i = 1; i < p.debuts.length; i++) assert.ok(p.debuts[i]! >= p.fins[i - 1]! || p.debuts[i]! >= p.debuts[i - 1]!)
  assert.equal("Été  , « l ' essence »\n réfléxion".slice(p.debuts[4]!, p.fins[12]!), "l ' essence")
})

test('étage 1 — une citation verbatim est exacte, et ses bornes sont dans l\'origine', () => {
  const r = retrouverCitation(COPIE, 'Puisque la mort est la suppression')
  assert.ok(!('echec' in r))
  assert.equal(r.methode, 'exact')
  assert.equal(r.citationReelle, 'Puisque la\nmort est la suppression')
})

test('⭐ étage 2 — le blanc d\'OCR devant la virgule, l\'apostrophe détachée ou omise, l\'accent : réparés, et on sert le texte de l\'ÉLÈVE', () => {
  const cas: Array<[string, string]> = [
    ['nous faisaient vivre, qui nous faisaient réagir', 'nous faisaient vivre , qui nous faisaient réagir'],
    ["est presque l'essence même des recherches", "est presque l ' essence\nmême des recherches"],
    ["elle nest rien", "elle n'est rien"],
    ['Mais encore, une des base de la philosophie est l\'esprit critique', 'Mais encore , une des base de la philosophie est l’esprit critique'],
    ['Apres la mort, nous sommes prives des sensations', 'Après la mort, nous sommes privés des sensations'],
  ]
  for (const [ia, reel] of cas) {
    const r = retrouverCitation(COPIE, ia)
    assert.ok(!('echec' in r), ia)
    assert.equal(r.methode, 'normalise', ia)
    assert.equal(r.citationReelle, reel)
  }
})

test('⭐ étage 2 — une faute d\'accent que le modèle a corrigée en passant (« réfléxion ») : normalisé', () => {
  const r = retrouverCitation(COPIE, 'ce qui fait travailler notre réflexion et nous permet ainsi')
  assert.ok(!('echec' in r))
  assert.equal(r.methode, 'normalise')
  assert.equal(r.citationReelle, 'ce qui fait travailler notre réfléxion et nous\npermet ainsi')
})

test('⭐ étage 3 — un mot changé par le modèle (« donc » pour « ainsi ») : approché ≥ 0,90, texte réel servi', () => {
  const r = retrouverCitation(COPIE, 'ce qui fait travailler notre réflexion et nous permet donc de la pousser plus loin')
  assert.ok(!('echec' in r))
  assert.equal(r.methode, 'approche')
  assert.ok(r.score >= 0.9)
  assert.equal(r.citationReelle, 'ce qui fait travailler notre réfléxion et nous\npermet ainsi de la pousser plus loin')
})

test('⛔ une reformulation reste introuvable — cas réel « Et de ce fait la notion… »', () => {
  const copie = 'les gens pensent différemment, mais la notion de bonne chose est différente pour tous le monde.'
  const r = retrouverCitation(copie, 'Et de ce fait la notion de bonne chose est différente pour tous le monde.')
  assert.ok('echec' in r)
  assert.equal(r.echec, 'introuvable')
})

test('⛔ une liste composée par le modèle (« chose / suivre un cours / … ») ne se répare pas', () => {
  const copie = 'est-ce une bonne chose de suivre un cours de philo ? suivre un cours est une chance.'
  const r = retrouverCitation(copie, 'chose / suivre un cours / suivre un philo / suivre le cours')
  assert.ok('echec' in r)
})

test('⛔ une négation d\'un seul côté interdit la réparation', () => {
  const r = retrouverCitation(COPIE, 'La philo peut tout faire ici')
  assert.ok('echec' in r)
  // soit trop loin, soit refusé pour la négation — jamais réparé en « ne peut pas »
  assert.notEqual(r.echec, undefined)
  const r2 = retrouverMorceau(COPIE, 'permet ainsi de la pousser plus loin. La philo peut pas tout', plierFort(COPIE))
  assert.ok('echec' in r2)
  assert.equal(r2.echec, 'negation')
})

test('⛔ deux occurrences à égalité : ambigu, on ne sert rien', () => {
  const r = retrouverMorceau(COPIE, 'Il est possible de suivre un kours de philo au lycée', plierFort(COPIE))
  assert.ok('echec' in r)
  assert.equal(r.echec, 'ambigu')
})

test('⛔ moins de quatre mots : l\'exact ou rien', () => {
  const r = retrouverMorceau(COPIE, 'suppresion de ce', plierFort(COPIE))
  assert.ok('echec' in r)
  assert.equal(r.echec, 'trop_court')
})

test('une élision rend un intervalle par morceau, et la citation réelle les recoud par « [...] »', () => {
  const r = retrouverCitation(COPIE, 'Après la mort […] elle n\'est rien')
  assert.ok(!('echec' in r))
  assert.equal(r.intervalles.length, 2)
  assert.equal(r.citationReelle, "Après la mort [...] elle n'est rien")
  assert.deepEqual(morceauxControlables('a … bcde ... fghij'), ['bcde', 'fghij'])
})

test('il échoue fermé : source vide, citation vide', () => {
  assert.equal((retrouverCitation('', 'quelque chose') as { echec: string }).echec, 'source_vide')
  assert.equal((retrouverCitation(COPIE, '  ') as { echec: string }).echec, 'trop_court')
})
