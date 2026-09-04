// C7-L3 — les candidats du gabarit traduits pour l'écran : jamais une clé ni un id.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appuiDu1a, appuiDu1b, pourquoiDuTemoin } from './candidats'

const E = new Map([
  ['argument.garant.connecteur', 'Il y a juste un « donc ».'],
  ['argument.garant.absent', "L'appui et la conclusion sont là, sans un mot entre les deux."],
  ['phrase.tenue.friction', 'Il faut lire deux fois pour voir qui fait quoi.'],
])

test('1(a) : les clés deviennent des énoncés, la clé du cas est la réponse et ne se répète pas', () => {
  const a = appuiDu1a(['argument.garant.absent', 'phrase.tenue.friction', 'argument.garant.connecteur'], E, 'argument.garant.connecteur')
  assert.deepEqual(a.distracteurs.map((d) => d.texte), [E.get('argument.garant.absent'), E.get('phrase.tenue.friction')])
  assert.equal(a.reponseAttendue, 'Il y a juste un « donc ».')
  assert.deepEqual(a.manquants, [])
  assert.ok(a.distracteurs.every((d) => d.pourquoi_faux.length > 10))
  const inconnue = appuiDu1a(['x.y.z'], E, 'argument.garant.connecteur')
  assert.deepEqual(inconnue.manquants, ['x.y.z'])
  assert.deepEqual(appuiDu1a([], E, 'nulle.part.ici').manquants, ['nulle.part.ici'])
})

test('1(b) : les ids deviennent les devoirs témoins, le devoir fautif est la réponse, chaque témoin dit pourquoi', () => {
  const T = new Map([
    ['mat-at1', { texte: 'Témoin un.', pourquoi: "il relie l'appui à la conclusion" }],
    ['mat-at2', { texte: 'Témoin deux.', pourquoi: null }],
  ])
  const a = appuiDu1b(['mat-at1', 'mat-at2', 'mat-zz'], T, 'Le devoir fautif.', 'Il y a juste un « donc ».')
  assert.deepEqual(a.distracteurs.map((d) => d.texte), ['Témoin un.', 'Témoin deux.'])
  assert.equal(a.distracteurs[0]!.pourquoi_faux, "il relie l'appui à la conclusion")
  assert.equal(a.distracteurs[1]!.pourquoi_faux, "Ce devoir n'a pas le problème.")
  assert.equal(a.reponseAttendue, 'Le devoir fautif.')
  assert.match(a.pourquoiJuste!, /commet l'erreur/)
  assert.deepEqual(a.manquants, ['mat-zz'])
  assert.deepEqual(appuiDu1b([], T, null, null).manquants, ['le devoir du cas'])
})

test('le pourquoi d’un témoin se lit après le tiret de son défaut', () => {
  assert.equal(pourquoiDuTemoin('témoin sans le problème « x » — il relie'), 'il relie')
  assert.equal(pourquoiDuTemoin('sans tiret'), 'sans tiret')
  assert.equal(pourquoiDuTemoin(null), null)
})
