// ============================================================================
// C5 · L2 — LE TEXTE D'AUTEUR QUE L'ÉLÈVE LIT, ET CE QU'ON Y MARQUE.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⭐⭐ LE MANQUE QUE CE MODULE FERME. Le déroulé sait afficher un matériau, mais
//    il va TOUJOURS le chercher au même endroit : `exercices_cas` →
//    `exercices_materiaux`, « la banque de matériaux FABRIQUÉS » (provenance
//    `genere`). **Le texte d'auteur n'y est pas**, et sur une instance de
//    lecture `exercices_cas.materiau_id` est de surcroît NULL. L'élève lisait
//    donc « explique cette phrase de Descartes » **sans voir aucune phrase de
//    Descartes** — l'exercice était infaisable, et un retour « ancré au texte »
//    n'avait pas de texte.
//
// ⭐ CE QUI S'AFFICHE EST L'ENGLOBANT, ET LA SÉLECTION SE MARQUE DEDANS.
//
//    « 2. LA SÉLECTION. […] La sélection donne le `support` et la LOCALISATION.
//      3. L'ENGLOBANT. Il déclare la portion du texte AFFICHÉE AUTOUR de la
//         sélection. C'est l'englobant que la règle de non-emboîtement lit —
//         **c'est l'étendue réellement lue**. »            — `02-` §6 B.1
//
//    Les deux vivent sur l'INSTANCE — `materiau_source_englobant` et
//    `materiau_source_localisation` —, en **caractères, base 0, fin exclue**,
//    dans le système de coordonnées de `scriptorium_contenus.texte_extrait`
//    (C5-L1 : la sélection à la souris y atterrit telle quelle).
//
// ⛔ LE TEXTE NE SE RECOPIE JAMAIS SUR L'INSTANCE. `scriptorium_contenus` en
//    est le domicile ; un second finirait par diverger. L'instance ne porte que
//    des BORNES, et ce module ne fait que trancher et marquer.
//
// ⛔ ET PAS UN OCTET N'EST RETOUCHÉ. La découpe est celle de C4-L15
//    (`segmenterParIntervalles`, `utils/deroule/marquage.ts`) : la concaténation
//    des `texte` des segments rend la tranche à l'identique. **Marquer n'est pas
//    baliser** — aucun caractère n'est interprété, ajouté ni retiré.
// ============================================================================

import { segmenterParIntervalles, type SegmentMateriau } from '../deroule/marquage'

/** Bornes en caractères, base 0, fin exclue — le système de coordonnées de la base. */
export type Bornes = readonly [number, number]

/** Ce que l'instance déclare des bornes, tel que la base le rend (`int[]`). */
export function bornesLues(brut: unknown): Bornes | null {
  if (!Array.isArray(brut) || brut.length < 2) return null
  const d = Number(brut[0])
  const f = Number(brut[1])
  if (!Number.isFinite(d) || !Number.isFinite(f)) return null
  if (f <= d) return null
  return [d, f] as const
}

/**
 * ⭐ LA TRANCHE SERVIE — l'englobant, ou le texte entier à défaut.
 *
 * ⚠️ **UN ENGLOBANT ABSENT NE VEUT PAS DIRE « RIEN À AFFICHER »**, et c'est le
 *    cas le plus fréquent aujourd'hui : les deux seules instances de lecture en
 *    base (les examens diagnostiques de C4-L9) le laissent NULL, parce que
 *    « il n'y a pas d'explication de texte sans le texte entier »
 *    (`utils/examens/conception.ts`). Absent → **le texte entier**, qui est
 *    exactement ce que cette instance-là déclare.
 *
 * ⚠️ Les bornes se RABOTENT sur le texte : un englobant qui déborde sert ce qui
 *    existe, il ne rend pas une chaîne vide. *Un écran mort serait pire qu'un
 *    texte trop long.*
 */
export function trancheServie(
  texte: string, englobant: Bornes | null,
): { texte: string; bornes: Bornes } {
  const n = (texte ?? '').length
  if (!englobant) return { texte: texte ?? '', bornes: [0, n] as const }
  const d = Math.max(0, Math.min(englobant[0], n))
  const f = Math.max(d, Math.min(englobant[1], n))
  if (f <= d) return { texte: texte ?? '', bornes: [0, n] as const }
  return { texte: (texte ?? '').slice(d, f), bornes: [d, f] as const }
}

/**
 * ⭐ LE GESTE COMPLET : la tranche, et la sélection marquée DEDANS.
 *
 * La localisation est exprimée dans les coordonnées du TEXTE ENTIER ; elle se
 * ramène à celles de la tranche par une soustraction. ⚠️ Une localisation qui
 * tombe HORS de l'englobant ne se marque pas — `empechementsDeLaSelection`
 * (C5-L1) l'interdit à la saisie (« l'englobant doit la contenir entièrement »),
 * mais une instance d'avant ce contrôle peut la porter : on sert alors la
 * tranche NON marquée plutôt que de marquer au hasard.
 *
 * ⛔ Rien de la référence décomposée n'entre ici — ni ses moments, ni ses
 *    lectures défendables, ni son armature : « elles sont la grille de la
 *    réception ET la réponse » (RR4, `01-` §12). **Le texte source, lui, est
 *    exactement ce que l'élève doit lire.**
 */
export function servirLeTexteSupport(
  texte: string | null | undefined,
  englobant: Bornes | null,
  localisation: Bornes | null,
): { texte: string; bornes: Bornes; segments: SegmentMateriau[]; selectionMarquee: boolean } | null {
  if (texte == null || texte === '') return null
  const tranche = trancheServie(texte, englobant)
  const dans = localisation
    && localisation[0] >= tranche.bornes[0] && localisation[1] <= tranche.bornes[1]
    ? [localisation[0] - tranche.bornes[0], localisation[1] - tranche.bornes[0]] as const
    : null
  const segments = segmenterParIntervalles(tranche.texte, dans ? [dans] : [])
  return {
    texte: tranche.texte,
    bornes: tranche.bornes,
    segments,
    selectionMarquee: segments.some((s) => s.marque),
  }
}
