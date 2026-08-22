// ============================================================================
// C4 · L3 — « SE JUGER » : la phase, sa banque, sa garde.
// Module PUR.
// ----------------------------------------------------------------------------
// LES CONDITIONS DE SERVICE SONT EXACTES ET FERMÉES (`02-` §5 ; la fiche §6,
// flux 1) : geste **`produire`**, grain **`meso` ou `macro`**, compétence cible
// **`evaluee`** — jamais ailleurs.
//
// ⚠️ À LA MAISON, C'EST DE DROIT. « Les deux drapeaux d'opt-in de classe sont
//    SANS EFFET quand `lieu` vaut `maison` » (`07-` §1.1 ; `02-` §5) :
//    **l'écran maison ne les lit pas**. Ce module ne les reçoit même pas en
//    argument — une option qu'on ne peut pas passer ne peut pas être lue par
//    erreur.
//
// L'ÉLECTION (la fiche §4) : deux à trois questions, tirées de la banque PAR
// OBSERVABLE des compétences que l'exercice **cible — primaire ou secondaire**,
// choisies **parmi les observables que l'exercice TESTE, les plus fragiles de
// l'élève d'abord** ; **jamais un observable non testé, jamais une compétence
// SEULEMENT SONDÉE** — une sonde est silencieuse ; à égalité, **le tirage
// journalisé départage**.
//
// ⚠️ RÉPONSES AU DOIGT, AUCUNE SAISIE LONGUE — « l'écran est souvent un
//    téléphone » (`07-` §3) —, et **les réponses sont une liste fermée**
//    (`07-` §1.1) : *une réponse libre ne se compare à rien*.
//
// ⭐ CE QUE LA COMPARAISON PEUT FAIRE AUJOURD'HUI, ET CE QU'ELLE NE PEUT PAS.
//    « La comparaison au squelette, observable par observable, est du CODE,
//    jamais le modèle » (`06-` §2 ; `07-` §1.2) — et ce module la fait. Mais la
//    correspondance en base porte QUATRE choses (`07-` §1.1) : la dimension
//    dite à l'élève, la question, la LISTE FERMÉE des réponses, et la version.
//    **Elle ne déclare NULLE PART laquelle de ces réponses vaut « réussi ».**
//    Et le sens varie d'une ligne à l'autre — sur la Structure, « aucune » est
//    la bonne réponse à `jointure_presente`, « non » l'est à
//    `charniere_formule`, « oui » l'est à `plan_tenu`. **Aucune règle
//    mécanique ne s'en déduit, et on n'en invente pas.**
//    → La comparaison CONSIGNE LES DEUX CÔTÉS et rend `accord: null` tant que
//      la correspondance ne porte pas ce cinquième champ. C'est la doctrine du
//      dépôt, pas un repli : « COLLECTER D'ABORD, CONVERTIR ENSUITE — des
//      seuils posés d'avance deviendraient la cible que le dispositif apprend à
//      viser » (`07-` §1.3). Le jour où le champ arrive, les réponses déjà
//      consignées se relisent.
//    → Le TROISIÈME cas de la garde, lui, se décide sans aucune correspondance :
//      il ne demande pas dans quel sens l'élève s'est trompé, seulement si le
//      squelette porte l'observable. Il est donc **actif dès aujourd'hui**.
// ============================================================================

import { etatDesObservables, type InstrumentLu } from '../routeur/observables'
import type { Mesure } from '../routeur/mesure'
import { NA, type Observables } from '../chaine/observables'
import type {
  Competence, ComparaisonObservable, Geste, Grain, QuestionServie,
} from './types'

/** « DEUX À TROIS questions » (la fiche §4). À la maison, trois. */
export const QUESTIONS_MIN = 2
export const QUESTIONS_MAX = 3

/** Les grains où la phase est servie (`02-` §5 ; la fiche §6, flux 1). */
export const GRAINS_QUI_JUGENT: readonly Grain[] = ['meso', 'macro']

/**
 * ⭐ LA PHASE EST-ELLE SERVIE ? Les trois conditions, et rien d'autre.
 * @param cibles les compétences que l'exercice CIBLE — primaire ou secondaire.
 *               ⚠️ Les compétences seulement SONDÉES n'y sont pas : « une sonde
 *               est silencieuse, elle ne produit aucun retour » (la fiche §4).
 * @param statutRecette le statut de recette, par compétence.
 */
export function phaseServie(
  geste: Geste,
  grain: Grain,
  cibles: readonly Competence[],
  statutRecette: Readonly<Record<string, string>>,
): { servie: boolean; motif: string | null } {
  if (geste !== 'produire') {
    return { servie: false, motif: `geste ${geste} : « se juger » n'est servi qu'en geste produire` }
  }
  if (!GRAINS_QUI_JUGENT.includes(grain)) {
    return { servie: false, motif: `grain ${grain} : la phase est servie au meso et au macro seuls` }
  }
  const evaluees = cibles.filter((c) => statutRecette[c] === 'evaluee')
  if (evaluees.length === 0) {
    return { servie: false, motif: 'aucune compétence ciblée n\'est `evaluee` : la phase ne se '
      + 'sert pas (la fiche §6, flux 1 — la cascade fiche déposée → recette passée → '
      + 'correspondance uploadée → choix du professeur)' }
  }
  return { servie: true, motif: null }
}

/** Une candidate à l'élection : un observable testé, avec sa fragilité. */
export interface CandidateQuestion {
  competence: Competence
  observable_code: string
  /** `null` quand la fenêtre ne porte aucune mesure ayant un objet. */
  taux: number | null
}

/**
 * Ce que l'exercice TESTE, par compétence ciblée : les observables en jeu.
 * ⚠️ « Jamais un observable NON TESTÉ » — aux crans de production, la
 *    couverture déclare `exerce` par compétence (« tous les observables sont en
 *    jeu, mêlés », `02-` §2.3.2), et `observable_seul` en est retranché : un
 *    observable visible mais non entraîné n'est pas testé.
 */
export interface CouvertureTestee {
  competence: Competence
  /** Les codes que l'exercice met en jeu. Vide = la compétence n'est pas testée. */
  observables: string[]
}

/**
 * L'élection des candidates : les observables TESTÉS des compétences CIBLÉES,
 * ordonnés du plus fragile au moins fragile.
 *
 * ⚠️ Un observable SANS TAUX ne se classe pas au taux (`01-` §8.2) — mais il
 *    reste une candidate LÉGITIME : la phase doit servir des questions dès le
 *    premier exercice, quand aucune fenêtre n'existe encore. Il passe donc
 *    APRÈS les classables, jamais avant : on interroge d'abord là où l'on sait
 *    que ça faiblit.
 */
export function candidates(
  couverture: readonly CouvertureTestee[],
  fenetres: Readonly<Record<string, readonly Mesure[]>>,
  instruments: Readonly<Record<string, InstrumentLu | null>>,
): CandidateQuestion[] {
  const out: CandidateQuestion[] = []
  for (const c of couverture) {
    const instrument = instruments[c.competence] ?? null
    const parCode = new Map<string, number | null>()
    if (instrument && Object.keys(instrument.observablesMesure).length > 0) {
      for (const e of etatDesObservables(fenetres[c.competence] ?? [], instrument, [])) {
        parCode.set(e.code, e.taux)
      }
    }
    for (const code of c.observables) {
      out.push({ competence: c.competence, observable_code: code, taux: parCode.get(code) ?? null })
    }
  }
  return out.sort((a, b) => {
    // Les plus fragiles d'abord ; les sans-taux en queue, jamais devant.
    if (a.taux === null && b.taux === null) return cle(a).localeCompare(cle(b))
    if (a.taux === null) return 1
    if (b.taux === null) return -1
    return a.taux - b.taux || cle(a).localeCompare(cle(b))
  })
}

const cle = (c: CandidateQuestion) => `${c.competence}|${c.observable_code}`

/** Le tirage qui départage les ex æquo — ⚠️ IL SE JOURNALISE (la fiche §4). */
export interface TirageJournalise {
  /** Les candidates à égalité au taux du dernier rang retenu. */
  ex_aequo: string[]
  /** Ce qui a été retenu parmi elles. */
  retenues: string[]
  /** La semence, pour que le tirage soit reproductible au débogage. */
  semence: string
}

function departage(
  ordonnees: readonly CandidateQuestion[], combien: number, semence: string,
): { retenues: CandidateQuestion[]; tirage: TirageJournalise | null } {
  if (ordonnees.length <= combien) {
    return { retenues: [...ordonnees], tirage: null }
  }
  const dernier = ordonnees[combien - 1]
  const surs = ordonnees.slice(0, combien).filter((c) => c.taux !== dernier.taux)
  const exAequo = ordonnees.filter((c) => c.taux === dernier.taux)
  if (exAequo.length <= combien - surs.length) {
    return { retenues: ordonnees.slice(0, combien), tirage: null }
  }
  // Un tirage semé sur le dépôt : reproductible, et le même au rechargement —
  // servir deux jeux de questions différents mesurerait deux élèves.
  let h = 0
  for (let i = 0; i < semence.length; i++) h = (h * 31 + semence.charCodeAt(i)) >>> 0
  const pot = [...exAequo]
  const tires: CandidateQuestion[] = []
  while (tires.length < combien - surs.length && pot.length > 0) {
    h = (h * 1103515245 + 12345) >>> 0
    tires.push(...pot.splice(h % pot.length, 1))
  }
  return {
    retenues: [...surs, ...tires],
    tirage: { ex_aequo: exAequo.map(cle), retenues: tires.map(cle), semence },
  }
}

/** Ce que l'écran sert, et ce qui part au journal avec. */
export interface OffreSeJuger {
  questions: QuestionServie[]
  /**
   * ⚠️ `questions_version` **CITE LA LIGNE VERSION DE LA FICHE au moment du
   * dépôt** de la correspondance — jamais un numéro inventé (`07-` §1.2).
   * `null` quand les questions servies ne s'accordent pas sur une version : on
   * ne choisit pas à leur place.
   */
  version: string | null
  tirage: TirageJournalise | null
  /** Les observables élus dont la banque n'a AUCUNE question — on signale. */
  sansQuestion: string[]
}

/**
 * ⭐ L'OFFRE — deux à trois questions, au doigt, en langue élève.
 *
 * @param banque la correspondance en base, pour les compétences ciblées.
 * @param semence le dépôt : le tirage doit être le même au rechargement.
 */
export function offreSeJugerMaison(
  candidatesOrdonnees: readonly CandidateQuestion[],
  banque: ReadonlyArray<QuestionServie>,
  semence: string,
  combien: number = QUESTIONS_MAX,
): OffreSeJuger {
  const parCle = new Map(banque.map((q) => [`${q.competence}|${q.observable_code}`, q]))
  const servables = candidatesOrdonnees.filter((c) => parCle.has(cle(c)))
  const sansQuestion = candidatesOrdonnees.filter((c) => !parCle.has(cle(c))).map(cle)

  const { retenues, tirage } = departage(servables, combien, semence)
  const questions = retenues.map((c) => parCle.get(cle(c)) as QuestionServie)

  // La version : celle de la fiche, et elle doit être UNE. Deux versions parmi
  // les questions servies veut dire deux dépôts de fiche mêlés — on ne tranche
  // pas, on rend `null` et l'appelant le porte au journal.
  const versions = [...new Set(questions.map((q) => q.fiche_version))]
  return {
    questions,
    version: versions.length === 1 ? versions[0] : null,
    tirage,
    sansQuestion,
  }
}

/**
 * ⭐ LA COMPARAISON AU SQUELETTE, OBSERVABLE PAR OBSERVABLE — du CODE, jamais
 * le modèle (`06-` §2 ; `07-` §1.2). **Jamais notée.**
 *
 * @param observablesDuSquelette les valeurs que la mesure porte pour cette
 *        compétence, telles que la chaîne les a écrites
 *        (`competences_mesures.observables`). `undefined` = aucun squelette.
 */
export function comparerAuSquelette(
  questions: readonly QuestionServie[],
  reponses: Readonly<Record<string, string>>,
  observablesDuSquelette: Readonly<Record<string, Observables | undefined>>,
): ComparaisonObservable[] {
  return questions.map((q) => {
    const clef = `${q.competence}|${q.observable_code}`
    const reponse = reponses[clef] ?? ''
    const obs = observablesDuSquelette[q.competence]
    const brut = obs?.[q.observable_code]

    // « L'observable que le squelette NE PORTE PAS DU TOUT » : absent, ou
    // `n/a` — qui n'est PAS zéro, c'est « rien à mesurer » (`01-` §8.2).
    const porte = obs !== undefined && brut !== undefined && brut !== NA
    const aRepondu = reponse.trim() !== ''

    return {
      competence: q.competence,
      observable_code: q.observable_code,
      reponse_eleve: reponse,
      valeur_squelette: porte ? (brut as string | number | boolean) : null,
      // Le troisième cas de la garde (la fiche §7) — actif sans correspondance.
      affirme_un_observable_absent: aRepondu && !porte,
      // ⚠️ `null` tant que la correspondance ne déclare pas quelle réponse vaut
      //    « réussi ». Voir l'en-tête : on consigne, on ne devine pas.
      accord: null,
    }
  })
}

/**
 * ⭐ LA GARDE `indetermine` A TROIS CAS (la fiche §7) :
 *   · la confiance n'a pas été déclarée ;
 *   · l'instrument n'a rendu AUCUN niveau ;
 *   · l'élève AFFIRME un observable que le squelette NE PORTE PAS.
 *
 * « Un côté manquant NE PRODUIT JAMAIS DE VERDICT, et surtout jamais un
 *  "surconfiant" injuste fabriqué par un faux négatif d'extraction. »
 *
 * ⚠️ `n/a` EST AUTRE CHOSE : la table de conversion n'est pas écrite, `n/a` est
 *    une VALEUR DÉCLARÉE que les colonnes acceptent — `indetermine` n'attend
 *    rien, `n/a` attend la table (la fiche §7 et §9).
 *
 * ⚠️ Ce module rend le seul verdict que l'écran a le droit de poser :
 *    `indetermine`, ou « rien à dire ici ». Le passage à `bien_calibre` /
 *    `surconfiant` / `sous_confiant` appartient à `calibrationDe`
 *    (`utils/chaine/monitoring-calcul.ts`), et **le Monitoring tourne en
 *    dernier** (la fiche §2) : ce n'est jamais l'écran qui le pose.
 */
/**
 * ⭐ LE VERDICT S'AFFICHE AU TEMPS 4, DANS LE RETOUR — « l'IA a vu la même chose
 * que toi sur X ; elle a relevé Y que tu n'avais pas vu — es-tu d'accord ? »
 * (`06-` §2).
 *
 * ⚠️ Il **SE FORMULE « NOUS N'AVONS PAS VU LA MÊME CHOSE », JAMAIS COMME UN
 *    VERDICT** (`06-` §2), et il **NOMME LA DIMENSION en langage pédagogique,
 *    JAMAIS L'OBSERVABLE NI LA GRILLE** (la fiche §4 ; RR4, `01-` §12).
 *    → Ce module ne rend donc **que des dimensions**. Le `observable_code` sert
 *      de clé de jointure et **ne ressort jamais**.
 *
 * ⚠️ CE QU'IL PEUT DIRE AUJOURD'HUI, ET RIEN DE PLUS. Faute du cinquième champ
 *    de la correspondance — *quelle réponse vaut « réussi »* (voir l'en-tête) —,
 *    `accord` vaut `null` partout, et **aucun désaccord d'appréciation n'est
 *    calculable**. Reste le cas que le squelette décide seul, sans aucune
 *    correspondance : **l'élève a répondu sur une dimension que le squelette ne
 *    porte pas**. C'est peu, et c'est honnête ; le jour où le champ arrive, la
 *    même fonction en dira plus sans changer de forme.
 */
export interface LigneDeVerdict {
  dimension_eleve: string
  /** `true` = vu pareil · `false` = vu autrement · `null` = pas comparable. */
  memeChose: boolean | null
}

export function verdictDeCalibration(
  comparaisons: readonly ComparaisonObservable[],
  formulations: Readonly<Record<string, string>>,
): { lignes: LigneDeVerdict[]; phrase: string | null } {
  const lignes: LigneDeVerdict[] = []
  for (const c of comparaisons) {
    const dimension = formulations[`${c.competence}|${c.observable_code}`]
    // ⚠️ Pas de formulation → **on n'affiche rien**. Sortir le code serait
    //    exposer la grille, ce que RR4 interdit ; et une formulation ne se
    //    fabrique pas (`07-` §1.1).
    if (!dimension) continue
    lignes.push({
      dimension_eleve: dimension,
      memeChose: c.affirme_un_observable_absent ? false : c.accord,
    })
  }
  const autrement = lignes.filter((l) => l.memeChose === false)
  return {
    lignes,
    phrase: autrement.length === 0 ? null
      : 'Sur ' + autrement.map((l) => l.dimension_eleve).join(', ')
        + ', nous n’avons pas vu la même chose. Es-tu d’accord ?',
  }
}

export function gardeIndetermine(
  comparaisons: readonly ComparaisonObservable[],
  confianceDeclaree: boolean,
  instrumentARenduUnNiveau: boolean,
): { indetermine: boolean; motif: string | null } {
  if (!confianceDeclaree) {
    return { indetermine: true, motif: 'l\'élève n\'a pas déclaré sa confiance' }
  }
  if (!instrumentARenduUnNiveau) {
    return { indetermine: true, motif: 'l\'instrument de la compétence n\'a rendu aucun niveau' }
  }
  const affirme = comparaisons.find((c) => c.affirme_un_observable_absent)
  if (affirme) {
    return { indetermine: true,
      motif: `l'élève affirme un observable que le squelette ne porte pas `
        + `(${affirme.competence} · ${affirme.observable_code})` }
  }
  return { indetermine: false, motif: null }
}
