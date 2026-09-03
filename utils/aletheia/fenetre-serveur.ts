import 'server-only'
// ============================================================================
// ALETHEIA · E6 — LES FENÊTRES D'UNE SÉANCE, CÔTÉ SERVEUR.
// ----------------------------------------------------------------------------
// Pour chaque relance du retour V1 qui désigne un passage clé, la fenêtre à
// montrer (forme `montre`) ou à surligner (`fenetre`, `demi_section`), calculée
// depuis la découpe COURANTE et le texte de la séance. ⛔ Les pivots ne sortent
// d'ici qu'à la forme `montre` (mises en évidence) ; pour les deux autres, la
// vérification est une action serveur (`verifierSurlignage`) : rien à deviner
// dans le navigateur.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { chargerDecoupeLivre, genererDecoupeLivre, chargerTextes } from './decoupage-serveur'
import { parsePassages, type PassageCle } from './passages'
import { fenetrePour, bareme, type FenetreRelance, type ResultatBareme } from './fenetre'
import type { Forme } from './forme'
import type { RelanceDetail } from './retour-v1'

export interface FenetreServie extends FenetreRelance { relance: number; passage: string; libelle: string | null }

/** La découpe, le texte et les passages clés d'une séance (découpe régénérée si périmée). */
export async function contexteSeance(admin: SupabaseClient, livreId: string, semaine: number) {
  let dec = await chargerDecoupeLivre(admin, livreId)
  if (!dec || dec.perimee) { await genererDecoupeLivre(admin, livreId); dec = await chargerDecoupeLivre(admin, livreId) }
  const d = dec?.semaines.find(s => s.semaine === semaine) ?? null
  const texte = (await chargerTextes(admin, livreId)).find(t => t.semaine === semaine)?.texte ?? null
  const { data: ref } = await admin.from('aletheia_livre_reference').select('contenu, statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  const fiche = ref?.statut === 'READY' && Array.isArray(ref.contenu) ? (ref.contenu as { semaine?: unknown; passages_cles?: unknown }[]).find(c => Number(c?.semaine) === semaine) : null
  const passages = parsePassages(fiche?.passages_cles)
  return { d, texte, passages }
}

const formeValide = (f: unknown): Forme => (f === 'fenetre' || f === 'demi_section' ? f : 'montre')

/** Les fenêtres des relances d'un travail (celles qui désignent un passage connu). */
export async function preparerFenetres(
  admin: SupabaseClient, travailId: string, livreId: string, semaine: number, forme: unknown, detail: readonly RelanceDetail[] | undefined,
): Promise<FenetreServie[]> {
  if (!detail?.length) return []
  const { d, texte, passages } = await contexteSeance(admin, livreId, semaine)
  if (!d || texte == null) return []
  const out: FenetreServie[] = []
  detail.forEach((r, i) => {
    if (!r.passage) return
    const p = passages.find(x => x.id === r.passage)
    if (!p) return
    const f = fenetrePour(formeValide(forme), d, texte, p, `${travailId}:${i}`)
    if (f) out.push({ ...f, relance: i, passage: p.id, libelle: r.libelle })
  })
  return out
}

/** Le barème d'un surlignage sur le passage désigné par une relance ; `pivot` = les identifiants à montrer quand ils sont mérités. */
export async function jugerSurlignage(
  admin: SupabaseClient, livreId: string, semaine: number, passageId: string, selection: readonly string[],
): Promise<(ResultatBareme & { pivot: string[] }) | null> {
  const { d, passages } = await contexteSeance(admin, livreId, semaine)
  const p: PassageCle | undefined = passages.find(x => x.id === passageId)
  if (!d || !p) return null
  const r = bareme(d, p, selection)
  return { ...r, pivot: p.pivots[0] ?? [] }
}
