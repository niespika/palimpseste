// ============================================================================
// C4 · L12 — LA DÉCISION, ÉPROUVÉE. Ce que le journal porte, et ce qu'il sépare.
// ============================================================================

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  CRAN_SANS_CHOIX, CRANS_DE_TRAJECTOIRE, estUneSondeDeMontee, journalDuTirage, journaliserLEscalade,
  lignesDeDecision, poserLesSondesDeTrajectoire, propositionsIsoDuree, signalDeTrajectoire, sondeDeTrajectoire,
  sondesDeLExercicePose,
} from './decision'
import type { EtatObservable } from '../routeur/observables'
import { constituerLeVivier, type ContexteDuVivier, type InstanceDuVivier } from './vivier'
import { candidatsPour } from './vivier'
import { BANDES_CRANS } from '../routeur/config'
import type { ExercicePose, SemainePosee, SondePosee } from '../routeur/semaine'
import type { EtatEscalade } from '../routeur/escalade'
import type { Competence, Lettre } from '../routeur/types'

const instance = (p: Partial<InstanceDuVivier> = {}): InstanceDuVivier => ({
  exerciceId: 'ex-1', objet: 'argument', grain: 'meso', geste: 'produire',
  cranNumero: 6, cranCode: 'production_etayee', dureeMin: 20, lieu: 'maison',
  classeId: null,
  statut: 'concu', bloque: false, genre: null, exclusionsParcours: [],
  modesParCompetence: { argumentation: ['composer'] },
  couverture: { argumentation: 'exerce' },
  coTexte: null, devoirs: [],
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

// ── ⭐⭐ C7-L9 — le signal de trajectoire : « la trajectoire propose, le 6·8 dispose » ──
describe('C7-L9 — `signalDeTrajectoire` (`01-` §8.8, 07/09) : la majorité STRICTE des requis, acquise ou ratée', () => {
  const o = (code: string, p: Partial<EtatObservable> = {}): EtatObservable => ({
    code, taux: 1, reussies: 1, denominateur: 1, acquis: true, sansTaux: false, requis: true, ...p,
  })
  it('trois requis, deux acquis : montée — les nombres au détail', () => {
    const s = signalDeTrajectoire('argumentation', [o('a'), o('b'), o('c', { acquis: false, taux: 0.2 })], 'C')
    assert.equal(s?.motif, 'trajectoire_montee')
    assert.deepEqual([s?.acquis, s?.rates, s?.requis], [2, 1, 3])
    assert.match(s?.detail ?? '', /2 requis acquis, 1 ratés, sur 3/)
  })
  it('trois requis, deux ratés (un taux, non acquis) : descente', () => {
    const s = signalDeTrajectoire('structure', [o('a', { acquis: false, taux: 0.1 }), o('b', { acquis: false, taux: 0 }), o('c')], 'D')
    assert.equal(s?.motif, 'trajectoire_descente')
  })
  it('la MAJORITÉ est STRICTE : deux requis, un acquis et un raté — rien ; quatre, deux et deux — rien', () => {
    assert.equal(signalDeTrajectoire('argumentation', [o('a'), o('b', { acquis: false, taux: 0 })], 'C'), null)
    assert.equal(signalDeTrajectoire('argumentation', [o('a'), o('b'), o('c', { acquis: false, taux: 0 }), o('d', { acquis: false, taux: 0 })], 'C'), null)
  })
  it('« un observable sans taux ne se classe pas » : il ne compte ni acquis ni raté', () => {
    // deux requis : un acquis, un sans taux → 1 > 1 ? non → rien ; trois : deux acquis + un sans taux → montée
    assert.equal(signalDeTrajectoire('argumentation', [o('a'), o('b', { acquis: false, taux: null, sansTaux: true })], 'C'), null)
    assert.equal(signalDeTrajectoire('argumentation', [o('a'), o('b'), o('c', { acquis: false, taux: null, sansTaux: true })], 'C')?.motif, 'trajectoire_montee')
  })
  it('les non-requis ne comptent pas ; sans requis, rien ; SANS LETTRE, rien — « ni ciblable, ni sondable »', () => {
    assert.equal(signalDeTrajectoire('argumentation', [o('a', { requis: false }), o('b', { requis: false })], 'C'), null)
    assert.equal(signalDeTrajectoire('argumentation', [], 'C'), null)
    assert.equal(signalDeTrajectoire('argumentation', [o('a'), o('b'), o('c')], null), null)
  })
  it('la sonde qu\'il pose est une sonde de MONTÉE (M-e), motif journalisé, sur l\'exercice 6/8 qui la porte', () => {
    const s = signalDeTrajectoire('argumentation', [o('a'), o('b'), o('c')], 'C')!
    const sonde = sondeDeTrajectoire(s, 'ex-6')
    assert.deepEqual(sonde, { competence: 'argumentation', motif: 'trajectoire_montee', priorite: null,
      sonde_montee: true, exercice_id: 'ex-6', detail: s.detail })
    assert.deepEqual([...CRANS_DE_TRAJECTOIRE].sort(), ['production_autonome', 'production_etayee'])
  })
})

// ── ⭐⭐ C7-L9 — la pose de la sonde de trajectoire : le substrat, le budget, le plafond ──
describe('C7-L9 — `poserLesSondesDeTrajectoire` : un 6/8 servable sur la compétence, sinon `sans_substrat` — et rien d\'autre', () => {
  const signal = (competence: Competence = 'argumentation') =>
    signalDeTrajectoire(competence, [
      { code: 'a', taux: 1, reussies: 1, denominateur: 1, acquis: true, sansTaux: false, requis: true },
      { code: 'b', taux: 1, reussies: 1, denominateur: 1, acquis: true, sansTaux: false, requis: true },
      { code: 'c', taux: 0, reussies: 0, denominateur: 1, acquis: false, sansTaux: false, requis: true },
    ], 'C')!
  const semaine = (exercices: ExercicePose[] = [], minutes = 0): SemainePosee => ({
    exercices, posesDeCettePasse: [], minutesAssignees: minutes,
    ecart: { souSLePlancher: false, manque: 0, minutesPlancher: 45 } as never,
    journal: { permutationsALaCouture: 0, reliquatPerdu: 0, voieMixte: false, motifArret: '' },
  })
  const BUDGET = { plancher: 45, plafond: 60, optionnel: 30 }

  it('un 6/8 déjà POSÉ dont elle est la cible : la sonde s\'y pose, rien n\'est ajouté', () => {
    const s = semaine([pose('six')])
    const r = poserLesSondesDeTrajectoire([signal()], s, [], BUDGET, false)
    assert.equal(s.exercices.length, 1)
    assert.deepEqual(r.sondes.map((x) => [x.exercice_id, x.motif, x.sonde_montee]), [['six', 'trajectoire_montee', true]])
    assert.equal(r.journal[0].issue, 'sonde_sur_exercice_pose')
  })
  it('sinon un 6/8 SERVABLE du vivier, ajouté à la semaine sous la règle `trajectoire`, s\'il tient dans le budget', () => {
    const retenus = constituerLeVivier([instance({ exerciceId: 'six', cranNumero: 6, cranCode: 'production_etayee' }),
      instance({ exerciceId: 'quatre', cranNumero: 4, cranCode: 'diagnostic_nomme', geste: 'diagnostiquer' })], ctxVivier).retenus
    const s = semaine([pose('autre', { cran: 'diagnostic_nomme', competence: 'structure' })], 20)
    const r = poserLesSondesDeTrajectoire([signal()], s, retenus, BUDGET, false)
    assert.equal(r.journal[0].issue, 'exercice_ajoute')
    assert.equal(s.exercices.length, 2)
    assert.equal(s.exercices[1].candidat.exerciceId, 'six')
    assert.equal(s.exercices[1].regle, 'trajectoire')
    assert.equal(s.exercices[1].tour, 1)
    assert.equal(s.minutesAssignees, 40)
    assert.equal(s.posesDeCettePasse.length, 1)
    assert.deepEqual(r.sondes[0], { competence: 'argumentation', motif: 'trajectoire_montee', priorite: null, sonde_montee: true, exercice_id: 'six', detail: signal().detail })
  })
  it('aucun 6/8 servable : `sans_substrat` journalisé, avec les nombres, et rien d\'autre', () => {
    const retenus = constituerLeVivier([instance({ exerciceId: 'quatre', cranNumero: 4, cranCode: 'diagnostic_nomme', geste: 'diagnostiquer' })], ctxVivier).retenus
    const s = semaine([], 0)
    const r = poserLesSondesDeTrajectoire([signal()], s, retenus, BUDGET, false)
    assert.deepEqual(r.sondes, [])
    assert.equal(r.journal[0].issue, 'sans_substrat')
    assert.match(r.journal[0].detail, /2 requis acquis, 1 ratés, sur 3/)
    assert.equal(s.exercices.length, 0)
  })
  it('un 6/8 servable qui ne tient pas dans le budget : `hors_budget`, journalisé, rien d\'ajouté', () => {
    const retenus = constituerLeVivier([instance({ exerciceId: 'six', cranNumero: 6 })], ctxVivier).retenus
    const s = semaine([], 50)
    const r = poserLesSondesDeTrajectoire([signal()], s, retenus, BUDGET, false)
    assert.equal(r.journal[0].issue, 'hors_budget')
    assert.equal(s.exercices.length, 0)
    assert.deepEqual(r.sondes, [])
  })
  it('elles comptent dans le plafond de sondes du cycle', () => {
    const signaux = (['argumentation', 'structure', 'expression', 'synthese', 'connaissance'] as Competence[]).map((c) => signal(c))
    const s = semaine(signaux.map((x, i) => pose(`p${i}`, { competence: x.competence })))
    const r = poserLesSondesDeTrajectoire(signaux, s, [], BUDGET, false)
    assert.equal(r.sondes.length, 4)
  })
  it('⭐ la porte du registre laisse passer un 6/8 EN SONDE quand la trajectoire s\'est levée sur sa compétence — l\'exception qu\'elle prévoit', () => {
    const fermee = { actif: true, de: (objet: string) => ({ objet, ouverts: [1, 3], sondes: [], methode: false }) }
    const six = instance({ exerciceId: 'six', cranNumero: 6, cranCode: 'production_etayee' })
    const hier = constituerLeVivier([six], { ...ctxVivier, porte: fermee })
    assert.equal(hier.retenus.length, 0)
    assert.equal(hier.ecartes[0].motif, 'porte_registre')
    const avec = constituerLeVivier([six], { ...ctxVivier, porte: { ...fermee, sondesDeTrajectoire: new Set(['argumentation']) } })
    assert.equal(avec.retenus.length, 1)
    assert.equal(avec.retenus[0].porte, 'sonde')
    // une autre compétence, ou un autre cran : la porte d'hier
    assert.equal(constituerLeVivier([six], { ...ctxVivier, porte: { ...fermee, sondesDeTrajectoire: new Set(['structure']) } }).retenus.length, 0)
    const cinq = instance({ exerciceId: 'cinq', cranNumero: 5, cranCode: 'transformation_nommee', geste: 'transformer' })
    assert.equal(constituerLeVivier([cinq], { ...ctxVivier, porte: { ...fermee, sondesDeTrajectoire: new Set(['argumentation']) } }).retenus.length, 0)
  })
  it('la sonde de trajectoire entre AVANT celle du registre, qui s\'efface : une seule marque `sonde_montee` par exercice', () => {
    const retenus = constituerLeVivier([instance({ exerciceId: 'six', cranNumero: 6 })], { ...ctxVivier,
      porte: { actif: true, de: (objet: string) => ({ objet, ouverts: [], sondes: [], methode: false }), sondesDeTrajectoire: new Set(['argumentation']) } }).retenus
    const s = signal()
    const lignes = lignesDeDecision([pose('six')], [], retenus, {
      eleveId: 'e', cycleLundi: '2026-09-14', etatEscalade: {} as never, tirages: [], paliers: new Map([['argumentation', 'C']]), alternatives: null,
      trajectoire: { sondes: [sondeDeTrajectoire(s, 'six')], journal: [{ competence: 'argumentation', motif: s.motif, detail: s.detail, issue: 'exercice_ajoute', exercice_id: 'six' }] },
    })
    const montee = lignes[0].sondes_retenues.filter((x) => x.sonde_montee)
    assert.equal(montee.length, 1)
    assert.equal(montee[0].motif, 'trajectoire_montee')
    assert.equal((lignes[0].alternatives_ecartees as { trajectoire: unknown[] }).trajectoire.length, 1)
  })
})
