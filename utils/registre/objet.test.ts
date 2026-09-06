// C7-L7 — l'état d'un objet par élève : DÉRIVÉ, jamais stocké (`01-` v5.11 §4, couche 3).
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { auDessusDuPalier, bandeDuPalier, etatDeLObjet, numeroDuCran } from './objet'
import type { LigneRegistre } from './reussites'

const ligne = (cran: number, reussites: Array<[string, string]>, objet = 'argument'): LigneRegistre => ({
  objet, cran, variante: null, reussites: reussites.length, echecs: 0,
  serie: reussites.map(() => 'reussi' as const), dernierAt: reussites.at(-1)?.[0] ?? null,
  reussitesDatees: reussites.map(([at, devoir]) => ({ at, devoirs: [devoir] })),
})
// Deux réussites sur deux devoirs, à un cycle d'écart : le cran est TENU.
const tenu = (cran: number, objet = 'argument') => ligne(cran, [['2026-09-01T10:00:00Z', `${objet}-${cran}-a`], ['2026-09-08T10:00:00Z', `${objet}-${cran}-b`]], objet)
const TOUS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

describe('la bande d\'un palier, en numéros — sous_la_bande ∪ centre, jamais au_dessus (piège 3)', () => {
  it('E-D : 1·2·3·4·5 ; au-dessus 6·7·8. C : 4·5·6·7 ; au-dessus 8. B : 7·8 ; au-dessus 9. A : 8·9, rien au-dessus', () => {
    assert.deepEqual(bandeDuPalier('E'), [1, 2, 3, 4, 5])
    assert.deepEqual(bandeDuPalier('D'), [1, 2, 3, 4, 5])
    assert.deepEqual(auDessusDuPalier('D'), [6, 7, 8])
    assert.deepEqual(bandeDuPalier('C'), [4, 5, 6, 7])
    assert.deepEqual(auDessusDuPalier('C'), [8])
    assert.deepEqual(bandeDuPalier('B'), [7, 8])
    assert.deepEqual(bandeDuPalier('A'), [8, 9])
    assert.deepEqual(auDessusDuPalier('A'), [])
    // Sans lettre : la bande d'E-D, comme `sequenceDeMethode` sans palier connu.
    assert.deepEqual(bandeDuPalier(null), [1, 2, 3, 4, 5])
    assert.equal(numeroDuCran('production_guidee'), 2)
    assert.equal(numeroDuCran('inconnu'), null)
  })
})

describe('les trois états — en méthode, ouvert, tenu', () => {
  it('jamais servi sous le gabarit : EN MÉTHODE, quel que soit le registre', () => {
    const v = etatDeLObjet([tenu(1), tenu(3)], 'argument', false, 'D', TOUS)
    assert.equal(v.etat, 'methode')
    assert.match(v.motif, /semaine de méthode/)
  })

  it('déjà servi, un cran non tenu dans la bande : OUVERT, sur le cran non tenu le plus bas', () => {
    const v = etatDeLObjet([tenu(1)], 'argument', true, 'D', TOUS)
    assert.equal(v.etat, 'ouvert')
    assert.deepEqual(v.tenus, [1])
    assert.deepEqual(v.nonTenus, [2, 3, 4, 5])
    assert.equal(v.cranAServir, 2)
    // Le 1 tenu et le 4 ouvert non tenu ⇒ le 4 quand 2 et 3 le sont aussi (piège 13).
    assert.equal(etatDeLObjet([tenu(1), tenu(2), tenu(3)], 'argument', true, 'D', TOUS).cranAServir, 4)
  })

  it('⛔ deux réussites le même jour sur le même devoir ne tiennent pas le cran', () => {
    const memeTexte = ligne(1, [['2026-09-01T10:00:00Z', 'dev-a'], ['2026-09-01T11:00:00Z', 'dev-a']])
    const v = etatDeLObjet([memeTexte], 'argument', true, 'D', TOUS)
    assert.deepEqual(v.tenus, [])
    assert.equal(v.cranAServir, 1)
    assert.match(v.motif, /le 1 compte 1 réussite\(s\) sur 2/)
  })

  it('toute la bande tenue : TENU — il sort du centre, et rien ne le ferme', () => {
    const v = etatDeLObjet([tenu(1), tenu(2), tenu(3), tenu(4), tenu(5)], 'argument', true, 'D', TOUS)
    assert.equal(v.etat, 'tenu')
    assert.equal(v.cranAServir, null)
    assert.match(v.motif, /sort du centre et ne revient qu'en sonde/)
  })

  it('⚠️ un cran que la banque ne porte pas sort de la bande (piège 4) — sinon le 2 serait toujours à servir', () => {
    // La banque 1.5 en production n'a pas de cran 2.
    const sans2 = etatDeLObjet([tenu(1)], 'argument', true, 'D', [1, 3, 4, 5, 7, 9])
    assert.deepEqual(sans2.bande, [1, 3, 4, 5])
    assert.deepEqual(sans2.cransAbsents, [2])
    assert.equal(sans2.cranAServir, 3)
    assert.match(sans2.motif, /bande réduite : crans 2 absents de la banque/)
    // Et l'objet se tient sans le 2.
    assert.equal(etatDeLObjet([tenu(1), tenu(3), tenu(4), tenu(5)], 'argument', true, 'D', [1, 3, 4, 5, 7, 9]).etat, 'tenu')
    // Chez C, le 6 et le 8 n'existent pas en 1.5 : la bande se réduit à 4·5·7.
    const c = etatDeLObjet([], 'argument', true, 'C', [1, 3, 4, 5, 7, 9])
    assert.deepEqual(c.bande, [4, 5, 7])
    assert.deepEqual(c.cransAbsents, [6])
    assert.equal(c.cranAServir, 4)
  })

  it('⚠️ le palier qui indexe est celui de la COMPÉTENCE CIBLE : tenu à B, ouvert à D sur le même objet (piège 5)', () => {
    const registre = [tenu(7), tenu(8)]
    assert.equal(etatDeLObjet(registre, 'argument', true, 'B', TOUS).etat, 'tenu')
    assert.equal(etatDeLObjet(registre, 'argument', true, 'D', TOUS).etat, 'ouvert')
  })

  it('une bande vide (rien de servable dans la banque pour ce palier) reste OUVERTE, sans cran à servir, et le dit', () => {
    const v = etatDeLObjet([], 'mot', true, 'A', [1, 3, 4])
    assert.equal(v.etat, 'ouvert')
    assert.equal(v.cranAServir, null)
    assert.match(v.motif, /la bande est vide/)
  })

  it('le registre d\'un autre objet ne compte pas', () => {
    const v = etatDeLObjet([tenu(1, 'exemple'), tenu(2, 'exemple')], 'argument', true, 'D', TOUS)
    assert.deepEqual(v.tenus, [])
  })
})
