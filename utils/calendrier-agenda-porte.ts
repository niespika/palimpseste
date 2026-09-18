import 'server-only'
// ============================================================================
// L'AGENDA DE CLASSE — L'INTERRUPTEUR, `agenda_classe_actif`. 18/09/2026.
// Patron : `utils/moteur/porte-notions.ts`.
// ----------------------------------------------------------------------------
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// Colonne `scriptorium_params.agenda_classe_actif` (`calendrier_agenda_classe.sql`).
// ⚠️ Lecture TOLÉRANTE : colonne absente (migration non jouée) ou illisible ⇒ OFF.
// Ce qu'elle protège : la source 6 du calendrier (évènements libres, prof et
// élève), le formulaire d'ajout au calendrier prof, l'intitulé des exercices du
// plan (saisie dans la grille, affichage aux deux calendriers).
// ============================================================================
import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLesReglages } from '@/utils/scriptorium-params'

export async function lireLaPorteAgenda(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await lireLesReglages(admin)
  if (error) return false
  return !!(data as { agenda_classe_actif?: boolean } | null)?.agenda_classe_actif
}

export async function basculerLaPorteAgenda(
  admin: SupabaseClient, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ agenda_classe_actif: actif })
    .eq('id', 1).select('agenda_classe_actif')
  if (error) return { ok: false, message: `Bascule refusée : ${error.message}` }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'L’agenda de classe est ouvert : le calendrier prof propose « Ajouter un évènement », les élèves voient ceux qui leur sont destinés, et les exercices du plan portent leur intitulé.'
    : 'L’agenda de classe est fermé : aucun évènement libre n’est affiché (prof ni élève), les intitulés d’exercices ne se saisissent ni ne s’affichent plus. Rien n’est effacé.' }
}
