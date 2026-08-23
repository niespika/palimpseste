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
//   · `\b`, `\w` et `\d` de `re`, qui sont UNICODE — `é` y est un caractère de
//     mot, alors que le `\b` de JavaScript (hors drapeau `u`) ne connaît que
//     l'ASCII ;
//   · `\s`, `str.strip()` — les blancs de Python NE SONT PAS ceux de JavaScript
//     (C4-L10 · Structure) ;
//   · la VÉRITÉ, l'ITÉRATION et `len()` — un `or []`, un `for x in v`, un
//     `len(v)` ne se comportent pas comme leurs voisins JavaScript, et c'est ce
//     qui décide du chemin de calcul (C4-L10 · Structure) ;
//   · `"%.1f"` / `"%.2f"` — le FORMATAGE d'un flottant, qui tranche les égalités
//     AU PAIR comme `round()`, quand `toFixed()` les tranche vers le haut
//     (C4-L10 · Connaissance : `"%.1f" % 6.25` vaut `6.2`, `toFixed(1)` rend
//     `6.3` — et 6,25 % d'invérifiable, c'est une unité sur seize).
//
// ⚠️ AUCUN DE CES ÉCARTS NE SE VOIT SUR UN VECTEUR. Les vecteurs des modules
//    portent des rangs entiers, des thèses en `t1`/`t2` et des notes sans
//    accent ; une copie réelle, non. C'est le même piège que l'arrondi
//    (`./arrondi`), et il se traite pareil : une fois, pour les six.
//
// ⛔ Ce module ne « répare » rien et n'invente aucune règle : il rend en
//    TypeScript ce que Python rend, et rien d'autre.
// ============================================================================

import { arrondi } from './arrondi'

/**
 * `repr()` de Python, sur les valeurs qu'un relevé jugé peut porter — c'est-à-
 * dire ce que `JSON.parse` produit, plus `undefined` (le pendant JavaScript
 * d'une clé absente, que `dict.get()` rend `None`).
 *
 * ⚠️⚠️ LA DIVERGENCE DE NATURE — et elle a MORDU, pour de bon. Python distingue
 *    `2` de `2.0` (`'2'` contre `'2.0'`), JavaScript non : un JSON qui porterait
 *    `2.0` rend ici `2`. Cette note disait « cela ne touche QUE des textes
 *    d'alerte » ; C4-L10 · Connaissance l'a trouvée DANS UNE TRACE, et le « fait
 *    quand » du lot exige l'identité sur les trois clés. Un seuil déclaré
 *    FLOTTANT à la fiche — `seuil_ratio_haut`, `bornes: [0.0, 100.0]` — vaut
 *    `5.0` pour Python et `5` pour JavaScript dès qu'on le règle sur un entier,
 *    et c'est précisément ce qu'un réglage empirique fait. ⭐ Le pendant fidèle
 *    est `strFlottant()` ci-dessous : quand on SAIT que la valeur est un
 *    flottant Python, on l'écrit comme Python l'écrit.
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

/**
 * `str()` D'UN FLOTTANT PYTHON, quand l'appelant SAIT que c'en est un.
 *
 * Python garde le point décimal d'un flottant entier — `str(5.0)` vaut `'5.0'`,
 * `str(25.0)` vaut `'25.0'` — là où `String(5)` de JavaScript rend `'5'`. Le
 * type se perd en JSON ; il ne se retrouve qu'à la DÉCLARATION, et c'est là que
 * l'appelant le lit : un paramètre dont la fiche écrit `bornes: [0.0, 100.0]`
 * est un flottant, un paramètre dont elle écrit `bornes: [0, 100]` est un
 * entier.
 *
 * ⚠️ Hors des entiers, le texte est déjà le même des deux côtés : Python et
 *    JavaScript écrivent tous deux la plus courte représentation qui
 *    aller-retourne. C'est le point décimal terminal, et lui seul, qui manque.
 */
export function strFlottant(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return str(v)
  return Number.isInteger(v) ? `${v}.0` : String(v)
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
 * LA CLASSE `\w` DE PYTHON, à l'exact — `[\p{L}\p{N}_]`.
 *
 * La documentation la définit comme « les caractères alphanumériques au sens de
 * `str.isalnum()`, plus le tiret bas » : toutes les lettres, TOUS les nombres
 * *(Nd, Nl et No — `²` et `Ⅷ` en sont)*, et `_` seul.
 *
 * ⚠️ C4-L10 · STRUCTURE — CE N'ÉTAIT PAS `\p{Pc}`. La première écriture prenait
 *    toute la ponctuation de liaison ; vérifié en Python, `‿` (U+203F, Pc)
 *    N'EST PAS un caractère de mot, `_` l'est. L'écart ne pouvait produire qu'un
 *    appariement manqué de plus, jamais un faux — il est corrigé ici parce que
 *    ce module existe pour dire ce que Python fait, pas à peu près.
 */
export const CAR_MOT_PYTHON = '\\p{L}\\p{N}_'

/** `\d` de Python (motifs `str`) : les chiffres décimaux UNICODE, pas `[0-9]`. */
export const CAR_CHIFFRE_PYTHON = '\\p{Nd}'

/**
 * LES BLANCS DE PYTHON — `str.isspace()`, et c'est aussi exactement `\s` de `re`
 * *(vérifié caractère par caractère sur U+0000-U+3000)*.
 *
 * ⚠️ CE NE SONT PAS CEUX DE JAVASCRIPT, et l'écart va dans les deux sens :
 *    Python tient pour blancs `\x1c`-`\x1f` *(les séparateurs de fichier, de
 *    groupe, d'enregistrement et d'unité)* et `\x85` *(NEL)*, que `\s` de
 *    JavaScript ignore ; JavaScript tient pour blanc `﻿` *(la BOM)*, que
 *    Python ignore. Une transcription d'OCR ou un copier-coller depuis un
 *    traitement de texte en produit.
 *
 * *Là où un module découpe des paragraphes sur `\n\s*\n+` — la Structure —, un
 * caractère de la première liste décide qu'il y a, ou non, une frontière de
 * bloc : c'est-à-dire une couture de plus ou de moins.*
 */
export const CAR_BLANC_PYTHON = '\\t\\n\\v\\f\\r \\u001c-\\u001f\\u0085\\u00a0\\u1680'
  + '\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000'

const RE_BLANCS_BORDS = new RegExp(`^[${CAR_BLANC_PYTHON}]+|[${CAR_BLANC_PYTHON}]+$`, 'gu')
const RE_BLANCS = new RegExp(`[${CAR_BLANC_PYTHON}]+`, 'gu')

/** `str.strip()` de Python — et non `String.prototype.trim()`. */
export function strip(s: string): string {
  return (s ?? '').replace(RE_BLANCS_BORDS, '')
}

/** `re.sub(r"\s+", remplacement, s)` de Python. */
export function remplaceBlancs(s: string, remplacement: string): string {
  return (s ?? '').replace(RE_BLANCS, remplacement)
}

/**
 * `str.split()` DE PYTHON, SANS ARGUMENT — et ce n'est pas `split(/\s+/)`.
 *
 * Sans séparateur, Python découpe sur des SUITES de blancs, ignore ceux des
 * bords, et ne rend **aucune chaîne vide** : `"".split()` vaut `[]`, quand
 * `"".split(/\s+/)` de JavaScript rend `['']` — donc « un mot » là où Python en
 * compte zéro. *La Connaissance s'en sert pour le nombre de mots du pré-relevé,
 * qui part au modèle dans le slot `{pre_releve}`.*
 */
export function separeParBlancs(s: string): string[] {
  const t = strip(s ?? '')
  return t === '' ? [] : t.split(RE_BLANCS)
}

/**
 * `str.strip(caracteres)` de Python — la variante à ENSEMBLE DE CARACTÈRES, qui
 * n'a rien à voir avec `strip()` nu : elle retire, aux deux bords, tout
 * caractère APPARTENANT à l'ensemble, jusqu'au premier qui n'y est pas.
 *
 * *`"[posee_seule]".strip("[]")` rend `posee_seule` ; `'"« x »"'.strip('"« »')`
 * rend `x` — l'espace fait partie de l'ensemble, et c'est ce qui le fait
 * marcher.* Les deux cas sont ceux du module de la Connaissance.
 */
export function stripCaracteres(s: string, caracteres: string): string {
  const ens = new Set([...(caracteres ?? '')])
  const c = [...(s ?? '')]
  let d = 0
  let f = c.length
  while (d < f && ens.has(c[d])) d += 1
  while (f > d && ens.has(c[f - 1])) f -= 1
  return c.slice(d, f).join('')
}

/**
 * `"%.<n>f" % x` DE PYTHON — le formatage d'un flottant à `n` décimales.
 *
 * ⚠️ C'EST LE MÊME PIÈGE QUE `round()`, ET IL EST DANS LES TEXTES DE TRACE.
 *    Python formate en tranchant les égalités exactes AU PAIR ; `toFixed()` les
 *    tranche vers le haut. Mesuré : `"%.1f" % 6.25` vaut `6.2` et `toFixed(1)`
 *    rend `6.3` ; `"%.2f" % 0.125` vaut `0.12` et `toFixed(2)` rend `0.13`.
 *
 * *Et l'égalité exacte n'est pas une curiosité : la part d'unités invérifiables
 * d'une copie vaut `100 · k / n`, donc `6,25` pour une unité sur seize et `12,5`
 * pour une sur huit. Le verdict ne change pas — les comparaisons portent sur le
 * flottant, jamais sur son texte —, mais LA TRACE DIVERGE, et le « fait quand »
 * du lot exige l'identité sur les trois clés.*
 *
 * L'arrondi correct est celui de `./arrondi` ; il ne reste qu'à poser les zéros
 * de queue, ce que `toFixed` fait alors sans plus rien arrondir.
 */
export function formateFlottant(x: number, n: number): string {
  if (!Number.isFinite(x)) return x > 0 ? 'inf' : (Number.isNaN(x) ? 'nan' : '-inf')
  return arrondi(x, n).toFixed(n)
}

/**
 * `re.search(rf"\b{mot}\b", texte)` de Python — avec le `\b` UNICODE.
 *
 * Le `\b` de JavaScript ne connaît que `[A-Za-z0-9_]` : dans « écirculaire »,
 * Python ne voit AUCUNE frontière et ne trouve rien, JavaScript en voit une et
 * trouve le mot. C'est exactement la lecture d'une note de « limite ».
 *
 * `mot` est attendu sans métacaractère — les statuts des catalogues le sont —,
 * et il est malgré tout échappé : un catalogue peut changer.
 */
export function motIsole(mot: string, texte: string): boolean {
  const m = mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![${CAR_MOT_PYTHON}])${m}(?![${CAR_MOT_PYTHON}])`, 'u').test(texte ?? '')
}

/**
 * LA VÉRITÉ DE PYTHON — `if v:` / `v or défaut` / `not v`.
 *
 * Sont FAUX, et rien d'autre : `None`, `False`, `0`, la chaîne vide, la liste
 * vide, le dictionnaire vide. ⚠️ En JavaScript, `[]` et `{}` sont VRAIS : un
 * `jugements.get("blocs_objets_distincts") or []` porté naïvement ne se
 * comporte pas pareil, et le chemin de calcul change sans qu'un vecteur le voie.
 */
export function estVrai(v: unknown): boolean {
  if (v === null || v === undefined || v === false) return false
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  if (Array.isArray(v)) return v.length > 0
  if (typeof v === 'object') return Object.keys(v as Record<string, unknown>).length > 0
  return Boolean(v)
}

/**
 * `for x in v` de Python, sur ce qu'un JSON peut porter.
 *
 * ⚠️ UNE CHAÎNE EST ITÉRABLE, ET ELLE REND SES CARACTÈRES — c'est ce qui fait
 *    qu'un `gestes: "manque"` ne contient AUCUN geste « manque » pour Python
 *    *(il y voit `m`, `a`, `n`, `q`, `u`, `e`)*. Un objet rend SES CLÉS. Un
 *    nombre et un booléen ne sont pas itérables : Python lève, et le contrat §3
 *    l'interdit — d'où le drapeau, que l'appelant transforme en alerte nommée.
 *
 * Les caractères sont rendus par POINT DE CODE, comme en Python.
 */
export function itere(v: unknown): { elements: unknown[]; iterable: boolean } {
  if (v === null || v === undefined) return { elements: [], iterable: false }
  if (Array.isArray(v)) return { elements: v, iterable: true }
  if (typeof v === 'string') return { elements: [...v], iterable: true }
  if (typeof v === 'object') {
    return { elements: Object.keys(v as Record<string, unknown>), iterable: true }
  }
  return { elements: [], iterable: false }
}

/**
 * `len(v)` de Python : la longueur d'une liste, le NOMBRE DE POINTS DE CODE
 * d'une chaîne, le nombre de clés d'un objet. `null` quand Python lèverait.
 *
 * ⚠️ Le cas qui décide : `etapes_annoncees` rendu en CHAÎNE au lieu de liste.
 *    `len("étape 1, étape 2")` vaut 16 — donc « il y a des étapes », donc la
 *    clause d'ordre du §4 s'applique. Un `Array.isArray(v) ? v.length : 0` y
 *    rendrait 0 et sauterait la clause : un autre verdict, sans un symptôme.
 */
export function longueur(v: unknown): number | null {
  if (Array.isArray(v)) return v.length
  if (typeof v === 'string') return [...v].length
  if (v !== null && typeof v === 'object') return Object.keys(v as Record<string, unknown>).length
  return null
}

/**
 * `sorted()` de Python sur des chaînes — l'ordre des POINTS DE CODE.
 *
 * Le tri par défaut de JavaScript compare des unités UTF-16 : il ne diverge que
 * sur les caractères hors du plan de base, mais il en diverge.
 */
export function trie(valeurs: readonly string[]): string[] {
  return [...valeurs].sort((a, b) => {
    const ca = [...a]
    const cb = [...b]
    for (let i = 0; i < Math.min(ca.length, cb.length); i += 1) {
      const d = ca[i].codePointAt(0)! - cb[i].codePointAt(0)!
      if (d !== 0) return d
    }
    return ca.length - cb.length
  })
}
