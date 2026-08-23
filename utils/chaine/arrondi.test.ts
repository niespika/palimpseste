// L'ARRONDI, CONFRONTÉ À PYTHON — et il faut le confronter à part.
//
// ⚠️ AUCUN VECTEUR DU MODULE NE LE COUVRE, et c'est vérifié : remplacer cet
//    arrondi par `Math.round` naïf laisse passer LES SEIZE tests du portage
//    (25 couples de grades, 7 golds, la zone grise, la chaîne complète). La
//    raison est simple — les vecteurs comptent des faits entiers sur des nombres
//    de mots ronds, et aucun ne tombe sur une égalité exacte.
//
// ⭐ Une copie réelle, elle, y tombe : un fait pour huit cents mots vaut 0,125,
//    et Python rend alors 0,12 quand JavaScript rend 0,13. Un seuil franchi d'un
//    centième, et la mesure bascule — sans qu'aucun vecteur ne le voie jamais.
//    C'est exactement la forme de trou que ce lot existe pour fermer.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { arrondi } from './arrondi'

/** Les égalités exactes, plus les pièges de représentation binaire. */
const CAS: Array<[number, number]> = [
  [0.125, 2], [0.375, 2], [0.625, 2], [0.875, 2], [1.125, 2], [2.375, 2],
  [0.5, 0], [1.5, 0], [2.5, 0], [3.5, 0], [4.5, 0], [-2.5, 0], [-0.125, 2],
  [0.135, 2], [2.675, 2], [1.005, 2], [0.005, 2], [2.345, 2],
  [0.1, 2], [0.0, 2], [5, 2], [33.333333333333336, 2], [1.4999999999999998, 2],
  // Les densités du branchement : n / nb_mots * 100, arrondi à 2.
  [(1 / 800) * 100, 2], [(3 / 800) * 100, 2], [(1 / 160) * 100, 2],
  [(7 / 236) * 100, 2], [(13 / 504) * 100, 2],
  // Les taux : à 4 décimales, puis le pourcentage à 1.
  [1 - 3 / 16, 4], [1 - 1 / 3, 4], [(1 / 8) * 100, 1], [(1 / 16) * 100, 1],
]

test("l'arrondi reproduit `round()` de Python — égalités comprises", () => {
  const programme = 'import sys\n'
    + 'for l in sys.stdin.read().splitlines():\n'
    + '    x, n = l.split()\n'
    + '    print(repr(round(float(x), int(n))))\n'
  const entree = CAS.map(([x, n]) => `${x} ${n}`).join('\n')
  const r = spawnSync('python3', ['-c', programme], { input: entree, encoding: 'utf-8' })
  assert.equal(r.status, 0, r.stderr)
  const attendus = r.stdout.trim().split('\n')
  assert.equal(attendus.length, CAS.length)
  CAS.forEach(([x, n], i) => {
    // `repr()` de Python écrit « 2.0 » là où JavaScript écrit « 2 » : on compare
    // les NOMBRES, jamais leurs écritures.
    assert.equal(arrondi(x, n), Number(attendus[i]),
      `round(${x}, ${n}) — Python dit ${attendus[i]}`)
  })
})

test("l'arrondi TRANCHE AU PAIR, là où `Math.round` tranche vers le haut", () => {
  // La preuve que ce module n'est pas un ornement : sur ces quatre valeurs, les
  // deux règles divergent, et c'est la première qui fait foi.
  assert.equal(arrondi(0.125, 2), 0.12)
  assert.equal(Math.round(0.125 * 100) / 100, 0.13)
  assert.equal(arrondi(2.5, 0), 2)
  assert.equal(Math.round(2.5), 3)
})

test("un nombre non fini traverse sans se faire arrondir — jamais un 0 inventé", () => {
  assert.equal(Number.isNaN(arrondi(Number.NaN, 2)), true)
  assert.equal(arrondi(Number.POSITIVE_INFINITY, 2), Number.POSITIVE_INFINITY)
})
