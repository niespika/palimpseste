// ============================================================================
// LE TROISIÈME VOLET DE L'ITEM 85 — « et rien ne le dit ».
// ============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { PREFIXE_ETAT_PERDU, motifDesEtatsPerdus } from './bilan-motifs'

const perte = (m: string) => `${PREFIXE_ETAT_PERDU}${m}`

describe('`motifDesEtatsPerdus` — une écriture perdue se dit, sans condition', () => {
  test('⛔ LE CAS RÉEL — la perte du 27/08 aurait parlé', () => {
    // La charge portait `expression` (déjà lettrée) et `synthese` (neuve) : la
    // garde a levé, tout le lot est parti, et le job a affiché « retour écrit,
    // 6 appel(s), 64 s » — pas un mot. Désormais :
    const m = motifDesEtatsPerdus([
      perte('charge de niveaux refusée (expression, synthese) : jeux de clés HÉTÉROGÈNES'),
    ])
    assert.match(m, /1 ÉCRITURE\(S\) D'ÉTAT PERDUE\(S\)/)
    assert.match(m, /expression, synthese/, 'les compétences perdues sont NOMMÉES')
  })

  test('⛔ ELLE NE DIT QUE LES PERTES — un écartement légitime n\'en est pas une', () => {
    // « état de X non réécrit » est le motif d'un écartement voulu : il relève de
    // `motifDesEcartees`, et le confondre ferait crier au vol sur un cas normal.
    assert.equal(motifDesEtatsPerdus([
      'état de synthese non réécrit — sans lettre, et aucune ANCRE',
      'retour refusé : RR4',
    ]), '')
  })

  test('aucune alerte, aucun motif — le bilan ne s\'allonge pas pour rien', () => {
    assert.equal(motifDesEtatsPerdus([]), '')
  })

  test('⭐ plusieurs pertes se comptent ET se détaillent', () => {
    const m = motifDesEtatsPerdus([perte('a'), 'bruit', perte('b')])
    assert.match(m, /2 ÉCRITURE\(S\)/)
    assert.match(m, /a \| b/)
  })

  test('⭐ LE COMPTE SURVIT À LA TRONCATURE — c\'est la leçon de `motifDesEcartees`', () => {
    const m = motifDesEtatsPerdus([perte('x'.repeat(900))])
    assert.match(m, /1 ÉCRITURE\(S\) D'ÉTAT PERDUE\(S\)/, 'le fait est avant le détail')
    assert.ok(m.endsWith('…'), 'et le détail est borné')
    assert.ok(m.length < 500)
  })
})
