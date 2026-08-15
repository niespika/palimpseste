import type { SupabaseClient } from '@supabase/supabase-js'

// ----------------------------------------------------------------------------
// Accès aux modules — DÉRIVÉ de la classe (Lot 1).
// L'accès n'est plus stocké par élève : un élève accède à un module si l'une de
// ses inscriptions actives porte sur une classe à laquelle ce module est donné.
// Un élève en deux classes voit l'UNION des accès des deux.
//
// ⚠️ Accès & classes · L1 (14/08) — LE MODULE APPARTIENT À LA CLASSE. L'union
// ci-dessous ne répond donc plus à la question « cet élève peut-il ouvrir ce
// module MAINTENANT ? » : c'est le bloc « Accès jugé sur la CLASSE » (bas de
// fichier) qui la tranche, et c'est lui que les écrans élève appellent.
// L'union survit là où la question porte bien sur l'ÉLÈVE et non sur une classe
// en contexte : le hub prof d'un élève (`/prof/eleves/[eleveId]`, qui montre
// tout ce à quoi il touche), `eleveIdsAvecAccesModule` (qui a accès quelque
// part ?), et l'état « Toutes les classes » du commutateur, où le périmètre EST
// l'union par définition.
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
// Accès jugé sur la CLASSE — Accès & classes · L1 (décision Louis du 14/08).
// « Si Test a Codex et T5 a Quazian, chaque module ne se voit et ne s'ouvre que
// dans SA classe. » Ces helpers prennent donc des CLASSES en entrée, jamais un
// élève seul : c'est l'appelant qui dit de quel périmètre il parle (la classe en
// contexte, ou toutes celles de l'élève en état « Toutes »).
// ----------------------------------------------------------------------------

/** Ids des modules donnés à ces classes (périmètre d'un contexte de classe). */
export async function moduleIdsDesClasses(
  supabase: SupabaseClient,
  classeIds: string[]
): Promise<Set<string>> {
  if (classeIds.length === 0) return new Set()
  const { data } = await supabase
    .from('classe_modules')
    .select('module_id')
    .in('classe_id', classeIds)
  return new Set((data ?? []).map((r) => r.module_id as string))
}

/** Slugs des modules donnés à ces classes. */
export async function slugsModulesDesClasses(
  supabase: SupabaseClient,
  classeIds: string[]
): Promise<Set<string>> {
  const ids = await moduleIdsDesClasses(supabase, classeIds)
  if (ids.size === 0) return new Set()
  const { data } = await supabase.from('modules').select('slug').in('id', [...ids])
  return new Set((data ?? []).map((m) => m.slug as string))
}

/**
 * Slugs des modules, CLASSE PAR CLASSE. Sert au tableau de bord élève, dont les
 * drapeaux passent au périmètre par inscription : une tâche Quazian ne naît que
 * d'une classe qui A Quazian, même quand l'écran agrège deux classes.
 * Une classe sans module a une entrée vide (jamais absente) → l'appelant n'a pas
 * à distinguer « pas de module » de « classe inconnue ».
 */
export async function slugsModulesParClasse(
  supabase: SupabaseClient,
  classeIds: string[]
): Promise<Map<string, Set<string>>> {
  const parClasse = new Map<string, Set<string>>(classeIds.map((id) => [id, new Set<string>()]))
  if (classeIds.length === 0) return parClasse
  const { data: cm } = await supabase
    .from('classe_modules')
    .select('classe_id, module_id')
    .in('classe_id', classeIds)
  const liens = cm ?? []
  const moduleIds = [...new Set(liens.map((r) => r.module_id as string))]
  if (moduleIds.length === 0) return parClasse
  const { data: mods } = await supabase.from('modules').select('id, slug').in('id', moduleIds)
  const slugParId = new Map((mods ?? []).map((m) => [m.id as string, m.slug as string]))
  for (const l of liens) {
    const slug = slugParId.get(l.module_id as string)
    if (slug) parClasse.get(l.classe_id as string)?.add(slug)
  }
  return parClasse
}

/**
 * Cette classe a-t-elle ce module (désigné par son slug) ?
 * Garde des actions de CONCEPTION côté prof : filtrer le sélecteur empêche le
 * geste nominal, cette garde empêche le geste tout court (formulaire rejoué,
 * classe dont le module a été retiré entre l'affichage et l'envoi).
 */
export async function classeAModule(
  supabase: SupabaseClient,
  classeId: string,
  slug: string
): Promise<boolean> {
  const { data: mod } = await supabase.from('modules').select('id').eq('slug', slug).maybeSingle()
  if (!mod) return false
  const { data } = await supabase
    .from('classe_modules')
    .select('classe_id')
    .eq('classe_id', classeId)
    .eq('module_id', mod.id as string)
    .maybeSingle()
  return !!data
}

/**
 * Verdict d'accès d'un élève à un module DANS la classe où il se trouve.
 * `ailleurs` nomme ses AUTRES classes qui ont le module — c'est ce qui permet à
 * l'écran-message d'inviter à changer de classe plutôt que d'opposer un mur.
 * Vide → aucune de ses classes ne l'a (le vieux message reste juste).
 */
export async function accesModuleDansClasse(
  supabase: SupabaseClient,
  eleveId: string,
  moduleId: string,
  classeId: string
): Promise<{ acces: boolean; ailleurs: string[] }> {
  const inscriptions = await inscriptionsModuleEleve(supabase, eleveId, moduleId)
  const acces = inscriptions.some((i) => i.classe_id === classeId)
  return {
    acces,
    ailleurs: acces ? [] : inscriptions.map((i) => i.classe_nom),
  }
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
