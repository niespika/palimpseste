// Tests de garde de la découpe d'un cours en sections (RAG L2, fonctions PURES).
// Exécution : `npm test`. Encode les invariants du modèle PLAGES (feedback PO) :
//  (1) plages à bornes incluses, trous TOLÉRÉS, chevauchement PARTIEL interdit —
//      mais un §§ ENTIÈREMENT contenu dans un § est la structure attendue ;
//  (2) dérivation : ordre canonique (chapitre avant ses sous-chapitres), texte =
//      les lignes PROPRES (la plage moins ses sous-chapitres) → PARTITION ;
//  (3) ré-édition : reconstruirePlages retrouve les bornes (trous et imbrication
//      compris), null si le texte a changé ;
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

// Cours à la structure réelle : un chapitre « 1) » qui porte un chapeau, deux
// sous-chapitres, une ligne vide ENTRE eux et une chute après le dernier — les
// lignes propres du chapitre ne sont donc PAS contiguës (cas mesuré en prod sur
// « Qu'est-ce que la Connaissance ? », 31/08).
const COURS = [
  'Introduction',        // 1
  '',                    // 2
  'Le propos du cours.', // 3
  '',                    // 4
  '1) Les formes',       // 5  ┐ chapitre 5–16
  '',                    // 6  │
  'Mettons de l’ordre.', // 7  │ chapeau
  '',                    // 8  │
  'a) La première',      // 9  │ ┐ sous-chapitre 9–11
  '',                    // 10 │ │
  'Corps de a.',         // 11 │ ┘
  '',                    // 12 │ (propre : entre deux sous-chapitres)
  'b) La seconde',       // 13 │ ┐ sous-chapitre 13–15
  '',                    // 14 │ │
  'Corps de b.',         // 15 │ ┘
  '',                    // 16 ┘ (propre : la chute)
  'Conclusion',          // 17
].join('\n')

const IMBRIQUE: PlageSection[] = [
  { debut: 1, fin: 3, titre: 'Introduction', niveau: 1 },
  { debut: 5, fin: 16, titre: '1) Les formes', niveau: 1 },
  { debut: 9, fin: 11, titre: 'a) La première', niveau: 2 },
  { debut: 13, fin: 15, titre: 'b) La seconde', niveau: 2 },
  { debut: 17, fin: 17, titre: 'Conclusion', niveau: 1 },
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

test('validerPlages : un §§ ENTIÈREMENT dans un § est VALIDE (chapitre et ses parties)', () => {
  assert.equal(validerPlages(IMBRIQUE, 17), null)
  // Saisi dans le désordre, et bornes accolées à celles du chapitre : valide aussi.
  assert.equal(validerPlages([
    { debut: 5, fin: 16, titre: '1)', niveau: 2 },
    { debut: 5, fin: 16, titre: '1)', niveau: 1 },
  ], 17), null)
})

test('validerPlages : imbrication REFUSÉE hors du cas §§-dans-§', () => {
  // Un chapitre dans un chapitre : le prof doit choisir le niveau.
  assert.match(validerPlages([
    { debut: 5, fin: 16, titre: '1)', niveau: 1 },
    { debut: 9, fin: 11, titre: 'a)', niveau: 1 },
  ], 17) ?? '', /Sous-chapitre/)
  // Trois niveaux : refusé.
  assert.match(validerPlages([
    { debut: 5, fin: 16, titre: '1)', niveau: 1 },
    { debut: 9, fin: 15, titre: 'a)', niveau: 2 },
    { debut: 10, fin: 11, titre: 'i.', niveau: 2 },
  ], 17) ?? '', /deux niveaux/)
  // Débordement : ni dedans, ni dehors.
  assert.match(validerPlages([
    { debut: 5, fin: 16, titre: '1)', niveau: 1 },
    { debut: 9, fin: 17, titre: 'a)', niveau: 2 },
  ], 17) ?? '', /partiellement/)
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

test('decouperPlages : la matière d’un chapitre = ses lignes PROPRES (partition exacte)', () => {
  const secs = decouperPlages(COURS, IMBRIQUE)
  // Ordre canonique : le chapitre AVANT ses sous-chapitres.
  assert.deepEqual(secs.map(s => s.titre), ['Introduction', '1) Les formes', 'a) La première', 'b) La seconde', 'Conclusion'])
  assert.deepEqual(secs.map(s => s.ordre), [1, 2, 3, 4, 5])
  // Le chapitre garde son chapeau, l’entre-deux et sa chute — jamais le corps de ses parties.
  assert.equal(secs[1].texte, ['1) Les formes', '', 'Mettons de l’ordre.', '', '', ''].join('\n'))
  assert.equal(secs[1].texte.includes('Corps de a.'), false)
  assert.equal(secs[2].texte, ['a) La première', '', 'Corps de a.'].join('\n'))
  // PARTITION : autant de lignes servies que de lignes couvertes, aucune deux fois.
  const servies = secs.reduce((n, s) => n + (s.texte === '' ? 0 : s.texte.split('\n').length), 0)
  const couvertes = new Set(IMBRIQUE.flatMap(p => Array.from({ length: p.fin - p.debut + 1 }, (_, k) => p.debut + k)))
  assert.equal(servies, couvertes.size)
})

test('decouperPlages : chapitre entièrement couvert par ses parties → matière VIDE', () => {
  const secs = decouperPlages(COURS, [
    { debut: 9, fin: 15, titre: '1)', niveau: 1 },
    { debut: 9, fin: 11, titre: 'a)', niveau: 2 },
    { debut: 12, fin: 15, titre: 'b)', niveau: 2 },
  ])
  assert.equal(secs[0].texte, '') // intitulé sans matière : corpus et Quazian sautent les sections vides
  assert.equal(secs[1].texte, ['a) La première', '', 'Corps de a.'].join('\n'))
})

// ── reconstruirePlages ───────────────────────────────────────────────────────

test('reconstruirePlages : round-trip decouper → reconstruire = plages triées (avec trous)', () => {
  const avecTrou: PlageSection[] = [
    { debut: 1, fin: 1, titre: 'Titre', niveau: 1 },
    { debut: 3, fin: 5, titre: 'I. Le déterminisme', niveau: 1 },
  ]
  const sections = decouperPlages(TEXTE, avecTrou)
  assert.deepEqual(reconstruirePlages(TEXTE, sections), avecTrou)
  // Partition legacy (modèle « coupes » contigu) : cas particulier des plages.
  const legacy = decouperPlages(TEXTE, PLAGES)
  assert.deepEqual(reconstruirePlages(TEXTE, legacy), PLAGES)
})

test('reconstruirePlages : un §§ COLLÉ à un § est relu IMBRIQUÉ (matière identique)', () => {
  // Découpe plate d'avant l'imbrication : § l.3–5 puis §§ l.6–7, sans trou entre
  // les deux. Les deux lectures dérivent EXACTEMENT la même matière (le § garde
  // ses lignes propres 3–5), seule l'enveloppe affichée diffère : on retient
  // l'imbriquée, qui est ce que « §§ après § » veut dire depuis l'amendement.
  const plat = decouperPlages(TEXTE, [
    { debut: 3, fin: 5, titre: 'I. Le déterminisme', niveau: 1 },
    { debut: 6, fin: 7, titre: 'II. Le libre arbitre', niveau: 2 },
  ])
  const relu = reconstruirePlages(TEXTE, plat)
  assert.deepEqual(relu, [
    { debut: 3, fin: 7, titre: 'I. Le déterminisme', niveau: 1 },
    { debut: 6, fin: 7, titre: 'II. Le libre arbitre', niveau: 2 },
  ])
  // La ré-écriture ne change RIEN en base : mêmes titres, mêmes textes, même ordre.
  assert.deepEqual(decouperPlages(TEXTE, relu as PlageSection[]), plat)
})

test('reconstruirePlages : un TROU entre le § et le §§ → lecture plate (repli)', () => {
  // l.5 hors section : l'imbriqué ne peut pas rendre le texte stocké du § (il
  // avalerait la ligne du trou) → repli sur la lecture plate, exacte.
  const plages: PlageSection[] = [
    { debut: 3, fin: 4, titre: 'I. Le déterminisme', niveau: 1 },
    { debut: 6, fin: 7, titre: 'II. Le libre arbitre', niveau: 2 },
  ]
  assert.deepEqual(reconstruirePlages(TEXTE, decouperPlages(TEXTE, plages)), plages)
})

test('reconstruirePlages : round-trip d’une découpe IMBRIQUÉE (lignes propres non contiguës)', () => {
  const secs = decouperPlages(COURS, IMBRIQUE)
  assert.deepEqual(reconstruirePlages(COURS, secs), IMBRIQUE)
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
