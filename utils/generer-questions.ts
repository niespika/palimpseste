import Anthropic from '@anthropic-ai/sdk'
import { REGLE_JSON_TEXTE } from '@/utils/ia-commun'
import { coutMessage, enregistrerCoutApi, normaliserUsage } from '@/utils/cout-api'

const MODELE = 'claude-sonnet-4-6'

export interface QuestionGeneree {
  enonce: string
  options: [string, string, string, string]
  index_correct: number  // 0-3
  concept_tag: string
}

// ⭐ 21/09 — le JSON est GARANTI par l'API (`output_config.format`), plus demandé au
//    modèle : un guillemet non échappé dans une chaîne cassait `JSON.parse` (Nina P.,
//    S3, Vestigia). ⚠️ L'API refuse `minimum`/`maximum` sur un entier et `minItems` > 1.
//    `minItems: 4` étant refusé, c'est `estQuestionValide` qui garde les quatre options.
const SCHEMA_QUESTIONS = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['enonce', 'options', 'index_correct', 'concept_tag'],
    properties: {
      enonce: { type: 'string' },
      options: { type: 'array', items: { type: 'string' } },
      index_correct: { type: 'integer', enum: [0, 1, 2, 3] },
      concept_tag: { type: 'string' },
    },
  },
} as const

// Garde de schéma : une question malformée (options ≠ 4, index hors 0..3, énoncé vide) ne
// doit jamais être insérée (sinon mauvais scoring / LETTRES[index] hors borne à l'affichage).
function estQuestionValide(q: unknown): q is QuestionGeneree {
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

export function construirePromptQuestionsSupplementaires(
  cartes: CarteSource[],
  nb: number,
  dejaPosees: QuestionDejaPosee[],
  consigne: string,
): string {
  const corpus = cartes
    .map((c, i) => `${i + 1}. [${c.type}] ${c.concept_tag} — Q: ${c.recto} / R: ${c.verso}`)
    .join('\n')
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

export const PROMPT_SYSTEME = `Tu es un assistant spécialisé dans la création de QCM pour des cours de philosophie au lycée.

Pour chaque question :
- L'ÉNONCÉ est une vraie question (pas "Qu'est-ce que..." répété à l'infini — varie les formulations).
- 1 BONNE réponse, 3 DISTRACTEURS plausibles.
- Les distracteurs DOIVENT être plausibles : erreurs fréquentes, confusions classiques, auteurs proches, dates proches. JAMAIS des absurdités évidentes.
- Chaque option doit être concise (1 ligne max).
- concept_tag : le concept-clé testé.

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour :
[
  {
    "enonce": "...",
    "options": ["option A", "option B", "option C", "option D"],
    "index_correct": 0,
    "concept_tag": "..."
  }
]

index_correct est l'indice (0-3) de la bonne réponse dans le tableau options.`

// `classeId` : purement comptable (C11a-bis) — un quizz est créé POUR une classe,
// c'est le seul coût Quazian attribuable. Optionnel et sans effet sur la
// génération ; l'appelant `creerQuizz` l'a déjà en main (aucune requête ajoutée).
export async function genererQuestions(
  cartes: CarteSource[],
  nbQuestions: number = 20,
  classeId?: string | null
): Promise<QuestionGeneree[]> {
  const client = new Anthropic()

  // Construire le corpus de cartes en texte
  const corpus = cartes
    .map((c, i) => `${i + 1}. [${c.type}] ${c.concept_tag} — Q: ${c.recto} / R: ${c.verso}`)
    .join('\n')

  const message = await client.messages.create({
    model: MODELE,
    max_tokens: 6000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA_QUESTIONS } },
    system: PROMPT_SYSTEME + REGLE_JSON_TEXTE,
    messages: [
      {
        role: 'user',
        content: `Génère exactement ${nbQuestions} questions QCM à partir de ces flashcards. Chaque question doit tester un concept différent. Les distracteurs doivent être soigneusement choisis — des confusions plausibles pour un lycéen en philosophie.\n\nFLASHCARDS :\n${corpus}`,
      },
    ],
  })
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    classeId, modele: MODELE, tokens: normaliserUsage(message.usage),
  })

  const texte = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const match = texte.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const brut = JSON.parse(match[0]) as unknown
  const questions = (Array.isArray(brut) ? brut : []).filter(estQuestionValide)
  if (questions.length === 0) throw new Error('Aucune question valide générée.')
  return questions.slice(0, nbQuestions)
}

export async function genererQuestionsSupplementaires(
  cartes: CarteSource[],
  nb: number,
  dejaPosees: QuestionDejaPosee[],
  consigne: string,
  classeId?: string | null,
): Promise<QuestionGeneree[]> {
  const client = new Anthropic()
  const message = await client.messages.create({
    model: MODELE,
    max_tokens: 6000,
    output_config: { format: { type: 'json_schema', schema: SCHEMA_QUESTIONS } },
    system: PROMPT_SYSTEME + REGLE_JSON_TEXTE,
    messages: [{ role: 'user', content: construirePromptQuestionsSupplementaires(cartes, nb, dejaPosees, consigne) }],
  })
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    classeId, modele: MODELE, tokens: normaliserUsage(message.usage),
  })

  const texte = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
  const match = texte.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')
  const brut = JSON.parse(match[0]) as unknown
  const questions = (Array.isArray(brut) ? brut : []).filter(estQuestionValide)
  if (questions.length === 0) throw new Error('Aucune question valide générée.')
  return questions.slice(0, nb)
}

export async function regenererQuestion(
  enonce: string,
  bonneReponse: string,
  conceptTag: string
): Promise<QuestionGeneree> {
  const client = new Anthropic()

  const message = await client.messages.create({
    model: MODELE,
    max_tokens: 512,
    output_config: { format: { type: 'json_schema', schema: SCHEMA_QUESTIONS } },
    system: PROMPT_SYSTEME + REGLE_JSON_TEXTE,
    messages: [
      {
        role: 'user',
        content: `Régénère cette question avec de NOUVEAUX distracteurs plus plausibles.\nQuestion : ${enonce}\nBonne réponse : ${bonneReponse}\nConcept : ${conceptTag}\n\nRéponds avec un tableau JSON d'UN seul élément.`,
      },
    ],
  })
  // Non attribué : l'appelant (régénération d'UNE question) ne connaît que l'id de
  // la question — remonter à la classe demanderait une requête, exclue par C11a-bis.
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    modele: MODELE, tokens: normaliserUsage(message.usage),
  })

  const texte = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const match = texte.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const brut = JSON.parse(match[0]) as unknown
  const questions = (Array.isArray(brut) ? brut : []).filter(estQuestionValide)
  if (questions.length === 0) throw new Error('Question régénérée invalide.')
  return questions[0]
}
