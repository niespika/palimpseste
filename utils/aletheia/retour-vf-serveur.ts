import 'server-only'
// ============================================================================
// ALETHEIA · E7 — LE RETOUR FINAL AGI, CÔTÉ SERVEUR.
// ----------------------------------------------------------------------------
// Prépare ce que l'écran FEEDBACK2_READY montre porte ouverte :
//  · la nuance prioritaire : l'extrait de l'élève, la fenêtre du passage désigné selon la
//    forme servie (montre ⇒ pivot en évidence ; sinon à surligner d'abord — D7) ;
//  · les paires amont : extrait courant + extrait amont (montre), ou extrait courant +
//    propositions de libellés à choisir (C et au-dessus) ;
//  · la synthèse numérotée par phrases, à surligner (D8).
// ⛔ Les pivots et les passages amont ne sortent d'ici que mérités : les actions
//    (`verifierSurlignageNuance`, `choisirPassageAmont`) tranchent côté serveur.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { contexteSeance } from './fenetre-serveur'
import { fenetrePour, hasard, type FenetreRelance } from './fenetre'
import { textePivot, type PassageCle } from './passages'
import type { Forme } from './forme'
import { phrasesSynthese, optionsAmont, type NuanceDetail, type PaireAmont, type PhraseSynthese, type GestesRetourFinal, type ComparaisonSynthese, type PassageAmontRef } from './retour-vf'
import { ESSAIS_MAX } from './fenetre'

export interface ExtraitPassage { id: string; semaine: number; libelle: string; texte: string }
export interface NuancePreparee {
  extrait_eleve: string
  verdict: NuanceDetail['verdict']
  note: string
  passage: string | null
  fenetre: FenetreRelance | null
  /** La pivot, servie seulement quand elle est méritée (forme montre, surlignage juste, ou 2ᵉ échec). */
  pivot: string[] | null
  etat: { verdict_code?: string; essais: number }
  autres: NuanceDetail[]
}
export interface PairePreparee {
  index: number
  relation: string
  courant: ExtraitPassage
  /** L'extrait amont, servi à la forme montre ou une fois le choix fait. */
  amont: ExtraitPassage | null
  /** Les libellés à choisir (C et au-dessus, tant que le choix n'est pas fait). */
  options: { id: string; semaine: number; libelle: string }[]
  etat: { choix?: string; juste?: boolean }
}
export interface RetourFinalPrepare {
  forme: Forme
  nuance: NuancePreparee | null
  paires: PairePreparee[]
  synthese: { phrases: PhraseSynthese[]; comparaison: ComparaisonSynthese | null } | null
}

const formeValide = (f: unknown): Forme => (f === 'fenetre' || f === 'demi_section' ? f : 'montre')
const semaineDe = (id: string) => Number(/^k(\d+)-/.exec(id)?.[1] ?? NaN)

/** Tous les passages clés des semaines < N, avec leur semaine (depuis la fiche READY). */
export async function passagesAmont(admin: SupabaseClient, livreId: string, semaine: number, exposees?: readonly number[] | null): Promise<PassageAmontRef[]> {
  const visibles = exposees && exposees.length ? new Set(exposees) : null
  const { data: ref } = await admin.from('aletheia_livre_reference').select('contenu, statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (ref?.statut !== 'READY' || !Array.isArray(ref.contenu)) return []
  const { parsePassages } = await import('./passages')
  const out: PassageAmontRef[] = []
  for (const c of ref.contenu as { semaine?: unknown; passages_cles?: unknown }[]) {
    const s = Number(c?.semaine)
    if (!Number.isInteger(s) || s >= semaine || (visibles && !visibles.has(s))) continue
    for (const p of parsePassages(c?.passages_cles)) out.push({ id: p.id, semaine: s, libelle: p.libelle })
  }
  return out.sort((a, b) => a.semaine - b.semaine || a.id.localeCompare(b.id))
}

async function extrait(admin: SupabaseClient, livreId: string, id: string, cache: Map<number, Awaited<ReturnType<typeof contexteSeance>>>): Promise<ExtraitPassage | null> {
  const s = semaineDe(id)
  if (!Number.isInteger(s)) return null
  if (!cache.has(s)) cache.set(s, await contexteSeance(admin, livreId, s))
  const ctx = cache.get(s)!
  const p: PassageCle | undefined = ctx.passages.find(x => x.id === id)
  if (!p || !ctx.d || ctx.texte == null) return null
  const texte = textePivot(ctx.texte, ctx.d, p.pivots[0] ?? [])
  return texte ? { id, semaine: s, libelle: p.libelle, texte } : null
}

export async function preparerRetourFinal(
  admin: SupabaseClient,
  t: { id: string; forme?: unknown; retour_vf: { nuances_detail?: NuanceDetail[]; amont_paires?: PaireAmont[] } | null; retour_vf_agi?: GestesRetourFinal | null; comparaison_synthese?: ComparaisonSynthese | null },
  livreId: string, semaine: number, syntheseModele: string, exposees?: readonly number[] | null,
): Promise<RetourFinalPrepare> {
  const forme = formeValide(t.forme)
  const gestes = t.retour_vf_agi ?? {}
  const cache = new Map<number, Awaited<ReturnType<typeof contexteSeance>>>()
  const ctx = await contexteSeance(admin, livreId, semaine)
  cache.set(semaine, ctx)

  // ── La nuance prioritaire ──
  let nuance: NuancePreparee | null = null
  const nuances = t.retour_vf?.nuances_detail ?? []
  if (nuances.length) {
    const [n, ...autres] = nuances
    const p = n.passage ? ctx.passages.find(x => x.id === n.passage) : undefined
    const fenetre = p && ctx.d && ctx.texte != null ? fenetrePour(forme, ctx.d, ctx.texte, p, `${t.id}:vf:nuance`) : null
    const etat = { verdict_code: gestes.nuance?.verdict_code, essais: gestes.nuance?.essais ?? 0 }
    const merite = forme === 'montre' || etat.verdict_code === 'juste' || etat.essais >= ESSAIS_MAX
    nuance = {
      extrait_eleve: n.extrait_eleve, verdict: n.verdict, note: n.note, passage: p?.id ?? null,
      fenetre: fenetre ? { ...fenetre, enEvidence: undefined } : null,
      pivot: p && merite ? (p.pivots[0] ?? []) : null,
      etat, autres,
    }
  }

  // ── Les paires amont ──
  const paires: PairePreparee[] = []
  const tousAmont = await passagesAmont(admin, livreId, semaine, exposees)
  const choix = new Map((gestes.amont ?? []).map(g => [g.index, g]))
  for (const [index, pr] of (t.retour_vf?.amont_paires ?? []).entries()) {
    const courant = await extrait(admin, livreId, pr.passage_courant, cache)
    const bonne = tousAmont.find(a => a.id === pr.passage_amont)
    if (!courant || !bonne) continue
    const g = choix.get(index)
    const revele = forme === 'montre' || !!g
    const amont = revele ? await extrait(admin, livreId, pr.passage_amont, cache) : null
    paires.push({
      index, relation: pr.relation, courant, amont,
      options: revele ? [] : optionsAmont(bonne, tousAmont, hasard(`${t.id}:vf:amont:${index}`)),
      etat: g ? { choix: g.choix, juste: g.juste } : {},
    })
  }

  // ── La synthèse numérotée ──
  const phrases = phrasesSynthese(semaine, syntheseModele)
  const synthese = phrases.length ? { phrases, comparaison: t.comparaison_synthese ?? null } : null

  return { forme, nuance, paires, synthese }
}

/** L'extrait amont d'une paire, une fois le choix fait (juste ou non). */
export async function extraitAmont(admin: SupabaseClient, livreId: string, id: string): Promise<ExtraitPassage | null> {
  return extrait(admin, livreId, id, new Map())
}
