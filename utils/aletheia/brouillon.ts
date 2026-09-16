// Brouillon LOCAL des formulaires Aletheia (V1 et VF) — sur l'appareil, jamais en base.
//
// ⭐ 13/09 — un élève a perdu sa séance : la porte « retours non lus » a refusé son rendu
// avec « Va les valider, puis reviens », il est parti valider, et l'onglet a perdu ses
// champs (state React seulement — C1-B2 avait laissé le brouillon persistant hors
// périmètre). Ici, la partie PURE : la clé, la lecture, l'écriture, la fusion. Le hook
// `useBrouillonLocal` (côté formulaire) la branche sur `localStorage`.
//
// Règles :
// - la clé porte l'ÉLÈVE : un poste partagé ne doit jamais servir le brouillon d'un autre ;
// - un brouillon dont tous les champs sont vides n'existe pas (on le retire) ;
// - à la fusion, un champ présent dans le brouillon remplace l'initial, même vide (effacé = effacé) ;
// - le brouillon se PURGE à la soumission acceptée, jamais avant.

export type ValeursBrouillon = Record<string, string>

/** Ce dont on a besoin de `localStorage` — pour tester sans navigateur. */
export interface StockageBrouillon {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

/** `relances` : l'écran des réponses aux relances, entre le retour 1 et la VF. */
export type PhaseBrouillon = 'v1' | 'vf' | 'relances'

/**
 * `travailId` (facultatif) : pour la phase `relances`, les réponses répondent aux relances d'UN
 * retour ; si un travail est recréé pour le même livre et la même semaine, elles ne doivent pas
 * revenir sous d'autres relances (revue du 13/09).
 */
export function cleBrouillon(eleveId: string, livreId: string, semaine: number, phase: PhaseBrouillon, travailId?: string): string {
  return `aletheia:brouillon:${eleveId}:${livreId}:${semaine}:${phase}${travailId ? `:${travailId}` : ''}`
}

function estVide(valeurs: ValeursBrouillon): boolean {
  return Object.values(valeurs).every(v => !v || !v.trim())
}

/** Lit le brouillon ; `null` s'il n'y en a pas, s'il est illisible, ou si le stockage refuse. */
export function lireBrouillon(stockage: StockageBrouillon, cle: string): ValeursBrouillon | null {
  try {
    const brut = stockage.getItem(cle)
    if (!brut) return null
    const objet: unknown = JSON.parse(brut)
    if (!objet || typeof objet !== 'object' || Array.isArray(objet)) return null
    const valeurs: ValeursBrouillon = {}
    for (const [k, v] of Object.entries(objet as Record<string, unknown>)) if (typeof v === 'string') valeurs[k] = v
    return estVide(valeurs) ? null : valeurs
  } catch {
    return null
  }
}

/** Écrit le brouillon ; tout vide ⇒ on le retire. Un stockage qui refuse (quota, navigation privée) ne casse rien. */
export function ecrireBrouillon(stockage: StockageBrouillon, cle: string, valeurs: ValeursBrouillon): void {
  try {
    if (estVide(valeurs)) stockage.removeItem(cle)
    else stockage.setItem(cle, JSON.stringify(valeurs))
  } catch {
    /* rien : le brouillon est un filet, pas une garantie */
  }
}

export function purgerBrouillon(stockage: StockageBrouillon, cle: string): void {
  try { stockage.removeItem(cle) } catch { /* idem */ }
}

/**
 * Les valeurs à afficher : le brouillon là où il porte la clé — y compris VIDE : un champ que
 * l'élève a effacé reste effacé (revue du 13/09) —, l'initial ailleurs.
 */
export function fusionnerBrouillon<T extends ValeursBrouillon>(initial: T, brouillon: ValeursBrouillon | null): T {
  const resultat: ValeursBrouillon = {}
  for (const k of Object.keys(initial)) {
    const v = brouillon?.[k]
    resultat[k] = typeof v === 'string' ? v : (initial[k] ?? '')
  }
  return resultat as T
}

// ── ⭐ 15/09 — la BASE du brouillon (revue adversariale du lot « sauvetage ») ─────────────────
//
// Un brouillon peut être plus VIEUX que la base : écrit sur le téléphone, jamais synchronisé,
// puis l'élève a écrit davantage sur un autre appareil. Le restaurer écraserait le texte le plus
// récent. Il porte donc, sous `CLE_BASE`, l'état serveur sérialisé sur lequel il a été pris ;
// au montage, il n'est restaurable que si l'état serveur d'aujourd'hui est encore celui-là.
// Un brouillon sans base (écrit avant le 15/09) reste restaurable.

export const CLE_BASE = '__base'

/** Le brouillon à écrire : les valeurs, et la base sur laquelle il est pris. */
export function avecBase(valeurs: ValeursBrouillon, base: string | null): ValeursBrouillon {
  return base === null ? valeurs : { ...valeurs, [CLE_BASE]: base }
}

/** Tout est vide, la base mise à part : un tel brouillon n'existe pas. */
export function toutVideHorsBase(valeurs: ValeursBrouillon): boolean {
  return Object.entries(valeurs).every(([k, v]) => k === CLE_BASE || !v || !v.trim())
}

/**
 * Le brouillon peut-il se restaurer sur cet état serveur (`serialiseInitial` = `JSON.stringify`
 * des valeurs venues de la base) ? Non si sa base est connue et différente : le serveur a bougé.
 */
export function estRestaurableSur(brouillon: ValeursBrouillon, serialiseInitial: string): boolean {
  const base = brouillon[CLE_BASE]
  return typeof base !== 'string' || base === serialiseInitial
}
