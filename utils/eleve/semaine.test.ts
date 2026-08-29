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
  momentDeLaSemaine, offreDEnFairePlus, type ExerciceDeLaSemaine,
  dedoublonnerParDepot,} from './semaine'
import type { TonEtat } from '../codex-onglets/regles'
import type { EtatObservable } from '../routeur/observables'
import type { DimensionDite } from './profil'

const ex = (
  depotId: string, ton: TonEtat, competences: string[] = ['argumentation'],
  bonus = false,
): ExerciceDeLaSemaine => ({
  depotId, titre: `Exercice ${depotId}`, echeance: null, assigneAt: '2026-09-14T08:00:00Z',
  atelier: 'codex', href: `/eleve/modules/codex/exercice/${depotId}`,
  ton, libelle: ton, competences, bonus,
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
    // pas de `bande`, pas de `semaineFaite`. ⭐ C6-L3 y ajoute `enPlus`, qui est
    // lui aussi DEUX DÉCOMPTES RÉELS et rien d'autre.
    assert.deepEqual(Object.keys(f).sort(), ['cases', 'enPlus', 'faits', 'total'])
    assert.deepEqual(Object.keys(f.enPlus).sort(), ['faits', 'total'])
  })

  test('⚠️ une semaine vide ne rend AUCUNE case — jamais une division par zéro', () => {
    assert.deepEqual(friseDeLaSemaine([]),
      { cases: [], faits: 0, total: 0, enPlus: { faits: 0, total: 0 } })
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
      { competence: 'argumentation', nbExercices: 2, nbEnPlus: 0 },
      { competence: 'expression', nbExercices: 1, nbEnPlus: 0 },
      { competence: 'structure', nbExercices: 1, nbEnPlus: 0 },
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
    assert.deepEqual(c, [{ competence: 'argumentation', nbExercices: 1, nbEnPlus: 0 }])
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

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · la frise — l’assigné et le demandé ne se confondent plus', () => {
  test('⛔⛔ « 3 SUR 5 » NE COMPTE QUE L’IMPOSÉ — le bonus est compté À PART', () => {
    // Le défaut que `C6-L2` a déposé nommément : « le jour où ton pull en pose,
    // "3 sur 5" mélangera l’assigné et le demandé, et l’élève lira COMME UN
    // RETARD ce qu’il a choisi en plus ».
    const f = friseDeLaSemaine([
      ex('1', 'clos'), ex('2', 'clos'), ex('3', 'a_faire'),
      ex('b1', 'a_faire', ['structure'], true),
    ])
    assert.equal(f.total, 3, 'le bonus n’entre pas au dénominateur')
    assert.equal(f.faits, 2)
    assert.deepEqual(f.cases, [true, true, false], 'trois cases, pas quatre')
    assert.deepEqual(f.enPlus, { faits: 0, total: 1 })
  })

  test('⭐ un bonus FAIT se compte fait — dans son propre décompte', () => {
    const f = friseDeLaSemaine([ex('1', 'clos'), ex('b1', 'clos', ['structure'], true)])
    assert.deepEqual(f.enPlus, { faits: 1, total: 1 })
    assert.equal(f.total, 1)
  })

  test('⚠️ une semaine SANS bonus rend exactement ce qu’elle rendait avant', () => {
    const f = friseDeLaSemaine([ex('1', 'clos'), ex('2', 'a_faire')])
    assert.deepEqual(f.cases, [true, false])
    assert.deepEqual(f.enPlus, { faits: 0, total: 0 })
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · le moment — le bonus ne reprend pas son bilan à l’élève', () => {
  test('⛔⛔ UN BONUS NON FAIT NE RAMÈNE PAS AU RÉCAPITULATIF', () => {
    // Sinon, prendre l’offre effacerait le bilan qu’on venait de lire.
    assert.equal(momentDeLaSemaine([
      ex('1', 'clos'), ex('b1', 'a_faire', ['structure'], true),
    ]), 'bilan')
  })

  test('⚠️ une semaine faite UNIQUEMENT d’un bonus est « vide » — il n’y a rien d’imposé', () => {
    assert.equal(momentDeLaSemaine([ex('b1', 'a_faire', ['structure'], true)]), 'vide')
  })

  test('⭐ l’imposé commande toujours : un exercice à faire, c’est le récapitulatif', () => {
    assert.equal(momentDeLaSemaine([
      ex('1', 'a_faire'), ex('b1', 'clos', ['structure'], true),
    ]), 'recapitulatif')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · l’offre — « PUIS on lui offre d’en faire plus », et aucun silence', () => {
  const OUVERT = { epuise: false }

  test('⭐ AU BILAN, ET SEULEMENT LÀ, l’offre s’ouvre', () => {
    const o = offreDEnFairePlus(true, 'bilan', [ex('1', 'clos')], OUVERT)
    assert.equal(o.offerte, true)
    assert.equal(o.motif, null)
  })

  test('⛔ PENDANT LA SEMAINE, elle ne s’ouvre pas — ET ELLE DIT QUAND ELLE S’OUVRIRA', () => {
    const o = offreDEnFairePlus(true, 'recapitulatif', [ex('1', 'a_faire')], OUVERT)
    assert.equal(o.offerte, false)
    assert.equal(o.motif, 'semaine_en_cours')
    assert.match(o.phrase, /quand tu auras fini/i)
  })

  test('⛔⛔ « UN À LA FOIS » : un bonus qui attend un geste SUSPEND l’offre', () => {
    const o = offreDEnFairePlus(true, 'bilan',
      [ex('1', 'clos'), ex('b1', 'a_faire', ['structure'], true)], OUVERT)
    assert.equal(o.offerte, false)
    assert.equal(o.motif, 'un_a_la_fois')
  })

  test('⭐ un bonus DÉJÀ FAIT ne suspend rien — on peut en redemander', () => {
    const o = offreDEnFairePlus(true, 'bilan',
      [ex('1', 'clos'), ex('b1', 'clos', ['structure'], true)], OUVERT)
    assert.equal(o.offerte, true)
  })

  test('⛔ LE QUOTA ÉPUISÉ SE DIT AVANT LE CLIC, et il dit qu’il ne se reporte pas', () => {
    const o = offreDEnFairePlus(true, 'bilan', [ex('1', 'clos')], { epuise: true })
    assert.equal(o.motif, 'quota_epuise')
    assert.match(o.phrase, /ne se garde pas/i)
  })

  test('⛔ SANS BUDGET, ce n’est PAS « quota épuisé » — le piège de la vacuité', () => {
    const o = offreDEnFairePlus(true, 'bilan', [ex('1', 'clos')], null)
    assert.equal(o.motif, 'aucun_budget')
    assert.notEqual(o.phrase, offreDEnFairePlus(true, 'bilan', [ex('1', 'clos')],
      { epuise: true }).phrase)
  })

  test('⛔ PORTE FERMÉE : l’offre n’existe pas, et ce n’est pas « rien à faire »', () => {
    const o = offreDEnFairePlus(false, 'bilan', [ex('1', 'clos')], OUVERT)
    assert.equal(o.motif, 'porte_fermee')
  })

  test('⛔ SEMAINE VIDE : il n’y a pas de « plus » à faire de plus', () => {
    const o = offreDEnFairePlus(true, 'vide', [], OUVERT)
    assert.equal(o.motif, 'semaine_vide')
  })

  test('⛔⛔ AUCUN CAS NE SE TAIT — chaque état rend une phrase', () => {
    const cas: Array<[boolean, 'vide' | 'recapitulatif' | 'bilan',
      ExerciceDeLaSemaine[], { epuise: boolean } | null]> = [
      [false, 'bilan', [ex('1', 'clos')], OUVERT],
      [true, 'vide', [], OUVERT],
      [true, 'recapitulatif', [ex('1', 'a_faire')], OUVERT],
      [true, 'bilan', [ex('1', 'clos'), ex('b', 'a_faire', ['s'], true)], OUVERT],
      [true, 'bilan', [ex('1', 'clos')], null],
      [true, 'bilan', [ex('1', 'clos')], { epuise: true }],
      [true, 'bilan', [ex('1', 'clos')], OUVERT],
    ]
    for (const [porte, moment, exs, q] of cas) {
      const o = offreDEnFairePlus(porte, moment, exs, q)
      assert.ok(o.phrase.trim().length > 20, `phrase absente pour ${moment}/${porte}/${q}`)
    }
  })

  test('⛔⛔ L’OFFRE OUVERTE NE DIT AUCUN NOMBRE — « pas de budget-temps hebdomadaire »', () => {
    const o = offreDEnFairePlus(true, 'bilan', [ex('1', 'clos')], OUVERT)
    assert.ok(!/\d/.test(o.phrase), `l’invite porte un chiffre : « ${o.phrase} »`)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · le récapitulatif — deux nombres sur un écran doivent s’accorder', () => {
  test('⛔⛔ « N EXERCICES » NE COMPTE QUE L’IMPOSÉ — le défaut trouvé À L’ŒIL', () => {
    // Vu au smoke du 28/08 : le récapitulatif annonçait « Argumentation · 3
    // exercices » quand la frise, deux blocs plus haut, disait « 1 exercice fait
    // SUR 2 ». Deux nombres, même écran, même ensemble, et pas d’accord.
    const c = competencesDeLaSemaine([
      ex('1', 'a_faire', ['argumentation']),
      ex('2', 'clos', ['argumentation']),
      ex('b', 'clos', ['argumentation'], true),
    ])
    assert.deepEqual(c, [{ competence: 'argumentation', nbExercices: 2, nbEnPlus: 1 }])
    const f = friseDeLaSemaine([
      ex('1', 'a_faire', ['argumentation']),
      ex('2', 'clos', ['argumentation']),
      ex('b', 'clos', ['argumentation'], true),
    ])
    assert.equal(c[0].nbExercices, f.total, 'LES DEUX NOMBRES DE L’ÉCRAN S’ACCORDENT')
  })

  test('⭐ une compétence que SEUL un bonus porte reste dans la liste — le BILAN en a besoin', () => {
    // « Le bonus est un exercice normal, MESURES COMPRISES » : sa compétence doit
    // pouvoir recevoir un bilan. C’est l’appelant qui l’écarte du RÉCAPITULATIF.
    const c = competencesDeLaSemaine([
      ex('1', 'clos', ['argumentation']),
      ex('b', 'clos', ['structure'], true),
    ])
    assert.deepEqual(c.find((x) => x.competence === 'structure'),
      { competence: 'structure', nbExercices: 0, nbEnPlus: 1 })
  })

  test('⚠️ le tri porte sur le TOTAL — « les compétences que la semaine travaille »', () => {
    const c = competencesDeLaSemaine([
      ex('1', 'clos', ['argumentation']),
      ex('b1', 'clos', ['structure'], true),
      ex('b2', 'clos', ['structure'], true),
    ])
    assert.equal(c[0].competence, 'structure', '2 au total devance 1')
  })
})


// ── UN DÉPÔT NE SE COMPTE QU'UNE FOIS — `C6L2-31` ───────────────────────────

describe('`dedoublonnerParDepot` — le bi-classe n\'a qu\'une semaine', () => {
  const ex = (depotId: string, p: Record<string, unknown> = {}) => ({
    depotId, titre: 't', echeance: null, assigneAt: '2026-08-31T12:00:00Z',
    atelier: 'codex' as const, href: '/x', ton: 'a_faire' as const, libelle: 'l',
    competences: ['expression'], bonus: false, ...p,
  })

  test('⛔ LE CAS RÉEL — une instance SANS CLASSE revenait une fois PAR INSCRIPTION', () => {
    // `visibleDansLaClasse` laisse passer un `classe_id` NULL pour chacune : le
    // même dépôt arrivait donc deux fois chez un bi-classe, et la frise lisait
    // « 0 sur 8 » pour quatre exercices.
    const uniques = dedoublonnerParDepot([ex('d1'), ex('d2'), ex('d1'), ex('d2')])
    assert.equal(uniques.length, 2)
    assert.deepEqual(uniques.map((e) => e.depotId), ['d1', 'd2'])
  })

  test('⭐ et la FRISE compte juste une fois dédoublonnée — c\'est ce qui était faux', () => {
    const doublons = [ex('d1'), ex('d2'), ex('d1'), ex('d2')]
    assert.equal(friseDeLaSemaine(doublons).total, 4, 'le défaut : quatre pour deux dépôts')
    assert.equal(friseDeLaSemaine(dedoublonnerParDepot(doublons)).total, 2, 'et le correctif')
  })

  test('deux dépôts DISTINCTS ne se confondent pas, même titre compris', () => {
    assert.equal(dedoublonnerParDepot([ex('a', { titre: 'même' }), ex('b', { titre: 'même' })])
      .length, 2)
  })

  test('l\'ORDRE est préservé, et le premier gagne', () => {
    const r = dedoublonnerParDepot([ex('a', { titre: 'premier' }), ex('a', { titre: 'second' })])
    assert.equal(r.length, 1)
    assert.equal(r[0].titre, 'premier')
  })

  test('une liste vide reste vide', () => {
    assert.deepEqual(dedoublonnerParDepot([]), [])
  })
})
