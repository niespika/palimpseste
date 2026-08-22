// ============================================================================
// C4 · L3 — LE DÉROULÉ D'UN EXERCICE, CÔTÉ ÉLÈVE, À LA MAISON.
// Les types partagés. Module PUR — il n'importe jamais `server-only`.
// ----------------------------------------------------------------------------
// ⚠️ CE LOT N'APPELLE JAMAIS UN MODÈLE. La génération des retours, chaude comme
//    finale, appartient à la chaîne (C4-L5) : ici on MET EN FILE, on ATTEND
//    VISIBLEMENT, et on AFFICHE ce que la chaîne a produit. Les deux seuls
//    calculs propres de ce lot sont du CODE — la comparaison de « se juger » au
//    squelette, et le décompte de la chasse aux fautes.
// ============================================================================

/** Les six compétences, en identifiants NUS — jamais de préfixe (`07-` §1.2). */
export const COMPETENCES = [
  'expression', 'argumentation', 'structure',
  'connaissance', 'synthese', 'questionnement',
] as const
export type Competence = (typeof COMPETENCES)[number]

/** Les cinq paliers (`00-` §3). L'ordre est celui de la progression. */
export const PALIERS = ['E', 'D', 'C', 'B', 'A'] as const
export type Palier = (typeof PALIERS)[number]

export type Grain = 'micro' | 'meso' | 'macro'
export type Version = 'v1' | 'vf'
export type Geste = 'diagnostiquer' | 'transformer' | 'produire'

/**
 * Les neuf crans (`02-` §2.1). Le CODE est la clé partout côté application —
 * `exercices.cran` porte le code, pas le numéro (`metacognition.ts` lit par
 * code, la doctrine indexe par numéro).
 */
export const CRANS = [
  'diagnostic_guide', 'production_guidee', 'transformation_guidee',
  'diagnostic_nomme', 'transformation_nommee', 'production_etayee',
  'transformation_aveugle', 'production_autonome', 'diagnostic_fin',
] as const
export type CodeCran = (typeof CRANS)[number]

/**
 * Le `regime_v1vf` — ⚠️ **NI une colonne, NI une constante d'écran** : c'est
 * l'une des six valeurs qui ne se stockent pas (`07-` §1, table d'ouverture).
 * Il se DÉRIVE du cran élu, et **l'escalade entre dans la dérivation**
 * (`01-` §8.5). Un écran qui grave « cran → régime » en dur ne servira jamais
 * la vf d'escalade — le delta vaudrait NULL, **et NULL n'est pas 0** : N2
 * serait aveugle.
 */
export type RegimeV1vf = 'plein' | 'par_paires' | 'sans_vf'

/** Les six temps du régime PLEIN (`06-` §2). */
export const TEMPS = ['preparer', 'ecrire', 'se_juger', 'retour', 'reviser', 'retour_final'] as const
export type Temps = (typeof TEMPS)[number]

/** Le fil du statut d'un dépôt (`07-` §1.1). */
export type StatutDepot =
  | 'assigne' | 'ouvert' | 'v1_remis' | 'retour_publie' | 'vf_remis' | 'clos'
  | 'abandonne' | 'retire'

// ── Les gestes de la remise (`06-` §3) ──────────────────────────────────────

/**
 * La confiance déclarée. ⚠️ **Les libellés à l'écran sont LIBRES ; la valeur
 * stockée est celle de l'enum** (`06-` §3 ; la fiche §2). Et `non_exprimee`
 * est une **valeur d'extraction, jamais un bouton** — on ne demande rien à
 * l'élève pour l'obtenir : elle n'est donc pas dans cette liste.
 */
export const CONFIANCES = ['elevee', 'moyenne', 'faible'] as const
export type Confiance = (typeof CONFIANCES)[number]

/** Les conditions de travail — un geste unique, trois valeurs (`06-` §3). */
export const CONDITIONS = ['temps_mis', 'au_plus_vite', 'pas_pu'] as const
export type Condition = (typeof CONDITIONS)[number]

/**
 * Le motif de dépassement (`02-` §2.4). ⚠️ Il reste **NULL quand la
 * micro-question n'a pas été déclenchée OU pas répondue** (`07-` §1.1) —
 * l'absence n'est pas une valeur.
 */
export const MOTIFS_DEPASSEMENT = ['pause', 'difficulte'] as const
export type MotifDepassement = (typeof MOTIFS_DEPASSEMENT)[number]

// ── La crédence (`02-` §5 ; la fiche §6, flux 4) ────────────────────────────

/**
 * La forme de la saisie de crédence SUIT LE CRAN, et le `02-` §5 est exact :
 * aux **deux crans guidés** l'élève répartit des jetons sur 100 entre QUATRE
 * candidats ; aux **quatre autres crans qui isolent** l'écran ne sert AUCUN
 * candidat — l'élève répond, puis donne un pourcentage unique sur sa propre
 * réponse.
 */
export type FormeCredence = 'repartition' | 'pourcentage'

/** Une saisie de crédence, telle qu'elle part en base. Une par diagnostic. */
export interface SaisieCredence {
  /** Le rang du cas — 1, ou 2 sur le second cas d'une paire (`02-` §2.3.1 a). */
  cas: number
  forme: FormeCredence
  /** `repartition` : quatre jetons dont la somme fait 100, dans l'ordre servi. */
  jetons?: [number, number, number, number]
  /** `repartition` : l'index du candidat que l'élève a le plus chargé. */
  choix?: number
  /** `pourcentage` : la sûreté que l'élève accorde à SA propre réponse, 0-100. */
  pourcentage?: number
  at: string
}

// ── « Se juger » (la fiche §4 ; `02-` §5) ───────────────────────────────────

/** Une question servie, telle que la correspondance en base la déclare. */
export interface QuestionServie {
  competence: Competence
  observable_code: string
  /** La DIMENSION dite à l'élève — jamais le code de l'observable (RR4). */
  dimension_eleve: string
  question: string
  /** ⚠️ Liste FERMÉE : « une réponse libre ne se compare à rien » (`07-` §1.1). */
  reponses: string[]
  /** La ligne VERSION de la fiche AU MOMENT DU DÉPÔT de la correspondance. */
  fiche_version: string
}

/**
 * La comparaison au squelette, OBSERVABLE PAR OBSERVABLE — faite par le CODE,
 * jamais par le modèle (`06-` §2 ; `07-` §1.2). Jamais notée.
 */
export interface ComparaisonObservable {
  competence: Competence
  observable_code: string
  /** Ce que l'élève a répondu, tel quel. */
  reponse_eleve: string
  /** Ce que le squelette porte pour cet observable, ou `null` s'il ne le porte pas. */
  valeur_squelette: string | number | boolean | null
  /**
   * ⚠️ Le troisième cas de la garde `indetermine` (la fiche §7) : l'élève
   * AFFIRME un observable que le squelette NE PORTE PAS DU TOUT. Un faux
   * négatif d'extraction ne doit jamais fabriquer un « surconfiant » injuste.
   */
  affirme_un_observable_absent: boolean
  /** `null` quand la comparaison n'a pas d'objet — jamais `false` par défaut. */
  accord: boolean | null
}

// ── La contestation (`06-` §2 ; `07-` §1.2) ─────────────────────────────────

/**
 * Un acte de contestation. ⚠️ Le retour arrive SEGMENTÉ : `point_id` est
 * l'identifiant STABLE que la chaîne a posé (`retour.ts:identifiantStable`),
 * et c'est sur lui que la contestation s'accroche. Sans lui elle redeviendrait
 * un commentaire libre, et le drapeau des contestations répétées n'aurait plus
 * rien à compter (`07-` §3).
 */
export interface ActeContestation {
  point_id: string
  /** Le champ COURT de l'élève (`06-` §2). */
  texte: string
  at: string
  /**
   * ⚠️ « Toute contestation portant sur une CITATION ABSENTE part directement
   * en file professeur » — l'exigence d'examen humain de la loi (`06-` §2, §7).
   */
  citation_absente: boolean
}

// ── L'instrumentation du faisceau (`06-` §6) ────────────────────────────────

/**
 * Ce que la saisie mesure, PAR VERSION. ⚠️ Des MESURES, jamais un verdict :
 * « tous tagués, aucun bloquant, jamais un verdict ». Le rythme se RECALCULE à
 * la lecture — le stocker en ferait un second domicile.
 */
export interface TelemetrieSaisie {
  /** Le nombre de signes que l'élève a réellement tapés (les ajouts cumulés). */
  signes_saisis: number
  /** Le temps passé le champ actif, en millisecondes — jamais le temps écoulé. */
  ms_actifs: number
  /** Le plus grand ajout d'un seul tenant — « l'apparition du texte par blocs ». */
  plus_grand_ajout: number
  /** Le nombre de sessions d'écriture (une reprise après une pause franche). */
  sessions: number
}

export type TelemetrieParVersion = Partial<Record<Version, TelemetrieSaisie>>

/**
 * Le tag de durée, `exercices_depots.duree_taguee`. ⚠️ **Un tag, pas un
 * verdict** : le premier signal du faisceau est « la durée, TRÈS INFÉRIEURE à
 * la durée indicative du type » (`06-` §6), et c'est la lecture qui en fera un
 * signal — jamais l'écran.
 */
export const TAGS_DUREE = ['tres_courte', 'courte', 'nominale', 'longue', 'tres_longue'] as const
export type TagDuree = (typeof TAGS_DUREE)[number]
