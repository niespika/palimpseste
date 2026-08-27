// ============================================================================
// C5 · L1 — Ce que le code fait APRÈS l'appel, éprouvé.
// ----------------------------------------------------------------------------
// Les intervalles se DÉRIVENT et ne se stockent pas : ces vecteurs sont donc la
// seule preuve qu'ils sont justes. Un intervalle faux déplace une sélection dans
// le texte sans que rien ne le signale.
// ============================================================================

import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { plie, phrasesDuTexte } from '../fabrique/verifie-reference'
import {
  intervallesDesPhrases, intervalleDesPhrases, intervallesDesMoments,
  occurrencesDuConcept, occurrencesDesConcepts,
  statutsDeLaPhrase, valeursServies,
} from './lecture'

const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'
const FIXTURE = join(RACINE_CONCEPTION, 'copies-tests', 'generateur')

// ════════════════════════════════════════════════════════════════════════════
// LES INTERVALLES
// ════════════════════════════════════════════════════════════════════════════

test('chaque intervalle rendu découpe EXACTEMENT la phrase de la segmentation', () => {
  const t = 'Première phrase. Deuxième phrase ! Et la troisième ?'
  const phrases = phrasesDuTexte(t)
  const bornes = intervallesDesPhrases(t)
  assert.equal(bornes.length, phrases.length)
  bornes.forEach((b, i) => {
    assert.notEqual(b, null, `phrase ${i + 1} introuvable`)
    assert.equal(t.slice(b![0], b![1]), phrases[i])
  })
})

test('les séparateurs, en tête, en queue et entre les phrases, restent HORS des bornes', () => {
  const t = '\n\n  Une phrase.  Une autre.\t\n '
  const phrases = phrasesDuTexte(t)
  const bornes = intervallesDesPhrases(t)
  assert.deepEqual(phrases, ['Une phrase.', 'Une autre.'])
  assert.equal(t.slice(bornes[0]![0], bornes[0]![1]), 'Une phrase.')
  assert.equal(t.slice(bornes[1]![0], bornes[1]![1]), 'Une autre.')
  // Base 0, fin exclue : la borne haute de la dernière phrase n'atteint pas la fin.
  assert.ok(bornes[1]![1] < t.length)
})

test('une même phrase répétée ne renvoie pas deux fois le même intervalle', () => {
  // Le curseur ne recule jamais : la seconde occurrence se trouve APRÈS la première.
  const t = 'Il pleut. Il pleut. Il neige.'
  const bornes = intervallesDesPhrases(t)
  assert.deepEqual(bornes.map((b) => b![0]), [0, 10, 20])
})

test('l’intervalle d’une PLAGE de phrases va du début de la première à la fin de la dernière', () => {
  const t = 'Un. Deux. Trois. Quatre.'
  assert.equal(t.slice(...intervalleDesPhrases(t, 2, 3)!), 'Deux. Trois.')
  assert.equal(t.slice(...intervalleDesPhrases(t, 1, 1)!), 'Un.')
  assert.equal(t.slice(...intervalleDesPhrases(t, 4, 4)!), 'Quatre.')
})

test('une borne hors du texte, inversée, ou non entière rend `null` — on ne devine pas', () => {
  const t = 'Un. Deux.'
  assert.equal(intervalleDesPhrases(t, 0, 1), null)
  assert.equal(intervalleDesPhrases(t, 1, 3), null)
  assert.equal(intervalleDesPhrases(t, 2, 1), null)
  assert.equal(intervalleDesPhrases(t, 1.5, 2), null)
  assert.equal(intervalleDesPhrases(t, null, 2), null)
  assert.equal(intervalleDesPhrases(t, '1', '2'), null)
})

test('les moments rendent leurs intervalles dans l’ordre où la référence les porte', () => {
  const t = 'Un. Deux. Trois. Quatre.'
  const r = intervallesDesMoments(t, [
    { m: 'M1', de: 1, a: 2 }, { m: 'M2', de: 3, a: 4 },
  ])
  assert.deepEqual(r.map((x) => x.m), ['M1', 'M2'])
  assert.equal(t.slice(...r[0].intervalle!), 'Un. Deux.')
  assert.equal(t.slice(...r[1].intervalle!), 'Trois. Quatre.')
})

test('un moment aux bornes fausses rend `null`, il ne rend pas un intervalle plausible', () => {
  const t = 'Un. Deux.'
  const r = intervallesDesMoments(t, [{ m: 'M1', de: 1, a: 9 }])
  assert.equal(r[0].intervalle, null)
})

// ════════════════════════════════════════════════════════════════════════════
// LES OCCURRENCES DES CONCEPTS
// ════════════════════════════════════════════════════════════════════════════

test('une occurrence pointe le texte D’ORIGINE, accents compris', () => {
  const t = 'La pensée pense ce qu’elle pense.'
  const occ = occurrencesDuConcept(t, ['pensée'])
  assert.equal(occ.length, 1)
  assert.equal(t.slice(...occ[0]), 'pensée')
})

test('la recherche replie la casse ET les accents — le MÊME repli que le refus n° 10', () => {
  const t = 'La PENSÉE et la pensee.'
  const occ = occurrencesDuConcept(t, ['Pensée'])
  assert.equal(occ.length, 2)
  assert.deepEqual(occ.map((o) => t.slice(...o)), ['PENSÉE', 'pensee'])
})

test('l’intervalle CONTIENT toujours la forme cherchée, sur toutes les occurrences', () => {
  const t = 'Il pense, donc la Pensée existe ; sa PENSÉE est claire.'
  for (const o of occurrencesDuConcept(t, ['pense'])) {
    assert.ok(plie(t.slice(...o)).includes(plie('pense')),
      `l'intervalle ${JSON.stringify(o)} ne contient pas la forme`)
  }
})

test('deux formes qui se recouvrent donnent UN intervalle, pas deux', () => {
  // « penser » contient « pense » : deux bornes pour un même passage feraient
  // compter deux fois ce que le texte écrit une fois.
  const t = 'Je vais penser.'
  const occ = occurrencesDuConcept(t, ['penser', 'pense'])
  assert.equal(occ.length, 1)
  assert.equal(t.slice(...occ[0]), 'penser')
})

test('un caractère qui se replie en PLUSIEURS n’est jamais coupé en deux', () => {
  // L'eszett vaut « ss » pour `casefold()`, donc pour `plie()`. Une forme qui
  // tomberait au milieu de son repli couvre le caractère entier.
  const t = 'Die Straße ist lang.'
  const occ = occurrencesDuConcept(t, ['strasse'])
  assert.equal(occ.length, 1)
  assert.equal(t.slice(...occ[0]), 'Straße')
  // « sse » tombe au MILIEU du repli de l'eszett : l'intervalle prend le
  // caractère entier plutôt que sa moitié — il déborde la forme, il ne l'ampute pas.
  const partiel = occurrencesDuConcept(t, ['sse'])
  assert.equal(t.slice(...partiel[0]), 'ße')
  assert.ok(plie(t.slice(...partiel[0])).includes(plie('sse')))
})

test('un caractère hors du plan de base ne décale pas les bornes', () => {
  const t = 'Le 𝔓 puis la pensée.'
  const occ = occurrencesDuConcept(t, ['pensée'])
  assert.equal(t.slice(...occ[0]), 'pensée')
})

test('une forme introuvable ne rend rien, et une forme vide n’attrape pas tout', () => {
  assert.deepEqual(occurrencesDuConcept('Un texte.', ['absente']), [])
  assert.deepEqual(occurrencesDuConcept('Un texte.', ['']), [])
  assert.deepEqual(occurrencesDuConcept('Un texte.', [null, 3]), [])
})

test('les concepts d’une référence rendent chacun leurs occurrences', () => {
  const t = 'Je pense, donc je suis. Le trompeur me trompe.'
  const r = occurrencesDesConcepts(t, [
    { concept: 'penser', formes: ['pense'] },
    { concept: 'tromper', formes: ['trompeur', 'trompe'] },
  ])
  assert.deepEqual(r.map((x) => x.concept), ['penser', 'tromper'])
  assert.equal(r[0].occurrences.length, 1)
  assert.deepEqual(r[1].occurrences.map((o) => t.slice(...o)), ['trompeur', 'trompe'])
})

// ════════════════════════════════════════════════════════════════════════════
// LES DEUX RÈGLES DE CIRCULATION (`05-` §1)
// ════════════════════════════════════════════════════════════════════════════

test('le statut d’un MOMENT vaut pour ses phrases — l’UNION, jamais la recopie', () => {
  const ref = {
    phrases: [{ n: 1, fonctions: ['explique'], statuts: [] },
      { n: 2, fonctions: ['defend_these'], statuts: ['affirme'] }],
    moments: [{ m: 'M1', de: 1, a: 2, statuts: ['hypothetique'] }],
  }
  assert.deepEqual(statutsDeLaPhrase(ref, 1), ['hypothetique'])
  assert.deepEqual(statutsDeLaPhrase(ref, 2), ['affirme', 'hypothetique'])
  // La donnée, elle, N'A PAS BOUGÉ : c'est la lecture qui unit.
  assert.deepEqual(ref.phrases[0].statuts, [])
})

test('une phrase hors de tout moment ne reçoit que les siens', () => {
  const ref = {
    phrases: [{ n: 5, fonctions: ['explique'], statuts: ['ironique'] }],
    moments: [{ m: 'M1', de: 1, a: 2, statuts: ['rapporte'] }],
  }
  assert.deepEqual(statutsDeLaPhrase(ref, 5), ['ironique'])
})

test('une valeur DÉCLARÉE que la règle ne lit pas est écartée, SANS alerte — elle est inerte', () => {
  const v = valeursServies(
    { n: 1, fonctions: ['relance', 'explique'], statuts: ['affirme'] },
    { fonctionsPhrase: ['defend_these', 'explique', 'illustre'] })
  assert.deepEqual(v.fonctionsPhrase, ['explique'])
  assert.deepEqual(v.alertes, [])
})

test('une règle qui ne nomme rien lit TOUT ce que le `02-` déclare', () => {
  const v = valeursServies({ fonctions: ['relance', 'explique'], statuts: ['concede'] }, {})
  assert.deepEqual(v.fonctionsPhrase, ['relance', 'explique'])
  assert.deepEqual(v.statuts, ['concede'])
  assert.deepEqual(v.alertes, [])
})

test('⚠️ une valeur NON DÉCLARÉE au `02-` ATTEINT le consommateur, et lève une alerte', () => {
  const v = valeursServies({ fonctions: ['explique', 'resume'], statuts: ['affirme', 'doute'] },
    { fonctionsPhrase: ['explique'], statuts: ['affirme'] })
  // Elle passe — « c'est un vrai défaut, et il doit se voir ».
  assert.deepEqual(v.fonctionsPhrase, ['explique', 'resume'])
  assert.deepEqual(v.statuts, ['affirme', 'doute'])
  assert.equal(v.alertes.length, 2)
  assert.match(v.alertes[0], /« resume ».*ne déclare pas/)
  assert.match(v.alertes[1], /« doute ».*ne déclare pas/)
})

test('la fonction d’un MOMENT passe par la même règle que celles d’une phrase', () => {
  const lu = valeursServies({ m: 'M1', fonction: 'nuance' }, { fonctionsMoment: ['pose'] })
  assert.deepEqual(lu.fonctionsMoment, [])
  assert.deepEqual(lu.alertes, [])
  const inconnu = valeursServies({ m: 'M2', fonction: 'resume' }, { fonctionsMoment: ['pose'] })
  assert.deepEqual(inconnu.fonctionsMoment, ['resume'])
  assert.equal(inconnu.alertes.length, 1)
})

// ════════════════════════════════════════════════════════════════════════════
// SUR LA FIXTURE RÉELLE — 220 mots, 17 phrases, 4 moments, 3 concepts
// ════════════════════════════════════════════════════════════════════════════

test('la fixture réelle : les quatre moments couvrent le texte sans trou ni chevauchement', (t) => {
  if (!existsSync(join(FIXTURE, 'exemple-descartes.txt'))) {
    t.skip('dépôt de conception absent')
    return
  }
  const texte = readFileSync(join(FIXTURE, 'exemple-descartes.txt'), 'utf-8')
  const ref = JSON.parse(readFileSync(join(FIXTURE, 'exemple-descartes.json'), 'utf-8'))
  const moments = intervallesDesMoments(texte, ref.moments)
  assert.equal(moments.length, 4)
  for (const m of moments) assert.notEqual(m.intervalle, null, `${m.m} sans intervalle`)
  const bornes = moments.map((m) => m.intervalle!).sort((a, b) => a[0] - b[0])
  // Le premier moment part de la première phrase, le dernier finit sur la dernière.
  const phrases = intervallesDesPhrases(texte)
  assert.equal(bornes[0][0], phrases[0]![0])
  assert.equal(bornes[bornes.length - 1][1], phrases[phrases.length - 1]![1])
  // Entre deux moments : jamais de chevauchement.
  for (let i = 0; i + 1 < bornes.length; i++) assert.ok(bornes[i][1] <= bornes[i + 1][0])
  // Et M1 est bien le doute étendu.
  assert.match(texte.slice(...bornes[0]), /^Je suppose donc/)
  assert.match(texte.slice(...bornes[0]), /rien de certain au monde\.$/)
})

test('la fixture réelle : les trois concepts se retrouvent tous, aux bons endroits', (t) => {
  if (!existsSync(join(FIXTURE, 'exemple-descartes.txt'))) {
    t.skip('dépôt de conception absent')
    return
  }
  const texte = readFileSync(join(FIXTURE, 'exemple-descartes.txt'), 'utf-8')
  const ref = JSON.parse(readFileSync(join(FIXTURE, 'exemple-descartes.json'), 'utf-8'))
  const r = occurrencesDesConcepts(texte, ref.concepts)
  assert.equal(r.length, 3)
  for (const c of r) {
    assert.ok(c.occurrences.length > 0, `le concept « ${c.concept} » ne se retrouve nulle part`)
    for (const o of c.occurrences) {
      assert.ok(o[0] >= 0 && o[1] <= texte.length && o[0] < o[1])
    }
  }
})

test('la fixture réelle : la phrase 1 hérite du statut de son moment, elle ne le porte pas', (t) => {
  if (!existsSync(join(FIXTURE, 'exemple-descartes.json'))) {
    t.skip('dépôt de conception absent')
    return
  }
  const ref = JSON.parse(readFileSync(join(FIXTURE, 'exemple-descartes.json'), 'utf-8'))
  assert.deepEqual(ref.phrases[0].statuts, [])
  assert.deepEqual(ref.moments[0].statuts, ['hypothetique'])
  assert.deepEqual(statutsDeLaPhrase(ref, 1), ['hypothetique'])
})
