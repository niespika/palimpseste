// ============================================================================
// C7 · L7 — L'OBJET : QUAND IL SE SERT. L'ÉTAT D'UN OBJET PAR ÉLÈVE. Module PUR.
// ----------------------------------------------------------------------------
// « Un objet a une vie par élève, en quatre états » (`01-` v5.11 §4, couche 3,
//   amendement du 06/09) — EN MÉTHODE, OUVERT, TENU —, et cet état est DÉRIVÉ,
//   jamais stocké, comme le registre lui-même (`01-` §3, amendement du 03/09).
//
//   · EN MÉTHODE — jamais servi SOUS LE GABARIT (Louis, 04/09 : `dejaServis` de
//     `porte-serveur.ts` ne compte que les dépôts dont un cas porte `probleme`).
//     Un élève qui a fait dix `phrase` sous la banque 1.4 entre en méthode.
//   · OUVERT — déjà servi, et la bande du palier y montre un cran NON TENU.
//     « Il PEUT être servi, il ne l'est pas d'office : un exercice par cycle,
//     sur le cran non tenu le plus bas, sur un autre devoir » (règle 2).
//   · TENU — tous les crans de la bande sont tenus par « deux et deux » (règle 5) :
//     « l'objet sort du centre et ne coûte plus rien ; il ne revient qu'en sonde
//     au-dessus (M-b), ou quand la lettre monte et rouvre une bande ». ⛔ Aucun
//     drapeau « fermé » : un objet ne se ferme jamais.
//
// ⚠️ LA BANDE N'EST PAS `cransDuPalier` TOUT ENTIER — arbitrage de fabrication
//    (prompt, piège 3) : « tenu » se compte sur `sous_la_bande ∪ centre` ; la
//    zone `au_dessus` reste celle des sondes, sinon un objet ne serait jamais
//    tenu chez E-D (le 6·7·8 y sont au-dessus, et le registre ne dérive ni le 6
//    ni le 8).
// ⚠️ ET UN CRAN QUE LA BANQUE NE PORTE PAS POUR CET OBJET SORT DE LA BANDE
//    (piège 4) : sans quoi « le cran non tenu le plus bas » serait toujours le 2,
//    que personne ne peut servir en production. La bande se compte sur les crans
//    que le vivier porte pour l'objet, et l'absence se journalise.
// ⚠️ LE PALIER QUI INDEXE LA BANDE EST CELUI DE LA COMPÉTENCE CIBLE (piège 5) :
//    le même objet peut être tenu pour l'Argumentation à B et ouvert pour la
//    Structure à D. L'état se dérive par (élève × objet × palier de la cible).
//
// Ce module ne lit rien : le registre, le palier et les crans lui sont donnés.
// ============================================================================
import { BANDES_CRANS } from '../routeur/config'
import { CRANS, type Lettre, type Palier } from '../routeur/types'
import { cranTenu, reussitesCompteesAuCran, REUSSITES_POUR_DEBLOQUER, type LigneRegistre } from './reussites'

export type EtatDeLObjet = 'methode' | 'ouvert' | 'tenu'

/** Le numéro d'un cran depuis son code de doctrine — `CRANS` est écrit dans l'ordre des neuf. */
export function numeroDuCran(code: string): number | null {
  const i = (CRANS as readonly string[]).indexOf(code)
  return i < 0 ? null : i + 1
}

/**
 * La bande d'un palier, EN NUMÉROS : `sous_la_bande ∪ centre`, jamais `au_dessus`
 * (arbitrage du piège 3). Sans lettre, la bande d'E-D — la même lecture que
 * `sequenceDeMethode` « sans palier connu ».
 */
export function bandeDuPalier(palier: Lettre): number[] {
  const p: Palier = palier ?? 'E'
  const b = BANDES_CRANS[p]
  return [...b.sous_la_bande.crans, ...b.centre.crans]
    .map(numeroDuCran).filter((n): n is number => n !== null).sort((a, b) => a - b)
}

/** La zone haute d'un palier, en numéros — celle des sondes de montée (M-b). */
export function auDessusDuPalier(palier: Lettre): number[] {
  const p: Palier = palier ?? 'E'
  return BANDES_CRANS[p].au_dessus.crans
    .map(numeroDuCran).filter((n): n is number => n !== null).sort((a, b) => a - b)
}

export interface VieDeLObjet {
  objet: string
  etat: EtatDeLObjet
  palier: Lettre
  /** La bande du palier, réduite aux crans que la banque porte pour l'objet. */
  bande: number[]
  /** Les crans de la bande que le palier porte et que la banque n'a PAS (piège 4). */
  cransAbsents: number[]
  tenus: number[]
  nonTenus: number[]
  /** Le cran non tenu le plus bas de la bande — `null` quand l'objet est tenu, ou la bande vide. */
  cranAServir: number | null
  /** En clair, pour le journal. */
  motif: string
}

/**
 * L'état d'UN objet pour UN élève, au palier de la compétence cible.
 * @param registre  les lignes de l'élève (tous objets — on filtre ici).
 * @param objet     `exercices_types.code`.
 * @param dejaServi l'objet a-t-il DÉJÀ été servi à l'élève SOUS LE GABARIT ?
 * @param palier    la lettre de la compétence CIBLE (jamais « le palier de l'élève »).
 * @param cransDisponibles les crans que la banque porte pour cet objet.
 */
export function etatDeLObjet(
  registre: readonly LigneRegistre[], objet: string, dejaServi: boolean, palier: Lettre,
  cransDisponibles: readonly number[],
): VieDeLObjet {
  const pleine = bandeDuPalier(palier)
  const bande = pleine.filter((c) => cransDisponibles.includes(c))
  const cransAbsents = pleine.filter((c) => !cransDisponibles.includes(c))
  const absents = cransAbsents.length ? ` (bande réduite : crans ${cransAbsents.join('·')} absents de la banque)` : ''
  if (!dejaServi) {
    return { objet, etat: 'methode', palier, bande, cransAbsents, tenus: [], nonTenus: bande,
      cranAServir: null,
      motif: `« ${objet} » jamais servi sous le gabarit : semaine de méthode${absents}.` }
  }
  const tenus = bande.filter((c) => cranTenu(registre, objet, c))
  const nonTenus = bande.filter((c) => !tenus.includes(c))
  if (bande.length > 0 && nonTenus.length === 0) {
    return { objet, etat: 'tenu', palier, bande, cransAbsents, tenus, nonTenus, cranAServir: null,
      motif: `« ${objet} » tenu au palier ${palier ?? 'E'} : les crans ${bande.join('·')} sont tenus par `
        + `« deux et deux » — il sort du centre et ne revient qu'en sonde${absents}.` }
  }
  const cranAServir = nonTenus[0] ?? null
  const compte = cranAServir === null ? '' : ` ; le ${cranAServir} compte ${reussitesCompteesAuCran(registre, objet, cranAServir)} `
    + `réussite(s) sur ${REUSSITES_POUR_DEBLOQUER} attendues`
  return { objet, etat: 'ouvert', palier, bande, cransAbsents, tenus, nonTenus, cranAServir,
    motif: bande.length === 0
      ? `« ${objet} » ouvert au palier ${palier ?? 'E'}, mais la bande est vide${absents}.`
      : `« ${objet} » ouvert au palier ${palier ?? 'E'} : cran non tenu le plus bas ${cranAServir}`
        + `${tenus.length ? ` (tenus : ${tenus.join('·')})` : ''}${compte}${absents}.` }
}
