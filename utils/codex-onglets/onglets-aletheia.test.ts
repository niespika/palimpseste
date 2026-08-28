import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULES, ongletActifParRoute, sousOngletsPour, type SousOnglet,
} from '../../components/nav/configModules'
import { atelierDUnFormatif, hrefDeLaPassationProf, hrefDuDeroule } from './regles'

// ============================================================================
// C5 · L4 — LES DEUX BARRES D'ONGLETS D'ALETHEIA, TENUES PAR UN TEST.
// ----------------------------------------------------------------------------
// Le jumeau d'`onglets.test.ts` (C4-L6), pour l'autre atelier — et il a UN PIÈGE
// DE PLUS, qui n'existe pas chez Codex :
//
// ⚠️⚠️ `app/eleve/modules/aletheia/[livreId]/` EST UN SEGMENT DYNAMIQUE À LA
//    RACINE DU MODULE, au même niveau que `exercice/`, `passation/`,
//    `exercices/` et `examens/`. Une séance de lecture est
//    `/eleve/modules/aletheia/<uuid>/<n>` : AUCUN préfixe statique ne la décrit,
//    et elle ne peut être servie que par le plus COURT — celui de la racine.
//    C'est ce qui rend l'ordre de Louis (Livres en tête, gardant la racine)
//    techniquement le plus sûr, et c'est ce que les tests ci-dessous prouvent.
//
// ⚠️ SINGULIER / PLURIEL À UN CARACTÈRE PRÈS : `…/exercice/<id>` (le déroulé de
//    C5-L2) et `…/exercices` (l'onglet). Le test qui les sépare est le plus
//    important du fichier — `ongletActifParRoute` s'en sort, mais rien ne le
//    disait avant lui.
//
// ⚠️ Il lit la config RÉELLE (`components/nav/configModules.ts`), jamais une
//    copie : une liste recopiée ici divergerait au premier onglet ajouté.
// ============================================================================

const aletheia = MODULES.find((m) => m.cle === 'aletheia')!
const prof = sousOngletsPour(aletheia, 'prof')
const eleve = sousOngletsPour(aletheia, 'eleve')

const labelDe = (onglets: SousOnglet[], href: string | null) =>
  onglets.find((o) => o.href === href)?.label ?? null

describe('la barre du professeur — TROIS onglets, dans cet ordre', () => {
  test('⭐ Livres · Exercices · Paramètres — l’onglet qui garde la RACINE vient en tête', () => {
    assert.deepEqual(prof.map((o) => o.label), ['Livres', 'Exercices', 'Paramètres'])
    // Décision de Louis, 27/08 : arriver par « Modules → Aletheia » allume le
    // PREMIER onglet, comme chez Codex et chez Quazian.
    assert.equal(prof[0].href, '/prof/aletheia')
  })

  test('⛔ « Classe » a disparu de la barre — l’onglet s’appelle Livres', () => {
    assert.equal(prof.some((o) => o.label === 'Classe'), false)
    // ⛔ Et « Diagnostic » n'est PAS un quatrième onglet : la trajectoire E→A
    //    vit SOUS Livres, avec ce qu'elle décrit (`AGENTS.md`, 2-3 onglets).
    assert.equal(prof.some((o) => o.label === 'Diagnostic'), false)
  })

  test('⭐ les deux écrans de détail de la lecture allument EXERCICES', () => {
    for (const route of [
      '/prof/aletheia/exercices',
      '/prof/aletheia/passation/ex-1',
      '/prof/aletheia/examen-diagnostique/lp-1',
    ]) {
      assert.equal(labelDe(prof, ongletActifParRoute(prof, route)), 'Exercices', route)
    }
  })

  test('⭐ la RACINE et la fiche d’un élève allument LIVRES', () => {
    // ⚠️ `…/eleve/<id>` n'a PAS de préfixe déclaré, et c'est voulu : l'onglet
    //    racine l'attrape (le plus long préfixe qui matche est `/prof/aletheia`).
    for (const route of ['/prof/aletheia', '/prof/aletheia?classe=c1', '/prof/aletheia/eleve/e1']) {
      const chemin = route.split('?')[0]
      assert.equal(labelDe(prof, ongletActifParRoute(prof, chemin)), 'Livres', route)
    }
  })

  test('⚠️ `/prof/aletheia/parametres` va bien à Paramètres — le plus long préfixe gagne', () => {
    assert.equal(labelDe(prof, ongletActifParRoute(prof, '/prof/aletheia/parametres')), 'Paramètres')
  })
})

describe("la barre de l'élève — Livres · Exercices · Examens", () => {
  test('⭐ trois onglets, Livres en tête, et il garde la racine', () => {
    assert.deepEqual(eleve.map((o) => o.label), ['Livres', 'Exercices', 'Examens'])
    assert.equal(eleve[0].href, '/eleve/modules/aletheia')
  })

  test('⛔ pas de « Paramètres » côté élève — il n’existe dans aucun module', () => {
    assert.equal(eleve.some((o) => o.label === 'Paramètres'), false)
  })

  test('⚠️⚠️ UNE SÉANCE DE LECTURE ALLUME LIVRES — le segment dynamique de la racine', () => {
    // `/eleve/modules/aletheia/<uuid>/<n>` : aucun préfixe statique ne la
    // décrit. Seul le plus COURT — la racine — peut la servir, et c'est Livres.
    for (const route of [
      '/eleve/modules/aletheia',
      '/eleve/modules/aletheia/3f2504e0-4f89-11d3-9a0c-0305e82c3301/3',
      '/eleve/modules/aletheia/3f2504e0-4f89-11d3-9a0c-0305e82c3301/capstone',
    ]) {
      assert.equal(labelDe(eleve, ongletActifParRoute(eleve, route)), 'Livres', route)
    }
  })

  test('⭐ ce qui se fait À LA MAISON allume Exercices (`06-` §1)', () => {
    for (const route of [
      '/eleve/modules/aletheia/exercices',
      '/eleve/modules/aletheia/exercice/d1',
    ]) {
      assert.equal(labelDe(eleve, ongletActifParRoute(eleve, route)), 'Exercices', route)
    }
  })

  test('⭐ ce qui se passe EN CLASSE allume Examens (`06-` §1 ; `01-` §10)', () => {
    for (const route of [
      '/eleve/modules/aletheia/examens',
      '/eleve/modules/aletheia/passation/d1',
    ]) {
      assert.equal(labelDe(eleve, ongletActifParRoute(eleve, route)), 'Examens', route)
    }
  })

  test('⚠️⚠️ SINGULIER ≠ PLURIEL : `…/exercice/<id>` et `…/exercices` ne se confondent pas', () => {
    // Les deux chaînes sont à UNE LETTRE l'une de l'autre. `ongletActifParRoute`
    // compare par `===` puis `startsWith(base + '/')` : le caractère qui suit
    // `…/exercice` dans `…/exercices` est `s`, pas `/` — donc pas de match.
    // Ce test est ce qui empêche un correctif futur de les rapprocher.
    const onglet = ongletActifParRoute(eleve, '/eleve/modules/aletheia/exercices')
    const deroule = ongletActifParRoute(eleve, '/eleve/modules/aletheia/exercice/d1')
    assert.equal(onglet, '/eleve/modules/aletheia/exercices')
    assert.equal(deroule, '/eleve/modules/aletheia/exercices')
    // ⭐ Les deux allument le MÊME onglet — c'est le but —, mais par des chemins
    //    différents : l'un par `href`, l'autre par `prefixes[0]`.
    assert.deepEqual(eleve[1].prefixes, ['/eleve/modules/aletheia/exercice'])
    // ⛔ Et surtout : le pluriel ne tombe PAS sur la racine par accident.
    assert.notEqual(onglet, '/eleve/modules/aletheia')
  })

  test('⚠️ un livre dont l’identifiant commencerait par « exercice » n’existe pas — UUID', () => {
    // Garde-fou de lecture : le seul cas où le pluriel/singulier ferait un dégât
    // est un `livreId` littéralement égal à `exercices` ou `examens`. Les
    // identifiants sont des UUID — la collision est impossible, et Next servirait
    // de toute façon la route STATIQUE.
    for (const mot of ['exercices', 'examens', 'exercice', 'passation']) {
      assert.equal(/^[0-9a-f]{8}-/.test(mot), false)
    }
  })
})

describe('les deux mécaniques ne se mélangent pas', () => {
  test('Aletheia est piloté par la ROUTE des deux côtés — aucun `vue`', () => {
    // `SousNavModuleMobile` choisit l'une ou l'autre par `onglets.some(o => !!o.vue)` :
    // une liste qui mélange les deux se comporte de travers, et `vueDefaut`
    // allumerait « Livres » au-dessus d'une passation en classe.
    assert.equal([...prof, ...eleve].some((o) => !!o.vue), false)
    assert.equal([...prof, ...eleve].some((o) => !!o.vues), false)
  })

  test('aucun href d’Aletheia ne porte de paramètre de requête', () => {
    for (const o of [...prof, ...eleve]) assert.equal(o.href.includes('?'), false, o.href)
  })

  test('⭐ les onze routes du module tombent toutes sur un onglet — aucune orpheline', () => {
    const routes: Array<[string, SousOnglet[], string]> = [
      ['/prof/aletheia', prof, 'Livres'],
      ['/prof/aletheia/eleve/e1', prof, 'Livres'],
      ['/prof/aletheia/exercices', prof, 'Exercices'],
      ['/prof/aletheia/passation/ex1', prof, 'Exercices'],
      ['/prof/aletheia/examen-diagnostique/lp1', prof, 'Exercices'],
      ['/prof/aletheia/parametres', prof, 'Paramètres'],
      ['/eleve/modules/aletheia', eleve, 'Livres'],
      ['/eleve/modules/aletheia/l1/2', eleve, 'Livres'],
      ['/eleve/modules/aletheia/l1/capstone', eleve, 'Livres'],
      ['/eleve/modules/aletheia/exercices', eleve, 'Exercices'],
      ['/eleve/modules/aletheia/exercice/d1', eleve, 'Exercices'],
      ['/eleve/modules/aletheia/examens', eleve, 'Examens'],
      ['/eleve/modules/aletheia/passation/d1', eleve, 'Examens'],
    ]
    for (const [route, onglets, attendu] of routes) {
      const actif = ongletActifParRoute(onglets, route)
      assert.notEqual(actif, null, `${route} n’allume AUCUN onglet`)
      assert.equal(labelDe(onglets, actif), attendu, route)
    }
  })
})

// ============================================================================
// ⭐ LA PASSATION EN CLASSE, CÔTÉ PROFESSEUR — une fonction, deux routes.
// ----------------------------------------------------------------------------
// Le pendant de `hrefDuDeroule` (C5-L2) de l'autre côté de l'écran : la liste de
// l'onglet Exercices sert les deux ateliers, et son `href` suit l'atelier.
// ============================================================================

describe('C5-L4 — deux ateliers, deux portes, un seul prédicat (côté professeur)', () => {
  test('⭐ chaque atelier a SA route de passation, et elles ne se recouvrent pas', () => {
    assert.equal(hrefDeLaPassationProf('codex', 'ex-1'), '/prof/codex/passation/ex-1')
    assert.equal(hrefDeLaPassationProf('aletheia', 'ex-1'), '/prof/aletheia/passation/ex-1')
    assert.notEqual(hrefDeLaPassationProf('codex', 'x'), hrefDeLaPassationProf('aletheia', 'x'))
  })

  test('⭐ le href rendu est SERVI par une route, et il allume le bon onglet', () => {
    // La preuve que la liste ne fabrique pas une adresse morte : ce qu'elle rend
    // tombe sur l'onglet Exercices du module qu'elle vise.
    const codex = MODULES.find((m) => m.cle === 'codex')!
    const profCodex = sousOngletsPour(codex, 'prof')
    assert.equal(
      labelDe(profCodex, ongletActifParRoute(profCodex, hrefDeLaPassationProf('codex', 'x'))),
      'Exercices')
    assert.equal(
      labelDe(prof, ongletActifParRoute(prof, hrefDeLaPassationProf('aletheia', 'x'))),
      'Exercices')
  })

  test('⛔ aucune des deux routes ne porte de paramètre de requête', () => {
    for (const a of ['codex', 'aletheia'] as const) {
      assert.equal(hrefDeLaPassationProf(a, 'ex').includes('?'), false)
    }
  })

  test('⚠️ l’atelier d’un FORMATIF suit le mode — et l’onglet suit l’atelier', () => {
    // La règle du `01-` §2, celle qui ne s'applique QU'À DÉFAUT de ligne de plan
    // (`passationsDeClasse` teste la ligne de plan D'ABORD, et ne s'inverse pas).
    assert.equal(atelierDUnFormatif({ expression: ['composer'] }), 'codex')
    assert.equal(atelierDUnFormatif({ structure: ['expliquer'] }), 'aletheia')
    assert.equal(hrefDuDeroule(atelierDUnFormatif({ synthese: ['restituer'] }), 'd'),
      '/eleve/modules/aletheia/exercice/d')
  })
})
