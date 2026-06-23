import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/utils/supabase/admin'

// ── Prompt par défaut — suggestions V1 ──────────────────────────────────────
export const PROMPT_V1_DEFAUT = `Tu assistes un professeur de philosophie. Un élève vient d'écrire DE MÉMOIRE, livre fermé et à la main, une synthèse récapitulative d'une unité de cours. Tu disposes des photos de sa V1 et du contenu exact de l'unité — cours ET textes (le Scriptorium). Codex est un outil de CONSOLIDATION, pas de notation : aucune note, aucun chiffre. Le but est d'aider l'élève à voir ses trous et à oser les exposer.

## Contenu de l'unité : cours et textes (référence — l'élève, lui, a écrit de mémoire)
{{cours}}

## Tes tâches
1. TRANSCRIPTION fidèle du manuscrit (transcription), en conservant les erreurs de langue. Mets [illisible] pour les mots indéchiffrables.
2. CONFIANCE OCR (ocr_confiance) : un nombre entre 0 et 1 estimant la lisibilité du manuscrit. Les fautes d'OCR ne doivent JAMAIS être comptées comme des fautes de l'élève.
3. OUBLIS (oublis) : jusqu'à {{plafond_oublis}} éléments IMPORTANTS du cours que l'élève n'a pas mentionnés. Formulation : « tu n'as pas parlé de X ni de Y, ni de [tel penseur] ». Hiérarchise du plus important au moins important.
4. ERREURS et AMBIGUÏTÉS (erreurs) : jusqu'à {{plafond_erreurs}} éléments, hiérarchisés. Deux types :
   - type "factuelle" : une erreur de fait. Correction ferme : « tu confonds X et Y ».
   - type "ambiguite" : une lecture interprétative discutable. Ancre dans le cours, pas dans une vérité absolue : « ce passage peut se lire comme X, mais ton cours soutient plutôt Y ».
5. ORTHOGRAPHE / GRAMMAIRE (ortho) : une indication GÉNÉRIQUE et brève (1-2 phrases), SANS marquer de fautes précises (on ne corrige pas le manuscrit ici). Vise les tendances récurrentes. Si la confiance OCR est faible, renvoie null.

## Contraintes
- Reste adossé au CONTENU de l'unité ci-dessus (cours et textes) : tu signales un oubli/erreur par rapport à ce que dit l'unité, pas par rapport à une encyclopédie.
- Sois concis : chaque "titre" tient en une ligne, chaque "detail" en 1-2 phrases. Tutoie l'élève.
- Le total oublis + erreurs ne doit pas dépasser ~8.

## Format de réponse — UNIQUEMENT un objet JSON valide, sans texte autour :
{
  "transcription": "...",
  "ocr_confiance": 0.0,
  "oublis": [ { "titre": "...", "detail": "..." } ],
  "erreurs": [ { "type": "factuelle" | "ambiguite", "titre": "...", "detail": "..." } ],
  "ortho": "..." | null
}`

interface V1JSON {
  transcription: string
  ocr_confiance: number
  oublis: { titre: string; detail: string }[]
  erreurs: { type: 'factuelle' | 'ambiguite'; titre: string; detail: string }[]
  ortho: string | null
}

async function chargerCoursUnite(admin: ReturnType<typeof createAdminClient>, uniteId: string): Promise<string> {
  const { data: docs } = await admin
    .from('scriptorium_documents')
    .select('titre, auteur, type, texte_extrait')
    .eq('unite_id', uniteId)
    .not('texte_extrait', 'is', null)
    .order('created_at', { ascending: true })

  if (!docs || docs.length === 0) return '(Aucun contenu textuel dans cette unité.)'

  return docs
    .map((d) => `## ${d.titre}${d.auteur ? ` (${d.auteur})` : ''} [${d.type}]\n\n${d.texte_extrait}`)
    .join('\n\n---\n\n')
}

async function telechargerPhotos(admin: ReturnType<typeof createAdminClient>, paths: string[]): Promise<string[]> {
  const images: string[] = []
  for (const p of paths) {
    const { data: blob } = await admin.storage.from('codex').download(p)
    if (!blob) continue
    const buffer = Buffer.from(await blob.arrayBuffer())
    images.push(buffer.toString('base64'))
  }
  return images
}

function extraireJSON(texte: string): string {
  return texte.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()
}

export async function analyserV1(travailId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: travail } = await admin
    .from('codex_travaux')
    .select('id, session_id, eleve_id, photos_v1')
    .eq('id', travailId)
    .single()

  if (!travail) return

  try {
    const photos = (travail.photos_v1 as string[]) ?? []
    if (photos.length === 0) {
      await admin.from('codex_travaux').update({ analyse_v1_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const { data: session } = await admin
      .from('codex_sessions')
      .select('scriptorium_unite_id')
      .eq('id', travail.session_id)
      .single()

    if (!session) {
      await admin.from('codex_travaux').update({ analyse_v1_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const { data: params } = await admin
      .from('codex_params')
      .select('prompt_suggestions_v1, plafond_oublis, plafond_erreurs, seuil_ocr_ortho')
      .eq('id', 1)
      .single()

    const plafondOublis = params?.plafond_oublis ?? 3
    const plafondErreurs = params?.plafond_erreurs ?? 5
    const seuilOcr = params?.seuil_ocr_ortho ?? 0.6

    const cours = await chargerCoursUnite(admin, session.scriptorium_unite_id)
    const imagesBase64 = await telechargerPhotos(admin, photos)

    if (imagesBase64.length === 0) {
      await admin.from('codex_travaux').update({ analyse_v1_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const prompt = (params?.prompt_suggestions_v1?.trim() || PROMPT_V1_DEFAUT)
      .replace('{{cours}}', cours)
      .replace(/\{\{plafond_oublis\}\}/g, String(plafondOublis))
      .replace(/\{\{plafond_erreurs\}\}/g, String(plafondErreurs))

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          ...imagesBase64.map((b64) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b64 },
          })),
          { type: 'text' as const, text: prompt },
        ],
      }],
    })

    const texte = response.content[0]?.type === 'text' ? response.content[0].text : ''

    let parsed: V1JSON
    try {
      parsed = JSON.parse(extraireJSON(texte))
    } catch {
      await admin.from('codex_travaux').update({ analyse_v1_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const confiance = typeof parsed.ocr_confiance === 'number' ? Math.max(0, Math.min(1, parsed.ocr_confiance)) : null
    const orthoOk = confiance === null || confiance >= seuilOcr

    const suggestions = {
      oublis: (parsed.oublis ?? []).slice(0, plafondOublis),
      erreurs: (parsed.erreurs ?? []).slice(0, plafondErreurs),
      ortho: orthoOk ? (parsed.ortho ?? null) : null,
    }

    const cout = response.usage.input_tokens * 3 / 1_000_000
      + response.usage.output_tokens * 15 / 1_000_000

    await admin.from('codex_travaux').update({
      texte_v1_ocr: parsed.transcription ?? null,
      ocr_confiance_v1: confiance,
      suggestions_v1: suggestions,
      analyse_v1_statut: 'prete',
      cout_api: cout,
    }).eq('id', travailId)
  } catch {
    await admin.from('codex_travaux').update({ analyse_v1_statut: 'erreur' }).eq('id', travailId)
  }
}

// ── Prompt par défaut — retour critique de la V-finale ──────────────────────
export const PROMPT_VF_DEFAUT = `Tu assistes un professeur de philosophie. Un élève vient de réécrire EN ENTIER, à la main et en classe, la V-finale de sa synthèse d'unité, après avoir reçu des suggestions sur sa V1. Tu disposes des photos de la V-finale, du contenu exact de l'unité — cours ET textes (le Scriptorium) et des suggestions qu'il a reçues sur sa V1. Codex est un outil de CONSOLIDATION : aucune note, aucun chiffre. Le retour doit aider l'élève à voir précisément ce qu'il n'a pas su dire, avec la bonne version.

## Contenu de l'unité : cours et textes (référence — l'élève écrit de mémoire)
{{cours}}

## Suggestions reçues sur la V1
{{suggestions_v1}}

## Tes tâches
1. TRANSCRIPTION fidèle de la V-finale (transcription), erreurs de langue conservées, [illisible] si besoin.
2. CONFIANCE OCR (ocr_confiance) : nombre entre 0 et 1. Les fautes d'OCR ne comptent jamais.
3. ERREURS + CORRECTIONS (erreurs_corrections) : les erreurs factuelles qui RESTENT dans la V-finale, avec correction ferme adossée au cours. Pour chacune : concept_tag (mot-clé), description (l'erreur, en tutoyant : « tu confonds X et Y »), correction (la bonne version), importance (1 = mineure, 2 = notable, 3 = grave/centrale).
4. SUIVI DES SUGGESTIONS (suivi_suggestions) : pour chaque suggestion V1 marquante, l'élève l'a-t-il suivie ? statut = "suivie" | "partiellement" | "non_suivie", avec un commentaire bref.
5. POUVAIT ALLER PLUS LOIN (pouvait_aller_plus_loin) : 1 à 3 points que l'élève traite mais qu'il aurait pu approfondir.
6. NON AMÉLIORÉ (non_ameliore) : ce qui était signalé en V1 et qui n'a pas été corrigé (liste, peut être vide).
7. SYNTHÈSE COMPLÉTÉE (synthese_completee) : reprends la synthèse de l'élève et COMPLÈTE-la pour les oublis, de sorte qu'il reparte avec une synthèse complète. Chaque ajout que TU produis doit être CLAIREMENT encadré par les balises [AJOUT] … [/AJOUT] et rester strictement adossé au cours. Ne réécris pas tout : garde le texte de l'élève, insère les ajouts là où ils manquent.
8. AJOUTS (ajouts) : la liste structurée de tes ajouts, chacun { titre, contenu }.

## Contraintes
- Tout est adossé au CONTENU de l'unité (cours et textes) : tu corriges/complètes par rapport à l'unité, pas à une encyclopédie. Pour les ambiguïtés interprétatives, ancre dans l'unité (« ton cours soutient plutôt Y »).
- Tutoie l'élève, ton exigeant et bienveillant. Concis.

## Format de réponse — UNIQUEMENT un objet JSON valide, sans texte autour :
{
  "transcription": "...",
  "ocr_confiance": 0.0,
  "erreurs_corrections": [ { "concept_tag": "...", "description": "...", "correction": "...", "importance": 1 } ],
  "suivi_suggestions": [ { "suggestion": "...", "statut": "suivie" | "partiellement" | "non_suivie", "commentaire": "..." } ],
  "pouvait_aller_plus_loin": [ "..." ],
  "non_ameliore": [ "..." ],
  "synthese_completee": "... [AJOUT] ... [/AJOUT] ...",
  "ajouts": [ { "titre": "...", "contenu": "..." } ]
}`

interface VFJSON {
  transcription: string
  ocr_confiance: number
  erreurs_corrections: { concept_tag: string; description: string; correction: string; importance: number }[]
  suivi_suggestions: { suggestion: string; statut: string; commentaire: string }[]
  pouvait_aller_plus_loin: string[]
  non_ameliore: string[]
  synthese_completee: string
  ajouts: { titre: string; contenu: string }[]
}

function formaterSuggestionsV1(suggestions: unknown): string {
  const s = suggestions as {
    oublis?: { titre: string; detail: string }[]
    erreurs?: { type: string; titre: string; detail: string }[]
    ortho?: string | null
  } | null
  if (!s) return '(Aucune suggestion V1 enregistrée.)'

  let texte = ''
  if (s.oublis?.length) {
    texte += 'OUBLIS signalés :\n'
    for (const o of s.oublis) texte += `- ${o.titre} : ${o.detail}\n`
  }
  if (s.erreurs?.length) {
    texte += 'ERREURS / AMBIGUÏTÉS signalées :\n'
    for (const e of s.erreurs) texte += `- [${e.type}] ${e.titre} : ${e.detail}\n`
  }
  if (s.ortho) texte += `LANGUE : ${s.ortho}\n`
  return texte || '(Aucune suggestion V1 enregistrée.)'
}

export async function analyserVF(travailId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: travail } = await admin
    .from('codex_travaux')
    .select('id, session_id, eleve_id, photos_vf, suggestions_v1')
    .eq('id', travailId)
    .single()

  if (!travail) return

  try {
    const photos = (travail.photos_vf as string[]) ?? []
    if (photos.length === 0) {
      await admin.from('codex_travaux').update({ analyse_vf_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const { data: session } = await admin
      .from('codex_sessions')
      .select('scriptorium_unite_id')
      .eq('id', travail.session_id)
      .single()

    if (!session) {
      await admin.from('codex_travaux').update({ analyse_vf_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const { data: params } = await admin
      .from('codex_params')
      .select('prompt_retour_vf')
      .eq('id', 1)
      .single()

    const cours = await chargerCoursUnite(admin, session.scriptorium_unite_id)
    const imagesBase64 = await telechargerPhotos(admin, photos)

    if (imagesBase64.length === 0) {
      await admin.from('codex_travaux').update({ analyse_vf_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const prompt = (params?.prompt_retour_vf?.trim() || PROMPT_VF_DEFAUT)
      .replace('{{cours}}', cours)
      .replace('{{suggestions_v1}}', formaterSuggestionsV1(travail.suggestions_v1))

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: [
          ...imagesBase64.map((b64) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: b64 },
          })),
          { type: 'text' as const, text: prompt },
        ],
      }],
    })

    const texte = response.content[0]?.type === 'text' ? response.content[0].text : ''

    let parsed: VFJSON
    try {
      parsed = JSON.parse(extraireJSON(texte))
    } catch {
      await admin.from('codex_travaux').update({ analyse_vf_statut: 'erreur' }).eq('id', travailId)
      return
    }

    const retourCritique = {
      erreurs_corrections: (parsed.erreurs_corrections ?? []).map((e) => ({
        concept_tag: e.concept_tag ?? '',
        description: e.description ?? '',
        correction: e.correction ?? '',
        importance: typeof e.importance === 'number' ? Math.max(1, Math.min(3, e.importance)) : 1,
      })),
      suivi_suggestions: parsed.suivi_suggestions ?? [],
      pouvait_aller_plus_loin: parsed.pouvait_aller_plus_loin ?? [],
      non_ameliore: parsed.non_ameliore ?? [],
      ajouts: parsed.ajouts ?? [],
    }

    const cout = response.usage.input_tokens * 3 / 1_000_000
      + response.usage.output_tokens * 15 / 1_000_000

    await admin.from('codex_travaux').update({
      texte_vf_ocr: parsed.transcription ?? null,
      ocr_confiance_vf: typeof parsed.ocr_confiance === 'number' ? Math.max(0, Math.min(1, parsed.ocr_confiance)) : null,
      retour_critique: retourCritique,
      synthese_completee: parsed.synthese_completee ?? null,
      analyse_vf_statut: 'prete',
      cout_api: cout,
    }).eq('id', travailId)
  } catch {
    await admin.from('codex_travaux').update({ analyse_vf_statut: 'erreur' }).eq('id', travailId)
  }
}
