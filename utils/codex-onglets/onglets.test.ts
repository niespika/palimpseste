import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  MODULES, ongletActifParRoute, sousOngletsPour, type SousOnglet,
} from '../../components/nav/configModules'
import { atelierDUnFormatif, hrefDuDeroule } from './regles'

// ============================================================================
// C4 · L6 — LES DEUX BARRES D'ONGLETS DE CODEX, TENUES PAR UN TEST.
// ----------------------------------------------------------------------------
// « Sans `prefixes[]`, un écran de détail allume le mauvais onglet » — et
// l'utilisateur voit l'onglet SAUTER en cliquant une ligne de sa propre liste.
// Ce test énumère les TREIZE routes de Codex et dit, pour chacune, quel onglet
// s'allume. Il tient aussi la règle de départage : `ongletActifParRoute` compare
// sur `href.split('?')[0]` et LE PLUS LONG PRÉFIXE GAGNE.
//
// ⚠️ Il lit la config RÉELLE (`components/nav/configModules.ts`), jamais une
//    copie : une liste recopiée ici divergerait au premier onglet ajouté.
// ============================================================================

const codex = MODULES.find((m) => m.cle === 'codex')!
const prof = sousOngletsPour(codex, 'prof')
const eleve = sousOngletsPour(codex, 'eleve')

const labelDe = (onglets: SousOnglet[], href: string | null) =>
  onglets.find((o) => o.href === href)?.label ?? null

describe('la barre du professeur — DEUX onglets, et deux seulement', () => {
  test('« un module = 2-3 onglets » : Exercices et Paramètres', () => {
    assert.deepEqual(prof.map((o) => o.label), ['Exercices', 'Paramètres'])
  })

  test('« Validation » n’est plus un onglet — sa file reste un écran', () => {
    assert.equal(prof.some((o) => o.label === 'Validation'), false)
    // Et « Synthèses » disparaît avec l'onglet (`01-` §10 : la chose s'appelle
    // « la synthèse en classe », l'onglet s'appelle Exercices).
    assert.equal(prof.some((o) => o.label === 'Synthèses'), false)
  })

  test('⭐ les cinq routes filles allument EXERCICES, pas l’onglet racine par accident', () => {
    for (const route of [
      '/prof/codex',
      '/prof/codex/synthese/abc',
      '/prof/codex/validation',
      '/prof/codex/validation/abc',
      '/prof/codex/travail/abc/v1',
      '/prof/codex/passation/abc',
      '/prof/codex/examen-diagnostique/abc',
    ]) {
      assert.equal(labelDe(prof, ongletActifParRoute(prof, route)), 'Exercices', route)
    }
  })

  test('⭐ le parcours de revue tient BOUT À BOUT sous le même onglet', () => {
    // liste → la séance → la V1 d'un élève → le retour, l'édition, la publication.
    const parcours = ['/prof/codex', '/prof/codex/synthese/s1',
      '/prof/codex/travail/t1/v1', '/prof/codex/validation/t1']
    const allumes = parcours.map((r) => labelDe(prof, ongletActifParRoute(prof, r)))
    assert.deepEqual(allumes, ['Exercices', 'Exercices', 'Exercices', 'Exercices'])
  })

  test('⚠️ `/prof/codex/parametres` va bien à Paramètres — le plus long préfixe gagne', () => {
    assert.equal(labelDe(prof, ongletActifParRoute(prof, '/prof/codex/parametres')), 'Paramètres')
    assert.equal(labelDe(prof, ongletActifParRoute(prof, '/prof/codex')), 'Exercices')
  })
})

describe("la barre de l'élève — Exercices et Examens", () => {
  test('Codex a désormais des sous-onglets élève (ils n’existaient pas)', () => {
    assert.deepEqual(eleve.map((o) => o.label), ['Exercices', 'Examens'])
  })

  test('⭐ ce qui se fait À LA MAISON allume Exercices (`06-` §1)', () => {
    for (const route of ['/eleve/modules/codex', '/eleve/modules/codex/exercice/d1']) {
      assert.equal(labelDe(eleve, ongletActifParRoute(eleve, route)), 'Exercices', route)
    }
  })

  test('⭐ ce qui se rédige EN CLASSE allume Examens (`06-` §1 ; `01-` §10)', () => {
    for (const route of [
      '/eleve/modules/codex/examens',
      '/eleve/modules/codex/passation/d1',
      '/eleve/modules/codex/synthese/s1',
    ]) {
      assert.equal(labelDe(eleve, ongletActifParRoute(eleve, route)), 'Examens', route)
    }
  })
})

describe('les deux mécaniques ne se mélangent pas', () => {
  test('Codex est piloté par la ROUTE des deux côtés — aucun `vue`', () => {
    // `SousNavModuleMobile` choisit l'une ou l'autre par `onglets.some(o => !!o.vue)` :
    // une liste qui mélange les deux se comporte de travers.
    assert.equal([...prof, ...eleve].some((o) => !!o.vue), false)
    assert.equal([...prof, ...eleve].some((o) => !!o.vues), false)
  })

  test('aucun href de Codex ne porte de paramètre de requête', () => {
    for (const o of [...prof, ...eleve]) assert.equal(o.href.includes('?'), false, o.href)
  })
})

describe("ce que le lot ne touche pas", () => {
  // ⭐ C5-L4 A JOUÉ, ET CE TEST-CI DISAIT LE CONTRAIRE. Il tenait l'attente de
  //    C4-L6 — « Aletheia garde ses deux onglets prof et n'en gagne aucun côté
  //    élève » —, avec `['Classe', 'Paramètres']` et `[]`. C'était une garde de
  //    NON-DÉBORDEMENT, pas une règle : Aletheia porte désormais TROIS onglets de
  //    chaque côté (`onglets-aletheia.test.ts` les tient). Ce qui reste vrai, et
  //    ce que ce fichier doit continuer d'asserter, c'est que C5-L4 N'A TOUCHÉ
  //    AUCUN ONGLET DE CODEX.
  test("⛔ C5-L4 n'a touché AUCUN onglet de Codex — ni les libellés, ni les préfixes", () => {
    assert.deepEqual(prof.map((o) => o.label), ['Exercices', 'Paramètres'])
    assert.deepEqual(eleve.map((o) => o.label), ['Exercices', 'Examens'])
    assert.deepEqual(prof[0].prefixes, [
      '/prof/codex/synthese', '/prof/codex/validation', '/prof/codex/travail',
      '/prof/codex/passation', '/prof/codex/examen-diagnostique',
    ])
    assert.deepEqual(eleve[0].prefixes, ['/eleve/modules/codex/exercice'])
    assert.deepEqual(eleve[1].prefixes,
      ['/eleve/modules/codex/passation', '/eleve/modules/codex/synthese'])
  })

  test("les cinq modules gardent leur compte d'onglets", () => {
    const compte = Object.fromEntries(MODULES.map((m) => [
      m.cle, [sousOngletsPour(m, 'prof').length, sousOngletsPour(m, 'eleve').length],
    ]))
    // ⚠️ « Un module = 2-3 onglets » (`AGENTS.md`) : Aletheia est passé de [2, 0]
    //    à [3, 3] avec C5-L4, et c'est LE PLAFOND — il n'y a pas de place pour un
    //    quatrième. Fragments (4) est l'exception documentée de C8·L3.
    assert.deepEqual(compte, {
      aletheia: [3, 3], codex: [2, 2], fragments: [4, 3], quazian: [3, 2], scriptorium: [4, 2],
    })
  })
})

// ============================================================================
// ⭐⭐ C5-L2 — LES DEUX PORTES DU DÉROULÉ, ET CE QUI LES BORNE.
// ----------------------------------------------------------------------------
// « Un écran sans porte n'existe pas. » Avant ce lot, un exercice de LECTURE
// assigné n'avait ni lien, ni liste, ni adresse : le déroulé n'était routé que
// sous Codex, et `exercicesMaisonDeLEleve` filtrait sur `=== 'codex'`.
//
// ⛔ ET CE N'EST PAS UN ONGLET : les onglets de la lecture sont `C5-L4`. Le test
//    ci-dessus, « Aletheia n'en gagne aucun côté élève », reste vrai et vert.
// ============================================================================

describe('C5-L2 — deux ateliers, deux portes, un seul prédicat', () => {
  test('⭐ chaque atelier a SA route, et elles ne se recouvrent pas', () => {
    assert.equal(hrefDuDeroule('codex', 'dep-1'), '/eleve/modules/codex/exercice/dep-1')
    assert.equal(hrefDuDeroule('aletheia', 'dep-1'), '/eleve/modules/aletheia/exercice/dep-1')
    assert.notEqual(hrefDuDeroule('codex', 'x'), hrefDuDeroule('aletheia', 'x'))
  })

  test('la route se déduit du MODE, jamais d’un choix d’écran (`01-` §2)', () => {
    // « Codex s'il porte `composer`, Aletheia sinon » — le href suit.
    const ecriture = { expression: ['composer'] }
    const lecture = { argumentation: ['expliquer'], synthese: ['restituer'] }
    assert.equal(hrefDuDeroule(atelierDUnFormatif(ecriture), 'd'),
      '/eleve/modules/codex/exercice/d')
    assert.equal(hrefDuDeroule(atelierDUnFormatif(lecture), 'd'),
      '/eleve/modules/aletheia/exercice/d')
  })

  test('⚠️ LA BORNE JOUE DANS LES DEUX SENS — le module n’est pas un attribut d’URL', () => {
    // Le prédicat que les DEUX portes appliquent (`lireDepotMaison`, option
    // `atelier`) : la porte de Codex refuse un dépôt de lecture, celle
    // d'Aletheia refuse un dépôt d'écriture.
    const lecture = { argumentation: ['expliquer'] }
    const ecriture = { expression: ['composer'] }
    assert.notEqual(atelierDUnFormatif(lecture), 'codex')
    assert.notEqual(atelierDUnFormatif(ecriture), 'aletheia')
  })

  test('⛔ aucune des deux routes ne porte de paramètre de requête', () => {
    for (const a of ['codex', 'aletheia'] as const) {
      assert.equal(hrefDuDeroule(a, 'dep').includes('?'), false)
    }
  })
})
