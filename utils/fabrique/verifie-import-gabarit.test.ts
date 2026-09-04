/* eslint-disable @typescript-eslint/no-explicit-any -- Les vecteurs sont du JSON malformé à dessein. */
// ============================================================================
// C7 · L2 — LE FORMAT 1.5 AU CONTRÔLE D'IMPORT (`08-` §5 et §7.4 amendés le 03/09).
// La doctrine vient de la fixture dérivée — la grille du `09-` comprise.
// ============================================================================
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { assemblerDoctrine, type LignesDoctrine } from './doctrine'
import { controleImport } from './verifie-import'

const FIXTURE = path.join(process.cwd(), 'utils', 'fabrique', 'doctrine.fixture.json')
const lignes = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as LignesDoctrine
const doctrine = assemblerDoctrine(lignes)

// Une clé d'`argument` routée, avec son observable — la fixture les porte.
const P = Object.values(doctrine.problemes).find((p) => p.objet === 'argument' && p.observableRoute && p.observableCode)!
const P2 = Object.values(doctrine.problemes).find((p) => p.objet === 'argument' && p.cle !== P.cle && p.observableRoute && p.observableCode)!
const P_MOT = Object.values(doctrine.problemes).find((p) => p.objet === 'mot')!
const P_PARTIE = Object.values(doctrine.problemes).find((p) => p.objet === 'partie')!
const OBS = { code: P.observableCode!, competence: P.observableCompetence! }

const banque = () => JSON.parse(JSON.stringify({
  format: 'palimpseste/import-exercices', version: '1.5',
  genere_le: '2026-09-03', genere_par: 'test',
  sujets: [{ id: 'suj-doute', enonce: 'Peut-on douter de tout ?', forme: 'dissertation_tc', notions: ['la vérité'] }],
  materiaux: [
    { id: 'mat-a', objet: 'argument', support: 'extrait', contenu: 'Un argument fabriqué, premier cas.',
      observable: OBS, defaut: 'le garant manque', version_corrigee: '…', mode: 'composer', famille: 'f' },
    { id: 'mat-b', objet: 'argument', support: 'extrait', contenu: 'Un argument fabriqué, second cas.',
      observable: OBS, defaut: 'le garant manque', version_corrigee: '…', mode: 'composer', famille: 'f' },
  ],
  exercices: [{
    id: 'ex-a', objet: 'argument', cran: 4, variante: 'a', genre: null, lieu: 'maison',
    modes: { argumentation: 'composer', expression: 'composer' },
    materiau_source: { provenance: 'sujet', support: null, sujet: 'suj-doute' },
    materiau_cible: { provenance: 'genere', support: 'extrait' },
    guide: null, bonus: false,
    cas: [
      { materiau: 'mat-a', probleme: P.cle, defaut: 'le garant manque', distracteurs: null,
        reponse_attendue: 'le lien entre la preuve et la conclusion' },
      { materiau: 'mat-b', probleme: P.cle, defaut: 'le garant manque', distracteurs: null,
        reponse_attendue: 'le lien, encore' },
    ],
  }],
}))
type B = Record<string, any>
const casse = (f: (b: B) => void): B => { const b = banque(); f(b); return b }
const codes = (xs: string[]) => new Set(xs.map((x) => x.split(']')[0].replace('[', '')))
const aRefus = (v: { refus: string[] }, n: number) => codes(v.refus).has(`R${String(n).padStart(2, '0')}`)
const contient = (xs: string[], f: string) => xs.some((x) => x.includes(f))

test('la fixture porte la grille du 09-, ses tests, ses pièces et le marquage du gabarit', () => {
  assert.ok(Object.keys(doctrine.problemes).length >= 200)
  assert.ok(P && P2 && P_MOT && P_PARTIE)
  assert.ok(Object.keys(doctrine.tests).length >= 20)
  assert.ok(Object.keys(doctrine.pieces).length >= 20)
  assert.equal(doctrine.marquageGabarit['4|a'], 'le passage qui porte le problème')
  assert.equal(doctrine.marquageGabarit['4|b'], null)
  assert.equal(doctrine.marquageGabarit['2|-'], null)
  assert.deepEqual(doctrine.lacunes, [])
})

test('un fichier 1.5 conforme passe SANS consigne, et l’observable isolé se dérive de la clé', () => {
  const v = controleImport(banque(), doctrine)
  assert.equal(v.code, 0, v.refus.join('\n'))
  assert.equal(contient(v.signalements, 'consigne'), false)
})

test('la variante suit le cran : exigée aux 1 et 4, refusée ailleurs', () => {
  assert.ok(aRefus(controleImport(casse((b) => { delete b.exercices[0].variante }), doctrine), 12))
  assert.ok(aRefus(controleImport(casse((b) => { b.exercices[0].variante = 'c' }), doctrine), 12))
  const v = controleImport(casse((b) => {
    const e = b.exercices[0]; e.cran = 5; e.cas = [e.cas[0]]
  }), doctrine)
  assert.ok(aRefus(v, 12) && contient(v.refus, "n'a pas de variante"))
})

test('la clé du problème : exigée où le cran isole, connue de la grille, portable par le grain', () => {
  assert.ok(aRefus(controleImport(casse((b) => { delete b.exercices[0].cas[0].probleme }), doctrine), 12))
  const inconnue = controleImport(casse((b) => { b.exercices[0].cas[0].probleme = 'argument.x.y' }), doctrine)
  assert.ok(aRefus(inconnue, 15) && contient(inconnue.refus, 'inconnu de la grille'))
  // Un problème de `mot` vaut dans un argument (contenu, grain plus fin)…
  const mot = controleImport(casse((b) => { b.exercices[0].cas[0].probleme = P_MOT.cle }), doctrine)
  assert.equal(contient(mot.refus, 'porte sur'), false, mot.refus.join('\n'))
  // …un problème de `partie` n'y vaut pas.
  const partie = controleImport(casse((b) => { b.exercices[0].cas[0].probleme = P_PARTIE.cle }), doctrine)
  assert.ok(aRefus(partie, 15) && contient(partie.refus, 'porte sur'))
})

test('un observable déclaré qui diffère de celui de la clé se SIGNALE, et la clé fait foi', () => {
  const v = controleImport(casse((b) => {
    b.exercices[0].observable_isole = { code: P2.observableCode, competence: P2.observableCompetence }
  }), doctrine)
  assert.ok(contient(v.signalements, 'diffère de celui que la clé'))
  assert.equal(aRefus(v, 15), false, v.refus.join('\n'))
})

test('au 1(a) les distracteurs sont des clés ; au 1(b) des devoirs d’élève', () => {
  const un = (variante: 'a' | 'b', dis: unknown[]) => casse((b) => {
    const e = b.exercices[0]; e.cran = 1; e.variante = variante
    for (const c of e.cas) { c.distracteurs = dis; c.pourquoi_juste = 'parce que' }
  })
  const clesOk = controleImport(un('a', [P2.cle, P_MOT.cle, P.cle]), doctrine)
  assert.equal(aRefus(clesOk, 13), false, clesOk.refus.join('\n'))
  const textes = controleImport(un('a', [{ texte: 'x', pourquoi_faux: 'y' }, { texte: 'z' }, { texte: 'w' }]), doctrine)
  assert.ok(aRefus(textes, 13) && contient(textes.refus, 'une clé de la grille'))
  const devoirs = controleImport(un('b', ['mat-a', 'mat-b', 'mat-b']), doctrine)
  assert.equal(aRefus(devoirs, 13), false, devoirs.refus.join('\n'))
  const inconnus = controleImport(un('b', ['mat-a', 'mat-z', 'mat-b']), doctrine)
  assert.ok(aRefus(inconnus, 13) && contient(inconnus.refus, "devoir d'élève"))
})

test('le cran 2 exige un constituant et des pièces nommées, et perd son guide', () => {
  const deux = (f: (e: any) => void) => casse((b) => {
    const e = b.exercices[0]
    e.cran = 2; delete e.variante; e.materiau_cible = null; e.guide = null
    e.cas = [{ materiau: null, defaut: null, distracteurs: null, constituant: 'le garant',
      pieces: [{ nom: 'la conclusion', texte: '…' }, { nom: 'la preuve', texte: '…' }],
      reponse_attendue: 'la pièce attendue' }]
    b.materiaux = []
    f(e)
  })
  const ok = controleImport(deux(() => {}), doctrine)
  assert.equal(ok.code, 0, ok.refus.join('\n'))
  assert.ok(aRefus(controleImport(deux((e) => { delete e.cas[0].constituant }), doctrine), 12))
  assert.ok(aRefus(controleImport(deux((e) => { e.cas[0].pieces = [] }), doctrine), 12))
  assert.ok(aRefus(controleImport(deux((e) => { e.cas[0].pieces = [{ nom: 'x' }] }), doctrine), 12))
  assert.ok(aRefus(controleImport(deux((e) => { e.cas[0].pieces = [{ nom: 'x', texte: 'y', z: 1 }] }), doctrine), 2))
  assert.ok(aRefus(controleImport(deux((e) => { e.guide = 'un guide' }), doctrine), 12))
  // et hors du cran 2, constituant et pièces sont refusés
  assert.ok(aRefus(controleImport(casse((b) => { b.exercices[0].cas[0].constituant = 'x' }), doctrine), 12))
})

test('la réponse attendue n’est jamais nulle au 1.5, là où la 1.4 se contentait de signaler', () => {
  const sept = (version: string) => casse((b) => {
    b.version = version
    const e = b.exercices[0]; e.cran = 7; delete e.variante; e.cas = [e.cas[0]]
    e.cas[0].reponse_attendue = null
    if (version === '1.4') { e.cas[0].consigne = 'Corrige.'; delete e.cas[0].probleme }
  })
  const v15 = controleImport(sept('1.5'), doctrine)
  assert.ok(aRefus(v15, 12) && contient(v15.refus, 'jamais nulle'))
  const v14 = controleImport(sept('1.4'), doctrine)
  assert.equal(contient(v14.refus, 'jamais nulle'), false)
  assert.ok(contient(v14.signalements, 'reponse_attendue'))
})

test('au cran 6 le guide est nul ; une consigne au 1.5 se signale, jamais ne se refuse', () => {
  const six = controleImport(casse((b) => {
    const e = b.exercices[0]; e.cran = 6; delete e.variante; e.materiau_cible = null; e.guide = 'un appui'
    e.cas = [{ materiau: null, defaut: null, distracteurs: null, reponse_attendue: 'un étalon' }]
    b.materiaux = []
  }), doctrine)
  assert.ok(aRefus(six, 12) && contient(six.refus, 'cran 6'))
  const consigne = controleImport(casse((b) => { b.exercices[0].cas[0].consigne = 'Trouve.' }), doctrine)
  assert.equal(consigne.code, 0, consigne.refus.join('\n'))
  assert.ok(contient(consigne.signalements, 'consigne'))
})

test('un fichier d’avant le 1.5 ne voit rien changer : les champs du gabarit s’ignorent et se signalent', () => {
  const v = controleImport(casse((b) => {
    b.version = '1.4'
    b.exercices[0].observable_isole = OBS
    for (const c of b.exercices[0].cas) c.consigne = 'Ici la raison manque. Dis où.'
  }), doctrine)
  assert.equal(v.code, 0, v.refus.join('\n'))
  assert.ok(contient(v.signalements, 'variante'))
  assert.ok(contient(v.signalements, 'pas au format 1.5'))
})
