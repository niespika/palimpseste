// ============================================================================
// C4 · L3 — CE QUE LA CHASSE AUX FAUTES DOIT TENIR.
// ----------------------------------------------------------------------------
// « *N* est compté EN CODE, à partir du relevé de langue que la chaîne produit
//   déjà — l'écran ne détecte rien de lui-même et n'appelle aucun modèle. »
//                                                            — `06-` §2
// ⚠️ La chaîne ne produit AUCUN relevé aujourd'hui : **l'absence est le cas
//    nominal**, et c'est la première chose que ces tests prouvent.
// ⭐ **NULL N'EST PAS ZÉRO** (`01-` §11 ; `06-` §6) : « aucune faute » et « on
//    n'a pas regardé » ne se confondent jamais.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PLAFOND_CITATIONS, ancrerLigneALigne, lireReleveDeLangue, nombreDeFautes,
  phraseDeLaChasse, type ReleveDeLangue,
} from './langue'

/** Le bloc tel que le squelette P1 de la fiche Expression le déclare (§3). */
const BLOC = {
  total: 3,
  citations: [
    { phrase: 1, citation: 'les eleves' },
    { phrase: 4, citation: 'il a comprit' },
  ],
}

/** Ce que la chaîne écrit vraiment : un relevé de P1 sous SA clé d'extraction. */
const ARTEFACT = { releve: { faits: [], reussites: [], orthographe: BLOC } }

const COPIE = [
  'Les eleves de la classe travaillent.',
  '',
  'Ensuite il a comprit que la question était mal posée.',
].join('\n')

// ── L'absence est le cas nominal ────────────────────────────────────────────

test('la chaîne ne produit aucun relevé aujourd\'hui — et l\'absence rend `null`, jamais un relevé vide', () => {
  assert.equal(lireReleveDeLangue(null), null)
  assert.equal(lireReleveDeLangue(undefined), null)
  assert.equal(lireReleveDeLangue({}), null, 'un artefact vide ne fabrique pas un relevé')
  assert.equal(lireReleveDeLangue({ releve: { faits: [] } }), null,
    'un relevé de P1 sans clé `orthographe` : rien à lire')
  assert.equal(lireReleveDeLangue('orthographe'), null)
  assert.equal(lireReleveDeLangue([BLOC]), null, 'une liste n\'est pas un artefact d\'extraction')
})

test('l\'encart ne s\'affiche pas, et CE N\'EST PAS UNE PANNE — bout en bout', () => {
  const releve = lireReleveDeLangue({})
  assert.equal(releve, null)
  assert.equal(nombreDeFautes(releve), null, 'pas de relevé : pas de nombre — surtout pas 0')
  assert.equal(phraseDeLaChasse(nombreDeFautes(releve)), null, 'rien à dire, donc rien à afficher')
})

// ── Le chemin de lecture ────────────────────────────────────────────────────

test('le relevé se lit sous la CLÉ D\'EXTRACTION de P1, pas seulement à la racine', () => {
  assert.deepEqual(lireReleveDeLangue(ARTEFACT), BLOC)
  assert.deepEqual(lireReleveDeLangue({ orthographe: BLOC }), BLOC,
    'la racine reste lisible : la forme exacte n\'est pas encore fixée')
})

test('on descend d\'UN cran, pas de deux — un `orthographe` enfoui n\'est pas le relevé', () => {
  assert.equal(lireReleveDeLangue({ releve: { bloc: { orthographe: BLOC } } }), null)
})

test('un relevé SANS total ne se déduit pas des citations — le plafond de 5 sous-compterait', () => {
  assert.equal(PLAFOND_CITATIONS, 5)
  assert.equal(lireReleveDeLangue({ orthographe: { citations: BLOC.citations } }), null)
})

test('un total mal formé rend `null` en entier — on ne devine pas un compte', () => {
  for (const total of ['3', -1, 2.5, null, Number.NaN, true]) {
    assert.equal(lireReleveDeLangue({ orthographe: { total, citations: [] } }), null,
      `total = ${String(total)}`)
  }
})

test('des `citations` qui ne sont pas une liste : forme inconnue, donc `null`', () => {
  assert.equal(lireReleveDeLangue({ orthographe: { total: 2, citations: 'deux' } }), null)
})

test('une citation vide ou absente est ÉCARTÉE, sans emporter les autres', () => {
  const lu = lireReleveDeLangue({ orthographe: { total: 4, citations: [
    { phrase: 1, citation: '   ' }, { phrase: 2 }, 'les eleves', null,
    { phrase: 3, citation: 'les eleves' },
  ] } })
  assert.deepEqual(lu, { total: 4, citations: [{ phrase: 3, citation: 'les eleves' }] })
})

test('un numéro de phrase illisible vaut 0 — l\'ancrage se fait sur le TEXTE, pas sur lui', () => {
  const lu = lireReleveDeLangue({ orthographe: { total: 1, citations: [{ citation: 'les eleves' }] } })
  assert.deepEqual(lu, { total: 1, citations: [{ phrase: 0, citation: 'les eleves' }] })
})

// ── Le N, et le zéro qui n'est pas nul ──────────────────────────────────────

test('« aucune faute » et « on n\'a pas regardé » sont DEUX choses — null n\'est pas 0', () => {
  assert.equal(nombreDeFautes(null), null)
  assert.equal(nombreDeFautes({ total: 0, citations: [] }), 0,
    'un relevé qui a regardé et n\'a rien trouvé compte 0, et le dit')
  assert.notEqual(nombreDeFautes(null), 0)
})

test('N se lit sur le TOTAL déclaré, jamais sur le nombre de citations (plafond de 5)', () => {
  const douze: ReleveDeLangue = {
    total: 12,
    citations: Array.from({ length: PLAFOND_CITATIONS }, (_, i) => ({ phrase: i + 1, citation: `f${i}` })),
  }
  assert.equal(nombreDeFautes(douze), 12)
  assert.notEqual(nombreDeFautes(douze), douze.citations.length)
})

// ── L'ancrage ligne à ligne ─────────────────────────────────────────────────

test('chaque citation s\'ancre à SA ligne, 1-indexée, dans l\'ordre du relevé', () => {
  assert.deepEqual(ancrerLigneALigne(COPIE, BLOC), [
    { ligne: 1, citation: 'les eleves', trouvee: true },
    { ligne: 3, citation: 'il a comprit', trouvee: true },
  ])
})

test('une citation introuvable NE S\'ANCRE NULLE PART et se signale — on ne devine pas', () => {
  const ancres = ancrerLigneALigne(COPIE, {
    total: 2, citations: [{ phrase: 1, citation: 'un mot jamais écrit' }],
  })
  assert.deepEqual(ancres, [{ ligne: 0, citation: 'un mot jamais écrit', trouvee: false }])
  assert.notEqual(ancres[0].ligne, 1, 'surtout pas la première ligne par défaut')
})

test('une copie en CRLF s\'ancre COMME UNE AUTRE — le piège du `<textarea>` du 22/08', () => {
  assert.deepEqual(
    ancrerLigneALigne(COPIE.replace(/\n/g, '\r\n'), BLOC),
    ancrerLigneALigne(COPIE, BLOC),
  )
})

test('une copie en CR seul ne se lit pas comme UNE SEULE ligne', () => {
  assert.deepEqual(ancrerLigneALigne(COPIE.replace(/\n/g, '\r'), BLOC), [
    { ligne: 1, citation: 'les eleves', trouvee: true },
    { ligne: 3, citation: 'il a comprit', trouvee: true },
  ])
})

test('la comparaison est celle de `citationsIntrouvables` : apostrophes, guillemets, espaces', () => {
  const texte = "L'ecole \"forme\"   des   exécutants."
  assert.deepEqual(ancrerLigneALigne(texte, {
    total: 2,
    citations: [
      { phrase: 1, citation: 'l’ecole' },          // apostrophe typographique
      { phrase: 1, citation: 'des exécutants' },   // espaces multiples
    ],
  }), [
    { ligne: 1, citation: 'l’ecole', trouvee: true },
    { ligne: 1, citation: 'des exécutants', trouvee: true },
  ])
})

test('une citation à cheval sur un retour à la ligne s\'ancre là où elle COMMENCE', () => {
  const texte = 'Première ligne qui se termine par une\nphrase coupée en deux.'
  assert.deepEqual(ancrerLigneALigne(texte, {
    total: 1, citations: [{ phrase: 1, citation: 'par une phrase coupée' }],
  }), [{ ligne: 1, citation: 'par une phrase coupée', trouvee: true }])
})

test('un relevé sans citation n\'ancre rien — et n\'invente pas une ligne', () => {
  assert.deepEqual(ancrerLigneALigne(COPIE, { total: 7, citations: [] }), [])
})

// ── La phrase servie à l'élève ──────────────────────────────────────────────

test('le mot de la source est « probables » — jamais un verdict, jamais une note', () => {
  const phrase = phraseDeLaChasse(3)!
  assert.match(phrase, /3 fautes probables/)
  assert.doesNotMatch(phrase, /note|niveau|verdict|mauvais|nul/i)
})

test('une seule faute se dit au singulier', () => {
  assert.equal(phraseDeLaChasse(1), 'Il reste 1 faute probable — corrige ce que tu trouves.')
})

test('« un écran n\'affiche un nombre que si ce nombre compte quelque chose » — 0 ne se dit pas', () => {
  assert.equal(phraseDeLaChasse(0), null)
})

test('sans relevé, aucune phrase — et surtout pas « 0 faute » sur une copie jamais lue', () => {
  assert.equal(phraseDeLaChasse(null), null)
})

test('bout en bout : l\'artefact de la chaîne donne le N, la phrase et les ancres', () => {
  const releve = lireReleveDeLangue(ARTEFACT)
  assert.notEqual(releve, null)
  assert.equal(nombreDeFautes(releve), 3)
  assert.equal(phraseDeLaChasse(nombreDeFautes(releve)),
    'Il reste 3 fautes probables — corrige ce que tu trouves.')
  assert.equal(ancrerLigneALigne(COPIE, releve!).filter((a) => a.trouvee).length, 2,
    'deux citations ancrées pour trois fautes comptées : le total N\'EST PAS le nombre d\'ancres')
})
