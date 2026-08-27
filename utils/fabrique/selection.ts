// ============================================================================
// C5 · L1 — LA SÉLECTION DANS LE TEXTE, ET SON ÉTENDUE.
// ----------------------------------------------------------------------------
// « 2. LA SÉLECTION. Le texte s'affiche ; le professeur sélectionne dedans un
//      MOT, une PHRASE, un EXTRAIT (plusieurs phrases) ou LE TEXTE COMPLET. La
//      sélection donne le `support` et la LOCALISATION.
//   3. L'ENGLOBANT. Il déclare la portion du texte AFFICHÉE AUTOUR de la
//      sélection. C'est l'englobant que la règle de non-emboîtement lit — c'est
//      l'étendue réellement lue. »                          — `02-` §6 B.1
//
// ⚠️ AVANT CE LOT, LA SÉLECTION SE SAISISSAIT EN QUATRE NOMBRES TAPÉS À LA MAIN
//    — début, fin, début d'englobant, fin d'englobant. Six des sept temps du
//    pipeline étaient construits ; celui-là ne l'était pas. « Le choix de
//    l'extrait », c'est là.
//
// Le système de coordonnées est celui de la base : DES INTERVALLES DE CARACTÈRES,
// bornes en BASE 0, FIN EXCLUE (`exercices.materiau_source_localisation`).
//
// ⛔ CE MODULE NE DÉCIDE RIEN. Il dit ce qu'une sélection COUVRE, et ce qui ne
//    tient pas debout. Ce qui est déclarable reste borné par la doctrine
//    (`empechementsDeConception`), et le rôle de la sélection — cible ou source —
//    est décidé par LE CRAN, jamais par le professeur (`02-` §6 B.1, point 6).
// ============================================================================

import { phrasesDuTexte } from './verifie-reference'

export type Intervalle = readonly [number, number]

/**
 * Les bornes de chaque phrase dans le texte d'origine. Même technique que
 * `utils/generateur/lecture.ts` : on RETROUVE les phrases de la segmentation qui
 * fait foi, on ne la refait pas.
 */
function bornesDesPhrases(texte: string): Intervalle[] {
  const t = texte ?? ''
  const out: Intervalle[] = []
  let curseur = 0
  for (const p of phrasesDuTexte(t)) {
    const i = t.indexOf(p, curseur)
    if (i < 0) continue
    out.push([i, i + p.length] as const)
    curseur = i + p.length
  }
  return out
}

/**
 * L'étendue qu'un intervalle couvre, dans le vocabulaire du `02-` §0 :
 * `mot` · `phrase` · `extrait` · `texte`.
 *
 * ⚠️ « LE `support` NE DÉCIDE PAS DU `grain` » (`02-` §0) : cette fonction dit
 *    ce que la sélection couvre, elle ne dit rien de la charge de travail.
 *
 * ⭐ ON COMPTE EN PHRASES DE LA SEGMENTATION QUI FAIT FOI, pas en caractères :
 *    c'est le même découpage que la référence décomposée et que le pré-relevé de
 *    la Synthèse. Un compte propre à cet écran en ferait un troisième.
 */
export function etendueDe(texte: string, intervalle: Intervalle | null): string | null {
  if (!intervalle) return null
  const [d, f] = intervalle
  if (!(f > d)) return null
  const phrases = bornesDesPhrases(texte)
  if (phrases.length === 0) return null
  // Les phrases que l'intervalle touche — même partiellement : ce qu'on affiche
  // à l'élève est ce qu'il lit, et une demi-phrase reste une phrase lue.
  const touchees = phrases.filter((p) => p[0] < f && p[1] > d)
  if (touchees.length === 0) return null
  if (touchees.length >= phrases.length) return 'texte'
  if (touchees.length > 1) return 'extrait'
  // Une seule phrase touchée : est-ce la phrase, ou un mot dedans ?
  const [pd, pf] = touchees[0]
  const couvreLaPhrase = d <= pd && f >= pf
  if (couvreLaPhrase) return 'phrase'
  return /\s/.test(texte.slice(d, f).trim()) ? 'phrase' : 'mot'
}

/**
 * Ce qui empêche cette saisie de tenir debout — DIT À L'ÉCRAN, avant l'envoi.
 *
 * ⛔ Ce n'est pas une règle neuve : l'englobant est « la portion du texte
 *    AFFICHÉE AUTOUR de la sélection » (`02-` §6 B.1, point 3). Une sélection
 *    qui en sortirait ne serait pas entourée par lui, et la règle de
 *    non-emboîtement — qui lit l'englobant comme « l'étendue réellement lue » —
 *    compterait une étendue que l'élève n'a pas eue sous les yeux.
 */
export function empechementsDeLaSelection(
  texte: string, selection: Intervalle | null, englobant: Intervalle | null,
  objet: string | null,
): string[] {
  const out: string[] = []
  const n = (texte ?? '').length
  const borne = (i: Intervalle | null, nom: string) => {
    if (!i) return
    if (i[0] < 0 || i[1] > n) out.push(`${nom} : les bornes sortent du texte (0–${n}).`)
    if (i[1] <= i[0]) out.push(`${nom} : l’intervalle est vide.`)
  }
  borne(selection, 'la sélection')
  borne(englobant, 'l’englobant')

  if (selection && englobant && (selection[0] < englobant[0] || selection[1] > englobant[1])) {
    out.push('L’englobant est la portion AFFICHÉE AUTOUR de la sélection : '
      + 'il doit la contenir entièrement.')
  }
  // « Il est OBLIGATOIRE ET NON VIDE sur l'objet "la phrase", dont la règle
  //   d'instance exige le co-texte » (`02-` §6 B.1, point 3).
  if (objet === 'phrase' && (!englobant || englobant[1] <= englobant[0])) {
    out.push('Sur l’objet « la phrase », l’englobant est obligatoire et non vide : '
      + 'sa règle d’instance exige le co-texte.')
  }
  return out
}
