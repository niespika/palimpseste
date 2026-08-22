// C4 · L3 — Ce que le rendu restreint REND, et ce qu'il REFUSE de rendre.
// « Le gras est du SENS, pas de la décoration » (décision de Louis, piège 36) —
// et « rien d'autre que gras et italique » est la moitié la plus importante de
// la décision : c'est elle qui empêche le module de devenir un markdown.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { baliser, texteNu, porteDuBalisage, type Jeton } from './balisage'

/** Quatre des 336 consignes, recopiées de `04-Instances_Exercices.md`. */
const CONSIGNE_CRAN_4 =
  '« Ici **la raison manque** — un connecteur en tient lieu. '
  + 'Dis où, et ce que la raison aurait dû dire. »'
const CONSIGNE_CRAN_3 = '« **Parmi ces quatre ajouts, lequel donne la raison ?** »'
const CONSIGNE_CRAN_5 = '« **La raison manque.** Ajoute-la. »'
const CONSIGNE_CRAN_7 = '« Ça peut être meilleur. **Reprends-le.** »'

/** La forme courte, pour lire les assertions sans compter les accolades. */
const forme = (jetons: Jeton[]) =>
  jetons.map((j) => (j.type === 'saut' ? 'saut' : `${j.type}:${j.texte}`))

// ── Ce qui SE REND ─────────────────────────────────────────────────────────

test('le gras SE REND : l\'élève ne voit plus les astérisques, il voit le sens', () => {
  assert.deepEqual(forme(baliser(CONSIGNE_CRAN_5)), [
    'texte:« ', 'gras:La raison manque.', 'texte: Ajoute-la. »',
  ])
})

test('une consigne réelle des 336 : le gras au milieu, le reste intact', () => {
  assert.deepEqual(forme(baliser(CONSIGNE_CRAN_4)), [
    'texte:« Ici ',
    'gras:la raison manque',
    'texte: — un connecteur en tient lieu. Dis où, et ce que la raison aurait dû dire. »',
  ])
})

test('le gras qui couvre toute la phrase, guillemets exclus, se ferme quand même', () => {
  assert.deepEqual(forme(baliser(CONSIGNE_CRAN_3)), [
    'texte:« ', 'gras:Parmi ces quatre ajouts, lequel donne la raison ?', 'texte: »',
  ])
  assert.deepEqual(forme(baliser(CONSIGNE_CRAN_7)), [
    'texte:« Ça peut être meilleur. ', 'gras:Reprends-le.', 'texte: »',
  ])
})

test('`*x*` et `_x_` rendent la MÊME italique — deux écritures, un seul style', () => {
  assert.deepEqual(forme(baliser('un mot *souligné* ici')),
    ['texte:un mot ', 'italique:souligné', 'texte: ici'])
  assert.deepEqual(forme(baliser('un mot _souligné_ ici')),
    ['texte:un mot ', 'italique:souligné', 'texte: ici'])
})

test('`***x***` rend gras_italique, et non un gras suivi d\'une italique orpheline', () => {
  assert.deepEqual(forme(baliser('***tout***')), ['gras_italique:tout'])
})

test('deux passages balisés dans la même phrase se rendent tous les deux', () => {
  assert.deepEqual(forme(baliser('**un** et **deux**')),
    ['gras:un', 'texte: et ', 'gras:deux'])
})

// ── Les SAUTS DE LIGNE : le tueur silencieux ───────────────────────────────

test('les retours à la ligne se PRÉSERVENT — un `\\n` donne exactement un jeton saut', () => {
  assert.deepEqual(forme(baliser('premier\nsecond')), ['texte:premier', 'saut', 'texte:second'])
})

test('une ligne vide fait DEUX sauts : le découpage en paragraphes survit', () => {
  assert.deepEqual(forme(baliser('a\n\nb')), ['texte:a', 'saut', 'saut', 'texte:b'])
})

test('les CRLF sont normalisés d\'entrée — le piège des `<textarea>` ne passe pas ici', () => {
  assert.deepEqual(forme(baliser('a\r\n\r\nb')), forme(baliser('a\n\nb')))
  assert.deepEqual(forme(baliser('a\rb')), ['texte:a', 'saut', 'texte:b'])
})

test('le balisage NE TRAVERSE PAS un saut de ligne : un `**` égaré n\'avale pas la suite', () => {
  // Deux lignes, chacune avec UN astérisque double non fermé sur sa ligne.
  assert.deepEqual(forme(baliser('ligne une **\nligne deux **')), [
    'texte:ligne une **', 'saut', 'texte:ligne deux **',
  ])
})

// ── Ce qui est REFUSÉ ──────────────────────────────────────────────────────

test('un délimiteur NON FERMÉ reste littéral — « il a dit **bonjour » garde ses astérisques', () => {
  assert.deepEqual(forme(baliser('« il a dit **bonjour »')), ['texte:« il a dit **bonjour »'])
  assert.equal(texteNu('« il a dit **bonjour »'), '« il a dit **bonjour »')
})

test('une italique non fermée reste littérale elle aussi, astérisque comme souligné', () => {
  assert.deepEqual(forme(baliser('un *mot seul')), ['texte:un *mot seul'])
  assert.deepEqual(forme(baliser('un _mot seul')), ['texte:un _mot seul'])
})

test('les TITRES restent littéraux : `#` n\'est pas du balisage', () => {
  assert.deepEqual(forme(baliser('# Un titre')), ['texte:# Un titre'])
})

test('une PUCE n\'ouvre pas d\'italique : un délimiteur suivi d\'une espace n\'ouvre rien', () => {
  // Sans la règle de flanquement, les deux puces s'apparieraient et l'écran
  // italiserait « premier point\n ».
  assert.deepEqual(forme(baliser('* premier point\n* second point')), [
    'texte:* premier point', 'saut', 'texte:* second point',
  ])
})

test('les LIENS et les IMAGES restent littéraux — crochets et parenthèses compris', () => {
  const source = 'voir [le texte](https://exemple.fr) et ![figure](a.png)'
  assert.deepEqual(forme(baliser(source)), [`texte:${source}`])
})

test('⚠️ les BACKTICKS ne sont PAS du balisage : ils s\'affichent tels quels', () => {
  assert.deepEqual(forme(baliser('écris `garant_present` ici')),
    ['texte:écris `garant_present` ici'])
})

test('une CITATION markdown reste littérale : `>` n\'est pas du balisage', () => {
  assert.deepEqual(forme(baliser('> une citation')), ['texte:> une citation'])
})

test('`__x__` n\'est PAS du gras : seul `**` l\'est', () => {
  assert.deepEqual(forme(baliser('__pas gras__')), ['texte:__pas gras__'])
})

test('un peloton de QUATRE astérisques ou plus n\'est pas un délimiteur', () => {
  assert.deepEqual(forme(baliser('****quatre****')), ['texte:****quatre****'])
})

test('le SOULIGNÉ dans un mot n\'italise rien — `observable_isole_code` reste entier', () => {
  const source = 'compare garant_present et observable_isole_code'
  assert.deepEqual(forme(baliser(source)), [`texte:${source}`])
})

test('pas d\'imbrication : `**gras avec *italique* dedans**` rend TOUT EN GRAS', () => {
  // Choix documenté : le contenu d'un peloton est pris LITTÉRALEMENT, les
  // astérisques internes s'affichent donc telles quelles.
  assert.deepEqual(forme(baliser('**gras avec *italique* dedans**')),
    ['gras:gras avec *italique* dedans'])
})

// ── AUCUN HTML, AUCUNE CHAÎNE BALISÉE ──────────────────────────────────────

test('le module ne fabrique AUCUNE balise : une consigne qui porte `<script>` ressort en TEXTE', () => {
  // La consigne vient d'un import de fichier — source non entièrement
  // contrôlée. Sans `dangerouslySetInnerHTML`, il n'y a aucune surface
  // d'injection : ici on prouve que le module ne fabrique rien à injecter.
  const jetons = baliser('<script>alert(1)</script> et **du gras**')
  assert.deepEqual(forme(jetons), ['texte:<script>alert(1)</script> et ', 'gras:du gras'])
  assert.ok(jetons.every((j) => j.type === 'saut' || !/<(strong|em|b|i)\b/i.test(j.texte)),
    'aucun jeton ne porte de balise HTML — c\'est le composant React qui en met')
})

// ── `texteNu` ──────────────────────────────────────────────────────────────

test('`texteNu` rend la consigne SANS son balisage — ce que le lecteur d\'écran doit dire', () => {
  assert.equal(texteNu(CONSIGNE_CRAN_5), '« La raison manque. Ajoute-la. »')
  assert.equal(texteNu('***tout*** et _un peu_'), 'tout et un peu')
})

test('`texteNu` garde les sauts de ligne : la même consigne, sans les astérisques', () => {
  assert.equal(texteNu('**a**\n\n*b*'), 'a\n\nb')
})

test('`texteNu` et `baliser` disent la MÊME chaîne — jamais deux grammaires', () => {
  for (const source of [CONSIGNE_CRAN_3, CONSIGNE_CRAN_4, CONSIGNE_CRAN_5, CONSIGNE_CRAN_7,
    '****quatre****', 'a\n\n**b**', '« il a dit **bonjour »', '__pas gras__']) {
    const recompose = baliser(source).map((j) => (j.type === 'saut' ? '\n' : j.texte)).join('')
    assert.equal(texteNu(source), recompose, source)
  }
})

test('un texte sans aucun balisage traverse INTACT — texteNu est alors l\'identité', () => {
  const brut = 'Une consigne toute simple, sans la moindre astérisque.'
  assert.deepEqual(forme(baliser(brut)), [`texte:${brut}`])
  assert.equal(texteNu(brut), brut)
})

// ── Les bords ──────────────────────────────────────────────────────────────

test('une consigne vide ne rend AUCUN jeton — pas un jeton texte vide', () => {
  assert.deepEqual(baliser(''), [])
  assert.equal(texteNu(''), '')
})

test('le texte contigu ne se fragmente pas : un seul jeton texte, pas un par caractère', () => {
  const jetons = baliser('abc **d** efg')
  assert.equal(jetons.length, 3, 'texte · gras · texte')
})

test('`porteDuBalisage` distingue « rien à rendre » de « du sens à rendre »', () => {
  assert.equal(porteDuBalisage(CONSIGNE_CRAN_5), true)
  assert.equal(porteDuBalisage('une consigne nue'), false)
  assert.equal(porteDuBalisage('a\nb'), false, 'un saut de ligne n\'est pas du balisage')
  assert.equal(porteDuBalisage('« il a dit **bonjour »'), false, 'non fermé = pas de balisage')
})
