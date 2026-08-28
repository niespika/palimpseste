// ============================================================================
// ITEM 77 — LA DÉSIGNATION DANS LE MATÉRIAU. Ce que ce test GARDE :
//   · ⭐ que les TROIS CRANS se dérivent de la doctrine réelle, jamais d'une
//     liste de numéros écrite ici ;
//   · ⛔⛔ la BASCULE : diff vide ⇒ pas de cible ⇒ texte libre. C'est la garde
//     qui empêche de compter faux un élève qui a raison ;
//   · les SIX CAS de la table du `02-` §5, dans leur ordre — l'égalité avant
//     l'inclusion, le débordement toléré avant la couverture ;
//   · ⭐ que la tolérance ne resserre JAMAIS en deçà d'un mot, cible longue
//     comprise — c'est le défaut que la règle en mots corrige ;
//   · ⛔ les TROIS conditions du petit malin, et son troisième état `null` —
//     « on ne sait pas encore » n'est pas « ce n'en est pas un » ;
//   · ⛔ que la `version_corrigee` ne ressort JAMAIS : on ne rend que des
//     positions.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  demandeUneDesignation, cibleDansLeMateriau, bornesTolerees, verdictDeLaZone,
  couvertureSuspecte, credenceEstHaute,
  CIBLE_LONGUE_MOTS, TOLERANCE_CIBLE_LONGUE, CREDENCE_HAUTE_SEUIL,
} from './designation'
import { regimeDeMarquage } from './marquage'

const FIXTURE = path.join(process.cwd(), 'utils', 'fabrique', 'doctrine.fixture.json')
const CRANS = (JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as {
  exercices_crans: Array<{ cran: number; marquage?: string | null }>
}).exercices_crans
const regle = (n: number) => CRANS.find((c) => c.cran === n)?.marquage ?? null

// ── Les trois crans, dérivés — jamais une liste de numéros ─────────────────

test('⭐ LES TROIS CRANS QUI DÉSIGNENT SONT 4, 7 ET 9 — et ils se DÉRIVENT du marquage', () => {
  // « Ce sont exactement les trois crans que la table du marquage met à
  //   "rien" » (`02-` §5). La liste n'est pas écrite ici : elle se lit sur la
  //   doctrine dérivée de la source. Si le `02-` change, ce test le voit.
  const designent = CRANS.filter((c) => demandeUneDesignation(regimeDeMarquage(c.marquage ?? null)))
  assert.deepEqual(designent.map((c) => c.cran), [4, 7, 9])
})

test('⚠️ `null` N’EST PAS `rien` — les crans 2, 6 et 8 n’ont pas de matériau', () => {
  // « Rien à marquer » est une décision ; « pas de matériau » est une absence.
  // On ne demande pas de désigner dans un matériau qui n'existe pas.
  for (const n of [2, 6, 8]) {
    assert.equal(regimeDeMarquage(regle(n)), null, `cran ${n}`)
    assert.equal(demandeUneDesignation(regimeDeMarquage(regle(n))), false, `cran ${n}`)
  }
})

test('les crans à candidats et à passage fautif ne demandent AUCUNE désignation', () => {
  for (const n of [1, 3, 5]) {
    assert.equal(demandeUneDesignation(regimeDeMarquage(regle(n))), false, `cran ${n}`)
  }
})

// ── La cible, et la bascule ────────────────────────────────────────────────

const CONTENU = 'La preuve est là, donc la conclusion tient sans discussion.'
const REMPLACE = 'La preuve est là, et elle établit le lien, la conclusion tient sans discussion.'
const AJOUTE = 'La preuve est là, donc la conclusion tient sans discussion. Le garant le dit.'

test('⭐ LA CIBLE EST LE DIFF — et elle désigne le passage remplacé', () => {
  const cible = cibleDansLeMateriau(CONTENU, REMPLACE)
  assert.ok(cible, 'un remplacement porte une cible')
  assert.equal(CONTENU.slice(cible[0], cible[1]), 'donc')
})

test('⛔⛔ LA BASCULE — la correction AJOUTE, le diff est vide, il n’y a PAS de cible', () => {
  // « On ne surligne pas une absence. » 30 cas sur 320 dans la banque du
  //   28/08, et 9 % aux trois crans également. Rendre `null` ici est la moitié
  //   de la règle, pas une panne.
  assert.equal(cibleDansLeMateriau(CONTENU, AJOUTE), null)
})

test('pas de version corrigée, pas de matériau : pas de cible, et rien ne lève', () => {
  assert.equal(cibleDansLeMateriau(CONTENU, null), null)
  assert.equal(cibleDansLeMateriau(null, REMPLACE), null)
  assert.equal(cibleDansLeMateriau('', REMPLACE), null)
})

test('⛔ LA `version_corrigee` NE RESSORT PAS — on ne rend que des positions', () => {
  const cible = cibleDansLeMateriau(CONTENU, REMPLACE)!
  const designe = CONTENU.slice(cible[0], cible[1])
  for (const mot of ['elle', 'établit', 'lien']) {
    assert.ok(!designe.includes(mot), `« ${mot} » vient de la version corrigée`)
  }
})

// ── Les six cas de la table ────────────────────────────────────────────────

const T = 'alpha beta gamma delta epsilon zeta'
const CIBLE = [T.indexOf('gamma'), T.indexOf('gamma') + 'gamma'.length] as const

const bornesDe = (mot: string, jusqua?: string) =>
  [T.indexOf(mot), jusqua ? T.indexOf(jusqua) + jusqua.length : T.indexOf(mot) + mot.length] as const

test('CAS 1 — la zone NE TOUCHE PAS la cible : faux, et on ne lit RIEN', () => {
  // ⭐ « Le seul cas où le jugement se règle sans rien lire, et c'est ce qui
  //    fait tout l'intérêt de la désignation. »
  const v = verdictDeLaZone(T, CIBLE, bornesDe('alpha'))
  assert.deepEqual(v, { cas: '1', verdict: 'faux', litLeTexte: false })
})

test('CAS 1 — une zone VIDE est un cas 1 : ne rien désigner, c’est ne pas désigner', () => {
  assert.equal(verdictDeLaZone(T, CIBLE, [12, 12]).cas, '1')
  assert.equal(verdictDeLaZone(T, CIBLE, [20, 3]).cas, '1', 'une zone inversée ne désigne rien')
})

test('CAS 3 — la zone EST la cible : juste, et proprement', () => {
  const v = verdictDeLaZone(T, CIBLE, CIBLE)
  assert.deepEqual(v, { cas: '3', verdict: 'juste', litLeTexte: true })
})

test('CAS 2 — elle contient la cible et déborde D’UN MOT de chaque côté : juste', () => {
  const v = verdictDeLaZone(T, CIBLE, bornesDe('beta', 'delta'))
  assert.deepEqual(v, { cas: '2', verdict: 'juste', litLeTexte: true })
})

test('CAS 2′ — elle déborde AU-DELÀ de la tolérance : le surlignage de couverture', () => {
  const v = verdictDeLaZone(T, CIBLE, bornesDe('alpha', 'zeta'))
  assert.deepEqual(v, { cas: '2prime', verdict: 'couverture', litLeTexte: true })
})

test('CAS 4b — incluse dans la cible, plus courte : à voir, et le texte tranche', () => {
  const v = verdictDeLaZone(T, CIBLE, [CIBLE[0], CIBLE[1] - 2])
  assert.deepEqual(v, { cas: '4b', verdict: 'a_voir', litLeTexte: true })
})

test('CAS 4a — elle CHEVAUCHE : une part de la cible, et du texte en dehors', () => {
  const v = verdictDeLaZone(T, CIBLE, [CIBLE[0] + 2, T.indexOf('delta') + 3])
  assert.deepEqual(v, { cas: '4a', verdict: 'probablement_faux', litLeTexte: true })
})

test('⚠️ L’ORDRE DES TESTS EST LA TABLE — l’égalité avant l’inclusion', () => {
  // Sans cet ordre, le cas 3 tomberait en cas 2 : une zone qui EST la cible la
  // contient aussi. La table les distingue, et le verdict n'est pas le même.
  assert.equal(verdictDeLaZone(T, CIBLE, CIBLE).cas, '3')
})

// ── La tolérance ───────────────────────────────────────────────────────────

test('⭐ UN MOT DE CHAQUE CÔTÉ — et les blancs sont franchis, pas comptés', () => {
  const [d, f] = bornesTolerees(T, CIBLE)
  assert.equal(T.slice(d, f), 'beta gamma delta')
})

test('aux bords du texte, la tolérance s’arrête au texte — elle ne déborde pas', () => {
  const premier = [0, 'alpha'.length] as const
  assert.deepEqual([...bornesTolerees(T, premier)], [0, T.indexOf('beta') + 'beta'.length])
  const dernier = [T.indexOf('zeta'), T.length] as const
  assert.deepEqual([...bornesTolerees(T, dernier)], [T.indexOf('epsilon'), T.length])
})

test('⛔ SUR UNE CIBLE LONGUE, LE POURCENTAGE PREND LE RELAIS — et il ÉLARGIT', () => {
  const long = Array.from({ length: CIBLE_LONGUE_MOTS + 10 }, (_, i) => `mot${i}`).join(' ')
  const texte = `avant ${long} apres et encore beaucoup de mots pour avoir de la place`
  const cible = [texte.indexOf(long), texte.indexOf(long) + long.length] as const
  const [d, f] = bornesTolerees(texte, cible)
  const marge = Math.round((cible[1] - cible[0]) * TOLERANCE_CIBLE_LONGUE)
  assert.ok(marge > 6, 'le vecteur doit avoir une marge plus large qu’un mot')
  assert.ok(d <= cible[0] - 1 && f >= cible[1] + 1)
  assert.ok(cible[0] - d >= Math.min(marge, cible[0]), 'la marge en pourcentage s’applique')
})

test('⭐⭐ LE POURCENTAGE NE RESSERRE JAMAIS EN DEÇÀ D’UN MOT', () => {
  // C'est exactement le défaut que la règle en mots corrige : un pourcentage
  // calculé sur une cible courte rendrait une tolérance plus PETITE qu'un mot.
  // On le vérifie sur toutes les tailles de cible du vecteur.
  const mots = T.split(' ')
  for (let i = 0; i < mots.length; i++) {
    const d = T.indexOf(mots[i])
    const cible = [d, d + mots[i].length] as const
    const [td, tf] = bornesTolerees(T, cible)
    assert.ok(td <= versLaGaucheAttendue(T, cible[0]), `cible « ${mots[i]} » resserrée à gauche`)
    assert.ok(tf >= versLaDroiteAttendue(T, cible[1]), `cible « ${mots[i]} » resserrée à droite`)
  }
})

function versLaGaucheAttendue(t: string, i: number): number {
  let p = i
  while (p > 0 && /\s/.test(t[p - 1])) p--
  while (p > 0 && !/\s/.test(t[p - 1])) p--
  return p
}
function versLaDroiteAttendue(t: string, i: number): number {
  let p = i
  while (p < t.length && /\s/.test(t[p])) p++
  while (p < t.length && !/\s/.test(t[p])) p++
  return p
}

// ── Le petit malin ─────────────────────────────────────────────────────────

const COUVERTURE = verdictDeLaZone(T, CIBLE, bornesDe('alpha', 'zeta'))
const JUSTE = verdictDeLaZone(T, CIBLE, CIBLE)

test('⛔⛔ LES TROIS CONDITIONS, ET IL LES FAUT TOUTES LES TROIS', () => {
  assert.equal(couvertureSuspecte(COUVERTURE, false, true), true, 'les trois se rencontrent')
  assert.equal(couvertureSuspecte(COUVERTURE, true, true), false,
    'nommer précisément ce qui cloche n’est pas de la triche : c’est une cible mal bornée')
  assert.equal(couvertureSuspecte(COUVERTURE, false, false), false,
    '⛔ sans la crédence haute on punirait l’honnêteté — « je ne suis pas sûr, je ratisse »')
  assert.equal(couvertureSuspecte(JUSTE, false, true), false,
    'hors du cas 2′, la question ne se pose pas')
})

test('⚠️ LE TROISIÈME ÉTAT — `null` est « on ne sait pas encore », jamais « ce n’en est pas un »', () => {
  // « Une justification qui ne nomme rien de précis » est un jugement IA
  //   (`02-` §2.2), pas une mesure sur des bornes : tant qu'il n'est pas
  //   revenu, ce module ne conclut pas. Même discipline que les signaux du
  //   faisceau, qui ont trois états et non deux.
  assert.equal(couvertureSuspecte(COUVERTURE, null, true), null)
  assert.equal(couvertureSuspecte(COUVERTURE, false, null), null)
  // ⚠️ Mais hors du cas 2′, `false` est SÛR : aucune IA ne le changera.
  assert.equal(couvertureSuspecte(JUSTE, null, null), false)
})

test('la crédence haute se lit sur le POURCENTAGE — les trois crans n’ont que lui', () => {
  assert.equal(credenceEstHaute(CREDENCE_HAUTE_SEUIL), true)
  assert.equal(credenceEstHaute(CREDENCE_HAUTE_SEUIL - 1), false)
  assert.equal(credenceEstHaute(null), null, 'pas de crédence donnée : on ne conclut pas')
  assert.equal(credenceEstHaute(undefined), null)
})
