// Tests de garde de la découpe d'un cours en sections (RAG L2, fonctions PURES).
// Exécution : `npm test`. Encode les invariants du modèle PLAGES (feedback PO) :
//  (1) plages à bornes incluses, CHEVAUCHEMENT INTERDIT, trous TOLÉRÉS ;
//  (2) dérivation : tri par début (ordre du texte), texte = lignes [début..fin] ;
//  (3) ré-édition : reconstruirePlages retrouve les bornes (trous compris),
//      null si le texte a changé ;
//  (4) report des « vus » à la re-découpe : titre EXACT (trim), consommation dans
//      l'ordre, diffusion depuis un élément 'contenu' vu, agrégat à l'effacement.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validerPlages,
  decouperPlages,
  reconstruirePlages,
  reporterVus,
  vuVersContenu,
  type PlageSection,
  type AncienElementVu,
} from './scriptorium-sections'

const TEXTE = [
  'La liberté',            // l.1
  '',                      // l.2
  'I. Le déterminisme',    // l.3
  'Corps du I…',           // l.4
  'Suite du I.',           // l.5
  'II. Le libre arbitre',  // l.6
  'Corps du II…',          // l.7
].join('\n')

const PLAGES: PlageSection[] = [
  { debut: 1, fin: 2, titre: 'Introduction', niveau: 1 },
  { debut: 3, fin: 5, titre: 'I. Le déterminisme', niveau: 1 },
  { debut: 6, fin: 7, titre: 'II. Le libre arbitre', niveau: 1 },
]

// ── validerPlages ────────────────────────────────────────────────────────────

test('validerPlages : jeu valide → null ; jeu vide (effacement) → null ; trous permis', () => {
  assert.equal(validerPlages(PLAGES, 7), null)
  assert.equal(validerPlages([], 7), null)
  // Trou (l.2 hors section) : valide.
  assert.equal(validerPlages([
    { debut: 1, fin: 1, titre: 'A', niveau: 1 },
    { debut: 3, fin: 7, titre: 'B', niveau: 1 },
  ], 7), null)
})

test('validerPlages : CHEVAUCHEMENT interdit, même saisi dans le désordre', () => {
  assert.match(validerPlages([
    { debut: 1, fin: 4, titre: 'A', niveau: 1 },
    { debut: 4, fin: 7, titre: 'B', niveau: 1 },
  ], 7) ?? '', /chevauchent/)
  // Ordre de saisie libre : le tri par début détecte quand même le chevauchement.
  assert.match(validerPlages([
    { debut: 5, fin: 7, titre: 'B', niveau: 1 },
    { debut: 1, fin: 5, titre: 'A', niveau: 1 },
  ], 7) ?? '', /chevauchent/)
})

test('validerPlages : bornes incomplètes / hors texte / inversées / titre vide → erreur', () => {
  assert.match(validerPlages([
    { debut: Number.NaN, fin: 3, titre: 'A', niveau: 1 },
  ], 7) ?? '', /incomplètes/)
  assert.match(validerPlages([
    { debut: 1, fin: 9, titre: 'A', niveau: 1 },
  ], 7) ?? '', /hors du texte/)
  assert.match(validerPlages([
    { debut: 5, fin: 3, titre: 'A', niveau: 1 },
  ], 7) ?? '', /avant le début/)
  assert.match(validerPlages([
    { debut: 1, fin: 2, titre: '   ', niveau: 1 },
  ], 7) ?? '', /titre/)
})

// ── decouperPlages ───────────────────────────────────────────────────────────

test('decouperPlages : bornes incluses, tri par début (ordre du texte), titres trimés', () => {
  const sections = decouperPlages(TEXTE, [
    { debut: 6, fin: 7, titre: 'II. Le libre arbitre', niveau: 2 },  // saisie dans le désordre
    { debut: 1, fin: 2, titre: '  Introduction  ', niveau: 1 },
  ])
  assert.deepEqual(sections.map(s => s.ordre), [1, 2])
  assert.equal(sections[0].titre, 'Introduction')
  assert.equal(sections[0].texte, 'La liberté\n')
  assert.equal(sections[1].niveau, 2)
  assert.equal(sections[1].texte, 'II. Le libre arbitre\nCorps du II…')
})

test('decouperPlages : partition complète → la concaténation redonne le texte', () => {
  const sections = decouperPlages(TEXTE, PLAGES)
  assert.equal(sections.map(s => s.texte).join('\n'), TEXTE)
})

test('decouperPlages : les trous restent hors des sections (bruit PDF écartable)', () => {
  const sections = decouperPlages(TEXTE, [
    { debut: 3, fin: 5, titre: 'I', niveau: 1 },
    { debut: 6, fin: 7, titre: 'II', niveau: 1 },
  ])
  // l.1–2 dans aucune section : leur texte n'apparaît nulle part.
  assert.equal(sections.some(s => s.texte.includes('La liberté')), false)
  assert.deepEqual(decouperPlages(TEXTE, []), [])
})

// ── reconstruirePlages ───────────────────────────────────────────────────────

test('reconstruirePlages : round-trip decouper → reconstruire = plages triées (avec trous)', () => {
  const avecTrou: PlageSection[] = [
    { debut: 3, fin: 5, titre: 'I. Le déterminisme', niveau: 1 },
    { debut: 6, fin: 7, titre: 'II. Le libre arbitre', niveau: 2 },
  ]
  const sections = decouperPlages(TEXTE, avecTrou)
  assert.deepEqual(reconstruirePlages(TEXTE, sections), avecTrou)
  // Partition legacy (modèle « coupes » contigu) : cas particulier des plages.
  const legacy = decouperPlages(TEXTE, PLAGES)
  assert.deepEqual(reconstruirePlages(TEXTE, legacy), PLAGES)
})

test('reconstruirePlages : blocs identiques → premier match à partir du curseur (déterministe)', () => {
  const t = ['X', 'A', 'B', 'X', 'A', 'B'].join('\n')
  const plages = reconstruirePlages(t, [
    { titre: 'S1', niveau: 1, texte: 'A\nB' },
    { titre: 'S2', niveau: 1, texte: 'A\nB' },
  ])
  assert.deepEqual(plages, [
    { debut: 2, fin: 3, titre: 'S1', niveau: 1 },
    { debut: 5, fin: 6, titre: 'S2', niveau: 1 },
  ])
})

test('reconstruirePlages : texte modifié → null ; zéro section → null', () => {
  const sections = decouperPlages(TEXTE, PLAGES)
  assert.equal(reconstruirePlages(TEXTE.replace('Corps du I…', 'Corps modifié'), sections), null)
  assert.equal(reconstruirePlages(TEXTE, []), null)
})

// ── reporterVus ──────────────────────────────────────────────────────────────

const vu = (titre: string, quand: string): AncienElementVu =>
  ({ refType: 'section', titre, vuAt: quand, vuPar: 'prof-1' })
const nonVu = (titre: string): AncienElementVu =>
  ({ refType: 'section', titre, vuAt: null, vuPar: null })

test('reporterVus : correspondance EXACTE de titre — reporté ; renommé → null (élément neuf non vu)', () => {
  const res = reporterVus(
    [vu('I. Le déterminisme', '2026-09-01'), nonVu('II. Le libre arbitre')],
    ['I. Le déterminisme', 'II. Le libre arbitre (v2)', 'III. Nouveau'],
  )
  assert.deepEqual(res[0], { vuAt: '2026-09-01', vuPar: 'prof-1' })
  assert.equal(res[1], null) // titre renommé → correspondance perdue (assumé §15.7)
  assert.equal(res[2], null) // section neuve
})

test('reporterVus : titres homonymes consommés dans l’ordre, chacun une seule fois', () => {
  const res = reporterVus(
    [vu('Exercices', '2026-09-01'), nonVu('Exercices')],
    ['Exercices', 'Exercices', 'Exercices'],
  )
  assert.deepEqual(res[0], { vuAt: '2026-09-01', vuPar: 'prof-1' })
  assert.equal(res[1], null) // le second ancien (non vu) est consommé
  assert.equal(res[2], null) // plus d'ancien à consommer
})

test('reporterVus : un élément \'contenu\' VU (cours entier) diffuse à toutes les sections', () => {
  const res = reporterVus(
    [{ refType: 'contenu', titre: null, vuAt: '2026-09-15', vuPar: 'prof-1' }],
    ['A', 'B'],
  )
  assert.deepEqual(res, [
    { vuAt: '2026-09-15', vuPar: 'prof-1' },
    { vuAt: '2026-09-15', vuPar: 'prof-1' },
  ])
})

test('reporterVus : élément \'contenu\' NON vu → rien ne diffuse ; trim sur les deux bords', () => {
  assert.deepEqual(reporterVus([{ refType: 'contenu', titre: null, vuAt: null, vuPar: null }], ['A']), [null])
  assert.deepEqual(
    reporterVus([vu('  Titre  ', '2026-09-01')], [' Titre ']),
    [{ vuAt: '2026-09-01', vuPar: 'prof-1' }],
  )
})

// ── vuVersContenu (effacement de découpe) ────────────────────────────────────

test('vuVersContenu : toutes les sections vues → vu le plus récent ; une non vue → null', () => {
  assert.deepEqual(
    vuVersContenu([vu('A', '2026-09-01'), vu('B', '2026-09-20'), vu('C', '2026-09-10')]),
    { vuAt: '2026-09-20', vuPar: 'prof-1' },
  )
  assert.equal(vuVersContenu([vu('A', '2026-09-01'), nonVu('B')]), null)
  assert.equal(vuVersContenu([]), null)
})

test('vuVersContenu : un ancien élément \'contenu\' transmet son état tel quel', () => {
  assert.deepEqual(
    vuVersContenu([{ refType: 'contenu', titre: null, vuAt: '2026-09-05', vuPar: null }]),
    { vuAt: '2026-09-05', vuPar: null },
  )
  assert.equal(vuVersContenu([{ refType: 'contenu', titre: null, vuAt: null, vuPar: null }]), null)
})
