// Le Monitoring. Deux valeurs se ressemblent et ne disent pas la même chose :
//   · `indetermine` — UN CÔTÉ DE LA COMPARAISON MANQUE ; il « n'attend rien »,
//     et il restera vrai après la table de conversion ;
//   · `n/a` — la table de conversion n'est pas écrite ; le jour où elle arrive,
//     le calcul cesse de le rendre.
// Et le taux de lucidité a un DÉNOMINATEUR RESTREINT : vide → NULL, jamais 0.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  accordCredenceReussite, calibrationDe, competencesQuiComptent, FENETRE_LUCIDITE,
  NA, TABLE_DE_CONVERSION_ECRITE, tauxDeLucidite,
} from './monitoring-calcul'

test('la table de conversion n\'est pas écrite — c\'est l\'état déclaré de la fiche (§9)', () => {
  assert.equal(TABLE_DE_CONVERSION_ECRITE, false)
})

test('les trois cas d\'`indetermine` — un côté manquant ne produit JAMAIS de verdict', () => {
  assert.equal(calibrationDe({ competence: 'structure', confiance: null, niveau: 'B' }).calibration, 'indetermine')
  assert.equal(calibrationDe({ competence: 'structure', confiance: 'non_exprimee', niveau: 'B' }).calibration, 'indetermine')
  assert.equal(calibrationDe({ competence: 'structure', confiance: 'elevee', niveau: null }).calibration, 'indetermine')
  assert.equal(calibrationDe({
    competence: 'structure', confiance: 'elevee', niveau: 'B', affirmeUnObservableAbsent: true,
  }).calibration, 'indetermine')
})

test('les deux côtés présents : `n/a` sur les trois formes, et la collecte continue', () => {
  const r = calibrationDe({ competence: 'structure', confiance: 'elevee', niveau: 'D' })
  assert.deepEqual([r.calibration, r.amplitude, r.direction], [NA, NA, NA])
  assert.match(r.motif ?? '', /table de conversion/)
})

test('la calibration NE COMPTE QUE sur les `evaluee`, et enregistre lesquelles ont compté', () => {
  const { retenues, ecartees } = competencesQuiComptent(
    [
      { competence: 'expression', confiance: 'elevee', niveau: 'C' },
      { competence: 'synthese', confiance: 'faible', niveau: 'D' },
    ],
    { expression: 'evaluee', synthese: 'mesuree_silencieusement' },
  )
  assert.deepEqual(retenues.map((r) => r.competence), ['expression'])
  assert.deepEqual(ecartees.map((e) => e.competence), ['synthese'])
})

// ── La lucidité ────────────────────────────────────────────────────────────

test('la fenêtre vaut CINQ exercices, comptés en exercices', () => {
  assert.equal(FENETRE_LUCIDITE, 5)
})

test('l\'élève qui n\'a rien raté a un dénominateur VIDE → taux NULL, jamais 0', () => {
  const r = tauxDeLucidite([
    { auMoinsUnEchec: false, aveu: 'tout_lisse', supposition: 'tout_assertif' },
    { auMoinsUnEchec: false, aveu: 'tout_lisse', supposition: 'tout_assertif' },
  ])
  assert.equal(r.taux, null)
  assert.equal(r.denominateur, 0)
})

test('le dénominateur est RESTREINT aux exercices où le squelette montre un échec', () => {
  const r = tauxDeLucidite([
    { auMoinsUnEchec: true, aveu: 'signale', supposition: 'tout_assertif' },
    { auMoinsUnEchec: true, aveu: 'tout_lisse', supposition: 'tout_assertif' },
    { auMoinsUnEchec: false, aveu: 'tout_lisse', supposition: 'tout_assertif' },
  ])
  assert.deepEqual([r.numerateur, r.denominateur, r.taux], [1, 2, 0.5])
})

test('l\'aveu OU la supposition suffit — les deux marques sont indépendantes', () => {
  const r = tauxDeLucidite([{ auMoinsUnEchec: true, aveu: 'tout_lisse', supposition: 'distingue' }])
  assert.equal(r.taux, 1)
})

test('la fenêtre ne garde que les CINQ derniers exercices', () => {
  const six = Array.from({ length: 6 }, (_, i) => ({
    auMoinsUnEchec: true,
    aveu: (i === 0 ? 'signale' : 'tout_lisse') as 'signale' | 'tout_lisse',
    supposition: 'tout_assertif' as const,
  }))
  // Le seul « signale » est le PLUS ANCIEN : hors fenêtre, le taux tombe à 0.
  assert.equal(tauxDeLucidite(six).taux, 0)
})

// ── La porte 2 ─────────────────────────────────────────────────────────────

test('la porte 2 verse LES INGRÉDIENTS, jamais un verdict — aucun seuil inventé', () => {
  // « Sûr et juste → bien calibré · sûr et faux → surconfiant » (fiche §4) ne
  // porte AUCUN chiffre : où commence « sûr » n'est écrit nulle part. On garde
  // donc la crédence portée et la justesse, et le label attendra sa table (§9).
  const juste = accordCredenceReussite({ forme: 'repartition', jetons: [85, 5, 5, 5], indexCorrect: 0 })
  assert.deepEqual([juste.credence_portee, juste.reussi], [0.85, true])
  const faux = accordCredenceReussite({ forme: 'repartition', jetons: [5, 85, 5, 5], indexCorrect: 0 })
  // La charge se lit sur LA RÉPONSE DONNÉE — le candidat le plus chargé.
  assert.deepEqual([faux.credence_portee, faux.reussi], [0.85, false])
  assert.equal('sens' in juste, false)
})

test('crédence en POURCENTAGE : la crédence portée et la justesse se conservent', () => {
  const r = accordCredenceReussite({ forme: 'pourcentage', pourcentage: 20, reussi: true })
  assert.deepEqual([r.credence_portee, r.reussi], [0.2, true])
  assert.equal(r.score < 10, true)
})

test('le score de la porte 2 est sur la MÊME échelle que celui de Quazian', () => {
  // Un lot RÉUTILISE `utils/brier.ts`, il n'en crée pas un second.
  assert.equal(accordCredenceReussite({ forme: 'repartition', jetons: [100, 0, 0, 0], indexCorrect: 0 }).score, 10)
  assert.equal(accordCredenceReussite({ forme: 'pourcentage', pourcentage: 100, reussi: true }).score, 10)
  assert.equal(accordCredenceReussite({ forme: 'pourcentage', pourcentage: 100, reussi: false }).score, -10)
})
