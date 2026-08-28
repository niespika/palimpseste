// ============================================================================
// C6 · L2 — LES ÉPREUVES DE L'ÉCRAN DE LA SEMAINE.
// ----------------------------------------------------------------------------
// ⭐ Le groupe le plus important est le premier : « les deux temps ne
//    s'affichent JAMAIS ensemble », et « vide » n'est PAS « bilan ».
// ============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  bilanDeLaCompetence, ceQuiManqueAuBilan, competencesDeLaSemaine, friseDeLaSemaine,
  momentDeLaSemaine, type ExerciceDeLaSemaine,
} from './semaine'
import type { TonEtat } from '../codex-onglets/regles'
import type { EtatObservable } from '../routeur/observables'
import type { DimensionDite } from './profil'

const ex = (
  depotId: string, ton: TonEtat, competences: string[] = ['argumentation'],
): ExerciceDeLaSemaine => ({
  depotId, titre: `Exercice ${depotId}`, echeance: null, assigneAt: '2026-09-14T08:00:00Z',
  atelier: 'codex', href: `/eleve/modules/codex/exercice/${depotId}`,
  ton, libelle: ton, competences,
})

const etat = (code: string, acquis: boolean, sansTaux = false): EtatObservable => ({
  code, taux: sansTaux ? null : (acquis ? 1 : 0), reussies: 0, denominateur: sansTaux ? 0 : 3,
  acquis, sansTaux, requis: false,
})

const DIMS: DimensionDite[] = [
  { observableCode: 'liens', dimensionEleve: 'la justification de tes liens', ordre: 1 },
  { observableCode: 'mots', dimensionEleve: 'le choix de tes mots', ordre: 2 },
  { observableCode: 'plan', dimensionEleve: 'la clarté de ton plan', ordre: 3 },
]

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · « à la fin » — un seul temps à la fois, et trois vides distincts', () => {
  test('⛔⛔ UNE SEMAINE VIDE N’EST PAS UNE SEMAINE FINIE', () => {
    // « Une barre de progrès à 100 % sur zéro exercice est un mensonge poli. »
    assert.equal(momentDeLaSemaine([]), 'vide')
  })

  test('⭐ TANT QU’UN GESTE EST ATTENDU, c’est le RÉCAPITULATIF', () => {
    for (const ton of ['a_faire', 'en_cours', 'a_lire'] as TonEtat[]) {
      assert.equal(momentDeLaSemaine([ex('1', 'clos'), ex('2', ton)]), 'recapitulatif',
        `ton ${ton}`)
    }
  })

  test('⭐ QUAND PLUS RIEN N’EST ATTENDU, c’est le BILAN', () => {
    assert.equal(momentDeLaSemaine([ex('1', 'clos'), ex('2', 'attente')]), 'bilan')
  })

  test('⚠️ `attente` (rendu, retour en préparation) NE RETIENT PAS le bilan', () => {
    // L’élève n’a plus rien à faire : son bilan ne l’attend pas. Ce que la
    // chaîne n’a pas encore mesuré est dit par `ceQuiManqueAuBilan`.
    assert.equal(momentDeLaSemaine([ex('1', 'attente')]), 'bilan')
  })

  test('⛔ UN RETOUR PUBLIÉ NON LU RAMÈNE AU RÉCAPITULATIF — c’est une obligation', () => {
    assert.equal(momentDeLaSemaine([ex('1', 'clos'), ex('2', 'a_lire')]), 'recapitulatif')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · la frise — le nombre d’exercices, et aucun pourcentage', () => {
  test('⭐ une case par exercice ; faite quand plus aucun geste n’est attendu', () => {
    const f = friseDeLaSemaine([ex('1', 'clos'), ex('2', 'a_faire'), ex('3', 'attente')])
    assert.deepEqual(f.cases, [true, false, true])
    assert.equal(f.faits, 2)
    assert.equal(f.total, 3)
  })

  test('⛔ AUCUN POURCENTAGE, AUCUNE BANDE : la frise ne rend que des décomptes', () => {
    const f = friseDeLaSemaine([ex('1', 'clos')])
    // Ce que le type NE PORTE PAS est la garantie : pas de `pourcentage`,
    // pas de `bande`, pas de `semaineFaite`.
    assert.deepEqual(Object.keys(f).sort(), ['cases', 'faits', 'total'])
  })

  test('⚠️ une semaine vide ne rend AUCUNE case — jamais une division par zéro', () => {
    assert.deepEqual(friseDeLaSemaine([]), { cases: [], faits: 0, total: 0 })
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · les compétences de la semaine — comptées, jamais recalculées', () => {
  test('⭐ elles se lisent SUR LES EXERCICES POSÉS, et se classent au nombre', () => {
    const c = competencesDeLaSemaine([
      ex('1', 'a_faire', ['argumentation', 'expression']),
      ex('2', 'a_faire', ['argumentation']),
      ex('3', 'a_faire', ['structure']),
    ])
    assert.deepEqual(c, [
      { competence: 'argumentation', nbExercices: 2 },
      { competence: 'expression', nbExercices: 1 },
      { competence: 'structure', nbExercices: 1 },
    ])
  })

  test('⛔⛔ RIEN N’EST TRONQUÉ À TROIS : si la semaine en travaille quatre, on en dit quatre', () => {
    // « Un écran qui tronque à trois ment sur la semaine » (piège 44).
    const c = competencesDeLaSemaine([
      ex('1', 'a_faire', ['argumentation', 'expression', 'structure', 'synthese']),
    ])
    assert.equal(c.length, 4)
  })

  test('⚠️ une compétence citée DEUX FOIS par le même exercice ne compte qu’une fois', () => {
    const c = competencesDeLaSemaine([ex('1', 'a_faire', ['argumentation', 'argumentation'])])
    assert.deepEqual(c, [{ competence: 'argumentation', nbExercices: 1 }])
  })

  test('⚠️ un exercice sans compétence déclarée n’en invente aucune', () => {
    assert.deepEqual(competencesDeLaSemaine([ex('1', 'a_faire', [])]), [])
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · le bilan — LES DEUX ÉCARTS QUI INSTRUISENT', () => {
  test('⭐⭐ ÉCART 1 — bien réussi LÀ OÙ IL ÉTAIT FAIBLE', () => {
    const b = bilanDeLaCompetence('argumentation',
      [etat('liens', false)], [etat('liens', true)], DIMS)
    assert.deepEqual(b.bonneSurprise, ['la justification de tes liens'])
    assert.deepEqual(b.angleMort, [])
  })

  test('⭐⭐ ÉCART 2 — moins bien réussi LÀ OÙ IL A DES FORCES', () => {
    const b = bilanDeLaCompetence('argumentation',
      [etat('mots', true)], [etat('mots', false)], DIMS)
    assert.deepEqual(b.angleMort, ['le choix de tes mots'])
    assert.deepEqual(b.bonneSurprise, [])
  })

  test('⭐ LE RESTE « ne fait que confirmer ce qu’il savait déjà », et se range à part', () => {
    const b = bilanDeLaCompetence('argumentation',
      [etat('liens', true), etat('mots', false)],
      [etat('liens', true), etat('mots', false)], DIMS)
    assert.deepEqual(b.confirme, ['la justification de tes liens'])
    assert.deepEqual(b.connu, ['le choix de tes mots'])
    assert.deepEqual(b.bonneSurprise, [])
    assert.deepEqual(b.angleMort, [])
  })

  test('⚠️ CE QUE LA SEMAINE N’A PAS MESURÉ N’ENTRE NULLE PART — un silence n’est pas une baisse', () => {
    const b = bilanDeLaCompetence('argumentation',
      [etat('liens', true)], [etat('liens', false, true)], DIMS)
    assert.deepEqual([...b.confirme, ...b.connu, ...b.bonneSurprise, ...b.angleMort], [])
  })

  test('⚠️ RIEN D’ÉTABLI AVANT : c’est une réussite ou un manque, jamais un ÉCART', () => {
    const b = bilanDeLaCompetence('argumentation',
      [etat('liens', false, true)], [etat('liens', true)], DIMS)
    assert.deepEqual(b.confirme, ['la justification de tes liens'])
    assert.deepEqual(b.bonneSurprise, [], 'sans un « avant », l’écart n’a pas d’objet')
  })

  test('⛔⛔ RR4 — UN OBSERVABLE SANS `dimension_eleve` EST ÉCARTÉ, jamais rendu par son code', () => {
    const b = bilanDeLaCompetence('synthese',
      [etat('contresens_partiel', false)], [etat('contresens_partiel', true)], DIMS)
    assert.deepEqual(b.bonneSurprise, [])
    assert.deepEqual(b.formulationsManquantes, ['contresens_partiel'])
    assert.ok(!JSON.stringify(b).includes('"contresens_partiel"') || b.formulationsManquantes.length === 1)
  })

  test('⭐ L’ORDRE EST CELUI DE LA FICHE', () => {
    const b = bilanDeLaCompetence('argumentation',
      [etat('plan', false), etat('liens', false)],
      [etat('plan', true), etat('liens', true)], DIMS)
    assert.deepEqual(b.bonneSurprise, ['la justification de tes liens', 'la clarté de ton plan'])
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · une copie non mesurée — « le silence est un mensonge »', () => {
  test('⛔⛔ UNE COPIE RENDUE SANS MESURE SE DIT, elle ne se tait pas', () => {
    const q = ceQuiManqueAuBilan(
      [ex('1', 'attente'), ex('2', 'clos')], new Set(['2']))
    assert.equal(q.copiesNonMesurees, 1)
    assert.equal(q.incomplet, true)
  })

  test('⚠️ un exercice ENCORE À FAIRE n’est pas une copie non mesurée', () => {
    const q = ceQuiManqueAuBilan([ex('1', 'a_faire')], new Set())
    assert.equal(q.copiesNonMesurees, 0)
    assert.equal(q.incomplet, false)
  })

  test('⭐ tout mesuré : le bilan est complet et le dit', () => {
    const q = ceQuiManqueAuBilan([ex('1', 'clos'), ex('2', 'attente')], new Set(['1', '2']))
    assert.deepEqual(q, { copiesNonMesurees: 0, incomplet: false })
  })
})
