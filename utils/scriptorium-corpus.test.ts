// Tests de garde de la semaine courante (RAG §5.2, fonction PURE).
// Exécution : `npm test`. Reproduit le DÉROULÉ CHIFFRÉ du spec Parcours §5.2
// (parcours 16 semaines ancré au 2026-09-21 : relâche sautée entre k5 et k6,
// gap inter-semestres entre k13 et k14) + les bords (avant / après / a_definir /
// aperçu absent).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { semaineCourante } from './scriptorium-corpus'
import type { ApercuSemaine } from './parcours-apercu'

const def = (semaine: number, lundi: string, semestreNom = 'S1', peda = semaine): ApercuSemaine =>
  ({ semaine, dateReelle: lundi, statut: 'definie', semestreNom, pedaDansSemestre: peda })

// Déroulé §5.2 (extraits aux articulations) : k1..k13 en S1, k14..k16 en S2.
const APERCU: ApercuSemaine[] = [
  def(1, '2026-09-21'),
  def(2, '2026-09-28'),
  def(3, '2026-10-05'),
  def(4, '2026-10-12'),
  def(5, '2026-10-19'),               // dernière avant la RELÂCHE (2026-10-26 → 11-01)
  def(6, '2026-11-02'),               // saute la relâche
  def(13, '2026-12-21'),              // dernière de S1, avant le GAP (12-28 → 01-10)
  def(14, '2027-01-11', 'S2', 1),     // saute le gap — débordement S2
  def(15, '2027-01-18', 'S2', 2),
  def(16, '2027-01-25', 'S2', 3),     // fin du parcours
]

test('semaineCourante : avant la 1re semaine → 0 (tout est « à venir »)', () => {
  assert.equal(semaineCourante(APERCU, '2026-09-01'), 0)
  assert.equal(semaineCourante(APERCU, '2026-09-20'), 0) // veille du 1er lundi
})

test('semaineCourante : en pleine semaine → la semaine entamée (lundi inclus)', () => {
  assert.equal(semaineCourante(APERCU, '2026-09-21'), 1) // le lundi même
  assert.equal(semaineCourante(APERCU, '2026-09-24'), 1) // jeudi de k1
  assert.equal(semaineCourante(APERCU, '2026-10-22'), 5)
})

test('semaineCourante : RELÂCHE → la dernière semaine commencée (on ne désapprend pas)', () => {
  assert.equal(semaineCourante(APERCU, '2026-10-28'), 5) // mercredi de la relâche
  assert.equal(semaineCourante(APERCU, '2026-11-01'), 5) // dimanche de la relâche
  assert.equal(semaineCourante(APERCU, '2026-11-02'), 6) // reprise
})

test('semaineCourante : GAP inter-semestres → idem, puis bascule en S2', () => {
  assert.equal(semaineCourante(APERCU, '2027-01-05'), 13) // dans le gap
  assert.equal(semaineCourante(APERCU, '2027-01-11'), 14) // 1er lundi de S2
  assert.equal(semaineCourante(APERCU, '2027-01-20'), 15) // débordement S2 (§5.2)
})

test('semaineCourante : après la dernière semaine → nb_semaines (plus rien d\'« à venir »)', () => {
  assert.equal(semaineCourante(APERCU, '2027-02-15'), 16)
  assert.equal(semaineCourante(APERCU, '2027-06-30'), 16)
})

test('semaineCourante : les semaines a_definir / non_planifiable sont ignorées', () => {
  const avecTrous: ApercuSemaine[] = [
    def(1, '2026-09-21'),
    { semaine: 2, dateReelle: null, statut: 'a_definir', semestreNom: null, pedaDansSemestre: null },
    { semaine: 3, dateReelle: null, statut: 'non_planifiable', semestreNom: null, pedaDansSemestre: null },
  ]
  assert.equal(semaineCourante(avecTrous, '2027-06-30'), 1) // seule k1 porte une date
})

test('semaineCourante : ordre du tableau indifférent (max des lundis ≤ aujourd\'hui)', () => {
  const desordre = [...APERCU].reverse()
  assert.equal(semaineCourante(desordre, '2026-10-22'), 5)
})

test('semaineCourante : aperçu absent (assignation non datée) → null (instance exclue)', () => {
  assert.equal(semaineCourante(null, '2026-10-22'), null)
})

// ═════════════════════════════════════════════════════════════════════════════
// L4 — assemblerCorpus : LA recette du lot (§6.2). Sentinelles anti-spoiler,
// marquage des statuts, stabilité octet à octet, troncature par le plus ancien vu.
// ═════════════════════════════════════════════════════════════════════════════

import {
  assemblerCorpus, LIMITE_TOKENS_CORPUS, CAR_PAR_TOKEN,
  type InstanceCorpus, type ElementCorpus, type LivreCorpus,
} from './scriptorium-corpus'

const SENT_FUTUR = 'NIETZSCHE_S7_SENTINELLE'
const SENT_FICHE_FUTURE = 'FICHE_SEANCE4_SENTINELLE'

const el = (o: Partial<ElementCorpus> & { cle: string; semaine: number; tri: [number, number, number] }): ElementCorpus => ({
  refType: 'contenu', vu: false, groupe: o.cle, groupeLibelle: `G-${o.cle}`,
  libellePlan: `Titre ${o.cle}`, libelleMatiere: `Matière ${o.cle}`,
  texte: null, legendes: [], ...o,
})

// Mini-parcours : courante 2/3. S1 vu, S2 en cours (cours découpé en 2 sections),
// S3 à venir (texte SENTINELLE) + séances de livre 1 (vue), 2 (en cours), 4 (à venir).
function fixture(): { instances: InstanceCorpus[]; livres: LivreCorpus[] } {
  const instances: InstanceCorpus[] = [{
    parcoursTitre: 'Philo T1',
    nbSemaines: 3,
    semaineCourante: 2,
    lundis: { 1: 'lun. 7 sept.', 2: 'lun. 14 sept.', 3: 'lun. 21 sept.' },
    elements: [
      el({ cle: 'a', semaine: 1, tri: [1, 1, 1], vu: true, refType: 'contenu',
        libellePlan: 'Texte « Apologie » (Platon)', libelleMatiere: 'Texte « Apologie » (Platon)',
        texte: 'CORPS_APOLOGIE', legendes: ['Buste de Socrate'] }),
      el({ cle: 'b1', semaine: 2, tri: [2, 1, 1], refType: 'section', groupe: 'crb',
        groupeLibelle: 'Cours « La liberté »', libellePlan: 'I. Le déterminisme',
        libelleMatiere: 'Cours « La liberté » — I. Le déterminisme', texte: 'CORPS_DETERMINISME' }),
      el({ cle: 'b2', semaine: 2, tri: [2, 1, 2], refType: 'section', groupe: 'crb',
        groupeLibelle: 'Cours « La liberté »', libellePlan: 'II. Le libre arbitre',
        libelleMatiere: 'Cours « La liberté » — II. Le libre arbitre', texte: 'CORPS_LIBRE_ARBITRE' }),
      el({ cle: 'c', semaine: 3, tri: [3, 1, 1], refType: 'section', groupe: 'crc',
        groupeLibelle: 'Cours « Nietzsche »', libellePlan: 'La volonté de puissance',
        libelleMatiere: 'Cours « Nietzsche » — La volonté de puissance', texte: SENT_FUTUR }),
      el({ cle: 'l1', semaine: 1, tri: [1, 2, 1], vu: true, refType: 'livre_semaine',
        groupe: 'crl', groupeLibelle: 'Livre « Naissance de la tragédie »',
        libellePlan: 'séance 1 (chap. 1-4)', libelleMatiere: '—', livreCle: 'NT', seance: 1 }),
      el({ cle: 'l2', semaine: 2, tri: [2, 2, 1], refType: 'livre_semaine',
        groupe: 'crl2', groupeLibelle: 'Livre « Naissance de la tragédie »',
        libellePlan: 'séance 2 (chap. 5-9)', libelleMatiere: '—', livreCle: 'NT', seance: 2 }),
      el({ cle: 'l4', semaine: 3, tri: [3, 2, 1], refType: 'livre_semaine',
        groupe: 'crl4', groupeLibelle: 'Livre « Naissance de la tragédie »',
        libellePlan: 'séance 4 (chap. 15-20)', libelleMatiere: '—', livreCle: 'NT', seance: 4 }),
    ],
  }]
  const livres: LivreCorpus[] = [{
    cle: 'NT', titre: 'Naissance de la tragédie', auteur: 'Nietzsche', totalSeances: 5,
    carte: 'fil conducteur : apollinien vs dionysiaque',
    fiches: [
      { seance: 1, texte: 'thèse : art = union des deux pulsions' },
      { seance: 2, texte: 'thèse : le chœur tragique' },
      { seance: 4, texte: SENT_FICHE_FUTURE },
    ],
  }]
  return { instances, livres }
}

test('assemblerCorpus : ANTI-SPOILER — aucun caractère du texte/fiche à venir, titres présents', () => {
  const { instances, livres } = fixture()
  const { prefixe } = assemblerCorpus(instances, livres)
  assert.equal(prefixe.includes(SENT_FUTUR), false)          // texte de la semaine 3 absent
  assert.equal(prefixe.includes(SENT_FICHE_FUTURE), false)   // fiche de la séance 4 absente
  assert.equal(prefixe.includes('La volonté de puissance'), true)  // le TITRE reste (allusion possible)
  assert.equal(prefixe.includes('séance 4 (chap. 15-20)'), true)   // titre de séance au plan
  assert.match(prefixe, /Semaine 3 \(lun\. 21 sept\.\) — à venir/)
})

test('assemblerCorpus : vus intégraux [VU], en-cours présents et marqués [EN COURS]', () => {
  const { instances, livres } = fixture()
  const { prefixe, stats } = assemblerCorpus(instances, livres)
  assert.match(prefixe, /### Semaine 1 — Texte « Apologie » \(Platon\) \[VU\]\nCORPS_APOLOGIE/)
  assert.match(prefixe, /\(Illustration : Buste de Socrate\)/)
  assert.match(prefixe, /### Semaine 2 — Cours « La liberté » — I\. Le déterminisme \[EN COURS\]\nCORPS_DETERMINISME/)
  assert.match(prefixe, /Fiche séance 1 : thèse : art = union des deux pulsions \[VU\]/)
  assert.match(prefixe, /Fiche séance 2 : thèse : le chœur tragique \[EN COURS\]/)
  assert.match(prefixe, /Carte du livre : fil conducteur/)
  assert.match(prefixe, /séances vues : 1 · en cours : 2 \/ 5 séances/)
  assert.deepEqual(stats.nbElements, { vu: 2, enCours: 3, aVenir: 2 })
  assert.equal(stats.tronque, false)
})

test('assemblerCorpus : plan groupé et marqué — sections en [a · b], SEMAINE COURANTE', () => {
  const { instances, livres } = fixture()
  const { prefixe } = assemblerCorpus(instances, livres)
  assert.match(prefixe, /Semaine 1 \(lun\. 7 sept\.\) — vu : Texte « Apologie » \(Platon\) · Livre « Naissance de la tragédie » \[séance 1 \(chap\. 1-4\)\]/)
  assert.match(prefixe, /Semaine 2 \(lun\. 14 sept\.\) — SEMAINE COURANTE, en cours : Cours « La liberté » \[I\. Le déterminisme · II\. Le libre arbitre\]/)
})

test('assemblerCorpus : STABILITÉ — deux appels sur les mêmes données → identique à l’octet', () => {
  const { instances, livres } = fixture()
  const a = assemblerCorpus(instances, livres)
  const b = assemblerCorpus(fixture().instances, fixture().livres)
  assert.equal(a.prefixe, b.prefixe)
})

test('assemblerCorpus : TRONCATURE par le plus ancien vu — squelette et en-cours intacts', () => {
  const { instances, livres } = fixture()
  // Deux gros blocs VUS (semaines 1 et 2) qui débordent la limite à eux deux.
  const gros = 'X'.repeat(LIMITE_TOKENS_CORPUS * CAR_PAR_TOKEN * 0.6)
  instances[0].elements = [
    el({ cle: 'v1', semaine: 1, tri: [1, 1, 1], vu: true, libellePlan: 'Ancien cours', texte: `ANCIEN_${gros}` }),
    el({ cle: 'v2', semaine: 2, tri: [2, 1, 1], vu: true, libellePlan: 'Cours récent', texte: `RECENT_${gros}` }),
    el({ cle: 'e1', semaine: 2, tri: [2, 2, 1], libellePlan: 'En cours', libelleMatiere: 'En cours', texte: 'CORPS_EN_COURS' }),
  ]
  const { prefixe, stats } = assemblerCorpus(instances, livres)
  assert.equal(stats.tronque, true)
  assert.equal(prefixe.includes('ANCIEN_X'), false)          // le plus ancien vu est tombé…
  assert.equal(prefixe.includes('RECENT_X'), true)           // …le vu récent reste
  assert.equal(prefixe.includes('CORPS_EN_COURS'), true)     // l'en-cours n'est JAMAIS tronqué
  assert.match(prefixe, /Semaine 1 .*Ancien cours/)          // le squelette garde le titre
})

test('assemblerCorpus : livre sans séance vue/en-cours → aucun bloc LIVRES (titres au plan seulement)', () => {
  const { instances, livres } = fixture()
  // Tout le livre à venir : la seule séance non-future devient future.
  instances[0].elements = instances[0].elements.map(e =>
    e.refType === 'livre_semaine' ? { ...e, vu: false, semaine: 3 } : e)
  const { prefixe } = assemblerCorpus(instances, livres)
  assert.equal(prefixe.includes('LIVRES'), false)
  assert.equal(prefixe.includes('Fiche séance'), false)
  assert.equal(prefixe.includes(SENT_FICHE_FUTURE), false)
  assert.equal(prefixe.includes('séance 1 (chap. 1-4)'), true) // titres toujours au plan
})
