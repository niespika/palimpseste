// Le retour : trois couches, TROIS VARIABLES ET PAS D'AUTRES, un texte segmenté
// à identifiants stables, et deux règles verrouillées que le code doit tenir
// même si le modèle les oublie — le plafond de la règle 2, et RR4.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assemblerRetour, controlerRetour, coucheContrat, identifiantStable,
  plafondApplicable, segmenter, type EntreeRetour,
} from './retour'

const GABARIT = [
  'SYSTÈME — CALAME · RETOUR FORMATIF',
  '({{COMPETENCE}}, {{MOMENT : v1 | vf}})',
  '8. REGISTRE : {{REGISTRE}}. Il t\'est donné, tu ne le choisis pas.',
].join('\n')

test('les trois variables sont substituées — y compris `{{MOMENT : v1 | vf}}`', () => {
  const t = coucheContrat(GABARIT, { COMPETENCE: 'argumentation', MOMENT: 'v1', REGISTRE: 'descriptif' })
  assert.match(t, /\(argumentation, v1\)/)
  assert.match(t, /REGISTRE : descriptif\./)
  assert.equal(/\{\{/.test(t), false)
})

test('le plafond de la règle 2 suit le grain, et en vf il ne borne QUE les réussites', () => {
  assert.deepEqual(plafondApplicable('micro', 'v1'), { plafond: 2, porte: 'tout' })
  assert.deepEqual(plafondApplicable('meso', 'v1'), { plafond: 3, porte: 'tout' })
  assert.deepEqual(plafondApplicable('macro', 'v1'), { plafond: 5, porte: 'tout' })
  assert.deepEqual(plafondApplicable('macro', 'vf'), { plafond: 5, porte: 'reussites' })
})

const ENTREE: EntreeRetour = {
  moment: 'v1', registre: 'descriptif', palierAttribue: false,
  competencePrimaire: 'argumentation',
  couchesCompetence: [{ competence: 'argumentation', vocabulaire: ['garant'], correspondance: [] }],
  coucheType: { consigne: 'Écris un argument.', grain: 'micro', servable: [] },
  squelettes: [{ competence: 'argumentation', extraction: {}, jugement: {} }],
  etatAnterieur: null,
}

test('sans état antérieur, le retour S\'EN PASSE — sans le signaler à l\'élève', () => {
  const { message } = assemblerRetour(GABARIT, ENTREE)
  assert.equal(/ÉTAT ANTÉRIEUR/.test(message), false)
  assert.equal(/semaine 1|pas d'historique|aucun historique/i.test(message), false)
})

test('hors `evaluee`, le message dit qu\'AUCUN PALIER n\'est attribué', () => {
  const { message } = assemblerRetour(GABARIT, ENTREE)
  assert.match(message, /N'ATTRIBUE AUCUN PALIER/)
})

const OK = {
  points: [
    { competence: 'argumentation', nature: 'reussite',
      ancrage: { source: 'copie', citation: 'parce que la loi le dit' }, texte: 'tu appuies ton lien' },
    { competence: 'argumentation', nature: 'point_de_travail',
      ancrage: { source: 'copie', citation: 'donc il faut' }, texte: 'ce lien reste à justifier' },
  ],
  action_revision: 'reprends la deuxième phrase et dis pourquoi elle tient',
  feed_forward: null,
}

const ATTENDU = {
  moment: 'v1' as const, grain: 'micro' as const,
  codesObservables: ['garant_cite', 'circularite'],
  competencesAdmises: ['argumentation'],
}

test('un retour conforme passe les deux contrôles', () => {
  const r = controlerRetour(OK, ATTENDU)
  assert.equal(r.verdict.ok, true)
  assert.deepEqual(r.controle.refus, [])
})

test('le plafond du grain est tenu PAR LE CODE, pas seulement demandé au modèle', () => {
  const trop = { ...OK, points: [...OK.points, { ...OK.points[1], texte: 'un troisième point' }] }
  const r = controlerRetour(trop, ATTENDU)
  assert.match(r.controle.refus.join(' '), /au grain micro, le retour nomme au plus 2/)
})

test('RR4 : un observable nommé dans le texte fait REJETER le retour', () => {
  const fuite = { ...OK, points: [{ ...OK.points[0], texte: 'ton garant_cite est absent' }, OK.points[1]] }
  const r = controlerRetour(fuite, ATTENDU)
  assert.match(r.controle.refus.join(' '), /RR4 .*garant_cite/)
})

test('règle 6 : ni note, ni lettre, ni moyenne', () => {
  const note = { ...OK, action_revision: 'tu es à 12/20, reprends la phrase' }
  assert.match(controlerRetour(note, ATTENDU).controle.refus.join(' '), /règle 6/)
  const lettre = { ...OK, action_revision: 'ton palier : C — reprends la phrase' }
  assert.match(controlerRetour(lettre, ATTENDU).controle.refus.join(' '), /règle 6/)
})

test('le détecteur de la règle 6 ne crie pas faux sur une phrase ordinaire', () => {
  const ordinaire = { ...OK, action_revision: 'note bien ce que dit ta phrase B, puis relie-la' }
  assert.deepEqual(controlerRetour(ordinaire, ATTENDU).controle.refus, [])
})

test('règle 2 : le retour COMMENCE par une réussite', () => {
  const inverse = { ...OK, points: [OK.points[1], OK.points[0]] }
  assert.match(controlerRetour(inverse, ATTENDU).controle.refus.join(' '), /commence par une réussite/)
})

test('règle 5 : la v1 exige l\'action de révision, la vf exige le pont', () => {
  assert.match(controlerRetour({ ...OK, action_revision: null }, ATTENDU).controle.refus.join(' '), /règle 5/)
  const vf = { ...OK, action_revision: null, feed_forward: null }
  assert.match(controlerRetour(vf, { ...ATTENDU, moment: 'vf' }).controle.refus.join(' '), /règle 5/)
})

test('un point sur une compétence que l\'exercice ne mesure pas est refusé', () => {
  const hors = { ...OK, points: [{ ...OK.points[0], competence: 'synthese' }, OK.points[1]] }
  assert.match(controlerRetour(hors, ATTENDU).controle.refus.join(' '), /hors de celles que l'exercice mesure/)
})

test('les identifiants sont posés PAR LE CODE, stables et uniques', () => {
  assert.equal(identifiantStable('dep', 'v1', 0), 'dep:v1:01')
  const s = segmenter(OK as never, 'dep', 'v1')
  assert.deepEqual(s.points.map((p) => p.id), ['dep:v1:01', 'dep:v1:02'])
  assert.equal(s.action_revision, OK.action_revision)
  assert.equal(s.feed_forward, null)
})
