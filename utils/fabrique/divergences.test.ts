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
      cas: [{ consigne: 'a', materiau: null, defaut: null, distracteurs: null,
        reponse_attendue: null }],
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
