'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { type Parametres, PARAMS_DEFAUT } from '@/utils/quazian-params'
import { plafondValide } from '@/utils/quazian-quotas'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

export async function lireParametres(): Promise<Parametres> {
  const { supabase } = await verifierProf()
  const { data } = await supabase
    .from('quazian_parametres')
    .select('valeur')
    .eq('cle', 'global')
    .maybeSingle()
  // Fusion avec les défauts : `valeur` est un jsonb écrit avant que
  // `plafond_cartes` n'existe — une lecture brute rendrait `undefined`.
  const brut = (data?.valeur as Partial<Parametres> | null) ?? null
  if (!brut) return PARAMS_DEFAUT
  return { ...PARAMS_DEFAUT, ...brut, plafond_cartes: plafondValide(brut.plafond_cartes) }
}

export async function sauvegarderParametres(formData: FormData) {
  const { supabase } = await verifierProf()

  // Le plafond se règle dans l'onglet « Génération », pas dans ce formulaire :
  // on repart de la valeur en base pour ne pas la ramener au défaut en douce.
  const actuels = await lireParametres()

  const params: Parametres = {
    a: parseFloat(formData.get('a') as string) || PARAMS_DEFAUT.a,
    b: parseFloat(formData.get('b') as string) || PARAMS_DEFAUT.b,
    centre: parseFloat(formData.get('centre') as string) || PARAMS_DEFAUT.centre,
    pente: parseFloat(formData.get('pente') as string) || PARAMS_DEFAUT.pente,
    w: Math.min(1, Math.max(0, parseFloat(formData.get('w') as string))) || PARAMS_DEFAUT.w,
    retention_cible: parseFloat(formData.get('retention_cible') as string) || PARAMS_DEFAUT.retention_cible,
    plafond_cartes: actuels.plafond_cartes,
  }

  await supabase.from('quazian_parametres').upsert({ cle: 'global', valeur: params }, { onConflict: 'cle' })
  revalidatePath('/prof/quazian/parametres')
  revalidatePath('/prof/quazian/semestre')
  return { success: true }
}

/**
 * Le plafond de cartes, seul — réglé depuis l'onglet « Génération ».
 * Le reste des paramètres est relu puis réécrit tel quel : un `upsert` remplace
 * le `jsonb` entier, il ne fusionne pas.
 */
export async function sauvegarderPlafond(formData: FormData) {
  const { supabase } = await verifierProf()
  const actuels = await lireParametres()
  const params: Parametres = {
    ...actuels,
    plafond_cartes: plafondValide(formData.get('plafond_cartes')),
  }
  await supabase.from('quazian_parametres').upsert({ cle: 'global', valeur: params }, { onConflict: 'cle' })
  revalidatePath('/prof/quazian/parametres')
  return { success: true }
}
