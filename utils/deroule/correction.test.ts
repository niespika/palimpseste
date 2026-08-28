// ============================================================================
// C4 · L14 — LA CORRECTION SERVIE. Ce que ces tests GARDENT :
//   · **la règle de l'égalité**, qui n'existait pas et qu'il fallait écrire ;
//   · que la réfutation porte sur **le seul candidat chargé**, jamais sur trois ;
//   · que le `pourquoi_faux` se lit dans **les candidats servis**, jamais dans
//     la banque entière ;
//   · que le **second cas** de la paire reçoit la même correction que le premier ;
//   · et que le cran 5 n'en reçoit **aucune** — sa réponse attendue est la
//     version corrigée, et la servir avant la vf tuerait le `delta_v1_vf`.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  leCandidatLePlusCharge, composerLaCorrection, correctionDue, correctionServieAuCran,
} from './correction'

// La banque telle que l'IMPORT l'écrit : des objets `{texte, pourquoi_faux}`.
const BANQUE = [
  { texte: 'le garant', pourquoi_faux: 'c’est justement ce qui manque' },
  { texte: 'la preuve', pourquoi_faux: 'elle est là, et elle est bonne' },
  { texte: 'la conclusion', pourquoi_faux: 'elle est posée, et clairement' },
  { texte: 'muet', pourquoi_faux: '   ' },
]
const APPUI = {
  reponseAttendue: 'le lien entre la preuve et la conclusion',
  pourquoiJuste: 'parce que c’est lui, et lui seul, que le matériau ne dit pas',
  distracteurs: BANQUE,
}
/** Ce que `saisieARegistrer` journalise — les clés sont un contrat avec C4-L5. */
const credence = (jetons: number[], candidats: string[], indexCorrect: number) =>
  ({ cas: 1, forme: 'repartition', jetons, choix: jetons.indexOf(Math.max(...jetons)),
    at: '2026-08-24T10:00:00Z', index_correct: indexCorrect, candidats })

const SERVIS = ['la preuve', 'le garant', 'le lien entre la preuve et la conclusion', 'la conclusion']

// ── LA RÈGLE DE L'ÉGALITÉ ───────────────────────────────────────────────────

test('⭐ un seul candidat au maximum : c’est lui, et son index est celui de `choix`', () => {
  assert.equal(leCandidatLePlusCharge([10, 60, 20, 10]), 1)
  assert.equal(leCandidatLePlusCharge([100, 0, 0, 0]), 0)
  assert.equal(leCandidatLePlusCharge([0, 0, 0, 100]), 3)
})

test('⭐⭐ 25/25/25/25 : AUCUN candidat n’est le plus chargé — la règle de l’égalité', () => {
  // ⚠️ LE TEST DISCRIMINANT. `choix` vaut 0 sur cette répartition — c'est ce que
  //    `saisieARegistrer` journalise, et c'est juste pour lui. Mais 0 ne désigne
  //    PERSONNE ici : servir la réfutation d'un candidat que l'élève n'a pas
  //    choisi est pire que n'en servir aucune.
  assert.equal([25, 25, 25, 25].indexOf(Math.max(...[25, 25, 25, 25])), 0, 'ce que `choix` rend')
  assert.equal(leCandidatLePlusCharge([25, 25, 25, 25]), null, 'ce que la correction lit')
})

test('l’égalité PARTIELLE en tête compte aussi — 40/40/20/0', () => {
  assert.equal(leCandidatLePlusCharge([40, 40, 20, 0]), null)
})

test('une égalité AILLEURS qu’en tête ne change rien — 60/20/20/0', () => {
  assert.equal(leCandidatLePlusCharge([60, 20, 20, 0]), 1 - 1)
})

test('une répartition illisible ne devine pas : elle rend `null`', () => {
  assert.equal(leCandidatLePlusCharge([]), null)
  assert.equal(leCandidatLePlusCharge(['50', 50] as unknown[]), null)
  assert.equal(leCandidatLePlusCharge([NaN, 1, 2, 3]), null)
})

// ── LES TROIS CHOSES QUE LA CORRECTION PORTE ────────────────────────────────

test('⭐ la correction porte la réponse, son pourquoi, et LA SEULE réfutation du candidat chargé', () => {
  // L'élève a chargé « le garant », en position 1 des candidats servis.
  const c = composerLaCorrection(APPUI, credence([10, 70, 10, 10], SERVIS, 2), true)
  assert.ok(c)
  assert.equal(c.reponse, 'le lien entre la preuve et la conclusion')
  assert.equal(c.pourquoiJuste, 'parce que c’est lui, et lui seul, que le matériau ne dit pas')
  assert.deepEqual(c.refutation,
    { candidat: 'le garant', pourquoiFaux: 'c’est justement ce qui manque' })
  assert.equal(c.silence, null)
})

test('⚠️ UNE réfutation, jamais trois — le renversement d’expertise', () => {
  const c = composerLaCorrection(APPUI, credence([10, 70, 10, 10], SERVIS, 2), true)
  const texte = JSON.stringify(c)
  assert.ok(texte.includes('c’est justement ce qui manque'))
  assert.ok(!texte.includes('elle est là, et elle est bonne'), 'la preuve n’a pas à être réfutée')
  assert.ok(!texte.includes('elle est posée, et clairement'), 'la conclusion non plus')
})

test('⭐ sur une ÉGALITÉ, aucune réfutation — mais le `pourquoi_juste` se sert quand même', () => {
  const c = composerLaCorrection(APPUI, credence([25, 25, 25, 25], SERVIS, 2), true)
  assert.ok(c)
  assert.equal(c.refutation, null, 'on ne réfute pas un candidat que l’élève n’a pas choisi')
  assert.equal(c.silence, 'egalite', 'et l’écran le DIT — l’absence est honnête')
  assert.equal(c.pourquoiJuste, APPUI.pourquoiJuste, 'une explication, toujours servie')
  assert.equal(c.reponse, APPUI.reponseAttendue)
})

test('l’élève qui avait chargé la BONNE réponse n’a rien à se faire réfuter', () => {
  const c = composerLaCorrection(APPUI, credence([10, 10, 70, 10], SERVIS, 2), true)
  assert.ok(c)
  assert.equal(c.refutation, null)
  assert.equal(c.silence, 'la_bonne_reponse_etait_chargee')
  assert.equal(c.pourquoiJuste, APPUI.pourquoiJuste)
})

test('un candidat MUET fait taire la réfutation, jamais le pourquoi', () => {
  const servis = ['muet', 'la preuve', 'le lien entre la preuve et la conclusion', 'la conclusion']
  const c = composerLaCorrection(APPUI, credence([70, 10, 10, 10], servis, 2), true)
  assert.ok(c)
  assert.equal(c.refutation, null)
  assert.equal(c.silence, 'candidat_muet', 'l’import l’a déjà signalé au professeur')
  assert.equal(c.pourquoiJuste, APPUI.pourquoiJuste)
})

test('⭐ une instance CONÇUE EN LIGNE : une banque de CHAÎNES, pas d’objets', () => {
  // Piège 21 : l'écran de conception écrit des chaînes, l'import des objets. On
  // lit les deux, on ne normalise rien en base — et sur une chaîne il n'y a pas
  // de `pourquoi_faux`. L'écran se tait sur la réfutation, PAS sur le pourquoi.
  const c = composerLaCorrection(
    { ...APPUI, distracteurs: ['le garant', 'la preuve', 'la conclusion'] },
    credence([70, 10, 10, 10], ['le garant', 'la preuve', APPUI.reponseAttendue, 'la conclusion'], 2),
    true)
  assert.ok(c)
  assert.equal(c.refutation, null)
  assert.equal(c.silence, 'candidat_muet')
  assert.equal(c.pourquoiJuste, APPUI.pourquoiJuste, 'lui, il existe : il vit sur le CAS')
})

test('le `pourquoi_faux` se lit dans les candidats SERVIS, jamais dans la banque entière', () => {
  // La banque porte quatre entrées ; l'écran n'en a servi que trois, mêlées.
  // Un index lu sur la banque désignerait « la preuve » ; sur les servis, « le
  // garant ». C'est le second qui est juste.
  const c = composerLaCorrection(APPUI, credence([0, 100, 0, 0], SERVIS, 2), true)
  assert.equal(c?.refutation?.candidat, 'le garant')
  assert.notEqual(c?.refutation?.candidat, BANQUE[1].texte)
})

test('un `pourquoi_juste` absent laisse la correction parler quand même — signalé, jamais bloquant', () => {
  const c = composerLaCorrection({ ...APPUI, pourquoiJuste: null },
    credence([10, 70, 10, 10], SERVIS, 2), true)
  assert.ok(c)
  assert.equal(c.pourquoiJuste, null, 'une banque de la 1.1 s’importe et se sert')
  assert.ok(c.refutation, 'la réfutation, elle, ne dépend pas de lui')
})

test('⚠️ AUX CRANS 4 ET 5, LA RÉPONSE ATTENDUE EST LE POURQUOI : elle se sert seule', () => {
  const c = composerLaCorrection(
    { reponseAttendue: 'le garant manque entre la preuve et la conclusion',
      pourquoiJuste: null, distracteurs: null },
    null, false)
  assert.ok(c)
  assert.equal(c.reponse, 'le garant manque entre la preuve et la conclusion')
  assert.equal(c.pourquoiJuste, null)
  assert.equal(c.refutation, null)
  assert.equal(c.silence, null, 'rien n’est tu : il n’y avait rien à servir de plus')
  assert.equal(c.surDesCandidats, false)
})

test('une réponse attendue vide ne sert RIEN — le cran 9 la met à `null`', () => {
  assert.equal(composerLaCorrection(
    { reponseAttendue: null, pourquoiJuste: null, distracteurs: null }, null, false), null)
  assert.equal(composerLaCorrection(
    { reponseAttendue: '   ', pourquoiJuste: 'x', distracteurs: BANQUE }, null, true), null)
})

// ── QUELS CRANS, ET QUAND ───────────────────────────────────────────────────

test('⭐ les crans qui servent une correction : les trois paires, et les deux guidés', () => {
  assert.equal(correctionServieAuCran('diagnostiquer', 'diagnostic_guide'), true, 'cran 1')
  assert.equal(correctionServieAuCran('diagnostiquer', 'diagnostic_nomme'), true, 'cran 4')
  assert.equal(correctionServieAuCran('diagnostiquer', 'diagnostic_fin'), true, 'cran 9')
  assert.equal(correctionServieAuCran('transformer', 'transformation_guidee'), true, 'cran 3')
})

test('⛔ le cran 5 n’en sert AUCUNE — sa réponse attendue est la version corrigée', () => {
  // Sous escalade, le cran 5 passe au régime `plein` : servir la version
  // corrigée après la crédence la donnerait AVANT la version finale, et le
  // `delta_v1_vf` ne mesurerait plus rien.
  assert.equal(correctionServieAuCran('transformer', 'transformation_nommee'), false)
  assert.equal(correctionServieAuCran('transformer', 'transformation_aveugle'), false)
  assert.equal(correctionServieAuCran('produire', 'production_guidee'), false)
  assert.equal(correctionServieAuCran(null, null), false)
})

test('⭐ la correction du cas 1 ne se sert qu’APRÈS sa crédence', () => {
  const paire = (etape: never | string | null) =>
    ({ estUnePaire: true, etape: etape as never, credenceDonnee: null })
  assert.equal(correctionDue(1, paire('cas_1')), false)
  assert.equal(correctionDue(1, paire('credence_1')), false)
  assert.equal(correctionDue(1, paire('correction')), true)
  assert.equal(correctionDue(1, paire('credence_2')), true, 'elle reste lisible ensuite')
})

test('⭐⭐ LE SECOND CAS LA SERT AUSSI — et seulement au sixième état', () => {
  const paire = (etape: never | string) =>
    ({ estUnePaire: true, etape: etape as never, credenceDonnee: null })
  assert.equal(correctionDue(2, paire('correction')), false)
  assert.equal(correctionDue(2, paire('cas_2')), false)
  assert.equal(correctionDue(2, paire('credence_2')), false, 'sa crédence n’est pas donnée')
  assert.equal(correctionDue(2, paire('correction_2')), true,
    'le cas du transfert reçoit la même correction que le premier')
})

test('hors paire — au cran 3 —, la crédence du cas suffit : il n’y a pas d’état', () => {
  const seul = (credenceDonnee: unknown) =>
    ({ estUnePaire: false, etape: null, credenceDonnee })
  assert.equal(correctionDue(1, seul(null)), false)
  assert.equal(correctionDue(1, seul({ cas: 1, forme: 'repartition' })), true)
})

// ════════════════════════════════════════════════════════════════════════════
// ITEM 78 — AU CRAN 9, LA RÉPONSE SE DÉRIVE DU MATÉRIAU
// ════════════════════════════════════════════════════════════════════════════

test('⭐⭐ cran 9 : la correction était VIDE — elle sert la version corrigée', () => {
  // `correctionServieAuCran` la sert à tous les crans de diagnostic, 9 compris,
  // mais la table des crans y met `reponse_attendue` à `null` (`02-` §2.2).
  // L'élève ne voyait donc rien entre les deux cas de la paire.
  const c = composerLaCorrection(
    { reponseAttendue: null, pourquoiJuste: null, distracteurs: null,
      versionCorrigee: 'La phrase, réparée.' }, null, false)
  assert.equal(c?.reponse, 'La phrase, réparée.')
  assert.equal(c?.derivee, true, 'elle est DÉRIVÉE, et l’écran doit pouvoir le dire')
})

test('une réponse DÉCLARÉE l’emporte, et la version corrigée est ignorée', () => {
  const c = composerLaCorrection(
    { reponseAttendue: 'ce qu’il fallait voir', pourquoiJuste: null,
      distracteurs: null, versionCorrigee: 'la version réparée' }, null, false)
  assert.equal(c?.reponse, 'ce qu’il fallait voir')
  assert.equal(c?.derivee, false)
})

test('⛔ sans réponse déclarée NI version corrigée, on ne sert rien', () => {
  // Le module n'invente jamais : c'est la règle du silence, déjà tenue ailleurs.
  assert.equal(composerLaCorrection(
    { reponseAttendue: null, pourquoiJuste: null, distracteurs: null,
      versionCorrigee: null }, null, false), null)
  assert.equal(composerLaCorrection(
    { reponseAttendue: '  ', pourquoiJuste: null, distracteurs: null }, null, false), null)
})
