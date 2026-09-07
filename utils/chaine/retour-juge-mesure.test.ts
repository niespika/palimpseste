// ============================================================================
// C7 · L9 — Calame SANS SQUELETTE (`07-` § 4 bis) : porte FERMÉE (`jugeEstLaMesure`
// absent ou faux), le message et le contrôle sont ceux d'hier À L'OCTET ; OUVERTE,
// la section « SQUELETTE ET VERDICTS » disparaît, les cinq lignes du § 4 bis
// entrent en clair, et le contrôle admet un retour sans réussite sur un verdict raté.
// ============================================================================
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assemblerRetour, controlerRetour, type EntreeRetour } from './retour'
import type { VerdictCran } from './juge-cran'

const GABARIT = 'SYSTÈME — CALAME ({{COMPETENCE}}, {{MOMENT : v1 | vf}}) — REGISTRE : {{REGISTRE}}.'
const DEVOIR = "L'ennui pousse l'enfant à inventer tout seul ses règles et ses histoires. "
  + "Un carton devient une cabane, un balai devient un cheval. Donc l'ennui est utile."
const COPIE = "Un carton devient une cabane, un balai devient un cheval. Donc l'ennui est utile : il apprend à se passer des autres."
const VERDICT: VerdictCran = {
  reussi: false, probleme_present: true, probleme_vu: 'le garant manque encore',
  passage: "Donc l'ennui est utile", motif: 'le lien entre la preuve et la conclusion n\'est pas dit',
  version: 'v1', cran: 5, at: '2026-09-07T10:00:00Z', modele: 'x',
}
const BASE: EntreeRetour = {
  moment: 'v1', registre: 'descriptif', palierAttribue: false,
  personnalite: { identite: 'Tu es Calame.', ton: 'Phrases courtes.' },
  competencePrimaire: 'argumentation',
  couchesCompetence: [{ competence: 'argumentation', vocabulaire: [], correspondance: [] }],
  coucheType: {
    consigne: 'Réécris ce passage sans le défaut.', grain: 'micro', servable: [],
    casServis: [{ ordre: 1, materiau: DEVOIR, reponseAttendue: 'le lien entre la preuve et la conclusion',
      defaut: 'le garant manque', passageFautif: "Donc l'ennui est utile.", versionCorrigee: "Donc l'ennui est utile : il apprend à inventer." }],
  },
  squelettes: [{ competence: 'argumentation', extraction: {}, jugement: {} }],
  etatAnterieur: null,
  documentsAuJuge: true, verdictCran: VERDICT,
}
const ISOLE = { code: 'lien_explicite', nom: 'Le lien', dimension: 'le lien entre la preuve et la conclusion',
  competence: 'argumentation' as const, cle: 'argument.garant.absent' }

test('⛔ porte FERMÉE : `jugeEstLaMesure` absent ou faux, le message est celui d\'hier à l\'octet — squelette compris', () => {
  const hier = assemblerRetour(GABARIT, BASE)
  assert.equal(assemblerRetour(GABARIT, { ...BASE, jugeEstLaMesure: false }).message, hier.message)
  assert.equal(assemblerRetour(GABARIT, { ...BASE, jugeEstLaMesure: false }).systeme, hier.systeme)
  assert.match(hier.message, /SQUELETTE ET VERDICTS — la v1\./)
  assert.equal(hier.message.includes('LE JUGE EST LA MESURE'), false)
  // en vf aussi
  const vf = { ...BASE, moment: 'vf' as const, squelettesVf: BASE.squelettes, retourV1: null }
  assert.equal(assemblerRetour(GABARIT, { ...vf, jugeEstLaMesure: false }).message, assemblerRetour(GABARIT, vf).message)
})

test('porte OUVERTE : aucun squelette servi, le § 4 bis en clair, le verdict et la dimension — le préfixe reste cachable', () => {
  const r = assemblerRetour(GABARIT, { ...BASE, squelettes: [], observableIsole: ISOLE, jugeEstLaMesure: true })
  assert.equal(r.systeme, assemblerRetour(GABARIT, BASE).systeme)
  assert.equal(r.message.includes('SQUELETTE ET VERDICTS'), false)
  assert.equal(r.message.includes('[]'), false)
  assert.match(r.message, /LE JUGE EST LA MESURE : TU NE REÇOIS AUCUN SQUELETTE/)
  assert.match(r.message, /LE VERDICT DU JUGE DU CRAN/)
  assert.match(r.message, /RATÉ — le lien entre la preuve et la conclusion n'est pas dit/)
  assert.match(r.message, /règle 1 — la citation ancrée « copie » de ton point principal EST le passage cité par le juge/)
  assert.match(r.message, /règle 2 — UNE RÉUSSITE SEULEMENT SI LE VERDICT EST RÉUSSI/)
  assert.match(r.message, /règle 3 — la tentative se lit DANS LA COPIE/)
  assert.match(r.message, /règle 4 — le « voilà comment faire mieux » s'écrit depuis le problème vu et la version corrigée/)
  assert.match(r.message, /le plafond — deux choses, UNE SEULE dimension nommée/)
  assert.match(r.message, /la dimension en jeu — « le lien entre la preuve et la conclusion »/)
  // la borne de C7-L8 est là aussi : une seule dimension, par son nom
  assert.match(r.message, /ISOLE UN SEUL OBSERVABLE — « Le lien »/)
})

test('porte OUVERTE sans verdict : Calame le sait, et juge sur la copie et les documents — jamais un écran muet', () => {
  const r = assemblerRetour(GABARIT, { ...BASE, squelettes: [], verdictCran: null, observableIsole: ISOLE, jugeEstLaMesure: true })
  assert.match(r.message, /AUCUN VERDICT DU JUGE N'EST DISPONIBLE/)
  assert.equal(r.message.includes('LE VERDICT DU JUGE DU CRAN'), false)
})

test('porte OUVERTE en vf : le juge a rejugé à l\'aveugle ; pas de squelette de vf, RR2 tient, le retour de v1 est servi', () => {
  const r = assemblerRetour(GABARIT, { ...BASE, moment: 'vf', squelettes: [], squelettesVf: [], jugeEstLaMesure: true,
    observableIsole: ISOLE, retourV1: { points: [{ id: 'p1', competence: 'argumentation', nature: 'point_de_travail', ancrage: { source: 'copie', citation: 'x' }, texte: 'Le point de v1.' }] as never, action_revision: null, feed_forward: null } })
  assert.match(r.message, /LA VERSION FINALE — le juge l'a rejugée à l'aveugle/)
  assert.match(r.message, /RR2 : en version finale/)
  assert.equal(r.message.includes('SQUELETTE DE LA VERSION FINALE'), false)
  assert.match(r.message, /LE RETOUR QUI LUI AVAIT ÉTÉ DONNÉ SUR SA v1/)
  assert.match(r.message, /Le point de v1\./)
})

test('l\'état antérieur, sous le régime, est une SUITE DE VERDICTS — servie telle que l\'appelant la donne', () => {
  const r = assemblerRetour(GABARIT, { ...BASE, squelettes: [], jugeEstLaMesure: true, observableIsole: ISOLE,
    etatAnterieur: [{ observable_nom: 'le lien entre la preuve et la conclusion', tendance: 'raté, réussi, réussi' }] })
  assert.match(r.message, /ÉTAT ANTÉRIEUR/)
  assert.match(r.message, /le lien entre la preuve et la conclusion : raté, réussi, réussi/)
})

// ── Le contrôle — la règle 2 apprend le verdict raté ──────────────────────────
const RETOUR_SANS_REUSSITE = {
  points: [{ competence: 'argumentation', nature: 'point_de_travail',
    ancrage: { source: 'copie', citation: "Donc l'ennui est utile" }, texte: 'Le lien entre la preuve et la conclusion manque.' }],
  action_revision: 'Ajoute le « car » qui dit pourquoi.', feed_forward: null,
}
const ATTENDU = { moment: 'v1' as const, grain: 'micro' as const, codesObservables: ['lien_explicite'],
  competencesAdmises: ['argumentation'], production: COPIE, texteSupport: null }

test('⛔ contrôle, porte FERMÉE : un retour sans réussite est REFUSÉ comme hier (règle 2)', () => {
  const c = controlerRetour(RETOUR_SANS_REUSSITE, ATTENDU)
  assert.ok(c.verdict.ok)
  assert.ok(c.controle.refus.some((r) => /règle 2 : le retour commence par une réussite/.test(r)))
  // `sansReussiteAdmise: false` : à l'octet le même contrôle
  assert.deepEqual(controlerRetour(RETOUR_SANS_REUSSITE, { ...ATTENDU, sansReussiteAdmise: false }).controle, c.controle)
})

test('contrôle, verdict RATÉ sous le régime : aucune réussite est ADMIS — le contrôle apprend le cas, pas le gabarit (piège 18)', () => {
  const c = controlerRetour(RETOUR_SANS_REUSSITE, { ...ATTENDU, sansReussiteAdmise: true })
  assert.ok(c.verdict.ok)
  assert.equal(c.controle.refus.some((r) => /règle 2/.test(r)), false, c.controle.refus.join(' | '))
  assert.ok(c.controle.alertes.some((a) => /aucune réussite — admis/.test(a)))
  // mais un retour qui PORTE une réussite et ne commence pas par elle reste refusé
  const inverse = { ...RETOUR_SANS_REUSSITE, points: [RETOUR_SANS_REUSSITE.points[0]!,
    { competence: 'argumentation', nature: 'reussite', ancrage: { source: 'copie', citation: 'un balai devient un cheval' }, texte: 'Tu donnes deux preuves.' }] }
  assert.ok(controlerRetour(inverse, { ...ATTENDU, sansReussiteAdmise: true }).controle.refus.some((r) => /règle 2 : le retour commence/.test(r)))
  // RR4 ne se relâche pas : le code d'un observable dans la prose reste une fuite
  const fuite = { ...RETOUR_SANS_REUSSITE, points: [{ ...RETOUR_SANS_REUSSITE.points[0]!, texte: 'Ton lien_explicite manque.' }] }
  assert.ok(controlerRetour(fuite, { ...ATTENDU, sansReussiteAdmise: true }).controle.refus.some((r) => /RR4/.test(r)))
})
