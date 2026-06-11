'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

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
  return supabase
}

export async function creerSemaine(formData: FormData) {
  const supabase = await verifierProf()

  const { data: derniere } = await supabase
    .from('fragments_semaines')
    .select('numero')
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  const numero = (derniere?.numero ?? 0) + 1

  const { error } = await supabase.from('fragments_semaines').insert({
    numero,
    titre: (formData.get('titre') as string) || null,
    date_debut: formData.get('dateDebut') as string,
    date_limite: formData.get('dateLimite') as string,
    ouverte: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition')
  revalidatePath('/prof/fragments-erudition/semaines')
  return { success: true }
}

export async function toggleSemaineOuverte(formData: FormData) {
  const supabase = await verifierProf()
  const id = formData.get('id') as string
  const ouverte = formData.get('ouverte') === 'true'

  const { error } = await supabase
    .from('fragments_semaines')
    .update({ ouverte: !ouverte })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/prof/fragments-erudition/semaines')
  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}

export async function sauvegarderTheme(formData: FormData) {
  const supabase = await verifierProf()
  const eleveId = formData.get('eleveId') as string
  const theme = formData.get('theme') as string
  const description = (formData.get('description') as string) || null

  const { data: existant } = await supabase
    .from('fragments_themes')
    .select('id')
    .eq('eleve_id', eleveId)
    .maybeSingle()

  if (existant) {
    await supabase
      .from('fragments_themes')
      .update({ theme, description })
      .eq('eleve_id', eleveId)
  } else {
    await supabase
      .from('fragments_themes')
      .insert({ eleve_id: eleveId, theme, description })
  }

  revalidatePath('/prof/fragments-erudition/themes')
  return { success: true }
}

export async function getSignedUrlsProf(chemins: string[]): Promise<Record<string, string>> {
  await verifierProf()
  const admin = createAdminClient()
  const urls: Record<string, string> = {}

  await Promise.all(
    chemins.map(async (chemin) => {
      const { data } = await admin.storage
        .from('fragments')
        .createSignedUrl(chemin, 3600)
      if (data?.signedUrl) urls[chemin] = data.signedUrl
    })
  )

  return urls
}

export async function supprimerDepot(formData: FormData) {
  const supabase = await verifierProf()
  const depotId = formData.get('depotId') as string
  const admin = createAdminClient()

  // Récupérer les chemins des photos
  const { data: photos } = await supabase
    .from('fragments_photos')
    .select('storage_path')
    .eq('depot_id', depotId)

  if (photos && photos.length > 0) {
    await admin.storage
      .from('fragments')
      .remove(photos.map(p => p.storage_path))
  }

  await supabase.from('fragments_depots').delete().eq('id', depotId)

  revalidatePath('/prof/fragments-erudition')
  return { success: true }
}
