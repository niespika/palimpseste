// C7-L1 — le juge du cran : ce qu'il reçoit, ce qu'il contrôle, ce qu'il écrit.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assemblerLeJuge, controlerLeVerdict, FORME_VERDICT, fusionnerLesVerdicts, issueDesVerdicts,
  JUGE_AUX_CRANS, lireLesVerdicts, questionDuCran, type EntreeJuge, type VerdictCran,
} from './juge-cran'
import { valider } from './schema'

const CAS = {
  ordre: 1,
  materiau: "L'homme est libre. Donc il est responsable de ses actes.",
  versionCorrigee: "L'homme est libre : ce qu'il fait vient de lui. Donc il est responsable de ses actes.",
  defaut: 'le garant manque',
  reponseAttendue: 'le lien entre la preuve et la conclusion',
  passageFautif: 'Donc il est responsable',
  zone: null,
  choix: null,
}

const ENTREE: EntreeJuge = {
  cran: 5, version: 'v1', consigne: 'Réécris ce passage sans le défaut.',
  production: "L'homme est libre, et rien ne le force. Donc il répond de ses actes.",
  cas: [CAS],
}

test('le juge tranche aux quatre crans que la banque du 31/08 sert, et à eux seuls', () => {
  assert.deepEqual([...JUGE_AUX_CRANS].sort(), [4, 5, 7, 9])
  for (const c of [1, 2, 3, 6, 8]) assert.equal(JUGE_AUX_CRANS.has(c), false)
})

test('« fait quand » : le prompt porte le devoir d’élève, l’énoncé, la version corrigée et la réponse attendue', () => {
  const p = assemblerLeJuge(ENTREE)
  assert.match(p.message, /Donc il est responsable de ses actes\./)          // le devoir d'élève
  assert.match(p.message, /le garant manque/)                                 // l'énoncé du problème
  assert.match(p.message, /ce qu'il fait vient de lui/)                       // la version corrigée
  assert.match(p.message, /le lien entre la preuve et la conclusion/)         // la réponse attendue
  assert.match(p.message, /Donc il répond de ses actes\./)                    // la copie
  assert.match(p.message, /cran 5/)
  // Le préfixe est STABLE — il ne porte rien de la copie.
  assert.equal(p.prefixeCacheable.includes('répond de ses actes'), false)
  assert.equal(p.forme, FORME_VERDICT)
})

test('en version finale, la v1 est jointe et la copie jugée est nommée comme telle', () => {
  const p = assemblerLeJuge({ ...ENTREE, version: 'vf', productionV1: 'Première version ici.' })
  assert.match(p.message, /VERSION FINALE/)
  assert.match(p.message, /Première version ici\./)
})

test('la zone désignée et le candidat choisi partent avec leur verdict de zone', () => {
  const p = assemblerLeJuge({ ...ENTREE, cran: 9, cas: [{ ...CAS,
    zone: { texte: 'Donc il est responsable', rienASignaler: false, verdict: 'juste', cas: '3' },
    choix: { candidat: 'le garant manque', bonCandidat: 'le garant manque' } }] })
  assert.match(p.message, /la porte de zone dit : juste/)
  assert.match(p.message, /le candidat que l'élève a choisi/)
  const rien = assemblerLeJuge({ ...ENTREE, cran: 9, cas: [{ ...CAS,
    zone: { texte: null, rienASignaler: true, verdict: null, cas: null } }] })
  assert.match(rien.message, /rien à signaler/)
})

test('chaque cran a sa question, et elle dit ce que « réussi » veut dire', () => {
  for (const c of [4, 5, 7, 9]) assert.match(questionDuCran(c), /RÉUSSI si/)
})

test('le schéma refuse une clé inconnue et un champ manquant', () => {
  const bon = valider({ reussi: true, probleme_present: false, probleme_vu: null, passage: null, motif: 'ok' }, FORME_VERDICT)
  assert.equal(bon.ok, true)
  const inconnu = valider({ reussi: true, probleme_present: false, probleme_vu: null, passage: null, motif: 'ok', x: 1 }, FORME_VERDICT)
  assert.equal(inconnu.ok, false)
  const manquant = valider({ reussi: true, probleme_present: false, motif: 'ok' }, FORME_VERDICT)
  assert.equal(manquant.ok, false)
})

test('un passage introuvable dans la copie est RETIRÉ, le verdict tient, et l’alerte le dit', () => {
  const r = controlerLeVerdict(
    { reussi: false, probleme_present: true, probleme_vu: 'le garant manque encore', passage: 'phrase inventée', motif: 'x' },
    { cran: 5, production: ENTREE.production })
  assert.equal(r.verdict.passage, null)
  assert.equal(r.verdict.reussi, false)
  assert.equal(r.alertes.length, 1)
  assert.match(r.alertes[0]!, /introuvable/)
  const ok = controlerLeVerdict(
    { reussi: false, probleme_present: true, probleme_vu: 'x', passage: 'Donc il répond de ses actes', motif: 'x' },
    { cran: 5, production: ENTREE.production })
  assert.equal(ok.verdict.passage, 'Donc il répond de ses actes')
  assert.deepEqual(ok.alertes, [])
})

test('« réussi » avec un problème encore présent, aux crans 5 et 7, est signalé et servi tel quel', () => {
  const r = controlerLeVerdict(
    { reussi: true, probleme_present: true, probleme_vu: 'x', passage: null, motif: 'x' },
    { cran: 7, production: 'copie' })
  assert.equal(r.verdict.reussi, true)
  assert.match(r.alertes[0]!, /à relire/)
  const quatre = controlerLeVerdict(
    { reussi: true, probleme_present: true, probleme_vu: 'x', passage: null, motif: 'x' },
    { cran: 4, production: 'copie' })
  assert.deepEqual(quatre.alertes, [])
})

const V1: VerdictCran = { reussi: false, probleme_present: true, probleme_vu: 'x', passage: null,
  motif: 'm', version: 'v1', cran: 5, at: '2026-09-03T10:00:00Z', modele: 'm' }
const VF: VerdictCran = { ...V1, reussi: true, probleme_present: false, version: 'vf' }

test('les verdicts se lisent avec tolérance, se fusionnent par version, et la dernière version fait foi', () => {
  assert.deepEqual(lireLesVerdicts(null), {})
  assert.deepEqual(lireLesVerdicts([V1]), {})
  assert.deepEqual(lireLesVerdicts({ v1: { reussi: true } }), {})
  assert.deepEqual(lireLesVerdicts({ v1: V1, autre: 1 }), { v1: V1 })
  const f = fusionnerLesVerdicts({ v1: V1 }, VF)
  assert.deepEqual(f, { v1: V1, vf: VF })
  assert.deepEqual(fusionnerLesVerdicts({ v1: V1 }, { ...V1, reussi: true }), { v1: { ...V1, reussi: true } })
  assert.equal(issueDesVerdicts({}), null)
  assert.equal(issueDesVerdicts({ v1: V1 }), 'rate')
  assert.equal(issueDesVerdicts({ v1: V1, vf: VF }), 'reussi')
})
