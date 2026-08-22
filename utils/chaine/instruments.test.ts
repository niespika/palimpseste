// LA CLAUSE GRANULAIRE, éprouvée. « Une compétence dont la fiche n'a pas passé
// sa porte reste HORS DE LA CHAÎNE — pas d'instrument dérivé, pas de mesure. Au
// moment de l'écriture, C'EST LE CAS DES SIX. »            — PROMPT, piège 54
//
// Ce test dit l'état du jour ET la règle. Le jour où une fiche passe sa porte,
// c'est l'assertion « aucune ouverte » qui tombe — et c'est le bon signal :
// elle rappelle qu'il faut brancher le slot, pas la contourner.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { CALAME, MANIFESTE_LU, MONITORING, competencesOuvertes, etatCompetence, verifierCoherence } from './instruments'
import { COMPETENCES } from './types'

test('l\'instrument dérivé et son branchement sont COHÉRENTS', () => {
  assert.deepEqual(verifierCoherence(), [])
})

test('AUCUNE des six compétences n\'entre dans la chaîne au 21/08/2026', () => {
  assert.deepEqual(competencesOuvertes(), [])
})

test('chaque compétence fermée DIT POURQUOI — le motif se montre, il ne se devine pas', () => {
  for (const c of COMPETENCES) {
    const e = etatCompetence(c)
    assert.equal(e.ouverte, false)
    assert.match(e.motif ?? '', /vers|banc|dériv|branch/i)
  }
})

test('le Monitoring est au statut PLAFOND qu\'il déclare : son étage se construit', () => {
  assert.equal(MANIFESTE_LU.monitoring.ouvert, true)
  assert.equal(MONITORING.version, MANIFESTE_LU.monitoring.version)
  assert.match(MONITORING.prompt_extraction, /^SYSTÈME — EXTRACTION · MONITORING/)
})

test('le prompt du Monitoring est DÉRIVÉ de sa fiche — deux variables, pas trois', () => {
  assert.deepEqual([...MONITORING.variables], ['CONSIGNE', 'REPONSE_ELEVE'])
  assert.deepEqual([...MONITORING.champs_sortie],
    ['aveu_incomprehension', 'confiance_declaree', 'marquage_supposition'])
})

test('le catalogue du Monitoring porte `spontanee` / `sollicitee` — la source fait foi', () => {
  assert.deepEqual(MONITORING.bloc_machine.squelette.catalogue.sources, ['spontanee', 'sollicitee'])
})

test('`n/a` est une VALEUR DÉCLARÉE dans les deux échelles du Monitoring', () => {
  assert.equal(MONITORING.bloc_machine.observables.calibration.valeurs.includes('n/a'), true)
  assert.equal(MONITORING.bloc_machine.observables.amplitude_ecart.valeurs.includes('n/a'), true)
})

test('le gabarit de Calame est DÉRIVÉ du `07-` §4, avec ses trois variables', () => {
  assert.deepEqual([...CALAME.variables], ['COMPETENCE', 'MOMENT', 'REGISTRE'])
  assert.match(CALAME.gabarit, /^SYSTÈME — CALAME · RETOUR FORMATIF/)
  // « Les règles 1 à 6 et la règle 8 sont verrouillées » (§4).
  assert.deepEqual([...CALAME.regles_verrouillees], [1, 2, 3, 4, 5, 6, 8])
  assert.deepEqual([...CALAME.sections_editables], ['ton', 'longueur'])
})

test('le gabarit ne porte AUCUNE variable au-delà des trois', () => {
  const tokens = [...CALAME.gabarit.matchAll(/\{\{\s*([A-Z_]+)/g)].map((m) => m[1])
  assert.deepEqual([...new Set(tokens)].sort(), ['COMPETENCE', 'MOMENT', 'REGISTRE'])
})

test('le manifeste porte les empreintes de ses sources — c\'est ce qui rend la divergence lisible', () => {
  assert.match(MANIFESTE_LU.sources['07-Implementation.md'].empreinte, /^[0-9a-f]{64}$/)
  assert.match(MANIFESTE_LU.sources['competences/monitoring.md'].empreinte, /^[0-9a-f]{64}$/)
  // ⚠️ PAS de version en dur ici. Le `07-` a avancé trois fois pendant la seule
  //    séance qui l'a écrit : un test qui épingle « 2.8 » ne garde rien, il crie
  //    faux à chaque édition du professeur. Ce qui garde l'identité, c'est le
  //    `--verifie` ci-dessous, qui compare le dérivé À SA SOURCE.
  assert.match(MANIFESTE_LU.sources['07-Implementation.md'].version, /^\d+\.\d+$/)
})

// ── Le contrôle de dérivation, CÂBLÉ ────────────────────────────────────────
//
// `--verifie` est le seul organe capable de dire que les dérivés ont menti — et
// rien ne l'exécutait. La suite passait donc sur des dérivés périmés : au moment
// où ce test a été écrit, `07-Implementation.md` avait avancé de deux versions
// et l'application servait un gabarit estampillé d'une version disparue, sans
// qu'aucun signal ne se lève. Les assertions ci-dessus comparent le dérivé À
// LUI-MÊME : elles ne peuvent structurellement rien voir.

const RACINE_CONCEPTION = '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

test('les dérivés sont IDENTIQUES à leurs sources (derive-instruments.py --verifie)', (t) => {
  if (!existsSync(RACINE_CONCEPTION)) {
    // Pas de dépôt de conception sous la main : on ne crie pas faux.
    t.skip('dépôt de conception absent')
    return
  }
  const r = spawnSync('python3', ['scripts/derive-instruments.py', '--verifie'], { encoding: 'utf-8' })
  assert.equal(r.status, 0,
    'les dérivés ont divergé de leurs sources — rejouer `derive-instruments.py --ecris`\n'
    + `${r.stdout}${r.stderr}`)
})
