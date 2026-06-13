'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { type Parametres, PARAMS_DEFAUT } from '@/utils/quazian-params'

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
  return (data?.valeur as Parametres) ?? PARAMS_DEFAUT
}

export async function sauvegarderParametres(formData: FormData) {
  const { supabase } = await verifierProf()

  const params: Parametres = {
    a: parseFloat(formData.get('a') as string) || PARAMS_DEFAUT.a,
    b: parseFloat(formData.get('b') as string) || PARAMS_DEFAUT.b,
    centre: parseFloat(formData.get('centre') as string) || PARAMS_DEFAUT.centre,
    pente: parseFloat(formData.get('pente') as string) || PARAMS_DEFAUT.pente,
    w: Math.min(1, Math.max(0, parseFloat(formData.get('w') as string))) || PARAMS_DEFAUT.w,
    retention_cible: parseFloat(formData.get('retention_cible') as string) || PARAMS_DEFAUT.retention_cible,
  }

  await supabase.from('quazian_parametres').upsert({ cle: 'global', valeur: params }, { onConflict: 'cle' })
  revalidatePath('/prof/quazian/parametres')
  revalidatePath('/prof/quazian/semestre')
  return { success: true }
}
