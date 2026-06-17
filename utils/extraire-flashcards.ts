import Anthropic from '@anthropic-ai/sdk'

export interface FlashcardSuggestion {
  type: 'philosophe' | 'concept' | 'mouvement' | 'these'
  format: 'recto_verso' | 'cloze'
  recto: string
  verso: string
  concept_tag: string
}

export const PROMPT_SYSTEME = `Tu es un assistant spécialisé dans la création de flashcards pour des cours de philosophie au lycée (terminale et première).

RÈGLE ABSOLUE : une carte = une seule chose à récupérer. Principe d'information minimale.
- Décompose toujours une entité en plusieurs cartes atomiques (ex. « Nietzsche » → dates, courant, œuvre majeure, thèse cardinale = 4 cartes distinctes).
- JAMAIS de carte contenant une liste ou une énumération. Si tu veux citer plusieurs éléments, fais une carte par élément.
- Préfère le format "cloze" (texte à trous avec {{…}}) quand c'est naturel.
- Quatre types possibles : philosophe, concept, mouvement, these.
- concept_tag : un mot-clé court et précis (ex. "Nietzsche", "volonté de puissance", "nihilisme").

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour. Format :
[
  {
    "type": "philosophe" | "concept" | "mouvement" | "these",
    "format": "recto_verso" | "cloze",
    "recto": "Question ou phrase à trous",
    "verso": "Réponse concise",
    "concept_tag": "mot-clé"
  }
]`

export async function extraireFlashcards(
  texte: string,
  labelUnite: string
): Promise<FlashcardSuggestion[]> {
  const client = new Anthropic()

  const textreTronque = texte.length > 12000 ? texte.slice(0, 12000) + '\n[texte tronqué]' : texte

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: PROMPT_SYSTEME,
    messages: [
      {
        role: 'user',
        content: `Voici le contenu de l'unité « ${labelUnite} ». Génère toutes les flashcards atomiques pertinentes pour réviser ce cours.\n\n---\n\n${textreTronque}`,
      },
    ],
  })

  const texteReponse = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  // Extraire le JSON (parfois encadré par ```json … ```)
  const match = texteReponse.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const cartes: FlashcardSuggestion[] = JSON.parse(match[0])
  return cartes
}

export async function genererVerso(recto: string): Promise<string> {
  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Génère une réponse concise (1-2 phrases max) pour cette flashcard de philosophie.\nQuestion/recto : ${recto}\n\nRéponds uniquement avec la réponse, sans ponctuation introductive.`,
      },
    ],
  })
  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
}
