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
//
//  (3) L'ANNÉE se conçoit en trois dates et les semestres s'en déduisent, CALÉS sur
//      la semaine calendaire (calerAnnee) ; le semestre actif se DÉDUIT de la date du
//      jour (semestreActifAttendu) et ne se saisit plus (lot Calendrier · Année).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculerGrilleSemaines,
  calerAnnee,
  lundiOnOrBefore,
  semestreActifAttendu,
  toISODate,
} from './calendrier-grille'
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

// ── (3) Année : trois dates → deux semestres calés sur la semaine ────────────

test('calerAnnee : rentrée un mercredi → S1 démarre au lundi de sa semaine', () => {
  // 2026-09-02 est un mercredi ; son lundi est le 31 août.
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17')
  assert.equal(a.s1.start, '2026-08-31')
  assert.equal(new Date(a.s1.start + 'T00:00:00Z').getUTCDay(), 1) // lundi
})

test('calerAnnee : fin de S1 un mercredi → S1 s’arrête au dimanche de sa semaine', () => {
  // 2027-01-20 est un mercredi ; son dimanche est le 24 janvier.
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17')
  assert.equal(a.s1.end, '2027-01-24')
  assert.equal(new Date(a.s1.end + 'T00:00:00Z').getUTCDay(), 0) // dimanche
})

test('calerAnnee : S2 démarre le LUNDI suivant, jamais un jour à cheval', () => {
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17')
  assert.equal(a.s2.start, '2027-01-25')
  assert.equal(new Date(a.s2.start + 'T00:00:00Z').getUTCDay(), 1)
  assert.equal(a.s2.end, '2027-06-20') // dimanche de la semaine du jeudi 17 juin
  assert.equal(new Date(a.s2.end + 'T00:00:00Z').getUTCDay(), 0)
  // Aucun jour n'appartient aux deux semestres, et il n'y a pas de trou d'un jour.
  assert.ok(a.s1.end < a.s2.start)
  assert.equal(
    toISODate(new Date(new Date(a.s1.end + 'T00:00:00Z').getTime() + 86400000)),
    a.s2.start
  )
})

test('calerAnnee : sans calage, la semaine à cheval serait comptée DEUX fois', () => {
  // C'est le bug qu'on évite : avec des bornes brutes (S1 finit le mercredi 20/01,
  // S2 démarre le jeudi 21/01), la grille des DEUX semestres contient le lundi 18/01
  // — donc deux lignes `fragments_semaines` pour la même semaine réelle.
  const brutS1 = calculerGrilleSemaines({ start_date: '2026-09-02', end_date: '2027-01-20' }, [])
  const brutS2 = calculerGrilleSemaines({ start_date: '2027-01-21', end_date: '2027-06-17' }, [])
  const communes = brutS1.filter((w) => brutS2.some((v) => v.start === w.start))
  assert.equal(communes.length, 1)
  assert.equal(communes[0].start, '2027-01-18')

  // Avec le calage, plus aucun lundi partagé.
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17')
  const g1 = calculerGrilleSemaines({ start_date: a.s1.start, end_date: a.s1.end }, [])
  const g2 = calculerGrilleSemaines({ start_date: a.s2.start, end_date: a.s2.end }, [])
  assert.equal(g1.filter((w) => g2.some((v) => v.start === w.start)).length, 0)
})

test('calerAnnee : année d’une seule semaine — les trois dates dans la même semaine', () => {
  // Mardi → jeudi → vendredi de la semaine du lundi 31 août 2026.
  const a = calerAnnee('2026-09-01', '2026-09-03', '2026-09-04')
  assert.deepEqual(a.s1, { start: '2026-08-31', end: '2026-09-06' })
  // Le S2 est alors DÉGÉNÉRÉ : il démarre le lundi suivant et se termine le dimanche
  // de la semaine de la fin d'année, c'est-à-dire AVANT son début. La fonction ne
  // corrige rien (elle dit ce qui serait retenu) ; c'est à la saisie de refuser.
  assert.equal(a.s2.start, '2026-09-07')
  assert.equal(a.s2.end, '2026-09-06')
  assert.ok(a.s2.end < a.s2.start)
})

test('calerAnnee : une rentrée un dimanche recule d’une semaine (piège du 1er août)', () => {
  // Dimanche 2026-08-02 → lundi 2026-07-27, qui appartient à l'année scolaire
  // PRÉCÉDENTE : c'est ce que l'action serveur refuse (frontière du 1er août).
  const a = calerAnnee('2026-08-02', '2026-12-16', '2027-06-17')
  assert.equal(a.s1.start, '2026-07-27')
})

// ── (3 bis) Semestre actif : déduit de la date du jour ───────────────────────

const S1 = { id: 's1', start_date: '2026-08-31', end_date: '2027-01-24' }
const S2 = { id: 's2', start_date: '2027-01-25', end_date: '2027-06-20' }
const ANNEE = [S1, S2]

test('semestreActifAttendu : une date dans le S1 → le S1', () => {
  assert.equal(semestreActifAttendu(ANNEE, '2026-10-14'), 's1')
  assert.equal(semestreActifAttendu(ANNEE, '2026-08-31'), 's1') // premier jour inclus
  assert.equal(semestreActifAttendu(ANNEE, '2027-01-24'), 's1') // dernier jour inclus
})

test('semestreActifAttendu : une date dans le S2 → le S2', () => {
  assert.equal(semestreActifAttendu(ANNEE, '2027-03-08'), 's2')
  assert.equal(semestreActifAttendu(ANNEE, '2027-01-25'), 's2') // le lendemain bascule
})

test('semestreActifAttendu : AVANT la rentrée → le prochain à commencer', () => {
  // La règle qui compte à l'usage : saisie en août, le S1 est actif sans y revenir.
  assert.equal(semestreActifAttendu(ANNEE, '2026-08-20'), 's1')
  assert.equal(semestreActifAttendu(ANNEE, '2026-01-01'), 's1')
})

test('semestreActifAttendu : APRÈS la fin d’année → le dernier terminé', () => {
  assert.equal(semestreActifAttendu(ANNEE, '2027-07-15'), 's2')
  assert.equal(semestreActifAttendu(ANNEE, '2030-01-01'), 's2')
})

test('semestreActifAttendu : aucun semestre → aucun actif', () => {
  assert.equal(semestreActifAttendu([], '2026-10-14'), null)
})

test('semestreActifAttendu : le S1 seul, l’année de l’an dernier encore vivante', () => {
  // Trois lignes vivantes de deux années : « en cours » l'emporte sur « prochain ».
  const anPasse = { id: 'v1', start_date: '2025-08-25', end_date: '2026-06-21' }
  assert.equal(semestreActifAttendu([anPasse, ...ANNEE], '2026-03-02'), 'v1')
  // Entre les deux années (été) : le prochain à commencer, pas le dernier terminé.
  assert.equal(semestreActifAttendu([anPasse, ...ANNEE], '2026-07-10'), 's1')
})

test('semestreActifAttendu : déterministe — l’ordre de la liste ne change rien', () => {
  const melange = [S2, S1]
  for (const jour of ['2026-08-20', '2026-10-14', '2027-03-08', '2027-07-15']) {
    assert.equal(semestreActifAttendu(melange, jour), semestreActifAttendu(ANNEE, jour), jour)
  }
})
