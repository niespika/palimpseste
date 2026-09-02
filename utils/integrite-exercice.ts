// ============================================================================
// LA PREUVE D'UN EXERCICE — ce que le panneau Intégrité calcule pour MONTRER,
// jamais pour juger (01/09/2026).
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⭐ POURQUOI CE MODULE EXISTE. Le premier ratissage reçu en production disait
//    « la zone prend 100 % du texte, soit 103,3 fois le passage visé » — et
//    rien d'autre. Le professeur ne voyait ni le matériau, ni où était le
//    passage, ni la zone, ni ce que l'élève avait écrit en regard. Or l'élève
//    avait retapé le texte entier à la main et inséré le connecteur EXACTEMENT
//    à l'endroit de la rupture : dix secondes de lecture suffisaient à
//    l'innocenter, à condition de poser les données côte à côte.
//
// ⛔ CE MODULE NE CONCLUT RIEN. Il découpe un texte en segments à surligner, et
//    il aligne deux textes mot à mot. « Aucun signal, aucune convergence, ne
//    produit de verdict » (`06-` §6) : c'est le professeur qui lit.
// ============================================================================

import type { Intervalle } from './deroule/designation'

// ── Le matériau, découpé pour être surligné ─────────────────────────────────

export interface SegmentDePreuve {
  texte: string
  /** Dans la zone que l'élève a posée. */
  zone: boolean
  /** Dans le passage visé — la cible dérivée du diff. */
  cible: boolean
  /** Dans la marge tolérée autour de la cible (cible comprise). */
  toleree: boolean
}

/**
 * Découpe `contenu` aux bornes des trois intervalles, et dit pour chaque
 * morceau où il tombe. ⚠️ La concaténation des segments EST le contenu —
 * même promesse que `MateriauMarque` : pas un octet retouché.
 */
export function segmentsDeLaPreuve(
  contenu: string,
  zone: Intervalle | null,
  cible: Intervalle | null,
  toleree: Intervalle | null,
): SegmentDePreuve[] {
  const L = contenu.length
  const borne = (n: number) => Math.min(L, Math.max(0, n))
  const coupes = new Set<number>([0, L])
  for (const iv of [zone, cible, toleree]) {
    if (!iv) continue
    coupes.add(borne(iv[0]))
    coupes.add(borne(iv[1]))
  }
  const points = [...coupes].sort((a, b) => a - b)
  const dans = (iv: Intervalle | null, d: number, f: number) =>
    !!iv && borne(iv[0]) <= d && f <= borne(iv[1])
  const out: SegmentDePreuve[] = []
  for (let i = 0; i + 1 < points.length; i++) {
    const d = points[i]
    const f = points[i + 1]
    if (f <= d) continue
    out.push({
      texte: contenu.slice(d, f),
      zone: dans(zone, d, f),
      cible: dans(cible, d, f),
      toleree: dans(toleree, d, f),
    })
  }
  return out
}

/** La part d'un intervalle dans un texte, en pourcent entier. */
export function partEnPourcent(iv: Intervalle, longueur: number): number {
  if (longueur <= 0) return 0
  return Math.round((100 * Math.max(0, iv[1] - iv[0])) / longueur)
}

/** Le nombre de mots d'une tranche. */
export function nombreDeMots(texte: string, iv: Intervalle): number {
  const t = texte.slice(iv[0], iv[1]).trim()
  return t === '' ? 0 : t.split(/\s+/).length
}

// ── Deux textes, mot à mot ──────────────────────────────────────────────────

export type SorteDeDiff = 'egal' | 'ajout' | 'retrait'

export interface PartDeDiff {
  texte: string
  sorte: SorteDeDiff
}

interface Mot { texte: string; cle: string; debut: number; fin: number }

/**
 * ⭐ LA CLÉ D'UN MOT — insensible aux accents et à la casse. Un élève qui tape
 *    « prive » pour « privé », « ecran » pour « écran », n'a rien AJOUTÉ au
 *    matériau : le montrer comme un changement noierait les vrais ajouts sous
 *    les fautes de frappe. Ce qui reste visible, c'est ce qu'il a mis, et ce
 *    qu'il a retiré.
 */
function cleDuMot(m: string): string {
  return m.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function motsSitues(texte: string): Mot[] {
  const out: Mot[] = []
  const re = /[\p{L}\p{N}'’]+/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(texte)) !== null) {
    out.push({ texte: m[0], cle: cleDuMot(m[0]), debut: m.index, fin: m.index + m[0].length })
  }
  return out
}

/**
 * Aligne `texte` (ce que l'élève a écrit) sur `reference` (le matériau), mot à
 * mot, par plus longue sous-séquence commune. Le résultat REJOUE `texte` en
 * entier — ponctuation et espaces compris, tels quels — en y intercalant les
 * mots de la référence que l'élève n'a pas repris (`retrait`).
 *
 * ⚠️ Quadratique en nombre de mots : un matériau fait 386 signes en médiane et
 *    1 849 au plus (mesuré le 01/09), un texte v1 440 au plus. C'est petit.
 */
export function diffDesMots(reference: string, texte: string): PartDeDiff[] {
  const a = motsSitues(reference)
  const b = motsSitues(texte)
  const n = a.length
  const m = b.length

  // LCS, ligne par ligne — `dp[i][j]` = longueur commune de a[i..] et b[j..].
  const dp: Int32Array[] = []
  for (let i = 0; i <= n; i++) dp.push(new Int32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].cle === b[j].cle
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const parts: PartDeDiff[] = []
  const pousser = (texteP: string, sorte: SorteDeDiff) => {
    if (texteP === '') return
    const dernier = parts[parts.length - 1]
    if (dernier && dernier.sorte === sorte) dernier.texte += texteP
    else parts.push({ texte: texteP, sorte })
  }

  let i = 0
  let j = 0
  let pos = 0
  // ⚠️ Un retrait ne porte AUCUNE espace autour de lui : les parts qui ne sont
  //    pas des retraits, concaténées, rendent le texte de l'élève À L'OCTET
  //    PRÈS. C'est au rendu de ménager la marge.
  const retraitsEnAttente: string[] = []
  const viderLesRetraits = () => {
    if (retraitsEnAttente.length === 0) return
    pousser(retraitsEnAttente.join(' '), 'retrait')
    retraitsEnAttente.length = 0
  }
  while (i < n || j < m) {
    if (i < n && j < m && a[i].cle === b[j].cle) {
      pousser(texte.slice(pos, b[j].debut), 'egal')
      viderLesRetraits()
      pousser(texte.slice(b[j].debut, b[j].fin), 'egal')
      pos = b[j].fin
      i++; j++
    } else if (j < m && (i >= n || dp[i][j + 1] >= dp[i + 1][j])) {
      pousser(texte.slice(pos, b[j].debut), 'egal')
      viderLesRetraits()
      pousser(texte.slice(b[j].debut, b[j].fin), 'ajout')
      pos = b[j].fin
      j++
    } else {
      retraitsEnAttente.push(a[i].texte)
      i++
    }
  }
  pousser(texte.slice(pos), 'egal')
  viderLesRetraits()
  return souderLesAjouts(parts)
}

/**
 * ⭐ LE DIFF NE SE MONTRE QUE SI L'ÉLÈVE A REPRIS LE MATÉRIAU.
 *
 * ⛔ Trouvé à la recette du 01/09, sur un cran 4 : l'élève y RÉPOND en texte
 *    libre, il ne réécrit pas le matériau — et l'alignement mot à mot semait
 *    des retraits entre chaque mot commun par hasard (« Ici le sujet demande si
 *    ~~Dans certains lycées~~ un robot… »). Illisible, et faux : rien n'avait
 *    été « retiré ». Le diff n'a de sens que pour une RÉÉCRITURE — les crans où
 *    l'élève transforme le matériau — et c'est la donnée qui le dit, pas le
 *    numéro du cran : la part des mots du matériau qu'on retrouve, dans
 *    l'ordre, dans le texte de l'élève.
 *
 * Le seuil est une PART, pour tenir à toute longueur ; à la moitié, l'erreur va
 * dans le sens de la lisibilité — en dessous, on montre le texte tel quel.
 */
export const PART_REPRISE_POUR_UN_DIFF = 0.5

/** La part des mots de `reference` que `parts` retrouve — 1 = tout repris, 0 = rien. */
export function partReprise(reference: string, parts: readonly PartDeDiff[]): number {
  const total = motsSitues(reference).length
  if (total === 0) return 0
  const retires = parts
    .filter((p) => p.sorte === 'retrait')
    .reduce((n, p) => n + motsSitues(p.texte).length, 0)
  return Math.max(0, total - retires) / total
}

/**
 * Le diff, ou `null` quand le texte de l'élève ne reprend pas le matériau —
 * c'est alors un texte à lire tel quel, pas un écart à montrer.
 */
export function diffSiReprise(reference: string, texte: string): PartDeDiff[] | null {
  const parts = diffDesMots(reference, texte)
  return partReprise(reference, parts) >= PART_REPRISE_POUR_UN_DIFF ? parts : null
}

/**
 * « Du coup » est UN ajout, pas deux : deux ajouts que seule une espace sépare
 * se soudent, espace comprise. La concaténation ne change pas d'un octet.
 */
function souderLesAjouts(parts: PartDeDiff[]): PartDeDiff[] {
  const out: PartDeDiff[] = []
  for (const p of parts) {
    const n = out.length
    if (p.sorte === 'ajout' && n >= 2
      && out[n - 1].sorte === 'egal' && /^\s+$/.test(out[n - 1].texte)
      && out[n - 2].sorte === 'ajout') {
      out[n - 2].texte += out[n - 1].texte + p.texte
      out.pop()
      continue
    }
    out.push({ ...p })
  }
  return out
}

// ── La chronologie ──────────────────────────────────────────────────────────

/** L'écart entre deux instants, lisible : « +56 s », « +3 min 26 s », « +1 h 02 min ». */
export function ecartLisible(avantIso: string, apresIso: string): string | null {
  const a = Date.parse(avantIso)
  const b = Date.parse(apresIso)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  const s = Math.round((b - a) / 1000)
  if (s < 120) return `+${s} s`
  const min = Math.floor(s / 60)
  if (min < 60) return `+${min} min ${String(s % 60).padStart(2, '0')} s`
  const h = Math.floor(min / 60)
  return `+${h} h ${String(min % 60).padStart(2, '0')} min`
}
