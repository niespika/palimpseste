import { test } from 'node:test'
import assert from 'node:assert/strict'
import { phasesDiagnostic } from './diagnostic'
import { niveauThese } from '../../app/prof/aletheia/diagnostic'
import type { DiagnosticTravail } from '../../app/eleve/modules/aletheia/types'

test('seules les phases dont le retour est enregistré sont diagnostiquables', () => {
  for (const statut of ['DRAFT', 'V1_SUBMITTED', 'inconnu']) assert.deepEqual(phasesDiagnostic(statut), { v1: false, vf: false })
  for (const statut of ['FEEDBACK1_READY', 'VF_SUBMITTED']) assert.deepEqual(phasesDiagnostic(statut), { v1: true, vf: false })
  for (const statut of ['FEEDBACK2_READY', 'DONE']) assert.deepEqual(phasesDiagnostic(statut), { v1: true, vf: true })
})

test('une thèse VF non définie ne reprend jamais le niveau de la V1', () => {
  const d = { niveau_these_v1: 3, niveau_these_vf: null, these_mal_definie_v1: false, these_mal_definie_vf: true } as DiagnosticTravail
  assert.equal(niveauThese(d), null)
  assert.equal(niveauThese({ ...d, these_mal_definie_vf: null }), 3)
  assert.equal(niveauThese({ ...d, these_mal_definie_vf: false, niveau_these_vf: 0 }), 0)
  assert.equal(niveauThese(undefined), null)
})

import { lettreNiveau, parseInventaire, parseNiveaux, exigerReference } from './diagnostic'
import type { ReferenceChapitre } from '../../app/eleve/modules/aletheia/types'

test('les lettres ne sont jamais extraites des mots ; les formats indéterminés échouent', () => {
  for (const s of ['B', 'b', 'niveau B', 'B (Solide)']) assert.equal(lettreNiveau(s), 3)
  for (const s of ['indisponible', 'inconnu', 'B ou C', '', null, 3, 'absence']) assert.throws(() => lettreNiveau(s))
})
test('une mesure vide ou sans étalon échoue ; absence de compréhension et non-applicabilité restent distinctes', () => {
  assert.throws(() => parseInventaire({}))
  assert.throws(() => parseNiveaux({}))
  assert.throws(() => exigerReference(null))
  assert.throws(() => exigerReference({ these_canonique: '', arguments_cles: ['x'] } as ReferenceChapitre))
  const vide = { these_eleve: '', note: 'Aucune idée exprimée.', these_mal_definie: false, arguments_captes: [], arguments_rates: ['Argument attendu'], arguments_deformes: [] }
  assert.equal(parseInventaire(vide).these_eleve, '')
  assert.deepEqual(parseNiveaux({ niveau_these: 'E', niveau_arguments: 'E', these_mal_definie: false }), { niveau_these: 0, niveau_arguments: 0, these_mal_definie: false })
  assert.throws(() => parseNiveaux({ niveau_these: null, niveau_arguments: 'B', these_mal_definie: false }))
  assert.equal(parseNiveaux({ niveau_these: null, niveau_arguments: 'B', these_mal_definie: true }).niveau_these, null)
  assert.throws(() => parseNiveaux({ niveau_these: 'B', niveau_arguments: 'B', these_mal_definie: true }))
  assert.equal(parseNiveaux({ niveau_these: 'B', niveau_arguments: null, these_mal_definie: false }, false, true).niveau_arguments, null)
  assert.equal(parseNiveaux({ niveau_these: 'B', niveau_arguments: 'A', these_mal_definie: false }, false, true).niveau_arguments, null)
})
