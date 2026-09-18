'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireLaPorteAgenda } from '@/utils/calendrier-agenda-porte'
import { validerEvenementAgenda, estUneDate } from '@/utils/calendrier-agenda'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

/**
 * Édition légère d'une date depuis le calendrier : délègue l'écriture au module
 * propriétaire (le calendrier ne stocke aucune échéance). Seuls les événements
 * déclarés `is_editable` par l'agrégateur sont modifiables.
 */
export async function modifierDateEvenement(input: {
  source_module: string
  source_id: string
  classe_id: string | null
  date: string
}): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()

  if (!estUneDate(input.date)) return { error: 'Date invalide.' }

  switch (input.source_module) {
    case 'fragments': {
      // Essai : la date est portée par classe (fragments_essais_classes).
      if (!input.classe_id) return { error: 'Classe manquante.' }
      const { error } = await supabase
        .from('fragments_essais_classes')
        .update({ date_essai: input.date })
        .eq('essai_id', input.source_id)
        .eq('classe_id', input.classe_id)
      if (error) return { error: error.message }
      break
    }
    // (Un évènement de l'agenda de classe se modifie par `modifierEvenementAgenda`,
    //  depuis ses propres commandes en vue jour — pas par cet éditeur de date.)
    default:
      return { error: 'Cet événement n’est pas modifiable depuis le calendrier.' }
  }

  revalidatePath('/prof/calendrier')
  revalidatePath('/prof')
  return {}
}

// ── L'agenda de classe (18/09) — les évènements libres, propriété du calendrier ──
// Porte `agenda_classe_actif` : fermée, aucune écriture (l'invariant « inerte »
// vaut aussi côté écriture, patron `verifierProfGate`). Retrait = tombstone
// (`supprime_at`), jamais de DELETE.

async function verifierProfAgenda(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') return { error: 'Accès refusé.' }
  if (!(await lireLaPorteAgenda(createAdminClient()))) return { error: 'L’agenda de classe est fermé (Scriptorium → Paramètres).' }
  return { supabase, userId: user.id }
}

function revaliderAgenda() {
  revalidatePath('/prof/calendrier')
  revalidatePath('/prof')
  revalidatePath('/eleve/calendrier')
}

/** Crée UN évènement PAR CLASSE choisie (même titre, même date). */
export async function creerEvenementAgenda(input: {
  titre: string; date: string; detail: string | null; visible_eleves: boolean; classe_ids: string[]
}): Promise<{ error?: string; crees?: number }> {
  const garde = await verifierProfAgenda()
  if ('error' in garde) return { error: garde.error }
  const v = validerEvenementAgenda(input)
  if (!v.ok) return { error: v.error }
  // Les classes doivent exister et être actives : une classe archivée n'a plus de calendrier.
  const { data: classes } = await garde.supabase
    .from('classes').select('id').in('id', v.valeur.classe_ids).eq('statut', 'active')
  const connues = new Set((classes ?? []).map((c) => c.id as string))
  const cibles = v.valeur.classe_ids.filter((id) => connues.has(id))
  if (cibles.length === 0) return { error: 'Aucune de ces classes n’est active.' }
  // Jamais en silence : une classe archivée entre le rendu et l'envoi fait refuser
  // l'ensemble, plutôt que d'écrire pour les autres sans le dire.
  if (cibles.length < v.valeur.classe_ids.length) return { error: 'L’une des classes choisies n’est plus active : recharge la page.' }
  const { error } = await garde.supabase.from('calendrier_evenements').insert(cibles.map((classe_id) => ({
    classe_id,
    date: v.valeur.date,
    titre: v.valeur.titre,
    detail: v.valeur.detail,
    visible_eleves: v.valeur.visible_eleves,
    created_by: garde.userId,
  })))
  if (error) return { error: error.message }
  revaliderAgenda()
  return { crees: cibles.length }
}

/** Modifie titre, date, détail et visibilité d'UN évènement (une ligne = une classe). */
export async function modifierEvenementAgenda(input: {
  id: string; titre: string; date: string; detail: string | null; visible_eleves: boolean
}): Promise<{ error?: string }> {
  const garde = await verifierProfAgenda()
  if ('error' in garde) return { error: garde.error }
  if (!RE_UUID.test(input.id)) return { error: 'Évènement invalide.' }
  // La classe ne change pas : on la relit pour passer la validation commune.
  const { data: ligne } = await garde.supabase
    .from('calendrier_evenements').select('classe_id').eq('id', input.id).is('supprime_at', null).maybeSingle()
  if (!ligne) return { error: 'Évènement introuvable.' }
  const v = validerEvenementAgenda({ ...input, classe_ids: [ligne.classe_id as string] })
  if (!v.ok) return { error: v.error }
  const { error } = await garde.supabase.from('calendrier_evenements')
    .update({ titre: v.valeur.titre, date: v.valeur.date, detail: v.valeur.detail, visible_eleves: v.valeur.visible_eleves, updated_at: new Date().toISOString() })
    .eq('id', input.id).is('supprime_at', null)
  if (error) return { error: error.message }
  revaliderAgenda()
  return {}
}

export async function supprimerEvenementAgenda(id: string): Promise<{ error?: string }> {
  const garde = await verifierProfAgenda()
  if ('error' in garde) return { error: garde.error }
  if (!RE_UUID.test(id)) return { error: 'Évènement invalide.' }
  const { error } = await garde.supabase.from('calendrier_evenements')
    .update({ supprime_at: new Date().toISOString() }).eq('id', id).is('supprime_at', null)
  if (error) return { error: error.message }
  revaliderAgenda()
  return {}
}
