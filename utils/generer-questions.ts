import Anthropic from '@anthropic-ai/sdk'
import { REGLE_JSON_TEXTE } from '@/utils/ia-commun'
import { coutMessage, enregistrerCoutApi, normaliserUsage } from '@/utils/cout-api'
import { melangerReponses } from './quazian-melange'
import {
  decrireDefautPourLeModele, defautCopieDeCarte, defautDeLongueur, defautExempleRepris, defautOptionLongue, defautsDeLecture,
  type Defaut, type Lecture, type Nature, type QuestionControlable,
} from './quazian-controle-questions'

const MODELE = 'claude-sonnet-4-6'

export interface QuestionGeneree {
  enonce: string
  options: [string, string, string, string]
  index_correct: number  // 0-3
  concept_tag: string
}

// `nature` ne sert qu'au contrôle (une application se vérifie sur un cas neuf) :
// elle n'entre pas en base, `sansNature` la retire avant de rendre la question.
interface QuestionBrute extends QuestionGeneree {
  nature?: Nature
}

export interface QuestionEcartee { enonce: string; defauts: Defaut[] }

/** Ce que rend une génération : les questions retenues, et ce que le contrôle a fait. */
export interface Generation {
  questions: QuestionGeneree[]
  /** Écartées faute d'avoir passé le contrôle, même après une réécriture. */
  ecartees: QuestionEcartee[]
  /** Réécrites par le modèle, puis retenues. */
  reparees: number
  /** false : la relecture à l'aveugle a échoué, les prémisses n'ont pas été vérifiées. */
  relecture: boolean
}

// ⭐ 21/09 — le JSON est GARANTI par l'API (`output_config.format`), plus demandé au
//    modèle : un guillemet non échappé dans une chaîne cassait `JSON.parse` (Nina P.,
//    S3, Vestigia). ⚠️ L'API refuse `minimum`/`maximum` sur un entier et `minItems` > 1.
//    `minItems: 4` étant refusé, c'est `estQuestionValide` qui garde les quatre options.
// `nature` en tête : le modèle décide s'il met en situation AVANT d'écrire l'énoncé.
const SCHEMA_QUESTIONS = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['nature', 'enonce', 'options', 'index_correct', 'concept_tag'],
    properties: {
      nature: { type: 'string', enum: ['connaissance', 'application'] },
      enonce: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      index_correct: { type: 'integer', enum: [0, 1, 2, 3] },
      concept_tag: { type: 'string' },
    },
  },
} as const

// `complet` est un booléen : lire « Aucun fait manquant. » dans `manque` comme un
// fait manquant écartait la question (revue du 23/09).
const SCHEMA_LECTURES = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['numero', 'choix', 'defendable', 'complet', 'manque'],
    properties: {
      numero: { type: 'integer' },
      choix: { type: 'integer', enum: [0, 1, 2, 3] },
      defendable: { type: 'integer', enum: [-1, 0, 1, 2, 3] },
      complet: { type: 'boolean' },
      manque: { type: 'string' },
    },
  },
} as const

// La réécriture porte le NUMÉRO de la question qu'elle remplace : apparier par
// position faisait glisser tout le lot dès qu'une réécrite était invalide.
const SCHEMA_REECRITURES = {
  type: 'array',
  items: {
    ...SCHEMA_QUESTIONS.items,
    required: ['numero', ...SCHEMA_QUESTIONS.items.required],
    properties: { numero: { type: 'integer' }, ...SCHEMA_QUESTIONS.items.properties },
  },
} as const

// Garde de schéma : une question malformée (options ≠ 4, index hors 0..3, énoncé vide) ne
// doit jamais être insérée (sinon mauvais scoring / LETTRES[index] hors borne à l'affichage).
function estQuestionValide(q: unknown): q is QuestionBrute {
  if (!q || typeof q !== 'object') return false
  const o = q as Record<string, unknown>
  return typeof o.enonce === 'string' && o.enonce.trim().length > 0
    && Array.isArray(o.options) && o.options.length === 4 && o.options.every((x) => typeof x === 'string' && x.trim().length > 0)
    && typeof o.index_correct === 'number' && Number.isInteger(o.index_correct) && o.index_correct >= 0 && o.index_correct <= 3
}

interface CarteSource {
  recto: string
  verso: string
  type: string
  concept_tag: string
}

interface QuestionDejaPosee {
  enonce: string
  concept_tag: string | null
}

export function normaliserDemandeQuestions(nb: unknown, consigne: unknown) {
  const nombre = typeof nb === 'string' && nb.trim() !== '' ? Number(nb) : NaN
  if (!Number.isInteger(nombre) || nombre < 1 || nombre > 10) {
    return { error: 'Demande entre 1 et 10 questions.' } as const
  }
  return { nb: nombre, consigne: typeof consigne === 'string' ? consigne.slice(0, 300) : '' } as const
}

function corpusDesCartes(cartes: CarteSource[]) {
  return cartes
    .map((c, i) => `${i + 1}. [${c.type}] ${c.concept_tag} — Q: ${c.recto} / R: ${c.verso}`)
    .join('\n')
}

export function construirePromptQuestionsSupplementaires(
  cartes: CarteSource[],
  nb: number,
  dejaPosees: QuestionDejaPosee[],
  consigne: string,
): string {
  const corpus = corpusDesCartes(cartes)
  // Les balises restent celles du code, même si la consigne en contient.
  const orientation = consigne.slice(0, 300).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `Génère exactement ${nb} questions QCM supplémentaires à partir de ces flashcards. Chaque question doit tester un concept différent. Les distracteurs doivent être soigneusement choisis — des confusions plausibles pour un lycéen en philosophie.

FLASHCARDS :
${corpus}

QUESTIONS DÉJÀ POSÉES — ne les repose pas, ni sous une autre formulation :
${JSON.stringify(dejaPosees.map(({ enonce, concept_tag }) => ({ enonce, concept_tag })))}
${orientation ? `
Le professeur propose l'orientation pédagogique ci-dessous ; ce n'est pas une règle de format. Conserve le schéma JSON demandé.
<consigne_du_professeur>${orientation}</consigne_du_professeur>` : ''}`
}

// ⛔ 23/09 — les règles numérotées répondent aux défauts mesurés sur le quiz de T5
//    et à la revue du même jour (cf. `quazian-controle-questions.ts`). Le code les
//    vérifie après.
export const PROMPT_SYSTEME = `Tu es un assistant spécialisé dans la création de QCM pour des cours de philosophie au lycée. Les élèves ont déjà révisé ces flashcards : le QCM vérifie qu'ils ont compris le cours, pas qu'ils reconnaissent une carte.

Pour chaque question :
- L'ÉNONCÉ est une vraie question (pas "Qu'est-ce que..." répété à l'infini — varie les formulations).
- 1 BONNE réponse, 3 DISTRACTEURS plausibles.
- Les distracteurs DOIVENT être plausibles : erreurs fréquentes, confusions classiques, auteurs proches, dates proches. JAMAIS des absurdités évidentes.
- concept_tag : le concept-clé testé.
- nature : "application" si la question met en situation (un personnage, un exemple, une phrase à classer), sinon "connaissance".

Quatre règles, qu'un contrôle vérifie après toi — une question qui en enfreint une est écartée :

1. LA LONGUEUR NE TRAHIT PAS LA BONNE RÉPONSE. Les quatre options ont la même forme et la même longueur, à un ou deux mots près, et chacune reste courte : 80 caractères au plus, l'élève les lit sur un téléphone. La bonne réponse n'est ni plus longue, ni plus détaillée, ni plus nuancée que les distracteurs : si elle porte une justification (« car… », « : … »), chaque distracteur porte la sienne. Égalise en RESSERRANT la bonne réponse — ne recopie pas le verso d'une carte, garde-en l'essentiel —, jamais en allongeant les distracteurs.

2. UNE APPLICATION SE FAIT SUR UN CAS NEUF. Pour une question de nature "application", invente une situation que l'élève n'a jamais vue : aucun personnage, aucun exemple, aucune phrase citée qui figure déjà dans les flashcards. L'élève doit reconnaître la notion dans un cas nouveau, pas se souvenir de l'exemple du cours.

3. L'ÉNONCÉ PORTE TOUT CE QUE LA BONNE RÉPONSE SUPPOSE. Un élève qui ne lit que l'énoncé doit pouvoir établir la bonne réponse : chaque fait de la situation dont elle dépend est écrit dans l'énoncé (si la bonne réponse dit qu'une croyance est fausse, l'énoncé dit ce qui la rend fausse). En reformulant une carte, n'en retire aucun fait.

4. LA FORMULATION DU COURS NE TRAHIT PAS LA BONNE RÉPONSE. Les élèves connaissent les phrases des flashcards : si la bonne réponse en recopie une et que les distracteurs sont inventés, ils la reconnaissent sans comprendre. Reformule la bonne réponse avec tes mots, ou écris les distracteurs dans la langue du cours — des affirmations d'autres cartes, vraies ailleurs, qui ne répondent pas à cette question.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour :
[
  {
    "nature": "connaissance",
    "enonce": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "index_correct": 0,
    "concept_tag": "..."
  }
]

index_correct est l'indice (0-3) de la bonne réponse dans le tableau options.`

// La relecture à l'aveugle : un second appel qui ne voit QUE l'énoncé et les
// quatre réponses — ni les cartes, ni la bonne réponse — des APPLICATIONS (cf.
// `defautsDeLecture`). Il trouve la question d'Inès sans « blanche » (mesuré sur
// T5 le 23/09) ; une règle du prompt seule ne se vérifie pas.
const PROMPT_RELECTURE = `Tu relis un QCM de philosophie de lycée AVANT qu'il soit donné aux élèves. Pour chaque question, réponds comme un élève qui ne dispose QUE de l'énoncé et des quatre réponses.
- numero : le numéro de la question.
- choix : l'indice (0-3) de la réponse que l'énoncé permet d'établir.
- defendable : l'indice d'une AUTRE réponse qui se défend aussi en ne lisant que l'énoncé (vraie telle qu'écrite, ou établie par l'énoncé) ; -1 s'il n'y en a pas.
- complet : false si la bonne réponse suppose un fait qui N'EST PAS écrit dans l'énoncé (une donnée de la situation que l'élève ne peut pas connaître) ; true sinon. Les connaissances de cours ne comptent pas : seulement les faits de la situation décrite.
- manque : si complet est false, ce fait manquant en une phrase ; sinon, chaîne vide.`

async function appeler(
  client: Anthropic, system: string, contenu: string, maxTokens: number,
  schema: typeof SCHEMA_QUESTIONS | typeof SCHEMA_LECTURES | typeof SCHEMA_REECRITURES, classeId?: string | null,
): Promise<string> {
  const message = await client.messages.create({
    model: MODELE,
    max_tokens: maxTokens,
    output_config: { format: { type: 'json_schema', schema } },
    system: system + REGLE_JSON_TEXTE,
    messages: [{ role: 'user', content: contenu }],
  })
  // `classeId` : purement comptable (C11a-bis) ; absent pour la régénération d'UNE
  // question, dont l'appelant ne connaît que l'id — remonter à la classe demanderait
  // une requête, exclue par C11a-bis.
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    ...(classeId ? { classeId } : {}), modele: MODELE, tokens: normaliserUsage(message.usage),
  })
  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
}

function lireTableau(texte: string): unknown[] {
  const match = texte.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')
  const brut = JSON.parse(match[0]) as unknown
  return Array.isArray(brut) ? brut : []
}

// Remêlées dès la lecture : le relecteur à l'aveugle ne doit pas voir la bonne
// réponse toujours à la même place (le modèle la met en tête, cf. quazian-melange).
function lireQuestions(texte: string): QuestionBrute[] {
  return lireTableau(texte).filter(estQuestionValide).map((q) => melangerReponses(q))
}

function sansNature({ enonce, options, index_correct, concept_tag }: QuestionBrute): QuestionGeneree {
  return { enonce, options, index_correct, concept_tag }
}

function texteARelire(questions: QuestionControlable[]) {
  return questions
    .map((q, i) => `${i + 1}. ${q.enonce}\n${q.options.map((o, j) => `   ${j}) ${o}`).join('\n')}`)
    .join('\n\n')
}

/**
 * Les lectures d'un relecteur qui n'a que l'énoncé et les réponses, par position.
 * null si l'appel échoue : la génération ne tombe pas pour autant, les prémisses
 * restent seulement non vérifiées (et `Generation.relecture` le dit). Un numéro
 * répété garde sa première lecture ; un numéro oublié rend la relecture incomplète.
 */
async function relireALAveugle(client: Anthropic, questions: QuestionControlable[], classeId?: string | null) {
  const lectures = new Map<number, Lecture>()
  if (questions.length === 0) return lectures
  try {
    const texte = await appeler(client, PROMPT_RELECTURE, texteARelire(questions), 300 + 150 * questions.length, SCHEMA_LECTURES, classeId)
    for (const l of lireTableau(texte)) {
      const o = (l ?? {}) as Record<string, unknown>
      const i = typeof o.numero === 'number' ? o.numero - 1 : -1
      if (Number.isInteger(i) && i >= 0 && i < questions.length && !lectures.has(i) && typeof o.choix === 'number'
        && typeof o.defendable === 'number' && typeof o.complet === 'boolean' && typeof o.manque === 'string') {
        lectures.set(i, { choix: o.choix, defendable: o.defendable, complet: o.complet, manque: o.manque })
      }
    }
    return lectures
  } catch (e) {
    console.error('[quazian] relecture à l’aveugle :', e)
    return null
  }
}

async function defautsDe(client: Anthropic, questions: QuestionBrute[], cartes: CarteSource[], classeId?: string | null) {
  const applications = questions.filter((q) => q.nature === 'application')
  const lectures = await relireALAveugle(client, applications, classeId)
  const defauts = questions.map((q) => [
    defautDeLongueur(q), defautOptionLongue(q), defautCopieDeCarte(q, cartes), defautExempleRepris(q, cartes),
    ...defautsDeLecture(q, lectures?.get(applications.indexOf(q))),
  ].filter((d): d is Defaut => d !== null))
  return { defauts, relecture: lectures !== null && lectures.size === applications.length }
}

/** Ce que la réécriture doit savoir du lot : la consigne du professeur, et les
 *  questions qui restent au quiz (déjà posées, ou gardées de ce lot). */
interface Contexte { consigne: string; autres: string[] }

function promptReparation(cartes: CarteSource[], aReparer: { q: QuestionBrute; defauts: Defaut[] }[], contexte: Contexte) {
  const liste = aReparer.map(({ q, defauts }, i) => {
    const question = JSON.stringify({ nature: q.nature ?? 'connaissance', enonce: q.enonce, options: q.options, bonne_reponse: q.options[q.index_correct], concept_tag: q.concept_tag })
    return `${i + 1}. ${question}\n${defauts.map((d) => `   Défaut : ${decrireDefautPourLeModele(q, d)}`).join('\n')}`
  })
  const orientation = contexte.consigne.slice(0, 300).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `Un contrôle a écarté ces questions de QCM. Réécris chacune sur la même notion (même concept_tag) et de même nature, en corrigeant le défaut signalé et en respectant toutes les règles. Rends exactement ${aReparer.length} question${aReparer.length > 1 ? 's' : ''} ; numero est le numéro de la question réécrite.

FLASHCARDS :
${corpusDesCartes(cartes)}

QUESTIONS DÉJÀ DANS LE QUIZ — ne les repose pas, ni sous une autre formulation :
${JSON.stringify(contexte.autres)}
${orientation ? `
Le professeur propose l'orientation pédagogique ci-dessous ; ce n'est pas une règle de format. Conserve le schéma JSON demandé.
<consigne_du_professeur>${orientation}</consigne_du_professeur>
` : ''}
QUESTIONS À RÉÉCRIRE :
${liste.join('\n\n')}`
}

/**
 * Les réécrites, rangées par le numéro de la question qu'elles remplacent. Une
 * application le reste et la notion ne change pas : sans quoi une réécrite
 * étiquetée « connaissance » échappait au contrôle de l'exemple et des prémisses.
 */
function lireReecrites(texte: string, aReparer: { q: QuestionBrute }[]): (QuestionBrute | undefined)[] {
  const reecrites: (QuestionBrute | undefined)[] = aReparer.map(() => undefined)
  for (const brute of lireTableau(texte)) {
    const numero = (brute as { numero?: unknown } | null)?.numero
    const k = typeof numero === 'number' ? numero - 1 : -1
    if (!Number.isInteger(k) || k < 0 || k >= aReparer.length || reecrites[k] || !estQuestionValide(brute)) continue
    const origine = aReparer[k].q
    reecrites[k] = melangerReponses({
      ...brute,
      nature: origine.nature === 'application' ? 'application' : brute.nature,
      concept_tag: origine.concept_tag,
    })
  }
  return reecrites
}

/**
 * Le contrôle, puis UNE réécriture de ce qui échoue, puis le contrôle à nouveau :
 * ce qui échoue encore est écarté, jamais inséré. L'ordre des questions est gardé,
 * une question réécrite reprend la place de celle qu'elle remplace.
 */
async function controlerEtReparer(
  client: Anthropic, questions: QuestionBrute[], nb: number, cartes: CarteSource[], contexte: Contexte, classeId?: string | null,
): Promise<Generation> {
  const premier = await defautsDe(client, questions, cartes, classeId)
  const saines = questions.filter((_, i) => premier.defauts[i].length === 0)
  // Assez de questions saines grâce à la marge : pas de réécriture.
  if (saines.length >= nb) {
    return { questions: saines.slice(0, nb).map(sansNature), ecartees: [], reparees: 0, relecture: premier.relecture }
  }
  const aReparer = questions
    .map((q, i) => ({ q, i, defauts: premier.defauts[i] }))
    .filter((x) => x.defauts.length > 0)

  const gardees = questions.filter((_, i) => premier.defauts[i].length === 0).map((q) => q.enonce)
  let reecrites: (QuestionBrute | undefined)[] = aReparer.map(() => undefined)
  try {
    reecrites = lireReecrites(await appeler(
      client, PROMPT_SYSTEME,
      promptReparation(cartes, aReparer, { consigne: contexte.consigne, autres: [...contexte.autres, ...gardees] }),
      400 + 450 * aReparer.length, SCHEMA_REECRITURES, classeId,
    ), aReparer)
  } catch (e) {
    console.error('[quazian] réécriture des questions écartées :', e)
  }
  const aRelire = reecrites.filter((q): q is QuestionBrute => q !== undefined)
  const second = await defautsDe(client, aRelire, cartes, classeId)
  const defautsReecrite = new Map(aRelire.map((q, j) => [q, second.defauts[j]]))

  const remplacement = new Map<number, QuestionBrute>()
  const ecartees: QuestionEcartee[] = []
  aReparer.forEach(({ q, i, defauts }, k) => {
    const nouvelle = reecrites[k]
    const restants = nouvelle ? defautsReecrite.get(nouvelle) ?? [] : defauts
    if (nouvelle && restants.length === 0) remplacement.set(i, nouvelle)
    // L'énoncé rapporté est celui qui porte les défauts rapportés (revue du 23/09).
    else ecartees.push({ enonce: nouvelle?.enonce ?? q.enonce, defauts: restants })
  })
  const retenues = questions.flatMap((q, i) => {
    if (premier.defauts[i].length === 0) return [q]
    const r = remplacement.get(i)
    return r ? [r] : []
  })
  return {
    questions: retenues.slice(0, nb).map(sansNature),
    // Le professeur n'entend parler des écartées que s'il lui en manque.
    ecartees: retenues.length >= nb ? [] : ecartees,
    reparees: remplacement.size,
    relecture: premier.relecture && second.relecture,
  }
}

/**
 * Au banc du 23/09, une question sur six ne passait pas le contrôle, même
 * réécrite : on en demande 20 % de plus, et on garde les premières retenues.
 */
export function avecMarge(nb: number) {
  return nb + Math.ceil(nb / 5)
}

/** Tout le lot a échoué au contrôle : l'appelant le dit au professeur, motifs à l'appui. */
export class AucuneQuestionRetenue extends Error {
  constructor(public readonly ecartees: QuestionEcartee[]) {
    super('Aucune question n’a passé le contrôle.')
  }
}

async function generer(
  contenu: string, nb: number, cartes: CarteSource[], contexte: Contexte, classeId?: string | null,
): Promise<Generation> {
  const client = new Anthropic()
  const demandees = avecMarge(nb)
  // ~150 jetons par question : 6 000 fixes tronquaient au-delà d'une quarantaine
  // (le formulaire en permet 60). 16 000 reste sous le seuil d'un appel sans flux.
  const maxTokens = Math.min(16000, 1000 + 200 * demandees)
  const questions = lireQuestions(await appeler(client, PROMPT_SYSTEME, contenu, maxTokens, SCHEMA_QUESTIONS, classeId)).slice(0, demandees)
  if (questions.length === 0) throw new Error('Aucune question valide générée.')
  const generation = await controlerEtReparer(client, questions, nb, cartes, contexte, classeId)
  if (generation.questions.length === 0) throw new AucuneQuestionRetenue(generation.ecartees)
  if (generation.ecartees.length > 0) {
    console.info('[quazian] questions écartées au contrôle :', JSON.stringify(generation.ecartees.map((e) => e.defauts.map((d) => d.type))))
  }
  return generation
}

// `classeId` : purement comptable (C11a-bis) — un quizz est créé POUR une classe,
// c'est le seul coût Quazian attribuable. Optionnel et sans effet sur la
// génération ; l'appelant `creerQuizz` l'a déjà en main (aucune requête ajoutée).
export async function genererQuestions(
  cartes: CarteSource[],
  nbQuestions: number = 20,
  classeId?: string | null
): Promise<Generation> {
  return generer(
    `Génère exactement ${avecMarge(nbQuestions)} questions QCM à partir de ces flashcards. Chaque question doit tester un concept différent. Les distracteurs doivent être soigneusement choisis — des confusions plausibles pour un lycéen en philosophie.\n\nFLASHCARDS :\n${corpusDesCartes(cartes)}`,
    nbQuestions, cartes, { consigne: '', autres: [] }, classeId,
  )
}

export async function genererQuestionsSupplementaires(
  cartes: CarteSource[],
  nb: number,
  dejaPosees: QuestionDejaPosee[],
  consigne: string,
  classeId?: string | null,
): Promise<Generation> {
  return generer(
    construirePromptQuestionsSupplementaires(cartes, avecMarge(nb), dejaPosees, consigne), nb, cartes,
    { consigne, autres: dejaPosees.map((q) => q.enonce) }, classeId,
  )
}

// « Nouveaux distracteurs » : l'énoncé et la bonne réponse sont ceux du professeur.
// ⛔ Revue du 23/09 : le modèle, poussé par la règle de longueur, raccourcissait la
//    bonne réponse, et l'action enregistrait sa version. Seuls ses TROIS LEURRES
//    sont donc gardés ; la bonne réponse est remise telle que le professeur l'a
//    écrite, et le mélange la replace. Une seconde demande si elle dépasse encore
//    de plus de deux mots, puis la question telle quelle (le professeur la voit).
export async function regenererQuestion(
  enonce: string,
  bonneReponse: string,
  conceptTag: string
): Promise<QuestionGeneree> {
  const client = new Anthropic()
  const demande = `Régénère cette question avec de NOUVEAUX distracteurs plus plausibles. La bonne réponse est celle du professeur : recopie-la mot pour mot, sans la raccourcir, même si elle dépasse 80 caractères.\nQuestion : ${enonce}\nBonne réponse : ${bonneReponse}\nConcept : ${conceptTag}\n\nLes trois distracteurs ont la forme de la bonne réponse et sa longueur, à un ou deux mots près (${bonneReponse.trim().length} caractères).\n\nRéponds avec un tableau JSON d'UN seul élément.`
  const tirer = async (contenu: string): Promise<QuestionBrute | undefined> => {
    const q = lireQuestions(await appeler(client, PROMPT_SYSTEME, contenu, 512, SCHEMA_QUESTIONS))[0]
    if (!q) return undefined
    const leurres = q.options.filter((_, i) => i !== q.index_correct) as [string, string, string]
    return melangerReponses({ enonce, options: [bonneReponse, ...leurres], index_correct: 0, concept_tag: conceptTag })
  }
  const premiere = await tirer(demande)
  if (!premiere) throw new Error('Question régénérée invalide.')
  const defaut = defautDeLongueur(premiere)
  if (!defaut) return sansNature(premiere)
  const seconde = await tirer(`${demande}\n\n${decrireDefautPourLeModele(premiere, defaut)}`)
  return sansNature(seconde ?? premiere)
}
