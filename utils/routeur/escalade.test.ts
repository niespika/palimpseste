// « Les seuils se comptent en MESURES, jamais en semaines » (§1, principe 8), et
// « les compteurs ne se comptent pas pareil » (§8.6). Le cas « La stagnation
// instructive » de l'Annexe A est ici, et il fait foi.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  compteurN1N2, compteurN3, degreAppele, brancherN2, interventionN1, dossierN3,
  regimeV1Vf, elireLeRegistre, receptiviteRetrouvee, enRegimeDEntretien,
  type ConditionsEscalade, type EtatEscalade, type SignauxN2, type MesurePourCompteur,
} from './escalade'
import type { InstrumentLu } from './observables'
import type { Mesure } from './mesure'

const instrument: InstrumentLu = {
  observablesMesure: { garant_cite: { famille: 'proportion', reussie: 'au_moins', seuil: 0.5 } },
  parametres: {},
}

let n = 0
function mes(valeur: number | string, p: Partial<Mesure> = {}): Mesure {
  n++
  return {
    id: `m${n}`, competence: 'argumentation', modes: ['composer'], lettreEquivalente: 'C',
    observables: { garant_cite: valeur }, lieu: 'maison', forme: 'formatif', classeId: null,
    genre: null, sondeMontee: false, distanceContexte: null, delaiJours: null, delaiMesures: null,
    deltaV1Vf: null, paireCorrectionJuste: null, paireNouveauCasDetecte: null, depotId: null,
    bonus: false, instrumentVersion: null,
    mesureAt: `2026-09-${String(n).padStart(2, '0')}T10:00:00Z`, ...p,
  }
}
const rate = () => mes(0.1)
const reussi = () => mes(0.9)
const cible = (m: Mesure): MesurePourCompteur => ({ mesure: m, etaitCible: true })
const sonde = (m: Mesure): MesurePourCompteur => ({ mesure: m, etaitCible: false })

const conditions = (o: Partial<ConditionsEscalade> = {}): ConditionsEscalade => ({
  statutRecette: 'evaluee', profilProvisoire: false, segment: 3,
  preconditionBasse: true, preconditionHaute: true, semainesDepuisN1: 6, ...o,
})

// ── Les compteurs ──────────────────────────────────────────────────────────

test('trois mesures plates → le compteur de N1 vaut 3', () => {
  assert.equal(compteurN1N2([rate(), rate(), rate()], 'garant_cite', instrument, 4), 3)
})

test('le compteur NE SE RÉINITIALISE PAS — les mesures s\'accumulent en continu', () => {
  const h = [rate(), rate(), rate(), rate(), rate(), rate()]
  assert.equal(compteurN1N2(h, 'garant_cite', instrument, 4), 6, 'et non 4, la taille de la fenêtre')
})

test('un CHANGEMENT DE STATUT remet le compteur à zéro — c\'est la désescalade', () => {
  // Quatre ratés, puis assez de réussites pour franchir 2/3 sur la fenêtre de 4.
  const h = [rate(), rate(), rate(), rate(), reussi(), reussi(), reussi(), reussi()]
  assert.equal(compteurN1N2(h, 'garant_cite', instrument, 4), 0)
})

test('les compteurs de N1 et N2 ACCEPTENT les sondes secondaires — rien ne filtre', () => {
  const h = [rate(), rate(), rate()]
  assert.equal(compteurN1N2(h, 'garant_cite', instrument, 4), 3,
    'aucune notion de cible n\'entre dans ce compteur')
})

test('le compteur de N3 N\'ACCEPTE QUE les mesures où la compétence était CIBLE', () => {
  const h = [cible(rate()), sonde(rate()), cible(rate()), sonde(rate()), cible(rate())]
  assert.equal(compteurN3(h, 'garant_cite', instrument, 4), 3, 'trois cibles, deux sondes écartées')
})

test('« le progrès sous le seuil NE RETIENT PAS N1 — IL RETIENT N3 »', () => {
  // Quatre ratés, puis deux réussies : le TAUX DE RÉUSSITE sur la fenêtre monte
  // — 0, 0, 0, 0, puis 1/4, puis 2/4 — sans jamais franchir les 2/3 de
  // l'acquisition. L'observable reste donc en échec, et N1 le voit plat ; mais
  // « un élève dont le taux monte n'est pas un dossier à transférer ».
  const h = [cible(rate()), cible(rate()), cible(rate()), cible(rate()),
    cible(reussi()), cible(reussi())]
  const platN1 = compteurN1N2(h.map((x) => x.mesure), 'garant_cite', instrument, 4)
  const platN3 = compteurN3(h, 'garant_cite', instrument, 4)
  assert.equal(platN1, 6, 'N1 compte les six : le remède d\'isolement est exactement ce qu\'il lui faut')
  assert.equal(platN3, 4, 'N3 écarte les deux mesures sur lesquelles le taux a monté')
  assert.ok(platN1 > platN3)
})

test('les deux compteurs coïncident quand le taux ne monte jamais', () => {
  const h = [cible(rate()), cible(rate()), cible(rate())]
  assert.equal(compteurN1N2(h.map((x) => x.mesure), 'garant_cite', instrument, 4), 3)
  assert.equal(compteurN3(h, 'garant_cite', instrument, 4), 3)
})

// ── Le degré appelé ────────────────────────────────────────────────────────

test('3 mesures plates → N1 ; 6 → N2', () => {
  assert.equal(degreAppele(3, 0, conditions()).degre, 'N1')
  assert.equal(degreAppele(5, 0, conditions()).degre, 'N1')
  assert.equal(degreAppele(6, 0, conditions()).degre, 'N2')
})

test('N3 : DOUBLE condition — 8 mesures EN CIBLE **ET** 5 semaines depuis N1', () => {
  assert.equal(degreAppele(9, 8, conditions({ semainesDepuisN1: 5 })).degre, 'N3')
  assert.equal(degreAppele(9, 8, conditions({ semainesDepuisN1: 4 })).degre, 'N2',
    'le compteur est atteint, le temps ne l\'est pas : on reste au degré précédent')
  assert.equal(degreAppele(9, 7, conditions({ semainesDepuisN1: 20 })).degre, 'N2',
    'le temps est atteint, le compteur ne l\'est pas')
})

test('l\'escalade n\'existe QUE là où elle peut exister', () => {
  assert.equal(degreAppele(9, 9, conditions({ statutRecette: 'mesuree_silencieusement' })).degre, null)
  assert.equal(degreAppele(9, 9, conditions({ profilProvisoire: true })).degre, null)
  assert.equal(degreAppele(9, 9, conditions({ segment: 2 })).degre, null,
    'les compteurs ne démarrent qu\'au segment 3')
})

test('les deux préconditions du §8.3 bloquent avant tout compteur', () => {
  assert.equal(degreAppele(9, 9, conditions({ preconditionBasse: false })).degre, null)
  const h = degreAppele(9, 9, conditions({ preconditionHaute: false }))
  assert.equal(h.degre, null)
  assert.match(h.motif, /entretien ou rien, jamais N1/)
})

// ── N1 et la branche d'échec ───────────────────────────────────────────────

test('N1 prend un cran qui ISOLE l\'observable, et le retour est mono-focal', () => {
  const i = interventionN1('garant_cite', ['diagnostic_nomme'])
  assert.equal(i.cranIsolant, 'diagnostic_nomme')
  assert.equal(i.degrade, false)
  assert.equal(i.monoFocal, true)
})

test('BRANCHE D\'ÉCHEC : aucun cran ne porte l\'observable → servi quand même, `degrade`', () => {
  const i = interventionN1('garant_cite', [])
  assert.equal(i.cranIsolant, null, 'N1 reste sur le cran courant')
  assert.equal(i.degrade, true, 'et ça se journalise — sans la colonne, le compteur n\'existe pas')
  assert.equal(i.monoFocal, true, 'le retour dégrade en mono-focal')
})

// ── N2, aux crans de transformation ────────────────────────────────────────

const sig = (o: Partial<SignauxN2> = {}): SignauxN2 => ({
  deltaRestreint: 0.5, deltaFort: true, v1Plates: true, distanceEprouvee: false,
  toutesMemeType: false, paireCorrectionJuste: null, paireNouveauCasDetecte: null,
  regimeParPaires: false, ...o,
})

test('delta FAIBLE → RÉCEPTION : démonstratif, et le grain descend', () => {
  const b = brancherN2(sig({ deltaFort: false, deltaRestreint: 0.01 }))
  assert.equal(b.branche, 'reception')
  assert.equal(b.registre, 'demonstratif')
  assert.equal(b.descendreLeGrain, true)
})

test('delta FORT, v1 plates, distance ÉPROUVÉE → TRANSFERT : cran de diagnostic', () => {
  const b = brancherN2(sig({ distanceEprouvee: true }))
  assert.equal(b.branche, 'transfert')
  assert.equal(b.cranDeDiagnostic, true)
})

test('delta FORT, v1 plates, TOUTES `meme_type` → N2 NE CONCLUT PAS, IL CRÉE LE TEST', () => {
  const b = brancherN2(sig({ toutesMemeType: true }))
  assert.equal(b.branche, 'creer_le_test')
  assert.equal(b.creerLeTest, true)
  assert.match(b.motif, /rejugé au tour suivant/)
})

test('delta NULL : rien ne se branche — **NULL n\'est pas 0**, N2 serait aveugle', () => {
  const b = brancherN2(sig({ deltaRestreint: null }))
  assert.equal(b.branche, 'sans_objet')
  assert.match(b.motif, /NULL n'est pas 0/)
})

// ── N2, au régime PAR PAIRES ───────────────────────────────────────────────

const paire = (juste: boolean | null, detecte: boolean | null) =>
  brancherN2(sig({ regimeParPaires: true, paireCorrectionJuste: juste,
    paireNouveauCasDetecte: detecte }))

test('paire juste + détecté → AUCUNE branche, on poursuit', () => {
  assert.equal(paire(true, true).branche, 'sans_objet')
})

test('paire juste + NON détecté → transfert confirmé : PERSISTER, aucune intervention neuve', () => {
  const b = paire(true, false)
  assert.equal(b.branche, 'transfert')
  assert.equal(b.cranDeDiagnostic, false, 'on est déjà sur un cran de diagnostic')
  assert.match(b.motif, /PERSISTER/)
})

test('paire FAUSSE + non détecté → réception', () => {
  assert.equal(paire(false, false).branche, 'reception')
})

test('paire FAUSSE + détecté → réception aussi : LE DELTA PRIME', () => {
  const b = paire(false, true)
  assert.equal(b.branche, 'reception')
  assert.match(b.motif, /le delta.*prime/i)
})

test('paire non terminée : NULL n\'est pas un échec', () => {
  assert.equal(paire(null, null).branche, 'sans_objet')
  assert.equal(paire(true, null).branche, 'sans_objet')
})

test('LA TROISIÈME BRANCHE EST SANS OBJET au régime par paires', () => {
  // `toutesMemeType` est vrai, et pourtant on ne crée aucun test : chaque paire
  // met le transfert à l'épreuve par construction.
  const b = brancherN2(sig({ regimeParPaires: true, toutesMemeType: true,
    paireCorrectionJuste: true, paireNouveauCasDetecte: true }))
  assert.equal(b.creerLeTest, false)
})

// ── N3, son dossier et son re-signalement ──────────────────────────────────

const etatN3 = (o: Partial<EtatEscalade> = {}): EtatEscalade => ({
  observable: 'garant_cite', degre: 'N3', entreN1At: '2026-09-01T00:00:00Z',
  dossierN3OuvertAt: null, dossierN3TraiteAt: null, ...o,
})

test('N3 sans dossier → il s\'ouvre', () => {
  assert.equal(dossierN3(etatN3(), null).ouvrir, true)
})

test('un dossier non traité SE RE-SIGNALE à 3 semaines, et remonte en tête', () => {
  const d = etatN3({ dossierN3OuvertAt: '2026-09-01T00:00:00Z' })
  assert.equal(dossierN3(d, 2).reSignaler, false)
  assert.equal(dossierN3(d, 3).reSignaler, true)
  assert.equal(dossierN3(d, 9).reSignaler, true, 'ni plafond ni file d\'attente')
})

test('un dossier TRAITÉ ne se re-signale plus', () => {
  const d = etatN3({ dossierN3OuvertAt: '2026-09-01T00:00:00Z',
    dossierN3TraiteAt: '2026-09-15T00:00:00Z' })
  assert.equal(dossierN3(d, 20).reSignaler, false)
})

test('N1 et N2 n\'ouvrent aucun dossier', () => {
  assert.equal(dossierN3(etatN3({ degre: 'N1' }), null).ouvrir, false)
})

test('le régime d\'entretien se lit sur un N3 non traité', () => {
  assert.equal(enRegimeDEntretien([etatN3({ dossierN3OuvertAt: 'x' })]), true)
  assert.equal(enRegimeDEntretien([etatN3({ degre: 'N1' })]), false)
})

// ── §8.5 — la version finale pendant l'escalade ────────────────────────────

test('« le `regime_v1vf` ne se dérive JAMAIS du cran seul »', () => {
  assert.equal(regimeV1Vf('pas_de_vf', true, true), 'plein', 'escalade + observable ciblé → plein')
  assert.equal(regimeV1Vf('pas_de_vf', true, false), 'pas_de_vf', 'un autre observable : inchangé')
  assert.equal(regimeV1Vf('pas_de_vf', false, true), 'pas_de_vf', 'hors escalade : inchangé')
})

// ── §8.7 — l'élection du registre ──────────────────────────────────────────

test('1. hors `evaluee` : DESCRIPTIF, et aucun palier — les deux autres signaux ne jouent pas', () => {
  const r = elireLeRegistre({ statutRecette: 'mesuree_silencieusement', brancheN2: 'reception',
    receptiviteRetrouvee: false, palierCible: 'A', cranServi: 'production_autonome',
    n1CranInjecte: false })
  assert.equal(r.registre, 'descriptif')
})

test('2. N2 branche réception → DÉMONSTRATIF ; la réceptivité retrouvée rend le défaut', () => {
  const base = { statutRecette: 'evaluee' as const, brancheN2: 'reception' as const,
    palierCible: 'C' as const, cranServi: 'production_etayee' as const, n1CranInjecte: false }
  assert.equal(elireLeRegistre({ ...base, receptiviteRetrouvee: false }).registre, 'demonstratif')
  assert.equal(elireLeRegistre({ ...base, receptiviteRetrouvee: true }).registre, 'descriptif',
    'retour au défaut de la table')
})

test('3. la table : B au-dessus de sa bande → INTERROGATIF ; A au centre aussi', () => {
  const base = { statutRecette: 'evaluee' as const, brancheN2: null, receptiviteRetrouvee: false,
    n1CranInjecte: false }
  assert.equal(elireLeRegistre({ ...base, palierCible: 'B', cranServi: 'diagnostic_fin' }).registre,
    'interrogatif')
  assert.equal(elireLeRegistre({ ...base, palierCible: 'B', cranServi: 'production_autonome' })
    .registre, 'descriptif')
  assert.equal(elireLeRegistre({ ...base, palierCible: 'A', cranServi: 'diagnostic_fin' }).registre,
    'interrogatif')
  assert.equal(elireLeRegistre({ ...base, palierCible: 'E', cranServi: 'production_autonome' })
    .registre, 'demonstratif', 'la zone haute d\'E-D est démonstrative')
})

test('la case que N1 INJECTE vaut « sous la bande » : descriptif, mono-focal', () => {
  const r = elireLeRegistre({ statutRecette: 'evaluee', brancheN2: null,
    receptiviteRetrouvee: false, palierCible: 'B', cranServi: 'diagnostic_nomme',
    n1CranInjecte: true })
  assert.equal(r.registre, 'descriptif')
  assert.match(r.motif, /mono-focal/)
})

test('la réceptivité retrouvée demande LES DEUX dernières mesures au signal bon', () => {
  assert.equal(receptiviteRetrouvee([{ deltaFort: true, correctionJuste: null },
    { deltaFort: true, correctionJuste: null }]), true)
  assert.equal(receptiviteRetrouvee([{ deltaFort: true, correctionJuste: null },
    { deltaFort: false, correctionJuste: null }]), false)
  assert.equal(receptiviteRetrouvee([{ deltaFort: null, correctionJuste: true },
    { deltaFort: null, correctionJuste: true }]), true, 'la correction de paire juste vaut aussi')
  assert.equal(receptiviteRetrouvee([{ deltaFort: true, correctionJuste: null }]), false,
    'une seule ne suffit pas')
})

// ── Le cas « La stagnation instructive » (Annexe A) ────────────────────────

test('« La stagnation instructive » : garant_cite échoue 3 fois → N1, puis N2 réception', () => {
  const h = [rate(), rate(), rate()]
  assert.equal(compteurN1N2(h, 'garant_cite', instrument, 4), 3)
  assert.equal(degreAppele(3, 0, conditions()).degre, 'N1')

  // « ET LA VF DEVIENT REQUISE sur ces exercices » (§8.5).
  assert.equal(regimeV1Vf('pas_de_vf', true, true), 'plein')

  // « Deux échecs de plus, delta v1→vf FAIBLE restreint à l'observable → N2 branche réception. »
  const h2 = [...h, rate(), rate(), rate()]
  assert.equal(compteurN1N2(h2, 'garant_cite', instrument, 4), 6)
  assert.equal(degreAppele(6, 0, conditions()).degre, 'N2')
  const b = brancherN2(sig({ deltaFort: false, deltaRestreint: 0.01 }))
  assert.equal(b.branche, 'reception')
  assert.equal(b.registre, 'demonstratif')
  assert.equal(b.descendreLeGrain, true)
  // « La lettre C n'a rien piloté ; tout s'est joué sur les observables. »
})
