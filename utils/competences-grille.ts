// ============================================================================
// LA GRILLE DES COMPÉTENCES — LES FORMES QUE L'ÉCRAN LIT, et la recomposition.
// ----------------------------------------------------------------------------
// ⚠️ MODULE PUR, SANS `server-only` : `GrilleCompetences.tsx` est un composant
//    client et importe `observablesDeLaCellule` d'ici. Le chargeur serveur
//    (`competences-classe.ts`) importe et ré-exporte ces types. Aucune lecture,
//    aucun import serveur ne doit entrer ici — le bundle client le suivrait.
//    `SERIE_MAX` (la borne des séries) reste au chargeur, qui seul l'applique.
// ============================================================================

import type { Competence, StatutRecette } from '@/utils/chaine/types'
import type { Statut, ValeurObservable } from '@/utils/chaine/observables'
import type { LettreSection } from '@/utils/notation'

/** Un point de la série d'un observable — une mesure, à sa date. */
export interface PointObservable {
  /** `mesure_at`, en ISO — un INSTANT : il se formate dans le fuseau de l'école. */
  date: string
  valeur: ValeurObservable | null
  statut: Statut
  /** `true` quand la mesure vient d'un AUTRE cours que celui qu'on regarde. */
  ailleurs: boolean
}

/**
 * ⭐ 18/09 — CE QUI NE DÉPEND PAS DE L'ÉLÈVE, porté UNE FOIS par colonne.
 *    Mesuré en prod (1HLP, 25 élèves) : la grille pesait 847 Ko de charge RSC,
 *    dont 338 Ko pour ces sept champs répétés dans chacun des 1 400 observables.
 *    L'écran reçoit maintenant 56 descripteurs et des cellules qui ne portent
 *    que leurs nombres ; `observablesDeLaCellule` recompose l'`ObservableEleve`
 *    d'avant, au champ près, côté client.
 */
export interface DescripteurObservable {
  code: string
  /** `competences_correspondance.dimension_eleve` — le nom DIT À L'ÉLÈVE. */
  nom: string
  /** `false` quand la fiche ne pose aucune question à l'élève sur cet observable. */
  ditALEleve: boolean
  telemetriePure: boolean
  /** Ce que la fiche appelle « réussi » — son `sens`, pour que le seuil se montre. */
  sens: string | null
  famille: string
  ordre: number
}

/** Un point de la série d'UN observable — sa valeur et son statut ; la date et
 *  la provenance sont celles de la mesure, portées par la cellule (`PointCellule`). */
export interface PointMesureObservable {
  valeur: ValeurObservable | null
  statut: Statut
}

/** Ce qu'UN élève porte sur UN observable — les nombres, et rien de la fiche. */
export interface MesureObservable {
  derniere: ValeurObservable | null
  statutDernier: Statut
  acquis: boolean | null
  tauxFenetre: number | null
  reussiesFenetre: number
  denominateurFenetre: number
  reussies: number
  denominateur: number
  taux: number | null
  serie: PointMesureObservable[]
}

/** Une mesure de la cellule, à sa date — commune à tous les observables de la cellule. */
export interface PointCellule {
  /** `mesure_at`, en ISO — un INSTANT : il se formate dans le fuseau de l'école. */
  date: string
  /** `true` quand la mesure vient d'un AUTRE cours que celui qu'on regarde. */
  ailleurs: boolean
}

export interface ObservableEleve {
  code: string
  /** `competences_correspondance.dimension_eleve` — le nom DIT À L'ÉLÈVE. */
  nom: string
  /** `false` quand la fiche ne pose aucune question à l'élève sur cet observable. */
  ditALEleve: boolean
  /**
   * ⚠️ LA TÉLÉMÉTRIE PURE SE DÉCLARE À LA FICHE (`reussie: 'sans_objet'`), elle
   *    NE SE DÉDUIT PAS de l'absence d'une ligne de correspondance. Les deux ne
   *    coïncident pas : `contresens_partiel` de la Synthèse est absent de la
   *    correspondance et pourtant `reussie: 'au_plus'` — il JUGE l'élève.
   *    L'étiqueter « télémétrie » aurait fait écarter un signal qui compte.
   *    *Trouvé à la revue du 26/08.*
   */
  telemetriePure: boolean
  /** Ce que la fiche appelle « réussi » — son `sens`, pour que le seuil se montre. */
  sens: string | null
  famille: string
  ordre: number
  derniere: ValeurObservable | null
  statutDernier: Statut
  /**
   * L'ACQUISITION AU SENS DU ROUTEUR : taux sur la fenêtre d'évidence > 2/3.
   * `null` quand la fenêtre ne porte aucune mesure ayant un objet — « un
   * observable sans taux ne se classe pas ».
   */
  acquis: boolean | null
  tauxFenetre: number | null
  reussiesFenetre: number
  denominateurFenetre: number
  /** L'historique complet des mesures qui comptent — pour l'évolution, pas pour le verdict. */
  reussies: number
  denominateur: number
  taux: number | null
  serie: PointObservable[]
  /** `true` quand la série affichée a été bornée à `SERIE_MAX`. */
  serieTronquee: boolean
}

export interface CelluleCompetence {
  /**
   * LA LETTRE POSÉE — `competences_niveaux.lettre` (`07-` §1.3). C'est elle que
   * le routeur lit et que l'élève voit.
   *
   * ⚠️ ELLE N'EST PAS `lettre_equivalente`, et les confondre serait inventer un
   *    fait. Une mesure porte ce qu'ELLE valait ; la lettre posée est ce que la
   *    compétence VAUT. Les deux se séparent réellement : au 26/08, le bac à
   *    sable porte 102 niveaux à `lettre` NULLE sous des mesures qui, elles,
   *    portent leur lettre-équivalente.
   */
  lettre: LettreSection | null
  /** La PREMIÈRE lettre posée (`lettre_initiale`) — l'évolution de la lettre elle-même. */
  lettreInitiale: LettreSection | null
  /** Ce que valait la DERNIÈRE mesure qui compte. Un contexte, jamais la lettre. */
  lettreEquivalenteDerniere: LettreSection | null
  provisoire: boolean
  /** Les mesures QUI COMPTENT — sondes de montée et pré-recette déjà retirées. */
  nbMesures: number
  /** Combien ont été écartées, et pourquoi il ne faut pas les chercher à l'écran. */
  nbEcartees: number
  /** Combien de ces mesures viennent d'un autre cours — 0 le plus souvent. */
  nbAilleurs: number
  derniereMesure: string | null
  /**
   * Les mesures de l'élève, PAR CODE d'observable — et SEULEMENT quand la
   * cellule porte au moins une mesure qui compte. Une cellule sans mesure
   * n'envoie rien : tous ses observables valent le même « rien » (`SANS_MESURE`),
   * que `observablesDeLaCellule` recompose. Les descripteurs sont sur la colonne.
   */
  mesures: Record<string, MesureObservable>
  /** Les mesures de la cellule, à leur date — les `SERIE_MAX` dernières. */
  serie: PointCellule[]
  /** `true` quand la série affichée a été bornée à `SERIE_MAX`. */
  serieTronquee: boolean
}

export interface ColonneCompetence {
  code: Competence
  nom: string
  /** Fiche dérivée ET chaîne branchée — sinon la colonne ne peut rien porter. */
  ouverte: boolean
  motif: string | null
  statutRecette: StatutRecette
  /** La borne basse des mesures qui comptent. `null` ⇒ aucune borne. */
  statutPoseLe: string | null
  /** L'opt-out de CETTE classe : `false` = ce cours ne travaille pas la compétence. */
  active: boolean
  /**
   * Les mesures QUI COMPTENT pour LES ÉLÈVES de cette classe, TOUS COURS
   * CONFONDUS — c'est ce qui est compté, et l'écran le dit ainsi. (Compter par
   * `classe_id` mentirait dans l'autre sens : `classe_id` est NULL sur les
   * mesures maison, qui sont la majorité.)
   */
  nbMesures: number
  /** Les observables que la fiche déclare, dans l'ordre dit à l'élève — une fois pour tous. */
  observables: DescripteurObservable[]
}

/** Ce qu'un observable vaut pour une cellule SANS mesure — le même pour tous. */
const SANS_MESURE: MesureObservable = {
  derniere: null, statutDernier: 'sans_objet', acquis: null, tauxFenetre: null,
  reussiesFenetre: 0, denominateurFenetre: 0, reussies: 0, denominateur: 0, taux: null, serie: [],
}

/**
 * Les observables d'une cellule, tels que l'écran les lisait avant le 18/09 —
 * la fiche (colonne) et les nombres (cellule) recomposés, dans l'ordre de la
 * colonne. Pur : tourne côté client, et sert aussi de preuve d'équivalence.
 */
export function observablesDeLaCellule(
  colonne: Pick<ColonneCompetence, 'observables'>,
  cellule: Pick<CelluleCompetence, 'mesures' | 'serie' | 'serieTronquee'>,
): ObservableEleve[] {
  return colonne.observables.map((d) => {
    const m = cellule.mesures[d.code] ?? SANS_MESURE
    const serie: PointObservable[] = m.serie.map((p, i) => ({
      date: cellule.serie[i]?.date ?? '',
      valeur: p.valeur,
      statut: p.statut,
      ailleurs: cellule.serie[i]?.ailleurs ?? false,
    }))
    return {
      code: d.code, nom: d.nom, ditALEleve: d.ditALEleve, telemetriePure: d.telemetriePure,
      sens: d.sens, famille: d.famille, ordre: d.ordre,
      derniere: m.derniere, statutDernier: m.statutDernier, acquis: m.acquis,
      tauxFenetre: m.tauxFenetre, reussiesFenetre: m.reussiesFenetre,
      denominateurFenetre: m.denominateurFenetre, reussies: m.reussies,
      denominateur: m.denominateur, taux: m.taux, serie,
      serieTronquee: m.serie.length > 0 && cellule.serieTronquee,
    }
  })
}

