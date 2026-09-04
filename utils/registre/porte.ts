// ============================================================================
// C7 · L5 — LA PORTE DES CRANS, PAR OBJET. Module PUR.
// ----------------------------------------------------------------------------
// « Un cran ne se sert sur un objet que si le cran d'en dessous, sur le même
//   geste et le même objet, a été réussi deux fois. La distribution par palier
//   du `01-` §4 reste : elle choisit PARMI les crans débloqués, elle ne débloque
//   rien. » (`10-` §7, décisions 8 et 19 ; `01-` v5.8 §3)
// « Un élève qui rate deux fois de suite le même cran reçoit deux ou trois
//   sondes au cran supérieur — les sondes de montée du §8.8 : réussies, le cran
//   d'en dessous est tenu pour acquis ; ratées, il y reste et N1 prend la main. »
// « La semaine de méthode : sur chaque objet servi, avant que la porte ne se
//   ferme, la fiche présentée, suivie d'exercices courts aux crans 1, 3 et 4.
//   C'est le cran 2 sans la pièce à écrire : on ne fait pas encore produire. »
//
// Ce module dit, pour UN objet, quels crans sont OUVERTS (le registre), lesquels
// se servent en SONDE (l'élève stagne en dessous), et si l'objet est en SEMAINE
// DE MÉTHODE (jamais servi). Il ne lit rien : le registre lui est donné.
// ⚠️ « Deux et deux » et « deux ou trois sondes » se revoient sur corpus, pas
//    avant : les nombres vivent ici et à `reussites.ts`, nulle part ailleurs.
// ============================================================================
import {
  cransDebloques, cransOuLEleveStagne, cranSuivant, REUSSITES_POUR_DEBLOQUER, type LigneRegistre,
} from './reussites'

/** « Deux ou trois sondes au cran supérieur » — au-delà, l'élève y reste et N1 prend la main. */
export const SONDES_DE_MONTEE_MAX = 3
/** La semaine de méthode : « reconnaître et corriger, pas encore produire ». */
export const CRANS_DE_LA_METHODE: readonly number[] = [1, 3, 4]

export interface PorteDUnObjet {
  objet: string
  /** Les crans que le registre ouvre — le bas des échelles, et « deux et deux ». */
  ouverts: number[]
  /** Les crans servis en SONDE de montée : l'élève stagne au cran d'en dessous. */
  sondes: number[]
  /** L'objet n'a jamais été servi à l'élève : la semaine de méthode. */
  methode: boolean
}

export type StatutDeService = 'ouvert' | 'sonde' | 'methode' | 'ferme'

/**
 * La porte d'UN objet.
 * @param registre  les lignes de l'élève (tous objets — on filtre ici).
 * @param dejaServi l'objet a-t-il DÉJÀ été servi à l'élève avant ce cycle ?
 * @param sondesServies combien de sondes de montée par cran l'élève a déjà
 *        reçues sur cet objet (`routeur_decisions.sondes_retenues`).
 */
export function porteDeLObjet(
  registre: readonly LigneRegistre[], objet: string, dejaServi: boolean,
  sondesServies: ReadonlyMap<number, number> = new Map(),
): PorteDUnObjet {
  const ouverts = cransDebloques(registre, objet)
  const sondes: number[] = []
  for (const cran of cransOuLEleveStagne(registre, objet)) {
    const dessus = cranSuivant(cran)
    if (dessus === null || ouverts.includes(dessus)) continue
    if ((sondesServies.get(dessus) ?? 0) >= SONDES_DE_MONTEE_MAX) continue
    sondes.push(dessus)
  }
  return { objet, ouverts, sondes: sondes.sort((a, b) => a - b), methode: !dejaServi }
}

/**
 * Ce que la couche 4 fait d'une instance à ce cran sur cet objet.
 * ⚠️ L'ORDRE COMPTE : en semaine de méthode, on ne fait « pas encore produire »
 *    — le 2, pourtant en bas de son échelle, n'est pas servi ; et le 4 l'est,
 *    bien que la porte ne l'ait pas encore ouvert.
 */
export function statutDeService(porte: PorteDUnObjet, cran: number | null): StatutDeService {
  if (cran === null) return 'ouvert'         // pas de cran, pas de porte
  if (porte.methode) return CRANS_DE_LA_METHODE.includes(cran) ? 'methode' : 'ferme'
  if (porte.ouverts.includes(cran)) return 'ouvert'
  if (porte.sondes.includes(cran)) return 'sonde'
  return 'ferme'
}

/** Le motif, en clair, pour le journal des écarts. */
export function motifDeFermeture(porte: PorteDUnObjet, registre: readonly LigneRegistre[], cran: number): string {
  if (porte.methode) {
    return `semaine de méthode sur « ${porte.objet} » : seuls les crans ${CRANS_DE_LA_METHODE.join(', ')} se servent`
  }
  const dessous = dessousDe(cran)
  const reussites = dessous === null ? 0
    : registre.filter((l) => l.objet === porte.objet && l.cran === dessous).reduce((n, l) => n + l.reussites, 0)
  return dessous === null
    ? `cran ${cran} hors des échelles du gabarit`
    : `cran ${cran} fermé sur « ${porte.objet} » : le cran ${dessous} compte ${reussites} réussite(s) sur `
      + `${REUSSITES_POUR_DEBLOQUER} attendues`
}

function dessousDe(cran: number): number | null {
  for (const c of [1, 2, 3, 4, 5, 6, 7, 8, 9]) if (cranSuivant(c) === cran) return c
  return null
}
