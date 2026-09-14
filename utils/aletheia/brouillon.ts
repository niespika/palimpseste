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
// - à la fusion, un champ du brouillon ne remplace le champ initial que s'il est non vide ;
// - le brouillon se PURGE à la soumission acceptée, jamais avant.

export type ValeursBrouillon = Record<string, string>

/** Ce dont on a besoin de `localStorage` — pour tester sans navigateur. */
export interface StockageBrouillon {
  getItem(cle: string): string | null
  setItem(cle: string, valeur: string): void
  removeItem(cle: string): void
}

export type PhaseBrouillon = 'v1' | 'vf'

export function cleBrouillon(eleveId: string, livreId: string, semaine: number, phase: PhaseBrouillon): string {
  return `aletheia:brouillon:${eleveId}:${livreId}:${semaine}:${phase}`
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

/** Les valeurs à afficher : le brouillon là où il dit quelque chose, l'initial ailleurs. */
export function fusionnerBrouillon<T extends ValeursBrouillon>(initial: T, brouillon: ValeursBrouillon | null): T {
  if (!brouillon) return initial
  const resultat: ValeursBrouillon = { ...initial }
  for (const k of Object.keys(initial)) {
    const v = brouillon[k]
    if (typeof v === 'string' && v.trim()) resultat[k] = v
  }
  return resultat as T
}
