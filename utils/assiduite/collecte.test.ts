// ============================================================================
// C4 · L13 — LES ÉPREUVES DE LA COLLECTE D'ASSIDUITÉ.
// ----------------------------------------------------------------------------
// Le glob de `npm test` est `utils/**/*.test.ts` : ce fichier est la raison pour
// laquelle la jonction vit sous `utils/` et pas sous `app/`.
// ============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  CLES_INTERDITES, ChargeUtileInvalide, comptesDeLaSemaine, dedoublonner,
  ligneDAssiduite, lotir, semainesDeTravail, trouverLaSemaine, verifierLaCharge,
  type DepotACompter,
} from './collecte'
import { SEUILS_DE_DEMARRAGE, assiduiteDeLEleve, type SemaineEleve } from '../routeur/assiduite'

const TZ = 'America/Toronto'
const SEUILS = { ...SEUILS_DE_DEMARRAGE }

const d = (eleveId: string, statut: string, assigneAt: string, bonus = false): DepotACompter =>
  ({ eleveId, statut, assigneAt, bonus })

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · la jonction — d’une liste de dépôts à (assignés, terminés)', () => {
  test('les quatre statuts RENDUS comptent au numérateur, les autres non', () => {
    const depots = [
      d('a', 'v1_remis', '2026-09-01T14:00:00Z'),
      d('a', 'retour_publie', '2026-09-01T14:00:00Z'),
      d('a', 'vf_remis', '2026-09-01T14:00:00Z'),
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'assigne', '2026-09-01T14:00:00Z'),
      d('a', 'ouvert', '2026-09-01T14:00:00Z'),
    ]
    const { parEleve } = comptesDeLaSemaine(depots, '2026-08-31', TZ)
    assert.deepEqual(parEleve.get('a'), { assignes: 6, termines: 4 })
  })

  test('⚠️ `abandonne` RESTE au dénominateur — c’est un non-geste de l’ÉLÈVE', () => {
    const { parEleve } = comptesDeLaSemaine(
      [d('a', 'abandonne', '2026-09-01T14:00:00Z'), d('a', 'clos', '2026-09-01T14:00:00Z')],
      '2026-08-31', TZ)
    assert.deepEqual(parEleve.get('a'), { assignes: 2, termines: 1 })
  })

  test('⛔ `retire` SORT du dénominateur — c’est une décision du PROFESSEUR', () => {
    const tri = comptesDeLaSemaine(
      [d('a', 'retire', '2026-09-01T14:00:00Z'), d('a', 'clos', '2026-09-01T14:00:00Z')],
      '2026-08-31', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 1, termines: 1 })
    assert.equal(tri.retires, 1)
    assert.equal(tri.retenus, 1)
  })

  test('un élève dont TOUS les dépôts sont retirés n’apparaît pas — sa ligne sera à zéro', () => {
    const tri = comptesDeLaSemaine([d('a', 'retire', '2026-09-01T14:00:00Z')], '2026-08-31', TZ)
    assert.equal(tri.parEleve.has('a'), false)
    assert.equal(tri.retires, 1)
  })

  test('chaque élève est compté séparément, sur la même semaine', () => {
    const { parEleve } = comptesDeLaSemaine([
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('b', 'assigne', '2026-09-02T14:00:00Z'),
      d('b', 'v1_remis', '2026-09-03T14:00:00Z'),
    ], '2026-08-31', TZ)
    assert.deepEqual(parEleve.get('a'), { assignes: 1, termines: 1 })
    assert.deepEqual(parEleve.get('b'), { assignes: 2, termines: 1 })
  })

  test('les dépôts d’une AUTRE semaine sont écartés, et comptés comme tels', () => {
    const tri = comptesDeLaSemaine([
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'clos', '2026-09-09T14:00:00Z'),
    ], '2026-08-31', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 1, termines: 1 })
    assert.equal(tri.horsSemaine, 1)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · le FUSEAU décide — le dépôt du dimanche soir', () => {
  // « Un dépôt du dimanche 20 h 30 à Toronto est le lundi 00 h 30 UTC : lu en UTC
  //   il ouvrirait la semaine SUIVANTE » — l'heure exacte à laquelle on dépose.
  const dimancheSoir = '2026-09-07T00:30:00Z' // dimanche 6 sept. 20 h 30 à Toronto

  test('⭐ il tombe dans la semaine qui S’ACHÈVE, pas dans la suivante', () => {
    const tri = comptesDeLaSemaine([d('a', 'clos', dimancheSoir)], '2026-08-31', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 1, termines: 1 })
    assert.equal(tri.horsSemaine, 0)
  })

  test('⛔ et une lecture UTC le mettrait dans la SUIVANTE — le défaut qu’on évite', () => {
    const tri = comptesDeLaSemaine([d('a', 'clos', dimancheSoir)], '2026-09-07', TZ)
    assert.equal(tri.horsSemaine, 1)
    // La preuve que c'est bien le fuseau qui décide, et pas la fonction :
    const enUTC = comptesDeLaSemaine([d('a', 'clos', dimancheSoir)], '2026-09-07', 'UTC')
    assert.deepEqual(enUTC.parEleve.get('a'), { assignes: 1, termines: 1 })
  })

  test('le lundi matin à Toronto ouvre bien la semaine du lundi', () => {
    // Lundi 7 sept. 08 h 00 à Toronto = 12 h 00 UTC.
    const tri = comptesDeLaSemaine([d('a', 'assigne', '2026-09-07T12:00:00Z')], '2026-09-07', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 1, termines: 0 })
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · la ligne posée — et le défaut de la base, qui est le contraire de la règle', () => {
  const QUAND = '2026-09-07T09:30:00.000Z'

  test('⚠️⚠️ une semaine SANS exercice assigné est « faite » PAR CONSTRUCTION', () => {
    const l = ligneDAssiduite('a', '2026-08-31', { assignes: 0, termines: 0 }, SEUILS, QUAND)
    assert.equal(l.exercices_assignes, 0)
    // La colonne est `not null default false` : le défaut de la base dirait
    // l'inverse. On calcule TOUJOURS le booléen.
    assert.equal(l.semaine_faite, true)
  })

  test('trois quarts atteints → faite ; en dessous → non', () => {
    assert.equal(ligneDAssiduite('a', '2026-08-31', { assignes: 4, termines: 3 }, SEUILS, QUAND).semaine_faite, true)
    assert.equal(ligneDAssiduite('a', '2026-08-31', { assignes: 4, termines: 2 }, SEUILS, QUAND).semaine_faite, false)
  })

  test('⛔ le SEUIL vient du réglage — un seuil différent donne un booléen différent', () => {
    const compte = { assignes: 4, termines: 2 }
    assert.equal(ligneDAssiduite('a', '2026-08-31', compte, SEUILS, QUAND).semaine_faite, false)
    assert.equal(ligneDAssiduite('a', '2026-08-31', compte,
      { ...SEUILS, semaineFaite: 0.5 }, QUAND).semaine_faite, true)
  })

  test('⚠️ `updated_at` est TOUJOURS dans la charge — la colonne n’a aucun trigger', () => {
    const l = ligneDAssiduite('a', '2026-08-31', { assignes: 1, termines: 1 }, SEUILS, QUAND)
    assert.equal(l.updated_at, QUAND)
  })

  test('⛔⛔ la ligne ne porte AUCUNE des trois colonnes de minutes — elles sont à C4-L12', () => {
    const l = ligneDAssiduite('a', '2026-08-31', { assignes: 1, termines: 1 }, SEUILS, QUAND)
    for (const cle of CLES_INTERDITES) assert.equal(cle in l, false, `${cle} ne doit pas y être`)
    assert.deepEqual(Object.keys(l).sort(), [
      'cycle_lundi', 'eleve_id', 'exercices_assignes', 'exercices_termines',
      'semaine_faite', 'updated_at',
    ])
  })

  test('le lundi posé est bien celui qu’on a demandé — la base refuse tout autre jour', () => {
    const l = ligneDAssiduite('a', '2026-08-31', { assignes: 0, termines: 0 }, SEUILS, QUAND)
    assert.equal(l.cycle_lundi, '2026-08-31')
    assert.equal(new Date(`${l.cycle_lundi}T00:00:00Z`).getUTCDay(), 1)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · la garde de la charge — éprouvée en base avant d’être écrite', () => {
  const QUAND = '2026-09-07T09:30:00.000Z'
  const l = (id: string) => ligneDAssiduite(id, '2026-08-31', { assignes: 1, termines: 1 }, SEUILS, QUAND)

  test('un envoi homogène passe', () => {
    assert.doesNotThrow(() => verifierLaCharge([l('a'), l('b'), l('c')]))
  })

  test('un envoi vide passe', () => {
    assert.doesNotThrow(() => verifierLaCharge([]))
  })

  test('⛔ une clé de MINUTES dans la charge LÈVE', () => {
    const avecMinutes = { ...l('a'), minutes_assignees: 50 } as never
    assert.throws(() => verifierLaCharge([avecMinutes]), ChargeUtileInvalide)
  })

  test('⛔⛔ des jeux de clés HÉTÉROGÈNES lèvent — l’upsert en lot les unifierait', () => {
    // Vérifié en base : la ligne SANS la clé voit sa colonne partir à NULL.
    const bancal = { ...l('b'), minutes_budget_plancher: 45 } as never
    assert.throws(() => verifierLaCharge([l('a'), bancal]), ChargeUtileInvalide)
  })

  test('⛔ deux inscriptions du même élève ne font qu’une ligne — Postgres refuse le doublon', () => {
    // `21000 : ON CONFLICT DO UPDATE command cannot affect row a second time`.
    assert.deepEqual(dedoublonner(['a', 'b', 'a', 'c', 'b']), ['a', 'b', 'c'])
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · la population de semaines — le dénominateur vient du Calendrier', () => {
  const semestre = { id: 's1', start_date: '2026-08-31', end_date: '2026-10-04' }
  const relache = { semester_id: 's1', label: 'Relâche', start_date: '2026-09-14', end_date: '2026-09-20' }

  test('les semaines de travail sont rendues, les vacances SAUTÉES', () => {
    const s = semainesDeTravail([semestre], [relache])
    assert.deepEqual(s.map((x) => x.lundi),
      ['2026-08-31', '2026-09-07', '2026-09-21', '2026-09-28'])
  })

  test('⭐ la numérotation pédagogique saute les vacances, elle ne les compte pas', () => {
    const s = semainesDeTravail([semestre], [relache])
    assert.deepEqual(s.map((x) => x.numero), [1, 2, 3, 4])
  })

  test('une semaine de vacances est INTROUVABLE — donc aucune ligne, donc hors dénominateur', () => {
    const s = semainesDeTravail([semestre], [relache])
    assert.equal(trouverLaSemaine('2026-09-14', s), null)
    assert.notEqual(trouverLaSemaine('2026-09-21', s), null)
  })

  test('une semaine hors de tout semestre est introuvable elle aussi', () => {
    const s = semainesDeTravail([semestre], [relache])
    assert.equal(trouverLaSemaine('2026-08-24', s), null)
  })

  test('les vacances d’un AUTRE semestre ne trouent pas celui-ci', () => {
    const s = semainesDeTravail([semestre],
      [{ ...relache, semester_id: 'autre' }])
    assert.equal(s.length, 5)
  })

  test('deux semestres sont rendus ensemble, et triés', () => {
    const s = semainesDeTravail([
      { id: 's2', start_date: '2026-10-05', end_date: '2026-10-18' },
      semestre,
    ], [])
    assert.equal(s[0].lundi, '2026-08-31')
    assert.equal(s[s.length - 1].lundi, '2026-10-12')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · pourquoi la ligne à ZÉRO est indispensable au pourcentage', () => {
  // `assiduiteDeLEleve` calcule `denominateur = horsVacances.length` — le nombre
  // de LIGNES qu'on lui passe, c'est-à-dire le nombre de lignes EN BASE.
  const faite = (l: string): SemaineEleve =>
    ({ cycleLundi: l, exercicesAssignes: 4, exercicesTermines: 4, enVacances: false })
  const vide = (l: string): SemaineEleve =>
    ({ cycleLundi: l, exercicesAssignes: 0, exercicesTermines: 0, enVacances: false })
  const ratee = (l: string): SemaineEleve =>
    ({ cycleLundi: l, exercicesAssignes: 4, exercicesTermines: 0, enVacances: false })

  test('⛔⛔ sans les lignes à zéro, une semaine ratée pèse le DOUBLE', () => {
    // Quatre semaines de travail : deux faites, une ratée, une sans assignation.
    const complet = [faite('2026-08-31'), faite('2026-09-07'), ratee('2026-09-14'), vide('2026-09-21')]
    const tronque = [faite('2026-08-31'), faite('2026-09-07'), ratee('2026-09-14')]

    assert.equal(assiduiteDeLEleve(complet, SEUILS).denominateur, 4)
    assert.equal(assiduiteDeLEleve(complet, SEUILS).pourcentage, 0.75)

    assert.equal(assiduiteDeLEleve(tronque, SEUILS).denominateur, 3)
    assert.equal(assiduiteDeLEleve(tronque, SEUILS).pourcentage, 2 / 3)
  })

  test('⚠️ et la ligne à zéro compte comme FAITE — « faite par construction »', () => {
    const a = assiduiteDeLEleve([vide('2026-08-31'), vide('2026-09-07')], SEUILS)
    assert.equal(a.semainesFaites, 2)
    assert.equal(a.pourcentage, 1)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C4-L13 · le lotissement — le plafond de 1000 lignes ne signale rien', () => {
  test('un lot par tranche, et rien de perdu', () => {
    const lignes = Array.from({ length: 1201 }, (_, i) => i)
    const lots = lotir(lignes, 500)
    assert.deepEqual(lots.map((l) => l.length), [500, 500, 201])
    assert.equal(lots.flat().length, 1201)
  })

  test('une liste vide ne fait aucun envoi', () => {
    assert.deepEqual(lotir([], 500), [])
  })

  test('une taille de lot absurde LÈVE plutôt que de boucler', () => {
    assert.throws(() => lotir([1, 2, 3], 0), ChargeUtileInvalide)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · le bonus et l’assiduité — « trois quarts de ses exercices ASSIGNÉS »', () => {
  test('⛔⛔ UN BONUS NON RENDU N’ABAISSE PLUS L’ASSIDUITÉ D’UN ÉLÈVE QUI EN A FAIT PLUS', () => {
    // Le défaut exact que le lot ferme : un élève à 3/3 qui demande un exercice
    // de plus et ne le finit pas tomberait à 3/4 — SOUS le seuil des trois
    // quarts —, et sa semaine cesserait d’être « faite » POUR AVOIR TRAVAILLÉ
    // DAVANTAGE. Le dispositif punirait le geste qu’il offre.
    const tri = comptesDeLaSemaine([
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'assigne', '2026-09-02T14:00:00Z', true), // le bonus, pas fait
    ], '2026-08-31', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 3, termines: 3 })
    assert.equal(tri.bonus, 1, 'il est COMPTÉ à part — « un vide expliqué »')
  })

  test('⭐ UN BONUS RENDU N’AJOUTE RIEN NON PLUS : il sort des DEUX côtés de la fraction', () => {
    const tri = comptesDeLaSemaine([
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'clos', '2026-09-02T14:00:00Z', true),
    ], '2026-08-31', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 1, termines: 1 })
    assert.equal(tri.bonus, 1)
  })

  test('⚠️ UN ÉLÈVE QUI N’A QUE DES BONUS N’A AUCUNE LIGNE — il n’a rien d’ASSIGNÉ', () => {
    // « Une semaine sans aucun exercice assigné est FAITE par construction » :
    // c’est la règle existante, et elle vaut ici sans changement.
    const tri = comptesDeLaSemaine([
      d('a', 'assigne', '2026-09-01T14:00:00Z', true),
    ], '2026-08-31', TZ)
    assert.equal(tri.parEleve.has('a'), false)
    assert.equal(tri.retenus, 0)
    assert.equal(tri.bonus, 1)
  })

  test('⛔ UN BONUS `retire` COMPTE COMME RETIRÉ, pas comme bonus — l’ordre des gardes tient', () => {
    // `retire` est une décision du professeur, et elle se journalise comme telle.
    const tri = comptesDeLaSemaine([
      d('a', 'retire', '2026-09-01T14:00:00Z', true),
    ], '2026-08-31', TZ)
    assert.equal(tri.retires, 1)
    assert.equal(tri.bonus, 0)
  })

  test('⚠️ SANS AUCUN BONUS, le compte est EXACTEMENT celui d’avant C6-L3', () => {
    const tri = comptesDeLaSemaine([
      d('a', 'clos', '2026-09-01T14:00:00Z'),
      d('a', 'assigne', '2026-09-01T14:00:00Z'),
    ], '2026-08-31', TZ)
    assert.deepEqual(tri.parEleve.get('a'), { assignes: 2, termines: 1 })
    assert.equal(tri.bonus, 0)
  })
})
