// « La fourchette reste l'information ; L'ENTIER EST LA VALEUR » (`02-` §2.4).
// Ce qui s'éprouve ici : la borne haute, le DOUBLE strict, le NULL du motif, et
// un tag qui n'est qu'un tag.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CelluleDureeInvalide, ECHELLE_DES_TAGS, FACTEUR_MICRO_QUESTION, MS_PAR_MINUTE,
  dureeConformeALaBorneHaute, dureeIndicativeDeLaCellule, dureeIndicativeLisible,
  dureeReelleMs, estMotifLicite, microQuestionDue, motifDepassementAEcrire, tagDeDuree,
  type CelluleDuree,
} from './duree'
import { TAGS_DUREE, type Geste, type Grain } from './types'

/**
 * La table du `02-` §2.4, EN FIXTURE DE TEST SEULEMENT — le module ne la porte
 * pas : elle vit en base (`exercices_durees`). On la pose ici pour éprouver la
 * règle « l'entier est la borne haute » sans lire la base.
 */
const TABLE: Array<[Geste, Grain, CelluleDuree, number]> = [
  ['diagnostiquer', 'micro', { borneMin: 5, borneMax: 7 }, 7],
  ['diagnostiquer', 'meso', { borneMin: 10, borneMax: 15 }, 15],
  ['diagnostiquer', 'macro', { borneMin: 20, borneMax: 30 }, 30],
  ['transformer', 'micro', { borneMin: 6, borneMax: 8 }, 8],
  ['transformer', 'meso', { borneMin: 12, borneMax: 17 }, 17],
  ['transformer', 'macro', { borneMin: 25, borneMax: 35 }, 35],
  ['produire', 'micro', { borneMin: 8, borneMax: 10 }, 10],
  ['produire', 'meso', { borneMin: 17, borneMax: 20 }, 20],
  ['produire', 'macro', { borneMin: 30, borneMax: 40 }, 40],
]

/** Un type meso de transformation : 17 minutes, donc 34 au double. */
const DIX_SEPT = 17
const minutes = (n: number) => n * MS_PAR_MINUTE

// ── L'entier d'un type ─────────────────────────────────────────────────────

test('la valeur d\'un type est la BORNE HAUTE de sa cellule — jamais la moyenne', () => {
  for (const [geste, grain, cellule, attendu] of TABLE) {
    assert.equal(dureeIndicativeDeLaCellule(geste, grain, cellule), attendu,
      `${geste} × ${grain}`)
  }
})

test('l\'entier n\'est JAMAIS un intervalle — la fourchette reste l\'information', () => {
  const valeur = dureeIndicativeDeLaCellule('produire', 'macro', { borneMin: 30, borneMax: 40 })
  assert.equal(typeof valeur, 'number')
  assert.equal(Number.isInteger(valeur), true)
  assert.equal(valeur, 40, 'et non 35, la moyenne de la fourchette')
})

test('une borne non entière est REFUSÉE — on ne devine pas une durée', () => {
  assert.throws(
    () => dureeIndicativeDeLaCellule('transformer', 'meso', { borneMin: 12, borneMax: 17.5 }),
    CelluleDureeInvalide)
})

test('une cellule inversée ou à borne basse nulle est refusée', () => {
  assert.throws(
    () => dureeIndicativeDeLaCellule('diagnostiquer', 'micro', { borneMin: 7, borneMax: 5 }),
    CelluleDureeInvalide)
  assert.throws(
    () => dureeIndicativeDeLaCellule('diagnostiquer', 'micro', { borneMin: 0, borneMax: 7 }),
    CelluleDureeInvalide)
})

test('la garde de la base se relit en code : `duree_min` = `borne_max`', () => {
  const cellule = { borneMin: 12, borneMax: 17 }
  assert.equal(dureeConformeALaBorneHaute(cellule, 17), true)
  assert.equal(dureeConformeALaBorneHaute(cellule, 12), false, 'la borne BASSE n\'est pas la valeur')
  assert.equal(dureeConformeALaBorneHaute(cellule, 14.5), false, 'ni la moyenne')
})

test('une durée absente ne devient JAMAIS 0 — « NULL n\'est pas 0 »', () => {
  assert.equal(dureeIndicativeLisible(null), null)
  assert.equal(dureeIndicativeLisible(undefined), null)
  assert.equal(dureeIndicativeLisible(0), null, 'un 0 poserait le double à 0')
  assert.equal(dureeIndicativeLisible(-5), null)
  assert.equal(dureeIndicativeLisible(12.5), null, 'la durée est un ENTIER de minutes')
  assert.equal(dureeIndicativeLisible('17'), null, 'une chaîne n\'est pas une durée')
  assert.equal(dureeIndicativeLisible(17), 17)
})

// ── Le chronomètre ouverture → dépôt ───────────────────────────────────────

test('le temps réel se mesure de l\'OUVERTURE au DÉPÔT', () => {
  assert.equal(
    dureeReelleMs('2026-09-14T08:00:00Z', '2026-09-14T08:20:00Z'), minutes(20))
})

test('un horodatage manquant, illisible ou À L\'ENVERS rend NULL — jamais 0', () => {
  assert.equal(dureeReelleMs(null, '2026-09-14T08:20:00Z'), null)
  assert.equal(dureeReelleMs('2026-09-14T08:00:00Z', null), null)
  assert.equal(dureeReelleMs('hier matin', '2026-09-14T08:20:00Z'), null)
  assert.equal(dureeReelleMs('2026-09-14T08:20:00Z', '2026-09-14T08:00:00Z'), null,
    'un 0 se taguerait `tres_courte` : une horloge de travers n\'accuse pas un élève')
})

// ── La micro-question : STRICTEMENT au-delà du double ──────────────────────

test('la micro-question se déclenche au-delà du DOUBLE — le double exact ne suffit pas', () => {
  const double = minutes(DIX_SEPT * FACTEUR_MICRO_QUESTION)
  assert.equal(microQuestionDue(DIX_SEPT, double - 1), false)
  assert.equal(microQuestionDue(DIX_SEPT, double), false, '« PLUS du double » : 34 min ne dépasse pas 34 min')
  assert.equal(microQuestionDue(DIX_SEPT, double + 1), true)
})

test('en deçà, rien ne se déclenche — dépasser la durée indicative n\'est pas dépasser le double', () => {
  assert.equal(microQuestionDue(DIX_SEPT, minutes(5)), false)
  assert.equal(microQuestionDue(DIX_SEPT, minutes(20)), false, '20 > 17, et pourtant rien')
  assert.equal(microQuestionDue(DIX_SEPT, minutes(60)), true)
})

test('sans durée indicative utilisable, la micro-question ne se déclenche JAMAIS', () => {
  assert.equal(microQuestionDue(0, minutes(90)), false, 'un seuil à 0 la poserait à la 1re seconde')
  assert.equal(microQuestionDue(Number.NaN, minutes(90)), false)
  assert.equal(microQuestionDue(DIX_SEPT, Number.NaN), false)
  assert.equal(microQuestionDue(DIX_SEPT, -1), false)
})

// ── Le motif : NULL dans LES DEUX cas d'absence ────────────────────────────

test('`motif_depassement` reste NULL quand la micro-question n\'a PAS ÉTÉ DÉCLENCHÉE', () => {
  assert.equal(motifDepassementAEcrire(false, 'pause'), null,
    'une réponse arrivée sans déclenchement ne s\'écrit pas')
  assert.equal(motifDepassementAEcrire(false, null), null)
})

test('`motif_depassement` reste NULL quand la micro-question n\'a PAS ÉTÉ RÉPONDUE', () => {
  assert.equal(motifDepassementAEcrire(true, null), null)
  assert.equal(motifDepassementAEcrire(true, undefined), null)
  assert.equal(motifDepassementAEcrire(true, ''), null, 'une réponse vide est une absence')
})

test('les DEUX seules valeurs licites passent — et une troisième ne s\'écrit pas', () => {
  assert.equal(motifDepassementAEcrire(true, 'pause'), 'pause')
  assert.equal(motifDepassementAEcrire(true, 'difficulte'), 'difficulte')
  assert.equal(motifDepassementAEcrire(true, 'pas_repondu'), null,
    'la liste est fermée à deux valeurs : on n\'invente pas un troisième motif')
  assert.equal(motifDepassementAEcrire(true, 'Pause'), null, 'la casse de l\'enum fait foi')
  assert.equal(estMotifLicite('difficulte'), true)
  assert.equal(estMotifLicite('fatigue'), false)
  assert.equal(estMotifLicite(2), false)
})

// ── Le tag de durée : un tag, jamais un verdict ────────────────────────────

test('l\'échelle porte les CINQ tags de `TAGS_DUREE`, dans leur ordre', () => {
  assert.deepEqual(ECHELLE_DES_TAGS.map((p) => p.tag), [...TAGS_DUREE])
  assert.equal(ECHELLE_DES_TAGS[ECHELLE_DES_TAGS.length - 1].borneHaute, null,
    'la dernière borne est ouverte : tout ratio trouve son tag')
})

test('une durée TRÈS INFÉRIEURE à l\'indicative se tague `tres_courte` — le 1er signal du faisceau', () => {
  assert.equal(tagDeDuree(20, minutes(2)), 'tres_courte', 'un dixième de la durée')
  assert.equal(tagDeDuree(20, 0), 'tres_courte', 'un dépôt instantané')
  assert.equal(tagDeDuree(20, minutes(4.9)), 'tres_courte')
})

test('le quart est la frontière : au quart exact, `courte`, pas « très »', () => {
  assert.equal(tagDeDuree(20, minutes(5)), 'courte')
  assert.equal(tagDeDuree(20, minutes(9)), 'courte')
})

test('le nominal va de la MOITIÉ AU DOUBLE INCLUS', () => {
  assert.equal(tagDeDuree(20, minutes(10)), 'nominale', 'la moitié exacte est déjà nominale')
  assert.equal(tagDeDuree(20, minutes(20)), 'nominale', 'la durée indicative elle-même')
  assert.equal(tagDeDuree(20, minutes(40)), 'nominale', 'le double EXACT reste nominal')
})

test('« longue » commence exactement là où la micro-question se déclenche', () => {
  const juste_apres = minutes(20 * FACTEUR_MICRO_QUESTION) + 1
  assert.equal(microQuestionDue(20, juste_apres), true)
  assert.equal(tagDeDuree(20, juste_apres), 'longue', 'les deux seuils ne divergent pas')
  assert.equal(tagDeDuree(20, minutes(80)), 'longue', 'le quadruple exact reste `longue`')
})

test('au-delà du quadruple, `tres_longue` — l\'exercice est resté ouvert', () => {
  assert.equal(tagDeDuree(20, minutes(81)), 'tres_longue')
  assert.equal(tagDeDuree(20, minutes(600)), 'tres_longue')
})

test('sans ratio calculable, le tag est NULL — jamais `nominale` par défaut', () => {
  assert.equal(tagDeDuree(0, minutes(20)), null, 'une durée indicative absente')
  assert.equal(tagDeDuree(20, Number.NaN), null, 'un temps réel illisible')
  assert.equal(tagDeDuree(20, -1), null, 'une horloge à l\'envers')
})
