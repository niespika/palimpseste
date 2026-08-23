// Le retour : trois couches, TROIS VARIABLES ET PAS D'AUTRES, un texte segmenté
// à identifiants stables, et deux règles verrouillées que le code doit tenir
// même si le modèle les oublie — le plafond de la règle 2, et RR4.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assemblerGabarit, assemblerRetour, controlerRetour, coucheContrat, identifiantStable,
  plafondApplicable, segmenter, SECTION_LONGUEUR,
  type EntreeRetour, type SectionCalame,
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

/** Le fichier de personnalité partagé, tel que la couche contrat le REÇOIT. */
const PERSONNALITE = { identite: '## Qui tu es\nTu es Calame.', ton: '## Registre\nPhrases courtes.' }

const ENTREE: EntreeRetour = {
  moment: 'v1', registre: 'descriptif', palierAttribue: false,
  personnalite: PERSONNALITE,
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


// ── `07-` §4 — la collision de nom, le découpage, le paramètre `longueur` ────

test('⚠️ `{{REGISTRE}}` REFUSE le registre de LANGUE — la collision du §4', () => {
  // « Substituer l'un dans l'autre remplirait la règle 8 avec le bloc de
  //   langue » : c'est « un mode de panne, pas une hypothèse » (`07-` §4).
  assert.throws(
    () => coucheContrat(GABARIT, {
      COMPETENCE: 'argumentation', MOMENT: 'v1',
      REGISTRE: '## Registre (RÈGLE TRANSVERSALE)\nPhrases COURTES…' as never,
    }),
    /registre de RETOUR/,
  )
})

const SECTIONS: SectionCalame[] = [
  { cle: 'entete', numero: null, titre: 'En-tête', verrouillee: true, corps: 'SYSTÈME — CALAME' },
  { cle: 'regle_6', numero: 6, titre: 'JAMAIS DE NOTE', verrouillee: true, corps: 'JAMAIS DE NOTE.' },
  { cle: 'regle_7', numero: 7, titre: 'LONGUEUR', verrouillee: false, corps: 'LONGUEUR : 80 à 200 mots.' },
  { cle: 'regle_8', numero: 8, titre: 'REGISTRE', verrouillee: true, corps: 'REGISTRE : {{REGISTRE}}.' },
]

test('le gabarit se recolle DEPUIS SES SECTIONS, numéros compris', () => {
  assert.equal(
    assemblerGabarit(SECTIONS),
    'SYSTÈME — CALAME\n\n6. JAMAIS DE NOTE.\n\n7. LONGUEUR : 80 à 200 mots.\n\n8. REGISTRE : {{REGISTRE}}.',
  )
})

test('la `longueur` remplace la SECTION 7 — et NULL vaut la règle 7', () => {
  // « Son domicile est un paramètre de plateforme […] NULL VALANT LA RÈGLE 7. »
  assert.equal(assemblerGabarit(SECTIONS, { longueur: null }), assemblerGabarit(SECTIONS))
  assert.equal(assemblerGabarit(SECTIONS, { longueur: '   ' }), assemblerGabarit(SECTIONS))
  const court = assemblerGabarit(SECTIONS, { longueur: 'LONGUEUR : 40 mots au plus.' })
  assert.match(court, /7\. LONGUEUR : 40 mots au plus\./)
  assert.equal(/80 à 200 mots/.test(court), false)
  // Ce n'est PAS une variable : rien n'a été substitué dans le texte.
  assert.match(court, /8\. REGISTRE : \{\{REGISTRE\}\}\./)
  assert.equal(SECTION_LONGUEUR, 'regle_7')
})

test('une section VERROUILLÉE ne se remplace jamais', () => {
  const verrouille: SectionCalame[] = SECTIONS.map(
    (s) => (s.cle === 'regle_7' ? { ...s, verrouillee: true } : s))
  assert.equal(
    assemblerGabarit(verrouille, { longueur: 'LONGUEUR : 40 mots au plus.' }),
    assemblerGabarit(verrouille),
  )
})

test('la couche contrat REÇOIT le `ton` partagé, elle n\'en porte pas de copie', () => {
  const { systeme } = assemblerRetour(GABARIT, ENTREE)
  assert.ok(systeme.startsWith(PERSONNALITE.identite), "l'identité partagée n'est pas reçue")
  assert.ok(systeme.includes(PERSONNALITE.ton), 'le `ton` partagé n\'est pas reçu')
  // Et le registre de RETOUR reste celui du `01-` §8.7, intact.
  assert.match(systeme, /REGISTRE : descriptif\./)
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
