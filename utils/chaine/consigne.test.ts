import test from 'node:test'
import assert from 'node:assert/strict'
import { enTexte, casNommes } from './consigne'

test('⭐⭐ LE TABLEAU NU EST LA FORME D’UNE PAIRE — le défaut du smoke élève du 24/08', () => {
  // Sur une paire, `editerInstance` écrit `cas.map((x) => x.consigne)`, donc un
  // TABLEAU NU. Il n'était reconnu par aucune des trois formes admises, et le
  // repli `JSON.stringify` servait à l'élève — ET au modèle — la bouillie
  // `["« … »","« … »"]`.
  const paire = ['« Parmi ces quatre, laquelle fait le lien ? »', '« Un cas neuf, à toi seul. »']
  const rendu = enTexte(paire)

  assert.ok(!rendu.startsWith('['), 'ce n’est plus du JSON brut')
  assert.ok(!rendu.includes('\\"') && !rendu.includes('","'), 'aucune ponctuation de JSON')
  assert.equal(rendu,
    'Cas 1 — « Parmi ces quatre, laquelle fait le lien ? »\n'
    + 'Cas 2 — « Un cas neuf, à toi seul. »')
  // ⚠️ Les deux consignes sont NOMMÉES : un modèle qui reçoit deux énoncés
  //    collés bout à bout ne sait plus lequel il juge.
  assert.ok(rendu.includes('Cas 1 —') && rendu.includes('Cas 2 —'))
})

test('les trois formes déjà connues rendent exactement comme avant', () => {
  assert.equal(enTexte('une consigne toute simple'), 'une consigne toute simple')
  assert.equal(enTexte({ texte: 'la forme de l’import' }), 'la forme de l’import')
  assert.equal(enTexte({ cas: ['premier', 'second'] }), 'Cas 1 — premier\nCas 2 — second')
})

test('une paire dégénérée — un seul cas — rend sa consigne SEULE, sans décor', () => {
  // Nommer « Cas 1 » quand il n'y en a qu'un serait un décor, pas une
  // information : l'élève lirait un numéro qui ne s'oppose à rien.
  assert.equal(enTexte(['la seule consigne']), 'la seule consigne')
  assert.equal(casNommes(['seule']), 'seule')
})

test('ce qui n’est vraiment pas une consigne tombe encore au repli, et ne ment pas', () => {
  // Le repli reste — mais il ne sert plus QU'à ce qui n'est pas une consigne.
  assert.equal(enTexte(null), 'null')
  assert.equal(enTexte(undefined), 'null')
  assert.equal(enTexte({ inconnu: 1 }), '{"inconnu":1}')
})

test('un tableau vide ne rend pas « Cas 1 — undefined »', () => {
  assert.equal(enTexte([]), '')
})

test('un élément non textuel se sérialise sans casser ses voisins', () => {
  // Une banque importée peut porter autre chose qu'une chaîne ; le cas voisin,
  // lui, doit rester lisible.
  const rendu = enTexte(['une vraie consigne', { texte: 'imbriqué' }])
  assert.ok(rendu.startsWith('Cas 1 — une vraie consigne'))
  assert.ok(rendu.includes('Cas 2 —'))
})
