// ============================================================================
// C4 · L3 — LE RAPPEL DU TEMPS 1. Ce que ce test GARDE :
//   · le DOSAGE PAR LE PALIER — l'effet d'inversion de l'expertise (`06-` §2) ;
//   · la SEMAINE 1 — « tant qu'aucune mesure n'existe, il n'y a rien à
//     rappeler : l'écran ne montre que la consigne » ;
//   · ⭐ que la LANGUE ÉLÈVE NE S'INVENTE JAMAIS : un observable sans
//     formulation est ÉCARTÉ, jamais rendu par son code — le code EST la grille
//     (RR4, `01-` §12).
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rappelDuTemps1, momentDeLaDemonstration, RAPPEL_MAX } from './rappel'
import type { InstrumentLu } from '../routeur/observables'
import type { Mesure } from '../routeur/mesure'

/** Trois observables de comptage : réussie quand la valeur vaut au plus 0. */
const INSTRUMENT: InstrumentLu = {
  observablesMesure: {
    jointure_presente: { famille: 'comptage', reussie: 'au_plus', seuil: 0 },
    charniere_motivee: { famille: 'comptage', reussie: 'au_plus', seuil: 0 },
    bloc_unite: { famille: 'comptage', reussie: 'au_plus', seuil: 0 },
  },
  parametres: {},
}

const FORMULATIONS = [
  { observable_code: 'jointure_presente', dimension_eleve: 'les liaisons entre tes paragraphes' },
  { observable_code: 'charniere_motivee', dimension_eleve: 'la raison du passage' },
  { observable_code: 'bloc_unite', dimension_eleve: 'l’idée de chaque paragraphe' },
]

const mesure = (obs: Record<string, number>): Mesure =>
  ({ observables: obs } as unknown as Mesure)

/** Une fenêtre où `jointure_presente` échoue toujours, `bloc_unite` jamais. */
const FENETRE: Mesure[] = [
  mesure({ jointure_presente: 3, charniere_motivee: 1, bloc_unite: 0 }),
  mesure({ jointure_presente: 2, charniere_motivee: 0, bloc_unite: 0 }),
  mesure({ jointure_presente: 4, charniere_motivee: 0, bloc_unite: 0 }),
]

test('le rappel ne s’ajoute PAS au grain micro — « aux grains meso et macro »', () => {
  const r = rappelDuTemps1('structure', 'micro', 'D', FENETRE, INSTRUMENT, FORMULATIONS)
  assert.deepEqual(r.observables, [])
  assert.match(r.motif ?? '', /micro/)
})

test('⭐ LE DOSAGE : servi à E, D et C — ABSENT à B et à A (inversion de l’expertise)', () => {
  for (const palier of ['E', 'D', 'C'] as const) {
    const r = rappelDuTemps1('structure', 'meso', palier, FENETRE, INSTRUMENT, FORMULATIONS)
    assert.ok(r.observables.length > 0, `le palier ${palier} doit recevoir le rappel`)
  }
  for (const palier of ['B', 'A'] as const) {
    const r = rappelDuTemps1('structure', 'meso', palier, FENETRE, INSTRUMENT, FORMULATIONS)
    assert.deepEqual(r.observables, [], `le palier ${palier} ne doit PAS le recevoir`)
    assert.match(r.motif ?? '', /inversion/)
  }
})

test('SEMAINE 1 : une fenêtre vide ne produit pas un rappel vide — elle n’en produit pas', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', [], INSTRUMENT, FORMULATIONS)
  assert.deepEqual(r.observables, [])
  assert.match(r.motif ?? '', /semaine 1/)
})

test('une compétence SANS LETTRE ne reçoit rien : sans palier, rien à doser', () => {
  const r = rappelDuTemps1('structure', 'meso', null, FENETRE, INSTRUMENT, FORMULATIONS)
  assert.deepEqual(r.observables, [])
})

test('sans INSTRUMENT ouvert, aucun taux ne se calcule — et on ne devine pas un classement', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, null, FORMULATIONS)
  assert.deepEqual(r.observables, [])
  assert.match(r.motif ?? '', /clause granulaire/)
})

test('les PLUS FAIBLES d’abord : le taux le plus bas ouvre la liste', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, INSTRUMENT, FORMULATIONS)
  assert.equal(r.observables[0].code, 'jointure_presente', 'il échoue sur les trois mesures')
})

test('un observable ACQUIS n’est pas rappelé — il n’est pas « faible »', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, INSTRUMENT, FORMULATIONS)
  assert.equal(r.observables.some((o) => o.code === 'bloc_unite'), false)
})

test('au plus TROIS — « les deux ou trois observables les plus faibles »', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, INSTRUMENT, FORMULATIONS)
  assert.ok(r.observables.length <= RAPPEL_MAX)
})

test('⭐ le rappel ne rend QUE des DIMENSIONS — jamais le code, qui est la grille', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, INSTRUMENT, FORMULATIONS)
  for (const o of r.observables) {
    assert.ok(o.dimension_eleve.length > 0)
    assert.notEqual(o.dimension_eleve, o.code)
  }
})

test('⚠️ un observable SANS FORMULATION est ÉCARTÉ et SIGNALÉ — une formulation ne s’invente pas', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, INSTRUMENT,
    [{ observable_code: 'bloc_unite', dimension_eleve: 'l’idée' }])
  assert.deepEqual(r.observables, [], 'rien ne s’affiche plutôt qu’un code de grille')
  assert.ok(r.formulationsManquantes.includes('jointure_presente'))
  assert.match(r.motif ?? '', /ne se fabrique pas/)
})

test('une formulation vide vaut une formulation absente', () => {
  const r = rappelDuTemps1('structure', 'meso', 'D', FENETRE, INSTRUMENT,
    [{ observable_code: 'jointure_presente', dimension_eleve: '   ' }])
  assert.equal(r.observables.some((o) => o.code === 'jointure_presente'), false)
})

test('la démonstration vient AVANT sur une compétence jamais travaillée, EN RETOUR ensuite', () => {
  assert.equal(momentDeLaDemonstration(0), 'avant')
  assert.equal(momentDeLaDemonstration(1), 'en_retour', 'consolidation : la tentative d’abord')
  assert.equal(momentDeLaDemonstration(7), 'en_retour')
})
