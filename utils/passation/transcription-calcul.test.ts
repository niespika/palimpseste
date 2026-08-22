// ============================================================================
// C4 · L4 — CE QUE LE DÉCOUPAGE ET LA CONFIANCE DOIVENT PROUVER.
// ----------------------------------------------------------------------------
// « Le champ d'édition de la transcription PRÉSERVE LE DÉCOUPAGE, et il le
//   conserve DE BOUT EN BOUT — de la photo à la transcription, de l'édition à la
//   mesure. CELA SE PROUVE, CELA NE SE SUPPOSE PAS. »          — piège 14
//
// C'est le seul endroit du lot où cette phrase peut être tenue par du code pur :
// le reste de la preuve est dans la recette, en base.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  separerDoutes, desaccordDesPasses, blocs, retoursALaLigne,
  empreinteDuDecoupage, decoupagePreserve, enMots, ZONES_MAX, normaliserRetours,
} from './transcription-calcul'

// ── LE CRLF — trouvé par le smoke test du 22/08, en vrai navigateur ─────────

test('⚠️ CRLF : quatre paragraphes soumis par un FORMULAIRE restent quatre', () => {
  // La soumission d'un formulaire HTML normalise la valeur d'un `<textarea>` en
  // CRLF — c'est la spécification. Sans normalisation, `\r\n\r\n` ne matche pas
  // `\n[ \t]*\n` et la copie se lit EN UN SEUL BLOC : « défaillance forte ».
  const commeLeNavigateurLEnvoie = 'Un.\r\n\r\nDeux.\r\n\r\nTrois.\r\n\r\nQuatre.'
  assert.equal(blocs(commeLeNavigateurLEnvoie).length, 4)
  assert.equal(empreinteDuDecoupage(commeLeNavigateurLEnvoie), '1-1-1-1')
})

test('CRLF : le texte NORMALISÉ est identique au même texte tapé en \\n', () => {
  assert.equal(normaliserRetours('a\r\nb\r\n\r\nc'), 'a\nb\n\nc')
  assert.equal(normaliserRetours('a\rb'), 'a\nb')          // vieux Mac, lone CR
  assert.equal(normaliserRetours('a\nb'), 'a\nb')          // déjà propre : inchangé
})

test('normaliserRetours ne « nettoie » RIEN D\'AUTRE — les fautes survivent', () => {
  const brut = '  sa va mieu ,  il ya   deux\r\n\r\n  raisons.  '
  const sorti = normaliserRetours(brut)
  assert.ok(sorti.includes('sa va mieu ,'), 'la faute et son espace avant virgule tiennent')
  assert.ok(sorti.includes('il ya   deux'), 'les espaces multiples tiennent')
  assert.ok(sorti.startsWith('  '), 'l\'indentation de tête tient')
  assert.ok(sorti.endsWith('  '), 'les espaces de fin tiennent')
  assert.equal(sorti.replace(/\n/g, '§'), brut.replace(/\r\n/g, '§').replace(/\n/g, '§'))
})

test('CRLF : le découpage est PRÉSERVÉ entre un texte en \\n et le même en CRLF', () => {
  const machine = 'Premier.\n\nSecond.'
  const renvoyeParLeNavigateur = 'Premier.\r\n\r\nSecond.'
  assert.equal(decoupagePreserve(machine, renvoyeParLeNavigateur), true)
  assert.equal(retoursALaLigne(machine), retoursALaLigne(renvoyeParLeNavigateur))
})

// ── Le découpage ────────────────────────────────────────────────────────────

test('un bloc est ce que sépare une ligne vide — la règle 3 du prompt', () => {
  const copie = 'Premier paragraphe,\nsur deux lignes.\n\nDeuxième paragraphe.\n\nTroisième.'
  assert.equal(blocs(copie).length, 3)
  assert.equal(retoursALaLigne(copie), 5)
})

test('DEUX PARAGRAPHES FUSIONNÉS SE VOIENT — c\'est la défaillance forte de la Structure', () => {
  const ecrit = 'Thèse posée.\n\nObjection examinée.'
  const lisse = 'Thèse posée. Objection examinée.'
  assert.equal(blocs(ecrit).length, 2)
  assert.equal(blocs(lisse).length, 1)
  assert.equal(decoupagePreserve(ecrit, lisse), false)
})

test('corriger une faute NE CHANGE PAS le découpage — l\'élève édite librement', () => {
  const machine = 'sa va mieu.\nIl ya deux raisons.\n\nDabord, ceci.'
  const corrige = 'ça va mieux.\nIl y a deux raisons.\n\nD\'abord, ceci.'
  assert.equal(decoupagePreserve(machine, corrige), true)
  assert.equal(empreinteDuDecoupage(machine), empreinteDuDecoupage(corrige))
})

test('l\'empreinte du découpage attrape une ligne vide MANGÉE, pas un mot changé', () => {
  const avant = 'Un.\n\nDeux.\n\nTrois.'
  assert.equal(empreinteDuDecoupage(avant), '1-1-1')
  assert.equal(empreinteDuDecoupage('Un.\n\nDeux.\nTrois.'), '1-2')
  // Trois lignes vides d'affilée restent UNE frontière : le prompt dit « une
  // ligne vide », un élève qui en tape trois n'invente pas deux paragraphes.
  assert.equal(empreinteDuDecoupage('Un.\n\n\n\nDeux.'), '1-1')
})

test('un texte sans aucune ligne vide est UN bloc — la copie « sans architecture »', () => {
  assert.equal(blocs('tout au kilomètre, sans respirer, jusqu\'au bout').length, 1)
})

// ── Les doutes que le prompt reporte ────────────────────────────────────────

test('la liste « Doutes » se sépare de la transcription, qui reste INTACTE', () => {
  const reponse = 'Premier paragraphe.\n\nSecond paragraphe.\n\n---\nDoutes :\n'
    + 'ligne 3 : "conscience" — peut-être "consience"'
  const r = separerDoutes(reponse)
  assert.equal(r.transcription, 'Premier paragraphe.\n\nSecond paragraphe.')
  assert.equal(blocs(r.transcription).length, 2)
  assert.equal(r.doutes.length, 1)
  assert.equal(r.doutes[0].origine, 'doutes')
  assert.equal(r.doutes[0].extrait, 'conscience')
  assert.equal(r.doutes[0].alternative, 'consience')
})

test('« Doutes : aucun » ne fabrique aucun doute', () => {
  const r = separerDoutes('La copie.\n\n---\nDoutes : aucun')
  assert.equal(r.transcription, 'La copie.')
  assert.equal(r.doutes.length, 0)
})

test('SANS séparateur, on garde le texte entier — on ne perd pas une copie pour une virgule', () => {
  const r = separerDoutes('La copie, sans format.')
  assert.equal(r.transcription, 'La copie, sans format.')
  assert.equal(r.doutes.length, 0)
})

test('UNE COPIE NE TRONQUE PAS SA PROPRE TRANSCRIPTION — le contenu n\'est jamais une consigne', () => {
  // L'élève écrit lui-même une ligne de tirets suivie de « Doutes : aucun ».
  // La DERNIÈRE occurrence fait foi : sa copie survit en entier.
  const reponse = 'Début de copie.\n---\nDoutes : aucun\n\nSuite de la copie.\n\n'
    + '---\nDoutes :\n"mot" — peut-être "not"'
  const r = separerDoutes(reponse)
  assert.ok(r.transcription.includes('Suite de la copie.'))
  assert.ok(r.transcription.includes('Début de copie.'))
  assert.equal(r.doutes.length, 1)
})

test('un doute mal formé RESTE un doute — on ne le jette pas', () => {
  const r = separerDoutes('X.\n\n---\nDoutes :\n- le mot du milieu est illisible')
  assert.equal(r.doutes.length, 1)
  assert.equal(r.doutes[0].extrait, 'le mot du milieu est illisible')
  assert.equal(r.doutes[0].alternative, undefined)
})

// ── Le désaccord des deux passes ────────────────────────────────────────────

test('deux passes identiques : confiance 1, aucune zone', () => {
  const t = 'La conscience est-elle un fardeau ?\n\nOn peut le penser.'
  const d = desaccordDesPasses(t, t)
  assert.equal(d.confiance, 1)
  assert.equal(d.zones.length, 0)
})

test('un mot qui diverge se voit, avec son contexte et l\'autre lecture', () => {
  const a = 'il ya deux raisons de le croire aujourdhui'
  const b = 'il y a deux raisons de le croire aujourdhui'
  const d = desaccordDesPasses(a, b)
  assert.ok(d.confiance < 1, 'la confiance doit descendre')
  assert.ok(d.zones.length >= 1)
  assert.equal(d.zones[0].origine, 'desaccord')
  assert.ok(d.zones[0].extrait.includes('ya'))
  assert.ok((d.zones[0].alternative ?? '').includes('y a'))
})

test('LA CASSE ET LES ACCENTS COMPTENT — ce sont des fautes que le prompt reproduit', () => {
  const d = desaccordDesPasses('la Verite', 'la vérité')
  assert.ok(d.confiance < 1)
})

test('deux textes vides s\'accordent parfaitement — et ne fabriquent aucune zone', () => {
  const d = desaccordDesPasses('', '')
  assert.equal(d.confiance, 1)
  assert.equal(d.motsCompares, 0)
})

test('la confiance est bornée à [0,1] même quand tout diffère', () => {
  const d = desaccordDesPasses('a b c', 'x y z w v')
  assert.ok(d.confiance >= 0 && d.confiance <= 1)
  assert.equal(d.motsCompares, 5)
})

test('les zones sont plafonnées : un écran qui montre tout ne montre rien', () => {
  const a = Array.from({ length: 60 }, (_, i) => `mot${i}`).join(' ')
  const b = Array.from({ length: 60 }, (_, i) => (i % 2 ? `mot${i}` : `MOT${i}`)).join(' ')
  const d = desaccordDesPasses(a, b)
  assert.ok(d.zones.length <= ZONES_MAX, `${d.zones.length} zones, plafond ${ZONES_MAX}`)
})

test('une passe qui a vu un mot que l\'autre n\'a pas vu MONTRE quand même quelque chose', () => {
  const d = desaccordDesPasses('le chat dort', 'le petit chat dort')
  assert.ok(d.zones.length >= 1)
  assert.notEqual(d.zones[0].extrait.trim(), '')
})

test('enMots ne normalise RIEN — ni casse, ni ponctuation', () => {
  assert.deepEqual(enMots('  Ah !  Vraiment ?  '), ['Ah', '!', 'Vraiment', '?'])
})

// ── La chaîne complète, de la réponse au texte mesuré ───────────────────────

test('DE BOUT EN BOUT : réponse du modèle → transcription → édition → mesure', () => {
  const reponse = 'Introduction en un bloc.\n\nDéveloppement, première partie.\nSuite de la '
    + 'même partie.\n\nConclusion.\n\n---\nDoutes : aucun'
  const rendu = separerDoutes(reponse)
  assert.equal(blocs(rendu.transcription).length, 3, 'la transcription porte trois blocs')

  // L'élève corrige deux fautes et ne touche pas au découpage.
  const edite = rendu.transcription.replace('Développement', 'Developpement')
  assert.equal(blocs(edite).length, 3, 'l\'édition n\'a rien fusionné')
  assert.equal(empreinteDuDecoupage(rendu.transcription), empreinteDuDecoupage(edite))

  // Ce que la chaîne mesurera est exactement ce texte-là.
  assert.equal(retoursALaLigne(edite), retoursALaLigne(rendu.transcription))
})
