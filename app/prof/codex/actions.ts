'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  chargerCiblesQuazian, resoudreCible, refCible, type CibleQuazian,
} from '@/utils/quazian-cibles'
import { classeAModule } from '@/utils/acces'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// Cibles d'une synthèse Codex — l'arc BI-SOURCE, recâblé le 14/08.
//
// Avant : cette fonction demandait `scriptorium_unites` où `type='unite'`. Zéro
// ligne depuis la réorganisation du Scriptorium → le formulaire affichait
// « Aucune unité dans le Scriptorium » alors que la bibliothèque en contenait
// trois, et le chemin NOMINAL de création était mort. Seul survivait le chemin
// gaté du plan d'évaluation, qui ancre par `contenu_id`.
//
// C'est la fracture exacte que C7·L1 a réparée pour Quazian, et le vocabulaire
// qu'il a posé se réemploie tel quel : `scriptorium_unites` reste lisible (bras
// hérité), les Textes et Cours de la bibliothèque deviennent les cibles du jour,
// et les livres Aletheia restent hors de portée (anti-spoiler, filtré à la source).
export async function lireCiblesCodex(): Promise<CibleQuazian[]> {
  const { supabase } = await verifierProf()
  return chargerCiblesQuazian(supabase)
}

// Créer une synthèse (classe × cible) en brouillon
export async function creerSynthese(formData: FormData) {
  const { supabase, userId } = await verifierProf()
  const cibleId = formData.get('cible_id') as string
  const classeId = (formData.get('classe_id') as string) || null
  const dureeMin = parseInt(formData.get('duree_phase_min') as string) || 25

  if (!cibleId) return { error: 'Choisis un contenu du Scriptorium.' }
  // D2 : une synthèse a TOUJOURS une classe (le formulaire rend déjà le champ requis ;
  // cette garde tarit la source de sessions sans classe — cf. fix P0 calendrier).
  if (!classeId) return { error: 'Choisis une classe pour cette synthèse.' }
  // Accès & classes · L1 — on ne conçoit pas pour une classe qui n'a pas le
  // module (c'est ainsi qu'une synthèse Codex a pu naître sur T5, le 14/08).
  if (!(await classeAModule(supabase, classeId, 'codex'))) {
    return { error: 'Cette classe n’a pas le module Codex. Donne-lui le module depuis sa fiche, ou choisis une autre classe.' }
  }

  // L'arc est EXCLUSIF (CHECK `codex_sessions_source_chk`, posé par
  // plan_evaluation_phase_a.sql) : on résout le bras de la cible pour n'écrire que
  // sa colonne. Une cible introuvable (retirée entre l'affichage et l'envoi, ou un
  // livre) est refusée ici plutôt que de heurter le CHECK.
  const cible = await resoudreCible(supabase, cibleId)
  if (!cible) return { error: 'Ce contenu n’existe plus dans le Scriptorium.' }

  const { error } = await supabase.from('codex_sessions').insert({
    ...refCible(cible),
    classe_id: classeId,
    duree_phase_min: dureeMin,
    statut: 'brouillon',
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath('/prof/codex')
  return { success: true }
}

export async function supprimerSynthese(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string

  const { error } = await supabase
    .from('codex_sessions')
    .delete()
    .eq('id', id)
    .eq('statut', 'brouillon')

  if (error) return { error: error.message }
  revalidatePath('/prof/codex')
  return { success: true }
}

// Lancer la synthèse : brouillon → phase_1 (V1)
export async function lancerSynthese(formData: FormData) {
  const { supabase } = await verifierProf()
  const sessionId = formData.get('sessionId') as string

  const { data: session } = await supabase
    .from('codex_sessions')
    .select('duree_phase_min, statut')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Synthèse introuvable' }
  if (session.statut !== 'brouillon') return { error: 'La synthèse est déjà lancée.' }

  const maintenant = new Date()
  const finPhase = new Date(maintenant.getTime() + session.duree_phase_min * 60 * 1000)

  const { error } = await supabase
    .from('codex_sessions')
    .update({
      statut: 'phase_1',
      lance_at: maintenant.toISOString(),
      phase_courante_fin_at: finPhase.toISOString(),
    })
    .eq('id', sessionId)
    .eq('statut', 'brouillon')

  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/synthese/${sessionId}`)
  return { success: true }
}

// Passer en phase_2 (V-finale)
export async function passerPhase2(formData: FormData) {
  const { supabase } = await verifierProf()
  const sessionId = formData.get('sessionId') as string

  const { data: session } = await supabase
    .from('codex_sessions')
    .select('duree_phase_min, statut')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: 'Synthèse introuvable' }
  if (session.statut !== 'phase_1') return { error: 'La synthèse n\'est pas en phase 1.' }

  const maintenant = new Date()
  const finPhase = new Date(maintenant.getTime() + session.duree_phase_min * 60 * 1000)

  const { error } = await supabase
    .from('codex_sessions')
    .update({
      statut: 'phase_2',
      phase_2_at: maintenant.toISOString(),
      phase_courante_fin_at: finPhase.toISOString(),
    })
    .eq('id', sessionId)
    .eq('statut', 'phase_1')

  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/synthese/${sessionId}`)
  return { success: true }
}

// Fermer la synthèse
export async function fermerSynthese(formData: FormData) {
  const { supabase } = await verifierProf()
  const sessionId = formData.get('sessionId') as string

  const { error } = await supabase
    .from('codex_sessions')
    .update({
      statut: 'fermee',
      ferme_at: new Date().toISOString(),
      phase_courante_fin_at: null,
    })
    .eq('id', sessionId)
    .in('statut', ['phase_1', 'phase_2'])

  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/synthese/${sessionId}`)
  revalidatePath('/prof/codex')
  return { success: true }
}
