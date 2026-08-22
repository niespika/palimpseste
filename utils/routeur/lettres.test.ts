// « Le plafond ancre + 2 borne L'AFFICHAGE, JAMAIS le ciblage ni la stagnation »
// (`01-` §9). Les deux valeurs sortent ensemble, ou la règle est fausse.
//
// Le cas « Le fort au mauvais jour » de l'Annexe A est ici, et il fait foi.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  jugerLaLettre, plafondApplicable, monteParTrajectoire, cloturerLaCalibration,
  medianeDeClasse, derniereAncre, type EtatNiveau,
} from './lettres'
import type { Mesure } from './mesure'
import type { Palier } from './types'

let n = 0
function m(p: Partial<Mesure> & { lettreEquivalente: Palier | null }): Mesure {
  n++
  return {
    id: `m${n}`, competence: 'structure', modes: ['composer'], observables: null,
    lieu: 'maison', forme: 'formatif', classeId: null, genre: null, sondeMontee: false,
    distanceContexte: null, delaiJours: null, delaiMesures: null, deltaV1Vf: null,
    paireCorrectionJuste: null, paireNouveauCasDetecte: null, depotId: null, bonus: false,
    instrumentVersion: null, mesureAt: `2026-09-${String(n).padStart(2, '0')}T10:00:00Z`,
    ...p,
  }
}

const ancre = (p: Palier) => m({ lettreEquivalente: p, lieu: 'classe', forme: 'sommatif' })

const etat = (o: Partial<EtatNiveau> = {}): EtatNiveau => ({
  lettre: 'C', ancreDerniereDate: null, ancreDerniereValeur: null, lettreInitiale: null,
  profilProvisoire: false, statutRecettePoseLe: null, ...o,
})

const jamaisVieux = () => 0
const ctx = { cyclesDepuis: jamaisVieux }

// ── Le plafond ─────────────────────────────────────────────────────────────

test('avec une ancre : le plafond vaut ancre + 2', () => {
  const p = plafondApplicable(etat({ ancreDerniereValeur: 'D' }))
  assert.equal(p.plafond, 'B')
  assert.equal(p.sansAncre, false)
})

test('sans ancre réelle : le plafond vaut VALEUR INITIALE + 1, pas ancre + 2', () => {
  const p = plafondApplicable(etat({ lettreInitiale: 'D' }))
  assert.equal(p.plafond, 'C', 'D + 1 = C, et non D + 2')
  assert.equal(p.sansAncre, true)
})

test('ni ancre ni valeur initiale : aucun plafond inventé', () => {
  assert.equal(plafondApplicable(etat()).plafond, null)
})

test('le plafond ne déborde jamais l\'échelle', () => {
  assert.equal(plafondApplicable(etat({ ancreDerniereValeur: 'B' })).plafond, 'A')
  assert.equal(plafondApplicable(etat({ ancreDerniereValeur: 'A' })).plafond, 'A')
})

// ── Le cas de l'Annexe A : « Le fort au mauvais jour » ─────────────────────

test('« Le fort au mauvais jour » : la trajectoire bute au plafond, ET AUCUN DRAPEAU', () => {
  // Diagnostic raté à D en Structure ; plafond = D + 2 = B.
  const e = etat({ lettre: 'B', ancreDerniereValeur: 'D', ancreDerniereDate: '2026-09-01' })
  const v = jugerLaLettre(e, [m({ lettreEquivalente: 'A' }), m({ lettreEquivalente: 'A' })], ctx)
  assert.equal(v.plafond, 'B')
  assert.equal(v.lettre, 'B', 'l\'affichage bute au plafond')
  assert.equal(v.valeurNonPlafonnee, 'A', 'le ciblage, lui, voit la vraie valeur')
  assert.deepEqual(v.drapeaux, [], 'aucun drapeau — c\'est le comportement voulu, l\'anti-inflation')
})

test('le plafond ne touche JAMAIS la valeur non plafonnée', () => {
  // Ancre à E, lettre déjà à C (= E + 2, le plafond) ; la trajectoire pousse à B.
  // Aucune ancre neuve ce cycle : la discordance ne joue pas, le plafond seul borne.
  const e = etat({ lettre: 'C', ancreDerniereValeur: 'E', ancreDerniereDate: '2026-09-01' })
  const v = jugerLaLettre(e, [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'B' })], ctx)
  assert.equal(v.lettre, 'C', 'E + 2 = C : l\'affichage bute')
  assert.equal(v.valeurNonPlafonnee, 'B', 'la valeur que lisent le ciblage et la stagnation')
  assert.deepEqual(v.drapeaux, [], 'buter au plafond ne lève rien')
})

// ── La montée par la trajectoire ───────────────────────────────────────────

test('2 mesures ≥ lettre+1 sur les 3 dernières → +1 palier, jamais plus', () => {
  const v = jugerLaLettre(etat({ lettre: 'D' }),
    [m({ lettreEquivalente: 'A' }), m({ lettreEquivalente: 'A' })], ctx)
  assert.equal(v.valeurNonPlafonnee, 'C', 'D monte à C, jamais à B ni à A')
  assert.equal(v.mouvement, 'montee')
})

test('une seule mesure au-dessus ne suffit pas', () => {
  const v = jugerLaLettre(etat({ lettre: 'D' }),
    [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'D' })], ctx)
  assert.equal(v.valeurNonPlafonnee, 'D')
  assert.equal(v.mouvement, 'aucun')
})

test('les 3 dernières OU la fenêtre de 6 cycles — alternatives, jamais cumulées', () => {
  // Depuis C, le seuil est B. Deux B, mais aux DEUX BOUTS : les 3 dernières n'en
  // voient qu'un — c'est la fenêtre large, seule, qui en voit deux.
  const auxDeuxBouts = [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'D' }),
    m({ lettreEquivalente: 'D' }), m({ lettreEquivalente: 'B' })]
  assert.equal(monteParTrajectoire('C', auxDeuxBouts, () => 0), true,
    'la fenêtre de montée les rattrape')
  assert.equal(monteParTrajectoire('C', auxDeuxBouts, () => 99), false,
    'hors fenêtre, et les 3 dernières n\'en portent qu\'un : rien ne monte')

  // Et l'inverse : deux B côte à côte à la fin, mais toutes les mesures hors fenêtre.
  const aLaFin = [m({ lettreEquivalente: 'D' }), m({ lettreEquivalente: 'B' }),
    m({ lettreEquivalente: 'B' })]
  assert.equal(monteParTrajectoire('C', aLaFin, () => 99), true,
    'les 3 dernières suffisent seules, quel que soit leur âge')
})

test('LES ANCRES NE FONT PAS MONTER : la montée est de la TRAJECTOIRE', () => {
  const v = jugerLaLettre(etat({ lettre: 'D', ancreDerniereValeur: 'D', ancreDerniereDate: 'x' }),
    [ancre('A'), ancre('A')], ctx)
  assert.equal(v.mouvement, 'aucun', 'deux ancres hautes ne montent pas par la règle de trajectoire')
})

test('A ne monte pas — il n\'y a rien au-dessus', () => {
  assert.equal(monteParTrajectoire('A', [m({ lettreEquivalente: 'A' }), m({ lettreEquivalente: 'A' })],
    () => 0), false)
})

test('l\'incohérence répétée BLOQUE la montée et lève un drapeau', () => {
  const v = jugerLaLettre(etat({ lettre: 'D' }),
    [m({ lettreEquivalente: 'A' }), m({ lettreEquivalente: 'A' })],
    { cyclesDepuis: jamaisVieux, incoherenceRepetee: true })
  assert.equal(v.valeurNonPlafonnee, 'D', 'la lettre ne bouge pas')
  assert.equal(v.drapeaux.length, 1)
  assert.match(v.drapeaux[0], /restitution à chaud/)
})

// ── La descente et la discordance ──────────────────────────────────────────

test('la descente passe PAR LES ANCRES UNIQUEMENT', () => {
  const basses = [m({ lettreEquivalente: 'E' }), m({ lettreEquivalente: 'E' }),
    m({ lettreEquivalente: 'E' })]
  const v = jugerLaLettre(etat({ lettre: 'C' }), basses, ctx)
  assert.equal(v.valeurNonPlafonnee, 'C', 'trois mesures à E ne font pas descendre : pas d\'ancre')
})

test('une ancre QUI ARRIVE, plus basse d\'UN palier, fait descendre, sans drapeau', () => {
  const e = etat({ lettre: 'C', ancreDerniereValeur: 'C', ancreDerniereDate: '2026-09-01' })
  const v = jugerLaLettre(e, [], { cyclesDepuis: jamaisVieux, ancreNouvelle: 'D' })
  assert.equal(v.valeurNonPlafonnee, 'D')
  assert.equal(v.mouvement, 'descente_par_ancre')
  assert.deepEqual(v.drapeaux, [])
})

test('ENTRE DEUX ANCRES, rien ne descend — la descente est l\'affaire de l\'ancre qui arrive', () => {
  const e = etat({ lettre: 'C', ancreDerniereValeur: 'D', ancreDerniereDate: '2026-09-01' })
  const v = jugerLaLettre(e, [], ctx) // aucune ancre neuve ce cycle
  assert.equal(v.valeurNonPlafonnee, 'C', 'la vieille ancre ne redescend pas la lettre à chaque cycle')
  assert.equal(v.mouvement, 'aucun')
  assert.deepEqual(v.drapeaux, [], 'et elle ne relève pas un drapeau à chaque cycle non plus')
})

test('discordance ≥ 2 paliers À L\'ARRIVÉE : la lettre SUIT L\'ANCRE **ET** un drapeau part', () => {
  const e = etat({ lettre: 'B', ancreDerniereValeur: 'B', ancreDerniereDate: '2026-09-01' })
  const v = jugerLaLettre(e, [], { cyclesDepuis: jamaisVieux, ancreNouvelle: 'E' })
  assert.equal(v.valeurNonPlafonnee, 'E', 'la lettre suit l\'ancre')
  assert.equal(v.mouvement, 'suit_ancre')
  assert.equal(v.drapeaux.length, 1, 'jamais d\'écrasement silencieux')
  assert.match(v.drapeaux[0], /Discordance de 3 paliers/)
})

test('la PREMIÈRE ANCRE relève le plafond, et sort du régime « sans ancre »', () => {
  const e = etat({ lettre: 'C', lettreInitiale: 'D' }) // plafond D + 1 = C
  const v = jugerLaLettre(e, [], { cyclesDepuis: jamaisVieux, ancreNouvelle: 'C' })
  assert.equal(v.plafond, 'A', 'C + 2, et non plus D + 1')
  assert.equal(v.lettre, 'C')
})

test('SANS ancre réelle : descente impossible, et AUCUN drapeau de discordance', () => {
  const e = etat({ lettre: 'B', lettreInitiale: 'D' })
  const v = jugerLaLettre(e, [m({ lettreEquivalente: 'E' }), m({ lettreEquivalente: 'E' })], ctx)
  assert.equal(v.valeurNonPlafonnee, 'B', 'rien ne descend')
  assert.deepEqual(v.drapeaux, [])
  assert.equal(v.lettre, 'C', 'et l\'affichage reste sous valeur initiale + 1')
})

// ── La cadence d'ancre et `profil_provisoire` ──────────────────────────────

test('cadence d\'ancre manquée : signal NON BLOQUANT, et la lettre NE GÈLE PAS', () => {
  const v = jugerLaLettre(etat({ lettre: 'D' }),
    [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'B' })],
    { cyclesDepuis: jamaisVieux, cyclesDepuisDerniereAncre: 9 })
  assert.equal(v.mouvement, 'montee', 'elle continue de monter')
  assert.match(v.drapeaux.join(' '), /Cadence d'ancre manquée/)
})

test('`profil_provisoire` : AUCUNE lettre affichée, mais la valeur non plafonnée existe', () => {
  const v = jugerLaLettre(etat({ lettre: 'C', profilProvisoire: true }),
    [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'B' })], ctx)
  assert.equal(v.lettre, null, 'rien ne s\'affiche')
  assert.equal(v.valeurNonPlafonnee, 'B', 'le ciblage et la stagnation, eux, voient')
})

test('sans lettre, rien ne se juge — ni ciblable, ni sondable, ni plafonnée', () => {
  const v = jugerLaLettre(etat({ lettre: null }), [m({ lettreEquivalente: 'A' })], ctx)
  assert.equal(v.lettre, null)
  assert.equal(v.valeurNonPlafonnee, null)
  assert.equal(v.mouvement, 'aucun')
})

// ── La clôture de la calibration ───────────────────────────────────────────

const jamaisSonde = () => false

test('clôture : la lettre RESTE par défaut', () => {
  const c = cloturerLaCalibration(etat({ lettre: 'C' }),
    [m({ lettreEquivalente: 'C' }), m({ lettreEquivalente: 'C' })], jamaisSonde)
  assert.equal(c.lettre, 'C')
  assert.equal(c.mouvement, 'reste')
})

test('clôture : 2 confirmations AU-DESSUS → +1 palier, jamais plus', () => {
  const c = cloturerLaCalibration(etat({ lettre: 'D' }),
    [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'A' }), m({ lettreEquivalente: 'A' })],
    jamaisSonde)
  assert.equal(c.lettre, 'C', 'trois confirmations hautes ne montent quand même que d\'un palier')
})

test('clôture : 2 confirmations SOUS → −1 palier', () => {
  const c = cloturerLaCalibration(etat({ lettre: 'C' }),
    [m({ lettreEquivalente: 'D' }), m({ lettreEquivalente: 'E' })], jamaisSonde)
  assert.equal(c.lettre, 'D')
  assert.equal(c.mouvement, 'descend')
})

test('clôture : UNE SONDE ÉCHOUÉE NE COMPTE PAS POUR LA DESCENTE', () => {
  const sondes = [m({ lettreEquivalente: 'E' }), m({ lettreEquivalente: 'E' })]
  const c = cloturerLaCalibration(etat({ lettre: 'C' }), sondes, () => true)
  assert.equal(c.lettre, 'C', 'l\'asymétrie des sondes tient')
  assert.equal(c.mouvement, 'reste')
})

test('clôture : une compétence SANS ANCRE garde son régime — la montée reste sous son plafond', () => {
  const c = cloturerLaCalibration(etat({ lettre: 'D', lettreInitiale: 'D' }),
    [m({ lettreEquivalente: 'A' }), m({ lettreEquivalente: 'A' })], jamaisSonde)
  assert.equal(c.lettre, 'C', 'D + 1, et pas au-delà')
})

test('clôture : une compétence SANS LETTRE n\'en reçoit pas ici', () => {
  const c = cloturerLaCalibration(etat({ lettre: null }),
    [m({ lettreEquivalente: 'B' }), m({ lettreEquivalente: 'B' })], jamaisSonde)
  assert.equal(c.lettre, null)
  assert.equal(c.mouvement, 'sans_lettre')
})

// ── Le cold start ──────────────────────────────────────────────────────────

test('la médiane de classe se calcule — mais elle NE S\'ÉCRIT JAMAIS dans `derniere_ancre`', () => {
  assert.equal(medianeDeClasse(['E', 'D', 'C', 'B', 'A']), 'C')
  assert.equal(medianeDeClasse(['D', 'C']), 'D', 'sur un nombre pair, la plus basse')
  assert.equal(medianeDeClasse([]), null)
  // La garde vit à l'écriture (`donnees.ts`) : ici on constate juste que le calcul
  // ne produit pas une ancre — c'est une valeur nue, sans lieu ni forme.
})

test('la dernière ancre se lit — et seules `classe` + `sommatif` en sont', () => {
  const lot = [ancre('D'), m({ lettreEquivalente: 'A' }),
    m({ lettreEquivalente: 'A', lieu: 'classe', forme: 'formatif' })]
  const a = derniereAncre(lot)
  assert.equal(a?.lettreEquivalente, 'D', 'la synthèse en classe n\'est pas une ancre')
  assert.equal(derniereAncre([m({ lettreEquivalente: 'A' })]), null)
})
