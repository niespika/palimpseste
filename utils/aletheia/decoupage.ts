// ============================================================================
// ALETHEIA · E1 — LE TEXTE DÉCOUPÉ EN PHRASES (et en paragraphes quand il en a).
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⭐ LE SEUL DÉCOUPEUR EN PHRASES DE LA PLATEFORME. « Un second découpeur ferait
//    deux domiciles » (`SPEC_Aletheia_Etayage_par_niveau.md` § 3.2, et la leçon du
//    tokeniseur). Tout ce qui, plus tard, montre un passage, ouvre une fenêtre à
//    surligner, compare un surlignage à une pivot ou numérote une synthèse,
//    passe par ici.
//
// ⭐ LES BORNES SONT DES CARACTÈRES, BASE 0, FIN EXCLUE, dans le système de
//    coordonnées de `scriptorium_documents.texte_extrait` — la convention de
//    `exercices.materiau_source_localisation` (`utils/lecture/texte-support.ts`).
//
// ⛔ LE TEXTE NE SE RECOPIE JAMAIS. `texte_extrait` en est le domicile ; la
//    découpe ne porte que des BORNES. Le « nettoyage » (appels de note collés,
//    numéro de section en tête, césures de fin de ligne) n'est donc PAS une
//    réécriture du texte : c'est une liste de MASQUES, des intervalles que le
//    rendu omet. Mesuré sur le livre de prod (E0, § 13 du spec) : 340 appels de
//    note, 33 césures, 1 numéro de section.
//
// ⛔ ET PAS UN OCTET N'EST RETOUCHÉ. Les phrases PARTITIONNENT le texte : la
//    concaténation de `texte.slice(...bornes)` dans l'ordre rend `texte` à
//    l'octet près (garantie testée). Les blancs entre deux phrases sont
//    rattachés à la phrase qui précède.
// ============================================================================

/** Bornes en caractères, base 0, fin exclue. */
export type Bornes = readonly [number, number]

export type TypeMasque = 'appel_note' | 'numero_section' | 'cesure'

/** Un intervalle que le rendu OMET (le texte, lui, reste intact). */
export interface Masque { bornes: Bornes; type: TypeMasque }

export interface PhraseDecoupe {
  /** `s{semaine}-{n}` — n sur trois chiffres, à partir de 1. */
  id: string
  bornes: Bornes
  /** Identifiant du paragraphe qui contient le début de la phrase ; absent si le texte n'a pas de paragraphes. */
  para?: string
}

export interface ParagrapheDecoupe {
  /** `p{semaine}-{n}` — n sur deux chiffres, à partir de 1. */
  id: string
  bornes: Bornes
}

export interface DecoupeSemaine {
  semaine: number
  /** Longueur de `texte_extrait` au moment de la découpe (garde-fou de cohérence). */
  longueur: number
  masques: Masque[]
  /** Vide quand le texte ne porte aucune ligne vide (le cas des PDF extraits — E0). */
  paragraphes: ParagrapheDecoupe[]
  phrases: PhraseDecoupe[]
}

// ── Masques ──────────────────────────────────────────────────────────────────

// Abréviations courantes du corpus philosophique : un point qui les suit ne clôt
// pas une phrase. Sensible à la casse (« M. » n'est pas « m. »).
const ABREVIATIONS = new Set([
  'ch', 'chap', 'p', 'pp', '§', 'cf', 'etc', 'M', 'Mme', 'Mlle', 'MM', 'St', 'Ste', 'vol', 't', 'n',
  'fig', 'éd', 'op', 'cit', 'ibid', 'id', 'loc', 's', 'v', 'trad', 'l', 'll', 'sq', 'sqq', 'a', 'b', 'c',
])

/**
 * Les appels de note COLLÉS au texte par l'extraction PDF : un nombre de un ou
 * deux chiffres, précédé d'une lettre ou d'une ponctuation fermante (avec au plus
 * une espace), et suivi d'une ponctuation, d'un guillemet fermant, d'un tiret ou
 * d'une fin de ligne. « sa raison 5. », « idées modernes 6 » », « aliéniste 3 – ».
 * ⚠️ « les 2 dieux » (suivi d'une lettre) et « en 1872 » (quatre chiffres) ne
 * sont PAS masqués. Un « chapitre 3, où » le serait : accepté, et compté.
 */
const APPEL_NOTE = /(?<=[\p{L}»"”’)\]])( ?)(\d{1,2})(?=[ \t]*(?:[.,;:!?…»"”)\]–—-]|\n|$))/gu

/**
 * Un numéro de section SEUL sur sa ligne : « 19\nOn ne saurait… » — le titre de
 * section que l'extraction PDF laisse en tête (28 semaines sur 29 du livre de prod ;
 * E0 ne l'avait compté qu'une fois : sa mesure exigeait une espace). Cherché sur
 * TOUTES les lignes, pas seulement la première : l'épreuve de version d'E4 a montré
 * qu'un numéro poussé au milieu du texte par un ajout en tête devenait « 14 Représen-
 * tons-nous… » dans la pivot, et cassait le ré-alignement au retour. ⚠️ Un numéro
 * SUIVI de texte sur la même ligne (« 1. Les Lumières, c'est… », les paragraphes
 * numérotés de Kant) n'est PAS un artefact : il reste, rattaché à sa phrase.
 */
const NUMERO_SECTION = /^[ \t]*(\d{1,3})[ \t]*\n/gmu

/**
 * Césure de fin de ligne : « con-\ntemplation ». On ne masque QUE le retour à la
 * ligne : le trait d'union RESTE. « peut-\nêtre » rend donc « peut-être » (juste)
 * et « con-\ntemplation » rend « con-templation » (lisible). Sans dictionnaire on
 * ne sait pas distinguer les deux ; le second est le moindre mal.
 */
const CESURE = /(?<=\p{Ll})-(\n)(?=\p{Ll})/gu

export function repererMasques(texte: string): Masque[] {
  const out: Masque[] = []
  for (const m of texte.matchAll(NUMERO_SECTION)) {
    // Du nombre jusqu'à la fin de sa ligne (retour à la ligne compris).
    const debut = m.index + m[0].indexOf(m[1])
    out.push({ bornes: [debut, m.index + m[0].length], type: 'numero_section' })
  }
  for (const m of texte.matchAll(APPEL_NOTE)) {
    // On masque l'espace qui précède le nombre (s'il y en a une) et le nombre.
    out.push({ bornes: [m.index, m.index + m[0].length], type: 'appel_note' })
  }
  for (const m of texte.matchAll(CESURE)) {
    const debutNl = m.index + m[0].indexOf('\n')
    out.push({ bornes: [debutNl, debutNl + 1], type: 'cesure' })
  }
  return fusionner(out)
}

// Tri + fusion des chevauchements (deux masques qui se touchent restent distincts :
// leurs types diffèrent et le rendu les omet de toute façon).
function fusionner(masques: Masque[]): Masque[] {
  const tri = [...masques].sort((a, b) => a.bornes[0] - b.bornes[0] || a.bornes[1] - b.bornes[1])
  const out: Masque[] = []
  for (const m of tri) {
    const dernier = out[out.length - 1]
    if (dernier && m.bornes[0] < dernier.bornes[1]) {
      out[out.length - 1] = { bornes: [dernier.bornes[0], Math.max(dernier.bornes[1], m.bornes[1])], type: dernier.type }
    } else out.push(m)
  }
  return out
}

/**
 * Copie de travail DE MÊME LONGUEUR où chaque masque est remplacé par des
 * espaces : les bornes calculées dessus valent telles quelles sur le texte.
 */
function neutraliser(texte: string, masques: readonly Masque[]): string {
  if (masques.length === 0) return texte
  let out = ''
  let curseur = 0
  for (const m of masques) {
    out += texte.slice(curseur, m.bornes[0]) + ' '.repeat(m.bornes[1] - m.bornes[0])
    curseur = m.bornes[1]
  }
  return out + texte.slice(curseur)
}

// ── Phrases ──────────────────────────────────────────────────────────────────

// Une fin de phrase : ponctuation forte (répétable : « ?! », « … »), guillemets ou
// parenthèse fermants éventuels, PUIS des blancs et une majuscule, un guillemet
// ou tiret ouvrant, ou une fin de paragraphe (\n\n) — ou la fin du texte.
// Le guillemet fermant français est précédé d'une espace (« savoir. ») : `\s?` l'absorbe.
// Une phrase peut aussi s'ouvrir sur un chiffre (paragraphe numéroté « 5. Mais… »).
const FIN_DE_PHRASE = /[.!?…]+(?:\s?[»"”’)\]])*(?=\s+(?:[\p{Lu}\d«"“(\-—–]|\n)|\s*$)/gu

/**
 * Découpe un texte en phrases. Partitionnante : la concaténation des tranches
 * rend le texte à l'octet près. Les masques (appels de note…) sont neutralisés
 * pour la détection mais restent DANS les tranches.
 */
export function decouperEnPhrases(texte: string, masques: readonly Masque[] = []): Bornes[] {
  if (!texte) return []
  const travail = neutraliser(texte, masques)
  const out: Bornes[] = []
  let debut = 0
  for (const m of travail.matchAll(FIN_DE_PHRASE)) {
    const avant = travail.slice(Math.max(0, m.index - 16), m.index)
    // Abréviation : le dernier mot avant le point est dans la liste.
    const mot = /(?:^|[\s(«"“])([^\s(«"“]+)$/.exec(avant)?.[1]
    if (mot !== undefined && m[0].startsWith('.') && ABREVIATIONS.has(mot)) continue
    // Nombre décimal ou numérotation « 1.2 » : chiffre avant ET après le point.
    if (/\d$/.test(avant) && /^\.\s*\d/.test(travail.slice(m.index, m.index + 3))) continue
    // Paragraphe numéroté (« 5. Mais pour ces Lumières… ») : si tout ce qui précède le
    // point depuis la dernière coupe n'est qu'un nombre, il n'est pas une phrase à lui
    // seul — il se rattache à la phrase qui suit.
    if (m[0].startsWith('.') && /^\s*\d{1,3}$/.test(travail.slice(debut, m.index))) continue
    let fin = m.index + m[0].length
    fin += /^\s*/.exec(travail.slice(fin))![0].length   // les blancs suivent la phrase
    if (fin <= debut) continue
    out.push([debut, fin])
    debut = fin
  }
  if (debut < texte.length) out.push([debut, texte.length])
  return out
}

// ── Paragraphes ──────────────────────────────────────────────────────────────

/**
 * Paragraphes = blocs séparés par au moins une ligne vide. Un texte sans ligne
 * vide (le cas des PDF extraits) rend une liste VIDE, jamais un bloc unique :
 * « pas de paragraphe » n'est pas « un paragraphe ».
 */
export function decouperEnParagraphes(texte: string): Bornes[] {
  if (!texte || !/\n[ \t]*\n/.test(texte)) return []
  const out: Bornes[] = []
  let debut = 0
  for (const m of texte.matchAll(/\n[ \t]*\n\s*/g)) {
    const fin = m.index + m[0].length
    out.push([debut, fin])
    debut = fin
  }
  if (debut < texte.length) out.push([debut, texte.length])
  return out
}

// ── La découpe d'une semaine ─────────────────────────────────────────────────

export function construireDecoupeSemaine(semaine: number, texte: string): DecoupeSemaine {
  const masques = repererMasques(texte)
  const paras = decouperEnParagraphes(texte)
  const paragraphes: ParagrapheDecoupe[] = paras.map((b, i) => ({ id: `p${semaine}-${String(i + 1).padStart(2, '0')}`, bornes: b }))
  const phrases: PhraseDecoupe[] = decouperEnPhrases(texte, masques).map((b, i) => {
    const p = paragraphes.find(q => b[0] >= q.bornes[0] && b[0] < q.bornes[1])
    return { id: `s${semaine}-${String(i + 1).padStart(3, '0')}`, bornes: b, ...(p ? { para: p.id } : {}) }
  })
  return { semaine, longueur: texte.length, masques, paragraphes, phrases }
}

/** Garantie de partition — lève si la découpe ne rend pas le texte à l'octet près. */
export function verifierPartition(texte: string, bornes: readonly Bornes[]): void {
  let curseur = 0
  for (const [d, f] of bornes) {
    if (d !== curseur || f <= d) throw new Error(`Découpe non partitionnante à ${curseur} (bornes ${d}-${f}).`)
    curseur = f
  }
  if (curseur !== texte.length) throw new Error(`Découpe non partitionnante : s'arrête à ${curseur} sur ${texte.length}.`)
}

// ── Rendu d'une tranche ──────────────────────────────────────────────────────

/**
 * Le texte d'une tranche tel qu'on le MONTRE : masques omis, retours à la ligne
 * du PDF et suites de blancs ramenés à une espace, bords élagués. C'est la seule
 * transformation entre la base et l'écran, et elle ne touche pas la base.
 */
export function rendreTranche(texte: string, bornes: Bornes, masques: readonly Masque[] = []): string {
  const d = Math.max(0, Math.min(bornes[0], texte.length))
  const f = Math.max(d, Math.min(bornes[1], texte.length))
  let out = ''
  let curseur = d
  for (const m of masques) {
    if (m.bornes[1] <= d) continue
    if (m.bornes[0] >= f) break
    const md = Math.max(d, m.bornes[0]), mf = Math.min(f, m.bornes[1])
    out += texte.slice(curseur, md)
    curseur = mf
  }
  out += texte.slice(curseur, f)
  return out.replace(/\s+/g, ' ').trim()
}

/** Bornes englobantes d'une suite de phrases contiguës (de `debutId` à `finId` inclus). */
export function bornesDePhrases(phrases: readonly PhraseDecoupe[], debutId: string, finId: string): Bornes | null {
  const i = phrases.findIndex(p => p.id === debutId)
  const j = phrases.findIndex(p => p.id === finId)
  if (i === -1 || j === -1 || j < i) return null
  return [phrases[i].bornes[0], phrases[j].bornes[1]]
}

/** Nombre de mots RENDUS d'une tranche (masques omis) — un mot porte au moins une lettre ou un chiffre. */
export function compterMots(texte: string, bornes: Bornes, masques: readonly Masque[] = []): number {
  return rendreTranche(texte, bornes, masques).split(' ').filter(w => /[\p{L}\p{N}]/u.test(w)).length
}
