import 'server-only'
// ============================================================================
// ALETHEIA · E3 — LE GABARIT D'UN LIVRE ET D'UNE SÉANCE, LU DEPUIS LA BASE.
// ----------------------------------------------------------------------------
// `scriptorium_unites.gabarit_lecture` (défaut 'argumentatif') + `cycle_tournante`
// (jsonb, clés des tournantes dans l'ordre), surchargeable par séance par le champ
// `gabarit` de la fiche (`aletheia_livre_reference.contenu[].gabarit`).
// ⛔ PORTE FERMÉE ⇒ 'argumentatif', cycle null, rang 0 : les formulaires et les
//    prompts sont ceux d'avant, à l'octet près (le bloc argumentatif est vide et
//    la tournante de rang 0 est « accord »).
// ⚠️ Requêtes TOLÉRANTES : colonne absente (migration E3 non jouée) ⇒ défaut.
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { GABARIT_DEFAUT, estGabarit, libellesSeance, type Gabarit, type LibellesSeance } from './gabarits'
import { lireLaPorteEtayage } from './decoupage-serveur'

export interface GabaritLivre { gabarit: Gabarit; cycle: string[] | null }

export async function gabaritDuLivre(admin: SupabaseClient, livreId: string): Promise<GabaritLivre> {
  const { data, error } = await admin
    .from('scriptorium_unites').select('gabarit_lecture, cycle_tournante').eq('id', livreId).maybeSingle()
  if (error || !data) return { gabarit: GABARIT_DEFAUT, cycle: null }
  const g = (data as { gabarit_lecture?: unknown }).gabarit_lecture
  const c = (data as { cycle_tournante?: unknown }).cycle_tournante
  return {
    gabarit: estGabarit(g) ? g : GABARIT_DEFAUT,
    cycle: Array.isArray(c) ? c.filter((x): x is string => typeof x === 'string') : null,
  }
}

/** La surcharge de gabarit portée par la fiche de la séance, s'il y en a une. */
export async function gabaritDeLaFiche(admin: SupabaseClient, livreId: string, semaine: number): Promise<Gabarit | null> {
  const { data } = await admin
    .from('aletheia_livre_reference').select('contenu, statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (!data || data.statut !== 'READY' || !Array.isArray(data.contenu)) return null
  const fiche = (data.contenu as { semaine?: unknown; gabarit?: unknown }[]).find(c => Number(c?.semaine) === semaine)
  return estGabarit(fiche?.gabarit) ? fiche.gabarit : null
}

/**
 * Le rang d'une séance parmi les séances exposées (0 = la première) : c'est lui qui
 * fait tourner la question. `exposees` = ordinaux des séances que l'élève voit (mode C :
 * l'extrait seulement). Séance absente de la liste ⇒ son ordinal − 1.
 */
export function rangDeSeance(exposees: readonly number[] | null | undefined, semaine: number): number {
  if (!exposees || exposees.length === 0) return Math.max(0, semaine - 1)
  const ordre = [...exposees].sort((a, b) => a - b)
  const i = ordre.indexOf(semaine)
  return i >= 0 ? i : Math.max(0, semaine - 1)
}

export interface ContexteGabarit {
  etayage: boolean
  gabarit: Gabarit
  libelles: LibellesSeance
}

/**
 * Tout ce qu'une séance a besoin de savoir de son gabarit — en UNE lecture de la porte.
 * Porte fermée ⇒ argumentatif, tournante « accord », comme avant.
 */
export async function contexteGabarit(
  admin: SupabaseClient, livreId: string, semaine: number, exposees?: readonly number[] | null,
): Promise<ContexteGabarit> {
  const etayage = await lireLaPorteEtayage(admin)
  if (!etayage) {
    return { etayage: false, gabarit: GABARIT_DEFAUT, libelles: libellesSeance(GABARIT_DEFAUT, null, 0) }
  }
  const livre = await gabaritDuLivre(admin, livreId)
  const surcharge = await gabaritDeLaFiche(admin, livreId, semaine)
  const gabarit = surcharge ?? livre.gabarit
  return { etayage: true, gabarit, libelles: libellesSeance(gabarit, livre.cycle, rangDeSeance(exposees, semaine)) }
}
