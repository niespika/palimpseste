// « Sept signaux, TOUS TAGUÉS, AUCUN BLOQUANT, jamais un verdict » (`06-` §6).
// Ce que ces tests éprouvent : que les trois signaux du clavier se COMPTENT
// juste, qu'ils se versent sous la forme que la garde en base accepte, et que
// le module ne conclut RIEN.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as telemetrie from './telemetrie'
import {
  SEUIL_PAUSE_MS, accumuler, aVerser, fusionner, lireTelemetrie, nouvelleTelemetrie,
  leReleveLePlusAvance,
  signesParMinute, type EvenementDeSaisie,
} from './telemetrie'
import type { TelemetrieSaisie } from './types'

/** Un relevé quelconque, non nul sur les quatre compteurs. */
const RELEVE: TelemetrieSaisie = {
  signes_saisis: 1200, ms_actifs: 240_000, plus_grand_ajout: 42, sessions: 3,
}

/** Une frappe : `n` signes ajoutés, `ms` après la précédente. */
const frappe = (n: number, ms: number | null, avant = 0): EvenementDeSaisie => ({
  longueurAvant: avant,
  longueurApres: avant + n,
  instant: 1_000_000 + (ms ?? 0),
  dernierInstant: ms === null ? null : 1_000_000,
})

// ── Le relevé neuf ─────────────────────────────────────────────────────────

test('un relevé neuf porte les QUATRE compteurs à zéro, et rien d\'autre', () => {
  assert.deepEqual(nouvelleTelemetrie(),
    { signes_saisis: 0, ms_actifs: 0, plus_grand_ajout: 0, sessions: 0 })
})

// ── Les signes saisis ──────────────────────────────────────────────────────

test('on compte CE QUE L\'ÉLÈVE A TAPÉ — une suppression n\'enlève rien au compteur', () => {
  let t = accumuler(nouvelleTelemetrie(), frappe(1000, null))
  t = accumuler(t, { longueurAvant: 1000, longueurApres: 200, instant: 2000, dernierInstant: 1000 })
  assert.equal(t.signes_saisis, 1000, 'huit cents signes effacés ont bien été tapés')
})

test('un remplacement de sélection ne compte QUE LE SOLDE — la limite est assumée', () => {
  const t = accumuler(nouvelleTelemetrie(),
    { longueurAvant: 850, longueurApres: 900, instant: 2000, dernierInstant: 1000 })
  assert.equal(t.signes_saisis, 50, 'le compteur mesure une longueur, pas des frappes')
  assert.equal(t.plus_grand_ajout, 50)
})

// ── L'apparition du texte par blocs ────────────────────────────────────────

test('`plus_grand_ajout` retient LE PLUS GRAND AJOUT D\'UN SEUL TENANT, pas le dernier', () => {
  let t = accumuler(nouvelleTelemetrie(), frappe(3000, null))
  t = accumuler(t, frappe(4, 300, 3000))
  t = accumuler(t, frappe(7, 600, 3004))
  assert.equal(t.plus_grand_ajout, 3000, '« l\'apparition du texte par blocs » (`06-` §6)')
  assert.equal(t.signes_saisis, 3011)
})

test('un texte déposé EN UN GESTE ne laisse aucun rythme — mais il laisse un bloc', () => {
  const t = accumuler(nouvelleTelemetrie(), frappe(2400, null))
  assert.equal(signesParMinute(t), null, 'aucun intervalle : aucun temps actif, donc aucun rythme')
  assert.equal(t.plus_grand_ajout, 2400, 'c\'est le bloc qui porte le signal, pas le rythme')
})

// ── Le temps actif ─────────────────────────────────────────────────────────

test('`ms_actifs` n\'accumule QUE les intervalles sous le seuil de pause', () => {
  let t = accumuler(nouvelleTelemetrie(), frappe(5, null))
  t = accumuler(t, frappe(5, 4000, 5))
  t = accumuler(t, frappe(5, 6000, 10))
  assert.equal(t.ms_actifs, 10_000)
})

test('le champ OUVERT MAIS INERTE n\'est pas du temps d\'écriture', () => {
  let t = accumuler(nouvelleTelemetrie(), frappe(5, null))
  t = accumuler(t, frappe(5, 8 * 3600 * 1000, 5))   // un onglet laissé ouvert la nuit
  assert.equal(t.ms_actifs, 0, 'huit heures d\'inertie ne font pas huit heures de travail')
})

test('le seuil de pause est une BORNE ATTEINTE : exactement le seuil est déjà une pause', () => {
  const auSeuil = accumuler(nouvelleTelemetrie(), frappe(5, SEUIL_PAUSE_MS, 0))
  assert.equal(auSeuil.ms_actifs, 0)
  const justeAvant = accumuler(nouvelleTelemetrie(), frappe(5, SEUIL_PAUSE_MS - 1, 0))
  assert.equal(justeAvant.ms_actifs, SEUIL_PAUSE_MS - 1)
})

test('une horloge qui RECULE n\'accumule rien et n\'ouvre aucune session', () => {
  const t = accumuler({ ...nouvelleTelemetrie(), sessions: 1 },
    { longueurAvant: 0, longueurApres: 5, instant: 1000, dernierInstant: 9000 })
  assert.equal(t.ms_actifs, 0, 'l\'horloge du navigateur de l\'élève n\'est pas une source')
  assert.equal(t.sessions, 1)
  assert.equal(t.signes_saisis, 5, 'mais les signes tapés, eux, sont comptés')
})

// ── Les sessions d'écriture ────────────────────────────────────────────────

test('`sessions` vaut 1 DÈS LA PREMIÈRE FRAPPE — zéro veut dire « rien n\'a été tapé »', () => {
  assert.equal(nouvelleTelemetrie().sessions, 0)
  assert.equal(accumuler(nouvelleTelemetrie(), frappe(1, null)).sessions, 1)
})

test('une session de plus À CHAQUE REPRISE APRÈS UNE PAUSE FRANCHE, et à elle seule', () => {
  let t = accumuler(nouvelleTelemetrie(), frappe(5, null))
  t = accumuler(t, frappe(5, 3000, 5))                    // même session
  assert.equal(t.sessions, 1)
  t = accumuler(t, frappe(5, SEUIL_PAUSE_MS + 1, 10))     // reprise
  assert.equal(t.sessions, 2)
  t = accumuler(t, frappe(5, 2000, 15))                   // toujours la deuxième
  assert.equal(t.sessions, 2)
})

// ── La fusion, après un rechargement ───────────────────────────────────────

test('⛔⛔ LA BASE GARDE LE PLUS AVANCÉ — un envoi vide n\'écrase plus un relevé plein (01/09)', () => {
  // Mesuré en production le 01/09/2026 : 15 dépôts sur 16 à zéro, parce que le
  // dernier delta — vide — remplaçait le relevé. Compteur par compteur, le plus
  // grand gagne, et l'absence de relevé rend le neuf tel quel.
  const plein = { signes_saisis: 339, ms_actifs: 240_000, plus_grand_ajout: 12, sessions: 2 }
  const vide = nouvelleTelemetrie()
  assert.deepEqual(leReleveLePlusAvance(plein, vide), plein)
  assert.deepEqual(leReleveLePlusAvance(undefined, plein), plein)
  assert.deepEqual(leReleveLePlusAvance(null, vide), vide)
  // Un cumul plus récent l'emporte partout ; un onglet en retard ne fait reculer aucun compteur.
  const cumule = { signes_saisis: 400, ms_actifs: 300_000, plus_grand_ajout: 12, sessions: 3 }
  assert.deepEqual(leReleveLePlusAvance(plein, cumule), cumule)
  assert.deepEqual(leReleveLePlusAvance(cumule, plein), cumule)
  // ⚠️ Ce n'est PAS une addition : un envoi rejoué ne compte rien deux fois.
  assert.notDeepEqual(leReleveLePlusAvance(plein, plein), fusionner(plein, plein))
})

test('deux relevés s\'ADDITIONNENT — une reprise après rechargement ne repart pas de zéro', () => {
  const f = fusionner(RELEVE, { signes_saisis: 300, ms_actifs: 60_000, plus_grand_ajout: 12, sessions: 1 })
  assert.equal(f.signes_saisis, 1500)
  assert.equal(f.ms_actifs, 300_000)
  assert.equal(f.sessions, 4, 'un rechargement EST une reprise d\'écriture')
})

test('DEUX BLOCS DE 500 NE FONT PAS UN BLOC DE 1000 — `plus_grand_ajout` prend le MAX', () => {
  const a: TelemetrieSaisie = { signes_saisis: 500, ms_actifs: 1, plus_grand_ajout: 500, sessions: 1 }
  const b: TelemetrieSaisie = { signes_saisis: 500, ms_actifs: 1, plus_grand_ajout: 500, sessions: 1 }
  assert.equal(fusionner(a, b).plus_grand_ajout, 500,
    'additionner inventerait une apparition qui n\'a jamais eu lieu')
})

// ── Le rythme, qui SE RELIT ────────────────────────────────────────────────

test('« neuf cents signes par minute » se RECALCULE à la lecture', () => {
  assert.equal(signesParMinute({ ...RELEVE, signes_saisis: 900, ms_actifs: 60_000 }), 900)
  assert.equal(signesParMinute({ ...RELEVE, signes_saisis: 450, ms_actifs: 60_000 }), 450)
})

test('un dénominateur vide n\'est PAS UN RYTHME LENT : `null`, jamais 0', () => {
  assert.equal(signesParMinute({ ...RELEVE, signes_saisis: 3000, ms_actifs: 0 }), null,
    'même doctrine que le taux de lucidité (`00-` §3) et que `delta_v1_vf` (`01-` §11)')
  assert.equal(signesParMinute(nouvelleTelemetrie()), null)
})

// ── La lecture de la colonne ───────────────────────────────────────────────

test('les deux versions se lisent séparément — mêler v1 et vf brouillerait le delta', () => {
  const lu = lireTelemetrie({
    v1: { signes_saisis: 900, ms_actifs: 60_000, plus_grand_ajout: 30, sessions: 2 },
    vf: { signes_saisis: 120, ms_actifs: 30_000, plus_grand_ajout: 12, sessions: 1 },
  })
  assert.equal(lu.v1?.signes_saisis, 900)
  assert.equal(lu.vf?.sessions, 1)
})

test('UNE VERSION ILLISIBLE EST ÉCARTÉE — elle n\'emporte pas l\'autre', () => {
  const attendue = { signes_saisis: 10, ms_actifs: 20, plus_grand_ajout: 3, sessions: 1 }
  for (const abime of [{ ms_actifs: -1 }, { ms_actifs: 1.5 }, { ms_actifs: '20' }, { ms_actifs: NaN },
    'du texte', 42, [1, 2], null]) {
    const lu = lireTelemetrie({ v1: abime, vf: attendue })
    assert.equal(lu.v1, undefined, `v1 abîmée (${JSON.stringify(abime)}) est écartée`)
    assert.deepEqual(lu.vf, attendue, 'et la vf, elle, est rendue')
  }
})

test('un compteur ABSENT vaut zéro — la garde en base admet un objet partiel', () => {
  assert.deepEqual(lireTelemetrie({ v1: {} }).v1, nouvelleTelemetrie())
  assert.deepEqual(lireTelemetrie({ v1: { sessions: 2 } }).v1,
    { signes_saisis: 0, ms_actifs: 0, plus_grand_ajout: 0, sessions: 2 })
})

test('une clé ÉTRANGÈRE est ignorée à la lecture — la garde ferme le domaine à l\'écriture', () => {
  const lu = lireTelemetrie({ v1: { sessions: 1, signes_par_minute: 900 } })
  assert.deepEqual(lu.v1, { signes_saisis: 0, ms_actifs: 0, plus_grand_ajout: 0, sessions: 1 })
})

test('une VERSION inconnue n\'entre pas : le domaine `v1`/`vf` est fermé', () => {
  const lu = lireTelemetrie({ v2: { sessions: 9 }, v1: { sessions: 1 } })
  assert.deepEqual(Object.keys(lu), ['v1'])
})

test('un dépôt sans télémétrie rend `{}`, jamais une erreur', () => {
  for (const rien of [undefined, null, '{}', 3, [], true]) {
    assert.deepEqual(lireTelemetrie(rien), {}, `${JSON.stringify(rien) ?? 'undefined'} → {}`)
  }
})

// ── Le versement ───────────────────────────────────────────────────────────

test('on verse EXACTEMENT les quatre clés que la garde en base accepte', () => {
  assert.deepEqual(Object.keys(aVerser(RELEVE)).sort(),
    ['ms_actifs', 'plus_grand_ajout', 'sessions', 'signes_saisis'])
})

test('un DÉCIMAL est arrondi et un NÉGATIF planchonné — sinon l\'écriture échoue EN SILENCE', () => {
  const verse = aVerser({ signes_saisis: 12.4, ms_actifs: 240_000.7, plus_grand_ajout: -3, sessions: 1 })
  assert.deepEqual(verse,
    { signes_saisis: 12, ms_actifs: 240_001, plus_grand_ajout: 0, sessions: 1 })
  assert.ok(Object.values(verse).every((n) => Number.isInteger(n) && n >= 0),
    'supabase-js NE LÈVE PAS : un refus de la garde passerait inaperçu')
})

test('un compteur qui n\'est plus un nombre se verse à 0, il ne fait pas tomber l\'écriture', () => {
  assert.deepEqual(
    aVerser({ signes_saisis: NaN, ms_actifs: Infinity, plus_grand_ajout: 0, sessions: 0 }),
    { signes_saisis: 0, ms_actifs: 0, plus_grand_ajout: 0, sessions: 0 })
})

test('ce qui a été ACCUMULÉ se verse tel quel, et repasse la garde', () => {
  let t = nouvelleTelemetrie()
  t = accumuler(t, frappe(40, null))
  t = accumuler(t, frappe(60, 30_000, 40))
  const verse = aVerser(t)
  assert.deepEqual(verse,
    { signes_saisis: 100, ms_actifs: 30_000, plus_grand_ajout: 60, sessions: 1 })
})

// ── Ce que le module ne fait PAS ───────────────────────────────────────────

test('AUCUN VERDICT : la surface du module ne porte ni seuil de suspicion, ni drapeau', () => {
  assert.deepEqual(Object.keys(telemetrie).sort(), [
    'SEUIL_PAUSE_MS', 'VERSIONS_TELEMETREES',
    'aVerser', 'accumuler', 'fusionner', 'lireTelemetrie', 'nouvelleTelemetrie', 'signesParMinute',
    // 01/09 — ce que la base garde quand le client verse : un choix de relevé, pas un verdict.
    'leReleveLePlusAvance',
  ].sort(), 'la convergence seule fait un drapeau, par `signalerEnAttenteIA` (`06-` §6)')
})

test('LE SEUIL DE PAUSE EST VISIBLE ET DISCUTABLE — la source ne le fixe pas', () => {
  assert.ok(Number.isInteger(SEUIL_PAUSE_MS) && SEUIL_PAUSE_MS > 0)
  assert.equal(SEUIL_PAUSE_MS, 120_000, 'deux minutes : une décision, pas une règle de la source')
})
