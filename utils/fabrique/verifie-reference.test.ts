/* eslint-disable @typescript-eslint/no-explicit-any -- Les vecteurs sont du JSON MALFORMÉ À DESSEIN — c'est leur raison d'être. */
// ============================================================================
// C4 · L8 — LA PREUVE DU PORT, et la seule.
// ----------------------------------------------------------------------------
// « Ce que tu construis doit rendre LES MÊMES VERDICTS SUR LES MÊMES VECTEURS —
//   c'est la preuve du port, la seule » (PROMPT_Code_C4_L8.md, piège 22 ;
//   `08-` §7.4 ; `05-` §4.7).
//
// Ces vecteurs sont ceux de l'autotest de
// `copies-tests/_commun/verifie-reference.py` (dépôt palimpseste-conception),
// recopiés SANS ADAPTATION : la référence de référence qui doit passer, les
// treize refus provoqués un par un, les deux blocages « ils bloquent et ne
// refusent pas » — celui de l'armature éprouvé sur `rapporte`, `hypothetique`
// et `concede`, PUIS SUR UN STATUT PORTÉ PAR LE MOMENT ET NON PAR LA PHRASE —,
// les trois marquages doubles qui doivent passer, et les sept signalements.
//
// ⚠️ NE JAMAIS « mettre à jour » un vecteur pour faire passer un test : si l'un
// tombe, ou bien le port a divergé du contrôle qui fait foi, ou bien le `02-`
// §6 A a bougé. Dans les deux cas, c'est le port qu'on recale, jamais le
// vecteur.
//
// Exécution : `npm test`.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { controleReference, phrasesDuTexte } from './verifie-reference'

const TEXTE_T = 'Le doute porte sur tout. Rien ne résiste. Mais qui doute existe. '
  + 'Que suis-je donc ? Une chose qui pense.'

// La référence de référence, telle quelle.
const REF_T = {
  phrases: [
    { n: 1, fonctions: ['explique'], statuts: ['hypothetique'] },
    { n: 2, fonctions: ['defend_these'], statuts: ['hypothetique'] },
    { n: 3, fonctions: ['defend_these'], statuts: ['affirme'] },
    { n: 4, fonctions: ['relance'], statuts: [] },
    { n: 5, fonctions: ['defend_these'], statuts: ['affirme'] },
  ],
  moments: [
    { m: 'M1', de: 1, a: 2, fonction: 'pose', cible: [], statuts: [],
      etiquette: 'le doute porte sur toute chose' },
    { m: 'M2', de: 3, a: 3, fonction: 'refute', cible: ['M1'], statuts: [],
      etiquette: 'celui qui doute ne peut pas ne pas etre' },
    { m: 'M3', de: 4, a: 5, fonction: 'precise', cible: ['M2'], statuts: [],
      etiquette: 'ce que je suis est une chose pensante' },
  ],
  concepts: [
    { concept: 'doute', formes: ['doute'] },
    { concept: 'penser', formes: ['pense'] },
  ],
  lectures: [
    { n: 2, drapeau: 'dominante', lectures: ['Rien ne résiste au doute.'] },
    { n: 3, drapeau: 'equivalentes',
      lectures: ['Douter suppose exister.', 'Penser suppose exister.'] },
    { n: 5, drapeau: 'dominante', lectures: ['Je suis une chose qui pense.'] },
  ],
  armature: {
    question_directrice: 'Que reste-t-il de certain quand le doute a tout emporté ?',
    these: "Le doute lui-même atteste l'existence de celui qui doute.",
    these_phrases: [3, 5],
  },
  hesitation: [],
}

type Ref = Record<string, any>
const copie = (mod?: (r: Ref) => void): Ref => {
  const r = JSON.parse(JSON.stringify(REF_T))
  if (mod) mod(r)
  return r
}
const contient = (xs: string[], motif: string) => xs.some((x) => x.includes(motif))

// ── La segmentation qui fait foi ────────────────────────────────────────────
test('la segmentation rend les cinq phrases du texte de référence', () => {
  assert.equal(phrasesDuTexte(TEXTE_T).length, 5)
})

// ── La référence de référence doit passer ───────────────────────────────────
test('la référence conforme : ni refus, ni blocage, ni signalement', () => {
  const v = controleReference(copie(), TEXTE_T)
  assert.deepEqual(v.refus, [], 'refus inattendus')
  assert.deepEqual(v.blocages, [], 'blocages inattendus')
  assert.deepEqual(v.signalements, [], 'signalements inattendus')
  assert.equal(v.verdict, 'conforme')
})

// ── Les treize refus, chacun provoqué ───────────────────────────────────────
const REFUS: Array<[string, (r: Ref) => void, string]> = [
  ['1. trou dans la couverture', (r) => { r.moments[1].de = 4 }, 'trou'],
  ['1b. chevauchement', (r) => { r.moments[1].de = 2 }, 'chevauchement'],
  ["1c. le dernier moment n'atteint pas la fin", (r) => { r.moments[2].a = 4 }, 'le texte en a'],
  ['2. une phrase sans entrée', (r) => { r.phrases.splice(2, 1) }, 'sans entrée'],
  ['2b. une entrée pour une phrase inexistante',
    (r) => { r.phrases.push({ n: 9, fonctions: ['explique'], statuts: ['affirme'] }) },
    "n'existent pas"],
  ['3. une phrase sans fonction', (r) => { r.phrases[0].fonctions = [] }, 'aucune fonction'],
  ['4. un statut absent, phrase et moment', (r) => { r.phrases[0].statuts = [] }, 'aucun statut'],
  ['5. une valeur de fonction hors liste', (r) => { r.phrases[0].fonctions = ['resume'] }, 'hors liste'],
  ['5b. un statut hors liste', (r) => { r.phrases[0].statuts = ['doute'] }, 'hors liste'],
  ['5c. une fonction de moment hors liste', (r) => { r.moments[1].fonction = 'developpe' }, 'hors liste'],
  ['6. une cible qui vise un moment inexistant', (r) => { r.moments[1].cible = ['M9'] }, "n'existe pas"],
  ['6b. un moment qui se vise lui-même', (r) => { r.moments[1].cible = ['M2'] }, 'se vise lui-même'],
  ['7. `pose` avec une cible', (r) => { r.moments[0].cible = ['M2'] }, "l'interdit"],
  ['8. des lectures sur une phrase non `defend_these`',
    (r) => { r.lectures.push({ n: 4, drapeau: 'dominante', lectures: ['x'] }) },
    "n'est pas `defend_these`"],
  ['9. une phrase `defend_these` sans lecture', (r) => { r.lectures.shift() }, 'sans aucune lecture'],
  ['10. un concept absent du texte',
    (r) => { r.concepts.push({ concept: 'liberté', formes: ['liberté'] }) }, 'ne se retrouve'],
  ['11. un champ que le format ne déclare pas', (r) => { r.lectures[0].credence = 0.7 }, 'non déclarée'],
  ["12. l'armature absente", (r) => { delete r.armature }, 'armature absente'],
  ['12b. la question directrice vide',
    (r) => { r.armature.question_directrice = '  ' }, 'question directrice est vide'],
  ['12c. la thèse vide', (r) => { r.armature.these = '' }, 'thèse est vide'],
  ["12d. une clé inventée dans l'armature", (r) => { r.armature.credence = 0.9 }, 'clé « credence »'],
  ["13. une phrase porteuse qui n'existe pas", (r) => { r.armature.these_phrases = [42] }, "qui n'existe pas"],
  ['11b. une clé inventée à la racine', (r) => { r.version = 2 }, 'ne déclare pas'],
]

for (const [nom, casse, motif] of REFUS) {
  test(`REFUS — ${nom}`, () => {
    // Le vecteur doit ALTÉRER quelque chose : un test dont la casse ne casse
    // rien passerait tout seul (garde reprise du script qui fait foi).
    const avant = JSON.stringify(copie())
    const abime = copie(casse)
    assert.notEqual(JSON.stringify(abime), avant, "l'altération n'a pas eu lieu")
    const v = controleReference(abime, TEXTE_T)
    assert.ok(contient(v.refus, motif), `aucun refus ne dit « ${motif} » — rendus : ${JSON.stringify(v.refus)}`)
  })
}

// ── Les deux blocages, et ils NE REFUSENT PAS ───────────────────────────────
const BLOCAGES: Array<[string, (r: Ref) => void, string]> = [
  ['un moment relationnel sans cible', (r) => { r.moments[1].cible = [] }, 'sans cible'],
  ["une phrase porteuse qui n'est pas `defend_these`",
    (r) => { r.armature.these_phrases = [4] }, "n'est pas `defend_these`"],
  ["une phrase porteuse que l'auteur RAPPORTE sans l'affirmer",
    (r) => { r.phrases[2].statuts = ['rapporte'] }, "ne l'AFFIRME pas"],
  ['une phrase porteuse avancée par HYPOTHÈSE (le cas de Descartes)',
    (r) => { r.phrases[2].statuts = ['hypothetique'] }, "ne l'AFFIRME pas"],
  ['une phrase porteuse seulement CONCÉDÉE',
    (r) => { r.phrases[2].statuts = ['concede'] }, "ne l'AFFIRME pas"],
  ['même quand le statut vient du MOMENT, pas de la phrase',
    (r) => { r.phrases[2].statuts = []; r.moments[1].statuts = ['rapporte'] }, "ne l'AFFIRME pas"],
]

for (const [nom, casse, motif] of BLOCAGES) {
  test(`BLOCAGE — ${nom}`, () => {
    const v = controleReference(copie(casse), TEXTE_T)
    assert.ok(contient(v.blocages, motif),
      `aucun blocage ne dit « ${motif} » — rendus : ${JSON.stringify(v.blocages)}`)
    assert.deepEqual(v.refus, [], 'devait BLOQUER, a REFUSÉ')
    assert.equal(v.verdict, 'blocage')
  })
}

// ── Les marquages LÉGITIMES passent : le second statut sauve ────────────────
// « Qui reprend une citation à son compte l'`affirme` en la `rapporte` ; qui
// accorde pour de bon l'`affirme` en le `concede` » (`02-` §6 A).
for (const [nom, sts] of [
  ["une autorité reprise à son compte", ['rapporte', 'affirme']],
  ['une concession vraiment accordée', ['concede', 'affirme']],
  ['une thèse posée après une hypothèse', ['hypothetique', 'affirme']],
] as Array<[string, string[]]>) {
  test(`MARQUAGE DOUBLE — ${nom} ne bloque pas`, () => {
    const v = controleReference(copie((r) => { r.phrases[2].statuts = sts }), TEXTE_T)
    assert.ok(!contient(v.blocages, 'AFFIRME'),
      `a bloqué : ${JSON.stringify(v.blocages)}`)
  })
}

// ── Les sept signalements, qui n'arrêtent rien ──────────────────────────────
const SIGNALEMENTS: Array<[string, (r: Ref) => void, string]> = [
  ['cible en aval', (r) => { r.moments[0].fonction = 'nuance'; r.moments[0].cible = ['M2'] }, 'vient APRÈS'],
  ['lecture trop longue', (r) => { r.lectures[0].lectures = ['mot '.repeat(40)] }, 'au-delà de'],
  ['étiquette hors bornes', (r) => { r.moments[0].etiquette = 'trop court' }, 'hors 5-10'],
  ['thèse sans phrase porteuse', (r) => { r.armature.these_phrases = [] }, 'portée par aucune phrase'],
  ['phrase porteuse ironique', (r) => { r.phrases[2].statuts = ['affirme', 'ironique'] }, 'son sens, pas sa lettre'],
  ["question directrice sans point d'interrogation",
    (r) => { r.armature.question_directrice = "Le doute et l'existence." }, "point d'interrogation"],
  ['thèse trop longue', (r) => { r.armature.these = 'mot '.repeat(40) }, 'au-delà de'],
]

for (const [nom, casse, motif] of SIGNALEMENTS) {
  test(`SIGNALEMENT — ${nom}`, () => {
    const v = controleReference(copie(casse), TEXTE_T)
    assert.ok(contient(v.signalements, motif),
      `aucun signalement ne dit « ${motif} » — rendus : ${JSON.stringify(v.signalements)}`)
    assert.deepEqual(v.refus, [], "un signalement n'arrête rien")
  })
}
