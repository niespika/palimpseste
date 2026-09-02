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

import { lireLaPorteDuSignalement, lireLeSignalementDuDepot,
  type SignalementDeLEleve } from '@/utils/signalements/serveur'
import { lireDepotMaison, collagesDuDepot, type DepotMaison } from './depot'
import { regimeDuDeroule, tempsServis, nombreDeCas, credenceDemandee, etapeDeLaPaire,
  type EscaladePesante, type EtapePaire } from './regime'
import { rappelDuTemps1, momentDeLaDemonstration, type Rappel } from './rappel'
import { offreDeCredence, credenceDonneeDe, CRANS_GUIDES, type OffreCredence } from './credence'
import { composerLaCorrection, correctionDue, correctionServieAuCran, etalonServi,
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
import { lireTelemetrie } from './telemetrie'
import { demandeUneDesignation } from './designation'
import { marquerLeMateriau, regimeDeMarquage, type SegmentMateriau } from './marquage'
import { attenteDuDepot, type AttenteLisible } from './mesure'
import { pointsContestes, type PointDuRetour } from './contestation'
import { gestesRestants, competencesQuiDemandentLaConfiance } from './gestes'
import { titreDeLaConsigne, type Atelier } from '../codex-onglets/regles'
import type { TexteSupportServi } from '../chaine/contexte'
import type { ActeContestation, Competence, Grain, Palier, RegimeV1vf, Temps } from './types'

type Admin = ReturnType<typeof createAdminClient>

/** Un cas de l'exercice, tel que l'élève le voit. ⚠️ SANS l'appui. */
export interface CasServi {
  ordre: number
  /** La consigne, BALISÉE — « le gras est du SENS » (piège 36). */
  consigne: Jeton[]
  /**
   * Le matériau sur lequel il travaille, TEL QU'IL EST STOCKÉ (piège 33) —
   * ⭐ C4-L15, découpé en SEGMENTS marqués et non marqués (`02-` §5).
   *
   * ⚠️ **LE TEXTE N'EST PAS RETOUCHÉ D'UN OCTET** : la concaténation des
   * `texte`, dans l'ordre, EST le matériau. Marquer n'est pas baliser — aucun
   * caractère n'est interprété, ajouté ni retiré ; ce qui est calculé, ce sont
   * des BORNES, à partir d'ailleurs (les candidats servis, le diff).
   *
   * ⛔ **ET LA VERSION CORRIGÉE N'Y EST PAS.** Aux crans 3 et 5 elle sert à
   * calculer le diff — CÔTÉ SERVEUR, dans ce fichier —, et **seules les
   * positions descendent** : « la `reponse_attendue` est la version corrigée à
   * la transformation » (`02-` §2.3.4), c'est-à-dire CE QUE L'ÉLÈVE DOIT
   * PRODUIRE. `marquerLeMateriau` s'en protège par construction — il ne rend
   * jamais que des tranches de `contenu`.
   */
  materiau: SegmentMateriau[] | null
  /** L'offre de crédence de CE cas — vide hors des six crans qui la demandent. */
  credence: OffreCredence | null
  /** La crédence déjà donnée, s'il y en a une. */
  credenceDonnee: unknown | null
  /**
   * ⭐ ITEM 77 — CE CAS DEMANDE-T-IL UNE DÉSIGNATION DANS LE MATÉRIAU ?
   *
   * Vrai aux crans 4, 7 et 9, **et à tous leurs cas** (`02-` §5). ⛔⛔ **Ce
   * drapeau ne dit PAS s'il y a quelque chose à trouver**, et c'est délibéré :
   * « c'est le jugement qui bascule, pas l'écran ». Un drapeau qui suivrait la
   * cible **répondrait à la place de l'élève** — il lui apprendrait, par la
   * seule forme de la page, que le défaut est une absence.
   */
  designationDemandee: boolean
  /**
   * La zone déjà sélectionnée — `[début, fin[` en caractères du matériau. ⚠️
   * **`null` est ambigu et il ne faut pas le lire seul** : c'est « rien à
   * signaler », qui EST une réponse, ou « pas encore répondu ». C'est
   * `designationDonnee` qui les sépare.
   */
  zoneDonnee: [number, number] | null
  /** L'élève a-t-il répondu à la désignation — sélection OU « rien à signaler » ? */
  designationDonnee: boolean
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

/**
 * ⭐ CE QUE L'ÉLÈVE A DÉJÀ DÉSIGNÉ, relu de son entrée de crédence.
 *
 * ⚠️⚠️ **`zone: null` ET « pas de zone du tout » NE SONT PAS LA MÊME CHOSE.**
 * `zone_at` est ce qui les sépare : avec lui, l'élève a répondu « rien à
 * signaler » — *« le dire est une réponse »* ; sans lui, il n'a pas encore
 * répondu. Confondre les deux ferait relancer un élève qui a fini, ou
 * compter fini un élève qui n'a rien fait.
 */
function lireLaDesignation(
  entree: Record<string, unknown> | undefined,
): { zoneDonnee: [number, number] | null; designationDonnee: boolean } {
  if (!entree || entree.zone_at === undefined) {
    return { zoneDonnee: null, designationDonnee: false }
  }
  const z = entree.zone
  const bornes = Array.isArray(z) && z.length === 2
    && typeof z[0] === 'number' && typeof z[1] === 'number'
    ? ([z[0], z[1]] as [number, number]) : null
  return { zoneDonnee: bornes, designationDonnee: true }
}

export interface VueDuDeroule {
  depotId: string
  /** Ouvert = `exercices_actif`. Faux, l'écran se ferme poliment. */
  ouvert: boolean
  /**
   * ⭐ 01/09 — LE RELEVÉ DE SAISIE DÉJÀ EN BASE, par version. Le champ de
   * rédaction s'en SÈME à l'ouverture et porte ensuite le relevé cumulé :
   * c'est le contrat de `leReleveLePlusAvance` (`telemetrie.ts`). Sans cette
   * semence, chaque rechargement repartait de zéro et la base gardait le vide.
   */
  telemetrie: ReturnType<typeof lireTelemetrie>

  // ── ⭐ LA BARRE DE CONTENU (handoff « Codex Exercices (élève) » §4) ──
  // « ← Exercices · titre de l'exercice · durée indicative · échéance ». Trois
  // champs de PRÉSENTATION, tirés de ce que le chargeur a déjà sous la main :
  // aucune lecture de plus, aucune règle de plus.
  /**
   * La première ligne non vide de la consigne — `titreDeLaConsigne`, la MÊME
   * fonction que la liste de l'accueil. ⚠️ Deux titres calculés autrement
   * seraient deux titres qui divergent, et l'élève ne reconnaîtrait pas la ligne
   * qu'il vient de cliquer.
   */
  titre: string
  /** L'échéance du dépôt (`timestamptz`) — un INSTANT, lu dans le fuseau. */
  echeance: string | null
  /** L'instant de la remise de v1 — « v1 rendue mardi » dans la barre. */
  v1RemiseLe: string | null
  /**
   * ⭐⭐ AUX DEUX CRANS GUIDÉS, LA CRÉDENCE **EST** LA RÉPONSE — smoke élève du
   *    24/08, tranché par Louis : « la réponse c'est la crédence, il n'y a pas
   *    de retour IA, c'est juste de l'algo ». Le chargeur le calculait déjà pour
   *    `etapeDeLaPaire` (`surDesCandidats`) sans jamais le rendre.
   *
   * ⭐ C'est le drapeau qui commande la MISE EN PAGE : les quatre lectures
   *    REMPLACENT le champ de rédaction (handoff §4, écran 2b) — avant ce lot,
   *    l'écran servait les deux, et l'élève voyait un champ de rédaction qu'il
   *    n'avait pas à remplir.
   *
   * ⛔ Il ne dit RIEN de la bonne réponse : c'est une propriété du CRAN, connue
   *    avant toute saisie. `indexAttendue` reste, lui, hors de tout rendu.
   */
  credenceEstLaReponse: boolean

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
  /**
   * ⭐⭐ L'ÉTALON DES CRANS DE PRODUCTION — item 86, `02-` 6.0 §2.3.4.
   *
   * « Une production modèle : à quoi peut ressembler une bonne réponse. » Il
   * **se montre à l'élève APRÈS SA VERSION FINALE, jamais avant** : servi avec
   * le retour de v1, il donnerait une réponse à recopier et le `delta_v1_vf` ne
   * mesurerait plus rien — c'est le motif même qui ferme le cran 7.
   *
   * ⭐ Le gradient suit celui du `guide` : **cran 2, toujours déplié** ; **cran
   *    6, replié — l'élève le déroule s'il le veut, et ce déroulé COMPTE**
   *    (`AIDES_COMPTEES`) ; **cran 8, jamais servi** — il n'y borne que l'IA.
   *
   * ⚠️ `null` partout ailleurs. Aux quatre crans qui isolent, la
   *    `reponse_attendue` est LA réponse et passe par `corrections` : la servir
   *    ici la ferait lire comme un modèle à imiter.
   */
  etalon: { texte: string; deplie: boolean } | null
  /**
   * ⭐⭐ C5-L2 — LE TEXTE D'AUTEUR, ET LE PLUS GROS MANQUE QUE CE LOT FERME.
   *
   * L'écran servait un matériau, et il allait TOUJOURS le chercher au même
   * endroit : `exercices_cas` → `exercices_materiaux`, « la banque de matériaux
   * FABRIQUÉS ». **Le texte d'auteur n'y est pas** — il est désigné par
   * l'INSTANCE (`materiau_source_texte_id`) — et sur une instance de lecture
   * `exercices_cas.materiau_id` est de surcroît NULL. *L'élève lisait la
   * consigne, et rien d'autre.*
   *
   * ⭐ Ce qui s'affiche est **l'englobant** — « l'étendue réellement lue »
   *    (`02-` §6 B.1) — et la **sélection** se marque dedans, du même geste que
   *    les candidats du cran 1 (C4-L15) : **pas un octet retouché**.
   *
   * ⛔ **RIEN DE LA RÉFÉRENCE DÉCOMPOSÉE N'Y ENTRE** — ni ses moments, ni ses
   *    lectures défendables, ni son armature : *elles sont la grille de la
   *    réception ET la réponse* (RR4). **Le texte source, lui, est exactement ce
   *    que l'élève doit lire : ne pas confondre les deux.**
   */
  texteSupport: TexteSupportServi | null
  /**
   * ⭐⭐ LE SUJET — 01/09. L'énoncé du sujet que l'instance porte en SOURCE
   * (`materiau_source_sujet_id`, ou à défaut en cible).
   *
   * 452 exercices sur 576 sont bâtis sur un sujet de dissertation, 23 consignes
   * disent « ce sujet », et l'écran ne le montrait NULLE PART : la vue ne lisait
   * le sujet que pour ses notions, et la chaîne reçoit la consigne à sa place.
   * *L'élève lisait « défends une réponse possible à ce sujet » au-dessus d'un
   * champ vide.* Il se sert à tous les crans où l'instance en a un.
   */
  sujet: string | null
  /**
   * ⭐⭐ LE CO-TEXTE — la matière des trois crans de PRODUCTION (2, 6, 8), et le
   * manque que ce lot ferme.
   *
   * Les consignes de ces crans sont DÉICTIQUES : « Voici l'argument à illustrer.
   * Sa dernière phrase dit qu'il y a là quelque chose "qu'il faut voir" ». Sans
   * ce champ, l'élève lisait cette phrase et **rien à l'écran n'était cet
   * argument** — le matériau avait été rangé dans `exercices_cas.materiau_id`,
   * qui est le slot de la CIBLE, et la base l'avait refusé.
   *
   * ⚠️ Il se sert AUX TROIS CRANS, sans dégradé. C'est le GUIDE que l'échelle
   *    retire (complet au 2, léger au 6, absent au 8) — la MATIÈRE reste : au
   *    cran 8 il n'y a plus que lui, et l'enlever viderait l'exercice.
   */
  coTexte: string | null
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

  /**
   * ⭐⭐ « SIGNALER QUE L'EXERCICE A UN PROBLÈME » — demande de Louis, 31/08.
   *
   * ⛔ **NE PAS CONFONDRE AVEC LA MÉTACOGNITION.** Cet écran s'interdit de
   *    « demander à l'élève de signaler ce qu'il n'a pas compris » (`02-` §5) :
   *    la lucidité est SPONTANÉE et se relève ailleurs. Ici, ce qui est mis en
   *    cause est **l'exercice**, jamais l'élève — aucun strike, aucun compteur,
   *    et rien de ce champ ne part au modèle.
   *
   * · `ouvert` — l'interrupteur `signalement_exercice_actif`. À OFF, aucune case
   *   n'apparaît, et l'élève n'apprend pas qu'elle existe ;
   * · `mien` — son propre signalement, `null` s'il n'en a pas.
   */
  signalement: { ouvert: boolean; mien: SignalementDeLEleve | null }

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
  a: { ouvert: boolean; delaiVfJours: number; atelier?: Atelier },
): Promise<VueDuDeroule | null> {
  // ⭐ C5-L2 — LA PORTE BORNE, PAS LE CHARGEUR. Les deux ROUTES nomment leur
  //    atelier ; les ACTIONS partagées ne le font pas, et ne le peuvent pas :
  //    « un dossier sans `page.tsx` […] le jeu d'actions PARTAGÉ par les écrans
  //    du déroulé, où qu'ils vivent ».
  const depot = await lireDepotMaison(admin, depotId, eleveId, { atelier: a.atelier })
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
      // ⭐ C4-L15 — `marquage` entre ici, et `guide` cesse d'être chargé pour
      //    rien : c'est LUI qui décide si le bloc « De quoi t'aider » se sert
      //    (la doctrine y met `léger` au cran 6, et à lui seul — `02-` §2.2).
      //    ⭐ On lit une CONDITION DÉRIVÉE, jamais un numéro de cran en dur.
      .select('geste, regime_v1vf, guide, marquage').eq('cran', ctx.cran).maybeSingle()
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
    // ⛔⛔ `version_corrigee` ENTRE ICI, ET ELLE N'EN SORT PAS. C4-L15 : aux
    //    crans 3 et 5, le passage fautif est « celui, et celui-là seul, où la
    //    `version_corrigee` du matériau diffère de son `contenu` » (`02-` §5).
    //    Le diff se calcule DANS CE FICHIER, qui est `server-only`, et **seules
    //    les positions descendent** — la version corrigée n'entre à AUCUN
    //    moment dans `VueDuDeroule`. ⚠️ C'est LA RÉPONSE : « la
    //    `reponse_attendue` est la version corrigée à la transformation »
    //    (`02-` §2.3.4). Le même raisonnement que la crédence — « sans quoi
    //    l'élève déclarerait sa sûreté en connaissant la réponse, et la porte 2
    //    ne mesurerait plus rien ».
    .select('ordre, defaut, distracteurs, reponse_attendue, pourquoi_juste, '
      + 'exercices_materiaux(contenu, version_corrigee)')
    .eq('exercice_id', depot.exercice_id).order('ordre')
  const casBruts = (casLus ?? []) as unknown as Array<{
    ordre: number
    defaut: string | null
    distracteurs: unknown
    reponse_attendue: string | null
    /** ⭐ C4-L14 — « pourquoi ce candidat-là est le bon » (`08-` §5.2). */
    pourquoi_juste: string | null
    /** ⛔ `version_corrigee` : lue ici, et servie AU SEUL CRAN 9 — voir le
     *  `select` et l'appel à `composerLaCorrection`. Partout ailleurs elle
     *  reste au serveur : elle EST la réponse. */
    exercices_materiaux:
      | { contenu?: string; version_corrigee?: string | null }
      | Array<{ contenu?: string; version_corrigee?: string | null }>
      | null
  }>

  const consignes = Array.isArray(depot.exercice.consigne_instanciee)
    ? (depot.exercice.consigne_instanciee as unknown[]).map((x) => String(x ?? ''))
    : [String(depot.exercice.consigne_instanciee ?? '')]

  // ── ⭐⭐ C4-L15 — LE GUIDE NE S'AFFICHE PLUS AU CRAN 6 ────────────────────
  // `04-` §14.1 : « AU CRAN 6, LE GUIDE EST DANS LA CONSIGNE — ET NE S'AFFICHE
  // DONC PAS DEUX FOIS. » Les cinq patrons du cran 6 finissent tous par
  // `<les appuis nommés>` : ce que le §14.2 nomme EST DÉJÀ SERVI, comme seconde
  // moitié de la consigne. **L'élève lisait la même phrase deux fois, à dix
  // lignes d'écart.** Décision de Louis, 24/08 : « si le guide est dans la
  // consigne à chaque fois, alors pas la peine d'afficher le guide ».
  //
  // ⭐ LA CONDITION EST DÉRIVÉE, PAS UN NUMÉRO DE CRAN. La doctrine met `guide`
  //    à `complet` au cran 2, `léger` au cran 6, `null` aux sept autres (`02-`
  //    §2.2) : **« léger » désigne le cran 6 et lui seul.** La colonne était
  //    chargée depuis C4-L11 et n'était utilisée nulle part ; elle sert enfin.
  // ⛔ LE CRAN 2 NE SUIT PAS CETTE RÈGLE : sa case est `<ce qui est servi>`, qui
  //    NOMME le guide sans le contenir — la consigne annonce, le bloc montre.
  //    **Le cran 8 n'a pas de guide.**
  // ⛔ LE CHAMP RESTE OBLIGATOIRE AU CRAN 6, et on n'y touche pas : c'est LUI
  //    qui remplit la case du patron. Le refus n° 12 (`verifie-import.ts`) et
  //    son jumeau de l'écran de conception restent intacts. Ce geste retire un
  //    BLOC DE L'ÉCRAN ; il ne touche pas un mot de la consigne.
  //
  // ⚠️⚠️ LA GARDE, ET POURQUOI ELLE EXISTE. Les deux voies ne se comportent pas
  //    pareil. En conception EN LIGNE, `banqueDeConsignes` COMPOSE la consigne
  //    du cran 6 — `patron.replace('<les appuis nommés>', …)` — : le guide y est
  //    dans la consigne, prouvablement. Par IMPORT, l'écran sert la
  //    `consigne_instanciee` TELLE QUE LE FICHIER L'A ÉCRITE, et **rien ne
  //    contrôle qu'une consigne de cran 6 porte son guide** (`08-` §5.2 dit
  //    seulement « le texte que l'élève lit »). Cacher le bloc
  //    inconditionnellement ferait donc reposer la lisibilité de l'exercice sur
  //    une propriété que rien ne garantit sur l'une des deux voies — et **un
  //    cran 6 mal fait deviendrait un cran 8 sans que rien ne le dise** : le
  //    patron du cran 8 est celui du cran 6 amputé de sa case, mot pour mot, et
  //    la consigne resterait grammaticalement parfaite.
  // ⭐ MESURÉ AVANT DE DÉCIDER, sur `generateur/banque/banque.json` (24/08,
  //    148 exercices) : **7 exercices au cran 6, et 7 sur 7 portent leur guide
  //    LITTÉRALEMENT dans leur consigne** — tous entrés par la voie `composer`.
  //    La garde ne mord donc sur aucun exercice réel : elle ne se déclenche que
  //    là où la règle serait FAUSSE.
  // ⚠️ Les blancs se normalisent des deux côtés : la comparaison porte sur le
  //    texte, pas sur sa mise en page.
  const guideBrut = depot.exercice.guide
  const memeSouffle = (x: string) => x.replace(/\s+/g, ' ').trim()
  const guideDansLaConsigne = guideBrut !== null
    && memeSouffle(String(guideBrut)) !== ''
    && consignes.some((c) => memeSouffle(c).includes(memeSouffle(String(guideBrut))))
  // ⭐⭐ 29/08 — LE SENS DE CETTE GARDE S'EST INVERSÉ, ET C'EST UN AMENDEMENT DE
  //    SOURCE QUI L'A FAIT. Le `04-` §14.1 plaçait un gabarit
  //    `<les appuis nommés>` au patron du cran 6, que la fabrique remplissait
  //    AVEC LE GUIDE : les 14 exercices de cran 6 recopiaient donc 100 % de leur
  //    guide dans leur consigne, et ce repli existait pour ne pas le servir deux
  //    fois. **Le gabarit est RETIRÉ des cinq modes** — l'appui vit dans le
  //    `guide`, et là seulement.
  // ⛔ POURQUOI IL A FALLU LE RETIRER, ET CE N'ÉTAIT PAS DU CONFORT. Le `02-`
  //    6.0 §2.3.4 veut que l'aide du cran 6 se déroule À LA DEMANDE et que **ce
  //    déroulé COMPTE comme une aide** — or on ne compte pas une aide que
  //    l'élève a déjà reçue sans l'avoir demandée. Le commentaire qui vivait ici
  //    l'avait vu et s'y résignait : « au cran 6, ce compteur tombera
  //    STRUCTURELLEMENT à zéro pour le guide, et un compteur à zéro ressemble à
  //    un élève autonome ». **Il ne tombe plus : le bloc est servi, et le
  //    dépliage s'inscrit dans `exercices_depots.aide_consommee`** (`AIDES_COMPTEES`,
  //    `./depot` ; compteur lu par le `01-` §11).
  // ⚠️ LA GARDE RESTE, RETOURNÉE : c'est désormais une consigne QUI PORTE ENCORE
  //    son guide qui est l'anomalie — une instance d'avant l'amendement, non
  //    ré-importée. On la replie alors, pour ne pas la servir deux fois, et on
  //    le DIT au professeur au lieu de le taire.
  const guideReplie = cran?.guide === 'léger' && guideDansLaConsigne
  if (guideReplie) {
    avertissements.push(
      'cran 6 : cette consigne porte encore son guide en toutes lettres — une '
      + "instance d'avant l'amendement du `04-` §14.1 (29/08), non ré-importée. "
      + 'Le bloc « De quoi t\'aider » est REPLIÉ pour ne pas servir deux fois la '
      + "même ligne. ⚠️ Tant qu'elle n'est pas ré-importée, son dépliage ne "
      + "s'inscrit pas dans `aide_consommee`, et l'élève y paraîtra plus "
      + 'autonome qu\'il ne l\'est.')
  }
  const guideServi = guideReplie ? null : guideBrut

  // ⭐⭐ L'ÉTALON — item 86. La RÈGLE vit dans `./correction`, module pur :
  //    ce fichier ne décide rien, il lit le premier cas et appelle.
  // ⚠️ On lit le PREMIER cas : le régime des crans de production est `plein`,
  //    il n'a pas de paire, et un second cas n'y existe pas.
  // ⛔ `ctx.cran`, JAMAIS `depot.exercice.cran` : la colonne brute porte tantôt
  //    un nombre tantôt une chaîne (C4-L11), et `tsc` l'a rappelé ici même.
  const etalonServiIci = etalonServi(
    ctx.cran, !!depot.vf_remis_at,
    casBruts.find((c) => c.ordre === 1)?.reponse_attendue)

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
    const materiauBrut = mat?.contenu ?? null
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

    // ⭐⭐ C4-L15 — CE QUE L'ÉCRAN MET EN ÉVIDENCE DANS LE MATÉRIAU (`02-` §5).
    //    « Au grain du MOT, un exercice sans marquage mesure la RECHERCHE et
    //    non le SENS. » La règle vient de la DOCTRINE (`cran.marquage`), pas
    //    d'un numéro de cran écrit ici : le cran commande, jamais la présence
    //    d'un champ — le cran 5 se marque SANS aucun distracteur, et le cran 4
    //    ne se marque PAS malgré sa `reponse_attendue`.
    // ⚠️ LES CANDIDATS SONT CEUX QUI ONT ÉTÉ RÉELLEMENT SERVIS — `offre.candidats`,
    //    « dans l'ordre réellement mêlé » —, jamais la banque : elle en porte 10
    //    à 15, l'écran en sert QUATRE. Et les quatre se marquent, **la bonne
    //    réponse comprise** : sans elle, le marquage la désignerait.
    // ⚠️ Là où l'offre ne se compose pas (`empechement` non nul, ou cran sans
    //    crédence), il n'y a pas de « candidats servis » : on ne marque rien, et
    //    on ne devine pas.
    const materiau = marquerLeMateriau(materiauBrut, cran?.marquage as string | null, {
      candidats: offre && !offre.empechement ? offre.candidats : [],
      versionCorrigee: mat?.version_corrigee ?? null,
      // ⭐ RÈGLE (2) du `02-` §5 : ce que la consigne CITE se marque, et cette
      //    règle passe avant le diff — elle vaut même quand il est vide.
      consigne: consignes[i] ?? null,
      // ⭐ Les deux exceptions du `02-` 6.2 §5 se lisent sur l'observable.
      observable: depot.exercice.observable_isole_code,
    })

    // ⚠️⚠️ UN CRAN QUI DEVAIT MARQUER ET QUI NE MARQUE RIEN SE DIT AU PROFESSEUR.
    //    Trouvé au smoke du 24/08, sur une instance RÉELLE de cran 3 : le
    //    matériau de la famille « le lien manque » a une `version_corrigee` qui
    //    AJOUTE une phrase — le défaut injecté est une ABSENCE. Le diff est
    //    alors légitimement vide : « UN MANQUE N'EST PAS UN DÉFAUT » (`02-`
    //    §2.3.3), et il n'y a rien DANS le matériau à mettre en évidence.
    // ⭐ Ne rien marquer est JUSTE — marquer l'endroit du manque donnerait la
    //    réponse. Mais la consigne, elle, peut avoir promis « le mot en gras »
    //    (`02-` §5) : le professeur doit savoir que cette instance-là ne le
    //    tiendra pas. **On signale, on ne marque pas au hasard.**
    // ⚠️ Trace SERVEUR, jamais l'élève — le même canal que l'empêchement de
    //    crédence juste au-dessus.
    if (materiau && materiau.length > 0 && !materiau.some((sg) => sg.marque)
        && (cran?.marquage ?? '') !== '' && !/^rien/i.test(String(cran?.marquage))) {
      avertissements.push(
        `cas ${i + 1} : le \`02-\` §5 demande au cran ${ctx.cran} de mettre en évidence `
        + `« ${String(cran?.marquage).slice(0, 60)}… », et RIEN n'a été trouvé dans le matériau. `
        + 'Trois causes légitimes, et aucune n\'est une panne : le défaut injecté est une '
        + 'ABSENCE (la version corrigée AJOUTE, et « un manque n\'est pas un défaut » — `02-` '
        + '§2.3.3) · le matériau est calibré sur une RÉUSSITE (`02-` §2.3.1 a) · la '
        + '`version_corrigee` est absente (elle est facultative — `08-` §4). ⚠️ Si la consigne '
        + 'promet « le mot en gras », elle ne le tiendra pas sur cette instance.')
    }

    cas.push({
      ordre: i + 1,
      consigne: baliser(consignes[i] ?? consignes[0] ?? ''),
      materiau,
      credence: offre,
      // ⭐⭐ 01/09 — L'ENTRÉE N'EST UNE CRÉDENCE QUE SI ELLE EN PORTE UNE. Zone
      //    et crédence se fusionnent dans la même entrée (`gestes.ts`) : lue
      //    telle quelle, une simple sélection cachait le formulaire de
      //    pourcentage et rendait la correction due avant la remise.
      credenceDonnee: credenceDonneeDe(credencesDonnees.find((c) => c.cas === i + 1)),
      // ⭐ ITEM 77 — la désignation. Le drapeau suit LE CRAN, jamais la cible :
      //    voir `CasServi.designationDemandee`.
      designationDemandee: demandeUneDesignation(regimeDeMarquage(
        cran?.marquage as string | null)),
      ...lireLaDesignation(credencesDonnees.find((c) => c.cas === i + 1)),
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
    // ⭐⭐ ITEM 78 — AU CRAN 9, LA RÉPONSE SE DÉRIVE DU MATÉRIAU. La table des
    //    crans y met `reponse_attendue` à `null` (`02-` §2.2), et la correction
    //    était donc VIDE entre les deux cas de la paire — alors que le `02-`
    //    §2.3.1 a la veut servie. Elle EST la `version_corrigee` (`02-` §2.3.4).
    // ⛔ ET SEULEMENT AU CRAN 9. Aux crans 5 et 7 le régime est « pas de vf,
    //    sauf escalade » : servir la version corrigée donnerait la réponse
    //    AVANT la version finale, et `delta_v1_vf` ne mesurerait plus rien. Le
    //    cran 9 est « par paires », il n'a pas de vf à protéger, et le second
    //    cas porte un AUTRE matériau. `correctionDue` garantit par ailleurs
    //    qu'on ne sert jamais avant la crédence — c'est le motif même de la
    //    garde du `select` ci-dessus.
    const mat = Array.isArray(brut.exercices_materiaux)
      ? brut.exercices_materiaux[0] : brut.exercices_materiaux
    const versionCorrigee = ctx.cranCode === 'diagnostic_fin'
      ? (mat?.version_corrigee ?? null) : null
    return composerLaCorrection(
      { reponseAttendue: brut.reponse_attendue, pourquoiJuste: brut.pourquoi_juste,
        distracteurs: brut.distracteurs, versionCorrigee },
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

  // ── Hors des six temps : « signaler que l'exercice a un problème » ──
  // ⭐ Il vit HORS DU FIL, et c'est la règle : l'élève peut le faire « avant le
  //   passage, ou après » (Louis, 31/08). Un signalement rangé dans un temps
  //   serait fermé aux deux bouts.
  // ⚠️ Les deux lectures sont GROUPÉES : à OFF, celle du signalement ne sert à
  //   rien, mais elle coûte un aller-retour qu'un `if` séquentiel paierait de
  //   toute façon en latence sur le chemin ouvert.
  const [porteSignalement, mienSignalement] = await Promise.all([
    lireLaPorteDuSignalement(admin),
    lireLeSignalementDuDepot(admin, depotId),
  ])
  const signalement = { ouvert: porteSignalement, mien: mienSignalement }

  // ── Temps 5 : l'échéance de la version finale ──
  const echeanceVf = await construireLEcheance(depot, a.delaiVfJours, regime)
  const sujet = await sujetDeLExercice(admin, depot)

  const temps = tempsServis(regime)
  return {
    depotId, ouvert: a.ouvert,
    // ⚠️ La MÊME fonction que la liste de l'accueil (`utils/codex-onglets/regles`) :
    //    deux titres calculés autrement seraient deux titres qui divergent.
    titre: titreDeLaConsigne(depot.exercice.consigne_instanciee),
    echeance: depot.echeance,
    v1RemiseLe: depot.v1_remis_at,
    credenceEstLaReponse: surDesCandidats,
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
    guide: guideServi,
    etalon: etalonServiIci,
    // ⭐ C5-L2 — SERVI PAR `lireContexte`, DONC SANS UNE LECTURE DE PLUS. La
    //    tranche et sa découpe se calculent une fois, au même endroit, et la
    //    chaîne et l'écran lisent le même objet : deux lectures auraient fini
    //    par servir au modèle un texte que l'élève n'avait pas eu sous les yeux.
    texteSupport: ctx.texteSupport,
    sujet,
    coTexte: ctx.coTexte,
    cas, corrections,

    dureeIndicativeMin: dureeMin,
    microQuestionDue: dureeMin !== null && ecouleMs !== null
      && depot.v1_remis_at === null && microQuestionDue(dureeMin, ecouleMs),
    motifDepassement: depot.motif_depassement,
    texteV1: depot.texte_v1, texteVf: depot.texte_vf,
    telemetrie: lireTelemetrie(depot.saisie_telemetrie),
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

    signalement,

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

/**
 * ⭐ L'ÉNONCÉ DU SUJET — 01/09. La source d'abord (c'est elle que la consigne
 * désigne), la cible à défaut. ⚠️ supabase-js NE LÈVE PAS : un sujet illisible
 * passe pour un exercice sans sujet, et on le journalise plutôt que de casser
 * l'écran — l'exercice reste passable sans lui, il l'a toujours été.
 */
async function sujetDeLExercice(admin: Admin, depot: DepotMaison): Promise<string | null> {
  const id = depot.exercice.materiau_source_sujet_id ?? depot.exercice.materiau_cible_sujet_id
  if (!id) return null
  const { data, error } = await admin.from('exercices_sujets')
    .select('enonce').eq('id', id).maybeSingle()
  if (error) {
    console.error(`[deroule] sujet illisible (${id}) — ${error.code} ${error.message}`)
    return null
  }
  const enonce = typeof data?.enonce === 'string' ? data.enonce.trim() : ''
  return enonce === '' ? null : enonce
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
