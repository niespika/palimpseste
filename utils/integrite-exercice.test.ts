// ============================================================================
// LA PREUVE D'UN EXERCICE — ce que ces tests GARDENT :
//   · que la concaténation des segments EST le matériau, quels que soient les
//     intervalles (même vides, même hors bornes) ;
//   · que la zone, la cible et la marge se lisent INDÉPENDAMMENT sur chaque
//     morceau — c'est leur recouvrement que le professeur regarde ;
//   · que le diff rejoue le texte de l'élève EN ENTIER et ignore les accents :
//     « Du coup » ressort, « prive » pour « privé » ne ressort pas ;
//   · que la chronologie s'écrit dans l'unité qui convient.
// Le cas de référence est le premier ratissage reçu en production (01/09/2026).
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  segmentsDeLaPreuve, partEnPourcent, nombreDeMots, diffDesMots, ecartLisible,
  diffSiReprise, partReprise, PART_REPRISE_POUR_UN_DIFF,
} from './integrite-exercice'

const MATERIAU = 'L’ennui est le moment où l’esprit, privé de ce qui l’occupait, se met à chercher '
  + 'tout seul. Un enfant laissé sans écran finit par inventer une règle, un personnage, une '
  + 'histoire. Les pédiatres constatent que les enfants très sollicités dorment plus mal. Il faut '
  + 'donc lui ménager des plages où rien n’est prévu.'

test('la concaténation des segments EST le matériau — pas un octet retouché', () => {
  const L = MATERIAU.length
  for (const [zone, cible, tol] of [
    [[0, L], [179, 182], [169, 192]],
    [null, null, null],
    [[50, 60], [55, 58], [40, 70]],
    [[-5, L + 5], [0, 0], null],
  ] as const) {
    const s = segmentsDeLaPreuve(MATERIAU, zone, cible, tol)
    assert.equal(s.map((x) => x.texte).join(''), MATERIAU)
    assert.ok(s.every((x) => x.texte !== ''), 'aucun segment vide')
  }
})

test('zone, cible et marge se lisent indépendamment sur chaque morceau', () => {
  const s = segmentsDeLaPreuve('abcdefghij', [0, 10], [4, 6], [2, 8])
  assert.deepEqual(s.map((x) => [x.texte, x.zone, x.cible, x.toleree]), [
    ['ab', true, false, false],
    ['cd', true, false, true],
    ['ef', true, true, true],
    ['gh', true, false, true],
    ['ij', true, false, false],
  ])
  // Une zone qui ne touche pas la cible : deux morceaux marqués, disjoints.
  const t = segmentsDeLaPreuve('abcdefghij', [0, 2], [6, 8], null)
  assert.deepEqual(t.map((x) => [x.texte, x.zone, x.cible]), [
    ['ab', true, false], ['cdef', false, false], ['gh', false, true], ['ij', false, false],
  ])
})

test('la part et le nombre de mots — les deux chiffres du geste', () => {
  assert.equal(partEnPourcent([0, 310], 310), 100)
  assert.equal(partEnPourcent([0, 217], 310), 70)
  assert.equal(partEnPourcent([0, 10], 0), 0)
  assert.equal(nombreDeMots(MATERIAU, [179, 182]), 1)
  assert.equal(nombreDeMots(MATERIAU, [169, 192]), 3)
  assert.equal(nombreDeMots(MATERIAU, [5, 5]), 0)
})

test('⭐ le diff rejoue le texte de l’élève EN ENTIER, et « Du coup » ressort', () => {
  const eleve = 'L\'ennui est le momnet ou l\'esprit,prive de ce qui l\'occupait,se met a chercher '
    + 'tout seul. Un enfant laisse sans ecran finit par inventer une regle, un personnage ,une '
    + 'histoire. Du coup les pediatres constatent que les enfants tres sollicites dorment plus mal. '
    + 'Il faut don lui menager des plages ou rien n\'est prevu.'
  const parts = diffDesMots(MATERIAU, eleve)
  // Tout le texte de l'élève est là, dans l'ordre, sans les retraits intercalés.
  assert.equal(parts.filter((p) => p.sorte !== 'retrait').map((p) => p.texte).join(''), eleve)
  const ajouts = parts.filter((p) => p.sorte === 'ajout').map((p) => p.texte)
  assert.ok(ajouts.includes('Du coup'), `les ajouts : ${JSON.stringify(ajouts)}`)
  // Les fautes d'accent ne sont PAS des ajouts : « prive », « ecran », « regle » passent pour égaux.
  assert.ok(!ajouts.some((a) => /prive|ecran|regle|sollicites/.test(a)), JSON.stringify(ajouts))
  // Les vraies fautes, elles, restent visibles — un retrait puis un ajout.
  assert.ok(ajouts.includes('momnet'))
  assert.ok(parts.some((p) => p.sorte === 'retrait' && p.texte === 'moment'))
  assert.ok(parts.some((p) => p.sorte === 'retrait' && p.texte === 'donc'))
})

test('⛔ le diff ne se montre que si l’élève a REPRIS le matériau — une réponse libre se lit telle quelle', () => {
  // Cran 4, recette du 01/09 : l'élève répond, il ne réécrit pas. Quelques mots
  // communs par hasard (« professeur », « règles ») ne font pas une réécriture.
  const reponseLibre = 'L\'introduction doit poser le problème. Ici le sujet demande si un robot peut '
    + 'faire un bon professeur. Il faut d\'abord se demander ce qu\'on attend d\'un professeur, '
    + 'parce que si on attend seulement qu\'il transmette des connaissances, alors les règles suffisent.'
  assert.equal(diffSiReprise(MATERIAU, reponseLibre), null)
  assert.ok(partReprise(MATERIAU, diffDesMots(MATERIAU, reponseLibre)) < PART_REPRISE_POUR_UN_DIFF)
  // Cran 7 : le texte retapé, fautes et connecteur compris, EST une reprise.
  const reprise = 'L\'ennui est le momnet ou l\'esprit,prive de ce qui l\'occupait,se met a chercher tout '
    + 'seul. Un enfant laisse sans ecran finit par inventer une regle, un personnage ,une histoire. '
    + 'Du coup les pediatres constatent que les enfants tres sollicites dorment plus mal.'
  assert.notEqual(diffSiReprise(MATERIAU, reprise), null)
  assert.ok(partReprise(MATERIAU, diffDesMots(MATERIAU, reprise)) >= PART_REPRISE_POUR_UN_DIFF)
  // Les bords : tout repris, rien repris, référence vide.
  assert.equal(partReprise('a b c', diffDesMots('a b c', 'a b c')), 1)
  assert.equal(partReprise('a b c', diffDesMots('a b c', 'x y z')), 0)
  assert.equal(partReprise('', diffDesMots('', 'x')), 0)
})

test('deux textes identiques ne font qu’un seul segment égal ; un texte vide ne rend que des retraits', () => {
  assert.deepEqual(diffDesMots('a b c', 'a b c'), [{ texte: 'a b c', sorte: 'egal' }])
  const vide = diffDesMots('un deux', '')
  assert.deepEqual(vide.filter((p) => p.sorte === 'retrait').map((p) => p.texte), ['un deux'])
  assert.deepEqual(diffDesMots('', 'x y'), [{ texte: 'x y', sorte: 'ajout' }])
})

test('l’écart lisible change d’unité avec la durée', () => {
  assert.equal(ecartLisible('2026-09-01T18:51:45Z', '2026-09-01T18:52:41Z'), '+56 s')
  assert.equal(ecartLisible('2026-09-01T18:52:41Z', '2026-09-01T18:56:08Z'), '+3 min 27 s')
  assert.equal(ecartLisible('2026-09-01T18:00:00Z', '2026-09-01T19:02:00Z'), '+1 h 02 min')
  assert.equal(ecartLisible('2026-09-01T19:00:00Z', '2026-09-01T18:00:00Z'), null, 'le temps ne recule pas')
  assert.equal(ecartLisible('x', '2026-09-01T18:00:00Z'), null)
})
