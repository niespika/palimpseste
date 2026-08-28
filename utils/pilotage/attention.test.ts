// Le canal d'attention : la FORME COMMUNE des quatre drapeaux, l'ORDRE de la
// page, et les deux comptes qui ne se confondent pas — la répétition d'un côté,
// l'examen humain de l'autre.
//
// ⛔ « Ni plafond ni file d'attente » (`01-` §8.4) est une contrainte d'écran :
//    le tri ne coupe jamais. Un test le tient.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ordonnerLesDrapeaux, compterParNature, cyclesEcoules, distributionDesContestations,
  elevesQuiRepetent, fileDExamenHumain, NATURES_DRAPEAU,
  type Drapeau, type ActeLu,
} from './attention'

const d = (p: Partial<Drapeau> & Pick<Drapeau, 'nature'>): Drapeau => ({
  eleveId: 'e1', eleveNom: 'Élève', cle: 'k', phrase: 'p', detail: [],
  at: null, enTete: false, geste: null, ...p,
})

// ── L'ordre ────────────────────────────────────────────────────────────────

test('le re-signalement passe devant TOUT — c’est la lettre du §8.4', () => {
  const l = ordonnerLesDrapeaux([
    d({ nature: 'dossier_n3', cle: 'a', at: '2026-01-01T00:00:00Z' }),
    d({ nature: 'fraicheur_ancre', cle: 'b', at: '2026-06-01T00:00:00Z', enTete: true }),
  ])
  assert.equal(l[0].cle, 'b', 'le drapeau re-signalé remonte, même d’une autre nature')
})

test('à égalité de re-signalement, l’ordre est celui des natures, puis l’ancienneté', () => {
  const l = ordonnerLesDrapeaux([
    d({ nature: 'fraicheur_ancre', cle: 'x' }),
    d({ nature: 'dossier_n3', cle: 'y', at: '2026-05-02T00:00:00Z' }),
    d({ nature: 'dossier_n3', cle: 'z', at: '2026-05-01T00:00:00Z' }),
  ])
  assert.deepEqual(l.map((f) => f.cle), ['z', 'y', 'x'])
})

test('un drapeau SANS DATE ferme la marche — il ne se range pas devant un fait daté', () => {
  const l = ordonnerLesDrapeaux([
    d({ nature: 'dossier_n3', cle: 'sansDate', at: null }),
    d({ nature: 'dossier_n3', cle: 'date', at: '2026-05-01T00:00:00Z' }),
  ])
  assert.deepEqual(l.map((f) => f.cle), ['date', 'sansDate'])
})

test('⛔ le tri NE COUPE JAMAIS : ni plafond ni file d’attente', () => {
  const beaucoup = Array.from({ length: 137 }, (_, i) =>
    d({ nature: 'dossier_n3', cle: `k${i}`, at: `2026-05-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z` }))
  assert.equal(ordonnerLesDrapeaux(beaucoup).length, 137)
})

test('l’ordre d’entrée ne change pas le résultat (tri stable sur la clé)', () => {
  const a = [d({ nature: 'dossier_n3', cle: 'b' }), d({ nature: 'dossier_n3', cle: 'a' })]
  const b = [d({ nature: 'dossier_n3', cle: 'a' }), d({ nature: 'dossier_n3', cle: 'b' })]
  assert.deepEqual(ordonnerLesDrapeaux(a).map((x) => x.cle), ordonnerLesDrapeaux(b).map((x) => x.cle))
})

test('le décompte par nature énumère TOUJOURS les quatre — zéro compris', () => {
  const c = compterParNature([d({ nature: 'dossier_n3' }), d({ nature: 'dossier_n3' })])
  assert.deepEqual(Object.keys(c).sort(), [...NATURES_DRAPEAU].sort())
  assert.equal(c.dossier_n3, 2)
  assert.equal(c.faisceau_integrite, 0, '« pas de ligne » n’est pas « pas d’objet »')
})

// ── Les cycles ─────────────────────────────────────────────────────────────

// Une année où deux semaines de vacances séparent le 14/09 du 05/10.
const CYCLES = [
  { dateDebutLundi: '2026-08-31' },
  { dateDebutLundi: '2026-09-07' },
  { dateDebutLundi: '2026-09-14' },
  // 21/09 et 28/09 : VACANCES — elles ne sont pas dans la liste.
  { dateDebutLundi: '2026-10-05' },
  { dateDebutLundi: '2026-10-12' },
]

test('⚠️ un compte de cycles n’est PAS un compte de jours divisé par sept', () => {
  // Du 14/09 au 12/10 il y a 28 jours, donc « 4 semaines » à la division.
  assert.equal(cyclesEcoules(CYCLES, '2026-09-14', '2026-10-12'), 2,
    'les deux semaines de vacances sortent du dénominateur PAR OMISSION')
})

test('un jour tombé EN VACANCES se rattache au dernier cycle d’enseignement', () => {
  assert.equal(cyclesEcoules(CYCLES, '2026-09-25', '2026-10-05'), 1)
})

test('le même cycle rend 0, et jamais un négatif', () => {
  assert.equal(cyclesEcoules(CYCLES, '2026-09-09', '2026-09-11'), 0)
  assert.equal(cyclesEcoules(CYCLES, '2026-10-12', '2026-09-07'), 0)
})

test('⛔ sans calendrier, ou avant la première semaine, c’est `null` — jamais 0', () => {
  assert.equal(cyclesEcoules([], '2026-09-14', '2026-10-12'), null)
  assert.equal(cyclesEcoules(CYCLES, '2026-08-01', '2026-10-12'), null,
    'un jour antérieur à la première semaine ne se compte pas : on ne sait pas')
})

// ── Les contestations ──────────────────────────────────────────────────────

let n = 0
const acte = (p: Partial<ActeLu> = {}): ActeLu => {
  n += 1
  return {
    depotId: 'd1', eleveId: 'e1', pointId: `p${n}`, texte: 't',
    at: `2026-09-0${(n % 9) + 1}T10:00:00Z`, citationAbsente: false, traiteAt: null, ...p,
  }
}

test('la distribution dit les trois choses que l’entrée demande — qui, combien, sur quoi', () => {
  const dist = distributionDesContestations([
    acte({ eleveId: 'a', pointId: 'P1' }),
    acte({ eleveId: 'a', pointId: 'P2', citationAbsente: true }),
    acte({ eleveId: 'b', pointId: 'P1' }),
  ])
  assert.equal(dist.eleves, 2)
  assert.equal(dist.actes, 3)
  assert.equal(dist.citationsAbsentes, 1)
  assert.deepEqual(dist.parEleve, [{ eleveId: 'a', actes: 2 }, { eleveId: 'b', actes: 1 }])
  assert.equal(dist.parPoint[0].pointId, 'P1')
})

test('⛔ SANS SEUIL RÉGLÉ, aucun drapeau de répétition — et l’écran ne se bloque pas', () => {
  const actes = [acte({ eleveId: 'a' }), acte({ eleveId: 'a' }), acte({ eleveId: 'a' })]
  assert.deepEqual(elevesQuiRepetent(actes, { seuil: null }), [])
  assert.equal(distributionDesContestations(actes).actes, 3, 'la distribution, elle, reste montrée')
})

test('le seuil réglé compte des ACTES DISTINCTS non traités', () => {
  const actes = [
    acte({ eleveId: 'a' }), acte({ eleveId: 'a' }), acte({ eleveId: 'a', traiteAt: '2026-09-09T00:00:00Z' }),
    acte({ eleveId: 'b' }),
  ]
  assert.deepEqual(elevesQuiRepetent(actes, { seuil: 3 }), [],
    'un acte déjà regardé ne rappelle pas le professeur à l’ordre')
  const deux = elevesQuiRepetent(actes, { seuil: 2 })
  assert.equal(deux.length, 1)
  assert.equal(deux[0].eleveId, 'a')
})

test('⚠️ la file d’examen humain N’ATTEND AUCUNE RÉPÉTITION — un seul acte suffit', () => {
  const file = fileDExamenHumain([
    acte({ eleveId: 'a', citationAbsente: true }),
    acte({ eleveId: 'b' }),
  ])
  assert.equal(file.length, 1)
  assert.equal(file[0].eleveId, 'a')
})

test('la file se vide de ce qui est traité, et se range du plus ancien au plus récent', () => {
  const vieux = acte({ pointId: 'vieux', citationAbsente: true, at: '2026-09-01T10:00:00Z' })
  const neuf = acte({ pointId: 'neuf', citationAbsente: true, at: '2026-09-08T10:00:00Z' })
  const traite = acte({ pointId: 'traite', citationAbsente: true, at: '2026-09-02T10:00:00Z', traiteAt: 'x' })
  assert.deepEqual(fileDExamenHumain([neuf, traite, vieux]).map((a) => a.pointId), ['vieux', 'neuf'])
})
