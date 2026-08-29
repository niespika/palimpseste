import 'server-only'
// ============================================================================
// C4 · L12 — L'ORCHESTRATEUR PAR ÉLÈVE, ET LA PERSISTANCE DE LA DÉCISION.
// ----------------------------------------------------------------------------
// « Le moteur existe, il est éprouvé, ET RIEN NE LE FAIT TOURNER. » Voici ce qui
// le fait tourner. ⛔ CE LOT EST UNE SOUDURE : il donne des entrées aux fonctions
// pures de C4-L2 et il persiste leurs sorties. **Si une règle est réécrite ici,
// le lot a échoué.**
//
// ⛔⛔ IL N'OUVRE PAS SON PROPRE DÉCLENCHEUR HEBDOMADAIRE. `C4-L13` en pose déjà
//    un sur la même clé (élève × cycle) — `/api/assiduite/hebdo`, `30 9 * * 1` —,
//    et « deux crons sur une même clé fabriquent DEUX LIGNES ». Ce lot SE GREFFE
//    sur celui-là : la route appelle d'abord la collecte, puis ceci.
//
// ⛔⛔ ET IL NE POSE JAMAIS LA LIGNE D'ASSIDUITÉ. « `C4-L12` remplit les minutes
//    de LA LIGNE QU'IL TROUVE, il n'en ouvre pas » — poser la ligne de la semaine
//    W éteindrait la collecte de W EN SILENCE, et « la classe entière se lirait
//    verte pour toujours ». D'où `.update()`, jamais `.upsert()`, et le DÉCALAGE
//    D'UN TOUR : on remplit les minutes de la semaine que la collecte VIENT de
//    poser, puis on pose la suivante (voir `minutes.ts`).
//
// ⛔ `routeur_actif` EST LE SIEN À LIRE, JAMAIS À OUVRIR — « un lot lit LE SIEN,
//    jamais celui d'un voisin ». À OFF, rien n'est posé, et le bilan le DIT.
//
// ⚠️ « TOUT SE DÉCIDE À LA CONSTRUCTION DU CYCLE » : l'état est lu UNE FOIS par
//    élève, et « AUCUNE MESURE DU CYCLE EN COURS N'ALIMENTE SA PROPRE
//    CONSTRUCTION ». Seul `historique_cibles` s'accumule pendant la pose.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { addDaysUTC, lundiOnOrBefore, toISODate } from '@/utils/calendrier-grille'
import {
  lireLesDecisions, lireLesEscalades, lireLesInscriptions, lireLesInterrupteurs,
  lireLesMesures, lireLesNiveaux, lireLOptOut, lireLeProfil, lirePagine,
} from '@/utils/routeur/donnees'
import { budgetDeLEleve } from '@/utils/routeur/budget'
import {
  KdeR5, listeDePriorite, secondeInscriptionPA3, type EntreeDePriorite, type EtatPourCiblage,
} from '@/utils/routeur/ciblage'
import { jugerLaLettre } from '@/utils/routeur/lettres'
import { mesuresQuiComptent, parDate } from '@/utils/routeur/mesure'
import { historiqueDesCibles, signalDeCiblage } from '@/utils/routeur/profil'
import { controlesDeLaCompetence } from '@/utils/routeur/proportions'
import { ordonnerLesSondes, type CandidateSonde } from '@/utils/routeur/sondes'
import { poserLaSemaine, poserLesSondes, type SondePosee } from '@/utils/routeur/semaine'
import { COMPETENCES } from '@/utils/chaine/types'
import { chargerDoctrineDepuisBase } from '@/utils/fabrique/doctrine'
import type { Competence, Lettre, Segment } from '@/utils/routeur/types'
import { lireLesSegments, segmentDuCycle } from './calendrier-serveur'
import { poserLeColdStart, type BilanDuColdStart } from './etat-serveur'
import type { DecoupeEnSegments } from '@/utils/routeur/segments'
import {
  candidatsPour, constituerLeVivier, substratsDeLaSemaine,
  type EcartDuVivier, type InstanceRetenue, type MotifDEcart,
} from './vivier'
import {
  lireLesCoursVus, lireLesInstances, lireLesInstancesDejaDeposees, lireLesPositionsDeLecture,
} from './vivier-serveur'
import {
  journalDuTirage, journaliserLEscalade, lignesDeDecision, type LigneDeDecision,
} from './decision'
import {
  chargeDeMinutes, grouperParFormeDeCle, minutesAssignees, verifierLaChargeDeMinutes,
} from './minutes'

type Admin = ReturnType<typeof createAdminClient>

// ════════════════════════════════════════════════════════════════════════════
// LE BILAN — « `reclames` et `traites` SE COMPARENT, et c'est la preuve que la
// garde tient » (`app/api/chaine/route.ts`)
// ════════════════════════════════════════════════════════════════════════════

export interface BilanDuRouteur {
  /** La semaine POSÉE — celle qui commence. */
  cycleLundi: string
  /** La semaine dont on remplit les minutes — celle que la collecte vient de poser. */
  cycleDesMinutes: string
  fuseau: string
  segment: Segment | null
  regime: string | null
  /** ⛔ « Un lot lit LE SIEN » — jamais ouvert par ce lot. */
  routeurActif: boolean
  /** Vrai quand la recette a demandé de passer outre l'interrupteur, et le DIT. */
  horsAllumage: boolean
  /** Pourquoi rien n'a été posé, quand rien ne l'a été. `null` sinon. */
  motif: string | null
  /** ⭐ LA POPULATION VISÉE — elle SE COMPARE à `servis + nonServis`. */
  elevesAttendus: number
  elevesServis: number
  nonServis: Array<{ eleveId: string; motif: string }>
  /** Les élèves dont la liste de priorité était VIDE — « rien à poser ». */
  sansCibleCiblable: number
  /** Les élèves dont le vivier était vide — « rien à SERVIR », ce n'est pas pareil. */
  viviersVides: number
  exercicesPoses: number
  decisionsEcrites: number
  depotsPoses: number
  sondesPosees: number
  /** `01-` §5 — les semaines qui se sont arrêtées SOUS le plancher. */
  ecartsAuPlancher: Array<{ eleveId: string; manque: number; assignees: number; plancher: number }>
  /** Les motifs d'écart du vivier, comptés — « un vide expliqué ». */
  ecartsDuVivier: Partial<Record<MotifDEcart, number>>
  /** Les minutes du cycle précédent, remplies sur la ligne qu'on a TROUVÉE. */
  minutesRemplies: number
  /** ⚠️ Les `update` qui n'ont touché AUCUNE ligne : « la ligne qu'il trouve ». */
  minutesSansLigne: number
  budgetsRefuses: Array<{ eleveId: string; motif: string }>
  /**
   * ⭐ `01-` §10 — ce que le COLD START a posé avant la pose de la semaine.
   * `null` quand il n'avait rien à faire.
   */
  coldStart: BilanDuColdStart | null
  erreurs: string[]
}

function bilanVide(
  cycleLundi: string, cycleDesMinutes: string, fuseau: string, motif: string | null,
  routeurActif: boolean, horsAllumage: boolean,
): BilanDuRouteur {
  return {
    cycleLundi, cycleDesMinutes, fuseau, segment: null, regime: null,
    routeurActif, horsAllumage, motif,
    elevesAttendus: 0, elevesServis: 0, nonServis: [], sansCibleCiblable: 0, viviersVides: 0,
    exercicesPoses: 0, decisionsEcrites: 0, depotsPoses: 0, sondesPosees: 0,
    ecartsAuPlancher: [], ecartsDuVivier: {}, minutesRemplies: 0, minutesSansLigne: 0,
    budgetsRefuses: [], coldStart: null, erreurs: [],
  }
}

export interface OptionsDuRouteur {
  /** Force la semaine posée (recette, rattrapage). Par défaut : celle qui commence. */
  cycleDemande?: string
  /** Restreint la population — la recette s'en sert pour ne toucher que son décor. */
  elevesDemandes?: readonly string[]
  /**
   * ⚠️ RÉSERVÉ À LA RECETTE. « Le fait quand ne demande PAS que le routeur soit
   * allumé : il demande que le geste EXISTE ET SOIT ÉPROUVÉ. » Ce drapeau permet
   * à la traversée d'appeler le point d'entrée sans BASCULER `routeur_actif` —
   * « ils ne bougent pas de ton fait ». Le bilan porte `horsAllumage: true`.
   */
  forcerHorsAllumage?: boolean
  /** L'échéance d'un dépôt posé, en jours. Défaut : la fin de la semaine. */
  joursDEcheance?: number
}

// ════════════════════════════════════════════════════════════════════════════
// LE POINT D'ENTRÉE
// ════════════════════════════════════════════════════════════════════════════

export async function poserLesSemainesDuRouteur(
  admin: Admin, fuseau: string, aujourdHui: string, options: OptionsDuRouteur = {},
): Promise<BilanDuRouteur> {
  const cycleLundi = options.cycleDemande ?? toISODate(lundiOnOrBefore(aujourdHui))
  // ⭐ LE DÉCALAGE D'UN TOUR : la collecte vient de poser la semaine ÉCOULÉE, et
  //    c'est SES minutes qu'on remplit — jamais celles de la semaine qu'on pose,
  //    dont la ligne n'existera que lundi prochain.
  const cycleDesMinutes = toISODate(addDaysUTC(new Date(`${cycleLundi}T00:00:00Z`), -7))
  const horsAllumage = !!options.forcerHorsAllumage

  const interrupteurs = await lireLesInterrupteurs(admin)
  const routeurActif = !!interrupteurs.routeur_actif
  if (!routeurActif && !horsAllumage) {
    return bilanVide(cycleLundi, cycleDesMinutes, fuseau,
      '`routeur_actif` est à OFF : le routeur ne pose rien. Ce lot LE LIT, il ne l\'ouvre '
      + 'jamais — « un lot lit le sien, jamais celui d\'un voisin ».', routeurActif, horsAllumage)
  }

  // ── LE SEGMENT — d'où sortent la règle de calibration et les proportions ──
  const decoupe = await lireLesSegments(admin)
  const s = segmentDuCycle(decoupe, cycleLundi)
  if (s.segment === null) {
    return { ...bilanVide(cycleLundi, cycleDesMinutes, fuseau, s.motif, routeurActif, horsAllumage),
      erreurs: decoupe.incidents }
  }
  if (s.segment === 1) {
    // « LE SEGMENT 1 EST HORS ROUTAGE — il sert les deux examens diagnostiques
    //   imposés en classe » (`07-` §2, l'échéance de ce lot).
    return { ...bilanVide(cycleLundi, cycleDesMinutes, fuseau,
      'segment 1 : HORS ROUTAGE — il sert les deux examens diagnostiques imposés en classe. '
      + 'Le routeur s\'allume au segment 2 (`01-` §4, couche 1).', routeurActif, horsAllumage),
    segment: 1, regime: s.regime, erreurs: decoupe.incidents }
  }

  const bilan = bilanVide(cycleLundi, cycleDesMinutes, fuseau, null, routeurActif, horsAllumage)
  bilan.segment = s.segment
  bilan.regime = s.regime
  bilan.erreurs.push(...decoupe.incidents)

  // ── LA POPULATION — élèves ACTIFS, DÉDOUBLONNÉS ──────────────────────────
  const eleves = options.elevesDemandes
    ? [...new Set(options.elevesDemandes)]
    : await lirePopulation(admin, bilan.erreurs)
  bilan.elevesAttendus = eleves.length
  if (eleves.length === 0) {
    bilan.motif = 'aucun élève inscrit dans une classe active : rien à poser.'
    return bilan
  }

  // ── CE QUI SE LIT UNE FOIS POUR TOUS ─────────────────────────────────────
  // ⛔ LA DOCTRINE SE CHARGE UNE FOIS : durées, crans, objets ET la table des
  //    modes admis, dont le contrôle de trajectoire a besoin (`01-` §7).
  const doctrine = await chargerDoctrineDepuisBase(admin as never)
  const { instances, incidents } = await lireLesInstances(admin, doctrine)
  bilan.erreurs.push(...incidents)
  const positions = await lireLesPositionsDeLecture(admin, eleves)
  bilan.erreurs.push(...positions.incidents)
  const dejaDeposees = await lireLesInstancesDejaDeposees(admin, eleves)
  bilan.erreurs.push(...dejaDeposees.incidents)

  const classesDesEleves = new Map<string, string[]>()
  const inscriptionsParEleve = new Map<string, Awaited<ReturnType<typeof lireLesInscriptions>>>()
  for (const id of eleves) {
    try {
      const ins = await lireLesInscriptions(admin, id)
      inscriptionsParEleve.set(id, ins)
      classesDesEleves.set(id, ins.map((i) => i.classeId))
    } catch (e) {
      bilan.erreurs.push(`${id.slice(0, 8)} : inscriptions — ${(e as Error).message}`)
    }
  }
  const toutesLesClasses = [...new Set([...classesDesEleves.values()].flat())]
  const coursVus = await lireLesCoursVus(admin, toutesLesClasses, aujourdHui)
  bilan.erreurs.push(...coursVus.incidents)

  // ── LE COLD START — AVANT LA POSE, ET C'EST TOUT L'ENJEU ─────────────────
  // ⛔⛔ `poserLeColdStart` était écrit, testé, et N'AVAIT AUCUN APPELANT : la
  //   médiane de classe du `01-` §10 n'a jamais été posée une seule fois. Le
  //   coût était invisible et total — R0 exige « `evaluee` **et** une lettre »,
  //   et un élève absent au diagnostic n'a pas de lettre : sa liste de priorité
  //   sortait VIDE, et le routeur ne lui posait RIEN, toute l'année.
  // ⭐ Il est idempotent par construction — « il POSE la première lettre, il
  //   n'écrase jamais » — donc le rejouer chaque lundi ne coûte rien et
  //   rattrape l'élève inscrit en cours d'année.
  // ⚠️ Il vient APRÈS la lecture de la population et AVANT la boucle de pose :
  //   les lettres qu'il écrit doivent être lisibles par `lireLesNiveaux` du
  //   même cycle, sinon il ne servirait qu'à la semaine suivante.
  const elevesParClasse = new Map<string, string[]>()
  for (const [eleveId, classes] of classesDesEleves) {
    for (const classeId of classes) {
      elevesParClasse.set(classeId, [...(elevesParClasse.get(classeId) ?? []), eleveId])
    }
  }
  try {
    bilan.coldStart = await poserLeColdStart(admin, elevesParClasse, fuseau)
    bilan.erreurs.push(...bilan.coldStart.erreurs)
  } catch (e) {
    // Même règle que pour la collecte : un cold start en échec ne doit pas
    // emporter la pose de la semaine pour les élèves qui, eux, ont leur lettre.
    bilan.erreurs.push(`cold start : ${(e as Error).message} — la pose continue.`)
  }

  const maintenant = new Date().toISOString()
  const echeance = toISODate(addDaysUTC(new Date(`${cycleLundi}T00:00:00Z`),
    options.joursDEcheance ?? 6))

  // ── ÉLÈVE PAR ÉLÈVE, ET JAMAIS PAR CLASSE ────────────────────────────────
  // « La voie du professeur assigne à la classe entière, et c'est SA définition. »
  for (const eleveId of eleves) {
    try {
      const pose = await poserLaSemaineDUnEleve(admin, {
        eleveId, cycleLundi, segment: s.segment, fuseau, maintenant, echeance,
        decoupe, modesAdmis: doctrine.modesAdmis,
        instances,
        positions: positions.parEleve.get(eleveId) ?? new Map(),
        dejaDeposees: dejaDeposees.parEleve.get(eleveId) ?? new Set(),
        inscriptions: inscriptionsParEleve.get(eleveId) ?? [],
        coursVus: unionDesCoursVus(coursVus.parClasse, classesDesEleves.get(eleveId) ?? []),
      })
      if (pose.motifNonServi) {
        bilan.nonServis.push({ eleveId, motif: pose.motifNonServi })
      } else {
        bilan.elevesServis += 1
      }
      bilan.exercicesPoses += pose.exercicesPoses
      bilan.decisionsEcrites += pose.decisionsEcrites
      bilan.depotsPoses += pose.depotsPoses
      bilan.sondesPosees += pose.sondesPosees
      if (pose.listeVide) bilan.sansCibleCiblable += 1
      if (pose.vivierVide) bilan.viviersVides += 1
      if (pose.ecart) bilan.ecartsAuPlancher.push({ eleveId, ...pose.ecart })
      for (const e of pose.ecartsDuVivier) {
        bilan.ecartsDuVivier[e.motif] = (bilan.ecartsDuVivier[e.motif] ?? 0) + 1
      }
      bilan.erreurs.push(...pose.erreurs)
    } catch (e) {
      // « Une lecture ratée n'est pas une base vide » : on remonte, on ne tait pas.
      bilan.erreurs.push(`${eleveId.slice(0, 8)} : ${(e as Error).message}`)
      bilan.nonServis.push({ eleveId, motif: `incident : ${(e as Error).message}` })
    }
  }

  // ── LES MINUTES DU CYCLE PRÉCÉDENT — sur LA LIGNE QU'ON TROUVE ───────────
  const m = await remplirLesMinutes(admin, cycleDesMinutes, eleves, inscriptionsParEleve)
  bilan.minutesRemplies = m.remplies
  bilan.minutesSansLigne = m.sansLigne
  bilan.budgetsRefuses = m.budgetsRefuses
  bilan.erreurs.push(...m.erreurs)

  if (bilan.exercicesPoses === 0 && bilan.motif === null) {
    bilan.motif = bilan.viviersVides === bilan.elevesAttendus
      ? 'aucun élève n\'a de vivier : le professeur n\'a pas encore d\'instance servable '
        + '(rattachement au cours, position de lecture, parcours). Rien à SERVIR.'
      : bilan.sansCibleCiblable === bilan.elevesAttendus
        ? 'aucune compétence ciblable : R0 exige `evaluee` ET une lettre non nulle. '
          + 'Rien à POSER — et le solde de la semaine revient à la voie mixte.'
        : 'aucun exercice posé — voir les écarts du vivier et les élèves non servis.'
  }
  return bilan
}

function unionDesCoursVus(
  parClasse: ReadonlyMap<string, Set<string>>, classeIds: readonly string[],
): Set<string> {
  const out = new Set<string>()
  for (const c of classeIds) for (const x of parClasse.get(c) ?? []) out.add(x)
  return out
}

async function lirePopulation(admin: Admin, erreurs: string[]): Promise<string[]> {
  const { data: classes, error } = await admin
    .from('classes').select('id').eq('statut', 'active')
  if (error) { erreurs.push(`classes : ${error.message}`); return [] }
  const classeIds = ((classes ?? []) as Array<{ id: string }>).map((c) => c.id)
  if (classeIds.length === 0) return []
  try {
    const inscr = await lirePagine<{ eleve_id: string; classe_id: string }>(
      admin, 'inscriptions', 'eleve_id, classe_id', ['classe_id', 'eleve_id'],
      (q) => (q as never as { eq: (a: string, b: string) => { in: (a: string, b: string[]) => unknown } })
        .eq('statut', 'active').in('classe_id', classeIds))
    // ⛔ DÉDOUBLONNÉE : un élève inscrit dans DEUX classes ne fait qu'une semaine.
    return [...new Set(inscr.map((i) => i.eleve_id))]
  } catch (e) {
    erreurs.push(`inscriptions : ${(e as Error).message}`)
    return []
  }
}

// ════════════════════════════════════════════════════════════════════════════
// UNE SEMAINE, UN ÉLÈVE
// ════════════════════════════════════════════════════════════════════════════

export interface ContextePose {
  eleveId: string
  cycleLundi: string
  segment: Segment
  /** La découpe du Calendrier — `p` s'y lit, « donc identique pour tous ». */
  decoupe: DecoupeEnSegments
  /** `02-` §3 — la table des modes admis, LUE À LA DOCTRINE. */
  modesAdmis: Record<string, string[]>
  fuseau: string
  maintenant: string
  echeance: string
  instances: Awaited<ReturnType<typeof lireLesInstances>>['instances']
  positions: Map<string, number | null>
  dejaDeposees: Set<string>
  inscriptions: Awaited<ReturnType<typeof lireLesInscriptions>>
  coursVus: Set<string>
}

interface PoseDUnEleve {
  motifNonServi: string | null
  listeVide: boolean
  vivierVide: boolean
  exercicesPoses: number
  decisionsEcrites: number
  depotsPoses: number
  sondesPosees: number
  ecart: { manque: number; assignees: number; plancher: number } | null
  ecartsDuVivier: EcartDuVivier[]
  erreurs: string[]
}

// ════════════════════════════════════════════════════════════════════════════
// LA COMPOSITION D'UN ÉLÈVE — l'état, le vivier et la liste de priorité
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ CE QUE LA POSE HEBDOMADAIRE ET LE PULL DE C6-L3 PARTAGENT, MOT POUR MOT.
 *
 * La phase A (le pool) et la couche 4 (le vivier) ne dépendent d'AUCUN des deux
 * appelants : « tout se décide à la construction du cycle » (`01-` §5), et le
 * pull sert « le suivant dans l'ordre que LA PHASE B AURAIT PRODUIT » — donc
 * depuis la MÊME liste de priorité, le MÊME vivier et le MÊME état.
 *
 * ⛔ Extrait de `poserLaSemaineDUnEleve` par C6-L3, et pour une raison précise :
 *    le pull avait besoin de ces quatre-vingts lignes, et les recopier en aurait
 *    fait un SECOND DOMICILE de l'ordre des phases. « Si une règle est réécrite
 *    ici, le lot a échoué » vaut aussi pour l'orchestration qui les appelle.
 *
 * ⚠️ `hasard` SE REÇOIT EN PARAMÈTRE, et ce n'est pas un confort de test. La pose
 *    hebdomadaire prend `Math.random` ; le pull prend un hasard DÉTERMINISTE par
 *    (élève × cycle × rang) — c'est ce qui fait que deux clics concurrents
 *    élisent LE MÊME exercice, et que `uk_depots_eleve_exercice` devient la garde
 *    mécanique du double clic (`utils/routeur/bonus.ts`).
 */
export interface CompositionDUnEleve {
  budget: ReturnType<typeof budgetDeLEleve>
  /** ⛔ Le piège de la vacuité : non nul = cet élève ne reçoit RIEN, et on le DIT. */
  motifNonServi: string | null
  vivier: { retenus: InstanceRetenue[]; ecartes: EcartDuVivier[] }
  listeComplete: EntreeDePriorite[]
  /** Ce que la liste de priorité a écarté — journalisé sur la décision. */
  journalPriorite: unknown
  /** `01-` §6, R1 — l'Expression prend EN PLUS une secondaire à C, sur `produire`. */
  expressionEnSecondaire: boolean
  /** Le palier de chaque compétence, tel que LA COLONNE le porte (l'état, pas l'affichage). */
  paliers: Map<Competence, Lettre>
  /** Ce que la phase A a construit par compétence — la phase C s'en sert pour ses sondes. */
  etats: EtatPourCiblage[]
  escalades: Awaited<ReturnType<typeof lireLesEscalades>>
  mesures: Awaited<ReturnType<typeof lireLesMesures>>
  /** Le journal du tirage, à passer tel quel à `lignesDeDecision`. */
  journal: ReturnType<typeof journalDuTirage>
}

export async function composerPourUnEleve(
  admin: Admin, c: ContextePose, hasard: () => number = Math.random,
): Promise<CompositionDUnEleve> {
  const profil = await lireLeProfil(admin, c.eleveId)
  const budget = budgetDeLEleve(c.inscriptions, profil.reglage)
  if (!budget.budget) {
    // ⛔ LE PIÈGE DE LA VACUITÉ, condition de recette du `07-` §1.3 : « un élève
    //    dont aucune inscription active ne porte de parcours ne reçoit AUCUN
    //    exercice routé, ET LE PROFESSEUR EN EST AVERTI ». Jamais un service
    //    silencieusement réduit aux seuls types génériques.
    return {
      budget,
      motifNonServi: budget.avertissements.join(' ')
        || `non servi (${budget.motifNonServi ?? 'motif inconnu'}).`,
      vivier: { retenus: [], ecartes: [] },
      listeComplete: [], journalPriorite: null, expressionEnSecondaire: false,
      paliers: new Map(), etats: [], escalades: new Map(), mesures: [],
      journal: journalDuTirage(hasard),
    }
  }

  // ── L'ÉTAT, LU UNE FOIS ──────────────────────────────────────────────────
  const [mesures, niveaux, escalades, decisions] = await Promise.all([
    lireLesMesures(admin, c.eleveId),
    lireLesNiveaux(admin, c.eleveId),
    lireLesEscalades(admin, c.eleveId),
    lireLesDecisions(admin, c.eleveId),
  ])
  const optOut = await lireLOptOut(admin, c.inscriptions.map((i) => i.classeId))
  const historique = historiqueDesCibles(decisions)
  const journal = journalDuTirage(hasard)

  // ── PA1 — la proportion des modes, EN TÊTE, parce qu'elle est une ENTRÉE ──
  //    des règles de ciblage : « R2 lit le groupe qu'elle réclame pour choisir
  //    le signal sur lequel il élit » (`01-` §5, §7).
  const p = fractionDeLAnnee(c.decoupe, c.cycleLundi)
  const etats: EtatPourCiblage[] = []
  const paliers = new Map<Competence, Lettre>()
  for (const n of niveaux) {
    const siennes = parDate(mesures.filter((m) => m.competence === n.competence))
    const comptent = mesuresQuiComptent(siennes, n.statutRecettePoseLe)
    const verdict = jugerLaLettre(n, comptent, { cyclesDepuis: () => 0 })
    const q = partsDesGroupes(comptent)
    // ⛔ La table des modes admis (`02-` §3) BORNE, et elle a UN domicile : la
    //    doctrine, `competences_modes_admis`. La recopier ici en ferait un second.
    const controles = controlesDeLaCompetence(n.competence,
      c.modesAdmis[n.competence] ?? [], q.receptif, q.interroger, p)
    const signal = signalDeCiblage(comptent, controles.groupeReclame, verdict.valeurNonPlafonnee)
    paliers.set(n.competence, n.lettre)
    etats.push({
      competence: n.competence,
      // ⛔ Une compétence désactivée par TOUTES les classes de l'élève sort du
      //    ciblage — « le routeur la LIT, il ne l'écrit pas » (`07-` §1.3).
      statutRecette: optOut.has(n.competence) ? 'differee' : n.statutRecette,
      // ⭐ LA LETTRE EST CELLE DE LA COLONNE — l'état, pas l'affichage. C'est
      //    elle que R0 lit, et c'est le second verrou de ce lot.
      lettre: n.lettre,
      signal: signal.signal,
      valeurNonPlafonnee: verdict.valeurNonPlafonnee,
      enEntretienN3: (escalades.get(n.competence) ?? []).some((e) => e.degre === 'N3'),
      // `01-` §5, PA3 — « progression au sens du §8 : au moins un observable
      // passe à acquis ». Sans instrument branché, on ne l'affirme pas.
      aProgresse: false,
    })
  }

  // ── LE VIVIER — le premier geste, et il commande les trois autres ─────────
  const vivier = constituerLeVivier(c.instances, {
    parcours: budget.parcours,
    coursVus: c.coursVus,
    positionsDeLecture: c.positions,
    instancesDejaDeposees: c.dejaDeposees,
    // ⭐ L'UNION de ses inscriptions ACTIVES — la même lecture que les parcours
    //   et les cours vus. Un bi-classe reçoit ce qui est donné à l'une OU à
    //   l'autre ; l'instance sans classe revient à tout le monde.
    classesDeLEleve: new Set(c.inscriptions.map((i) => i.classeId)),
  })

  // ── PA2 et PA3 — la liste de priorité, construite UNE SEULE FOIS ─────────
  const nombreDeMesures = (comp: Competence) =>
    mesures.filter((m) => m.competence === comp && !m.sondeMontee).length
  const evaluees = etats.filter((e) => e.statutRecette === 'evaluee').length
  const { liste, journal: journalPriorite } = listeDePriorite(etats, {
    segment: c.segment,
    parcours: budget.parcours,
    historique,
    lettreExpression: etats.find((e) => e.competence === 'expression')?.lettre ?? null,
    exceptionExpression: profil.exceptionExpression,
    cyclesSansProgresExpression: 0,
    palierSynthese: etats.find((e) => e.competence === 'synthese')?.lettre ?? null,
    cyclesDepuisR3: await cyclesDepuisR3(admin, c.eleveId, c.cycleLundi),
    K: KdeR5(exercicesParCycle(decisions, vivier.retenus, budget.budget.plafond), evaluees),
    tirer: journal.tirerUnNombre('R3'),
    nombreDeMesures,
  })
  const listeComplete: EntreeDePriorite[] = [...liste]
  const pa3 = secondeInscriptionPA3(liste, etats)
  if (pa3) listeComplete.push(pa3)

  return {
    budget,
    motifNonServi: null,
    vivier,
    listeComplete,
    journalPriorite,
    expressionEnSecondaire: (journalPriorite.R1 as { secondaireSurProduire?: boolean })
      ?.secondaireSurProduire === true,
    paliers,
    etats,
    escalades,
    mesures,
    journal,
  }
}

async function poserLaSemaineDUnEleve(admin: Admin, c: ContextePose): Promise<PoseDUnEleve> {
  const out: PoseDUnEleve = {
    motifNonServi: null, listeVide: false, vivierVide: false, exercicesPoses: 0,
    decisionsEcrites: 0, depotsPoses: 0, sondesPosees: 0, ecart: null, ecartsDuVivier: [],
    erreurs: [],
  }

  // ⭐ L'ÉTAT, LE VIVIER ET LA LISTE — partagés avec le pull de C6-L3, et lus
  //   par la MÊME fonction : « le suivant dans l'ordre que la phase B aurait
  //   produit » n'a de sens que si les deux partent du même pool.
  const compo = await composerPourUnEleve(admin, c)
  const { budget, vivier, listeComplete, journalPriorite, expressionEnSecondaire,
    paliers, etats, escalades, mesures, journal } = compo
  out.ecartsDuVivier = vivier.ecartes
  out.vivierVide = vivier.retenus.length === 0
  if (compo.motifNonServi || !budget.budget) {
    // ⛔ LE PIÈGE DE LA VACUITÉ, condition de recette du `07-` §1.3 : « un élève
    //    dont aucune inscription active ne porte de parcours ne reçoit AUCUN
    //    exercice routé, ET LE PROFESSEUR EN EST AVERTI ».
    out.motifNonServi = compo.motifNonServi
    return out
  }
  out.listeVide = listeComplete.length === 0

  // ── PHASE B — la pose ────────────────────────────────────────────────────
  // ⭐ LE QUATRIÈME CANAL DE TIRAGE. Les trois autres — `R3`, `sondes`,
  //   `phase_c` — étaient branchés depuis C4-L12 ; `phase_b` manquait, et c'est
  //   lui qui disperse les exercices entre deux élèves de même profil.
  const semaine = poserLaSemaine(listeComplete, budget.budget,
    (comp, dejaPoses) => candidatsPour(vivier.retenus, comp, dejaPoses, expressionEnSecondaire),
    journal.tirer<string>('phase_b'))
  out.exercicesPoses = semaine.exercices.length
  if (semaine.ecart.souSLePlancher) {
    out.ecart = { manque: semaine.ecart.manque, assignees: semaine.minutesAssignees,
      plancher: semaine.ecart.minutesPlancher }
  }
  if (semaine.exercices.length === 0) return out

  // ── PHASE C — les sondes, LA SEMAINE ENTIÈRE EN MAIN ─────────────────────
  const candidates: CandidateSonde[] = etats.map((e) => {
    const siennes = mesures.filter((m) => m.competence === e.competence && !m.sondeMontee)
    const derniere = parDate(siennes)[siennes.length - 1]
    return {
      competence: e.competence,
      statutRecette: e.statutRecette,
      lettreAffichee: e.lettre,
      enEntretienN3: e.enEntretienN3,
      delaiMesures: derniere?.delaiMesures ?? null,
      delaiJours: derniere?.delaiJours ?? null,
      semainesDepuisVerification: derniere
        ? Math.floor((Date.parse(c.maintenant) - Date.parse(derniere.mesureAt)) / (7 * 86_400_000))
        : null,
    }
  })
  const ordre = ordonnerLesSondes(candidates, journal.tirer<Competence>('sondes'))
  const sondes = poserLesSondes(ordre, substratsDeLaSemaine(semaine.exercices, vivier.retenus),
    journal.tirer<string>('phase_c'))
  out.sondesPosees = sondes.posees.length

  // ── LA PERSISTANCE ───────────────────────────────────────────────────────
  const lignes = lignesDeDecision(semaine.exercices, sondes.posees as SondePosee[],
    vivier.retenus, {
      eleveId: c.eleveId,
      cycleLundi: c.cycleLundi,
      etatEscalade: journaliserLEscalade(escalades, c.maintenant),
      tirages: journal.journal,
      paliers,
      alternatives: journalPriorite,
    })
  const ecrites = await persister(admin, lignes, c)
  out.decisionsEcrites = ecrites.decisions
  out.depotsPoses = ecrites.depots
  out.erreurs.push(...ecrites.erreurs)
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// PERSISTER — la décision, PUIS le dépôt qui la porte
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐⭐ `exercices_depots.routeur_decision_id` — CINQ MODULES LE LISENT, ET RIEN
 * NE L'A JAMAIS ÉCRIT : les deux écrans du routeur, la métacognition de la
 * passation, le contexte de la chaîne et la mesure du déroulé. « UN DÉPÔT, UNE
 * DÉCISION » : c'est ce lien, et lui seul, qui fait qu'un dépôt retrouve sa cible.
 *
 * ⛔ `assigne_at` NE SE RÉÉCRIT JAMAIS — c'est lui qui FIGE la semaine d'assiduité
 *    d'un dépôt (`07-` §1.1, posé par C4-L13). On n'INSÈRE donc que les lignes
 *    manquantes ; aucun `upsert` ne repose `statut` ni `assigne_at`.
 * ⛔ `origine = 'routeur'` : c'est ce qui distingue les deux voies DANS LES MÊMES
 *    TABLES, et la colonne est sous `check (origine in ('routeur','prof'))`.
 */
async function persister(
  admin: Admin, lignes: readonly LigneDeDecision[], c: ContextePose,
): Promise<{ decisions: number; depots: number; erreurs: string[] }> {
  const erreurs: string[] = []
  let decisions = 0
  let depots = 0

  // Les dépôts que l'élève porte DÉJÀ sur ces instances — on n'en repose aucun.
  const { data: existants } = await admin.from('exercices_depots')
    .select('exercice_id').eq('eleve_id', c.eleveId)
    .in('exercice_id', lignes.map((l) => l.exercice_id))
  const deja = new Set(((existants ?? []) as Array<{ exercice_id: string }>)
    .map((x) => x.exercice_id))

  for (const l of lignes) {
    const { data, error } = await admin.from('routeur_decisions').insert(l).select('id').single()
    if (error || !data) {
      console.error(`[moteur] DÉCISION PERDUE — élève=${l.eleve_id} exercice=${l.exercice_id}`,
        { code: error?.code, message: error?.message, details: error?.details })
      erreurs.push(`décision ${l.exercice_id.slice(0, 8)} : ${error?.message ?? 'aucune ligne'}`)
      continue
    }
    decisions += 1
    if (deja.has(l.exercice_id)) {
      erreurs.push(`dépôt ${l.exercice_id.slice(0, 8)} : l'élève en porte déjà un — non reposé `
        + '(`assigne_at` ne se réécrit jamais).')
      continue
    }
    const { error: eD } = await admin.from('exercices_depots').insert({
      eleve_id: c.eleveId,
      exercice_id: l.exercice_id,
      origine: 'routeur',
      routeur_decision_id: (data as { id: string }).id,
      // ⭐⭐ `assigne_at` SE POSE, IL NE SE LAISSE PAS AU DÉFAUT — trouvé par la
      //    recette du 24/08, et c'est un vrai défaut. « LE RATTACHEMENT D'UN
      //    DÉPÔT À SA SEMAINE SE DÉRIVE D'`assigne_at`, ET IL N'A PAS DE
      //    COLONNE » (`07-` §1.1, posé par C4-L13) : laissé au `default now()`,
      //    un dépôt posé pour le cycle W mais écrit un autre jour tomberait dans
      //    la semaine d'assiduité du JOUR D'ÉCRITURE, pas dans la sienne — et
      //    `exercices_assignes` resterait à 0, ce qui se lit « semaine faite par
      //    construction ». On l'ancre donc DANS le cycle posé.
      // ⚠️ MIDI UTC, et pas minuit : « les INSTANTS se lisent dans le fuseau » —
      //    à minuit UTC, un lundi UTC est encore le DIMANCHE à Toronto, et le
      //    dépôt ouvrirait la semaine PRÉCÉDENTE. Midi tient dans les deux
      //    régimes, heure d'hiver comprise.
      // ⛔ Posé À L'INSERT, et jamais réécrit ensuite : « un `upsert` qui
      //    reposerait `statut` et `assigne_at` ferait repasser à `assigne` un
      //    élève déjà à `v1_remis`, et l'assiduité le recompterait ».
      assigne_at: `${c.cycleLundi}T12:00:00Z`,
      echeance: `${c.echeance}T23:59:59Z`,
    })
    if (eD) {
      console.error(`[moteur] DÉPÔT PERDU — élève=${c.eleveId} exercice=${l.exercice_id}`,
        { code: eD.code, message: eD.message, details: eD.details })
      erreurs.push(`dépôt ${l.exercice_id.slice(0, 8)} : ${eD.message}`)
    } else {
      depots += 1
    }
  }
  return { decisions, depots, erreurs }
}

// ════════════════════════════════════════════════════════════════════════════
// LES MINUTES — « la ligne qu'il TROUVE », et le décalage d'un tour
// ════════════════════════════════════════════════════════════════════════════

async function remplirLesMinutes(
  admin: Admin, cycle: string, eleves: readonly string[],
  inscriptions: ReadonlyMap<string, Awaited<ReturnType<typeof lireLesInscriptions>>>,
): Promise<{ remplies: number; sansLigne: number
    budgetsRefuses: Array<{ eleveId: string; motif: string }>; erreurs: string[] }> {
  const erreurs: string[] = []
  const budgetsRefuses: Array<{ eleveId: string; motif: string }> = []
  let remplies = 0
  let sansLigne = 0

  // Les décisions du cycle À REMPLIR — « tu les retrouves dans TON PROPRE
  // JOURNAL ». Les durées, elles, viennent de la doctrine, jamais d'une valeur
  // recopiée : `duree_exercice_min` ne se saisit jamais à la main.
  let decisions: Array<{ eleve_id: string; exercice_id: string | null }>
  try {
    decisions = await lirePagine<{ eleve_id: string; exercice_id: string | null }>(
      admin, 'routeur_decisions', 'eleve_id, exercice_id, id', ['id'],
      (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq('cycle_lundi', cycle))
  } catch (e) {
    erreurs.push(`décisions du cycle ${cycle} : ${(e as Error).message}`)
    return { remplies: 0, sansLigne: 0, budgetsRefuses, erreurs }
  }
  if (decisions.length === 0) {
    return { remplies: 0, sansLigne: 0, budgetsRefuses, erreurs }
  }

  const dureesParExercice = await dureesDesExercices(admin,
    decisions.map((d) => d.exercice_id).filter((x): x is string => !!x))

  const charges: Array<{ eleveId: string; charge: ReturnType<typeof chargeDeMinutes>['charge'] }> = []
  for (const eleveId of eleves) {
    const siennes = decisions.filter((d) => d.eleve_id === eleveId)
    if (siennes.length === 0) continue
    const profil = await lireLeProfil(admin, eleveId).catch(() => null)
    const budget = budgetDeLEleve(inscriptions.get(eleveId) ?? [], profil?.reglage ?? null)
    const minutes = minutesAssignees(
      siennes.map((d) => (d.exercice_id ? dureesParExercice.get(d.exercice_id) ?? null : null)))
    const { charge, budgetEcarte } = chargeDeMinutes(minutes, budget.budget)
    if (budgetEcarte) budgetsRefuses.push({ eleveId, motif: budgetEcarte })
    charges.push({ eleveId, charge })
  }

  // ⛔ `.update()`, JAMAIS `.upsert()` : « un `update` touche 0 ligne quand elle
  //    n'existe pas, ce qui est LITTÉRALEMENT la ligne qu'il trouve ».
  //    Et jamais en lot : un envoi groupé unifierait ses colonnes.
  for (const groupe of grouperParFormeDeCle(charges)) {
    try {
      verifierLaChargeDeMinutes(groupe.map((g) => g.charge))
    } catch (e) {
      erreurs.push(`charge de minutes refusée : ${(e as Error).message}`)
      continue
    }
    for (const g of groupe) {
      const { data, error } = await admin.from('assiduite_hebdo')
        .update(g.charge).eq('eleve_id', g.eleveId).eq('cycle_lundi', cycle).select('eleve_id')
      if (error) {
        console.error(`[moteur] MINUTES PERDUES — élève=${g.eleveId} cycle=${cycle}`,
          { code: error.code, message: error.message, details: error.details })
        erreurs.push(`minutes de ${g.eleveId.slice(0, 8)} : ${error.message}`)
      } else if ((data ?? []).length === 0) {
        // ⭐ CE N'EST PAS UNE ERREUR : c'est la garde qui tient. La collecte n'a
        //    pas encore posé cette ligne — « il remplit LA LIGNE QU'IL TROUVE ».
        sansLigne += 1
      } else {
        remplies += 1
      }
    }
  }
  return { remplies, sansLigne, budgetsRefuses, erreurs }
}

export async function dureesDesExercices(
  admin: Admin, exerciceIds: readonly string[],
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>()
  const ids = [...new Set(exerciceIds)]
  if (ids.length === 0) return out
  const { data } = await admin.from('exercices')
    .select('id, cran, type_id, exercices_types!inner(code)').in('id', ids)
  type L = { id: string; cran: number | null; type_id: string }
  const lignes = (data ?? []) as unknown as L[]
  const { data: durees } = await admin.from('exercices_types_crans')
    .select('type_id, cran, duree_exercice_min')
    .in('type_id', [...new Set(lignes.map((l) => l.type_id))])
  const parCle = new Map<string, number>()
  for (const d of (durees ?? []) as Array<{ type_id: string; cran: number
    duree_exercice_min: number }>) {
    parCle.set(`${d.type_id}|${d.cran}`, d.duree_exercice_min)
  }
  for (const l of lignes) {
    out.set(l.id, l.cran === null ? null : parCle.get(`${l.type_id}|${l.cran}`) ?? null)
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// LES PETITES DÉRIVÉES — chacune cite ce qu'elle sert
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §7 — « `p`, LA FRACTION DE L'ANNÉE PARCOURUE, que LE CALENDRIER DONNE —
 * donc identique pour tous les élèves ».
 *
 * ⚠️ « L'ANNÉE COURT À PARTIR DU SEGMENT 3 » : `profil_provisoire` tient jusqu'à
 *    la clôture du segment 2, et les compteurs ne démarrent que là. La période
 *    est donc l'union des segments 3, 4 et 5 — celle que la découpe donne, et
 *    rien d'autre. Avant le segment 3, `p` vaut 0 et le contrôle de trajectoire
 *    ne force rien : c'est le comportement voulu.
 */
function fractionDeLAnnee(decoupe: DecoupeEnSegments, cycleLundi: string): number {
  const periode = decoupe.segments
    .filter((s) => s.segment >= 3)
    .flatMap((s) => s.semaines.map((w) => w.dateDebutLundi))
    .sort()
  if (periode.length === 0) return 0
  const i = periode.indexOf(cycleLundi)
  if (i < 0) return cycleLundi < periode[0] ? 0 : 1
  return i / periode.length
}

/** `01-` §7, étage 1 — la part des mesures qui portent un mode de chaque groupe. */
function partsDesGroupes(
  comptent: readonly { modes: string[] }[],
): { receptif: number; interroger: number } {
  if (comptent.length === 0) return { receptif: 0, interroger: 0 }
  const receptifs = ['restituer', 'expliquer', 'évaluer']
  const r = comptent.filter((m) => m.modes.some((x) => receptifs.includes(x))).length
  const i = comptent.filter((m) => m.modes.includes('interroger')).length
  return { receptif: r / comptent.length, interroger: i / comptent.length }
}

/**
 * `01-` §6, R3 — « **d**, le nombre de cycles écoulés depuis la DERNIÈRE
 * INSERTION ». ⚠️ Une insertion de R3 se lit sur `regle_declenchee`, **jamais
 * sur la cible** : la Synthèse peut aussi être ciblée par R5 ou par la
 * calibration, et compter ces cycles-là remettrait la dette à zéro sans que R3
 * ait jamais joué.
 */
async function cyclesDepuisR3(
  admin: Admin, eleveId: string, cycleLundi: string,
): Promise<number> {
  const { data } = await admin.from('routeur_decisions')
    .select('cycle_lundi').eq('eleve_id', eleveId).eq('regle_declenchee', 'R3')
    .order('cycle_lundi', { ascending: false }).limit(1)
  const dernier = ((data ?? []) as Array<{ cycle_lundi: string }>)[0]?.cycle_lundi
  // Jamais insérée : la dette est maximale, et `probabiliteR3` la plafonne à 1.
  if (!dernier) return Number.MAX_SAFE_INTEGER / 2
  return Math.max(0, Math.round(
    (Date.parse(`${cycleLundi}T00:00:00Z`) - Date.parse(`${dernier}T00:00:00Z`))
    / (7 * 86_400_000)))
}

/**
 * `01-` §6, R5 — « K ≈ LE NOMBRE D'EXERCICES QUE TROIS CYCLES PRODUISENT ».
 * ⚠️ « La formule NE S'INSTANCIE PAS EN UN NOMBRE, et c'est délibéré : ELLE SE
 *    REMPLIT D'ELLE-MÊME. » On lui donne donc ce que le dispositif a RÉELLEMENT
 *    produit ; à défaut, ce que le budget et les durées du vivier permettent.
 */
function exercicesParCycle(
  decisions: readonly { cycleLundi: string }[],
  vivier: readonly InstanceRetenue[],
  plafond: number,
): number {
  const parCycle = new Map<string, number>()
  for (const d of decisions) parCycle.set(d.cycleLundi, (parCycle.get(d.cycleLundi) ?? 0) + 1)
  const pleins = [...parCycle.values()].filter((n) => n > 0)
  if (pleins.length) return Math.round(pleins.reduce((a, b) => a + b, 0) / pleins.length)
  const durees = vivier.map((r) => r.instance.dureeMin ?? 0).filter((d) => d > 0)
  if (durees.length === 0) return 1
  const mediane = [...durees].sort((a, b) => a - b)[Math.floor((durees.length - 1) / 2)]
  return Math.max(1, Math.round(plafond / mediane))
}

/** Les six compétences, dans l'ordre du référentiel — pour les bilans. */
export const COMPETENCES_DU_ROUTEUR = COMPETENCES
