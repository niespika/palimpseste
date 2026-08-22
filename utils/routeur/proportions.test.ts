// « X et Y sont des objectifs de FIN D'ANNÉE, pas des seuils à tenir en
// permanence — IL N'Y A PAS DE FENÊTRE GLISSANTE » (`01-` §7).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  controleDeTrajectoire, controlesDeLaCompetence, perimetreDesObjectifs,
  modeLePlusEnRetard, remplacerLObjectif,
} from './proportions'
import { X_RECEPTIF, Y_INTERROGER } from './config'
import {
  deplacementsDeMasse, reporterAuGrainSuperieur, grainSuperieur, partDesSondesDeMontee,
  cransDeSonde, sondeCompte, type EtatMontee,
} from './montee'

// ── Le contrôle de trajectoire ─────────────────────────────────────────────

test('en avance (q élevé) → il PROPOSE AUTRE CHOSE', () => {
  const t = controleDeTrajectoire(0.40, 0.60, 0.5)
  assert.ok(t.tauxRequis !== null && t.tauxRequis <= t.O)
  assert.equal(t.force, 'propose_autre_chose')
})

test('en retard modéré → il PEUT ; trop en retard (> 1,5 × O) → il DOIT', () => {
  assert.equal(controleDeTrajectoire(0.40, 0.35, 0.5).force, 'peut')
  assert.equal(controleDeTrajectoire(0.40, 0.0, 0.5).force, 'doit', 'taux requis = 0,80 > 0,60')
})

test('« T se règle en RAPPORT à l\'objectif » — le "doit" tombe au MÊME MOMENT pour X et Y', () => {
  // Un élève encore à zéro : le « doit » se déclenche au TIERS de l'année.
  const auTiers = 1 / 3
  const x = controleDeTrajectoire(X_RECEPTIF, 0, auTiers + 0.01)
  const y = controleDeTrajectoire(Y_INTERROGER, 0, auTiers + 0.01)
  assert.equal(x.force, 'doit')
  assert.equal(y.force, 'doit')
  const xAvant = controleDeTrajectoire(X_RECEPTIF, 0, auTiers - 0.01)
  const yAvant = controleDeTrajectoire(Y_INTERROGER, 0, auTiers - 0.01)
  assert.equal(xAvant.force, 'peut')
  assert.equal(yAvant.force, 'peut')
})

test('GARDE-FOU au-delà de 100 % : il CESSE DE FORCER, et le manque se journalise', () => {
  const t = controleDeTrajectoire(0.40, 0, 0.9)
  assert.ok(t.tauxRequis !== null && t.tauxRequis > 1)
  assert.equal(t.force, 'garde_fou')
  assert.equal(t.manqueJournalise, true)
})

test('« le garde-fou arrive d\'autant PLUS TARD que l\'objectif est petit »', () => {
  // Y = 15 % reste atteignable là où X = 40 % ne l'est plus.
  assert.equal(controleDeTrajectoire(X_RECEPTIF, 0, 0.70).force, 'garde_fou')
  assert.notEqual(controleDeTrajectoire(Y_INTERROGER, 0, 0.70).force, 'garde_fou')
})

test('période finie (p = 1) : on cesse de forcer, et le manque se dit s\'il y en a un', () => {
  assert.equal(controleDeTrajectoire(0.40, 0.10, 1).manqueJournalise, true)
  assert.equal(controleDeTrajectoire(0.40, 0.50, 1).manqueJournalise, false)
})

test('un changement de lettre REMPLACE O, et NE RÉINITIALISE JAMAIS q ni p', () => {
  const avant = controleDeTrajectoire(0.40, 0.20, 0.5)
  const apres = remplacerLObjectif(avant, 0.60)
  assert.equal(apres.q, avant.q, 'q est un fait acquis')
  assert.equal(apres.p, avant.p, 'p aussi')
  assert.equal(apres.O, 0.60)
  assert.ok(apres.tauxRequis !== null && avant.tauxRequis !== null
    && apres.tauxRequis > avant.tauxRequis, 'le taux requis monte — le rattrapage est la conduite juste')
})

// ── « Où elle s'applique, et où elle mord » ────────────────────────────────

test('Expression et Connaissance (`composer` seul) : EXEMPTES mécaniquement', () => {
  const p = perimetreDesObjectifs(['composer'])
  assert.deepEqual(p, { X: false, Y: false })
  const c = controlesDeLaCompetence('expression', ['composer'], 0, 0, 0.5)
  assert.equal(c.X, null)
  assert.equal(c.Y, null)
  assert.equal(c.groupeReclame, null, 'la proportion ne réclame AUCUN groupe')
})

test('Synthèse (`restituer` seul) : X s\'applique, Y jamais', () => {
  assert.deepEqual(perimetreDesObjectifs(['restituer']), { X: true, Y: false })
})

test('Structure (`composer` + `expliquer`) : X SEUL, et Y ne s\'applique pas', () => {
  const c = controlesDeLaCompetence('structure', ['composer', 'expliquer'], 0, 0, 0.5)
  assert.notEqual(c.X, null)
  assert.equal(c.Y, null, 'la Structure n\'instancie pas `interroger`')
})

test('Questionnement : la table complète s\'applique — la seule', () => {
  const modes = ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger']
  assert.deepEqual(perimetreDesObjectifs(modes), { X: true, Y: true })
})

test('quand plusieurs « doit » tombent ensemble, on le SIGNALE — le tirage se journalise', () => {
  const modes = ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger']
  const c = controlesDeLaCompetence('questionnement', modes, 0, 0, 0.5)
  assert.equal(c.X?.force, 'doit')
  assert.equal(c.Y?.force, 'doit')
  assert.equal(c.plusieursDoit, true)
  assert.equal(c.groupeReclame, null, 'le module ne tranche pas seul')
})

test('un seul « doit » désigne son groupe', () => {
  const modes = ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger']
  const c = controlesDeLaCompetence('questionnement', modes, 0, 0.9, 0.5)
  assert.equal(c.X?.force, 'doit')
  assert.equal(c.groupeReclame, 'receptif')
  assert.equal(c.plusieursDoit, false)
})

// ── Étage 2 — le mode le plus en retard ────────────────────────────────────

test('on prend le mode LE PLUS EN RETARD sur son plancher', () => {
  const r = modeLePlusEnRetard({ restituer: 0.35, expliquer: 0.40, 'évaluer': 0.25 },
    { restituer: 0.30, expliquer: 0.10, 'évaluer': 0.25 })
  assert.equal(r?.mode, 'expliquer')
})

test('aucun retard → rien à préférer', () => {
  assert.equal(modeLePlusEnRetard({ restituer: 0.35 }, { restituer: 0.50 }), null)
})

// ── §8.8 — la montée ───────────────────────────────────────────────────────

test('M-b : la part des sondes se LIT à la table de la couche 3, et vaut RIEN chez A', () => {
  assert.equal(partDesSondesDeMontee('D'), 0.20)
  assert.equal(partDesSondesDeMontee('C'), 0.20)
  assert.equal(partDesSondesDeMontee('B'), 0.10)
  assert.equal(partDesSondesDeMontee('A'), 0, 'A est au sommet — sa montée passe au grain')
  assert.deepEqual(cransDeSonde('A'), [])
  assert.deepEqual(cransDeSonde('B'), ['diagnostic_fin'])
})

test('M-d : DEUX sondes réussies à la MÊME case déplacent la masse — et pas une de plus', () => {
  const d = deplacementsDeMasse([
    { grain: 'micro', cran: 'production_autonome', reussie: true },
    { grain: 'micro', cran: 'production_autonome', reussie: true },
  ])
  assert.equal(d.length, 1)
  assert.equal(d[0].grainMaitrise, 'micro')
  assert.equal(d[0].grainSuperieur, 'meso')
})

test('M-d : deux sondes à des cases DIFFÉRENTES ne déplacent rien', () => {
  assert.deepEqual(deplacementsDeMasse([
    { grain: 'micro', cran: 'production_autonome', reussie: true },
    { grain: 'meso', cran: 'production_autonome', reussie: true },
  ]), [])
})

test('M-d : « une sonde est ratée souvent » — les ratées ne comptent jamais', () => {
  assert.deepEqual(deplacementsDeMasse([
    { grain: 'micro', cran: 'production_autonome', reussie: false },
    { grain: 'micro', cran: 'production_autonome', reussie: false },
    { grain: 'micro', cran: 'production_autonome', reussie: true },
  ]), [])
})

test('M-d : « PAS DE FENÊTRE GLISSANTE » — deux réussites espacées comptent quand même', () => {
  const d = deplacementsDeMasse([
    { grain: 'meso', cran: 'diagnostic_fin', reussie: true },
    { grain: 'micro', cran: 'production_autonome', reussie: false },
    { grain: 'meso', cran: 'production_etayee', reussie: true },
    { grain: 'meso', cran: 'diagnostic_fin', reussie: true },
  ])
  assert.equal(d.length, 1)
  assert.equal(d[0].case_.cran, 'diagnostic_fin')
})

test('M-c : le report va AU GRAIN SUPÉRIEUR, et le cran atteint ne redescend jamais', () => {
  const etats: EtatMontee[] = [{ grain: 'micro', cranAtteint: 8 }, { grain: 'meso', cranAtteint: 3 }]
  const d = deplacementsDeMasse([
    { grain: 'micro', cran: 'production_autonome', reussie: true },
    { grain: 'micro', cran: 'production_autonome', reussie: true },
  ])[0]
  const apres = reporterAuGrainSuperieur(etats, d, () => 8)
  assert.equal(apres.find((e) => e.grain === 'meso')?.cranAtteint, 8)
  assert.equal(apres.find((e) => e.grain === 'micro')?.cranAtteint, 8, 'le grain maîtrisé est intact')

  const basse = reporterAuGrainSuperieur([{ grain: 'meso', cranAtteint: 9 }],
    { ...d, grainMaitrise: 'micro', grainSuperieur: 'meso' }, () => 5)
  assert.equal(basse[0].cranAtteint, 9, 'un report plus bas ne fait pas redescendre')
})

test('M-c : rien au-dessus du macro', () => {
  assert.equal(grainSuperieur('macro'), null)
  const etats: EtatMontee[] = [{ grain: 'macro', cranAtteint: 5 }]
  const d = deplacementsDeMasse([
    { grain: 'macro', cran: 'production_autonome', reussie: true },
    { grain: 'macro', cran: 'production_autonome', reussie: true },
  ])[0]
  assert.deepEqual(reporterAuGrainSuperieur(etats, d, () => 9), etats)
})

test('§8.9 borne (a) : une sonde ne compte pour la montée que si la compétence est `evaluee`', () => {
  assert.equal(sondeCompte('evaluee'), true)
  assert.equal(sondeCompte('mesuree_silencieusement'), false,
    'sondable, oui — mais « mesurer n\'est pas faire monter »')
})
