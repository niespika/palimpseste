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
}

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
 */
export function couvertureDeLInstance(
  competencesDeclarees: readonly string[],
  geste: Geste,
  exerceDuCran: readonly string[],
  observableIsole: string | null,
): Record<string, Couverture> {
  const out: Record<string, Couverture> = {}
  for (const c of competencesDeclarees) {
    if (geste === 'produire') {
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
}

export interface Vivier {
  retenus: InstanceRetenue[]
  ecartes: EcartDuVivier[]
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
    retenus.push({ instance: inst, borne: s.borne, ciblables, plafondCibles: plafond,
      observableSeul })
  }
  return { retenus, ecartes }
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
    })
  }
  return out
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
