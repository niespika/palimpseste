// C7-L1 — la porte « le juge reçoit les documents » : fermée, le message du
// retour est celui d'hier À L'OCTET ; ouverte, il porte ce qu'on tient pour
// vrai et le verdict du juge, et il demande de citer le passage.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assemblerRetour, type EntreeRetour } from './retour'
import type { VerdictCran } from './juge-cran'

const GABARIT = 'SYSTÈME — CALAME ({{COMPETENCE}}, {{MOMENT : v1 | vf}}) — REGISTRE : {{REGISTRE}}.'

const BASE: EntreeRetour = {
  moment: 'v1', registre: 'descriptif', palierAttribue: false,
  personnalite: { identite: 'Tu es Calame.', ton: 'Phrases courtes.' },
  competencePrimaire: 'argumentation',
  couchesCompetence: [{ competence: 'argumentation', vocabulaire: [], correspondance: [] }],
  coucheType: {
    consigne: 'Réécris ce passage sans le défaut.', grain: 'micro', servable: [],
    casServis: [{ ordre: 1, materiau: "L'homme est libre. Donc il est responsable.",
      reponseAttendue: 'le lien entre la preuve et la conclusion' }],
  },
  squelettes: [{ competence: 'argumentation', extraction: {}, jugement: {} }],
  etatAnterieur: null,
}

const DOCS = {
  ...BASE,
  coucheType: { ...BASE.coucheType, casServis: [{ ...BASE.coucheType.casServis![0]!,
    versionCorrigee: "L'homme est libre : ce qu'il fait vient de lui. Donc il est responsable.",
    defaut: 'le garant manque', passageFautif: 'Donc il est responsable',
    zone: { texte: 'Donc il est responsable', rienASignaler: false, verdict: 'juste', cas: '3' },
    choix: { candidat: 'le garant manque', bonCandidat: 'le garant manque' } }] },
}

const VERDICT: VerdictCran = {
  reussi: false, probleme_present: true, probleme_vu: 'le lien entre la preuve et la conclusion manque encore',
  passage: 'Donc il répond de ses actes', motif: 'La phrase ajoutée redit la conclusion.',
  version: 'v1', cran: 5, at: '2026-09-03T10:00:00Z', modele: 'm',
}

test('porte FERMÉE : les champs neufs et le verdict ne changent pas un octet du message', () => {
  const hier = assemblerRetour(GABARIT, BASE)
  const ferme = assemblerRetour(GABARIT, { ...DOCS, documentsAuJuge: false, verdictCran: VERDICT })
  const sansPorte = assemblerRetour(GABARIT, { ...DOCS, verdictCran: VERDICT })
  assert.equal(ferme.message, hier.message)
  assert.equal(sansPorte.message, hier.message)
  assert.equal(ferme.systeme, hier.systeme)
  assert.equal(hier.message.includes('ce qu\'il fait vient de lui'), false)
  assert.equal(hier.message.includes('VERDICT DU JUGE'), false)
})

test('porte OUVERTE : ce qu’on tient pour vrai, la zone, le candidat, et le verdict avec sa demande de citer', () => {
  const ouvert = assemblerRetour(GABARIT, { ...DOCS, documentsAuJuge: true, verdictCran: VERDICT })
  const m = ouvert.message
  assert.match(m, /le garant manque/)                               // l'énoncé
  assert.match(m, /ce qu'il fait vient de lui/)                     // la version corrigée
  assert.match(m, /NE RECOPIE NI NE PARAPHRASE LA VERSION CORRIGÉE/)
  assert.match(m, /la porte de zone dit : juste/)
  assert.match(m, /le candidat que l'élève a choisi/)
  assert.match(m, /LE VERDICT DU JUGE DU CRAN/)
  assert.match(m, /RATÉ — La phrase ajoutée redit la conclusion\./)
  assert.match(m, /« Donc il répond de ses actes »/)
  assert.match(m, /CITE ce passage/)
  // Le préfixe (système) ne bouge pas : il reste cachable.
  assert.equal(ouvert.systeme, assemblerRetour(GABARIT, BASE).systeme)
})

test('porte ouverte SANS verdict (le juge a manqué) : les documents partent, le bloc du verdict non', () => {
  const m = assemblerRetour(GABARIT, { ...DOCS, documentsAuJuge: true, verdictCran: null }).message
  assert.match(m, /le garant manque/)
  assert.equal(m.includes('LE VERDICT DU JUGE'), false)
})

test('porte ouverte sur un cas sans documents (cran de production) : rien de plus que le verdict', () => {
  const nu = { ...BASE, coucheType: { ...BASE.coucheType, casServis: [] } }
  const sans = assemblerRetour(GABARIT, { ...nu, documentsAuJuge: true, verdictCran: null }).message
  assert.equal(sans, assemblerRetour(GABARIT, nu).message)
})
