export interface Parametres {
  a: number
  b: number
  centre: number
  pente: number
  w: number
  retention_cible: number
}

export const PARAMS_DEFAUT: Parametres = {
  a: 10, b: 1, centre: 14, pente: 3, w: 0.5, retention_cible: 0.9,
}
