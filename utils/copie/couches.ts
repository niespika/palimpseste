// ============================================================================
// LA COPIE ANNOTÉE — LES COUCHES DE SURLIGNAGE.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O.
// ----------------------------------------------------------------------------
// `segmenterParIntervalles` (`utils/deroule/marquage.ts`) ne connaît qu'un
// surlignage : `marque` vrai ou faux. Ici, plusieurs annotations se posent sur
// la même copie — mesuré le 03/09 en production : jusqu'à ~40 surlignages sur
// une copie, et 16 % en croisent un d'une autre compétence. Il faut donc des
// segments qui SAVENT QUI LES COUVRE, sans fusionner deux annotations en une.
//
// ⭐ MÊME PROMESSE que `marquage.ts` : la concaténation des `texte` rend la
//    copie à l'octet près. Rien n'est réécrit, seules des BORNES sont posées.
// ============================================================================

export interface Couche {
  id: string
  /** `[début, fin[` en caractères du texte d'origine. Vide ⇒ la couche ne se pose nulle part. */
  intervalles: ReadonlyArray<readonly [number, number]>
}

export interface SegmentCouche {
  texte: string
  /** Les couches qui couvrent ce segment, dans l'ordre où elles ont été données. */
  ids: string[]
  /** Les couches dont un intervalle COMMENCE ici — c'est là que l'écran pose le numéro. */
  debuts: string[]
}

/**
 * Découpe le texte à chaque borne d'une couche, puis dit, pour chaque tranche,
 * qui la couvre. Deux tranches voisines couvertes par les mêmes couches et sans
 * nouveau départ se recollent.
 */
export function segmenterEnCouches(
  texte: string, couches: readonly Couche[],
): SegmentCouche[] {
  if (!texte) return []
  const n = texte.length
  const bornes = new Set<number>([0, n])
  const propres: Array<{ id: string; d: number; f: number }> = []
  for (const c of couches) {
    for (const [d0, f0] of c.intervalles) {
      const d = Math.max(0, Math.min(d0, n))
      const f = Math.max(0, Math.min(f0, n))
      if (f <= d) continue
      propres.push({ id: c.id, d, f })
      bornes.add(d); bornes.add(f)
    }
  }
  if (!propres.length) return [{ texte, ids: [], debuts: [] }]

  const points = [...bornes].sort((a, b) => a - b)
  const out: SegmentCouche[] = []
  for (let k = 0; k + 1 < points.length; k++) {
    const a = points[k]!, b = points[k + 1]!
    const ids: string[] = []
    const debuts: string[] = []
    for (const p of propres) {
      if (p.d <= a && b <= p.f) {
        if (!ids.includes(p.id)) ids.push(p.id)
        if (p.d === a && !debuts.includes(p.id)) debuts.push(p.id)
      }
    }
    const precedent = out[out.length - 1]
    if (precedent && debuts.length === 0 && memesIds(precedent.ids, ids)) {
      precedent.texte += texte.slice(a, b)
    } else {
      out.push({ texte: texte.slice(a, b), ids, debuts })
    }
  }
  return out
}

function memesIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i])
}
