// ============================================================================
// C5 · L1 — CE QUE LE CODE FAIT *APRÈS* L'APPEL : les intervalles, les
// occurrences, et les deux règles de circulation.
// ----------------------------------------------------------------------------
// « Après l'appel — le code :
//     1. Il CONVERTIT LES NUMÉROS DE PHRASE EN INTERVALLES, dans le système de
//        coordonnées de la `localisation` et de l'`englobant` (`02-` §2.3.3).
//        C'est lui, et lui seul, qui produit les bornes que la référence porte.
//     2. Il RETROUVE LES OCCURRENCES DES CONCEPTS par recherche des formes que
//        le modèle a citées. Le modèle ne localise ni ne compte rien. »
//                                                              — `05-` §1
//
// ⭐⭐ ET POURTANT RIEN DE TOUT CELA NE SE STOCKE — c'est la décision centrale de
//    ce module, et elle est forcée par le format.
//
//    Le `02-` §6 A écrit « trois unités, toutes localisées en INTERVALLES » ; le
//    `05-` §1 demande au code de les produire. Mais LE FORMAT DÉCLARÉ NE CONNAÎT
//    QUE DES NUMÉROS DE PHRASE — `CLES["moment"]` vaut `{m, de, a, fonction,
//    cible, statuts, etiquette}` des deux côtés (`verifie-reference.py` et son
//    port `utils/fabrique/verifie-reference.ts`), et la fixture réelle porte
//    `de: 1, a: 6`. Ajouter une clé `intervalle` déclenche LE REFUS N° 11 —
//    « un champ que le format ne déclare pas » — et la référence n'est même pas
//    soumise au professeur.
//
//    L'intervalle SE DÉRIVE DONC À LA LECTURE, du numéro de phrase et de la
//    SEGMENTATION QUI FAIT FOI, et il ne se stocke jamais : un second domicile
//    de ce que `de`/`a` disent déjà finirait par diverger.
//
// ⚠️ LA SEGMENTATION NE SE RÉÉCRIT PAS, ELLE SE RÉEMPLOIE. `phrasesDuTexte`
//    (`utils/fabrique/verifie-reference.ts`) est celle du pré-relevé mécanique
//    de la Synthèse — « le même découpage, pour que la référence et les copies se
//    comptent en phrases identiques » (`05-` §4.7) —, et son piège est le `\s`,
//    qui n'est pas le même jeu de caractères en Python et en JavaScript. Ce
//    module ne la refait pas : il RETROUVE ses phrases dans le texte d'origine.
//
// Le système de coordonnées : DES INTERVALLES DE CARACTÈRES dans le texte,
// bornes en BASE 0, FIN EXCLUE — celui de `exercices.materiau_source_localisation`
// (`c4_l8_fabrique.sql`) et de l'`englobant` (`02-` §2.3.3).
// ============================================================================

import {
  phrasesDuTexte, plie,
  FONCTIONS_PHRASE, FONCTIONS_MOMENT, STATUTS,
} from '../fabrique/verifie-reference'

/** Un intervalle de caractères : base 0, fin EXCLUE. */
export type Intervalle = readonly [number, number]

// ════════════════════════════════════════════════════════════════════════════
// 1. LES INTERVALLES — dérivés des numéros de phrase, jamais stockés
// ════════════════════════════════════════════════════════════════════════════

/**
 * Où chaque phrase de la segmentation qui fait foi commence et finit dans le
 * texte D'ORIGINE. L'indice 0 du tableau est la phrase n° 1.
 *
 * ⚠️ ON NE REFAIT PAS LA SEGMENTATION : on demande ses phrases à
 *    `phrasesDuTexte`, puis on les RETROUVE, dans l'ordre, à partir d'un curseur
 *    qui n'a jamais reculé. Ce que `rogne` a retiré n'étant que des séparateurs,
 *    la première occurrence au-delà du curseur est forcément la bonne.
 *
 * ⚠️ ET SI UNE PHRASE NE SE RETROUVE PAS, ON NE DEVINE PAS : elle rend `null`,
 *    et l'appelant le dit. Un intervalle faux déplacerait une sélection dans le
 *    texte sans que rien ne le signale.
 */
export function intervallesDesPhrases(texte: string): Array<Intervalle | null> {
  const t = texte ?? ''
  const phrases = phrasesDuTexte(t)
  const out: Array<Intervalle | null> = []
  let curseur = 0
  for (const p of phrases) {
    const i = t.indexOf(p, curseur)
    if (i < 0) { out.push(null); continue }
    out.push([i, i + p.length] as const)
    curseur = i + p.length
  }
  return out
}

/**
 * L'intervalle d'une plage de phrases — `de` et `a` INCLUS, comme les bornes
 * d'un moment (`{de, a}` du `02-` §6 A). Numéros en base 1.
 *
 * Rend `null` dès qu'une borne sort du texte ou qu'une phrase ne s'est pas
 * retrouvée : « le professeur tranche, rien ne se devine ».
 */
export function intervalleDesPhrases(
  texte: string, de: unknown, a: unknown,
): Intervalle | null {
  const bornes = intervallesDesPhrases(texte)
  if (!Number.isInteger(de) || !Number.isInteger(a)) return null
  const d = de as number
  const f = a as number
  if (d < 1 || f < d || f > bornes.length) return null
  const premier = bornes[d - 1]
  const dernier = bornes[f - 1]
  if (premier === null || dernier === null) return null
  return [premier[0], dernier[1]] as const
}

/** Les intervalles des moments d'une référence, dans l'ordre où elle les porte. */
export function intervallesDesMoments(
  texte: string, moments: readonly unknown[],
): Array<{ m: unknown; intervalle: Intervalle | null }> {
  return (moments ?? []).map((brut) => {
    const m = (typeof brut === 'object' && brut !== null ? brut : {}) as Record<string, unknown>
    return { m: m.m, intervalle: intervalleDesPhrases(texte, m.de, m.a) }
  })
}

// ════════════════════════════════════════════════════════════════════════════
// 2. LES OCCURRENCES DES CONCEPTS — retrouvées, jamais déclarées
// ════════════════════════════════════════════════════════════════════════════

/**
 * Le texte replié CARACTÈRE PAR CARACTÈRE, avec, pour chaque caractère du
 * replié, l'intervalle qu'il occupe dans l'ORIGINAL.
 *
 * ⚠️ POURQUOI CE DÉTOUR : `plie()` change les LONGUEURS. Il décompose en NFD et
 *    retire les marques (`é` → `e`), rabat l'eszett sur « ss », les ligatures
 *    sur deux ou trois lettres. Un indice dans le replié n'est donc PAS un
 *    indice dans l'original, et chercher dans l'un pour pointer dans l'autre
 *    décalerait toutes les bornes — silencieusement, sur les textes accentués,
 *    c'est-à-dire sur tous.
 *
 * ⚠️ ET C'EST BIEN `plie()` QU'ON RÉEMPLOIE, pas un repli de plus : c'est lui
 *    que le refus n° 10 utilise pour décider qu'une forme « se retrouve dans le
 *    texte ». Deux replis différents feraient dire au contrôle qu'une forme
 *    existe et à la lecture qu'elle n'est nulle part.
 */
function replieAvecPositions(texte: string): { replie: string; source: Intervalle[] } {
  let replie = ''
  const source: Intervalle[] = []
  let i = 0
  for (const c of texte ?? '') {          // itère par POINT DE CODE
    const p = plie(c)
    for (let k = 0; k < p.length; k++) source.push([i, i + c.length] as const)
    replie += p
    i += c.length
  }
  return { replie, source }
}

/**
 * Les occurrences d'un concept — « par recherche des FORMES que le modèle a
 * citées. Le modèle ne localise ni ne compte rien » (`05-` §1).
 *
 * Rend les intervalles, triés et FUSIONNÉS quand deux formes se recouvrent :
 * « penser » et « pense » se chevauchent, et deux bornes pour un même passage
 * feraient compter deux fois ce que le texte écrit une fois.
 *
 * ⚠️ UNE BORNE NE COUPE JAMAIS UN CARACTÈRE EN DEUX. Un caractère qui se replie
 *    en plusieurs — l'eszett en « ss », une ligature en « fi » — est indivisible
 *    dans l'original : une occurrence qui commencerait ou finirait au milieu de
 *    son repli couvre le caractère entier. L'intervalle rendu CONTIENT donc
 *    toujours la forme, il peut la déborder d'un caractère, et jamais l'inverse.
 */
export function occurrencesDuConcept(
  texte: string, formes: readonly unknown[],
): Intervalle[] {
  const { replie, source } = replieAvecPositions(texte ?? '')
  const trouvees: Array<[number, number]> = []
  for (const brut of formes ?? []) {
    if (typeof brut !== 'string') continue
    const f = plie(brut)
    if (f === '') continue
    let k = replie.indexOf(f)
    while (k >= 0) {
      const debut = source[k]
      const fin = source[k + f.length - 1]
      if (debut && fin) trouvees.push([debut[0], fin[1]])
      k = replie.indexOf(f, k + 1)
    }
  }
  trouvees.sort((x, y) => x[0] - y[0] || x[1] - y[1])
  const fusion: Array<[number, number]> = []
  for (const [d, f] of trouvees) {
    const dernier = fusion[fusion.length - 1]
    if (dernier && d <= dernier[1]) dernier[1] = Math.max(dernier[1], f)
    else fusion.push([d, f])
  }
  return fusion.map(([d, f]) => [d, f] as const)
}

/** Les occurrences de tous les concepts d'une référence, concept par concept. */
export function occurrencesDesConcepts(
  texte: string, concepts: readonly unknown[],
): Array<{ concept: unknown; occurrences: Intervalle[] }> {
  return (concepts ?? []).map((brut) => {
    const c = (typeof brut === 'object' && brut !== null ? brut : {}) as Record<string, unknown>
    const formes = Array.isArray(c.formes) ? c.formes : []
    return { concept: c.concept, occurrences: occurrencesDuConcept(texte, formes) }
  })
}

// ════════════════════════════════════════════════════════════════════════════
// 3. LES DEUX RÈGLES DE CIRCULATION (`05-` §1)
// ════════════════════════════════════════════════════════════════════════════

type Ligne = Record<string, unknown>
const objet = (x: unknown): Ligne =>
  (typeof x === 'object' && x !== null && !Array.isArray(x) ? x as Ligne : {})
const listeDe = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])

/**
 * (a) « LE STATUT PORTÉ PAR UN MOMENT VAUT POUR SES PHRASES SANS Y ÊTRE
 *     RECOPIÉ. Quand un consommateur demande les statuts d'une phrase, le code
 *     rend L'UNION de ceux de la phrase et de ceux de son moment » (`05-` §1 ;
 *     `02-` §6 A).
 *
 * ⚠️ L'union, jamais la recopie : recopier le statut du moment sur ses phrases
 *    ferait un second domicile, et le générateur a pour consigne de NE PAS le
 *    faire (« tu l'écris SUR LE MOMENT et tu ne le mets sur aucune de ses
 *    phrases » — prompt G1). L'écran, lui, continue de n'afficher que ce qui est
 *    déclaré : c'est la LECTURE qui unit, pas la donnée.
 */
export function statutsDeLaPhrase(reference: unknown, n: number): string[] {
  const r = objet(reference)
  const union = new Set<string>()
  for (const brut of listeDe(r.phrases)) {
    const p = objet(brut)
    if (p.n !== n) continue
    for (const s of listeDe(p.statuts)) if (typeof s === 'string') union.add(s)
  }
  for (const brut of listeDe(r.moments)) {
    const m = objet(brut)
    const de = typeof m.de === 'number' ? m.de : null
    const a = typeof m.a === 'number' ? m.a : null
    if (de === null || a === null || n < de || n > a) continue
    for (const s of listeDe(m.statuts)) if (typeof s === 'string') union.add(s)
  }
  return [...union].sort()
}

/**
 * Ce qu'un consommateur DÉCLARE LIRE. Un champ absent veut dire « il lit tout ce
 * que le `02-` déclare » — on ne retranche que ce qu'un consommateur a nommé.
 */
export interface RegleDeLecture {
  fonctionsPhrase?: readonly string[]
  fonctionsMoment?: readonly string[]
  statuts?: readonly string[]
}

export interface ValeursServies {
  /** Les valeurs retenues, par unité. */
  fonctionsPhrase: string[]
  fonctionsMoment: string[]
  statuts: string[]
  /**
   * ⚠️ CE QUI DOIT SE VOIR. Une valeur DÉCLARÉE au `02-` que la règle ne lit pas
   *    est simplement écartée — « une valeur nouvelle est INERTE tant qu'aucune
   *    règle ne la lit ». Une valeur NON DÉCLARÉE au `02-`, elle, CONTINUE
   *    D'ATTEINDRE LE CONSOMMATEUR et lève une alerte : « c'est un vrai défaut,
   *    et il doit se voir » (`05-` §1 ; piège 16).
   */
  alertes: string[]
}

/**
 * (b) « ON NE PASSE À UN CONSOMMATEUR QUE CE QUE SA RÈGLE LIT » (`05-` §1).
 *
 * ⛔ CE N'EST PAS UN SECOND CONTRÔLE DU FORMAT. Le contrôle qui fait foi est
 *    `controleReference` (`utils/fabrique/verifie-reference.ts`), et les quatre
 *    listes fermées n'y sont recopiées qu'UNE FOIS — on les IMPORTE de là,
 *    jamais on ne les réécrit ici (piège 4).
 *
 * ⭐ Cas d'aujourd'hui, celui que le `05-` §1 donne lui-même : « une phrase dont
 *    `relance` est la SEULE fonction ne porte aucun contenu à restituer et n'est
 *    donc pas une unité pour la Synthèse ».
 */
export function valeursServies(
  unite: unknown, regle: RegleDeLecture,
): ValeursServies {
  const u = objet(unite)
  const alertes: string[] = []

  const tri = (
    brut: unknown, declarees: readonly string[], lues: readonly string[] | undefined,
    quoi: string,
  ): string[] => {
    const out: string[] = []
    for (const v of listeDe(brut)) {
      if (typeof v !== 'string') continue
      if (!declarees.includes(v)) {
        // NON DÉCLARÉE : elle PASSE, et elle s'annonce.
        alertes.push(`${quoi} « ${v} » : valeur que le \`02-\` §6 A ne déclare pas — `
          + 'elle atteint quand même le consommateur, et c\'est un vrai défaut.')
        out.push(v)
        continue
      }
      // Déclarée : elle ne passe que si la règle du consommateur la lit.
      if (lues === undefined || lues.includes(v)) out.push(v)
    }
    return out
  }

  return {
    fonctionsPhrase: tri(u.fonctions, FONCTIONS_PHRASE, regle.fonctionsPhrase, 'fonction de phrase'),
    fonctionsMoment: tri(
      u.fonction === undefined ? [] : [u.fonction],
      FONCTIONS_MOMENT, regle.fonctionsMoment, 'fonction de moment'),
    statuts: tri(u.statuts, STATUTS, regle.statuts, 'statut d\'énonciation'),
    alertes,
  }
}
