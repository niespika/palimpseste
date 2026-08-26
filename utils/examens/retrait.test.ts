// Tests de la RÈGLE « qu'est-ce qu'un dépôt porte » (fonctions PURES).
// Exécution : `npm test`.
//
// ⭐ IL N'Y A QU'UNE QUESTION, ET C'EST LE CONTENU. Cinq refus successifs en
//    production ont été nécessaires pour y arriver, tous nés de la même
//    confusion : prendre une trace technique pour du travail d'élève.
//      · une ASSIGNATION nue n'est pas du travail (25 dépôts créés d'un coup) ;
//      · un dépôt EXISTANT sur la cible n'est pas du travail ;
//      · ⛔ le statut `ouvert` n'est pas du travail — `utils/passation/depots.ts`
//        montre que c'est le geste DU PROFESSEUR : ouvrir une passation bascule
//        TOUS les dépôts de la classe à `ouvert` d'un coup ;
//      · un job d'OCR n'est pas la chaîne de mesure (`utils/chaine/file.ts`).
//    *(Décision de Louis, 25/08 : « juger sur le contenu ».)*

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { depotPorteDuTravail, depotsQuiBloquent, type DepotPourRetrait } from './retrait'

/** Un dépôt tel qu'il naît à l'assignation : statut par défaut, tout à null. */
const nu = (statut = 'assigne'): DepotPourRetrait => ({
  statut,
  texte_v1: null, texte_vf: null,
  transcription_v1: null, transcription_vf: null,
  photos_v1: null, photos_vf: null,
})

// ── Aucun statut ne fait, à lui seul, du travail ────────────────────────────

test('⭐ AUCUN statut ne bloque à lui seul — pas même `vf_remis`', () => {
  for (const s of [
    'assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis', 'clos', 'abandonne', 'retire',
  ]) {
    assert.equal(depotPorteDuTravail(nu(s)), false, `statut ${s} sans contenu`)
  }
})

test('⛔ `ouvert` en particulier : c’est le geste du PROFESSEUR', () => {
  // `ouvrirDepots()` bascule tous les dépôts `assigne` de l'exercice à `ouvert`
  // et stampe `ouvert_par_prof_at`. L'élève n'a rien fait.
  assert.equal(depotPorteDuTravail(nu('ouvert')), false)
})

test('⭐ le cas réel de 1HLP : 24 dépôts ouverts PAR LE PROF, rien ne bloque', () => {
  const classe = Array.from({ length: 24 }, () => nu('ouvert'))
  assert.equal(depotsQuiBloquent(classe), 0)
})

// ── Le contenu, et lui seul, bloque ─────────────────────────────────────────

test('chaque champ de contenu bloque à lui seul', () => {
  const champs: (keyof DepotPourRetrait)[] = [
    'texte_v1', 'texte_vf', 'transcription_v1', 'transcription_vf',
  ]
  for (const c of champs) {
    assert.equal(depotPorteDuTravail({ ...nu(), [c]: 'x' }), true, String(c))
  }
  assert.equal(depotPorteDuTravail({ ...nu(), photos_v1: [{ chemin: 'a.jpg' }] }), true)
  assert.equal(depotPorteDuTravail({ ...nu(), photos_vf: [{ chemin: 'b.jpg' }] }), true)
})

test('un brouillon bloque, même sous un statut resté `assigne`', () => {
  assert.equal(depotPorteDuTravail({ ...nu('assigne'), texte_v1: 'trois mots écrits' }), true)
})

test('une copie transcrite bloque — c’est le travail de l’élève, pas une trace', () => {
  assert.equal(depotPorteDuTravail({ ...nu('ouvert'), transcription_v1: 'la copie lue' }), true)
})

// ── Ce qui ressemble à du contenu et n'en est pas ───────────────────────────

test('une chaîne vide ou blanche n’est pas du contenu', () => {
  assert.equal(depotPorteDuTravail({ ...nu(), texte_v1: '' }), false)
  assert.equal(depotPorteDuTravail({ ...nu(), texte_v1: '   \n  ' }), false)
})

test('un tableau de photos VIDE n’est pas du contenu', () => {
  assert.equal(depotPorteDuTravail({ ...nu(), photos_v1: [] }), false)
})

// ── Le comptage mêlé ────────────────────────────────────────────────────────

test('le compte ne retient que les dépôts qui portent quelque chose', () => {
  const lot: DepotPourRetrait[] = [
    nu('assigne'), nu('ouvert'), nu('retire'),
    nu('v1_remis'),                                   // statut avancé, rien d'écrit → ne bloque pas
    { ...nu(), texte_v1: 'une copie' },               // bloque
    { ...nu('ouvert'), photos_v1: [{ c: 'a.jpg' }] }, // bloque
    { ...nu(), photos_v1: [] },                       // tableau vide → ne bloque pas
  ]
  assert.equal(depotsQuiBloquent(lot), 2)
})
