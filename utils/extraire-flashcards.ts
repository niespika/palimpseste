import Anthropic from '@anthropic-ai/sdk'
import { coutMessage, enregistrerCoutApi, normaliserUsage } from '@/utils/cout-api'

const MODELE = 'claude-sonnet-4-6'

// C11a-bis — attribution : ces trois générations partent d'une UNITÉ Scriptorium
// (ou d'un simple recto), contenu partagé entre classes depuis le Lot 6. Il n'y a
// donc ni élève ni classe à porter : les coûts sont journalisés avec leur modèle
// et leurs tokens, non attribués. C'est structurel, pas un manque d'information.

export interface FlashcardSuggestion {
  type: 'philosophe' | 'concept' | 'mouvement' | 'these'
  format: 'recto_verso' | 'cloze'
  recto: string
  verso: string
  concept_tag: string
}

export const PROMPT_SYSTEME = `Tu es un assistant spécialisé dans la création de flashcards pour des cours de philosophie au lycée (terminale et première).

PLAFOND — RÈGLE ABSOLUE : chaque demande t'indique un nombre MAXIMAL de cartes. Tu ne le dépasses JAMAIS. En rendre moins est toujours permis, et souvent préférable : mieux vaut 6 cartes que l'élève retiendra que 15 qu'il survolera.

TU CHOISIS, TU NE COUVRES PAS TOUT. Le plafond n'est pas un objectif à remplir : c'est une limite. Garde ce qu'un élève DOIT savoir pour composer — la définition d'un concept, la thèse cardinale d'un auteur, une distinction structurante. Écarte les exemples, les transitions, les reformulations, les nuances de second rang, et tout ce qui se déduit d'une carte déjà écrite.

ATOMICITÉ : une carte = une seule chose à récupérer (principe d'information minimale).
- Jamais de carte contenant une liste ou une énumération. Si plusieurs éléments comptent, garde le plus important — l'atomicité n'autorise PAS à multiplier les cartes au-delà du plafond.
- Préfère le format "cloze" (texte à trous avec {{…}}) quand c'est naturel.
- Quatre types possibles : philosophe, concept, mouvement, these.
- concept_tag : un mot-clé court et précis (ex. "Nietzsche", "volonté de puissance", "nihilisme").

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour, et d'AU PLUS le nombre de cartes demandé. Format :
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

/**
 * Cartes d'un COURS (ou d'une sous-section de cours), plafonnées à `max`.
 *
 * ⚠️ Le plafond est porté DEUX fois : dans le prompt (le modèle peut choisir) et
 * dans le code (`slice`, car il déborde). Avant ce garde-fou, la consigne était
 * « génère toutes les flashcards atomiques pertinentes » et rien ne bornait la
 * sortie : un cours de sept pages découpé en 12 sous-sections rendait ~150 cartes
 * à trier à la main. Le calcul de `max` vit dans `utils/quazian-quotas.ts`.
 */
export async function extraireFlashcards(
  texte: string,
  labelUnite: string,
  max: number
): Promise<FlashcardSuggestion[]> {
  if (max <= 0) return []
  const client = new Anthropic()

  const textreTronque = texte.length > 12000 ? texte.slice(0, 12000) + '\n[texte tronqué]' : texte

  const message = await client.messages.create({
    model: MODELE,
    // ~120 tokens par carte, avec de la marge : le budget suit le plafond au lieu
    // d'ouvrir 4096 tokens pour trois cartes.
    max_tokens: Math.min(4096, 512 + max * 160),
    system: PROMPT_SYSTEME,
    messages: [
      {
        role: 'user',
        content: `Voici le contenu de « ${labelUnite} ». Génère AU PLUS ${max} flashcard${max > 1 ? 's' : ''} — les plus essentielles pour réviser ce cours, pas un décorticage exhaustif. Moins que ${max} est acceptable si le texte ne porte pas davantage d'essentiel.\n\n---\n\n${textreTronque}`,
      },
    ],
  })
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    modele: MODELE, tokens: normaliserUsage(message.usage),
  })

  const texteReponse = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  // Extraire le JSON (parfois encadré par ```json … ```)
  const match = texteReponse.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Réponse IA non parseable')

  const cartes: FlashcardSuggestion[] = JSON.parse(match[0])
  return cartes.slice(0, max)
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
    model: MODELE,
    max_tokens: 1024,
    system: PROMPT_SYSTEME_TEXTE,
    messages: [
      {
        role: 'user',
        content: `Voici un texte source : « ${labelTexte} ». Génère AU PLUS ${max} flashcard(s) essentielle(s) : la thèse centrale du passage et, éventuellement, le concept-clé associé.\n\n---\n\n${textreTronque}`,
      },
    ],
  })
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    modele: MODELE, tokens: normaliserUsage(message.usage),
  })

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
    model: MODELE,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Génère une réponse concise (1-2 phrases max) pour cette flashcard de philosophie.\nQuestion/recto : ${recto}\n\nRéponds uniquement avec la réponse, sans ponctuation introductive.`,
      },
    ],
  })
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    modele: MODELE, tokens: normaliserUsage(message.usage),
  })
  return message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')
    .trim()
}
