// Tests de la RÈGLE « quelles semaines Fragments a-t-il réclamées » (C8 · L4,
// fonctions PURES). Exécution : `npm test`. Encode ce que le lot décide :
//  (1) l'état NEUTRE (seuil 1) rend exactement le comportement d'avant le lot ;
//  (2) les semaines sous le seuil sortent — présentation, choix des sujets ;
//  (3) les VACANCES sortent toujours, seuil ou pas (défaut adjacent fermé) ;
//  (4) ⭐ une semaine de vacances GARDE son ancien `numero` : le filtre des
//      vacances doit donc passer AVANT celui du numéro, sinon elle rentre ;
//  (5) une valeur de paramètre illisible retombe sur l'état neutre, jamais sur
//      un comptage inventé ;
//  (6) la frontière est le seuil LUI-MÊME : la semaine 3 compte, la 2 non.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PREMIERE_SEMAINE_DEFAUT,
  estSemaineComptee,
  mentionPremiereSemaine,
  premiereSemaineComptee,
  semainesComptees,
  type SemaineComptable,
} from './fragments-semaines'

/** Une semaine de travail. */
const t = (numero: number): SemaineComptable => ({ numero, is_vacation: false })
/** Une semaine de vacances — elle garde le numéro qu'elle avait avant. */
const v = (numero: number): SemaineComptable => ({ numero, is_vacation: true })

/** Un semestre réaliste : 6 semaines de travail, une semaine de vacances au milieu. */
const SEMESTRE: SemaineComptable[] = [t(1), t(2), t(3), v(4), t(4), t(5), t(6)]

// ── (1) L'état neutre ────────────────────────────────────────────────────────

test('seuil 1 : toutes les semaines de travail comptent, les vacances non', () => {
  const out = semainesComptees(SEMESTRE, PREMIERE_SEMAINE_DEFAUT)
  assert.equal(out.length, 6)
  assert.ok(out.every((s) => s.is_vacation === false))
})

// ── (2) Le décalage ──────────────────────────────────────────────────────────

test('seuil 3 (semestre 1) : les deux premières semaines sortent', () => {
  const out = semainesComptees(SEMESTRE, 3)
  assert.deepEqual(out.map((s) => s.numero), [3, 4, 5, 6])
})

test('seuil 2 (semestre 2) : seule la première semaine sort', () => {
  const out = semainesComptees(SEMESTRE, 2)
  assert.deepEqual(out.map((s) => s.numero), [2, 3, 4, 5, 6])
})

// ── (3) et (4) Les vacances, et l'ordre des deux filtres ────────────────────

test('une semaine de vacances ne compte jamais, quel que soit le seuil', () => {
  for (const seuil of [1, 2, 3, 10]) {
    assert.equal(estSemaineComptee(v(5), seuil), false, `seuil ${seuil}`)
  }
})

test('⭐ un numéro PÉRIMÉ resté sur une semaine de vacances ne la fait pas entrer', () => {
  // AVANT le correctif `c8_l4_numero_vacances.sql`, `synchroniserSemaines` ne
  // remettait à null que `pedagogical_number` — `numero` était `not null` et
  // gardait sa valeur. Constaté en base le 25/08 : les numéros 10, 13, 14 et 17
  // du semestre actif existaient DEUX fois, une fois en travail et une fois en
  // vacances, et le graphique d'un élève affichait « S10 S10 … S13 S13 ».
  // ⚠️ Le correctif nettoie la base, mais la RÈGLE doit tenir sans lui : elle
  // filtre les vacances AVANT de comparer les numéros, et c'est ce qui est
  // éprouvé ici. Une base non migrée reste donc comptée juste.
  const grilleAvantCorrectif: SemaineComptable[] = [t(9), v(10), t(10), t(11)]
  const out = semainesComptees(grilleAvantCorrectif, 3)
  assert.deepEqual(out.map((s) => s.numero), [9, 10, 11])
  assert.equal(out.filter((s) => s.numero === 10).length, 1)
})

test('⭐ et APRÈS le correctif — vacances à numéro `null` — le compte est le même', () => {
  // La grille telle que `synchroniserSemaines` l'écrit désormais : une semaine de
  // vacances n'a de numéro dans AUCUNE des deux colonnes. Le résultat doit être
  // rigoureusement identique au cas précédent — sans quoi le correctif de base
  // changerait un comptage, ce qu'il n'a pas le droit de faire.
  const grilleApresCorrectif: SemaineComptable[] = [
    t(9), { numero: null, is_vacation: true }, t(10), t(11),
  ]
  const out = semainesComptees(grilleApresCorrectif, 3)
  assert.deepEqual(out.map((s) => s.numero), [9, 10, 11])
})

// ── (5) Le repli ─────────────────────────────────────────────────────────────

test('un paramètre illisible retombe sur l’état neutre', () => {
  for (const mauvais of [null, undefined, 0, -3, 2.5, NaN, 'trois', {}]) {
    assert.equal(premiereSemaineComptee(mauvais), PREMIERE_SEMAINE_DEFAUT)
  }
  // Et la conséquence à l'usage : on compte tout, on n'invente rien.
  assert.equal(semainesComptees(SEMESTRE, null as unknown as number).length, 6)
})

test('une semaine sans numéro ne se compare pas, donc ne compte pas', () => {
  assert.equal(estSemaineComptee({ numero: null, is_vacation: false }, 1), false)
})

// ── (6) La frontière, isolée ─────────────────────────────────────────────────

test('la frontière est le seuil lui-même : >= et non >', () => {
  assert.equal(estSemaineComptee(t(2), 3), false)
  assert.equal(estSemaineComptee(t(3), 3), true)
  assert.equal(estSemaineComptee(t(4), 3), true)
})

// ── La mention d'écran ───────────────────────────────────────────────────────

test('la mention se tait à l’état neutre et parle sinon', () => {
  assert.equal(mentionPremiereSemaine(1), null)
  assert.equal(mentionPremiereSemaine(null), null)
  assert.equal(mentionPremiereSemaine(3), 'Fragments compte à partir de la semaine 3')
})
