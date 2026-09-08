import { test } from 'node:test'
import assert from 'node:assert/strict'
import { marquerLeMateriau, pointDInsertion } from './marquage'
import { morceauxDuPassage } from '../gabarit/pieces'

const regle = 'le passage qui porte le problème'
const debut = 'Une note décourage celui qui progresse lentement. '
const phrase = "Nous avons donc parlé des notes et de leur importance dans l'école."
const contenu = debut + phrase
const correction = debut + "La note réduit ainsi la diversité des apprentissages à un classement."
const appui = { versionCorrigee: correction, observable: 'jointure_presente', cran5Gabarit: true }
const extrait = (s: ReturnType<typeof marquerLeMateriau>) =>
  s?.filter(x => x.marque).map(x => x.texte).join(' ')

test('cran 5 gabarit — une réécriture du contenu marque la phrase et ouvre un trou fidèle', () => {
  const s = marquerLeMateriau(contenu, regle, appui)!
  assert.equal(extrait(s), phrase)
  assert.equal(s.map(x => x.texte).join(''), contenu)
  const p = morceauxDuPassage(s, false)!
  assert.ok(p)
  assert.equal(p.pieces.slice(0, p.place).map(x => x.texte).join(' '), debut.trim())
  assert.equal(p.pieces.slice(p.place).map(x => x.texte).join(' '), '')
})

test('cran 5 gabarit — une réécriture partielle du début suffit, sans seuil de longueur', () => {
  const texte = 'On apprend peu. Ainsi, les élèves répètent les mots du cours sans les comprendre.'
  const corrigee = 'On apprend peu. La répétition laisse les élèves réciter les mots du cours sans les comprendre.'
  assert.equal(extrait(marquerLeMateriau(texte, regle, { ...appui, versionCorrigee: corrigee })),
    'Ainsi, les élèves répètent les mots du cours sans les comprendre.')
})

for (const [initial, ajout] of [['Une', 'Pourtant, une'], ['Une', 'Or une'], ['Les', 'De même les'], ['Beaucoup', 'De plus, beaucoup']]) {
  test(`cran 5 gabarit — ${initial} → ${ajout} conserve le joint, sans trou entre deux phrases`, () => {
    const texte = `Le constat reste. ${initial} observations suivent.`
    const corrigee = `Le constat reste. ${ajout} observations suivent.`
    const s = marquerLeMateriau(texte, regle, { ...appui, versionCorrigee: corrigee })!
    assert.equal(extrait(s), `reste. ${initial}`)
    assert.equal(morceauxDuPassage(s, false), null)
    assert.equal(s.map(x => x.texte).join(''), texte)
  })
}

test('cran 5 gabarit — ajouter une liaison et modifier le contenu ne conserve pas le joint', () => {
  const texte = 'Le constat reste. Une observation suit.'
  const corrigee = 'Le constat reste. Pourtant, une autre observation suit.'
  assert.equal(extrait(marquerLeMateriau(texte, regle, { ...appui, versionCorrigee: corrigee })), 'Une observation suit.')
})

test('marquage existant — sans activation du cran 5 gabarit, la règle de couture reste entière', () => {
  const { cran5Gabarit: _activation, ...ancien } = appui
  for (const opts of [ancien, { ...ancien, cran5Gabarit: false }]) {
    assert.equal(extrait(marquerLeMateriau(contenu, regle, opts)), 'lentement. Nous')
  }
})

test('cran 5 gabarit — la citation de la consigne et le mot impropre gardent leur priorité', () => {
  assert.equal(extrait(marquerLeMateriau(contenu, regle, { ...appui, consigne: 'La phrase qui commence par « Une note ».' })), debut.trim())
  const texte = 'Le constat reste. Une observation suit.'
  assert.equal(extrait(marquerLeMateriau(texte, regle, { ...appui, observable: 'mot_impropre', versionCorrigee: 'Le constat reste. Cette observation suit.' })), 'Une')
})

test('cran 5 gabarit — une insertion pure garde le point d’insertion existant', () => {
  const texte = 'Le constat reste. Une observation suit.'
  const corrigee = 'Le constat reste. Pourtant Une observation suit.'
  assert.ok(pointDInsertion(texte, corrigee))
  assert.equal(extrait(marquerLeMateriau(texte, regle, { ...appui, versionCorrigee: corrigee })), 'reste. Une')
})
