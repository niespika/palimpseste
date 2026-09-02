// C6 · L4 — les règles pures du branchement de l'essai de Fragments.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LIGNE_ESSAI, MODES_DE_LESSAI, CODE_TYPE_ESSAI, lundiDeLaDate, ligneDePlanDeLEssai,
  consigneDeLEssai, genreDeLEssai, assigneAtDeLEssai, sansControleDeLEleve, pagesDeLEssai,
  motifDeRefusDuRetrait, motifSansPlan, BUCKET_ESSAIS,
} from './regles'
import { estUnQuartDeTour } from '../passation/photos'

test('la ligne de plan est LE couple réservé de la typologie : essai × non diag × evaluatif × classe × fragments', () => {
  assert.deepEqual(
    { t: LIGNE_ESSAI.type_exercice, d: LIGNE_ESSAI.diagnostique, n: LIGNE_ESSAI.nature, l: LIGNE_ESSAI.lieu, m: LIGNE_ESSAI.module },
    { t: 'essai', d: false, n: 'evaluatif', l: 'classe', m: 'fragments' },
  )
  assert.equal(LIGNE_ESSAI.origine, 'manuel')
  assert.equal(LIGNE_ESSAI.ancrage, 'semaine')
})

test('⭐ `evaluatif` par construction : la forme de la mesure sera `sommatif`, donc une ANCRE', () => {
  assert.equal(LIGNE_ESSAI.nature, 'evaluatif')
})

test('l’instance est du type de C4-L9, et mesure les trois compétences de l’essai en `composer`', () => {
  assert.equal(CODE_TYPE_ESSAI, 'examen_diagnostique_essai')
  assert.deepEqual(MODES_DE_LESSAI, { expression: ['composer'], argumentation: ['composer'], structure: ['composer'] })
  assert.ok(!('connaissance' in MODES_DE_LESSAI), 'jamais la Connaissance')
  assert.ok(!('questionnement' in MODES_DE_LESSAI), 'jamais le Questionnement')
})

test('le lundi d’une date pure se dérive en UTC, et c’est un lundi', () => {
  assert.equal(lundiDeLaDate('2026-09-02'), '2026-08-31')   // mercredi → lundi
  assert.equal(lundiDeLaDate('2026-08-31'), '2026-08-31')   // lundi → lui-même
  assert.equal(lundiDeLaDate('2026-09-06'), '2026-08-31')   // dimanche → lundi d’avant
  assert.equal(new Date('2026-08-31T00:00:00Z').getUTCDay(), 1)
})

test('la ligne de plan naît `concu`, ancrée à la semaine de la date, le jour dans la semaine', () => {
  const l = ligneDePlanDeLEssai({ titre: 'Essai 1', dateEssai: '2026-09-04', dureeMinutes: 120 })
  assert.equal(l.statut, 'concu')
  assert.equal(l.semaine_lundi, '2026-08-31')
  assert.equal(l.jour_prevu, '2026-09-04')
  assert.equal(l.titre, 'Essai 1')
  assert.equal(l.duree_estimee_min, 120)
})

test('la durée respecte le CHECK de la colonne (1 à 240), et null reste null', () => {
  assert.equal(ligneDePlanDeLEssai({ titre: 'x', dateEssai: '2026-09-04', dureeMinutes: 500 }).duree_estimee_min, 240)
  assert.equal(ligneDePlanDeLEssai({ titre: 'x', dateEssai: '2026-09-04', dureeMinutes: 0 }).duree_estimee_min, 1)
  assert.equal(ligneDePlanDeLEssai({ titre: 'x', dateEssai: '2026-09-04', dureeMinutes: null }).duree_estimee_min, null)
})

test('⭐⭐ la consigne porte le titre et les consignes communes — jamais le thème de l’élève', () => {
  assert.equal(consigneDeLEssai('Essai final', 'Deux pages, sans notes.'), 'Essai final\n\nDeux pages, sans notes.')
  assert.equal(consigneDeLEssai('Essai final', null), 'Essai final')
  assert.equal(consigneDeLEssai('  Essai final ', '  '), 'Essai final')
})

test('`genre` : `essai_hlp` pour une classe HLP, rien pour les autres — jamais inventé', () => {
  assert.equal(genreDeLEssai('hlp'), 'essai_hlp')
  assert.equal(genreDeLEssai('tc'), null)
  assert.equal(genreDeLEssai(null), null)
  assert.equal(genreDeLEssai(undefined), null)
})

test('⭐ `assigne_at` : midi UTC du lundi de la semaine de la date — l’essai pèse sur SA semaine', () => {
  assert.equal(assigneAtDeLEssai('2026-09-04'), '2026-08-31T12:00:00.000Z')
  // Un essai posé le vendredi pour le lundi suivant tombe dans la semaine du lundi.
  assert.equal(assigneAtDeLEssai('2026-09-07'), '2026-09-07T12:00:00.000Z')
})

test('⭐ « sans contrôle de l’élève » se reconnaît PAR LA LIGNE DE PLAN, jamais par le dépôt', () => {
  assert.equal(sansControleDeLEleve({ type_exercice: 'essai', module: 'fragments' }), true)
  assert.equal(sansControleDeLEleve({ type_exercice: 'ecriture', module: 'codex' }), false)
  assert.equal(sansControleDeLEleve({ type_exercice: 'lecture', module: 'aletheia' }), false)
  assert.equal(sansControleDeLEleve(null), false)
})

test('les pages de l’essai prennent la forme de la garde, renumérotées, dans le bucket de Fragments', () => {
  const pages = pagesDeLEssai([
    { storage_path: 'e/d/3.jpg', ordre: 3, taille: 120, etag: '"abc"' },
    { storage_path: 'e/d/1.jpg', ordre: 1, taille: 100, etag: 'def' },
  ])
  assert.deepEqual(pages.map((p) => p.ordre), [1, 2])
  assert.deepEqual(pages.map((p) => p.chemin), ['e/d/1.jpg', 'e/d/3.jpg'])
  assert.deepEqual(pages.map((p) => p.somme_controle), ['100-def', '120-abc'])
  for (const p of pages) {
    assert.ok(estUnQuartDeTour(p.rotation))
    assert.equal(p.page_manquante, false)
    assert.equal(p.bucket, BUCKET_ESSAIS)
    assert.notEqual(p.somme_controle.trim(), '')
  }
})

test('sans empreinte du stockage, le chemin sert d’empreinte — jamais une chaîne vide', () => {
  const [p] = pagesDeLEssai([{ storage_path: 'e/d/1.jpg', ordre: 1 }])
  assert.equal(p.somme_controle, 'e/d/1.jpg')
})

test('le retrait refuse dès qu’un élève a écrit ; il passe sinon', () => {
  assert.equal(motifDeRefusDuRetrait(0), null)
  assert.match(motifDeRefusDuRetrait(1)!, /1 élève a déjà une copie/)
  assert.match(motifDeRefusDuRetrait(3)!, /3 élèves ont déjà une copie/)
})

test('sans plan d’évaluation validé, le refus nomme la classe et dit quoi faire', () => {
  assert.match(motifSansPlan(['THLP']), /La classe THLP n’a pas de plan d’évaluation validé/)
  assert.match(motifSansPlan(['THLP', '1HLP']), /Les classes THLP, 1HLP n’ont pas/)
})
