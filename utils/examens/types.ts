// ============================================================================
// C4 · L9 — CE QU'UN EXAMEN DIAGNOSTIQUE EST, EN DEUX MOTS ET SANS BASE.
// ----------------------------------------------------------------------------
// « Toute ancre naît là. Une ancre est une mesure dont le `lieu` vaut `classe`
//   et la `forme` `sommatif` (`01-` §10), et elle passe toujours par l'un des
//   DEUX TYPES D'EXAMEN DIAGNOSTIQUE — l'ESSAI dans Codex, l'EXPLICATION DE
//   TEXTE dans Aletheia. »                                    — `07-` §2, C4-L9
//
// Ce module est PUR : aucune base, aucun réseau. Il porte les trois constantes
// que la conception recopie, et rien d'autre — c'est ce qui les rend testables.
//
// ⚠️ LA DOCTRINE N'EST D'AUCUN SECOURS ICI, ET C'EST LA MISSION. Un examen
//    diagnostique « n'est pas un objet à un cran, c'est une COPIE ENTIÈRE » :
//    « macro par construction, à tous les paliers et à tous les segments »,
//    « imposé en classe, HORS ROUTAGE », et « la table des proportions ne le
//    gouverne pas » (`01-` §10). Rien ici ne se dérive de `exercices_routes`, ni
//    de la banque de consignes objet × mode × cran, ni des `crans[]`.
// ============================================================================

/** Les deux modules qui portent un examen diagnostique — et eux seuls. */
export const MODULES_EXAMEN = ['codex', 'aletheia'] as const
export type ModuleExamen = (typeof MODULES_EXAMEN)[number]

/**
 * ⭐ C6-L4 — LES TROIS MODULES QUI PORTENT UNE PASSATION EN CLASSE. Les deux
 *    examens diagnostiques, ET l'essai de Fragments : « les devoirs surveillés
 *    de classe empruntent la même voie » (`07-` §2, C4-L9), et « les sommatifs
 *    se conçoivent chacun dans son module — Quazian, Codex, Aletheia,
 *    FRAGMENT » (`01-` §2). Fragments n'est PAS un module d'examen
 *    diagnostique (pas d'écran de conception, pas de fenêtre) : c'est pourquoi
 *    `MODULES_EXAMEN` ne bouge pas, et qu'un type de plus le contient.
 */
export const MODULES_PASSATION = ['codex', 'aletheia', 'fragments'] as const
export type ModulePassation = (typeof MODULES_PASSATION)[number]

export function estUnModuleExamen(m: string | null | undefined): m is ModuleExamen {
  return (MODULES_EXAMEN as readonly string[]).includes(m ?? '')
}

/**
 * Le code du type, par module.
 *
 * ⚠️ RENOMMÉS PAR C4-L9 (`c4_l9_examens_diagnostiques.sql`) : ils s'appelaient
 *    `diagnostic_essai` et `diagnostic_explication_texte`. Le motif : CINQ codes
 *    partageaient le préfixe `diagnostic_` — TROIS pour le geste
 *    `diagnostiquer` (`diagnostic_guide`, `diagnostic_nomme`, `diagnostic_fin`,
 *    des CRANS d'un objet) et DEUX pour l'ANCRE, qui n'ont rien à voir.
 */
export const CODE_TYPE: Record<ModuleExamen, string> = {
  codex: 'examen_diagnostique_essai',
  aletheia: 'examen_diagnostique_explication_texte',
}

/**
 * Le `type_exercice` de la ligne de plan, par module. La typologie du plan est
 * une LISTE FERMÉE DE COUPLES (`exercices_typologie_chk`) : `ecriture` ×
 * diagnostique ⇒ `evaluatif` × `classe` × `codex` ; `lecture` × diagnostique ⇒
 * `evaluatif` × `classe` × `aletheia`. C'est cette fermeture qui fait que la
 * `forme` d'une instance liée vaudra `sommatif` (`07-` §1.2).
 */
export const TYPE_EXERCICE: Record<ModuleExamen, string> = {
  codex: 'ecriture',
  aletheia: 'lecture',
}

/**
 * ⭐ C6-L4 — le `type_exercice` de la ligne de plan de CHAQUE passation en classe.
 *    L'essai de Fragments est le onzième couple de la typologie : `essai` × non
 *    diagnostique × `evaluatif` × `classe` × `fragments` — `evaluatif` par
 *    construction, donc `forme = sommatif`, donc une ANCRE (`07-` §1.2).
 */
export const TYPE_EXERCICE_PASSATION: Record<ModulePassation, string> = {
  ...TYPE_EXERCICE,
  fragments: 'essai',
}

/**
 * Le module d'un `type_exercice`, quand c'est celui d'une passation en classe.
 * ⚠️ C6-L4 : `essai` mène désormais à FRAGMENTS. Un appelant qui ne veut que les
 *    deux examens diagnostiques (conception, calendrier) filtre par
 *    `estUnModuleExamen` — le module ne se déduit jamais du mode pour un essai
 *    (la règle du mode l'enverrait dans Codex, à tort).
 */
export function moduleDuType(typeExercice: string): ModulePassation | null {
  for (const m of MODULES_PASSATION) if (TYPE_EXERCICE_PASSATION[m] === typeExercice) return m
  return null
}

/**
 * ⭐ CE QUE CHAQUE EXAMEN MESURE EST ARRÊTÉ — ON NE LE DÉRIVE DE RIEN, ON LE
 *    RECOPIE (`01-` §10, tranché par Louis) :
 *
 *    · l'ESSAI mesure EXPRESSION, ARGUMENTATION et STRUCTURE, les trois en
 *      `composer` ;
 *    · l'EXPLICATION mesure EXPRESSION en `composer`, ARGUMENTATION et
 *      STRUCTURE en `expliquer`, et SYNTHÈSE en `restituer`.
 *
 * « Ni la Connaissance ni le Questionnement n'y sont mesurés » : ils sortent de
 * la semaine 1 SANS LETTRE, donc ni ciblables ni sondables, et n'entrent dans le
 * ciblage qu'une fois qu'une ANCRE leur en a donné une. Les deux listes sont
 * IDENTIQUES EN TC ET EN HLP.
 *
 * ⚠️ CECI VA SUR L'INSTANCE, en `modes_par_competence` — JAMAIS SUR LE TYPE.
 *    `exercices_types.competences` porte LES SIX et c'est un PLAFOND. TROIS
 *    HAUTEURS, dans cet ordre : le plafond du type (six), l'arrêté ci-dessous
 *    (trois ou quatre), et l'intersection avec `evaluee` ×
 *    `competences_actives_par_classe`, que LA CHAÎNE fait toute seule. Recopier
 *    les six sur l'instance serait mesurer ce que la source refuse de mesurer.
 *
 * ⚠️ LA VALEUR EST TOUJOURS UNE LISTE, jamais un scalaire (`07-` §1.2 ; la garde
 *    `exercices_modes_chk` l'exige).
 */
export const MODES_MESURES: Record<ModuleExamen, Record<string, string[]>> = {
  codex: {
    expression: ['composer'],
    argumentation: ['composer'],
    structure: ['composer'],
  },
  aletheia: {
    expression: ['composer'],
    argumentation: ['expliquer'],
    structure: ['expliquer'],
    synthese: ['restituer'],
  },
}

/** Ce que le professeur choisit, par module — LE SEUL ÉCART entre les deux
 *  écrans. « Les sommatifs se conçoivent CHACUN DANS SON MODULE » (`02-` §6 B,
 *  citant le `01-` §2) : dans Codex un ÉNONCÉ DE SUJET, dans Aletheia un TEXTE. */
export const MATIERE: Record<ModuleExamen, 'sujet' | 'texte'> = {
  codex: 'sujet',
  aletheia: 'texte',
}

/** Le nom du module tel qu'il s'écrit à l'écran. */
export const NOM_MODULE: Record<ModuleExamen, string> = {
  codex: 'Codex',
  aletheia: 'Aletheia',
}

/** Ce que l'examen est, en une ligne, pour l'écran. */
export const INTITULE: Record<ModuleExamen, string> = {
  codex: 'Examen diagnostique — l’essai',
  aletheia: 'Examen diagnostique — l’explication de texte',
}
