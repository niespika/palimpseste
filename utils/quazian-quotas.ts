// Le PLAFOND de cartes d'une génération Quazian — pourquoi, et comment il se répartit.
//
// Mesuré le 2026-08-31 en production, sur le cours qui a motivé ce garde-fou
// (« Qu'est-ce que la Connaissance ? », 16 557 caractères ≈ 2 766 mots ≈ 7 pages) :
// le cours est DÉCOUPÉ en 12 sous-sections, et `genererCartes` fait UN appel IA
// par sous-section avec la consigne « génère toutes les flashcards atomiques
// pertinentes » — aucun plafond, ni dans le prompt ni dans le code. Résultat :
// ~150 cartes déposées d'un coup, 33 gardées par le prof (78 % supprimées à la
// main, une par une).
//
// ⚠️ Le nombre de cartes ne suivait donc PAS la longueur du cours : il suivait le
// nombre de sous-sections. L'autre cours de la base (« Nommer », 15 784 car., même
// taille) n'est pas découpé : il part en UN seul appel et ne peut pas dépasser ce
// que `max_tokens` laisse sortir. Deux cours de même longueur, deux paquets sans
// commune mesure — c'est cette asymétrie que le plafond supprime.
//
// D'où la règle : le plafond appartient à la CIBLE (le cours entier), jamais au
// lot. Il se répartit ensuite entre les sous-sections au prorata de leur longueur,
// et chaque lot reçoit SON quota — dans son prompt (« au plus N ») et dans le code
// (`slice`), parce qu'un modèle déborde.

/**
 * Densité visée : un cours donne ~1 carte tous les 110 mots, jusqu'au plafond.
 *
 * Calibré sur la demande : « 20 à 25 max par cours, des fois moins ». 2 766 mots
 * / 110 = 25 — un cours de sept pages atteint tout juste le plafond, un cours de
 * deux pages (≈ 800 mots) en reçoit 7. Le plafond ne devient donc PAS un objectif
 * pour les cours courts : c'est bien un maximum.
 */
export const MOTS_PAR_CARTE = 110

/** En dessous, un cours si court qu'il ne vaut pas une carte reste jugé utile. */
export const PLANCHER_CARTES = 3

/** Bornes du réglage prof (`quazian_parametres.valeur.plafond_cartes`). */
export const PLAFOND_DEFAUT = 25
export const PLAFOND_MIN = 5
export const PLAFOND_MAX = 60

/** Le plafond du prof, ramené dans ses bornes. Toute valeur absente ⇒ défaut. */
export function plafondValide(valeur: unknown): number {
  const n = typeof valeur === 'number' ? valeur : Number.parseInt(String(valeur ?? ''), 10)
  if (!Number.isFinite(n)) return PLAFOND_DEFAUT
  return Math.min(PLAFOND_MAX, Math.max(PLAFOND_MIN, Math.round(n)))
}

/** Compte de mots d'un texte — grossier, mais c'est l'ordre de grandeur qui décide. */
export function compterMots(texte: string): number {
  const t = texte.trim()
  return t.length === 0 ? 0 : t.split(/\s+/).length
}

/**
 * Combien de cartes pour CETTE cible : la densité, plafonnée, planchée.
 * Un corpus vide ne donne rien (0) — pas de plancher qui inventerait des cartes.
 */
export function quotaCible(mots: number, plafond: number): number {
  if (mots <= 0) return 0
  const vise = Math.round(mots / MOTS_PAR_CARTE)
  return Math.min(plafond, Math.max(Math.min(PLANCHER_CARTES, plafond), vise))
}

/**
 * Répartit `total` cartes entre des lots, au prorata de leur longueur.
 *
 * Trois garanties, dans cet ordre :
 *  1. la somme rendue vaut EXACTEMENT `total` (méthode des plus forts restes) ;
 *  2. tout lot non vide reçoit au moins 1 carte — tant qu'il y a assez à donner ;
 *  3. s'il y a plus de lots que de cartes, seuls les PLUS LONGS sont servis, les
 *     autres reçoivent 0 — et un lot à 0 ne coûte aucun appel IA.
 */
export function repartirQuotas(longueurs: number[], total: number): number[] {
  const n = longueurs.length
  const zero = longueurs.map(() => 0)
  if (n === 0 || total <= 0) return zero

  // Un lot vide ne concourt jamais : il n'a rien à décortiquer.
  const actifs = longueurs.map((l, i) => ({ l, i })).filter((x) => x.l > 0)
  if (actifs.length === 0) return zero

  const somme = actifs.reduce((a, x) => a + x.l, 0)
  const quotas = [...zero]

  // Plus de lots que de cartes : les plus longs d'abord, un chacun.
  if (actifs.length > total) {
    const rang = [...actifs].sort((a, b) => b.l - a.l || a.i - b.i)
    for (const x of rang.slice(0, total)) quotas[x.i] = 1
    return quotas
  }

  const ideal = new Map(actifs.map((x) => [x.i, (total * x.l) / somme]))
  for (const x of actifs) quotas[x.i] = Math.max(1, Math.floor(ideal.get(x.i)!))

  // Les plus forts restes d'abord ; à reste égal, l'ordre du texte tranche.
  const parReste = [...actifs].sort((a, b) => {
    const ra = ideal.get(a.i)! - Math.floor(ideal.get(a.i)!)
    const rb = ideal.get(b.i)! - Math.floor(ideal.get(b.i)!)
    return rb - ra || a.i - b.i
  })

  let reste = total - quotas.reduce((a, b) => a + b, 0)
  while (reste > 0) {
    for (const x of parReste) {
      if (reste === 0) break
      quotas[x.i]++
      reste--
    }
  }
  // Trop-plein : le plancher de 1 a pu faire dépasser `total` (lots minuscules à
  // côté d'un lot énorme). On reprend aux mieux servis, jamais en dessous de 1.
  while (reste < 0) {
    const candidats = actifs.filter((x) => quotas[x.i] > 1)
    if (candidats.length === 0) break
    const cible = candidats.sort(
      (a, b) => (quotas[b.i] - ideal.get(b.i)!) - (quotas[a.i] - ideal.get(a.i)!) || a.i - b.i,
    )[0]
    quotas[cible.i]--
    reste++
  }
  return quotas
}

/** Ce dont la répartition a besoin d'un lot de génération — rien de plus. */
export interface LotAQuota {
  /** Le texte que ce lot fera décortiquer. */
  texte: string
  /** Un texte source suit sa règle propre (F2 : 1-2 cartes), hors quota du cours. */
  texteSource: boolean
}

/**
 * Attribue à chaque lot SON nombre maximal de cartes.
 *
 * ⚠️ Le plafond appartient à la CIBLE, jamais au lot : sinon un cours découpé en
 * 12 sous-sections rend 12 × le plafond — c'est exactement ce qui a produit ~150
 * cartes sur un cours de sept pages le 2026-08-31. Les textes sources gardent
 * leur règle propre (1-2 cartes) et ne consomment pas le quota du cours : leurs
 * lots vivent à côté (bras unité hérité, où une unité mêle cours et extraits).
 * Un lot à 0 ne déclenche AUCUN appel IA.
 */
export function quotasDesLots(lots: LotAQuota[], plafond: number): number[] {
  const quotas: number[] = lots.map((l) => (l.texteSource ? 2 : 0))
  const indexCours = lots.map((l, i) => (l.texteSource ? -1 : i)).filter((i) => i >= 0)
  if (indexCours.length === 0) return quotas

  const mots = indexCours.reduce((a, i) => a + compterMots(lots[i].texte), 0)
  const part = repartirQuotas(
    indexCours.map((i) => lots[i].texte.trim().length),
    quotaCible(mots, plafond),
  )
  indexCours.forEach((i, k) => { quotas[i] = part[k] })
  return quotas
}
