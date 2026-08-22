// « Le même jour que la v1 quand c'est possible, sinon dans les trois à quatre
// jours — ET JAMAIS À CHEVAL SUR DEUX SEMAINES DE TRAVAIL » (`06-` §2 ; `01-` §11).
// Le délai SE RÈGLE (`scriptorium_params.vf_delai_jours`, 1..4) ; le « jamais à
// cheval » est un PLAFOND que le code applique par-dessus, et le cycle commence
// le LUNDI (`01-` §1 ; garde `extract(isodow from cycle_lundi) = 1`).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DELAI_VF_DEFAUT, DELAI_VF_MAX, DELAI_VF_MIN, DelaiHorsDomaine,
  delaiRegleValide, echeanceDeLaVersionFinale, finDeSemaineDeTravail,
  lundiDuCycle, traverseDeuxSemaines,
} from './echeance'
import { jourDansFuseau } from '../fuseau'

const TORONTO = 'America/Toronto'   // UTC−4 en septembre 2026 (heure d'été)
const PARIS = 'Europe/Paris'        // UTC+2 en septembre 2026

// La semaine de travail de référence : lundi 31 août → dimanche 6 septembre 2026.
// À Toronto, elle se clôt le dimanche 23 h 59 min 59 s, soit 03 h 59 UTC le lundi.
const FIN_DE_SEMAINE = new Date('2026-09-07T03:59:59.999Z')

const V1_LUNDI = new Date('2026-08-31T18:00:00Z')      // lundi 31 août, 14 h à Toronto
const V1_JEUDI = new Date('2026-09-03T22:00:00Z')      // jeudi 3 sept., 18 h à Toronto
const V1_VENDREDI = new Date('2026-09-04T22:00:00Z')   // vendredi 4 sept., 18 h à Toronto
const V1_DIMANCHE = new Date('2026-09-07T00:30:00Z')   // dimanche 6 sept., 20 h 30 à Toronto

// ── Le lundi du cycle : le cycle EST la semaine, et il commence le lundi ────

test('le lundi du cycle est une DATE PURE à minuit UTC, et son jour ISO vaut 1', () => {
  const lundi = lundiDuCycle(V1_JEUDI, TORONTO)
  assert.equal(lundi.toISOString(), '2026-08-31T00:00:00.000Z')
  assert.equal(lundi.getUTCDay(), 1, 'la garde en base est `extract(isodow from ...) = 1`')
})

test('un lundi matin est le lundi de SON PROPRE cycle — on ne remonte pas d\'une semaine', () => {
  assert.equal(lundiDuCycle(V1_LUNDI, TORONTO).toISOString(), '2026-08-31T00:00:00.000Z')
})

test('un dimanche soir clôt SA semaine — il n\'ouvre pas la suivante', () => {
  assert.equal(lundiDuCycle(V1_DIMANCHE, TORONTO).toISOString(), '2026-08-31T00:00:00.000Z')
})

test('LE FUSEAU DÉCIDE : le même instant ouvre deux cycles différents à Toronto et à Paris', () => {
  // 2026-09-07T00:30:00Z = dimanche 20 h 30 à Toronto, mais lundi 02 h 30 à Paris.
  assert.equal(lundiDuCycle(V1_DIMANCHE, TORONTO).toISOString(), '2026-08-31T00:00:00.000Z')
  assert.equal(lundiDuCycle(V1_DIMANCHE, PARIS).toISOString(), '2026-09-07T00:00:00.000Z')
})

test('la fin de semaine est le DIMANCHE SOIR à l\'heure de l\'école, jamais minuit UTC', () => {
  assert.equal(finDeSemaineDeTravail(V1_JEUDI, TORONTO).toISOString(), FIN_DE_SEMAINE.toISOString())
  // Écrite en date pure, elle vaudrait 2026-09-06T00:00:00Z — soit 20 h le SAMEDI
  // à Toronto : une journée entière de rendus comptée à cheval.
  assert.ok(finDeSemaineDeTravail(V1_JEUDI, TORONTO) > new Date('2026-09-06T00:00:00Z'))
})

test('la fin de semaine suit le cycle du fuseau, pas celui d\'UTC', () => {
  assert.equal(finDeSemaineDeTravail(V1_DIMANCHE, PARIS).toISOString(), '2026-09-13T21:59:59.999Z')
})

// ── Le délai réglé : il se REÇOIT, et son domaine vient de la source ────────

test('le domaine du réglage est celui de la source — 1 à 4 jours, défaut 3', () => {
  assert.equal(DELAI_VF_MIN, 1)
  assert.equal(DELAI_VF_MAX, 4)
  assert.equal(DELAI_VF_DEFAUT, 3)
  assert.ok([1, 2, 3, 4].every(delaiRegleValide))
})

test('un délai hors du domaine est REFUSÉ, jamais rabattu sur le défaut', () => {
  for (const mauvais of [0, 5, -3, 3.5, Number.NaN]) {
    assert.equal(delaiRegleValide(mauvais), false)
    assert.throws(
      () => echeanceDeLaVersionFinale({ v1RemiseA: V1_LUNDI, delaiJours: mauvais,
        finDeSemaine: FIN_DE_SEMAINE }),
      DelaiHorsDomaine,
      `le délai ${mauvais} devait être refusé`)
  }
})

test('le délai n\'est PAS gravé en dur : deux réglages donnent deux échéances', () => {
  const a = echeanceDeLaVersionFinale({ v1RemiseA: V1_LUNDI, delaiJours: 1,
    finDeSemaine: FIN_DE_SEMAINE })
  const b = echeanceDeLaVersionFinale({ v1RemiseA: V1_LUNDI, delaiJours: 3,
    finDeSemaine: FIN_DE_SEMAINE })
  assert.equal(a.echeance.toISOString(), '2026-09-01T18:00:00.000Z')
  assert.equal(b.echeance.toISOString(), '2026-09-03T18:00:00.000Z')
  assert.equal(a.rognee, false)
  assert.equal(b.rognee, false)
})

// ── Le plafond : « jamais à cheval sur deux semaines de travail » ───────────

test('une échéance qui tient dans la semaine de la v1 n\'est pas rognée, et n\'a pas de motif', () => {
  const r = echeanceDeLaVersionFinale({ v1RemiseA: V1_JEUDI, delaiJours: 3,
    finDeSemaine: FIN_DE_SEMAINE })
  assert.equal(r.echeance.toISOString(), '2026-09-06T22:00:00.000Z')
  assert.equal(r.rognee, false)
  assert.equal(r.motif, null)
})

test('une échéance qui SORT de la semaine est ROGNÉE à sa fin — et le motif cite la règle', () => {
  const r = echeanceDeLaVersionFinale({ v1RemiseA: V1_VENDREDI, delaiJours: 3,
    finDeSemaine: FIN_DE_SEMAINE })
  assert.equal(r.echeance.toISOString(), FIN_DE_SEMAINE.toISOString())
  assert.equal(r.rognee, true)
  assert.match(r.motif ?? '', /JAMAIS À CHEVAL SUR DEUX SEMAINES DE TRAVAIL/)
  assert.match(r.motif ?? '', /ce que l'élève a appris entre-temps/)
})

test('le plafond mord sur le DÉLAI, pas sur le jour : v1 jeudi tient à 3 j, plus à 4', () => {
  assert.equal(echeanceDeLaVersionFinale({ v1RemiseA: V1_JEUDI, delaiJours: 3,
    finDeSemaine: FIN_DE_SEMAINE }).rognee, false)
  assert.equal(echeanceDeLaVersionFinale({ v1RemiseA: V1_JEUDI, delaiJours: 4,
    finDeSemaine: FIN_DE_SEMAINE }).rognee, true)
})

test('une échéance qui tombe EXACTEMENT à la clôture reste dans la semaine', () => {
  const v1 = new Date(FIN_DE_SEMAINE.getTime() - 3 * 86400000)
  const r = echeanceDeLaVersionFinale({ v1RemiseA: v1, delaiJours: 3,
    finDeSemaine: FIN_DE_SEMAINE })
  assert.equal(r.echeance.toISOString(), FIN_DE_SEMAINE.toISOString())
  assert.equal(r.rognee, false, 'déposer À la clôture, c\'est déposer dans la semaine')
})

test('V1 REMISE LE DIMANCHE : le plafond la ramène AU MÊME JOUR — voulu, pas un bug', () => {
  const finDeSemaine = finDeSemaineDeTravail(V1_DIMANCHE, TORONTO)
  const r = echeanceDeLaVersionFinale({ v1RemiseA: V1_DIMANCHE, delaiJours: DELAI_VF_DEFAUT,
    finDeSemaine })
  assert.equal(r.rognee, true, 'trois jours la feraient tomber le mercredi suivant')
  assert.equal(
    jourDansFuseau(r.echeance, TORONTO), jourDansFuseau(V1_DIMANCHE, TORONTO),
    '« le même jour que la v1 QUAND C\'EST POSSIBLE » — la première branche de la règle')
  assert.equal(jourDansFuseau(r.echeance, TORONTO), '2026-09-06')
})

test('la borne reçue n\'est pas aliasée : muter l\'échéance ne déplace pas la fin de semaine', () => {
  const borne = new Date(FIN_DE_SEMAINE.getTime())
  const r = echeanceDeLaVersionFinale({ v1RemiseA: V1_VENDREDI, delaiJours: 3,
    finDeSemaine: borne })
  r.echeance.setUTCFullYear(2030)
  assert.equal(borne.toISOString(), FIN_DE_SEMAINE.toISOString())
})

test('l\'échéance ne REFUSE rien : elle est rendue, jamais un blocage', () => {
  const r = echeanceDeLaVersionFinale({ v1RemiseA: V1_VENDREDI, delaiJours: 4,
    finDeSemaine: FIN_DE_SEMAINE })
  assert.ok(r.echeance instanceof Date)
  assert.equal(Object.keys(r).sort().join(','), 'echeance,motif,rognee',
    'le contrat ne porte aucun verdict, aucune interdiction')
})

// ── La lecture d'après coup : ce que le delta mesure encore ─────────────────

test('une vf déposée dans la semaine de la v1 ne traverse rien', () => {
  const vf = new Date('2026-09-07T02:00:00Z')   // dimanche 22 h à Toronto
  assert.equal(traverseDeuxSemaines(V1_JEUDI, vf, FIN_DE_SEMAINE), false)
})

test('une vf déposée le lundi suivant TRAVERSE — le delta ne mesure plus la réception', () => {
  const vf = new Date('2026-09-07T14:00:00Z')   // lundi 10 h à Toronto
  assert.equal(traverseDeuxSemaines(V1_JEUDI, vf, FIN_DE_SEMAINE), true)
})

test('déposer EXACTEMENT à la clôture ne traverse pas — le dépassement est strict', () => {
  assert.equal(traverseDeuxSemaines(V1_JEUDI, FIN_DE_SEMAINE, FIN_DE_SEMAINE), false)
})

test('une vf déposée le même jour que la v1 ne traverse jamais, dimanche compris', () => {
  const vf = new Date('2026-09-07T02:00:00Z')   // dimanche 22 h, comme la v1 de 20 h 30
  assert.equal(traverseDeuxSemaines(V1_DIMANCHE, vf, finDeSemaineDeTravail(V1_DIMANCHE, TORONTO)),
    false)
})

test('une borne qui n\'est PAS celle de la v1 ne produit pas de faux positif', () => {
  // La v1 tombe APRÈS la borne : ce n'est pas la semaine de travail de la v1.
  const v1Tardive = new Date('2026-09-08T13:00:00Z')
  const vf = new Date('2026-09-10T13:00:00Z')
  assert.equal(traverseDeuxSemaines(v1Tardive, vf, FIN_DE_SEMAINE), false,
    'la lecture ne prétend pas lire ce qu\'on ne lui a pas donné')
})

test('la traversée se LIT, elle ne bloque pas : elle rend un booléen et rien d\'autre', () => {
  assert.equal(typeof traverseDeuxSemaines(V1_JEUDI, new Date('2026-09-14T13:00:00Z'),
    FIN_DE_SEMAINE), 'boolean')
})
