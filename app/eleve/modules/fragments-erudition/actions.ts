'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { lancerAnalyse } from '@/utils/analyse'
import { detecterAveuHeuristique } from '@/utils/detecteur-integrite'
import { messageSiBloque, signalerStrikeAuto } from '@/utils/integrite'
import { messageSiRetoursNonLus } from '@/utils/retours-lus'
import { etatOngletsFragmentsEleve, type EtatOngletsFragments } from '@/utils/fragments-etat-eleve'
import { themePropose } from '@/utils/fragments-theme'

// Vérifier que l'appelant est bien un élève
async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// ── C8 — l'élève propose son thème ; le professeur le relit et le valide ─────
// Demande de Louis (02/09). Écriture par le client admin (aucune policy élève
// d'écriture sur `fragments_themes` — on n'en ouvre pas), l'inscription vérifiée
// dans le code, comme le dépôt. `propose_at` porte l'instant ; « à valider » se
// dérive (`utils/fragments-theme.ts`).
export async function proposerTheme(formData: FormData) {
  const { supabase, userId } = await verifierEleve()
  const inscriptionId = String(formData.get('inscriptionId') ?? '')
  const semestreId = String(formData.get('semestreId') ?? '')
  const theme = themePropose(String(formData.get('theme') ?? ''))
  const description = String(formData.get('description') ?? '').replace(/\r\n/g, '\n').trim().slice(0, 1000) || null
  if (!theme) return { error: 'Écris ton thème avant de le proposer.' }
  if (!semestreId) return { error: 'Aucun semestre en cours.' }

  const { data: inscription } = await supabase
    .from('inscriptions').select('id').eq('id', inscriptionId).eq('eleve_id', userId).eq('statut', 'active').maybeSingle()
  if (!inscription) return { error: 'Contexte de classe invalide.' }
  const admin = createAdminClient()
  const { data: semestre } = await admin.from('semesters').select('id').eq('id', semestreId).eq('is_active', true).maybeSingle()
  if (!semestre) return { error: 'Ce semestre n’est pas en cours.' }

  const maintenant = new Date().toISOString()
  const { data: existant } = await admin
    .from('fragments_themes').select('id').eq('inscription_id', inscriptionId).eq('semestre_id', semestreId).maybeSingle()
  const { error } = existant
    ? await admin.from('fragments_themes').update({ theme, description, propose_at: maintenant }).eq('id', existant.id)
    : await admin.from('fragments_themes').insert({ inscription_id: inscriptionId, semestre_id: semestreId, eleve_id: userId, theme, description, propose_at: maintenant })
  if (error) return { error: `Le thème n’a pas été enregistré : ${error.message}` }
  revalidatePath('/eleve/modules/fragments-erudition')
  revalidatePath('/prof/fragments-erudition/suivi')
  revalidatePath('/prof')
  return { success: true }
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

  // Gate de lecture (transversal) : interdire un nouveau dépôt écrit tant qu'un
  // retour, dans n'importe quel module, n'est pas lu et validé. Remplace l'ancien
  // gate Lot 10 (limité au dernier retour écrit de l'inscription) — désormais
  // couvert par la source « Fragments écrit » du helper, et plus largement.
  const gateLecture = await messageSiRetoursNonLus(createAdminClient(), userId)
  if (gateLecture) return { error: gateLecture }

  // Vérifier que la semaine est ouverte
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('id, ouverte, date_limite, semestre_id')
    .eq('id', semaineId)
    .single()

  if (!semaine?.ouverte) return { error: 'Cette semaine est fermée.' }
  // Refuser le dépôt sur une semaine hors semestre actif (semaine restée ouverte
  // d'un semestre précédent). FAIL-CLOSED : l'absence de semestre actif ne vaut pas
  // autorisation. La garde était `if (semActifDepot && …)` — donc SAUTÉE quand aucune
  // ligne ne porte le drapeau, et un dépôt passait alors sur une semaine ouverte d'un
  // semestre archivé. Ce cas était hors d'atteinte tant qu'on ne pouvait pas archiver
  // le semestre actif ; le lot Calendrier · Année a levé ce garde-fou (l'archivage
  // porte désormais sur l'année entière), d'où ce resserrement.
  const { data: semActifDepot } = await supabase.from('semesters').select('id').eq('is_active', true).maybeSingle()
  if (!semActifDepot) {
    return { error: 'Aucun semestre en cours — le dépôt est fermé. Préviens ton enseignant.' }
  }
  if (semaine.semestre_id && semaine.semestre_id !== semActifDepot.id) {
    return { error: 'Cette semaine n’appartient pas au semestre en cours.' }
  }

  // `date_limite` est un INSTANT : la fin de journée du dimanche DANS LE FUSEAU DE
  // L'ÉCOLE (écrite par la synchronisation des semaines). La comparaison d'instants
  // est donc juste telle quelle — et c'est bien la bonne heure depuis l'item 7 :
  // avant, la date pure valait minuit UTC, et tout ce qui était rendu après 19 h ou
  // 20 h le SAMEDI comptait déjà « en retard ».
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
    const anciensChemin = (depotExistant.fragments_photos as { storage_path: string }[])
      .map(p => p.storage_path)

    // ⛔⛔ L'ORDRE EST LE CORRECTIF, ET IL ÉTAIT INVERSÉ — 29/08. Les photos du
    //    Storage partaient EN PREMIER, puis l'enregistrement était supprimé
    //    avec le client de l'ÉLÈVE — or la seule policy DELETE de
    //    `fragments_depots` est `est_prof()`. Résultat mesuré : `DELETE 0`,
    //    **aucune erreur levée** (`supabase-js` ne lève pas), **et le retour
    //    n'était pas lu**. La contrainte `UNIQUE (inscription_id, semaine_id)`
    //    refusait ensuite le nouveau dépôt : l'élève voyait une erreur, son
    //    ancien dépôt survivait — **et ses photos étaient déjà détruites**, la
    //    ligne pointant vers des fichiers qui n'existaient plus.
    // ⭐ On supprime donc D'ABORD ce qui est réversible (la ligne) et
    //    SEULEMENT ENSUITE ce qui ne l'est pas (les fichiers). *On s'arrête
    //    avant de figer quoi que ce soit* — la doctrine que `fermerQuizz`
    //    écrit déjà pour le professeur.
    // ⭐ Écriture serveur (C1) : le client admin contourne la RLS, alors la
    //    **garde de propriété est le `.eq('eleve_id', userId)`** — NE PAS le
    //    retirer, c'est lui qui remplace la policy.
    // ⚠️ La suppression emporte en cascade `fragments_photos` ET
    //    `fragments_analyses` : l'analyse de l'ancien dépôt est caduque, c'est
    //    voulu.
    const { data: efface, error: eEfface } = await createAdminClient()
      .from('fragments_depots')
      .delete()
      .eq('id', depotExistant.id)
      .eq('eleve_id', userId)
      .select('id')

    if (eEfface || !efface || efface.length === 0) {
      return { error: 'Ton dépôt précédent n’a pas pu être remplacé — rien n’a été modifié, '
        + 'tes photos sont intactes. Réessaie, et préviens ton professeur si cela se répète.' }
    }

    // Les anciens fichiers ne partent qu'une fois la ligne effectivement effacée.
    // ⚠️ Son échec laisserait des fichiers orphelins — gênant, jamais destructeur —
    //    et le dépôt doit aboutir : on le dit au journal, on ne l'interrompt pas.
    if (anciensChemin.length > 0) {
      const { error: eStorage } = await supabase.storage.from('fragments').remove(anciensChemin)
      if (eStorage) console.error(`[fragments] photos orphelines pour ${depotExistant.id} : ${eStorage.message}`)
    }
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

  // Idempotent (compare-and-set sur retour_lu_at null) + ne marque qu'une analyse publiée.
  const { error } = await admin
    .from('fragments_analyses')
    .update({ retour_lu_at: new Date().toISOString() })
    .eq('id', analyseId)
    .eq('statut', 'publiee')
    .is('retour_lu_at', null)
  if (error) return { error: 'Action indisponible pour le moment, réessaie.' }
  revalidatePath('/eleve/modules/fragments-erudition')
  return { success: true }
}

// Validation de lecture du retour d'ESSAI (source transversale). Le dépôt d'essai
// (travail noté) reste TOUJOURS ouvert, mais ce retour bloque les rendus des autres
// modules tant qu'il n'est pas lu. Best-effort (dégrade si la colonne n'est pas
// encore migrée — cf. retours_lus.sql). Idempotent.
export async function validerLectureRetourEssai(analyseId: string) {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()
  try {
    const { data: analyse } = await admin
      .from('fragments_essai_depot_analyses')
      .select('id, depot_id')
      .eq('id', analyseId)
      .maybeSingle()
    if (!analyse) return { error: 'Retour introuvable.' }

    const { data: depot } = await admin
      .from('fragments_essai_depots')
      .select('eleve_id')
      .eq('id', analyse.depot_id)
      .maybeSingle()
    if (depot?.eleve_id !== userId) return { error: 'Accès refusé.' }

    const { error } = await admin
      .from('fragments_essai_depot_analyses')
      .update({ retour_lu_at: new Date().toISOString() })
      .eq('id', analyseId)
      .is('retour_lu_at', null)
    if (error) return { error: 'Action indisponible pour le moment, réessaie.' }
    revalidatePath('/eleve/modules/fragments-erudition')
    return { success: true }
  } catch {
    return { error: 'Action indisponible pour le moment, réessaie.' }
  }
}

// C8·L3 — état des onglets (pastilles) pour la Barre 2 et la sous-nav mobile. Les
// onglets vivent dans la coquille /eleve, au-dessus de la page : ils chargent donc
// leur état eux-mêmes, comme le fait déjà le sélecteur de semestre côté prof.
export async function chargerEtatOngletsFragments(): Promise<EtatOngletsFragments> {
  const { supabase, userId } = await verifierEleve()
  return etatOngletsFragmentsEleve(supabase, createAdminClient(), userId)
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
