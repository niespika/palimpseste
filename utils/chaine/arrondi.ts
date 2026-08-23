// ============================================================================
// C4 · L10 — L'ARRONDI DE PYTHON, PORTÉ À L'IDENTIQUE.
// ----------------------------------------------------------------------------
// Les modules de calibration arrondissent leurs densités par `round(x, 2)`, et
// le « fait quand » du lot exige que le branchement reproduise EXACTEMENT ce que
// `python3 code.py --autotest` produit. Or les deux langages n'arrondissent pas
// pareil : `round()` de Python tranche les égalités AU PAIR (round-half-even),
// `Math.round()` de JavaScript les tranche VERS LE HAUT.
//
// L'écart ne se voit qu'aux égalités exactes — une densité de 0,125 rend 0,12
// d'un côté et 0,13 de l'autre —, et une égalité exacte n'est pas rare ici : un
// fait pour huit cents mots en est une. Un seuil franchi d'un centième, et la
// mesure bascule.
//
// ⚠️ Ce n'est pas une commodité de confort : sans lui, deux portages du même
//    calcul divergeraient sur des copies réelles sans qu'aucun vecteur ne le
//    voie — les vecteurs du module tombent sur des valeurs rondes.
// ============================================================================

/**
 * `round(x, n)` de Python, à l'identique.
 *
 * Le développement décimal EXACT d'un double dont la (n+1)-ième décimale est un
 * « 5 » terminal est court — c'est un rationnel dyadique, 0,5 · 0,25 · 0,125 —,
 * donc vingt décimales suffisent à distinguer une vraie égalité d'une valeur qui
 * n'en est qu'approchée. `toFixed(20)` est correctement arrondi par la norme :
 * c'est de lui qu'on lit le développement.
 */
export function arrondi(x: number, n: number): number {
  if (!Number.isFinite(x)) return x
  const negatif = x < 0
  const [ent, dec = ''] = Math.abs(x).toFixed(20).split('.')
  if (n >= dec.length) return x

  const garde = dec.slice(0, n)
  const reste = dec.slice(n)
  const premier = reste.charCodeAt(0) - 48
  let monte: boolean
  if (premier !== 5) {
    monte = premier > 5
  } else if (!/^0*$/.test(reste.slice(1))) {
    monte = true
  } else {
    // ÉGALITÉ EXACTE — Python arrondit vers le chiffre PAIR, et c'est tout
    // l'objet de ce module.
    const dernier = n === 0 ? ent.charCodeAt(ent.length - 1) - 48 : garde.charCodeAt(n - 1) - 48
    monte = dernier % 2 === 1
  }

  let entier = BigInt(ent + garde)
  if (monte) entier += BigInt(1)
  const chiffres = entier.toString().padStart(n + 1, '0')
  const valeur = n === 0
    ? Number(chiffres)
    : Number(`${chiffres.slice(0, chiffres.length - n)}.${chiffres.slice(chiffres.length - n)}`)
  return negatif ? -valeur : valeur
}
