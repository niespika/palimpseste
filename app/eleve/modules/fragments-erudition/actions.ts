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
  const inscriptionId = formData.get('inscriptionId') as string
  const commentaire = formData.get('commentaire') as string | null
  const chemins = formData.getAll('chemins') as string[]

  if (chemins.length === 0) return { error: 'Aucune photo reçue.' }

  // Valider que l'inscription appartient bien à l'élève (et est active)
  const { data: inscription } = await supabase
    .from('inscriptions')
    .select('id')
    .eq('id', inscriptionId)
    .eq('eleve_id', userId)
    .eq('statut', 'active')
    .maybeSingle()
  if (!inscription) return { error: 'Contexte de classe invalide.' }

  // Gate de lecture (Lot 10) : interdire un nouveau dépôt tant que le dernier
  // retour publié de cette inscription n'a pas été marqué « lu ».
  const adminGate = createAdminClient()
  const { data: depotsInsc } = await adminGate
    .from('fragments_depots')
    .select('id')
    .eq('inscription_id', inscriptionId)
  const depotIdsInsc = (depotsInsc ?? []).map((d) => d.id)
  if (depotIdsInsc.length > 0) {
    const { data: derniere } = await adminGate
      .from('fragments_analyses')
      .select('id, retour_lu_at')
      .eq('statut', 'publiee')
      .in('depot_id', depotIdsInsc)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (derniere && !derniere.retour_lu_at) {
      return { error: 'Lis et valide d’abord ton dernier retour avant de déposer un nouveau fragment.' }
    }
  }

  // Vérifier que la semaine est ouverte
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('id, ouverte, date_limite')
    .eq('id', semaineId)
    .single()

  if (!semaine?.ouverte) return { error: 'Cette semaine est fermée.' }

  const maintenant = new Date()
  const statut = maintenant > new Date(semaine.date_limite) ? 'en_retard' : 'depose'

  // Supprimer l'ancien dépôt de CETTE inscription s'il existe (photos via CASCADE)
  const { data: depotExistant } = await supabase
    .from('fragments_depots')
    .select('id, fragments_photos(storage_path)')
    .eq('inscription_id', inscriptionId)
    .eq('semaine_id', semaineId)
    .maybeSingle()

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
      inscription_id: inscriptionId,
      semaine_id: semaineId,
      statut,
      commentaire_eleve: commentaire || null,
      photos_suspectes: formData.get('photos_suspectes') === 'true',
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

// Gate de lecture (Lot 10) : l'élève valide qu'il a lu le retour d'une analyse.
export async function validerLectureRetour(analyseId: string) {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()

  const { data: analyse } = await admin
    .from('fragments_analyses')
    .select('id, depot_id')
    .eq('id', analyseId)
    .maybeSingle()
  if (!analyse) return { error: 'Retour introuvable.' }

  const { data: depot } = await admin
    .from('fragments_depots')
    .select('eleve_id')
    .eq('id', analyse.depot_id)
    .maybeSingle()
  if (depot?.eleve_id !== userId) return { error: 'Accès refusé.' }

  await admin.from('fragments_analyses').update({ retour_lu_at: new Date().toISOString() }).eq('id', analyseId)
  revalidatePath('/eleve/modules/fragments-erudition')
  return { success: true }
}

export async function getSignedUrls(chemins: string[]): Promise<Record<string, string>> {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()
  const urls: Record<string, string> = {}

  await Promise.all(
    chemins.map(async (chemin) => {
      // L'élève ne peut signer que ses propres fichiers (dossier = son uid)
      if (!chemin.startsWith(`${userId}/`)) return
      const { data } = await admin.storage
        .from('fragments')
        .createSignedUrl(chemin, 3600)
      if (data?.signedUrl) urls[chemin] = data.signedUrl
    })
  )

  return urls
}
