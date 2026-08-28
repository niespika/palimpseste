import 'server-only'
// ============================================================================
// C6 · L3 — LE PULL : l'élève demande UN exercice de plus, et il le REÇOIT.
// ----------------------------------------------------------------------------
// ⛔⛔ C'EST LA PREMIÈRE ÉCRITURE DE DÉPÔT DÉCLENCHÉE PAR UN ÉLÈVE DANS TOUT LE
//    DÉPÔT. Avant ce lot, `exercices_depots` n'avait que deux écrivains — la
//    voie du routeur (`cycle-serveur.ts`) et la voie du professeur
//    (`app/prof/conception/actions.ts`) —, et les deux partaient d'un geste
//    d'adulte. Trois conséquences, et aucune n'est théorique :
//
//    ⛔ ELLE SE FAIT CÔTÉ SERVEUR, PAR LE CLIENT ADMIN, avec l'identité vérifiée
//       DANS LE CODE. « Lecture élève : ses propres lignes, strictement ; TOUTES
//       LES ÉCRITURES PASSENT PAR LE SERVEUR » (`07-` §1). ⛔ AUCUNE policy élève
//       n'est ouverte sur les tables du moteur pour rendre cette écriture plus
//       simple : les 39 tables en portent zéro, et ce lot n'en ajoute aucune.
//       Le rôle se vérifie chez l'appelant (`garderEleveDeroule`), et « le client
//       admin qui suit CONTOURNE LA RLS : sans ce contrôle, la seule chose qui
//       distinguerait un élève d'un professeur serait l'URL ».
//
//    ⛔⛔ LE DOUBLE CLIC. Deux appels concurrents serviraient deux exercices sur
//       un quota d'un. La garde est MÉCANIQUE et elle existe déjà en base —
//       `uk_depots_eleve_exercice UNIQUE (eleve_id, exercice_id)` —, sur le
//       patron du `07-` §1.1 : « l'insertion EST le claim ; la seconde perd
//       AVANT d'avoir rien écrit, et aucun `UPDATE` conditionnel n'est
//       nécessaire ». ⭐ Elle ne mord que si les deux appels élisent LE MÊME
//       exercice : c'est ce que le TIRAGE DÉTERMINISTE garantit
//       (`utils/routeur/bonus.ts`). Et l'ordre « décision PUIS dépôt » ferme le
//       dernier entrelacement : si le dépôt d'un concurrent est visible, sa
//       décision l'est aussi, donc son quota est compté.
//
//    ⚠️ `supabase-js` NE LÈVE PAS — il rend `{ error }`. Une écriture ratée
//       n'est pas « rien à servir » : elle SE DIT (`motif: 'incident'`), plutôt
//       que de laisser un écran affirmer « tu n'as plus de bonus ».
//
// ⛔ ET IL NE REJOUE PAS LA SEMAINE. « Tout se décide à la construction du
//    cycle… aucune mesure du cycle en cours n'alimente sa propre construction »
//    (`01-` §5) : ce pull sert LE SUIVANT, il ne recompose rien.
//
// ⛔ AUCUNE SONDE SECONDAIRE SUR UN BONUS — `bonusNePortePasDeSonde()`, et le
//    geste est de NE PAS appeler `poserLesSondes`. « La phase C a placé les
//    siennes à la construction, QUAND IL N'EXISTAIT PAS » (`01-` §5).
//    ⚠️ La sonde de MONTÉE, elle, reste : elle est dans la case choisie en phase
//       A et elle vit sur l'exercice lui-même — `sondesDeLExercicePose` la pose
//       toute seule, et c'est juste.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { lireLaPorte } from '@/utils/deroule/acces'
import { lireLeProfil, lireLesInscriptions } from '@/utils/routeur/donnees'
import { budgetDeLEleve } from '@/utils/routeur/budget'
import { chargerDoctrineDepuisBase } from '@/utils/fabrique/doctrine'
import { poserLaSemaine, type Candidat, type ExercicePose } from '@/utils/routeur/semaine'
import {
  graineDuPull, hasardDeterministe, phraseDuRefus, quotaOptionnel,
  type MotifDuRefus, type QuotaOptionnel,
} from '@/utils/routeur/bonus'
import type { Competence } from '@/utils/routeur/types'
import { lireLesSegments, segmentDuCycle } from './calendrier-serveur'
import { candidatsPour, type InstanceDuVivier } from './vivier'
import {
  lireLesCoursVus, lireLesInstances, lireLesInstancesDejaDeposees, lireLesPositionsDeLecture,
} from './vivier-serveur'
import { lignesDeDecision } from './decision'
import { composerPourUnEleve, dureesDesExercices, type ContextePose } from './cycle-serveur'

type Admin = ReturnType<typeof createAdminClient>

// ════════════════════════════════════════════════════════════════════════════
// CE QUE LE PULL REND — jamais un booléen, jamais un silence
// ════════════════════════════════════════════════════════════════════════════

export interface ExerciceServi {
  depotId: string
  exerciceId: string
  decisionId: string
  competence: Competence
  dureeMin: number
}

export interface ResultatDuPull {
  /** Non nul quand un exercice a été servi ET que son dépôt existe en base. */
  servi: ExerciceServi | null
  /** ⛔ Non nul quand rien n'a été servi. Il y a TOUJOURS l'un ou l'autre. */
  motif: MotifDuRefus | null
  /** La phrase que l'écran rend — en langue élève, sans nombre, sans interrupteur. */
  phrase: string
  /** Le quota du cycle, tel qu'il a été lu. `null` quand l'élève n'a pas de budget. */
  quota: QuotaOptionnel | null
  /** ⚠️ Ce qui a raté en chemin. Une lecture tronquée n'est pas « rien à servir ». */
  incidents: string[]
}

function refus(motif: MotifDuRefus, quota: QuotaOptionnel | null = null,
  incidents: string[] = []): ResultatDuPull {
  return { servi: null, motif, phrase: phraseDuRefus(motif), quota, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉTAT DU CYCLE — ce que la semaine a déjà posé, et ce que le bonus a mangé
// ════════════════════════════════════════════════════════════════════════════

interface DecisionDuCycle {
  id: string
  exerciceId: string
  cibleRetenue: Competence | null
  bonus: boolean
  tour: number
}

/**
 * ⭐ LES DÉCISIONS DE CE CYCLE, DANS LEUR ORDRE D'ÉCRITURE — c'est l'ordre où la
 *   phase B les a posées, et PB2 comme PB3 lisent la DERNIÈRE.
 *
 * ⛔ Ce n'est pas un doublon de `lireLesDecisions` (`utils/routeur/donnees.ts`),
 *    qui est délibérément étroite — elle ne rend que la cible et le cycle, parce
 *    que l'historique des cibles n'a besoin de rien d'autre. Le pull, lui, a
 *    besoin de l'EXERCICE et de la MARQUE.
 *
 * ⚠️ `supabase-js` plafonne à 1000 lignes sans rien dire. Une seule semaine d'un
 *    seul élève n'en porte jamais plus d'une poignée — mais le plafond se dit,
 *    pour qu'un lecteur ne suppose pas qu'il a tout.
 */
async function decisionsDuCycle(
  admin: Admin, eleveId: string, cycleLundi: string, incidents: string[],
): Promise<DecisionDuCycle[]> {
  const { data, error } = await admin
    .from('routeur_decisions')
    .select('id, exercice_id, cible_retenue, bonus, alternatives_ecartees')
    .eq('eleve_id', eleveId)
    .eq('cycle_lundi', cycleLundi)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1000)
  if (error) {
    incidents.push(`décisions du cycle : ${error.code} ${error.message}`)
    return []
  }
  type L = {
    id: string; exercice_id: string | null; cible_retenue: string | null
    bonus: boolean | null; alternatives_ecartees: { tour_de_pb5?: number } | null
  }
  return ((data ?? []) as unknown as L[])
    .filter((l) => !!l.exercice_id)
    .map((l) => ({
      id: l.id,
      exerciceId: l.exercice_id as string,
      cibleRetenue: (l.cible_retenue as Competence | null) ?? null,
      bonus: l.bonus === true,
      tour: typeof l.alternatives_ecartees?.tour_de_pb5 === 'number'
        ? l.alternatives_ecartees.tour_de_pb5 : 0,
    }))
}

/**
 * ⭐ RECONSTRUIRE CE QUE LA PHASE B A POSÉ, pour le lui redonner. Les instances
 *   servies sont sorties du vivier (`instancesDejaDeposees`) — on les retrouve
 *   donc dans la liste COMPLÈTE des instances, jamais dans le vivier filtré.
 *
 * ⚠️ Une décision dont l'instance a disparu (`on delete set null`, ou une
 *    instance supprimée) ne se devine pas : elle est SAUTÉE et le dit. La faire
 *    entrer avec une durée inventée fausserait le quota dans le sens qui coûte.
 */
function posesDeLaSemaine(
  decisions: readonly DecisionDuCycle[],
  instances: readonly InstanceDuVivier[],
  incidents: string[],
): ExercicePose[] {
  const parId = new Map(instances.map((i) => [i.exerciceId, i]))
  const out: ExercicePose[] = []
  for (const d of decisions) {
    const inst = parId.get(d.exerciceId)
    if (!inst || inst.dureeMin === null || !d.cibleRetenue) {
      incidents.push(`décision ${d.id.slice(0, 8)} : instance illisible ou sans durée — `
        + 'elle ne compte pas dans la reprise.')
      continue
    }
    const candidat: Candidat = {
      exerciceId: inst.exerciceId,
      competence: d.cibleRetenue,
      grain: inst.grain,
      geste: inst.geste,
      cran: inst.cranCode ?? '',
      mode: (inst.modesParCompetence[d.cibleRetenue] ?? [])[0] ?? '',
      dureeMin: inst.dureeMin,
      ciblesSecondaires: [],
    }
    // ⚠️ `regle`, `departageParPB3` et `tirage` sont INERTES sur une reprise :
    //    la phase B ne les lit jamais sur un déjà-posé — elle lit sa COMPÉTENCE
    //    (PB2), son cran/mode/grain (PB3), sa DURÉE (PB6) et son TOUR (PB5) —, et
    //    seuls les exercices de CETTE passe partent au journal. On ne va donc pas
    //    relire la règle d'origine dans `regle_declenchee` pour la jeter ensuite.
    out.push({ candidat, regle: 'R1', departageParPB3: false, tirage: false, tour: d.tour })
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// LE QUOTA DU CYCLE — la seule lecture que l'écran fait AVANT le clic
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ CE QUE L'OFFRE A BESOIN DE SAVOIR AVANT LE CLIC, ET RIEN DE PLUS.
 *
 * ⛔⛔ LE QUOTA EST UNIFIÉ PAR ÉLÈVE, JAMAIS PAR CLASSE. « Un élève inscrit dans
 *    DEUX CLASSES a UN SEUL budget : le profil est unifié […] il n'a aucune
 *    raison de faire le travail en double » (`01-` §4). C'est une asymétrie
 *    réelle avec l'écran de la semaine, qui, lui, agrège PAR INSCRIPTION : cette
 *    fonction ne prend donc AUCUNE classe en paramètre, et l'appelant ne
 *    l'appelle qu'UNE FOIS.
 *
 * ⛔ ET IL NE SE REPORTE PAS : la consommation se lit sur LE CYCLE COURANT SEUL.
 *    « Les minutes non utilisées sont perdues, sans report ni écrêtage. »
 *
 * ⚠️ Rend `null` quand l'élève n'a AUCUN budget — le piège de la vacuité. Ce
 *    n'est pas « quota épuisé », et cela ne se dit pas pareil à l'écran.
 */
export async function lireLeQuotaDuCycle(
  admin: Admin, eleveId: string, cycleLundi: string, incidents: string[] = [],
): Promise<QuotaOptionnel | null> {
  const [profil, inscriptions] = await Promise.all([
    lireLeProfil(admin, eleveId),
    lireLesInscriptions(admin, eleveId),
  ])
  const budget = budgetDeLEleve(inscriptions, profil.reglage)
  if (!budget.budget) return null

  const decisions = await decisionsDuCycle(admin, eleveId, cycleLundi, incidents)
  const bonusDuCycle = decisions.filter((d) => d.bonus).map((d) => d.exerciceId)
  if (bonusDuCycle.length === 0) return quotaOptionnel(budget.budget.optionnel, 0)

  const durees = await dureesDesExercices(admin, bonusDuCycle)
  // ⚠️ Une durée introuvable ne se remplace pas par zéro EN SILENCE : ce serait
  //    rendre du quota qui a déjà été dépensé. On le dit, et on compte 0 faute de
  //    mieux — le décompte est optimiste, l'incident est explicite.
  const manquantes = bonusDuCycle.filter((id) => (durees.get(id) ?? null) === null)
  if (manquantes.length > 0) {
    incidents.push(`${manquantes.length} bonus du cycle sans durée dérivable : le quota lu est `
      + 'plus large que le quota réel.')
  }
  const consomme = bonusDuCycle.reduce<number>((n, id) => n + (durees.get(id) ?? 0), 0)
  return quotaOptionnel(budget.budget.optionnel, consomme)
}

// ════════════════════════════════════════════════════════════════════════════
// LE PULL
// ════════════════════════════════════════════════════════════════════════════

export interface OptionsDuPull {
  /** Pour la recette seule : passer outre l'interrupteur, ET LE DIRE. */
  forcerHorsAllumage?: boolean
  /** Le nombre de jours d'échéance du dépôt posé. Même défaut que la semaine. */
  joursDEcheance?: number
}

/**
 * ⭐⭐ « L'ÉLÈVE DEMANDE **UN** EXERCICE À LA FOIS », et ce qu'il reçoit est un
 *    exercice NORMAL : même vivier, même liste de priorité, même phase B, même
 *    journal, même dépôt, même déroulé à six temps. La SEULE différence est la
 *    marque `bonus` sur la décision — et l'absence de sonde secondaire.
 *
 * ⛔ « Jamais au-delà » est MÉCANIQUE, pas vérifié à part : le plafond passé à la
 *    phase B vaut `minutes de la semaine + reliquat du quota`, et PB6 fait le
 *    reste. Un second contrôle serait un second domicile de la même borne.
 *
 * ⛔ ET LE QUOTA NE SE REPORTE PAS : `consomme` se lit sur LE CYCLE COURANT
 *    SEUL. « Les minutes non utilisées sont perdues, sans report ni écrêtage. »
 */
export async function servirUnExerciceDePlus(
  admin: Admin, eleveId: string, cycleLundi: string, fuseau: string,
  aujourdHui: string, options: OptionsDuPull = {},
): Promise<ResultatDuPull> {
  const incidents: string[] = []

  // ── LA PORTE — lue ICI, dans le module partagé, jamais au site d'appel ────
  if (!options.forcerHorsAllumage && !(await lireLaPorte(admin)).exercicesActifs) {
    return refus('porte_fermee')
  }

  // ── LE SEGMENT — le routeur ne sert rien au segment 1 ────────────────────
  const decoupe = await lireLesSegments(admin)
  const s = segmentDuCycle(decoupe, cycleLundi)
  incidents.push(...decoupe.incidents)
  // ⛔ « LE SEGMENT 1 EST HORS ROUTAGE — il sert les deux examens diagnostiques
  //    imposés en classe » (`01-` §4). ⚠️ Et il ne se dit PAS comme « rien n'est
  //    ouvert au travail » : c'est la semaine de RENTRÉE, donc le premier refus
  //    que l'élève rencontrera de l'année.
  if (s.segment === null || s.segment === 1) return refus('hors_routage', null, incidents)

  // ── CE QUE LA COUCHE 4 A BESOIN DE LIRE, POUR UN SEUL ÉLÈVE ──────────────
  const doctrine = await chargerDoctrineDepuisBase(admin as never)
  const [{ instances, incidents: iInst }, inscriptions] = await Promise.all([
    lireLesInstances(admin, doctrine),
    lireLesInscriptions(admin, eleveId),
  ])
  incidents.push(...iInst)
  const [positions, dejaDeposees, coursVus] = await Promise.all([
    lireLesPositionsDeLecture(admin, [eleveId]),
    lireLesInstancesDejaDeposees(admin, [eleveId]),
    lireLesCoursVus(admin, inscriptions.map((i) => i.classeId), aujourdHui),
  ])
  incidents.push(...positions.incidents, ...dejaDeposees.incidents, ...coursVus.incidents)

  const maintenant = new Date().toISOString()
  const echeance = toISODate(addDaysUTC(new Date(`${cycleLundi}T00:00:00Z`),
    options.joursDEcheance ?? 6))
  const contexte: ContextePose = {
    eleveId, cycleLundi, segment: s.segment, fuseau, maintenant, echeance,
    decoupe, modesAdmis: doctrine.modesAdmis, instances,
    positions: positions.parEleve.get(eleveId) ?? new Map(),
    dejaDeposees: dejaDeposees.parEleve.get(eleveId) ?? new Set(),
    inscriptions,
    coursVus: unionDesCoursVus(coursVus.parClasse, inscriptions.map((i) => i.classeId)),
  }

  // ── LE CYCLE TEL QU'IL EST — ce qui a été posé, et ce que le bonus a mangé ─
  const decisions = await decisionsDuCycle(admin, eleveId, cycleLundi, incidents)
  const dejaPoses = posesDeLaSemaine(decisions, instances, incidents)
  const bonusDuCycle = decisions.filter((d) => d.bonus).map((d) => d.exerciceId)
  const durees = await dureesDesExercices(admin, bonusDuCycle)
  // ⚠️ On somme SUR LES IDENTIFIANTS demandés, jamais sur les valeurs de la Map :
  //    une instance introuvable n'y a pas d'entrée, et itérer les valeurs
  //    tairait le trou au lieu de le compter à zéro explicitement.
  const minutesBonus = bonusDuCycle.reduce<number>((n, id) => n + (durees.get(id) ?? 0), 0)
  const minutesSemaine = dejaPoses.reduce((n, e) => n + e.candidat.dureeMin, 0)
  const rang = decisions.filter((d) => d.bonus).length

  // ── LE BUDGET ET LE QUOTA — la valeur se règle ailleurs, elle se LIT ici ──
  // ⭐ La graine porte l'élève, le cycle ET le rang : deux clics concurrents
  //   voient le même rang, donc élisent le même exercice ; deux élèves de même
  //   profil ne reçoivent pas le même.
  const compo = await composerPourUnEleve(admin, contexte,
    hasardDeterministe(graineDuPull(eleveId, cycleLundi, rang)))
  if (compo.motifNonServi || !compo.budget.budget) {
    return refus('aucun_budget', null, incidents)
  }
  const quota = quotaOptionnel(compo.budget.budget.optionnel, minutesBonus)
  if (quota.epuise) return refus('quota_epuise', quota, incidents)
  if (compo.listeComplete.length === 0) return refus('liste_vide', quota, incidents)
  if (compo.vivier.retenus.length === 0) return refus('vivier_vide', quota, incidents)

  // ── LA PHASE B, REPRISE — et elle pose UN exercice, au plus ──────────────
  // ⛔ Le plafond passé ici EST la borne du quota : `minutes de la semaine +
  //    reliquat`. PB6 s'arrête dessus, et « jamais au-delà » n'a pas d'autre
  //    domicile.
  const passe = poserLaSemaine(
    compo.listeComplete,
    { ...compo.budget.budget, plafond: minutesSemaine + quota.restant },
    (comp, poses) => candidatsPour(compo.vivier.retenus, comp, poses,
      compo.expressionEnSecondaire),
    compo.journal.tirer<string>('phase_b'),
    { dejaPoses, maxAPoser: 1 },
  )
  const elu = passe.posesDeCettePasse[0]
  // ⚠️ Le quota n'est pas épuisé et pourtant rien ne tient : c'est un troisième
  //    cas, et il ne se dit pas comme les deux autres.
  if (!elu) return refus('ne_tient_pas', quota, incidents)

  // ── LE JOURNAL, PUIS LE DÉPÔT QUI LE PORTE ──────────────────────────────
  // ⛔ AUCUNE SONDE SECONDAIRE : on ne passe aucune sonde de phase C.
  //    `sondesDeLExercicePose` ajoutera d'elle-même la sonde de MONTÉE si la
  //    case servie est au-dessus de la bande du palier — et c'est juste : « à ne
  //    pas confondre avec les sondes de montée, qui sont dans la case choisie en
  //    phase A et qui vivent sur l'exercice lui-même ».
  const [ligne] = lignesDeDecision([elu], [], compo.vivier.retenus, {
    eleveId,
    cycleLundi,
    etatEscalade: { lu_at: maintenant, par_competence: {} },
    tirages: compo.journal.journal,
    paliers: compo.paliers,
    alternatives: compo.journalPriorite,
  })

  const { data: dec, error: eDec } = await admin
    .from('routeur_decisions')
    // ⭐⭐ LA MARQUE, ET C'EST LE SEUL ENDROIT DU DÉPÔT QUI LA POSE.
    //    « Un exercice servi sur ce quota porte la marque `bonus` AU JOURNAL
    //    (§11) » (`01-` §5). La chaîne la relira par
    //    `exercices_depots.routeur_decision_id` et la recopiera sur
    //    `competences_mesures.bonus`.
    .insert({ ...ligne, bonus: true })
    .select('id').single()
  if (eDec || !dec) {
    console.error(`[bonus] DÉCISION PERDUE — élève=${eleveId} exercice=${elu.candidat.exerciceId}`,
      { code: eDec?.code, message: eDec?.message, details: eDec?.details })
    incidents.push(`décision : ${eDec?.message ?? 'aucune ligne'}`)
    return refus('incident', quota, incidents)
  }
  const decisionId = (dec as { id: string }).id

  const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
    eleve_id: eleveId,
    exercice_id: elu.candidat.exerciceId,
    // ⛔ `origine` EST SOUS `CHECK (origine in ('routeur','prof'))` — DEUX
    //    valeurs, pas trois. Un bonus est DEMANDÉ par l'élève mais DÉCIDÉ par le
    //    routeur : c'est `routeur`, et c'est cohérent — « le bonus est un
    //    exercice normal », servi par la phase B. Une troisième valeur serait une
    //    migration ET un troisième régime pour tout ce qui lit `origine`.
    origine: 'routeur',
    routeur_decision_id: decisionId,
    // ⛔⛔ `assigne_at` SE POSE, IL NE SE LAISSE PAS AU DÉFAUT — et pour le pull
    //    l'enjeu est plus vif encore que pour la semaine. « Le rattachement d'un
    //    dépôt à sa semaine se dérive d'`assigne_at`, et il n'a pas de colonne »
    //    (`07-` §1.1). Le pull écrit AU MOMENT DU CLIC : laissé au `default
    //    now()`, un bonus demandé le DIMANCHE SOIR à Toronto (lundi 00 h 30 UTC)
    //    tomberait dans la semaine SUIVANTE — il sortirait du cycle dont il
    //    consomme le quota, et le quota de la semaine suivante s'en trouverait
    //    entamé d'avance.
    // ⭐ On l'ancre donc DANS LE CYCLE SERVI, à MIDI UTC, exactement comme la
    //   pose hebdomadaire : « à minuit UTC, un lundi UTC est encore le DIMANCHE
    //   à Toronto ». Midi tient dans les deux régimes, heure d'hiver comprise.
    assigne_at: `${cycleLundi}T12:00:00Z`,
    echeance: `${echeance}T23:59:59Z`,
  }).select('id').single()

  if (eDep || !dep) {
    // ⭐⭐ LA GARDE DU DOUBLE CLIC A MORDU : `uk_depots_eleve_exercice` a refusé
    //    la seconde insertion (`23505`). L'élève a déjà son exercice — il n'y a
    //    rien à réparer, il y a une phrase à dire.
    // ⛔ ET ON RETIRE LA DÉCISION QU'ON VIENT D'ÉCRIRE. Une décision sans dépôt
    //    gonflerait le journal du routeur d'une ligne qui n'a servi personne, et
    //    « l'historique des cibles se lit sur `routeur_decisions` » : elle
    //    fausserait R5 et PB2 au cycle suivant. On ne supprime que LA ligne
    //    qu'on vient de créer, et on le dit si on n'y arrive pas.
    const { error: eNet } = await admin.from('routeur_decisions').delete().eq('id', decisionId)
    if (eNet) {
      console.error(`[bonus] DÉCISION ORPHELINE — id=${decisionId} : ${eNet.message}`)
      incidents.push(`décision orpheline ${decisionId.slice(0, 8)} : ${eNet.message}`)
    }
    const doublon = (eDep as { code?: string } | null)?.code === '23505'
    if (!doublon) {
      console.error(`[bonus] DÉPÔT PERDU — élève=${eleveId} exercice=${elu.candidat.exerciceId}`,
        { code: eDep?.code, message: eDep?.message, details: eDep?.details })
      incidents.push(`dépôt : ${eDep?.message ?? 'aucune ligne'}`)
    }
    return refus(doublon ? 'un_a_la_fois' : 'incident', quota, incidents)
  }

  return {
    servi: {
      depotId: (dep as { id: string }).id,
      exerciceId: elu.candidat.exerciceId,
      decisionId,
      competence: elu.candidat.competence,
      dureeMin: elu.candidat.dureeMin,
    },
    motif: null,
    phrase: 'Un exercice de plus t’attend.',
    quota: quotaOptionnel(compo.budget.budget.optionnel, minutesBonus + elu.candidat.dureeMin),
    incidents,
  }
}

/** L'union des cours vus des classes d'un élève — un bi-classe en a deux. */
function unionDesCoursVus(
  parClasse: ReadonlyMap<string, Set<string>>, classes: readonly string[],
): Set<string> {
  const u = new Set<string>()
  for (const c of classes) for (const id of parClasse.get(c) ?? []) u.add(id)
  return u
}
