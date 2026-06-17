import Anthropic from '@anthropic-ai/sdk'

export interface QuestionGeneree {
  enonce: string
  options: [string, string, string, string]
  index_correct: number  // 0-3
  concept_tag: string
}

interface CarteSource {
  recto: string
  verso: string
  type: string
  concept_tag: string
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

export async function genererQuestions(
  cartes: CarteSource[],
  nbQuestions: number = 20
): Promise<QuestionGeneree[]> {
  const client = new Anthropic()

  // Construire le corpus de cartes en texte
  const corpus = cartes
    .map((c, i) => `${i + 1}. [${c.type}] ${c.concept_tag} — Q: ${c.recto} / R: ${c.verso}`)
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6000,
    system: PROMPT_SYSTEME,
    messages: [
      {
        role: 'user',
        content: `Génère exactement ${nbQuestions} questions QCM à partir de ces flashcards. Chaque question doit tester un concept différent. Les distracteurs doivent être soigneusement choisis — des confusions plausibles pour un lycéen en philosophie.\n\nFLASHCARDS :\n${corpus}`,
      },
    ],
  })

  const texte = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const match = texte.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const questions: QuestionGeneree[] = JSON.parse(match[0])
  return questions.slice(0, nbQuestions)
}

export async function regenererQuestion(
  enonce: string,
  bonneReponse: string,
  conceptTag: string
): Promise<QuestionGeneree> {
  const client = new Anthropic()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: PROMPT_SYSTEME,
    messages: [
      {
        role: 'user',
        content: `Régénère cette question avec de NOUVEAUX distracteurs plus plausibles.\nQuestion : ${enonce}\nBonne réponse : ${bonneReponse}\nConcept : ${conceptTag}\n\nRéponds avec un tableau JSON d'UN seul élément.`,
      },
    ],
  })

  const texte = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const match = texte.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const questions: QuestionGeneree[] = JSON.parse(match[0])
  return questions[0]
}
