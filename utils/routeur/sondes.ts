// ============================================================================
// C4 · L2 — LA RÈGLE D'ESPACEMENT DES MESURES SECONDAIRES (§8.9).
// ----------------------------------------------------------------------------
// « ELLE DIT QUI SONDER, ET DANS QUEL ORDRE. LA PHASE C (§5) DIT SUR QUEL
//   EXERCICE. » Les deux ne se mélangent pas, et ce fichier ne fait que la première.
//
// 1. ÉLIGIBILITÉ — est sondable une compétence de statut `evaluee` **OU**
//    `mesuree_silencieusement`. « MAIS MESURER N'EST PAS FAIRE MONTER : une sonde
//    réussie ne compte pour la montée que si la compétence sondée est `evaluee` »
//    (§9 ; `montee.ts` porte cette borne-là).
//
// 2. L'ORDRE DE PRIORITÉ :
//      1. une compétence en RÉGIME D'ENTRETIEN N3 ;
//      2. une compétence AU PALIER CIBLE ATTEINT — B, LU SUR LA LETTRE AFFICHÉE —,
//         non vérifiée depuis plus de 5 SEMAINES ;
//      3. sinon, LA PLUS ANCIENNEMENT MESURÉE : maximum de `delai_mesures`,
//         départage par `delai_jours` ;
//      4. à égalité persistante : TIRAGE ALÉATOIRE JOURNALISÉ (§11).
//
// 3. DEUX GARDE-FOUS — une compétence n'est sondée QU'UNE FOIS PAR CYCLE ; et le
//    PLAFOND DE SONDES PAR CYCLE VAUT 4 : « c'est lui qui borne la facture ».
//
// ⚠️ « UNE COMPÉTENCE SONDÉE SUR UN EXERCICE N'EST JAMAIS UNE CIBLE DE CET
//    EXERCICE » (§1, principe 4) — contrainte dure, tenue par la phase C.
//
// Ce fichier est PUR.
// ============================================================================

import { PALIER_CIBLE, rangPalier, type Competence, type Lettre, type MotifSonde }
  from './types'
import { PLAFOND_SONDES_PAR_CYCLE, SEMAINES_SANS_VERIFICATION } from './config'

/** Ce que la règle lit d'une compétence pour la classer. */
export interface CandidateSonde {
  competence: Competence
  statutRecette: string
  /** `01-` §8.9, priorité 2 — LA LETTRE AFFICHÉE, pas le signal. */
  lettreAffichee: Lettre
  /** `01-` §8.4 — la compétence est-elle en régime d'entretien N3 ? */
  enEntretienN3: boolean
  /** `01-` §11 — les deux entrées du §8.9, écrites par la chaîne. */
  delaiMesures: number | null
  delaiJours: number | null
  /** Depuis combien de semaines son palier cible n'a-t-il pas été vérifié ? */
  semainesDepuisVerification: number | null
}

export interface SondeClassee {
  competence: Competence
  priorite: 1 | 2 | 3
  motif: MotifSonde
  /** Vrai quand ce rang s'est départagé au hasard — et le tirage se journalise. */
  tirage: boolean
}

/** `01-` §8.9, point 1 — l'éligibilité, et rien d'autre. */
export function estSondable(statutRecette: string): boolean {
  return statutRecette === 'evaluee' || statutRecette === 'mesuree_silencieusement'
}

/** La priorité d'une candidate, telle que le §8.9 la pose. */
export function prioriteDe(c: CandidateSonde): 1 | 2 | 3 {
  if (c.enEntretienN3) return 1
  const auPalierCible = c.lettreAffichee !== null
    && rangPalier(c.lettreAffichee) >= rangPalier(PALIER_CIBLE)
  if (auPalierCible && (c.semainesDepuisVerification ?? 0) > SEMAINES_SANS_VERIFICATION) return 2
  return 3
}

/**
 * `01-` §8.9 — QUI sonder, et dans quel ordre. La phase C dira SUR QUOI.
 *
 * `tirer` départage les ex æquo — il est injecté pour que le tirage soit
 * REPRODUCTIBLE et JOURNALISABLE (§11, point 5) : le module ne tire pas seul.
 */
export function ordonnerLesSondes(
  candidates: readonly CandidateSonde[],
  tirer: (exAequo: readonly Competence[]) => Competence,
  plafond: number = PLAFOND_SONDES_PAR_CYCLE,
): SondeClassee[] {
  const eligibles = candidates.filter((c) => estSondable(c.statutRecette))
  const restantes = new Map(eligibles.map((c) => [c.competence, c]))
  const out: SondeClassee[] = []

  while (out.length < plafond && restantes.size > 0) {
    const lot = [...restantes.values()]
    const priorites = lot.map(prioriteDe)
    const meilleure = Math.min(...priorites) as 1 | 2 | 3
    let bloc = lot.filter((c) => prioriteDe(c) === meilleure)

    // Priorité 3 — « la plus anciennement mesurée : MAXIMUM de `delai_mesures`,
    // DÉPARTAGE PAR `delai_jours` ». Une compétence jamais mesurée passe devant.
    if (meilleure === 3) {
      const dm = (c: CandidateSonde) => c.delaiMesures ?? Number.POSITIVE_INFINITY
      const maxDm = Math.max(...bloc.map(dm))
      bloc = bloc.filter((c) => dm(c) === maxDm)
      if (bloc.length > 1) {
        const dj = (c: CandidateSonde) => c.delaiJours ?? Number.POSITIVE_INFINITY
        const maxDj = Math.max(...bloc.map(dj))
        bloc = bloc.filter((c) => dj(c) === maxDj)
      }
    }

    const tirage = bloc.length > 1
    const elue = tirage ? tirer(bloc.map((c) => c.competence)) : bloc[0].competence
    const motif: MotifSonde = meilleure === 1 ? 'entretien_n3'
      : meilleure === 2 ? 'palier_cible_a_verifier'
        : tirage ? 'tirage' : 'plus_anciennement_mesuree'

    out.push({ competence: elue, priorite: meilleure, motif, tirage })
    // « Une compétence n'est sondée QU'UNE FOIS PAR CYCLE. »
    restantes.delete(elue)
  }

  return out
}

/**
 * `01-` §7 — le départage de la sonde, à égalité sur « la plus anciennement
 * mesurée » : « prendre LE MODE LE PLUS EN RETARD ». C'est le troisième endroit
 * où la proportion mord.
 *
 * Rendue à part de `ordonnerLesSondes` parce qu'elle demande le profil des modes,
 * que le §8.9 ne connaît pas.
 */
export function departagerParLeModeEnRetard(
  exAequo: readonly Competence[],
  retardDuMode: (c: Competence) => number,
): Competence[] {
  if (exAequo.length <= 1) return [...exAequo]
  const max = Math.max(...exAequo.map(retardDuMode))
  return exAequo.filter((c) => retardDuMode(c) === max)
}
