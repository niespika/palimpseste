// Tests de garde du résolveur de dates Aletheia « mode b » (fonctions PURES).
// Exécution : `npm test`. Encode les 2 correctifs BLOQUANTS des contre-épreuves :
//  (1) une date n'est portée que par statut === 'definie' (PAS 'resolue') ;
//  (2) l'aperçu porte le LUNDI → échéance = DIMANCHE = +6.
// + tie-break de spécificité, drapeau `ambigu`, cas de bord.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  couvre,
  echeanceDepuisApercu,
  resoudreDepuisCandidats,
  formatEcheanceFr,
  type ApercuSemaine,
  type CandidatCreneau,
} from './aletheia-dates'

// Aperçu où la semaine de parcours 1 est résolue au LUNDI 2026-09-21.
const APERCU: ApercuSemaine[] = [
  { semaine: 1, dateReelle: '2026-09-21', statut: 'definie', semestreNom: 'S1', pedaDansSemestre: 3 },
  { semaine: 2, dateReelle: '2026-09-28', statut: 'definie', semestreNom: 'S1', pedaDansSemestre: 4 },
  { semaine: 3, dateReelle: null, statut: 'a_definir', semestreNom: null, pedaDansSemestre: null },
  { semaine: 4, dateReelle: null, statut: 'non_planifiable', semestreNom: null, pedaDansSemestre: null },
]

function candidat(over: Partial<CandidatCreneau> = {}): CandidatCreneau {
  return {
    creneauId: 'c1', parcoursId: 'p1', semParcours: 1,
    debut: null, fin: null, apercu: APERCU, source: 'snapshot', ...over,
  }
}

// ── Convention de date : lundi → dimanche (+6), statut 'definie' ──────────────

test('échéance = DIMANCHE : lundi 2026-09-21 (semaine 1) → 2026-09-27', () => {
  assert.equal(echeanceDepuisApercu(APERCU, 1), '2026-09-27')
  assert.equal(echeanceDepuisApercu(APERCU, 2), '2026-10-04') // 09-28 + 6
})

test('BLOQUANT : seul statut "definie" porte une date (a_definir / non_planifiable → null)', () => {
  assert.equal(echeanceDepuisApercu(APERCU, 3), null) // a_definir
  assert.equal(echeanceDepuisApercu(APERCU, 4), null) // non_planifiable
})

test('BLOQUANT : un statut "resolue" (interne frise, jamais dans un snapshot) NE matche pas', () => {
  // Anti-régression : si le résolveur testait 'resolue', un snapshot ('definie')
  // ne matcherait jamais. On vérifie qu'une entrée 'resolue' factice est ignorée.
  const faux = [{ semaine: 1, dateReelle: '2026-09-21', statut: 'resolue' as unknown as 'definie', semestreNom: null, pedaDansSemestre: null }]
  assert.equal(echeanceDepuisApercu(faux, 1), null)
})

test('semaine de parcours absente de l’aperçu → null (créneau hors nb_semaines)', () => {
  assert.equal(echeanceDepuisApercu(APERCU, 99), null)
})

// ── Couverture de tranche ────────────────────────────────────────────────────

test('couvre : livre entier (null,null) couvre toute séance', () => {
  assert.equal(couvre({ debut: null, fin: null }, 1), true)
  assert.equal(couvre({ debut: null, fin: null }, 42), true)
})

test('couvre : tranche fermée [3,5]', () => {
  assert.equal(couvre({ debut: 3, fin: 5 }, 2), false)
  assert.equal(couvre({ debut: 3, fin: 5 }, 3), true)
  assert.equal(couvre({ debut: 3, fin: 5 }, 5), true)
  assert.equal(couvre({ debut: 3, fin: 5 }, 6), false)
})

test('couvre : bornes ouvertes [3,null] et [null,5]', () => {
  assert.equal(couvre({ debut: 3, fin: null }, 2), false)
  assert.equal(couvre({ debut: 3, fin: null }, 999), true)
  assert.equal(couvre({ debut: null, fin: 5 }, 5), true)
  assert.equal(couvre({ debut: null, fin: 5 }, 6), false)
})

// ── Résolution multi-candidats ───────────────────────────────────────────────

test('un seul créneau couvrant → sa date + source, ambigu false', () => {
  const r = resoudreDepuisCandidats([candidat({ debut: 3, fin: 5, semParcours: 1 })], 4)
  assert.equal(r.valeur, '2026-09-27')
  assert.equal(r.source, 'snapshot')
  assert.equal(r.ambigu, false)
})

test('aucun créneau couvrant → null (mode a / séance non couverte)', () => {
  const r = resoudreDepuisCandidats([candidat({ debut: 3, fin: 5 })], 9)
  assert.deepEqual(r, { valeur: null, source: null, ambigu: false })
})

test('deux créneaux, MÊME date → ambigu false ; tranche la plus spécifique gagne', () => {
  const large = candidat({ creneauId: 'A', debut: null, fin: null, semParcours: 1 })       // livre entier, date 09-27
  const precis = candidat({ creneauId: 'B', debut: 4, fin: 4, semParcours: 1 })             // tranche [4,4], date 09-27
  const r = resoudreDepuisCandidats([large, precis], 4)
  assert.equal(r.ambigu, false)
  assert.equal(r.valeur, '2026-09-27')
  assert.equal(r.source, 'snapshot')
})

test('deux créneaux, dates DIFFÉRENTES → ambigu true ; tranche la plus spécifique gagne', () => {
  const large = candidat({ creneauId: 'A', debut: null, fin: null, semParcours: 2 })        // livre entier → 10-04
  const precis = candidat({ creneauId: 'B', debut: 4, fin: 4, semParcours: 1 })             // tranche [4,4] → 09-27
  const r = resoudreDepuisCandidats([large, precis], 4)
  assert.equal(r.ambigu, true)
  assert.equal(r.valeur, '2026-09-27') // la tranche [4,4] (plus spécifique) l'emporte
})

test('à spécificité égale et dates différentes → date la plus PRÉCOCE', () => {
  const tot = APERCU
  const a = candidat({ creneauId: 'A', parcoursId: 'pA', debut: 4, fin: 4, semParcours: 2, apercu: tot }) // 10-04
  const b = candidat({ creneauId: 'B', parcoursId: 'pB', debut: 4, fin: 4, semParcours: 1, apercu: tot }) // 09-27
  const r = resoudreDepuisCandidats([a, b], 4)
  assert.equal(r.ambigu, true)
  assert.equal(r.valeur, '2026-09-27') // précoce
})

test('source frise remontée quand le candidat gagnant vient de la frise', () => {
  const r = resoudreDepuisCandidats([candidat({ source: 'frise', debut: 1, fin: 1, semParcours: 1 })], 1)
  assert.equal(r.source, 'frise')
})

// ── Formatage ────────────────────────────────────────────────────────────────

test('formatEcheanceFr : ISO → JJ/MM/AAAA', () => {
  assert.equal(formatEcheanceFr('2026-09-27'), '27/09/2026')
  assert.equal(formatEcheanceFr(''), '')
  assert.equal(formatEcheanceFr(null), '')
})
