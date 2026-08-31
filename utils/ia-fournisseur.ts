import 'server-only'
// Abstraction FOURNISSEUR IA du chat Scriptorium (RAG L5, SPEC §8) : un appel
// est découpé en { système, préfixe CACHEABLE, suffixe dynamique, historique,
// message } et chaque adaptateur le mappe vers son SDK. Le modèle est un simple
// RÉGLAGE (scriptorium_params.rag_modele) : bascule entre fournisseurs sans
// redéploiement (routage par préfixe d'id — fournisseurPour).
//  • anthropic : cache_control 1h sur système+préfixe (patron messagesAvecCache
//    généralisé — l'écriture du 1er message d'une heure est relue par toute la
//    classe) ; streaming natif.
//  • gemini : systemInstruction = système ; préfixe en tête du PREMIER tour
//    (position stable → cache IMPLICITE, aucun code de cache — §6.3) ;
//    streaming natif. Id de modèle et champs d'usage : cf. SPEC §15.9.
//  • openai : mise en cache AUTOMATIQUE du préfixe commun (rien à marquer) ;
//    écrit en `fetch`, sans SDK, et SANS streaming — voir son en-tête.

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
  /**
   * ⭐ `tronquee` — LE MODÈLE A-T-IL ÉTÉ COUPÉ AU PLAFOND DE SORTIE ?
   *
   * ⛔⛔ SANS CE DRAPEAU, UNE TRONCATURE EST INDISCERNABLE D'UNE SORTIE MAL
   *    FORMÉE, et la différence commande la réparation : une sortie mal formée
   *    se relance à l'identique, une sortie TRONQUÉE relancée à l'identique
   *    retombe sur le même plafond, à l'infini.
   *    *Mesuré en production le 31/08 : sur le dépôt `c1431dc5`, deux appels
   *    `p1 / structure` à exactement 2 000 jetons, aucun appel `p2`, et la
   *    compétence `structure` absente des mesures — le job marqué `abouti`.*
   *
   * Champ OPTIONNEL : un adaptateur qui ne le sert pas laisse le comportement
   * d'avant, à l'octet près.
   */
  repondre(modele: string, appel: AppelIA): Promise<{ texte: string; usage: UsageIA; tronquee?: boolean }>
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
    // `stop_reason: 'max_tokens'` — le modèle avait encore à dire, le plafond l'a
    // coupé. C'est le SEUL témoin fiable : une sortie tronquée ressemble en tout
    // point à une sortie mal formée, et elle ne se répare pas de la même façon.
    return { texte, usage: usageAnthropic(r.usage), tronquee: r.stop_reason === 'max_tokens' }
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
    // Même témoin, sous son nom Gemini : `finishReason: 'MAX_TOKENS'`.
    const fin = (r as { candidates?: Array<{ finishReason?: string }> })
      .candidates?.[0]?.finishReason
    return {
      texte: r.text ?? '',
      usage: usageGemini((r as { usageMetadata?: UsageGemini }).usageMetadata),
      tronquee: fin === 'MAX_TOKENS',
    }
  },
}


// ── OpenAI ───────────────────────────────────────────────────────────────────
//
// ⭐⭐ 31/08/2026 — LE TROISIÈME ADAPTATEUR, ET IL EST ÉCRIT EN `fetch`.
//
// ⛔ PAS DE SDK, ET C'EST UN CHOIX MOTIVÉ. Les deux autres adaptateurs passent
//    par le SDK de leur fournisseur ; celui-ci n'en a pas besoin — la surface
//    employée est UNE route (`/v1/chat/completions`) et QUATRE champs d'usage.
//    Ajouter une dépendance le jour de la rentrée, c'est un `package-lock.json`
//    qui bouge et un déploiement qui reconstruit, pour un adaptateur qui ne sert
//    encore qu'au BANC. *Le jour où il sert en production, le passage au SDK est
//    un remplacement local.*
//
// ⚠️ LA MISE EN CACHE EST AUTOMATIQUE, et il n'y a RIEN À MARQUER — c'est la
//    différence de fond avec Anthropic, dont le `cache_control` est explicite.
//    OpenAI met en cache le PRÉFIXE COMMUN des requêtes au-delà de 1 024 jetons
//    (famille GPT-5.6 ; 2 048 avant elle). D'où la forme ci-dessous : le
//    `prefixe` cacheable part EN PREMIER dans le message système, et rien d'autre
//    n'a à être fait pour que le cache morde.
//    ⛔ C'est aussi pourquoi il n'y a pas de `cache_control` à poser : en poser
//       un n'est pas « plus sûr », c'est une erreur d'API.

interface UsageOpenAI {
  prompt_tokens?: number
  completion_tokens?: number
  prompt_tokens_details?: { cached_tokens?: number }
}

function usageOpenAI(u?: UsageOpenAI | null): UsageIA {
  if (!u) return { ...USAGE_VIDE }
  const cacheLecture = u.prompt_tokens_details?.cached_tokens ?? 0
  return {
    // ⚠️ `prompt_tokens` INCLUT les jetons servis du cache — patron Gemini, et
    //    l'inverse d'Anthropic dont `input_tokens` les EXCLUT déjà. Les compter
    //    deux fois gonflerait la facture d'un tiers, en silence.
    entree: Math.max(0, (u.prompt_tokens ?? 0) - cacheLecture),
    sortie: u.completion_tokens ?? 0,
    cacheLecture,
    // ⚠️ L'ÉCRITURE DE CACHE N'EST PAS REMONTÉE PAR L'API. Elle est FACTURÉE sur
    //    la famille GPT-5.6 (1,25× l'entrée), mais aucun champ d'usage ne la
    //    porte. On rend 0 plutôt qu'une estimation : un coût inventé est pire
    //    qu'un coût manquant — celui-ci se voit à la facture, l'autre non.
    //    *Porté au relevé de séance.*
    cacheEcriture5m: 0,
    cacheEcriture1h: 0,
  }
}

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

function messagesOpenAI(appel: AppelIA): Array<{ role: string; content: unknown }> {
  // ⭐ LE PRÉFIXE CACHEABLE EN TÊTE DU SYSTÈME : c'est LA condition du cache
  //    automatique, qui travaille sur le préfixe commun des requêtes.
  const systeme = [appel.prefixe, appel.systeme].filter((t) => t.trim()).join('\n\n')
  const messages: Array<{ role: string; content: unknown }> = []
  if (systeme) messages.push({ role: 'system', content: systeme })
  for (const h of appel.historique) {
    messages.push({ role: h.role === 'eleve' ? 'user' : 'assistant', content: h.contenu })
  }
  const texte = [appel.suffixeDynamique, appel.message].filter((t) => t.trim()).join('\n\n')
  messages.push({
    role: 'user',
    content: appel.images?.length
      ? [
          ...appel.images.map((img) => ({
            type: 'image_url' as const,
            image_url: { url: `data:${img.mime};base64,${img.base64}` },
          })),
          { type: 'text' as const, text: texte },
        ]
      : texte,
  })
  return messages
}

const openaiAdapter: FournisseurIA = {
  repondreEnStream() {
    // ⛔ NON CONSTRUIT, ET REFUSÉ PLUTÔT QU'INVENTÉ. Le streaming ne sert qu'au
    //    chat du tuteur (Scriptorium), qui tourne sur Anthropic ou Gemini. Un
    //    adaptateur à moitié écrit qui rend un flux vide serait pire qu'une
    //    erreur : le tuteur afficherait une réponse vide sans rien dire.
    throw new Error(
      "Le fournisseur OpenAI n'implémente pas `repondreEnStream` : aucun appelant "
      + "n'en a besoin (le chat du tuteur tourne sur Anthropic ou Gemini). "
      + "Le construire quand un appelant le demandera, pas avant.")
  },
  async repondre(modele, appel) {
    const cle = process.env.OPENAI_API_KEY
    if (!cle) {
      throw new Error(
        "`OPENAI_API_KEY` est absente de l'environnement. L'adaptateur OpenAI ne "
        + "peut pas partir — et il vaut mieux le dire ici qu'envoyer un appel qui "
        + 'reviendra en 401.')
    }
    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: modele,
        messages: messagesOpenAI(appel),
        max_completion_tokens: appel.maxTokensSortie,
      }),
    })
    if (!r.ok) {
      const corps = await r.text()
      throw new Error(`OpenAI ${r.status} : ${corps.slice(0, 300)}`)
    }
    const d = await r.json() as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
      usage?: UsageOpenAI
    }
    const choix = d.choices?.[0]
    return {
      texte: choix?.message?.content ?? '',
      usage: usageOpenAI(d.usage),
      // Le témoin de troncature, sous son nom OpenAI.
      tronquee: choix?.finish_reason === 'length',
    }
  },
}

/** Routage par préfixe d'id de modèle ('claude-…', 'gemini-…', 'gpt-…'). */
export function fournisseurPour(modele: string): FournisseurIA {
  if (modele.startsWith('claude')) return anthropicAdapter
  if (modele.startsWith('gemini')) return geminiAdapter
  if (modele.startsWith('gpt')) return openaiAdapter
  throw new Error(`Modèle IA inconnu : « ${modele} » (préfixes gérés : claude-, gemini-, gpt-).`)
}
