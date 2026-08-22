import 'server-only'
// Abstraction FOURNISSEUR IA du chat Scriptorium (RAG L5, SPEC §8) : un appel
// est découpé en { système, préfixe CACHEABLE, suffixe dynamique, historique,
// message } et chaque adaptateur le mappe vers son SDK. Le modèle est un simple
// RÉGLAGE (scriptorium_params.rag_modele) : bascule Anthropic ↔ Gemini sans
// redéploiement (routage par préfixe d'id — fournisseurPour).
//  • anthropic : cache_control 1h sur système+préfixe (patron messagesAvecCache
//    généralisé — l'écriture du 1er message d'une heure est relue par toute la
//    classe) ; streaming natif.
//  • gemini : systemInstruction = système ; préfixe en tête du PREMIER tour
//    (position stable → cache IMPLICITE, aucun code de cache — §6.3) ;
//    streaming natif. Id de modèle et champs d'usage : cf. SPEC §15.9.

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'

export interface AppelIA {
  systeme: string                 // prompt système (invariant par classe)
  prefixe: string                 // corpus §6 — CACHEABLE, jamais modifié par tour
  suffixeDynamique: string        // progression élève, date, semaine courante
  historique: { role: 'eleve' | 'assistant'; contenu: string }[]   // fenêtre glissante
  message: string                 // question du tour (déjà balisée par l'appelant)
  maxTokensSortie: number
  // C4-L4 — les IMAGES du dernier tour (photos d'une copie manuscrite). Ajout
  // ADDITIF : `undefined` laisse les deux adaptateurs strictement inchangés.
  // Elles vivent AVANT le texte du tour, dans l'ordre reçu — « transcris dans
  // l'ordre des images » (règle 8 du prompt de transcription).
  // ⚠️ Elles ne sont JAMAIS cachées : le préfixe cacheable est le prompt, qui ne
  //    change pas d'une copie à l'autre ; les photos, elles, changent à chaque
  //    fois. Les mettre dans le préfixe ferait payer une écriture de cache par
  //    copie, pour zéro relecture.
  images?: { base64: string; mime: 'image/jpeg' | 'image/png' | 'image/webp' }[]
}

export interface UsageIA {
  entree: number
  sortie: number
  cacheLecture: number
  cacheEcriture5m: number
  cacheEcriture1h: number
}

export interface FournisseurIA {
  repondreEnStream(modele: string, appel: AppelIA): { flux: AsyncIterable<string>; usage: () => Promise<UsageIA> }
  repondre(modele: string, appel: AppelIA): Promise<{ texte: string; usage: UsageIA }>
}

const USAGE_VIDE: UsageIA = { entree: 0, sortie: 0, cacheLecture: 0, cacheEcriture5m: 0, cacheEcriture1h: 0 }

// ── Anthropic ────────────────────────────────────────────────────────────────

function usageAnthropic(u?: Anthropic.Usage | null): UsageIA {
  if (!u) return { ...USAGE_VIDE }
  const u2 = u as Anthropic.Usage & {
    cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null
  }
  const w5 = u2.cache_creation?.ephemeral_5m_input_tokens ?? 0
  const w1 = u2.cache_creation?.ephemeral_1h_input_tokens ?? 0
  const reste = Math.max(0, (u.cache_creation_input_tokens ?? 0) - w5 - w1)
  return {
    entree: u.input_tokens ?? 0,
    sortie: u.output_tokens ?? 0,
    cacheLecture: u.cache_read_input_tokens ?? 0,
    cacheEcriture5m: w5 + reste,   // détail par TTL absent → écriture prixée 5 min (patron coutMessage)
    cacheEcriture1h: w1,
  }
}

function messagesAnthropic(appel: AppelIA): { system: Anthropic.TextBlockParam[] | undefined; messages: Anthropic.MessageParam[] } {
  // Frontière de cache APRÈS le préfixe (système+corpus partagés par la classe) ;
  // tout ce qui varie (historique, suffixe, question) vit après — §6.3. Les blocs
  // VIDES sont omis (l'API refuse un bloc de texte vide — cas synthèse L7 : tout
  // le prompt tient dans `message`, sans préfixe cacheable).
  const system: Anthropic.TextBlockParam[] = []
  if (appel.systeme.trim()) system.push({ type: 'text', text: appel.systeme })
  if (appel.prefixe.trim()) system.push({ type: 'text', text: appel.prefixe, cache_control: { type: 'ephemeral', ttl: '1h' } })
  const messages: Anthropic.MessageParam[] = appel.historique.map(h => ({
    role: h.role === 'eleve' ? ('user' as const) : ('assistant' as const),
    content: h.contenu,
  }))
  const texteDuTour = [appel.suffixeDynamique, appel.message].filter(t => t.trim()).join('\n\n')
  // Les images d'abord, le texte ensuite : c'est l'ordre du patron du dépôt
  // (`utils/analyse-essai.ts`), et celui que « transcris dans l'ordre des
  // images » suppose. Sans image, le contenu reste une CHAÎNE — byte-identique
  // à ce que ce module envoyait avant l'ajout.
  const content: Anthropic.ContentBlockParam[] | string = appel.images?.length
    ? [
        ...appel.images.map(img => ({
          type: 'image' as const,
          source: { type: 'base64' as const, media_type: img.mime, data: img.base64 },
        })),
        { type: 'text' as const, text: texteDuTour },
      ]
    : texteDuTour
  messages.push({ role: 'user', content })
  return { system: system.length ? system : undefined, messages }
}

const anthropicAdapter: FournisseurIA = {
  repondreEnStream(modele, appel) {
    const client = new Anthropic()
    const { system, messages } = messagesAnthropic(appel)
    const stream = client.messages.stream({
      model: modele, max_tokens: appel.maxTokensSortie, system, messages,
    })
    async function* flux(): AsyncIterable<string> {
      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') yield ev.delta.text
      }
    }
    return {
      flux: flux(),
      usage: async () => usageAnthropic((await stream.finalMessage()).usage),
    }
  },
  async repondre(modele, appel) {
    const client = new Anthropic()
    const { system, messages } = messagesAnthropic(appel)
    const r = await client.messages.create({ model: modele, max_tokens: appel.maxTokensSortie, system, messages })
    const texte = r.content[0]?.type === 'text' ? r.content[0].text : ''
    return { texte, usage: usageAnthropic(r.usage) }
  },
}

// ── Gemini ───────────────────────────────────────────────────────────────────

interface UsageGemini {
  promptTokenCount?: number
  candidatesTokenCount?: number
  cachedContentTokenCount?: number
  thoughtsTokenCount?: number
}

function usageGemini(u?: UsageGemini | null): UsageIA {
  if (!u) return { ...USAGE_VIDE }
  const cacheLecture = u.cachedContentTokenCount ?? 0
  return {
    // promptTokenCount INCLUT les tokens servis du cache → on les retire de l'entrée pleine.
    entree: Math.max(0, (u.promptTokenCount ?? 0) - cacheLecture),
    sortie: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
    cacheLecture,
    cacheEcriture5m: 0,   // cache implicite : aucune écriture facturée (§8.2)
    cacheEcriture1h: 0,
  }
}

type PartGemini = { text: string } | { inlineData: { mimeType: string; data: string } }
interface ContenuGemini { role: 'user' | 'model'; parts: PartGemini[] }

function contenusGemini(appel: AppelIA): ContenuGemini[] {
  // Préfixe en TÊTE DU PREMIER TOUR, position stable → le cache implicite matche
  // le plus long préfixe commun. Trois cas selon la fenêtre d'historique ; un
  // préfixe/suffixe VIDE est simplement omis (cas synthèse L7 : tout dans message).
  const contents: ContenuGemini[] = []
  const hist = appel.historique.map(h => ({
    role: h.role === 'eleve' ? ('user' as const) : ('model' as const),
    parts: [{ text: h.contenu }],
  }))
  const prefixe = appel.prefixe.trim() ? appel.prefixe : null
  const dernier = [appel.suffixeDynamique, appel.message].filter(t => t.trim()).join('\n\n')
  if (hist.length === 0) {
    contents.push({ role: 'user', parts: [{ text: prefixe ? `${prefixe}\n\n${dernier}` : dernier }] })
  } else if (hist[0].role === 'user') {
    contents.push(
      { role: 'user', parts: [{ text: prefixe ? `${prefixe}\n\n${hist[0].parts[0].text}` : hist[0].parts[0].text }] },
      ...hist.slice(1),
    )
    contents.push({ role: 'user', parts: [{ text: dernier }] })
  } else {
    if (prefixe) contents.push({ role: 'user', parts: [{ text: prefixe }] })
    contents.push(...hist)
    contents.push({ role: 'user', parts: [{ text: dernier }] })
  }
  // C4-L4 — les images du DERNIER tour, devant son texte. Elles sont ajoutées
  // ici, après coup, pour que les trois branches ci-dessus restent telles
  // qu'elles étaient : sans image, `contents` est byte-identique à avant.
  if (appel.images?.length) {
    const dernierTour = contents[contents.length - 1]
    dernierTour.parts = [
      ...appel.images.map(img => ({ inlineData: { mimeType: img.mime, data: img.base64 } })),
      ...dernierTour.parts,
    ]
  }
  return contents
}

const geminiAdapter: FournisseurIA = {
  repondreEnStream(modele, appel) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' })
    let usageFinal: UsageIA = { ...USAGE_VIDE }
    let done: (() => void) | null = null
    const fini = new Promise<void>(res => { done = res })
    async function* flux(): AsyncIterable<string> {
      try {
        const stream = await ai.models.generateContentStream({
          model: modele,
          contents: contenusGemini(appel),
          config: { systemInstruction: appel.systeme, maxOutputTokens: appel.maxTokensSortie },
        })
        for await (const chunk of stream) {
          const meta = (chunk as { usageMetadata?: UsageGemini }).usageMetadata
          if (meta) usageFinal = usageGemini(meta)
          const t = chunk.text
          if (t) yield t
        }
      } finally {
        done?.()
      }
    }
    return {
      flux: flux(),
      usage: async () => { await fini; return usageFinal },
    }
  },
  async repondre(modele, appel) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' })
    const r = await ai.models.generateContent({
      model: modele,
      contents: contenusGemini(appel),
      config: { systemInstruction: appel.systeme, maxOutputTokens: appel.maxTokensSortie },
    })
    return { texte: r.text ?? '', usage: usageGemini((r as { usageMetadata?: UsageGemini }).usageMetadata) }
  },
}

/** Routage par préfixe d'id de modèle ('claude-…' → Anthropic, 'gemini-…' → Gemini). */
export function fournisseurPour(modele: string): FournisseurIA {
  if (modele.startsWith('claude')) return anthropicAdapter
  if (modele.startsWith('gemini')) return geminiAdapter
  throw new Error(`Modèle IA inconnu : « ${modele} » (préfixes gérés : claude-, gemini-).`)
}
