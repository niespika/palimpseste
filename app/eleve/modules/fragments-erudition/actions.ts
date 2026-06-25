'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lancerAnalyse } from '@/utils/analyse'
import { detecterAveuHeuristique } from '@/utils/detecteur-integrite'
import { messageSiBloque, signalerStrikeAuto } from '@/utils/integrite'

// Vérifier que l'appelant est bien un élève
async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

export async function deposerCompteRendu(formData: FormData) {
  const { supabase, userId } = await verifierEleve()

  const semaineId = formData.get('semaineId') as string
  const inscriptionId = formData.get('inscriptionId') as string
  const commentaire = formData.get('commentaire') as string | null
  const chemins = formData.getAll('chemins') as string[]

  if (chemins.length === 0) return { error: 'Aucune photo reçue.' }
  // Les chemins doivent appartenir à l'élève (dossier de stockage = son uid), comme
  // getSignedUrls et le dépôt Codex — sinon un élève pourrait référencer le fichier d'un autre.
  if (chemins.some((c) => !c.startsWith(`${userId}/`))) return { error: 'Chemins de photos invalides.' }

  // Blocage « petit malin » : plus aucun dépôt tant que le prof n'a pas débloqué.
  const blocage = await messageSiBloque(createAdminClient(), userId)
  if (blocage) return { error: blocage }

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
    .select('id, ouverte, date_limite, semestre_id')
    .eq('id', semaineId)
    .single()

  if (!semaine?.ouverte) return { error: 'Cette semaine est fermée.' }
  // Refuser le dépôt sur une semaine hors semestre actif (semaine restée ouverte
  // d'un semestre précédent).
  const { data: semActifDepot } = await supabase.from('semesters').select('id').eq('is_active', true).maybeSingle()
  if (semActifDepot && semaine.semestre_id && semaine.semestre_id !== semActifDepot.id) {
    return { error: 'Cette semaine n’appartient pas au semestre en cours.' }
  }

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

  // T3 — passe 1 : heuristique stricte sur le commentaire (aveu / section N/A).
  const sigHeuristique = detecterAveuHeuristique(commentaire)

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
      photo_prise_at: (formData.get('photo_prise_at') as string) || null,
      signal_integrite: sigHeuristique,
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

  // Strike auto si aveu détecté au dépôt (heuristique). Ref stable par semaine :
  // re-déposer la même semaine ne re-strike pas. Le hors-sujet (IA) suit à l'analyse.
  const { avertissement } = sigHeuristique
    ? await signalerStrikeAuto(admin, { eleveId: userId, module: 'fragments', renduRef: `${inscriptionId}:${semaineId}`, type: sigHeuristique.type, motif: sigHeuristique.motif })
    : { avertissement: null }

  return { success: true, statut, avertissement }
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
