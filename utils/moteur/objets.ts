// ============================================================================
// C7 · L7 — LE ROUTEUR PAR OBJET : L'ORDRE QUE LA PHASE B REÇOIT. Module PUR.
// ----------------------------------------------------------------------------
// « La couche 2 élit la compétence ; la couche 3 élit l'objet, le cran, puis
//   l'observable, et la couche 4 le devoir » (`01-` v5.11 §4, couche 3, les six
//   règles du 06/09). Ce module donne au routeur l'unité qu'il n'avait pas —
//   L'OBJET — sans écrire une seconde phase B : il ORDONNE et il ÉCARTE ce que
//   `candidatsPour` rend, et `poserLaSemaine` pose comme hier, PB2 à PB6 compris.
//
//   RÈGLE 3 — la phase B pose dans cet ordre, et le budget borne l'entrée :
//     (i)   la méthode ENTAMÉE, sa séquence entière (rang 0) ;
//     (ii)  UN exercice par objet OUVERT, dans l'ordre de la règle 4 (rang 1) ;
//     (iii) un objet NEUF n'entre en méthode que si sa séquence entière tient
//           sous le plafond après (i) et (ii) (rang 2) — « une méthode à moitié
//           posée n'est pas une entrée » (piège 9). ⭐ La première semaine — aucun
//           objet servi sous le gabarit —, deux objets pour tous, sans borne.
//     (iv)  les sondes des objets TENUS, au-dessus de leur bande (rang 3).
//   RÈGLE 4 — entre objets ouverts, puis entre clés d'un objet : l'observable
//     NON ACQUIS (fenêtre d'évidence), puis LE MOINS MESURÉ (R5 au grain de
//     l'observable), puis le tirage — que `poserLaSemaine` journalise déjà.
//   RÈGLE 5 — tenu, l'objet sort du centre ; ses crans au-dessus restent des sondes.
//   RÈGLE 2 — « un exercice par cycle » borne LA POSE, PB5 et pull compris.
//
// ⚠️ « Le moins mesuré » : le nombre de mesures de l'élève dont
//    `observables[code]` porte une valeur — `n/a` n'est jamais 0, il sort du
//    compte. Arbitrage de fabrication (piège 21) : les sondes de montée COMPTENT
//    ici — elles mesurent l'observable ; M-e ne les neutralise que pour la
//    fenêtre et la stagnation, et R5 « se compte sur TOUS les exercices ».
// ⚠️ Un code de la grille ABSENT de l'instrument est un code que la chaîne ne
//    mesure pas (piège 19) : « le moins mesuré » y vaudrait 0 pour toujours. Il
//    se compte à part, se journalise, et passe après ceux que l'instrument porte.
// ⚠️ Une clé SANS observable (19 sur 205) n'a rien à élire : elle passe après,
//    motif journalisé. Une instance sans clé (banque 1.4) passe de même.
//
// Ce fichier ne lit rien : le registre, les paliers, les mesures et l'instrument
// lui sont donnés, déjà lus, par `composerPourUnEleve`.
// ============================================================================

import type { Candidat, ExercicePose } from '../routeur/semaine'
import type { Competence, Lettre } from '../routeur/types'
import type { Situation } from '../routeur/config'
import type { Mesure } from '../routeur/mesure'
import type { LigneRegistre } from '../registre/reussites'
import { etatDeLObjet, type VieDeLObjet } from '../registre/objet'
import type { InstanceDuVivier, InstanceRetenue, MotifDEcart } from './vivier'

// ════════════════════════════════════════════════════════════════════════════
// CE QUE LE CONTEXTE PORTE
// ════════════════════════════════════════════════════════════════════════════

/** Ce que la fenêtre d'évidence dit des observables d'une compétence. */
export interface ObservablesDUneCompetence {
  /** Les codes ACQUIS sur la fenêtre (`estAcquis` : taux strictement > 2/3). */
  acquis: ReadonlySet<string>
  /** Les codes que l'INSTRUMENT déclare — hors de là, la chaîne ne mesure pas. */
  connus: ReadonlySet<string>
}

export type RegleDElection =
  | 'methode' | 'non_acquis' | 'moins_mesure' | 'hors_instrument' | 'sans_observable' | 'sonde'

export interface ElectionDObservable {
  objet: string
  code: string | null
  competence: string | null
  regle: RegleDElection
  /** Le nombre de mesures de l'élève qui portent ce code — `null` sans code. */
  mesures: number | null
  motif: string
}

export interface EcartDObjet { objet: string; competence: Competence; motif: MotifDEcart; detail: string }

export interface ContexteObjets {
  registre: readonly LigneRegistre[]
  /** Les objets servis à l'élève AVANT ce cycle, sous le gabarit. */
  dejaServis: ReadonlySet<string>
  paliers: ReadonlyMap<Competence, Lettre>
  /** Les crans que la banque porte, par objet (piège 4). */
  cransParObjet: ReadonlyMap<string, readonly number[]>
  observables: ReadonlyMap<Competence, ObservablesDUneCompetence>
  /** `${competence}|${code}` → nombre de mesures de l'élève qui portent le code. */
  mesuresParCode: ReadonlyMap<string, number>
  plafond: number
  situation: Situation | null
  /** « La première semaine » : aucun objet déjà servi sous le gabarit — deux objets pour tous. */
  semaine1: boolean
  /** La vie de chaque (objet × compétence cible), mémorisée. */
  vies: Map<string, VieDeLObjet>
  /** Ce que la pose a écarté et élu — pour le journal de la décision. */
  journal: {
    ecartes: Map<string, EcartDObjet>
    elections: Map<string, ElectionDObservable>
    /** Par compétence, les codes de la grille que l'instrument ne porte pas. */
    horsInstrument: Map<string, Set<string>>
  }
}

/** « Deux objets la première semaine pour tous ; ensuite un par cycle en TC, deux en HLP et en bi-classe. » */
export const OBJETS_NEUFS_SEMAINE_1 = 2
export function objetsNeufsParCycle(ctx: Pick<ContexteObjets, 'semaine1' | 'situation'>): number {
  if (ctx.semaine1) return OBJETS_NEUFS_SEMAINE_1
  return ctx.situation === 'tc_seul' ? 1 : 2
}

/** Le vivier n'est pas la banque : la bande se compte sur ce que la banque PORTE pour l'objet. */
export function cransPortesParLaBanque(
  instances: readonly Pick<InstanceDuVivier, 'objet' | 'cranNumero' | 'statut' | 'bloque' | 'lieu'>[],
  servables: readonly string[] = ['concu', 'assigne'],
): Map<string, number[]> {
  const out = new Map<string, Set<number>>()
  for (const i of instances) {
    if (i.cranNumero === null || i.bloque || i.lieu === 'classe' || !servables.includes(i.statut)) continue
    out.set(i.objet, (out.get(i.objet) ?? new Set()).add(i.cranNumero))
  }
  return new Map([...out].map(([o, s]) => [o, [...s].sort((a, b) => a - b)]))
}

/**
 * « Le moins mesuré » — R5 lu au grain de l'observable : combien de mesures de
 * l'élève portent une VALEUR pour ce code. `n/a` sort du compte ; les sondes de
 * montée y entrent (arbitrage, piège 21).
 */
export function compterLesMesuresParObservable(
  mesures: readonly Pick<Mesure, 'competence' | 'observables'>[],
): Map<string, number> {
  const out = new Map<string, number>()
  for (const m of mesures) {
    for (const [code, v] of Object.entries(m.observables ?? {})) {
      if (v === undefined || v === null || v === 'n/a') continue
      const k = `${m.competence}|${code}`
      out.set(k, (out.get(k) ?? 0) + 1)
    }
  }
  return out
}

export function contexteDesObjets(p: {
  registre: readonly LigneRegistre[]
  dejaServis: ReadonlySet<string>
  paliers: ReadonlyMap<Competence, Lettre>
  cransParObjet: ReadonlyMap<string, readonly number[]>
  observables: ReadonlyMap<Competence, ObservablesDUneCompetence>
  mesuresParCode: ReadonlyMap<string, number>
  plafond: number
  situation: Situation | null
}): ContexteObjets {
  return {
    ...p,
    semaine1: p.dejaServis.size === 0,
    vies: new Map(),
    journal: { ecartes: new Map(), elections: new Map(), horsInstrument: new Map() },
  }
}

/** La vie d'un objet au palier d'une compétence cible — calculée à la demande, mémorisée. */
export function vieDeLObjet(ctx: ContexteObjets, objet: string, competence: Competence): VieDeLObjet {
  const k = `${objet}|${competence}`
  const deja = ctx.vies.get(k)
  if (deja) return deja
  const v = etatDeLObjet(ctx.registre, objet, ctx.dejaServis.has(objet), ctx.paliers.get(competence) ?? null,
    ctx.cransParObjet.get(objet) ?? [])
  ctx.vies.set(k, v)
  return v
}

// ════════════════════════════════════════════════════════════════════════════
// L'ORDRE — ce que `candidatsPour` rend à la phase B, sous le gabarit
// ════════════════════════════════════════════════════════════════════════════

const RANG = { methodeEntamee: 0, ouvert: 1_000_000, neuf: 2_000_000, sondeTenu: 3_000_000 } as const

/** Le score de la règle 4 pour une instance : [palier de l'observable, mesures]. Plus petit d'abord. */
function scoreDeLObservable(
  r: InstanceRetenue, competence: Competence, ctx: ContexteObjets,
): { palier: 0 | 1 | 2 | 3; mesures: number | null; election: ElectionDObservable } {
  const objet = r.instance.objet
  const obs = r.instance.observable ?? null
  if (!obs) {
    return { palier: 3, mesures: null, election: { objet, code: null, competence: null, regle: 'sans_observable', mesures: null,
      motif: r.instance.cle ? `clé « ${r.instance.cle} » sans observable : rien à élire, classée après.`
        : 'instance sans clé (banque d\'avant le gabarit) : rien à élire, classée après.' } }
  }
  const comp = (obs.competence || competence) as Competence
  const etat = ctx.observables.get(comp)
  const mesures = ctx.mesuresParCode.get(`${comp}|${obs.code}`) ?? 0
  if (etat && !etat.connus.has(obs.code)) {
    ctx.journal.horsInstrument.set(comp, (ctx.journal.horsInstrument.get(comp) ?? new Set()).add(obs.code))
    return { palier: 2, mesures, election: { objet, code: obs.code, competence: comp, regle: 'hors_instrument', mesures,
      motif: `observable « ${obs.code} » (${comp}) absent de l'instrument : la chaîne ne le mesure pas — compté à part.` } }
  }
  const acquis = etat?.acquis.has(obs.code) ?? false
  return acquis
    ? { palier: 1, mesures, election: { objet, code: obs.code, competence: comp, regle: 'moins_mesure', mesures,
      motif: `observable « ${obs.code} » (${comp}) acquis sur la fenêtre d'évidence ; ${mesures} mesure(s).` } }
    : { palier: 0, mesures, election: { objet, code: obs.code, competence: comp, regle: 'non_acquis', mesures,
      motif: `observable « ${obs.code} » (${comp}) NON ACQUIS sur la fenêtre d'évidence ; ${mesures} mesure(s).` } }
}

/**
 * L'ordre par objet (`01-` v5.11 §4, couche 3). Reçoit les candidats d'UNE
 * compétence tels que `candidatsPour` les a construits, et rend ceux que la règle
 * laisse, chacun avec son `ordre`. Ce qu'elle écarte se journalise par objet.
 */
export function ordonnerParObjet(
  candidats: readonly Candidat[],
  vivier: readonly InstanceRetenue[],
  competence: Competence,
  dejaPoses: readonly ExercicePose[],
  ctx: ContexteObjets,
): Candidat[] {
  const retenueDe = new Map(vivier.map((r) => [r.instance.exerciceId, r]))
  const ecarter = (objet: string, motif: MotifDEcart, detail: string) =>
    ctx.journal.ecartes.set(`${objet}|${competence}|${motif}`, { objet, competence, motif, detail })

  // Ce que la pose a déjà donné, par objet — tous crans et toutes compétences confondus.
  const posesParObjet = new Map<string, number>()
  const consommes = new Set<string>()
  let minutes = 0
  for (const p of dejaPoses) {
    consommes.add(p.candidat.exerciceId)
    minutes += p.candidat.dureeMin
    const o = retenueDe.get(p.candidat.exerciceId)?.instance.objet ?? p.candidat.ordre?.objet ?? null
    if (o) posesParObjet.set(o, (posesParObjet.get(o) ?? 0) + 1)
  }

  // La méthode : les objets que `bornerLaMethode` a gardés, dans son ordre, et
  // la séquence de chacun — ses minutes, et ce qu'il en reste à poser.
  const enMethode = vivier.filter((r) => r.porte === 'methode')
  const ordreMethode: string[] = []
  for (const r of enMethode) if (!ordreMethode.includes(r.instance.objet)) ordreMethode.push(r.instance.objet)
  const sequenceMinutes = (objet: string) => enMethode.filter((r) => r.instance.objet === objet)
    .reduce((n, r) => n + (r.instance.dureeMin ?? 0), 0)
  const resteAPoser = (objet: string) => enMethode
    .filter((r) => r.instance.objet === objet && !consommes.has(r.instance.exerciceId))
    .reduce((n, r) => n + (r.instance.dureeMin ?? 0), 0)
  const reserves = ordreMethode.filter((o) => posesParObjet.has(o)).reduce((n, o) => n + resteAPoser(o), 0)

  type Classe = { c: Candidat; r: InstanceRetenue; groupe: number; objetScore: [number, number]; sous: number
    score: [number, number]; election: ElectionDObservable }
  const classes: Classe[] = []
  const eligiblesParObjet = new Map<string, boolean>()

  for (const c of candidats) {
    const r = retenueDe.get(c.exerciceId)
    if (!r) continue
    const objet = r.instance.objet
    const cran = r.instance.cranNumero ?? 0

    // (i) et (iii) — LA MÉTHODE.
    if (r.porte === 'methode') {
      const rang = r.methode?.rang ?? 0
      if (posesParObjet.has(objet)) {
        classes.push({ c, r, groupe: RANG.methodeEntamee, objetScore: [0, 0], sous: rang, score: [0, 0],
          election: { objet, code: r.instance.observable?.code ?? null, competence: r.instance.observable?.competence ?? null,
            regle: 'methode', mesures: null, motif: `méthode sur « ${objet} », entamée : rang ${rang} de la séquence.` } })
        continue
      }
      const seq = sequenceMinutes(objet)
      if (!ctx.semaine1 && minutes + reserves + seq > ctx.plafond) {
        ecarter(objet, 'objet_entree_hors_budget',
          `« ${objet} » n'entre pas en méthode ce cycle : sa séquence pèse ${seq} min, `
          + `${minutes} min sont posées${reserves ? ` et ${reserves} min réservées aux méthodes entamées` : ''}, `
          + `le plafond est de ${ctx.plafond} min (\`01-\` §4, règle 3). Il attend le cycle suivant.`)
        continue
      }
      classes.push({ c, r, groupe: RANG.neuf, objetScore: [ordreMethode.indexOf(objet), 0], sous: rang, score: [0, 0],
        election: { objet, code: r.instance.observable?.code ?? null, competence: r.instance.observable?.competence ?? null,
          regle: 'methode', mesures: null, motif: ctx.semaine1
            ? `méthode sur « ${objet} » — la première semaine, deux objets pour tous.`
            : `« ${objet} » entre en méthode : sa séquence (${seq} min) tient sous le plafond après les objets ouverts.` } })
      continue
    }

    // (ii) et (iv) — L'OBJET OUVERT, OU TENU.
    const vie = vieDeLObjet(ctx, objet, competence)
    if (vie.etat === 'tenu' && vie.bande.includes(cran)) {
      ecarter(objet, 'objet_tenu', vie.motif)
      continue
    }
    if (posesParObjet.has(objet)) {
      ecarter(objet, 'objet_un_par_cycle',
        `« ${objet} » a déjà son exercice ce cycle : un par objet ouvert et par cycle (\`01-\` §4, règle 2).`)
      continue
    }
    // Le cran : la sonde que le registre demande d'abord, puis le cran non tenu le
    // plus bas de la bande, puis la case au-dessus (M-b). Le reste n'est pas servi.
    let sous: number | null = null
    if (r.porte === 'sonde') sous = 0
    else if (vie.etat === 'ouvert' && cran === vie.cranAServir) sous = 1
    else if (!vie.bande.includes(cran) && cran > (vie.bande[vie.bande.length - 1] ?? 0)) sous = 2
    if (sous === null) {
      if (!eligiblesParObjet.has(objet)) eligiblesParObjet.set(objet, false)
      continue
    }
    eligiblesParObjet.set(objet, true)
    const s = scoreDeLObservable(r, competence, ctx)
    const groupe = vie.etat === 'tenu' ? RANG.sondeTenu : RANG.ouvert
    if (vie.etat === 'tenu' || sous === 2) {
      s.election.regle = 'sonde'
      s.election.motif = `sonde de montée sur « ${objet} » (cran ${cran}, au-dessus de la bande ${vie.bande.join('·') || '∅'}). ${s.election.motif}`
    }
    classes.push({ c, r, groupe, objetScore: [s.palier, s.mesures ?? 0], sous, score: [s.palier, s.mesures ?? 0], election: s.election })
  }

  // Un objet ouvert dont aucun candidat n'est au cran à servir : le vide se dit.
  for (const [objet, eligible] of eligiblesParObjet) {
    if (eligible) continue
    const vie = vieDeLObjet(ctx, objet, competence)
    ecarter(objet, 'objet_sans_cran_ouvert', vie.cranAServir === null
      ? `« ${objet} » ouvert, mais sa bande n'a plus de cran non tenu que la porte ouvre ${vie.motif}`
      : `« ${objet} » ouvert au cran ${vie.cranAServir}, mais aucune instance retenue ne le porte ce cycle `
        + `(porte du registre, quarantaine ou banque). ${vie.motif}`)
  }

  // La règle 4 ENTRE OBJETS : le score de l'objet est celui de son meilleur candidat ;
  // les ex æquo partagent le rang, et c'est le tirage de la phase B qui départage.
  const cmp = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1]
  const parGroupe = new Map<number, Classe[]>()
  for (const k of classes) parGroupe.set(k.groupe, [...(parGroupe.get(k.groupe) ?? []), k])
  const out: Candidat[] = []
  for (const [groupe, lot] of parGroupe) {
    const objets = new Map<string, [number, number]>()
    for (const k of lot) {
      const o = k.r.instance.objet
      const deja = objets.get(o)
      if (!deja || cmp(k.objetScore, deja) < 0) objets.set(o, k.objetScore)
    }
    const classement = [...objets.entries()].sort((a, b) => cmp(a[1], b[1]))
    const indexDe = new Map<string, number>()
    let idx = 0
    for (let i = 0; i < classement.length; i++) {
      if (i > 0 && cmp(classement[i]![1], classement[i - 1]![1]) !== 0) idx = i
      indexDe.set(classement[i]![0], idx)
    }
    for (const k of lot) {
      const o = k.r.instance.objet
      // Entre clés d'un même objet, la même règle : le score, puis le tirage.
      const cles = lot.filter((x) => x.r.instance.objet === o && x.sous === k.sous)
        .map((x) => x.score).sort(cmp)
      const cleIdx = cles.findIndex((s) => cmp(s, k.score) === 0)
      const rang = groupe + (indexDe.get(o) ?? 0) * 10_000 + k.sous * 100 + Math.max(0, cleIdx)
      // ⭐ Le cran est-il SOUS la bande, exigé par le registre — la séquence de
      //    méthode, ou le cran d'en dessous d'une échelle ? La bande dure le laisse alors.
      const cran = k.r.instance.cranNumero ?? 0
      const rattrapage = k.r.porte === 'methode'
        || vieDeLObjet(ctx, o, competence).prerequis.includes(cran)
      ctx.journal.elections.set(k.c.exerciceId, k.election)
      out.push({ ...k.c, ordre: { rang, objet: o, motif: k.election.motif, rattrapage, methode: k.r.porte === 'methode' } })
    }
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// LES OBSERVABLES — ce que la fenêtre d'évidence en dit, par compétence
// ════════════════════════════════════════════════════════════════════════════

/**
 * « Non acquis (fenêtre d'évidence) » existe déjà et ne se recalcule pas
 * (piège 20) : ceci APPELLE `etatDesObservables` sur `fenetreDEvidence(
 * mesuresQuiComptent(...))`, compétence par compétence, et ne garde que deux
 * ensembles — les codes acquis, les codes connus de l'instrument. Les fonctions
 * sont reçues, pour que ce module reste pur.
 */
export function observablesParCompetence(
  competences: readonly Competence[],
  etatsDe: (competence: Competence) => Array<{ code: string; acquis: boolean }> | null,
): Map<Competence, ObservablesDUneCompetence> {
  const out = new Map<Competence, ObservablesDUneCompetence>()
  for (const c of competences) {
    const etats = etatsDe(c)
    if (!etats) continue
    out.set(c, {
      acquis: new Set(etats.filter((e) => e.acquis).map((e) => e.code)),
      connus: new Set(etats.map((e) => e.code)),
    })
  }
  return out
}

/** Ce que la décision journalise de l'objet (`01-` §11 ; prompt, piège 24). */
export function journalDeLObjet(
  ctx: ContexteObjets, r: InstanceRetenue, competence: Competence,
): Record<string, unknown> {
  const objet = r.instance.objet
  const election = ctx.journal.elections.get(r.instance.exerciceId) ?? null
  const vie = r.porte === 'methode'
    ? null
    : vieDeLObjet(ctx, objet, competence)
  const entree = election?.regle === 'methode' ? 'methode' : election?.regle === 'sonde' ? 'sonde' : 'ouvert'
  return {
    objet,
    etat: r.porte === 'methode' ? 'methode' : vie?.etat ?? null,
    entree,
    palier: vie?.palier ?? ctx.paliers.get(competence) ?? null,
    bande: vie?.bande ?? null,
    crans_absents: vie?.cransAbsents ?? null,
    prerequis: vie?.prerequis ?? null,
    cran_a_servir: vie?.cranAServir ?? null,
    semaine_1: ctx.semaine1,
    observable: election
      ? { code: election.code, competence: election.competence, regle: election.regle, mesures: election.mesures, motif: election.motif }
      : null,
    ecartes: [...ctx.journal.ecartes.values()].map((e) => ({ objet: e.objet, competence: e.competence, motif: e.motif, detail: e.detail })),
    hors_instrument: Object.fromEntries([...ctx.journal.horsInstrument].map(([c, s]) => [c, [...s].sort()])),
  }
}
