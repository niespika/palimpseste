import 'server-only'
// Génération de la SYNTHÈSE HEBDOMADAIRE du Scriptorium élève (RAG L7, SPEC §10).
// Partagé entre le CRON du lundi (route synthese-hebdo) et le bouton prof
// « (Re)générer » (secours). Principes verrouillés (§2 décision 7) :
//  • le prof ne lit pas les transcripts — il reçoit CETTE synthèse ;
//  • les STATISTIQUES sont calculées en SQL/code, le modèle fait le QUALITATIF ;
//  • 0 message élève sur la semaine → statut VIDE, AUCUN appel IA ;
//  • la synthèse lit TOUT, conversations soft-deletées comprises (§15.12) ;
//  • idempotence par unique (classe_id, semaine_lundi) — un re-run écrase.

import type { SupabaseClient } from '@supabase/supabase-js'
import { addDaysUTC, toISODate, lundiOnOrBefore } from './calendrier-grille'
import { jourDansFuseau } from './fuseau'
import { sansDelims, injecter, extraireJSON } from './ia-commun'
import { fournisseurPour } from './ia-fournisseur'
import { coutSelonModele, enregistrerCoutApi } from './cout-api'
import { lireReglagesRag, PROMPT_SYNTHESE_RAG_DEFAUT, type ReglagesRag } from './scriptorium-rag'

export interface StatsSynthese {
  nbUtilisateurs: number
  effectif: number
  nbMessages: number
  nbConversations: number
}
export interface ThemeSynthese { theme: string; nb_eleves: number; exemples: string[] }
export interface PetitMalin { eleve: string; type: string; exemple: string }
export interface ContenuSynthese {
  stats: StatsSynthese
  themes: ThemeSynthese[]
  petits_malins: PetitMalin[]
  observation: string
  niveaux: null
}

/** Lundi de la semaine ÉCOULÉE (la dernière complète) pour une date pure donnée. */
export function lundiSemaineEcoulee(aujourdHui: string): string {
  return toISODate(addDaysUTC(lundiOnOrBefore(aujourdHui), -7))
}

const s = (x: unknown): string => (typeof x === 'string' ? x : '')
const n = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : 0)

// Normalise la sortie du modèle (§9.2) — tolérante aux champs manquants/mal typés.
function normaliserSortie(brut: unknown): Omit<ContenuSynthese, 'stats'> {
  const o = (brut ?? {}) as Record<string, unknown>
  const themes = (Array.isArray(o.themes) ? o.themes : [])
    .map(t => t as Record<string, unknown>)
    .map(t => ({
      theme: s(t.theme),
      nb_eleves: n(t.nb_eleves),
      exemples: (Array.isArray(t.exemples) ? t.exemples : []).filter((e): e is string => typeof e === 'string'),
    }))
    .filter(t => t.theme)
  const petits = (Array.isArray(o.petits_malins) ? o.petits_malins : [])
    .map(p => p as Record<string, unknown>)
    .map(p => ({ eleve: s(p.eleve), type: s(p.type) || 'autre', exemple: s(p.exemple) }))
    .filter(p => p.eleve || p.exemple)
  return { themes, petits_malins: petits, observation: s(o.observation), niveaux: null }
}

/**
 * Génère (ou régénère) la synthèse d'UNE classe pour la semaine du lundi donné.
 * Écrit READY / VIDE / ERROR dans scriptorium_rag_syntheses et journalise le coût.
 */
export async function genererSyntheseClasse(
  admin: SupabaseClient,
  classeId: string,
  semaineLundi: string,
  fuseau: string,
  reglages: ReglagesRag,
): Promise<{ statut: 'READY' | 'VIDE' | 'ERROR'; error?: string }> {
  const dimanche = toISODate(addDaysUTC(new Date(semaineLundi + 'T00:00:00Z'), 6))
  const poser = async (patch: Record<string, unknown>) => {
    await admin.from('scriptorium_rag_syntheses').upsert(
      { classe_id: classeId, semaine_lundi: semaineLundi, updated_at: new Date().toISOString(), ...patch },
      { onConflict: 'classe_id,semaine_lundi' },
    )
  }

  try {
    // Conversations de la classe — TOUTES (soft-deletées comprises : la synthèse lit tout).
    const { data: convs } = await admin
      .from('scriptorium_conversations').select('id, eleve_id').eq('classe_id', classeId)
    const convRows = (convs ?? []).map(c => ({ id: c.id as string, eleveId: c.eleve_id as string }))
    const eleveParConv = new Map(convRows.map(c => [c.id, c.eleveId]))

    // Messages de la semaine (fenêtre d'instants généreuse, filtrée au JOUR fuseau prof).
    interface Msg { conv: string; role: 'eleve' | 'assistant'; contenu: string; created: string }
    let messages: Msg[] = []
    if (convRows.length) {
      const gte = toISODate(addDaysUTC(new Date(semaineLundi + 'T00:00:00Z'), -1))
      const lt = toISODate(addDaysUTC(new Date(semaineLundi + 'T00:00:00Z'), 8))
      const { data: msgs } = await admin
        .from('scriptorium_messages')
        .select('conversation_id, role, contenu, created_at')
        .in('conversation_id', convRows.map(c => c.id))
        .gte('created_at', gte).lt('created_at', lt)
        .order('created_at', { ascending: true })
      messages = (msgs ?? [])
        .map(m => ({
          conv: m.conversation_id as string,
          role: m.role === 'eleve' ? ('eleve' as const) : ('assistant' as const),
          contenu: m.contenu as string,
          created: m.created_at as string,
        }))
        .filter(m => {
          const jour = jourDansFuseau(m.created, fuseau)
          return jour >= semaineLundi && jour <= dimanche
        })
    }

    // Stats SQL/code (§10.2) — le modèle ne compte rien.
    const msgsEleve = messages.filter(m => m.role === 'eleve')
    const convsActives = new Set(msgsEleve.map(m => m.conv))
    const elevesActifs = new Set([...convsActives].map(c => eleveParConv.get(c)).filter((x): x is string => !!x))
    const { data: insc } = await admin
      .from('inscriptions').select('id').eq('classe_id', classeId).eq('statut', 'active')
    const stats: StatsSynthese = {
      nbUtilisateurs: elevesActifs.size,
      effectif: (insc ?? []).length,
      nbMessages: msgsEleve.length,
      nbConversations: convsActives.size,
    }

    // Silence complet → VIDE, aucun appel IA (§10.2).
    if (stats.nbMessages === 0) {
      await poser({ statut: 'VIDE', contenu: { stats, themes: [], petits_malins: [], observation: '', niveaux: null }, cout: null, erreur_at: null })
      return { statut: 'VIDE' }
    }

    // Transcripts étiquetés par élève (display_name — les petits malins sont nominatifs).
    const { data: profils } = await admin
      .from('profiles').select('id, display_name').in('id', [...new Set(convRows.map(c => c.eleveId))])
    const nomEleve = new Map((profils ?? []).map(p => [p.id as string, (p.display_name as string | null) || 'élève inconnu']))
    const parConv = new Map<string, Msg[]>()
    for (const m of messages) {
      const arr = parConv.get(m.conv) ?? []
      arr.push(m)
      parConv.set(m.conv, arr)
    }
    const blocs: string[] = []
    for (const c of convRows) {
      const ms = parConv.get(c.id)
      if (!ms?.length) continue
      const nom = nomEleve.get(c.eleveId) ?? 'élève inconnu'
      blocs.push([
        `--- Conversation (élève : ${nom}) ---`,
        ...ms.map(m => `[${m.role === 'eleve' ? nom : 'Tuteur'}] ${sansDelims(m.contenu)}`),
      ].join('\n'))
    }

    const promptEffectif = reglages.promptSyntheseBrut || PROMPT_SYNTHESE_RAG_DEFAUT
    const prompt = injecter(promptEffectif, { transcripts_semaine: blocs.join('\n\n') })
    const fournisseur = fournisseurPour(reglages.modeleSynthese)
    const { texte, usage } = await fournisseur.repondre(reglages.modeleSynthese, {
      systeme: '',
      prefixe: '',
      suffixeDynamique: '',
      historique: [],
      message: prompt,
      maxTokensSortie: 2048,
    })
    const contenu: ContenuSynthese = { stats, ...normaliserSortie(JSON.parse(extraireJSON(texte))) }
    const cout = coutSelonModele(reglages.modeleSynthese, usage)
    await poser({ statut: 'READY', contenu, cout, erreur_at: null })
    await enregistrerCoutApi('scriptorium', cout)
    return { statut: 'READY' }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erreur inconnue.'
    console.error('[scriptorium-synthese] échec', { classeId, semaineLundi, message })
    await poser({ statut: 'ERROR', erreur_at: new Date().toISOString() })
    return { statut: 'ERROR', error: message }
  }
}

/**
 * Passe hebdomadaire (cron du lundi) : pour chaque classe ACTIVE ayant le module
 * Scriptorium ET si rag_actif — sinon no-op strict. Renvoie un bilan compact.
 */
export async function genererSynthesesHebdo(
  admin: SupabaseClient, fuseau: string, aujourdHui: string,
): Promise<{ actif: boolean; semaineLundi: string | null; ready: number; vides: number; erreurs: number }> {
  const reglages = await lireReglagesRag(admin)
  if (!reglages.actif) return { actif: false, semaineLundi: null, ready: 0, vides: 0, erreurs: 0 }

  const semaineLundi = lundiSemaineEcoulee(aujourdHui)
  const { data: mod } = await admin.from('modules').select('id').eq('slug', 'scriptorium').maybeSingle()
  if (!mod) return { actif: true, semaineLundi, ready: 0, vides: 0, erreurs: 0 }
  const { data: cm } = await admin.from('classe_modules').select('classe_id').eq('module_id', mod.id as string)
  const classeIds = [...new Set((cm ?? []).map(r => r.classe_id as string))]
  let actives: string[] = []
  if (classeIds.length) {
    const { data: cls } = await admin.from('classes').select('id, statut').in('id', classeIds)
    actives = (cls ?? []).filter(c => (c.statut as string) === 'active').map(c => c.id as string)
  }

  let ready = 0, vides = 0, erreurs = 0
  for (const classeId of actives) {
    const res = await genererSyntheseClasse(admin, classeId, semaineLundi, fuseau, reglages)
    if (res.statut === 'READY') ready++
    else if (res.statut === 'VIDE') vides++
    else erreurs++
  }
  return { actif: true, semaineLundi, ready, vides, erreurs }
}
