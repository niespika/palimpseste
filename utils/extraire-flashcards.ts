import Anthropic from '@anthropic-ai/sdk'
import { coutMessage, enregistrerCoutApi } from '@/utils/cout-api'

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

// Prompt dédié aux TEXTES SOURCES (extraits d'œuvre, citations) : on n'en tire
// que l'essentiel (1-2 cartes), à l'inverse d'un cours qu'on décortique.
export const PROMPT_SYSTEME_TEXTE = `Tu es un assistant spécialisé dans la création de flashcards pour des cours de philosophie au lycée (terminale et première), à partir d'un TEXTE SOURCE (extrait d'œuvre, citation, texte primaire).

RÈGLE ABSOLUE : un texte source ne donne qu'1 à 2 cartes, JAMAIS plus. On ne « décortique » pas un texte primaire comme un cours : on retient seulement l'essentiel — la thèse centrale du passage, ou le concept-clé qu'il illustre.
- Une carte = une seule chose à récupérer (information minimale). Pas de liste, pas d'énumération.
- Privilégie la thèse cardinale du passage ; ajoute au plus une seconde carte pour le concept-clé associé si c'est vraiment justifié.
- Préfère le format "cloze" (texte à trous avec {{…}}) quand c'est naturel.
- Quatre types possibles : philosophe, concept, mouvement, these.
- concept_tag : un mot-clé court et précis.

Réponds UNIQUEMENT avec un tableau JSON valide (1 ou 2 éléments MAXIMUM), sans texte autour. Format :
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
  await enregistrerCoutApi('quazian', coutMessage(message.usage))

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

// Génère AU PLUS `max` cartes (défaut 2) pour UN texte source. Le plafond est
// borné côté code (slice) en plus de l'instruction du prompt — le modèle peut
// déborder. Une carte par appel → un texte ne « gonfle » jamais le paquet.
export async function extraireFlashcardsTexte(
  texte: string,
  labelTexte: string,
  max: number = 2
): Promise<FlashcardSuggestion[]> {
  const client = new Anthropic()

  const textreTronque = texte.length > 12000 ? texte.slice(0, 12000) + '\n[texte tronqué]' : texte

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: PROMPT_SYSTEME_TEXTE,
    messages: [
      {
        role: 'user',
        content: `Voici un texte source : « ${labelTexte} ». Génère AU PLUS ${max} flashcard(s) essentielle(s) : la thèse centrale du passage et, éventuellement, le concept-clé associé.\n\n---\n\n${textreTronque}`,
      },
    ],
  })
  await enregistrerCoutApi('quazian', coutMessage(message.usage))

  const texteReponse = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  const match = texteReponse.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const cartes: FlashcardSuggestion[] = JSON.parse(match[0])
  return cartes.slice(0, max)
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
  await enregistrerCoutApi('quazian', coutMessage(message.usage))
  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
}
