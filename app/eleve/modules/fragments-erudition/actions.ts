'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lancerAnalyse } from '@/utils/analyse'

// Vérifier que l'appelant est bien un élève
async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

export async function deposerCompteRendu(formData: FormData) {
  const { supabase, userId } = await verifierEleve()

  const semaineId = formData.get('semaineId') as string
  const commentaire = formData.get('commentaire') as string | null
  const chemins = formData.getAll('chemins') as string[]

  if (chemins.length === 0) return { error: 'Aucune photo reçue.' }

  // Vérifier que la semaine est ouverte
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('id, ouverte, date_limite')
    .eq('id', semaineId)
    .single()

  if (!semaine?.ouverte) return { error: 'Cette semaine est fermée.' }

  const maintenant = new Date()
  const statut = maintenant > new Date(semaine.date_limite) ? 'en_retard' : 'depose'

  // Supprimer l'ancien dépôt s'il existe (photos incluses via CASCADE)
  const { data: depotExistant } = await supabase
    .from('fragments_depots')
    .select('id, fragments_photos(storage_path)')
    .eq('eleve_id', userId)
    .eq('semaine_id', semaineId)
    .single()

  if (depotExistant) {
    // Supprimer les anciennes photos du stockage
    const anciensChemin = (depotExistant.fragments_photos as { storage_path: string }[])
      .map(p => p.storage_path)
    if (anciensChemin.length > 0) {
      await supabase.storage.from('fragments').remove(anciensChemin)
    }
    // Supprimer l'enregistrement (cascade supprime les photos)
    await supabase.from('fragments_depots').delete().eq('id', depotExistant.id)
  }

  // Créer le nouveau dépôt
  const { data: nouveauDepot, error: erreurDepot } = await supabase
    .from('fragments_depots')
    .insert({
      eleve_id: userId,
      semaine_id: semaineId,
      statut,
      commentaire_eleve: commentaire || null,
    })
    .select('id')
    .single()

  if (erreurDepot || !nouveauDepot) {
    return { error: `Erreur lors du dépôt : ${erreurDepot?.message}` }
  }

  // Enregistrer les photos
  const photos = chemins.map((chemin, index) => ({
    depot_id: nouveauDepot.id,
    storage_path: chemin,
    ordre: index + 1,
  }))

  const { error: erreurPhotos } = await supabase
    .from('fragments_photos')
    .insert(photos)

  if (erreurPhotos) {
    return { error: `Photos enregistrées mais erreur metadata : ${erreurPhotos.message}` }
  }

  // Créer immédiatement l'enregistrement d'analyse (synchrone, garanti)
  const admin = createAdminClient()
  await admin.from('fragments_analyses').insert({
    depot_id: nouveauDepot.id,
    statut: 'en_cours',
  })

  revalidatePath('/eleve/modules/fragments-erudition')

  // Déclencher l'analyse IA en arrière-plan
  const depotIdPourAnalyse = nouveauDepot.id
  const eleveIdPourAnalyse = userId
  after(async () => {
    await lancerAnalyse(depotIdPourAnalyse, eleveIdPourAnalyse)
  })

  return { success: true, statut }
}

export async function getSignedUrls(chemins: string[]): Promise<Record<string, string>> {
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
