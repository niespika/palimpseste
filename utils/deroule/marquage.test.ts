// ============================================================================
// C4 · L15 — LE MARQUAGE DANS LE MATÉRIAU. Ce que ce test GARDE :
//   · ⭐ la RÈGLE PAR CRAN, sur les PHRASES RÉELLES de la doctrine dérivée du
//     `02-` §5 — jamais sur des libellés inventés pour le test ;
//   · ⭐⭐ que le matériau reste OCTET POUR OCTET ce qu'il était : la
//     concaténation des segments EST le texte, sur chaque vecteur ;
//   · ⛔ que `version_corrigee` NE RESSORT JAMAIS d'un segment — c'est la
//     réponse, et le module ne rend que des tranches de `contenu` ;
//   · les deux pièges symétriques — le cran 5 marque SANS distracteur, le cran
//     4 ne marque PAS malgré sa `reponse_attendue` ;
//   · ⚠️ le cas VIDE, qui n'est pas une panne : pas de version corrigée, pas de
//     règle (crans 2/6/8 ou base en retard), pas de candidat servi.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  regimeDeMarquage, motsAMarquer, segmenterMateriau, marquerLeMateriau,
  MOTS_MAX_PAR_CANDIDAT,
} from './marquage'

// ── Les règles TELLES QUE LA SOURCE LES ÉCRIT ───────────────────────────────
// ⭐ Elles ne sont pas recopiées à la main : elles se lisent sur la fixture,
//    qui est une SORTIE de `scripts/derive-doctrine.py --fixture`, elle-même
//    dérivée du `02-` §5. Si la source est reformulée, ce test le voit.
// ⚠️ Le `??` couvre l'unique cas où la fixture précède la re-dérivation : le
//    test garde alors ce qu'il peut, et le vecteur du cas VIDE le prouve.
const FIXTURE = path.join(process.cwd(), 'utils', 'fabrique', 'doctrine.fixture.json')
const CRANS = (JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as {
  exercices_crans: Array<{ cran: number; marquage?: string | null }>
}).exercices_crans
const regle = (n: number) => CRANS.find((c) => c.cran === n)?.marquage ?? null

test('LA DOCTRINE PORTE LA RÈGLE — six crans, et les trois de production se taisent', () => {
  // ⚠️ « La table ne porte que SIX crans, et les trois absents ne sont pas un
  //    oubli » : les crans 2, 6 et 8 n'ont pas de `materiau_cible`.
  assert.equal(CRANS.length, 9)
  assert.deepEqual(CRANS.filter((c) => c.marquage).map((c) => c.cran), [1, 3, 4, 5, 7, 9])
  for (const n of [2, 6, 8]) assert.equal(regle(n), null, `le cran ${n} ne marque rien`)
})

test('LE RÉGIME SUIT LE CRAN — 1 candidats · 3 et 5 passage fautif · 4, 7 et 9 rien', () => {
  assert.equal(regimeDeMarquage(regle(1)), 'candidats')
  assert.equal(regimeDeMarquage(regle(3)), 'passage_fautif')
  assert.equal(regimeDeMarquage(regle(5)), 'passage_fautif')
  for (const n of [4, 7, 9]) assert.equal(regimeDeMarquage(regle(n)), 'rien', `cran ${n}`)
  // ⚠️ Les crans 2, 6 et 8 : pas de règle, donc pas de marquage — et pas d'exception.
  for (const n of [2, 6, 8]) assert.equal(regimeDeMarquage(regle(n)), null, `cran ${n}`)
})

// ── Le cran 1 — les quatre candidats servis, la bonne réponse COMPRISE ──────

const TEXTE_1 = 'Le doute porte sur tout. Rien ne résiste au doute. '
  + 'Mais qui doute existe, alors le garant tient.'

test('CRAN 1 — les QUATRE candidats servis sont marqués, la bonne réponse comprise', () => {
  // ⚠️⚠️ « et eux seuls, la `reponse_attendue` COMPRISE, sans quoi le marquage
  //    la désignerait ». Marquer les trois distracteurs seulement ferait de la
  //    réponse le seul candidat NON marqué : le marquage deviendrait la réponse.
  const servis = ['doute', 'résiste', 'existe', 'garant']   // les 4, mêlés
  const seg = marquerLeMateriau(TEXTE_1, regle(1), { candidats: servis })!
  const marques = seg.filter((s) => s.marque).map((s) => s.texte)
  // « chacun là où il apparaît » : `doute` apparaît TROIS fois, il est marqué
  // trois fois — la reconnaissance est GLOBALE. Et les segments sortent dans
  // l'ordre DU TEXTE, jamais dans celui des candidats servis.
  assert.deepEqual(marques, ['doute', 'résiste', 'doute', 'doute', 'existe', 'garant'])
})

test('CRAN 1 — le matériau reste OCTET POUR OCTET ce qu\'il était', () => {
  const seg = marquerLeMateriau(TEXTE_1, regle(1),
    { candidats: ['doute', 'résiste', 'existe', 'garant'] })!
  assert.equal(seg.map((s) => s.texte).join(''), TEXTE_1)
})

test('CRAN 1 — un mot ne se marque pas à l\'intérieur d\'un autre', () => {
  // « or » ne doit pas marquer le « or » d'« alors » : les bornes sont des
  // LETTRES UNICODE, et l'accent français en fait partie.
  const seg = marquerLeMateriau('alors le or vient, et lors même.', regle(1),
    { candidats: ['or'] })!
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['or'])
})

test('CRAN 1 — un candidat de DEUX mots se reconnaît par-dessus un retour à la ligne', () => {
  // « L'espace entre les mots se rebâtit (`\s+`), sans quoi un retour à la
  //   ligne dans le matériau ferait échouer la reconnaissance. »
  const t = 'Voici le\ngarant, et rien d\'autre.'
  const seg = marquerLeMateriau(t, regle(1), { candidats: ['le garant'] })!
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['le\ngarant'])
  assert.equal(seg.map((s) => s.texte).join(''), t)
})

test('CRAN 1 — un candidat de TROIS mots ne se marque pas : c\'est un remplacement', () => {
  // ⛔ « Un candidat qui n'est pas un fragment du matériau ne se marque pas. »
  //    Le seuil est celui de l'aperçu du générateur : un ou deux mots.
  assert.equal(MOTS_MAX_PAR_CANDIDAT, 2)
  const trois = motsAMarquer('candidats', { candidats: ['le garant tient'] })
  assert.deepEqual(trois, [])
  const deux = motsAMarquer('candidats', { candidats: ['le garant'] })
  assert.deepEqual(deux, [['le', 'garant']])
})

test('CRAN 1 — SANS candidat servi, on ne marque RIEN et on ne devine pas', () => {
  // ⚠️ Là où l'offre de crédence ne se compose pas (`empechement` non nul), il
  //    n'y a pas de « candidats servis ». On se comporte proprement.
  const seg = marquerLeMateriau(TEXTE_1, regle(1), { candidats: [] })!
  assert.deepEqual(seg, [{ texte: TEXTE_1, marque: false }])
})

// ── Les crans 3 et 5 — le passage fautif, et lui seul ──────────────────────

const CONTENU_3 = 'La preuve est là, donc la conclusion tient sans discussion.'
const CORRIGE_3 = 'La preuve est là, et parce qu\'elle établit le lien la conclusion tient sans discussion.'

for (const n of [3, 5]) {
  test(`CRAN ${n} — le passage fautif est marqué, et LUI SEUL`, () => {
    const seg = marquerLeMateriau(CONTENU_3, regle(n), { versionCorrigee: CORRIGE_3 })!
    const marques = seg.filter((s) => s.marque).map((s) => s.texte)
    // « celui, et celui-là seul » : UN SEUL passage, jamais deux.
    assert.equal(marques.length, 1)
    assert.equal(marques[0], 'donc')
    assert.equal(seg.map((s) => s.texte).join(''), CONTENU_3)
  })
}

test('CRAN 5 — il marque SANS AUCUN DISTRACTEUR : le déclencheur est le CRAN', () => {
  // ⛔⛔ La table du `02-` §2.2 donne `distracteurs` = `null` au cran 5. Un code
  //    qui conditionnerait le diff sur la présence de distracteurs ne
  //    marquerait JAMAIS rien à ce cran.
  const seg = marquerLeMateriau(CONTENU_3, regle(5),
    { candidats: [], versionCorrigee: CORRIGE_3 })!
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['donc'])
})

test('CRAN 3 — les candidats NE servent PAS au marquage : ce sont des remplacements', () => {
  // Le cran 3 A des distracteurs, et ce n'est pas eux qu'on marque.
  const seg = marquerLeMateriau(CONTENU_3, regle(3),
    { candidats: ['preuve', 'conclusion'], versionCorrigee: CORRIGE_3 })!
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['donc'])
})

test('CRANS 3 et 5 — ⛔ AUCUN SEGMENT NE PORTE UN MOT DE LA VERSION CORRIGÉE', () => {
  // C'EST LA RÉPONSE. Le module ne rend que des tranches de `contenu`.
  const seg = marquerLeMateriau(CONTENU_3, regle(3), { versionCorrigee: CORRIGE_3 })!
  const rendu = seg.map((s) => s.texte).join('')
  for (const mot of ['parce', 'établit', 'lien']) {
    assert.ok(!rendu.includes(mot), `« ${mot} » ne doit pas ressortir`)
  }
})

test('CRANS 3 et 5 — le diff VIDE n\'est pas une panne (a) : pas de version corrigée', () => {
  // « `version_corrigee` est FACULTATIF (`08-` §4) et le refus n° 12 ne le
  //   nomme pas : un matériau de cran 3 ou 5 sans version corrigée passe tous
  //   les contrôles. » On ne lève pas, on ne marque pas tout.
  const seg = marquerLeMateriau(CONTENU_3, regle(3), { versionCorrigee: null })!
  assert.deepEqual(seg, [{ texte: CONTENU_3, marque: false }])
})

test('CRANS 3 et 5 — le diff VIDE n\'est pas une panne (b) : le matériau est une RÉUSSITE', () => {
  // « L'injecté ne porte pas que des défauts — il porte aussi ce qui est
  //   RÉUSSI » (`02-` §2.3.1 a) : un matériau calibré sur une réussite n'a
  //   aucun passage fautif, et sa version corrigée lui est identique.
  const seg = marquerLeMateriau(CONTENU_3, regle(5), { versionCorrigee: CONTENU_3 })!
  assert.deepEqual(seg, [{ texte: CONTENU_3, marque: false }])
})

test('CRANS 3 et 5 — un ajout en TÊTE et un en QUEUE se marquent quand même', () => {
  // Le préfixe commun est vide, ou le suffixe : la forme doit tenir aux bords.
  const tete = marquerLeMateriau('Donc la preuve tient.', regle(3),
    { versionCorrigee: 'la preuve tient.' })!
  assert.deepEqual(tete.filter((s) => s.marque).map((s) => s.texte), ['Donc'])
  const queue = marquerLeMateriau('La preuve tient donc bien sûr.', regle(3),
    { versionCorrigee: 'La preuve tient bien sûr.' })!
  assert.deepEqual(queue.filter((s) => s.marque).map((s) => s.texte), ['donc'])
})

test('⚠️ LE DIFF EST AU MOT ENTIER — casse et ponctuation COLLÉES élargissent le passage', () => {
  // ⚠️⚠️ PROPRIÉTÉ RÉELLE DE L'ALGORITHME, ÉCRITE ICI POUR QU'ELLE NE SE
  //    REDÉCOUVRE PAS À L'ÉCRAN. La comparaison est `a[i] === b[i]` sur des
  //    MOTS découpés aux blancs : « la » et « La » sont deux mots différents,
  //    et « tient » et « tient. » aussi. Un défaut retiré à un BORD du matériau
  //    déplace donc la majuscule ou le point, le mot voisin cesse d'être commun,
  //    et le passage marqué gagne UN MOT.
  // ⭐ Le marquage reste JUSTE — il couvre bien le passage fautif — mais il est
  //    plus LARGE d'un mot. ⛔ Ce n'est PAS un défaut du port : le générateur se
  //    comporte à l'identique (`motsAMarquer`, `generateur/web/index.html`), et
  //    « les mêmes verdicts sur les mêmes vecteurs » l'exige. Le remède, s'il en
  //    faut un, est de FABRICATION — écrire la version corrigée sans retoucher
  //    la casse ni la ponctuation du bord —, et il n'est pas de ce lot.
  const tete = marquerLeMateriau('Donc la preuve tient.', regle(3),
    { versionCorrigee: 'La preuve tient.' })!
  assert.deepEqual(tete.filter((s) => s.marque).map((s) => s.texte), ['Donc la'])

  const queue = marquerLeMateriau('La preuve tient donc.', regle(3),
    { versionCorrigee: 'La preuve tient.' })!
  assert.deepEqual(queue.filter((s) => s.marque).map((s) => s.texte), ['tient donc.'])
})

// ── Les crans 4, 7 et 9 — rien. L'y trouver EST le travail. ────────────────

for (const n of [4, 7, 9]) {
  test(`CRAN ${n} — AUCUNE marque, même avec de quoi en poser`, () => {
    // ⛔ Le cran 4 A une `reponse_attendue` (déclarée aux crans 1, 3, 4 et 5) et
    //    ne se marque pas : l'élève y cherche L'ENDROIT, et le marquage
    //    répondrait à la question posée.
    const seg = marquerLeMateriau(CONTENU_3, regle(n),
      { candidats: ['preuve', 'donc'], versionCorrigee: CORRIGE_3 })!
    assert.deepEqual(seg, [{ texte: CONTENU_3, marque: false }])
  })
}

// ── Les crans 2, 6 et 8, et la base en retard — le cas VIDE ────────────────

test('CRANS 2, 6 et 8 — pas de matériau, donc rien : « pas de matériau » n\'est pas « rien à marquer »', () => {
  for (const n of [2, 6, 8]) {
    assert.equal(regimeDeMarquage(regle(n)), null)
    assert.equal(marquerLeMateriau(null, regle(n)), null, `cran ${n}`)
  }
})

test('⚠️ LA BASE EN RETARD — règle absente, le matériau s\'affiche NON MARQUÉ', () => {
  // C'est l'état entre la migration et la re-dérivation, et c'est aussi celui
  // de toute base qui n'a jamais reçu les deux colonnes. On rend l'écran
  // d'avant le lot, jamais un marquage deviné.
  for (const absente of [null, undefined, '', '   ']) {
    const seg = marquerLeMateriau(TEXTE_1, absente,
      { candidats: ['doute'], versionCorrigee: 'autre chose' })!
    assert.deepEqual(seg, [{ texte: TEXTE_1, marque: false }], JSON.stringify(absente))
  }
})

test('⚠️ UNE RÈGLE QUE LE MODULE NE RECONNAÎT PAS NE MARQUE RIEN', () => {
  // Si le `02-` §5 est un jour reformulé au point que les trois ancres ne
  // mordent plus, on ne marque pas au hasard — on se tait, et le contrôle de
  // dérivation dira que la source a bougé.
  assert.equal(regimeDeMarquage('quelque chose de tout à fait neuf'), null)
})

// ── La forme des segments ─────────────────────────────────────────────────

test('SEGMENTS — deux marques qui se CHEVAUCHENT n\'en font qu\'une', () => {
  const seg = segmenterMateriau('le grand garant tient', [['le', 'grand'], ['grand', 'garant']])
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['le grand garant'])
  assert.equal(seg.map((s) => s.texte).join(''), 'le grand garant tient')
})

test('SEGMENTS — un matériau vide rend une liste vide, jamais un segment vide', () => {
  assert.deepEqual(segmenterMateriau('', [['x']]), [])
  assert.equal(marquerLeMateriau(null, 'les candidats servis'), null)
})

// ── LES DEUX SEULS ÉCARTS AVEC L'APERÇU DU GÉNÉRATEUR ──────────────────────
// Éprouvé en séance sur **1026 vecteurs différentiels** — les deux
// implémentations jouées côte à côte sur la même doctrine : **1021 rendent le
// verdict identique**, et les cinq restants tombent dans les deux classes
// ci-dessous. ⭐ **Les deux vivent dans le RENDU, jamais dans la règle** — et le
// rendu est exactement ce que le lot avait consigne de ne PAS recopier
// (« recopie son ALGORITHME, jamais son rendu »). Dans les deux cas, le nôtre
// est le plus sûr, et les CARACTÈRES MARQUÉS sont les mêmes.

test('ÉCART 1 — le MÊME candidat servi deux fois fait UNE marque, pas deux imbriquées', () => {
  // L'aperçu applique ses `replace` en cascade SUR LE HTML DÉJÀ MARQUÉ : le
  // second passage remord dans le premier et rend `<b><b>doute</b></b>`. Ici,
  // les intervalles FUSIONNENT — un seul segment, les mêmes caractères marqués.
  const seg = segmenterMateriau('Le doute porte sur tout.', [['doute'], ['doute']])
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['doute'])
  assert.equal(seg.map((s) => s.texte).join(''), 'Le doute porte sur tout.')
})

test('ÉCART 2 — un `contenu` VIDE ne fabrique pas une marque sur rien', () => {
  // Sur un matériau vide, l'aperçu rend `<b></b>` — une marque posée sur zéro
  // caractère : son `split(/\s+/)` d'une chaîne vide donne `['']`, un « mot »
  // vide qui se reconnaît partout. ⚠️ L'entrée est INATTEIGNABLE par un import
  // légitime — le refus n° 3 refuse « un champ obligatoire absent ou VIDE », et
  // `contenu` est obligatoire (`08-` §4) —, mais un module pur ne s'appuie pas
  // sur la vertu de son appelant.
  assert.deepEqual(motsAMarquer('passage_fautif',
    { contenu: '', versionCorrigee: 'la version corrigée' }), [])
  assert.deepEqual(motsAMarquer('passage_fautif',
    { contenu: '   ', versionCorrigee: 'la version corrigée' }), [])
})

test('SEGMENTS — le module ne produit AUCUNE balise : le texte sort tel quel', () => {
  // ⛔ Le matériau vient d'un import de fichier. Rien n'est échappé, rien n'est
  //    interprété : c'est le composant React qui met en `<strong>`, et c'est ce
  //    qui garantit qu'il n'y a aucune surface d'injection.
  const brut = 'Un <script>alert(1)</script> et du **gras** littéral.'
  const seg = marquerLeMateriau(brut, regle(1), { candidats: ['littéral.'] })!
  assert.equal(seg.map((s) => s.texte).join(''), brut)
  assert.ok(seg.every((s) => typeof s.texte === 'string' && typeof s.marque === 'boolean'))
})

test('SEGMENTS — le `**` du matériau n\'est PAS du balisage : marquer n\'est pas baliser', () => {
  // `balisage.ts` INTERPRÈTE `**x**` dans la CONSIGNE. Ici, rien n'est
  // interprété : le matériau « s'affiche TEL QU'IL EST STOCKÉ ».
  const brut = 'Le **garant** manque ici.'
  const seg = marquerLeMateriau(brut, regle(1), { candidats: ['manque'] })!
  assert.equal(seg.map((s) => s.texte).join(''), brut)
  assert.deepEqual(seg.filter((s) => s.marque).map((s) => s.texte), ['manque'])
})
