import 'server-only'
// ============================================================================
// ALETHEIA · E2 — LA FORME D'UNE SÉANCE, LUE DEPUIS LA BASE ET DÉCIDÉE PAR LE CODE.
// ----------------------------------------------------------------------------
// Lit les diagnostics des séances ANTÉRIEURES (`aletheia_diagnostic`, axe
// arguments) et la forme servie à la séance précédente (`aletheia_travaux.forme`),
// puis délègue la décision au module pur `forme.ts`. Appelé à la soumission V1,
// porte `aletheia_etayage_actif` ouverte seulement ; la forme est écrite sur le
// travail et sert ensuite au rendu du retour V1 (lots E5/E6).
// ⚠️ Requêtes TOLÉRANTES : colonne `forme` absente (migration E2 non jouée) ⇒ on
//    décide comme si la séance précédente n'avait pas de forme (⇒ « montre »).
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { decider, type DecisionForme, type Forme, type NiveauSeance } from './forme'

const FORMES = new Set<Forme>(['montre', 'fenetre', 'demi_section'])

export async function deciderFormePourSeance(
  admin: SupabaseClient, eleveId: string, livreId: string, semaine: number,
): Promise<DecisionForme> {
  const { data: diags } = await admin
    .from('aletheia_diagnostic')
    .select('semaine_index, niveau_arguments_v1, niveau_arguments_vf')
    .eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId)
    .lt('semaine_index', semaine)
  const anterieurs: NiveauSeance[] = (diags ?? []).map(d => ({
    semaine: d.semaine_index as number,
    niveau_arguments_vf: (d.niveau_arguments_vf as number | null) ?? null,
    niveau_arguments_v1: (d.niveau_arguments_v1 as number | null) ?? null,
  }))

  // La forme de la séance précédente la plus récente qui en porte une.
  let courante: Forme | null = null
  const { data: prec, error } = await admin
    .from('aletheia_travaux')
    .select('semaine_index, forme')
    .eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId)
    .lt('semaine_index', semaine).not('forme', 'is', null)
    .order('semaine_index', { ascending: false }).limit(1).maybeSingle()
  if (!error) {
    const f = (prec as { forme?: string } | null)?.forme
    if (f && FORMES.has(f as Forme)) courante = f as Forme
  }
  return decider(anterieurs, courante)
}
