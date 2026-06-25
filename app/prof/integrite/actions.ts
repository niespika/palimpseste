'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  confirmerSignalement, acquitterSignalement, debloquerEleve,
  MESSAGE_STRIKE_DEFAUT, MESSAGE_BLOQUE_DEFAUT,
} from '@/utils/integrite'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
}

function revalider() {
  revalidatePath('/prof/integrite')
  revalidatePath('/prof')
}

// Prof confirme un signal IA → +1 strike (peut bloquer l'élève).
export async function actionConfirmerSignalement(id: string) {
  await verifierProf()
  await confirmerSignalement(createAdminClient(), id)
  revalider()
}

// Prof écarte un signal (faux positif) — ne compte pas.
export async function actionEcarterSignalement(id: string) {
  await verifierProf()
  await acquitterSignalement(createAdminClient(), id, true)
  revalider()
}

// Prof prend acte d'une alerte info (strike algo déjà comptabilisé).
export async function actionAcquitterSignalement(id: string) {
  await verifierProf()
  await acquitterSignalement(createAdminClient(), id, false)
  revalider()
}

// Prof débloque un élève (-1 strike).
export async function actionDebloquerEleve(eleveId: string) {
  await verifierProf()
  await debloquerEleve(createAdminClient(), eleveId)
  revalider()
}

// Bulle vide ou identique au défaut → null (on retombe sur le défaut du code).
const nullSiDefaut = (valeur: string, defaut: string): string | null =>
  valeur.trim() && valeur.trim() !== defaut.trim() ? valeur : null

export interface ParamsIntegriteForm {
  actif: boolean
  seuil: number
  messageStrike: string
  messageBloque: string
}

export async function sauvegarderParamsIntegrite(p: ParamsIntegriteForm) {
  await verifierProf()
  const admin = createAdminClient()
  await admin.from('integrite_params').update({
    actif: p.actif,
    seuil_strikes: Math.max(1, Math.min(20, Math.round(p.seuil) || 3)),
    message_strike: nullSiDefaut(p.messageStrike, MESSAGE_STRIKE_DEFAUT),
    message_bloque: nullSiDefaut(p.messageBloque, MESSAGE_BLOQUE_DEFAUT),
    updated_at: new Date().toISOString(),
  }).eq('id', 1)
  revalider()
  return { success: true }
}
