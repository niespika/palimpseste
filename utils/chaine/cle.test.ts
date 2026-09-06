// ============================================================================
// C7 · L8 — « la chaîne à l'heure de la clé » : la part pure, éprouvée.
// Ce que ce test GARDE, d'abord : PORTE FERMÉE, CHAQUE SORTIE EST CELLE D'HIER
// À L'OCTET — la liste des compétences froides, l'ordre des candidates, la
// mesure. Puis ce que la porte ouverte change, et rien d'autre.
// ============================================================================
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  alerteDeLaCle, cibleAvecLaCle, competencesFroidesDe, mettreEnTete, nomDeLObservable,
  observableDeLaCle, passagesACorriger, phrasesDe, restreindreLesObservables, signalDeRecopie,
  type CleDuCas,
} from './cle'
import { NA } from './observables'

const CLE: CleDuCas = {
  cle: 'argument.garant.absent', observableCode: 'lien_explicite',
  observableCompetence: 'argumentation', observableRoute: true, lecture: 'ok',
}
const MESUREES = ['argumentation', 'expression', 'structure'] as const

// ── La porte ────────────────────────────────────────────────────────────────

test('⛔ porte FERMÉE : aucun observable de clé, quelle que soit la clé', () => {
  assert.equal(observableDeLaCle({ chaineCleActif: false, cle: CLE }), null)
})

test('porte ouverte, sans clé (banque 1.4, crans de production) : rien', () => {
  assert.equal(observableDeLaCle({ chaineCleActif: true, cle: null }), null)
})

test('porte ouverte, clé routée : l\'observable, sa compétence, sa clé', () => {
  assert.deepEqual(observableDeLaCle({ chaineCleActif: true, cle: CLE }),
    { cle: 'argument.garant.absent', code: 'lien_explicite', competence: 'argumentation' })
})

test('⚠️ une clé SANS observable routé, absente de la doctrine ou illisible ne vaut jamais « isole avec une clé »', () => {
  for (const lecture of ['sans_observable', 'absente_de_la_doctrine', 'illisible'] as const) {
    assert.equal(observableDeLaCle({ chaineCleActif: true, cle: { ...CLE, lecture } }), null, lecture)
    assert.match(alerteDeLaCle({ ...CLE, lecture }) ?? '', /clé « argument\.garant\.absent »/)
  }
  assert.equal(observableDeLaCle({ chaineCleActif: true, cle: { ...CLE, observableRoute: false } }), null)
  assert.match(alerteDeLaCle({ ...CLE, observableRoute: false }) ?? '', /sans observable routé/)
  assert.equal(alerteDeLaCle(CLE), null)
  assert.equal(alerteDeLaCle(null), null)
})

// ── La cible ────────────────────────────────────────────────────────────────

test('sans observable de clé, la cible est celle d\'hier — sans un mot', () => {
  assert.deepEqual(cibleAvecLaCle(null, 'structure', { cibleRetenue: 'structure' }), { cible: 'structure', alerte: null })
})

test('⭐ avec la clé, la cible EST sa compétence ; une décision qui dit autre chose est signalée, la clé l\'emporte', () => {
  const o = observableDeLaCle({ chaineCleActif: true, cle: CLE })!
  assert.deepEqual(cibleAvecLaCle(o, 'structure', null), { cible: 'argumentation', alerte: null })
  const r = cibleAvecLaCle(o, 'structure', { cibleRetenue: 'structure' })
  assert.equal(r.cible, 'argumentation')
  assert.match(r.alerte ?? '', /la clé l'emporte/)
  assert.equal(cibleAvecLaCle(o, 'argumentation', { cibleRetenue: 'argumentation' }).alerte, null)
})

// ── Les compétences froides — C'EST LA LIGNE ────────────────────────────────

test('⛔ porte fermée : `v1 ? mesurees : [cible]`, à l\'identique, rien d\'écarté', () => {
  const v1 = competencesFroidesDe({ version: 'v1', mesurees: MESUREES, cible: 'argumentation', observable: null, sondes: ['expression'] })
  assert.deepEqual(v1, { froides: [...MESUREES], ecartees: [], alertes: [] })
  const vf = competencesFroidesDe({ version: 'vf', mesurees: MESUREES, cible: 'argumentation', observable: null, sondes: [] })
  assert.deepEqual(vf, { froides: ['argumentation'], ecartees: [], alertes: [] })
  assert.deepEqual(competencesFroidesDe({ version: 'vf', mesurees: MESUREES, cible: null, observable: null, sondes: [] }).froides, [])
})

test('⭐⭐ avec la clé, en v1 : LA SEULE compétence de l\'observable ; les autres écartées AVEC UN MOTIF, les sondes de la décision comprises', () => {
  const o = observableDeLaCle({ chaineCleActif: true, cle: CLE })!
  const r = competencesFroidesDe({ version: 'v1', mesurees: MESUREES, cible: 'argumentation', observable: o, sondes: ['expression'] })
  assert.deepEqual(r.froides, ['argumentation'])
  assert.deepEqual(r.ecartees.map((e) => e.competence), ['expression', 'structure'])
  assert.match(r.ecartees[0].motif, /sonde de la décision NON mesurée/)
  assert.match(r.ecartees[1].motif, /hors de l'observable isolé par la clé « argument\.garant\.absent »/)
  assert.equal(r.alertes.length, 1)
  assert.match(r.alertes[0], /1 sonde\(s\) de la décision non mesurée\(s\)/)
})

test('avec la clé, en vf : la cible seule — comme hier', () => {
  const o = observableDeLaCle({ chaineCleActif: true, cle: CLE })!
  assert.deepEqual(competencesFroidesDe({ version: 'vf', mesurees: MESUREES, cible: 'argumentation', observable: o, sondes: [] }).froides, ['argumentation'])
})

test('⚠️ la compétence de la clé écartée en amont (non branchée, différée) : RIEN à mesurer, et l\'alerte le dit', () => {
  const o = observableDeLaCle({ chaineCleActif: true, cle: CLE })!
  const r = competencesFroidesDe({ version: 'v1', mesurees: ['expression', 'structure'], cible: 'expression', observable: o, sondes: [] })
  assert.deepEqual(r.froides, [])
  assert.equal(r.ecartees.length, 2)
  assert.match(r.alertes.at(-1) ?? '', /n'est pas mesurable sur ce dépôt/)
})

// ── La mesure ne garde que l'observable de la clé ───────────────────────────

test('⭐ `restreindreLesObservables` : les autres codes passent à `n/a` — jamais 0, jamais retirés', () => {
  const r = restreindreLesObservables({ lien_explicite: 0.5, garant_cite: 1, autre: NA }, 'lien_explicite')
  assert.deepEqual(r.observables, { lien_explicite: 0.5, garant_cite: NA, autre: NA })
  assert.deepEqual(r.retires, ['garant_cite'])
  assert.equal(r.horsInstrument, false)
})

test('⚠️ un code hors de l\'instrument ne restreint RIEN — la mesure d\'hier, et le drapeau', () => {
  const entree = { lien_explicite: 0.5, garant_cite: 1 }
  const r = restreindreLesObservables(entree, 'inconnu')
  assert.equal(r.observables, entree)
  assert.equal(r.horsInstrument, true)
})

// ── Le « se juger » : l'observable de la clé en tête ────────────────────────

test('⛔ sans tête, l\'ordre reçu est rendu à l\'identique', () => {
  const l = [{ competence: 'argumentation', observable_code: 'b' }, { competence: 'argumentation', observable_code: 'a' }]
  assert.deepEqual(mettreEnTete(l, null), l)
  assert.notEqual(mettreEnTete(l, null), l)   // une copie, jamais l'entrée
})

test('⭐ l\'observable de la clé passe en tête, le reste garde son ordre (la fragilité, puis le tirage)', () => {
  const l = [
    { competence: 'structure', observable_code: 'bloc_unite' },
    { competence: 'argumentation', observable_code: 'garant_cite' },
    { competence: 'argumentation', observable_code: 'lien_explicite' },
  ]
  assert.deepEqual(mettreEnTete(l, { competence: 'argumentation', code: 'lien_explicite' }).map((c) => c.observable_code),
    ['lien_explicite', 'bloc_unite', 'garant_cite'])
  // absent de la liste : rien ne bouge
  assert.deepEqual(mettreEnTete(l, { competence: 'argumentation', code: 'absent' }), l)
})

// ── Le signal de recopie ────────────────────────────────────────────────────

const DEVOIR = "L'ennui pousse l'enfant à inventer tout seul ses règles et ses histoires. Un carton devient une cabane, "
  + "un balai devient un cheval, et personne ne le leur a demandé. Donc l'ennui est utile."

test('`phrasesDe` découpe à la ponctuation et ne garde que les phrases d\'au moins quatre mots', () => {
  assert.deepEqual(phrasesDe('Oui. Une phrase de plus de quatre mots ici. Non !'), ['Une phrase de plus de quatre mots ici.'])
})

test('⛔ hors des crans 3·5·7, ou sans matériau, ou sans production : aucun signal', () => {
  assert.equal(signalDeRecopie(DEVOIR, 2, [{ ordre: 1, materiau: DEVOIR }]), null)
  assert.equal(signalDeRecopie(DEVOIR, 5, [{ ordre: 1, materiau: null }]), null)
  assert.equal(signalDeRecopie(null, 5, [{ ordre: 1, materiau: DEVOIR }]), null)
})

test('⭐ une v1 qui recopie le devoir : le ratio et les phrases retrouvées, journalisés — un signal, pas un refus', () => {
  const s = signalDeRecopie(DEVOIR, 5, [{ ordre: 1, materiau: DEVOIR }])
  assert.match(s ?? '', /recopie du devoir \(C7-L8, cran 5\) — cas 1 : v1 = 1\.00 × le matériau ; 3 phrase\(s\) sur 3/)
})

test('une v1 qui n\'est que le passage réécrit (le trou du cran 5) : ratio bas, aucune phrase retrouvée', () => {
  const s = signalDeRecopie("Donc l'ennui apprend à l'enfant à se passer des autres.", 5, [{ ordre: 1, materiau: DEVOIR }])
  assert.match(s ?? '', /v1 = 0\.\d\d × le matériau ; 0 phrase\(s\) sur 3/)
})

// ── Le passage à corriger, et le nom ────────────────────────────────────────

test('`passagesACorriger` : le passage marqué d\'abord, sinon le passage du diff, jamais un vide', () => {
  assert.deepEqual(passagesACorriger([
    { passageMarque: 'Donc l’ennui est utile.', passageFautif: 'utile' },
    { passageMarque: null, passageFautif: 'le garant manque' },
    { passageMarque: '  ', passageFautif: null },
  ]), ['Donc l’ennui est utile.', 'le garant manque'])
})

test('`nomDeLObservable` : le nom de la fiche, sinon la dimension élève, sinon le code', () => {
  const o = { code: 'lien_explicite', competence: 'argumentation' }
  const corr = { argumentation: [{ observable_code: 'lien_explicite', dimension_eleve: 'le lien entre la preuve et la conclusion' }] }
  assert.deepEqual(nomDeLObservable(o, [{ competence: 'argumentation', observable_nom: 'Le lien', observable_code: 'lien_explicite' }], corr),
    { nom: 'Le lien', dimension: 'le lien entre la preuve et la conclusion' })
  assert.deepEqual(nomDeLObservable(o, [], corr), { nom: 'le lien entre la preuve et la conclusion', dimension: 'le lien entre la preuve et la conclusion' })
  assert.deepEqual(nomDeLObservable(o, [], {}), { nom: 'lien_explicite', dimension: null })
})
