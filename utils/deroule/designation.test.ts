// ============================================================================
// ITEM 77 — LA DÉSIGNATION DANS LE MATÉRIAU. Ce que ce test GARDE :
//   · ⭐ que les TROIS CRANS se dérivent de la doctrine réelle, jamais d'une
//     liste de numéros écrite ici ;
//   · ⛔⛔ la BASCULE : diff vide ⇒ pas de cible ⇒ texte libre. C'est la garde
//     qui empêche de compter faux un élève qui a raison ;
//   · les SEPT CAS de la table du `02-` §5, dans leur ordre — le RATISSAGE en
//     premier, puis l'égalité avant l'inclusion, puis le débordement toléré ;
//   · ⭐ que la tolérance ne resserre JAMAIS en deçà d'un mot, cible longue
//     comprise — c'est le défaut que la règle en mots corrige ;
//   · ⛔⛔ que le RATISSAGE demande SES DEUX TERMES — la part du matériau seule
//     accuserait un élève parfait, le rapport à la cible seul laisserait
//     passer un quart des cas ;
//   · ⛔ que les DEUX portes fermées avant l'IA ne sont pas de même nature :
//     le cas 1 est une réponse FAUSSE, le cas 0 une NON-RÉPONSE ;
//   · ⛔ que la `version_corrigee` ne ressort JAMAIS : on ne rend que des
//     positions.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  demandeUneDesignation, cibleDansLeMateriau, bornesTolerees, verdictDeLaZone,
  estUnRatissage, credenceEstHaute,
  CIBLE_LONGUE_MOTS, TOLERANCE_CIBLE_LONGUE, CREDENCE_HAUTE_SEUIL,
  RATISSAGE_PART_MATERIAU, RATISSAGE_FOIS_LA_CIBLE,
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

// ── Les vecteurs ───────────────────────────────────────────────────────────

// Un matériau où la cible est petite : 4 mots sur ~60. C'est le terrain du
// ratisseur — il y a de la place pour prendre tout le reste.
const LONG = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu '
  + 'nu xi omicron pi rho sigma tau upsilon phi chi psi omega et encore des mots '
  + 'pour faire un materiau qui ressemble a un vrai paragraphe de copie'
const CIBLE_LONG = [LONG.indexOf('gamma'), LONG.indexOf('delta') + 'delta'.length] as const

// ── Les six cas de la table ────────────────────────────────────────────────

const T = 'alpha beta gamma delta epsilon zeta'
const CIBLE = [T.indexOf('gamma'), T.indexOf('gamma') + 'gamma'.length] as const

const bornesDe = (mot: string, jusqua?: string) =>
  [T.indexOf(mot), jusqua ? T.indexOf(jusqua) + jusqua.length : T.indexOf(mot) + mot.length] as const

test('CAS 1 — la zone NE TOUCHE PAS la cible : faux, et on ne lit RIEN', () => {
  // ⭐ « Le seul cas où le jugement se règle sans rien lire, et c'est ce qui
  //    fait tout l'intérêt de la désignation. »
  const v = verdictDeLaZone(T, CIBLE, bornesDe('alpha'))
  assert.deepEqual(v, { cas: '1', verdict: 'faux', litLeTexte: false, nonFait: false })
})

test('CAS 1 — une zone VIDE est un cas 1 : ne rien désigner, c’est ne pas désigner', () => {
  assert.equal(verdictDeLaZone(T, CIBLE, [12, 12]).cas, '1')
  assert.equal(verdictDeLaZone(T, CIBLE, [20, 3]).cas, '1', 'une zone inversée ne désigne rien')
})

test('CAS 3 — la zone EST la cible : juste, et proprement', () => {
  const v = verdictDeLaZone(T, CIBLE, CIBLE)
  assert.deepEqual(v, { cas: '3', verdict: 'juste', litLeTexte: true, nonFait: false })
})

test('CAS 2 — elle contient la cible et déborde D’UN MOT de chaque côté : juste', () => {
  const v = verdictDeLaZone(T, CIBLE, bornesDe('beta', 'delta'))
  assert.deepEqual(v, { cas: '2', verdict: 'juste', litLeTexte: true, nonFait: false })
})

test('CAS 2′ — elle déborde au-delà de la tolérance SANS couvrir : cible mal bornée', () => {
  // ⚠️ Ce cas s'appelait « le surlignage de couverture » le matin du 28/08. Il
  //    ne l'est plus : la barre du ratissage a été relevée le soir même, et
  //    déborder n'est pas ratisser — « c'est une cible mal bornée, et ça se
  //    corrige autrement » (Louis, 27/08). Le cas 0 porte désormais la triche.
  // ⛔⛔ ET LE VECTEUR A DÛ CHANGER DE MATÉRIAU, CE QUI EST LA RÈGLE EN ACTION :
  //    sur un matériau de 35 signes, prendre « alpha…zeta » c'est tout prendre,
  //    et tout prendre EST un ratissage. Une cible mal bornée n'existe que là où
  //    il reste du texte autour — d'où le matériau long.
  const zone = [LONG.indexOf('beta'), LONG.indexOf('theta') + 'theta'.length] as [number, number]
  const v = verdictDeLaZone(LONG, CIBLE_LONG, zone)
  assert.deepEqual(v, { cas: '2prime', verdict: 'mal_bornee', litLeTexte: true, nonFait: false })
  assert.equal(estUnRatissage(LONG, CIBLE_LONG, zone), false, '39 signes sur 209 ne couvrent rien')
})

test('CAS 4b — incluse dans la cible, plus courte : à voir, et le texte tranche', () => {
  const v = verdictDeLaZone(T, CIBLE, [CIBLE[0], CIBLE[1] - 2])
  assert.deepEqual(v, { cas: '4b', verdict: 'a_voir', litLeTexte: true, nonFait: false })
})

test('CAS 4a — elle CHEVAUCHE : une part de la cible, et du texte en dehors', () => {
  const v = verdictDeLaZone(T, CIBLE, [CIBLE[0] + 2, T.indexOf('delta') + 3])
  assert.deepEqual(v, { cas: '4a', verdict: 'probablement_faux', litLeTexte: true, nonFait: false })
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

// ── Le ratissage ───────────────────────────────────────────────────────────

test('⛔⛔ CAS 0 — tout surligner est un RATISSAGE : pas d’IA, exercice NON FAIT', () => {
  const v = verdictDeLaZone(LONG, CIBLE_LONG, [0, LONG.length])
  assert.equal(v.cas, '0')
  assert.equal(v.verdict, 'ratissage')
  assert.equal(v.litLeTexte, false, '⛔ rien ne part au modèle')
  assert.equal(v.nonFait, true)
})

test('⭐ LE RATISSAGE SE LIT EN PREMIER — même quand la zone RATE la cible', () => {
  // Une zone qui prend tout le matériau SAUF la cible : elle ne la touche pas,
  // donc le cas 1 la réclamerait. Mais elle couvre, et couvrir prime — sans
  // quoi il suffirait d'éviter la cible pour ratisser impunément.
  const apres = LONG.indexOf('epsilon')
  const v = verdictDeLaZone(LONG, CIBLE_LONG, [apres, LONG.length])
  assert.equal(estUnRatissage(LONG, CIBLE_LONG, [apres, LONG.length]), true)
  assert.equal(v.cas, '0')
})

test('⭐⭐ LES DEUX TERMES SONT NÉCESSAIRES — et chacun rattrape le trou de l’autre', () => {
  // (a) LA PART DU MATÉRIAU SEULE accuserait un élève parfait : là où la cible
  //     couvre déjà tout, la bonne réponse EST de tout surligner.
  const cibleEnorme = [0, LONG.length] as const
  assert.equal(estUnRatissage(LONG, cibleEnorme, [0, LONG.length]), false,
    'la cible couvre tout : on ne peut pas ratisser')
  assert.equal(verdictDeLaZone(LONG, cibleEnorme, [0, LONG.length]).cas, '3',
    'et c’est même la réponse EXACTE')

  // (b) LE RAPPORT À LA CIBLE SEUL laisserait passer : ici la zone fait plus de
  //     4× la cible, mais ne couvre pas 70 % du matériau.
  const debut = CIBLE_LONG[0]
  const zone = [debut, debut + (CIBLE_LONG[1] - CIBLE_LONG[0]) * 5] as [number, number]
  assert.ok(zone[1] - zone[0] >= RATISSAGE_FOIS_LA_CIBLE * (CIBLE_LONG[1] - CIBLE_LONG[0]))
  assert.ok(zone[1] - zone[0] < RATISSAGE_PART_MATERIAU * LONG.length)
  assert.equal(estUnRatissage(LONG, CIBLE_LONG, zone), false,
    'elle déborde beaucoup, mais elle ne couvre pas : c’est une cible mal bornée')
})

test('⭐ LA CIBLE MAL BORNÉE VA À L’IA — déborder n’est pas ratisser', () => {
  const zone = [LONG.indexOf('beta'), LONG.indexOf('kappa') + 'kappa'.length] as [number, number]
  const v = verdictDeLaZone(LONG, CIBLE_LONG, zone)
  assert.equal(v.cas, '2prime')
  assert.equal(v.litLeTexte, true, 'le texte libre tranche')
  assert.equal(v.nonFait, false, '⛔ 50 signes sur 209 : c’est une imprécision, pas une triche')
})

test('⛔ LES DEUX PORTES QUI FERMENT AVANT L’IA NE SONT PAS DE MÊME NATURE', () => {
  // Le cas 1 est une réponse FAUSSE ; le cas 0 est une NON-RÉPONSE. Les
  // confondre punirait l'élève qui s'est trompé d'endroit.
  const rate = verdictDeLaZone(T, CIBLE, bornesDe('alpha'))
  assert.equal(rate.litLeTexte, false)
  assert.equal(rate.nonFait, false, 'se tromper d’endroit n’est pas ne pas répondre')
})

test('une zone vide, ou une cible vide, ne ratisse rien', () => {
  assert.equal(estUnRatissage(LONG, CIBLE_LONG, [5, 5]), false)
  assert.equal(estUnRatissage(LONG, [3, 3], [0, LONG.length]), false)
  assert.equal(estUnRatissage('', [0, 0], [0, 0]), false)
})

test('la crédence n’est plus une condition — elle reste lisible pour le motif', () => {
  // ⚠️ Elle a cessé d'être la troisième condition de la triche le 28/08 : on ne
  //    peut pas être honnêtement incertain d'une non-réponse.
  assert.equal(credenceEstHaute(CREDENCE_HAUTE_SEUIL), true)
  assert.equal(credenceEstHaute(CREDENCE_HAUTE_SEUIL - 1), false)
  assert.equal(credenceEstHaute(null), null, 'pas de crédence donnée : on ne conclut pas')
  assert.equal(credenceEstHaute(undefined), null)
})
