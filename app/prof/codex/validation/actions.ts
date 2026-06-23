'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { userId: user.id }
}

export interface ErreurCorrection {
  concept_tag: string
  description: string
  correction: string
  importance: number
}

export interface RetourCritique {
  erreurs_corrections: ErreurCorrection[]
  suivi_suggestions: { suggestion: string; statut: string; commentaire: string }[]
  pouvait_aller_plus_loin: string[]
  non_ameliore: string[]
  ajouts: { titre: string; contenu: string }[]
}

// Sauvegarder le retour édité par le prof (sans valider)
export async function sauvegarderRetour(
  travailId: string,
  retour: RetourCritique,
  syntheseCompletee: string
) {
  await verifierProf()
  const admin = createAdminClient()
  const { error } = await admin
    .from('codex_travaux')
    .update({ retour_critique: retour, synthese_completee: syntheseCompletee })
    .eq('id', travailId)
  if (error) return { error: error.message }
  revalidatePath(`/prof/codex/validation/${travailId}`)
  return { success: true }
}

// Valider le retour critique → trace + cartes FSRS (idempotent)
export async function validerTravail(travailId: string) {
  const { userId } = await verifierProf()
  const admin = createAdminClient()

  const { data: travail } = await admin
    .from('codex_travaux')
    .select('id, session_id, eleve_id, retour_critique, statut_validation')
    .eq('id', travailId)
    .single()

  if (!travail) return { error: 'Travail introuvable' }

  // Transition atomique « → validé » via compare-and-set : ne crée trace + cartes QUE si
  // CET appel a réellement effectué la bascule, pour éviter les doublons en cas de
  // double-clic / validations concurrentes (la garde précédente lisait une valeur périmée).
  const { data: bascule } = await admin
    .from('codex_travaux')
    .update({ statut_validation: 'valide', valide_par: userId, valide_at: new Date().toISOString() })
    .eq('id', travailId)
    .neq('statut_validation', 'valide')
    .select('id')

  if (!bascule || bascule.length === 0) {
    // Déjà validé (ou course concurrente perdue) → ne pas recréer trace/cartes.
    revalidatePath('/prof/codex/validation')
    return { success: true }
  }

  const retour = (travail.retour_critique as RetourCritique | null) ?? null
  const erreurs = retour?.erreurs_corrections ?? []
  if (erreurs.length === 0) {
    revalidatePath('/prof/codex/validation')
    return { success: true }
  }

  // Contexte synthèse (unité + classe) pour les cartes
  const { data: session } = await admin
    .from('codex_sessions')
    .select('scriptorium_unite_id, classe_id')
    .eq('id', travail.session_id)
    .single()

  // Inscription (élève × classe) pour rattacher la carte personnelle au bon flux.
  let inscriptionId: string | null = null
  if (session?.classe_id) {
    const { data: insc } = await admin
      .from('inscriptions')
      .select('id')
      .eq('eleve_id', travail.eleve_id)
      .eq('classe_id', session.classe_id)
      .maybeSingle()
    inscriptionId = insc?.id ?? null
  }

  const { data: params } = await admin
    .from('codex_params')
    .select('cap_cartes')
    .eq('id', 1)
    .single()
  const capCartes = params?.cap_cartes ?? 3

  // Les erreurs les plus importantes promues en cartes (cap 1..N)
  const triees = [...erreurs].sort((a, b) => (b.importance ?? 1) - (a.importance ?? 1))
  const aPromouvoir = new Set(triees.slice(0, capCartes))

  for (const e of erreurs) {
    const tag = (e.concept_tag ?? '').trim()
    let flashcardId: string | null = null
    let recurrente = false

    if (aPromouvoir.has(e)) {
      // Déduplication : une même erreur sur une autre synthèse renforce la carte existante
      const { data: anterieure } = tag
        ? await admin
            .from('codex_erreurs')
            .select('flashcard_id')
            .eq('eleve_id', travail.eleve_id)
            .eq('concept_tag', tag)
            .neq('travail_id', travailId)
            .not('flashcard_id', 'is', null)
            .limit(1)
            .maybeSingle()
        : { data: null }

      if (anterieure?.flashcard_id) {
        flashcardId = anterieure.flashcard_id
        recurrente = true
      } else if (session) {
        // Nouvelle carte personnelle (sûre : correction validée, adossée au cours)
        const recto = tag ? `${tag} — la bonne version ?` : 'Point à retenir'
        const { data: carte } = await admin
          .from('quazian_flashcards')
          .insert({
            inscription_id: inscriptionId,
            eleve_id: travail.eleve_id,
            scriptorium_unite_id: session.scriptorium_unite_id,
            type: 'concept',
            format: 'recto_verso',
            recto,
            verso: e.correction,
            concept_tag: tag,
            statut: 'valide',
            source: 'codex',
            created_by: userId,
          })
          .select('id')
          .single()
        flashcardId = carte?.id ?? null
      }
    }

    await admin.from('codex_erreurs').insert({
      travail_id: travailId,
      eleve_id: travail.eleve_id,
      concept_tag: tag || null,
      description: e.description,
      correction: e.correction,
      importance: Math.max(1, Math.min(3, e.importance ?? 1)),
      est_recurrente: recurrente,
      flashcard_id: flashcardId,
    })
  }

  revalidatePath('/prof/codex/validation')
  return { success: true }
}

// Validation en lot (sans ouvrir le détail)
export async function validerTravauxLot(travailIds: string[]) {
  await verifierProf()
  for (const id of travailIds) {
    await validerTravail(id)
  }
  revalidatePath('/prof/codex/validation')
  return { success: true, count: travailIds.length }
}
