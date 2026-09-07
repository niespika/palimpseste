import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  atelierDUneInstanceDeClasse, atelierDUnFormatif, comparerLignes, etatDeLExercice,
  etatDExamenDeClasse, hrefDeLaPassationEleve, titreDeLaConsigne, visibleDansLaClasse,
} from './regles'

// ============================================================================
// C4 · L6 — les trois règles que les deux onglets appliquent.
// Ce lot ne change AUCUNE règle métier : ces tests tiennent celles qui existent.
// ============================================================================

describe("l'atelier d'un exercice formatif", () => {
  test("`composer` range dans CODEX (`01-` §2)", () => {
    assert.equal(atelierDUnFormatif({ expression: ['composer'] }), 'codex')
    assert.equal(atelierDUnFormatif({ synthese: ['restituer'], structure: ['composer'] }), 'codex')
  })

  test('sans `composer`, tout va dans ALETHEIA — « Codex s\'il porte composer, Aletheia sinon »', () => {
    assert.equal(atelierDUnFormatif({ argumentation: ['expliquer'] }), 'aletheia')
    assert.equal(atelierDUnFormatif({ synthese: ['restituer'], questionnement: ['interroger'] }), 'aletheia')
  })

  test("une déclaration absente ou mal formée ne devient jamais Codex par défaut", () => {
    assert.equal(atelierDUnFormatif(null), 'aletheia')
    assert.equal(atelierDUnFormatif(undefined), 'aletheia')
    assert.equal(atelierDUnFormatif({}), 'aletheia')
    // La valeur est TOUJOURS une liste (`exercices_modes_chk`) : un scalaire
    // n'est pas une liste, et on ne l'interprète pas.
    assert.equal(atelierDUnFormatif({ expression: 'composer' }), 'aletheia')
    assert.equal(atelierDUnFormatif(['composer']), 'aletheia')
  })
})

describe('la classe en contexte borne la liste', () => {
  test("le travail de l'autre classe ne se voit jamais", () => {
    assert.equal(visibleDansLaClasse('classe-B', 'classe-A'), false)
    assert.equal(visibleDansLaClasse('classe-A', 'classe-A'), true)
  })

  test("une instance SANS classe n'est pas « l'autre classe » — elle reste servie", () => {
    // `exercices.classe_id` est NULLABLE : l'écarter ferait disparaître un
    // exercice que l'élève doit faire, ce qui est le contraire du but du lot.
    assert.equal(visibleDansLaClasse(null, 'classe-A'), true)
  })
})

describe("l'état d'une ligne, dit à l'élève", () => {
  test('les sept statuts du dépôt ont chacun leur mot', () => {
    assert.equal(etatDeLExercice('assigne', null).ton, 'a_faire')
    assert.equal(etatDeLExercice('ouvert', null).ton, 'en_cours')
    assert.equal(etatDeLExercice('v1_remis', null).ton, 'attente')
    assert.equal(etatDeLExercice('retour_publie', null).ton, 'a_lire')
    assert.equal(etatDeLExercice('vf_remis', null).ton, 'attente')
    assert.equal(etatDeLExercice('clos', null).ton, 'clos')
    assert.equal(etatDeLExercice('abandonne', null).ton, 'clos')
  })

  test("⭐ l'obligation de lecture passe DEVANT l'état du dépôt (`02-` §6.D, 17)", () => {
    // Une version finale déjà rendue n'éteint pas un retour publié non lu.
    const e = etatDeLExercice('vf_remis', { publie: true, lu: false })
    assert.equal(e.ton, 'a_lire')
    assert.equal(e.libelle, 'retour à lire')
    // Et un retour lu rend la main à l'état du dépôt.
    assert.equal(etatDeLExercice('vf_remis', { publie: true, lu: true }).ton, 'attente')
    // Un retour non publié n'est pas une chose à lire.
    assert.equal(etatDeLExercice('v1_remis', { publie: false, lu: false }).ton, 'attente')
  })

  test('aucun état ne porte de lettre, de note ni de pourcentage (`06-` §5)', () => {
    for (const s of ['assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis', 'clos', 'abandonne']) {
      const l = etatDeLExercice(s, null).libelle
      assert.ok(!/[0-9]|%|\b[A-E]\b/.test(l), `« ${l} » ne doit porter ni chiffre ni lettre`)
    }
  })

  test("un statut inconnu se dit tel quel, il n'invente pas un état", () => {
    assert.equal(etatDeLExercice('statut_neuf', null).libelle, 'statut_neuf')
  })
})

describe("l'ordre de la liste", () => {
  const l = (ton: 'a_lire' | 'a_faire' | 'en_cours' | 'attente' | 'clos', echeance: string | null) =>
    ({ ton, echeance })

  test('ce qui appelle un geste passe devant', () => {
    assert.ok(comparerLignes(l('a_lire', null), l('a_faire', '2026-09-01')) < 0)
    assert.ok(comparerLignes(l('a_faire', null), l('en_cours', '2026-09-01')) < 0)
    assert.ok(comparerLignes(l('attente', '2026-01-01'), l('clos', '2026-09-01')) < 0)
  })

  test('à ton égal, la plus proche échéance est en tête', () => {
    assert.ok(comparerLignes(l('a_faire', '2026-09-01'), l('a_faire', '2026-09-08')) < 0)
    assert.equal(comparerLignes(l('a_faire', '2026-09-01'), l('a_faire', '2026-09-01')), 0)
  })

  test("une échéance absente n'invente pas une urgence : elle passe en fin", () => {
    assert.ok(comparerLignes(l('a_faire', null), l('a_faire', '2026-09-08')) > 0)
    assert.ok(comparerLignes(l('a_faire', '2026-09-08'), l('a_faire', null)) < 0)
    assert.equal(comparerLignes(l('a_faire', null), l('a_faire', null)), 0)
  })

  test('le tri est total et stable sur un jeu complet', () => {
    const lignes = [
      l('clos', '2026-09-01'), l('a_faire', '2026-09-10'), l('a_lire', null),
      l('attente', null), l('a_faire', '2026-09-02'), l('en_cours', '2026-09-30'),
    ]
    const tries = [...lignes].sort(comparerLignes).map((x) => `${x.ton}:${x.echeance ?? '—'}`)
    assert.deepEqual(tries, [
      'a_lire:—', 'a_faire:2026-09-02', 'a_faire:2026-09-10',
      'en_cours:2026-09-30', 'attente:—', 'clos:2026-09-01',
    ])
  })
})

describe('le titre de la consigne', () => {
  test('la première ligne NON VIDE, jamais la consigne entière', () => {
    assert.equal(titreDeLaConsigne('\n\n  Rédige un paragraphe.\nPuis relis-toi.'),
      'Rédige un paragraphe.')
  })

  test('la forme objet est lue sur son champ `texte`', () => {
    assert.equal(titreDeLaConsigne({ texte: 'Explique la thèse.' }), 'Explique la thèse.')
  })

  test('⚠️ une PAIRE de diagnostic porte DEUX cas : on prend le premier', () => {
    // `exercices_paire_chk` impose un tableau de 2 (`07-` §1.1).
    assert.equal(titreDeLaConsigne(['Cas traité sur indication.', 'Cas neuf.']),
      'Cas traité sur indication.')
  })

  test('rien de lisible → le repli, jamais une chaîne vide', () => {
    assert.equal(titreDeLaConsigne(null), 'Exercice')
    assert.equal(titreDeLaConsigne({}), 'Exercice')
    assert.equal(titreDeLaConsigne('   \n  '), 'Exercice')
    assert.equal(titreDeLaConsigne([], 'Passation en classe'), 'Passation en classe')
  })
})

// ============================================================================
// LA PORTE DU RETOUR D'EXAMEN — le trou mesuré en prod le 27/08.
// ----------------------------------------------------------------------------
// Quatorze retours publiés, `lu_at` NULL sur les quatorze : l'écran existait,
// aucun lien n'y menait. Ces tests tiennent les deux règles qui le rouvrent.
// ============================================================================

describe("où l'élève entre dans sa propre passation en classe", () => {
  test('chaque atelier a sa route, et ce n’est PAS celle du déroulé', () => {
    assert.equal(hrefDeLaPassationEleve('codex', 'd1'), '/eleve/modules/codex/passation/d1')
    assert.equal(hrefDeLaPassationEleve('aletheia', 'd1'), '/eleve/modules/aletheia/passation/d1')
  })

  test('⚠️ la confondre avec le déroulé enverrait sur un notFound()', () => {
    // `lireDepotMaison` refuse un dépôt dont l'instance a `lieu = classe`.
    assert.notEqual(hrefDeLaPassationEleve('codex', 'd1'), '/eleve/modules/codex/exercice/d1')
  })
})

describe("l'atelier d'une instance DE CLASSE — la ligne de plan d'abord", () => {
  test('la typologie du plan tranche : `ecriture` ⇒ Codex, `lecture` ⇒ Aletheia', () => {
    assert.equal(atelierDUneInstanceDeClasse('ecriture', null), 'codex')
    assert.equal(atelierDUneInstanceDeClasse('lecture', null), 'aletheia')
  })

  test('⭐⭐ LE CAS QUI JUSTIFIE L’ORDRE : l’explication de texte mesure l’Expression EN `composer`', () => {
    // Le vrai `modes_par_competence` d'un examen diagnostique d'explication
    // (`MODES_MESURES.aletheia`, `utils/examens/types.ts`). La règle des modes
    // seule l'enverrait dans CODEX ; le `06-` §1 la range en LECTURE.
    const explication = {
      expression: ['composer'], argumentation: ['expliquer'],
      structure: ['expliquer'], synthese: ['restituer'],
    }
    assert.equal(atelierDUnFormatif(explication), 'codex')            // le piège…
    assert.equal(atelierDUneInstanceDeClasse('lecture', explication), 'aletheia')  // …évité
  })

  test('à défaut de ligne de plan, le REPLI est la règle des modes', () => {
    assert.equal(atelierDUneInstanceDeClasse(null, { expression: ['composer'] }), 'codex')
    assert.equal(atelierDUneInstanceDeClasse(null, { argumentation: ['expliquer'] }), 'aletheia')
  })

  test('une typologie inconnue ne devient pas Codex par défaut : elle tombe sur le repli', () => {
    assert.equal(atelierDUneInstanceDeClasse('', null), 'aletheia')
    assert.equal(atelierDUneInstanceDeClasse('oral', { expression: ['composer'] }), 'codex')
    assert.equal(atelierDUneInstanceDeClasse('oral', null), 'aletheia')
  })
})

describe("l'état d'un examen DE CLASSE — ce que la tuile « à faire » filtre", () => {
  test('⭐ un retour publié non lu se dit `a_lire`, quel que soit le statut du dépôt', () => {
    // Le filtre de `retoursDExamenALire` porte sur l'ÉTAT, pas sur le statut.
    assert.equal(etatDExamenDeClasse('retour_publie', { publie: true, lu: false }).ton, 'a_lire')
    assert.equal(etatDExamenDeClasse('vf_remis', { publie: true, lu: false }).ton, 'a_lire')
    assert.equal(etatDExamenDeClasse('clos', { publie: true, lu: false }).ton, 'a_lire')
  })

  test('⛔⛔ LU, LA TUILE S’ÉTEINT — le défaut trouvé au smoke du 27/08', () => {
    // `etatDeLExercice` retombait sur `case retour_publie` et rendait `a_lire`
    // SANS regarder `lu` : la tuile ne se serait jamais éteinte. Mesuré en bac
    // à sable sur un retour publié le 22/08 ET LU le 22/08.
    assert.equal(etatDeLExercice('retour_publie', { publie: true, lu: true }).ton, 'a_lire')  // le piège…
    assert.equal(etatDExamenDeClasse('retour_publie', { publie: true, lu: true }).ton, 'clos')  // …évité
    assert.equal(etatDExamenDeClasse('retour_publie', { publie: true, lu: true }).libelle, 'retour lu')
  })

  test('⚠️ une copie remise SANS retour publié n’appelle aucune lecture', () => {
    assert.equal(etatDExamenDeClasse('v1_remis', null).ton, 'attente')
    assert.equal(etatDExamenDeClasse('v1_remis', { publie: false, lu: false }).ton, 'attente')
  })

  test('⚠️ `retour_publie` SANS retour publié ne promet pas un retour', () => {
    // L'écran ne rend rien sans `published_at` : annoncer « retour à lire » sur
    // la foi du seul statut enverrait l'élève sur une page qui se tait.
    assert.equal(etatDExamenDeClasse('retour_publie', null).ton, 'attente')
    assert.equal(etatDExamenDeClasse('retour_publie', null).libelle, 'rendu — retour en préparation')
  })

  test('⭐ la séquence de classe s’arrête à `retour_publie` : lire est le DERNIER geste', () => {
    // ⚠️ Et c'est pourquoi la règle de la MAISON ne peut pas servir ici : là-bas
    //    une version finale reste à écrire, et `clos` mentirait.
    const lu = { publie: true, lu: true }
    assert.equal(etatDExamenDeClasse('retour_publie', lu).ton, 'clos')
    assert.equal(etatDExamenDeClasse('abandonne', null).libelle, 'abandonné')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// C10 · L1 — LA SEMAINE COMPTÉE SE FERME : ce que le TON devient
// ════════════════════════════════════════════════════════════════════════════

describe('C10-L1 — `etatDeLExercice` et la fermeture', () => {
  test('⭐ fermés, `assigne` et `ouvert` se lisent « fermé » — et EUX SEULS', () => {
    assert.deepEqual(etatDeLExercice('assigne', null, true), { ton: 'ferme', libelle: 'fermé' })
    assert.deepEqual(etatDeLExercice('ouvert', null, true), { ton: 'ferme', libelle: 'fermé' })
  })

  test('⛔⛔ L\'OBLIGATION DE LECTURE PASSE DEVANT — un retour publié non lu, même fermé, reste « à lire »', () => {
    // C'est la première ligne de la fonction, et elle cite le `06-` §2 temps 6 :
    // « il se clôt par la validation "lu" ». La lecture reste due, elle reste
    // POSSIBLE, et c'est la seule porte de sortie de l'exercice fermé — c'est
    // aussi elle qui continue de retenir le bilan, comme `C6-L2` l'a écrit.
    const nonLu = { publie: true, lu: false }
    assert.deepEqual(etatDeLExercice('retour_publie', nonLu, true),
      { ton: 'a_lire', libelle: 'retour à lire' })
    // ⚠️ Et même sur un `assigne` : si un retour publié non lu existe, il gagne.
    assert.equal(etatDeLExercice('assigne', nonLu, true).ton, 'a_lire')
  })

  test('⛔ un `v1_remis` fermé reste `attente` — « rendu, retour en préparation » est VRAI', () => {
    // Le retour d'une v1 déjà remise continue d'arriver APRÈS la fermeture : la
    // garde porte sur les gestes de l'élève, jamais sur la file ni sur la
    // chaîne. « Fermé sans retour » est à `C9`, et ce lot ne le fabrique pas.
    assert.deepEqual(etatDeLExercice('v1_remis', null, true),
      { ton: 'attente', libelle: 'rendu — retour en préparation' })
  })

  test('les statuts déjà terminés ne bougent pas d\'un mot sous la fermeture', () => {
    for (const statut of ['clos', 'abandonne', 'non_fait', 'vf_remis']) {
      assert.deepEqual(etatDeLExercice(statut, null, true), etatDeLExercice(statut, null, false),
        `le statut ${statut} ne doit pas changer`)
    }
  })

  test('⭐ SANS fermeture, rien ne change — le défaut du paramètre protège tous les appelants', () => {
    for (const statut of ['assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis',
      'clos', 'abandonne', 'non_fait', 'inconnu']) {
      assert.deepEqual(etatDeLExercice(statut, null), etatDeLExercice(statut, null, false),
        `le statut ${statut} sans fermeture`)
    }
    assert.equal(etatDeLExercice('assigne', null).ton, 'a_faire')
  })

  test('`ferme` ferme la liste : il se trie APRÈS tout le reste', () => {
    const tons: Array<Parameters<typeof comparerLignes>[0]['ton']> = ['ferme', 'clos', 'attente', 'en_cours', 'a_faire', 'a_lire']
    const tries = [...tons]
      .map((ton) => ({ ton, echeance: null }))
      .sort(comparerLignes)
      .map((l) => l.ton)
    assert.deepEqual(tries, ['a_lire', 'a_faire', 'en_cours', 'attente', 'clos', 'ferme'])
  })
})
