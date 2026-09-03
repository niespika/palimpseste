// Tests de garde des passages clés (E4). Exécution : `npm test`.
// (1) la vérification rejette ce que le spec rejette (§ 4.2) ; (2) les pivots gardent leur
// texte ; (3) le ré-alignement retrouve une pivot déplacée et marque « à revoir » sinon ;
// (4) parsePassages tolère le jsonb.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { construireDecoupeSemaine } from './decoupage'
import { validerPassages, realignerPassage, normaliserPassage, parsePassages, numeroterSemaine, bornesPassage, type PassageCle } from './passages'

const T = 'Un. Deux est là. Trois suit. Quatre parle de la règle. Cinq conclut. Six ouvre. Sept ferme. Huit finit.'
const D = construireDecoupeSemaine(12, T)   // s12-001 … s12-008

test('numérotation : une ligne par phrase, identifiant entre crochets, texte rendu', () => {
  const n = numeroterSemaine(T, D).split('\n')
  assert.equal(n.length, 8)
  assert.equal(n[3], '[s12-004] Quatre parle de la règle.')
})

test('un passage valide est accepté, identifié k{semaine}-{n}, avec le texte de ses pivots', () => {
  const r = validerPassages({ passages: [{ role: 'these', libelle: 'la phrase où la règle est formulée', passage: ['s12-002', 's12-005'], pivots: [['s12-004']] }] }, D, T, 'v1')
  assert.equal(r.rejets.length, 0)
  assert.equal(r.passages.length, 1)
  assert.equal(r.passages[0].id, 'k12-1')
  assert.deepEqual(r.passages[0].pivots_texte, ['Quatre parle de la règle.'])
  assert.equal(r.passages[0].decoupage_version, 'v1')
  assert.deepEqual(bornesPassage(D, r.passages[0]), [D.phrases[1].bornes[0], D.phrases[4].bornes[1]])
})

test('rejets : id inconnu, passage inversé, taille, pivot hors passage, pivot non contiguë, pivot à trou, libellé vide', () => {
  const cas = [
    [{ libelle: 'x', passage: ['s12-002', 's12-099'], pivots: [['s12-003']] }, 'id_passage_inconnu'],
    [{ libelle: 'x', passage: ['s12-005', 's12-002'], pivots: [['s12-003']] }, 'passage_inverse'],
    [{ libelle: 'x', passage: ['s12-002', 's12-002'], pivots: [['s12-002']] }, 'passage_taille'],
    [{ libelle: 'x', passage: ['s12-002', 's12-004'], pivots: [['s12-006']] }, 'pivot_hors_passage'],
    [{ libelle: 'x', passage: ['s12-001', 's12-008'], pivots: [['s12-002', 's12-004']] }, 'pivot_non_contigue'],
    [{ libelle: 'x', passage: ['s12-001', 's12-008'], pivots: [['s12-002', 's12-003', 's12-004']] }, 'pivot_taille'],
    [{ libelle: '', passage: ['s12-001', 's12-004'], pivots: [['s12-002']] }, 'libelle_vide'],
    [{ libelle: 'x', passage: ['s12-001', 's12-004'], pivots: [] }, 'pas_de_pivot'],
  ] as const
  for (const [p, motif] of cas) {
    const r = validerPassages({ passages: [p] }, D, T)
    assert.equal(r.passages.length, 0, motif)
    assert.ok(r.rejets[0].motifs.includes(motif), `${motif} attendu, reçu ${r.rejets[0].motifs}`)
  }
})

test('deux alternatives de pivots sont gardées ; au-delà de quatre passages, rejet « trop_de_passages »', () => {
  const p = { libelle: 'x', passage: ['s12-001', 's12-006'], pivots: [['s12-002'], ['s12-004', 's12-005']] }
  const r = validerPassages({ passages: [p, p, p, p, p] }, D, T)
  assert.equal(r.passages.length, 4)
  assert.deepEqual(r.passages[0].pivots, [['s12-002'], ['s12-004', 's12-005']])
  assert.deepEqual(r.passages[0].pivots_texte, ['Deux est là.', 'Quatre parle de la règle. Cinq conclut.'])
  assert.deepEqual(r.rejets, [{ index: 4, motifs: ['trop_de_passages'] }])
})

test('ré-alignement : la pivot retrouvée plus loin recale le passage ; introuvable ⇒ à revoir', () => {
  const p: PassageCle = { id: 'k12-1', role: 'these', libelle: 'la règle', phrase_debut: 's12-002', phrase_fin: 's12-005', pivots: [['s12-004']], pivots_texte: ['Quatre parle de la règle.'] }
  // Nouvelle version : deux phrases ajoutées en tête → la pivot est maintenant la 6e phrase.
  const T2 = 'Zéro nouveau. Zéro bis. ' + T
  const D2 = construireDecoupeSemaine(12, T2)
  const r = realignerPassage(p, T2, D2, 'v2')
  assert.deepEqual(r.pivots, [['s12-006']])
  assert.equal(r.phrase_debut, 's12-004')
  assert.equal(r.phrase_fin, 's12-007')
  assert.equal(r.revoir, undefined)
  assert.equal(r.decoupage_version, 'v2')
  const T3 = 'Un. Deux est là. Trois suit. Cinq conclut. Six ouvre. Sept ferme.'
  const r3 = realignerPassage(p, T3, construireDecoupeSemaine(12, T3), 'v3')
  assert.equal(r3.revoir, true)
})

test('normaliserPassage : bornes inversées remises dans l’ordre, pivots hors passage écartées, ids inconnus ⇒ null', () => {
  const p: PassageCle = { id: 'k12-1', role: 'these', libelle: ' x ', phrase_debut: 's12-005', phrase_fin: 's12-002', pivots: [['s12-004'], ['s12-007']], pivots_texte: [] }
  const n = normaliserPassage(p, D, T)!
  assert.equal(n.phrase_debut, 's12-002'); assert.equal(n.phrase_fin, 's12-005')
  assert.deepEqual(n.pivots, [['s12-004']]); assert.equal(n.libelle, 'x')
  assert.equal(normaliserPassage({ ...p, phrase_debut: 's12-099' }, D, T), null)
})

test('parsePassages tolère le jsonb : entrées incomplètes écartées, types forcés', () => {
  const r = parsePassages([{ phrase_debut: 's1-001', phrase_fin: 's1-003', pivots: [['s1-002'], 'pas une liste'], pivots_texte: ['a', 3], revoir: true }, { id: 'sans bornes' }, null])
  assert.equal(r.length, 1)
  assert.deepEqual(r[0].pivots, [['s1-002']])
  assert.deepEqual(r[0].pivots_texte, ['a'])
  assert.equal(r[0].revoir, true)
  assert.equal(r[0].role, 'these')
})
