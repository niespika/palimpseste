// « Les cinq règles de la mission se lisent au §6, QUI PORTE DAVANTAGE » — et
// tout ce que la section porte s'implémente. Le cas « Le canal bouché » de
// l'Annexe A est ici, et il fait foi.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  filtreR0, filtreN3, regimeR1, elireR2, questionnementEstEntre, ordreDeLevier,
  questionnementHorsComposer, probabiliteR3, insertionR3, ecarterLaConnaissance,
  renvoiConnaissance, KdeR5, dettesDeR5, ciblesDeCalibration, listeDePriorite,
  secondeInscriptionPA3, GRAIN_DE_CALIBRATION, type EtatPourCiblage, type ContextePriorite,
} from './ciblage'
import type { Competence } from './types'

const et = (competence: Competence, o: Partial<EtatPourCiblage> = {}): EtatPourCiblage => ({
  competence, statutRecette: 'evaluee', lettre: 'C', signal: 'C', valeurNonPlafonnee: 'C',
  enEntretienN3: false, aProgresse: false, ...o,
})

// ── R0 — le filtre de recette ──────────────────────────────────────────────

test('R0 : aucune règle ne peut proposer une compétence qui n\'est pas `evaluee`', () => {
  const r = filtreR0([et('structure'), et('synthese', { statutRecette: 'mesuree_silencieusement' }),
    et('argumentation', { statutRecette: 'differee' })])
  assert.deepEqual(r.map((e) => e.competence), ['structure'])
})

test('R0 : une compétence SANS LETTRE n\'est pas ciblable non plus', () => {
  assert.deepEqual(filtreR0([et('structure', { lettre: null })]), [])
})

test('N3 s\'exécute AVANT R2 — il retire du pool des cibles', () => {
  const r = filtreN3([et('structure', { enEntretienN3: true }), et('argumentation')])
  assert.deepEqual(r.map((e) => e.competence), ['argumentation'])
})

// ── R1 — le canal ──────────────────────────────────────────────────────────

test('R1 : Expression ≤ D → cible primaire d\'UN EXERCICE SUR DEUX', () => {
  assert.equal(regimeR1('D', false, 0, 3).part, 1 / 2)
  assert.equal(regimeR1('E', false, 0, 3).part, 1 / 2)
  assert.equal(regimeR1('D', false, 0, 3).actif, true)
})

test('R1 : à C, LA PART RÉSERVÉE TOMBE — et l\'Expression gagne les gros grains', () => {
  const r = regimeR1('C', false, 0, 3)
  assert.equal(r.actif, false)
  assert.equal(r.part, 0)
  assert.equal(r.secondaireSurProduire, true, 'cible secondaire sur tout méso/macro en `produire`')
})

test('R1 : on en SORT à B', () => {
  const r = regimeR1('B', false, 0, 3)
  assert.equal(r.actif, false)
  assert.equal(r.secondaireSurProduire, false)
  assert.match(r.motif, /atteint B/)
})

test('R1 : `exception_expression` → un sur TROIS, et AU PALIER D SEULEMENT', () => {
  assert.equal(regimeR1('D', true, 7, 3).part, 1 / 3)
  assert.equal(regimeR1('D', true, 6, 3).part, 1 / 2, 'au-DELÀ de 6 cycles, pas à 6')
  assert.equal(regimeR1('E', true, 20, 3).part, 1 / 2, 'la borne ne joue qu\'au palier D')
  assert.equal(regimeR1('C', true, 20, 3).actif, false, 'à C il n\'y a plus de créneau à soulager')
})

test('R1 démarre au SEGMENT 3', () => {
  assert.equal(regimeR1('D', false, 0, 2).actif, false)
})

// ── R2 — le trio ───────────────────────────────────────────────────────────

test('R2 élit la plus faible du trio AU SIGNAL, jamais à la lettre affichée', () => {
  const r = elireR2([
    et('argumentation', { lettre: 'E', signal: 'B' }),
    et('structure', { lettre: 'A', signal: 'D' }),
    et('questionnement', { lettre: 'C', signal: 'C' }),
  ], [], ['tc'])
  assert.equal(r.cible, 'structure', 'la lettre A ne la protège pas : son signal est le plus bas')
})

test('R2 : le SEUIL D\'ENTRÉE du Questionnement se lit sur la LETTRE AFFICHÉE des gardiens', () => {
  const sousLeSeuil = [et('argumentation', { lettre: 'D' }), et('structure', { lettre: 'C' }),
    et('questionnement', { lettre: 'E', signal: 'E' })]
  assert.equal(questionnementEstEntre(sousLeSeuil), false)
  assert.notEqual(elireR2(sousLeSeuil, [], ['tc']).cible, 'questionnement',
    'même en portant la plus basse lettre du trio')

  const auSeuil = [et('argumentation', { lettre: 'C' }), et('structure', { lettre: 'C' }),
    et('questionnement', { lettre: 'E', signal: 'E' })]
  assert.equal(questionnementEstEntre(auSeuil), true)
  assert.equal(elireR2(auSeuil, [], ['tc']).cible, 'questionnement')
})

test('R2 : le seuil se lit sur la lettre, PAS sur le signal des gardiens', () => {
  const gardiensHautsEnSignalSeul = [et('argumentation', { lettre: 'D', signal: 'A' }),
    et('structure', { lettre: 'D', signal: 'A' }), et('questionnement', { lettre: 'E', signal: 'E' })]
  assert.equal(questionnementEstEntre(gardiensHautsEnSignalSeul), false)
})

test('R2 : départage (a) à l\'ancienneté, puis (b) à l\'ordre de levier', () => {
  const ex = [et('argumentation', { signal: 'D' }), et('structure', { signal: 'D' }),
    et('questionnement', { lettre: 'C', signal: 'A' })]
  // Sans historique : les deux sont à égalité d'ancienneté → l'ordre de levier tranche.
  const r = elireR2(ex, [], ['tc'])
  assert.equal(r.cible, 'argumentation', 'Argumentation > Structure')
  assert.equal(r.departageParLevier, true)

  // Avec un historique où Argumentation vient d'être ciblée : la Structure passe.
  const r2 = elireR2(ex, ['structure', 'argumentation'], ['tc'])
  assert.equal(r2.cible, 'structure')
  assert.equal(r2.departageParAnciennete, true)
})

test('R2 : L\'ORDRE S\'INVERSE quand LES TROIS lettres du trio sont ≥ B', () => {
  const bas = [et('argumentation', { lettre: 'C' }), et('structure', { lettre: 'B' }),
    et('questionnement', { lettre: 'B' })]
  assert.deepEqual([...ordreDeLevier(bas)], ['argumentation', 'structure', 'questionnement'])

  const hautes = [et('argumentation', { lettre: 'B' }), et('structure', { lettre: 'B' }),
    et('questionnement', { lettre: 'A' })]
  assert.deepEqual([...ordreDeLevier(hautes)], ['questionnement', 'argumentation', 'structure'])
})

test('R2 : le trio se réduit sans règle spéciale quand R0 en a écarté un', () => {
  const r = elireR2([et('argumentation', { signal: 'D' })], [], ['tc'])
  assert.equal(r.cible, 'argumentation')
})

test('R2 : chez les HLP, le Questionnement n\'est ciblé QU\'EN MODES AUTRES que `composer`', () => {
  assert.equal(questionnementHorsComposer('questionnement', ['hlp']), true)
  assert.equal(questionnementHorsComposer('questionnement', ['tc']), false)
  assert.equal(questionnementHorsComposer('argumentation', ['hlp']), false)
  assert.equal(questionnementHorsComposer('questionnement', ['tc', 'hlp']), true,
    'un bi-classe est aussi HLP')
})

// ── R3 — la dette qui monte ────────────────────────────────────────────────

test('R3 : la probabilité vaut (d / 2C)², et CERTITUDE À 2C', () => {
  assert.equal(probabiliteR3(0, 'C'), 0)
  assert.equal(probabiliteR3(4, 'C'), (4 / 8) ** 2, 'à la cadence, un quart')
  assert.equal(probabiliteR3(8, 'C'), 1, 'certitude à 2C = 8')
  assert.equal(probabiliteR3(20, 'C'), 1)
})

test('R3 : la cadence suit le PALIER — 4 jusqu\'à C, 6 à B, 8 à A', () => {
  assert.equal(probabiliteR3(6, 'C'), (6 / 8) ** 2)
  assert.equal(probabiliteR3(6, 'B'), (6 / 12) ** 2)
  assert.equal(probabiliteR3(6, 'A'), (6 / 16) ** 2)
})

test('R3 : SUSPENDUE si l\'élève est en R1', () => {
  const r = insertionR3(99, 'C', true, () => 0)
  assert.equal(r.insere, false)
  assert.match(r.motif, /suspendue/)
})

test('R3 : le tirage se JOURNALISE', () => {
  const r = insertionR3(4, 'C', false, () => 0.1)
  assert.equal(r.insere, true, '0,1 < 0,25')
  assert.equal(r.tirage, 0.1)
  const s = insertionR3(4, 'C', false, () => 0.9)
  assert.equal(s.insere, false)
  assert.equal(s.tirage, 0.9)
})

// ── R4 — la Connaissance hors rayon ────────────────────────────────────────

test('R4 : la Connaissance n\'est JAMAIS cible primaire', () => {
  const r = ecarterLaConnaissance([et('connaissance'), et('structure')])
  assert.deepEqual(r.map((e) => e.competence), ['structure'])
})

test('R4 : l\'effondrement renvoie HORS ROUTEUR — Quazian et drapeau professeur', () => {
  assert.equal(renvoiConnaissance(false).renvoyer, false)
  const r = renvoiConnaissance(true)
  assert.equal(r.renvoyer, true)
  assert.match(r.motif, /Quazian/)
})

// ── R5 — la dette de couverture ────────────────────────────────────────────

test('K ne s\'instancie pas en constante : il se remplit du nombre d\'exercices', () => {
  assert.equal(KdeR5(8, 5), 24, 'trois cycles de 8 exercices')
  assert.equal(KdeR5(1, 5), 6, 'jamais sous N + 1 — sinon la dette écrase tout')
})

test('R5 : au-delà de K exercices sans être ciblée, la compétence entre en dette', () => {
  const historique: Competence[] = Array.from({ length: 10 }, () => 'structure')
  const d = dettesDeR5([et('structure'), et('argumentation')], historique, 5)
  assert.deepEqual(d.map((x) => x.competence), ['argumentation'])
  assert.equal(d[0].ancienneteEnExercices, Number.POSITIVE_INFINITY, 'jamais ciblée')
})

test('R5 : elle INSCRIT, elle n\'élit jamais — la liste reste ordonnée par ancienneté', () => {
  const historique: Competence[] = ['synthese', 'argumentation', 'structure', 'structure',
    'structure', 'structure', 'structure', 'structure']
  const d = dettesDeR5([et('synthese'), et('argumentation')], historique, 3)
  assert.deepEqual(d.map((x) => x.competence), ['synthese', 'argumentation'],
    'la plus ancienne d\'abord')
})

// ── La calibration — segment 2 ─────────────────────────────────────────────

test('calibration : cible les `evaluee` au MOINS DE MESURES, jusqu\'à trois', () => {
  const c = ciblesDeCalibration([et('argumentation'), et('structure'), et('expression')],
    (x) => ({ argumentation: 0, structure: 2, expression: 3 } as Record<string, number>)[x] ?? 0)
  assert.deepEqual(c.map((x) => x.competence), ['argumentation', 'structure'],
    'l\'Expression a ses trois mesures : elle sort')
})

test('calibration : le GRAIN est indexé sur ce qu\'on éprouve', () => {
  assert.deepEqual(GRAIN_DE_CALIBRATION.argumentation, ['micro', 'meso'])
  assert.deepEqual(GRAIN_DE_CALIBRATION.structure, ['micro', 'meso'])
  assert.deepEqual(GRAIN_DE_CALIBRATION.questionnement, ['micro', 'meso'])
  assert.deepEqual(GRAIN_DE_CALIBRATION.expression, ['meso'], 'méso SEUL')
  assert.deepEqual(GRAIN_DE_CALIBRATION.synthese, ['meso'], 'méso SEUL')
})

// ── PA2 — la liste de priorité ─────────────────────────────────────────────

const ctx = (o: Partial<ContextePriorite> = {}): ContextePriorite => ({
  segment: 3, parcours: ['tc'], historique: [], lettreExpression: 'C',
  exceptionExpression: false, cyclesSansProgresExpression: 0, palierSynthese: 'C',
  cyclesDepuisR3: 0, K: 20, tirer: () => 0.99, nombreDeMesures: () => 0, ...o,
})

test('PA2 au segment 2 : la calibration écarte R1, R2 et R3', () => {
  const { liste, journal } = listeDePriorite(
    [et('argumentation'), et('structure')], ctx({ segment: 2 }))
  assert.ok(liste.every((e) => e.regle === 'calibration'))
  assert.deepEqual(journal.ecartees, ['R1', 'R2', 'R3'])
})

test('PA2 : R1 en tête — et il SUSPEND R3, même à la certitude de 2C', () => {
  const etats = [et('expression', { lettre: 'D' }), et('argumentation', { signal: 'D' }),
    et('structure', { signal: 'B' }), et('synthese')]
  const { liste, journal } = listeDePriorite(etats,
    ctx({ lettreExpression: 'D', cyclesDepuisR3: 99, K: 0 }))
  assert.equal(liste[0].competence, 'expression')
  assert.equal(liste[0].regle, 'R1')
  assert.equal((journal.R3 as { insere: boolean }).insere, false,
    'R3 est suspendue si l\'élève est en R1 — 99 cycles de dette n\'y changent rien')
  assert.equal(liste[1].regle, 'R2', 'R2 suit donc directement R1')
})

test('PA2 : hors R1, l\'ordre est R3, R2, puis les dettes de R5', () => {
  const etats = [et('expression', { lettre: 'B' }), et('argumentation', { signal: 'D' }),
    et('structure', { signal: 'B' }), et('synthese')]
  const { liste } = listeDePriorite(etats, ctx({ lettreExpression: 'B', cyclesDepuisR3: 99, K: 0 }))
  assert.equal(liste[0].competence, 'synthese')
  assert.equal(liste[0].regle, 'R3', 'certitude à 2C')
  assert.equal(liste[1].competence, 'argumentation')
  assert.equal(liste[1].regle, 'R2')
  assert.ok(liste.slice(2).every((e) => e.regle === 'R5'), 'le reste est de la dette')
})

test('PA2 : N3 ne filtre JAMAIS R1 — le canal continue de donner un exercice sur deux', () => {
  const etats = [et('expression', { lettre: 'D', enEntretienN3: true }),
    et('argumentation', { signal: 'D' })]
  const { liste } = listeDePriorite(etats, ctx({ lettreExpression: 'D' }))
  assert.equal(liste[0].competence, 'expression', 'en entretien N3, et pourtant toujours au canal')
})

test('PA2 : N3 filtre bien R2, lui', () => {
  const etats = [et('argumentation', { signal: 'E', enEntretienN3: true }),
    et('structure', { signal: 'D' })]
  const { liste } = listeDePriorite(etats, ctx({ lettreExpression: 'B' }))
  const r2 = liste.find((e) => e.regle === 'R2')
  assert.equal(r2?.competence, 'structure', 'l\'Argumentation en entretien sort du pool')
})

test('PA2 : la Connaissance n\'entre jamais dans la liste', () => {
  const { liste } = listeDePriorite([et('connaissance'), et('structure', { signal: 'D' })],
    ctx({ lettreExpression: 'B', K: 0 }))
  assert.ok(!liste.some((e) => e.competence === 'connaissance'))
})

test('PA2 : une compétence n\'entre jamais deux fois dans la liste', () => {
  const etats = [et('synthese', { signal: 'E' }), et('structure', { signal: 'D' })]
  const { liste } = listeDePriorite(etats, ctx({ lettreExpression: 'B', cyclesDepuisR3: 99, K: 0 }))
  const comptes = new Map<string, number>()
  for (const e of liste) comptes.set(e.competence, (comptes.get(e.competence) ?? 0) + 1)
  assert.ok([...comptes.values()].every((n) => n === 1))
})

test('PA3 : au plus UNE seconde inscription par cycle, la mieux placée', () => {
  const liste = [{ competence: 'structure' as Competence, regle: 'R2' as const, motif: '' },
    { competence: 'synthese' as Competence, regle: 'R5' as const, motif: '' }]
  const etats = [et('structure', { aProgresse: true }), et('synthese', { aProgresse: true })]
  const p = secondeInscriptionPA3(liste, etats)
  assert.equal(p?.competence, 'structure', 'la mieux placée dans l\'ordre de priorité')
  assert.equal(p?.regle, 'PA3')
  assert.equal(secondeInscriptionPA3(liste, [et('structure'), et('synthese')]), null,
    'sans progression, pas de seconde inscription')
})

// ── Le cas « Le canal bouché » (Annexe A) ──────────────────────────────────

test('« Le canal bouché » : Expression D, Quest. D, Argu C, Struct C — tronc commun', () => {
  const etats = [
    et('expression', { lettre: 'D', signal: 'D' }),
    et('questionnement', { lettre: 'D', signal: 'D' }),
    et('argumentation', { lettre: 'C', signal: 'C' }),
    et('structure', { lettre: 'C', signal: 'C' }),
  ]
  // « R1 EN EXERCICES — un exercice sur deux cible Expression. »
  const r1 = regimeR1('D', false, 0, 3)
  assert.equal(r1.actif, true)
  assert.equal(r1.part, 1 / 2)

  // « Les autres vont au trio, où LE QUESTIONNEMENT EST ÉLIGIBLE : Argumentation
  //   et Structure sont à C, SON SEUIL D'ENTRÉE EST FRANCHI. »
  assert.equal(questionnementEstEntre(etats), true)
  const r2 = elireR2(etats, [], ['tc'])
  assert.equal(r2.cible, 'questionnement', 'et il porte la plus basse du trio')

  // « Elle cesse d'être cible primaire à C, et sort de R1 à B. »
  assert.equal(regimeR1('C', false, 0, 3).actif, false)
  assert.equal(regimeR1('B', false, 0, 3).secondaireSurProduire, false)
})
