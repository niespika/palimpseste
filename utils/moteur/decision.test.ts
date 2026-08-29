// ============================================================================
// C4 · L12 — LA DÉCISION, ÉPROUVÉE. Ce que le journal porte, et ce qu'il sépare.
// ============================================================================

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CRAN_SANS_CHOIX, estUneSondeDeMontee, journalDuTirage, journaliserLEscalade,
  lignesDeDecision, propositionsIsoDuree, sondesDeLExercicePose,
} from './decision'
import { constituerLeVivier, type ContexteDuVivier, type InstanceDuVivier } from './vivier'
import { candidatsPour } from './vivier'
import { BANDES_CRANS } from '../routeur/config'
import type { ExercicePose, SondePosee } from '../routeur/semaine'
import type { EtatEscalade } from '../routeur/escalade'
import type { Competence, Lettre } from '../routeur/types'

const instance = (p: Partial<InstanceDuVivier> = {}): InstanceDuVivier => ({
  exerciceId: 'ex-1', objet: 'argument', grain: 'meso', geste: 'produire',
  cranNumero: 6, cranCode: 'production_etayee', dureeMin: 20, lieu: 'maison',
  classeId: null,
  statut: 'concu', bloque: false, genre: null, exclusionsParcours: [],
  modesParCompetence: { argumentation: ['composer'] },
  couverture: { argumentation: 'exerce' },
  materiaux: [{ sorte: 'sujet', id: 'm', role: 'source', coursEtat: 'generique',
    coursApparies: [], coursDeclares: 0, planLivreReferenceId: null, planSemaine: null,
    statut: 'valide', bloque: false }], ...p,
})
const ctxVivier: ContexteDuVivier = { parcours: ['tc'], coursVus: new Set(),
  positionsDeLecture: new Map(), instancesDejaDeposees: new Set(),
  classesDeLEleve: new Set(['classe-A']) }

const pose = (exerciceId: string, over: Partial<ExercicePose['candidat']> = {}): ExercicePose => ({
  candidat: { exerciceId, competence: 'argumentation', grain: 'meso', geste: 'produire',
    cran: 'production_etayee', mode: 'composer', dureeMin: 20, ciblesSecondaires: [], ...over },
  regle: 'R2', departageParPB3: false, tirage: false, tour: 0,
})

// ── LE TIRAGE ───────────────────────────────────────────────────────────────

describe('`01-` §11, point 5 — le tirage journalisé', () => {
  it('⭐ il capte L\'ENSEMBLE DES EX ÆQUO **et** le choisi — `true` seul ne dit rien', () => {
    const j = journalDuTirage(() => 0.9)
    const choisi = j.tirer('phase_c')(['a', 'b', 'c'])
    assert.equal(choisi, 'c')
    assert.deepEqual(j.journal, [{ ou: 'phase_c', exAequo: ['a', 'b', 'c'], choisi: 'c' }])
  })

  it('le tirage NUMÉRIQUE de R3 journalise sa valeur brute', () => {
    const j = journalDuTirage(() => 0.25)
    assert.equal(j.tirerUnNombre('R3')(), 0.25)
    assert.equal(j.journal[0].choisi, '0.250000')
  })

  it('un tirage reproductible rend le même résultat — le hasard est injecté', () => {
    const a = journalDuTirage(() => 0)
    const b = journalDuTirage(() => 0)
    assert.equal(a.tirer('x')(['p', 'q']), b.tirer('x')(['p', 'q']))
  })
})

// ── LES DEUX SONDES ─────────────────────────────────────────────────────────

describe('`01-` §8.8 — les deux sondes, et le booléen qui les sépare', () => {
  it('⭐ une case AU-DESSUS de la bande est une sonde de montée — lue à la table', () => {
    // La table fait foi : on ne recode aucune bande ici.
    assert.equal(estUneSondeDeMontee('D', BANDES_CRANS.D.au_dessus.crans[0]), true)
    assert.equal(estUneSondeDeMontee('D', BANDES_CRANS.D.centre.crans[0]), false)
    assert.equal(estUneSondeDeMontee('C', BANDES_CRANS.C.sous_la_bande.crans[0]), false)
  })

  it('⛔ RIEN CHEZ A — sa montée passe au grain, sa zone haute est vide', () => {
    assert.equal(BANDES_CRANS.A.au_dessus.crans.length, 0)
    for (const c of BANDES_CRANS.A.centre.crans) assert.equal(estUneSondeDeMontee('A', c), false)
  })

  it('sans lettre, aucune bande : ni ciblable, ni sondable, ni plafonnée', () => {
    assert.equal(estUneSondeDeMontee(null, 'production_autonome'), false)
  })

  it('⭐⭐ les DEUX sondes cohabitent, distinguées par `sonde_montee` seul', () => {
    const secondaires: SondePosee[] = [
      { competence: 'synthese', exerciceId: 'ex-1', motif: 'plus_anciennement_mesuree',
        priorite: 3, tirage: false },
      { competence: 'structure', exerciceId: 'AUTRE', motif: 'entretien_n3', priorite: 1,
        tirage: false },
    ]
    // La cible est servie AU-DESSUS de sa bande → sonde de montée.
    const s = sondesDeLExercicePose('ex-1', 'argumentation',
      BANDES_CRANS.D.au_dessus.crans[0], 'D', secondaires)
    assert.deepEqual(s.map((x) => [x.competence, x.sonde_montee]),
      [['synthese', false], ['argumentation', true]])
    // Et la sonde d'un AUTRE exercice ne suit pas.
    assert.equal(s.find((x) => x.competence === 'structure'), undefined)
  })

  it('la cible servie DANS sa bande ne porte aucune sonde de montée', () => {
    const s = sondesDeLExercicePose('ex-1', 'argumentation',
      BANDES_CRANS.D.centre.crans[0], 'D', [])
    assert.deepEqual(s, [])
  })
})

// ── LES PROPOSITIONS ISO-DURÉE ──────────────────────────────────────────────

describe('`01-` §4, couche 4 — la recombinaison en 2-3 propositions iso-durée', () => {
  const vivier = constituerLeVivier([
    instance({ exerciceId: 'a' }),
    instance({ exerciceId: 'b' }),
    instance({ exerciceId: 'c' }),
    instance({ exerciceId: 'd' }),
  ], ctxVivier).retenus

  it('au méso, geste `produire` : le choix est offert, et il plafonne à TROIS', () => {
    const o = propositionsIsoDuree(pose('a'), vivier, [])
    assert.equal(o.offerte, true)
    assert.equal(o.propositions.length, 3)
    assert.equal(o.propositions[0].retenue, true)
    assert.deepEqual(o.propositions.slice(1).map((p) => p.retenue), [false, false])
  })

  it('⚠️ toutes les propositions ont LE MÊME BUDGET DE TEMPS — le remplissage reste déterministe', () => {
    const melange = constituerLeVivier([
      instance({ exerciceId: 'a', dureeMin: 20 }),
      instance({ exerciceId: 'long', dureeMin: 45 }),
      instance({ exerciceId: 'b', dureeMin: 20 }),
    ], ctxVivier).retenus
    const o = propositionsIsoDuree(pose('a'), melange, [])
    assert.deepEqual(o.propositions.map((p) => p.exercice_id), ['a', 'b'])
    assert.ok(o.propositions.every((p) => p.duree_min === 20))
  })

  it('⛔ au MICRO, une seule proposition — « le stock est trop mince »', () => {
    const micro = constituerLeVivier([instance({ exerciceId: 'a', grain: 'micro' }),
      instance({ exerciceId: 'b', grain: 'micro' })], ctxVivier).retenus
    const o = propositionsIsoDuree(pose('a', { grain: 'micro' }), micro, [])
    assert.equal(o.offerte, false)
    assert.equal(o.propositions.length, 1)
  })

  it('⛔ aux crans de `diagnostiquer`, une seule proposition', () => {
    const o = propositionsIsoDuree(pose('a', { geste: 'diagnostiquer' }), vivier, [])
    assert.equal(o.offerte, false)
  })

  it('⛔ et `transformation_guidee` est la SEULE exception de `transformer`', () => {
    const guidee = propositionsIsoDuree(
      pose('a', { geste: 'transformer', cran: CRAN_SANS_CHOIX }), vivier, [])
    assert.equal(guidee.offerte, false)
    const autre = propositionsIsoDuree(
      pose('a', { geste: 'transformer', cran: 'transformation_aveugle' }), vivier, [])
    assert.equal(autre.offerte, true)
  })

  it('une proposition n\'est jamais une instance déjà posée dans la semaine', () => {
    const o = propositionsIsoDuree(pose('a'), vivier, [pose('b'), pose('c')])
    assert.deepEqual(o.propositions.map((p) => p.exercice_id), ['a', 'd'])
  })

  it('sans alternative, le choix n\'est pas offert — et le motif le DIT', () => {
    const seule = constituerLeVivier([instance({ exerciceId: 'a' })], ctxVivier).retenus
    const o = propositionsIsoDuree(pose('a'), seule, [])
    assert.equal(o.offerte, false)
    assert.match(o.motif, /rien à recombiner/)
  })
})

// ── L'ÉTAT D'ESCALADE ───────────────────────────────────────────────────────

describe('`07-` §1.5 — l\'état d\'escalade AU MOMENT DE LA DÉCISION', () => {
  it('il se journalise par compétence, avec sa date de lecture', () => {
    const m = new Map<Competence, EtatEscalade[]>([
      ['argumentation', [{ observable: 'garant', degre: 'N2', entreN1At: '2026-09-01',
        dossierN3OuvertAt: null, dossierN3TraiteAt: null }]],
      ['structure', []],
    ])
    const j = journaliserLEscalade(m, '2026-09-07T09:30:00Z')
    assert.equal(j.lu_at, '2026-09-07T09:30:00Z')
    assert.deepEqual(Object.keys(j.par_competence), ['argumentation'])
    assert.equal(j.par_competence.argumentation[0].degre, 'N2')
  })

  it('un élève sans escalade journalise un état VIDE — jamais une absence de clé', () => {
    const j = journaliserLEscalade(new Map(), '2026-09-07T09:30:00Z')
    assert.deepEqual(j.par_competence, {})
    assert.equal(typeof j.lu_at, 'string')
  })
})

// ── LES LIGNES ──────────────────────────────────────────────────────────────

describe('`01-` §11 — une ligne de décision PAR EXERCICE POSÉ', () => {
  const vivier = constituerLeVivier([instance({ exerciceId: 'a' }),
    instance({ exerciceId: 'b' })], ctxVivier).retenus
  const paliers = new Map<Competence, Lettre>([['argumentation', 'D']])
  const base = {
    eleveId: 'E', cycleLundi: '2026-09-07',
    etatEscalade: journaliserLEscalade(new Map(), '2026-09-07T09:30:00Z'),
    tirages: [{ ou: 'phase_c', exAequo: ['a', 'b'], choisi: 'a' }],
    paliers, alternatives: { R2: 'écartées' },
  }

  it('chaque exercice porte SA ligne, sa cible et sa règle', () => {
    const l = lignesDeDecision([pose('a'), pose('b')], [], vivier, base)
    assert.equal(l.length, 2)
    assert.deepEqual(l.map((x) => x.exercice_id), ['a', 'b'])
    assert.ok(l.every((x) => x.cible_retenue === 'argumentation' && x.regle_declenchee === 'R2'))
    assert.ok(l.every((x) => x.cycle_lundi === '2026-09-07' && x.eleve_id === 'E'))
  })

  it('⛔ `choix_eleve` reste NULL — la préférence recueillie n\'est pas tranchée', () => {
    const l = lignesDeDecision([pose('a')], [], vivier, base)
    assert.equal(l[0].choix_eleve, null)
  })

  it('le tirage se journalise UNE FOIS, sur la première ligne du cycle', () => {
    const l = lignesDeDecision([pose('a'), pose('b')], [], vivier, base)
    assert.equal(l[0].tirage_aleatoire?.length, 1)
    assert.equal(l[1].tirage_aleatoire, null)
  })

  it('la borne amont vient du vivier, jamais d\'une invention', () => {
    const l = lignesDeDecision([pose('a')], [], vivier, base)
    assert.equal(l[0].borne_amont.regime, 'hors_livre')
  })

  it('`degrade` ne se lève que sur les exercices nommés', () => {
    const l = lignesDeDecision([pose('a'), pose('b')], [], vivier, base, new Set(['b']))
    assert.deepEqual(l.map((x) => x.degrade), [false, true])
  })

  it('la sonde de montée entre au journal quand la case est au-dessus de la bande', () => {
    const haut = pose('a', { cran: BANDES_CRANS.D.au_dessus.crans[0] })
    const l = lignesDeDecision([haut], [], vivier, base)
    assert.deepEqual(l[0].sondes_retenues.map((s) => [s.competence, s.sonde_montee]),
      [['argumentation', true]])
  })

  it('les candidats du vivier restent la seule source des propositions', () => {
    const l = lignesDeDecision([pose('a')], [], vivier, base)
    assert.deepEqual(l[0].propositions_iso_duree?.map((p) => p.exercice_id), ['a', 'b'])
    // …et la première est celle sur laquelle le dépôt sera posé.
    assert.equal(l[0].propositions_iso_duree?.[0].retenue, true)
  })

  it('les candidats se lisent avec la même durée que le vivier les rend', () => {
    assert.equal(candidatsPour(vivier, 'argumentation', [])[0].dureeMin, 20)
  })
})
