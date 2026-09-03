/**
 * ⭐⭐ 02/09/2026 — LE CODE RETROUVE LA CITATION DANS LE TEXTE DE L'ÉLÈVE, et
 * rend le texte RÉEL.
 *
 * Mesuré sur les 278 citations servies avant l'élagage du 31/08 : 49 n'étaient
 * pas verbatim, et 30 d'entre elles étaient la phrase de l'élève À UN DÉTAIL
 * PRÈS — un accent, un blanc d'OCR devant une virgule (« vivre , »), une
 * apostrophe détachée (« l ' essence »), une faute corrigée en passant
 * (« réfléxion » → « réflexion »). L'élagage les jetait toutes ; ce module les
 * RÉPARE : il cherche la phrase de l'élève, et c'est ELLE qu'on sert, jamais la
 * version du modèle.
 *
 * TROIS ÉTAGES, du plus sûr au moins sûr, et on s'arrête au premier qui tient :
 *   1. EXACT — la comparaison du retour (`aplatir` d'`anti-injection.ts`) ;
 *   2. NORMALISÉ — accents, ponctuation, blancs et apostrophes pliés, AVEC une
 *      table des positions pour remonter au texte d'origine ;
 *   3. APPROCHÉ — fenêtre glissante AU MOT sur le texte plié, distance de
 *      Levenshtein (`transcription-calcul.ts`, celle des passes d'OCR), seuil
 *      0,90 sur au moins quatre mots.
 *
 * ⛔ CE QUI REFUSE, et pourquoi. *Deux occurrences à égalité* : on ne devine pas
 * laquelle, on n'en sert aucune. *Une négation d'un seul côté* (« peut » /
 * « ne peut pas ») : une réparation qui change le sens est pire qu'un élagage.
 * *Moins de quatre mots* : trop court pour qu'un score veuille dire quelque
 * chose — l'exact ou rien.
 *
 * ⭐ UN SEUL DÉCOUPAGE D'ÉLISION, UN SEUL PLANCHER : ils vivent ici, et
 * `citation-verifiee.ts` les importe. `aplatirIndexable` vient de
 * `deroule/renvoi.ts`, déplacé ici pour que l'écran et la chaîne repèrent avec
 * LE MÊME code.
 */
import { citationsIntrouvables } from './anti-injection'
import { distanceSeule } from '../passation/transcription-calcul'

/**
 * Les marques d'élision qu'un modèle emploie, dans les trois formes qu'on a vues
 * en production : `…`, `...`, et l'une ou l'autre entre crochets.
 */
export const ELISION = /\s*(?:\[\s*(?:…|\.\.\.)\s*\]|…|\.\.\.)\s*/

/**
 * ⚠️ LE PLANCHER D'UN MORCEAU. Sous quatre caractères, un morceau ne prouve plus
 * rien : « et », « la », « il » se retrouvent dans n'importe quelle copie. Quatre
 * est le même plancher que celui du repérage des citations dans la prose
 * (`CITE`, `retour.ts`) — un seul chiffre, un seul sens.
 */
export const PLANCHER = 4

/** Les morceaux d'une citation qu'on peut exiger de la source. */
export function morceauxControlables(citation: string): string[] {
  return citation.split(ELISION).map((m) => m.trim()).filter((m) => m.length >= PLANCHER)
}

/** Le seuil de l'étage approché, et le nombre de mots en dessous duquel il ne parle pas. */
export const SEUIL_APPROCHE = 0.9
export const MOTS_MIN_APPROCHE = 4
/** Deux candidats disjoints à moins de ça l'un de l'autre : on ne tranche pas. */
const MARGE_AMBIGU = 0.05

export interface Plat {
  /** Le texte aplati, prêt pour `indexOf`. */
  texte: string
  /** Pour chaque caractère aplati, l'offset de DÉBUT dans le texte d'origine. */
  debuts: number[]
  /** Pour chaque caractère aplati, l'offset de FIN (exclu) dans l'origine. */
  fins: number[]
}

/** Les apostrophes se ramènent à une seule forme — 1 caractère pour 1. */
const APOSTROPHES = /[‘’ʼ]/
/** Les guillemets TOMBENT, droits comme français — 1 caractère pour 1 blanc. */
const GUILLEMETS = /[“”«»"]/

/**
 * Aplatit en gardant la trace des positions — l'étage 1 de l'écran.
 *
 * ⚠️ **UNE SUITE DE BLANCS DEVIENT UN SEUL ESPACE**, dont l'intervalle d'origine
 *    couvre TOUTE la suite : sans quoi une citation à cheval sur un retour à la
 *    ligne se surlignerait en laissant le saut dehors, et le cadre s'ouvrirait.
 *
 * ⚠️ **LA MINUSCULE SE PREND CARACTÈRE PAR CARACTÈRE, ET ON REFUSE CELLES QUI
 *    CHANGENT DE LONGUEUR** (İ → i̇ en fait deux) : garder l'original coûte au
 *    plus une non-correspondance, quand la table des positions fausse coûterait
 *    un surlignage décalé sur tout ce qui suit.
 */
export function aplatirIndexable(source: string): Plat {
  const texte: string[] = []
  const debuts: number[] = []
  const fins: number[] = []
  let i = 0
  while (i < source.length) {
    const c = source[i]!
    if (/\s/.test(c)) {
      let j = i
      while (j < source.length && /\s/.test(source[j]!)) j++
      texte.push(' ')
      debuts.push(i)
      fins.push(j)
      i = j
      continue
    }
    const remplace = APOSTROPHES.test(c) ? "'" : GUILLEMETS.test(c) ? ' ' : c
    const bas = remplace.toLowerCase()
    texte.push(bas.length === 1 ? bas : remplace)
    debuts.push(i)
    fins.push(i + 1)
    i++
  }
  return { texte: texte.join(''), debuts, fins }
}

/** Une lettre de n'importe quel alphabet à casse, ou un chiffre. */
function estLettreOuChiffre(c: string): boolean {
  return /[0-9]/.test(c) || c.toLowerCase() !== c.toUpperCase()
}

/**
 * ⭐ LE PLIAGE FORT, avec sa table des positions — l'étage 2.
 *
 * Accents et diacritiques tombent (décomposition NFD, marque retirée) ; toute
 * ponctuation devient un blanc ; les blancs se réduisent à un seul, et **ceux
 * qui entourent une apostrophe disparaissent** (« l ' essence » de l'OCR
 * redevient « l'essence ») ; la casse tombe. Chaque caractère plié sait d'où il
 * vient : on remonte aux bornes d'origine, et on sert le texte de l'élève tel
 * qu'il l'a écrit — blanc parasite compris, parce que c'est SA copie.
 */
export function plierFort(source: string, o: { sansApostrophes?: boolean } = {}): Plat {
  const texte: string[] = []
  const debuts: number[] = []
  const fins: number[] = []
  const dernier = () => texte[texte.length - 1]
  const retirerDernier = () => { texte.pop(); debuts.pop(); fins.pop() }
  // ⭐ « Tout dabord » : l'élève omet l'apostrophe, le modèle la remet. Avec
  //    `sansApostrophes`, elle ne compte plus — ni chez l'un ni chez l'autre —
  //    et le blanc qui la suivait ne compte pas non plus (« l ' essence »).
  let apresApostrophe = false
  for (let i = 0; i < source.length; i++) {
    const c = source[i]!
    const base = c.normalize('NFD')[0] ?? c
    let ch: string
    if (c === "'" || APOSTROPHES.test(c)) ch = "'"
    else if (/\s/.test(c) || GUILLEMETS.test(c) || !estLettreOuChiffre(base)) ch = ' '
    else {
      const bas = base.toLowerCase()
      ch = bas.length === 1 ? bas : base
    }
    if (ch === ' ') {
      if (texte.length === 0 || dernier() === "'" || apresApostrophe) continue
      if (dernier() === ' ') { fins[fins.length - 1] = i + 1; continue }
      texte.push(' '); debuts.push(i); fins.push(i + 1)
      continue
    }
    if (ch === "'") {
      if (texte.length && dernier() === ' ') retirerDernier()
      if (o.sansApostrophes) { apresApostrophe = true; continue }
    }
    apresApostrophe = false
    texte.push(ch); debuts.push(i); fins.push(i + 1)
  }
  if (texte.length && dernier() === ' ') retirerDernier()
  return { texte: texte.join(''), debuts, fins }
}

interface Mot { t: string; debut: number; fin: number }

/** Les mots d'un texte plié, chacun avec ses bornes dans l'origine. */
function motsDuPlat(p: Plat): Mot[] {
  const mots: Mot[] = []
  let k = 0
  while (k < p.texte.length) {
    if (p.texte[k] === ' ') { k++; continue }
    let j = k
    while (j < p.texte.length && p.texte[j] !== ' ') j++
    mots.push({ t: p.texte.slice(k, j), debut: p.debuts[k]!, fin: p.fins[j - 1]! })
    k = j
  }
  return mots
}

/**
 * Les mots de négation dont la présence d'un seul côté interdit la réparation.
 * ⚠️ « plus » n'y est pas : « il n'en veut plus » et « il en veut plus » sont
 *    indécidables sans contexte, et « plus » est trop fréquent hors négation.
 */
const NEGATIONS = new Set(['ne', 'pas', 'jamais', 'rien', 'non', 'aucun', 'aucune', 'ni', 'sans',
  'nul', 'nulle', 'personne', 'guere'])

function empreinteDeNegation(mots: readonly string[]): string {
  const comptes = new Map<string, number>()
  for (const m of mots) {
    const cle = m.startsWith("n'") ? 'ne' : m
    if (NEGATIONS.has(cle)) comptes.set(cle, (comptes.get(cle) ?? 0) + 1)
  }
  return [...comptes].sort().map(([k, v]) => `${k}:${v}`).join(',')
}

export type Methode = 'exact' | 'normalise' | 'approche'

export interface MorceauTrouve {
  debut: number
  fin: number
  /** Ce que l'élève a écrit, à ces bornes — et rien d'autre. */
  texteReel: string
  score: number
  methode: Methode
}

export type MotifDEchec = 'source_vide' | 'trop_court' | 'introuvable' | 'ambigu' | 'negation'

export interface Echec { echec: MotifDEchec; detail: string }

/**
 * ⭐ 02/09 — LA PONCTUATION QUI SUIT LE DERNIER MOT. Le pliage fort découpe du
 * premier au dernier MOT : « un temps de repos. » redevenait « un temps de
 * repos ». Si la citation du modèle se terminait par une ponctuation, on étend
 * la borne sur celle que la copie porte juste après — sans blanc entre les deux,
 * et jamais un guillemet fermant, qui n'appartient pas à la phrase.
 */
const PONCTUATION_FINALE = /[.,;:!?…]/
function etendreALaPonctuation(source: string, fin: number, morceau: string): number {
  const dernier = morceau.trim().slice(-1)
  if (!PONCTUATION_FINALE.test(dernier)) return fin
  // « vraiment ! » : la typographie française met un blanc avant « ! », « ? »,
  // « ; », « : » — on le traverse, mais seulement s'il mène à une ponctuation.
  let g = fin
  while (g < source.length && /\s/.test(source[g]!)) g++
  if (g >= source.length || !PONCTUATION_FINALE.test(source[g]!)) return fin
  let f = g
  while (f < source.length && PONCTUATION_FINALE.test(source[f]!)) f++
  return f
}

/** Les bornes d'un morceau qui tient au sens du retour, remontées par l'un des deux aplatisseurs. */
function bornesExactes(source: string, morceau: string, fort: Plat): [number, number] | null {
  // L'aplatisseur de l'écran d'abord : il garde la ponctuation, donc les bornes
  // couvrent « doute de tout. » avec son point. Le pliage fort en repli.
  const plat = aplatirIndexable(source)
  const c1 = aplatirIndexable(morceau).texte.trim()
  const k1 = c1 ? plat.texte.indexOf(c1) : -1
  if (k1 >= 0) return [plat.debuts[k1]!, plat.fins[k1 + c1.length - 1]!]
  const c2 = plierFort(morceau).texte
  const k2 = c2 ? fort.texte.indexOf(c2) : -1
  if (k2 >= 0) return [fort.debuts[k2]!, fort.fins[k2 + c2.length - 1]!]
  return null
}

/**
 * Un morceau, retrouvé dans la source par les trois étages.
 * @param fort  `plierFort(source)`, calculé une fois par l'appelant.
 */
export function retrouverMorceau(source: string, morceau: string, fort: Plat): MorceauTrouve | Echec {
  // Étage 1 — exact, au sens du retour.
  if (citationsIntrouvables(source, [morceau]).introuvables.length === 0) {
    const b = bornesExactes(source, morceau, fort)
    if (b) return { debut: b[0], fin: b[1], texteReel: source.slice(b[0], b[1]), score: 1, methode: 'exact' }
  }
  // Étage 2 — plié fort.
  const cible = plierFort(morceau).texte
  if (cible === '') return { echec: 'trop_court', detail: 'rien à chercher une fois plié' }
  const k = fort.texte.indexOf(cible)
  if (k >= 0) {
    const debut = fort.debuts[k]!
    const fin = etendreALaPonctuation(source, fort.fins[k + cible.length - 1]!, morceau)
    return { debut, fin, texteReel: source.slice(debut, fin), score: 1, methode: 'normalise' }
  }
  // Étage 2 bis — sans les apostrophes : « Tout dabord » / « Tout d'abord ».
  const sansApo = plierFort(source, { sansApostrophes: true })
  const cibleSansApo = plierFort(morceau, { sansApostrophes: true }).texte
  const k2 = cibleSansApo ? sansApo.texte.indexOf(cibleSansApo) : -1
  if (k2 >= 0) {
    const debut = sansApo.debuts[k2]!
    const fin = etendreALaPonctuation(source, sansApo.fins[k2 + cibleSansApo.length - 1]!, morceau)
    return { debut, fin, texteReel: source.slice(debut, fin), score: 1, methode: 'normalise' }
  }
  // Étage 3 — approché, au mot.
  const cw = cible.split(' ').filter((m) => m !== '')
  if (cw.length < MOTS_MIN_APPROCHE) {
    return { echec: 'trop_court', detail: `${cw.length} mot(s) : l'approché exige ${MOTS_MIN_APPROCHE}` }
  }
  const mots = motsDuPlat(fort)
  if (!mots.length) return { echec: 'source_vide', detail: 'aucun mot dans la source' }
  const n = cw.length
  const candidats: Array<{ i: number; L: number; score: number }> = []
  for (let L = Math.max(1, n - 2); L <= n + 2; L++) {
    for (let i = 0; i + L <= mots.length; i++) {
      const fenetre = mots.slice(i, i + L).map((m) => m.t)
      const score = 1 - distanceSeule(cw, fenetre) / Math.max(n, L)
      if (score >= SEUIL_APPROCHE - MARGE_AMBIGU) candidats.push({ i, L, score })
    }
  }
  candidats.sort((a, b) => b.score - a.score)
  const meilleur = candidats[0]
  if (!meilleur || meilleur.score < SEUIL_APPROCHE) {
    return { echec: 'introuvable', detail: meilleur
      ? `meilleur candidat à ${meilleur.score.toFixed(2)}, sous le seuil ${SEUIL_APPROCHE}`
      : 'aucun candidat approchant' }
  }
  const disjoint = (c: { i: number; L: number }) =>
    c.i + c.L <= meilleur.i || c.i >= meilleur.i + meilleur.L
  const rival = candidats.find((c) => disjoint(c) && c.score >= meilleur.score - MARGE_AMBIGU)
  if (rival) {
    return { echec: 'ambigu', detail: `deux passages à ${meilleur.score.toFixed(2)} et `
      + `${rival.score.toFixed(2)} — on ne devine pas lequel` }
  }
  const fenetre = mots.slice(meilleur.i, meilleur.i + meilleur.L)
  if (empreinteDeNegation(cw) !== empreinteDeNegation(fenetre.map((m) => m.t))) {
    return { echec: 'negation', detail: 'une négation d\'un seul côté — la réparation changerait le sens' }
  }
  const debut = fenetre[0]!.debut
  const fin = etendreALaPonctuation(source, fenetre[fenetre.length - 1]!.fin, morceau)
  return { debut, fin, texteReel: source.slice(debut, fin), score: meilleur.score, methode: 'approche' }
}

export interface CitationTrouvee {
  morceaux: MorceauTrouve[]
  /** La citation telle que l'élève l'a écrite, les élisions rendues par ` [...] `. */
  citationReelle: string
  /** Le pire des morceaux. */
  score: number
  methode: Methode
  intervalles: Array<[number, number]>
}

/**
 * ⭐ LE POINT D'ENTRÉE. Une citation, élidée ou non, retrouvée morceau par
 * morceau ; le premier morceau qui échoue fait échouer le tout, en le nommant.
 */
export function retrouverCitation(
  source: string | null | undefined, citation: string | null | undefined,
): CitationTrouvee | Echec {
  if (source == null || source.trim() === '') return { echec: 'source_vide', detail: 'source absente' }
  const morceaux = morceauxControlables(citation ?? '')
  if (!morceaux.length) return { echec: 'trop_court', detail: `aucun morceau d'au moins ${PLANCHER} caractères` }
  const fort = plierFort(source)
  const trouves: MorceauTrouve[] = []
  for (const m of morceaux) {
    const r = retrouverMorceau(source, m, fort)
    if ('echec' in r) return { echec: r.echec, detail: `« ${m.length > 40 ? `${m.slice(0, 40)}…` : m} » : ${r.detail}` }
    trouves.push(r)
  }
  const rang: Record<Methode, number> = { exact: 0, normalise: 1, approche: 2 }
  const methode = trouves.reduce<Methode>((acc, t) => (rang[t.methode] > rang[acc] ? t.methode : acc), 'exact')
  return {
    morceaux: trouves,
    citationReelle: trouves.map((t) => t.texteReel).join(' [...] '),
    score: Math.min(...trouves.map((t) => t.score)),
    methode,
    intervalles: trouves.map((t) => [t.debut, t.fin]),
  }
}
