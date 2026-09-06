// ⭐ 06/09 — le juge au cran 2 du gabarit : l'objet assemblé, le test, la pièce
// attendue ; la question bornée aux observables du constituant (décision 17) ;
// et le retour qui ne parle que d'eux — porte fermée, pas un octet ne bouge.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assemblerLeJuge, questionDuCran, type EntreeJuge, type PieceServieAuJuge } from './juge-cran'
import { assemblerRetour, type EntreeRetour } from './retour'

// Les pièces RÉELLES de `ex-gab-argument-garant-connecteur-c2` ont 365 caractères
// sur la seconde ; ici une forme courte, même patron.
const PIECE: PieceServieAuJuge = {
  constituant: 'le garant',
  pieces: [
    { nom: "ce que l'argument conclut", texte: "Il faut interdire le téléphone en classe." },
    { nom: "ce sur quoi il s'appuie", texte: "Les élèves qui l'ont sous la main regardent l'écran plus que le tableau." },
  ],
  place: 2,
  geste: "Voici ce que l'argument conclut, et ce sur quoi il s'appuie. Écris ce qui fait que cet appui-là soutient cette conclusion-là.",
  test: "Peut-on retirer le « donc » sans que rien ne manque ? Le garant dit-il autre chose que la conclusion ?",
  constituantGrille: 'garant',
  observables: [
    { code: 'garant_present', competence: 'argumentation' },
    { code: 'garant_circulaire', competence: 'argumentation' },
  ],
}

const ENTREE: EntreeJuge = {
  cran: 2, version: 'v1',
  consigne: 'Lis les documents ci-joints : le sujet, et les pièces, chacune à sa place. ' + PIECE.geste,
  production: "Or ce qui capte le regard capte l'attention, et une classe où l'attention part ailleurs n'apprend plus.",
  cas: [{ ordre: 1, materiau: null, versionCorrigee: null, defaut: null,
    reponseAttendue: "Ce qui prend le regard prend l'attention : un élève qui regarde l'écran n'écoute plus.",
    passageFautif: null, zone: null, choix: null, piece: PIECE }],
}

test('au cran 2, le juge reçoit l’objet ASSEMBLÉ — la pièce de l’élève à sa place —, le test et la pièce attendue', () => {
  const p = assemblerLeJuge(ENTREE)
  const m = p.message
  assert.match(m, /les pièces servies — chacune sous son nom/)
  assert.match(m, /— ce que l'argument conclut :\nIl faut interdire le téléphone en classe\./)
  assert.match(m, /l'objet assemblé/)
  // L'assemblage : conclusion, preuve, puis LA PIÈCE DE L'ÉLÈVE en dernier (le garant), marquée.
  const assemble = /Il faut interdire[^]*?regardent l'écran plus que le tableau\. \[la pièce de l'élève : Or ce qui capte le regard[^]*?\]/
  assert.match(m, assemble)
  assert.match(m, /le test de la fiche/)
  assert.match(m, /Peut-on retirer le « donc »/)
  assert.match(m, /la pièce attendue — ce qu'on tient pour vrai/)
  assert.match(m, /la pièce de l'élève\b/)                 // la copie est nommée pour ce qu'elle est
  assert.equal(m.includes("le devoir d'élève"), false)     // pas de matériau cible au cran 2
  assert.match(m, /cran 2/)
  assert.equal(p.prefixeCacheable.includes('capte le regard'), false)
})

test('la question du cran 2 est bornée au constituant et à ses observables — décision 17', () => {
  const q = questionDuCran(2, PIECE)
  assert.match(q, /UNE SEULE PIÈCE de l'objet — le garant/)
  assert.match(q, /garant_present \(argumentation\), garant_circulaire \(argumentation\)/)
  assert.match(q, /n'ont pas d'objet sur une pièce seule/)
  assert.match(q, /extrait VERBATIM de SA pièce/)
  // Sans pièce connue, la question tient quand même — et ne cite aucun observable.
  assert.match(questionDuCran(2, null), /ceux de la pièce/)
})

// ── Le retour ─────────────────────────────────────────────────────────────

const GABARIT = 'SYSTÈME — CALAME ({{COMPETENCE}}, {{MOMENT : v1 | vf}}) — REGISTRE : {{REGISTRE}}.'
const BASE: EntreeRetour = {
  moment: 'v1', registre: 'descriptif', palierAttribue: false,
  personnalite: { identite: 'Tu es Calame.', ton: 'Phrases courtes.' },
  competencePrimaire: 'argumentation',
  couchesCompetence: [{ competence: 'argumentation', vocabulaire: [], correspondance: [] }],
  coucheType: {
    consigne: ENTREE.consigne, grain: 'meso', servable: [],
    casServis: [{ ordre: 1, materiau: null, reponseAttendue: ENTREE.cas[0]!.reponseAttendue, piece: PIECE }],
  },
  squelettes: [{ competence: 'argumentation', extraction: {}, jugement: {} }],
  etatAnterieur: null,
}

test('porte FERMÉE : les pièces ne changent pas un octet du message du retour', () => {
  const sansPiece = assemblerRetour(GABARIT, { ...BASE,
    coucheType: { ...BASE.coucheType, casServis: [{ ...BASE.coucheType.casServis![0]!, piece: null }] } })
  const avecPiece = assemblerRetour(GABARIT, BASE)
  const ferme = assemblerRetour(GABARIT, { ...BASE, documentsAuJuge: false })
  assert.equal(avecPiece.message, sansPiece.message)
  assert.equal(ferme.message, sansPiece.message)
  assert.equal(sansPiece.message.includes('CE CRAN ISOLE'), false)
})

test('porte OUVERTE : le retour reçoit les pièces et l’objet assemblé, et il est BORNÉ aux observables du constituant', () => {
  const m = assemblerRetour(GABARIT, { ...BASE, documentsAuJuge: true }).message
  assert.match(m, /les pièces servies au cas 1/)
  assert.match(m, /l'objet assemblé au cas 1/)
  assert.match(m, /\[ici, la pièce de l'élève — sa copie, ci-dessous\]/)
  assert.match(m, /le test de la fiche au cas 1/)
  assert.match(m, /CE CRAN EST UN CRAN 2/)
  assert.match(m, /le garant — à sa place entre les pièces servies/)
  assert.match(m, /CE CRAN ISOLE\. Ton retour ne parle QUE de ce que sa pièce engage/)
  assert.match(m, /garant_present, garant_circulaire\./)
  assert.match(m, /n'ont pas d'objet sur une pièce seule/)
  // ⛔ La pièce attendue n'est PAS recopiée à l'élève : la consigne d'hier tient.
  assert.match(m, /NE RECOPIE PAS LA RÉPONSE ATTENDUE/)
})

test('sans observable connu, la borne parle du constituant — jamais d’une liste vide', () => {
  const m = assemblerRetour(GABARIT, { ...BASE, documentsAuJuge: true,
    coucheType: { ...BASE.coucheType,
      casServis: [{ ...BASE.coucheType.casServis![0]!, piece: { ...PIECE, observables: [] } }] } }).message
  assert.match(m, /les observables de ce constituant, et eux seuls\./)
  assert.equal(m.includes('et eux seuls : .'), false)
})
