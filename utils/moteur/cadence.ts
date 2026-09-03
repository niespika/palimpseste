// ============================================================================
// C4 · L12 — LA CADENCE DE LA POSE : une file BORNÉE PAR L'HORLOGE, et quelques
// élèves de front.
// ----------------------------------------------------------------------------
// ⛔⛔ POURQUOI CE FICHIER EXISTE — mesuré en production le 02/09/2026.
//    Le passage du lundi 31/08 à 18:00 UTC a servi **59 élèves sur 62** : les
//    décisions vont de 18:01:58 à 18:06:00, soit ~300 s après l'invocation —
//    exactement `maxDuration`. Vercel a tué la fonction EN VOL, entre deux
//    élèves ; chaque `insert` étant sa propre transaction, tout ce qui précédait
//    est resté, et RIEN n'a dit l'arrêt : ni décision, ni incident, ni ligne
//    « non servi » — une coupure ne passe par aucun `catch`. Les trois non
//    servies étaient les trois DERNIÈRES de l'ordre de parcours `(classe_id,
//    eleve_id)`, et elles l'auraient été chaque lundi.
//
// ⭐ LA RÈGLE, en deux moitiés qui ne se remplacent pas :
//    1. **La boucle S'ARRÊTE ELLE-MÊME avant que la plateforme ne l'arrête**, et
//       elle rend la liste de ce qu'elle n'a pas traité. Un vide expliqué, jamais
//       un vide muet. C'est `enFileBornee` et son `horloge`.
//    2. **Elle va plus vite** : quelques élèves de front (`concurrence`), parce
//       que le coût est le réseau — 160 à 332 ms par aller-retour depuis `iad1`,
//       une dizaine par élève — et non le calcul. Les poses de deux élèves sont
//       indépendantes : « tout se décide à la construction du cycle », et l'état
//       de chacun se lit UNE FOIS, pour lui seul.
//    ⚠️ La première moitié sans la seconde coupe proprement au lieu de couper
//       salement — c'est mieux, ce n'est pas suffisant. La seconde sans la
//       première fait de la marge jusqu'au jour où une classe grandit.
//
// ⛔ AUCUNE DÉPENDANCE À LA BASE : ce module est PUR, et ses tests le prouvent
//    avec une horloge simulée. La borne réelle se calcule au site d'appel, à
//    partir de `maxDuration` de la route et de ce que la collecte a déjà coûté.
// ============================================================================

export interface Horloge {
  /** L'instant de DÉPART du budget — `Date.now()` à l'entrée de la route, pas du routeur. */
  depart: number
  /** Le budget en millisecondes. `null` = aucune borne (recette, script). */
  budgetMs: number | null
  /** Injectable pour les tests. */
  maintenant?: () => number
}

/** Le temps qu'il reste, ou `null` sans borne. Jamais négatif. */
export function tempsRestantMs(h: Horloge): number | null {
  if (h.budgetMs === null) return null
  const now = (h.maintenant ?? Date.now)()
  return Math.max(0, h.depart + h.budgetMs - now)
}

export interface BilanDeLaFile<T, R> {
  /** Les résultats, dans l'ordre des entrées TRAITÉES. */
  traites: Array<{ item: T; resultat: R }>
  /** Les entrées que l'horloge n'a pas laissé commencer — dans l'ordre, pour que ça se lise. */
  restants: T[]
  /** L'instant de la coupure (ms depuis `depart`), ou `null` si tout a été traité. */
  coupeApresMs: number | null
  dureeMs: number
}

/**
 * Traite `items` avec au plus `concurrence` appels de front, et **ne commence
 * aucun item quand l'horloge est épuisée** — ceux qui restent sont rendus, pas
 * tus. Un item déjà commencé va jusqu'au bout : on ne coupe jamais une pose
 * entre sa décision et son dépôt.
 *
 * ⚠️ `fn` ne doit pas lever : elle rend son propre incident. Si elle lève quand
 *    même, l'erreur remonte et la file s'arrête — c'est le comportement d'avant,
 *    et une lecture ratée n'est pas une base vide.
 */
export async function enFileBornee<T, R>(
  items: readonly T[],
  options: { concurrence: number; horloge: Horloge },
  fn: (item: T) => Promise<R>,
): Promise<BilanDeLaFile<T, R>> {
  const concurrence = Math.max(1, Math.floor(options.concurrence))
  const maintenant = options.horloge.maintenant ?? Date.now
  const t0 = maintenant()
  const traites: Array<{ item: T; resultat: R }> = []
  let prochain = 0
  let coupeApresMs: number | null = null

  const ouvrier = async (): Promise<void> => {
    while (prochain < items.length) {
      if (coupeApresMs !== null) return
      const reste = tempsRestantMs(options.horloge)
      if (reste !== null && reste <= 0) {
        coupeApresMs = maintenant() - options.horloge.depart
        return
      }
      const i = prochain
      prochain += 1
      const resultat = await fn(items[i])
      traites.push({ item: items[i], resultat })
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrence, items.length) }, ouvrier))

  const restants = coupeApresMs === null ? [] : items.slice(prochain)
  return { traites, restants, coupeApresMs, dureeMs: maintenant() - t0 }
}
