import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drapeauDuRetourARelire } from './retour-a-relire'
import { controlerLaFormeDuRetour } from '../chaine/forme-retour'
import type { RetourSegmente } from '../chaine/types'

const ouverture = '2026-09-08T14:00:00Z'
const point = (nature: 'reussite' | 'point_de_travail') => ({
  id: nature, nature, competence: 'expression' as const, texte: 'La phrase reste à reprendre.',
})
const travail = point('point_de_travail'), reussite = point('reussite')
const retour: RetourSegmente = { points: [travail], action_revision: 'Réécris cette phrase.', feed_forward: null }
const entree = {
  depotId: 'depot', eleveId: 'eleve', eleveNom: 'Élève de recette', moment: 'chaud' as const,
  creeLe: ouverture, publieLe: ouverture, luLe: null, editeParProf: false,
  retour, grain: 'micro' as const, sansReussiteAdmise: false,
}

test('le retour publié sans réussite lève le signal et porte le motif réel, sans exiger un ancrage élagué', () => {
  const d = drapeauDuRetourARelire(entree, ouverture)
  assert.equal(d?.nature, 'retour_a_relire')
  assert.deepEqual(d?.detail, controlerLaFormeDuRetour(retour, { moment: 'v1', grain: 'micro' }).refus)
})

test('le signal naît fermé ; une ouverture illisible ne l’ouvre pas', () => {
  for (const depuis of [null, '', 'invalide']) assert.equal(drapeauDuRetourARelire(entree, depuis), null)
})

test('aucun rattrapage : même non lu, un retour créé avant l’ouverture reste hors du signal', () => {
  assert.equal(drapeauDuRetourARelire({ ...entree, creeLe: '2026-09-08T13:59:59Z' }, ouverture), null)
  assert.ok(drapeauDuRetourARelire({ ...entree, creeLe: '2026-09-08T10:00:00-04:00' }, ouverture))
})

test('la lecture par l’élève ferme le signal ; remettre la donnée non lue le fait revenir', () => {
  assert.ok(drapeauDuRetourARelire(entree, ouverture))
  assert.equal(drapeauDuRetourARelire({ ...entree, luLe: ouverture }, ouverture), null)
  assert.ok(drapeauDuRetourARelire(entree, ouverture))
})

test('un retour non publié ou déjà édité par le professeur ne demande pas cette relecture', () => {
  assert.equal(drapeauDuRetourARelire({ ...entree, publieLe: null }, ouverture), null)
  assert.equal(drapeauDuRetourARelire({ ...entree, editeParProf: true }, ouverture), null)
})

test('C7-L9 : aucune réussite sur un verdict raté admis ne déclenche le signal', () => {
  assert.equal(drapeauDuRetourARelire({ ...entree, sansReussiteAdmise: true }, ouverture), null)
})

test('C7-L9 ne permet pas de placer une réussite après un point de travail', () => {
  assert.ok(drapeauDuRetourARelire({ ...entree, sansReussiteAdmise: true,
    retour: { ...retour, points: [travail, reussite] } }, ouverture))
})

test('l’action de révision absente se signale même quand l’absence de réussite est admise', () => {
  const d = drapeauDuRetourARelire({ ...entree, sansReussiteAdmise: true,
    retour: { ...retour, action_revision: null } }, ouverture)
  assert.equal(d?.detail.length, 1)
  assert.match(d!.detail[0], /^règle 5/)
})

test('le retour final exige le pont, pas l’action de révision', () => {
  const r = { ...retour, points: [reussite], action_revision: null }
  assert.match(drapeauDuRetourARelire({ ...entree, moment: 'final', retour: r }, ouverture)!.detail[0], /^règle 5/)
  assert.equal(drapeauDuRetourARelire({ ...entree, moment: 'final',
    retour: { ...r, feed_forward: 'Sur le prochain texte, relis chaque articulation.' } }, ouverture), null)
})

test('le plafond micro porte sur tous les points en v1 et sur les seules réussites en vf', () => {
  const r = { ...retour, points: [reussite, travail, travail], feed_forward: 'Réemploie ce geste.' }
  assert.match(drapeauDuRetourARelire({ ...entree, retour: r }, ouverture)!.detail[0], /au plus 2/)
  assert.equal(drapeauDuRetourARelire({ ...entree, moment: 'final', retour: r }, ouverture), null)
  assert.equal(drapeauDuRetourARelire({ ...entree, grain: 'meso', retour: r }, ouverture), null)
})
