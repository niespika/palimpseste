import 'server-only'
// ============================================================================
// ALETHEIA · refonte 04/09 — L'OUVERTURE D'UNE SÉANCE, LA PRÉSENTATION, LE TEMPS RÉEL.
// ----------------------------------------------------------------------------
//  · `ouvrirSeance` : à la première visite d'une séance (porte ouverte), la ligne de travail naît
//    en DRAFT avec `ouvert_at` ; les rendus ne s'en ressentent pas (DRAFT = non rendu).
//  · `presentationVue` / `marquerPresentationVue` : la présentation du module, une fois par version.
//  · `tempsMedianSeance` : le temps réel d'une séance, de l'ouverture à la clôture, par livre
//    et par classe — calculé, jamais tapé ; « n/a » sous trois séances mesurées.
// Requêtes TOLÉRANTES : colonne ou table absente (migration l9 non jouée) ⇒ comportement d'avant.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export const VERSION_PRESENTATION = 1
export const MIN_SEANCES_MESUREES = 3

export async function ouvrirSeance(admin: SupabaseClient, eleveId: string, livreId: string, semaine: number): Promise<void> {
  const { data: row, error } = await admin.from('aletheia_travaux').select('id, statut, ouvert_at')
    .eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine).maybeSingle()
  if (error) return   // colonne absente ⇒ rien
  const maintenant = new Date().toISOString()
  if (!row) {
    await admin.from('aletheia_travaux').insert({ eleve_id: eleveId, scriptorium_livre_id: livreId, semaine_index: semaine, statut: 'DRAFT', ouvert_at: maintenant })
    return
  }
  if (!(row as { ouvert_at?: string | null }).ouvert_at && row.statut === 'DRAFT') {
    await admin.from('aletheia_travaux').update({ ouvert_at: maintenant }).eq('id', row.id).is('ouvert_at', null)
  }
}

export async function presentationVue(admin: SupabaseClient, eleveId: string): Promise<boolean> {
  const { data, error } = await admin.from('aletheia_eleve_etat').select('presentation_vue_at, presentation_version').eq('eleve_id', eleveId).maybeSingle()
  if (error) return true   // table absente ⇒ pas de présentation (comportement d'avant)
  const d = data as { presentation_vue_at?: string | null; presentation_version?: number } | null
  return !!d?.presentation_vue_at && (d.presentation_version ?? 1) >= VERSION_PRESENTATION
}

export async function marquerPresentationVue(admin: SupabaseClient, eleveId: string): Promise<{ ok: boolean; message?: string }> {
  const { error } = await admin.from('aletheia_eleve_etat').upsert(
    { eleve_id: eleveId, presentation_vue_at: new Date().toISOString(), presentation_version: VERSION_PRESENTATION, updated_at: new Date().toISOString() },
    { onConflict: 'eleve_id' })
  return error ? { ok: false, message: error.message } : { ok: true }
}

export interface TempsSeance { medianeMinutes: number | null; n: number }

/** Le temps médian d'une séance (ouverture → clôture) sur un livre, pour les élèves d'une classe (ou tous). */
export async function tempsMedianSeance(admin: SupabaseClient, livreId: string, classeId?: string | null): Promise<TempsSeance> {
  const { data, error } = await admin.from('aletheia_travaux').select('eleve_id, ouvert_at, retour_vf_lu_at')
    .eq('scriptorium_livre_id', livreId).eq('statut', 'DONE').not('ouvert_at', 'is', null).not('retour_vf_lu_at', 'is', null)
  if (error || !data) return { medianeMinutes: null, n: 0 }
  let rows = data as { eleve_id: string; ouvert_at: string; retour_vf_lu_at: string }[]
  if (classeId) {
    const { data: ins } = await admin.from('inscriptions').select('eleve_id').eq('classe_id', classeId).eq('statut', 'active')
    const set = new Set((ins ?? []).map(i => i.eleve_id as string))
    rows = rows.filter(r => set.has(r.eleve_id))
  }
  // Une séance ouverte un jour et close un autre ne dit rien du temps passé : on borne à 3 h.
  const minutes = rows.map(r => (new Date(r.retour_vf_lu_at).getTime() - new Date(r.ouvert_at).getTime()) / 60000).filter(m => m > 0 && m <= 180).sort((a, b) => a - b)
  if (minutes.length < MIN_SEANCES_MESUREES) return { medianeMinutes: null, n: minutes.length }
  const m = Math.floor(minutes.length / 2)
  return { medianeMinutes: Math.round(minutes.length % 2 ? minutes[m] : (minutes[m - 1] + minutes[m]) / 2), n: minutes.length }
}
