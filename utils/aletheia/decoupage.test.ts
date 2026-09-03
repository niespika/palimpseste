// Tests de garde du découpeur en phrases (E1). Exécution : `npm test`.
// Ce que ces tests encodent : (1) la partition à l'octet près, TOUJOURS ;
// (2) les abréviations et les nombres ne coupent pas ; (3) les trois masques
// mesurés sur le livre de prod (appels de note, numéro de section, césures) ;
// (4) « pas de paragraphe » ≠ « un paragraphe » ; (5) le rendu omet les masques.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  repererMasques, decouperEnPhrases, decouperEnParagraphes, construireDecoupeSemaine,
  verifierPartition, rendreTranche, bornesDePhrases, compterMots,
} from './decoupage'

const tranches = (t: string, b: readonly (readonly [number, number])[]) => b.map(([d, f]) => t.slice(d, f))

test('partition à l’octet près, blancs rattachés à la phrase précédente', () => {
  const t = 'Première phrase.  Deuxième phrase ! Troisième ?\nQuatrième… Cinquième.'
  const b = decouperEnPhrases(t)
  verifierPartition(t, b)
  assert.equal(b.map(([d, f]) => t.slice(d, f)).join(''), t)
  assert.deepEqual(tranches(t, b), ['Première phrase.  ', 'Deuxième phrase ! ', 'Troisième ?\n', 'Quatrième… ', 'Cinquième.'])
})

test('texte vide → aucune phrase ; texte sans ponctuation → une phrase', () => {
  assert.deepEqual(decouperEnPhrases(''), [])
  const t = 'un fragment sans point'
  assert.deepEqual(decouperEnPhrases(t), [[0, t.length]])
})

test('abréviations : cf., M., ch., p., etc. ne clôturent pas', () => {
  const t = 'Voir cf. la suite. M. Dupont lit ch. 3 et p. 12. Fin.'
  assert.deepEqual(tranches(t, decouperEnPhrases(t)), ['Voir cf. la suite. ', 'M. Dupont lit ch. 3 et p. 12. ', 'Fin.'])
})

test('un point suivi d’une minuscule ne coupe pas ; « 1.2 » ne coupe pas', () => {
  const t = 'La section 1.2 le dit. Il continue… et reprend. Puis s’arrête.'
  assert.deepEqual(tranches(t, decouperEnPhrases(t)), ['La section 1.2 le dit. ', 'Il continue… et reprend. ', 'Puis s’arrête.'])
})

test('guillemet ou parenthèse fermants après le point restent dans la phrase', () => {
  const t = 'Il écrit : « la vertu, c’est le savoir. » Puis (il insiste.) Enfin.'
  assert.deepEqual(tranches(t, decouperEnPhrases(t)), ['Il écrit : « la vertu, c’est le savoir. » ', 'Puis (il insiste.) ', 'Enfin.'])
})

test('retour à la ligne du PDF au milieu d’une phrase : pas de coupe ; en fin de phrase : coupe', () => {
  const t = 'Une phrase qui se poursuit\nsur la ligne suivante. La suivante\ncommence ici.'
  assert.deepEqual(tranches(t, decouperEnPhrases(t)), ['Une phrase qui se poursuit\nsur la ligne suivante. ', 'La suivante\ncommence ici.'])
})

test('masques : appels de note collés, numéro de section, césure', () => {
  const t = '19\nOn ne saurait le dire 5. Les « idées modernes 6 » et le roman 13 : voilà. Une con-\ntemplation ; les 2 dieux en 1872.'
  const m = repererMasques(t)
  const types = m.map(x => x.type)
  assert.deepEqual(types, ['numero_section', 'appel_note', 'appel_note', 'appel_note', 'cesure'])
  assert.equal(t.slice(...m[0].bornes), '19\n')
  assert.equal(t.slice(...m[1].bornes), ' 5')
  assert.equal(t.slice(...m[2].bornes), ' 6')
  assert.equal(t.slice(...m[3].bornes), ' 13')
  assert.equal(t.slice(...m[4].bornes), '\n')
  // « les 2 dieux » (suivi d’une lettre) et « 1872 » (quatre chiffres) ne sont pas masqués.
  assert.ok(!m.some(x => t.slice(...x.bornes).includes('2 ') && t.slice(x.bornes[1], x.bornes[1] + 2) === ' d'))
  assert.ok(!m.some(x => t.slice(...x.bornes).includes('1872')))
})

test('numéro de section en tête suivi d’un retour à la ligne (le cas réel des PDF : 28 semaines sur 29)', () => {
  const t = '19\nOn ne saurait caractériser cette culture. Suite.'
  const m = repererMasques(t)
  assert.equal(m[0].type, 'numero_section')
  assert.equal(t.slice(...m[0].bornes), '19\n')
  assert.equal(rendreTranche(t, [0, t.length], m), 'On ne saurait caractériser cette culture. Suite.')
  // Un nombre en tête suivi d’une minuscule n’est pas un numéro de section.
  assert.equal(repererMasques('19 ans plus tard.').length, 0)
  // Un numéro seul sur sa ligne AU MILIEU du texte est masqué aussi (épreuve de version E4).
  const u = 'Ajout en tête. Encore.\n14\nReprésentons-nous cet œil.'
  const mu = repererMasques(u)
  assert.equal(mu.length, 1)
  assert.equal(u.slice(...mu[0].bornes), '14\n')
  assert.equal(rendreTranche(u, [0, u.length], mu), 'Ajout en tête. Encore. Représentons-nous cet œil.')
})

test('paragraphes numérotés (Kant) : « 1. Les Lumières… » n’est pas une phrase à lui seul, et n’est pas masqué', () => {
  const t = '1. Les Lumières, c’est la sortie de l’homme. Elle est belle.\n5. Mais pour ces Lumières il ne faut rien. Fin.'
  assert.equal(repererMasques(t).length, 0)
  const b = decouperEnPhrases(t)
  verifierPartition(t, b)
  assert.deepEqual(tranches(t, b), ['1. Les Lumières, c’est la sortie de l’homme. ', 'Elle est belle.\n', '5. Mais pour ces Lumières il ne faut rien. ', 'Fin.'])
})

test('rendu : masques omis, blancs ramenés à une espace, trait d’union de césure conservé', () => {
  const t = '19\nOn ne saurait le dire 5. Une con-\ntemplation ; les 2 dieux en 1872.'
  const m = repererMasques(t)
  assert.equal(rendreTranche(t, [0, t.length], m), 'On ne saurait le dire. Une con-templation ; les 2 dieux en 1872.')
  assert.equal(compterMots(t, [0, t.length], m), 12)
})

test('les masques ne déplacent pas les bornes de phrases (copie de travail de même longueur)', () => {
  const t = 'Sa raison 5. Mais Socrate 16. Puis rien.'
  const m = repererMasques(t)
  const b = decouperEnPhrases(t, m)
  verifierPartition(t, b)
  assert.deepEqual(tranches(t, b), ['Sa raison 5. ', 'Mais Socrate 16. ', 'Puis rien.'])
  assert.deepEqual(b.map(x => rendreTranche(t, x, m)), ['Sa raison.', 'Mais Socrate.', 'Puis rien.'])
})

test('paragraphes : lignes vides → blocs ; aucune ligne vide → liste VIDE', () => {
  const avec = 'Premier bloc. Suite.\n\nDeuxième bloc.\n \nTroisième.'
  const p = decouperEnParagraphes(avec)
  verifierPartition(avec, p)
  assert.equal(p.length, 3)
  assert.deepEqual(decouperEnParagraphes('Une ligne.\nUne autre ligne.\nEncore.'), [])
})

test('construireDecoupeSemaine : identifiants, rattachement au paragraphe, longueur', () => {
  const t = 'Alpha un. Alpha deux.\n\nBêta un.'
  const d = construireDecoupeSemaine(12, t)
  assert.equal(d.semaine, 12)
  assert.equal(d.longueur, t.length)
  assert.deepEqual(d.phrases.map(p => p.id), ['s12-001', 's12-002', 's12-003'])
  assert.deepEqual(d.phrases.map(p => p.para), ['p12-01', 'p12-01', 'p12-02'])
  verifierPartition(t, d.phrases.map(p => p.bornes))
  // Sans paragraphe, `para` est absent.
  const sans = construireDecoupeSemaine(3, 'Un. Deux.')
  assert.equal(sans.paragraphes.length, 0)
  assert.ok(sans.phrases.every(p => !('para' in p)))
})

test('bornesDePhrases : contiguës, ordre respecté, inconnues → null', () => {
  const t = 'Un. Deux. Trois. Quatre.'
  const d = construireDecoupeSemaine(1, t)
  const b = bornesDePhrases(d.phrases, 's1-002', 's1-003')
  assert.ok(b)
  assert.equal(t.slice(...b!), 'Deux. Trois. ')
  assert.equal(bornesDePhrases(d.phrases, 's1-003', 's1-002'), null)
  assert.equal(bornesDePhrases(d.phrases, 's1-009', 's1-002'), null)
})

test('verifierPartition lève sur un trou ou un chevauchement', () => {
  assert.throws(() => verifierPartition('abcdef', [[0, 2], [3, 6]]))
  assert.throws(() => verifierPartition('abcdef', [[0, 4], [3, 6]]))
  assert.throws(() => verifierPartition('abcdef', [[0, 5]]))
  assert.doesNotThrow(() => verifierPartition('abcdef', [[0, 2], [2, 6]]))
})

test('prose philosophique : phrases longues avec points-virgules, deux-points et tirets restent entières', () => {
  const t = 'Il faudrait donc admettre – et c’est là le point décisif – que la raison, poussée jusqu’à ses limites, s’enroule sur elle-même : elle ne trouve plus, dans ses propres principes, de quoi fonder ce qu’elle affirme ; et c’est à cet instant précis que naît une connaissance nouvelle. Qu’on considère seulement les conséquences de ce principe.'
  const b = decouperEnPhrases(t)
  assert.equal(b.length, 2)
  assert.ok(t.slice(...b[0]).endsWith('nouvelle. '))
})
