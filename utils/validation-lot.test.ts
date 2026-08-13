// Tests de garde — C8·L2 : la validation par lot ne touche que ce qu'elle annonce.
//
// Ce qu'ils protègent : à ~90 élèves, le prof coche une pile et clique une fois.
// Personne ne relira ligne à ligne ce qui est parti. Une erreur de répartition ne
// lève aucune exception — elle publie le retour d'un élève dont l'analyse n'était
// pas prête, ou laisse un élève sans retour en croyant l'avoir traité.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  repartirSelection,
  elevesAValider,
  toutAValiderEstChoisi,
  basculerPile,
} from './validation-lot'
import type { EleveAvecDepot, StatutAnalyse } from '../types/fragments'

// Fabrique une ligne d'écran : `statut` à null = dépôt sans analyse ;
// `depot` à false = élève qui n'a rien rendu.
function ligne(
  id: string,
  opts: { depot?: boolean; statut?: StatutAnalyse | null } = {}
): EleveAvecDepot {
  const aDepot = opts.depot !== false
  return {
    id: `eleve-${id}`,
    display_name: `Élève ${id}`,
    classe: 'Test',
    depot: aDepot
      ? {
          id: `depot-${id}`,
          eleve_id: `eleve-${id}`,
          inscription_id: `insc-${id}`,
          semaine_id: 'semaine-1',
          statut: 'depose',
          commentaire_eleve: null,
          created_at: '2026-08-13T12:00:00Z',
          updated_at: '2026-08-13T12:00:00Z',
          photos: [],
        }
      : null,
    analyse:
      aDepot && opts.statut
        ? {
            id: `analyse-${id}`,
            depot_id: `depot-${id}`,
            statut: opts.statut,
            note_decouvertes: 2,
            note_sources: 2,
            note_reflexions: 2,
            commentaire_general: 'Bon travail.',
            signal_integrite: null,
          }
        : null,
  }
}

// Une classe qui contient les cinq cas possibles d'une vraie semaine.
const CLASSE: EleveAvecDepot[] = [
  ligne('a', { statut: 'generee' }),   // à valider
  ligne('b', { statut: 'generee' }),   // à valider
  ligne('c', { statut: 'publiee' }),   // déjà publiée
  ligne('d', { statut: 'en_cours' }),  // analyse en train de tourner
  ligne('e', { statut: 'erreur' }),    // analyse en échec
  ligne('f', { statut: null }),        // déposé, pas encore analysé
  ligne('g', { depot: false }),        // rien rendu
]

const tout = (l: EleveAvecDepot[]) => new Set(l.filter(e => e.depot).map(e => e.depot!.id))

test('« Publier » ne vise QUE les analyses en attente, même si tout est coché', () => {
  const r = repartirSelection(CLASSE, tout(CLASSE))
  assert.deepEqual(r.aPublier.map(e => e.id), ['eleve-a', 'eleve-b'])
  // Ni la publiée, ni l'en_cours, ni l'erreur, ni celle qui n'existe pas.
  assert.ok(!r.aPublier.some(e => ['eleve-c', 'eleve-d', 'eleve-e', 'eleve-f'].includes(e.id)))
})

test('« Dépublier » ne vise QUE les analyses publiées', () => {
  const r = repartirSelection(CLASSE, tout(CLASSE))
  assert.deepEqual(r.aDepublier.map(e => e.id), ['eleve-c'])
})

test('« Relancer » vise tout dépôt coché, y compris sans analyse ou en erreur', () => {
  const r = repartirSelection(CLASSE, tout(CLASSE))
  assert.deepEqual(
    r.cibles.map(c => c.depotId),
    ['depot-a', 'depot-b', 'depot-c', 'depot-d', 'depot-e', 'depot-f']
  )
  // L'élève sans dépôt n'entre jamais nulle part : il n'y a rien à analyser.
  assert.ok(!r.cibles.some(c => c.depotId === 'depot-g'))
})

test('un élève sans dépôt ne peut pas être embarqué dans un lot', () => {
  // Même si son identifiant se retrouvait dans la sélection par accident.
  const r = repartirSelection(CLASSE, new Set(['depot-g', 'eleve-g']))
  assert.equal(r.choisis.length, 0)
  assert.equal(r.cibles.length, 0)
  assert.equal(r.aPublier.length, 0)
})

test('sélection vide → aucune action ne porte sur quoi que ce soit', () => {
  const r = repartirSelection(CLASSE, new Set())
  assert.equal(r.choisis.length, 0)
  assert.equal(r.aPublier.length, 0)
  assert.equal(r.aDepublier.length, 0)
  assert.equal(r.cibles.length, 0)
})

test('la sélection partielle ne déborde pas sur les lignes non cochées', () => {
  const r = repartirSelection(CLASSE, new Set(['depot-a']))
  assert.deepEqual(r.aPublier.map(e => e.id), ['eleve-a'])
  assert.equal(r.cibles.length, 1)
})

test('chaque cible relie le BON dépôt au BON élève', () => {
  // Une inversion ici relancerait l'analyse d'un élève avec l'historique d'un
  // autre : le retour parlerait des semaines de quelqu'un d'autre.
  const r = repartirSelection(CLASSE, tout(CLASSE))
  for (const c of r.cibles) {
    assert.equal(c.depotId.replace('depot-', ''), c.eleveId.replace('eleve-', ''))
  }
})

test('« tout sélectionner » ne prend que la pile à valider', () => {
  assert.deepEqual(elevesAValider(CLASSE).map(e => e.id), ['eleve-a', 'eleve-b'])
  const s = basculerPile(CLASSE, new Set())
  assert.deepEqual([...s].sort(), ['depot-a', 'depot-b'])
})

test('« tout sélectionner » deux fois de suite revient au point de départ', () => {
  const s1 = basculerPile(CLASSE, new Set())
  const s2 = basculerPile(CLASSE, s1)
  assert.equal(s2.size, 0)
})

test('« tout sélectionner » préserve une case cochée à la main hors de la pile', () => {
  const depart = new Set(['depot-c']) // une publiée, cochée exprès
  const s = basculerPile(CLASSE, depart)
  assert.deepEqual([...s].sort(), ['depot-a', 'depot-b', 'depot-c'])
  // Et la décocher ne doit pas emporter la case manuelle.
  const s2 = basculerPile(CLASSE, s)
  assert.deepEqual([...s2], ['depot-c'])
})

test('la case d’en-tête reste décochée quand la pile est vide', () => {
  // `every` sur un tableau vide rend `true` : sans garde, la case s'afficherait
  // cochée sur une semaine où il n'y a rien à valider.
  const sansPile = [ligne('x', { statut: 'publiee' }), ligne('y', { depot: false })]
  assert.equal(toutAValiderEstChoisi(sansPile, new Set()), false)
  assert.equal(toutAValiderEstChoisi(sansPile, tout(sansPile)), false)
})

test('la case d’en-tête ne se coche que si TOUTE la pile est prise', () => {
  assert.equal(toutAValiderEstChoisi(CLASSE, new Set(['depot-a'])), false)
  assert.equal(toutAValiderEstChoisi(CLASSE, new Set(['depot-a', 'depot-b'])), true)
  // Cocher en plus une ligne hors pile ne la décoche pas.
  assert.equal(toutAValiderEstChoisi(CLASSE, new Set(['depot-a', 'depot-b', 'depot-c'])), true)
})

test('une semaine sans aucun dépôt ne propose rien', () => {
  const vide = [ligne('z', { depot: false })]
  assert.equal(elevesAValider(vide).length, 0)
  assert.equal(basculerPile(vide, new Set()).size, 0)
  assert.equal(repartirSelection(vide, new Set()).choisis.length, 0)
})
