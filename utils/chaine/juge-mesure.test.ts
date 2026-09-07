// ============================================================================
// C7 · L9 — « sur un cran qui isole, le juge est la mesure » : la part PURE, éprouvée.
//   · la conversion d'un verdict en valeur (`03-` §1) — LE TEST QUI PROUVE LA RÈGLE :
//     pour chacun des observables isolés par le `09-`, `statutDeLaMesure(valeurDuVerdict
//     (e, true), e)` vaut `reussie` et `…(e, false)` vaut `ratee`, POUR TOUT SEUIL
//     balayé de 0 à 1 — c'est la raison d'être de l'extrême (piège 6) ;
//   · le périmètre se lit sur trois choses (piège 4), la porte n'a de sens que le
//     juge ouvert (piège 5), sans observable de clé la chaîne d'hier (piège 9) ;
//   · le delta des verdicts (+1 · 0 · −1, NULL sans l'un des deux) ;
//   · la mesure convertie : le verdict sur le seul observable, `n/a` ailleurs.
// ============================================================================
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { etatCompetence, valeursDesParametres, type EntreeObservableMesure } from './instruments'
import { NA, statutDeLaMesure, tauxDeReussite, valeurDuVerdict, VALEURS_D_ABSENCE } from './observables'
import {
  CRANS_QUI_ISOLENT, CRANS_SANS_APPEL, deltaDesVerdicts, estUneMesureConvertie, observableMesurable,
  observablesConvertis, regimeJugeMesure, suiteDeVerdicts,
} from './juge-mesure'
import { COMPETENCES, type Competence } from './types'
import type { CleDuCas } from './cle'

// ── Les observables que le `09-` isole — mesurés en bac à sable le 07/09/2026 sur
//    `exercices_problemes` (206 problèmes, 187 routés, 52 observables distincts) ;
//    les 5 SANS entrée `observables_mesure` sont ceux du `03-` §1 (21 clés).
const ISOLES: ReadonlyArray<[Competence, string]> = [
  ['argumentation', 'garant_ambigu'], ['argumentation', 'garant_circulaire'], ['argumentation', 'garant_present'],
  ['argumentation', 'garant_vague'], ['argumentation', 'lien_explicite'], ['argumentation', 'mode_discursif'],
  ['argumentation', 'objection_traitee'], ['argumentation', 'preuve_circulaire'], ['argumentation', 'source_cosmetique'],
  ['argumentation', 'statuts_distingues'], ['argumentation', 'these_adverse'],
  ['connaissance', 'contresens'], ['connaissance', 'mobilisation'], ['connaissance', 'taux_justesse'], ['connaissance', 'unite_plaquee'],
  ['expression', 'attache_presente'], ['expression', 'densite_friction'], ['expression', 'densite_generique'],
  ['expression', 'mot_impropre'], ['expression', 'repetition_pauvre'], ['expression', 'savant_plaque'], ['expression', 'taux_sens_passe'],
  ['questionnement', 'debat_situe'], ['questionnement', 'enjeu'], ['questionnement', 'notions_en_tension'],
  ['questionnement', 'question_presente'], ['questionnement', 'question_propre'], ['questionnement', 'question_specifique'],
  ['questionnement', 'recadrage'], ['questionnement', 'recadrage_non_tenu'], ['questionnement', 'recadrage_verbal'],
  ['structure', 'bloc_relie'], ['structure', 'bloc_unite'], ['structure', 'charniere_formule'], ['structure', 'charniere_motivee'],
  ['structure', 'decoupage_present'], ['structure', 'derive'], ['structure', 'fonction_moments'], ['structure', 'jointure_presente'],
  ['structure', 'plan_tenu'], ['structure', 'promesse_presente'],
  ['synthese', 'apport_decoratif'], ['synthese', 'apport_non_couvrant'], ['synthese', 'apport_organisateur'], ['synthese', 'apport_vide'],
  ['synthese', 'contresens_partiel'], ['synthese', 'copie_verbatim'], ['synthese', 'couverture_essentielles'], ['synthese', 'elagage'],
  ['synthese', 'mobilisation_reliee'], ['synthese', 'part_integrative'], ['synthese', 'relation_rendue'],
]
const SANS_ENTREE = new Set(['structure|fonction_moments', 'structure|decoupage_present', 'argumentation|these_adverse',
  'argumentation|mode_discursif', 'argumentation|statuts_distingues'])

const entreeDe = (c: Competence, code: string): EntreeObservableMesure | undefined =>
  etatCompetence(c).instrument?.observables_mesure[code]

test('les cinq observables du 09- sans entrée `observables_mesure` sont ceux du 03- §1, et EUX SEULS (piège 7)', () => {
  const manquants = ISOLES.filter(([c, code]) => !entreeDe(c, code)).map(([c, code]) => `${c}|${code}`)
  assert.deepEqual(new Set(manquants), SANS_ENTREE)
  assert.equal(manquants.length, 5)
  assert.equal(ISOLES.length - manquants.length, 47)
})

// ⚠️ MESURÉ le 07/09 sur les instruments dérivés : UN observable isolé sur 47 n'est
//    pas couvert par la table du `03-` §1 — `synthese|contresens_partiel`, un
//    COMPTAGE rapporté `au_plus` dont le seuil (paramètre `contresens_partiels_
//    plafond_moyen`) vaut 2 : le « 1 » du raté reste SOUS le seuil. La conversion
//    rend alors `n/a` et le dit, jamais une valeur fausse (DETTE, question à Louis).
const NON_COUVERTS = new Set<string>()  // 08/09 : le seuil doublé (1 au minimum) couvre `contresens_partiel`

test('⭐ LA RÈGLE — pour les 47 observables isolés, réussi lit `reussie` et raté lit `ratee` au seuil DÉCLARÉ (un cas non couvert, nommé)', () => {
  let eprouves = 0
  for (const [c, code] of ISOLES) {
    const e = entreeDe(c, code)
    if (!e) continue
    const params = valeursDesParametres(etatCompetence(c).instrument!)
    const bonne = valeurDuVerdict(code, e, true, params)
    const mauvaise = valeurDuVerdict(code, e, false, params)
    assert.equal(bonne.alerte, null, `${c}|${code} réussi : ${bonne.alerte?.motif}`)
    assert.equal(statutDeLaMesure(bonne.valeur, e, params), 'reussie', `${c}|${code} réussi`)
    if (NON_COUVERTS.has(`${c}|${code}`)) {
      assert.equal(mauvaise.valeur, NA, `${c}|${code} raté : attendu n/a`)
      assert.match(mauvaise.alerte?.motif ?? '', /ne se relit pas « ratee »/)
    } else {
      assert.equal(mauvaise.alerte, null, `${c}|${code} raté : ${mauvaise.alerte?.motif}`)
      assert.equal(statutDeLaMesure(mauvaise.valeur, e, params), 'ratee', `${c}|${code} raté`)
    }
    eprouves += 1
  }
  assert.equal(eprouves, 47)
})

test('⭐ LA RAISON D\'ÊTRE DE L\'EXTRÊME — pour tout seuil balayé de 0 à 1, une valeur convertie se relit comme son verdict, ou vaut n/a et le dit', () => {
  let balayes = 0
  for (const [c, code] of ISOLES) {
    const e = entreeDe(c, code)
    if (!e || e.reussie === 'vaut') continue
    const params = valeursDesParametres(etatCompetence(c).instrument!)
    for (let s = 0; s <= 1.0001; s += 0.05) {
      const entree: EntreeObservableMesure = { ...e, seuil: Number(s.toFixed(2)), seuil_parametre: undefined }
      for (const reussi of [true, false]) {
        const r = valeurDuVerdict(code, entree, reussi, params)
        if (r.valeur === NA) {
          assert.ok(r.alerte, `${c}|${code} au seuil ${s} : n/a sans alerte`)
        } else {
          assert.equal(statutDeLaMesure(r.valeur, entree, params), reussi ? 'reussie' : 'ratee', `${c}|${code} au seuil ${s}, ${reussi}`)
        }
        balayes += 1
      }
    }
    // Sur la plage où le seuil n'est pas dégénéré, JAMAIS de n/a — proportions et
    // comptages rapportés (bornés par 1) : `plus_de` / `au_plus` sur [0, 1), `au_moins`
    // / `moins_de` sur (0, 1]. Un comptage (non borné) n'entre pas dans cette clause.
    if (e.famille === 'proportion' || e.famille === 'comptage rapporté') {
      for (let s = 0.05; s < 1; s += 0.05) {
        const entree: EntreeObservableMesure = { ...e, seuil: Number(s.toFixed(2)), seuil_parametre: undefined }
        assert.notEqual(valeurDuVerdict(code, entree, true, params).valeur, NA, `${c}|${code} réussi au seuil ${s}`)
        assert.notEqual(valeurDuVerdict(code, entree, false, params).valeur, NA, `${c}|${code} raté au seuil ${s}`)
      }
    }
  }
  assert.ok(balayes > 1000)
})

test('la table du 03- §1 : proportion/comptage au_moins → 1/0, au_plus → 0/1, densité au_plus → 0 / seuil doublé, binaire → valeur_reussie / absence', () => {
  const prop: EntreeObservableMesure = { famille: 'proportion', reussie: 'au_moins', seuil: 0.5 }
  assert.equal(valeurDuVerdict('x', prop, true).valeur, 1)
  assert.equal(valeurDuVerdict('x', prop, false).valeur, 0)
  const defauts: EntreeObservableMesure = { famille: 'comptage', reussie: 'au_plus', seuil: 0 }
  assert.equal(valeurDuVerdict('x', defauts, true).valeur, 0)
  assert.equal(valeurDuVerdict('x', defauts, false).valeur, 1)
  // ⭐ un comptage `au_plus 2` : le raté vaut le seuil doublé, 1 au minimum (Louis, 08/09)
  const deux: EntreeObservableMesure = { famille: 'comptage', reussie: 'au_plus', seuil: 2 }
  assert.equal(valeurDuVerdict('x', deux, true).valeur, 0)
  assert.equal(valeurDuVerdict('x', deux, false).valeur, 4)
  assert.equal(valeurDuVerdict('x', { ...deux, seuil: 0 }, false).valeur, 1)
  const strict: EntreeObservableMesure = { famille: 'comptage rapporté', rapporte_a: 'n', reussie: 'moins_de', seuil: 0.3 }
  assert.equal(valeurDuVerdict('x', strict, true).valeur, 0)
  assert.equal(valeurDuVerdict('x', strict, false).valeur, 1)
  const densite: EntreeObservableMesure = { famille: 'densité', reussie: 'au_plus', seuil: 0.12 }
  assert.equal(valeurDuVerdict('x', densite, true).valeur, 0)
  assert.equal(valeurDuVerdict('x', densite, false).valeur, 0.24)
  // le seuil par paramètre — lu par `parametres`, jamais `instrument.parametres`
  const densiteP: EntreeObservableMesure = { famille: 'densité', reussie: 'au_plus', seuil_parametre: 'seuil_x' }
  assert.equal(valeurDuVerdict('x', densiteP, false, { seuil_x: 0.2 }).valeur, 0.4)
  assert.equal(valeurDuVerdict('x', densiteP, false, {}).valeur, NA)
  assert.match(valeurDuVerdict('x', densiteP, false, {}).alerte?.motif ?? '', /sans seuil numérique/)
  // binaire : `valeur_reussie` (le PREMIER terme d'une liste), et la valeur d'absence
  const qp: EntreeObservableMesure = { famille: 'binaire', reussie: 'vaut', valeur_reussie: ['question_explicite', 'tension_affirmee'] }
  assert.equal(valeurDuVerdict('question_presente', qp, true).valeur, 'question_explicite')
  assert.equal(valeurDuVerdict('question_presente', qp, false).valeur, 'absent')
  const oui: EntreeObservableMesure = { famille: 'binaire', reussie: 'vaut', valeur_reussie: 'oui' }
  assert.equal(valeurDuVerdict('plan_tenu', oui, false).valeur, 'non')
  assert.equal(valeurDuVerdict('objection_traitee', oui, true).valeur, 'oui')
  // un binaire réellement booléen, hors de la liste des onze : l'absence est `false` par construction
  const bool: EntreeObservableMesure = { famille: 'binaire', reussie: 'vaut', valeur_reussie: true }
  assert.equal(valeurDuVerdict('inconnu_bool', bool, false).valeur, false)
  // un binaire texte hors de la liste : rien ne se convertit, et l'alerte le dit
  const texte: EntreeObservableMesure = { famille: 'binaire', reussie: 'vaut', valeur_reussie: 'present' }
  assert.equal(valeurDuVerdict('inconnu_texte', texte, false).valeur, NA)
  // un ordinal, un sans_objet : n/a, et l'alerte le dit — on n'invente pas une famille
  const ord: EntreeObservableMesure = { famille: 'ordinal', echelle: ['a', 'b'], reussie: 'au_moins', seuil: 'b' }
  assert.equal(valeurDuVerdict('x', ord, true).valeur, NA)
  assert.match(valeurDuVerdict('x', ord, true).alerte?.motif ?? '', /ordinal/)
  const so: EntreeObservableMesure = { famille: 'proportion', reussie: 'sans_objet' }
  assert.equal(valeurDuVerdict('x', so, true).valeur, NA)
})

test('les onze valeurs d\'absence du 03- §1, et rien de plus', () => {
  assert.deepEqual(Object.keys(VALEURS_D_ABSENCE).sort(), [
    'apport_organisateur', 'debat_situe', 'enjeu', 'notions_en_tension', 'objection_traitee', 'plan_tenu',
    'promesse_presente', 'question_presente', 'question_propre', 'question_specifique', 'recadrage',
  ])
})

test('`observablesConvertis` : le verdict sur le SEUL observable de la clé, n/a partout ailleurs (piège 7)', () => {
  const inst = etatCompetence('argumentation').instrument!
  const r = observablesConvertis(inst.observables_mesure, 'garant_present', true, valeursDesParametres(inst))
  assert.equal(r.alerte, null)
  assert.equal(r.observables.garant_present, 1)
  for (const [k, v] of Object.entries(r.observables)) if (k !== 'garant_present') assert.equal(v, NA, k)
  assert.equal(Object.keys(r.observables).length, Object.keys(inst.observables_mesure).length)
  // la fenêtre d'évidence la lit comme réussie SANS cas particulier, et le taux pondéré rend 0,6 au cran 5
  const e = inst.observables_mesure.garant_present
  assert.equal(statutDeLaMesure(r.observables.garant_present, e, valeursDesParametres(inst)), 'reussie')
  const t = tauxDeReussite([r.observables.garant_present], e, valeursDesParametres(inst), [0.6])
  assert.deepEqual(t, { reussies: 0.6, denominateur: 0.6, taux: 1 })
  // un code absent de l'instrument : rien à convertir, l'alerte le dit
  assert.match(observablesConvertis(inst.observables_mesure, 'these_adverse', true).alerte ?? '', /absent de l'instrument/)
})

// ── Le périmètre ──────────────────────────────────────────────────────────────
const CLE: CleDuCas = { cle: 'argument.garant.absent', observableCode: 'garant_present', observableCompetence: 'argumentation', observableRoute: true, lecture: 'ok' }
const codes = (c: string) => Object.keys(etatCompetence(c as Competence).instrument?.observables_mesure ?? {})
const ctx = (p: Partial<Parameters<typeof regimeJugeMesure>[0]> = {}): Parameters<typeof regimeJugeMesure>[0] => ({
  jugeMesureActif: true, jugeDocumentsActif: true, cran: 5, origine: 'routeur', lieu: 'maison', forme: 'formatif', cle: CLE, ...p,
})

test('⛔ porte FERMÉE : inactif, sans un mot (la chaîne d\'hier à l\'octet)', () => {
  assert.deepEqual(regimeJugeMesure(ctx({ jugeMesureActif: false }), codes), { actif: false, alertes: [], observable: null })
})

test('piège 5 — porte ouverte et juge FERMÉ : rien ne change, et une alerte nommée', () => {
  const r = regimeJugeMesure(ctx({ jugeDocumentsActif: false }), codes)
  assert.equal(r.actif, false)
  assert.match(r.alertes[0], /`juge_mesure_actif` sans `juge_documents_actif` : rien ne change/)
})

test('piège 4 — le périmètre se lit sur trois choses : le cran, l\'origine, le lieu et la forme', () => {
  for (const cran of [1, 2, 3, 4, 5, 7, 9]) assert.equal(regimeJugeMesure(ctx({ cran }), codes).actif, true, `cran ${cran}`)
  for (const cran of [6, 8, null]) assert.equal(regimeJugeMesure(ctx({ cran }), codes).actif, false, `cran ${cran}`)
  assert.equal(regimeJugeMesure(ctx({ origine: 'prof' }), codes).actif, false)
  assert.equal(regimeJugeMesure(ctx({ origine: null }), codes).actif, false)
  assert.equal(regimeJugeMesure(ctx({ lieu: 'classe' }), codes).actif, false)
  assert.equal(regimeJugeMesure(ctx({ forme: 'sommatif' }), codes).actif, false)
  assert.deepEqual([...CRANS_QUI_ISOLENT].sort(), [1, 2, 3, 4, 5, 7, 9])
  assert.deepEqual([...CRANS_SANS_APPEL].sort(), [1, 3])
})

test('piège 9 — sans observable de clé, rien à convertir : la chaîne d\'hier, et l\'alerte le dit', () => {
  const sans = regimeJugeMesure(ctx({ cle: null }), codes)
  assert.equal(sans.actif, false)
  assert.match(sans.alertes[0], /SANS clé/)
  const nonRoutee = regimeJugeMesure(ctx({ cle: { ...CLE, observableRoute: false, lecture: 'sans_observable' } }), codes)
  assert.equal(nonRoutee.actif, false)
  assert.match(nonRoutee.alertes[0], /sans observable routé/)
})

test('piège 7 — un observable du 09- sans entrée `observables_mesure` : le régime s\'applique, AUCUNE mesure, l\'alerte nomme l\'observable', () => {
  const r = regimeJugeMesure(ctx({ cle: { ...CLE, observableCode: 'these_adverse' } }), codes)
  assert.equal(r.actif, true)
  assert.equal(observableMesurable(r, codes), false)
  assert.match(r.alertes[0], /« these_adverse » de argumentation SANS entrée `observables_mesure`/)
  const ok = regimeJugeMesure(ctx(), codes)
  assert.equal(ok.actif, true)
  assert.deepEqual(ok.alertes, [])
  assert.equal(observableMesurable(ok, codes), true)
})

test('l\'observable de la clé se lit INDÉPENDAMMENT de `chaine_cle_actif` (piège 29) : le régime n\'y touche pas', () => {
  // `regimeJugeMesure` ne reçoit pas `chaineCleActif` : la porte de C7-L8 n'entre pas dans sa décision.
  const r = regimeJugeMesure(ctx(), codes)
  assert.deepEqual(r.observable, { cle: 'argument.garant.absent', code: 'garant_present', competence: 'argumentation' })
})

// ── Le delta, la suite de verdicts, la mesure convertie ───────────────────────
test('`deltaDesVerdicts` : raté → réussi = +1, réussi → raté = −1, sinon 0 ; NULL sans l\'un des deux — et NULL n\'est pas 0', () => {
  assert.equal(deltaDesVerdicts({ reussi: false }, { reussi: true }), 1)
  assert.equal(deltaDesVerdicts({ reussi: true }, { reussi: false }), -1)
  assert.equal(deltaDesVerdicts({ reussi: true }, { reussi: true }), 0)
  assert.equal(deltaDesVerdicts({ reussi: false }, { reussi: false }), 0)
  assert.equal(deltaDesVerdicts(null, { reussi: true }), null)
  assert.equal(deltaDesVerdicts({ reussi: true }, null), null)
  assert.equal(deltaDesVerdicts(undefined, undefined), null)
})

test('`suiteDeVerdicts` dit « raté, réussi, réussi », jamais « 0, 1, 1 » ; une mesure d\'hier s\'y lit pareil ; n/a ne dit rien', () => {
  const e: EntreeObservableMesure = { famille: 'proportion', reussie: 'au_moins', seuil: 0.5 }
  const fen = [{ observables: { x: 0 } }, { observables: { x: 1 } }, { observables: { x: NA } }, { observables: { x: 0.7 } }, { observables: null }]
  assert.equal(suiteDeVerdicts(fen, 'x', e), 'raté, réussi, réussi')
  assert.equal(suiteDeVerdicts([], 'x', e), '')
})

test('une mesure convertie se reconnaît à sa lettre nulle sur un cran qui isole (piège 16 : le choix, dit)', () => {
  assert.equal(estUneMesureConvertie({ lettre_equivalente: null }, 5), true)
  assert.equal(estUneMesureConvertie({ lettre_equivalente: 'C' }, 5), false)
  assert.equal(estUneMesureConvertie({ lettre_equivalente: null }, 6), false)
  assert.equal(estUneMesureConvertie({ lettre_equivalente: null }, null), false)
})

test('les six compétences ont un instrument dérivé — la conversion ne se joue jamais sur une fiche', () => {
  for (const c of COMPETENCES) assert.ok(etatCompetence(c).instrument, c)
})
