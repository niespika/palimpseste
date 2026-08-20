// Tests de la frise d'enseignement inter-semestres (fonctions pures).
// Exécution : `npm test` (node --test + hook de résolution TS, aucune dépendance).
// Reproduit le déroulé chiffré du SPEC §5.2 et les cas de bord du §5.3.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  anneeScolaireDe,
  libelleAnneeScolaire,
  libelleAnneeScolaireDe,
  friseEnseignementContinue,
  resoudreAncre,
  mapperParcours,
  type SemestreFrise,
} from './frise-enseignement'
import { calerAnnee } from './calendrier-grille'
import type { Holiday } from '../types/calendrier'

// ── Fixtures : l'exemple du product owner (SPEC §5.2) ────────────────────────
// S1 2026-09-07 → 2026-12-27 (dimanche), relâche la semaine du 2026-10-26.
// S2 2027-01-11 → 2027-04-30 ; gap intersemestre non modélisé.
const S1: SemestreFrise = {
  id: 's1',
  name: 'S1',
  start_date: '2026-09-07',
  end_date: '2026-12-27',
  archived_at: null,
}
const S2: SemestreFrise = {
  id: 's2',
  name: 'S2',
  start_date: '2027-01-11',
  end_date: '2027-04-30',
  archived_at: null,
}
const holidaysPO = new Map<string, Holiday[]>([
  [
    's1',
    [
      {
        id: 'h1',
        semester_id: 's1',
        label: 'Relâche',
        start_date: '2026-10-26',
        end_date: '2026-11-01',
        created_at: '',
      },
    ],
  ],
])

function semaineParIndex(res: ReturnType<typeof friseEnseignementContinue>, idx: number) {
  const w = res.frise.find((s) => s.indexContinu === idx)
  assert.ok(w, `indexContinu ${idx} absent de la frise`)
  return w!
}

// ── anneeScolaireDe : frontière août (maths-M1) ──────────────────────────────
test('anneeScolaireDe : août ⇒ nouvelle année scolaire', () => {
  assert.equal(anneeScolaireDe('2026-08-01'), 2026)
  assert.equal(anneeScolaireDe('2026-09-07'), 2026)
  assert.equal(anneeScolaireDe('2026-12-31'), 2026)
  assert.equal(anneeScolaireDe('2027-01-11'), 2026) // janvier ⇒ AY précédente
  assert.equal(anneeScolaireDe('2027-07-31'), 2026) // dernier jour de l'AY 2026
  assert.equal(anneeScolaireDe('2027-08-01'), 2027) // bascule AY suivante
})

// ── friseEnseignementContinue : déroulé chiffré (SPEC §5.2) ──────────────────
test('frise : S1(15 sem, relâche sautée) + S2, index continu sans reset', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  assert.equal(res.avisBloquant, undefined)

  // S1 : 16 semaines calendaires, 1 vacances ⇒ 15 semaines d'enseignement.
  const s1Weeks = res.frise.filter((w) => w.semestreId === 's1')
  assert.equal(s1Weeks.length, 15)

  // idx 3 = S1 · péda 3 = 2026-09-21 → 09-27
  const i3 = semaineParIndex(res, 3)
  assert.deepEqual(
    [i3.semestreNom, i3.pedagogicalNumber, i3.dateDebutLundi, i3.dateFinDimanche],
    ['S1', 3, '2026-09-21', '2026-09-27']
  )
  // idx 7 = dernière avant la relâche
  assert.equal(semaineParIndex(res, 7).dateDebutLundi, '2026-10-19')
  // idx 8 = SAUTE la relâche → 2026-11-02, péda 8
  const i8 = semaineParIndex(res, 8)
  assert.deepEqual([i8.pedagogicalNumber, i8.dateDebutLundi], [8, '2026-11-02'])
  // idx 15 = dernière de S1 = 2026-12-21 → 12-27
  const i15 = semaineParIndex(res, 15)
  assert.deepEqual([i15.semestreNom, i15.dateFinDimanche], ['S1', '2026-12-27'])

  // idx 16 = SAUTE le gap → S2 · péda 1 = 2027-01-11 (reset péda local, index continu)
  const i16 = semaineParIndex(res, 16)
  assert.deepEqual(
    [i16.semestreNom, i16.pedagogicalNumber, i16.dateDebutLundi],
    ['S2', 1, '2027-01-11']
  )
  // idx 18 = S2 · péda 3 = 2027-01-25
  const i18 = semaineParIndex(res, 18)
  assert.deepEqual([i18.pedagogicalNumber, i18.dateDebutLundi], [3, '2027-01-25'])
})

// ── Ancre + mapping : l'exemple complet du PO ────────────────────────────────
test('ancre : date_debut 2026-09-23 (mercredi) → idx 3 (containment)', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  const { ancreIdx, avis } = resoudreAncre(res, '2026-09-23')
  assert.equal(ancreIdx, 3)
  assert.equal(avis, undefined)
})

test('mapping : nb=16 depuis idx 3 → fin S2 · péda 3 (2027-01-25), tout résolu', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  const map = mapperParcours(res, 3, 16)
  assert.equal(map.length, 16)
  // Toutes résolues (S1 et S2 existent, même AY).
  assert.ok(map.every((c) => c.statut === 'resolue'))

  const k1 = map[0]
  assert.equal(k1.statut, 'resolue')
  if (k1.statut === 'resolue') {
    assert.deepEqual([k1.semestreNom, k1.pedagogicalNumber, k1.dateDebutLundi], ['S1', 3, '2026-09-21'])
  }
  // k=6 saute la relâche
  const k6 = map[5]
  assert.equal(k6.statut === 'resolue' && k6.dateDebutLundi, '2026-11-02')
  // k=14 saute le gap → S2 · 1
  const k14 = map[13]
  assert.equal(k14.statut === 'resolue' && k14.dateDebutLundi, '2027-01-11')
  // k=16 = fin du parcours → S2 · péda 3, lundi 2027-01-25
  const k16 = map[15]
  assert.equal(k16.statut, 'resolue')
  if (k16.statut === 'resolue') {
    assert.deepEqual([k16.semestreNom, k16.pedagogicalNumber, k16.dateDebutLundi], ['S2', 3, '2027-01-25'])
  }
})

// ── Off-by-one explicite ─────────────────────────────────────────────────────
test('off-by-one : la semaine d’ancre EST la semaine 1 du parcours', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  const map = mapperParcours(res, 3, 1)
  assert.equal(map.length, 1)
  assert.equal(map[0].statut === 'resolue' && map[0].indexContinu, 3)
})

// ── Cas de bord (SPEC §5.3) ──────────────────────────────────────────────────
test('cas (a′) non_planifiable : débordement au-delà de l’AY (frontière août)', () => {
  // Seul S1 existe (AY 2026). Parcours très long ancré tôt → déborde jusqu'à l'AY suivante.
  const res = friseEnseignementContinue([S1], holidaysPO)
  const { ancreIdx } = resoudreAncre(res, '2026-09-07')
  assert.equal(ancreIdx, 1)
  const map = mapperParcours(res, ancreIdx, 52)
  // Les 15 premières (S1) sont résolues.
  assert.ok(map.slice(0, 15).every((c) => c.statut === 'resolue'))
  // Les débordements de la MÊME AY (printemps 2027, avant août) = a_definir.
  const aDefinir = map.filter((c) => c.statut === 'a_definir')
  const nonPlan = map.filter((c) => c.statut === 'non_planifiable')
  assert.ok(aDefinir.length > 0, 'des semaines a_definir attendues (même AY)')
  assert.ok(nonPlan.length > 0, 'des semaines non_planifiable attendues (au-delà d’août)')
  // La toute dernière (k=52) tombe forcément au-delà de l'AY.
  assert.equal(map[51].statut, 'non_planifiable')
})

test('cas (a) a_definir : débordement sur un semestre de la MÊME AY non encore créé', () => {
  // Seul S1 existe ; parcours court qui déborde de quelques semaines DANS l'AY (hiver 2027).
  const res = friseEnseignementContinue([S1], holidaysPO)
  const { ancreIdx } = resoudreAncre(res, '2026-12-14') // ancre proche de la fin de S1
  const map = mapperParcours(res, ancreIdx!, 6)
  const restants = map.filter((c) => c.statut !== 'resolue')
  assert.ok(restants.length > 0)
  assert.ok(restants.every((c) => c.statut === 'a_definir'), 'même AY ⇒ a_definir, pas non_planifiable')
})

test('cas (c) date antérieure au programme → ancre = 1re semaine + avis', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  const { ancreIdx, avis } = resoudreAncre(res, '2026-08-15')
  assert.equal(ancreIdx, 1)
  assert.match(avis ?? '', /antérieure/)
})

test('cas (c′) date après le dernier semestre de l’AY → ancre null + avis', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  const { ancreIdx, avis } = resoudreAncre(res, '2027-06-01') // après fin S2, avant août
  assert.equal(ancreIdx, null)
  assert.match(avis ?? '', /postérieure/)
})

test('cas (c″) frise vide → avis explicite, pas de a_definir muet', () => {
  const res = friseEnseignementContinue([], new Map())
  const { ancreIdx, avis } = resoudreAncre(res, '2026-09-23')
  assert.equal(ancreIdx, null)
  assert.match(avis ?? '', /aucun semestre/)
})

test('cas (d) chevauchement de semestres → avisBloquant, ancre null', () => {
  const chevauche: SemestreFrise = { ...S2, start_date: '2026-12-20' } // ≤ S1.end_date (12-27)
  const res = friseEnseignementContinue([S1, chevauche], holidaysPO)
  assert.equal(res.avisBloquant, true)
  assert.match(res.avis ?? '', /incohérente/)
  const { ancreIdx } = resoudreAncre(res, '2026-09-23')
  assert.equal(ancreIdx, null)
})

test('cas (e) end_date non dominicale → dernière semaine tronquée + avis', () => {
  // S1 se termine un mercredi (2026-12-23) : la semaine 12-21→12-27 déborde de la fin.
  const s1Merc: SemestreFrise = { ...S1, end_date: '2026-12-23' }
  const res = friseEnseignementContinue([s1Merc], holidaysPO)
  assert.match(res.avis ?? '', /tronquée/)
  // La dernière semaine émise doit être ENTIÈREMENT dans le semestre (dimanche ≤ end_date).
  const derniere = res.frise[res.frise.length - 1]
  assert.ok(derniere.dateFinDimanche <= '2026-12-23')
  // Une semaine de moins qu'avec un end_date dominical (15 → 14).
  assert.equal(res.frise.length, 14)
})

// ── Discipline fuseau : aucune dérive DST ────────────────────────────────────
test('dates pures : toutes les frontières sont des lundis/dimanches UTC', () => {
  const res = friseEnseignementContinue([S1, S2], holidaysPO)
  for (const w of res.frise) {
    const lundi = new Date(w.dateDebutLundi + 'T00:00:00Z')
    const dimanche = new Date(w.dateFinDimanche + 'T00:00:00Z')
    assert.equal(lundi.getUTCDay(), 1, `${w.dateDebutLundi} devrait être un lundi`)
    assert.equal(dimanche.getUTCDay(), 0, `${w.dateFinDimanche} devrait être un dimanche`)
  }
})

test('libelleAnneeScolaire : le libellé d’affichage DÉRIVE de anneeScolaireDe', () => {
  // Une seule définition de l'année scolaire (frontière d'août) ; l'écran Calendrier
  // en fait sa maille et ne réimplémente plus la sienne (lot Calendrier · Année).
  assert.equal(libelleAnneeScolaire(2026), '2026-2027')
  assert.equal(libelleAnneeScolaireDe('2026-08-31'), '2026-2027')
  assert.equal(libelleAnneeScolaireDe('2027-01-24'), '2026-2027') // janvier : même AY
  assert.equal(libelleAnneeScolaireDe('2026-07-31'), '2025-2026') // juillet : AY précédente
})

// ── P8 : une année CALÉE ne laisse plus d'avis à la frise ────────────────────
// Le lot Calendrier · Année cale les bornes sur la semaine (lundi → dimanche).
// Deux effets à VÉRIFIER, pas à supposer : la dernière semaine d'un semestre n'est
// plus tronquée (`end_date` toujours dominicale), et le S2 ne chevauche jamais le S1
// (il démarre le lendemain du dimanche de fin). Sans quoi l'aperçu du plan
// d'évaluation porterait un avis, voire un `avisBloquant`.
test('année calée : la frise ne rend AUCUN avis, et enchaîne les deux semestres', () => {
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17') // mercredi, mercredi, jeudi
  const sems: SemestreFrise[] = [
    { id: 'a1', name: 'Semestre 1', start_date: a.s1.start, end_date: a.s1.end, archived_at: null },
    { id: 'a2', name: 'Semestre 2', start_date: a.s2.start, end_date: a.s2.end, archived_at: null },
  ]
  const res = friseEnseignementContinue(sems, new Map())
  assert.equal(res.avis, undefined) // ni troncature, ni gap aberrant
  assert.equal(res.avisBloquant, undefined) // ni chevauchement
  // Continuité : index contigus, aucun lundi émis deux fois, la frontière se suit.
  res.frise.forEach((w, i) => assert.equal(w.indexContinu, i + 1))
  assert.equal(new Set(res.frise.map((w) => w.dateDebutLundi)).size, res.frise.length)
  const dernierS1 = res.frise.filter((w) => w.semestreId === 'a1').at(-1)!
  const premierS2 = res.frise.find((w) => w.semestreId === 'a2')!
  assert.equal(premierS2.dateDebutLundi, a.s2.start)
  assert.equal(dernierS1.dateFinDimanche, a.s1.end)
  assert.equal(premierS2.indexContinu, dernierS1.indexContinu + 1)
})

test('année calée : un parcours ancré à la rentrée n’a aucune semaine « à définir »', () => {
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17')
  const sems: SemestreFrise[] = [
    { id: 'a1', name: 'Semestre 1', start_date: a.s1.start, end_date: a.s1.end, archived_at: null },
    { id: 'a2', name: 'Semestre 2', start_date: a.s2.start, end_date: a.s2.end, archived_at: null },
  ]
  const res = friseEnseignementContinue(sems, new Map())
  const { ancreIdx, avis } = resoudreAncre(res, a.s1.start)
  assert.equal(ancreIdx, 1)
  assert.equal(avis, undefined)
  // Le statut `a_definir` (« semestre de la même AY encore à créer ») devient rare :
  // tant qu'on reste dans les semaines de l'année, tout se résout.
  const map = mapperParcours(res, ancreIdx, res.frise.length)
  assert.equal(map.filter((c) => c.statut !== 'resolue').length, 0)
})

test('année calée : les deux semestres tombent dans la MÊME année scolaire', () => {
  // La frise du parcours filtre par AY : une année à cheval sur le 1er août ferait
  // tomber les deux semestres dans deux AY et n'en montrerait qu'un.
  const a = calerAnnee('2026-09-02', '2027-01-20', '2027-06-17')
  assert.equal(anneeScolaireDe(a.s1.start), 2026)
  assert.equal(anneeScolaireDe(a.s2.end), 2026)
  // Contre-exemple : une rentrée un dimanche début août recule au lundi de juillet.
  const b = calerAnnee('2026-08-02', '2026-12-16', '2027-06-17')
  assert.equal(anneeScolaireDe(b.s1.start), 2025) // ≠ 2026 → refusé à la saisie
  assert.equal(anneeScolaireDe(b.s2.end), 2026)
})
