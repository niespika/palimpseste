// C7 — le cran 2 : les pièces, la place vide, l'assemblage, le constituant de la grille.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assemblerLObjet, composerLesPieces, constituantDeLaGrille, demandeDuGeste, lireLesPieces,
  nomDuConstituant, observablesDuConstituant, placeDeLaPieceVide, separerLeTrou,
  composerLePlan, formeDuTrou, lireLePlan,
} from './pieces'

// Les pièces réelles de `ex-gab-transition-annonce-vide-c2` (gabarit-c2.json, 06/09) —
// la PREMIÈRE forme (des blocs nommés), gardée pour le repli sans trou.
const TRANSITION = [
  { nom: 'ce que le premier paragraphe a établi',
    texte: "L'uniforme peut réduire les différences visibles entre les élèves. Tous portent la même tenue, ce qui peut donner une impression d'égalité." },
  { nom: 'ce que le second va faire', texte: "Il faut donc se demander si cette égalité d'apparence suffit vraiment." },
]
// ⭐ La forme à TROU (06/09, nuit) : le devoir en morceaux, dans l'ordre, dont le trou (`texte: null`).
const A_TROU = [
  { nom: 'le devoir, avant le trou', texte: "Tous portent la même tenue, ce qui peut donner une impression d'égalité." },
  { nom: 'ce qui, dans le premier paragraphe, ne tient pas encore et oblige à passer au second', texte: null },
  { nom: 'le devoir, après le trou', texte: "Il faut donc se demander si cette égalité d'apparence suffit vraiment." },
]
const GESTE_TRANSITION = "Voici ce que le premier paragraphe a établi, et ce que le second va faire. Écris ce qui, dans le premier, ne tient pas encore et oblige à passer au second."
const GESTE_PLAN = "Voici les thèses des parties, dans le désordre. Mets-les dans l'ordre, et écris entre chacune le « car » ou le « mais » qui oblige à passer à la suivante."

test('les pièces se lisent avec tolérance : un tableau de {nom, texte} non vides, et rien d’autre', () => {
  assert.deepEqual(lireLesPieces(TRANSITION), TRANSITION)
  assert.deepEqual(lireLesPieces(JSON.stringify(TRANSITION)), TRANSITION)
  assert.deepEqual(lireLesPieces([{ nom: 'a', texte: '' }, { nom: '', texte: 'b' }, 'x', null, { nom: ' c ', texte: ' d ' }]),
    [{ nom: 'c', texte: 'd' }])
  // ⭐ le trou se lit : `texte: null` est gardé, avec son nom.
  assert.deepEqual(lireLesPieces(A_TROU), A_TROU)
  assert.deepEqual(separerLeTrou('transition', A_TROU),
    { pieces: [A_TROU[0], A_TROU[2]], place: 1, trou: A_TROU[1]!.nom })
  assert.deepEqual(separerLeTrou('argument', [{ nom: 'x', texte: 'a' }, { nom: 'le garant', texte: null }]),
    { pieces: [{ nom: 'x', texte: 'a' }], place: 1, trou: 'le garant' })
  // sans trou déclaré : le repli par objet, et `trou` nul.
  assert.deepEqual(separerLeTrou('transition', TRANSITION), { pieces: TRANSITION, place: 1, trou: null })
  assert.deepEqual(lireLesPieces(null), [])
  assert.deepEqual(lireLesPieces('pas du json'), [])
})

test('la demande du geste est ce qui suit « Voici … » — et le geste entier quand il n’a pas ce patron', () => {
  assert.equal(demandeDuGeste(GESTE_TRANSITION), "Écris ce qui, dans le premier, ne tient pas encore et oblige à passer au second.")
  assert.equal(demandeDuGeste(GESTE_PLAN), "Mets-les dans l'ordre, et écris entre chacune le « car » ou le « mais » qui oblige à passer à la suivante.")
  assert.equal(demandeDuGeste('Écris le mot qui manque.'), 'Écris le mot qui manque.')
  assert.equal(demandeDuGeste(''), null)
  assert.equal(demandeDuGeste(null), null)
})

test('la place vide : au milieu sur la transition, entre avant et après sur la phrase, en dernier ailleurs', () => {
  assert.equal(placeDeLaPieceVide('transition', TRANSITION), 1)
  assert.equal(placeDeLaPieceVide('argument', [{ nom: "ce que l'argument conclut", texte: 'c' }, { nom: "ce sur quoi il s'appuie", texte: 'p' }]), 2)
  assert.equal(placeDeLaPieceVide('phrase', [{ nom: 'ce qui vient avant', texte: 'a' }, { nom: 'ce qui vient après', texte: 'b' }]), 1)
  // ⚠️ Mesuré : `ex-gab-phrase-rattachement-tournant-non-moti-c2` n'a QU'UNE pièce, « ce qui vient après ».
  assert.equal(placeDeLaPieceVide('phrase', [{ nom: 'ce qui vient après', texte: 'b' }]), 0)
  assert.equal(placeDeLaPieceVide('phrase', [{ nom: 'ce qui vient avant', texte: 'a' }]), 1)
  assert.equal(placeDeLaPieceVide('plan', [{ nom: 'une thèse', texte: '1' }, { nom: 'une thèse', texte: '2' }, { nom: 'une thèse', texte: '3' }]), 3)
  assert.equal(placeDeLaPieceVide('objection', [{ nom: 'a', texte: 'a' }, { nom: 'b', texte: 'b' }, { nom: 'c', texte: 'c' }]), 3)
  assert.equal(placeDeLaPieceVide('transition', []), 0)
})

test('composer : le constituant du cas, la demande, la place, les pièces', () => {
  const s = composerLesPieces('transition', { constituant: 'la limite', pieces: TRANSITION }, GESTE_TRANSITION)
  assert.equal(s.constituant, 'la limite')
  assert.equal(s.place, 1)
  assert.equal(s.trou, null)
  // ⭐ à trou : la place et le nom viennent des données, le geste « Complète … » est rendu entier.
  const t = composerLesPieces('transition', { constituant: 'la limite', pieces: A_TROU }, 'Complète la transition en écrivant ce qui, dans le premier paragraphe, ne tient pas encore et oblige à passer au second.')
  assert.equal(t.place, 1)
  assert.equal(t.trou, A_TROU[1]!.nom)
  assert.deepEqual(t.pieces, [A_TROU[0], A_TROU[2]])
  assert.match(t.demande!, /^Complète la transition/)
  assert.match(s.demande!, /^Écris ce qui, dans le premier/)
  assert.deepEqual(s.pieces, TRANSITION)
  assert.equal(composerLesPieces('transition', { constituant: 'la limite', pieces: TRANSITION }, null).demande, null)
})

test('l’assemblage met la pièce de l’élève à sa place, en un texte continu — une dérivation, rien en base', () => {
  const objet = assemblerLObjet(TRANSITION, 1, "  Mais il ne supprime pas les différences de revenus.  ")
  assert.equal(objet, [TRANSITION[0]!.texte, 'Mais il ne supprime pas les différences de revenus.', TRANSITION[1]!.texte].join(' '))
  const marque = assemblerLObjet(TRANSITION, 1, 'X', { avant: '[', apres: ']' })
  assert.match(marque, / \[X\] /)
  assert.equal(assemblerLObjet(TRANSITION, 99, 'X').endsWith('X'), true)
  assert.equal(assemblerLObjet(TRANSITION, -3, 'X').startsWith('X'), true)
  assert.equal(assemblerLObjet([], 0, 'seule'), 'seule')
})

test('le nom nu d’un constituant : sans article ni tournure', () => {
  assert.equal(nomDuConstituant('le garant'), 'garant')
  assert.equal(nomDuConstituant("l'ordre, écrit"), 'ordre')
  assert.equal(nomDuConstituant('L’exploitation'), 'exploitation')
  assert.equal(nomDuConstituant("Ce qu'on accorde"), 'accorde')
  assert.equal(nomDuConstituant('Le maillon visé'), 'maillon visé')
  assert.equal(nomDuConstituant('la phrase — la pièce et l’objet se confondent'), 'phrase')
})

test('le constituant de la grille : direct, par élimination (objection), ou l’objet entier (phrase)', () => {
  // Les constituants RÉELS de `exercices_problemes`, lus en bac à sable le 06/09.
  assert.equal(constituantDeLaGrille('le garant', ['conclusion', 'garant', 'preuve']), 'garant')
  assert.equal(constituantDeLaGrille('la limite', ['annonce', 'bilan', 'limite']), 'limite')
  assert.equal(constituantDeLaGrille("l'ordre, écrit", ['derniere', 'ordre', 'parties']), 'ordre')
  assert.equal(constituantDeLaGrille("l'exploitation", ['attache', 'cas', 'exploitation']), 'exploitation')
  // « ce que cela change » n'est le nom d'aucune entrée : par élimination sur la fiche, `traitement`.
  assert.equal(constituantDeLaGrille('ce que cela change', ['accord', 'argument', 'maillon', 'traitement'],
    ["Ce qu'on accorde", 'Le maillon visé', "L'argument de l'objection", 'Ce que cela change']), 'traitement')
  // Sans fiche, l'élimination n'a rien pour se faire : `null`, l'appelant borne sur l'objet.
  assert.equal(constituantDeLaGrille('ce que cela change', ['accord', 'argument', 'maillon', 'traitement']), null)
  assert.equal(constituantDeLaGrille('la phrase — la pièce et l’objet se confondent', ['charge', 'rattachement', 'statut', 'tenue']), null)
})

test('les observables du constituant : ceux de la grille pour ce constituant, dédoublonnés, sans les vides', () => {
  const grille = [
    { constituant: 'garant', code: 'garant_present', competence: 'argumentation' },
    { constituant: 'garant', code: 'garant_circulaire', competence: 'argumentation' },
    { constituant: 'garant', code: 'garant_present', competence: 'argumentation' },
    { constituant: 'garant', code: null, competence: null },
    { constituant: 'preuve', code: 'preuve_circulaire', competence: 'argumentation' },
  ]
  assert.deepEqual(observablesDuConstituant(grille, 'garant').map((o) => o.code), ['garant_present', 'garant_circulaire'])
  assert.deepEqual(observablesDuConstituant(grille, null).map((o) => o.code), ['garant_present', 'garant_circulaire', 'preuve_circulaire'])
  assert.deepEqual(observablesDuConstituant(grille, 'conclusion'), [])
})

// ── ⭐ 06/09 — le plan : le trou est un ORDRE ──

// Les thèses RÉELLES de `ex-gab-plan-ordre-liste-c2` (banque du 06/09 au matin), dans le désordre.
const THESES = [
  { nom: 'une thèse', texte: 'la liberté de plaisanter ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable' },
  { nom: 'une thèse', texte: 'cette liberté ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable' },
  { nom: 'une thèse', texte: "une émission humoristique doit pouvoir plaisanter sur presque tout car le rire permet de critiquer les habitudes sans donner immédiatement une leçon" },
]

test('la forme du trou : un ordre sur le plan, un blanc ailleurs — et `composerLesPieces` la porte', () => {
  assert.equal(formeDuTrou('plan'), 'ordre')
  assert.equal(formeDuTrou('argument'), 'trou')
  assert.equal(composerLesPieces('plan', { constituant: "l'ordre, écrit", pieces: THESES }, GESTE_PLAN).forme, 'ordre')
  assert.equal(composerLesPieces('transition', { constituant: 'la limite', pieces: A_TROU }, null).forme, 'trou')
})

test('le plan assemblé : une phrase par partie, le mot qui lie en tête, majuscule et point — et il se relit', () => {
  const etat = { ordre: [2, 0, 1], liaisons: ['', 'mais', 'donc'] }
  const texte = composerLePlan(THESES, etat)
  assert.equal(texte,
    "Une émission humoristique doit pouvoir plaisanter sur presque tout car le rire permet de critiquer les habitudes sans donner immédiatement une leçon. "
    + 'Mais la liberté de plaisanter ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable. '
    + 'Donc cette liberté ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable.')
  assert.deepEqual(lireLePlan(texte, THESES), etat)
  // Sans mot qui lie : la thèse seule, avec sa majuscule.
  assert.equal(composerLePlan(THESES, { ordre: [0], liaisons: [''] }).startsWith('La liberté de plaisanter'), true)
  // Un texte qui n'est pas un plan composé par l'écran : `null`, l'écran repart de zéro.
  assert.equal(lireLePlan('', THESES), null)
  assert.equal(lireLePlan('Un texte libre sans les thèses.', THESES), null)
  assert.equal(lireLePlan(composerLePlan(THESES, etat), []), null)
})
