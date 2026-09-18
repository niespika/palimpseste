// Tests de garde de la vue Année élève (handoff plan_cours_eleve, 18/09/2026).
// Exécution : `npm test`. Les cas reproduisent la PROD du 18/09 : 32 semaines
// d'enseignement, semaine courante 4, la classe THLP où « La Naissance de la
// Tragédie » ALTERNE (semaines d'année 2 · 9 · 16) avec « Qu'est-ce que
// l'identité ? » (3 → 6), et T5 où « Introduction à la philosophie » (S1 seule,
// 0 élément) est terminée.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  construirePlanEleve, etatParcours, pistesDuRail, segmentsDe, reperesDuRail, moisDuRail,
} from './scriptorium-plan-eleve'
import type { AnneeCorpus, ElementCorpus, InstanceCorpus } from './scriptorium-corpus'

// 32 lundis d'enseignement à partir du 24/08/2026, relâche fictive après la 9e semaine.
const LUNDIS: string[] = []
{
  let d = new Date('2026-08-24T00:00:00Z')
  for (let i = 0; i < 32; i++) {
    if (i === 9) d = new Date(d.getTime() + 7 * 86_400_000) // une semaine de relâche sautée
    LUNDIS.push(d.toISOString().slice(0, 10))
    d = new Date(d.getTime() + 7 * 86_400_000)
  }
}
const ANNEE: AnneeCorpus = { ay: 2026, nbSemaines: 32, semaineCourante: 4, lundis: LUNDIS }

const el = (semaine: number, groupe: string, section: string, vu: boolean): ElementCorpus => ({
  cle: `${groupe}-${section}`, refType: 'section', semaine, tri: [semaine, 0, 0], vu,
  groupe, groupeLibelle: `Cours « ${groupe} »`, libellePlan: section,
  libelleMatiere: `Cours « ${groupe} » — ${section}`, texte: 'SECRET', legendes: [],
})

// Instance dont les semaines de parcours k occupent les semaines d'année données.
const inst = (pcId: string, titre: string, semainesAnnee: number[], courante: number, elements: ElementCorpus[]): InstanceCorpus => {
  const sa: Record<number, number> = {}
  const iso: Record<number, string> = {}
  const lundis: Record<number, string> = {}
  semainesAnnee.forEach((a, i) => { sa[i + 1] = a; iso[i + 1] = LUNDIS[a - 1]; lundis[i + 1] = `lun. ${a}` })
  return { parcoursTitre: titre, nbSemaines: semainesAnnee.length, semaineCourante: courante, lundis, elements, pcId, lundisISO: iso, semainesAnnee: sa }
}

const TRAGEDIE = inst('pc-trag', 'La Naissance de la Tragédie', [2, 9, 16], 1, [
  el(1, 'Nietzsche philologue', 'Ouverture', true), el(1, 'Nietzsche philologue', 'Les Grandes Dionysies', true),
  el(2, 'Le dionysiaque', 'Introduction', false), el(3, 'Bilan', 'Synthèse', false),
])
const IDENTITE = inst('pc-id', 'Qu’est-ce que l’identité ?', [3, 4, 5, 6], 2, [
  el(1, 'Contenant et contenu', 'Ouverture', true),
  el(2, 'Contenant et contenu', 'Deux questions', true), el(2, 'Une chose qui pense', 'Descartes', true),
  el(3, 'Une chose qui pense', 'Locke', false), el(4, 'Une chose qui pense', 'Hume', false),
])
const INTRO = inst('pc-intro', 'Introduction à la philosophie', [1], 1, [])

test('etatParcours : avant / pendant / après, et l’alternance reste « en cours » entre deux de ses semaines', () => {
  assert.equal(etatParcours(5, 8, 4), 'a_venir')
  assert.equal(etatParcours(3, 6, 4), 'en_cours')
  assert.equal(etatParcours(1, 1, 4), 'termine')
  assert.equal(etatParcours(2, 16, 4), 'en_cours')  // Tragédie : semaine 4 n'est pas la sienne, mais elle n'est pas finie
  assert.equal(etatParcours(0, 0, 4), 'a_venir')    // aucune semaine datée
})

test('segmentsDe : l’alternance donne des segments, la suite un seul', () => {
  assert.deepEqual(segmentsDe([2, 9, 16]), [[2, 2], [9, 9], [16, 16]])
  assert.deepEqual(segmentsDe([3, 4, 5, 6]), [[3, 6]])
  assert.deepEqual(segmentsDe([1, 2, 4, 5, 6, 9]), [[1, 2], [4, 6], [9, 9]])
  assert.deepEqual(segmentsDe([]), [])
})

test('pistesDuRail : deux parcours qui se chevauchent prennent deux pistes, un troisième disjoint reprend la première', () => {
  const pistes = pistesDuRail([
    { semaineDebut: 2, semaineFin: 16 },  // Tragédie (enjambée)
    { semaineDebut: 3, semaineFin: 6 },   // Identité → chevauche
    { semaineDebut: 20, semaineFin: 24 }, // disjoint → piste 0
    { semaineDebut: 0, semaineFin: 0 },   // non daté → pas de piste
  ])
  assert.deepEqual(pistes, [0, 1, 0, -1])
})

test('pistesDuRail : l’ordre d’entrée ne change pas la répartition (tri par début)', () => {
  const a = pistesDuRail([{ semaineDebut: 3, semaineFin: 6 }, { semaineDebut: 1, semaineFin: 3 }])
  // le parcours 1→3 est placé d'abord (piste 0), le 3→6 chevauche en semaine 3 → piste 1
  assert.deepEqual(a, [1, 0])
})

test('reperesDuRail / moisDuRail : S1 · S5 · … · S30 · S32 ; un mois par changement, espacés', () => {
  assert.deepEqual(reperesDuRail(32), [1, 5, 10, 15, 20, 25, 30])  // 32 − 30 < 3 : pas de S32
  assert.deepEqual(reperesDuRail(33), [1, 5, 10, 15, 20, 25, 30, 33])
  const mois = moisDuRail(LUNDIS)
  assert.equal(mois[0].semaine, 1)
  assert.equal(mois[0].libelle, 'août')
  assert.equal(mois[0].court, 'août')
  assert.ok(mois.some(m => m.libelle === 'novembre' && m.court === 'nov.'), 'abréviation Intl, pas une troncature')
  assert.ok(mois.length >= 3 && mois.length <= 6, `≈ 4 repères, obtenu ${mois.length}`)
  for (let i = 1; i < mois.length; i++) assert.ok(mois[i].semaine - mois[i - 1].semaine >= 8)
})

test('construirePlanEleve : THLP — bornes d’année, états, segments, reprise de l’alternance', () => {
  const plan = construirePlanEleve({ instances: [TRAGEDIE, IDENTITE], annee: ANNEE })
  assert.equal(plan.annee.libelle, '2026 – 2027')
  assert.equal(plan.annee.nbSemaines, 32)
  assert.equal(plan.annee.semaineCourante, 4)
  assert.equal(plan.annee.lundiCourant, 'lundi 14 septembre')

  const [trag, ident] = plan.parcours
  assert.equal(trag.id, 'pc-trag')
  assert.equal(trag.semaineDebut, 2)
  assert.equal(trag.semaineFin, 16)
  assert.deepEqual(trag.semainesAnnee, [2, 9, 16])
  assert.equal(trag.etat, 'en_cours')
  assert.equal(trag.reprise, '19 octobre')        // semaine d'année 9 = 3e lundi après la relâche fictive
  assert.equal(trag.lundiDebut, '31 août')
  assert.equal(trag.nbElements, 4)
  assert.equal(trag.nbElementsVus, 2)

  assert.equal(ident.etat, 'en_cours')
  assert.equal(ident.reprise, null)                // la semaine 4 est la sienne
  assert.equal(ident.semaineCourante, 2)
  const courante = ident.semaines.find(s => s.courante)
  assert.ok(courante)
  assert.deepEqual(courante.groupes, ['Cours « Contenant et contenu »', 'Cours « Une chose qui pense »'])
  assert.deepEqual(courante.elements.map(e => e.statut), ['vu', 'vu'])
})

test('construirePlanEleve : T5 — un parcours d’une semaine sans élément est terminé ; anti-spoiler intact', () => {
  const plan = construirePlanEleve({ instances: [INTRO], annee: ANNEE })
  const [intro] = plan.parcours
  assert.equal(intro.etat, 'termine')
  assert.equal(intro.semaines.length, 0)
  assert.equal(intro.nbElementsVus, 0)
  assert.equal(intro.lundiDebut, '24 août')
  assert.equal(intro.lundiFin, '24 août')
  assert.ok(!JSON.stringify(plan).includes('SECRET'), 'aucun texte de contenu ne franchit le DTO')
})

test('etatParcours : un parcours d’une autre année scolaire, tout vu, est terminé — pas « à venir »', () => {
  assert.equal(etatParcours(0, 0, 4, true), 'termine')
  assert.equal(etatParcours(0, 0, 4, false), 'a_venir')
  const ancien: InstanceCorpus = { ...INTRO, parcoursTitre: 'Ancien', nbSemaines: 3, semaineCourante: 3, semainesAnnee: {}, lundisISO: {}, lundis: {} }
  const plan = construirePlanEleve({ instances: [ancien], annee: ANNEE })
  assert.equal(plan.parcours[0].etat, 'termine')
  assert.equal(plan.parcours[0].semaineDebut, 0)
})

test('construirePlanEleve : deux semaines de parcours sur la même semaine d’année ne font qu’un segment', () => {
  const doublon: InstanceCorpus = { ...IDENTITE, semainesAnnee: { 1: 5, 2: 5, 3: 6, 4: 6 } }
  const plan = construirePlanEleve({ instances: [doublon], annee: ANNEE })
  assert.deepEqual(plan.parcours[0].semainesAnnee, [5, 6])
  assert.deepEqual(segmentsDe(plan.parcours[0].semainesAnnee), [[5, 6]])
})

test('pistesDuRail : deux enjambées identiques prennent deux pistes ; repères des petites années', () => {
  assert.deepEqual(pistesDuRail([{ semaineDebut: 3, semaineFin: 6 }, { semaineDebut: 3, semaineFin: 6 }]), [0, 1])
  assert.deepEqual(reperesDuRail(1), [1])
  assert.deepEqual(reperesDuRail(4), [1, 4])
  assert.deepEqual(moisDuRail(['2026-09-07', '2026-09-14']).map(m => m.libelle), ['septembre'])
})

test('construirePlanEleve : une queue non datée ne borne pas la fin — semaineFin suit la dernière semaine DATÉE', () => {
  const queue: InstanceCorpus = { ...IDENTITE, nbSemaines: 6 } // semaines 5 et 6 sans date
  const plan = construirePlanEleve({ instances: [queue], annee: ANNEE })
  assert.equal(plan.parcours[0].semaineFin, 6)
  assert.equal(plan.parcours[0].nbSemaines, 6)
  assert.equal(plan.parcours[0].lundiFin, '28 septembre') // le dernier lundi DÉFINI (semaine d'année 6), pas la 6e semaine du parcours
})

test('construirePlanEleve : matière nulle ou sans année → plan vide', () => {
  assert.equal(construirePlanEleve({ instances: [IDENTITE] }).parcours.length, 0)
  const plan = construirePlanEleve(null)
  assert.equal(plan.parcours.length, 0)
  assert.equal(plan.annee.nbSemaines, 0)
})

test('construirePlanEleve : avant la rentrée, tout est à venir et lundiCourant est nul', () => {
  const plan = construirePlanEleve({ instances: [IDENTITE], annee: { ...ANNEE, semaineCourante: 0 } })
  assert.equal(plan.parcours[0].etat, 'a_venir')
  assert.equal(plan.annee.lundiCourant, null)
})
