// ============================================================================
// C6 · L3 — LES ÉPREUVES DU BUDGET OPTIONNEL : le pull, le push, et la reprise.
// ----------------------------------------------------------------------------
// ⭐ Les groupes les plus importants sont les deux derniers : « JAMAIS AU-DELÀ »
//    se prouve par L'ABUS, pas par l'usage, et « un seul à la fois » se prouve
//    sur la garde, pas sur le bouton.
// ============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  cyclesEntre, estACOuMoins, graineDuPull, hasardDeterministe, phraseDuRefus,
  quotaOptionnel, suggestionsDuPush, tientDansLeQuota,
  type MesurePourLePush, type MotifDuRefus, type NiveauPourLePush,
} from './bonus'
import { poserLaSemaine, type Candidat, type ExercicePose } from './semaine'
import { CYCLES_DU_PLANCHER_DE_MESURE, RELIQUAT_PERDU_MIN } from './config'
import type { EntreeDePriorite } from './ciblage'
import type { Competence, Lettre } from './types'

const budget = { plancher: 45, plafond: 60, optionnel: 30 }

let k = 0
function cand(competence: Competence, o: Partial<Candidat> = {}): Candidat {
  k++
  return { exerciceId: `e${k}`, competence, grain: 'meso', geste: 'produire',
    cran: 'production_etayee', mode: 'composer', dureeMin: 15, ciblesSecondaires: [], ...o }
}
const entree = (competence: Competence): EntreeDePriorite =>
  ({ competence, regle: 'R2', motif: '' })
const pose = (competence: Competence, dureeMin: number, tour = 0): ExercicePose =>
  ({ candidat: cand(competence, { dureeMin }), regle: 'R2', departageParPB3: false,
    tirage: false, tour })

const niveau = (competence: Competence, lettre: Lettre,
  statutRecette = 'evaluee'): NiveauPourLePush => ({ competence, statutRecette, lettre })
const mesure = (competence: Competence, cycleLundi: string): MesurePourLePush =>
  ({ competence, cycleLundi })

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · le quota — « les minutes non utilisées sont PERDUES »', () => {
  test('⭐ le reliquat se compte sur le cycle courant, et il ne descend jamais sous zéro', () => {
    assert.deepEqual(quotaOptionnel(30, 0), { optionnel: 30, consomme: 0, restant: 30, epuise: false })
    assert.deepEqual(quotaOptionnel(30, 20), { optionnel: 30, consomme: 20, restant: 10, epuise: false })
    // ⛔ « Jamais au-delà » : un dépassement ne rend pas un reliquat négatif.
    assert.deepEqual(quotaOptionnel(30, 45), { optionnel: 30, consomme: 45, restant: 0, epuise: true })
  })

  test('⛔ PB6 — un reste SOUS 5 MINUTES est un quota ÉPUISÉ, pas un quota', () => {
    // « Le plus petit exercice du dispositif dure 5 minutes : le reliquat sous ce
    //   seuil est perdu. » Un reste de 4 min ne servira jamais rien.
    assert.equal(quotaOptionnel(30, 30 - RELIQUAT_PERDU_MIN).epuise, false, 'exactement 5 min : ça tient')
    assert.equal(quotaOptionnel(30, 30 - RELIQUAT_PERDU_MIN + 1).epuise, true, '4 min : perdu')
  })

  test('⛔⛔ LE QUOTA NE SE REPORTE PAS : deux cycles ne se cumulent jamais', () => {
    // La règle vit dans l'APPELANT — `consomme` se lit sur UN cycle —, et cette
    // épreuve fixe ce que la fonction promet : elle ne connaît qu'un seul cycle,
    // donc elle ne peut pas reporter. Un quota reporté serait un défaut
    // silencieux : personne ne le verrait avant l'analyse de fin d'année.
    const cycleA = quotaOptionnel(30, 30)
    const cycleB = quotaOptionnel(30, 0)
    assert.equal(cycleA.epuise, true)
    assert.equal(cycleB.restant, 30, 'le cycle suivant repart du plein, jamais du reste')
  })

  test('⭐ un exercice doit TENIR ENTIÈREMENT dans le reliquat', () => {
    const q = quotaOptionnel(30, 20) // il reste 10
    assert.equal(tientDansLeQuota(10, q), true, 'pile')
    assert.equal(tientDansLeQuota(11, q), false, '« jamais au-delà »')
    assert.equal(tientDansLeQuota(0, q), false, 'une durée nulle n’est pas un exercice')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · les phrases — « le silence est un mensonge »', () => {
  const TOUS: MotifDuRefus[] = ['porte_fermee', 'semaine_vide', 'semaine_en_cours',
    'un_a_la_fois', 'quota_epuise', 'ne_tient_pas', 'vivier_vide', 'liste_vide',
    'hors_routage', 'aucun_budget', 'incident']

  test('⛔ CHAQUE motif a sa phrase, et aucune n’est vide', () => {
    for (const m of TOUS) {
      assert.ok(phraseDuRefus(m).trim().length > 20, `${m} : phrase trop courte ou absente`)
    }
  })

  test('⛔⛔ AUCUNE PHRASE NE NOMME UN INTERRUPTEUR — l’élève n’a pas à les connaître', () => {
    const noms = ['exercices_actif', 'routeur_actif', 'chaine_actif', 'fabrique_actif',
      'competences_affichage_actif', 'passation_classe_actif', 'interrupteur']
    for (const m of TOUS) {
      for (const n of noms) {
        assert.ok(!phraseDuRefus(m).toLowerCase().includes(n), `${m} nomme « ${n} »`)
      }
    }
  })

  test('⛔⛔ AUCUNE PHRASE NE DIT UN NOMBRE DE MINUTES — « pas de budget-temps hebdomadaire »', () => {
    for (const m of TOUS) {
      const p = phraseDuRefus(m)
      assert.ok(!/\d/.test(p), `${m} porte un chiffre : « ${p} »`)
      assert.ok(!/minute/i.test(p), `${m} parle de minutes : « ${p} »`)
    }
  })

  test('⭐ LES TROIS VIDES NE SE DISENT PAS PAREIL', () => {
    const q = phraseDuRefus('quota_epuise')
    const v = phraseDuRefus('vivier_vide')
    const l = phraseDuRefus('liste_vide')
    assert.notEqual(q, v)
    assert.notEqual(v, l)
    assert.notEqual(q, l)
    // ⭐ Et la porte fermée n’est ni l’un ni l’autre (`07-` §5, deux vides à
    //   distinguer — trois, ici).
    assert.notEqual(phraseDuRefus('porte_fermee'), v)
    // ⛔ Ni le SEGMENT 1, qui est la semaine de RENTRÉE — le premier refus de
    //    l'année, et celui qu'on lit le plus mal s'il se confond avec `liste_vide`.
    assert.notEqual(phraseDuRefus('hors_routage'), l)
  })

  test('⚠️ « le vivier est vide » ne fait pas porter le manque à l’élève', () => {
    assert.match(phraseDuRefus('vivier_vide'), /ce n’est pas toi/)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · le tirage — la garde MÉCANIQUE du double clic', () => {
  test('⛔⛔ DEUX DEMANDES CONCURRENTES TIRENT PAREIL — c’est ce qui fait mordre la clé unique', () => {
    const g = graineDuPull('eleve-1', '2026-09-14', 0)
    const a = hasardDeterministe(g)
    const b = hasardDeterministe(g)
    const suiteA = [a(), a(), a(), a(), a()]
    const suiteB = [b(), b(), b(), b(), b()]
    assert.deepEqual(suiteA, suiteB, 'même graine, même suite — sinon deux exercices servis')
  })

  test('⭐ DEUX ÉLÈVES DE MÊME PROFIL NE TIRENT PAS PAREIL — la dispersion tient', () => {
    // C’est la raison d’être du tirage de la phase B : « deux élèves de même
    // profil recevaient le MÊME exercice, la même semaine, toute l’année ».
    const a = hasardDeterministe(graineDuPull('eleve-1', '2026-09-14', 0))
    const b = hasardDeterministe(graineDuPull('eleve-2', '2026-09-14', 0))
    assert.notDeepEqual([a(), a(), a()], [b(), b(), b()])
  })

  test('⭐ LA DEUXIÈME DEMANDE D’UN MÊME CYCLE NE REJOUE PAS LE TIRAGE DE LA PREMIÈRE', () => {
    const a = hasardDeterministe(graineDuPull('eleve-1', '2026-09-14', 0))
    const b = hasardDeterministe(graineDuPull('eleve-1', '2026-09-14', 1))
    assert.notDeepEqual([a(), a(), a()], [b(), b(), b()])
  })

  test('⚠️ le tirage reste dans [0, 1[ — sinon un index sortirait du tableau', () => {
    const h = hasardDeterministe('graine')
    for (let i = 0; i < 200; i += 1) {
      const v = h()
      assert.ok(v >= 0 && v < 1, `valeur hors bornes : ${v}`)
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · la reprise de la phase B — « le suivant dans l’ordre »', () => {
  test('⛔⛔ « UN EXERCICE À LA FOIS » : la passe en pose UN, jamais deux', () => {
    const p = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
      (c) => [cand(c, { dureeMin: 10 })], undefined,
      { dejaPoses: [], maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse.length, 1)
  })

  test('⛔⛔ « JAMAIS AU-DELÀ » — le plafond du quota borne, et il borne DUREMENT', () => {
    // La semaine a pris 60 min ; le quota en offre 30. Le plafond passé à la
    // reprise vaut donc 90, et un exercice de 35 min NE TIENT PAS.
    const dejaPoses = [pose('structure', 30), pose('argumentation', 30)]
    const p = poserLaSemaine([entree('expression')],
      { ...budget, plafond: 60 + 30 },
      (c) => [cand(c, { dureeMin: 35 })], undefined,
      { dejaPoses, maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse.length, 0, '35 min sur un reliquat de 30 : refusé')
    assert.equal(p.minutesAssignees, 60, 'rien n’a été ajouté')
  })

  test('⭐ ce qui TIENT est servi, et les minutes s’additionnent', () => {
    const dejaPoses = [pose('structure', 30), pose('argumentation', 30)]
    const p = poserLaSemaine([entree('expression')],
      { ...budget, plafond: 60 + 30 },
      (c) => [cand(c, { dureeMin: 25 })], undefined,
      { dejaPoses, maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse.length, 1)
    assert.equal(p.minutesAssignees, 85)
  })

  test('⛔⛔ PB2 VAUT À LA REPRISE : jamais deux fois de suite la même compétence', () => {
    // La semaine s’est arrêtée sur `structure` ; le bonus ne peut pas la
    // redonner de suite. « Contrainte DURE, SANS EXCEPTION. »
    const dejaPoses = [pose('argumentation', 20), pose('structure', 20)]
    const p = poserLaSemaine([entree('structure'), entree('expression')],
      { ...budget, plafond: 40 + 30 },
      (c) => [cand(c, { dureeMin: 15 })], undefined,
      { dejaPoses, maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse.length, 1)
    assert.notEqual(p.posesDeCettePasse[0].candidat.competence, 'structure',
      'PB2 : la dernière compétence de la semaine ne revient pas de suite')
  })

  test('⭐ PB5 — la reprise repart AU TOUR SUIVANT', () => {
    const dejaPoses = [pose('structure', 20, 0), pose('argumentation', 20, 1)]
    const p = poserLaSemaine([entree('expression')],
      { ...budget, plafond: 40 + 30 },
      (c) => [cand(c, { dureeMin: 15 })], undefined,
      { dejaPoses, maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse[0].tour, 2, 'le tour continue, il ne repart pas à zéro')
  })

  test('⭐ `posesDeCettePasse` ne rend QUE le neuf ; `exercices` porte tout', () => {
    const dejaPoses = [pose('structure', 20)]
    const p = poserLaSemaine([entree('expression')],
      { ...budget, plafond: 20 + 30 },
      (c) => [cand(c, { dureeMin: 15 })], undefined,
      { dejaPoses, maxAPoser: 1 })
    assert.equal(p.exercices.length, 2)
    assert.equal(p.posesDeCettePasse.length, 1)
    assert.equal(p.posesDeCettePasse[0].candidat.competence, 'expression')
  })

  test('⚠️ SANS REPRISE, la phase B est celle de la semaine, à l’identique', () => {
    const avec = poserLaSemaine([entree('structure'), entree('argumentation')], budget,
      (c) => [cand(c, { dureeMin: 20 })])
    assert.deepEqual(avec.posesDeCettePasse, avec.exercices,
      'sans reprise, tout ce qui est posé l’est par cette passe')
  })

  test('⚠️ une liste de priorité VIDE ne pose rien, et n’efface pas la semaine', () => {
    const dejaPoses = [pose('structure', 20)]
    const p = poserLaSemaine([], { ...budget, plafond: 50 },
      () => [cand('expression')], undefined, { dejaPoses, maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse.length, 0)
    assert.equal(p.exercices.length, 1, 'la semaine reste ce qu’elle était')
    assert.equal(p.minutesAssignees, 20)
  })

  test('⛔ UN VIVIER VIDE NE SE REMPLIT PAS DE FORCE : rien à servir, et rien n’est servi', () => {
    const dejaPoses = [pose('structure', 20)]
    const p = poserLaSemaine([entree('expression')], { ...budget, plafond: 50 },
      () => [], undefined, { dejaPoses, maxAPoser: 1 })
    assert.equal(p.posesDeCettePasse.length, 0)
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · le push — deux conditions CUMULATIVES, et R0 par-dessus', () => {
  const CYCLE = '2026-10-05'
  const ilYA = (cycles: number) =>
    new Date(Date.parse(`${CYCLE}T00:00:00Z`) - cycles * 7 * 86_400_000)
      .toISOString().slice(0, 10)

  test('⭐ une compétence JAMAIS MESURÉE, à C, chez un `evaluee` : SUGGÉRÉE', () => {
    const s = suggestionsDuPush([niveau('structure', 'C')], [], CYCLE)
    assert.deepEqual(s, [{ competence: 'structure', lettre: 'C', cyclesSansMesure: null }])
  })

  test('⭐ le seuil est CYCLES_DU_PLANCHER_DE_MESURE, jamais un 3 en dur', () => {
    const juste = suggestionsDuPush([niveau('structure', 'C')],
      [mesure('structure', ilYA(CYCLES_DU_PLANCHER_DE_MESURE))], CYCLE)
    assert.equal(juste.length, 1, 'à 3 cycles pile, le plancher est atteint : on suggère')
    const trop = suggestionsDuPush([niveau('structure', 'C')],
      [mesure('structure', ilYA(CYCLES_DU_PLANCHER_DE_MESURE - 1))], CYCLE)
    assert.equal(trop.length, 0, 'mesurée il y a 2 cycles : rien à suggérer')
  })

  test('⭐ c’est la mesure LA PLUS RÉCENTE qui compte, pas la plus ancienne', () => {
    const s = suggestionsDuPush([niveau('structure', 'C')],
      [mesure('structure', ilYA(9)), mesure('structure', ilYA(1))], CYCLE)
    assert.equal(s.length, 0)
  })

  test('⛔ « À C OU MOINS » : E, D et C entrent ; B et A n’entrent pas', () => {
    for (const l of ['E', 'D', 'C'] as Lettre[]) {
      assert.equal(suggestionsDuPush([niveau('structure', l)], [], CYCLE).length, 1, `${l}`)
    }
    for (const l of ['B', 'A'] as Lettre[]) {
      assert.equal(suggestionsDuPush([niveau('structure', l)], [], CYCLE).length, 0, `${l}`)
    }
  })

  test('⛔⛔ `NULL` N’EST PAS « E » — une compétence SANS LETTRE n’est ni ciblable ni sondable', () => {
    assert.equal(estACOuMoins(null), false)
    assert.equal(suggestionsDuPush([niveau('structure', null)], [], CYCLE).length, 0,
      'une suggestion sur une compétence sans lettre serait un ciblage déguisé')
  })

  test('⛔ R0 — le routeur NE CIBLE QUE LES `evaluee`', () => {
    for (const statut of ['mesuree_silencieusement', 'differee', 'non_ouverte']) {
      assert.equal(
        suggestionsDuPush([niveau('structure', 'E', statut)], [], CYCLE).length, 0, statut)
    }
  })

  test('⭐ l’ordre est STABLE : le manque le plus ancien d’abord, puis la lettre la plus basse', () => {
    const s = suggestionsDuPush([
      niveau('structure', 'C'), niveau('argumentation', 'E'), niveau('expression', 'D'),
    ], [
      mesure('structure', ilYA(4)),
      mesure('expression', ilYA(9)),
      // `argumentation` : jamais mesurée → en tête, devant tout le monde.
    ], CYCLE)
    assert.deepEqual(s.map((x) => x.competence), ['argumentation', 'expression', 'structure'])
  })

  test('⚠️ deux appels sur le même état rendent EXACTEMENT la même liste', () => {
    const etat = [niveau('structure', 'C'), niveau('expression', 'C')]
    assert.deepEqual(suggestionsDuPush(etat, [], CYCLE), suggestionsDuPush(etat, [], CYCLE),
      'un tri instable ferait « bouger » la tuile sous les yeux de l’élève')
  })

  test('⛔ RIEN NE S’ÉCRIT : la fonction est pure et ne rend qu’une liste', () => {
    const niveaux = [niveau('structure', 'C')]
    const mesures: MesurePourLePush[] = []
    const avant = JSON.stringify({ niveaux, mesures })
    suggestionsDuPush(niveaux, mesures, CYCLE)
    assert.equal(JSON.stringify({ niveaux, mesures }), avant, 'aucune entrée n’a bougé')
  })
})

// ════════════════════════════════════════════════════════════════════════════
describe('C6-L3 · les cycles — comptés en semaines entières, jamais en jours', () => {
  test('⭐ deux lundis distants de 21 jours font 3 cycles', () => {
    assert.equal(cyclesEntre('2026-09-14', '2026-10-05'), 3)
  })

  test('⚠️ jamais négatif : une mesure « du futur » ne rend pas un compte inversé', () => {
    assert.equal(cyclesEntre('2026-10-05', '2026-09-14'), 0)
  })

  test('⚠️ une date illisible rend 0 plutôt que NaN — un NaN passerait tous les seuils', () => {
    assert.equal(cyclesEntre('pas-une-date', '2026-10-05'), 0)
  })

  test('⭐ le passage à l’heure d’hiver ne décale pas le compte', () => {
    // 2026-10-26 → 2026-11-02 traverse le changement d’heure nord-américain.
    assert.equal(cyclesEntre('2026-10-26', '2026-11-02'), 1)
  })
})
