// Tests de garde du calendrier des semaines (fonctions PURES). Exécution : `npm test`.
//
// Deux invariants sont encodés ici, tous deux issus du diagnostic C8·L1 :
//
//  (1) La GRILLE (calculerGrilleSemaines) est la définition affichée de « la semaine
//      N » : lundi→dimanche, une semaine touchée par des vacances est sautée dans la
//      numérotation pédagogique. C'est elle que regenererSemaines() matérialise en
//      lignes `fragments_semaines` — les deux doivent rester d'accord.
//
//  (2) Une DATE LIMITE est un instant de FIN de journée dans le fuseau de l'école,
//      jamais une date pure écrite telle quelle (qui vaut minuit UTC, soit la VEILLE
//      au soir à Toronto — item 7 du chantier C8).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculerGrilleSemaines, lundiOnOrBefore, toISODate } from './calendrier-grille'
import { finDeJourDansFuseau, jourDansFuseau } from './fuseau'

const TO = 'America/Toronto'

// ── (1) Grille de semaines ───────────────────────────────────────────────────

test('lundiOnOrBefore : recule au lundi, un lundi reste lui-même, un dimanche recule de 6', () => {
  assert.equal(toISODate(lundiOnOrBefore('2026-07-01')), '2026-06-29') // mercredi
  assert.equal(toISODate(lundiOnOrBefore('2026-06-29')), '2026-06-29') // lundi
  assert.equal(toISODate(lundiOnOrBefore('2026-07-05')), '2026-06-29') // dimanche
})

test('grille : un semestre qui ne commence pas un lundi démarre à son lundi englobant', () => {
  const g = calculerGrilleSemaines({ start_date: '2026-07-01', end_date: '2026-07-31' }, [])
  assert.equal(g.length, 5)
  assert.equal(g[0].start, '2026-06-29')
  assert.equal(g[0].end, '2026-07-05')
  assert.equal(g[4].start, '2026-07-27') // dernier lundi ≤ end_date
  assert.equal(g[4].end, '2026-08-02') // la semaine déborde la fin du semestre : voulu
  assert.deepEqual(g.map((w) => w.pedagogicalNumber), [1, 2, 3, 4, 5])
})

test('grille : une semaine touchée par des vacances est sautée dans la numérotation', () => {
  const g = calculerGrilleSemaines(
    { start_date: '2026-01-12', end_date: '2026-02-01' },
    [{ label: 'Relâche', start_date: '2026-01-21', end_date: '2026-01-23' }]
  )
  assert.deepEqual(
    g.map((w) => [w.start, w.isVacation, w.pedagogicalNumber]),
    [
      ['2026-01-12', false, 1],
      ['2026-01-19', true, null], // la période tombe dedans → sautée
      ['2026-01-26', false, 2], // la numérotation reprend à 2, pas à 3
    ]
  )
  assert.equal(g[1].vacanceLabel, 'Relâche')
})

test('grille : un seul jour de chevauchement suffit à marquer la semaine en vacances', () => {
  const g = calculerGrilleSemaines(
    { start_date: '2026-03-02', end_date: '2026-03-08' },
    [{ label: 'Fin de relâche', start_date: '2026-02-23', end_date: '2026-03-02' }]
  )
  assert.equal(g.length, 1)
  assert.equal(g[0].isVacation, true)
})

test('grille : semestre plus court qu’une semaine → exactement une semaine', () => {
  const g = calculerGrilleSemaines({ start_date: '2026-09-02', end_date: '2026-09-03' }, [])
  assert.equal(g.length, 1)
  assert.equal(g[0].start, '2026-08-31')
})

// ── (2) Date limite = fin de journée dans le fuseau de l'école ───────────────

test('finDeJourDansFuseau : le dimanche reste le dimanche, jusqu’à 23 h 59 heure de l’école', () => {
  const limite = finDeJourDansFuseau('2026-07-05', TO)
  // Été à Toronto (UTC−4) → 23:59:59.999 local = 03:59:59.999 UTC le lendemain.
  assert.equal(limite, '2026-07-06T03:59:59.999Z')
  // …mais LU dans le fuseau de l'école, c'est bien encore le dimanche 5.
  assert.equal(jourDansFuseau(limite, TO), '2026-07-05')
})

test('finDeJourDansFuseau : hiver (UTC−5) — le décalage suit l’heure d’hiver', () => {
  const limite = finDeJourDansFuseau('2026-01-18', TO)
  assert.equal(limite, '2026-01-19T04:59:59.999Z')
  assert.equal(jourDansFuseau(limite, TO), '2026-01-18')
})

test('finDeJourDansFuseau : jours de bascule DST — la 2ᵉ passe évite le glissement de jour', () => {
  // Printemps 2026 : passage à l'heure d'été le dimanche 8 mars.
  const printemps = finDeJourDansFuseau('2026-03-08', TO)
  assert.equal(jourDansFuseau(printemps, TO), '2026-03-08')
  // Automne 2026 : retour à l'heure d'hiver le dimanche 1er novembre.
  const automne = finDeJourDansFuseau('2026-11-01', TO)
  assert.equal(jourDansFuseau(automne, TO), '2026-11-01')
})

test('finDeJourDansFuseau : invariant tous fuseaux — le jour lu est le jour demandé', () => {
  for (const tz of ['America/Toronto', 'America/Vancouver', 'Europe/Paris', 'UTC']) {
    for (const jour of ['2026-01-04', '2026-06-28', '2026-08-30', '2026-12-27']) {
      assert.equal(jourDansFuseau(finDeJourDansFuseau(jour, tz), tz), jour, `${tz} · ${jour}`)
    }
  }
})

test('RÉGRESSION item 7 : la date pure écrite telle quelle est déjà la VEILLE au soir', () => {
  // C'est le bug qu'on corrige : « 2026-07-05 » stocké en timestamptz vaut minuit
  // UTC, soit le samedi 4 à 20 h à Toronto — quatre heures de rendus « en retard ».
  assert.equal(jourDansFuseau('2026-07-05T00:00:00Z', TO), '2026-07-04')
  assert.notEqual(finDeJourDansFuseau('2026-07-05', TO), '2026-07-05T00:00:00.000Z')
})
