// « Le budget est une propriété de l'ÉLÈVE, pas de la classe » (`01-` §4).
// Et LE PIÈGE DE LA VACUITÉ, condition de recette de C4-L2 (`07-` §1.3) : un
// élève sans parcours ne reçoit rien, ET LE PROFESSEUR EN EST AVERTI.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  budgetDeLEleve, parcoursDeLEleve, situationDesParcours, ecartAuPlancher,
  type InscriptionActive,
} from './budget'

const tc: InscriptionActive = { classeId: 'c1', classeNom: 'T5', typePedagogique: 'tc' }
const hlp: InscriptionActive = { classeId: 'c2', classeNom: 'THLP', typePedagogique: 'hlp' }
const sansParcours: InscriptionActive = { classeId: 'c3', classeNom: 'Test', typePedagogique: null }

// ── Les trois situations du §4 ─────────────────────────────────────────────

test('TC seul → 45 / 60 / +30', () => {
  const b = budgetDeLEleve([tc])
  assert.equal(b.situation, 'tc_seul')
  assert.deepEqual(b.budget, { plancher: 45, plafond: 60, optionnel: 30 })
})

test('HLP seul → 60 / 90 / +30', () => {
  assert.deepEqual(budgetDeLEleve([hlp]).budget, { plancher: 60, plafond: 90, optionnel: 30 })
})

test('UN BI-CLASSE A UN SEUL BUDGET — 90 / 120, jamais deux enveloppes', () => {
  const b = budgetDeLEleve([tc, hlp])
  assert.equal(b.situation, 'bi_classe')
  assert.deepEqual(b.budget, { plancher: 90, plafond: 120, optionnel: 30 })
  assert.deepEqual(b.parcours, ['tc', 'hlp'])
  // Ce n'est pas la somme des deux budgets seuls (45+60=105 / 60+90=150).
  assert.notEqual(b.budget?.plancher, 105)
})

test('l\'ordre des inscriptions ne change rien — l\'union est un ensemble', () => {
  assert.deepEqual(parcoursDeLEleve([hlp, tc]), ['tc', 'hlp'])
  assert.deepEqual(parcoursDeLEleve([tc, hlp]), ['tc', 'hlp'])
})

test('deux inscriptions au même parcours restent une situation simple', () => {
  const b = budgetDeLEleve([tc, { ...tc, classeId: 'c9', classeNom: 'T4' }])
  assert.equal(b.situation, 'tc_seul')
})

// ── LE PIÈGE DE LA VACUITÉ — la condition de recette ───────────────────────

test('aucun parcours → AUCUN exercice routé, et le professeur est averti', () => {
  const b = budgetDeLEleve([sansParcours])
  assert.equal(b.budget, null, 'pas de budget : rien ne lui est servi')
  assert.equal(b.motifNonServi, 'aucun_parcours')
  assert.equal(b.avertissements.length, 1, 'le professeur en est averti')
  assert.match(b.avertissements[0], /Test/, 'l\'avertissement nomme la classe en cause')
  assert.match(b.avertissements[0], /AUCUN exercice/)
})

test('l\'ensemble vide N\'EST PAS un service réduit aux types génériques', () => {
  // La règle d'exclusion du `02-` §4 est vraie par vacuité sur un ensemble vide :
  // sans cette garde, l'élève serait exclu de TOUT, en silence.
  const b = budgetDeLEleve([sansParcours])
  assert.equal(b.parcours.length, 0)
  assert.notEqual(b.motifNonServi, null, 'le refus est EXPLICITE, jamais un silence')
})

test('une classe avec parcours et une sans : celle qui en porte un décide', () => {
  const b = budgetDeLEleve([sansParcours, tc])
  assert.equal(b.situation, 'tc_seul', 'une seule inscription qualifiante suffit')
  assert.deepEqual(b.avertissements, [])
})

test('aucune inscription active → pas servi non plus, et pour un motif distinct', () => {
  const b = budgetDeLEleve([])
  assert.equal(b.motifNonServi, 'aucune_inscription')
  assert.equal(b.budget, null)
})

test('`autre` porte un parcours mais n\'a pas de ligne au §4 : on n\'en invente pas', () => {
  const b = budgetDeLEleve([{ classeId: 'c4', classeNom: 'Option', typePedagogique: 'autre' }])
  assert.deepEqual(b.parcours, ['autre'], 'le parcours est bien là')
  assert.equal(b.situation, null)
  assert.equal(b.budget, null)
  assert.equal(b.motifNonServi, 'parcours_hors_dispositif')
  assert.match(b.avertissements[0], /tronc commun et de HLP/)
})

test('`autre` avec `tc` retombe sur la ligne de `tc`', () => {
  assert.equal(situationDesParcours(['tc', 'autre']), 'tc_seul')
  assert.equal(situationDesParcours(['hlp', 'autre']), 'hlp_seul')
  assert.equal(situationDesParcours(['tc', 'hlp', 'autre']), 'bi_classe')
})

// ── Réglable par élève, valeur par valeur ──────────────────────────────────

test('le réglage du professeur écrase le défaut VALEUR PAR VALEUR', () => {
  const b = budgetDeLEleve([tc], { plancher: 30, plafond: null, optionnel: null })
  assert.deepEqual(b.budget, { plancher: 30, plafond: 60, optionnel: 30 })
  assert.equal(b.regle, true)
})

test('un réglage tout à null laisse le défaut, et ne se dit pas « réglé »', () => {
  const b = budgetDeLEleve([hlp], { plancher: null, plafond: null, optionnel: null })
  assert.deepEqual(b.budget, { plancher: 60, plafond: 90, optionnel: 30 })
  assert.equal(b.regle, false)
})

test('un plafond sous le plancher se signale sans rien empêcher', () => {
  const b = budgetDeLEleve([tc], { plancher: 90, plafond: 40, optionnel: null })
  assert.equal(b.budget?.plafond, 40, 'le réglage du professeur est respecté')
  assert.equal(b.avertissements.length, 1)
  assert.match(b.avertissements[0], /sous le plancher/)
})

// ── « Le plafond borne, le plancher signale » ──────────────────────────────

test('sous le plancher : l\'écart se journalise, le solde revient à la voie mixte', () => {
  const e = ecartAuPlancher(30, { plancher: 45, plafond: 60, optionnel: 30 })
  assert.equal(e.souSLePlancher, true)
  assert.equal(e.manque, 15)
  assert.equal(e.minutesAssignees, 30)
  assert.equal(e.minutesPlancher, 45, 'les deux compteurs du §11 point 7 sortent ensemble')
})

test('plancher atteint : rien à journaliser, et le manque est 0, pas négatif', () => {
  const e = ecartAuPlancher(55, { plancher: 45, plafond: 60, optionnel: 30 })
  assert.equal(e.souSLePlancher, false)
  assert.equal(e.manque, 0)
})
