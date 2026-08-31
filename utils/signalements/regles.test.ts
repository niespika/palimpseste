// Les règles du signalement d'exercice. « Tout ce qui a été trouvé de sérieux
// dans ce dépôt l'a été en EXÉCUTANT » — ces épreuves cadrent les deux endroits
// où la règle peut mentir : le REGROUPEMENT (un exercice, tous les commentaires)
// et l'ÉCHÉANCE (après quoi un arbitrage ne change plus rien).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  HEURE_DU_COMPTAGE_UTC, MARQUE_RETRAIT_POOL,
  bilanDuRetraitDuPool, blocagesSansLesNotres, echeanceDArbitrage, emportesParLeRetraitDuPool,
  etatDuSignalement, fenetreDArbitrage, grouperParExercice, lundiDeLaDate,
  motifDuRetraitDuPool, peutRevenirAuPool, peutSeRetracter,
  type Signalement,
} from './regles'

const sig = (o: Partial<Signalement> = {}): Signalement => ({
  id: 's1', depotId: 'd1', exerciceId: 'e1', eleveId: 'el1',
  texte: 'La consigne ne dit pas sur quel texte travailler.',
  signaleAt: '2026-09-01T10:00:00.000Z', majAt: null,
  arbitrage: null, arbitreAt: null, statutDepot: 'ouvert', ...o,
})

// ── L'état ─────────────────────────────────────────────────────────────────

test('NULL en base vaut EN ATTENTE — on ne stocke pas un troisième littéral', () => {
  assert.equal(etatDuSignalement(sig()), 'en_attente')
  assert.equal(etatDuSignalement(sig({ arbitrage: 'confirme' })), 'confirme')
  assert.equal(etatDuSignalement(sig({ arbitrage: 'ecarte' })), 'ecarte')
})

test('l\'élève se rétracte TANT QUE personne n\'a tranché, jamais après', () => {
  assert.equal(peutSeRetracter(sig()), true)
  assert.equal(peutSeRetracter(sig({ arbitrage: 'confirme' })), false)
  assert.equal(peutSeRetracter(sig({ arbitrage: 'ecarte' })), false,
    'même écarté : la décision s\'appuie sur ce texte, il reste lisible')
})

// ── Le regroupement ────────────────────────────────────────────────────────

test('UN exercice, TOUS les commentaires — le cas normal de la production', () => {
  // 4 instances portaient 86 dépôts le 31/08 : 24 élèves sur la même instance.
  const vingtQuatre = Array.from({ length: 24 }, (_, i) => sig({
    id: `s${i}`, depotId: `d${i}`, eleveId: `el${i}`,
    signaleAt: `2026-09-01T10:${String(i).padStart(2, '0')}:00.000Z`,
  }))
  const g = grouperParExercice(vingtQuatre)
  assert.equal(g.length, 1, 'un seul exercice à l\'écran')
  assert.equal(g[0]!.signalements.length, 24, 'et les vingt-quatre commentaires')
  assert.equal(g[0]!.enAttente, 24)
  assert.equal(g[0]!.dernierSignaleAt, '2026-09-01T10:23:00.000Z')
})

test('les commentaires d\'un exercice sont du PLUS ANCIEN au plus récent', () => {
  const g = grouperParExercice([
    sig({ id: 'b', signaleAt: '2026-09-02T10:00:00.000Z' }),
    sig({ id: 'a', depotId: 'd2', signaleAt: '2026-09-01T10:00:00.000Z' }),
  ])
  assert.deepEqual(g[0]!.signalements.map((s) => s.id), ['a', 'b'])
})

test('ce qui ATTEND une décision passe devant, puis le plus signalé', () => {
  const g = grouperParExercice([
    // e1 : deux signalements, tous tranchés
    sig({ id: '1', exerciceId: 'e1', depotId: 'd1', arbitrage: 'ecarte', arbitreAt: 'x' }),
    sig({ id: '2', exerciceId: 'e1', depotId: 'd2', arbitrage: 'ecarte', arbitreAt: 'x' }),
    // e2 : un seul, en attente
    sig({ id: '3', exerciceId: 'e2', depotId: 'd3' }),
    // e3 : trois, en attente
    sig({ id: '4', exerciceId: 'e3', depotId: 'd4' }),
    sig({ id: '5', exerciceId: 'e3', depotId: 'd5' }),
    sig({ id: '6', exerciceId: 'e3', depotId: 'd6' }),
  ])
  assert.deepEqual(g.map((x) => x.exerciceId), ['e3', 'e2', 'e1'])
  assert.equal(g[2]!.enAttente, 0)
  assert.equal(g[2]!.ecartes, 2)
})

test('LE TRI EST TOTAL — deux rechargements donnent le même ordre', () => {
  const memeChose = [
    sig({ id: 'z', exerciceId: 'e-b', depotId: 'd1' }),
    sig({ id: 'a', exerciceId: 'e-a', depotId: 'd2' }),
  ]
  assert.deepEqual(grouperParExercice(memeChose).map((x) => x.exerciceId), ['e-a', 'e-b'])
  assert.deepEqual(grouperParExercice([...memeChose].reverse()).map((x) => x.exerciceId),
    ['e-a', 'e-b'], 'l\'ordre d\'entrée ne décide de rien')
})

test('aucun signalement — aucune ligne, et pas une ligne vide', () => {
  assert.deepEqual(grouperParExercice([]), [])
})

// ── L'échéance ─────────────────────────────────────────────────────────────

test('l\'échéance est le LUNDI SUIVANT à 18:00 UTC — le cron compte l\'ÉCOULÉE', () => {
  // `vercel.json` : "0 18 * * 1". La semaine du 2026-08-31 est comptée le 09-07.
  assert.equal(echeanceDArbitrage('2026-08-31'), '2026-09-07T18:00:00.000Z')
  assert.equal(HEURE_DU_COMPTAGE_UTC, 18, 'recopiée de vercel.json — si le cron bouge, elle bouge')
})

test('une date QUELCONQUE de la semaine donne la même échéance que son lundi', () => {
  // Le dimanche 2026-09-06 appartient à la semaine du lundi 2026-08-31.
  assert.equal(echeanceDArbitrage('2026-09-06'), echeanceDArbitrage('2026-08-31'))
  assert.equal(lundiDeLaDate('2026-09-06'), '2026-08-31')
})

test('la fenêtre dit les HEURES qui restent, et se ferme à l\'instant du cron', () => {
  const avant = fenetreDArbitrage('2026-08-31', '2026-09-07T15:30:00.000Z')
  assert.equal(avant.depassee, false)
  assert.equal(avant.heuresRestantes, 2, '15:30 → 18:00 : deux heures pleines')

  const pile = fenetreDArbitrage('2026-08-31', '2026-09-07T18:00:00.000Z')
  assert.equal(pile.depassee, true, 'à l\'instant même, le compte est arrêté')
  assert.equal(pile.heuresRestantes, 0)

  const apres = fenetreDArbitrage('2026-08-31', '2026-09-09T09:00:00.000Z')
  assert.equal(apres.depassee, true)
  assert.equal(apres.heuresRestantes, 0, 'jamais un nombre négatif à l\'écran')
})

// ── Le retrait du pool ─────────────────────────────────────────────────────

const dep = (id: string, statut: string) => ({ id, statut })

test('le retrait du pool emporte les NON RENDUS, et rien d\'autre', () => {
  const depots = [
    dep('a', 'assigne'), dep('b', 'ouvert'), dep('c', 'abandonne'), dep('d', 'non_fait'),
    dep('e', 'v1_remis'), dep('f', 'retour_publie'), dep('g', 'vf_remis'),
    dep('h', 'clos'), dep('i', 'retire'),
  ]
  assert.deepEqual(emportesParLeRetraitDuPool(depots).map((d) => d.id),
    ['a', 'b', 'c', 'd'])
})

test('⛔ CE QUI EST RENDU NE BOUGE JAMAIS — on ne punit pas d\'avoir travaillé', () => {
  const rendus = [dep('e', 'v1_remis'), dep('f', 'retour_publie'), dep('g', 'vf_remis')]
  assert.deepEqual(emportesParLeRetraitDuPool(rendus), [])
})

test('le bilan DIT COMBIEN avant que le geste ne les emporte', () => {
  const b = bilanDuRetraitDuPool([
    dep('a', 'assigne'), dep('b', 'ouvert'), dep('c', 'ouvert'),
    dep('e', 'v1_remis'), dep('h', 'clos'), dep('i', 'retire'),
  ])
  assert.deepEqual(b, { emportes: 3, rendusIntouches: 1, closIntouches: 1, dejaRetires: 1 })
})

// ── La marque dans `blocages` ──────────────────────────────────────────────

test('le motif porte le préfixe, le compte et la date', () => {
  const m = motifDuRetraitDuPool(3, '2026-09-02T14:00:00.000Z')
  assert.ok(m.startsWith(MARQUE_RETRAIT_POOL))
  assert.ok(m.includes('3 élèves'))
  assert.ok(m.includes('2026-09-02'))
  assert.ok(motifDuRetraitDuPool(1, '2026-09-02T14:00:00.000Z').includes('1 élève'),
    'un seul élève ne prend pas le pluriel')
})

test('revenir au pool retire NOTRE ligne, jamais celle de la fabrique', () => {
  const blocages = [
    'Le cran 4 exige un défaut : il manque.',
    motifDuRetraitDuPool(2, '2026-09-02T14:00:00.000Z'),
  ]
  assert.deepEqual(blocagesSansLesNotres(blocages), ['Le cran 4 exige un défaut : il manque.'])
})

test('⛔ un exercice bloqué PAR LA FABRIQUE ne revient pas au pool par notre coche', () => {
  const notre = motifDuRetraitDuPool(1, '2026-09-02T14:00:00.000Z')
  assert.equal(peutRevenirAuPool([notre]), true)
  assert.equal(peutRevenirAuPool([]), true)
  assert.equal(peutRevenirAuPool([notre, 'Le cran 4 exige un défaut : il manque.']), false,
    'décocher passerait par-dessus une décision qu\'on n\'a pas prise')
})
