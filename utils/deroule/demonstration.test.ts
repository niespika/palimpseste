// C4 · L3 — LE CHOIX DE LA DÉMONSTRATION DU TEMPS 1.
// « Les exemples portent TOUJOURS sur un autre thème que l'exercice du jour »
// (`06-` §2), et la comparaison se fait sur le COURS et les NOTIONS (décision
// du PO du 22/08). Ce fichier teste autant ce qui est ÉCARTÉ que ce qui passe.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  choisirLaDemonstration, formeAttendue, lireLeContenu,
  type ContexteDeLExercice, type DemonstrationLue,
} from './demonstration'

/** L'appariement du `06-` §2, tel que `demonstrations_formes` le porte. */
const FORMES = { exemple: 'micro', modelage: 'meso', checklist: 'macro' }

const SEMENCE = 'depot-0001'

function demo(x: Partial<DemonstrationLue> & { id: string }): DemonstrationLue {
  return {
    competence: 'argumentation',
    grain: 'micro',
    forme: 'exemple',
    theme: 'La peine de mort',
    contenu: { texte: 'un exemple complet' },
    cours_declares: [],
    notions: [],
    ...x,
  }
}

/** L'exercice du jour : rattaché au cours « Les Lumières », notion « ironie ». */
const EXERCICE: ContexteDeLExercice = {
  grain: 'micro',
  cours: ['Les Lumières'],
  notions: ['ironie', 'concession'],
}

// ── L'inverse de la table ───────────────────────────────────────────────────

test('la forme suit le grain : micro → exemple, meso → modelage, macro → checklist', () => {
  assert.equal(formeAttendue('micro', FORMES), 'exemple')
  assert.equal(formeAttendue('meso', FORMES), 'modelage')
  assert.equal(formeAttendue('macro', FORMES), 'checklist')
})

test('un grain dont la table ne dit rien n\'a pas de forme attendue — et rien n\'est refusé', () => {
  assert.equal(formeAttendue('nano', FORMES), null)
  assert.equal(formeAttendue('micro', {}), null, 'une table vide ne préfère aucune forme')
})

// ── Absente : le temps 1 s'en passe ─────────────────────────────────────────

test('ABSENTE, le temps 1 s\'en passe et le professeur en est averti — rien ne s\'engendre', () => {
  const r = choisirLaDemonstration([], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration, null)
  assert.ok(r.avertissement && r.avertissement.includes('aucune démonstration'))
  assert.deepEqual(r.ecartees, [])
})

// ── La parade à l'imitation de surface ──────────────────────────────────────

test('une démonstration qui partage LE COURS de l\'exercice est écartée', () => {
  const d = demo({ id: 'a', cours_declares: ['Les Lumières'], notions: ['registre'] })
  const r = choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration, null)
  assert.equal(r.ecartees.length, 1)
  assert.ok(r.ecartees[0].motif.includes('le cours « Les Lumières »'))
})

test('NE SERAIT-CE QU\'UNE notion partagée suffit à écarter', () => {
  const d = demo({ id: 'a', cours_declares: ['Le romantisme'], notions: ['métaphore', 'ironie'] })
  const r = choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration, null)
  assert.ok(r.ecartees[0].motif.includes('la notion « ironie »'))
})

test('la comparaison ignore la casse et les espaces de bord — « IRONIE » partage « ironie »', () => {
  const d = demo({ id: 'a', cours_declares: [], notions: ['  IRONIE '] })
  assert.equal(choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE).demonstration, null)
  const c = demo({ id: 'b', cours_declares: ['les lumières'], notions: [] })
  assert.equal(choisirLaDemonstration([c], EXERCICE, FORMES, SEMENCE).demonstration, null)
})

test('la comparaison n\'est JAMAIS approximative : « ironie tragique » n\'est pas « ironie »', () => {
  const d = demo({ id: 'a', cours_declares: ['Les Lumières au théâtre'], notions: ['ironie tragique'] })
  const r = choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'a', 'écarter sur une sous-chaîne priverait l\'élève à tort')
  assert.deepEqual(r.ecartees, [])
})

test('une démonstration qui déclare `{}` ne partage rien : elle passe, sans avertissement', () => {
  const d = demo({ id: 'a', cours_declares: [], notions: [] })
  const r = choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'a')
  assert.equal(r.avertissement, null, '`{}` est une déclaration pleine et entière')
})

test('NULL n\'est pas le tableau vide : celle qui NE DÉCLARE RIEN est SERVIE, et avertie', () => {
  const d = demo({ id: 'a', cours_declares: null, notions: null })
  const r = choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'a', 'ne déclare rien n\'est pas écartable')
  assert.deepEqual(r.ecartees, [])
  assert.ok(r.avertissement?.includes('rattachement au cours'))
  assert.ok(r.avertissement?.includes('ses notions'))
})

test('un axe déclaré qui partage écarte, même si l\'autre axe n\'est pas déclaré', () => {
  const d = demo({ id: 'a', cours_declares: ['Les Lumières'], notions: null })
  assert.equal(choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE).demonstration, null)
})

test('un seul axe non déclaré suffit à avertir : la parade n\'a été vérifiée qu\'à moitié', () => {
  const d = demo({ id: 'a', cours_declares: ['Le romantisme'], notions: null })
  const r = choisirLaDemonstration([d], EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'a')
  assert.ok(r.avertissement?.includes('ses notions'))
  assert.ok(!r.avertissement?.includes('rattachement au cours'))
})

test('l\'exercice qui ne déclare ni cours ni notions : la parade n\'a rien à comparer, on avertit', () => {
  const nu: ContexteDeLExercice = { grain: 'micro', cours: [], notions: [] }
  const r = choisirLaDemonstration([demo({ id: 'a' })], nu, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'a')
  assert.ok(r.avertissement?.includes('n\'a rien à comparer'))
})

test('TOUTES écartées : le temps 1 s\'en passe, et la trace porte chaque motif', () => {
  const c = [
    demo({ id: 'a', notions: ['ironie'] }),
    demo({ id: 'b', cours_declares: ['Les Lumières'] }),
  ]
  const r = choisirLaDemonstration(c, EXERCICE, FORMES, SEMENCE)
  assert.equal(r.demonstration, null)
  assert.equal(r.ecartees.length, 2)
  assert.ok(r.avertissement?.includes('imitation de surface'))
})

// ── La forme suit le grain — préférée, jamais exigée ────────────────────────

test('au grain macro, la CHECKLIST est préférée à l\'exemple qui passe aussi la parade', () => {
  const macro: ContexteDeLExercice = { ...EXERCICE, grain: 'macro' }
  const c = [
    demo({ id: 'ex', forme: 'exemple' }),
    demo({ id: 'ck', forme: 'checklist', contenu: { points: ['un point'] } }),
  ]
  const r = choisirLaDemonstration(c, macro, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'ck')
  assert.equal(r.avertissement, null)
})

test('une forme au mauvais grain est un SIGNALEMENT, jamais un refus — elle est servie', () => {
  const macro: ContexteDeLExercice = { ...EXERCICE, grain: 'macro' }
  const r = choisirLaDemonstration([demo({ id: 'ex', forme: 'exemple' })], macro, FORMES, SEMENCE)
  assert.equal(r.demonstration?.id, 'ex', 'la progression déborde l\'appariement')
  assert.ok(r.avertissement?.includes('SIGNALEMENT'))
})

test('sans appariement pour ce grain, aucune forme n\'est préférée — mais une est servie', () => {
  const r = choisirLaDemonstration([demo({ id: 'a' })], EXERCICE, {}, SEMENCE)
  assert.equal(r.demonstration?.id, 'a')
  assert.ok(r.avertissement?.includes('aucune forme n\'a pu être préférée'))
})

// ── Le départage : déterministe, semé sur le dépôt ──────────────────────────

const QUATRE = ['a', 'b', 'c', 'd'].map((id) => demo({ id }))

test('un rechargement rend LA MÊME démonstration — sinon l\'élève en verrait deux', () => {
  const premier = choisirLaDemonstration(QUATRE, EXERCICE, FORMES, SEMENCE)
  const second = choisirLaDemonstration(QUATRE, EXERCICE, FORMES, SEMENCE)
  assert.equal(premier.demonstration?.id, second.demonstration?.id)
})

test('l\'ordre dans lequel la base rend les lignes ne change pas l\'élue', () => {
  const attendue = choisirLaDemonstration(QUATRE, EXERCICE, FORMES, SEMENCE).demonstration?.id
  const renverse = [...QUATRE].reverse()
  assert.equal(choisirLaDemonstration(renverse, EXERCICE, FORMES, SEMENCE).demonstration?.id,
    attendue, 'l\'ordre de la base n\'est garanti par rien : la remise en ordre canonique tient')
})

test('le départage MÊLE vraiment : deux dépôts ne reçoivent pas tous la première ligne', () => {
  const elues = new Set(['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map(
    (s) => choisirLaDemonstration(QUATRE, EXERCICE, FORMES, s).demonstration?.id))
  assert.ok(elues.size > 1, 'un tirage qui rend toujours la même n\'est pas un départage')
})

// ── Le contenu, et ses trois formes ─────────────────────────────────────────

test('les trois formes du `contenu` que le contrôle d\'import garantit se lisent', () => {
  assert.deepEqual(lireLeContenu('exemple', { texte: 'un modèle' }),
    { forme: 'exemple', texte: 'un modèle', trous: null })
  assert.deepEqual(lireLeContenu('exemple', { texte: 'à compléter', trous: [3, 7] }),
    { forme: 'exemple', texte: 'à compléter', trous: [3, 7] })
  assert.deepEqual(lireLeContenu('checklist', { points: ['poser la thèse', 'chercher l\'objection'] }),
    { forme: 'checklist', points: ['poser la thèse', 'chercher l\'objection'] })
  assert.deepEqual(lireLeContenu('modelage', { volets: [{ titre: 'brouillon', texte: 'x' }] }),
    { forme: 'modelage', volets: [{ titre: 'brouillon', texte: 'x' }] })
})

test('un contenu qui ne va pas avec la forme rend `null` — MAL FORMÉ N\'EST PAS ABSENT', () => {
  assert.equal(lireLeContenu('exemple', { points: ['a'] }), null)
  assert.equal(lireLeContenu('checklist', { texte: 'un exemple' }), null)
  assert.equal(lireLeContenu('modelage', { points: ['a'] }), null)
})

test('l\'exemple refuse une clé de plus, et un `texte` vide', () => {
  assert.equal(lireLeContenu('exemple', { texte: 'x', volets: [] }), null)
  assert.equal(lireLeContenu('exemple', { texte: '   ' }), null)
  assert.equal(lireLeContenu('exemple', { trous: [1] }), null, 'le `texte` n\'est pas optionnel')
})

test('la checklist ne se RÉPARE PAS : un point vide rend `null`, jamais une liste amputée', () => {
  assert.equal(lireLeContenu('checklist', { points: ['un point', '  '] }), null)
  assert.equal(lireLeContenu('checklist', { points: [] }), null)
  assert.equal(lireLeContenu('checklist', { points: ['a'], titre: 'x' }), null)
})

test('le modelage exige des volets OBJETS, et au moins un', () => {
  assert.equal(lireLeContenu('modelage', { volets: [] }), null)
  assert.equal(lireLeContenu('modelage', { volets: ['un volet en texte'] }), null)
  assert.equal(lireLeContenu('modelage', { volets: [{}], titre: 'x' }), null)
})

test('un contenu qui n\'est pas un objet, ou une forme inconnue, rend `null`', () => {
  assert.equal(lireLeContenu('exemple', null), null)
  assert.equal(lireLeContenu('exemple', 'un exemple'), null)
  assert.equal(lireLeContenu('checklist', ['a', 'b']), null, 'un tableau n\'est pas un objet')
  assert.equal(lireLeContenu('affiche', { texte: 'x' }), null, 'la doctrine déclare trois formes')
})
