// ============================================================================
// C4 · L16 — LA FORME NORMALISÉE DE L'APPARIEMENT, ET CE QU'ELLE NE REPLIE PAS.
// ----------------------------------------------------------------------------
// « L'appariement se fait sur une forme normalisée (minuscules, sans accents,
//   article initial retiré) » (`08-` §3 ; `01-` §4 couche 4).
//
// ⚠️ CES TROIS MOTS SONT TOUT CE QUE LA SOURCE ÉCRIT : ni le `08-` ni le `01-`
//   ne disent QUELS articles. La liste est une décision de ce lot, et ce fichier
//   est ce qui la FIXE — sans lui, le prochain qui touche à `cleDAppariement`
//   ne saura pas ce qui était voulu et ce qui était un accident.
//
// ⭐ LE TEST QUI COMPTE LE PLUS EST LE DERNIER : l'épreuve de COLLISION sur les
//   dix-sept notions du programme et les cinq que la banque déclare réellement.
//   « Deux notions distinctes qui se replient sur le même mot rattacheraient un
//   sujet à un cours qui ne parle pas de lui. »
//
// Exécution : `npm test`.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cleDAppariement, ensembleDeNotions, notionsPartagees, notionsOrphelines,
} from './notions'

// Les dix-sept notions du programme de terminale générale (B.O. 2019), telles
// que `generateur/verifie-import.py` les écrit — avec leurs articles et leurs
// capitales. ⛔ Elles sont ici comme MATÉRIAU D'ÉPREUVE, pas comme référentiel :
// « ce n'est PAS une donnée de doctrine », et le champ reste libre.
const PROGRAMME_TC = [
  "l'art", 'le bonheur', 'la conscience', 'le devoir', "l'État",
  "l'inconscient", 'la justice', 'le langage', 'la liberté', 'la nature',
  'la raison', 'la religion', 'la science', 'la technique', 'le temps',
  'le travail', 'la vérité',
]

// Les cinq que la banque déclare réellement au 24/08 (mesuré sur
// `generateur/banque/banque.json` : 15 sujets, tous en `"cours": "notions"`).
const BANQUE_REELLE = ['la vérité', 'la science', 'la raison', 'le langage', 'la nature']

// ── LA CLAUSE DU « FAIT QUEN » QUI SE PROUVE ICI ────────────────────────────
test('NOTIONS — « la Vérité » et « la vérité » se rattachent au même cours', () => {
  // La clause littérale du `07-` §2, C4-L16.
  assert.equal(cleDAppariement('la Vérité'), cleDAppariement('la vérité'))
  assert.equal(cleDAppariement('La Vérité'), cleDAppariement('la vérité'))
  assert.equal(cleDAppariement('VÉRITÉ'), cleDAppariement('la vérité'))
  // Les trois formes que le `08-` §3 nomme comme le défaut à éviter.
  const cles = new Set(['la vérité', 'Vérité', 'La Vérité'].map(cleDAppariement))
  assert.equal(cles.size, 1, 'les trois formes du `08-` §3 doivent faire UNE clé')
})

test('NOTIONS — une notion SANS article passe inchangée, et rencontre celle qui en a une', () => {
  // C'est ce qui fait qu'un professeur qui tape « vérité » retrouve « la vérité ».
  assert.equal(cleDAppariement('vérité'), 'verite')
  assert.equal(cleDAppariement('la vérité'), 'verite')
})

test("NOTIONS — l'élision, et les quatre façons de taper une apostrophe", () => {
  // `plie()` replie la casse et les accents, jamais la ponctuation : sans le
  // repli d'apostrophe, « l’art » (U+2019, clavier macOS) ne rencontrerait pas
  // « l'art » (U+0027).
  assert.equal(cleDAppariement("l'art"), 'art')
  assert.equal(cleDAppariement('l’art'), 'art')
  assert.equal(cleDAppariement('L’Art'), 'art')
  assert.equal(cleDAppariement("l'État"), 'etat')
  assert.equal(cleDAppariement('l’État'), 'etat')
})

// ── LE TEST DISCRIMINANT : CE QUE LA LISTE NE RETIRE PAS ────────────────────
// Sans lui, un repli qui mangerait n'importe quel premier mot passerait tous les
// tests d'à côté.
test("NOTIONS — SEULS les quatre articles définis partent, et JAMAIS un préfixe de lettres", () => {
  // ⛔ « les » ne doit pas se manger le début d'un mot.
  assert.equal(cleDAppariement('lecture'), 'lecture')
  assert.equal(cleDAppariement('laïcité'), 'laicite')
  assert.equal(cleDAppariement('legs'), 'legs')
  assert.equal(cleDAppariement("l'"), "l'", "une notion qui n'est QUE son article garde sa forme")
  // ⛔ L'indéfini et le partitif ne sont PAS des articles de notion : ils
  //    emploient la notion dans une phrase, ils ne la nomment pas. Les retirer
  //    aurait élargi la surface de collision sans répondre à un cas réel.
  assert.equal(cleDAppariement('un devoir'), 'un devoir')
  assert.equal(cleDAppariement('du temps'), 'du temps')
  assert.equal(cleDAppariement('de la nature'), 'de la nature')
  // ⛔ UN SEUL article, jamais en chaîne. (Le repli d'accents, lui, a déjà eu
  //    lieu : c'est `plie()` qui passe en premier.)
  assert.equal(cleDAppariement('la la vérité'), 'la verite')
})

test('NOTIONS — le vide ne s’apparie à rien', () => {
  for (const x of ['', '   ', null, undefined, 7, {}, []]) {
    assert.equal(cleDAppariement(x), '', `${JSON.stringify(x)} devait rendre une clé vide`)
  }
  assert.equal(ensembleDeNotions(['', '  ', 'la vérité', null]).size, 1)
  assert.equal(ensembleDeNotions(null).size, 0)
})

// ── L'INTERSECTION — la brique que le filtre de C4-L12 appellera ────────────
test("NOTIONS — l'intersection est « AU MOINS UNE », jamais une inclusion", () => {
  assert.equal(notionsPartagees(['la vérité', 'la science'], ['La Vérité']), true)
  assert.equal(notionsPartagees(['la vérité'], ['la science', 'La Vérité']), true)
  assert.equal(notionsPartagees(['la vérité'], ['la science']), false)
})

test('NOTIONS — un cours qui ne déclare RIEN ne réclame rien, et un sujet sans notion non plus', () => {
  // ⭐ C'est le défaut que le rattachement était fait pour éviter, retourné d'un
  //    cran : `cours: "notions"` avec une liste vide ne sera JAMAIS servi.
  assert.equal(notionsPartagees(['la vérité'], []), false)
  assert.equal(notionsPartagees(['la vérité'], null), false)
  assert.equal(notionsPartagees([], ['la vérité']), false)
})

// ── LES ORPHELINES — un fait de CONCEPTION, jamais de routage ───────────────
test('NOTIONS — les orphelines sont rendues DANS LEUR LIBELLÉ ÉCRIT, dédoublonnées par clé', () => {
  const orph = notionsOrphelines(
    ['la vérité', 'La Vérité', 'la connaissance', 'le langage'],
    ['la vérité', 'la science'],
  )
  // « la vérité » est réclamée ET déclarée → jamais orpheline, sous aucune forme.
  assert.deepEqual(orph, ['la connaissance', 'le langage'])
})

test('NOTIONS — aucun cours déclaré : TOUT est orphelin, et rien n’est inventé', () => {
  assert.deepEqual(notionsOrphelines(['la vérité'], []), ['la vérité'])
  assert.deepEqual(notionsOrphelines([], ['la vérité']), [])
})

// ── ⭐⭐ L'ÉPREUVE DE COLLISION — celle que le piège 8 exige ────────────────
// « Vérifie ce que le retrait fait entrer en collision AVANT de le poser : deux
//   notions distinctes qui se replient sur le même mot rattacheraient un sujet à
//   un cours qui ne parle pas de lui. »
test('NOTIONS — le retrait de l’article ne fait entrer AUCUNE des dix-sept en collision', () => {
  const parCle = new Map<string, string[]>()
  for (const n of PROGRAMME_TC) {
    const c = cleDAppariement(n)
    assert.notEqual(c, '', `« ${n} » ne doit pas rendre une clé vide`)
    parCle.set(c, [...(parCle.get(c) ?? []), n])
  }
  const collisions = [...parCle.entries()].filter(([, ns]) => ns.length > 1)
  assert.deepEqual(collisions, [], 'deux notions du programme se replient sur la même clé')
  assert.equal(parCle.size, PROGRAMME_TC.length, 'dix-sept notions, dix-sept clés distinctes')
})

test('NOTIONS — et aucune collision non plus sur les notions que la banque déclare', () => {
  const cles = new Set(BANQUE_REELLE.map(cleDAppariement))
  assert.equal(cles.size, BANQUE_REELLE.length,
    'deux notions de la banque se replient sur la même clé')
  // Et chacune retrouve bien sa jumelle du programme, article et casse compris.
  const programme = ensembleDeNotions(PROGRAMME_TC)
  for (const n of BANQUE_REELLE) {
    assert.ok(programme.has(cleDAppariement(n)),
      `« ${n} » de la banque ne rencontre pas sa jumelle du programme`)
  }
})
