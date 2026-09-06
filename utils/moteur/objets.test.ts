// ============================================================================
// C7 · L7 — LE ROUTEUR PAR OBJET, ÉPROUVÉ : l'ordre que la phase B reçoit.
// ----------------------------------------------------------------------------
// Ce que ces tests tiennent, et que rien d'autre ne tiendrait :
//   · la semaine 1 pose deux objets en méthode, sans borne de budget ;
//   · ensuite, la méthode entamée d'abord, UN exercice par objet ouvert, puis
//     l'objet neuf SEULEMENT si sa séquence entière tient — et la décision le dit ;
//   · entre objets ouverts, l'observable non acquis passe d'abord, puis le moins
//     mesuré ; les ex æquo partagent le rang, et c'est le tirage qui départage ;
//   · un objet tenu n'est plus posé au centre et n'apparaît qu'en sonde ;
//   · une clé sans observable, un code hors instrument, passent après ;
//   · porte fermée (pas de contexte), `candidatsPour` rend comme hier, à l'octet.
// ============================================================================
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  compterLesMesuresParObservable, contexteDesObjets, cransPortesParLaBanque, objetsNeufsParCycle,
  observablesParCompetence, ordonnerParObjet, type ContexteObjets,
} from './objets'
import { candidatsPour, type InstanceDuVivier, type InstanceRetenue } from './vivier'
import { poserLaSemaine, type ExercicePose } from '../routeur/semaine'
import type { LigneRegistre } from '../registre/reussites'
import type { Competence, Lettre } from '../routeur/types'

const CODE: Record<number, string> = {
  1: 'diagnostic_guide', 2: 'production_guidee', 3: 'transformation_guidee', 4: 'diagnostic_nomme',
  5: 'transformation_nommee', 6: 'production_etayee', 7: 'transformation_aveugle', 8: 'production_autonome', 9: 'diagnostic_fin',
}
const DUREE: Record<number, number> = { 1: 8, 2: 20, 3: 17, 4: 8, 5: 17, 7: 17, 9: 8 }

const instance = (p: Partial<InstanceDuVivier> & { cran: number }): InstanceDuVivier => ({
  objet: 'argument', grain: 'meso',
  geste: p.cran === 2 || p.cran === 6 || p.cran === 8 ? 'produire' : p.cran % 2 ? 'diagnostiquer' : 'transformer',
  cranNumero: p.cran, cranCode: CODE[p.cran]!, dureeMin: DUREE[p.cran] ?? 10, lieu: 'maison', classeId: null,
  statut: 'concu', bloque: false, genre: null, exclusionsParcours: [],
  modesParCompetence: { argumentation: ['composer'] }, couverture: { argumentation: 'isole' },
  materiaux: [], devoirs: [`dev-${p.objet ?? 'argument'}`], cle: `${p.objet ?? 'argument'}.garant.absent`,
  observable: { code: 'garant_present', competence: 'argumentation' }, coTexte: null, ...p,
  // L'identifiant dit l'objet, le cran et un suffixe : lisible dans les assertions.
  exerciceId: `${p.objet ?? 'argument'}-${p.cran}-${p.exerciceId ?? 'x'}`,
})
const retenue = (inst: InstanceDuVivier, porte: InstanceRetenue['porte'] = 'ouvert',
  methode: InstanceRetenue['methode'] = null): InstanceRetenue => ({
  instance: inst, borne: { regime: 'hors_livre', bornes: [], seanceMaxExigee: null, motif: '' },
  ciblables: ['argumentation'], plafondCibles: 1, observableSeul: [], porte,
  devoir: { ids: inst.devoirs, dernierDepotAt: null }, degrade: false, methode,
})
/** La séquence de méthode E-D d'un objet, telle que `bornerLaMethode` la rend : 1 → 3 → 2 → 4, un devoir. */
const methodeDe = (objet: string, seq = [1, 3, 2, 4]) => seq.map((cran, rang) =>
  retenue(instance({ objet, cran, devoirs: [`dev-${objet}`] }), 'methode', { objet, devoir: `dev-${objet}`, sequence: seq, rang }))
const tenu = (objet: string, cran: number): LigneRegistre => ({
  objet, cran, variante: null, reussites: 2, echecs: 0, serie: ['reussi', 'reussi'], dernierAt: '2026-09-08T10:00:00Z',
  reussitesDatees: [{ at: '2026-09-01T10:00:00Z', devoirs: [`${objet}-a`] }, { at: '2026-09-08T10:00:00Z', devoirs: [`${objet}-b`] }],
})
const BANQUE = new Map<string, number[]>([['argument', [1, 2, 3, 4, 5, 7, 9]], ['objection', [1, 2, 3, 4, 5, 7, 9]],
  ['exemple', [1, 2, 3, 4, 5, 7, 9]], ['phrase', [1, 3, 4, 5, 7, 9]]])
const OBS = new Map<Competence, { acquis: Set<string>; connus: Set<string> }>([
  ['argumentation', { acquis: new Set(['lien_explicite']), connus: new Set(['garant_present', 'lien_explicite', 'preuve_presente']) }],
])
const ctx = (p: Partial<Parameters<typeof contexteDesObjets>[0]> = {}): ContexteObjets => contexteDesObjets({
  registre: [], dejaServis: new Set(), paliers: new Map<Competence, Lettre>([['argumentation', 'D']]),
  cransParObjet: BANQUE, observables: OBS, mesuresParCode: new Map(), plafond: 60, situation: 'tc_seul', ...p,
})
const pose = (r: InstanceRetenue, tour = 0): ExercicePose => ({
  candidat: { exerciceId: r.instance.exerciceId, competence: 'argumentation', grain: r.instance.grain, geste: r.instance.geste,
    cran: r.instance.cranCode ?? '', mode: 'composer', dureeMin: r.instance.dureeMin ?? 0, ciblesSecondaires: [] },
  regle: 'R2', departageParPB3: false, tirage: false, tour,
})
const ordre = (vivier: InstanceRetenue[], c: ContexteObjets, dejaPoses: ExercicePose[] = []) =>
  ordonnerParObjet(candidatsPour(vivier, 'argumentation', dejaPoses), vivier, 'argumentation', dejaPoses, c)
    .sort((a, b) => a.ordre!.rang - b.ordre!.rang)

describe('règle 3 — la première semaine : deux objets en méthode pour tous, sans borne de budget', () => {
  it('semaine 1 ⇒ deux objets neufs ; ensuite un par cycle en TC, deux en HLP et en bi-classe', () => {
    assert.equal(objetsNeufsParCycle(ctx()), 2)
    assert.equal(objetsNeufsParCycle(ctx({ dejaServis: new Set(['phrase']) })), 1)
    assert.equal(objetsNeufsParCycle(ctx({ dejaServis: new Set(['phrase']), situation: 'hlp_seul' })), 2)
    assert.equal(objetsNeufsParCycle(ctx({ dejaServis: new Set(['phrase']), situation: 'bi_classe' })), 2)
  })

  it('les deux séquences sortent entières, dans l’ordre de la méthode puis de la séquence — même si elles pèsent plus que le plafond', () => {
    const vivier = [...methodeDe('argument'), ...methodeDe('objection')]
    const c = ctx()
    const o = ordre(vivier, c)
    assert.deepEqual(o.map((x) => x.exerciceId), ['argument-1-x', 'argument-3-x', 'argument-2-x', 'argument-4-x',
      'objection-1-x', 'objection-3-x', 'objection-2-x', 'objection-4-x'])
    assert.ok(o.every((x) => /première semaine/.test(x.ordre!.motif)))
    assert.equal(c.journal.ecartes.size, 0)
  })
})

describe('règle 3 — ensuite : la méthode entamée, un exercice par objet ouvert, l’objet neuf si le budget le permet', () => {
  const ouvert = (objet: string, crans = [1, 3, 4]) => crans.map((cran) => retenue(instance({ objet, cran, exerciceId: 'o' })))

  it('un objet ouvert reçoit UN exercice, sur le cran non tenu le plus bas ; les autres crans ne sortent pas', () => {
    // Le 1 est tenu ; la bande d'E-D est 1·2·3·4·5 ; la banque n'a pas le 2 ici (production) → le 3.
    const c = ctx({ dejaServis: new Set(['argument']), registre: [tenu('argument', 1)],
      cransParObjet: new Map([['argument', [1, 3, 4, 5, 7, 9]]]) })
    const o = ordre(ouvert('argument', [1, 3, 4]), c)
    assert.deepEqual(o.map((x) => x.exerciceId), ['argument-3-o'])
    assert.match(o[0]!.ordre!.motif, /NON ACQUIS/)
    // Avec le 2 en banque (bac à sable), c'est le 2 qu'il faut — et rien d'autre ne sort.
    const avec2 = ctx({ dejaServis: new Set(['argument']), registre: [tenu('argument', 1)] })
    assert.deepEqual(ordre(ouvert('argument', [1, 3, 4]), avec2), [])
    assert.deepEqual(ordre(ouvert('argument', [1, 2, 3, 4]), avec2).map((x) => x.exerciceId), ['argument-2-o'])
  })

  it('« un par cycle » : l’objet déjà servi ce cycle n’en reçoit pas un second — PB5 et pull compris', () => {
    const vivier = ouvert('argument', [3, 4])
    const c = ctx({ dejaServis: new Set(['argument']), registre: [tenu('argument', 1)] })
    const o = ordre(vivier, c, [pose(vivier[0]!)])
    assert.deepEqual(o, [])
    const e = [...c.journal.ecartes.values()].find((x) => x.motif === 'objet_un_par_cycle')
    assert.ok(e && /déjà son exercice ce cycle/.test(e.detail))
  })

  it('l’objet neuf entre en méthode si sa séquence ENTIÈRE tient après les objets ouverts ; sinon il attend, et la décision le dit', () => {
    // 53 min de séquence (8 + 17 + 20 + 8), 8 min déjà posées sur l'objet ouvert, plafond 60 : n'entre pas.
    const vivier = [...ouvert('argument', [1]), ...methodeDe('objection')]
    const c = ctx({ dejaServis: new Set(['argument']) })
    const o = ordre(vivier, c, [pose(vivier[0]!)])
    assert.deepEqual(o, [])
    const e = [...c.journal.ecartes.values()].find((x) => x.motif === 'objet_entree_hors_budget')!
    assert.match(e.detail, /sa séquence pèse 53 min, 8 min sont posées, le plafond est de 60 min/)
    // Plafond de 90 (HLP) : elle tient, l'objet entre, sa séquence en ordre.
    const large = ctx({ dejaServis: new Set(['argument']), plafond: 90, situation: 'hlp_seul' })
    const o2 = ordre(vivier, large, [pose(vivier[0]!)])
    assert.deepEqual(o2.map((x) => x.exerciceId), ['objection-1-x', 'objection-3-x', 'objection-2-x', 'objection-4-x'])
    assert.match(o2[0]!.ordre!.motif, /tient sous le plafond après les objets ouverts/)
  })

  it('la méthode ENTAMÉE passe avant les objets ouverts, et réserve ce qui lui reste', () => {
    const vivier = [...ouvert('argument', [1]), ...methodeDe('objection'), ...methodeDe('exemple')]
    const c = ctx({ dejaServis: new Set(['argument']), plafond: 120, situation: 'bi_classe' })
    // La paire d'objection est posée : le reste de sa séquence (45 min) est réservé.
    const deja = [pose(vivier[1]!)]
    const o = ordre(vivier, c, deja)
    // Toute la séquence entamée d'abord, dans son ordre ; l'objet ouvert ensuite.
    assert.deepEqual(o.slice(0, 4).map((x) => x.exerciceId), ['objection-3-x', 'objection-2-x', 'objection-4-x', 'argument-1-o'])
    assert.ok(o[0]!.ordre!.rang < 1_000_000, 'la méthode entamée est au rang 0, devant les ouverts')
    assert.match(o[0]!.ordre!.motif, /entamée/)
    // L'exemple (53 min) n'entre pas : 8 posées + 45 réservées + 53 > 120 - non, 106 ≤ 120 : il entre.
    assert.ok(o.some((x) => x.exerciceId === 'exemple-1-x'))
    const serre = ctx({ dejaServis: new Set(['argument']), plafond: 100, situation: 'bi_classe' })
    const o2 = ordre(vivier, serre, deja)
    assert.ok(!o2.some((x) => x.exerciceId.startsWith('exemple')))
    assert.match([...serre.journal.ecartes.values()].find((x) => x.objet === 'exemple')!.detail, /45 min réservées/)
  })
})

describe('règle 4 — entre objets ouverts : l’observable non acquis, puis le moins mesuré, puis le tirage', () => {
  const deux = () => [
    retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a', observable: { code: 'lien_explicite', competence: 'argumentation' } })),
    retenue(instance({ objet: 'objection', cran: 1, exerciceId: 'b', observable: { code: 'garant_present', competence: 'argumentation' } })),
  ]

  it('celui dont l’observable est NON ACQUIS passe d’abord, motif journalisé', () => {
    const c = ctx({ dejaServis: new Set(['argument', 'objection']),
      mesuresParCode: new Map([['argumentation|garant_present', 5], ['argumentation|lien_explicite', 1]]) })
    const o = ordre(deux(), c)
    // `lien_explicite` est acquis, `garant_present` ne l'est pas : l'objection d'abord, malgré ses 5 mesures.
    assert.deepEqual(o.map((x) => x.exerciceId), ['objection-1-b', 'argument-1-a'])
    assert.match(o[0]!.ordre!.motif, /« garant_present » \(argumentation\) NON ACQUIS/)
    assert.match(o[1]!.ordre!.motif, /acquis sur la fenêtre/)
    assert.ok(o[0]!.ordre!.rang < o[1]!.ordre!.rang)
  })

  it('à statut égal, le MOINS MESURÉ d’abord (R5 au grain de l’observable)', () => {
    const vivier = [
      retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a', observable: { code: 'garant_present', competence: 'argumentation' } })),
      retenue(instance({ objet: 'objection', cran: 1, exerciceId: 'b', observable: { code: 'preuve_presente', competence: 'argumentation' } })),
    ]
    const c = ctx({ dejaServis: new Set(['argument', 'objection']),
      mesuresParCode: new Map([['argumentation|garant_present', 4], ['argumentation|preuve_presente', 2]]) })
    const o = ordre(vivier, c)
    assert.deepEqual(o.map((x) => x.exerciceId), ['objection-1-b', 'argument-1-a'])
    assert.match(o[0]!.ordre!.motif, /2 mesure\(s\)/)
  })

  it('les ex æquo partagent le rang — c’est le tirage journalisé de la phase B qui départage, pas le grain', () => {
    const vivier = [
      retenue(instance({ objet: 'phrase', cran: 1, exerciceId: 'p', grain: 'micro' })),
      retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a' })),
    ]
    const c = ctx({ dejaServis: new Set(['argument', 'phrase']) })
    const o = ordre(vivier, c)
    assert.equal(o[0]!.ordre!.rang, o[1]!.ordre!.rang)
    // La phase B : sans `ordre`, PB1 prendrait la phrase (micro) ; avec, le tirage choisit — ici le dernier.
    const tires: string[][] = []
    const semaine = poserLaSemaine([{ competence: 'argumentation', regle: 'R2', motif: '' }], { plancher: 5, plafond: 8, optionnel: 0 },
      (comp, poses) => candidatsPour(vivier, comp, poses, false, c), (ex) => { tires.push([...ex]); return ex[ex.length - 1]! })
    assert.equal(semaine.exercices.length, 1)
    assert.equal(semaine.exercices[0]!.tirage, true)
    assert.deepEqual(tires, [['phrase-1-p', 'argument-1-a']])
    assert.equal(semaine.exercices[0]!.candidat.exerciceId, 'argument-1-a')
  })

  it('une clé sans observable passe APRÈS, motif dit ; un code hors instrument se compte à part', () => {
    const vivier = [
      retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a', observable: null, cle: 'argument.garant.trop_large' })),
      retenue(instance({ objet: 'objection', cran: 1, exerciceId: 'b', observable: { code: 'code_inconnu', competence: 'argumentation' } })),
      retenue(instance({ objet: 'exemple', cran: 1, exerciceId: 'c', observable: { code: 'lien_explicite', competence: 'argumentation' } })),
    ]
    const c = ctx({ dejaServis: new Set(['argument', 'objection', 'exemple']) })
    const o = ordre(vivier, c)
    assert.deepEqual(o.map((x) => x.exerciceId), ['exemple-1-c', 'objection-1-b', 'argument-1-a'])
    assert.match(o[1]!.ordre!.motif, /absent de l'instrument/)
    assert.match(o[2]!.ordre!.motif, /sans observable/)
    assert.deepEqual([...c.journal.horsInstrument.get('argumentation')!], ['code_inconnu'])
    const sansCle = ordre([retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'z', observable: null, cle: null }))],
      ctx({ dejaServis: new Set(['argument']) }))
    assert.match(sansCle[0]!.ordre!.motif, /sans clé/)
  })
})

describe('règle 5 — tenu, l’objet sort du centre et ne revient qu’en sonde', () => {
  it('ses crans de la bande sont écartés `objet_tenu` ; un cran au-dessus passe, en sonde, après les ouverts', () => {
    const registre = [1, 2, 3, 4, 5].map((c) => tenu('argument', c))
    const vivier = [
      retenue(instance({ objet: 'argument', cran: 4, exerciceId: 't' })),
      retenue(instance({ objet: 'argument', cran: 7, exerciceId: 's' })),
      retenue(instance({ objet: 'objection', cran: 1, exerciceId: 'o' })),
    ]
    const c = ctx({ dejaServis: new Set(['argument', 'objection']), registre })
    const o = ordre(vivier, c)
    assert.deepEqual(o.map((x) => x.exerciceId), ['objection-1-o', 'argument-7-s'])
    assert.match(o[1]!.ordre!.motif, /sonde de montée/)
    const e = [...c.journal.ecartes.values()].find((x) => x.motif === 'objet_tenu')!
    assert.match(e.detail, /tenu au palier D/)
  })

  it('un objet ouvert dont aucun cran retenu n’est le cran à servir se dit `objet_sans_cran_ouvert`', () => {
    const vivier = [retenue(instance({ objet: 'argument', cran: 5, exerciceId: 'h' }))]
    const c = ctx({ dejaServis: new Set(['argument']), registre: [tenu('argument', 1)] })
    assert.deepEqual(ordre(vivier, c), [])
    const e = [...c.journal.ecartes.values()].find((x) => x.motif === 'objet_sans_cran_ouvert')!
    assert.match(e.detail, /ouvert au cran 2, mais aucune instance retenue ne le porte/)
  })

  it('la sonde que le registre demande passe avant le cran à servir (piège 13)', () => {
    const vivier = [
      retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'bas' })),
      retenue(instance({ objet: 'argument', cran: 4, exerciceId: 'sonde' }), 'sonde'),
    ]
    const c = ctx({ dejaServis: new Set(['argument']) })
    const o = ordre(vivier, c)
    assert.deepEqual(o.map((x) => x.exerciceId), ['argument-4-sonde', 'argument-1-bas'])
  })
})

describe('les lectures pures qui alimentent le contexte', () => {
  it('la banque porte ses crans par objet — statut servable, non bloqué, maison', () => {
    const m = cransPortesParLaBanque([
      instance({ objet: 'argument', cran: 1 }), instance({ objet: 'argument', cran: 4 }),
      instance({ objet: 'argument', cran: 2, statut: 'a_concevoir' }), instance({ objet: 'argument', cran: 5, bloque: true }),
      instance({ objet: 'phrase', cran: 3, lieu: 'classe' }),
    ])
    assert.deepEqual(m.get('argument'), [1, 4])
    assert.equal(m.has('phrase'), false)
    assert.deepEqual(cransPortesParLaBanque([instance({ objet: 'argument', cran: 2, statut: 'a_concevoir' })], ['a_concevoir']).get('argument'), [2])
  })

  it('« le moins mesuré » compte les mesures qui portent une VALEUR — `n/a` sort, les sondes de montée entrent', () => {
    const m = compterLesMesuresParObservable([
      { competence: 'argumentation', observables: { garant_present: 1, lien_explicite: 'n/a' } },
      { competence: 'argumentation', observables: { garant_present: 0 } },
      { competence: 'structure', observables: { garant_present: 1 } },
      { competence: 'argumentation', observables: null },
    ])
    assert.equal(m.get('argumentation|garant_present'), 2)
    assert.equal(m.get('argumentation|lien_explicite'), undefined)
    assert.equal(m.get('structure|garant_present'), 1)
  })

  it('les observables par compétence : acquis et connus, depuis ce que l’instrument rend', () => {
    const o = observablesParCompetence(['argumentation', 'structure'], (c) => c === 'argumentation'
      ? [{ code: 'a', acquis: true }, { code: 'b', acquis: false }] : null)
    assert.deepEqual([...o.get('argumentation')!.acquis], ['a'])
    assert.deepEqual([...o.get('argumentation')!.connus], ['a', 'b'])
    assert.equal(o.has('structure'), false)
  })
})

describe('⛔ porte fermée : `candidatsPour` et la phase B servent comme hier, à l’octet', () => {
  it('sans contexte, aucun candidat ne porte d’ordre, et PB1 choisit le plus petit grain', () => {
    const vivier = [
      retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a' })),
      retenue(instance({ objet: 'phrase', cran: 1, exerciceId: 'p', grain: 'micro' })),
    ]
    const sans = candidatsPour(vivier, 'argumentation', [])
    assert.ok(sans.every((c) => c.ordre === undefined))
    const semaine = poserLaSemaine([{ competence: 'argumentation', regle: 'R2', motif: '' }], { plancher: 5, plafond: 8, optionnel: 0 },
      (comp, poses) => candidatsPour(vivier, comp, poses))
    assert.equal(semaine.exercices[0]!.candidat.exerciceId, 'phrase-1-p')
    assert.equal(semaine.exercices[0]!.tirage, false)
  })
})

describe('⭐ Louis, 06/09 nuit — PB2 lit l\'OBSERVABLE sous le gabarit ; le cran sous la bande que le registre exige passe', () => {
  const liste = [{ competence: 'argumentation' as const, regle: 'R2' as const, motif: '', crans: ['diagnostic_nomme', 'transformation_nommee', 'production_etayee', 'transformation_aveugle', 'production_autonome'] }]

  it('deux exercices de suite de la même compétence passent quand leurs observables diffèrent ; le même observable, non', () => {
    const vivier = [
      retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a', observable: { code: 'garant_present', competence: 'argumentation' } })),
      retenue(instance({ objet: 'objection', cran: 1, exerciceId: 'b', observable: { code: 'objection_traitee', competence: 'argumentation' } })),
      retenue(instance({ objet: 'exemple', cran: 1, exerciceId: 'c', observable: { code: 'garant_present', competence: 'argumentation' } })),
    ]
    const c = ctx({ dejaServis: new Set(['argument', 'objection', 'exemple']), paliers: new Map<Competence, Lettre>([['argumentation', 'D']]) })
    const deux = [{ competence: 'argumentation' as const, regle: 'R2' as const, motif: '' }, { competence: 'structure' as const, regle: 'R5' as const, motif: '' }]
    const s = poserLaSemaine(deux, { plancher: 5, plafond: 60, optionnel: 0 },
      (comp, poses) => candidatsPour(vivier, comp, poses, false, c), (ex) => ex[0]!, undefined, { pb2: 'observable' })
    const codes = s.exercices.map((e) => e.candidat.observable)
    assert.equal(s.exercices.length, 3)
    for (let i = 1; i < codes.length; i++) assert.notEqual(codes[i], codes[i - 1], 'jamais deux fois de suite le même observable')
    // Hier, à l'octet : la même compétence deux fois de suite est interdite.
    const hier = poserLaSemaine(deux, { plancher: 5, plafond: 60, optionnel: 0 }, (comp, poses) => candidatsPour(vivier, comp, poses, false, c), (ex) => ex[0]!)
    assert.equal(hier.exercices.length, 1, 'sans l\'option, PB2 sur la compétence bloque le second')
  })

  it('à C, le cran 1 exigé par le registre passe la bande dure (`rattrapage`) ; sans `ordre`, il ne passe pas', () => {
    const vivier = [retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a' }))]
    const c = ctx({ dejaServis: new Set(['argument']), paliers: new Map<Competence, Lettre>([['argumentation', 'C']]),
      cransParObjet: new Map([['argument', [1, 3, 4, 5, 7, 9]]]) })
    const avec = poserLaSemaine(liste, { plancher: 5, plafond: 60, optionnel: 0 }, (comp, poses) => candidatsPour(vivier, comp, poses, false, c), (ex) => ex[0]!, undefined, { pb2: 'observable' })
    assert.equal(avec.exercices.length, 1)
    assert.equal(avec.exercices[0]!.candidat.ordre?.rattrapage, true)
    assert.match(avec.exercices[0]!.candidat.ordre!.motif, /NON ACQUIS|acquis/)
    const sans = poserLaSemaine(liste, { plancher: 5, plafond: 60, optionnel: 0 }, (comp, poses) => candidatsPour(vivier, comp, poses, false), (ex) => ex[0]!)
    assert.equal(sans.exercices.length, 0, 'porte fermée : la bande dure de C écarte le 1, comme hier')
    // Et la méthode C-B (1 → 3 → 2) passe aussi, marquée rattrapage.
    const meth = methodeDe('objection', [1, 3, 2]).map((r) => ({ ...r, methode: { ...r.methode!, sequence: [1, 3, 2] } }))
    const cm = ctx({ paliers: new Map<Competence, Lettre>([['argumentation', 'C']]) })
    const o = ordonnerParObjet(candidatsPour(meth, 'argumentation', []), meth, 'argumentation', [], cm)
    assert.ok(o.length === 3 && o.every((x) => x.ordre!.rattrapage === true && x.ordre!.methode === true))
  })

  it('⛔ la méthode est l\'exception à PB2 (Louis, 07/09) : la séquence d\'un objet s\'enchaîne seule, même observable aux trois crans', () => {
    // Tous les exercices d'une même clé portent le même observable : sans l'exception, le 3 attendrait un autre objet.
    const meth = methodeDe('objection', [1, 3, 2]).map((r) => ({ ...r, methode: { ...r.methode!, sequence: [1, 3, 2] } }))
    const cm = ctx({ paliers: new Map<Competence, Lettre>([['argumentation', 'C']]) })
    const s = poserLaSemaine(liste, { plancher: 5, plafond: 60, optionnel: 0 },
      (comp, poses) => candidatsPour(meth, comp, poses, false, cm), (ex) => ex[0]!, undefined, { pb2: 'observable' })
    assert.deepEqual(s.exercices.map((e) => e.candidat.exerciceId), ['objection-1-x', 'objection-3-x', 'objection-2-x'])
    assert.ok(s.exercices.every((e) => e.candidat.observable === 'garant_present'))
    // Un objet OUVERT, lui, reste sous PB2 : deux fois de suite le même observable, non.
    const ouverts = [retenue(instance({ objet: 'argument', cran: 1, exerciceId: 'a' })), retenue(instance({ objet: 'exemple', cran: 1, exerciceId: 'c' }))]
    const co = ctx({ dejaServis: new Set(['argument', 'exemple']) })
    const s2 = poserLaSemaine([{ competence: 'argumentation', regle: 'R2', motif: '' }, { competence: 'structure', regle: 'R5', motif: '' }],
      { plancher: 5, plafond: 60, optionnel: 0 }, (comp, poses) => candidatsPour(ouverts, comp, poses, false, co), (ex) => ex[0]!, undefined, { pb2: 'observable' })
    assert.equal(s2.exercices.length, 1)
  })
})
