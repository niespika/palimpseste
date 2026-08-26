// Tests de la RÈGLE « ces deux exercices sont-ils le même pour la mesure »
// (fonctions PURES). Exécution : `npm test`. Encode ce que le lot décide :
//  (1) deux conceptions du MÊME énoncé sont interchangeables ;
//  (2) un énoncé différent bloque — et le refus NOMME le champ qui diffère ;
//  (3) l'ordre des clés d'un JSON ne fait pas une différence ;
//  (4) `null` et `undefined` se confondent (PostgREST rend l'un ou l'autre) ;
//  (5) ⛔ la CLASSE fait partie de l'identité : on ne déplace pas une copie
//      vers l'exercice d'une autre classe ;
//  (6) une trace de chaîne bloque, et le refus dit laquelle.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CHAMPS_IDENTITE,
  ecartsDIdentite,
  memeIdentiteDeMesure,
  tracesPresentes,
  type ExercicePourDeplacement,
} from './deplacement'

const base: ExercicePourDeplacement = {
  classe_id: 'classe-1hlp',
  type_id: 'type-essai',
  consigne_instanciee: { enonce: 'La vérité est-elle toujours bonne à dire ?', appui: null },
  reference_id: 'ref-1',
  cran: 9,
  genre: 'dissertation',
  lieu: 'classe',
  modes_par_competence: { expression: 'composer', structure: 'composer' },
  observable_isole_code: null,
  observable_isole_competence: null,
  cible_primaire: 'structure',
  materiau_source_provenance: 'sujet',
  materiau_source_support: 'texte',
  materiau_source_texte_id: null,
  materiau_source_sujet_id: 'sujet-42',
  materiau_cible_provenance: null,
  materiau_cible_support: null,
  materiau_cible_texte_id: null,
  materiau_cible_sujet_id: null,
}

// ── (1) Le cas qui motive le lot ────────────────────────────────────────────

test('deux conceptions du MÊME énoncé sont interchangeables', () => {
  assert.deepEqual(ecartsDIdentite(base, { ...base }), [])
  assert.equal(memeIdentiteDeMesure(base, { ...base }), true)
})

// ── (2) Ce qui bloque, et le refus qui nomme ────────────────────────────────

test('un énoncé différent bloque, et l’écart est NOMMÉ', () => {
  const autre = { ...base, consigne_instanciee: { enonce: 'Peut-on tout dire ?', appui: null } }
  assert.deepEqual(ecartsDIdentite(base, autre), ['consigne_instanciee'])
  assert.equal(memeIdentiteDeMesure(base, autre), false)
})

test('chaque champ d’identité bloque à lui seul', () => {
  for (const champ of CHAMPS_IDENTITE) {
    const autre = { ...base, [champ]: 'valeur-differente-de-tout' }
    assert.ok(ecartsDIdentite(base, autre).includes(champ), `${champ} devrait bloquer`)
  }
})

test('plusieurs écarts sont tous rapportés', () => {
  const autre = { ...base, cran: 5, genre: 'commentaire' }
  assert.deepEqual(ecartsDIdentite(base, autre).sort(), ['cran', 'genre'])
})

// ── (5) La classe ───────────────────────────────────────────────────────────

test('⛔ on ne déplace pas une copie vers l’exercice d’une AUTRE classe', () => {
  const autreClasse = { ...base, classe_id: 'classe-t5' }
  assert.deepEqual(ecartsDIdentite(base, autreClasse), ['classe_id'])
})

// ── (3) et (4) Ce qui n'est PAS une différence ──────────────────────────────

test('l’ordre des clés d’un JSON ne fait pas une différence', () => {
  const memeAutrementEcrit = {
    ...base,
    consigne_instanciee: { appui: null, enonce: 'La vérité est-elle toujours bonne à dire ?' },
    modes_par_competence: { structure: 'composer', expression: 'composer' },
  }
  assert.deepEqual(ecartsDIdentite(base, memeAutrementEcrit), [])
})

test('`null` et `undefined` se confondent', () => {
  const sansLesNuls: ExercicePourDeplacement = { ...base }
  delete sansLesNuls.observable_isole_code
  delete sansLesNuls.materiau_cible_sujet_id
  assert.deepEqual(ecartsDIdentite(base, sansLesNuls), [])
})

test('⚠️ mais `null` et la CHAÎNE "null" sont bien différents', () => {
  const piege = { ...base, observable_isole_code: 'null' }
  assert.deepEqual(ecartsDIdentite(base, piege), ['observable_isole_code'])
})

test('⚠️ et le NOMBRE 9 n’est pas la CHAÎNE "9"', () => {
  const piege = { ...base, cran: '9' }
  assert.deepEqual(ecartsDIdentite(base, piege), ['cran'])
})

// ── (6) Les traces de chaîne ────────────────────────────────────────────────

test('un dépôt vierge de toute trace ne bloque rien', () => {
  assert.deepEqual(
    tracesPresentes({ squelettes: 0, mesures: 0, monitoring: 0, retours: 0, jobs: 0 }),
    [],
  )
})

test('chaque trace bloque et se nomme', () => {
  assert.deepEqual(
    tracesPresentes({ squelettes: 1, mesures: 0, monitoring: 0, retours: 0, jobs: 0 }),
    ['un squelette'],
  )
  assert.deepEqual(
    tracesPresentes({ squelettes: 1, mesures: 3, monitoring: 0, retours: 1, jobs: 0 }),
    ['un squelette', 'des mesures de compétence', 'un retour'],
  )
})
