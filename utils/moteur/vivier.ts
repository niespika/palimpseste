// ============================================================================
// C4 · L12 — LE VIVIER : la COUCHE 4, et ses trois filtres (`01-` §4).
// ----------------------------------------------------------------------------
// « LE ROUTEUR N'HABILLE RIEN : il SÉLECTIONNE parmi les instances que le
//   professeur a déjà écrites. » `poserLaSemaine` rend UN PLAN — une liste
//   ordonnée de renvois vers des `exercices.id` QUI EXISTENT DÉJÀ. Le moteur
//   CHOISIT dans un vivier ; il ne fabrique rien. Ce fichier constitue ce vivier.
//
// LES TROIS FILTRES, dans l'ordre où le §4 les écrit :
//   1. LE PARCOURS — « le routeur ne sert que ce qui relève de l'inscription de
//      l'élève ». Deux mécanismes, JAMAIS COMBINÉS (`02-` §4) : le `genre` de
//      l'INSTANCE pour les trois objets terminaux, et `exclusions_parcours[]`
//      déclaré par le TYPE pour les objets qui ne changent pas avec le genre.
//      « Est exclu l'élève dont TOUS ses parcours figurent dans la liste. »
//   2. LE COURS VU — « le routeur ne sert que les instances rattachées à un cours
//      DÉJÀ VU ». Le rattachement se déclare SUR LE MATÉRIAU, à trois états :
//      `generique` (servable en tout temps) · `liste` (servable dès qu'AU MOINS UN
//      cours a été en partie vu) · `aucun` (JAMAIS SERVABLE — « l'absence a un
//      sens fort : elle ne dit pas "pas encore rempli", elle dit "jamais servi" »).
//   3. LE NON-SPOILER — « le routeur n'assigne JAMAIS au-delà de la position de
//      lecture connue de l'élève. LA BORNE DE LA CLASSE N'EST PAS LA SIENNE. »
//      L'échelle est le plan de lecture du livre ; la position de l'élève est
//      « la dernière de ces semaines qu'il a LUI-MÊME TERMINÉE ». À défaut de
//      position connue, on sert « un texte court HORS LIVRE ».
//
// ⚠️ « SEMAINE » NE VEUT PAS DIRE SEMAINE : `plan_semaine` et `semaine_index`
//    sont des ORDINAUX DE SÉANCE (`utils/aletheia-seance.ts`), jamais des dates.
//    On ne les compare JAMAIS à un `cycle_lundi`. Le `07-` §1.1 le dit : « c'est
//    la même échelle, et le code les compare PAR ÉGALITÉ ».
//
// Ce fichier est PUR : il reçoit ce qui a été lu, il ne lit rien.
// ============================================================================

import { ciblesPossibles, type Candidat, type ExercicePose } from '../routeur/semaine'
import { motifDeFermeture, statutDeService, type PorteDUnObjet, type StatutDeService }
  from '../registre/porte'
import { cyclesEcoules as cyclesEcoulesDepuis } from '../routeur/cycles'
import { ordonnerParObjet, type ContexteObjets } from './objets'
import type { Competence, Couverture, Geste, Grain, Parcours } from '../routeur/types'

// ════════════════════════════════════════════════════════════════════════════
// CE QUE LE VIVIER REÇOIT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Un matériau rattaché à une instance — un `exercices_textes` ou un
 * `exercices_sujets`, en source ou en cible. C'est LUI qui porte le rattachement
 * au cours et la place dans le plan de lecture (`07-` §1.1), jamais l'instance.
 */
export interface MateriauRattache {
  sorte: 'texte' | 'sujet'
  id: string
  role: 'source' | 'cible'
  /**
   * `generique` · `liste` · `aucun` · **`notions`**. Le domaine est celui de la
   * colonne — et il en compte QUATRE depuis C4-L16 (format 1.3).
   * ⚠️ Le quatrième n'est pas encore LU par la couche 4 : voir `filtreDuCoursVu`.
   */
  coursEtat: 'generique' | 'liste' | 'aucun' | 'notions'
  /**
   * Les cours APPARIÉS — `exercices_textes_cours.cours_id` non nuls.
   * ⚠️ « `cours_id` NULL signifie DÉCLARÉ MAIS PAS ENCORE APPARIÉ » : la
   *    déclaration ne rend pas servable, seul l'appariement le fait.
   */
  coursApparies: string[]
  /** Combien de rattachements sont déclarés en tout — apparié ou non. */
  coursDeclares: number
  /** `exercices_textes.plan_livre_id` → l'ARTEFACT de référence, pas le livre. */
  planLivreReferenceId: string | null
  /** L'ORDINAL de séance du plan de lecture. Jamais une date, jamais une semaine. */
  planSemaine: number | null
  /** `a_valider` · `valide` · `retire`. */
  statut: string
  bloque: boolean
}

/** Une instance telle que la couche 4 la regarde. */
export interface InstanceDuVivier {
  exerciceId: string
  /** `exercices_types.code` — l'objet. */
  objet: string
  grain: Grain
  /** Le GESTE du cran (`02-` §2.3.2), dérivé de la doctrine — jamais du numéro. */
  geste: Geste
  /** Le NUMÉRO en base (`utils/cran.ts`), et son CODE, résolu par la doctrine. */
  cranNumero: number | null
  cranCode: string | null
  /** `07-` §1.1 — « la SEULE valeur que le budget décompte », dérivée par la doctrine. */
  dureeMin: number | null
  lieu: 'maison' | 'classe'
  /**
   * `exercices.classe_id` — NULLABLE, et le NULL a un sens. Il est écrit par UN
   * SEUL geste de production : `assignerALaClasse`
   * (`app/prof/conception/actions.ts`), « en faire un exercice commun à
   * toute une classe ». Une instance qui n'est jamais passée par ce bouton n'a
   * pas de classe — et ce n'est pas « la classe de quelqu'un d'autre ».
   */
  classeId: string | null
  statut: string
  bloque: boolean
  /** `exercices.genre` — renseigné pour les TROIS OBJETS TERMINAUX seulement. */
  genre: string | null
  /** `exercices_types.exclusions_parcours` — déclaré par le TYPE. */
  exclusionsParcours: string[]
  /** Les compétences que l'instance MESURE, avec leurs modes élus. */
  modesParCompetence: Record<string, string[]>
  /** `02-` §2.3.2 — la couverture par compétence, dérivée du cran et de l'instance. */
  couverture: Record<string, Couverture>
  materiaux: MateriauRattache[]
  /**
   * ⭐⭐ C7-L6 — LE DEVOIR (`01-` v5.9 §3 : « le devoir est l'unité de service, la
   *    clé l'unité de mesure »). Les matériaux FABRIQUÉS que les cas de
   *    l'instance servent (`exercices_cas.materiau_id`) ; au cran 2, qui n'a pas
   *    de matériau, le devoir du cas A de sa clé, retrouvé par la souche de
   *    l'`id_import` (`ex-gab-<souche>-c2` → `mat-gab-<souche>-a`). Vide pour une
   *    instance sans devoir (examens, instances de la voie du professeur).
   */
  devoirs: string[]
  /**
   * ⭐⭐ C7-L7 — LA CLÉ de l'instance (`exercices_cas.probleme`, la clé
   *    `objet.constituant.variante` de la grille du `09-`) et L'OBSERVABLE qu'elle
   *    porte, lu dans la doctrine dérivée en base (`exercices_problemes` :
   *    `observable_code`, `observable_competence`, `observable_route`). « Choisir
   *    la clé, c'est choisir l'observable » (`01-` v5.11 §4, couche 3).
   *    `cle` nul : une instance de la banque 1.4 — elle passe comme hier.
   *    `observable` nul avec une clé : la clé n'a aucun observable (19 sur 205 —
   *    `observable_route = false`) ; la règle 4 ne peut pas la classer, elle passe
   *    APRÈS celles qui en ont un, motif journalisé. Facultatifs : un lecteur
   *    d'avant ce lot n'en porte pas.
   */
  cle?: string | null
  observable?: { code: string; competence: string } | null
  /**
   * ⭐⭐ LE CO-TEXTE des crans de production — `exercices.cotexte_materiau_id`.
   *
   * ⛔ **IL N'ENTRE PAS DANS `materiaux`, ET C'EST VOULU.** Cette liste sert au
   *    `filtreDuCoursVu`, et « le rattachement se déclare SUR LE MATÉRIAU »
   *    (`01-` §4) — mais un matériau FABRIQUÉ n'en porte aucun : le `08-` §4
   *    énumère ce qu'il ne porte pas, et le cours en fait partie. L'y mettre le
   *    ferait tomber dans la branche `liste` du filtre et ressortir en
   *    `cours_non_apparie` — un motif FAUX, qui enverrait chercher la réparation
   *    à l'écran du rattachement, où il n'y a rien à faire.
   * ⭐ Ce qu'on en contrôle est donc son seul état PROPRE : `statut`.
   * ⚠️ **PAS de `bloque`** : cette table n'a pas cette colonne, contrairement
   *    aux textes, aux sujets et aux instances. Vérifié en base.
   */
  coTexte: { id: string; statut: string } | null
}

/** Ce que le vivier sait de l'élève. Tout est déjà lu. */
export interface ContexteDuVivier {
  /** L'UNION des parcours de ses inscriptions actives (`07-` §1.3). */
  parcours: readonly Parcours[]
  /**
   * Les cours (`scriptorium_contenus.id`) qu'AU MOINS UNE de ses classes a
   * « en partie vus ». ⚠️ « Le rattachement se fait à la CLASSE, et un bi-classe
   * en a deux : servable dès qu'AU MOINS UN cours a été en partie vu. »
   */
  coursVus: ReadonlySet<string>
  /**
   * Sa position de lecture, par `aletheia_livre_reference.id` — l'ordinal de la
   * dernière séance TERMINÉE. `null`/absent = position inconnue.
   */
  positionsDeLecture: ReadonlyMap<string, number | null>
  /** Les instances dont il porte DÉJÀ un dépôt — jamais resservies (piège 30). */
  instancesDejaDeposees: ReadonlySet<string>
  /**
   * Les classes de ses inscriptions ACTIVES — l'UNION, comme les parcours et
   * les cours vus : un bi-classe en a deux, et une instance de l'une OU de
   * l'autre lui revient.
   */
  classesDeLEleve: ReadonlySet<string>
  /**
   * ⭐ C7-L5 — LA PORTE DES CRANS PAR OBJET (`10-` §7 ; `01-` v5.8 §3) : « la
   *    distribution par palier choisit PARMI les crans débloqués, elle ne
   *    débloque rien ». Absente ou inactive ⇒ la couche 4 sert comme hier.
   */
  porte?: { actif: boolean; de: (objet: string) => PorteDUnObjet } | null
  /**
   * ⭐⭐ C7-L6 — LES DEVOIRS DÉJÀ SERVIS à l'élève : devoir → date du dernier
   *    dépôt (`assigne_at`, ISO). Avec `cycleLundi`, c'est ce que la quarantaine
   *    lit (`01-` v5.9 §8.10). Absent ⇒ pas de quarantaine (la couche 4 sert
   *    comme hier).
   */
  devoirsServis?: ReadonlyMap<string, string> | null
  /** Le lundi du cycle posé (`YYYY-MM-DD`) — la quarantaine se compte en cycles. */
  cycleLundi?: string | null
  /** Les cycles d'attente avant qu'un devoir revienne — `QUARANTAINE_CYCLES` par défaut. */
  quarantaineCycles?: number
}

/**
 * `01-` v5.9 §8.10 — « un devoir servi à un élève au cycle N ne lui est pas
 * resservi avant le cycle N + 2 — deux semaines par défaut (provisoire —
 * réglage empirique) ». Le nombre vit ici, et nulle part ailleurs.
 */
export const QUARANTAINE_CYCLES = 2

/** Pourquoi une instance n'est pas entrée au vivier. « Un vide expliqué. » */
export type MotifDEcart =
  | 'statut'            // ni `concu` ni `assigne`
  | 'bloquee'
  | 'lieu_classe'       // la voie du professeur : imposé en classe, hors routage
  | 'classe_autre'      // instance estampillée d'une classe où l'élève n'est pas inscrit
  | 'sans_duree'        // la doctrine ne rend aucune durée pour (objet × cran)
  | 'parcours_genre'
  | 'parcours_exclusion'
  | 'aucun_materiau'
  | 'cours_jamais_servable'
  | 'cours_non_apparie'
  | 'cours_pas_encore_vu'
  // ⭐ C4-L16 — le quatrième état existe en base et RIEN ICI NE LE LIT ENCORE.
  //   Ce motif dit exactement cela, et rien de plus : voir `filtreDuCoursVu`.
  | 'cours_par_notions_non_lu'
  | 'non_spoiler'
  | 'materiau_non_valide'
  // ⭐ C7-L5 — la porte du registre (`10-` §7) : le cran n'est pas ouvert sur cet
  //   objet, ou la semaine de méthode ne le sert pas. Derrière `gabarit_actif`.
  | 'porte_registre'
  // ⭐ C7-L6 — le devoir a déjà été servi à l'élève il y a moins de deux cycles
  //   (`01-` v5.9 §8.10). Jamais en semaine de méthode.
  | 'devoir_en_quarantaine'
  // ⭐ C7-L6 — la semaine de méthode est bornée à deux objets par élève, et à un
  //   seul devoir par objet (`01-` v5.9 §5) ; le reste attend le cycle suivant.
  | 'methode_hors_quota'
  // ⭐ C7-L7 — l'objet, quand il se sert (`01-` v5.11 §4, couche 3). Ces écarts se
  //   posent À LA POSE, par objet ; ils sont comptés au bilan et journalisés sur
  //   la décision (`alternatives_ecartees.objet.ecartes`).
  | 'objet_tenu'                 // règle 5 : tous les crans de la bande sont tenus — il sort du centre
  | 'objet_un_par_cycle'         // règle 2 : un exercice par objet ouvert et par cycle, PB5 et pull compris
  | 'objet_entree_hors_budget'   // règle 3 (iii) : la séquence de méthode ne tient plus sous le plafond
  | 'objet_sans_cran_ouvert'     // règle 2 : la bande n'a plus de cran non tenu que la porte ouvre
  | 'sans_observable'            // piège 18 : la clé ne porte aucun observable — classée après, jamais élue d'abord
  | 'deja_deposee'
  | 'aucune_competence_ciblable'

export interface EcartDuVivier {
  exerciceId: string
  motif: MotifDEcart
  detail: string
}

// ════════════════════════════════════════════════════════════════════════════
// LA COUVERTURE — « la liste borne, la couverture remplit » (`02-` §2.3.2)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `02-` §2.3.2 et `01-` §5 — ce que le GESTE fait des compétences déclarées.
 *
 * « `produire` déclare `exerce` : sont ciblables toutes les compétences que le
 *   §6 de leur fiche déclare en jeu aux crans de production — LES AUTRES Y SONT
 *   `observable_seul`. `transformer` et `diagnostiquer` déclarent `isole`, et
 *   l'instance choisit UN SEUL défaut injecté — DONC UNE SEULE CIBLE. »
 *
 * @param exerceDuCran ce que `couverture_observables` liste en `exerce` au cran
 *        servi (vide aux crans qui isolent).
 * @param observableIsole la compétence que l'INSTANCE isole
 *        (`exercices.observable_isole_competence`), aux crans qui isolent.
 * @param isole ⭐ 06/09/2026 — ce que le CRAN déclare (`exercices_crans.couverture_observables`,
 *        `02-` v6.7 §2.2) : le cran 2 PRODUIT et ISOLE — le trou est une absence, et
 *        l'instance isole l'observable de sa clé « pièce absente ». Le geste ne suffit
 *        donc plus à dire la couverture ; à défaut, il la dit comme avant.
 */
export function couvertureDeLInstance(
  competencesDeclarees: readonly string[],
  geste: Geste,
  exerceDuCran: readonly string[],
  observableIsole: string | null,
  isole: boolean = geste !== 'produire',
): Record<string, Couverture> {
  const out: Record<string, Couverture> = {}
  for (const c of competencesDeclarees) {
    if (!isole) {
      out[c] = exerceDuCran.includes(c) ? 'exerce' : 'observable_seul'
    } else {
      // Un seul défaut injecté, donc UNE SEULE cible : celle que l'instance isole.
      out[c] = observableIsole !== null && c === observableIsole ? 'isole' : 'observable_seul'
    }
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// FILTRE 1 — LE PARCOURS (`01-` §4, couche 4 ; `02-` §4)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `02-` §4 — « DEUX MÉCANISMES, ET C'EST LE RAPPORT AU GENRE TERMINAL QUI DÉCIDE
 * LEQUEL S'APPLIQUE ». Ils NE SE MÉLANGENT JAMAIS.
 *
 *  · VARIANTE — l'INSTANCE déclare son `genre` pour les trois objets terminaux :
 *    « il sert à un élève une instance dont le `genre` relève d'UN DE SES
 *    PARCOURS. `generique` VA À TOUT LE MONDE ; un bi-classe reçoit LES DEUX
 *    CÔTÉS, et c'est voulu. »
 *  · EXCLUSION — le TYPE déclare `exclusions_parcours[]` : « est exclu l'élève
 *    dont TOUS ses parcours figurent dans la liste, NON CELUI QUI EN PORTE UN. »
 *
 * ⚠️ LE PIÈGE DE LA VACUITÉ (`07-` §1.3) : la règle d'exclusion est VRAIE PAR
 *    VACUITÉ sur un ensemble de parcours vide, et exclurait l'élève de tout. Il
 *    ne se referme pas ici : `budgetDeLEleve` écarte l'élève EN AMONT, avec son
 *    motif nommé — jamais un service silencieusement réduit aux génériques.
 *    Cette fonction REFUSE donc de trancher sur un ensemble vide.
 */
export class ParcoursVide extends Error {}

export function filtreDeParcours(
  instance: Pick<InstanceDuVivier, 'genre' | 'exclusionsParcours'>,
  parcours: readonly Parcours[],
): { retenue: boolean; motif: MotifDEcart | null; detail: string } {
  if (parcours.length === 0) {
    throw new ParcoursVide(
      'aucun parcours : la règle d\'exclusion serait VRAIE PAR VACUITÉ et exclurait l\'élève de '
      + 'tout. Cet élève se refuse EN AMONT, par `budgetDeLEleve`, avec son motif nommé '
      + '(`07-` §1.3, condition de recette).')
  }

  // La VARIANTE — le `genre` de l'instance. Il porte son parcours DANS SON NOM
  // (`_tc`, `_hlp`), sauf `generique`, « qui ne relève d'aucun parcours et vaut
  // pour tous » (`02-` §4).
  if (instance.genre !== null && instance.genre !== 'generique') {
    const relevant = parcours.some((p) => instance.genre!.endsWith(`_${p}`))
    if (!relevant) {
      return { retenue: false, motif: 'parcours_genre',
        detail: `genre « ${instance.genre} » hors des parcours de l'élève (${parcours.join(', ')}).` }
    }
    // ⛔ « Les deux mécanismes NE SE MÉLANGENT PAS » : un objet terminal déclare
    //    son genre, et l'exclusion de type ne s'y applique pas.
    return { retenue: true, motif: null, detail: '' }
  }

  // L'EXCLUSION — « TOUS ses parcours figurent dans la liste », jamais un seul.
  const excl = instance.exclusionsParcours
  if (excl.length > 0 && parcours.every((p) => excl.includes(p))) {
    return { retenue: false, motif: 'parcours_exclusion',
      detail: `le type exclut [${excl.join(', ')}] et TOUS les parcours de l'élève `
        + `(${parcours.join(', ')}) y figurent.` }
  }
  return { retenue: true, motif: null, detail: '' }
}

// ════════════════════════════════════════════════════════════════════════════
// FILTRE 2 — LE COURS VU (`01-` §4, couche 4 ; `07-` §1.1)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §4 — « le routeur ne sert que les instances RATTACHÉES À UN COURS DÉJÀ VU.
 * Le rattachement se déclare SUR LE MATÉRIAU. […] Le rattachement est FACULTATIF,
 * ET SON ABSENCE VAUT "JAMAIS SERVABLE" : rien ne part avant que le professeur
 * l'ait trié. »
 *
 * ⛔ D'où le sort d'une instance SANS AUCUN MATÉRIAU : elle ne porte aucun
 *    rattachement, donc rien ne la déclare servable, donc elle n'entre pas. Ce
 *    n'est pas une sévérité de plus : c'est la même règle, lue jusqu'au bout.
 *    L'écart se NOMME (`aucun_materiau`) pour que le vide s'explique.
 *
 * ⛔ Et « `cours_id` NULL = déclaré mais pas encore apparié » : la déclaration
 *    seule ne rend pas servable.
 *
 * ⚠️ « Servable dès qu'AU MOINS UN cours a été en partie vu » — au moins un, sur
 *    l'UNION des classes de l'élève. Mais TOUS les matériaux de l'instance
 *    doivent l'être : servir une cible vue sur une source à venir spoilerait la
 *    source.
 */
export function filtreDuCoursVu(
  materiaux: readonly MateriauRattache[],
  coursVus: ReadonlySet<string>,
): { retenue: boolean; motif: MotifDEcart | null; detail: string } {
  if (materiaux.length === 0) {
    return { retenue: false, motif: 'aucun_materiau',
      detail: 'aucun matériau rattaché : rien ne déclare cette instance servable, et '
        + '« l\'absence de rattachement vaut JAMAIS SERVABLE ».' }
  }
  for (const m of materiaux) {
    const quoi = `${m.sorte} ${m.id.slice(0, 8)} (${m.role})`
    if (m.coursEtat === 'aucun') {
      return { retenue: false, motif: 'cours_jamais_servable',
        detail: `${quoi} : \`cours_etat = aucun\` — « elle ne dit pas "pas encore rempli", `
          + 'elle dit "JAMAIS SERVI" ».' }
    }
    if (m.coursEtat === 'generique') continue
    // ⭐⭐ C4-L16 — LE QUATRIÈME ÉTAT EST NOMMÉ POUR CE QU'IL EST, ET RIEN DE
    //   PLUS. Le rattachement par notions existe en base depuis le format 1.3 :
    //   c'est le COURS qui déclare ce qu'il traite, et le matériau s'y rattache
    //   seul (`01-` §4 couche 4 ; `08-` §3). **Le FILTRE qui le lit n'est pas
    //   écrit** — c'est le premier geste de `C4-L12` —, et l'écrire ici en
    //   ferait un second domicile : « deux filtres de service divergeraient au
    //   premier amendement » (`07-` §2).
    // ⛔ MAIS UN MOTIF FAUX N'EST PAS « PAS DE FILTRE » : C'EST UN FILTRE QUI
    //   MENT. Sans cette branche, un `'notions'` tombait dans le `default` de la
    //   `liste` juste dessous et ressortait en `cours_non_apparie` — « N cours
    //   déclaré(s), AUCUN apparié » —, alors qu'il n'y a AUCUN cours déclaré à
    //   apparier. Le motif envoyait chercher la réparation à l'écran du
    //   rattachement, **où il n'y a rien à faire**.
    // ⭐ Le sujet reste écarté, exactement comme avant ; c'est le motif qui
    //   cesse de mentir. Le jour où `C4-L12` ouvre la troisième voie, cette
    //   branche devient l'INTERSECTION — `notionsPartagees()` de
    //   `utils/fabrique/notions.ts` en est la brique, déjà écrite et éprouvée —
    //   confrontée aux notions des cours VUS.
    if (m.coursEtat === 'notions') {
      return { retenue: false, motif: 'cours_par_notions_non_lu',
        detail: `${quoi} : rattachement par notions (format 1.3) — la couche 4 ne le lit pas `
          + 'encore. Le matériau ne déclare AUCUN cours : ce sont les cours qui déclarent leurs '
          + 'notions, et l’intersection est le premier geste de C4-L12. ⛔ Rien à réparer à '
          + 'l’écran du rattachement.' }
    }
    // `liste` — il faut un cours APPARIÉ, et vu.
    if (m.coursApparies.length === 0) {
      return { retenue: false, motif: 'cours_non_apparie',
        detail: `${quoi} : ${m.coursDeclares} cours déclaré(s), AUCUN apparié — `
          + '« déclaré mais pas encore apparié » ne rend pas servable.' }
    }
    if (!m.coursApparies.some((c) => coursVus.has(c))) {
      return { retenue: false, motif: 'cours_pas_encore_vu',
        detail: `${quoi} : aucun de ses ${m.coursApparies.length} cours appariés n'a été vu par `
          + 'une classe de cet élève.' }
    }
  }
  return { retenue: true, motif: null, detail: '' }
}

// ════════════════════════════════════════════════════════════════════════════
// FILTRE 3 — LE NON-SPOILER (`01-` §4, couche 4)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §4 — « la position de l'élève est LA DERNIÈRE DE CES SEMAINES QU'IL A
 * LUI-MÊME TERMINÉE », lue sur ses travaux du livre.
 *
 * ⚠️ CE QUE « TERMINÉE » VEUT DIRE N'EST PAS TRANCHÉ PAR LA SOURCE : les six
 *    statuts d'`aletheia_travaux` ne portent pas le mot. ⭐ LECTURE RETENUE PAR
 *    CE LOT, et elle est la position de repli du prompt de session : **`DONE`,
 *    et à défaut `VF_SUBMITTED`** — le travail est rendu, la lecture est faite.
 *    Les quatre autres statuts (`DRAFT`, `V1_SUBMITTED`, `FEEDBACK1_READY`,
 *    `FEEDBACK2_READY`) ne comptent pas : la séance est ouverte, pas finie.
 *    *Fixée par un test, et dite au relevé.*
 */
export const STATUTS_SEANCE_TERMINEE = ['DONE', 'VF_SUBMITTED'] as const

export interface TravailDeLecture {
  livreId: string
  semaineIndex: number
  statut: string
}

export function positionDeLecture(
  travaux: readonly TravailDeLecture[], livreId: string,
): number | null {
  const finies = travaux.filter((t) => t.livreId === livreId
    && (STATUTS_SEANCE_TERMINEE as readonly string[]).includes(t.statut))
  if (finies.length === 0) return null
  return Math.max(...finies.map((t) => t.semaineIndex))
}

/** Ce que la décision journalise du non-spoiler (`01-` §11, point 1). */
export interface BorneAmont {
  /** `hors_livre` — aucun matériau ne déclare de plan : rien à comparer. */
  regime: 'hors_livre' | 'sous_la_position' | 'position_inconnue' | 'au_dela'
  /** Par matériau porteur d'un plan : le livre, l'ordinal exigé, la position. */
  bornes: Array<{
    materiauId: string
    livreReferenceId: string
    planSeance: number
    positionEleve: number | null
  }>
  /** L'ordinal le plus haut que l'instance exige. `null` hors livre. */
  seanceMaxExigee: number | null
  motif: string
}

/**
 * `01-` §4 — « le routeur n'assigne JAMAIS au-delà de la position de lecture
 * connue de l'élève. LA BORNE DE LA CLASSE N'EST PAS LA SIENNE. »
 *
 * ⚠️ Le `CHECK` `textes_plan_couple_chk` garantit que la semaine et le livre
 *    déclaré vont ENSEMBLE, jamais l'un sans l'autre — on lit donc le couple.
 * ⚠️ « À défaut de position connue, il sert UN TEXTE COURT HORS LIVRE » : une
 *    instance qui déclare un plan et dont la position est inconnue N'EST PAS
 *    servie ; celle qui n'en déclare aucun l'est, et c'est le repli du §4.
 */
export function filtreDuNonSpoiler(
  materiaux: readonly MateriauRattache[],
  positions: ReadonlyMap<string, number | null>,
): { retenue: boolean; motif: MotifDEcart | null; detail: string; borne: BorneAmont } {
  const bornes: BorneAmont['bornes'] = []
  for (const m of materiaux) {
    if (m.planLivreReferenceId === null || m.planSemaine === null) continue
    bornes.push({
      materiauId: m.id,
      livreReferenceId: m.planLivreReferenceId,
      planSeance: m.planSemaine,
      positionEleve: positions.get(m.planLivreReferenceId) ?? null,
    })
  }

  if (bornes.length === 0) {
    return { retenue: true, motif: null, detail: '',
      borne: { regime: 'hors_livre', bornes: [], seanceMaxExigee: null,
        motif: 'aucun matériau ne relève d\'un plan de lecture : le non-spoiler n\'a rien à '
          + 'comparer (« un texte court hors livre »).' } }
  }

  const seanceMax = Math.max(...bornes.map((b) => b.planSeance))
  const inconnue = bornes.find((b) => b.positionEleve === null)
  if (inconnue) {
    return { retenue: false, motif: 'non_spoiler',
      detail: `position de lecture INCONNUE sur le livre ${inconnue.livreReferenceId.slice(0, 8)} `
        + `(séance ${inconnue.planSeance} exigée) : « à défaut de position connue, il sert un `
        + 'texte court HORS LIVRE ».',
      borne: { regime: 'position_inconnue', bornes, seanceMaxExigee: seanceMax,
        motif: 'au moins un matériau relève d\'un livre dont l\'élève n\'a terminé aucune séance.' } }
  }
  const auDela = bornes.find((b) => b.planSeance > (b.positionEleve as number))
  if (auDela) {
    return { retenue: false, motif: 'non_spoiler',
      detail: `séance ${auDela.planSeance} exigée, l'élève en a terminé `
        + `${auDela.positionEleve} : au-delà de sa position de lecture.`,
      borne: { regime: 'au_dela', bornes, seanceMaxExigee: seanceMax,
        motif: 'l\'instance porte sur une séance que l\'élève n\'a pas encore terminée.' } }
  }
  return { retenue: true, motif: null, detail: '',
    borne: { regime: 'sous_la_position', bornes, seanceMaxExigee: seanceMax,
      motif: `l'instance ne va pas au-delà de la position de lecture de l'élève `
        + `(séance ${seanceMax} exigée).` } }
}

// ════════════════════════════════════════════════════════════════════════════
// LE VIVIER — les trois filtres composés, et l'écart NOMMÉ
// ════════════════════════════════════════════════════════════════════════════

export interface InstanceRetenue {
  instance: InstanceDuVivier
  /** `01-` §11 — la borne retenue, journalisée À LA DÉCISION (piège 11). */
  borne: BorneAmont
  /** Les compétences que cette instance peut porter en CIBLE. */
  ciblables: Competence[]
  /** Le plafond de cibles du grain, tel que `ciblesPossibles` le rend. */
  plafondCibles: number
  /** Les compétences en `observable_seul` — matériau de mesure, jamais cible. */
  observableSeul: Competence[]
  /**
   * ⭐ C7-L5 — ce que la porte a dit de cette instance : `sonde` = servie comme
   *    sonde de montée (l'élève stagne au cran d'en dessous, M-e s'applique) ;
   *    `methode` = la semaine de méthode de l'objet ; `ouvert` = le registre
   *    l'ouvre ; `null` = porte inactive.
   */
  porte: StatutDeService | null
  /**
   * ⭐ C7-L6 — le devoir que l'instance sert, et la date du dernier dépôt de
   *    l'élève dessus (`null` : jamais servi). Journalisé à la décision.
   */
  devoir: { ids: string[]; dernierDepotAt: string | null }
  /**
   * ⭐ C7-L6 — l'instance est servie DÉGRADÉE : son objet n'avait plus de devoir
   *    frais, « le routeur sert quand même et signale » (`01-` v5.9 §3).
   */
  degrade: boolean
  /**
   * ⭐ C7-L6 — en semaine de méthode : l'objet, le devoir unique, la séquence du
   *    palier et le rang de ce cran dans la séquence (`01-` v5.9 §5). `null` hors
   *    méthode.
   */
  methode: { objet: string; devoir: string | null; sequence: number[]; rang: number } | null
}

export interface Vivier {
  retenus: InstanceRetenue[]
  ecartes: EcartDuVivier[]
  /**
   * ⭐ C7-L6 — les objets SANS DEVOIR FRAIS pour cet élève : toutes leurs
   *    instances étaient en quarantaine, la plus ancienne est resservie
   *    `degrade`. C'est le signal au professeur : « il manque un devoir sur
   *    cet objet » — compté par objet, lu par la console de la fabrique.
   */
  devoirsManquants: string[]
}

// ── ⭐ C7-L6 — LA QUARANTAINE DES DEVOIRS ─────────────────────────────────────

// ⭐ C7-L7 — le compte des cycles vit à `utils/routeur/cycles.ts` : le registre
//    (« deux et deux » à un cycle d'écart) le lit aussi, et `reussites.ts` ne peut
//    pas importer ce fichier sans boucler (vivier → porte → reussites). Les deux
//    noms restent exportés d'ici pour les appelants d'hier.
export { lundiDe, cyclesEcoules } from '../routeur/cycles'

/**
 * Le devoir de l'instance que la quarantaine retient, s'il y en a un : celui
 * servi le plus récemment, quand il l'a été il y a moins de `cycles` cycles.
 * `null` quand l'instance peut être servie.
 */
export function devoirEnQuarantaine(
  devoirs: readonly string[], devoirsServis: ReadonlyMap<string, string>,
  cycleLundi: string, cycles = QUARANTAINE_CYCLES,
): { devoir: string; dernierDepotAt: string; cyclesEcoules: number } | null {
  let pire: { devoir: string; dernierDepotAt: string; cyclesEcoules: number } | null = null
  for (const id of devoirs) {
    const at = devoirsServis.get(id)
    if (!at) continue
    const n = cyclesEcoulesDepuis(at, cycleLundi)
    if (n >= cycles) continue
    if (!pire || at > pire.dernierDepotAt) pire = { devoir: id, dernierDepotAt: at, cyclesEcoules: n }
  }
  return pire
}

/** La date du dernier dépôt de l'élève sur l'un des devoirs de l'instance — `null` sinon. */
export function dernierDepotSur(
  devoirs: readonly string[], devoirsServis: ReadonlyMap<string, string> | null | undefined,
): string | null {
  let max: string | null = null
  for (const id of devoirs) {
    const at = devoirsServis?.get(id)
    if (at && (!max || at > max)) max = at
  }
  return max
}

/** Les statuts d'instance qui entrent au vivier (piège 30). */
export const STATUTS_SERVABLES = ['concu', 'assigne'] as const

/**
 * `01-` §4, couche 4 — le vivier d'UN élève.
 *
 * ⛔ « RESSERVIR LA MÊME INSTANCE AU MÊME ÉLÈVE serait un défaut silencieux » :
 *    toute instance dont il porte déjà un dépôt sort du vivier. Entre élèves,
 *    en revanche, une instance se ressert — « une instance, plusieurs dépôts ».
 *
 * ⛔ « N'entre au vivier que ce qui est `concu` ou `assigne` ET NON BLOQUÉ »
 *    (`exercices.bloque`) — l'écran de conception refuse déjà d'assigner une
 *    instance bloquée ou non conçue.
 *
 * ⛔ Et rien qui soit de `lieu = 'classe'` : la passation en classe est
 *    « imposée en classe, HORS ROUTAGE » (`01-` §10).
 */
export function constituerLeVivier(
  instances: readonly InstanceDuVivier[], ctx: ContexteDuVivier,
): Vivier {
  const retenus: InstanceRetenue[] = []
  const ecartes: EcartDuVivier[] = []
  // ⭐ C7-L6 — les instances mises en quarantaine, gardées pour le second passage.
  const enQuarantaine: InstanceRetenue[] = []
  const ecarter = (exerciceId: string, motif: MotifDEcart, detail: string) =>
    ecartes.push({ exerciceId, motif, detail })

  for (const inst of instances) {
    if (inst.lieu === 'classe') {
      ecarter(inst.exerciceId, 'lieu_classe', 'passation en classe : imposée, hors routage.')
      continue
    }
    // ⭐ LA CLASSE BORNE LE ROUTAGE, COMME ELLE BORNE L'AFFICHAGE.
    //   « Dans les modules on reste PAR CLASSE » (`01-` §2) : l'écran de l'élève
    //   écarte déjà l'instance d'une autre classe — `visibleDansLaClasse`
    //   (`utils/codex-onglets/regles.ts`). La couche 4 ne le faisait pas, et le
    //   défaut était SILENCIEUX DES DEUX CÔTÉS : le dépôt existait en base,
    //   l'élève ne le voyait sur AUCUN de ses écrans, et l'assiduité le comptait
    //   au dénominateur. Trouvé par la couture de `C6-L3` (`C6L3-30`).
    // ⛔ UNE INSTANCE SANS CLASSE N'EST PAS « L'AUTRE CLASSE », et c'est la
    //   moitié qui compte : le NULL est le cas ORDINAIRE — il n'est écrit que
    //   par « en faire un exercice commun à toute une classe » —, et l'écarter
    //   viderait le vivier en entier. Même lecture que `visibleDansLaClasse`,
    //   tranchée à C4-L6 : « l'écarter ferait DISPARAÎTRE un exercice que
    //   l'élève doit faire ».
    // ⚠️ La source ne dit PAS ce que `classe_id` veut dire (`07-` §1.1 ne le
    //   déclare que « NULLABLE ») : ce filtre est l'arbitrage de Louis du
    //   28/08 — l'instance qu'un professeur a donnée à une classe reste à
    //   cette classe. Le jour où la portée devient un CHOIX à l'assignation,
    //   c'est cette ligne qui lira la colonne au lieu de la constante
    //   (`IDEES_post_rentree.md`).
    if (inst.classeId !== null && !ctx.classesDeLEleve.has(inst.classeId)) {
      ecarter(inst.exerciceId, 'classe_autre',
        `instance donnée à la classe ${inst.classeId.slice(0, 8)} : l'élève n'y est pas `
        + 'inscrit, et son écran ne la lui montrerait pas.')
      continue
    }
    if (!(STATUTS_SERVABLES as readonly string[]).includes(inst.statut)) {
      ecarter(inst.exerciceId, 'statut', `statut « ${inst.statut} » : ni \`concu\` ni \`assigne\`.`)
      continue
    }
    if (inst.bloque) {
      ecarter(inst.exerciceId, 'bloquee', 'instance bloquée.')
      continue
    }
    if (ctx.instancesDejaDeposees.has(inst.exerciceId)) {
      ecarter(inst.exerciceId, 'deja_deposee',
        'cet élève porte déjà un dépôt sur cette instance : la resservir serait un défaut '
        + 'silencieux.')
      continue
    }
    if (inst.dureeMin === null || inst.dureeMin <= 0) {
      ecarter(inst.exerciceId, 'sans_duree',
        'la doctrine ne rend aucune durée pour ce couple (objet × cran) : le budget ne peut '
        + 'rien décompter, et une durée ne se saisit jamais à la main.')
      continue
    }

    const p = filtreDeParcours(inst, ctx.parcours)
    if (!p.retenue) { ecarter(inst.exerciceId, p.motif as MotifDEcart, p.detail); continue }

    // Un matériau non valide ou bloqué ne sert pas : « une référence non validée
    // n'entre jamais dans une phase de jugement » (`07-` §1.1).
    const invalide = inst.materiaux.find((m) => m.bloque || m.statut !== 'valide')
    if (invalide) {
      ecarter(inst.exerciceId, 'materiau_non_valide',
        `${invalide.sorte} ${invalide.id.slice(0, 8)} : statut « ${invalide.statut} »`
        + `${invalide.bloque ? ', bloqué' : ''}.`)
      continue
    }
    // ⭐⭐ ET LE CO-TEXTE PASSE LE MÊME CONTRÔLE. Sans cette garde, un co-texte
    //    RETIRÉ ou BLOQUÉ continuait d'être servi : la liste `materiaux`
    //    ci-dessus ne connaît que les textes et les sujets, donc aucun matériau
    //    fabriqué n'y était jamais confronté à son propre statut.
    // ⚠️ Aux crans de production, le co-texte EST la matière : le servir retiré,
    //    c'est servir un exercice dont la consigne désigne un texte écarté.
    if (inst.coTexte && inst.coTexte.statut !== 'valide') {
      ecarter(inst.exerciceId, 'materiau_non_valide',
        `co-texte ${inst.coTexte.id.slice(0, 8)} : statut « ${inst.coTexte.statut} ».`)
      continue
    }

    const c = filtreDuCoursVu(inst.materiaux, ctx.coursVus)
    if (!c.retenue) { ecarter(inst.exerciceId, c.motif as MotifDEcart, c.detail); continue }

    const s = filtreDuNonSpoiler(inst.materiaux, ctx.positionsDeLecture)
    if (!s.retenue) { ecarter(inst.exerciceId, s.motif as MotifDEcart, s.detail); continue }

    const { ciblables, plafond, observableSeul } =
      ciblesPossibles(inst.geste, inst.grain, inst.couverture)
    if (ciblables.length === 0) {
      ecarter(inst.exerciceId, 'aucune_competence_ciblable',
        'toutes les compétences déclarées y sont `observable_seul` : matériau de mesure, '
        + 'jamais d\'entraînement.')
      continue
    }
    // ── ⭐ C7-L5 — LA PORTE DU REGISTRE, en dernier : elle choisit parmi ce que
    //    les autres filtres laissent, et ne rouvre rien. ──────────────────────
    let porte: StatutDeService | null = null
    if (ctx.porte?.actif) {
      const p = ctx.porte.de(inst.objet)
      porte = statutDeService(p, inst.cranNumero)
      if (porte === 'ferme') {
        ecarter(inst.exerciceId, 'porte_registre',
          motifDeFermeture(p, [], inst.cranNumero ?? 0))
        continue
      }
    }
    // ── ⭐⭐ C7-L6 — LA QUARANTAINE DU DEVOIR (`01-` v5.9 §8.10), après la porte :
    //    « un devoir servi ne revient pas avant deux cycles ; la même clé, sur un
    //    autre devoir, revient ». ⛔ JAMAIS EN SEMAINE DE MÉTHODE : elle fait
    //    parcourir le même devoir aux crans de sa séquence, et c'est voulu.
    //    Une instance écartée ici est GARDÉE de côté : si son objet n'a plus
    //    aucun devoir frais, la plus ancienne revient, dégradée (second passage).
    const devoir = { ids: inst.devoirs ?? [], dernierDepotAt: dernierDepotSur(inst.devoirs ?? [], ctx.devoirsServis) }
    if (ctx.devoirsServis && ctx.cycleLundi && porte !== 'methode' && inst.devoirs?.length) {
      const q = devoirEnQuarantaine(inst.devoirs, ctx.devoirsServis, ctx.cycleLundi,
        ctx.quarantaineCycles ?? QUARANTAINE_CYCLES)
      if (q) {
        ecarter(inst.exerciceId, 'devoir_en_quarantaine',
          `le devoir ${q.devoir.slice(0, 8)} a été servi à cet élève le ${q.dernierDepotAt.slice(0, 10)} `
          + `(il y a ${q.cyclesEcoules} cycle(s), ${ctx.quarantaineCycles ?? QUARANTAINE_CYCLES} attendus) : `
          + 'le même texte ne revient pas encore (`01-` §8.10).')
        enQuarantaine.push({ instance: inst, borne: s.borne, ciblables, plafondCibles: plafond,
          observableSeul, porte, devoir, degrade: true, methode: null })
        continue
      }
    }
    retenus.push({ instance: inst, borne: s.borne, ciblables, plafondCibles: plafond,
      observableSeul, porte, devoir, degrade: false, methode: null })
  }

  // ── ⭐ C7-L6 — L'OBJET SANS DEVOIR FRAIS : « sans devoir frais, le routeur
  //    sert quand même — la branche d'échec du §6, `degrade` — et signale au
  //    professeur ». Par objet : aucune instance retenue et au moins une en
  //    quarantaine ⇒ la plus anciennement servie revient, marquée `degrade`.
  const devoirsManquants: string[] = []
  const objetsServis = new Set(retenus.map((r) => r.instance.objet))
  const parObjet = new Map<string, InstanceRetenue[]>()
  for (const r of enQuarantaine) parObjet.set(r.instance.objet, [...(parObjet.get(r.instance.objet) ?? []), r])
  for (const [objet, liste] of parObjet) {
    if (objetsServis.has(objet)) continue
    devoirsManquants.push(objet)
    const plusAncienne = [...liste].sort((a, b) =>
      (a.devoir.dernierDepotAt ?? '').localeCompare(b.devoir.dernierDepotAt ?? ''))[0]!
    retenus.push(plusAncienne)
    // L'écart reste au journal : il dit POURQUOI l'instance est servie dégradée.
  }
  return { retenus, ecartes, devoirsManquants: devoirsManquants.sort() }
}

// ── ⭐ C7-L6 — LA SEMAINE DE MÉTHODE, BORNÉE (`01-` v5.9 §5) ───────────────────

/**
 * La séquence de méthode d'un palier, EN CRANS — « E-D : la fiche → une paire au
 * cran 1 → le 3 → le 2 → le 4 ; C-B : une paire au cran 1 → le 3 → la fiche →
 * le 2 ; A : une sonde directe au 4 ou au 9 ». Le 2 n'entre « que si son écran
 * est servi ». ⚠️ La porte (`porte.ts`) ne sert en méthode que 1·3·4 : le 9 d'A
 * y attend que la porte l'ouvre — A reçoit le 4.
 */
export function sequenceDeMethode(palier: string | null, cran2Servi: boolean): number[] {
  if (palier === 'A') return [4]
  if (palier === 'B' || palier === 'C') return cran2Servi ? [1, 3, 2] : [1, 3]
  return cran2Servi ? [1, 3, 2, 4] : [1, 3, 4]      // E, D — et sans palier connu
}

/** « Deux objets par élève, pas quatre » — le nombre vit ici. */
export const OBJETS_EN_METHODE_MAX = 2

/**
 * Borne la semaine de méthode du vivier : au plus `OBJETS_EN_METHODE_MAX` objets
 * en méthode — les deux premiers que la liste de priorité atteint —, et sur
 * chacun UN SEUL devoir (celui dont les instances couvrent le plus de crans de
 * la séquence), aux seuls crans de la séquence du palier de la cible. Ce qui
 * sort est écarté `methode_hors_quota`. Les instances hors méthode passent
 * telles quelles. PUR : la pose (phase B) reçoit ce qu'il rend.
 */
export function bornerLaMethode(
  retenus: readonly InstanceRetenue[],
  prioriteDesCompetences: readonly Competence[],
  paliers: ReadonlyMap<Competence, string | null>,
  cran2Servi = false,
  max = OBJETS_EN_METHODE_MAX,
): { retenus: InstanceRetenue[]; ecartes: EcartDuVivier[]; objetsEnMethode: string[] } {
  const enMethode = retenus.filter((r) => r.porte === 'methode')
  if (enMethode.length === 0) return { retenus: [...retenus], ecartes: [], objetsEnMethode: [] }

  // L'ordre des objets : celui de la liste de priorité, par la première
  // compétence ciblable de l'objet ; les objets qu'aucune compétence n'atteint
  // viennent après, par nom.
  const rangDe = (r: InstanceRetenue) => {
    const rangs = r.ciblables.map((c) => prioriteDesCompetences.indexOf(c)).filter((i) => i >= 0)
    return rangs.length ? Math.min(...rangs) : Number.MAX_SAFE_INTEGER
  }
  const parRang = [...new Set(enMethode.map((r) => r.instance.objet))]
    .map((o) => ({ o, rang: Math.min(...enMethode.filter((r) => r.instance.objet === o).map(rangDe)) }))
    .sort((a, b) => a.rang - b.rang || a.o.localeCompare(b.o))
  // ⭐ C7-L7 — « les deux premiers de la liste de priorité » : la liste est une
  //    liste de COMPÉTENCES, et PB2 — jamais deux fois de suite la même — ne laisse
  //    avancer deux séquences de méthode que si elles alternent. Deux objets de la
  //    même compétence s'affament l'un l'autre (mesuré le 06/09 en bac à sable :
  //    argument + objection ⇒ UN exercice posé sur soixante minutes). D'où : un
  //    objet par compétence atteinte, dans l'ordre de la liste, puis les suivants.
  const objets: typeof parRang = []
  const restants = [...parRang]
  while (restants.length) {
    const vus = new Set<number>()
    for (const x of [...restants]) {
      if (vus.has(x.rang)) continue
      vus.add(x.rang)
      objets.push(x)
      restants.splice(restants.indexOf(x), 1)
    }
  }
  const gardes = objets.slice(0, max).map((x) => x.o)
  const out: InstanceRetenue[] = retenus.filter((r) => r.porte !== 'methode')
  const ecartes: EcartDuVivier[] = []

  for (const objet of objets.map((x) => x.o)) {
    const siennes = enMethode.filter((r) => r.instance.objet === objet)
    if (!gardes.includes(objet)) {
      for (const r of siennes) ecartes.push({ exerciceId: r.instance.exerciceId, motif: 'methode_hors_quota',
        detail: `semaine de méthode bornée à ${max} objets : « ${objet} » attend le cycle suivant (\`01-\` §5).` })
      continue
    }
    // ⭐ C7-L7 (07/09) — LE PALIER EST CELUI DE LA COMPÉTENCE DU DEVOIR RETENU, pas
    //    de la première compétence de l'objet que la liste atteint. Sous le gabarit,
    //    un devoir porte UNE clé, donc UNE compétence ; un objet peut en porter deux
    //    (mesuré : `exemple`, des clés de Structure et d'Expression — la séquence de
    //    B était posée pour des exercices de Structure à D). Chaque devoir reçoit donc
    //    la séquence de SA compétence, et c'est avec elle qu'on compte sa couverture.
    const parDevoir = new Map<string, InstanceRetenue[]>()
    for (const r of siennes) for (const id of (r.devoir.ids.length ? r.devoir.ids : ['∅'])) {
      parDevoir.set(id, [...(parDevoir.get(id) ?? []), r])
    }
    const cibleDe = (l: InstanceRetenue[]) => prioriteDesCompetences.find((c) => l.some((r) => r.ciblables.includes(c)))
      ?? l[0]!.ciblables[0] ?? null
    const sequenceDe = (l: InstanceRetenue[]) => {
      const cible = cibleDe(l)
      return sequenceDeMethode(cible ? (paliers.get(cible) ?? null) : null, cran2Servi)
    }
    // Le devoir unique : celui qui couvre le plus de crans de sa séquence ; à
    // égalité, le devoir jamais servi, puis le premier par identifiant.
    const couverture = (l: InstanceRetenue[]) => {
      const seq = sequenceDe(l)
      return new Set(l.map((r) => r.instance.cranNumero).filter((n) => n !== null && seq.includes(n))).size
    }
    const devoir = [...parDevoir.entries()].sort((a, b) =>
      couverture(b[1]) - couverture(a[1])
      || (a[1][0]!.devoir.dernierDepotAt ?? '').localeCompare(b[1][0]!.devoir.dernierDepotAt ?? '')
      || a[0].localeCompare(b[0]))[0]![0]
    const retenuesDuDevoir = parDevoir.get(devoir) ?? []
    const cible = cibleDe(retenuesDuDevoir)
    const palier = cible ? (paliers.get(cible) ?? null) : null
    const sequence = sequenceDe(retenuesDuDevoir)
    const vues = new Set<string>()
    for (const r of siennes) {
      const n = r.instance.cranNumero
      const dedans = retenuesDuDevoir.includes(r) && n !== null && sequence.includes(n)
      // Un seul exercice par cran de la séquence (1(a) OU 1(b) : la paire est un exercice).
      const cle = `${n}`
      if (!dedans || vues.has(cle)) {
        ecartes.push({ exerciceId: r.instance.exerciceId, motif: 'methode_hors_quota',
          detail: !dedans
            ? `méthode sur « ${objet} » : un seul devoir (${devoir === '∅' ? 'sans devoir' : devoir.slice(0, 8)}) aux crans ${sequence.join('·')} de la séquence du palier ${palier ?? '?'}.`
            : `méthode sur « ${objet} » : le cran ${n} est déjà posé sur ce devoir.` })
        continue
      }
      vues.add(cle)
      out.push({ ...r, methode: { objet, devoir: devoir === '∅' ? null : devoir, sequence, rang: sequence.indexOf(n) } })
    }
  }
  return { retenus: out, ecartes, objetsEnMethode: gardes }
}

// ════════════════════════════════════════════════════════════════════════════
// `candidatsPour` — le rappel que la PHASE B interroge (`01-` §5)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §5 — « `candidatsPour` rend, POUR UNE COMPÉTENCE, les exercices que la
 * couche 4 lui laisse — déjà filtrés (parcours, cours vu, non-spoiler) et DÉJÀ
 * CONSOMMÉS AU FUR ET À MESURE PAR L'APPELANT. »
 *
 * ⚠️ PB4 — « on cible PLUSIEURS compétences sur un même exercice quand le couple
 *    (geste, objet) le permet et que le grain l'autorise ». Les cibles
 *    secondaires sont les autres ciblables de l'instance, dans la limite du
 *    plafond de cibles du grain ; « ce n'est PAS un instrument de compression ».
 *
 * ⚠️ `dureeMin` NE SE SAISIT JAMAIS À LA MAIN : elle vient de la doctrine, et
 *    elle est déjà sur l'instance quand celle-ci entre au vivier.
 */
export function candidatsPour(
  vivier: readonly InstanceRetenue[],
  competence: Competence,
  dejaPoses: readonly ExercicePose[],
  /** `01-` §6, R1 — l'Expression prend EN PLUS une secondaire à C, sur `produire`. */
  expressionEnSecondaire = false,
  /**
   * ⭐⭐ C7-L7 — L'ORDRE PAR OBJET (`01-` v5.11 §4, couche 3), derrière
   *    `gabarit_actif`. Absent : les candidats sortent comme hier, à l'octet, et
   *    PB1-PB3 les départagent. Présent : chaque candidat reçoit son `ordre`
   *    — méthode entamée, puis un exercice par objet ouvert (règle 4), puis
   *    l'objet neuf si sa séquence tient, puis les sondes des objets tenus — et
   *    ce que la règle écarte ne sort pas, motif journalisé. ⛔ Aucune boucle à
   *    côté de la phase B : c'est ELLE qui pose, ceci ne fait qu'ordonner.
   */
  objets: ContexteObjets | null = null,
): Candidat[] {
  const consommes = new Set(dejaPoses.map((e) => e.candidat.exerciceId))
  const out: Candidat[] = []

  for (const r of vivier) {
    if (consommes.has(r.instance.exerciceId)) continue
    if (!r.ciblables.includes(competence)) continue

    const autres = r.ciblables.filter((c) => c !== competence)
    // Le plafond du grain compte LA PRIMAIRE : il reste `plafond - 1` places.
    let secondaires = autres.slice(0, Math.max(0, r.plafondCibles - 1))
    if (expressionEnSecondaire && r.instance.geste === 'produire'
      && (r.instance.grain === 'meso' || r.instance.grain === 'macro')
      && autres.includes('expression') && !secondaires.includes('expression')) {
      // « Elle prend EN PLUS une place de cible secondaire sur tout exercice de
      //   grain méso ou macro qui peut la porter » — et le geste est `produire`.
      secondaires = [...secondaires.slice(0, Math.max(0, r.plafondCibles - 2)), 'expression']
    }

    out.push({
      exerciceId: r.instance.exerciceId,
      competence,
      grain: r.instance.grain,
      geste: r.instance.geste,
      // `Candidat.cran` est une CHAÎNE et les règles lisent des `CodeCran` :
      // le pont est celui de la doctrine (`exercices_crans.code`), jamais une
      // seconde table de correspondance (piège 6).
      cran: r.instance.cranCode ?? '',
      mode: (r.instance.modesParCompetence[competence] ?? [])[0] ?? '',
      dureeMin: r.instance.dureeMin as number,
      ciblesSecondaires: secondaires,
      // ⭐ C7-L7 — l'observable de la clé, ce que PB2 compare sous le gabarit.
      observable: r.instance.observable?.code ?? null,
    })
  }
  return objets ? ordonnerParObjet(out, vivier, competence, dejaPoses, objets) : out
}

/** `01-` §5, phase C — ce qu'un exercice posé offre en SUBSTRAT. */
export function substratsDeLaSemaine(
  poses: readonly ExercicePose[], vivier: readonly InstanceRetenue[],
): Array<{
    exerciceId: string; competences: Competence[]; cibles: Competence[]
    geste: Geste; grain: Grain; sondesDeja: number
  }> {
  return poses.map((p) => {
    const r = vivier.find((x) => x.instance.exerciceId === p.candidat.exerciceId)
    // « Est substrat un exercice qui la liste dans `competences[]` » — toutes les
    // compétences que l'objet permet de mesurer, `observable_seul` COMPRIS : une
    // sonde mesure en silence, elle n'entraîne pas.
    const competences = r
      ? ([...r.ciblables, ...r.observableSeul] as Competence[])
      : ([p.candidat.competence, ...p.candidat.ciblesSecondaires] as Competence[])
    return {
      exerciceId: p.candidat.exerciceId,
      competences,
      cibles: [p.candidat.competence, ...p.candidat.ciblesSecondaires],
      geste: p.candidat.geste,
      grain: p.candidat.grain,
      sondesDeja: 0,
    }
  })
}
