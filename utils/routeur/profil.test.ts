// « Un état se stocke, UNE LECTURE SE RECALCULE » (`07-` §1). Les dérivées du §3
// et la règle d'espacement du §8.9.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  signalDeCiblage, fenetreDEvidence, historiqueDesCibles, ancienneteEnExercices,
  moinsRecemmentCiblee, estInciblable,
} from './profil'
import { ordonnerLesSondes, prioriteDe, estSondable, departagerParLeModeEnRetard,
  type CandidateSonde } from './sondes'
import { mesuresQuiComptent } from './mesure'
import type { Mesure } from './mesure'
import type { Competence, Palier } from './types'

let n = 0
function m(lettre: Palier | null, modes: string[] = ['composer'], p: Partial<Mesure> = {}): Mesure {
  n++
  return {
    id: `m${n}`, competence: 'questionnement', modes: modes as Mesure['modes'],
    lettreEquivalente: lettre, observables: null, lieu: 'maison', forme: 'formatif',
    classeId: null, genre: null, sondeMontee: false, distanceContexte: null, delaiJours: null,
    delaiMesures: null, deltaV1Vf: null, paireCorrectionJuste: null,
    paireNouveauCasDetecte: null, depotId: null, bonus: false, instrumentVersion: null,
    mesureAt: `2026-09-${String(n).padStart(2, '0')}T10:00:00Z`, ...p,
  }
}

// ── Le signal de ciblage ───────────────────────────────────────────────────

test('3 mesures du contexte → la MÉDIANE', () => {
  const s = signalDeCiblage([m('E', ['expliquer']), m('C', ['expliquer']), m('A', ['expliquer'])],
    'receptif', 'B')
  assert.equal(s.signal, 'C')
  assert.equal(s.source, 'mediane')
})

test('2 mesures → LA PLUS BASSE', () => {
  const s = signalDeCiblage([m('B', ['expliquer']), m('D', ['expliquer'])], 'receptif', 'A')
  assert.equal(s.signal, 'D')
  assert.equal(s.source, 'plus_basse')
})

test('1 mesure → ELLE-MÊME', () => {
  const s = signalDeCiblage([m('D', ['expliquer'])], 'receptif', 'A')
  assert.equal(s.signal, 'D')
  assert.equal(s.source, 'elle_meme')
})

test('0 mesure du contexte → LA VALEUR NON PLAFONNÉE en repli', () => {
  const s = signalDeCiblage([m('A', ['composer'])], 'receptif', 'D')
  assert.equal(s.signal, 'D', 'la mesure `composer` n\'appartient pas au groupe réceptif')
  assert.equal(s.source, 'repli')
})

test('AUCUN groupe réclamé → le repli, sans détour', () => {
  const s = signalDeCiblage([m('A', ['expliquer'])], null, 'E')
  assert.equal(s.signal, 'E')
  assert.equal(s.source, 'repli')
})

test('LES GROUPES SE RECOUVRENT : « composer ET interroger » compte dans les deux', () => {
  const mesure = [m('D', ['composer', 'interroger'])]
  assert.equal(signalDeCiblage(mesure, 'interroger', 'A').signal, 'D')
  assert.equal(signalDeCiblage(mesure, 'composition', 'A').signal, 'D')
  assert.equal(signalDeCiblage(mesure, 'receptif', 'A').signal, 'A', 'mais pas dans le réceptif')
})

test('le signal ne lit QUE LES TROIS DERNIÈRES du contexte', () => {
  const s = signalDeCiblage(
    [m('E', ['expliquer']), m('A', ['expliquer']), m('A', ['expliquer']), m('A', ['expliquer'])],
    'receptif', 'C')
  assert.equal(s.signal, 'A', 'le vieux E est hors des trois dernières')
})

test('une mesure sans lettre-équivalente ne compte pas dans le signal', () => {
  const s = signalDeCiblage([m(null, ['expliquer']), m('D', ['expliquer'])], 'receptif', 'A')
  assert.equal(s.signal, 'D')
  assert.equal(s.source, 'elle_meme')
})

// ── Ce qui entre dans les dérivées ─────────────────────────────────────────

test('les mesures ANTÉRIEURES À LA RECETTE ne comptent pas', () => {
  const vieille = m('E', ['expliquer'], { mesureAt: '2026-01-01T00:00:00Z' })
  const neuve = m('A', ['expliquer'], { mesureAt: '2026-10-01T00:00:00Z' })
  const gardees = mesuresQuiComptent([vieille, neuve], '2026-06-01T00:00:00Z')
  assert.equal(gardees.length, 1)
  assert.equal(gardees[0].lettreEquivalente, 'A')
})

test('les SONDES DE MONTÉE sont hors de tout — acquisition et signal compris', () => {
  const sonde = m('A', ['expliquer'], { sondeMontee: true })
  assert.deepEqual(mesuresQuiComptent([sonde], null), [])
})

test('la fenêtre d\'évidence garde LES QUATRE DERNIÈRES, dans l\'ordre', () => {
  const lot = [m('E'), m('D'), m('C'), m('B'), m('A')]
  const f = fenetreDEvidence(lot)
  assert.equal(f.length, 4)
  assert.deepEqual(f.map((x) => x.lettreEquivalente), ['D', 'C', 'B', 'A'])
})

// ── L'historique des cibles — « jamais une seconde liste » ─────────────────

test('l\'historique se LIT sur les décisions, dans l\'ordre chronologique', () => {
  const h = historiqueDesCibles([
    { cibleRetenue: 'structure', cycleLundi: '2026-09-07', createdAt: '2026-09-07T09:00:00Z', bonus: false },
    { cibleRetenue: null, cycleLundi: '2026-09-07', createdAt: '2026-09-07T10:00:00Z', bonus: false },
    { cibleRetenue: 'expression', cycleLundi: '2026-09-14', createdAt: '2026-09-14T09:00:00Z', bonus: false },
  ])
  assert.deepEqual(h, ['structure', 'expression'], 'les décisions sans cible ne comptent pas')
})

test('l\'ancienneté se compte SUR TOUS LES EXERCICES, et vaut null si jamais ciblée', () => {
  const h: Competence[] = ['argumentation', 'structure', 'expression', 'structure']
  assert.equal(ancienneteEnExercices(h, 'structure'), 0, 'la dernière')
  assert.equal(ancienneteEnExercices(h, 'expression'), 1)
  assert.equal(ancienneteEnExercices(h, 'argumentation'), 3)
  assert.equal(ancienneteEnExercices(h, 'synthese'), null)
})

test('« la moins récemment ciblée » : jamais ciblée passe DEVANT toutes les autres', () => {
  const h: Competence[] = ['argumentation', 'structure']
  assert.deepEqual(moinsRecemmentCiblee(h, ['argumentation', 'structure', 'synthese']), ['synthese'])
  assert.deepEqual(moinsRecemmentCiblee(h, ['argumentation', 'structure']), ['argumentation'])
})

test('sans lettre : inciblable, et cela ne se lit JAMAIS par groupe', () => {
  assert.equal(estInciblable(null), true)
  assert.equal(estInciblable('E'), false)
})

// ── §8.9 — qui sonder, et dans quel ordre ──────────────────────────────────

const cand = (o: Partial<CandidateSonde> & { competence: Competence }): CandidateSonde => ({
  statutRecette: 'evaluee', lettreAffichee: 'C', enEntretienN3: false,
  delaiMesures: 1, delaiJours: 1, semainesDepuisVerification: null, ...o,
})
const premier = (x: readonly Competence[]) => x[0]

test('éligibilité : `evaluee` OU `mesuree_silencieusement`, jamais `differee`', () => {
  assert.equal(estSondable('evaluee'), true)
  assert.equal(estSondable('mesuree_silencieusement'), true)
  assert.equal(estSondable('differee'), false)
})

test('priorité 1 — le RÉGIME D\'ENTRETIEN N3 passe devant tout', () => {
  assert.equal(prioriteDe(cand({ competence: 'structure', enEntretienN3: true })), 1)
})

test('priorité 2 — palier cible ATTEINT (lettre AFFICHÉE ≥ B) et non vérifié depuis > 5 semaines', () => {
  assert.equal(prioriteDe(cand({ competence: 'structure', lettreAffichee: 'B',
    semainesDepuisVerification: 6 })), 2)
  assert.equal(prioriteDe(cand({ competence: 'structure', lettreAffichee: 'B',
    semainesDepuisVerification: 5 })), 3, '5 semaines, ce n\'est pas PLUS DE 5')
  assert.equal(prioriteDe(cand({ competence: 'structure', lettreAffichee: 'C',
    semainesDepuisVerification: 20 })), 3, 'C n\'a pas atteint le palier cible')
  assert.equal(prioriteDe(cand({ competence: 'structure', lettreAffichee: null,
    semainesDepuisVerification: 20 })), 3, 'sans lettre, aucun palier atteint')
})

test('priorité 3 — la PLUS ANCIENNEMENT MESURÉE : max de `delai_mesures`', () => {
  const o = ordonnerLesSondes([
    cand({ competence: 'structure', delaiMesures: 2 }),
    cand({ competence: 'argumentation', delaiMesures: 9 }),
  ], premier)
  assert.equal(o[0].competence, 'argumentation')
  assert.equal(o[0].motif, 'plus_anciennement_mesuree')
})

test('à égalité de `delai_mesures`, on départage par `delai_jours`', () => {
  const o = ordonnerLesSondes([
    cand({ competence: 'structure', delaiMesures: 3, delaiJours: 5 }),
    cand({ competence: 'argumentation', delaiMesures: 3, delaiJours: 40 }),
  ], premier)
  assert.equal(o[0].competence, 'argumentation')
  assert.equal(o[0].tirage, false)
})

test('à égalité PERSISTANTE : tirage, ET IL SE JOURNALISE', () => {
  const o = ordonnerLesSondes([
    cand({ competence: 'structure', delaiMesures: 3, delaiJours: 5 }),
    cand({ competence: 'argumentation', delaiMesures: 3, delaiJours: 5 }),
  ], (x) => x[1])
  assert.equal(o[0].competence, 'argumentation', 'le tirage injecté décide')
  assert.equal(o[0].tirage, true)
  assert.equal(o[0].motif, 'tirage')
})

test('une compétence n\'est sondée QU\'UNE FOIS PAR CYCLE', () => {
  const o = ordonnerLesSondes([cand({ competence: 'structure' })], premier)
  assert.equal(o.length, 1)
  assert.equal(o.filter((s) => s.competence === 'structure').length, 1)
})

test('PLAFOND DE SONDES PAR CYCLE : 4 — « c\'est lui qui borne la facture »', () => {
  const six: Competence[] = ['expression', 'argumentation', 'structure', 'connaissance',
    'synthese', 'questionnement']
  const o = ordonnerLesSondes(six.map((c, i) => cand({ competence: c, delaiMesures: 10 - i })),
    premier)
  assert.equal(o.length, 4)
})

test('les non éligibles ne sont jamais classées', () => {
  const o = ordonnerLesSondes([
    cand({ competence: 'structure', statutRecette: 'differee', delaiMesures: 99 }),
    cand({ competence: 'argumentation', delaiMesures: 1 }),
  ], premier)
  assert.deepEqual(o.map((s) => s.competence), ['argumentation'])
})

test('une compétence JAMAIS mesurée (delai null) passe devant — sa dette est infinie', () => {
  const o = ordonnerLesSondes([
    cand({ competence: 'structure', delaiMesures: 99 }),
    cand({ competence: 'synthese', delaiMesures: null }),
  ], premier)
  assert.equal(o[0].competence, 'synthese')
})

test('le §7 mord ici aussi : à égalité, LE MODE LE PLUS EN RETARD', () => {
  const r = departagerParLeModeEnRetard(['structure', 'argumentation'],
    (c) => (c === 'argumentation' ? 0.3 : 0.1))
  assert.deepEqual(r, ['argumentation'])
})
