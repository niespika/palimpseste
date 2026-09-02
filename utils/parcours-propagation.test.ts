// Tests des règles PURES de la propagation modèle → instances (02/09/2026).
// Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  partagerCopies, reassignerPositions, memeCible, absentsDuModele,
  type CopieDeModele, type CibleCreneau,
} from './parcours-propagation'

const copie = (id: string, pcId: string, modeleId: string, vue: boolean, semaine = 1, ordre = 1): CopieDeModele =>
  ({ id, pcId, modeleId, semaine, ordre, vue })

test('partagerCopies : les copies vues restent, les intactes suivent — comptées en classes distinctes', () => {
  const r = partagerCopies([
    copie('a', 'pc1', 'm', false),
    copie('b', 'pc2', 'm', true),
    copie('c', 'pc2', 'm2', true),   // même classe que b → 1 classe « vue », pas 2
    copie('d', 'pc3', 'm', false),
  ])
  assert.deepEqual(r.intactes.map(c => c.id), ['a', 'd'])
  assert.deepEqual(r.vues.map(c => c.id), ['b', 'c'])
  assert.equal(r.nbClassesIntactes, 2)
  assert.equal(r.nbClassesVues, 1)
})

test('reassignerPositions : les copies permutent parmi leurs positions, les propres ne bougent pas', () => {
  // Semaine d'instance : A (ordre 1), X propre (ordre 2), B (ordre 3). Le modèle passe B avant A.
  const r = reassignerPositions(
    [{ id: 'iA', modeleId: 'A', ordre: 1 }, { id: 'iB', modeleId: 'B', ordre: 3 }],
    ['B', 'A'],
  )
  assert.deepEqual(r, [{ id: 'iB', ordre: 1 }, { id: 'iA', ordre: 3 }]) // la position 2 (X) n'est jamais écrite
})

test('reassignerPositions : rien ne change → liste vide ; un modèle inconnu passe après', () => {
  assert.deepEqual(reassignerPositions(
    [{ id: 'iA', modeleId: 'A', ordre: 1 }, { id: 'iB', modeleId: 'B', ordre: 2 }], ['A', 'B']), [])
  assert.deepEqual(reassignerPositions(
    [{ id: 'iZ', modeleId: 'Z', ordre: 1 }, { id: 'iA', modeleId: 'A', ordre: 2 }], ['A']),
    [{ id: 'iA', ordre: 1 }, { id: 'iZ', ordre: 2 }])
})

const cont = (contenuId: string): CibleCreneau => ({ refType: 'contenu', contenuId, livreId: null, livreSemaineDebut: null, livreSemaineFin: null })
const livre = (livreId: string, d: number | null = null, f: number | null = null): CibleCreneau =>
  ({ refType: 'livre', contenuId: null, livreId, livreSemaineDebut: d, livreSemaineFin: f })

test('memeCible : même contenu ; même livre ET même tranche (entier ≠ tranche)', () => {
  assert.equal(memeCible(cont('c1'), cont('c1')), true)
  assert.equal(memeCible(cont('c1'), cont('c2')), false)
  assert.equal(memeCible(livre('l', 1, 3), livre('l', 1, 3)), true)
  assert.equal(memeCible(livre('l'), livre('l', 1, 3)), false)
  assert.equal(memeCible(livre('l'), cont('l')), false)
})

test('absentsDuModele : la copie compte, le créneau propre de même cible compte UNE fois, le reste manque', () => {
  const modele = [
    { id: 'm1', ...cont('c1') },  // copié → présent
    { id: 'm2', ...cont('c2') },  // ajouté à la main dans la classe (propre, même cours) → présent
    { id: 'm3', ...cont('c2') },  // le même cours une 2ᵉ fois dans le modèle → absent (le propre est déjà pris)
    { id: 'm4', ...livre('l', 1, 2) }, // absent
  ]
  const instance = [
    { ...cont('c1'), modeleId: 'm1' },
    { ...cont('c2'), modeleId: null },
    { ...cont('c9'), modeleId: null }, // propre sans équivalent au modèle : ignoré
  ]
  assert.deepEqual(absentsDuModele(modele, instance).map(m => m.id), ['m3', 'm4'])
})
