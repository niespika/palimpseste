import { PLAFOND_DEFAUT } from './quazian-quotas'

export interface Parametres {
  a: number
  b: number
  centre: number
  pente: number
  w: number
  retention_cible: number
  /**
   * Nombre MAXIMAL de cartes qu'une génération dépose sur une cible (le cours
   * entier, pas la sous-section). Vit dans le même `jsonb` que les autres —
   * aucune migration. Absent en base ⇒ `PLAFOND_DEFAUT`, cf. `plafondValide`.
   */
  plafond_cartes: number
}

export const PARAMS_DEFAUT: Parametres = {
  a: 10, b: 1, centre: 14, pente: 3, w: 0.5, retention_cible: 0.9,
  plafond_cartes: PLAFOND_DEFAUT,
}
