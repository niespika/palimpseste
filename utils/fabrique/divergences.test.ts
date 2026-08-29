/* eslint-disable @typescript-eslint/no-explicit-any -- Les vecteurs sont du JSON malformé à dessein. */
// ============================================================================
// C4 · L8 — LES VECTEURS LIMITES, ceux que la recopie d'autotest ne voit pas.
// ----------------------------------------------------------------------------
// Les tests d'à côté rejouent les vecteurs des deux scripts qui font foi. Ils
// prouvent que le port dit la même chose SUR CE QUE LES SCRIPTS ÉPROUVENT — et
// c'est exactement leur angle mort : l'écart entre Python et JavaScript vit
// AILLEURS, dans la sémantique des deux langages.
//
// Une revue adversariale a construit trente et un vecteurs limites et en a tiré
// trente-deux divergences. Ce fichier ferme celles qui changeaient un VERDICT.
// Chacune porte le nom de ce que Python fait, parce que c'est Python qui fait foi.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { assemblerDoctrine, type LignesDoctrine } from './doctrine'
import { controleImport } from './verifie-import'
import { controleReference, phrasesDuTexte } from './verifie-reference'

const doctrine = assemblerDoctrine(JSON.parse(fs.readFileSync(
  path.join(process.cwd(), 'utils', 'fabrique', 'doctrine.fixture.json'), 'utf-8')) as LignesDoctrine)

const codes = (v: { refus: string[] }) =>
  [...new Set(v.refus.map((x) => x.split(']')[0].replace('[', '')))]

/** Une banque minimale au cran 4 — deux cas, la paire du diagnostic. */
const banque = (casse: (b: any) => void) => {
  const b: any = {
    format: 'palimpseste/import-exercices', version: '1.1',
    exercices: [{
      id: 'x', objet: 'argument', cran: 4, genre: null, lieu: 'maison',
      modes: { expression: 'composer' },
      observable_isole: { code: 'densite_generique', competence: 'expression' },
      materiau_source: { provenance: null, support: null },
      materiau_cible: { provenance: 'genere', support: 'extrait' },
      guide: null, bonus: false,
      cas: [
        { consigne: 'a', materiau: 'mat-a', defaut: 'd', distracteurs: null, reponse_attendue: 'r' },
        { consigne: 'b', materiau: 'mat-b', defaut: 'd', distracteurs: null, reponse_attendue: 'r' },
      ],
    }],
    materiaux: ['a', 'b'].map((k) => ({
      id: `mat-${k}`, objet: 'argument', support: 'extrait', contenu: `c${k}`,
      observable: { code: 'densite_generique', competence: 'expression' },
      defaut: 'd', mode: 'composer', famille: 'f',
    })),
  }
  casse(b)
  return b
}

test('la banque de référence de ce fichier passe', () => {
  assert.deepEqual(codes(controleImport(banque(() => {}), doctrine)), [])
})

// ── `in` traverse `Object.prototype` — le port ne s'y laisse plus prendre ────
for (const piege of ['constructor', 'valueOf', 'toString', 'hasOwnProperty']) {
  test(`PROTOTYPE — un objet nommé « ${piege} » est INCONNU, et rien ne tombe`, () => {
    let v: ReturnType<typeof controleImport> | undefined
    assert.doesNotThrow(
      () => { v = controleImport(banque((b) => { b.exercices[0].objet = piege }), doctrine) },
      'le contrôle ne doit jamais tomber sur un fichier déposé')
    assert.ok(codes(v!).includes('R05'), `R05 attendu — rendus ${JSON.stringify(codes(v!))}`)
  })
}

test('PROTOTYPE — une compétence nommée « toString » est INCONNUE', () => {
  const v = controleImport(banque((b) => {
    b.demonstrations = [{ id: 'd', competence: 'toString', grain: 'micro',
      theme: 't', forme: 'exemple', corps: { texte: 'x' } }]
  }), doctrine)
  assert.ok(codes(v).includes('R05'))
})

test('PROTOTYPE — une forme de démonstration nommée « toString » est INCONNUE', () => {
  const v = controleImport(banque((b) => {
    b.demonstrations = [{ id: 'd', competence: 'argumentation', grain: 'macro',
      theme: 't', forme: 'toString', corps: { volets: [{ titre: 'a', texte: 'b' }] } }]
  }), doctrine)
  assert.ok(codes(v).includes('R05'))
  assert.ok(!v.signalements.some((s) => s.includes('native code')),
    'aucun signalement ne doit recracher le prototype')
})

// ── `[]` et `{}` sont VRAIS en JavaScript, FAUX en Python ───────────────────
const VIDES: Array<[string, (b: any) => void]> = [
  ['distracteurs: [] à un cran qui n’en sert pas', (b) => { b.exercices[0].cas[0].distracteurs = [] }],
  ['distracteurs: {} au même endroit', (b) => { b.exercices[0].cas[0].distracteurs = {} }],
  ['guide: [] à un cran sans guide', (b) => { b.exercices[0].guide = [] }],
]
for (const [nom, casse] of VIDES) {
  test(`VÉRITÉ DE PYTHON — ${nom} ne refuse rien`, () => {
    assert.ok(!codes(controleImport(banque(casse), doctrine)).includes('R12'),
      'une liste vide déclare une ABSENCE, comme en Python')
  })
}

test('VÉRITÉ DE PYTHON — bonus: [] ne signale rien', () => {
  const v = controleImport(banque((b) => { b.exercices[0].bonus = [] }), doctrine)
  assert.ok(!v.signalements.some((s) => s.includes('bonus')))
})

// ── MAL FORMÉ N'EST PAS ABSENT ──────────────────────────────────────────────
// Le vecteur de la revue : au cran 8, qui veut la cible NULLE, un
// `materiau_cible` écrit en chaîne était coercé à `null` — donc conforme au
// cran, donc aucun refus, donc « importable ». Le script qui fait foi, lui,
// s'arrêtait net. Ce qui compte n'est pas QUEL numéro sort, c'est que le
// fichier NE PASSE PLUS.
test('MAL FORMÉ — un `materiau_cible` en chaîne ne rend plus le fichier importable', () => {
  const v = controleImport(banque((b) => {
    b.exercices[0].cran = 8
    b.exercices[0].observable_isole = null
    b.exercices[0].materiau_cible = 'mat-a'
    b.exercices[0].cas = [{ consigne: 'a', materiau: null, defaut: null,
      distracteurs: null, reponse_attendue: null }]
  }), doctrine)
  assert.equal(v.code, 1, 'le fichier ne passe plus')
  assert.ok(codes(v).includes('R05'), `le matériau mal formé est nommé — rendus ${JSON.stringify(codes(v))}`)
  assert.ok(v.refus.some((x) => x.includes('materiau_cible mal formé')))
})

test('MAL FORMÉ — une entrée de banque qui n’est pas un objet se refuse', () => {
  const v = controleImport(banque((b) => { b.materiaux.push('mat-c') }), doctrine)
  assert.ok(codes(v).includes('R05'))
})

test('MAL FORMÉ — un `null` dans `moments[]` refuse la décomposition', () => {
  const v = controleReference({
    phrases: [{ n: 1, fonctions: ['explique'], statuts: ['affirme'] }],
    moments: [{ m: 'M1', de: 1, a: 1, fonction: 'pose', cible: [], statuts: [],
      etiquette: 'un deux trois quatre cinq' }, null],
    concepts: [], lectures: [],
    armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
  }, 'Une phrase.')
  assert.ok(v.refus.some((x) => x.includes("n'est pas un objet")))
})

// ── Le blocage n° 2 FORCE `validee`, et le n° 1 le lit ───────────────────────
test('BLOCAGE HÉRITÉ — une décomposition bloquée entraîne le blocage n° 1 sur l’instance', () => {
  const texte = 'Le doute porte sur tout. Rien ne résiste.'
  const v = controleImport({
    format: 'palimpseste/import-exercices', version: '1.1',
    textes: [{
      id: 'txt', auteur: 'D', titre: 'M', reference: 'II', contenu: texte,
      decomposition: {
        phrases: [{ n: 1, fonctions: ['explique'], statuts: ['affirme'] },
          { n: 2, fonctions: ['explique'], statuts: ['affirme'] }],
        // M2 est relationnel et n'a pas de cible : c'est le blocage n° 2.
        moments: [{ m: 'M1', de: 1, a: 1, fonction: 'pose', cible: [], statuts: [],
          etiquette: 'le doute porte sur toute chose' },
        { m: 'M2', de: 2, a: 2, fonction: 'refute', cible: [], statuts: [],
          etiquette: 'rien ne resiste au doute enfin' }],
        concepts: [], lectures: [],
        armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
      },
      // ⚠️ Le fichier déclare `true` — la valeur EFFECTIVE est fausse.
      validee: true,
    }],
    exercices: [{
      id: 'x', objet: 'argument', cran: 8, genre: null, lieu: 'maison',
      modes: { expression: 'composer' }, observable_isole: null,
      materiau_source: { provenance: 'texte_auteur', support: 'extrait', texte: 'txt',
        localisation: [0, 10], englobant: [0, 30] },
      materiau_cible: null, guide: null, bonus: false,
      // ⚠️ L'ÉTALON EST OBLIGATOIRE AU CRAN 8 DEPUIS LE `02-` 6.0 (§2.2, §2.3.4).
      //    Sans lui, le contrôle rend un REFUS [R12] et ce test — qui éprouve
      //    l'héritage d'un BLOCAGE, pas l'appui — échouerait pour une raison
      //    qui n'est pas la sienne.
      cas: [{ consigne: 'a', materiau: null, defaut: null, distracteurs: null,
        reponse_attendue: 'une production modèle' }],
    }],
  }, doctrine)
  const b = [...new Set(v.blocages.map((x) => x.split(']')[0].replace('[', '')))]
  assert.ok(b.includes('B2'), `B2 attendu — rendus ${JSON.stringify(v.blocages)}`)
  assert.ok(b.includes('B1'), `B1 hérité attendu — rendus ${JSON.stringify(v.blocages)}`)
  assert.deepEqual(v.refus, [], 'les deux BLOQUENT, aucun ne REFUSE')
})

// ── La segmentation et le repli, alignés sur Python ──────────────────────────
test('SEGMENTATION — NEL coupe, le BOM ne coupe pas (comme Python)', () => {
  assert.equal(phrasesDuTexte('Un.Deux.').length, 2, 'NEL est un espace pour Python')
  assert.equal(phrasesDuTexte('Un.\ufeffDeux.').length, 1, 'le BOM n’en est pas un')
})

const refConcept = (formes: string[]) => ({
  phrases: [{ n: 1, fonctions: ['explique'], statuts: ['affirme'] }],
  moments: [{ m: 'M1', de: 1, a: 1, fonction: 'pose', cible: [], statuts: [],
    etiquette: 'un deux trois quatre cinq' }],
  concepts: [{ concept: 'c', formes }], lectures: [],
  armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
})

test('REPLI — l’eszett et les ligatures se replient, comme `casefold()`', () => {
  assert.deepEqual(controleReference(refConcept(['STRASSE']), 'Die Stra\u00dfe ist lang.').refus, [],
    'STRASSE doit se retrouver dans l’eszett')
  assert.deepEqual(controleReference(refConcept(['fin']), 'La \ufb01n du doute.').refus, [],
    '« fin » doit se retrouver dans la ligature')
})

test('PHRASES EN TROP — un numéro écrit en chaîne est une phrase qui n’existe pas', () => {
  const v = controleReference({
    phrases: [{ n: 1, fonctions: ['explique'], statuts: ['affirme'] },
      { n: '2', fonctions: ['explique'], statuts: ['affirme'] }],
    moments: [{ m: 'M1', de: 1, a: 1, fonction: 'pose', cible: [], statuts: [],
      etiquette: 'un deux trois quatre cinq' }],
    concepts: [], lectures: [],
    armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
  }, 'Une phrase.')
  assert.ok(v.refus.some((x) => x.includes("n'existent pas")))
})

// ── La famille, dont le libellé est LIBRE ────────────────────────────────────
test('FAMILLE — un libellé qui porte une barre verticale ne fusionne pas deux familles', () => {
  const v = controleImport(banque((b) => {
    b.materiaux[0].famille = 'a|b'
    b.materiaux[1].famille = 'a'
    b.materiaux.push({ id: 'mat-c', objet: 'argument', support: 'extrait', contenu: 'cc',
      observable: { code: 'densite_generique', competence: 'expression' },
      defaut: 'd', mode: 'composer', famille: 'b' })
  }), doctrine)
  assert.equal(v.signalements.filter((s) => s.includes('un seul membre')).length, 3,
    'trois familles d’un seul membre, pas moins')
})


// ============================================================================
// SECONDE REVUE ADVERSARIALE (21/08) - l'execution differentielle.
// ----------------------------------------------------------------------------
// Les vecteurs ci-dessus venaient d'une revue a l'oeil. Ceux-ci viennent d'un
// HARNAIS qui a joue 1 594 charges et 571 couples dans le Python ET dans ce
// port, puis compare verdict par verdict. Chacun ferme une divergence CONSTATEE
// a l'execution, pas supposee a la lecture.
//
// LES CARACTERES EN CAUSE SONT INVISIBLES. On les construit donc par leur point
// de code, jamais en les collant : un BOM tape au clavier dans ce fichier ne se
// verrait pas, et un editeur zele le deplacerait sans que rien ne le dise.
// ============================================================================

const CAR = (...points: number[]) => String.fromCharCode(...points)
const NEL = CAR(0x85)             // le blanc de Python que trim() ignore
const BOM = CAR(0xfeff)           // le blanc de trim() que Python garde
const NBSP = CAR(0xa0)
const ELLIPSE = CAR(0x2026)
const EXPOSANT_2 = CAR(0xb2)
const ESZETT_CAPITAL = CAR(0x1e9e)
const LIGATURE_FI = CAR(0xfb01)
const LOGOS_CAPITALES = CAR(0x39b, 0x39f, 0x393, 0x39f, 0x3a3)
const LOGOS_PLIE = CAR(0x3bb, 0x3bf, 0x3b3, 0x3bf, 0x3c3)  // sigma NON final

/** Une reference minimale sur un texte d'une phrase, avec ses concepts. */
const verdictConcept = (texte: string, formes: string[]) => controleReference({
  phrases: [{ n: 1, fonctions: ['explique'], statuts: ['affirme'] }],
  moments: [{ m: 'M1', de: 1, a: 1, fonction: 'pose', cible: [], statuts: [],
    etiquette: 'un deux trois quatre cinq' }],
  concepts: [{ concept: 'C', formes }], lectures: [],
  armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
}, texte)

const introuvable = (v: { refus: string[] }) =>
  v.refus.some((x) => x.includes('ne se retrouve dans le texte'))

/** Une reference minimale dont on ne fait varier que la these. */
const refThese = (these: string) => controleReference({
  phrases: [{ n: 1, fonctions: ['explique'], statuts: ['affirme'] }],
  moments: [{ m: 'M1', de: 1, a: 1, fonction: 'pose', cible: [], statuts: [],
    etiquette: 'un deux trois quatre cinq' }],
  concepts: [], lectures: [],
  armature: { question_directrice: 'Quoi ?', these, these_phrases: [] },
}, 'Une phrase.')

// -- La coercion muette : le SEUL ecart ou une donnee fausse entrait ---------
test('LISTE RACINE - une banque ecrite en chaine est REFUSEE, jamais videe en silence', () => {
  const v = controleImport({
    format: 'palimpseste/import-exercices', version: '1.1', exercices: 'x',
  } as any, doctrine)
  assert.ok(v.refus.some((x) => x.includes("n'est pas une liste")),
    'le port la declarait IMPORTABLE avec zero refus, et l ecrivain n ecrivait rien')
})

test('LISTE RACINE - absente, null ou [] reste legitime : le `or []` les confond', () => {
  for (const valeur of [undefined, null, [] as unknown[]]) {
    const b: any = { format: 'palimpseste/import-exercices', version: '1.1' }
    if (valeur !== undefined) b.textes = valeur
    const v = controleImport(b, doctrine)
    assert.equal(v.refus.filter((x) => x.includes("n'est pas une liste")).length, 0,
      `une banque n'est pas tenue de porter les cinq listes (${JSON.stringify(valeur)})`)
  }
})

// -- declare() la ou il manquait encore -------------------------------------
test('GENRE - [] est FAUX en Python : un objet qui n en porte pas ne se refuse pas', () => {
  const v = controleImport(banque((b) => { b.exercices[0].genre = [] }), doctrine)
  assert.equal(v.refus.filter((x) => x.includes('`genre` non nul')).length, 0,
    'argument ne porte pas de genre ; genre: [] bloquait le professeur a tort')
})

// -- Le repli : NFD, et l ORDRE des operations ------------------------------
test('PLIE - NFD et non NFKD : l insecable ne se replie PAS sur l espace', () => {
  assert.ok(introuvable(verdictConcept(`a${NBSP}b.`, ['a b'])),
    'NFKD rabattait l insecable sur l espace ; casefold() n en fait rien')
})

test('PLIE - NFD et non NFKD : ni l ellipse ni l exposant ne se rabattent', () => {
  assert.ok(introuvable(verdictConcept(`a${ELLIPSE}`, ['a...'])), 'U+2026 n est pas trois points')
  assert.ok(introuvable(verdictConcept(`x${EXPOSANT_2}.`, ['x2'])), 'l exposant n est pas le chiffre')
})

test('PLIE - l eszett CAPITAL (U+1E9E) vaut ss, comme casefold()', () => {
  assert.ok(!introuvable(verdictConcept(`A${ESZETT_CAPITAL}.`, ['ass'])),
    'replier l eszett AVANT toLowerCase() le laissait devenir un eszett minuscule : '
    + 'le refus n 10 se declenchait a tort et GELAIT la validation d une reference corrigee')
})

test('PLIE - le sigma final vaut le sigma', () => {
  assert.ok(!introuvable(verdictConcept(`${LOGOS_CAPITALES}.`, [LOGOS_PLIE])),
    'toLowerCase() applique la regle Final_Sigma ; casefold() non')
})

test('PLIE - les ligatures latines se deplient, comme casefold()', () => {
  assert.ok(!introuvable(verdictConcept(`${LIGATURE_FI}n.`, ['fin'])), 'U+FB01 vaut fi')
})

// -- str.strip() n est pas String.trim() ------------------------------------
test('ROGNE - le NEL EST du blanc pour Python : une these reduite a U+0085 est VIDE', () => {
  assert.ok(refThese(NEL).refus.some((x) => x.includes('vide')),
    'trim() ignore U+0085 ; str.strip() le retire')
})

test('ROGNE - le BOM n est PAS du blanc pour Python : une these reduite au BOM est PLEINE', () => {
  assert.equal(refThese(BOM).refus.filter((x) => x.includes('vide')).length, 0,
    'trim() retirait le BOM que Python garde')
})

// -- La segmentation, qui LOCALISE un exercice dans le texte -----------------
test('SEGMENTATION - un BOM en queue ne fait pas disparaitre une phrase', () => {
  assert.equal(phrasesDuTexte(`A. ${BOM}`).length, 2,
    'Python garde le BOM : deux phrases. trim() n en rendait qu une.')
})

test('SEGMENTATION - U+001C a U+001F et U+0085 sont du blanc pour Python', () => {
  for (const point of [0x1c, 0x1d, 0x1e, 0x1f, 0x85]) {
    assert.deepEqual(phrasesDuTexte(`${CAR(point)}Une phrase. Une autre.`),
      ['Une phrase.', 'Une autre.'],
      `U+${point.toString(16).padStart(4, '0').toUpperCase()} doit se rogner`)
  }
})

// -- Les messages qui nomment la mauvaise chose au professeur ----------------
test('DOUBLONS - le tri est NUMERIQUE : [3,10], jamais [10,3]', () => {
  const phrases = [3, 3, 10, 10].map((n) => ({ n, fonctions: ['explique'], statuts: ['affirme'] }))
  const v = controleReference({
    phrases, moments: [], concepts: [], lectures: [],
    armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
  }, 'Un. Deux. Trois. Quatre. Cinq. Six. Sept. Huit. Neuf. Dix.')
  const m = v.refus.find((x) => x.includes('deux fois'))
  assert.ok(m && m.includes('[3,10]'), `tri lexicographique : ${m}`)
})

test('INDEX PAR DEFAUT - n: null n est pas une cle absente', () => {
  const v = controleReference({
    phrases: [{ n: null, inconnue: 1 } as any],
    moments: [], concepts: [], lectures: [],
    armature: { question_directrice: 'Quoi ?', these: 'x', these_phrases: [] },
  }, 'Une phrase.')
  assert.ok(v.refus.some((x) => x.includes('phrase null')),
    'le ?? substituait l index sur null ; p.get("n", i) ne le fait que si la cle manque')
})
