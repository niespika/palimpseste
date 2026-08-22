// ============================================================================
// C4 · L4 — CE QUE LA RÉVÉLATION GRADUÉE DOIT TENIR.
// ----------------------------------------------------------------------------
// « Ce n'est pas une préférence d'affichage : IL JUGE AVANT DE VOIR LA MACHINE
//   — le même esprit que le protocole de ses bancs. »            — piège 27
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { PointRetour } from '@/utils/chaine/types'
import {
  auCran, sommaireDuRetour, accompagnementVisible, refuserEdition,
  identifiantsInconnus, CRAN_INITIAL, CRANS_DE_REVELATION, PREFIXE_POINT_DU_PROF,
} from './revelation'

const point = (o: Partial<PointRetour> & { id: string }): PointRetour => ({
  ancrage: { source: 'copie', citation: 'un verbatim de la copie' },
  texte: 'un point de retour',
  competence: 'structure',
  nature: 'point_de_travail',
  ...o,
})

const RETOUR: PointRetour[] = [
  point({ id: 'p1', competence: 'structure', nature: 'point_de_travail' }),
  point({ id: 'p2', competence: 'structure', nature: 'reussite' }),
  point({ id: 'p3', competence: 'expression', nature: 'point_de_travail' }),
]

// ── Le masquage ─────────────────────────────────────────────────────────────

test('le cran d\'ouverture est MASQUÉ — c\'est le défaut, pas une préférence', () => {
  assert.equal(CRAN_INITIAL, 0)
  assert.deepEqual(auCran(RETOUR, CRAN_INITIAL), [])
})

test('les quatre crans vont du plus sommaire au plus détaillé, sans trou', () => {
  assert.deepEqual(CRANS_DE_REVELATION.map((c) => c.cran), [0, 1, 2, 3])
})

test('cran 1 — LE COMPTE : ni texte, ni citation ; l\'identifiant survit', () => {
  const vus = auCran(RETOUR, 1)
  assert.equal(vus.length, 3)
  for (const p of vus) {
    assert.equal(p.texte, '', 'aucun texte au cran du compte')
    assert.equal(p.ancrage.citation, '', 'aucune citation au cran du compte')
    assert.notEqual(p.id, '', 'l\'identifiant stable survit — la contestation s\'y accroche')
  }
})

test('cran 2 — LES POINTS : le texte, mais AUCUNE citation', () => {
  const vus = auCran(RETOUR, 2)
  assert.equal(vus[0].texte, 'un point de retour')
  for (const p of vus) assert.equal(p.ancrage.citation, '')
  assert.equal(accompagnementVisible(2), false)
})

test('cran 3 — LE DÉTAIL : les citations reviennent, et l\'accompagnement avec', () => {
  const vus = auCran(RETOUR, 3)
  assert.equal(vus[0].ancrage.citation, 'un verbatim de la copie')
  assert.equal(accompagnementVisible(3), true)
})

test('révéler ne MUTE JAMAIS le retour d\'origine — remasquer doit tout rendre', () => {
  const original = JSON.parse(JSON.stringify(RETOUR)) as PointRetour[]
  auCran(RETOUR, 1)
  auCran(RETOUR, 2)
  auCran(RETOUR, 3)
  assert.deepEqual(RETOUR, original)
})

test('le sommaire compte par compétence, réussites et points de travail séparés', () => {
  const s = sommaireDuRetour(RETOUR)
  assert.equal(s.total, 3)
  assert.deepEqual(s.parCompetence, [
    { competence: 'expression', reussites: 0, pointsDeTravail: 1 },
    { competence: 'structure', reussites: 1, pointsDeTravail: 1 },
  ])
})

test('un retour vide se sommarise sans lever, et ne dit rien de faux', () => {
  const s = sommaireDuRetour([])
  assert.equal(s.total, 0)
  assert.deepEqual(s.parCompetence, [])
})

// ── La forme du retour édité ────────────────────────────────────────────────

test('le professeur peut écrire une remarque SANS ancrage — « il peut modifier le retour »', () => {
  const edite: PointRetour[] = [{
    id: 'p1', texte: 'attention à ta conclusion',
    competence: 'structure', nature: 'point_de_travail',
    ancrage: undefined as unknown as PointRetour['ancrage'],
  }]
  assert.equal(refuserEdition(edite), null)
})

test('un point SANS identifiant est refusé — la contestation s\'accroche dessus', () => {
  const edite = [point({ id: '  ' })]
  assert.ok(refuserEdition(edite)?.motif.includes('identifiant'))
})

test('un texte fait d\'espaces est refusé — c\'est ce que la garde en base dit aussi', () => {
  assert.ok(refuserEdition([point({ id: 'p1', texte: '   ' })])?.motif.includes('vide'))
})

test('deux points au même identifiant sont refusés', () => {
  assert.ok(refuserEdition([point({ id: 'p1' }), point({ id: 'p1' })])?.motif.includes('p1'))
})

test('un ancrage FOURNI reste bien formé, même côté professeur', () => {
  const edite = [point({ id: 'p1', ancrage: { source: 'copie', citation: '  ' } })]
  assert.ok(refuserEdition(edite)?.motif.includes('sans citation'))
})

test('L\'ÉDITION CONSERVE LES IDENTIFIANTS, elle n\'en refabrique pas', () => {
  assert.deepEqual(identifiantsInconnus([point({ id: 'p1' })], RETOUR), [])
  assert.deepEqual(identifiantsInconnus([point({ id: 'inventé' })], RETOUR), ['inventé'])
})

test('un point AJOUTÉ par le professeur se reconnaît à son préfixe et passe', () => {
  const ajoute = point({ id: `${PREFIXE_POINT_DU_PROF}remarque-1` })
  assert.deepEqual(identifiantsInconnus([ajoute], RETOUR), [])
})

test('retirer un point est licite : l\'édition peut être PLUS COURTE que l\'engendré', () => {
  assert.equal(refuserEdition([point({ id: 'p1' })]), null)
  assert.deepEqual(identifiantsInconnus([point({ id: 'p1' })], RETOUR), [])
})
