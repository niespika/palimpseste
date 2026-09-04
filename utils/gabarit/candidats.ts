// ============================================================================
// C7 · L3 — LES CANDIDATS DU GABARIT, MIS À LA FORME QUE L'ÉCRAN LIT.
// ----------------------------------------------------------------------------
// L'offre de crédence (`utils/deroule/credence.ts`) lit une BANQUE de textes et
// une réponse attendue. Au format 1.5, le cas porte autre chose :
//   · au 1(a), des CLÉS de la grille — l'écran sert leurs ÉNONCÉS, et la bonne
//     réponse est l'énoncé de la clé du cas (`10-` §2 : « quatre énoncés ») ;
//   · au 1(b), des `id` de DEVOIRS TÉMOINS — l'écran sert leurs textes, et la
//     bonne réponse est le devoir fautif du cas lui-même (« quatre textes ») ;
//   · au 3, des versions du passage — comme avant, rien à traduire.
// Ce module TRADUIT, il ne décide de rien ; et il ne sort jamais d'ici une clé
// ni un `id` : l'élève lit des textes.
// ============================================================================

export interface CandidatTraduit { texte: string; pourquoi_faux: string }

export interface AppuiTraduit {
  distracteurs: CandidatTraduit[]
  reponseAttendue: string
  /** Ce que la correction dira de la bonne réponse — `null` = l'énoncé le dit déjà. */
  pourquoiJuste: string | null
  /** Ce qui n'a pas pu se traduire — clé ou `id` inconnu ; l'écran signale, ne complète pas. */
  manquants: string[]
}

/**
 * 1(a) — des clés → leurs énoncés. Un candidat faux est un problème qui ne se
 * vérifie pas sur le passage : c'est ce que la correction dira.
 */
export function appuiDu1a(
  cles: readonly unknown[], enonces: ReadonlyMap<string, string>, cleDuCas: string,
): AppuiTraduit {
  const manquants: string[] = []
  const distracteurs: CandidatTraduit[] = []
  for (const k of cles) {
    const cle = typeof k === 'string' ? k : ''
    const enonce = enonces.get(cle)
    if (!enonce) { manquants.push(cle || String(k)); continue }
    if (cle === cleDuCas) continue
    distracteurs.push({ texte: enonce,
      pourquoi_faux: 'Ce constat ne se vérifie pas sur le passage en gras : relis-le.' })
  }
  const attendu = enonces.get(cleDuCas) ?? ''
  if (!attendu) manquants.push(cleDuCas)
  return { distracteurs, reponseAttendue: attendu, pourquoiJuste: null, manquants }
}

/**
 * 1(b) — des `id` de témoins → leurs textes ; le bon candidat est le devoir
 * fautif du cas. Chaque témoin dit pourquoi il n'a pas le problème (son
 * `defaut`, écrit par la fabrique) : c'est ce que la correction dira.
 */
export function appuiDu1b(
  ids: readonly unknown[],
  temoins: ReadonlyMap<string, { texte: string; pourquoi: string | null }>,
  devoirFautif: string | null, enonce: string | null,
): AppuiTraduit {
  const manquants: string[] = []
  const distracteurs: CandidatTraduit[] = []
  for (const k of ids) {
    const id = typeof k === 'string' ? k : ''
    const t = temoins.get(id)
    if (!t || !t.texte) { manquants.push(id || String(k)); continue }
    distracteurs.push({ texte: t.texte,
      pourquoi_faux: t.pourquoi ?? "Ce devoir n'a pas le problème." })
  }
  const attendu = (devoirFautif ?? '').trim()
  if (!attendu) manquants.push('le devoir du cas')
  return {
    distracteurs, reponseAttendue: attendu,
    pourquoiJuste: enonce ? `C'est ce devoir qui commet l'erreur : ${enonce}` : null,
    manquants,
  }
}

/** Le pourquoi d'un témoin, tel que la fabrique l'écrit dans son `defaut`. */
export function pourquoiDuTemoin(defaut: unknown): string | null {
  const d = typeof defaut === 'string' ? defaut : ''
  const i = d.indexOf(' — ')
  const p = (i >= 0 ? d.slice(i + 3) : d).trim()
  return p || null
}
