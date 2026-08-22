// ============================================================================
// C4 · L3 — « SE JUGER ». Ce que ce test GARDE :
//   · les CONDITIONS EXACTES ET FERMÉES — produire × meso|macro × `evaluee` ;
//   · l'ordre d'élection — « les plus fragiles de l'élève d'abord » ;
//   · ⭐ LA GARDE `indetermine` et ses TROIS cas (la fiche §7) — « un côté
//     manquant NE PRODUIT JAMAIS DE VERDICT, et surtout jamais un
//     "surconfiant" injuste fabriqué par un faux négatif d'extraction » ;
//   · que le verdict NOMME LA DIMENSION, jamais l'observable (RR4).
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  phaseServie, candidates, offreSeJugerMaison, comparerAuSquelette,
  gardeIndetermine, verdictDeCalibration, QUESTIONS_MAX,
} from './juger'
import type { InstrumentLu } from '../routeur/observables'
import type { Mesure } from '../routeur/mesure'
import type { Competence, QuestionServie } from './types'

const EVALUEE = { structure: 'evaluee', argumentation: 'evaluee' }
const SILENCIEUSE = { structure: 'mesuree_silencieusement' }

const question = (c: Competence, code: string, v = '3.1'): QuestionServie => ({
  competence: c, observable_code: code,
  dimension_eleve: `la dimension de ${code}`,
  question: `Question sur ${code} ?`,
  reponses: ['aucune', 'une ou deux', 'plusieurs'],
  fiche_version: v,
})

// ── Les conditions ──────────────────────────────────────────────────────────

test('la phase n’est servie qu’en geste PRODUIRE', () => {
  assert.equal(phaseServie('diagnostiquer', 'meso', ['structure'], EVALUEE).servie, false)
  assert.equal(phaseServie('transformer', 'meso', ['structure'], EVALUEE).servie, false)
  assert.equal(phaseServie('produire', 'meso', ['structure'], EVALUEE).servie, true)
})

test('la phase n’est servie qu’aux grains MESO et MACRO', () => {
  assert.equal(phaseServie('produire', 'micro', ['structure'], EVALUEE).servie, false)
  assert.equal(phaseServie('produire', 'macro', ['structure'], EVALUEE).servie, true)
})

test('⚠️ AUCUNE compétence ciblée `evaluee` → la phase ne se sert pas (la fiche §6, flux 1)', () => {
  const r = phaseServie('produire', 'meso', ['structure'], SILENCIEUSE)
  assert.equal(r.servie, false)
  assert.match(r.motif ?? '', /evaluee/)
})

test('aucune cible du tout → pas de phase, et le motif le dit', () => {
  assert.equal(phaseServie('produire', 'meso', [], EVALUEE).servie, false)
})

// ── L'élection ──────────────────────────────────────────────────────────────

const INSTRUMENT: InstrumentLu = {
  observablesMesure: {
    a: { famille: 'comptage', reussie: 'au_plus', seuil: 0 },
    b: { famille: 'comptage', reussie: 'au_plus', seuil: 0 },
    c: { famille: 'comptage', reussie: 'au_plus', seuil: 0 },
  },
  parametres: {},
}
const m = (o: Record<string, number>): Mesure => ({ observables: o } as unknown as Mesure)

test('les plus FRAGILES d’abord — le taux le plus bas ouvre la liste', () => {
  const cs = candidates(
    [{ competence: 'structure', observables: ['a', 'b', 'c'] }],
    { structure: [m({ a: 5, b: 0, c: 0 }), m({ a: 5, b: 1, c: 0 })] },
    { structure: INSTRUMENT },
  )
  assert.equal(cs[0].observable_code, 'a', 'il rate les deux fois')
  assert.equal(cs[cs.length - 1].observable_code, 'c', 'il réussit les deux fois')
})

test('un observable SANS TAUX reste candidat, mais passe APRÈS les classables', () => {
  const cs = candidates(
    [{ competence: 'structure', observables: ['a', 'inconnu'] }],
    { structure: [m({ a: 5 })] },
    { structure: INSTRUMENT },
  )
  assert.equal(cs[0].observable_code, 'a')
  assert.equal(cs[1].observable_code, 'inconnu')
  assert.equal(cs[1].taux, null)
})

test('sans instrument, toutes les candidates sont sans taux — et la phase sert quand même', () => {
  const cs = candidates(
    [{ competence: 'structure', observables: ['a', 'b'] }], {}, { structure: null })
  assert.equal(cs.length, 2)
  assert.ok(cs.every((x) => x.taux === null))
})

test('au plus TROIS questions — « deux à trois »', () => {
  const banque = ['a', 'b', 'c', 'd'].map((x) => question('structure', x))
  const o = offreSeJugerMaison(
    ['a', 'b', 'c', 'd'].map((x) => ({ competence: 'structure' as Competence, observable_code: x, taux: 0.1 })),
    banque, 'depot-1')
  assert.equal(o.questions.length, QUESTIONS_MAX)
})

test('⭐ le TIRAGE se JOURNALISE quand il départage des ex æquo (la fiche §4)', () => {
  const banque = ['a', 'b', 'c', 'd', 'e'].map((x) => question('structure', x))
  const o = offreSeJugerMaison(
    ['a', 'b', 'c', 'd', 'e'].map((x) => ({
      competence: 'structure' as Competence, observable_code: x, taux: 0.5,
    })),
    banque, 'depot-1')
  assert.ok(o.tirage, 'un départage non journalisé rend le comportement irreproductible')
  assert.equal(o.tirage?.ex_aequo.length, 5)
  assert.equal(o.tirage?.retenues.length, QUESTIONS_MAX)
})

test('sans ex æquo, aucun tirage n’est journalisé — il n’y a rien eu à départager', () => {
  const banque = ['a', 'b', 'c'].map((x) => question('structure', x))
  const o = offreSeJugerMaison(
    [['a', 0.1], ['b', 0.4], ['c', 0.6]].map(([x, t]) => ({
      competence: 'structure' as Competence, observable_code: x as string, taux: t as number,
    })),
    banque, 'depot-1')
  assert.equal(o.tirage, null)
})

test('le tirage est STABLE sur un même dépôt — servir deux jeux mesurerait deux élèves', () => {
  const banque = ['a', 'b', 'c', 'd', 'e'].map((x) => question('structure', x))
  const cs = ['a', 'b', 'c', 'd', 'e'].map((x) => ({
    competence: 'structure' as Competence, observable_code: x, taux: 0.5,
  }))
  const un = offreSeJugerMaison(cs, banque, 'depot-7')
  const deux = offreSeJugerMaison(cs, banque, 'depot-7')
  assert.deepEqual(un.questions.map((q) => q.observable_code),
    deux.questions.map((q) => q.observable_code))
})

test('⚠️ `questions_version` CITE la fiche — et vaut `null` si les versions divergent', () => {
  const cs = ['a', 'b'].map((x) => ({
    competence: 'structure' as Competence, observable_code: x, taux: 0.1,
  }))
  assert.equal(offreSeJugerMaison(cs,
    [question('structure', 'a', '3.1'), question('structure', 'b', '3.1')], 'd').version, '3.1')
  assert.equal(offreSeJugerMaison(cs,
    [question('structure', 'a', '3.1'), question('structure', 'b', '2.9')], 'd').version, null,
  'deux versions mêlées : on ne tranche pas à leur place')
})

test('un observable élu sans question en banque est SIGNALÉ, jamais fabriqué', () => {
  const o = offreSeJugerMaison(
    [{ competence: 'structure', observable_code: 'orphelin', taux: 0.1 }], [], 'd')
  assert.deepEqual(o.questions, [])
  assert.deepEqual(o.sansQuestion, ['structure|orphelin'])
})

// ── La comparaison, et la garde ─────────────────────────────────────────────

test('la comparaison consigne LES DEUX CÔTÉS, observable par observable', () => {
  const qs = [question('structure', 'a')]
  const c = comparerAuSquelette(qs, { 'structure|a': 'plusieurs' }, { structure: { a: 3 } })
  assert.equal(c[0].reponse_eleve, 'plusieurs')
  assert.equal(c[0].valeur_squelette, 3)
  assert.equal(c[0].affirme_un_observable_absent, false)
})

test('⚠️ `accord` reste NULL : la correspondance ne déclare pas quelle réponse vaut « réussi »', () => {
  const c = comparerAuSquelette([question('structure', 'a')],
    { 'structure|a': 'aucune' }, { structure: { a: 0 } })
  assert.equal(c[0].accord, null, 'on consigne, on ne devine pas — collecter d’abord, convertir ensuite')
})

test('⭐ TROISIÈME CAS DE LA GARDE : l’élève répond sur un observable que le squelette NE PORTE PAS', () => {
  const c = comparerAuSquelette([question('structure', 'absent')],
    { 'structure|absent': 'plusieurs' }, { structure: { a: 1 } })
  assert.equal(c[0].affirme_un_observable_absent, true)
  assert.equal(c[0].valeur_squelette, null)
})

test('`n/a` N’EST PAS une valeur portée : c’est « rien à mesurer »', () => {
  const c = comparerAuSquelette([question('structure', 'a')],
    { 'structure|a': 'plusieurs' }, { structure: { a: 'n/a' } })
  assert.equal(c[0].affirme_un_observable_absent, true)
})

test('ne pas répondre n’est pas AFFIRMER — la garde ne se déclenche pas', () => {
  const c = comparerAuSquelette([question('structure', 'absent')],
    { 'structure|absent': '   ' }, { structure: { a: 1 } })
  assert.equal(c[0].affirme_un_observable_absent, false)
})

test('la garde `indetermine` a TROIS cas, et un côté manquant NE PRODUIT JAMAIS DE VERDICT', () => {
  const vide = comparerAuSquelette([question('structure', 'a')],
    { 'structure|a': 'aucune' }, { structure: { a: 0 } })

  const sansConfiance = gardeIndetermine(vide, false, true)
  assert.equal(sansConfiance.indetermine, true)
  assert.match(sansConfiance.motif ?? '', /confiance/)

  const sansNiveau = gardeIndetermine(vide, true, false)
  assert.equal(sansNiveau.indetermine, true)
  assert.match(sansNiveau.motif ?? '', /aucun niveau/)

  const affirme = comparerAuSquelette([question('structure', 'absent')],
    { 'structure|absent': 'plusieurs' }, { structure: {} })
  const troisieme = gardeIndetermine(affirme, true, true)
  assert.equal(troisieme.indetermine, true)
  assert.match(troisieme.motif ?? '', /ne porte pas/)
})

test('les deux côtés présents et aucune affirmation absente : la garde NE se déclenche pas', () => {
  const c = comparerAuSquelette([question('structure', 'a')],
    { 'structure|a': 'aucune' }, { structure: { a: 0 } })
  assert.equal(gardeIndetermine(c, true, true).indetermine, false)
})

// ── Le verdict ──────────────────────────────────────────────────────────────

test('⭐ le verdict NOMME LA DIMENSION, et JAMAIS le code de l’observable (RR4)', () => {
  const c = comparerAuSquelette([question('structure', 'charniere_motivee')],
    { 'structure|charniere_motivee': 'plusieurs' }, { structure: {} })
  const v = verdictDeCalibration(c, { 'structure|charniere_motivee': 'la raison du passage' })
  assert.equal(v.lignes[0].dimension_eleve, 'la raison du passage')
  assert.equal(v.phrase?.includes('charniere_motivee'), false, 'le code EST la grille')
})

test('il se formule « nous n’avons pas vu la même chose », jamais comme un verdict', () => {
  const c = comparerAuSquelette([question('structure', 'x')],
    { 'structure|x': 'plusieurs' }, { structure: {} })
  const v = verdictDeCalibration(c, { 'structure|x': 'la dimension' })
  assert.match(v.phrase ?? '', /pas vu la même chose/)
  assert.match(v.phrase ?? '', /Es-tu d’accord/)
})

test('sans formulation, la ligne N’EST PAS RENDUE — plutôt rien qu’un code de grille', () => {
  const c = comparerAuSquelette([question('structure', 'x')],
    { 'structure|x': 'plusieurs' }, { structure: {} })
  assert.deepEqual(verdictDeCalibration(c, {}).lignes, [])
})

test('rien à dire → aucune phrase : on n’annonce pas un désaccord qui n’existe pas', () => {
  const c = comparerAuSquelette([question('structure', 'a')],
    { 'structure|a': 'aucune' }, { structure: { a: 0 } })
  assert.equal(verdictDeCalibration(c, { 'structure|a': 'la dimension' }).phrase, null)
})
