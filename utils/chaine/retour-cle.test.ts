// ============================================================================
// C7 · L8 — la porte « la chaîne à l'heure de la clé » : FERMÉE, le message de
// Calame et l'élagage sont ceux d'hier À L'OCTET ; OUVERTE, le message porte la
// borne en clair (une seule, au cran 2 comme ailleurs), et une citation recopiée
// du devoir s'écarte — sauf sur le passage à corriger.
// ============================================================================
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assemblerRetour, controlerRetour, elaguerLesAncrages, type EntreeRetour } from './retour'
import { jugerLAncrage } from './citation-verifiee'

const GABARIT = 'SYSTÈME — CALAME ({{COMPETENCE}}, {{MOMENT : v1 | vf}}) — REGISTRE : {{REGISTRE}}.'
const DEVOIR = "L'ennui pousse l'enfant à inventer tout seul ses règles et ses histoires. "
  + "Un carton devient une cabane, un balai devient un cheval. Donc l'ennui est utile."
const PASSAGE = "Donc l'ennui est utile."
const COPIE = "Un carton devient une cabane, un balai devient un cheval. Donc l'ennui est utile : il apprend à se passer des autres."

const BASE: EntreeRetour = {
  moment: 'v1', registre: 'descriptif', palierAttribue: false,
  personnalite: { identite: 'Tu es Calame.', ton: 'Phrases courtes.' },
  competencePrimaire: 'argumentation',
  couchesCompetence: [{ competence: 'argumentation', vocabulaire: [], correspondance: [] }],
  coucheType: {
    consigne: 'Réécris ce passage sans le défaut.', grain: 'micro', servable: [],
    casServis: [{ ordre: 1, materiau: DEVOIR, reponseAttendue: 'le lien entre la preuve et la conclusion',
      defaut: 'le garant manque', passageFautif: PASSAGE, versionCorrigee: "Donc l'ennui est utile : il apprend à inventer." }],
  },
  squelettes: [{ competence: 'argumentation', extraction: {}, jugement: {} }],
  etatAnterieur: null,
}
const ISOLE = { code: 'lien_explicite', nom: 'Le lien', dimension: 'le lien entre la preuve et la conclusion',
  competence: 'argumentation', cle: 'argument.garant.absent' }

test('⛔ porte FERMÉE : `observableIsole` absent ou null, le message est celui d\'hier à l\'octet', () => {
  const hier = assemblerRetour(GABARIT, BASE)
  assert.equal(assemblerRetour(GABARIT, { ...BASE, observableIsole: null }).message, hier.message)
  assert.equal(hier.message.includes('ISOLE UN SEUL OBSERVABLE'), false)
})

test('porte OUVERTE : la borne en clair nomme l\'observable par son NOM et sa dimension, jamais seulement le code', () => {
  const m = assemblerRetour(GABARIT, { ...BASE, observableIsole: ISOLE }).message
  assert.match(m, /CET EXERCICE ISOLE UN SEUL OBSERVABLE — « Le lien » \(argumentation\)/)
  assert.match(m, /le lien entre la preuve et la conclusion/)
  assert.match(m, /Ton retour ne parle QUE de lui/)
  // le préfixe (système) ne bouge pas : il reste cachable
  assert.equal(assemblerRetour(GABARIT, { ...BASE, observableIsole: ISOLE }).systeme, assemblerRetour(GABARIT, BASE).systeme)
})

test('⭐ au cran 2 : UNE borne, pas deux — celle du lot remplace celle de la séance des écrans', () => {
  const PIECE = { ...BASE, documentsAuJuge: true,
    coucheType: { ...BASE.coucheType, casServis: [{ ...BASE.coucheType.casServis![0]!,
      piece: { constituant: 'le garant', pieces: [{ nom: 'la thèse', texte: 'T.' }, { nom: 'la preuve', texte: 'P.' }], place: 2,
        geste: 'écris', test: null, constituantGrille: null, observables: [{ code: 'lien_explicite', competence: 'argumentation' }], forme: 'trou' as const } }] } }
  const hier = assemblerRetour(GABARIT, PIECE).message
  assert.match(hier, /⛔ CE CRAN ISOLE\. Ton retour ne parle QUE de ce que sa pièce engage/)
  assert.equal(hier.includes('ISOLE UN SEUL OBSERVABLE'), false)
  const lot = assemblerRetour(GABARIT, { ...PIECE, observableIsole: ISOLE }).message
  assert.equal(lot.includes('⛔ CE CRAN ISOLE.'), false)
  assert.match(lot, /CE CRAN EST UN CRAN 2/)                 // les pièces restent servies
  assert.match(lot, /ISOLE UN SEUL OBSERVABLE — « Le lien »/)
})

// ── L'élagage ───────────────────────────────────────────────────────────────

const RECOPIEE = { source: 'copie' as const, citation: 'Un carton devient une cabane, un balai devient un cheval' }
const DU_PASSAGE = { source: 'copie' as const, citation: "Donc l'ennui est utile" }
const DE_LELEVE = { source: 'copie' as const, citation: 'il apprend à se passer des autres' }

test('⛔ porte FERMÉE (sans matériau) : une citation recopiée du devoir TIENT, comme hier', () => {
  assert.deepEqual(jugerLAncrage(RECOPIEE, { production: COPIE, texteSupport: null }), { ancrage: RECOPIEE, motif: null })
  const r = elaguerLesAncrages([{ ancrage: RECOPIEE }, { ancrage: DU_PASSAGE }], { production: COPIE, texteSupport: null })
  assert.deepEqual(r.motifs, [])
  assert.deepEqual(r.points.map((p) => p.ancrage), [RECOPIEE, DU_PASSAGE])
})

test('⭐⭐ porte OUVERTE : dans la copie ET dans le matériau, hors du passage ⇒ ÉCARTÉE, le point garde son texte', () => {
  const r = elaguerLesAncrages([{ texte: 'Tu écris bien.', ancrage: RECOPIEE }],
    { production: COPIE, texteSupport: null, materiaux: [DEVOIR], passagesACorriger: [PASSAGE] })
  assert.equal(r.points[0].ancrage, undefined)
  assert.equal(r.points[0].texte, 'Tu écris bien.')
  assert.match(r.motifs[0], /recopiée du devoir : dans la copie ET dans le matériau, hors du passage à corriger/)
})

test('⭐ « sauf sur le passage à corriger » : les mots du passage que l\'élève a gardés se citent', () => {
  const r = jugerLAncrage(DU_PASSAGE, { production: COPIE, texteSupport: null, materiaux: [DEVOIR], passagesACorriger: [PASSAGE] })
  assert.deepEqual(r, { ancrage: DU_PASSAGE, motif: null })
})

test('ce que l\'élève a écrit lui-même n\'est jamais touché', () => {
  const r = jugerLAncrage(DE_LELEVE, { production: COPIE, texteSupport: null, materiaux: [DEVOIR], passagesACorriger: [PASSAGE] })
  assert.deepEqual(r, { ancrage: DE_LELEVE, motif: null })
})

test('une citation « texte_support » ne se confronte pas au matériau', () => {
  const ts = { source: 'texte_support' as const, citation: 'Un carton devient une cabane' }
  const r = jugerLAncrage(ts, { production: COPIE, texteSupport: DEVOIR, materiaux: [DEVOIR], passagesACorriger: [] })
  assert.deepEqual(r, { ancrage: ts, motif: null })
})

test('⭐ `controlerRetour` : sans `materiaux`, l\'élagage d\'hier ; avec, la citation recopiée tombe et la prose (RR3) ne change pas', () => {
  const brut = {
    points: [
      { competence: 'argumentation', nature: 'reussite', ancrage: RECOPIEE, texte: 'Tu poses bien la scène.' },
      { competence: 'argumentation', nature: 'point_de_travail', ancrage: DU_PASSAGE, texte: 'Le lien reste à dire.' },
    ],
    action_revision: 'Ajoute le garant.', feed_forward: null,
  }
  const attendu = { moment: 'v1' as const, grain: 'micro' as const, codesObservables: ['lien_explicite'],
    competencesAdmises: ['argumentation'], production: COPIE, texteSupport: null }
  const hier = controlerRetour(brut, attendu)
  assert.equal(hier.verdict.ok, true)
  assert.deepEqual(hier.controle.alertes, [])
  assert.deepEqual(hier.verdict.ok && hier.verdict.valeur.points.map((p) => p.ancrage?.citation), [RECOPIEE.citation, DU_PASSAGE.citation])
  const lot = controlerRetour(brut, { ...attendu, materiaux: [DEVOIR], passagesACorriger: [PASSAGE] })
  assert.equal(lot.verdict.ok, true)
  assert.deepEqual(lot.controle.refus, [])
  assert.equal(lot.controle.alertes.length, 1)
  assert.deepEqual(lot.verdict.ok && lot.verdict.valeur.points.map((p) => p.ancrage?.citation), [undefined, DU_PASSAGE.citation])
})
