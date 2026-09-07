// ============================================================================
// C4 · L12 — LA DÉCISION : ce que `routeur_decisions` porte, et rien de plus.
// ----------------------------------------------------------------------------
// `01-` §11, point 1 — « CHAQUE DÉCISION DU ROUTEUR : élève, cycle, exercice,
// cible retenue, règle déclenchée, alternatives écartées, LES SONDES RETENUES ET
// LEUR MOTIF, les 2-3 propositions iso-durée et LE CHOIX DE L'ÉLÈVE, la
// `borne_amont` du non-spoiler, et TOUT OVERRIDE DU PROFESSEUR. »
// `07-` §1.5 y ajoute L'ÉTAT D'ESCALADE AU MOMENT DE LA DÉCISION, le TIRAGE
// ALÉATOIRE et `degrade`.
//
// ⚠️ UNE LIGNE PAR EXERCICE POSÉ, et c'est ce que la table exige : elle porte
//    `exercice_id` et `cible_retenue`, et « l'historique des cibles SE LIT sur
//    `routeur_decisions`, qui porte déjà la cible » — un historique EN EXERCICES
//    (`01-` §3 ; R5 « se compte en exercices »).
//
// ⚠️⚠️ LA FORME DE `sondes_retenues` EST FIGÉE PAR SES LECTEURS, pas par nous :
//    `utils/chaine/contexte.ts` lit `{ competence, sonde_montee }` et
//    `app/prof/routeur/serveur.ts` lit `{ competence, motif, sonde_montee }`.
//    ⭐⭐ Le booléen `sonde_montee` n'a AUCUN autre canal : `chaine.ts` écrit
//    `competences_mesures.sonde_montee` DEPUIS LA DÉCISION, et sans lui M-d et
//    toute la règle de montée restent inertes.
//
// ⛔ ET LES DEUX SONDES NE SE CONFONDENT JAMAIS (`01-` §8.8) :
//    · la sonde SECONDAIRE mesure en silence une compétence NON CIBLÉE, elle
//      COMPTE dans N1/N2, et « elle ne produit AUCUN RETOUR » ;
//    · la sonde de MONTÉE est la CASE choisie en phase A pour la compétence
//      CIBLE, au-dessus de sa bande ; elle ne compte nulle part (M-e) et elle
//      REÇOIT UN RETOUR — démonstratif chez E-D et C, interrogatif à B (§8.7).
//    Les deux vivent dans le même tableau, distinguées par ce seul booléen.
//
// Ce fichier est PUR.
// ============================================================================

import { cransDeSonde } from '../routeur/montee'
import type { EtatObservable } from '../routeur/observables'
import { PART_MAJORITE_TRAJECTOIRE, PLAFOND_SONDES_PAR_CYCLE, type BudgetMinutes } from '../routeur/config'
import type { EtatEscalade } from '../routeur/escalade'
import type { ExercicePose, SemainePosee, SondePosee } from '../routeur/semaine'
import type { Competence, Lettre, Palier } from '../routeur/types'
import { candidatsPour, type BorneAmont, type InstanceRetenue } from './vivier'
import { journalDeLObjet, type ContexteObjets } from './objets'

// ════════════════════════════════════════════════════════════════════════════
// LE TIRAGE — « un départage non journalisé rend le routeur irreproductible »
// ════════════════════════════════════════════════════════════════════════════

export interface TirageJournalise {
  /** Où le départage a eu lieu — `sondes`, `phase_c`, `R3`… */
  ou: string
  /** L'ENSEMBLE des ex æquo, pas seulement le choisi. */
  exAequo: string[]
  choisi: string
}

/**
 * `01-` §11, point 5 — « TRANCHER AU HASARD **ET LOGGUER LE TIRAGE** ».
 *
 * ⭐ `ordonnerLesSondes` et `poserLesSondes` reçoivent `tirer` EN PARAMÈTRE
 *    exprès, « pour que le tirage soit REPRODUCTIBLE et JOURNALISABLE : le
 *    module ne tire pas seul ». Cette enveloppe capte L'ENSEMBLE DES EX ÆQUO ET
 *    LE CHOISI : `tirage: true` seul ne journalise rien.
 */
export function journalDuTirage(hasard: () => number = Math.random) {
  const journal: TirageJournalise[] = []
  return {
    journal,
    /** Le départage d'une liste d'ex æquo, journalisé. */
    tirer<T extends string>(ou: string) {
      return (exAequo: readonly T[]): T => {
        const choisi = exAequo[Math.floor(hasard() * exAequo.length)] ?? exAequo[0]
        journal.push({ ou, exAequo: [...exAequo], choisi })
        return choisi
      }
    },
    /** Le tirage NUMÉRIQUE de R3, dont le §11 veut la valeur brute. */
    tirerUnNombre(ou: string) {
      return (): number => {
        const t = hasard()
        journal.push({ ou, exAequo: ['insere', 'pas_insere'], choisi: t.toFixed(6) })
        return t
      }
    },
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LES SONDES RETENUES — la forme que les lecteurs attendent
// ════════════════════════════════════════════════════════════════════════════

export interface SondeRetenue {
  competence: Competence
  /** Le motif du §8.9 pour une secondaire ; `sonde_montee` pour l'autre. */
  motif: string
  /** `01-` §8.9 — la priorité qui a joué. `null` pour une sonde de montée. */
  priorite: number | null
  /** ⭐⭐ LE BOOLÉEN QUI ALLUME M-e. La chaîne le recopie sur la mesure. */
  sonde_montee: boolean
  /** L'exercice qui la porte — pour ventiler les sondes par décision. */
  exercice_id: string
  /**
   * ⭐ C7-L9 — « les nombres qui l'ont déclenchée » (piège 25) : sur une sonde de
   *    trajectoire, le compte des requis acquis / ratés. Absent ailleurs — les
   *    lecteurs (`contexte.ts`, `serveur.ts`) lisent leurs clés et ignorent celle-ci.
   */
  detail?: string
}

// ════════════════════════════════════════════════════════════════════════════
// ⭐⭐ C7-L9 — LE SIGNAL DE TRAJECTOIRE : « la trajectoire propose, le 6·8 dispose »
// (`01-` §8.8, amendement du 07/09/2026 ; `10-` §7). PUR.
// ════════════════════════════════════════════════════════════════════════════

export type MotifTrajectoire = 'trajectoire_montee' | 'trajectoire_descente'

export interface SignalDeTrajectoire {
  competence: Competence
  motif: MotifTrajectoire
  /** Les requis acquis, ratés (un taux, non acquis) et le total — les nombres qui ont déclenché. */
  acquis: number
  rates: number
  requis: number
  detail: string
}

/**
 * « Quand, sur la fenêtre d'évidence et au taux pondéré, LA MAJORITÉ STRICTE des
 * observables REQUIS d'une compétence est ACQUISE — au seuil d'acquisition
 * ordinaire — l'élève est candidat à monter […] ; quand la majorité stricte est
 * RATÉE, même geste. » Le seuil (`estAcquis`) et la majorité (`PART_MAJORITE_
 * TRAJECTOIRE`) vivent dans `config.ts`, provisoires.
 * ⚠️ « Une compétence sans lettre ne se sonde pas » (`01-` §3) : `null` sans lettre.
 * ⚠️ « Ratée » se lit sur un observable qui A un taux et n'est pas acquis : un
 *    observable sans taux (aucune mesure ayant un objet) ne compte ni d'un côté ni
 *    de l'autre — « un observable sans taux ne se classe pas » (§8.2).
 */
export function signalDeTrajectoire(
  competence: Competence, etats: readonly EtatObservable[], lettre: Lettre,
): SignalDeTrajectoire | null {
  if (lettre === null) return null
  const requis = etats.filter((e) => e.requis)
  if (requis.length === 0) return null
  const acquis = requis.filter((e) => e.acquis).length
  const rates = requis.filter((e) => !e.acquis && !e.sansTaux).length
  const majorite = requis.length * PART_MAJORITE_TRAJECTOIRE
  const detail = `${acquis} requis acquis, ${rates} ratés, sur ${requis.length} (majorité stricte : plus de ${majorite})`
  if (acquis > majorite) return { competence, motif: 'trajectoire_montee', acquis, rates, requis: requis.length, detail }
  if (rates > majorite) return { competence, motif: 'trajectoire_descente', acquis, rates, requis: requis.length, detail }
  return null
}

/** Les deux crans du 6·8 — « le substrat est un exercice 6/8 servable sur cette compétence ». */
export const CRANS_DE_TRAJECTOIRE: ReadonlySet<string> = new Set(['production_etayee', 'production_autonome'])

/**
 * La sonde de montée qu'un signal de trajectoire pose sur un exercice 6/8 : la
 * cible est la compétence, marquée `sonde_montee` (M-e) — « la même sonde qu'ici »
 * (`10-` §7) —, motif `trajectoire_montee` / `trajectoire_descente`, les nombres au détail.
 */
export function sondeDeTrajectoire(signal: SignalDeTrajectoire, exerciceId: string): SondeRetenue {
  return { competence: signal.competence, motif: signal.motif, priorite: null, sonde_montee: true,
    exercice_id: exerciceId, detail: signal.detail }
}

/**
 * `01-` §8.8, M-b — une case est une SONDE DE MONTÉE quand son cran est
 * AU-DESSUS de la bande du palier de la compétence CIBLE. « La part est chiffrée
 * palier par palier, à la table d'indexation du cran sur le palier », et
 * `cransDeSonde` la lit déjà : rien ne se recode ici.
 *
 * ⚠️ « RIEN CHEZ A », dont la montée passe au grain — la table le porte déjà
 *    (zone haute vide), on ne l'écrit pas une seconde fois.
 * ⚠️ Sans lettre, aucune bande : « une compétence sans lettre n'est ni ciblable,
 *    ni sondable, ni plafonnée » — et elle n'a pas de case au-dessus non plus.
 */
export function estUneSondeDeMontee(palier: Lettre, cranCode: string | null): boolean {
  if (palier === null || !cranCode) return false
  return (cransDeSonde(palier as Palier) as readonly string[]).includes(cranCode)
}

/**
 * Les sondes d'UN exercice — les secondaires que la phase C y a placées, plus la
 * sonde de montée quand la case servie à la cible est au-dessus de sa bande.
 */
export function sondesDeLExercicePose(
  exerciceId: string,
  ciblePrimaire: Competence,
  cranCode: string | null,
  palierDeLaCible: Lettre,
  secondaires: readonly SondePosee[],
): SondeRetenue[] {
  const out: SondeRetenue[] = secondaires
    .filter((s) => s.exerciceId === exerciceId)
    .map((s) => ({
      competence: s.competence,
      motif: s.motif,
      priorite: s.priorite,
      sonde_montee: false,
      exercice_id: exerciceId,
    }))

  if (estUneSondeDeMontee(palierDeLaCible, cranCode)) {
    out.push({
      competence: ciblePrimaire,
      motif: 'sonde_montee',
      priorite: null,
      sonde_montee: true,
      exercice_id: exerciceId,
    })
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// LES PROPOSITIONS ISO-DURÉE — « le geste qui n'existe à aucun étage »
// ════════════════════════════════════════════════════════════════════════════

export interface PropositionIsoDuree {
  exercice_id: string
  cran: string
  mode: string
  duree_min: number
  /** Vrai pour celle que le routeur a retenue — le dépôt est posé sur elle. */
  retenue: boolean
}

export interface OffreDeChoix {
  propositions: PropositionIsoDuree[]
  offerte: boolean
  motif: string
}

/** `01-` §4, couche 4 — le seul cran de `transformer` qui n'offre pas le choix. */
export const CRAN_SANS_CHOIX = 'transformation_guidee'

/** `01-` §4, couche 4 — « 2-3 propositions », jamais plus. */
export const PROPOSITIONS_MAX = 3

/**
 * `01-` §4, couche 4 — « LE CHOIX N'EST OFFERT QUE LÀ OÙ IL Y A DE QUOI
 * RECOMBINER, et c'est un couple (`cran`, `grain`) » :
 *
 *  · AU MÉSO ET AU MACRO, aux crans de `produire` et de `transformer` — SAUF
 *    `transformation_guidee` — : 2-3 propositions, toutes au service de LA MÊME
 *    CIBLE, et l'élève choisit ;
 *  · partout ailleurs — au micro, aux crans de `diagnostiquer`, et à
 *    `transformation_guidee` — UNE SEULE proposition : « ces exercices sont des
 *    choix multiples, le stock est trop mince pour qu'une alternative ait un sens ».
 *
 * ⚠️⚠️ « LES PROPOSITIONS ONT TOUTES LE MÊME BUDGET DE TEMPS », et c'est ce qui
 *    garde le remplissage DÉTERMINISTE : « si les options avaient des durées
 *    inégales, le choix de l'élève déplacerait le budget restant et le routeur
 *    devrait replanifier après chaque clic ». La durée est donc le filtre dur.
 *
 * ⛔ Ce que ce lot NE tranche PAS : « la place qu'y prend la préférence
 *    recueillie » (`01-` §5, « Non tranché »). `choix_eleve` reste donc NULL —
 *    il n'y a pas d'écran dans ce lot, et le dépôt est posé sur la proposition
 *    RETENUE. Le jour où l'écran existera, il écrira `choix_eleve` et fera
 *    basculer le dépôt : la forme est là, la main de l'élève viendra.
 */
export function propositionsIsoDuree(
  elu: ExercicePose,
  vivier: readonly InstanceRetenue[],
  dejaPoses: readonly ExercicePose[],
): OffreDeChoix {
  const c = elu.candidat
  const retenue: PropositionIsoDuree = {
    exercice_id: c.exerciceId, cran: c.cran, mode: c.mode, duree_min: c.dureeMin, retenue: true,
  }
  const grainOuvert = c.grain === 'meso' || c.grain === 'macro'
  const gesteOuvert = c.geste === 'produire' || c.geste === 'transformer'
  if (!grainOuvert || !gesteOuvert || c.cran === CRAN_SANS_CHOIX) {
    return { propositions: [retenue], offerte: false,
      motif: !grainOuvert ? `grain ${c.grain} : une seule proposition (couche 4).`
        : !gesteOuvert ? `geste ${c.geste} : une seule proposition (couche 4).`
          : `\`${CRAN_SANS_CHOIX}\` n'offre qu'une proposition, comme le micro et le \`diagnostiquer\`.` }
  }

  const consommes = new Set([...dejaPoses.map((e) => e.candidat.exerciceId), c.exerciceId])
  const alternatives = vivier
    .filter((r) => !consommes.has(r.instance.exerciceId))
    // « toutes au service de la MÊME CIBLE »…
    .filter((r) => r.ciblables.includes(c.competence))
    // … et « TOUTES LE MÊME BUDGET DE TEMPS ».
    .filter((r) => r.instance.dureeMin === c.dureeMin)
    .slice(0, PROPOSITIONS_MAX - 1)
    .map((r): PropositionIsoDuree => ({
      exercice_id: r.instance.exerciceId,
      cran: r.instance.cranCode ?? '',
      mode: (r.instance.modesParCompetence[c.competence] ?? [])[0] ?? '',
      duree_min: r.instance.dureeMin as number,
      retenue: false,
    }))

  if (alternatives.length === 0) {
    return { propositions: [retenue], offerte: false,
      motif: `aucune autre instance de ${c.dureeMin} min ne porte ${c.competence} dans le vivier `
        + 'de cet élève : le choix n\'a rien à recombiner.' }
  }
  return { propositions: [retenue, ...alternatives], offerte: true,
    motif: `${alternatives.length + 1} propositions iso-durée (${c.dureeMin} min), toutes au `
      + `service de ${c.competence}. \`choix_eleve\` reste NULL : la main de l'élève demande un `
      + 'écran, qui n\'est pas de ce lot.' }
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉTAT D'ESCALADE AU MOMENT DE LA DÉCISION (`07-` §1.5)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `07-` §1.5 — « `competences_escalade` NE PEUT PAS Y RÉPONDRE : elle porte
 * l'état COURANT, pas celui qu'il avait quand la mesure a été prise, et un état
 * recalculé après coup dirait autre chose. Le routeur, lui, DÉCIDE TOUT À LA
 * CONSTRUCTION DU CYCLE : il connaît l'état à cet instant, et c'est LÀ qu'il
 * l'écrit. La mesure le retrouve par SON DÉPÔT → SA DÉCISION. »
 *
 * La forme physique appartient à la session Code : un objet par compétence, ses
 * observables et leur degré, plus l'instant de lecture — « lus UNE FOIS, à la
 * construction » (`01-` §5).
 */
export interface EtatEscaladeJournalise {
  lu_at: string
  par_competence: Record<string, Array<{
    observable: string; degre: string; entre_n1_at: string | null
    dossier_n3_ouvert_at: string | null
  }>>
}

export function journaliserLEscalade(
  escalades: ReadonlyMap<Competence, EtatEscalade[]>, luAt: string,
): EtatEscaladeJournalise {
  const par: EtatEscaladeJournalise['par_competence'] = {}
  for (const [competence, lot] of escalades) {
    if (lot.length === 0) continue
    par[competence] = lot.map((e) => ({
      observable: e.observable, degre: e.degre, entre_n1_at: e.entreN1At,
      dossier_n3_ouvert_at: e.dossierN3OuvertAt,
    }))
  }
  return { lu_at: luAt, par_competence: par }
}

// ════════════════════════════════════════════════════════════════════════════
// LA LIGNE DE DÉCISION
// ════════════════════════════════════════════════════════════════════════════

/** La charge d'une ligne de `routeur_decisions`. Aucune clé de plus. */
export interface LigneDeDecision {
  eleve_id: string
  cycle_lundi: string
  exercice_id: string
  cible_retenue: string
  regle_declenchee: string
  alternatives_ecartees: unknown
  sondes_retenues: SondeRetenue[]
  propositions_iso_duree: PropositionIsoDuree[] | null
  choix_eleve: null
  borne_amont: BorneAmont
  tirage_aleatoire: TirageJournalise[] | null
  etat_escalade: EtatEscaladeJournalise
  degrade: boolean
}

export interface ContexteDeDecision {
  eleveId: string
  cycleLundi: string
  etatEscalade: EtatEscaladeJournalise
  tirages: readonly TirageJournalise[]
  /** Le palier de chaque compétence, tel que la colonne le porte (piège 32). */
  paliers: ReadonlyMap<Competence, Lettre>
  /** Les compétences que R2 a écartées, et le journal de la liste de priorité. */
  alternatives: unknown
  /**
   * ⭐⭐ C7-L7 — l'ordre par objet, quand la porte du gabarit est ouverte : la
   *    décision journalise l'état de l'objet, l'observable élu et son motif, et
   *    les objets écartés (`01-` §11 ; prompt, piège 24). `null` : porte fermée.
   */
  objets?: ContexteObjets | null
  /**
   * ⭐⭐ C7-L9 — les sondes de montée que le SIGNAL DE TRAJECTOIRE a posées au 6·8
   *    (`01-` §8.8, 07/09), et le journal de ce que chaque signal est devenu
   *    (posée sur un exercice de la semaine, exercice ajouté, `sans_substrat`,
   *    `hors_budget`) — écrit sous `alternatives_ecartees.trajectoire`, sur la
   *    première ligne du cycle, comme le tirage. `null` : porte fermée, rien.
   */
  trajectoire?: { sondes: SondeRetenue[]; journal: JournalTrajectoire[] } | null
}

/** ⭐ C7-L9 — ce qu'un signal de trajectoire est devenu à la pose, journalisé (`01-` §11). */
export interface JournalTrajectoire {
  competence: Competence
  motif: MotifTrajectoire
  detail: string
  issue: 'sonde_sur_exercice_pose' | 'exercice_ajoute' | 'sans_substrat' | 'hors_budget'
  exercice_id: string | null
}

/**
 * `01-` §11 — la traduction d'une semaine posée en lignes de journal.
 * ⛔ UNE LIGNE PAR EXERCICE : c'est ce qui fait que « un dépôt retrouve sa cible
 *    par `routeur_decision_id` », et que l'historique des cibles se compte EN
 *    EXERCICES.
 */
/**
 * ⭐ C7-L5 — LA SONDE DE MONTÉE DÉCLENCHÉE PAR LE REGISTRE (`10-` §7, décision
 *    14 ; `01-` §8.8 amendé) : « rien de neuf dans la mécanique, seul le
 *    déclencheur s'ajoute ». Elle est marquée `sonde_montee` comme les autres —
 *    M-e : neutre pour la fenêtre d'acquisition et la stagnation.
 */
function avecLaSondeDuRegistre(
  sondes: SondeRetenue[], porte: string | null, exerciceId: string, cible: Competence,
): SondeRetenue[] {
  if (porte !== 'sonde' || sondes.some((s) => s.sonde_montee)) return sondes
  return [...sondes, {
    competence: cible, motif: 'sonde_montee_registre', priorite: null, sonde_montee: true,
    exercice_id: exerciceId,
  }]
}

export function lignesDeDecision(
  poses: readonly ExercicePose[],
  sondes: readonly SondePosee[],
  vivier: readonly InstanceRetenue[],
  ctx: ContexteDeDecision,
  degradees: ReadonlySet<string> = new Set(),
): LigneDeDecision[] {
  return poses.map((p, i) => {
    const r = vivier.find((x) => x.instance.exerciceId === p.candidat.exerciceId)
    const offre = propositionsIsoDuree(p, vivier, poses.slice(0, i))
    return {
      eleve_id: ctx.eleveId,
      cycle_lundi: ctx.cycleLundi,
      exercice_id: p.candidat.exerciceId,
      cible_retenue: p.candidat.competence,
      regle_declenchee: p.regle,
      alternatives_ecartees: {
        // Ce que la liste de priorité a écarté, et ce que PB3 a départagé.
        priorite: ctx.alternatives,
        cibles_secondaires: p.candidat.ciblesSecondaires,
        departage_par_pb3: p.departageParPB3,
        // `01-` §11, point 5 — quand ni PB1 ni PB3 n'ont tranché, c'est le
        // tirage qui a choisi ; l'ensemble des ex æquo est dans `tirage_aleatoire`.
        tirage_a_la_pose: p.tirage,
        tour_de_pb5: p.tour,
        // ⭐ C7-L5 — ce que la porte du registre a dit de cette instance.
        porte_registre: r?.porte ?? null,
        // ⭐ C7-L6 — le devoir servi et la date du dernier dépôt de l'élève dessus
        //   (`01-` v5.9 §8.10, « ce qu'elle journalise ») ; la méthode bornée (§5).
        devoir: r ? { ids: r.devoir.ids, dernier_depot_at: r.devoir.dernierDepotAt } : null,
        methode: r?.methode ?? null,
        // « sans devoir frais » : servi quand même, et le motif le dit.
        devoir_manquant: r?.degrade ? r.instance.objet : null,
        // ⭐⭐ C7-L7 — l'état de l'objet, l'observable élu et son motif, les objets
        //    écartés et pourquoi (`01-` §11, amendement du 06/09). Le jsonb, jamais
        //    une colonne : `routeur_decisions` en a dix-sept, et ce lot n'en ajoute aucune.
        objet: r && ctx.objets ? journalDeLObjet(ctx.objets, r, p.candidat.competence) : null,
        // ⭐⭐ C7-L9 — ce que chaque signal de trajectoire est devenu, une fois par cycle.
        trajectoire: i === 0 && ctx.trajectoire ? ctx.trajectoire.journal : null,
      },
      // ⭐⭐ C7-L9 — la sonde de trajectoire, sur l'exercice 6/8 qui la porte : marquée
      //    `sonde_montee` (M-e), motif `trajectoire_montee` / `trajectoire_descente`.
      //    Elle entre AVANT celle du registre, qui s'efface devant une sonde de
      //    montée déjà là (`avecLaSondeDuRegistre`) : une seule marque par exercice.
      sondes_retenues: avecLaSondeDuRegistre([
        ...sondesDeLExercicePose(
          p.candidat.exerciceId, p.candidat.competence, p.candidat.cran,
          ctx.paliers.get(p.candidat.competence) ?? null, sondes),
        ...(ctx.trajectoire?.sondes.filter((s) => s.exercice_id === p.candidat.exerciceId) ?? []),
      ], r?.porte ?? null, p.candidat.exerciceId, p.candidat.competence),
      propositions_iso_duree: offre.offerte ? offre.propositions : null,
      // ⛔ « La place qu'y prend la préférence recueillie n'est pas tranchée, et
      //    ce lot se construit sans elle » (`01-` §5, « Non tranché »).
      choix_eleve: null,
      borne_amont: r?.borne ?? {
        regime: 'hors_livre', bornes: [], seanceMaxExigee: null,
        motif: 'instance absente du vivier au moment du journal — borne non calculable.',
      },
      // Le tirage est journalisé UNE FOIS, sur la première ligne du cycle : il
      // porte sur la construction entière, pas sur un exercice.
      tirage_aleatoire: i === 0 && ctx.tirages.length ? [...ctx.tirages] : null,
      etat_escalade: ctx.etatEscalade,
      degrade: degradees.has(p.candidat.exerciceId),
    }
  })
}

/**
 * ⭐⭐ C7-L9 — « LA TRAJECTOIRE PROPOSE, LE 6·8 DISPOSE » (`01-` §8.8 ; `10-` §7) : pour
 *    chaque signal, une SONDE DE MONTÉE au cran 6 ou 8 sur la compétence —
 *    « la même sonde qu'ici », marquée `sonde_montee` (M-e), motif journalisé avec
 *    les nombres. Le substrat, dans l'ordre : un exercice 6/8 DÉJÀ POSÉ dont elle
 *    est la cible ; sinon un exercice 6/8 SERVABLE sur elle dans le vivier — par
 *    `candidatsPour`, la seule phase B —, ajouté à la semaine s'il tient dans le
 *    budget ; sinon `sans_substrat` (ou `hors_budget`) journalisé, et rien d'autre.
 *    Elle compte dans `PLAFOND_SONDES_PAR_CYCLE` : la phase C reçoit le reste.
 * ⚠️ « Rien chez A » et « sans lettre, rien » sont tenus en amont, au signal.
 */
export function poserLesSondesDeTrajectoire(
  signaux: readonly SignalDeTrajectoire[], semaine: SemainePosee, retenus: readonly InstanceRetenue[],
  budget: BudgetMinutes, expressionEnSecondaire: boolean,
): { sondes: SondeRetenue[]; journal: JournalTrajectoire[] } {
  const sondes: SondeRetenue[] = []
  const journal: JournalTrajectoire[] = []
  for (const s of signaux) {
    if (sondes.length >= PLAFOND_SONDES_PAR_CYCLE) break
    const deja = semaine.exercices.find((p) => CRANS_DE_TRAJECTOIRE.has(p.candidat.cran) && p.candidat.competence === s.competence)
    if (deja) {
      sondes.push(sondeDeTrajectoire(s, deja.candidat.exerciceId))
      journal.push({ competence: s.competence, motif: s.motif, detail: s.detail, issue: 'sonde_sur_exercice_pose', exercice_id: deja.candidat.exerciceId })
      continue
    }
    // ⚠️ HORS de l'ordre par objet (C7-L7) : la sonde est l'exception à la porte ET
    //    à l'ordre — un 6/8 servable sur la compétence, quel que soit l'état de son objet.
    const candidats = candidatsPour(retenus, s.competence, semaine.exercices, expressionEnSecondaire, null)
      .filter((c) => CRANS_DE_TRAJECTOIRE.has(c.cran))
    const elu = candidats[0]
    if (!elu) {
      journal.push({ competence: s.competence, motif: s.motif, detail: s.detail, issue: 'sans_substrat', exercice_id: null })
      continue
    }
    if (semaine.minutesAssignees + elu.dureeMin > budget.plafond) {
      journal.push({ competence: s.competence, motif: s.motif, detail: `${s.detail} ; ${elu.dureeMin} min ne tiennent pas dans les ${budget.plafond - semaine.minutesAssignees} min restantes`, issue: 'hors_budget', exercice_id: elu.exerciceId })
      continue
    }
    const tour = semaine.exercices.reduce((t, p) => Math.max(t, p.tour), -1) + 1
    const pose = { candidat: elu, regle: 'trajectoire' as const, departageParPB3: false, tirage: false, tour }
    semaine.exercices.push(pose)
    semaine.posesDeCettePasse.push(pose)
    semaine.minutesAssignees += elu.dureeMin
    sondes.push(sondeDeTrajectoire(s, elu.exerciceId))
    journal.push({ competence: s.competence, motif: s.motif, detail: s.detail, issue: 'exercice_ajoute', exercice_id: elu.exerciceId })
  }
  return { sondes, journal }
}
