// ============================================================================
// L'ACCUEIL DE L'ONGLET EXERCICES. Ce que ce test GARDE :
//   · ⭐ que les CINQ tons tombent dans les TROIS groupes, et qu'aucune ligne ne
//     disparaît — un ton sans groupe viderait l'écran en silence ;
//   · ⭐⭐ que « en attente » n'offre AUCUNE action, et que « retour à lire »
//     en offre une : c'est la distinction que la liste plate mélangeait ;
//   · ⚠️ que l'ordre AMONT (`comparerLignes`) est conservé DANS chaque groupe —
//     « le plus proche en premier » vient du tri, pas d'un second tri ici ;
//   · ⚠️ que l'échéance se lit DANS LE FUSEAU DE L'ÉCOLE, et qu'une échéance
//     dépassée se dit sans reproche et sans blocage ;
//   · ⛔ qu'aucun compte n'est rapporté à un total : pas de « 2 sur 9 ».
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  grouperPourLAccueil, actionDeLaLigne, metaDeLaLigne, echeanceLisible, attenduDeLaLigne,
  competencesLisibles, JOURS_PROCHE,
} from './accueil'
import { comparerLignes, etatDeLExercice, type TonEtat } from './regles'
import type { ExerciceMaison } from './liste'

const TZ = 'America/Toronto'
const MAINTENANT = '2026-09-07T12:00:00Z'

function ligne(p: Partial<ExerciceMaison> & { etat: ExerciceMaison['etat'] }): ExerciceMaison {
  return {
    depotId: 'd', titre: 'Un exercice', echeance: null, href: '/x',
    assigneAt: '2026-09-07T00:00:00Z', competences: [], bonus: false,
    estUnePaire: false, cran: null, typeId: 't', v1RemiseLe: null, vfRemiseLe: null,
    ...p,
  }
}

test('⭐ les cinq tons tombent dans les trois groupes, et rien ne se perd', () => {
  const tons: TonEtat[] = ['a_faire', 'en_cours', 'attente', 'a_lire', 'clos']
  const lignes = tons.map((ton) => ligne({ etat: { ton, libelle: ton } }))
  const groupes = grouperPourLAccueil(lignes)

  assert.deepEqual(groupes.map((g) => g.cle), ['a_faire', 'en_attente', 'termines'])
  assert.deepEqual(groupes.map((g) => g.compte), [2, 2, 1])
  assert.equal(groupes.reduce((n, g) => n + g.lignes.length, 0), lignes.length)
})

test('les trois groupes sont TOUJOURS rendus, même vides', () => {
  const groupes = grouperPourLAccueil([])
  assert.equal(groupes.length, 3)
  assert.deepEqual(groupes.map((g) => g.compte), [0, 0, 0])
  // Un groupe vide ne murmure rien : l'écran n'a pas à l'afficher.
  assert.deepEqual(groupes.map((g) => g.murmure), [null, null, null])
})

test('⭐⭐ « en attente » n’offre aucune action, « retour à lire » en offre une', () => {
  assert.equal(actionDeLaLigne('attente'), null)
  assert.deepEqual(actionDeLaLigne('a_lire'), { libelle: 'Ouvrir', plein: false })
  // Une seule action PLEINE, et c'est l'entrée dans un exercice neuf.
  assert.deepEqual(actionDeLaLigne('a_faire'), { libelle: 'Commencer', plein: true })
  assert.deepEqual(actionDeLaLigne('en_cours'), { libelle: 'Reprendre', plein: false })
  assert.equal(actionDeLaLigne('clos'), null)
})

test('⭐ les deux états de l’attente cohabitent DANS le groupe 2', () => {
  // Les états viennent de la vraie règle, jamais d'un libellé inventé.
  const enPreparation = etatDeLExercice('v1_remis', { publie: false, lu: false })
  const retourRecu = etatDeLExercice('retour_publie', { publie: true, lu: false })
  const groupes = grouperPourLAccueil([
    ligne({ etat: enPreparation }), ligne({ etat: retourRecu }),
  ])
  const attente = groupes.find((g) => g.cle === 'en_attente')!
  assert.equal(attente.compte, 2)
  assert.equal(actionDeLaLigne(enPreparation.ton), null)
  assert.notEqual(actionDeLaLigne(retourRecu.ton), null)
})

test('⚠️ l’ordre amont est conservé DANS chaque groupe', () => {
  const brut = [
    ligne({ depotId: 'tard', etat: { ton: 'a_faire', libelle: '' }, echeance: '2026-09-20T00:00:00Z' }),
    ligne({ depotId: 'tot', etat: { ton: 'a_faire', libelle: '' }, echeance: '2026-09-09T00:00:00Z' }),
    ligne({ depotId: 'sans', etat: { ton: 'a_faire', libelle: '' }, echeance: null }),
  ].sort((a, b) => comparerLignes(
    { ton: a.etat.ton, echeance: a.echeance }, { ton: b.etat.ton, echeance: b.echeance }))

  const groupes = grouperPourLAccueil(brut)
  assert.deepEqual(groupes[0]!.lignes.map((l) => l.depotId), ['tot', 'tard', 'sans'])
})

test('la ligne de méta dit la compétence, la forme, la durée — et rien de plus', () => {
  assert.equal(
    metaDeLaLigne({ competences: ['argumentation'], estUnePaire: false, dureeMin: 30 }),
    'Argumentation · un cas · environ 30 min')
  assert.equal(
    metaDeLaLigne({ competences: ['structure'], estUnePaire: true, dureeMin: null }),
    'Structure · deux cas, l’un après l’autre')
  // ⚠️ Pas de séparateur vide quand un morceau manque.
  assert.equal(metaDeLaLigne({ competences: [], estUnePaire: false }), 'un cas')
  // ⚠️ Un identifiant inconnu ne s'affiche pas nu.
  assert.deepEqual(competencesLisibles(['argumentation', 'expression_v2']), ['Argumentation'])
})

test('⚠️ l’échéance se lit dans le fuseau de l’école', () => {
  // 20 h 00 UTC le 10 = 16 h à Toronto le 10 ; 02 h 00 UTC le 11 = 22 h le 10.
  assert.equal(echeanceLisible('2026-09-10T20:00:00Z', MAINTENANT, TZ)?.texte, 'à rendre jeu. 10')
  assert.equal(echeanceLisible('2026-09-11T02:00:00Z', MAINTENANT, TZ)?.texte, 'à rendre jeu. 10')
})

test('la pastille « proche » suit la borne, et le dépassement se dit sans reproche', () => {
  const dans2j = new Date(Date.parse(MAINTENANT) + 2 * 86_400_000).toISOString()
  const dans5j = new Date(Date.parse(MAINTENANT) + 5 * 86_400_000).toISOString()
  assert.equal(echeanceLisible(dans2j, MAINTENANT, TZ)?.proche, true)
  assert.equal(echeanceLisible(dans5j, MAINTENANT, TZ)?.proche, false)
  assert.equal(JOURS_PROCHE, 3)

  const hier = new Date(Date.parse(MAINTENANT) - 86_400_000).toISOString()
  const passe = echeanceLisible(hier, MAINTENANT, TZ)!
  assert.match(passe.texte, /dépassé/)
  assert.doesNotMatch(passe.texte, /retard|oubli|attention/i)
})

test('pas d’échéance → aucune urgence inventée', () => {
  assert.equal(echeanceLisible(null, MAINTENANT, TZ), null)
  assert.equal(echeanceLisible('pas une date', MAINTENANT, TZ), null)
})

test('⛔ « à lire » ne promet une version finale que si on lui en donne une', () => {
  const l = { etat: { ton: 'a_lire' as TonEtat }, v1RemiseLe: MAINTENANT, vfRemiseLe: null }
  assert.equal(attenduDeLaLigne(l, null, TZ), 'retour reçu · à lire')
  assert.match(attenduDeLaLigne(l, '2026-09-11T20:00:00Z', TZ), /version finale à rendre avant/)
})

test('l’attente dit ce qui a été rendu, et quand', () => {
  const tz = TZ
  assert.match(
    attenduDeLaLigne({ etat: { ton: 'attente' }, v1RemiseLe: '2026-09-07T14:00:00Z', vfRemiseLe: null },
      null, tz),
    /^rendue lundi 7$/)
  assert.match(
    attenduDeLaLigne({ etat: { ton: 'attente' }, v1RemiseLe: '2026-09-07T14:00:00Z',
      vfRemiseLe: '2026-09-09T14:00:00Z' }, null, tz),
    /^version finale rendue mercredi 9$/)
  assert.equal(
    attenduDeLaLigne({ etat: { ton: 'attente' }, v1RemiseLe: null, vfRemiseLe: null }, null, tz),
    'rendue')
})
