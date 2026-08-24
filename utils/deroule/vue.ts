import 'server-only'
// ============================================================================
// C4 · L3 — CE QUE L'ÉCRAN VOIT : l'assemblage des six temps.
// ----------------------------------------------------------------------------
// Un seul chargeur, un seul aller-retour de lectures, et une vue que le
// composant client ne fait qu'AFFICHER. Rien n'est décidé ici : chaque règle
// vient d'un module pur, et ce fichier ne fait que les appeler dans l'ordre.
//
// ⚠️ **LECTURE ÉLÈVE : SES PROPRES LIGNES, STRICTEMENT** (`07-` §1). Il n'y a
//    **aucune policy élève** sur les tables du moteur — le patron du dépôt est
//    « RLS active partout, policy PROF `for all`, et AUCUNE POLICY ÉLÈVE », plus
//    fermé que « ses propres lignes ». La règle vit donc **dans le code**, et
//    `lireDepotMaison` est le seul point d'entrée : il filtre sur `eleve_id`,
//    exige `lieu = 'maison'` et écarte les dépôts `retire`.
//
// ⚠️ **RIEN DES SQUELETTES NI DE LA MÉTACOGNITION N'EST LISIBLE AVANT LA
//    PUBLICATION DU RETOUR** (`07-` §1 ; piège 42) — « la garde la plus facile à
//    casser et la plus coûteuse : elle donne LA GRILLE ET LES RÉPONSES ». Et
//    `exercices_cas` **porte l'appui, donc la réponse attendue** : ce module ne
//    la sert JAMAIS telle quelle — il n'en sort que les CANDIDATS mêlés de la
//    crédence, et la correction du premier cas d'une paire, qui se sert **après**
//    la première crédence et **avant** le second cas.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { lireContexte, DepotIllisible, type ContexteDepot } from '../chaine/contexte'
import { competencesDeLExercice } from '../chaine/chaine'
import { fenetreDEvidence } from '../chaine/mesures'
import { etatCompetence, valeursDesParametres } from '../chaine/instruments'
import { lireFuseau } from '../fuseau-serveur'
import type { Mesure } from '../routeur/mesure'

import { lireDepotMaison, collagesDuDepot, type DepotMaison } from './depot'
import { regimeDuDeroule, tempsServis, nombreDeCas, credenceDemandee, etapeDeLaPaire,
  type EscaladePesante, type EtapePaire } from './regime'
import { rappelDuTemps1, momentDeLaDemonstration, type Rappel } from './rappel'
import { offreDeCredence, CRANS_GUIDES, type OffreCredence } from './credence'
import { composerLaCorrection, correctionDue, correctionServieAuCran,
  type CorrectionServie } from './correction'
import { phaseServie, candidates, offreSeJugerMaison, verdictDeCalibration,
  type CouvertureTestee, type LigneDeVerdict, type OffreSeJuger } from './juger'
import { choisirLaDemonstration, lireLeContenu,
  type ChoixDeDemonstration, type DemonstrationLue } from './demonstration'
import { dureeIndicativeLisible, dureeReelleMs, microQuestionDue, tagDeDuree } from './duree'
import { echeanceDeLaVersionFinale, finDeSemaineDeTravail } from './echeance'
import { lireReleveDeLangue, nombreDeFautes, ancrerLigneALigne, phraseDeLaChasse,
  type AncrageFaute } from './langue'
import { baliser, type Jeton } from './balisage'
import { attenteDuDepot, type AttenteLisible } from './mesure'
import { pointsContestes, type PointDuRetour } from './contestation'
import { gestesRestants, competencesQuiDemandentLaConfiance } from './gestes'
import type { ActeContestation, Competence, Grain, Palier, RegimeV1vf, Temps } from './types'

type Admin = ReturnType<typeof createAdminClient>

/** Un cas de l'exercice, tel que l'élève le voit. ⚠️ SANS l'appui. */
export interface CasServi {
  ordre: number
  /** La consigne, BALISÉE — « le gras est du SENS » (piège 36). */
  consigne: Jeton[]
  /** Le matériau sur lequel il travaille, TEL QU'IL EST STOCKÉ (piège 33). */
  materiau: string | null
  /** L'offre de crédence de CE cas — vide hors des six crans qui la demandent. */
  credence: OffreCredence | null
  /** La crédence déjà donnée, s'il y en a une. */
  credenceDonnee: unknown | null
}

/** Le retour, tel que la chaîne l'a écrit — SEGMENTÉ. On ne le découpe pas. */
export interface RetourServi {
  moment: 'chaud' | 'final'
  points: PointDuRetour[]
  actionRevision: string | null
  feedForward: string | null
  publieLe: string | null
  luLe: string | null
}

export interface VueDuDeroule {
  depotId: string
  /** Ouvert = `exercices_actif`. Faux, l'écran se ferme poliment. */
  ouvert: boolean

  // ── Le régime, et les temps qu'il sert ──
  regime: RegimeV1vf
  vfRequiseParEscalade: boolean
  temps: Temps[]
  tempsCourant: Temps
  grain: Grain
  cranCode: string | null
  geste: string | null
  estUnePaire: boolean
  etapePaire: EtapePaire | null

  // ── Temps 1 — PRÉPARER ──
  consigne: Jeton[]
  rappel: Rappel
  demonstration: ChoixDeDemonstration
  demonstrationAvantLaTentative: boolean
  contenuDemonstration: ReturnType<typeof lireLeContenu>
  /** ⚠️ Le GUIDE de l'appui — deux objets, deux mécanismes (`02-` §2.3.4). */
  guide: string | null
  cas: CasServi[]
  /**
   * ⭐ C4-L14 — LA CORRECTION, PAR CAS. Indexée comme `cas` : `corrections[i]`
   * est celle de `cas[i]`. `null` = rien à servir, ou pas encore l'heure.
   *
   * ⚠️ ELLE N'ENTRE PAS DANS LA CHARGE UTILE DU CAS, et c'est structurant :
   * « ce champ n'est pas une donnée de l'énoncé » (piège 40 de C4-L3). Elle se
   * sert depuis L'ÉTAT, jamais depuis le cas — un `pourquoi_juste` qui partirait
   * avec l'énoncé serait lisible AVANT la crédence, et la porte 2 ne mesurerait
   * plus rien.
   *
   * ⚠️ UN SEUL CHAMP, GÉNÉRALISÉ PAR CAS — jamais deux champs pour la même
   * chose : « deux champs pour la même chose sont deux domiciles qui divergent ».
   * Il remplace `correctionDuPremierCas`, qui ne pouvait rien dire du second.
   */
  corrections: Array<CorrectionServie | null>

  // ── Temps 2 — ÉCRIRE ──
  dureeIndicativeMin: number | null
  microQuestionDue: boolean
  motifDepassement: string | null
  texteV1: string | null
  texteVf: string | null
  collages: ReturnType<typeof collagesDuDepot>

  // ── La remise ──
  competencesDeLaConfiance: Competence[]
  gestesRestants: Array<'confiance' | 'conditions' | 'restitution'>
  confianceDeclaree: Record<string, string> | null
  conditionsDeclarees: unknown
  restitutionAChaud: string | null

  // ── Temps 3 — SE JUGER ──
  seJuger: { servie: boolean; motif: string | null; offre: OffreSeJuger | null }

  // ── Temps 4 — RETOUR ──
  attente: AttenteLisible
  retourChaud: RetourServi | null
  contestations: ActeContestation[]
  /** L'encart LANGUE — séparé, ancré ligne à ligne, hors du retour de compétence. */
  langue: { phrase: string | null; n: number | null; ancrages: AncrageFaute[] }
  /**
   * ⭐ LE VERDICT DE CALIBRATION, affiché DANS le retour (`06-` §2). Il nomme la
   * DIMENSION, jamais l'observable, et se formule « nous n'avons pas vu la même
   * chose » — jamais comme un verdict.
   */
  verdictCalibration: { lignes: LigneDeVerdict[]; phrase: string | null }

  // ── Temps 5 et 6 ──
  echeanceVf: { quand: string | null; rognee: boolean; motif: string | null }
  retourFinal: RetourServi | null

  /** Ce que le professeur doit savoir — trace serveur, jamais l'élève. */
  avertissements: string[]
}

/**
 * ⭐ LE CHARGEUR. Il lit, il assemble, il ne décide de rien.
 * @returns `null` quand le dépôt n'est pas à cet élève, n'est pas de la maison,
 *          ou est `retire` — trois refus qui se ressemblent volontairement à
 *          l'écran : « introuvable » ne dit pas lequel.
 */
export async function chargerLeDeroule(
  admin: Admin, depotId: string, eleveId: string,
  a: { ouvert: boolean; delaiVfJours: number },
): Promise<VueDuDeroule | null> {
  const depot = await lireDepotMaison(admin, depotId, eleveId)
  if (!depot) return null

  let ctx: ContexteDepot
  try {
    ctx = await lireContexte(admin, depotId)
  } catch (e) {
    if (e instanceof DepotIllisible) {
      console.error(`[deroule] contexte illisible ${depotId} — ${e.message}`)
      return null
    }
    throw e
  }

  const avertissements: string[] = []
  const maintenant = new Date()

  // ── Le cran : son geste, et le libellé de régime que la doctrine porte ──
  // ⭐ C4-L11 — LU PAR LE NUMÉRO, comme partout ailleurs. Cet écran lisait
  //    `exercices_crans` PAR LE CODE tandis que la chaîne le lisait par le
  //    numéro : deux lecteurs, deux formes, sur une colonne qui portait les
  //    deux. La forme unique est le numéro (`utils/cran.ts`) ; `ctx.cran` le
  //    porte, déjà résolu — y compris pour une instance d'avant la conversion.
  //    ⚠️ `ctx.cran` est NULL sur un examen diagnostique, qui n'a pas de cran :
  //    la lecture ne part pas, et `geste` reste null. C'est le comportement
  //    voulu, pas un trou.
  const { data: cran } = ctx.cran == null
    ? { data: null }
    : await admin.from('exercices_crans')
      .select('geste, regime_v1vf, guide').eq('cran', ctx.cran).maybeSingle()
  const geste = (cran?.geste as string | null) ?? null

  // ── L'escalade qui pèse sur CET exercice (`01-` §8.5) ──
  const escalade = await escaladePesante(admin, depot)

  // ⭐ Le régime : le CRAN, PLUS L'ESCALADE. Jamais gravé en dur.
  const { regime, vfRequiseParEscalade } = regimeDuDeroule(
    (cran?.regime_v1vf as string | null) ?? ctx.regimeV1vf ?? 'plein',
    {
      observableIsoleCode: depot.exercice.observable_isole_code,
      observableIsoleCompetence: depot.exercice.observable_isole_competence,
    },
    escalade,
  )

  const estUnePaire = depot.exercice.paire_diagnostic
  const nbCas = geste ? nombreDeCas(geste as never) : 1

  // ── Les cas, et l'appui (jamais servi tel quel) ──
  // Le dépôt n'a pas de types générés : les `select` concaténés ne s'infèrent
  // pas, et le patron est le TRANSTYPAGE EXPLICITE (`utils/chaine/contexte.ts`,
  // `utils/acces.ts`). La forme ci-dessous dit CE QU'ON LIT, colonne par colonne.
  const { data: casLus } = await admin.from('exercices_cas')
    .select('ordre, defaut, distracteurs, reponse_attendue, pourquoi_juste, '
      + 'exercices_materiaux(contenu)')
    .eq('exercice_id', depot.exercice_id).order('ordre')
  const casBruts = (casLus ?? []) as unknown as Array<{
    ordre: number
    defaut: string | null
    distracteurs: unknown
    reponse_attendue: string | null
    /** ⭐ C4-L14 — « pourquoi ce candidat-là est le bon » (`08-` §5.2). */
    pourquoi_juste: string | null
    exercices_materiaux: { contenu?: string } | Array<{ contenu?: string }> | null
  }>

  const consignes = Array.isArray(depot.exercice.consigne_instanciee)
    ? (depot.exercice.consigne_instanciee as unknown[]).map((x) => String(x ?? ''))
    : [String(depot.exercice.consigne_instanciee ?? '')]

  const { data: metacog } = await admin.from('exercices_metacognition')
    .select('credence, contestation_points').eq('depot_id', depotId).maybeSingle()
  const credencesDonnees = Array.isArray(metacog?.credence)
    ? (metacog.credence as Array<Record<string, unknown>>) : []

  const cas: CasServi[] = []
  for (let i = 0; i < Math.max(1, nbCas); i++) {
    const brut = casBruts.find((c) => c.ordre === i + 1)
    const mat = brut
      ? (Array.isArray(brut.exercices_materiaux)
        ? brut.exercices_materiaux[0] : brut.exercices_materiaux)
      : null
    const materiau = mat?.contenu ?? null
    // ⚠️ `offreDeCredence` prend un CODE de cran (`CodeCran`), et c'est juste :
    //    la doctrine de la crédence se dit en codes. Le CODE se lit sur
    //    `ctx.cranCode`, résolu depuis le numéro — jamais sur la colonne brute,
    //    qui portait tantôt l'un tantôt l'autre (C4-L11).
    const offre = geste && credenceDemandee(geste as never) && ctx.cranCode
      ? offreDeCredence(ctx.cranCode as never, i + 1, depotId, {
        distracteurs: brut?.distracteurs, reponseAttendue: brut?.reponse_attendue ?? null,
      })
      : null
    if (offre?.empechement) avertissements.push(offre.empechement)
    cas.push({
      ordre: i + 1,
      consigne: baliser(consignes[i] ?? consignes[0] ?? ''),
      materiau,
      credence: offre,
      credenceDonnee: credencesDonnees.find((c) => c.cas === i + 1) ?? null,
    })
  }

  // ⭐⭐ LA CORRECTION, PAR CAS — servie APRÈS la crédence DE SON CAS.
  // ⚠️ Elle N'ENTRE PAS dans la charge utile du cas (piège 40) : « ce champ
  //    n'est pas une donnée de l'énoncé ». Elle ne sort d'ici qu'une fois la
  //    crédence donnée — sans quoi l'élève déclarerait sa sûreté en connaissant
  //    la réponse, et la porte 2 ne mesurerait plus rien.
  // ⭐ C4-L14 — ELLE SE COMPOSE POUR LES DEUX CAS, ET PLUS SEULEMENT LE PREMIER.
  //    Le second est LE CAS DU TRANSFERT, celui qui porte toute la raison d'être
  //    de la paire, et il ne recevait rien : aux crans au jugement algorithmique
  //    aucun retour IA ne vient derrière (`06-` §2, temps 4). Décision de Louis,
  //    23/08 : il reçoit LA MÊME CORRECTION que le premier.
  // Le cran sert-il quatre candidats ? C'est ce qui décide si la correction est
  // la réponse SEULE (crans 4 et 5) ou les trois choses (crans 1 et 3) — ET,
  // depuis le 24/08, ce qui tient lieu de RÉPONSE à un cas.
  const surDesCandidats = ctx.cranCode !== null
    && CRANS_GUIDES.includes(ctx.cranCode as never)
  // ⭐⭐ AUX CRANS À CANDIDATS, LA CRÉDENCE EST LA RÉPONSE — smoke élève du
  //    24/08, tranché par Louis : « la réponse c'est la crédence, il n'y a pas
  //    de retour IA, c'est juste de l'algo ».
  // ⛔ Sans ce troisième argument, on passait `[texte_v1, texte_vf]` comme
  //    « réponses aux deux cas » — or à ces crans l'élève NE RÉDIGE PAS, les
  //    deux restent `null`, l'étape ne dépassait jamais `cas_1`, et la
  //    correction n'était JAMAIS servie. Éprouvé en vrai : crédence écrite en
  //    base, `repondu(0) = false`, `correctionDue = false`.
  const etape: EtapePaire | null = estUnePaire
    ? etapeDeLaPaire(
      [depot.texte_v1, depot.texte_vf].map((t) => t),
      [cas[0]?.credenceDonnee, cas[1]?.credenceDonnee],
      surDesCandidats)
    : null
  const sertUneCorrection = correctionServieAuCran(geste, ctx.cranCode)
  const corrections: Array<CorrectionServie | null> = cas.map((c) => {
    if (!sertUneCorrection) return null
    if (!correctionDue(c.ordre, { estUnePaire, etape, credenceDonnee: c.credenceDonnee })) {
      return null
    }
    const brut = casBruts.find((x) => x.ordre === c.ordre)
    if (!brut) return null
    return composerLaCorrection(
      { reponseAttendue: brut.reponse_attendue, pourquoiJuste: brut.pourquoi_juste,
        distracteurs: brut.distracteurs },
      c.credenceDonnee, surDesCandidats)
  })

  // ── Temps 1 : le rappel, dosé par le palier ──
  // ⭐ C4-L11 — L'ORDRE DE LECTURE DU `07-` §1.1 : la DÉCISION du routeur, puis
  //    `exercices.cible_primaire`, qui existe désormais. ⚠️ Pas de repli
  //    alphabétique ICI, et c'est délibéré : cet écran sert un RAPPEL et une
  //    DÉMONSTRATION, et les servir sur une compétence tirée d'un ordre de
  //    tableau vaut moins que ne rien servir. La chaîne, elle, doit trancher —
  //    elle a un retour à écrire — et son repli est dit en alerte.
  const cible = ((ctx.decision?.cibleRetenue ?? ctx.ciblePrimaire) ?? null) as Competence | null
  const rappel = await construireLeRappel(admin, depot, ctx, cible)

  // ── Temps 1 : la démonstration ──
  const demonstration = await construireLaDemonstration(admin, depot, ctx, cible, avertissements)
  if (demonstration.avertissement) avertissements.push(demonstration.avertissement)

  const foisCiblee = cible ? await compterLesCiblages(admin, depot.eleve_id, cible) : 0

  // ── Temps 2 : la durée ──
  const dureeMin = dureeIndicativeLisible(await dureeDeLInstance(admin, depot, ctx))
  // ⚠️ Le temps ÉCOULÉ, pas le temps réel : la micro-question se déclenche
  //    PENDANT l'exercice. Le temps réel (ouverture → dépôt) sert le TAG DE
  //    DURÉE, qui se pose à la remise — dans l'action, jamais à l'affichage.
  const ecouleMs = dureeReelleMs(depot.ouvert_at, maintenant.toISOString())

  // ── La remise ──
  const { mesurees } = competencesDeLExercice(ctx)
  const competencesDeLaConfiance = competencesQuiDemandentLaConfiance(mesurees, ctx.statutsRecette)

  // ── Temps 3 : « se juger » ──
  const seJuger = await construireSeJuger(admin, depot, ctx, geste, mesurees)

  // ── Temps 4 : le retour, l'attente, la langue ──
  const [attente, retours, langue] = await Promise.all([
    attenteDuDepot(admin, depotId),
    lireLesRetours(admin, depotId),
    construireLEncartLangue(admin, depotId, ctx.productionV1),
  ])

  // Le verdict de calibration se lit sur la comparaison DÉJÀ ÉCRITE au temps 3 :
  // rien ne se recalcule ici — « la comparaison est du code », et elle a eu lieu.
  const { data: comparaisonEcrite } = await admin.from('exercices_metacognition')
    .select('comparaison_squelette').eq('depot_id', depotId).maybeSingle()
  const formulations: Record<string, string> = {}
  for (const [comp, lignes] of Object.entries(ctx.correspondance)) {
    for (const l of lignes) formulations[`${comp}|${l.observable_code}`] = l.dimension_eleve
  }
  const verdictCalibration = verdictDeCalibration(
    Array.isArray(comparaisonEcrite?.comparaison_squelette)
      ? (comparaisonEcrite.comparaison_squelette as never[]) : [],
    formulations,
  )

  // ── Temps 5 : l'échéance de la version finale ──
  const echeanceVf = await construireLEcheance(depot, a.delaiVfJours, regime)

  const temps = tempsServis(regime)
  return {
    depotId, ouvert: a.ouvert,
    regime, vfRequiseParEscalade, temps,
    tempsCourant: tempsCourantDe(depot, regime, retours, seJuger.servie),
    // ⭐ Le CODE, résolu depuis le numéro par `lireContexte` — jamais la colonne
    //    brute, qui portait tantôt le code tantôt le numéro (C4-L11).
    grain: ctx.grain, cranCode: ctx.cranCode, geste,
    estUnePaire, etapePaire: etape,

    consigne: baliser(ctx.consigne),
    rappel,
    demonstration,
    demonstrationAvantLaTentative: momentDeLaDemonstration(foisCiblee) === 'avant',
    contenuDemonstration: demonstration.demonstration
      ? lireLeContenu(demonstration.demonstration.forme, demonstration.demonstration.contenu)
      : null,
    guide: depot.exercice.guide,
    cas, corrections,

    dureeIndicativeMin: dureeMin,
    microQuestionDue: dureeMin !== null && ecouleMs !== null
      && depot.v1_remis_at === null && microQuestionDue(dureeMin, ecouleMs),
    motifDepassement: depot.motif_depassement,
    texteV1: depot.texte_v1, texteVf: depot.texte_vf,
    collages: collagesDuDepot(depot),

    competencesDeLaConfiance,
    gestesRestants: gestesRestants(depot, competencesDeLaConfiance.length > 0),
    confianceDeclaree: depot.confiance_declaree,
    conditionsDeclarees: depot.conditions_declarees,
    restitutionAChaud: depot.restitution_a_chaud,

    seJuger,

    attente,
    retourChaud: retours.chaud,
    contestations: pointsContestes(metacog?.contestation_points),
    langue,
    verdictCalibration,

    echeanceVf,
    retourFinal: retours.final,

    avertissements,
  }
}

// ── Les pièces ──────────────────────────────────────────────────────────────

/** Le tag de durée, posé à la remise. Exporté pour l'action de remise. */
export function tagALaRemise(dureeMin: number | null, reelMs: number | null): string | null {
  if (dureeMin === null || reelMs === null) return null
  return tagDeDuree(dureeMin, reelMs)
}

async function escaladePesante(admin: Admin, depot: DepotMaison): Promise<EscaladePesante> {
  const code = depot.exercice.observable_isole_code
  const comp = depot.exercice.observable_isole_competence
  if (!code || !comp) return { degre: null, observable: null, competence: null }
  const { data } = await admin.from('competences_escalade')
    .select('degre').eq('eleve_id', depot.eleve_id).eq('competence', comp)
    .eq('observable', code).maybeSingle()
  return {
    degre: (data?.degre as 'N1' | 'N2' | 'N3' | null) ?? null,
    observable: code, competence: comp as Competence,
  }
}

async function construireLeRappel(
  admin: Admin, depot: DepotMaison, ctx: ContexteDepot, cible: Competence | null,
): Promise<Rappel> {
  if (!cible) {
    return { observables: [], formulationsManquantes: [],
      motif: 'aucune cible primaire sur cet exercice : rien à rappeler' }
  }
  const [{ data: niveau }, fenetre] = await Promise.all([
    admin.from('competences_niveaux').select('lettre')
      .eq('eleve_id', depot.eleve_id).eq('competence', cible).maybeSingle(),
    fenetreDEvidence(admin, depot.eleve_id, cible),
  ])
  const etat = etatCompetence(cible)
  const instrument = etat.instrument
    // ⚠️ APLATIS À LEUR DÉFAUT : la fiche écrit un bloc par paramètre, et un
    //    `seuil_parametre` lu sur le bloc sortirait l'observable du
    //    dénominateur sans un symptôme (C4-L10).
    ? { observablesMesure: etat.instrument.observables_mesure,
      parametres: valeursDesParametres(etat.instrument) }
    : null
  return rappelDuTemps1(
    cible, ctx.grain, (niveau?.lettre ?? null) as Palier | null,
    fenetre as unknown as Mesure[], instrument,
    (ctx.correspondance[cible] ?? []).map((c) => ({
      observable_code: c.observable_code, dimension_eleve: c.dimension_eleve,
    })),
  )
}

/**
 * ⭐ LA PARADE À L'IMITATION DE SURFACE : le cours et les notions de l'exercice.
 * Décision du PO du 22/08 — « l'exemple doit être adossé à un AUTRE cours et ne
 * porter AUCUNE des notions de l'exercice ».
 */
async function construireLaDemonstration(
  admin: Admin, depot: DepotMaison, ctx: ContexteDepot, cible: Competence | null,
  avertissements: string[],
): Promise<ChoixDeDemonstration> {
  if (!cible) {
    return { demonstration: null, ecartees: [],
      avertissement: 'aucune cible primaire : la démonstration se choisit par compétence × grain' }
  }
  const [demos, cours, notions, formes] = await Promise.all([
    admin.from('exercices_demonstrations')
      .select('id, competence, grain, forme, theme, contenu, cours_declares, notions')
      .eq('competence', cible).eq('actif', true).eq('statut', 'valide'),
    coursDeLExercice(admin, depot),
    notionsDeLExercice(admin, depot),
    admin.from('demonstrations_formes').select('forme, grain'),
  ])
  const formesParGrain: Record<string, string> = {}
  for (const f of formes.data ?? []) formesParGrain[f.forme as string] = f.grain as string

  const candidatesLues = (demos.data ?? []) as unknown as DemonstrationLue[]
  const nonDeclarees = candidatesLues.filter(
    (d) => d.cours_declares === null && d.notions === null)
  if (nonDeclarees.length > 0) {
    // ⚠️ Décision du PO : une démonstration qui NE DÉCLARE RIEN est SERVIE, et
    //    le professeur est AVERTI que la parade n'a pas pu être vérifiée sur
    //    elle. Le REMPLISSAGE de ces colonnes appartient à C4-L8 (format
    //    d'import), pas à ce lot.
    avertissements.push(`${nonDeclarees.length} démonstration(s) de « ${cible} » ne déclarent `
      + 'ni cours ni notions : la parade à l\'imitation de surface n\'a pas pu être vérifiée '
      + 'sur elles. Le remplissage se fait au format d\'import (C4-L8, `08-` §5 bis).')
  }
  return choisirLaDemonstration(
    candidatesLues, { grain: ctx.grain, cours, notions }, formesParGrain, depot.id)
}

async function coursDeLExercice(admin: Admin, depot: DepotMaison): Promise<string[]> {
  const out = new Set<string>()
  const ex = depot.exercice
  for (const [table, colonne, id] of [
    ['exercices_sujets_cours', 'sujet_id', ex.materiau_source_sujet_id],
    ['exercices_sujets_cours', 'sujet_id', ex.materiau_cible_sujet_id],
    ['exercices_textes_cours', 'texte_id', ex.materiau_source_texte_id],
    ['exercices_textes_cours', 'texte_id', ex.materiau_cible_texte_id],
  ] as const) {
    if (!id) continue
    const { data } = await admin.from(table).select('cours_declare').eq(colonne, id)
    for (const c of data ?? []) out.add(String(c.cours_declare))
  }
  return [...out]
}

async function notionsDeLExercice(admin: Admin, depot: DepotMaison): Promise<string[]> {
  const out = new Set<string>()
  for (const id of [depot.exercice.materiau_source_sujet_id,
    depot.exercice.materiau_cible_sujet_id]) {
    if (!id) continue
    const { data } = await admin.from('exercices_sujets').select('notions').eq('id', id).maybeSingle()
    for (const n of (data?.notions as string[] | null) ?? []) out.add(n)
  }
  return [...out]
}

/**
 * « Le routeur distingue les deux cas SUR L'HISTORIQUE DES CIBLES » (`06-` §2) —
 * et l'historique « se LIT sur `routeur_decisions`, qui porte déjà la cible »
 * (`01-` §3 ; `07-` §1). On le lit, on ne le stocke pas.
 */
async function compterLesCiblages(
  admin: Admin, eleveId: string, cible: Competence,
): Promise<number> {
  const { count } = await admin.from('routeur_decisions')
    .select('id', { count: 'exact', head: true })
    .eq('eleve_id', eleveId).eq('cible_retenue', cible)
  return count ?? 0
}

async function dureeDeLInstance(
  admin: Admin, depot: DepotMaison, ctx: ContexteDepot,
): Promise<unknown> {
  if (ctx.cran == null) return null
  const { data } = await admin.from('exercices_types_crans')
    .select('duree_exercice_min')
    // Le numéro, sans aller-retour de type : `exercices_types_crans.cran` était
    // la seule table de doctrine à porter du texte (C4-L11).
    .eq('type_id', depot.exercice.type_id).eq('cran', ctx.cran).maybeSingle()
  return data?.duree_exercice_min ?? null
}

async function construireSeJuger(
  admin: Admin, depot: DepotMaison, ctx: ContexteDepot, geste: string | null,
  mesurees: readonly Competence[],
): Promise<{ servie: boolean; motif: string | null; offre: OffreSeJuger | null }> {
  // ⚠️ Les compétences seulement SONDÉES sont écartées : « une sonde est
  //    silencieuse, elle ne produit aucun retour » (la fiche §4).
  const sondes = new Set(ctx.decision?.sondes ?? [])
  const cibles = mesurees.filter((c) => !sondes.has(c))

  const { servie, motif } = phaseServie(
    (geste ?? 'produire') as never, ctx.grain, cibles, ctx.statutsRecette)
  if (!servie) return { servie: false, motif, offre: null }

  const evaluees = cibles.filter((c) => ctx.statutsRecette[c] === 'evaluee')

  // Ce que l'exercice TESTE : la couverture, moins ce qui n'est qu'observable.
  const couverture: CouvertureTestee[] = evaluees.map((c) => ({
    competence: c,
    observables: ctx.servable.filter((s) => s.competence === c).map((s) => s.observable_nom),
  }))

  const fenetres: Record<string, Mesure[]> = {}
  const instruments: Record<string, { observablesMesure: never; parametres: never } | null> = {}
  for (const c of evaluees) {
    fenetres[c] = await fenetreDEvidence(admin, depot.eleve_id, c) as unknown as Mesure[]
    const etat = etatCompetence(c)
    instruments[c] = etat.instrument
      ? { observablesMesure: etat.instrument.observables_mesure as never,
        parametres: etat.instrument.parametres as never }
      : null
  }

  const { data: banque } = await admin.from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve, question, reponses, fiche_version')
    .in('competence', evaluees).order('ordre')

  const offre = offreSeJugerMaison(
    candidates(couverture, fenetres, instruments as never),
    (banque ?? []) as never,
    depot.id,
  )
  return { servie: true, motif: null, offre }
}

async function lireLesRetours(
  admin: Admin, depotId: string,
): Promise<{ chaud: RetourServi | null; final: RetourServi | null }> {
  const { data: lus } = await admin.from('exercices_retours')
    .select('moment, texte, texte_edite_par_prof, action_revision, feed_forward, '
      + 'published_at, lu_at')
    .eq('depot_id', depotId)
  const data = (lus ?? []) as unknown as Array<{
    moment: string
    texte: unknown
    texte_edite_par_prof: unknown
    action_revision: { texte?: string } | null
    feed_forward: string | null
    published_at: string | null
    lu_at: string | null
  }>
  const sortie: { chaud: RetourServi | null; final: RetourServi | null } =
    { chaud: null, final: null }
  for (const r of data) {
    // ⚠️ UN RETOUR NON PUBLIÉ N'EXISTE PAS pour l'élève — c'est une ABSENCE, pas
    //    un masquage (patron de `utils/passation/vues.ts`).
    if (!r.published_at) continue
    // ⚠️ `texte_edite_par_prof` reste NULL sur tout retour formatif DE LA MAISON
    //    (`07-` §1.2) : on ne le lit que par prudence, il ne doit jamais servir.
    const brut = r.texte_edite_par_prof ?? r.texte
    const servi: RetourServi = {
      moment: r.moment as 'chaud' | 'final',
      points: Array.isArray(brut) ? (brut as PointDuRetour[]) : [],
      actionRevision: r.action_revision?.texte ?? null,
      feedForward: r.feed_forward,
      publieLe: r.published_at,
      luLe: r.lu_at,
    }
    if (servi.moment === 'chaud') sortie.chaud = servi
    else sortie.final = servi
  }
  return sortie
}

/**
 * ⭐ L'ENCART LANGUE — **SÉPARÉ**, ancré ligne à ligne, **HORS du retour de
 * compétence** (`06-` §2). *N* est compté EN CODE à partir du relevé que la
 * CHAÎNE produit ; **l'écran ne détecte rien et n'appelle aucun modèle**.
 *
 * ⚠️ Aujourd'hui la chaîne ne produit AUCUN relevé de langue — aucune compétence
 *    n'est ouverte, donc `expression` n'écrit pas son `orthographe`. **L'absence
 *    est le cas nominal** : l'encart ne s'affiche pas, et ce n'est pas une panne.
 */
async function construireLEncartLangue(
  admin: Admin, depotId: string, production: string | null,
): Promise<{ phrase: string | null; n: number | null; ancrages: AncrageFaute[] }> {
  const { data } = await admin.from('exercices_squelettes')
    .select('artefact_extraction')
    .eq('depot_id', depotId).eq('competence', 'expression').eq('version', 'v1').maybeSingle()
  const releve = lireReleveDeLangue(data?.artefact_extraction)
  const n = nombreDeFautes(releve)
  return {
    n,
    phrase: phraseDeLaChasse(n),
    ancrages: releve && production ? ancrerLigneALigne(production, releve) : [],
  }
}

async function construireLEcheance(
  depot: DepotMaison, delaiJours: number, regime: RegimeV1vf,
): Promise<{ quand: string | null; rognee: boolean; motif: string | null }> {
  if (regime !== 'plein' || !depot.v1_remis_at) {
    return { quand: null, rognee: false, motif: null }
  }
  const fuseau = await lireFuseau()
  const v1 = new Date(depot.v1_remis_at)
  const e = echeanceDeLaVersionFinale({
    v1RemiseA: v1, delaiJours, finDeSemaine: finDeSemaineDeTravail(v1, fuseau),
  })
  return { quand: e.echeance.toISOString(), rognee: e.rognee, motif: e.motif }
}

/**
 * LE TEMPS COURANT — lu sur l'état, jamais stocké. « Le fil du statut » suffit :
 * un temps est le premier que l'élève n'a pas encore franchi.
 */
function tempsCourantDe(
  depot: DepotMaison, regime: RegimeV1vf,
  retours: { chaud: RetourServi | null; final: RetourServi | null },
  seJugerServie: boolean,
): Temps {
  if (!depot.v1_remis_at) return depot.ouvert_at ? 'ecrire' : 'preparer'
  if (seJugerServie && !depot.juger_fin_at) return 'se_juger'
  if (!retours.chaud) return 'retour'
  if (regime !== 'plein') return 'retour'
  if (!depot.vf_remis_at) return 'reviser'
  return retours.final ? 'retour_final' : 'reviser'
}
