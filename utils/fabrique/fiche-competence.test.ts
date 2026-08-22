// ============================================================================
// C4 · L8 — LA LECTURE D'UNE FICHE DE COMPÉTENCE.
// ----------------------------------------------------------------------------
// « Une fiche est un fichier markdown, et SA FORME EST CONNUE » (piège 5).
// Ces tests gardent ce que la lecture doit rendre, et surtout CE QU'ELLE NE
// DOIT PAS RATER : la section de correspondance peut être LA DERNIÈRE de la
// fiche, et une borne de fin mal écrite la ferait disparaître EN SILENCE — le
// professeur croirait avoir déposé une correspondance qui n'existe pas, et la
// compétence resterait non déclarable `evaluee` sans qu'il comprenne pourquoi.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lireFiche, FicheIllisible } from './fiche-competence'

const TABLE = `
| Observable | La dimension, dite à l'élève | La question « se juger » | Réponses possibles |
|---|---|---|---|
| \`jointure_presente\` | les liaisons entre tes paragraphes | Combien s'ouvrent sans reprendre ? | aucun · un ou deux · plusieurs |
| \`charniere_motivee\` | ce que tes liaisons disent | Tes liaisons annoncent-elles le mouvement ? | oui · en partie · non |
`

const fiche = (corps: string) => `# Structure — les instances

**VERSION 3.1.**

**Statut** : **RELUE ET VALIDÉE** *(un commentaire qui n'est pas le statut)*.

## 5. Observables

### La correspondance observable → formulation
${corps}`

test('la version, le statut nu, et la ligne de statut entière', () => {
  const f = lireFiche(fiche(TABLE), 'structure.md')
  assert.equal(f.competence, 'structure')
  assert.equal(f.version, '3.1')
  assert.equal(f.statut, 'RELUE ET VALIDÉE', 'le statut est le premier segment en gras')
  assert.ok(f.statutLigne.startsWith('RELUE ET VALIDÉE'))
})

test('la correspondance se lit, réponses fermées comprises', () => {
  const f = lireFiche(fiche(TABLE), 'structure.md')
  assert.equal(f.correspondance.length, 2)
  assert.deepEqual(f.correspondance[0], {
    observable_code: 'jointure_presente',
    dimension_eleve: 'les liaisons entre tes paragraphes',
    question: "Combien s'ouvrent sans reprendre ?",
    reponses: ['aucun', 'un ou deux', 'plusieurs'],
    ordre: 0,
  })
  assert.deepEqual(f.avertissements, [])
})

// LA GARDE QUI COMPTE : la section peut être la DERNIÈRE de la fiche.
test('la correspondance se lit MÊME quand sa section est la dernière', () => {
  const derniere = lireFiche(fiche(TABLE), 'structure.md')
  const suivie = lireFiche(fiche(TABLE + '\n## 6. Lieu de mesure\n\nautre chose\n'), 'structure.md')
  assert.equal(derniere.correspondance.length, 2)
  assert.equal(suivie.correspondance.length, 2, 'la borne de fin ne change rien au contenu lu')
  assert.deepEqual(derniere.correspondance, suivie.correspondance)
})

test('la section suivante n’est PAS avalée dans la table', () => {
  const f = lireFiche(fiche(TABLE
    + '\n## 6. Lieu de mesure\n\n| Observable | a | b | c |\n|---|---|---|---|\n'
    + '| `intrus` | x | y | z · w |\n'), 'structure.md')
  assert.deepEqual(f.correspondance.map((b) => b.observable_code),
    ['jointure_presente', 'charniere_motivee'], 'l’intrus de la section 6 reste dehors')
})

test('une réponse qui n’est pas fermée n’est pas versée, et se signale', () => {
  const f = lireFiche(fiche(
    "\n| Observable | dim | question | rep |\n|---|---|---|---|\n| `seul` | a | b | une seule |\n"),
  'structure.md')
  assert.equal(f.correspondance.length, 0)
  assert.ok(f.avertissements.some((a) => a.includes('moins de deux réponses')))
})

// LE MONITORING N'A PAS DE CORRESPONDANCE, et ce n'est pas un manque.
test('le Monitoring se dépose sans correspondance, et sans avertissement d’absence', () => {
  const f = lireFiche(`# Monitoring — la fiche

**VERSION 2.1.**

**Statut** : **RELUE ET VALIDÉE** — et c'est son plafond.

## 4. Comment il se mesure
`, 'monitoring.md')
  assert.equal(f.competence, 'monitoring')
  assert.deepEqual(f.correspondance, [])
  assert.deepEqual(f.avertissements, [], 'aucune correspondance attendue de lui')
})

test('une compétence sans correspondance est déposée, mais avertie', () => {
  const f = lireFiche(`# Structure

**VERSION 3.1.**

**Statut** : **RELUE ET VALIDÉE**.
`, 'structure.md')
  assert.deepEqual(f.correspondance, [])
  assert.ok(f.avertissements.some((a) => a.includes('PAS déclarable')))
})

test('une fiche sans VERSION, sans Statut, ou méconnaissable, ne se dépose pas', () => {
  assert.throws(() => lireFiche('# Structure\n\n**Statut** : **X**.\n', 'structure.md'), FicheIllisible)
  assert.throws(() => lireFiche('# Structure\n\n**VERSION 1.0.**\n', 'structure.md'), FicheIllisible)
  assert.throws(() => lireFiche('# Autre chose\n\n**VERSION 1.0.**\n\n**Statut** : **X**.\n', 'autre.md'),
    FicheIllisible)
})
