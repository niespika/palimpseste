// ============================================================================
// C4 · L5 — LA CLÉ QUI OUVRE CHAQUE SLOT.
// ----------------------------------------------------------------------------
// « Une compétence dont la fiche n'a pas passé sa porte reste HORS DE LA CHAÎNE
//   — pas d'instrument dérivé, pas de mesure. […] Construis l'infrastructure
//   entière et le branchement par compétence : la fiche versée et bancée est la
//   clé qui ouvre chaque slot. »                       — PROMPT, piège 54
//
// La clause granulaire est appliquée À LA DÉRIVATION (`scripts/derive-instruments.py`)
// et NULLE PART AILLEURS : une fiche qui n'est pas *versée et bancée* ne produit
// aucun fichier dans `derive/competences/`. Ce module ne fait que LIRE ce que la
// dérivation a versé — un seul domicile, donc rien qui puisse diverger.
//
// ⚠️ Le statut de RECETTE (`competences_niveaux.statut_recette`, posé par le
//    professeur à la fabrique) est UNE AUTRE CHOSE : il dit ce que la mesure
//    devient, jamais si l'instrument existe. Les deux gardes se cumulent.
// ============================================================================

import { MANIFESTE_INSTRUMENTS } from './derive/MANIFESTE'
import { GABARIT_CALAME } from './derive/calame-retour'
import { INSTRUMENT_MONITORING } from './derive/monitoring'
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
  parametres: Record<string, number | string>
  empreinte_source: string
}

/**
 * Ce qu'une compétence ajoute à son instrument dérivé pour ENTRER DANS LA CHAÎNE.
 *
 * « Le détail de chaque chaîne fait foi À SA FICHE » (`01-` §11 ; `03-` §1) :
 * quel prompt est P1, lequel est P2, ce que Code1 prépare et ce que Code2 agrège
 * ne se DEVINENT pas depuis les titres des blocs. Ce branchement est donc écrit
 * À LA MAIN, une fois, par la session qui ouvre le slot — la fiche sous les yeux,
 * puisqu'elle est alors *versée et bancée* et donc lisible.
 *
 * ⚠️ Rien ici n'est un prompt : les textes viennent du dérivé, toujours. Le
 *    branchement ne fait que DÉSIGNER, dans `instrument.prompts`, la tête de bloc
 *    de chaque étage — et porter les deux temps de code de la chaîne.
 */
export interface BranchementCompetence {
  /**
   * Les appels d'extraction (P1). Cinq compétences en ont UN ; la Synthèse en a
   * DEUX — relevé aveugle, puis aligneur —, et UN SEUL quand le référent est le
   * cours, où l'aligneur ne tourne pas (`07-` §1.2 ; `01-` §11).
   */
  extractions: (ctx: ContexteBranchement) => Array<{ cle: string; tetePrompt: string }>
  /** L'appel de jugement (P2), observable par observable. */
  jugement: (ctx: ContexteBranchement) => { tetePrompt: string }
  /**
   * Code1 — « du code prépare ce que P2 doit voir ». Rend le `document_p2`
   * qu'attend le contrat des modules (`CONTRAT-MODULES.md` §3).
   */
  code1: (artefactsP1: Record<string, unknown>, ctx: ContexteBranchement)
    => { document_p2: unknown; alertes: string[] }
  /**
   * Code2 — « du code agrège ». Rend le PALIER DE LA MESURE (la
   * `lettre_equivalente`, `01-` §11) et le relevé des quantités que le volet
   * `observables_mesure` de la fiche transformera en valeurs d'observables.
   */
  code2: (artefactP2: unknown, ctx: ContexteBranchement)
    => { lettre_equivalente: string | null; releve: Record<string, number | string | boolean | null>; alertes: string[] }
  /**
   * `delta_v1_vf` — « la comparaison des SQUELETTES v1 et vf, JAMAIS des
   * verdicts. NULL n'est pas 0 : une passation en classe n'a pas de version
   * finale » (`01-` §11 ; piège 17).
   *
   * Ce que « comparer deux squelettes » veut dire dépend de la grille : la
   * source ne le définit pas hors de la fiche, donc le branchement le porte.
   * Absent, le delta reste NULL — et NULL n'est pas 0.
   */
  delta?: (squeletteV1: unknown, squeletteVf: unknown, ctx: ContexteBranchement) => number | null
}

/** Ce que le branchement d'une compétence a le droit de savoir de l'exercice. */
export interface ContexteBranchement {
  modes: readonly string[]
  cran: string | null
  /** Le référent, quand la compétence en a deux (Synthèse : un texte, ou le cours). */
  referent: 'texte' | 'cours' | null
  /** `profiles.exception_orthographe` — le filtre EN AVAL de Code1 (`07-` §1.3). */
  exceptionOrthographe: boolean
}

/**
 * Les instruments dérivés, par compétence. Le registre est VIDE tant qu'aucune
 * fiche n'est versée et bancée — c'est l'état du jour, et c'est un état normal.
 *
 * Il se remplit sans toucher à la mécanique : `derive-instruments.py --ecris`
 * écrit `derive/competences/<nom>.ts`, et la ligne d'import correspondante, plus
 * le branchement, sont les SEULES choses qu'une session de reprise ajoute ici.
 */
const INSTRUMENTS: Partial<Record<Competence, InstrumentCompetence>> = {
  // ── Les six slots. Aucun n'est ouvert au 21/08/2026 (six fiches *relues et
  //    validées*, aucune *versée et bancée*). Ouvrir un slot :
  //
  //      import { INSTRUMENT_EXPRESSION } from './derive/competences/expression'
  //      expression: INSTRUMENT_EXPRESSION as unknown as InstrumentCompetence,
  //
  //    Le manifeste dérivé dit, à tout instant, lesquels devraient l'être :
  //    un slot ouvert ici sans fichier dérivé fait tomber `verifierCoherence()`.
}

/** Les branchements, un par slot ouvert. Vide aujourd'hui, pour la même raison. */
const BRANCHEMENTS: Partial<Record<Competence, BranchementCompetence>> = {}

export interface EtatCompetence {
  competence: Competence
  /** La fiche est-elle versée et bancée, ET sa chaîne branchée ? */
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
    motif = 'fiche versée et bancée, mais instrument dérivé non importé — rejouer '
      + '`derive-instruments.py --ecris` puis brancher le slot dans instruments.ts'
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
 * Le désaccord entre ce que la dérivation a versé et ce que ce module branche.
 * Rend la liste des incohérences — vide quand tout se tient.
 *
 * *Un slot branché sans fichier dérivé servirait un instrument fantôme ; un
 * fichier dérivé sans slot branché mesurerait en silence rien du tout.*
 */
export function verifierCoherence(): string[] {
  const ecarts: string[] = []
  for (const c of COMPETENCES) {
    const declaree = !!MANIFESTE.competences[c]?.ouverte
    const branchee = INSTRUMENTS[c] != null
    if (declaree && !branchee) {
      ecarts.push(`${c} : fiche versée et bancée au manifeste, slot NON branché dans instruments.ts`)
    }
    if (!declaree && branchee) {
      ecarts.push(`${c} : slot branché dans instruments.ts, fiche NON versée et bancée au manifeste`)
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
  }
  return ecarts
}

/** Le gabarit de la couche contrat — `07-` §4, dérivé, jamais édité de son côté. */
export const CALAME = GABARIT_CALAME as unknown as {
  source: string
  version_source: string
  gabarit: string
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
