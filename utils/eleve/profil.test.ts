// ============================================================================
// C6 · L2 — LES ÉPREUVES DU PROFIL DE L'ÉLÈVE.
// ----------------------------------------------------------------------------
// Le glob de `npm test` est `utils/**/*.test.ts` : c'est la raison pour laquelle
// ces règles vivent sous `utils/` et non sous `app/`.
//
// ⭐ CE QUE CE FICHIER ÉPROUVE SURTOUT, C'EST CE QUE L'ÉCRAN NE DIT PAS. Trois
//    des sept groupes ci-dessous vérifient un SILENCE — « en progrès » qui ne se
//    lève pas, une lettre qui ne s'affiche pas, un code d'observable qui ne sort
//    jamais. Ce sont les seuls défauts que rien d'autre ne verrait.
// ============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  dimensionsRegardees, forcesDeLaCompetence, lettreVisible, manquesDeLaCompetence,
  motDeLaProgression, motDuDecompte, phraseDuGeste, progressionALaLecture,
  type DimensionDite, type MesurePourLEleve,
} from './profil'
import type { EtatObservable, InstrumentLu } from '../routeur/observables'
import { FENETRE_EVIDENCE } from '../routeur/config'

// ── Un instrument minimal : deux observables booléens ────────────────────────
// La forme est celle que `derive-instruments.py` verse (`observables_mesure`).
const INSTRUMENT: InstrumentLu = {
  observablesMesure: {
    // `reussie: 'exact'` avec la valeur attendue — la forme la plus simple qui
    // donne un taux. On ne recopie aucune règle : `tauxDeReussite` la lit.
    liens: { reussie: 'au_plus', seuil: 0 } as never,
    mots: { reussie: 'au_plus', seuil: 0 } as never,
  },
  parametres: {},
}

/** Une mesure où `liens` vaut `l` et `mots` vaut `m` (0 = réussi, 1 = raté). */
const m = (jour: string, l: number, mots: number): MesurePourLEleve => ({
  competence: 'argumentation',
  observables: { liens: l, mots },
  mesureAt: `2026-09-${jour}T12:00:00Z`,
  sondeMontee: false,
})

const DIMS: DimensionDite[] = [
  { observableCode: 'liens', dimensionEleve: 'la justification de tes liens', ordre: 2 },
  { observableCode: 'mots', dimensionEleve: 'le choix de tes mots', ordre: 1 },
]

const etat = (code: string, acquis: boolean, sansTaux = false): EtatObservable => ({
  code, taux: sansTaux ? null : (acquis ? 1 : 0), reussies: 0, denominateur: sansTaux ? 0 : 3,
  acquis, sansTaux, requis: false,
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · « en progrès » — quatre états, et le quatrième est l’absence', () => {
  test('⛔ SANS FENÊTRE PLEINE, ON NE DIT RIEN — c’est le cas de TOUS les élèves au 28/08', () => {
    // Production : 162 paires mesurées, ZÉRO à quatre mesures. Bac à sable : 3 paires à une.
    for (const n of [0, 1, 2, 3]) {
      const mesures = Array.from({ length: n }, (_, i) => m(String(10 + i).padStart(2, '0'), 1, 1))
      const p = progressionALaLecture(mesures, null, INSTRUMENT, [], false)
      assert.equal(p.etat, 'pas_assez_de_mesures', `à ${n} mesure(s)`)
      assert.equal(p.n, n)
      assert.equal(p.manquePourLeDire, FENETRE_EVIDENCE - n)
      assert.ok(p.motif, 'le motif se dit, il ne se devine pas')
    }
  })

  test('⛔ SANS INSTRUMENT, ON S’ABSTIENT — un observable sans taux ne se classe pas', () => {
    const mesures = [m('10', 1, 1), m('11', 1, 1), m('12', 0, 0), m('13', 0, 0)]
    const p = progressionALaLecture(mesures, null, null, [], false)
    assert.equal(p.etat, 'pas_assez_de_mesures')
    assert.match(p.motif ?? '', /instrument/)
    // ⚠️ `n` reste JUSTE : le décompte ne dépend pas de l’instrument.
    assert.equal(p.n, 4)
  })

  test('⭐ PROGRÈS : un observable passe à acquis d’une fenêtre à la suivante', () => {
    // avant = les 4 dernières de [1..4] soit [1,2,3,4] ; après = [2,3,4,5].
    // `liens` raté partout sauf sur les trois dernières → il passe à acquis.
    const mesures = [m('10', 1, 1), m('11', 1, 1), m('12', 0, 1), m('13', 0, 1), m('14', 0, 1)]
    const p = progressionALaLecture(mesures, null, INSTRUMENT, [], false)
    assert.equal(p.etat, 'progres')
    assert.equal(p.n, 5)
    assert.equal(motDeLaProgression(p), 'en progrès')
  })

  test('⭐ STAGNATION : aucun changement de statut ET valeur de ciblage immobile', () => {
    const mesures = [m('10', 1, 1), m('11', 1, 1), m('12', 1, 1), m('13', 1, 1), m('14', 1, 1)]
    // ⚠️ LES DEUX CONDITIONS, jamais l’une des deux : sans l’immobilité, pas de stagnation.
    assert.equal(progressionALaLecture(mesures, null, INSTRUMENT, [], false).etat,
      'ni_progres_ni_stagnation')
    assert.equal(progressionALaLecture(mesures, null, INSTRUMENT, [], true).etat, 'stagnation')
  })

  test('⚠️ UNE SONDE DE MONTÉE NE COMPTE PAS — la règle est `mesuresQuiComptent`, pas une copie', () => {
    const mesures = [m('10', 0, 0), m('11', 0, 0), m('12', 0, 0), m('13', 0, 0),
      { ...m('14', 1, 1), sondeMontee: true }]
    const p = progressionALaLecture(mesures, null, INSTRUMENT, [], false)
    assert.equal(p.n, 4, 'la sonde sort du décompte')
  })

  test('⚠️ LA BORNE DE RECETTE ÉCARTE LES MESURES D’AVANT, et `n` le dit', () => {
    const mesures = [m('10', 0, 0), m('11', 0, 0), m('12', 0, 0), m('13', 0, 0)]
    const p = progressionALaLecture(mesures, '2026-09-12T00:00:00Z', INSTRUMENT, [], false)
    assert.equal(p.n, 2)
    assert.equal(p.etat, 'pas_assez_de_mesures')
  })

  test('⛔ LE MOT NE SE TAIT JAMAIS — un mot qui ne se lève jamais doit dire pourquoi', () => {
    assert.equal(motDeLaProgression(
      { etat: 'pas_assez_de_mesures', n: 0, manquePourLeDire: 4, motif: null }),
    'pas encore travaillé')
    assert.match(motDeLaProgression(
      { etat: 'pas_assez_de_mesures', n: 2, manquePourLeDire: 2, motif: null }),
    /pas encore assez/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · « travaillé N fois » — un décompte réel (`06-` §5)', () => {
  test('zéro, un, plusieurs — et jamais une « confiance » agrégée', () => {
    assert.equal(motDuDecompte(0), 'jamais travaillé')
    assert.equal(motDuDecompte(1), 'travaillé 1 fois')
    assert.equal(motDuDecompte(4), 'travaillé 4 fois')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · la lettre — TROIS conditions, et il les faut toutes les trois', () => {
  test('⭐ les trois réunies : la lettre s’affiche', () => {
    assert.deepEqual(lettreVisible(true, false, true),
      { visible: true, raison: null, phrase: null })
  })

  test('⛔ chacune qui manque, une par une, ferme la lettre', () => {
    assert.equal(lettreVisible(false, false, true).raison, 'porte_fermee')
    assert.equal(lettreVisible(true, true, true).raison, 'profil_provisoire')
    assert.equal(lettreVisible(true, false, false).raison, 'choix_de_l_eleve')
  })

  test('⛔⛔ L’ÉLÈVE N’APPREND JAMAIS LE NOM D’UN INTERRUPTEUR (`07-` §5)', () => {
    for (const v of [lettreVisible(false, false, true), lettreVisible(true, true, true)]) {
      const p = v.phrase ?? ''
      assert.ok(p.length > 0, 'un vide s’explique, il ne se tait pas')
      for (const nom of ['competences_affichage_actif', 'profil_provisoire', 'exercices_actif',
        'routeur_actif', 'chaine_actif', 'fabrique_actif', 'passation_classe_actif',
        'interrupteur', 'flag']) {
        assert.ok(!p.includes(nom), `« ${nom} » ne doit pas sortir à l’écran`)
      }
    }
  })

  test('⚠️ SOUS `profil_provisoire`, la phrase parle du PROFIL, pas d’une fermeture', () => {
    // Arbitrage ① : seules les LETTRES se taisent. Le mot doit le refléter.
    assert.match(lettreVisible(true, true, true).phrase ?? '', /profil/i)
  })

  test('⚠️ LA PORTE PASSE DEVANT LE PROFIL — l’ordre est celui de la CAUSE', () => {
    assert.equal(lettreVisible(false, true, true).raison, 'porte_fermee')
  })

  test('⛔ un défaut à « affiché » n’est pas un choix : sans choix, rien', () => {
    assert.equal(lettreVisible(true, false, false).visible, false)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · les forces, les manques — RR4 champ par champ', () => {
  test('⭐ « ACQUIS » N’EST PAS « RÉUSSI » : seul `acquis` fait une force', () => {
    const r = forcesDeLaCompetence([etat('liens', true), etat('mots', false)], DIMS)
    assert.deepEqual(r.forces, ['la justification de tes liens'])
  })

  test('⭐ L’ORDRE EST CELUI DE LA FICHE (`ordre`), pas celui des états', () => {
    const r = forcesDeLaCompetence([etat('liens', true), etat('mots', true)], DIMS)
    assert.deepEqual(r.forces, ['le choix de tes mots', 'la justification de tes liens'])
  })

  test('⛔⛔ UN OBSERVABLE SANS `dimension_eleve` EST ÉCARTÉ ET SIGNALÉ — jamais son code', () => {
    const r = forcesDeLaCompetence([etat('contresens_partiel', true)], DIMS)
    assert.deepEqual(r.forces, [], 'rien ne sort')
    assert.deepEqual(r.formulationsManquantes, ['contresens_partiel'], 'et on le DIT')
    // Le contre-exemple est nommé à la revue du 26/08 : `contresens_partiel` de
    // la Synthèse juge l’élève sans figurer à la correspondance.
    assert.ok(!JSON.stringify(r.forces).includes('contresens_partiel'))
  })

  test('⛔ UNE DIMENSION VIDE VAUT UNE DIMENSION ABSENTE', () => {
    const r = forcesDeLaCompetence([etat('x', true)],
      [{ observableCode: 'x', dimensionEleve: '   ', ordre: 1 }])
    assert.deepEqual(r.forces, [])
    assert.deepEqual(r.formulationsManquantes, ['x'])
  })

  test('⚠️ « SANS TAUX » N’EST PAS « NON ACQUIS » : il ne compte pas comme un manque', () => {
    const r = manquesDeLaCompetence(
      [etat('liens', false, true), etat('mots', false)], DIMS)
    assert.deepEqual(r.forces, ['le choix de tes mots'])
  })

  test('⭐ « CE QU’IL DOIT SURVEILLER » = TOUTES les dimensions, SANS VERDICT (arbitrage ②)', () => {
    assert.deepEqual(dimensionsRegardees(DIMS),
      ['le choix de tes mots', 'la justification de tes liens'])
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · le geste concret — et ce qu’on en dit quand rien ne le rattache', () => {
  const geste = (competence: 'argumentation' | null) => ({
    texte: 'Reprends ton troisième argument et ajoute la phrase qui le justifie.',
    competence, publieLe: '2026-09-14T10:00:00Z', href: '/eleve/modules/codex/exercice/x',
  })

  test('⛔⛔ SANS RATTACHEMENT ÉCRIT, ON NE NOMME AUCUNE COMPÉTENCE', () => {
    // Mesuré le 28/08 : `routeur_decisions` = 0 ligne des deux côtés, et
    // `exercices.cible_primaire` NULL sur 251/251 en prod. C’est donc LE cas réel.
    const p = phraseDuGeste(geste(null))
    assert.match(p, /Calame/)
    for (const c of ['Argumentation', 'Expression', 'Structure', 'Synthèse',
      'Questionnement', 'Connaissance']) {
      assert.ok(!p.includes(c), `« ${c} » serait une invention`)
    }
  })

  test('⭐ AVEC un rattachement écrit, la compétence se nomme', () => {
    assert.match(phraseDuGeste(geste('argumentation')), /argumentation/)
  })

  test('⛔ SANS RETOUR PUBLIÉ, l’écran le dit — il ne se tait pas', () => {
    assert.match(phraseDuGeste(null), /pas encore reçu/)
  })
})
