// ============================================================================
// C4 · L9 — CE QUE LA CONCEPTION DES EXAMENS DIAGNOSTIQUES DOIT PROUVER SANS
//            BASE.
// ----------------------------------------------------------------------------
// « Ce que chaque examen mesure EST ARRÊTÉ — ne le dérive de rien, RECOPIE-LE »
// (`01-` §10). Une recopie ne se relit pas toute seule : ces tests la comparent
// à la source, mot pour mot, parce que rien d'autre ne le fera — le dériveur de
// doctrine est AVEUGLE à ces deux types par construction (il compte
// `exercices_types where nature <> 'complet'`).
//
// Le reste de la preuve est en base, à la recette : `scripts/recette/examens-c4l9.mjs`.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CODE_TYPE, INTITULE, MATIERE, MODES_MESURES, MODULES_EXAMEN, NOM_MODULE,
  TYPE_EXERCICE, moduleDuType,
} from './types'
import {
  consigneANoter, consigneDepuisLeSujet, consigneDepuisLeTexte, enTete,
} from './consigne'

// ── CE QUE CHAQUE EXAMEN MESURE (`01-` §10) ─────────────────────────────────

test('l’ESSAI mesure Expression, Argumentation et Structure — LES TROIS en `composer`', () => {
  assert.deepEqual(MODES_MESURES.codex, {
    expression: ['composer'],
    argumentation: ['composer'],
    structure: ['composer'],
  })
})

test('l’EXPLICATION mesure Expression en `composer`, Argumentation et Structure en '
  + '`expliquer`, et Synthèse en `restituer`', () => {
  assert.deepEqual(MODES_MESURES.aletheia, {
    expression: ['composer'],
    argumentation: ['expliquer'],
    structure: ['expliquer'],
    synthese: ['restituer'],
  })
})

test('⚠️ NI LA CONNAISSANCE NI LE QUESTIONNEMENT n’y sont mesurés — ils sortent de la '
  + 'semaine 1 SANS LETTRE', () => {
  for (const m of MODULES_EXAMEN) {
    const mesurees = Object.keys(MODES_MESURES[m])
    assert.ok(!mesurees.includes('connaissance'), `${m} ne mesure pas la connaissance`)
    assert.ok(!mesurees.includes('questionnement'), `${m} ne mesure pas le questionnement`)
  }
})

test('⚠️ ON NE RECOPIE PAS LES SIX : le plafond du type reste au type, l’arrêté à '
  + 'l’instance — trois compétences ici, quatre là', () => {
  assert.equal(Object.keys(MODES_MESURES.codex).length, 3)
  assert.equal(Object.keys(MODES_MESURES.aletheia).length, 4)
})

test('⚠️ LA VALEUR EST TOUJOURS UNE LISTE, jamais un scalaire (`07-` §1.2 ; '
  + '`exercices_modes_chk`)', () => {
  for (const m of MODULES_EXAMEN) {
    for (const [competence, modes] of Object.entries(MODES_MESURES[m])) {
      assert.ok(Array.isArray(modes), `${m}.${competence} est une liste`)
      assert.ok(modes.length >= 1, `${m}.${competence} n’est pas vide`)
    }
  }
})

test('les deux listes sont IDENTIQUES EN TC ET EN HLP : il n’y a qu’une liste par examen', () => {
  // Rien dans la structure ne se différencie par parcours — et c'est le point :
  // « les deux listes sont identiques en TC et en HLP » (`01-` §10). Un jour où
  // quelqu'un voudrait les différencier, il devrait changer cette forme, et ce
  // test tomberait.
  assert.deepEqual(Object.keys(MODES_MESURES).sort(), ['aletheia', 'codex'])
})

// ── LE RENOMMAGE, ET CE QU'IL SÉPARE ────────────────────────────────────────

test('les deux codes de type sont les codes RENOMMÉS — jamais les anciens', () => {
  assert.equal(CODE_TYPE.codex, 'examen_diagnostique_essai')
  assert.equal(CODE_TYPE.aletheia, 'examen_diagnostique_explication_texte')
})

test('⚠️ aucun code de type ne porte plus le préfixe `diagnostic_`, qui appartient aux '
  + 'CRANS du geste `diagnostiquer` — deux choses qui n’ont rien à voir', () => {
  for (const m of MODULES_EXAMEN) {
    assert.ok(!CODE_TYPE[m].startsWith('diagnostic_'),
      `${CODE_TYPE[m]} ne se confond pas avec un cran de diagnostic`)
  }
})

// ── LE MODULE, ET SON SEUL ÉCART ────────────────────────────────────────────

test('la typologie du plan mène au module : `ecriture` → Codex, `lecture` → Aletheia', () => {
  assert.equal(TYPE_EXERCICE.codex, 'ecriture')
  assert.equal(TYPE_EXERCICE.aletheia, 'lecture')
  assert.equal(moduleDuType('ecriture'), 'codex')
  assert.equal(moduleDuType('lecture'), 'aletheia')
})

test('un type d’exercice qui n’est pas un examen diagnostique ne mène à aucun module', () => {
  for (const t of ['synthese', 'quiz', 'examen_livre', 'bac_blanc', 'fragment', 'essai', '']) {
    assert.equal(moduleDuType(t), null, `${t} n’est pas un examen diagnostique`)
  }
})

test('LE SEUL ÉCART entre les deux écrans : un SUJET dans Codex, un TEXTE dans Aletheia', () => {
  assert.equal(MATIERE.codex, 'sujet')
  assert.equal(MATIERE.aletheia, 'texte')
  assert.deepEqual(Object.keys(MATIERE).sort(), ['aletheia', 'codex'])
  assert.equal(NOM_MODULE.codex, 'Codex')
  assert.equal(NOM_MODULE.aletheia, 'Aletheia')
})

test('les deux intitulés nomment un EXAMEN DIAGNOSTIQUE, et disent lequel', () => {
  for (const m of MODULES_EXAMEN) {
    assert.match(INTITULE[m], /Examen diagnostique/)
  }
  assert.match(INTITULE.codex, /essai/)
  assert.match(INTITULE.aletheia, /explication de texte/)
})

// ── LA CONSIGNE — ce que l'élève lit ────────────────────────────────────────

test('l’en-tête d’un texte porte l’auteur, le titre et sa localisation', () => {
  assert.equal(enTete('Descartes', 'Méditations métaphysiques', 'Méditation II'),
    'Descartes, Méditations métaphysiques — Méditation II')
})

test('l’en-tête tient sans localisation, et sans titre', () => {
  assert.equal(enTete('Descartes', 'Méditations métaphysiques', ''),
    'Descartes, Méditations métaphysiques')
  assert.equal(enTete('Descartes', '', ''), 'Descartes')
})

test('la consigne d’ÉCRITURE part de l’énoncé du sujet, tel qu’il est déposé', () => {
  const c = consigneDepuisLeSujet(INTITULE.codex, '  Peut-on douter de tout ?  ')
  assert.ok(c.includes('Peut-on douter de tout ?'))
  assert.ok(c.startsWith(INTITULE.codex))
})

test('⭐ la consigne de LECTURE porte LE TEXTE ENTIER — sans quoi l’élève aurait à '
  + 'expliquer un texte qu’il ne voit pas', () => {
  const texte = 'Je suppose donc que toutes les choses que je vois sont fausses.'
  const c = consigneDepuisLeTexte(INTITULE.aletheia, 'Descartes, Méditations', texte)
  assert.ok(c.includes(texte), 'le texte est servi dans la consigne')
  assert.ok(c.includes('Descartes, Méditations'), 'l’en-tête bibliographique aussi')
})

test('⚠️ LE PIÈGE CRLF : ce qu’un `<textarea>` envoie ressort en `\\n`, et le '
  + 'découpage en paragraphes SURVIT', () => {
  const commeLeNavigateurLEnvoie = 'Un.\r\n\r\nDeux.\r\n\r\nTrois.'
  const note = consigneANoter(commeLeNavigateurLEnvoie)
  assert.equal(note, 'Un.\n\nDeux.\n\nTrois.')
  assert.equal(note.split('\n\n').length, 3)
})

test('⚠️ AUCUN `trim` par ligne, aucune fusion de lignes vides : seul le saut FINAL '
  + 'part — il vient du champ, pas du texte', () => {
  assert.equal(consigneANoter('  Un.\n\n  Deux.  \n\n\n'), '  Un.\n\n  Deux.  ')
})
