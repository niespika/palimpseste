// C5 · L3 — LA TRANCHE DE RÉFÉRENCE, ÉPROUVÉE.
//
// « On ne passe à un consommateur que ce que sa règle lit » (`05-` §1).
//
// ⭐ Le cas qui compte est celui que la source nomme elle-même, et il est EN
//    BASE : « une phrase dont `relance` est la SEULE fonction ne porte aucun
//    contenu à restituer et n'est donc pas une unité pour la Synthèse ».

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { regleDeLecture, trancheDeReference } from './tranche'
import { etatCompetence } from './instruments'
import { FONCTIONS_PHRASE, FONCTIONS_MOMENT, STATUTS } from '../fabrique/verifie-reference'

const INSTRUMENT = (c: 'synthese' | 'questionnement' | 'argumentation') =>
  etatCompetence(c).instrument

/** Une référence au format canonique, réduite à ce que les règles regardent. */
const REFERENCE = {
  phrases: [
    { n: 1, fonctions: ['defend_these'], statuts: ['affirme'] },
    { n: 2, fonctions: ['explique'], statuts: ['rapporte'] },
    // ⭐ LE CAS DU `05-` §1 : `relance` est sa SEULE fonction.
    { n: 3, fonctions: ['relance'], statuts: ['affirme'] },
    { n: 4, fonctions: ['illustre', 'relance'], statuts: ['concede'] },
  ],
  moments: [
    { m: 1, de: 1, a: 2, fonction: 'pose', cible: [], statuts: ['affirme'], etiquette: 'ouverture' },
    { m: 2, de: 3, a: 4, fonction: 'nuance', cible: [1], statuts: ['concede'], etiquette: 'reprise' },
  ],
  concepts: [{ nom: 'liberté' }],
  lectures: [{ id: 'L1' }],
  armature: { these: 'T', these_phrases: [1], question_directrice: 'Que peut-on savoir ?' },
  hesitation: { presente: false },
}

test('LA RÈGLE DE LA SYNTHÈSE SE LIT SUR SA FICHE — jamais recopiée ici', () => {
  // ⭐ `bloc_machine.squelette.catalogue.fonctions_reference`, versé par la
  //    dérivation. « Une liste fermée qui vit à deux endroits diverge. »
  const r = regleDeLecture('synthese', INSTRUMENT('synthese'))
  assert.ok(r)
  assert.deepEqual([...r!.fonctionsPhrase!], ['defend_these', 'explique', 'illustre'])
  // ⛔ Les statuts et les fonctions de moment ne se retranchent PAS : le juge lit
  //    la référence entière par `document_p2`, et c'est là qu'il prend le statut
  //    d'énonciation « dont le §4 dit qu'il en a les moyens ».
  assert.equal(r!.statuts, undefined)
  assert.equal(r!.fonctionsMoment, undefined)
})

test('`relance` EST DÉCLARÉE AU `02-` ET NON LUE PAR LA SYNTHÈSE — donc écartée EN SILENCE', () => {
  // ⚠️ C'est toute l'asymétrie : « une valeur nouvelle est INERTE tant qu'aucune
  //    règle ne la lit » — écartée sans un mot. Une valeur NON déclarée, elle,
  //    passerait AVEC une alerte.
  assert.ok((FONCTIONS_PHRASE as readonly string[]).includes('relance'),
    '`relance` est bien déclarée au format qui fait foi')
  const t = trancheDeReference(REFERENCE, 'synthese', INSTRUMENT('synthese'))
  assert.deepEqual(t.alertes, [], 'une valeur DÉCLARÉE que la règle ne lit pas ne parle pas')
  const ph = (t.reference as { phrases: Array<{ n: number; fonctions: string[] }> }).phrases
  assert.deepEqual(ph.map((p) => p.fonctions),
    [['defend_these'], ['explique'], [], ['illustre']])
  // ⭐ ET C'EST LE JOURNAL QUI PORTE L'EXCLUSION, pas une alerte : une exclusion
  //    par règle est le fonctionnement normal.
  assert.deepEqual(t.ecarte, [
    { ou: 'phrase 3', valeurs: ['relance'] },
    { ou: 'phrase 4', valeurs: ['relance'] },
  ])
})

test('L’UNITÉ N’EST PAS RETIRÉE — la retirer ferait mentir les MOMENTS', () => {
  // ⛔ L'intervalle `de..a` d'un moment est garanti « contigu, sans trou ni
  //    chevauchement » par le validateur, et `normaliserReference` le déplie en
  //    unités. Retirer la phrase 3 laisserait le moment 2 réclamer une unité
  //    absente. *Le format n'est pas à nous ; ce qui est à nous, ce sont les
  //    valeurs qu'on sert.*
  const t = trancheDeReference(REFERENCE, 'synthese', INSTRUMENT('synthese'))
  const r = t.reference as { phrases: Array<{ n: number }>; moments: Array<{ de: number; a: number }> }
  assert.deepEqual(r.phrases.map((p) => p.n), [1, 2, 3, 4])
  assert.deepEqual(r.moments.map((m) => [m.de, m.a]), [[1, 2], [3, 4]])
})

test('CE QUE LA SYNTHÈSE LIT ENCORE TRAVERSE INTACT — statuts, moments, armature', () => {
  const t = trancheDeReference(REFERENCE, 'synthese', INSTRUMENT('synthese'))
  const r = t.reference as Record<string, unknown>
  assert.deepEqual((r.phrases as Array<{ statuts: string[] }>).map((p) => p.statuts),
    [['affirme'], ['rapporte'], ['affirme'], ['concede']])
  assert.deepEqual((r.moments as Array<{ fonction: string }>).map((m) => m.fonction),
    ['pose', 'nuance'])
  assert.deepEqual(r.armature, REFERENCE.armature)
  assert.deepEqual(r.concepts, REFERENCE.concepts)
  assert.deepEqual(r.lectures, REFERENCE.lectures)
  assert.deepEqual(r.hesitation, REFERENCE.hesitation)
})

test('LE QUESTIONNEMENT NE LIT QU’UN CHAMP — et sa règle le dit', () => {
  // ⭐ « C'est son champ `armature.question_directrice`, et LE MODULE N'EN LIT
  //    AUCUN AUTRE » (fiche §4). Il ne lit donc aucune fonction, aucun statut.
  const r = regleDeLecture('questionnement', INSTRUMENT('questionnement'))
  assert.deepEqual(r, { fonctionsPhrase: [], fonctionsMoment: [], statuts: [] })
  const t = trancheDeReference(REFERENCE, 'questionnement', INSTRUMENT('questionnement'))
  const ref = t.reference as Record<string, unknown>
  for (const p of ref.phrases as Array<{ fonctions: string[]; statuts: string[] }>) {
    assert.deepEqual(p.fonctions, [])
    assert.deepEqual(p.statuts, [])
  }
  // ⛔ Une fonction de moment écartée devient ABSENTE, jamais vide : le format la
  //    déclare au SINGULIER, et servir `[]` changerait son type.
  for (const m of ref.moments as Array<Record<string, unknown>>) {
    assert.equal('fonction' in m, false)
    assert.deepEqual(m.statuts, [])
  }
  // ⭐ ET L'ARMATURE DESCEND INTACTE — c'est tout ce qu'il lit.
  assert.deepEqual(ref.armature, REFERENCE.armature)
  assert.deepEqual(t.alertes, [])
})

test('UNE COMPÉTENCE SANS RÈGLE REÇOIT LA RÉFÉRENCE ENTIÈRE — on ne retranche que le NOMMÉ', () => {
  // « Un champ absent veut dire *il lit tout ce que le `02-` déclare*. » Les
  // quatre autres ne reparsent même pas la référence : leur donner une règle
  // serait déclarer une lecture qui n'existe pas.
  assert.equal(regleDeLecture('argumentation', INSTRUMENT('argumentation')), null)
  const t = trancheDeReference(REFERENCE, 'argumentation', INSTRUMENT('argumentation'))
  assert.equal(t.reference, REFERENCE, 'la référence part TELLE QUELLE, sans copie')
  assert.deepEqual(t.alertes, [])
  assert.deepEqual(t.ecarte, [])
})

test('UNE VALEUR QUE LE `02-` NE DÉCLARE PAS PASSE QUAND MÊME, ET ELLE ALERTE', () => {
  // ⛔ L'autre branche de l'asymétrie, et elle ne se symétrise pas : « c'est un
  //    vrai défaut, et il doit se voir ».
  const bancale = {
    phrases: [{ n: 1, fonctions: ['defend_these', 'chante'], statuts: ['affirme'] }],
    moments: [], armature: {},
  }
  assert.equal((FONCTIONS_PHRASE as readonly string[]).includes('chante'), false)
  const t = trancheDeReference(bancale, 'synthese', INSTRUMENT('synthese'))
  assert.equal(t.alertes.length, 1)
  assert.match(t.alertes[0], /chante/)
  assert.match(t.alertes[0], /ne déclare pas/)
  const ph = (t.reference as { phrases: Array<{ fonctions: string[] }> }).phrases
  assert.deepEqual(ph[0].fonctions, ['defend_these', 'chante'], 'elle ATTEINT le consommateur')
})

test('LA TRANCHE NE REFUSE JAMAIS — retrancher n’est pas refuser', () => {
  // ⚠️ Le refus d'une référence non validée est ailleurs, et il est en base :
  //    `contexte.ts` ne descend `reference` que sur `validee_at` non nul, et
  //    `garde_reference_validee` lève. La tranche, elle, ne rend jamais `null`.
  for (const brut of [REFERENCE, {}, { phrases: [] }, { phrases: 'pas une liste' }]) {
    const t = trancheDeReference(brut, 'synthese', INSTRUMENT('synthese'))
    assert.notEqual(t.reference, null)
    assert.notEqual(t.reference, undefined)
  }
  // Une référence qui n'est pas un objet repart telle quelle.
  assert.equal(trancheDeReference(null, 'synthese', INSTRUMENT('synthese')).reference, null)
  assert.equal(trancheDeReference('brut', 'synthese', INSTRUMENT('synthese')).reference, 'brut')
})

test('LES QUATRE LISTES FERMÉES NE SONT PAS RECOPIÉES — elles s’IMPORTENT', () => {
  // ⛔ Le contrôle qui fait foi est `controleReference` ; ce module ne réécrit
  //    aucune de ses listes. Ce test lit les vraies, pour que la référence de
  //    test ci-dessus ne dérive pas d'elles en silence.
  for (const p of REFERENCE.phrases) {
    for (const f of p.fonctions) {
      assert.ok((FONCTIONS_PHRASE as readonly string[]).includes(f), f)
    }
    for (const s of p.statuts) assert.ok((STATUTS as readonly string[]).includes(s), s)
  }
  for (const m of REFERENCE.moments) {
    assert.ok((FONCTIONS_MOMENT as readonly string[]).includes(m.fonction), m.fonction)
  }
})
