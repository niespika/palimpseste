// ============================================================================
// C4 · L4 — `photos[]` : L'ORDRE, LA ROTATION, LA SOMME DE CONTRÔLE, ET LA PAGE
//           QUI MANQUE.
// ----------------------------------------------------------------------------
// « `photos[]` porte l'ORDRE, la ROTATION, une SOMME DE CONTRÔLE, et SAIT DIRE
//   QU'UNE PAGE MANQUE »                                    — `07-` §1.1 ; piège 12
//
// La garde en base (`photos_bien_formees`, C4-L1 · resserrée le 21/08 · domaine
// de `rotation` posé par C4-L4) exige les quatre clés ET leur type ET, depuis
// `c4_l4_passation.sql`, le DOMAINE de la rotation. Ce module est le SEUL
// endroit du code qui fabrique la forme : une seconde fabrique diverge.
//
// ⚠️ CE QUE LA CLÉ `page_manquante` DEMANDE À L'ÉCRAN, et que la garde ne peut
//    pas tenir : « ton écran doit pouvoir dire qu'une page manque, VRAIMENT —
//    sans quoi la clé est là, typée, et toujours vide de sens » (piège 12).
//    D'où `marqueurPageManquante()` : une entrée SANS fichier, qui tient le
//    rang dans l'ordre. Une copie de quatre pages dont la 3 est illisible se
//    dépose donc en quatre entrées, dont une vide — et non en trois, qui
//    diraient faussement une copie de trois pages.
//
// ⚠️ AUCUN SIGNAL D'INTÉGRITÉ N'EST TIRÉ D'ICI (piège 11). L'EXIF est purgé
//    « parce que la loi 25 l'exige » (`06-` §7, point 4), pas pour en tirer un
//    seuil : la passation est « en classe, à la main, sous surveillance », et
//    « le faisceau ne regarde que le formatif fait à la maison » (`06-` §6).
//    Le seuil « photo suspecte » de Fragments ne se recopie donc pas ici.
//
// Fichier PUR : aucun `server-only`, aucun accès base — il est testé sous
// `npm test` (patron `utils/cout-usage.ts`).
// ============================================================================

/** Les quatre clés que la garde exige, et rien de plus. */
export interface Photo {
  /** Le rang dans la copie, à partir de 1. C'est l'ORDRE de lecture. */
  ordre: number
  /** Un QUART DE TOUR, et rien d'autre (garde `photos_bien_formees`, C4-L4). */
  rotation: Rotation
  /**
   * De quoi reconnaître deux fois la même page. Pour une page déposée, c'est
   * l'empreinte du fichier ; pour une page manquante, un marqueur stable —
   * la garde exige une chaîne NON VIDE, et un dépôt sans marqueur serait refusé.
   */
  somme_controle: string
  /** « Sait dire qu'une page manque » — la clé, et son sens. */
  page_manquante: boolean
  /**
   * Le chemin dans le bucket. ABSENT sur une page manquante — c'est ce qui
   * distingue « la page 3 n'a pas été photographiée » de « la page 3 est là ».
   * Hors des quatre clés gardées : la garde ne l'exige pas, elle ne l'interdit
   * pas non plus (elle refuse les clés MAL formées, pas les clés en plus).
   */
  chemin?: string
}

export const ROTATIONS = [0, 90, 180, 270] as const
export type Rotation = (typeof ROTATIONS)[number]

export const MARQUEUR_PAGE_MANQUANTE = 'page-manquante'

/** Le domaine de `rotation`, du côté du code — le même que celui de la garde. */
export function estUnQuartDeTour(v: unknown): v is Rotation {
  return typeof v === 'number' && (ROTATIONS as readonly number[]).includes(v)
}

/**
 * Ramène n'importe quel angle au quart de tour le plus proche, dans [0, 360[.
 * L'écran ne propose que des quarts ; ceci est la ceinture, pas la bretelle.
 */
export function auQuartDeTour(deg: number): Rotation {
  if (!Number.isFinite(deg)) return 0
  const positif = ((Math.round(deg / 90) * 90) % 360 + 360) % 360
  return positif as Rotation
}

/** Une page déposée. */
export function photoDeposee(
  ordre: number, chemin: string, sommeControle: string, rotation: number = 0,
): Photo {
  return {
    ordre,
    rotation: auQuartDeTour(rotation),
    somme_controle: sommeControle,
    page_manquante: false,
    chemin,
  }
}

/**
 * Une page qui MANQUE — elle tient son rang, et le dit.
 *
 * La somme de contrôle porte le rang : deux pages manquantes dans la même copie
 * ne sont pas la même page, et une chaîne vide serait refusée par la garde.
 */
export function marqueurPageManquante(ordre: number): Photo {
  return {
    ordre,
    rotation: 0,
    somme_controle: `${MARQUEUR_PAGE_MANQUANTE}:${ordre}`,
    page_manquante: true,
  }
}

/**
 * Renumérote de 1 à N dans l'ordre du tableau, et trie.
 *
 * L'ordre EST une donnée de la copie : une copie dont les pages arrivent
 * mélangées se lit dans le désordre, et la Structure se mesure sur un
 * découpage — « une transcription qui fusionne deux paragraphes fabrique une
 * copie sans architecture » (`06-` §4). Ce qui vaut pour les paragraphes vaut
 * a fortiori pour les pages.
 */
export function renumeroter(photos: readonly Photo[]): Photo[] {
  return photos.map((p, i) => ({ ...p, ordre: i + 1 }))
}

export interface RefusPhotos {
  motif: string
}

/**
 * Le contrôle que le SERVEUR fait avant d'écrire — la garde en base est le
 * dernier rempart, pas le premier : elle rend une `23514` illisible à l'écran.
 *
 * `null` et `[]` restent légitimes : « un dépôt sans photo existe » (piège 12).
 */
export function refuserPhotos(photos: readonly Photo[] | null): RefusPhotos | null {
  if (photos == null || photos.length === 0) return null
  const vus = new Set<number>()
  for (const p of photos) {
    if (!Number.isInteger(p.ordre) || p.ordre < 1) {
      return { motif: `ordre invalide (${String(p.ordre)}) — le rang commence à 1.` }
    }
    if (vus.has(p.ordre)) return { motif: `deux pages portent le rang ${p.ordre}.` }
    vus.add(p.ordre)
    if (!estUnQuartDeTour(p.rotation)) {
      return { motif: `rotation ${String(p.rotation)} — un quart de tour seulement (0, 90, 180, 270).` }
    }
    if (typeof p.somme_controle !== 'string' || p.somme_controle.trim() === '') {
      return { motif: `page ${p.ordre} sans somme de contrôle.` }
    }
    if (typeof p.page_manquante !== 'boolean') {
      return { motif: `page ${p.ordre} : « page manquante » n'est pas un booléen.` }
    }
    if (p.page_manquante && p.chemin) {
      return { motif: `page ${p.ordre} déclarée manquante mais porteuse d'un fichier.` }
    }
    if (!p.page_manquante && !p.chemin) {
      return { motif: `page ${p.ordre} sans fichier et non déclarée manquante — l'un ou l'autre.` }
    }
  }
  // Le rang doit couvrir 1..N sans trou : un trou dans l'ordre est exactement
  // ce que `page_manquante` sert à ne PAS produire.
  for (let i = 1; i <= photos.length; i++) {
    if (!vus.has(i)) return { motif: `la copie saute le rang ${i} — une page qui manque se DÉCLARE.` }
  }
  return null
}

/** Les pages réellement déposées, dans l'ordre — ce que la transcription reçoit. */
export function pagesAvecFichier(photos: readonly Photo[] | null): Photo[] {
  return (photos ?? []).filter((p) => !p.page_manquante && p.chemin)
    .slice().sort((a, b) => a.ordre - b.ordre)
}

/** Les rangs déclarés manquants — ce que l'écran et la transcription doivent dire. */
export function rangsManquants(photos: readonly Photo[] | null): number[] {
  return (photos ?? []).filter((p) => p.page_manquante).map((p) => p.ordre).sort((a, b) => a - b)
}
