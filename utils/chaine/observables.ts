// ============================================================================
// C4 · L5 — LES OBSERVABLES DE TÉLÉMÉTRIE : leur VALEUR, et rien que leur valeur.
// ----------------------------------------------------------------------------
// « C'est ici que les observables de télémétrie se calculent, et NULLE PART
//   AILLEURS. […] la chaîne froide les dérive du relevé jugé et écrit leur
//   VALEUR dans `competences_mesures`. LE VERDICT — réussie ou ratée — NE SE
//   STOCKE PAS : il se lit en confrontant cette valeur au SEUIL DE RÉUSSITE
//   déclaré à la fiche. »                         — la mission ; `01-` §8.2
//
// « Aucune colonne de verdict — n'en crée pas une : stocker le verdict figerait
//   un seuil que tout le monde sait provisoire. »       — PROMPT, piège 25
//
// D'où le partage de ce module, en deux moitiés qui ne se touchent jamais :
//   · CALCULER la valeur, depuis le relevé jugé      → ce qui s'écrit ;
//   · LIRE le verdict, valeur contre seuil de fiche  → ce qui ne s'écrit jamais.
//
// ⚠️ « Un observable de télémétrie sans occasion rend `n/a`, JAMAIS `null`,
//    JAMAIS 0 » (`CONTRAT-MODULES.md` §3). Et « `n/a` n'est jamais 0 » (`01-`
//    §8.2) : une mesure sans objet sort du DÉNOMINATEUR du taux, elle n'y entre
//    pas comme un échec.
//
// ⚠️ Les seuils se lisent DÉRIVÉS de la fiche, jamais recopiés ; « provisoire ne
//    veut pas dire négociable en séance » (piège 28).
// ============================================================================

import type { EntreeObservableMesure } from './instruments'

/** La valeur déclarée qui dit « rien à mesurer ». Ce n'est pas un vide. */
export const NA = 'n/a' as const

export type ValeurObservable = number | string | boolean | typeof NA

/** Ce que `competences_mesures.observables` porte : des VALEURS, par code. */
export type Observables = Record<string, ValeurObservable>

/**
 * Le relevé jugé, réduit à des quantités nommées — ce que Code2 tire des deux
 * artefacts. La façon d'en arriver là est propre à chaque compétence et vit à sa
 * fiche ; ce module ne connaît que le résultat.
 *
 * Une entrée ABSENTE veut dire « pas d'occasion » et rend `n/a` ;
 * une entrée à `null` veut dire la même chose et rend `n/a` — jamais 0.
 */
export type ReleveJuge = Record<string, number | string | boolean | null | undefined>

export interface Alerte { observable: string; motif: string }

// ── Moitié 1 : CALCULER la valeur ───────────────────────────────────────────

/**
 * La valeur d'un observable, dérivée du relevé jugé selon sa `famille`.
 *
 * `comptage rapporté` est la seule famille qui compose : elle divise l'entrée du
 * même nom par le dénominateur que `rapporte_a` désigne. Les autres lisent
 * l'entrée du même nom telle quelle — c'est Code2 qui a fait le calcul, à la
 * règle de la fiche, et ce module ne le refait pas.
 */
export function valeurDe(
  code: string,
  entree: EntreeObservableMesure,
  releve: ReleveJuge,
): { valeur: ValeurObservable; alerte: Alerte | null } {
  const brut = releve[code]

  if (entree.famille === 'comptage rapporté') {
    const denomNom = entree.rapporte_a
    if (!denomNom) {
      return { valeur: NA, alerte: { observable: code, motif: 'comptage rapporté sans `rapporte_a`' } }
    }
    const num = releve[code]
    const den = releve[denomNom]
    if (num == null || den == null) return { valeur: NA, alerte: null }
    if (typeof num !== 'number' || typeof den !== 'number') {
      return { valeur: NA, alerte: { observable: code, motif: 'numérateur ou dénominateur non numérique' } }
    }
    // « Un dénominateur vide → hors du dénominateur du taux » (`01-` §8.2).
    if (den === 0) return { valeur: NA, alerte: null }
    return { valeur: num / den, alerte: null }
  }

  if (brut == null) return { valeur: NA, alerte: null }

  if (entree.famille === 'ordinal') {
    const echelle = entree.echelle ?? []
    if (!echelle.includes(brut as string | number)) {
      // « Une valeur hors d'une liste fermée : alerte déclarée, jamais de valeur
      //   par défaut » (bloc machine du Monitoring ; CONTRAT-MODULES §3).
      return { valeur: NA, alerte: { observable: code, motif: `valeur « ${String(brut)} » hors de son échelle` } }
    }
    return { valeur: brut as string | number, alerte: null }
  }

  if (entree.famille === 'binaire') {
    if (typeof brut !== 'boolean' && typeof brut !== 'string') {
      return { valeur: NA, alerte: { observable: code, motif: 'un binaire attend un verdict, pas un nombre' } }
    }
    return { valeur: brut, alerte: null }
  }

  // proportion · densité · comptage : des nombres, calculés par Code2.
  if (typeof brut !== 'number' || !Number.isFinite(brut)) {
    return { valeur: NA, alerte: { observable: code, motif: `valeur non numérique pour une famille « ${entree.famille} »` } }
  }
  return { valeur: brut, alerte: null }
}

/**
 * Tout le volet `observables_mesure` d'une fiche, appliqué à un relevé jugé.
 * C'est CE QUI S'ÉCRIT dans `competences_mesures.observables` — des valeurs, et
 * une entrée par observable déclaré : aucun trou silencieux.
 */
export function appliquerObservablesMesure(
  volet: Record<string, EntreeObservableMesure>,
  releve: ReleveJuge,
): { observables: Observables; alertes: Alerte[] } {
  const observables: Observables = {}
  const alertes: Alerte[] = []
  for (const [code, entree] of Object.entries(volet)) {
    const { valeur, alerte } = valeurDe(code, entree, releve)
    observables[code] = valeur
    if (alerte) alertes.push(alerte)
  }
  // Une quantité relevée qui ne correspond à aucun observable déclaré n'est pas
  // une erreur : le relevé porte aussi les dénominateurs. Ce qui serait une
  // erreur, c'est un observable déclaré sans entrée — il sort en `n/a` ci-dessus.
  return { observables, alertes }
}

// ── Moitié 2 : LIRE le verdict — jamais écrit, toujours recalculé ────────────

export type Statut = 'reussie' | 'ratee' | 'sans_objet'

function seuilDe(
  entree: EntreeObservableMesure,
  parametres: Record<string, number | string>,
): number | string | undefined {
  if (entree.seuil !== undefined) return entree.seuil
  if (entree.seuil_parametre !== undefined) return parametres[entree.seuil_parametre]
  return undefined
}

function rang(v: number | string, echelle?: Array<string | number>): number | null {
  if (echelle && echelle.length) {
    const i = echelle.indexOf(v)
    return i < 0 ? null : i
  }
  return typeof v === 'number' ? v : null
}

/**
 * Le statut d'UNE mesure sur UN observable — recalculé à chaque lecture, contre
 * le seuil que la fiche déclare aujourd'hui. « C'est ce qui fait qu'un seuil
 * encore provisoire peut se régler sans réécrire l'historique » (la mission).
 */
export function statutDeLaMesure(
  valeur: ValeurObservable | undefined,
  entree: EntreeObservableMesure,
  parametres: Record<string, number | string> = {},
): Statut {
  // « Un observable `sans_objet` ne rend AUCUN verdict sur l'élève — il mesure
  //   l'instrument » (`03-` §1 ; piège 27).
  if (entree.reussie === 'sans_objet') return 'sans_objet'
  if (valeur === undefined || valeur === null || valeur === NA) return 'sans_objet'
  if (entree.sans_objet_si !== undefined && valeur === entree.sans_objet_si) return 'sans_objet'

  // « Un observable BINAIRE n'a pas de seuil — réussi quand le verdict est celui
  //   que la fiche nomme » (`01-` §8.2).
  //
  // ⚠️⚠️ `valeur_reussie` PEUT ÊTRE UNE LISTE, et un seul observable du corpus en
  //    porte une : `question_presente` du Questionnement, dont le §5 écrit
  //    « `forme_question` ∈ {`question_explicite`, `tension_affirmee`} ». Le
  //    `03-` §1 nomme `valeur_reussie` sans dire qu'elle est scalaire, et
  //    `derive-instruments.py` l'accepte telle quelle. ⛔ Une égalité stricte
  //    contre un tableau est FAUSSE POUR TOUTE VALEUR : l'observable serait
  //    `ratee` à chaque mesure — pire qu'un `n/a`, qui au moins sort du
  //    dénominateur —, et c'est un observable REQUIS de l'escalade (§5).
  //    *Trouvé en portant le Questionnement (C4-L10, 23/08) ; écrit une fois
  //    pour les six.*
  if (entree.reussie === 'vaut') {
    const attendue = entree.valeur_reussie
    if (Array.isArray(attendue)) {
      return attendue.some((v) => v === valeur) ? 'reussie' : 'ratee'
    }
    return valeur === attendue ? 'reussie' : 'ratee'
  }

  const seuil = seuilDe(entree, parametres)
  if (seuil === undefined) return 'sans_objet'
  const rv = rang(valeur as number | string, entree.echelle)
  const rs = rang(seuil, entree.echelle)
  if (rv === null || rs === null) return 'sans_objet'

  switch (entree.reussie) {
    case 'au_moins': return rv >= rs ? 'reussie' : 'ratee'
    case 'au_plus': return rv <= rs ? 'reussie' : 'ratee'
    case 'plus_de': return rv > rs ? 'reussie' : 'ratee'
    case 'moins_de': return rv < rs ? 'reussie' : 'ratee'
    default: return 'sans_objet'
  }
}

/**
 * Le taux de réussite d'un observable sur une fenêtre — « la part de ses mesures
 * réussies PARMI CELLES QUI ONT UN OBJET » (`01-` §8.2).
 *
 * « Un observable sans taux ne se classe pas » : quand la fenêtre ne porte
 * aucune mesure ayant un objet, le taux est NULL — jamais zéro.
 */
export function tauxDeReussite(
  valeurs: ReadonlyArray<ValeurObservable | undefined>,
  entree: EntreeObservableMesure,
  parametres: Record<string, number | string> = {},
): { reussies: number; denominateur: number; taux: number | null } {
  let reussies = 0
  let denominateur = 0
  for (const v of valeurs) {
    const s = statutDeLaMesure(v, entree, parametres)
    if (s === 'sans_objet') continue
    denominateur += 1
    if (s === 'reussie') reussies += 1
  }
  return { reussies, denominateur, taux: denominateur === 0 ? null : reussies / denominateur }
}
