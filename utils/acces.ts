import type { SupabaseClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------------------
// Accès aux modules — DÉRIVÉ de la classe (Lot 1).
// L'accès n'est plus stocké par élève : un élève accède à un module si l'une de
// ses inscriptions actives porte sur une classe à laquelle ce module est donné.
// Un élève en deux classes voit l'UNION des accès des deux.
// ----------------------------------------------------------------------------

/** Classes où l'élève a une inscription active. */
export async function classeIdsActives(
  supabase: SupabaseClient,
  eleveId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('inscriptions')
    .select('classe_id')
    .eq('eleve_id', eleveId)
    .eq('statut', 'active')
  return (data ?? []).map((r) => r.classe_id as string)
}

/** Ids des modules accessibles à un élève (union de ses classes). */
export async function moduleIdsAccessibles(
  supabase: SupabaseClient,
  eleveId: string
): Promise<Set<string>> {
  const classeIds = await classeIdsActives(supabase, eleveId)
  if (classeIds.length === 0) return new Set()
  const { data } = await supabase
    .from('classe_modules')
    .select('module_id')
    .in('classe_id', classeIds)
  return new Set((data ?? []).map((r) => r.module_id as string))
}

/** Slugs des modules accessibles à l'élève (union de ses classes actives). */
export async function slugsModulesAccessibles(
  supabase: SupabaseClient,
  eleveId: string
): Promise<Set<string>> {
  const ids = await moduleIdsAccessibles(supabase, eleveId)
  if (ids.size === 0) return new Set()
  const { data } = await supabase.from('modules').select('slug').in('id', [...ids])
  return new Set((data ?? []).map((m) => m.slug as string))
}

/** L'élève a-t-il accès à ce module (par id) ? */
export async function aAccesModule(
  supabase: SupabaseClient,
  eleveId: string,
  moduleId: string
): Promise<boolean> {
  const ids = await moduleIdsAccessibles(supabase, eleveId)
  return ids.has(moduleId)
}

/** Ids des élèves ayant une inscription active dans une classe donnée. */
export async function eleveIdsInscritsClasse(
  supabase: SupabaseClient,
  classeId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('inscriptions')
    .select('eleve_id')
    .eq('classe_id', classeId)
    .eq('statut', 'active')
  return [...new Set((data ?? []).map((r) => r.eleve_id as string))]
}

// ----------------------------------------------------------------------------
// Scoping du travail par inscription (élève × classe) — Lot 1 / T3.
// Le travail fragments est rattaché à l'INSCRIPTION, pas à l'élève seul : un
// élève en deux classes a deux jeux de fragments distincts. Côté prof, on
// travaille une classe à la fois (sélecteur de classe).
// ----------------------------------------------------------------------------

/** Classes ayant accès à un module donné (pour le sélecteur de classe prof). */
export async function classesAvecModule(
  supabase: SupabaseClient,
  moduleId: string
): Promise<Array<{ id: string; nom: string }>> {
  const { data } = await supabase
    .from('classe_modules')
    .select('classe:classes(id, nom, statut)')
    .eq('module_id', moduleId)
  return (data ?? [])
    .map((r) => (r as unknown as { classe: { id: string; nom: string; statut: string } | null }).classe)
    .filter((c): c is { id: string; nom: string; statut: string } => !!c && c.statut === 'active')
    .map((c) => ({ id: c.id, nom: c.nom }))
    .sort((a, b) => a.nom.localeCompare(b.nom))
}

/**
 * Inscriptions actives d'un élève sur des classes ayant un module donné.
 * Sert au sélecteur de contexte côté élève + à la résolution de l'inscription
 * par défaut. Un élève mono-classe → un seul élément (pas de sélecteur).
 */
export async function inscriptionsModuleEleve(
  supabase: SupabaseClient,
  eleveId: string,
  moduleId: string
): Promise<Array<{ id: string; classe_id: string; classe_nom: string }>> {
  const { data: cm } = await supabase
    .from('classe_modules')
    .select('classe_id')
    .eq('module_id', moduleId)
  const classeIdsModule = new Set((cm ?? []).map((r) => r.classe_id as string))
  if (classeIdsModule.size === 0) return []

  const { data } = await supabase
    .from('inscriptions')
    .select('id, classe_id, classe:classes(nom)')
    .eq('eleve_id', eleveId)
    .eq('statut', 'active')

  return (data ?? [])
    .filter((r) => classeIdsModule.has(r.classe_id as string))
    .map((r) => ({
      id: r.id as string,
      classe_id: r.classe_id as string,
      classe_nom: (r as unknown as { classe: { nom: string } | null }).classe?.nom ?? '',
    }))
    .sort((a, b) => a.classe_nom.localeCompare(b.classe_nom))
}

/** Id de l'inscription active d'un élève dans une classe donnée (ou null). */
export async function inscriptionEleveClasse(
  supabase: SupabaseClient,
  eleveId: string,
  classeId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('inscriptions')
    .select('id')
    .eq('eleve_id', eleveId)
    .eq('classe_id', classeId)
    .eq('statut', 'active')
    .maybeSingle()
  return (data?.id as string) ?? null
}

/**
 * Inscriptions actives d'une classe (élève × cette classe). Côté prof : chaque
 * élève de la classe a exactement une inscription → map élève↔inscription 1:1.
 */
export async function inscriptionsClasse(
  supabase: SupabaseClient,
  classeId: string
): Promise<Array<{ id: string; eleve_id: string }>> {
  const { data } = await supabase
    .from('inscriptions')
    .select('id, eleve_id')
    .eq('classe_id', classeId)
    .eq('statut', 'active')
  return (data ?? []).map((r) => ({ id: r.id as string, eleve_id: r.eleve_id as string }))
}

/**
 * Côté prof : ids des élèves ayant accès à un module = élèves avec une
 * inscription active dans une classe à laquelle ce module est donné.
 */
export async function eleveIdsAvecAccesModule(
  supabase: SupabaseClient,
  moduleId: string
): Promise<string[]> {
  const { data: cm } = await supabase
    .from('classe_modules')
    .select('classe_id')
    .eq('module_id', moduleId)
  const classeIds = (cm ?? []).map((r) => r.classe_id as string)
  if (classeIds.length === 0) return []
  const { data: ins } = await supabase
    .from('inscriptions')
    .select('eleve_id')
    .in('classe_id', classeIds)
    .eq('statut', 'active')
  return [...new Set((ins ?? []).map((r) => r.eleve_id as string))]
}
