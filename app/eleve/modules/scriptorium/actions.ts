'use server'

// Actions élève du chat Scriptorium (RAG L5, §7.1) : renommer / supprimer
// (soft-delete — la synthèse hebdo lit tout, §15.12). RLS eleve_own : le filtre
// eleve_id est porté par la policy, on revérifie quand même l'appartenance.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

export async function renommerConversation(conversationId: string, titre: string): Promise<{ error?: string }> {
  const { supabase, userId } = await verifierEleve()
  if (!RE_UUID.test(conversationId)) return { error: 'Identifiant invalide.' }
  const propre = titre.trim().slice(0, 80)
  if (!propre) return { error: 'Donne un titre à la conversation.' }
  const { error } = await supabase
    .from('scriptorium_conversations')
    .update({ titre: propre, updated_at: new Date().toISOString() })
    .eq('id', conversationId).eq('eleve_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/eleve/modules/scriptorium')
  return {}
}

export async function supprimerConversation(conversationId: string): Promise<{ error?: string }> {
  const { supabase, userId } = await verifierEleve()
  if (!RE_UUID.test(conversationId)) return { error: 'Identifiant invalide.' }
  const { error } = await supabase
    .from('scriptorium_conversations')
    .update({ supprime_at: new Date().toISOString() })
    .eq('id', conversationId).eq('eleve_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/eleve/modules/scriptorium')
  return {}
}
