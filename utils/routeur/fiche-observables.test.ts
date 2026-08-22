// « Quels observables sont REQUIS, c'est LA FICHE de la compétence qui le
//   déclare : le routeur lit, il ne décide pas » (`01-` §8.3).
//
// Les fragments ci-dessous sont recopiés des six fiches déposées en base
// (`competences_fiches.contenu`, C4-L8) — c'est exactement ce que le routeur
// lira. Trois formes de déclaration s'y trouvent, et une seule les lit toutes.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { observablesRequis, sectionTelemetrie, FicheSansObservables } from './fiche-observables'

/** Une fiche minimale : l'inventaire, la clause, puis la section qui la clôt. */
function fiche(lignesDeTable: string[], clauses: string[]): string {
  return [
    '## 5. Observables', '',
    '### Les observables pour la télémétrie du routeur', '',
    'Dérivés du squelette et des jugements à chaque mesure.', '',
    '| Observable | Définition | Usage |',
    '|---|---|---|',
    ...lignesDeTable, '',
    ...clauses, '',
    '### La correspondance observable → formulation', '',
    '| Observable | La dimension, dite à l\'élève | La question | Les réponses |',
    '|---|---|---|---|',
    '| `piege` | ceci ne doit JAMAIS entrer dans l\'inventaire | … | … |',
  ].join('\n')
}

const l = (code: string, usage = 'usage') => `| \`${code}\` | définition | ${usage} |`

// ── Forme 1 — « Tous …, sauf `x` » (Argumentation, Synthèse) ────────────────

test('« sauf `x` » — tous requis moins celui que la clause nomme', () => {
  const f = fiche(
    [l('garant_present'), l('lien_explicite'),
      l('nb_limites', 'signal d\'ambiguïté — **hors escalade, pas de bloc de correspondance**')],
    ['**Tous les observables de cette table sont requis** au sens de la précondition d\'escalade '
      + '(`01-routeur.md` §8.3), **sauf `nb_limites`** — un signal d\'ambiguïté de l\'instrument.'])
  const r = observablesRequis(f)
  assert.deepEqual(r.tous, ['garant_present', 'lien_explicite', 'nb_limites'])
  assert.deepEqual(r.requis, ['garant_present', 'lien_explicite'])
  assert.deepEqual(r.ecartes, ['nb_limites'])
  assert.deepEqual(r.avertissements, [])
})

// ── Forme 2 — « sauf deux : `a` … et `b` » (Expression) ─────────────────────

test('« sauf deux » — les deux codes se lisent, et le compte annoncé se recoupe', () => {
  const f = fiche(
    [l('taux_sens_passe'), l('reussites'), l('orthographe')],
    ['**Tous ces observables sont requis** au sens de la précondition d\'escalade '
      + '(`01-routeur.md` §8.3), **sauf deux** : `reussites` — l\'absence de réussite n\'est pas un '
      + 'défaut (§3), et le passage B→A relève de la règle de montée (`01-routeur.md` §8.8), jamais '
      + 'de l\'escalade — et `orthographe`, qui n\'entre jamais dans les grades.'])
  const r = observablesRequis(f)
  assert.deepEqual(r.requis, ['taux_sens_passe'])
  assert.deepEqual(r.ecartes, ['reussites', 'orthographe'])
  assert.deepEqual(r.avertissements, [])
})

test('un `fichier.md` cité entre accents graves dans la clause n\'est pas un observable', () => {
  // La clause de l'Expression cite `01-routeur.md` DEUX FOIS après son « sauf ».
  const f = fiche([l('taux_sens_passe'), l('reussites')],
    ['**Tous ces observables sont requis**, **sauf** : `reussites` — cf. `01-routeur.md` §8.8.'])
  assert.deepEqual(observablesRequis(f).requis, ['taux_sens_passe'])
})

// ── Forme 3 — « les sept premiers » + « hors escalade » (Questionnement) ────

test('« les N premiers » — les codes précèdent la clause, et le préfixe se recoupe', () => {
  const f = fiche(
    [l('question_presente'), l('recadrage'), l('recadrage_verbal'), l('recadrage_non_tenu')],
    ['**Les observables requis** au sens de la précondition d\'escalade (`01-routeur.md` §8.3) '
      + 'sont **les deux premiers**. `recadrage` en fait partie.', '',
    '**`recadrage_verbal` et `recadrage_non_tenu` sont hors escalade**, et pour une raison '
      + 'mécanique : leur dénominateur est le nombre de recadrages tentés.'])
  const r = observablesRequis(f)
  assert.deepEqual(r.requis, ['question_presente', 'recadrage'])
  assert.deepEqual(r.ecartes, ['recadrage_verbal', 'recadrage_non_tenu'])
  assert.deepEqual(r.avertissements, [])
})

// ── Forme 4 — « Aucun n'est requis » (Connaissance) ─────────────────────────

test('« Aucun n\'est requis » — l\'inventaire reste, les requis sont vides', () => {
  const f = fiche([l('mobilisation'), l('taux_justesse')],
    ['Dérivés du relevé jugé à chaque mesure. **Aucun n\'est requis au sens de l\'escalade** : '
      + 'l\'escalade vise la compétence cible, et la Connaissance n\'est jamais cible primaire.'])
  const r = observablesRequis(f)
  assert.deepEqual(r.tous, ['mobilisation', 'taux_justesse'])
  assert.deepEqual(r.requis, [])
  assert.deepEqual(r.avertissements, [])
})

// ── Ce que la lecture NE fait jamais ────────────────────────────────────────

test('la table de CORRESPONDANCE n\'entre jamais dans l\'inventaire', () => {
  // Les deux listes ne coïncident pas — c'est tout le motif de ce module.
  const f = fiche([l('jointure_presente')], ['**Tous les observables de cette table sont requis.**'])
  const r = observablesRequis(f)
  assert.ok(!r.tous.includes('piege'), 'la sous-section suivante a débordé dans l\'inventaire')
})

test('deux tables dans la même sous-section se lisent toutes les deux (la Synthèse)', () => {
  const f = [
    '### Les observables pour la télémétrie du routeur', '',
    '**Actifs sur les deux référents**', '',
    '| Observable | Définition | Usage |', '|---|---|---|',
    l('mobilisation_reliee'), '',
    '**Actifs sur le référent texte seulement**', '',
    '| Observable | Définition | Usage |', '|---|---|---|',
    l('elagage'), l('taux_compression', 'conformité de consigne ; hors bornes → signal'), '',
    '**Tous ces observables sont requis** au sens de la précondition d\'escalade, '
      + '**sauf `taux_compression`** — un signal de conformité de consigne.', '',
    '### La correspondance observable → formulation',
  ].join('\n')
  const r = observablesRequis(f)
  assert.deepEqual(r.tous, ['mobilisation_reliee', 'elagage', 'taux_compression'])
  assert.deepEqual(r.requis, ['mobilisation_reliee', 'elagage'])
})

test('« hors bornes » n\'est pas « hors escalade » — la ligne de table ne s\'écarte pas seule', () => {
  const f = fiche(
    [l('elagage'), l('taux_compression', 'conformité de consigne ; hors bornes → signal, jamais une note')],
    ['**Tous ces observables sont requis.**'])
  assert.deepEqual(observablesRequis(f).requis, ['elagage', 'taux_compression'])
})

// ── Ce qui se signale plutôt que de se corriger ─────────────────────────────

test('un ordinal qui ne tombe pas juste s\'AVERTIT — la fiche fait foi, on ne corrige pas', () => {
  const f = fiche([l('a_un'), l('a_deux'), l('a_trois')],
    ['**Les observables requis** sont **les deux premiers**.', '',
      '**`a_trois` est hors escalade.**'])
  const r = observablesRequis(f)
  assert.deepEqual(r.requis, ['a_un', 'a_deux'])
  assert.deepEqual(r.avertissements, [])

  const g = fiche([l('a_un'), l('a_deux'), l('a_trois')],
    ['**Les observables requis** sont **les deux premiers**.'])
  const s = observablesRequis(g)
  assert.equal(s.requis.length, 3, 'aucune clause n\'écarte : rien ne se retire de soi-même')
  assert.equal(s.avertissements.length, 2, 'le compte ET le préfixe se signalent')
})

test('une fiche sans sous-section de télémétrie LÈVE — deviner serait décider', () => {
  assert.throws(() => observablesRequis('# Une fiche\n\n## 5. Observables\n\nrien.'),
    FicheSansObservables)
})

test('une sous-section sans table LÈVE aussi', () => {
  assert.throws(
    () => observablesRequis('### Les observables pour la télémétrie du routeur\n\ndu texte.\n'),
    FicheSansObservables)
})

test('la sous-section se ferme au `###` suivant, jamais avant', () => {
  const s = sectionTelemetrie(fiche([l('x')], ['**Tous … sont requis.**']))
  assert.ok(s.includes('`x`'))
  assert.ok(!s.includes('correspondance observable'))
})
