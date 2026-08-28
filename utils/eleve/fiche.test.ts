// ============================================================================
// C6 · L2 — LES ÉPREUVES DE LA FICHE DITE À L'ÉLÈVE.
// ----------------------------------------------------------------------------
// ⭐ Le fait qui commande ce fichier a été MESURÉ le 28/08 sur LES DEUX BASES :
//    `competences_fiches` porte SEPT lignes ; les six compétences portent un
//    `### 1.1` (726 à 824 caractères de citation), `monitoring` n'en a PAS.
// ============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  competenceExpliqueeALEleve, dimensionsDeLaFiche, estUneCompetenceDuReferentiel,
  inventaireDesFiches,
} from './fiche'
import type { DimensionDite } from './profil'

/** La forme EXACTE des six fiches en base (relevée sur `expression` v3.2). */
const FICHE = (texte: string) => `# Expression

**VERSION 3.2**

### 1.1 La compétence expliquée à l'élève

*Le texte servi à l'élève, avec la colonne « la dimension, dite à l'élève » du §5 — \`06-Palimpseste.md\` §5. Ni observable, ni seuil, ni décompte.*

> ${texte}

### 1.2 Le construct

**Expression** — sous-dimensions (descripteurs, jamais notées séparément).

### Les observables pour la télémétrie du routeur

| \`phrase_bancale\` | … |
`

const TEXTE = 'L’Expression, c’est ce que ton texte coûte à celui qui le lit.'

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · le paragraphe servi — le bloc de citation, et lui seul', () => {
  test('⭐ le texte se lit TEL QU’IL EST STOCKÉ — ni résumé, ni reformulé', () => {
    assert.equal(competenceExpliqueeALEleve(FICHE(TEXTE)), TEXTE)
  })

  test('⛔⛔ LA LIGNE EN ITALIQUE NE SORT PAS : c’est une consigne de FABRICATION', () => {
    const t = competenceExpliqueeALEleve(FICHE(TEXTE)) ?? ''
    assert.ok(!t.includes('Ni observable, ni seuil, ni décompte'),
      'servir cette ligne montrerait les coulisses à l’élève')
    assert.ok(!t.includes('06-Palimpseste.md'))
    assert.ok(!t.includes('§5'))
  })

  test('⛔ LA SECTION EST CLOSE PAR LE `###` SUIVANT — rien de 1.2 ne déborde', () => {
    const t = competenceExpliqueeALEleve(FICHE(TEXTE)) ?? ''
    assert.ok(!t.includes('construct'))
    assert.ok(!t.includes('phrase_bancale'), 'un code d’observable ne sort JAMAIS (RR4)')
  })

  test('⚠️ SANS `### 1.1`, on rend `null` — c’est le cas du `monitoring`', () => {
    assert.equal(competenceExpliqueeALEleve('# Monitoring\n\n### 4. La correspondance\n'), null)
  })

  test('⚠️ UN BLOC DE CITATION VIDE VAUT UNE SECTION ABSENTE', () => {
    assert.equal(competenceExpliqueeALEleve(FICHE('   ')), null)
  })

  test('⭐ UN BLOC DE CITATION À PLUSIEURS LIGNES garde ses paragraphes', () => {
    const brut = "### 1.1 La compétence expliquée à l'élève\n\n> Première ligne.\n> Seconde ligne.\n\n### 1.2 x\n"
    assert.equal(competenceExpliqueeALEleve(brut), 'Première ligne.\nSeconde ligne.')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · les dimensions — dans l’ordre de la fiche, et sans doublon', () => {
  const dims: DimensionDite[] = [
    { observableCode: 'c', dimensionEleve: 'la clarté de ton plan', ordre: 3 },
    { observableCode: 'a', dimensionEleve: 'le choix de tes mots', ordre: 1 },
    { observableCode: 'b', dimensionEleve: 'le choix de tes mots', ordre: 2 },
    { observableCode: 'd', dimensionEleve: '  ', ordre: 4 },
  ]

  test('⭐ l’ordre est celui de la colonne `ordre` — « l’ordre de la table dans la fiche »', () => {
    assert.deepEqual(dimensionsDeLaFiche(dims), ['le choix de tes mots', 'la clarté de ton plan'])
  })

  test('⚠️ une formulation partagée par deux observables ne se dit qu’UNE fois', () => {
    assert.equal(dimensionsDeLaFiche(dims).filter((d) => d === 'le choix de tes mots').length, 1)
  })

  test('⛔ un observable sans `dimension_eleve` n’entre pas — jamais son code', () => {
    assert.ok(!dimensionsDeLaFiche(dims).includes('d'))
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L2 · SIX FICHES, PAS SEPT', () => {
  test('⛔⛔ LE MONITORING EST ÉCARTÉ, ET LE MOTIF SE DIT', () => {
    const inv = inventaireDesFiches(
      [{ competence: 'monitoring', version: '2.1', contenu: '# Monitoring\n' }], new Map())
    assert.deepEqual(inv.fiches, [])
    assert.equal(inv.ecartees.length, 1)
    assert.equal(inv.ecartees[0].competence, 'monitoring')
    assert.match(inv.ecartees[0].motif, /référentiel/)
  })

  test('⭐ LES SIX SONT RENDUES, DANS L’ORDRE DU RÉFÉRENTIEL', () => {
    const lignes = ['questionnement', 'connaissance', 'synthese', 'argumentation',
      'structure', 'expression', 'monitoring']
      .map((c) => ({ competence: c, version: '1.0', contenu: FICHE(`Texte de ${c}.`) }))
    // Le `monitoring` ci-dessus porte un `### 1.1` par construction du gabarit :
    // c'est le FILTRE DU RÉFÉRENTIEL qui doit l'écarter, pas l'absence de texte.
    const inv = inventaireDesFiches(lignes, new Map())
    assert.equal(inv.fiches.length, 6, 'six, et six exactement')
    assert.deepEqual(inv.fiches.map((f) => f.competence),
      ['expression', 'argumentation', 'structure', 'connaissance', 'synthese', 'questionnement'])
    assert.deepEqual(inv.ecartees.map((e) => e.competence), ['monitoring'])
  })

  test('⚠️ LA CLAUSE GRANULAIRE : une fiche sans `### 1.1` bloque CETTE compétence, pas l’écran', () => {
    const inv = inventaireDesFiches([
      { competence: 'expression', version: '3.2', contenu: FICHE(TEXTE) },
      { competence: 'synthese', version: '3.4', contenu: '# Synthèse\n(sans 1.1)\n' },
    ], new Map())
    assert.deepEqual(inv.fiches.map((f) => f.competence), ['expression'])
    assert.match(inv.ecartees[0].motif, /1\.1/)
    assert.match(inv.ecartees[0].motif, /v3\.4/, 'le motif porte la version lue')
  })

  test('⭐ LES DEUX CONTENUS ARRIVENT ENSEMBLE — le texte et les dimensions', () => {
    const inv = inventaireDesFiches(
      [{ competence: 'expression', version: '3.2', contenu: FICHE(TEXTE) }],
      new Map([['expression', [
        { observableCode: 'a', dimensionEleve: 'le choix de tes mots', ordre: 1 },
      ]]]))
    assert.equal(inv.fiches[0].texte, TEXTE)
    assert.deepEqual(inv.fiches[0].dimensions, ['le choix de tes mots'])
  })

  test('⭐⭐ LA FICHE EST GÉNÉRIQUE : rien de son type ne peut porter un élève', () => {
    const inv = inventaireDesFiches(
      [{ competence: 'expression', version: '3.2', contenu: FICHE(TEXTE) }], new Map())
    // « Une fiche qui affiche "travaillé 4 fois" est un profil déguisé. »
    assert.deepEqual(Object.keys(inv.fiches[0]).sort(),
      ['competence', 'dimensions', 'texte', 'version'])
  })

  test('le garde du référentiel, en direct', () => {
    assert.equal(estUneCompetenceDuReferentiel('expression'), true)
    assert.equal(estUneCompetenceDuReferentiel('monitoring'), false)
    assert.equal(estUneCompetenceDuReferentiel('nimporte_quoi'), false)
  })
})
