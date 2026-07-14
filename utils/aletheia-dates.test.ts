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
  classifierMode,
  estFullRangeExplicite,
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

// ── classifierMode (mode C) — matrice §9.5 : {direct × parcours × couverture} ──
// PUR, sans I/O ni gate. Encode l'invariant : un livre entier (A/B) ne devient jamais C.

function cr(debut: number | null, fin: number | null, parcoursId = 'p1') {
  return { parcoursId, debut, fin }
}
const S12 = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

test('classifierMode : S vide (livre non découpé) → A neutre, JAMAIS MALCONFIG', () => {
  const r = classifierMode(new Set(), false, [cr(3, 5)])
  assert.equal(r.mode, 'A')
  assert.deepEqual(r.exposees, [])
})

test('classifierMode : non gouverné + lien direct → A livre entier', () => {
  const r = classifierMode(new Set([1, 2, 3]), true, [])
  assert.equal(r.mode, 'A')
  assert.deepEqual(r.exposees, [1, 2, 3])
  assert.equal(r.complet, true)
})

test('classifierMode : non gouverné sans lien direct → A non exposé', () => {
  const r = classifierMode(new Set([1, 2, 3]), false, [])
  assert.equal(r.mode, 'A')
  assert.deepEqual(r.exposees, [])
  assert.equal(r.complet, false)
})

test('classifierMode : précédence directe prime sur un créneau partiel → B (jamais C)', () => {
  const r = classifierMode(S12, true, [cr(3, 7)])
  assert.equal(r.mode, 'B')
  assert.deepEqual(r.exposees, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
})

test('classifierMode : créneau (null,null) = livre entier → B', () => {
  assert.equal(classifierMode(S12, false, [cr(null, null)]).mode, 'B')
})

test('classifierMode : full-range explicite [1-12] → B (garde §9.3)', () => {
  assert.equal(classifierMode(S12, false, [cr(1, 12)]).mode, 'B')
})

test('classifierMode : B-distribué [1-6]+[7-12] (union = S) → B, PAS C', () => {
  const r = classifierMode(S12, false, [cr(1, 6, 'p1'), cr(7, 12, 'p1')])
  assert.equal(r.mode, 'B')
  assert.equal(r.complet, true)
})

test('classifierMode : sous-ensemble contigu [3-7] ⊊ S → C', () => {
  const r = classifierMode(S12, false, [cr(3, 7)])
  assert.equal(r.mode, 'C')
  assert.deepEqual(r.exposees, [3, 4, 5, 6, 7])
  assert.equal(r.complet, false)
  assert.equal(r.gouverneParcoursId, 'p1')
})

test('classifierMode : sous-ensemble non contigu [3]+[5]+[7] (même parcours) → C', () => {
  const r = classifierMode(S12, false, [cr(3, 3), cr(5, 5), cr(7, 7)])
  assert.equal(r.mode, 'C')
  assert.deepEqual(r.exposees, [3, 5, 7])
})

test('classifierMode : borne ouverte partielle (null,5) → couvre ≤5 → C', () => {
  const r = classifierMode(S12, false, [cr(null, 5)])
  assert.equal(r.mode, 'C')
  assert.deepEqual(r.exposees, [1, 2, 3, 4, 5])
})

test('classifierMode : bornes hors plage [20-25] → MALCONFIG', () => {
  const r = classifierMode(S12, false, [cr(20, 25)])
  assert.equal(r.mode, 'MALCONFIG')
  assert.deepEqual(r.exposees, [])
})

test('classifierMode : extrait couvert par 2 parcours distincts → MALCONFIG (§4.6)', () => {
  const r = classifierMode(S12, false, [cr(1, 3, 'p1'), cr(8, 10, 'p2')])
  assert.equal(r.mode, 'MALCONFIG')
})

test('estFullRangeExplicite : [1-N] vrai ; [1-5]/12 faux ; ne démarrant pas à ≤1 faux', () => {
  assert.equal(estFullRangeExplicite({ debut: 1, fin: 12 }, 12), true)
  assert.equal(estFullRangeExplicite({ debut: 1, fin: 5 }, 12), false)
  assert.equal(estFullRangeExplicite({ debut: 2, fin: 12 }, 12), false)
  assert.equal(estFullRangeExplicite({ debut: null, fin: null }, 12), false) // ouvert = géré séparément
})

test('INVARIANT §9.3 : aucun créneau full-range (ouvert ou explicite) ne donne mode C', () => {
  for (const creneaux of [[cr(null, null)], [cr(1, 12)], [cr(1, 20)], [cr(null, 12)]]) {
    assert.notEqual(classifierMode(S12, false, creneaux).mode, 'C')
  }
})
