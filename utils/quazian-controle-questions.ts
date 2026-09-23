// Pur : aucun import. Appelé par `utils/generer-questions.ts` sur chaque question
// générée, avant qu'elle n'entre en base.
//
// ⛔ 23/09 — mesuré en prod sur le seul quiz passé en classe (T5, 15 questions) :
//    (1) la bonne réponse était STRICTEMENT la plus longue dans 8 questions sur 15
//        (le hasard en donne ~4) ; le modèle recopie le verso de la carte, avec sa
//        justification, et invente des leurres plus courts ;
//    (2) les 4 questions d'application reprenaient l'exemple même de la carte
//        (vélo, 1 + 1 = 2, Noé, Inès) : elles éprouvaient la mémoire de l'exemple ;
//    (3) la question d'Inès avait perdu « blanche » en reformulant la carte : la
//        bonne réponse ne se déduisait plus de l'énoncé.
//    Le prompt le demande désormais ; ce module est ce que le CODE vérifie.

export interface QuestionControlable {
  enonce: string
  options: readonly string[]
  index_correct: number
}

export type Nature = 'connaissance' | 'application'

export type Defaut =
  | { type: 'longueur'; bonne: number; leurre: number; mots: number }
  | { type: 'option_longue'; longueur: number }
  | { type: 'copie_carte'; bonne: number; leurre: number }
  | { type: 'exemple_repris'; reprises: string[] }
  | { type: 'premisse_absente'; manque: string }
  | { type: 'autre_reponse'; choix: number }
  | { type: 'deux_reponses'; autre: number }

// Le seuil est celui de Louis (23/09) : « Un élève ne verra pas une différence de
// 5 caractères. Un ou 2 mots ne seront pas remarqués. Au-delà, peut-être oui. »
// L'écart se compte en MOTS, mais mesuré en caractères puis divisé par la longueur
// moyenne d'un mot des quatre réponses : compter les mots eux-mêmes laisserait
// passer la « proposition » de T5 — 70 caractères contre 44, deux mots de plus
// seulement, mais longs (« susceptible d'être »), et 60 % de plus à l'écran.
// Sur T5 : 5 questions au-delà de 2 mots (Paris, proposition, crédence, Inès,
// « objective et exclusive ») ; vélo (+0,8), cohérence (+1,8) et Reid restent en deçà.
export const MOTS_TOLERES = 2

// Un « : » ou un « — » isolé n'est pas un mot (revue du 23/09 : il faisait basculer
// deux questions sur 312).
function nbMots(s: string) {
  return s.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t)).length
}

/** L'écart de la bonne réponse au plus long leurre, en caractères et en mots. */
export function ecartDeLongueur(q: QuestionControlable) {
  const options = q.options.map((o) => o.trim())
  const bonne = options[q.index_correct].length
  const leurre = Math.max(...options.filter((_, i) => i !== q.index_correct).map((o) => o.length))
  const motMoyen = options.reduce((n, o) => n + o.length, 0) / Math.max(1, options.reduce((n, o) => n + nbMots(o), 0))
  return { bonne, leurre, mots: (bonne - leurre) / motMoyen }
}

/** Le contrôle : la bonne réponse a-t-elle plus de deux mots de plus que tous les leurres ? */
export function defautDeLongueur(q: QuestionControlable): Defaut | null {
  const { bonne, leurre, mots } = ecartDeLongueur(q)
  return mots > MOTS_TOLERES ? { type: 'longueur', bonne, leurre, mots: Math.round(mots) } : null
}

// Le prompt demande 80 caractères au plus ; le code tolère 90. Revue du 23/09 :
// pour égaliser, le modèle allongeait les QUATRE réponses — toutes au-delà de 75
// caractères dans 10 questions sur 45 au banc, contre 3 sur 60 avec l'ancien
// générateur. L'élève les lit sur un téléphone, chacune au-dessus de son curseur.
export const LONGUEUR_MAX_OPTION = 90

export function defautOptionLongue(q: QuestionControlable): Defaut | null {
  const longueur = Math.max(...q.options.map((o) => o.trim().length))
  return longueur > LONGUEUR_MAX_OPTION ? { type: 'option_longue', longueur } : null
}

// ── L'exemple du cours repris dans une application ────────────────────────────

// Heures (« 15 h » = « 15h ») et multiplications (« 15 x 4 » = « 15 × 4 ») s'écrivent
// d'une seule façon avant toute comparaison (revue du 23/09).
function sansAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/(\d)\s*h\b/g, '$1h').replace(/(\d)\s*[×x*]\s*(\d)/g, '$1×$2')
}
function mots(s: string): string[] {
  return sansAccents(s).match(/[a-z0-9]+/g) ?? []
}
/** Pour comparer une citation : casse, accents et espaces ôtés, ponctuation gardée
 *  (« 1 + 1 = 2 » et « 1+1=2 » se rejoignent ; « vélo » et « velo » aussi). */
function compact(s: string) {
  return sansAccents(s).replace(/[’`]/g, "'").replace(/\s+/g, '')
}

// Cinq mots d'affilée communs à l'énoncé et à une carte, dont deux au moins
// porteurs de sens : « je sais faire du vélo », « sous une lumière verte Inès ».
// Les amorces de question se rencontrent partout : « peut-on dire qu'elle »
// (carte de Lina, au banc) n'est fait que de mots vides.
const TAILLE_NGRAMME = 5
const MOTS_VIDES = new Set([
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'qu', 'que', 'qui', 'quoi', 'dont', 'ou', 'et', 'mais',
  'donc', 'or', 'ni', 'car', 'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'a', 'au', 'aux', 'en', 'dans',
  'par', 'pour', 'sur', 'sous', 'avec', 'sans', 'ce', 'cet', 'cette', 'ces', 'c', 'se', 's', 'sa', 'son', 'ses', 'leur',
  'est', 'sont', 'etre', 'peut', 'dire', 't', 'y', 'ne', 'n', 'pas', 'plus', 'si', 'lui', 'quel', 'quelle',
  'sait', 'sais', 'savait', 'savoir', 'allait', 'va',
])
// Les mots qui ouvrent une phrase — une question surtout — portent une majuscule
// sans être des noms propres. La liste double le test « s'écrit-il aussi en
// minuscule ? », qui ne suffit pas sur un petit périmètre de cartes.
const MOTS_OUTILS = new Set([
  'quel', 'quelle', 'quels', 'quelles', 'pourquoi', 'comment', 'combien', 'lequel', 'laquelle', 'lesquels', 'lesquelles',
  'quand', 'qui', 'que', 'quoi', 'dont', 'sous', 'sur', 'pour', 'par', 'dans', 'selon', 'avec', 'sans', 'après', 'avant',
  'chez', 'comme', 'lorsque', 'puisque', 'parce', 'alors', 'ainsi', 'donc', 'mais', 'cette', 'ces', 'cet', 'votre',
  'notre', 'leur', 'leurs', 'tous', 'toutes', 'tout', 'toute', 'elle', 'elles', 'ils', 'nous', 'vous', 'une', 'des',
  'les', 'aux', 'son', 'ses', 'entre', 'depuis', 'pendant', 'malgré', 'contre', 'vers', 'chaque', 'aucun', 'aucune',
  'certains', 'plusieurs', 'non', 'oui', 'cela', 'ceci', 'celui', 'celle', 'même', 'soit', 'imaginons', 'supposons',
])
// Une citation de moins de trois mots (« je sais », « croyance ») est une notion ou
// une tournure du cours, pas un exemple ; une formule chiffrée, elle, en est un.
const CITATION_MIN_MOTS = 3
const FORMULE = /\d+(?:\s*[-+×x*/=]\s*\d+)+/g

function ngrammes(liste: string[], n: number): Set<string> {
  const ensemble = new Set<string>()
  for (let i = 0; i + n <= liste.length; i++) ensemble.add(liste.slice(i, i + n).join(' '))
  return ensemble
}

/**
 * Ce qu'une question d'APPLICATION reprend des cartes : une citation « … » déjà
 * présente dans une carte, un nom propre déjà présent dans une carte (le personnage
 * de l'exemple : Noé, Inès), ou cinq mots d'affilée d'une carte. Vide = cas neuf.
 * ⚠️ Un nom propre de philosophe cité dans une application serait signalé aussi :
 *    la réparation le remplace, rien n'est perdu.
 */
export function exemplesRepris(enonce: string, cartes: readonly { recto: string; verso: string }[]): string[] {
  // Les cartes à trous portent des `{{…}}` : ils ne font pas partie du texte.
  const textes = cartes.map((c) => `${c.recto} ${c.verso}`.replace(/\{\{|\}\}/g, ''))
  const corpusCompact = textes.map(compact).join('\n')
  const reprises: string[] = []

  for (const [, citation] of enonce.matchAll(/[«“"]\s*([^»”"]+?)\s*[»”"]/g)) {
    if (nbMots(citation) >= CITATION_MIN_MOTS && corpusCompact.includes(compact(citation))) reprises.push(`« ${citation} »`)
  }
  for (const [formule] of enonce.matchAll(FORMULE)) {
    const c = compact(formule)
    if (corpusCompact.includes(c) && !reprises.some((r) => compact(r).includes(c))) reprises.push(formule)
  }

  // Nom propre : un mot à majuscule qui ne s'écrit JAMAIS en minuscule, ni dans les
  // cartes ni dans l'énoncé (« Noé » oui ; « Sous », qui ouvre une phrase mais
  // s'écrit « sous » ailleurs, non), et qu'une carte porte déjà — seul : le prénom
  // d'un auteur (« Thomas » Reid, « William » James) ne fait pas un personnage.
  // Ni un verbe à l'inversion (« Savait-il », « Peut-on ») : `(?!-\p{Ll})` ; ni la
  // seconde moitié d'un prénom composé (« Jean-Paul » Sartre) : `(?<!-)`.
  const majuscule = /(?<![\p{L}-])\p{Lu}\p{Ll}{2,}(?!\p{Ll})(?!-\p{Ll})/gu
  const tout = `${textes.join('\n')}\n${enonce}`
  const enMinuscule = new Set(tout.match(/(?<!\p{L})\p{Ll}+/gu) ?? [])
  const estNom = (mot: string) => !enMinuscule.has(mot.toLowerCase()) && !MOTS_OUTILS.has(mot.toLowerCase())
  const nomsDesCartes = new Set(textes.flatMap((t) => [...t.matchAll(new RegExp(`${majuscule.source}(?!\\s+\\p{Lu})`, 'gu'))].map((m) => m[0])))
  for (const [nom] of enonce.matchAll(majuscule)) {
    if (estNom(nom) && nomsDesCartes.has(nom) && !reprises.includes(nom)) reprises.push(nom)
  }

  // Une tournure que PLUSIEURS cartes emploient (« quel type de connaissance
  // illustre ») est la langue du cours, pas un exemple : ne compte qu'un 5-gramme
  // propre à une seule carte.
  const grammesParCarte = textes.map((t) => ngrammes(mots(t), TAILLE_NGRAMME))
  const frequence = new Map<string, number>()
  for (const g of grammesParCarte.flatMap((e) => [...e])) frequence.set(g, (frequence.get(g) ?? 0) + 1)
  const grammesEnonce = ngrammes(mots(enonce), TAILLE_NGRAMME)
  for (const grammes of grammesParCarte) {
    const communs = [...grammes].filter((g) => grammesEnonce.has(g) && frequence.get(g) === 1
      && g.split(' ').filter((m) => !MOTS_VIDES.has(m)).length >= 2)
    if (communs.length > 0) {
      reprises.push(`« …${communs[0]}… »`)
      break
    }
  }
  return reprises
}

// ── La bonne réponse recopiée d'une carte ───────────────────────────────────

// Revue du 23/09 (« avocat de l'élève »), mesuré au banc : la bonne réponse était
// la SEULE option la plus proche d'une carte dans 68 % des questions de l'ancien
// générateur, 64 % du nouveau (le hasard : 25 %). L'élève qui a révisé les cartes
// la reconnaît à sa formulation, sans comprendre. Louis, 23/09 : réécrire quand
// elle reprend au moins trois mots d'affilée de plus qu'aucun leurre.
export const MOTS_COPIES_TOLERES = 2

/** La plus longue suite de mots d'affilée qu'un texte partage avec l'une des cartes. */
function plusLongueCopie(texte: string, cartes: string[][]): number {
  const w = mots(texte)
  let meilleure = 0
  for (const c of cartes) {
    // Plus longue sous-suite commune, ligne par ligne.
    let precedente = new Array<number>(c.length + 1).fill(0)
    for (let i = 1; i <= w.length; i++) {
      const ligne = new Array<number>(c.length + 1).fill(0)
      for (let j = 1; j <= c.length; j++) {
        if (w[i - 1] === c[j - 1]) {
          ligne[j] = precedente[j - 1] + 1
          if (ligne[j] > meilleure) meilleure = ligne[j]
        }
      }
      precedente = ligne
    }
  }
  return meilleure
}

export function defautCopieDeCarte(q: QuestionControlable, cartes: readonly { recto: string; verso: string }[]): Defaut | null {
  const textes = cartes.map((c) => mots(`${c.recto} ${c.verso}`.replace(/\{\{|\}\}/g, '')))
  const copies = q.options.map((o) => plusLongueCopie(o, textes))
  const bonne = copies[q.index_correct]
  const leurre = Math.max(...copies.filter((_, i) => i !== q.index_correct))
  return bonne - leurre > MOTS_COPIES_TOLERES ? { type: 'copie_carte', bonne, leurre } : null
}

export function defautExempleRepris(
  q: QuestionControlable & { nature?: Nature },
  cartes: readonly { recto: string; verso: string }[],
): Defaut | null {
  if (q.nature !== 'application') return null
  const reprises = exemplesRepris(q.enonce, cartes)
  return reprises.length > 0 ? { type: 'exemple_repris', reprises } : null
}

// ── La relecture à l'aveugle ───────────────────────────────────────────────────

export interface Lecture { choix: number; defendable: number; complet: boolean; manque: string }

/**
 * Ce que dit un relecteur qui n'a QUE l'énoncé et les quatre réponses d'une
 * APPLICATION. Mesuré sur les 15 questions de T5 le 23/09 : il désigne la même
 * bonne réponse 15 fois sur 15, et signale un fait manquant dans la question
 * d'Inès (« la couleur réelle de la feuille »).
 * Une question de cours n'est pas relue : au banc, il y réclamait « la position de
 * Chang » (ce que l'élève doit savoir) et y contestait un ordre de conditions
 * propre au cours. Sur 33 applications du banc, `defendable` a trouvé 3 des 7
 * questions à deux réponses défendables relevées à la main (Hugo « par
 * plaisanterie », la romancière, Sadia), pour une alerte discutable.
 */
export function defautsDeLecture(q: QuestionControlable & { nature?: Nature }, lecture: Lecture | undefined): Defaut[] {
  if (!lecture || q.nature !== 'application') return []
  const defauts: Defaut[] = []
  if (lecture.choix !== q.index_correct) defauts.push({ type: 'autre_reponse', choix: lecture.choix })
  else if (lecture.defendable >= 0 && lecture.defendable <= 3 && lecture.defendable !== lecture.choix) {
    defauts.push({ type: 'deux_reponses', autre: lecture.defendable })
  }
  if (!lecture.complet) {
    defauts.push({ type: 'premisse_absente', manque: lecture.manque.trim() || 'un fait de la situation manque à l’énoncé.' })
  }
  return defauts
}

// ── Ce qu'on dit au modèle, et au professeur ─────────────────────────────────

/** La consigne de réparation, une phrase par défaut, adressée au modèle. */
export function decrireDefautPourLeModele(q: QuestionControlable, d: Defaut): string {
  switch (d.type) {
    case 'longueur':
      return `La bonne réponse fait ${d.bonne} caractères, le plus long distracteur ${d.leurre} : environ ${d.mots} mots de plus, un élève la trouve à sa longueur, sans comprendre. Donne aux quatre options la même forme et la même longueur, à un ou deux mots près.`
    case 'option_longue':
      return `Une réponse fait ${d.longueur} caractères : l'élève la lit sur un téléphone. Resserre les quatre réponses, 80 caractères au plus, sans allonger les distracteurs pour les égaliser.`
    case 'copie_carte':
      return `La bonne réponse reprend ${d.bonne} mots d'affilée d'une carte, le distracteur le plus proche d'une carte ${d.leurre} : l'élève qui a révisé les cartes la reconnaît à sa formulation, sans comprendre. Reformule la bonne réponse avec d'autres mots, ou écris les distracteurs dans la langue du cours : des affirmations d'autres cartes, vraies ailleurs, qui ne répondent pas à cette question.`
    case 'exemple_repris':
      return `C'est une application, mais elle reprend un exemple des flashcards (${d.reprises.join(', ')}) : l'élève s'en souvient sans appliquer. Invente un cas neuf, un autre personnage, une autre situation.`
    case 'premisse_absente':
      return `Un relecteur qui n'avait que l'énoncé signale un fait manquant pour établir la bonne réponse : ${d.manque} Écris ce fait dans l'énoncé.`
    case 'deux_reponses':
      return `Un relecteur qui n'avait que l'énoncé juge que « ${q.options[d.autre] ?? '?'} » se défend aussi : rends ce distracteur clairement faux, ou précise l'énoncé.`
    case 'autre_reponse':
      return `Un relecteur qui n'avait que l'énoncé a choisi « ${q.options[d.choix] ?? '?'} » au lieu de la bonne réponse : la question est ambiguë. Rends-la sans ambiguïté.`
  }
}

const LIBELLES: Record<Defaut['type'], string> = {
  longueur: 'bonne réponse plus longue que les autres',
  option_longue: 'réponses trop longues pour un téléphone',
  copie_carte: 'bonne réponse recopiée d’une carte',
  exemple_repris: 'application sur un exemple du cours',
  premisse_absente: 'énoncé incomplet',
  autre_reponse: 'réponse ambiguë',
  deux_reponses: 'deux réponses défendables',
}

/** « 2 questions écartées au contrôle (bonne réponse plus longue que les autres, énoncé incomplet). » */
export function phraseEcartees(ecartees: readonly { defauts: readonly Defaut[] }[]): string {
  if (ecartees.length === 0) return ''
  const motifs = [...new Set(ecartees.flatMap((e) => e.defauts.map((d) => LIBELLES[d.type])))]
  const n = ecartees.length
  return `${n} question${n > 1 ? 's' : ''} écartée${n > 1 ? 's' : ''} au contrôle (${motifs.join(', ')}).`
}
