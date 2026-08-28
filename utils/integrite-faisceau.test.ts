// Le faisceau : sept signaux, TROIS états chacun, et une convergence qui ne se
// déclenche pas toute seule.
//
// ⛔ Les deux gardes du `06-` §6 sont ici, et elles sont testées avant le reste :
//    le faisceau ne regarde que le formatif fait à la maison, et `delta_v1_vf`
//    NULL n'est pas zéro.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  estRegardable, signalDuree, signalRythme, signalSessions, signalCollages,
  signalAutojugement, signalDeltaNul, signalStyle, faisceauDuDepot, convergence,
  motifDuFaisceau, SIGNAUX_FAISCEAU, SIGNES_MINIMUM_POUR_JUGER, SIGNES_PAR_MINUTE_SUSPECTS,
  type DepotAuFaisceau,
} from './integrite-faisceau'
import type { TelemetrieSaisie } from './deroule/types'

const tel = (p: Partial<TelemetrieSaisie> = {}): TelemetrieSaisie =>
  ({ signes_saisis: 1000, ms_actifs: 600_000, plus_grand_ajout: 5, sessions: 4, ...p })

const depot = (p: Partial<DepotAuFaisceau> = {}): DepotAuFaisceau => ({
  depotId: 'd1', eleveId: 'e1', lieu: 'maison', forme: 'formatif',
  dureeTaguee: 'nominale', telemetrieV1: tel(), signesV1: 1000,
  collagesBloques: 0, calibration: 'bien_calibre', deltas: [0.4], ...p,
})

// ── Les deux gardes ────────────────────────────────────────────────────────

test('⛔ GARDE 1 — une passation EN CLASSE n’entre jamais dans le compte', () => {
  assert.equal(estRegardable({ lieu: 'classe', forme: 'formatif' }), false)
  assert.equal(estRegardable({ lieu: 'classe', forme: 'sommatif' }), false)
})

test('⛔ GARDE 1 — un lieu INCONNU vaut refus, jamais acceptation', () => {
  assert.equal(estRegardable({ lieu: null, forme: 'formatif' }), false)
})

test('la `forme` absente vaut `formatif` (`07-` §1.2), le `sommatif` maison sort', () => {
  assert.equal(estRegardable({ lieu: 'maison', forme: null }), true)
  assert.equal(estRegardable({ lieu: 'maison', forme: 'formatif' }), true)
  assert.equal(estRegardable({ lieu: 'maison', forme: 'sommatif' }), false)
})

test('⛔⛔ GARDE 2 — `delta_v1_vf` NULL n’est PAS zéro', () => {
  assert.equal(signalDeltaNul([null, null]), null, 'aucune version finale : on ne sait pas')
  assert.equal(signalDeltaNul([]), null, 'aucune mesure : on ne sait pas non plus')
  assert.equal(signalDeltaNul([0]), true)
  assert.equal(signalDeltaNul([0.3, null]), false)
})

// ── Chaque signal, et ses trois états ──────────────────────────────────────

test('la durée : le TAG fait foi, et son absence rend `null`', () => {
  assert.equal(signalDuree('tres_courte'), true)
  assert.equal(signalDuree('nominale'), false)
  assert.equal(signalDuree(null), null, 'pas de tag n’est pas « durée normale »')
})

test('le rythme se lève à 900 signes/minute — la citation du `06-` §6', () => {
  // 900 signes en une minute exactement.
  assert.equal(signalRythme(tel({ signes_saisis: 900, ms_actifs: 60_000 }), 900), true)
  assert.equal(signalRythme(tel({ signes_saisis: 300, ms_actifs: 20_000 }), 300), null,
    'sous le plancher de longueur, on ne juge pas — même à 900 signes/minute')
  assert.equal(signalRythme(tel({ signes_saisis: 800, ms_actifs: 60_000 }), 800), false)
  assert.equal(SIGNES_PAR_MINUTE_SUSPECTS, 900)
})

test('l’apparition PAR BLOCS se lève même quand le temps actif est nul', () => {
  // Un texte collé d'un seul geste : aucun intervalle, donc `ms_actifs` à 0.
  const colle = tel({ signes_saisis: 1000, ms_actifs: 0, plus_grand_ajout: 1000 })
  assert.equal(signalRythme(colle, 1000), true,
    '⚠️ c’est `plus_grand_ajout` qui le voit, jamais le rythme sur dénominateur vide')
})

test('⚠️ un dénominateur vide SANS bloc rend `null` — jamais « élève le plus lent »', () => {
  assert.equal(signalRythme(tel({ ms_actifs: 0, plus_grand_ajout: 5 }), 1000), null)
})

test('sans télémétrie, les signaux de saisie rendent `null`, jamais `false`', () => {
  assert.equal(signalRythme(null, 1000), null)
  assert.equal(signalSessions(null, 1000), null)
})

test('les sessions : zéro n’est pas « une seule », c’est « rien de compté »', () => {
  assert.equal(signalSessions(tel({ sessions: 0 }), 1000), null)
  assert.equal(signalSessions(tel({ sessions: 1 }), 1000), true)
  assert.equal(signalSessions(tel({ sessions: 2 }), 1000), false)
  assert.equal(signalSessions(tel({ sessions: 1 }), SIGNES_MINIMUM_POUR_JUGER - 1), null)
})

test('les collages : zéro tentative est une MESURE (la colonne naît `[]`)', () => {
  assert.equal(signalCollages(0), false)
  assert.equal(signalCollages(1), true)
})

test('l’auto-jugement : `sous_confiant` lève, `indetermine` ne dit rien', () => {
  assert.equal(signalAutojugement('sous_confiant'), true)
  assert.equal(signalAutojugement('surconfiant'), false, 'se croire meilleur n’est pas tricher')
  assert.equal(signalAutojugement('bien_calibre'), false)
  assert.equal(signalAutojugement('indetermine'), null, 'un côté qui manque n’est pas une incohérence')
  assert.equal(signalAutojugement('n/a'), null)
  assert.equal(signalAutojugement(null), null)
})

test('⛔ le style discordant N’A AUCUN PRODUCTEUR : `null`, jamais `false`', () => {
  assert.equal(signalStyle(), null)
  assert.equal(faisceauDuDepot(depot()).style, null)
})

// ── La convergence ─────────────────────────────────────────────────────────

test('les sept signaux sont toujours rangés, et dans l’une des trois cases', () => {
  const c = convergence(faisceauDuDepot(depot()), { seuil: null })
  assert.equal(c.leves.length + c.eteints.length + c.nonMesures.length, SIGNAUX_FAISCEAU.length)
})

test('⛔ SANS SEUIL RÉGLÉ, la convergence est FAUSSE — même avec sept signaux', () => {
  const tout = depot({
    dureeTaguee: 'tres_courte',
    telemetrieV1: tel({ signes_saisis: 2000, ms_actifs: 60_000, plus_grand_ajout: 2000, sessions: 1 }),
    signesV1: 2000, collagesBloques: 3, calibration: 'sous_confiant', deltas: [0],
  })
  const f = faisceauDuDepot(tout)
  assert.equal(convergence(f, { seuil: null }).converge, false,
    '« un seuil posé d’avance deviendrait la cible que le dispositif apprend à viser »')
  assert.equal(convergence(f, { seuil: 0 }).converge, false)
  assert.equal(convergence(f, { seuil: 3 }).converge, true)
})

test('un dépôt propre ne converge sur aucun seuil positif', () => {
  const c = convergence(faisceauDuDepot(depot()), { seuil: 1 })
  assert.equal(c.converge, false)
  assert.equal(c.leves.length, 0)
})

test('le motif JOURNALISE ce qui a été compté — nommé, jamais un score', () => {
  const f = faisceauDuDepot(depot({ dureeTaguee: 'tres_courte', collagesBloques: 2 }))
  const m = motifDuFaisceau(convergence(f, { seuil: 2 }))
  assert.match(m, /2 signal\(aux\) sur 7/)
  assert.match(m, /durée très inférieure/)
  assert.match(m, /collage/)
  assert.match(m, /non mesuré/, 'ce qu’on n’a pas pu mesurer se dit aussi')
  assert.doesNotMatch(m, /\b\d{1,3}\s?%/, '⛔ aucun pourcentage de « confiance »')
})
