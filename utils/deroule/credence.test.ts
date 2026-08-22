// ============================================================================
// C4 · L3 — LA CRÉDENCE. Ce que ce test GARDE :
//   · ⭐ le MÊLAGE — « sans quoi un élève apprend que la dernière est la bonne »
//     (piège 37, décision de Louis) ;
//   · le PLANCHER de trois distracteurs — « signale, ne complète pas » ;
//   · les deux formes que la chaîne LIT (`monitoring.ts:lireCredence`), qui sont
//     un CONTRAT : les renommer romprait la porte 2 EN SILENCE.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formeDeLaCredence, lireLaBanque, texteDuCandidat, melerAvecGraine,
  offreDeCredence, saisieARegistrer, credencesAttendues,
  PLANCHER_DISTRACTEURS, CANDIDATS_SERVIS,
} from './credence'

const BANQUE = ['faux A', 'faux B', 'faux C', 'faux D', 'faux E', 'faux F']
const ATTENDUE = 'la bonne réponse'
const APPUI = { distracteurs: BANQUE, reponseAttendue: ATTENDUE }
const MAINTENANT = '2026-08-22T10:00:00.000Z'

test('la forme suit le cran : répartition aux deux guidés, pourcentage aux quatre qui isolent', () => {
  assert.equal(formeDeLaCredence('diagnostic_guide'), 'repartition')
  assert.equal(formeDeLaCredence('transformation_guidee'), 'repartition')
  assert.equal(formeDeLaCredence('diagnostic_nomme'), 'pourcentage')
  assert.equal(formeDeLaCredence('transformation_nommee'), 'pourcentage')
  assert.equal(formeDeLaCredence('transformation_aveugle'), 'pourcentage')
  assert.equal(formeDeLaCredence('diagnostic_fin'), 'pourcentage')
})

test('les trois crans de production ne demandent AUCUNE crédence', () => {
  assert.equal(formeDeLaCredence('production_guidee'), null)
  assert.equal(formeDeLaCredence('production_etayee'), null)
  assert.equal(formeDeLaCredence('production_autonome'), null)
})

test('la banque se lit sous SES DEUX FORMES PHYSIQUES — chaînes et objets d’import', () => {
  assert.deepEqual(lireLaBanque(['a', 'b']), ['a', 'b'])
  assert.deepEqual(
    lireLaBanque([{ texte: 'a', pourquoi_faux: 'parce que' }, { texte: 'b' }]), ['a', 'b'])
  assert.deepEqual(lireLaBanque(['a', { texte: 'b' }]), ['a', 'b'], 'une banque mêlée se lit aussi')
})

test('`pourquoi_faux` N’EST PAS servi à l’élève — c’est une note de conception', () => {
  assert.equal(texteDuCandidat({ texte: 'a', pourquoi_faux: 'le piège' }), 'a')
})

test('un candidat illisible est ÉCARTÉ, il n’emporte pas les autres', () => {
  assert.deepEqual(lireLaBanque(['a', null, 42, { rien: 1 }, '   ', 'b']), ['a', 'b'])
  assert.deepEqual(lireLaBanque('pas un tableau'), [])
})

test('⭐ LE MÊLAGE : la bonne réponse ne tombe PAS toujours en position 4', () => {
  // C'est exactement le défaut constaté sur `composerApercu`, qui compose
  // `[...tirerTrois(banque), reponseAttendue]` — la bonne réponse en dernier à
  // tous les coups. Ici, sur vingt dépôts, elle doit se promener.
  const positions = new Set<number>()
  for (let i = 0; i < 20; i++) {
    const o = offreDeCredence('diagnostic_guide', 1, `depot-${i}`, APPUI)
    positions.add(o.indexAttendue as number)
  }
  assert.ok(positions.size > 1,
    'la bonne réponse tombe toujours au même rang : un élève l’apprendrait')
})

test('le mêlage est STABLE : deux appels sur le même dépôt × cas rendent le MÊME ordre', () => {
  const a = offreDeCredence('diagnostic_guide', 1, 'depot-42', APPUI)
  const b = offreDeCredence('diagnostic_guide', 1, 'depot-42', APPUI)
  assert.deepEqual(a.candidats, b.candidats,
    'sinon les jetons déjà posés ne voudraient plus rien dire au rechargement')
  assert.equal(a.indexAttendue, b.indexAttendue)
})

test('les deux cas d’une paire ne servent pas le même ordre', () => {
  const un = offreDeCredence('diagnostic_guide', 1, 'depot-42', APPUI)
  const deux = offreDeCredence('diagnostic_guide', 2, 'depot-42', APPUI)
  assert.notDeepEqual(un.candidats, deux.candidats)
})

test('l’écran sert QUATRE candidats — jamais quinze — dont la réponse attendue', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'depot-1', APPUI)
  assert.equal(o.candidats.length, CANDIDATS_SERVIS)
  assert.ok(o.candidats.includes(ATTENDUE))
  assert.equal(o.candidats[o.indexAttendue as number], ATTENDUE)
  assert.equal(new Set(o.candidats).size, CANDIDATS_SERVIS, 'aucun doublon')
})

test('⚠️ SOUS LE PLANCHER DE TROIS, l’écran NE SE COMPOSE PAS — on signale', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'd', { distracteurs: ['a', 'b'], reponseAttendue: ATTENDUE })
  assert.deepEqual(o.candidats, [])
  assert.ok(o.empechement?.includes(String(PLANCHER_DISTRACTEURS)))
  assert.ok(o.empechement?.includes('ne complète pas'), 'on ne fabrique pas un distracteur')
})

test('sans `reponse_attendue`, la répartition ne se comparerait à rien : on refuse', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'd', { distracteurs: BANQUE, reponseAttendue: null })
  assert.deepEqual(o.candidats, [])
  assert.ok(o.empechement)
})

test('aux quatre crans qui isolent, AUCUN candidat n’est servi', () => {
  const o = offreDeCredence('diagnostic_fin', 1, 'd', APPUI)
  assert.equal(o.forme, 'pourcentage')
  assert.deepEqual(o.candidats, [])
  assert.equal(o.empechement, null, 'ne rien servir n’est pas un empêchement, c’est la règle')
})

test('le mêlage semé rend une PERMUTATION — rien ne se perd, rien ne se duplique', () => {
  const mele = melerAvecGraine(['a', 'b', 'c', 'd', 'e'], 'graine')
  assert.deepEqual([...mele].sort(), ['a', 'b', 'c', 'd', 'e'])
})

// ── La saisie, et le CONTRAT avec la chaîne ─────────────────────────────────

test('⭐ la répartition écrit `jetons` et `index_correct` — les clés que la chaîne LIT', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'd', APPUI)
  const jetons = [0, 0, 0, 0]
  jetons[o.indexAttendue as number] = 100
  const { valeur } = saisieARegistrer(1, o, { jetons }, MAINTENANT)
  assert.ok(valeur)
  assert.deepEqual(valeur.jetons, jetons)
  assert.equal(valeur.index_correct, o.indexAttendue)
  assert.equal(valeur.cas, 1)
})

test('les jetons se répartissent SUR 100 : une somme différente est refusée', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'd', APPUI)
  assert.equal(saisieARegistrer(1, o, { jetons: [25, 25, 25, 20] }, MAINTENANT).valeur, null)
  assert.equal(saisieARegistrer(1, o, { jetons: [25, 25, 25, 25] }, MAINTENANT).valeur !== null, true)
})

test('un jeton négatif, décimal, ou en nombre insuffisant est refusé', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'd', APPUI)
  assert.equal(saisieARegistrer(1, o, { jetons: [-10, 50, 30, 30] }, MAINTENANT).valeur, null)
  assert.equal(saisieARegistrer(1, o, { jetons: [25.5, 24.5, 25, 25] }, MAINTENANT).valeur, null)
  assert.equal(saisieARegistrer(1, o, { jetons: [50, 50] }, MAINTENANT).valeur, null)
  assert.equal(saisieARegistrer(1, o, {}, MAINTENANT).valeur, null)
})

test('le pourcentage écrit `pourcentage`, et ⚠️ JAMAIS `reussi` — l’écran ne calcule rien', () => {
  const o = offreDeCredence('diagnostic_fin', 1, 'd', APPUI)
  const { valeur } = saisieARegistrer(1, o, { pourcentage: 70 }, MAINTENANT)
  assert.ok(valeur)
  assert.equal(valeur.pourcentage, 70)
  assert.equal('reussi' in valeur, false,
    'la justesse d’une réponse libre est un JUGEMENT, pas une saisie d’écran')
})

test('un pourcentage hors 0-100 ou décimal est refusé', () => {
  const o = offreDeCredence('diagnostic_fin', 1, 'd', APPUI)
  assert.equal(saisieARegistrer(1, o, { pourcentage: 101 }, MAINTENANT).valeur, null)
  assert.equal(saisieARegistrer(1, o, { pourcentage: -1 }, MAINTENANT).valeur, null)
  assert.equal(saisieARegistrer(1, o, { pourcentage: 70.5 }, MAINTENANT).valeur, null)
})

test('un empêchement fait refuser la saisie — on ne journalise pas une crédence sans écran', () => {
  const o = offreDeCredence('diagnostic_guide', 1, 'd', { distracteurs: [], reponseAttendue: ATTENDUE })
  assert.equal(saisieARegistrer(1, o, { jetons: [25, 25, 25, 25] }, MAINTENANT).valeur, null)
})

test('UNE crédence par diagnostic, DEUX sur une paire ; zéro en production', () => {
  assert.equal(credencesAttendues('diagnostic_guide', 2), 2)
  assert.equal(credencesAttendues('transformation_nommee', 1), 1)
  assert.equal(credencesAttendues('production_autonome', 1), 0)
})
