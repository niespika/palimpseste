// ============================================================================
// C4 · L5 — LA CLÉ QUI OUVRE CHAQUE SLOT. · C4 · L10 — ET CE QU'ELLE OUVRE.
// ----------------------------------------------------------------------------
// « Une compétence dont la fiche n'a pas passé sa porte reste HORS DE LA CHAÎNE
//   — pas d'instrument dérivé, pas de mesure. »
//
// La clause granulaire est appliquée À LA DÉRIVATION (`scripts/derive-instruments.py`)
// et NULLE PART AILLEURS : une fiche qui n'est pas *relue et validée* ne produit
// aucun fichier dans `derive/competences/`. Ce module ne fait que LIRE ce que la
// dérivation a versé — un seul domicile, donc rien qui puisse diverger.
//
// ⭐ C4-L10 — LE SEUIL DE LA DÉRIVATION EST *RELU ET VALIDÉ*, PAS *VERSÉ ET
//    BANCÉ*. Il valait le second depuis C4-L5, et ce durcissement n'avait aucune
//    source : le `03-` §9 confie les trois conditions de banc AU PROFESSEUR
//    (« ne sont gardées par aucun mécanisme »), le `01-` §3 dit qu'« il choisit,
//    sans automatisme ». Le seuil de banc n'existait que comme exigence d'un lot.
//    Un contrôle plus strict que sa source refuse du licite, EN SILENCE.
//
// ⚠️ CE QUI OUVRE UNE COMPÉTENCE À L'ÉLÈVE reste donc son STATUT DE RECETTE
//    (`competences_niveaux.statut_recette`, posé par le professeur à la fabrique,
//    C4-L8) : il dit ce que la mesure DEVIENT, jamais si l'instrument existe.
//    Les deux gardes se cumulent, et aucun lot n'en pose la seconde.
//
// ⚠️ DÉRIVÉE N'EST PAS BRANCHÉE, et c'est un état NORMAL, pas une incohérence.
//    Les six fiches dérivent ; C4-L10 les branche UNE PAR UNE — « une compétence
//    de plus est une compétence de plus à la rentrée, pas un lot de plus ». Une
//    compétence dérivée sans branchement ne mesure rien, et elle LE DIT :
//    `etatCompetence()` sert son motif, que le bilan d'un dépôt affiche.
// ============================================================================

import { MANIFESTE_INSTRUMENTS } from './derive/MANIFESTE'
import { GABARIT_CALAME } from './derive/calame-retour'
import type { SectionCalame } from './retour'
import { INSTRUMENT_MONITORING } from './derive/monitoring'
import { INSTRUMENT_EXPRESSION } from './derive/competences/expression'
import { BRANCHEMENT_EXPRESSION } from './branchements/expression'
import { INSTRUMENT_ARGUMENTATION } from './derive/competences/argumentation'
import { BRANCHEMENT_ARGUMENTATION } from './branchements/argumentation'
import { INSTRUMENT_STRUCTURE } from './derive/competences/structure'
import { BRANCHEMENT_STRUCTURE } from './branchements/structure'
import { refusSlotsExtraction, refusSlotsJugement } from './slots'
import { COMPETENCES, type Competence } from './types'

/** Le volet `notation.observables_mesure` d'une fiche — vocabulaire du `03-` §1. */
export interface EntreeObservableMesure {
  famille: 'proportion' | 'densité' | 'comptage rapporté' | 'comptage' | 'binaire' | 'ordinal'
  rapporte_a?: string
  echelle?: Array<string | number>
  reussie: 'au_moins' | 'au_plus' | 'plus_de' | 'moins_de' | 'vaut' | 'sans_objet'
  seuil?: number | string
  seuil_parametre?: string
  valeur_reussie?: number | string | boolean
  sans_objet_si?: number | string
  statut?: string
  sens?: string
}

export interface InstrumentCompetence {
  source: string
  competence: Competence
  version: string
  statut: string
  prompts: Record<string, string>
  bloc_machine: Record<string, unknown>
  observables_mesure: Record<string, EntreeObservableMesure>
  /**
   * Le volet `notation.parametres` de la fiche, TEL QUE LA FICHE L'ÉCRIT : un
   * bloc par paramètre — `defaut`, `bornes`, `statut` —, jamais une valeur nue.
   *
   * ⚠️ C4-L10 — ce champ était typé `Record<string, number | string>`, et la
   *    forme dérivée est celle-ci. Rien ne s'en apercevait tant qu'aucune fiche
   *    ne dérivait ; le jour où l'une le fait, `seuil_parametre` lisait un OBJET
   *    au lieu d'un nombre, la comparaison au seuil devenait impossible, et
   *    l'observable sortait EN SILENCE du dénominateur du taux (`01-` §8.2) —
   *    exactement le trou que ce lot existe pour fermer. **Deux fiches sont
   *    concernées** : `connaissance` et `synthese` en portent dix à elles deux.
   *    Un lecteur ne prend donc jamais ce champ tel quel : il passe par
   *    `valeursDesParametres()`.
   */
  parametres: Record<string, { defaut: number | string | boolean; bornes?: unknown; statut?: string }>
  empreinte_source: string
}

/**
 * Les paramètres d'un instrument, APLATIS À LEUR DÉFAUT — la forme qu'attendent
 * `statutDeLaMesure()` (pour `seuil_parametre`) et les branchements.
 *
 * Les booléens sortent : un `seuil_parametre` n'est jamais un booléen, et
 * `exception_orthographe` — le seul du lot — n'est pas un seuil mais une marque
 * de l'élève, servie par le contexte (`07-` §1.3).
 */
export function valeursDesParametres(
  instrument: InstrumentCompetence,
): Record<string, number | string> {
  const plat: Record<string, number | string> = {}
  for (const [nom, bloc] of Object.entries(instrument.parametres ?? {})) {
    const v = bloc?.defaut
    if (typeof v === 'number' || typeof v === 'string') plat[nom] = v
  }
  return plat
}

/**
 * Ce qu'une compétence ajoute à son instrument dérivé pour ENTRER DANS LA CHAÎNE.
 *
 * « Le détail de chaque chaîne fait foi À SA FICHE » (`01-` §11 ; `03-` §1) :
 * quel prompt est P1, lequel est P2, ce que Code1 prépare et ce que Code2 agrège
 * ne se DEVINENT pas depuis les titres des blocs. Ce branchement est donc écrit
 * À LA MAIN, une fois, par la session qui ouvre le slot — la fiche sous les yeux,
 * et le module de calibration à côté : `copies-tests/<nom>/code.py` implémente
 * déjà le même contrat, et il porte ses propres vecteurs. Ce n'est pas une
 * réécriture, c'est une EXTRACTION (`CONTRAT-MODULES.md` §7).
 *
 * ⚠️ Rien ici n'est un prompt : les textes viennent du dérivé, toujours. Le
 *    branchement ne fait que DÉSIGNER, dans `instrument.prompts`, la tête de bloc
 *    de chaque étage — et porter les deux temps de code de la chaîne.
 */
/**
 * Ce qu'un crochet pré-phase rend — `CONTRAT-MODULES.md` §2, crochet 2.
 *
 * Les clés SANS tiret bas sont des SLOTS, injectés dans le prompt de la phase.
 * Les clés À TIRET BAS ne sont pas des slots : « c'est un calcul que le banc
 * range DANS LE CONTEXTE, sous le même nom, à disposition des crochets suivants
 * et de `code1` ». *Sans elle, un module n'aurait que deux mauvais choix : le
 * canal des slots — et un bloc calculé jamais injecté est refusé — ou le
 * recalcul plus loin, qui lui donnerait deux domiciles.*
 *
 * ⚠️ Une valeur `null` sur un SLOT n'est pas un vide : c'est ainsi qu'un
 *    branchement dit « le contexte de l'exercice ne porte pas ce qu'il me
 *    faut » — sans jamais lever d'exception ni inventer une valeur. La chaîne
 *    refuse alors la mesure, en nommant le slot.
 */
export type RenduPrePhase = Record<string, string | null | unknown>

/** Ce que `code1` rend — `CONTRAT-MODULES.md` §2 et §3. */
export interface SortieCode1 {
  /** « `mesures` ne va qu'à `code2` » (§2, règles transversales). */
  mesures: Record<string, unknown>
  /**
   * Le seul objet que le juge lit à la place de la production. **Clé
   * OBLIGATOIRE dès que `code1` existe** ; sa VALEUR peut être `null` — un
   * relevé illisible n'a pas de document —, « c'est l'ABSENCE de la clé qui est
   * l'erreur, jamais la valeur nulle » (§2).
   *
   * ⚠️ « Un module qui l'omet fait servir `null` à son juge, qui juge alors à
   *    vide — et c'est le SEUL DÉFAUT DE CE CONTRAT DONT RIEN NE TÉMOIGNE : les
   *    verdicts sortent, l'autotest est vert, la trace est propre. » La chaîne
   *    en témoigne : elle refuse la mesure quand la clé manque.
   */
  document_p2: unknown
  alertes: string[]
}

/**
 * Ce que `code2` rend — les TROIS CLÉS PUBLIQUES du contrat (§3), plus le canal
 * privé de `conformite`. C'est CE QUI SE COMPARE AU MODULE de calibration.
 */
export interface SortieCode2 {
  /** « les clés sont EXACTEMENT les observables déclarés » (§3). */
  verdicts: Record<string, number | string | null>
  /**
   * « Le calcul déroulé lisiblement […] depuis que le code calcule juste, une
   * erreur de jugement n'a plus de symptôme visible : la trace est ce qui la
   * rend lisible. » **Une seule source de vérité** : ce qui récapitule recopie
   * la trace, il ne la recalcule jamais.
   */
  trace: string[]
  /** « Tout ce que le module a écarté, pas su lire, ou refusé de réparer. » */
  alertes: string[]
  /**
   * LE CANAL PRIVÉ — un état structuré que seul `code2` a calculé et que
   * `conformite` RECOPIE au lieu de le refaire. La marque est le TIRET BAS :
   * « sans lui, une quatrième clé est une violation » (§3), et le refus dur sur
   * les trois clés publiques ne porte que sur les clés sans tiret bas.
   */
  [prive: string]: unknown
}

export interface BranchementCompetence {
  /**
   * `prepare_copie` — le texte donné à la chaîne, quand la grille en veut un
   * autre que le brut. Structure le définit, et le contrat dit pourquoi : « les
   * lignes vides sont des frontières de blocs ». Absent, la production part
   * telle quelle.
   */
  prepareCopie?: (production: string, ctx: ContexteBranchement) => string
  /**
   * Les appels d'extraction (P1). Cinq compétences en ont UN ; la Synthèse en a
   * DEUX — relevé aveugle, puis aligneur —, et UN SEUL quand le référent est le
   * cours, où l'aligneur ne tourne pas (`07-` §1.2 ; `01-` §11).
   */
  extractions: (ctx: ContexteBranchement) => SpecExtraction[]
  /** L'appel de jugement (P2), observable par observable. */
  jugement: (ctx: ContexteBranchement) => SpecJugement
  /**
   * Code1 — « du code prépare ce que P2 doit voir ».
   *
   * ⭐ Il reçoit le CONTEXTE enrichi : les calculs privés que les crochets
   *    pré-phase y ont rangés, et les sorties des phases déjà jouées.
   */
  code1: (artefactsP1: Record<string, unknown>, ctx: ContexteBranchement) => SortieCode1
  /**
   * Code2 — « du code agrège ». Il reçoit LA SORTIE DE CODE1, et c'est ce que
   * le contrat écrit deux fois : `code2(sortie_p2, sortie_code1, params)`, « le
   * JSON de P2 déjà parsé + la sortie du crochet 3 ».
   *
   * ⚠️ Sans ce canal, une agrégation qui CROISE les mesures comptées par Code1
   *    avec les verdicts de P2 n'a rien à croiser.
   */
  code2: (artefactP2: unknown, sortieCode1: SortieCode1, ctx: ContexteBranchement) => SortieCode2
  /**
   * `conformite` — « il tourne à CHAQUE PASSAGE, d'office ». Les six modules le
   * définissent. Il rend UNE LISTE D'ALERTES, jamais un verdict : ses alertes
   * rejoignent celles de `code2`. *Un contrôle qu'on n'appelle pas est un
   * contrôle qui n'existe pas.*
   */
  conformite?: (
    artefactsP1: Record<string, unknown>,
    artefactP2: unknown,
    sortieCode1: SortieCode1,
    sortieCode2: SortieCode2,
    ctx: ContexteBranchement,
  ) => string[]
  /**
   * LE PALIER DE LA MESURE — la `lettre_equivalente` (`01-` §11), lue sur la
   * sortie de Code2. Elle n'est pas une quatrième clé publique : elle est ce
   * que la CHAÎNE tire des verdicts, et qu'un banc n'a pas à connaître.
   */
  lettre: (sortieCode2: SortieCode2, ctx: ContexteBranchement) => string | null
  /**
   * Le relevé des quantités que le volet `observables_mesure` de la fiche
   * transformera en valeurs d'observables — les observables du **§5**, ceux de
   * la TÉLÉMÉTRIE DU ROUTEUR, jamais ceux du module.
   *
   * ⚠️ « Le `03-` §1, gelé, répond : `observables_mesure` n'est pas [du ressort
   *    du module] — il n'est pas appliqué par le module mais par LA CHAÎNE
   *    FROIDE. » C'est donc ici, et nulle part ailleurs.
   *
   * ⚠️⚠️ UN OBSERVABLE OUBLIÉ NE LÈVE AUCUNE ERREUR — il rend `n/a`, et `n/a`
   *    SORT DU DÉNOMINATEUR du taux (`01-` §8.2). Une compétence ouverte dont
   *    le relevé oublie trois observables tourne, écrit, rend une lettre — et
   *    l'escalade N1/N2 est aveugle sur ces trois-là, POUR TOUJOURS, SANS UN
   *    SYMPTÔME. La parade est au « fait quand » : chaque observable du §5 a sa
   *    valeur au relevé, OU SON ALERTE NOMMÉE. Une absence délibérée se
   *    déclare ; elle ne se laisse pas tomber.
   */
  releve: (sortieCode2: SortieCode2, ctx: ContexteBranchement)
    => { releve: Record<string, number | string | boolean | null>; alertes: string[] }
  /**
   * `delta_v1_vf` — « la comparaison des SQUELETTES v1 et vf, JAMAIS des
   * verdicts. NULL n'est pas 0 : une passation en classe n'a pas de version
   * finale » (`01-` §11).
   *
   * Ce que « comparer deux squelettes » veut dire dépend de la grille : la
   * source ne le définit pas hors de la fiche, donc le branchement le porte.
   * Absent, le delta reste NULL — et NULL n'est pas 0.
   */
  delta?: (squeletteV1: unknown, squeletteVf: unknown, ctx: ContexteBranchement) => number | null
}

/** Un étage d'extraction : son prompt, ce qu'il remplit, et ce qu'il calcule. */
export interface SpecExtraction {
  /** La clé sous laquelle l'artefact de cette phase se range. */
  cle: string
  /** La tête de bloc du prompt dérivé — `P1`, `P1A`, `P1B` (la PHASE est la clé). */
  tetePrompt: string
  /**
   * Les slots que le crochet pré-phase REMPLIT. Déclarés, et non seulement
   * remplis : une déclaration se contrôle AU CHARGEMENT, sans dépôt sous la
   * main — et c'est là que le refus doit tomber, pas au premier appel payé.
   */
  slotsFournis: readonly string[]
  /** `pre_<phase>(contexte, params)` — les slots, et les calculs privés. */
  pre?: (ctx: ContexteBranchement) => RenduPrePhase
}

/** L'étage de jugement : son prompt, le slot du document, ce que `preP2` sert. */
export interface SpecJugement {
  tetePrompt: string
  /**
   * `SLOT_DOCUMENT_P2` — obligatoire dès que le prompt porte plus d'un slot.
   * `null` quand le prompt n'en porte qu'un : c'est lui, sans déclaration.
   */
  slotDocument?: string | null
  /** Les slots que `preP2` remplit — vérifiés AU CHARGEMENT (`CONTRAT` §2). */
  slotsFournis?: readonly string[]
  /**
   * `pre_p2` — « il sert ce que le CONTEXTE DE L'EXERCICE donne […] et il tourne
   * AVANT P1, donc le banc vérifie ses slots au chargement ». Un slot servi à
   * `null` arrête la mesure, en le nommant.
   */
  preP2?: (ctx: ContexteBranchement) => Record<string, string | null>
}

/** Ce que le branchement d'une compétence a le droit de savoir de l'exercice. */
export interface ContexteBranchement {
  modes: readonly string[]
  cran: string | null
  /** Le référent, quand la compétence en a deux (Synthèse : un texte, ou le cours). */
  referent: 'texte' | 'cours' | null
  /** `profiles.exception_orthographe` — le filtre EN AVAL de Code1 (`07-` §1.3). */
  exceptionOrthographe: boolean
  /**
   * LES FOURNISSEURS NATIFS DES SLOTS — ce que le contexte de l'exercice sert,
   * au sens de `banc.py` (`contexte_du_run` + `Chaine.contexte`) : `sujet`,
   * `copie`, `consigne`, `mode`, et ce que la compétence réclame en plus.
   *
   * ⚠️ `copie` est la production APRÈS `prepareCopie`, jamais la brute : c'est
   *    sur elle que les crochets comptent, et c'est elle que les numéros de
   *    phrase désignent.
   */
  contexteExercice: Readonly<Record<string, string>>
  /**
   * Les calculs PRIVÉS des crochets pré-phase — les clés à tiret bas qu'ils ont
   * rangées dans le contexte, à disposition des phases suivantes et de `code1`.
   */
  prives: Readonly<Record<string, unknown>>
  /**
   * Les sorties des phases d'extraction DÉJÀ JOUÉES, par leur nom de phase :
   * « après P1A il porte sa sortie sous `sorties["p1a"]`, ce qui permet à
   * `pre_p1b` de servir à l'aligneur ce que le relevé aveugle a trouvé » (§2).
   */
  sorties: Readonly<Record<string, unknown>>
  /**
   * Les paramètres du bloc machine de la fiche, APLATIS À LEUR DÉFAUT —
   * « aucun seuil en dur nulle part : la table est la seule maison des seuils »
   * (`CONTRAT-MODULES.md` §4).
   */
  parametres: Readonly<Record<string, number | string>>
}

/**
 * Le refus dur du `CONTRAT-MODULES.md` §3, sur la FORME du retour de `code2` —
 * porté de `banc.py` (`refuse_forme_code2`). Rend le motif, ou `null`.
 *
 * « Ses clés publiques sont exactement `verdicts`, `trace`, `alertes` — toute
 * autre clé SANS TIRET BAS arrête le pilote. » *Deux modules rendaient une
 * quatrième clé publique sans faire rougir un seul contrôle.*
 */
export const CLES_PUBLIQUES_CODE2 = ['alertes', 'trace', 'verdicts'] as const

export function refusFormeCode2(c2: unknown): string | null {
  if (c2 == null || typeof c2 !== 'object' || Array.isArray(c2)) {
    return 'REFUS : `code2` ne rend pas un objet.'
  }
  const publiques = Object.keys(c2 as Record<string, unknown>).filter((k) => !k.startsWith('_')).sort()
  const attendues = [...CLES_PUBLIQUES_CODE2]
  if (publiques.length === attendues.length && publiques.every((k, i) => k === attendues[i])) return null
  const manque = attendues.filter((k) => !publiques.includes(k))
  const enTrop = publiques.filter((k) => !attendues.includes(k as never))
  return 'REFUS : les clés publiques de `code2` ne sont pas celles du contrat (§3).'
    + (manque.length ? ` Absentes : ${manque.join(', ')}.` : '')
    + (enTrop.length ? ` Interdites : ${enTrop.join(', ')} — une clé d'audit interne se préfixe `
      + "d'un tiret bas." : '')
}

/**
 * Les instruments dérivés, par compétence. Les SIX fiches dérivent depuis que le
 * seuil de la dérivation est *relu et validé* (C4-L10) ; ce registre, lui, ne
 * porte que celles dont la chaîne est BRANCHÉE — et le branchement s'écrit à la
 * main, une compétence à la fois.
 *
 * Ouvrir un slot tient en trois gestes (`LISEZ-MOI.md`) :
 *
 *   1. `python3 scripts/derive-instruments.py --ecris` — le dérivé apparaît ;
 *   2. importer `INSTRUMENT_<NOM>` et le poser ici ;
 *   3. écrire son branchement dans `BRANCHEMENTS`, LA FICHE SOUS LES YEUX et le
 *      module de calibration à côté. Cela ne se devine pas depuis les titres
 *      des blocs (`01-` §11 ; `03-` §1).
 */
const INSTRUMENTS: Partial<Record<Competence, InstrumentCompetence>> = {
  // C4-L10, 22/08/2026 — l'Expression passe la première, et c'est mesuré : elle
  // est la SEULE des six dont les vecteurs sont adossés à de VRAIS golds
  // (`TESTS_P2_PARFAIT` : 7 copies, `VERSION_GOLDS_TESTEE = "1.0"` ; les cinq
  // autres portent `None`). Son portage est donc le seul qui puisse être
  // vérifié jusqu'au gold.
  expression: INSTRUMENT_EXPRESSION as unknown as InstrumentCompetence,
  // C4-L10, 23/08/2026 — l'Argumentation est LA DEUXIÈME, et c'est elle qui fait
  // mordre l'alerte de repli alphabétique : « la `cible_primaire` … lève une
  // alerte dès que ce repli sert sur plus d'une compétence », et sa condition de
  // fermeture était « AVANT LA DEUXIÈME COMPÉTENCE BRANCHÉE ». C4-L11 l'a tenue.
  // ⚠️ Elle n'a NI GOLD NI RUN STOCKÉ (`VERSION_GOLDS_TESTEE = None`) : son
  //    portage se prouve aux 29 vecteurs embarqués du module ET AU BALAYAGE —
  //    723 entrées de plus dans les mêmes fonctions du même module.
  argumentation: INSTRUMENT_ARGUMENTATION as unknown as InstrumentCompetence,
  // C4-L10, 23/08/2026 — la Structure est LA TROISIÈME, et elle est la seule des
  // six à ouvrir DEUX choses de plus. ⭐ `prepare_copie` : elle est la seule à le
  // définir, et le contrat dit pourquoi — « les lignes vides sont des frontières
  // de blocs » ; c'est une copie RENUMÉROTÉE que P1 reçoit, et ce sont ces
  // numéros que tout le relevé désigne. ⭐⭐ Et LES ARTEFACTS DE RUN : elle n'a ni
  // gold ni vecteur P2 (`TESTS_P2_PARFAIT` vide, `VERSION_GOLDS_TESTEE = None`),
  // mais 112 couples (P1, P2) réellement produits par le banc dorment dans son
  // dossier — une contre-épreuve gratuite qu'aucune des cinq autres n'a, et qui
  // porte deux générations de schéma de squelette.
  structure: INSTRUMENT_STRUCTURE as unknown as InstrumentCompetence,
}

/**
 * Les branchements, un par slot ouvert.
 *
 * ⚠️ Un instrument importé SANS branchement est une erreur, et
 *    `verifierCoherence()` la dit : la compétence serait silencieusement muette.
 *    Un instrument DÉRIVÉ sans slot importé, lui, est l'état normal des cinq
 *    autres — C4-L10 se rejoue pour chacune.
 */
const BRANCHEMENTS: Partial<Record<Competence, BranchementCompetence>> = {
  expression: BRANCHEMENT_EXPRESSION,
  argumentation: BRANCHEMENT_ARGUMENTATION,
  structure: BRANCHEMENT_STRUCTURE,
}

export interface EtatCompetence {
  competence: Competence
  /** La fiche est-elle dérivée — donc *relue et validée* —, ET sa chaîne branchée ? */
  ouverte: boolean
  /** Le motif, tel que la dérivation l'a écrit. Il se montre, il ne se devine pas. */
  motif: string | null
  instrument: InstrumentCompetence | null
  branchement: BranchementCompetence | null
}

const MANIFESTE = MANIFESTE_INSTRUMENTS as unknown as {
  outil: string
  sources: Record<string, { version: string; statut: string; empreinte: string }>
  competences: Record<string, { ouverte: boolean; motif?: string; version?: string }>
  monitoring: { ouvert: boolean; version: string; statut: string; note: string }
}

/** L'état d'une compétence vis-à-vis de la chaîne. */
export function etatCompetence(competence: Competence): EtatCompetence {
  const entree = MANIFESTE.competences[competence]
  const instrument = INSTRUMENTS[competence] ?? null
  const branchement = BRANCHEMENTS[competence] ?? null
  let motif: string | null = null
  if (!entree?.ouverte) {
    motif = entree?.motif ?? 'compétence inconnue du manifeste dérivé'
  } else if (!instrument) {
    motif = 'fiche dérivée, mais instrument non importé — la compétence attend son passage de '
      + 'C4-L10 : rejouer `derive-instruments.py --ecris`, puis importer le slot et écrire son '
      + 'branchement dans instruments.ts'
  } else if (!branchement) {
    motif = 'instrument dérivé présent, mais la chaîne de la fiche n\'est pas branchée — '
      + 'P1, P2, Code1 et Code2 se déclarent dans BRANCHEMENTS, la fiche sous les yeux (`03-` §1)'
  }
  return {
    competence,
    ouverte: !!entree?.ouverte && instrument !== null && branchement !== null,
    motif,
    instrument,
    branchement,
  }
}

/** Les compétences que la chaîne peut mesurer aujourd'hui. Possiblement aucune. */
export function competencesOuvertes(): Competence[] {
  return COMPETENCES.filter((c) => etatCompetence(c).ouverte)
}

/**
 * Les compétences que la dérivation a versées et qu'AUCUN branchement ne sert
 * encore. Ce n'est PAS une incohérence — c'est la file d'attente de C4-L10, qui
 * se rejoue une compétence à la fois : « une compétence de plus est une
 * compétence de plus à la rentrée, pas un lot de plus ».
 *
 * Elle est ici pour que l'attente reste LISIBLE plutôt que tacite : le contrôle
 * qui en faisait un écart a disparu avec le seuil de banc, la question qu'il
 * posait, non.
 */
export function competencesEnAttenteDeBranchement(): Competence[] {
  return COMPETENCES.filter((c) => !!MANIFESTE.competences[c]?.ouverte && INSTRUMENTS[c] == null)
}

/**
 * Le désaccord entre ce que la dérivation a versé et ce que ce module branche.
 * Rend la liste des incohérences — vide quand tout se tient.
 *
 * *Un slot branché sans fichier dérivé servirait un instrument fantôme ; un
 * instrument importé sans branchement mesurerait en silence rien du tout.*
 *
 * ⚠️ « Fiche dérivée, slot non importé » N'EST PLUS UN ÉCART, et le motif du
 *    changement est le seuil : sous *versé et bancé*, une fiche dérivée était
 *    un événement rare et une compétence non branchée un oubli ; sous *relu et
 *    validé*, LES SIX DÉRIVENT et cinq attendent leur tour par construction.
 *    Rien n'est tu pour autant — `competencesEnAttenteDeBranchement()` les
 *    nomme, et `etatCompetence()` sert le motif, que le bilan d'un dépôt
 *    affiche.
 */
export function verifierCoherence(): string[] {
  const ecarts: string[] = []
  for (const c of COMPETENCES) {
    const declaree = !!MANIFESTE.competences[c]?.ouverte
    const branchee = INSTRUMENTS[c] != null
    if (!declaree && branchee) {
      ecarts.push(`${c} : slot importé dans instruments.ts, fiche NON dérivée au manifeste `
        + '— la dérivation ne l\'a pas lue (fiche absente, ou pas *relue et validée*)')
    }
    if (branchee && INSTRUMENTS[c]!.competence !== c) {
      ecarts.push(`${c} : le slot porte l'instrument de « ${INSTRUMENTS[c]!.competence} »`)
    }
    if (BRANCHEMENTS[c] != null && !branchee) {
      ecarts.push(`${c} : chaîne branchée sans instrument dérivé — elle n'a aucun prompt à exécuter`)
    }
    // Le cas symétrique manquait, et c'est le plus probable : une session de
    // reprise importe l'instrument et oublie le branchement. La compétence
    // devenait alors silencieusement muette, `verifierCoherence()` au vert.
    if (branchee && BRANCHEMENTS[c] == null) {
      ecarts.push(`${c} : instrument dérivé importé, mais AUCUN branchement — `
        + 'P1, P2, Code1 et Code2 se déclarent dans BRANCHEMENTS (`03-` §1)')
    }
    // Et un dérivé d'une génération antérieure, que le manifeste a dépassé.
    const v = MANIFESTE.competences[c]?.version
    if (branchee && v && INSTRUMENTS[c]!.version !== v) {
      ecarts.push(`${c} : l'instrument importé porte la version ${INSTRUMENTS[c]!.version}, `
        + `le manifeste dérivé dit ${v} — rejouer \`derive-instruments.py --ecris\``)
    }
    // ⭐ LES SLOTS, CONTRÔLÉS AU CHARGEMENT — c'est ici que le refus tombe, et
    //    jamais au premier appel : un appel dépensé sur une chaîne qui produirait
    //    des trous est un appel perdu, et la mesure qui en sort est fausse.
    if (branchee && BRANCHEMENTS[c] != null) {
      ecarts.push(...refusDeSlots(c, INSTRUMENTS[c]!, BRANCHEMENTS[c]!))
    }
  }
  return ecarts
}

/**
 * LES FOURNISSEURS NATIFS DES SLOTS — ce que le contexte de l'exercice sert à
 * tout branchement, sans crochet. Le banc a les siens (`banc.py` :
 * `contexte_du_run` + `Chaine.contexte` — `mode`, `consigne`, `reference`,
 * `source`, `corpus_cours`, `sujet`, `copie`) ; la chaîne sert ce qu'elle LIT
 * vraiment d'un dépôt, et rien de plus.
 *
 * ⚠️ `sujet` EST LA CONSIGNE INSTANCIÉE, et il faut le savoir : la table
 *    `exercices` porte la `consigne_instanciee` et la PROVENANCE de ses deux
 *    matériaux, jamais le TEXTE d'un sujet distinct (`07-` §1.1) — la chaîne
 *    n'a donc pas d'autre sujet à servir. Ce que la consigne dit couvre ce que
 *    le slot demande : « ce qu'il y a à faire, ce qu'il faut produire, ce sur
 *    quoi on travaille ». *Le jour où le matériau déposé remontera jusqu'à la
 *    chaîne, c'est ici que le fournisseur se sépare — pas dans un branchement.*
 *
 * Tout le reste — référent, corpus du cours, référence décomposée — passe par
 * `preP2`, « ce que le CONTEXTE de l'exercice donne » (`CONTRAT` §2).
 */
export const FOURNISSEURS_NATIFS = ['sujet', 'copie', 'consigne', 'mode'] as const

/**
 * Les refus de slots d'un branchement, tous référents confondus.
 *
 * ⚠️ Les trois référents sont éprouvés, pas seulement celui du jour : la
 *    Synthèse ne lance PAS le même nombre d'appels selon que son référent est le
 *    texte ou le cours (`07-` §1.2), et un branchement qui ne tiendrait que sur
 *    l'un des deux ne se verrait qu'en production, sur l'autre.
 */
function refusDeSlots(
  c: Competence,
  instrument: InstrumentCompetence,
  branchement: BranchementCompetence,
): string[] {
  const refus: string[] = []
  const natifs = [...FOURNISSEURS_NATIFS]
  for (const referent of ['texte', 'cours', null] as const) {
    const ctx: ContexteBranchement = {
      modes: [], cran: null, referent, exceptionOrthographe: false,
      contexteExercice: {}, prives: {}, sorties: {}, parametres: valeursDesParametres(instrument),
    }
    const ou = referent === null ? 'sans référent' : `référent « ${referent} »`
    for (const spec of branchement.extractions(ctx)) {
      const gabarit = instrument.prompts[spec.tetePrompt]
      if (!gabarit) {
        refus.push(`${c} (${ou}) : le branchement demande le prompt « ${spec.tetePrompt} », `
          + `absent de l'instrument dérivé (${Object.keys(instrument.prompts).join(', ')})`)
        continue
      }
      refus.push(...refusSlotsExtraction(gabarit, spec.slotsFournis, natifs, spec.tetePrompt)
        .map((r) => `${c} (${ou}) : ${r}`))
      if (spec.slotsFournis.length && !spec.pre) {
        refus.push(`${c} (${ou}) : ${spec.tetePrompt} déclare fournir `
          + `${spec.slotsFournis.join(', ')} sans crochet pré-phase pour les remplir`)
      }
    }
    const specP2 = branchement.jugement(ctx)
    const gabaritP2 = instrument.prompts[specP2.tetePrompt]
    if (!gabaritP2) {
      refus.push(`${c} (${ou}) : le branchement demande le prompt de jugement `
        + `« ${specP2.tetePrompt} », absent de l'instrument dérivé`)
      continue
    }
    // ⚠️ AUCUN NATIF ICI, et c'est la règle du banc, pas un oubli : à P2, le
    //    contexte de l'exercice n'arrive QUE par `preP2` — « il sert ce que le
    //    contexte donne » (`CONTRAT` §2). Tout slot du juge est le document, ou
    //    vient du crochet ; il n'y a pas de troisième voie.
    refus.push(...refusSlotsJugement(
      gabaritP2, specP2.slotDocument ?? null, specP2.slotsFournis ?? [], [],
    ).refus.map((r) => `${c} (${ou}) : ${r}`))
  }
  // Les trois référents rendent souvent le même refus : on ne le dit qu'une fois.
  return [...new Set(refus)]
}

/** Le gabarit de la couche contrat — `07-` §4, dérivé, jamais édité de son côté. */
export const CALAME = GABARIT_CALAME as unknown as {
  source: string
  version_source: string
  gabarit: string
  /**
   * Le gabarit DÉCOUPÉ — « la dérivation émet le gabarit découpé en sections
   * nommées, pour qu'un remplacement ait quelque chose d'identifié à
   * remplacer » (`07-` §4). `gabarit` reste, à l'octet : le découpage s'ajoute.
   * L'assemblage passe par `assemblerGabarit` (`./retour`), jamais par une
   * concaténation locale.
   */
  sections: readonly SectionCalame[]
  variables: readonly string[]
  regles_verrouillees: readonly number[]
  sections_editables: readonly string[]
  empreinte_source: string
}

/** L'instrument du Monitoring — au statut PLAFOND qu'il déclare, donc toujours ouvert. */
export const MONITORING = INSTRUMENT_MONITORING as unknown as {
  source: string
  version: string
  statut: string
  prompt_extraction: string
  variables: readonly string[]
  champs_sortie: readonly string[]
  bloc_machine: {
    observables: Record<string, { echelle: string; valeurs: Array<string | number> }>
    squelette: { catalogue: Record<string, string[]> }
    notation: Record<string, unknown>
  }
  empreinte_source: string
}

/** Le manifeste dérivé — versions et empreintes des sources lues. Pour le relevé. */
export const MANIFESTE_LU = MANIFESTE
