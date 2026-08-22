// ============================================================================
// C4 · L2 — CE QUI SE MESURE (§8.2) et LES DEUX PRÉCONDITIONS (§8.3).
// ----------------------------------------------------------------------------
// « La stagnation ne se mesure pas sur la lettre, mais SUR LES OBSERVABLES DU
//   SQUELETTE » (`01-` §8.2).
//
// DEUX ÉTAGES, ET DEUX SEUILS QUI NE SE CONFONDENT JAMAIS :
//   · le SEUIL DE RÉUSSITE porte sur UNE MESURE, il est propre à chaque
//     observable, et il SE LIT À LA FICHE. Il est déjà implémenté par C4-L5
//     (`utils/chaine/observables.ts` : `statutDeLaMesure`, `tauxDeReussite`) —
//     « ne réécris pas la chaîne, ne la double pas » (piège 2). Ce module l'APPELLE.
//   · le SEUIL D'ACQUISITION porte sur UNE FENÊTRE, il est LE MÊME PARTOUT, et
//     il se lit ICI : ~2/3.
//
// ⚠️ « `n/a` N'EST JAMAIS 0 » : une mesure sans objet sort du DÉNOMINATEUR, elle
//    n'y entre pas comme un échec. La chaîne le tient déjà.
// ⚠️ « UN OBSERVABLE SANS TAUX NE SE CLASSE PAS » : quand la fenêtre ne porte
//    aucune mesure ayant un objet, il ne peut pas être élu sous-défaut dominant.
//    « Il reste non acquis au sens de l'état initial : c'est la PRÉCONDITION
//    BASSE qui l'écarte de l'escalade, pas son statut. »
// ⚠️ « TOUT OBSERVABLE EST RÉPUTÉ NON ACQUIS au départ » — « aucun changement de
//    statut » a donc un sens dès la première fenêtre.
//
// Ce fichier est PUR : il reçoit les entrées d'instrument, il ne va pas les lire.
// ============================================================================

import { statutDeLaMesure, tauxDeReussite, type Observables, type Statut }
  from '../chaine/observables'
import type { EntreeObservableMesure } from '../chaine/instruments'
import { FENETRES_SANS_REUSSITE, SEUIL_ACQUISITION } from './config'
import type { Mesure } from './mesure'

/** Ce que la fiche déclare, tel que `derive-instruments.py` le verse. */
export interface InstrumentLu {
  observablesMesure: Record<string, EntreeObservableMesure>
  parametres: Record<string, number | string>
}

/** L'état d'un observable sur une fenêtre. */
export interface EtatObservable {
  code: string
  /** `null` quand la fenêtre ne porte aucune mesure ayant un objet. */
  taux: number | null
  reussies: number
  /** Le nombre de mesures AYANT UN OBJET — jamais le nombre de mesures. */
  denominateur: number
  /** « Tout observable est réputé NON ACQUIS au départ. » */
  acquis: boolean
  /** Vrai quand l'observable ne peut pas être élu sous-défaut dominant. */
  sansTaux: boolean
  /** Vrai quand la fiche le déclare requis (`01-` §8.3, lu par `fiche-observables.ts`). */
  requis: boolean
}

const valeursSur = (fenetre: readonly Mesure[], code: string) =>
  fenetre.map((m) => (m.observables as Observables | null)?.[code])

/**
 * `01-` §8.2 — « ACQUIS : un observable dont le TAUX DE RÉUSSITE dépasse le seuil
 * d'acquisition, soit ~2/3, sur la FENÊTRE D'ÉVIDENCE ».
 *
 * « Dépasse » : strictement. Un taux exactement à 2/3 n'est pas acquis.
 */
export function estAcquis(taux: number | null): boolean {
  return taux !== null && taux > SEUIL_ACQUISITION
}

/**
 * L'état de tous les observables d'une compétence sur une fenêtre.
 *
 * ⚠️ La fenêtre reçue doit DÉJÀ être celle du §3 — les quatre dernières mesures,
 *    sondes de montée exclues (M-e). Ce module ne la fabrique pas.
 */
export function etatDesObservables(
  fenetre: readonly Mesure[], instrument: InstrumentLu, requis: readonly string[],
): EtatObservable[] {
  const codes = Object.keys(instrument.observablesMesure)
  return codes.map((code) => {
    const entree = instrument.observablesMesure[code]
    const { reussies, denominateur, taux } =
      tauxDeReussite(valeursSur(fenetre, code), entree, instrument.parametres)
    return {
      code, taux, reussies, denominateur,
      acquis: estAcquis(taux),
      sansTaux: taux === null,
      requis: requis.includes(code),
    }
  })
}

/**
 * `01-` §8.4, N1 — « identifier le SOUS-DÉFAUT DOMINANT : l'observable non acquis
 * AU TAUX LE PLUS BAS ».
 *
 * « Un observable sans taux ne se classe pas » (§8.2) : il est écarté de
 * l'élection, qui se départage au taux. À égalité, on rend TOUS les ex æquo —
 * le tirage se fait chez l'appelant, ET IL SE JOURNALISE (§11, point 5).
 */
export function candidatsSousDefautDominant(etats: readonly EtatObservable[]): EtatObservable[] {
  const classables = etats.filter((e) => !e.acquis && !e.sansTaux)
  if (classables.length === 0) return []
  const plusBas = Math.min(...classables.map((e) => e.taux as number))
  return classables.filter((e) => e.taux === plusBas)
}

/**
 * `01-` §8.2 — « PROGRESSION : au moins un observable passe à ACQUIS ».
 * Se lit d'une fenêtre à la suivante, jamais dans l'absolu.
 */
export function ilYAProgression(
  avant: readonly EtatObservable[], apres: readonly EtatObservable[],
): boolean {
  const acquisAvant = new Set(avant.filter((e) => e.acquis).map((e) => e.code))
  return apres.some((e) => e.acquis && !acquisAvant.has(e.code))
}

/**
 * `01-` §8.2 — « STAGNATION : aucun changement de statut sur la fenêtre **ET**
 * valeur de ciblage IMMOBILE — la colonne dérivée NON PLAFONNÉE du §3, PAS la
 * lettre affichée ».
 *
 * Les deux conditions, jamais l'une des deux.
 */
export function ilYAStagnation(
  avant: readonly EtatObservable[], apres: readonly EtatObservable[],
  valeurNonPlafonneeImmobile: boolean,
): boolean {
  if (!valeurNonPlafonneeImmobile) return false
  const statutAvant = new Map(avant.map((e) => [e.code, e.acquis]))
  const change = apres.some((e) => (statutAvant.get(e.code) ?? false) !== e.acquis)
  return !change
}

// ════════════════════════════════════════════════════════════════════════════
// §8.3 — LES DEUX PRÉCONDITIONS DE DÉCLENCHEMENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §8.3, PRÉCONDITION BASSE — « N1 ne se déclenche que sur un observable
 * ayant reçu AU MOINS UNE MESURE RÉUSSIE, **ou** dont AUCUNE mesure n'est réussie
 * SUR DEUX FENÊTRES ».
 *
 * *« C'est ce qui sépare l'échec de l'inconnu : l'élève qui découvre une
 *   compétence n'a besoin que d'être enseigné, pas escaladé. »*
 *
 * `historique` est l'ensemble des mesures de la compétence, de la plus ancienne à
 * la plus récente — on n'en lit que les deux dernières fenêtres.
 */
export function preconditionBasse(
  code: string, historique: readonly Mesure[], instrument: InstrumentLu,
  tailleFenetre: number,
): { satisfaite: boolean; motif: string } {
  const entree = instrument.observablesMesure[code]
  if (!entree) return { satisfaite: false, motif: `l'instrument ne déclare pas « ${code} »` }

  const statuts = (lot: readonly Mesure[]): Statut[] =>
    valeursSur(lot, code).map((v) => statutDeLaMesure(v, entree, instrument.parametres))

  if (statuts(historique).includes('reussie')) {
    return { satisfaite: true, motif: 'au moins une mesure réussie : ce n\'est pas de l\'inconnu.' }
  }

  const deuxFenetres = historique.slice(-tailleFenetre * FENETRES_SANS_REUSSITE)
  const avecObjet = statuts(deuxFenetres).filter((s) => s !== 'sans_objet')
  if (avecObjet.length >= tailleFenetre * FENETRES_SANS_REUSSITE) {
    return { satisfaite: true,
      motif: `aucune mesure réussie sur ${FENETRES_SANS_REUSSITE} fenêtres pleines.` }
  }

  return { satisfaite: false,
    motif: 'aucune réussite, et pas encore deux fenêtres pleines : l\'élève découvre, '
      + 'il a besoin d\'être enseigné, pas escaladé.' }
}

/**
 * `01-` §8.3, PRÉCONDITION HAUTE — « l'escalade exige AU MOINS UN OBSERVABLE
 * REQUIS NON ACQUIS ». « La stabilité acquise produit ENTRETIEN OU ABSENCE
 * D'ACTION, JAMAIS N1. »
 *
 * Les requis viennent de la fiche (`fiche-observables.ts`) : le routeur lit.
 */
export function preconditionHaute(etats: readonly EtatObservable[]): boolean {
  return etats.some((e) => e.requis && !e.acquis)
}

/** `01-` §8.3 — la stabilité acquise : tous les requis sont acquis. */
export function stabiliteAcquise(etats: readonly EtatObservable[]): boolean {
  const requis = etats.filter((e) => e.requis)
  return requis.length > 0 && requis.every((e) => e.acquis)
}
