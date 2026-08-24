// ============================================================================
// C4 · L12 — LE PARTAGE DE LA LIGNE, ÉPROUVÉ. « Le seul point où ce lot peut
// casser un lot déjà en production. »
// ============================================================================

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  budgetEcrivable, chargeDeMinutes, ChargeDeMinutesInvalide, CLES_DE_C4L13, CLES_DE_MINUTES,
  ecartJournalise, grouperParFormeDeCle, minutesAssignees, verifierLaChargeDeMinutes,
} from './minutes'
import { CLES_INTERDITES } from '../assiduite/collecte'

describe('⛔⛔ la garde symétrique — le miroir de `verifierLaCharge()` de C4-L13', () => {
  it('⭐ LES DEUX LISTES SONT COMPLÉMENTAIRES ET DISJOINTES — la preuve du partage', () => {
    // Ce que C4-L13 s'interdit d'écrire est EXACTEMENT ce que ce lot écrit,
    // et réciproquement. Si un jour l'une des deux bouge, ce test tombe.
    assert.deepEqual([...CLES_INTERDITES].sort(), [...CLES_DE_MINUTES].sort())
    for (const k of CLES_DE_C4L13) {
      assert.equal((CLES_DE_MINUTES as readonly string[]).includes(k), false)
    }
  })

  it('⛔ une clé de C4-L13 dans une charge de minutes LÈVE', () => {
    for (const cle of CLES_DE_C4L13) {
      assert.throws(
        () => verifierLaChargeDeMinutes([{ minutes_assignees: 10, [cle]: 3 } as never]),
        ChargeDeMinutesInvalide, `la clé ${cle} devait être refusée`)
    }
  })

  it('⛔ une clé INCONNUE lève aussi — une faute de frappe passerait sans bruit', () => {
    assert.throws(
      () => verifierLaChargeDeMinutes([{ minutes_assignees: 10, minutes_budget: 45 } as never]),
      ChargeDeMinutesInvalide)
  })

  it('⛔ deux jeux de clés dans un même envoi LÈVENT — l\'envoi groupé les unifierait', () => {
    assert.throws(() => verifierLaChargeDeMinutes([
      { minutes_assignees: 10, minutes_budget_plancher: 45, minutes_budget_plafond: 60 },
      { minutes_assignees: 20 },
    ]), ChargeDeMinutesInvalide)
  })

  it('un envoi homogène passe — les trois clés, ou la seule', () => {
    assert.doesNotThrow(() => verifierLaChargeDeMinutes([
      { minutes_assignees: 10, minutes_budget_plancher: 45, minutes_budget_plafond: 60 },
      { minutes_assignees: 20, minutes_budget_plancher: 60, minutes_budget_plafond: 90 },
    ]))
    assert.doesNotThrow(() => verifierLaChargeDeMinutes([
      { minutes_assignees: 10 }, { minutes_assignees: 0 },
    ]))
    assert.doesNotThrow(() => verifierLaChargeDeMinutes([]))
  })

  it('⚠️ `updated_at` n\'est PAS une clé de ce lot — il dit « le cron est passé »', () => {
    assert.throws(
      () => verifierLaChargeDeMinutes([{ minutes_assignees: 1, updated_at: 'x' } as never]),
      ChargeDeMinutesInvalide)
  })
})

describe('⚠️ le budget que l\'écran accepte et que la base refuse', () => {
  it('un budget ordinaire s\'écrit', () => {
    assert.equal(budgetEcrivable({ plancher: 45, plafond: 60, optionnel: 30 }).ecrivable, true)
    assert.equal(budgetEcrivable({ plancher: 45, plafond: 45, optionnel: 0 }).ecrivable, true)
  })

  it('⛔ plafond SOUS plancher : refusé par `assiduite_budget_ordre_chk`, et DIT', () => {
    const v = budgetEcrivable({ plancher: 60, plafond: 45, optionnel: 30 })
    assert.equal(v.ecrivable, false)
    assert.match(v.motif ?? '', /assiduite_budget_ordre_chk/)
  })

  it('⭐ et la charge part QUAND MÊME, sans les deux colonnes de budget', () => {
    const { charge, budgetEcarte } = chargeDeMinutes(95,
      { plancher: 60, plafond: 45, optionnel: 30 })
    assert.deepEqual(charge, { minutes_assignees: 95 })
    assert.notEqual(budgetEcarte, null)
    // Elle reste valide pour la garde : le jeu de clés est licite.
    assert.doesNotThrow(() => verifierLaChargeDeMinutes([charge]))
  })

  it('un élève sans budget (parcours absent) n\'écrit que ses minutes, et le dit', () => {
    const { charge, budgetEcarte } = chargeDeMinutes(0, null)
    assert.deepEqual(charge, { minutes_assignees: 0 })
    assert.match(budgetEcarte ?? '', /pas servi/)
  })

  it('un budget entier écrit les trois colonnes', () => {
    const { charge, budgetEcarte } = chargeDeMinutes(50,
      { plancher: 45, plafond: 60, optionnel: 30 })
    assert.deepEqual(charge,
      { minutes_assignees: 50, minutes_budget_plancher: 45, minutes_budget_plafond: 60 })
    assert.equal(budgetEcarte, null)
  })
})

describe('l\'envoi groupé — deux formes de charge ne partent jamais ensemble', () => {
  it('les charges se groupent par jeu de clés, et chaque groupe passe la garde', () => {
    const lignes = [
      { charge: chargeDeMinutes(10, { plancher: 45, plafond: 60, optionnel: 30 }).charge },
      { charge: chargeDeMinutes(20, null).charge },
      { charge: chargeDeMinutes(30, { plancher: 60, plafond: 90, optionnel: 30 }).charge },
    ]
    const groupes = grouperParFormeDeCle(lignes)
    assert.equal(groupes.length, 2)
    for (const g of groupes) {
      assert.doesNotThrow(() => verifierLaChargeDeMinutes(g.map((l) => l.charge)))
    }
  })
})

describe('`01-` §11, point 7 — ce que les minutes comptent', () => {
  it('les minutes assignées somment les durées des exercices posés', () => {
    assert.equal(minutesAssignees([20, 15, 10]), 45)
    assert.equal(minutesAssignees([]), 0)
  })

  it('une durée absente vaut 0 et n\'empoisonne pas la somme (`NaN` ne part jamais en base)', () => {
    assert.equal(minutesAssignees([20, null, 10]), 30)
  })

  it('⭐ « le plafond borne, le plancher SIGNALE » — l\'écart se journalise', () => {
    assert.deepEqual(ecartJournalise(30, { plancher: 45, plafond: 60, optionnel: 30 }),
      { souSLePlancher: true, manque: 15, soldeALaVoieMixte: 15 })
    assert.deepEqual(ecartJournalise(50, { plancher: 45, plafond: 60, optionnel: 30 }),
      { souSLePlancher: false, manque: 0, soldeALaVoieMixte: 0 })
  })
})
