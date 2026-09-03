import { test } from 'node:test'
import assert from 'node:assert/strict'
import { annoterLaCopie } from './annotations'

// Les formes sont celles lues en production le 03/09 (`exercices_squelettes`).
const copie = 'Les vacances représentent un temps de répit. En effet, un échappatoire est nécessaire.\n\n'
  + 'Pourtant, il faut travailler. En effet, la philosophie nous apprend à réfléchir.'

test('Expression : un fait par citation, la réussite rejetée porte son verdict, tout est placé', () => {
  const c = annoterLaCopie({
    production: copie, lettres: { expression: 'C' }, retour: null,
    squelettes: [{
      competence: 'expression',
      extraction: { p1: {
        faits: [{ type: 'mot_impropre', citations: [{ phrase: 2, citation: 'un échappatoire' }] }],
        reussites: [{ type: 'formule', phrase: 1, citation: 'un temps de répit' }],
        phrases_a_reconstruire: [{ phrase: 3 }],
      } },
      jugement: {
        grades: { fluidite: 2, precision: 1 }, levier: 'Le lexique.', confiance: 'moyenne',
        reussites_rejetees: [{ test: 'procede', type: 'formule', phrase: 1, citation: 'un temps de répit', raison: 'expression courante' }],
      },
    }],
  })
  const e = c.competences[0]!
  assert.equal(e.competence, 'expression')
  assert.equal(e.enTete.lettre, 'C')
  assert.deepEqual(e.enTete.grades, [{ nom: 'fluidite', valeur: '2' }, { nom: 'precision', valeur: '1' }])
  const titres = e.annotations.map((a) => `${a.numero} ${a.titre}`)
  assert.deepEqual(titres, ['E1 réussite · formule', 'E2 mot impropre', 'E3 phrase à reconstruire'])
  // la réussite rejetée porte son verdict, et n'est plus une réussite
  const r = e.annotations[0]!
  assert.equal(r.verdicts[0]!.titre, 'réussite rejetée au test « procede »')
  assert.equal(r.nature, 'observation')
  // la phrase désignée par son numéro est reprise telle quelle et placée
  const ph = e.annotations[2]!
  assert.equal(ph.citation, 'Pourtant, il faut travailler.')
  assert.equal(copie.slice(...ph.intervalles[0]!), 'Pourtant, il faut travailler.')
  assert.equal(e.nonRetrouvees.length, 0)
})

test('Argumentation : la requalification de P2 se rattache à l’unité par son numéro', () => {
  const c = annoterLaCopie({
    production: copie, lettres: {}, retour: null,
    squelettes: [{
      competence: 'argumentation',
      extraction: { p1: { unites: [
        { these: 'T1', garant_cite: '[absent]', liaison_citee: 'En effet', preuve_offerte: 'P1', statut_du_lien: 'implicite', note: 'n1' },
        { these: 'T2', garant_cite: 'la philosophie nous apprend à réfléchir', liaison_citee: 'En effet', preuve_offerte: 'P2', statut_du_lien: 'circulaire', note: '' },
      ] } },
      jugement: { crible: { requalifications: [{ test: 'distinction', vers: 'implicite', unite: 2, raison: 'redite' }] }, levier: 'L' },
    }],
  })
  const a = c.competences[0]!
  assert.equal(a.annotations.length, 2)
  const u2 = a.annotations.find((x) => x.titre.startsWith('unité 2'))!
  assert.equal(u2.verdicts[0]!.titre, 'échoue au test « distinction » → implicite')
  assert.equal(u2.nature, 'defaut')
  // l'unité 1 sans garant se surligne sur sa liaison ; le garant absent n'est pas un champ
  const u1 = a.annotations.find((x) => x.titre.startsWith('unité 1'))!
  assert.equal(u1.citation, 'En effet')
  assert.ok(u1.champs.some((ch) => ch.nom === 'thèse' && ch.valeur === 'T1'))
})

test('une citation répétée se place à son occurrence SUIVANTE, pas deux fois sur la première', () => {
  const c = annoterLaCopie({
    production: copie, lettres: {}, retour: null,
    squelettes: [{
      competence: 'expression',
      extraction: { p1: { faits: [{ type: 'ouverture_monotone', citations: [
        { phrase: 2, citation: 'En effet' }, { phrase: 4, citation: 'En effet' },
      ] }] } },
      jugement: null,
    }],
  })
  const [x, y] = c.competences[0]!.annotations
  assert.notDeepEqual(x!.intervalles, y!.intervalles)
  assert.equal(copie.slice(...y!.intervalles[0]!), 'En effet')
  assert.equal(c.competences[0]!.enTete.sansJugement, true)
})

test('Structure : la rétrogradation se rattache à la jointure par « entre » ; une idée absente reste un observable sans citation', () => {
  const c = annoterLaCopie({
    production: copie, lettres: {}, retour: null,
    squelettes: [{
      competence: 'structure',
      extraction: { p1: {
        blocs: [{ num: '¶1', role: 'intro', objet: 'o', position_idee: '[absente]', idee_directrice_citee: '[absente]' }],
        jointures: [{ entre: '¶1 → ¶2', texte_cite: 'Pourtant', debut_bloc_suivant: 'Pourtant, il faut', fin_bloc_precedent: 'nécessaire.', relation_nommee: 'non' }],
        promesse: { annonce_de_plan: '[absente]', probleme_pose: 'Q ?' },
      } },
      jugement: { crible: { retrogradations: [{ entre: '¶1 → ¶2', raison: 'relance sans acquis' }] } },
    }],
  })
  const s = c.competences[0]!
  const j = s.annotations.find((a) => a.titre === 'jointure ¶1 → ¶2')!
  assert.equal(j.verdicts[0]!.raison, 'relance sans acquis')
  assert.equal(copie.slice(...j.intervalles[0]!), 'Pourtant')
  const b = s.annotations.find((a) => a.titre === '¶1 · intro')!
  assert.equal(b.citation, null)
  assert.ok(b.champs.some((ch) => ch.nom === 'idée directrice' && ch.valeur === 'absente'))
  assert.equal(s.nonRetrouvees.length, 0)
})

test('une citation introuvable va dans « non retrouvées », numérotée, jamais placée à côté', () => {
  const c = annoterLaCopie({
    production: copie, lettres: {}, retour: null,
    squelettes: [{ competence: 'questionnement',
      extraction: { p1: { question_posee: 'Une phrase que personne n’a écrite ici', reponse_concurrente_citee: '[absente]' } },
      jugement: {} }],
  })
  const q = c.competences[0]!
  assert.equal(q.nonRetrouvees.length, 1)
  assert.equal(q.nonRetrouvees[0]!.intervalles.length, 0)
  assert.equal(q.nonRetrouvees[0]!.numero, 'Q2')
})

test('le filet générique reprend une citation verbatim que le lecteur n’a pas vue', () => {
  const c = annoterLaCopie({
    production: copie, lettres: {}, retour: null,
    squelettes: [{ competence: 'connaissance',
      extraction: { p1: { unites_mobilisees: [{ citation: 'un temps de répit', notion: 'repos' }] } },
      jugement: null }],
  })
  const k = c.competences[0]!
  assert.equal(k.annotations.length, 1)
  assert.equal(k.annotations[0]!.titre, 'unité mobilisée 1')
})

test('le retour : chaque point est une annotation R, ancrée ; un ancrage du texte support ne se surligne pas', () => {
  const c = annoterLaCopie({
    production: copie, lettres: {}, squelettes: [],
    retour: { moment: 'chaud', publie: true, edite: false, feedForward: 'Pour la suite.',
      points: [
        { id: 'p1', competence: 'expression', nature: 'point_de_travail', texte: 'Tu écris…', ancrage: { source: 'copie', citation: 'un échappatoire' } },
        { id: 'p2', competence: 'structure', nature: 'reussite', texte: 'Le texte dit…', ancrage: { source: 'texte_support', citation: 'phrase d’auteur' } },
      ] },
  })
  assert.ok(c.retour)
  assert.deepEqual(c.retour.annotations.map((a) => a.numero), ['R1', 'R2'])
  assert.equal(copie.slice(...c.retour.annotations[0]!.intervalles[0]!), 'un échappatoire')
  assert.deepEqual(c.retour.annotations[1]!.intervalles, [])
  assert.equal(c.retour.nonRetrouvees.length, 0)
  assert.equal(c.toutes.length, 2)
})
