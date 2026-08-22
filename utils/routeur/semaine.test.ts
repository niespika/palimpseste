// « Trois phases, QUI NE SE MÉLANGENT PAS » (`01-` §5). La phase A ne regarde
// jamais le temps ; la phase B ne rouvre jamais l'élection ; la phase C ne pose
// aucun exercice.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ciblesPossibles, poserLaSemaine, poserLesSondes, type Candidat, type Substrat,
} from './semaine'
import type { EntreeDePriorite } from './ciblage'
import type { SondeClassee } from './sondes'
import type { Competence, Geste, Grain } from './types'

const budget = { plancher: 45, plafond: 60, optionnel: 30 }

let k = 0
function cand(competence: Competence, o: Partial<Candidat> = {}): Candidat {
  k++
  return { exerciceId: `e${k}`, competence, grain: 'meso', geste: 'produire',
    cran: 'production_etayee', mode: 'composer', dureeMin: 15, ciblesSecondaires: [], ...o }
}
const entree = (competence: Competence): EntreeDePriorite =>
  ({ competence, regle: 'R2', motif: '' })

// ── La largeur de mesure — elle SE DÉRIVE ──────────────────────────────────

test('`produire` déclare `exerce` : PLUSIEURS cibles, dans le plafond du grain', () => {
  const r = ciblesPossibles('produire', 'macro',
    { expression: 'exerce', argumentation: 'exerce', structure: 'exerce' })
  assert.equal(r.plafond, 3, 'macro : trois cibles')
  assert.equal(ciblesPossibles('produire', 'meso', {}).plafond, 2)
  assert.equal(ciblesPossibles('produire', 'micro', {}).plafond, 1)
})

test('`transformer` et `diagnostiquer` déclarent `isole` : UNE SEULE cible, quel que soit le grain', () => {
  for (const geste of ['transformer', 'diagnostiquer'] as Geste[]) {
    for (const grain of ['micro', 'meso', 'macro'] as Grain[]) {
      assert.equal(ciblesPossibles(geste, grain, {}).plafond, 1, `${geste} au ${grain}`)
    }
  }
})

test('`observable_seul` est MATÉRIAU DE MESURE, JAMAIS CIBLE', () => {
  const r = ciblesPossibles('produire', 'macro',
    { expression: 'exerce', connaissance: 'observable_seul' })
  assert.deepEqual(r.ciblables, ['expression'])
  assert.deepEqual(r.observableSeul, ['connaissance'])
})

// ── Phase B ────────────────────────────────────────────────────────────────

test('PB6 : on remplit tant qu\'un exercice tient sous LE PLAFOND — jamais au-delà', () => {
  const s = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
    (c) => [cand(c, { dureeMin: 20 })])
  assert.ok(s.minutesAssignees <= budget.plafond, `${s.minutesAssignees} min > 60`)
  assert.equal(s.minutesAssignees, 60, 'trois exercices de 20 min tiennent exactement')
})

test('PB6 : le reliquat sous 5 MINUTES est perdu, et ça se journalise', () => {
  const s = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
    (c) => [cand(c, { dureeMin: 28 })])
  assert.equal(s.minutesAssignees, 56)
  assert.equal(s.journal.reliquatPerdu, 4)
  assert.match(s.journal.motifArret, /perdu/)
})

test('PB2 : JAMAIS DEUX FOIS DE SUITE la même compétence — contrainte DURE', () => {
  const s = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
    (c) => [cand(c, { dureeMin: 10 })])
  const suite = s.exercices.map((e) => e.candidat.competence)
  for (let i = 1; i < suite.length; i++) {
    assert.notEqual(suite[i], suite[i - 1], `deux ${suite[i]} de suite en position ${i}`)
  }
})

test('PB2 tient AUSSI À LA COUTURE entre deux tours, et la permutation se journalise', () => {
  // Une liste de deux : au second tour, la couture ramènerait `structure` juste
  // après `argumentation`… non — elle ramènerait la première après la dernière.
  const s = poserLaSemaine([entree('structure'), entree('argumentation'), entree('synthese')],
    budget, (c) => [cand(c, { dureeMin: 10 })])
  const suite = s.exercices.map((e) => e.candidat.competence)
  for (let i = 1; i < suite.length; i++) assert.notEqual(suite[i], suite[i - 1])
  assert.ok(s.exercices.some((e) => e.tour > 0), 'PB5 a bien reparcouru la liste')
})

test('PB5 : la liste épuisée SE REPARCOURT DANS LE MÊME ORDRE', () => {
  const s = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
    (c) => [cand(c, { dureeMin: 10 })])
  const tour0 = s.exercices.filter((e) => e.tour === 0).map((e) => e.candidat.competence)
  const tour1 = s.exercices.filter((e) => e.tour === 1).map((e) => e.candidat.competence)
  assert.deepEqual(tour0, ['structure', 'argumentation'])
  assert.ok(tour1.length > 0, 'un second tour a bien eu lieu')
})

test('PB1 : on commence par LE PLUS PETIT GRAIN DISPONIBLE', () => {
  const s = poserLaSemaine([entree('structure')], budget, (c) => [
    cand(c, { grain: 'macro', dureeMin: 30 }),
    cand(c, { grain: 'micro', dureeMin: 8 }),
    cand(c, { grain: 'meso', dureeMin: 15 }),
  ])
  assert.equal(s.exercices[0].candidat.grain, 'micro')
})

test('PB3 : à grain égal, on préfère l\'exercice QUI CHANGE de cran, de mode ou de grain', () => {
  let appel = 0
  const s = poserLaSemaine([entree('structure'), entree('argumentation')], budget, (c) => {
    appel++
    if (appel === 1) return [cand(c, { dureeMin: 10, cran: 'production_etayee', mode: 'composer' })]
    return [
      cand(c, { dureeMin: 10, cran: 'production_etayee', mode: 'composer' }),
      cand(c, { dureeMin: 10, cran: 'transformation_aveugle', mode: 'expliquer' }),
    ]
  })
  assert.equal(s.exercices[1].candidat.cran, 'transformation_aveugle', 'celui qui change')
  assert.equal(s.exercices[1].departageParPB3, true, 'et le départage se journalise')
})

// ── « Le plafond borne, le plancher signale » ──────────────────────────────

test('sous le plancher : l\'écart SE JOURNALISE et le solde revient À LA VOIE MIXTE', () => {
  const s = poserLaSemaine([entree('structure')], budget, () => [])
  assert.equal(s.minutesAssignees, 0)
  assert.equal(s.ecart.souSLePlancher, true)
  assert.equal(s.ecart.manque, 45)
  assert.equal(s.journal.voieMixte, true, 'un RÉGIME NORMAL, pas un repli')
})

test('aucune compétence ciblable : la semaine ENTIÈRE revient à la voie mixte', () => {
  const s = poserLaSemaine([], budget, () => [])
  assert.deepEqual(s.exercices, [])
  assert.equal(s.journal.voieMixte, true)
  assert.match(s.journal.motifArret, /voie mixte/)
})

test('plancher atteint : rien à journaliser', () => {
  const s = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
    (c) => [cand(c, { dureeMin: 15 })])
  assert.equal(s.minutesAssignees, 60)
  assert.equal(s.ecart.souSLePlancher, false)
  assert.equal(s.journal.voieMixte, false)
})

// ── Phase C — les sondes ───────────────────────────────────────────────────

const classee = (competence: Competence, o: Partial<SondeClassee> = {}): SondeClassee =>
  ({ competence, priorite: 3, motif: 'plus_anciennement_mesuree', tirage: false, ...o })

const sub = (id: string, o: Partial<Substrat> = {}): Substrat => ({
  exerciceId: id, competences: ['structure', 'expression'], cibles: ['structure'],
  geste: 'produire', grain: 'meso', sondesDeja: 0, ...o })

const premier = (x: readonly string[]) => x[0]

test('PC2 : est substrat un exercice qui la LISTE et DONT ELLE N\'EST PAS LA CIBLE', () => {
  const { posees } = poserLesSondes([classee('expression')], [sub('e1')], premier)
  assert.equal(posees[0].exerciceId, 'e1')
  // La même compétence, cette fois en CIBLE : plus de substrat.
  const r = poserLesSondes([classee('structure')], [sub('e1')], premier)
  assert.deepEqual(r.posees, [])
  assert.deepEqual(r.sansSubstrat, ['structure'])
})

test('PC2 : le MEILLEUR substrat — d\'abord le GESTE, ensuite le GRAIN', () => {
  const { posees } = poserLesSondes([classee('expression')], [
    sub('diag', { geste: 'diagnostiquer', grain: 'macro' }),
    sub('prod', { geste: 'produire', grain: 'micro' }),
    sub('transf', { geste: 'transformer', grain: 'macro' }),
  ], premier)
  assert.equal(posees[0].exerciceId, 'prod', '`produire` prime, même au plus petit grain')
})

test('PC2 : à geste égal, le PLUS GROS GRAIN — « celui qui en montre le plus »', () => {
  const { posees } = poserLesSondes([classee('expression')], [
    sub('petit', { grain: 'micro' }), sub('gros', { grain: 'macro' }),
  ], premier)
  assert.equal(posees[0].exerciceId, 'gros')
})

test('PC3 : à égalité, l\'exercice QUI NE PORTE PAS ENCORE DE SONDE', () => {
  const { posees } = poserLesSondes([classee('expression')], [
    sub('deja', { sondesDeja: 1 }), sub('libre', { sondesDeja: 0 }),
  ], premier)
  assert.equal(posees[0].exerciceId, 'libre')
})

test('PC3 : à égalité PERSISTANTE, tirage — ET IL SE JOURNALISE', () => {
  const { posees } = poserLesSondes([classee('expression')],
    [sub('a'), sub('b')], (x) => x[1])
  assert.equal(posees[0].exerciceId, 'b')
  assert.equal(posees[0].tirage, true)
})

test('PC4 : sans substrat, pas de sonde — et elle GARDE SON RANG', () => {
  const r = poserLesSondes([classee('synthese'), classee('expression')], [sub('e1')], premier)
  assert.deepEqual(r.sansSubstrat, ['synthese'])
  assert.equal(r.posees.length, 1, 'l\'autre passe quand même')
})

test('PC5 : on s\'arrête au PLAFOND DE SONDES DU CYCLE', () => {
  const six: Competence[] = ['expression', 'argumentation', 'connaissance', 'synthese',
    'questionnement', 'structure']
  const substrats = six.map((_, i) => sub(`e${i}`, { competences: six, cibles: [] }))
  const { posees } = poserLesSondes(six.map((c) => classee(c)), substrats, premier)
  assert.equal(posees.length, 4)
})

test('« LE GRAIN NE BORNE PAS LES SONDES : il borne le retour »', () => {
  // Un micro peut porter plusieurs sondes ; son plafond de CIBLES vaut 1, pas ses sondes.
  const six: Competence[] = ['expression', 'argumentation', 'synthese', 'questionnement']
  const { posees } = poserLesSondes(six.map((c) => classee(c)),
    [sub('micro', { grain: 'micro', competences: six, cibles: [] })], premier)
  assert.equal(posees.length, 4, 'quatre sondes sur un seul micro')
  assert.ok(posees.every((p) => p.exerciceId === 'micro'))
})

test('PC1 : on parcourt LES COMPÉTENCES, dans l\'ordre du §8.9, chacune UNE FOIS', () => {
  const substrats = [sub('a', { competences: ['expression', 'synthese'], cibles: [] }),
    sub('b', { competences: ['expression', 'synthese'], cibles: [] })]
  const { posees } = poserLesSondes(
    [classee('synthese', { priorite: 1, motif: 'entretien_n3' }), classee('expression')],
    substrats, premier)
  assert.deepEqual(posees.map((p) => p.competence), ['synthese', 'expression'])
  assert.equal(posees[0].motif, 'entretien_n3', 'le motif se journalise')
  assert.equal(posees[0].priorite, 1)
})
