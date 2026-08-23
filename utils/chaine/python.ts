// ============================================================================
// C4 · L10 — LES FORMES DE PYTHON QU'UN PORTAGE DOIT REPRODUIRE.
// ----------------------------------------------------------------------------
// Le « fait quand » du lot exige que le branchement reproduise EXACTEMENT ce que
// `python3 code.py --autotest` produit — et « EXACTEMENT » porte sur LES TROIS
// CLÉS, `trace` et `alertes` comprises (`CONTRAT-MODULES.md` §3 : « la trace est
// ce qui rend lisible une erreur de jugement »). Or les modules composent leurs
// lignes de trace avec des formes de Python que JavaScript n'a pas :
//
//   · `{x!r}` — `repr()`, qui met une chaîne entre quotes et rend `None` ;
//   · `{ma_liste}` / `{mon_dict}` — `str()` d'un conteneur, qui reprend le
//     `repr()` de chaque élément : `['circulaire', 'implicite']`, `{'explicite': 3}` ;
//   · `str.casefold()`, qui n'est PAS `toLowerCase()` — `ß` y devient `ss`,
//     `ﬁ` devient `fi`, `ς` devient `σ` ;
//   · `\b` de `re`, qui est UNICODE — `é` y est un caractère de mot, alors que
//     le `\b` de JavaScript (hors drapeau `u`) ne connaît que l'ASCII.
//
// ⚠️ AUCUN DE CES QUATRE ÉCARTS NE SE VOIT SUR UN VECTEUR. Les vecteurs des
//    modules portent des rangs entiers, des thèses en `t1`/`t2` et des notes
//    sans accent ; une copie réelle, non. C'est le même piège que l'arrondi
//    (`./arrondi`), et il se traite pareil : une fois, pour les six.
//
// ⛔ Ce module ne « répare » rien et n'invente aucune règle : il rend en
//    TypeScript ce que Python rend, et rien d'autre.
// ============================================================================

/**
 * `repr()` de Python, sur les valeurs qu'un relevé jugé peut porter — c'est-à-
 * dire ce que `JSON.parse` produit, plus `undefined` (le pendant JavaScript
 * d'une clé absente, que `dict.get()` rend `None`).
 *
 * ⚠️ La seule divergence connue, et elle est de nature, pas d'implémentation :
 *    Python distingue `2` de `2.0` (`'2'` contre `'2.0'`), JavaScript non — un
 *    JSON qui porterait `2.0` rendrait ici `2`. Cela ne touche QUE des textes
 *    d'alerte, jamais un verdict.
 */
export function repr(v: unknown): string {
  if (v === null || v === undefined) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : reprFlottantSpecial(v)
  if (typeof v === 'string') return reprChaine(v)
  if (Array.isArray(v)) return `[${v.map(repr).join(', ')}]`
  if (typeof v === 'object') {
    const entrees = Object.entries(v as Record<string, unknown>)
    return `{${entrees.map(([k, x]) => `${repr(k)}: ${repr(x)}`).join(', ')}}`
  }
  return String(v)
}

/**
 * `str()` de Python. Il ne diffère de `repr()` que sur les chaînes — qui sortent
 * nues — ; un conteneur, lui, garde le `repr()` de ses éléments. C'est ce qui
 * fait qu'une liste de statuts s'écrit `['circulaire', 'implicite']` et non
 * `[circulaire, implicite]`.
 */
export function str(v: unknown): string {
  return typeof v === 'string' ? v : repr(v)
}

function reprFlottantSpecial(v: number): string {
  if (Number.isNaN(v)) return 'nan'
  return v > 0 ? 'inf' : '-inf'
}

/**
 * `repr()` d'une chaîne : quotes simples, sauf si la chaîne porte une quote
 * simple et pas de double — alors Python passe aux doubles, sans échapper.
 */
function reprChaine(s: string): string {
  const q = s.includes("'") && !s.includes('"') ? '"' : "'"
  let out = q
  for (const c of s) {
    if (c === '\\') out += '\\\\'
    else if (c === q) out += `\\${q}`
    else if (c === '\n') out += '\\n'
    else if (c === '\r') out += '\\r'
    else if (c === '\t') out += '\\t'
    else {
      const p = c.codePointAt(0)!
      // Les C0/C1 sortent en `\xNN`, comme Python. Le reste — accents compris —
      // s'écrit tel quel : `repr()` n'échappe plus le non-ASCII depuis Python 3.
      if (p < 0x20 || p === 0x7f || (p >= 0x80 && p <= 0x9f)) {
        out += `\\x${p.toString(16).padStart(2, '0')}`
      } else out += c
    }
  }
  return out + q
}

/**
 * LE REPLIEMENT DE CASSE COMPLET — `str.casefold()`, et non `str.lower()`.
 *
 * `toLowerCase()` de JavaScript est la MINUSCULISATION ; `casefold()` est le
 * repliement de casse, plus agressif, et c'est lui que les modules emploient
 * pour comparer deux thèses recopiées. La table ci-dessous porte les écarts qui
 * peuvent réellement se présenter sur une copie de philosophie : l'eszett, les
 * ligatures typographiques que produit une OCR, le sigma final d'une citation
 * grecque, et les deux compositions du tableau de repliement complet.
 *
 * ⚠️ Les repliements exotiques que cette table n'a pas — ligatures arméniennes,
 *    tableaux cherokee — ne peuvent produire qu'un appariement RATÉ, donc une
 *    alerte nommée : jamais un appariement faux, jamais un trou silencieux.
 */
const REPLIEMENTS: Array<[string, string]> = [
  ['ß', 'ss'],      // ß
  ['ﬀ', 'ff'], ['ﬁ', 'fi'], ['ﬂ', 'fl'],
  ['ﬃ', 'ffi'], ['ﬄ', 'ffl'], ['ﬅ', 'st'], ['ﬆ', 'st'],
  ['ŉ', 'ʼn'], // ŉ
  ['ǰ', 'ǰ'], // ǰ
  ['ς', 'σ'],  // ς → σ
]

export function casefold(s: string): string {
  let t = (s ?? '').toLowerCase()
  for (const [de, vers] of REPLIEMENTS) {
    if (t.includes(de)) t = t.split(de).join(vers)
  }
  return t
}

/**
 * `re.search(rf"\b{mot}\b", texte)` de Python — avec le `\b` UNICODE.
 *
 * Le `\w` de Python (motifs `str`) couvre les lettres, TOUS les nombres et la
 * ponctuation de liaison — mais PAS les diacritiques combinants. Le `\b` de
 * JavaScript, lui, ne connaît que `[A-Za-z0-9_]` : dans « écirculaire », Python
 * ne voit AUCUNE frontière et ne trouve rien, JavaScript en voit une et trouve
 * le mot. C'est exactement la lecture d'une note de « limite ».
 *
 * `mot` est attendu sans métacaractère — les statuts des catalogues le sont —,
 * et il est malgré tout échappé : un catalogue peut changer.
 */
const MOT_PYTHON = '\\p{L}\\p{N}\\p{Pc}'

export function motIsole(mot: string, texte: string): boolean {
  const m = mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![${MOT_PYTHON}])${m}(?![${MOT_PYTHON}])`, 'u').test(texte ?? '')
}
