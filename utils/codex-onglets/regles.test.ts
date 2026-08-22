import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  atelierDUnFormatif, comparerLignes, etatDeLExercice, titreDeLaConsigne,
  visibleDansLaClasse,
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
