// Tests du moteur pur du plan d'évaluation (fonctions pures, aucune I/O).
// Exécution : `npm test` (node --test + hook de résolution TS, aucune dépendance).
// Couvre la cadence E→E→L (G2), le placement des diagnostics (G3) et le budget (§7.3).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  genererCadence,
  placerDiagnostics,
  budgetSemaine,
} from './plan-cadence'
import type { SemaineEnseignement } from './frise-enseignement'

// ── Fixtures : construction directe de semaines de frise (lundis) ────────────
function lundiPlus6(lundi: string): string {
  const d = new Date(lundi + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 6)
  return d.toISOString().slice(0, 10)
}
function mkFrise(lundis: string[]): SemaineEnseignement[] {
  return lundis.map((l, i) => ({
    indexContinu: i + 1,
    semestreId: 's',
    semestreNom: 'S',
    pedagogicalNumber: i + 1,
    dateDebutLundi: l,
    dateFinDimanche: lundiPlus6(l),
  }))
}

const QUATRE_SEMAINES = mkFrise(['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28'])

// ── genererCadence (G2) ──────────────────────────────────────────────────────
test('cadence TC : cycle écriture→écriture→lecture, maison formatif', () => {
  const ex = genererCadence(QUATRE_SEMAINES, 'tc', {})
  assert.equal(ex.length, 4)
  assert.deepEqual(ex.map((e) => e.type_exercice), ['ecriture', 'ecriture', 'lecture', 'ecriture'])
  assert.ok(ex.every((e) => e.lieu === 'maison' && e.nature === 'formatif' && e.origine === 'cadence' && !e.diagnostique))
  assert.equal(ex[0].module, 'codex') // écriture → Codex
  assert.equal(ex[2].module, 'aletheia') // lecture → Aletheia
  assert.equal(ex[0].semaine_lundi, '2026-09-07')
  assert.equal(ex[3].semaine_lundi, '2026-09-28')
})

test('cadence HLP : même cycle que TC (la double piste fragment/lecture n’est PAS générée)', () => {
  const ex = genererCadence(QUATRE_SEMAINES, 'hlp', {})
  assert.deepEqual(ex.map((e) => e.type_exercice), ['ecriture', 'ecriture', 'lecture', 'ecriture'])
})

test('cadence vierge : rien', () => {
  assert.deepEqual(genererCadence(QUATRE_SEMAINES, 'vierge', {}), [])
})

test('cadence : cycle personnalisé de config', () => {
  const ex = genererCadence(QUATRE_SEMAINES, 'tc', { cycle: ['lecture', 'ecriture'] })
  assert.deepEqual(ex.map((e) => e.type_exercice), ['lecture', 'ecriture', 'lecture', 'ecriture'])
})

test('cadence : cycle vide → repli sur le cycle par défaut E→E→L', () => {
  const ex = genererCadence(QUATRE_SEMAINES, 'tc', { cycle: [] })
  assert.deepEqual(ex.map((e) => e.type_exercice), ['ecriture', 'ecriture', 'lecture', 'ecriture'])
})

test('cadence : un type de cadence hors {ecriture,lecture} est rejeté (défense jsonb)', () => {
  // Simule un config.cycle malformé venu du jsonb (cast pour contourner le type TS) :
  // sans la garde runtime, le tuple {quiz,formatif,maison} violerait exercices_typologie_chk.
  assert.throws(
    () => genererCadence(QUATRE_SEMAINES, 'tc', { cycle: ['quiz'] as unknown as ('ecriture' | 'lecture')[] }),
    /Cycle de cadence invalide/,
  )
})

test('cadence : le cycle redémarre au début du tableau (R1, régénération scopée)', () => {
  // L'appelant tranche la frise à aPartirDe → l'index 0 est la 1re semaine générée.
  const queue = mkFrise(['2026-11-02', '2026-11-09', '2026-11-16'])
  const ex = genererCadence(queue, 'tc', {})
  assert.deepEqual(ex.map((e) => e.type_exercice), ['ecriture', 'ecriture', 'lecture'])
})

// ── placerDiagnostics (G3) ───────────────────────────────────────────────────
const FRISE_ANNEE = mkFrise([
  '2026-09-07', '2026-09-14', '2026-09-21', // septembre 2026
  '2026-12-07', '2026-12-14',               // décembre 2026
  '2027-02-02', '2027-02-09', '2027-02-16', // février 2027
])

test('diagnostics : 3 fenêtres × (écriture + lecture), aux bons mois/années', () => {
  const diag = placerDiagnostics(FRISE_ANNEE, 2026, '2026-09-01')
  assert.equal(diag.length, 6)
  assert.ok(diag.every((d) => d.nature === 'evaluatif' && d.lieu === 'classe' && d.diagnostique && d.origine === 'diagnostic'))

  const trouve = (f: string, t: string) =>
    diag.find((d) => d.fenetre_diagnostique === f && d.type_exercice === t)!.semaine_lundi

  // septembre (AY 2026) : écriture → 1re candidate, lecture → 2e
  assert.equal(trouve('septembre', 'ecriture'), '2026-09-07')
  assert.equal(trouve('septembre', 'lecture'), '2026-09-14')
  // décembre (AY 2026)
  assert.equal(trouve('decembre', 'ecriture'), '2026-12-07')
  assert.equal(trouve('decembre', 'lecture'), '2026-12-14')
  // février (AY+1 = 2027)
  assert.equal(trouve('fevrier', 'ecriture'), '2027-02-02')
  assert.equal(trouve('fevrier', 'lecture'), '2027-02-09')

  // modules : écriture diagnostique → Codex, lecture diagnostique → Aletheia
  assert.equal(diag.find((d) => d.type_exercice === 'ecriture')!.module, 'codex')
  assert.equal(diag.find((d) => d.type_exercice === 'lecture')!.module, 'aletheia')
})

test('diagnostics : une seule semaine candidate → écriture ET lecture la même semaine', () => {
  const friseUn = mkFrise(['2026-12-14']) // décembre seul, une semaine
  const diag = placerDiagnostics(friseUn, 2026, '2026-09-01')
  assert.equal(diag.length, 2) // seul décembre a une candidate ; sept & fév non générés
  assert.ok(diag.every((d) => d.fenetre_diagnostique === 'decembre' && d.semaine_lundi === '2026-12-14'))
})

test('diagnostics : fenêtre antérieure à l’ancre non générée (classe créée en cours d’année)', () => {
  // Ancre 2027-01-15 → septembre & décembre 2026 dans le passé, seul février généré.
  const diag = placerDiagnostics(FRISE_ANNEE, 2026, '2027-01-15')
  assert.equal(diag.length, 2)
  assert.ok(diag.every((d) => d.fenetre_diagnostique === 'fevrier'))
})

test('diagnostics : aucune candidate dans aucune fenêtre → rien', () => {
  const friseOctobre = mkFrise(['2026-10-05', '2026-10-12']) // hors des 3 fenêtres
  assert.deepEqual(placerDiagnostics(friseOctobre, 2026, '2026-09-01'), [])
})

test('diagnostics : semaine à cheval nov/déc rattachée au mois du LUNDI (fige la sémantique)', () => {
  // Lundi 2026-11-30, dimanche 2026-12-06 : le lundi est en novembre → la semaine
  // n'est PAS candidate pour la fenêtre 'decembre' (mois du lundi, pas du dimanche).
  const frise = mkFrise(['2026-11-30'])
  assert.equal(frise[0].dateFinDimanche, '2026-12-06') // sanity : la semaine chevauche bien décembre
  assert.deepEqual(placerDiagnostics(frise, 2026, '2026-09-01'), []) // aucune fenêtre n'a de candidate
})

// ── budgetSemaine (§7.3) ─────────────────────────────────────────────────────
test('budget TC : flashcards + 1 écriture = cible atteinte, pas de dépassement', () => {
  const b = budgetSemaine(['ecriture'], 0, false, 'tc')
  assert.deepEqual([b.min, b.max], [45, 60]) // [15,20] + [30,40]
  assert.deepEqual([b.cibleMin, b.cibleMax], [45, 60])
  assert.equal(b.depasse, false) // 60 > 60 est faux
})

test('budget HLP : écriture + lecture de livre + fragment écrit → dépassement', () => {
  const b = budgetSemaine(['ecriture'], 1, true, 'hlp')
  // min = 15 + 30 + 30 + 30 = 105 ; max = 20 + 40 + 30 + 30 = 120 ; cible [60,90]
  assert.deepEqual([b.min, b.max], [105, 120])
  assert.equal(b.depasse, true)
})

test('budget vierge : aucune cible, jamais de dépassement', () => {
  const b = budgetSemaine([], 0, false, 'vierge')
  assert.equal(b.cibleMin, null)
  assert.equal(b.cibleMax, null)
  assert.equal(b.depasse, false)
})
