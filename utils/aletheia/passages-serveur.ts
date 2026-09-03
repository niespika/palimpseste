import 'server-only'
// ============================================================================
// ALETHEIA · E4 — GÉNÉRATION ET RÉ-ALIGNEMENT DES PASSAGES CLÉS (par livre).
// ----------------------------------------------------------------------------
// Un appel IA PAR SEMAINE, en parallèle, distinct du lot de fiche (E0 : 5 à 6 s et
// ~330 tokens de sortie par semaine). Le modèle reçoit la fiche de la semaine et le
// texte PHRASE PAR PHRASE (découpe E1), rend des identifiants ; le code vérifie et
// rejette (`validerPassages`). Les passages retenus sont fusionnés dans
// `aletheia_livre_reference.contenu[semaine].passages_cles` (jsonb additif — aucun SQL).
// Porte `aletheia_etayage_actif` : c'est l'APPELANT qui la lit.
// ============================================================================
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { coutMessage, enregistrerCoutApi, normaliserUsage } from '@/utils/cout-api'
import { injecter, extraireJSON } from '@/utils/ia-commun'
import { construireDecoupeSemaine, type DecoupeSemaine } from './decoupage'
import { chargerDecoupeLivre, genererDecoupeLivre, chargerTextes } from './decoupage-serveur'
import {
  PROMPT_PASSAGES_DEFAUT, numeroterSemaine, formaterFichePourPassages, validerPassages, realignerPassage, parsePassages,
  type PassageCle, type Rejet,
} from './passages'

const MODELE = 'claude-sonnet-4-6'

export interface ResultatSemaine { semaine: number; passages: number; rejets: Rejet[]; erreur?: string; ms: number }

interface FicheBrute { semaine?: unknown; these_canonique?: unknown; arguments_cles?: unknown; passages_cles?: unknown }

async function decoupeFraiche(admin: SupabaseClient, livreId: string) {
  let d = await chargerDecoupeLivre(admin, livreId)
  if (!d || d.perimee) {
    const r = await genererDecoupeLivre(admin, livreId)
    if (!r.ok) throw new Error(`découpe impossible : ${r.message}`)
    d = await chargerDecoupeLivre(admin, livreId)
    if (!d) throw new Error('découpe absente après génération')
  }
  return d
}

/**
 * Génère les passages clés des `semaines` demandées (toutes celles de la fiche si absent).
 * Écrit UNIQUEMENT `passages_cles` (+ `decoupage_version`) sur les entrées concernées.
 */
export async function genererPassagesLivre(
  admin: SupabaseClient, livreId: string, semaines?: readonly number[],
): Promise<{ ok: true; resultats: ResultatSemaine[] } | { ok: false; message: string }> {
  const { data: ref } = await admin.from('aletheia_livre_reference').select('contenu, statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (!ref || ref.statut !== 'READY' || !Array.isArray(ref.contenu)) return { ok: false, message: 'La fiche de lecture n’est pas prête : les passages s’appuient dessus.' }
  let decoupe
  try { decoupe = await decoupeFraiche(admin, livreId) } catch (e) { return { ok: false, message: (e as Error).message } }
  const textes = new Map((await chargerTextes(admin, livreId)).map(t => [t.semaine, t.texte]))
  const fiches = (ref.contenu as FicheBrute[]).filter(f => Number.isInteger(Number(f?.semaine)))
  const cibles = fiches.filter(f => !semaines || semaines.includes(Number(f.semaine)))
  if (cibles.length === 0) return { ok: false, message: 'Aucune semaine à traiter.' }

  const { data: params } = await admin.from('aletheia_params').select('prompt_passages').eq('id', 1).maybeSingle()
  const template = ((params as { prompt_passages?: string | null } | null)?.prompt_passages ?? '').trim() || PROMPT_PASSAGES_DEFAUT
  const client = new Anthropic()

  const resultats = await Promise.all(cibles.map(async (f): Promise<ResultatSemaine & { passages_cles?: PassageCle[] }> => {
    const semaine = Number(f.semaine)
    const t0 = Date.now()
    const d = decoupe.semaines.find(s => s.semaine === semaine)
    const texte = textes.get(semaine)
    if (!d || texte == null) return { semaine, passages: 0, rejets: [], erreur: 'texte ou découpe absents', ms: 0 }
    try {
      const prompt = injecter(template, {
        fiche: formaterFichePourPassages({ these_canonique: String(f.these_canonique ?? ''), arguments_cles: Array.isArray(f.arguments_cles) ? f.arguments_cles.map(String) : [] }),
        texte: numeroterSemaine(texte, d),
      })
      const rep = await client.messages.create({ model: MODELE, max_tokens: 2048, temperature: 0, messages: [{ role: 'user', content: prompt }] })
      await enregistrerCoutApi('aletheia', coutMessage(rep.usage), { modele: MODELE, tokens: normaliserUsage(rep.usage) })
      if (rep.stop_reason === 'max_tokens') throw new Error('réponse tronquée')
      const brut = JSON.parse(extraireJSON(rep.content[0]?.type === 'text' ? rep.content[0].text : ''))
      const { passages, rejets } = validerPassages(brut, d, texte, decoupe.version)
      return { semaine, passages: passages.length, rejets, ms: Date.now() - t0, passages_cles: passages }
    } catch (e) {
      return { semaine, passages: 0, rejets: [], erreur: (e as Error).message, ms: Date.now() - t0 }
    }
  }))

  // Fusion dans la fiche (relue pour ne pas écraser une édition survenue pendant l'appel).
  const { data: ref2 } = await admin.from('aletheia_livre_reference').select('contenu').eq('scriptorium_livre_id', livreId).maybeSingle()
  const contenu = (Array.isArray(ref2?.contenu) ? ref2!.contenu : ref.contenu) as FicheBrute[]
  const parSemaine = new Map(resultats.filter(r => r.passages_cles).map(r => [r.semaine, r.passages_cles!]))
  const nouveau = contenu.map(f => {
    const p = parSemaine.get(Number(f.semaine))
    return p ? { ...f, passages_cles: p } : f
  })
  const { error } = await admin.from('aletheia_livre_reference').update({ contenu: nouveau, updated_at: new Date().toISOString() }).eq('scriptorium_livre_id', livreId)
  if (error) return { ok: false, message: error.message }
  return { ok: true, resultats: resultats.map(r => ({ semaine: r.semaine, passages: r.passages, rejets: r.rejets, ms: r.ms, ...(r.erreur ? { erreur: r.erreur } : {}) })) }
}

/**
 * Ré-aligne tous les passages du livre sur la découpe COURANTE (après un changement de
 * texte) : chaque pivot est cherchée mot pour mot ; introuvable ⇒ `revoir`.
 */
export async function realignerPassagesLivre(
  admin: SupabaseClient, livreId: string,
): Promise<{ ok: true; realignes: number; aRevoir: number } | { ok: false; message: string }> {
  const { data: ref } = await admin.from('aletheia_livre_reference').select('contenu, statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (!ref || !Array.isArray(ref.contenu)) return { ok: false, message: 'Fiche absente.' }
  let decoupe
  try { decoupe = await decoupeFraiche(admin, livreId) } catch (e) { return { ok: false, message: (e as Error).message } }
  const textes = new Map((await chargerTextes(admin, livreId)).map(t => [t.semaine, t.texte]))
  let realignes = 0, aRevoir = 0
  const nouveau = (ref.contenu as FicheBrute[]).map(f => {
    const semaine = Number(f.semaine)
    const passages = parsePassages(f.passages_cles)
    const d = decoupe.semaines.find(s => s.semaine === semaine)
    const texte = textes.get(semaine)
    if (passages.length === 0 || !d || texte == null) return f
    const recales = passages.map(p => {
      if (p.decoupage_version === decoupe.version && !p.revoir) return p
      const r = realignerPassage(p, texte, d, decoupe.version)
      if (r.revoir) aRevoir++; else realignes++
      return r
    })
    return { ...f, passages_cles: recales }
  })
  const { error } = await admin.from('aletheia_livre_reference').update({ contenu: nouveau, updated_at: new Date().toISOString() }).eq('scriptorium_livre_id', livreId)
  if (error) return { ok: false, message: error.message }
  return { ok: true, realignes, aRevoir }
}

/** La découpe d'une semaine, recalculée depuis le texte courant (pour les écrans). */
export function decoupeDepuisTexte(semaine: number, texte: string): DecoupeSemaine {
  return construireDecoupeSemaine(semaine, texte)
}
