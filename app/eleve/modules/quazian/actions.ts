'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { messageSiBloque } from '@/utils/integrite'
import { fsrs, createEmptyCard, type Card, type Grade } from 'ts-fsrs'

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// ── Visibilité des cartes partagées (Lot 6/7) ────────────────────────────────
// Une carte partagée d'une (unité, semaine) n'est visible que si un contenu Scriptorium de
// cette semaine est assigné à une classe de l'élève ; les cartes legacy (semaine null)
// restent visibles via la seule publication d'unité. Centralisé pour que la file, la
// consultation ET les stats appliquent EXACTEMENT le même périmètre.
async function contexteVisibiliteCartes(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<{ unitesVisibles: string[]; tuplesVisibles: Set<string> }> {
  const { data: publis } = await admin
    .from('quazian_publications').select('scriptorium_unite_id').eq('flashcards_visibles', true)
  const unitesVisibles = (publis ?? []).map((p) => p.scriptorium_unite_id as string)

  const { data: inscrits } = await admin
    .from('inscriptions').select('classe_id').eq('eleve_id', userId).eq('statut', 'active')
  const classeIds = (inscrits ?? []).map((i) => i.classe_id as string)

  const tuplesVisibles = new Set<string>()
  if (classeIds.length > 0) {
    const { data: liens } = await admin
      .from('scriptorium_document_classes').select('document_id').in('classe_id', classeIds)
    const docIds = [...new Set((liens ?? []).map((l) => l.document_id as string))]
    if (docIds.length > 0) {
      const { data: contenus } = await admin
        .from('scriptorium_documents').select('unite_id, semaine').in('id', docIds).not('semaine', 'is', null)
      for (const c of contenus ?? []) tuplesVisibles.add(`${c.unite_id}:${c.semaine}`)
    }
  }
  return { unitesVisibles, tuplesVisibles }
}

export interface CarteRevision {
  flashcard_id: string
  card_state_id: string | null  // null = première révision
  recto: string
  verso: string
  format: string                // 'recto_verso' | 'cloze' — pilote le masquage au recto
  type: string
  concept_tag: string
  label_unite: string
  // État FSRS sérialisé (pour le client, pas besoin de tout)
  state: number
  due: string
}

// Charger la file de révision du jour
export async function chargerFileRevision(): Promise<CarteRevision[]> {
  const { supabase, userId } = await verifierEleve()
  const maintenant = new Date().toISOString()

  // Unités publiées + visibilité par (unité, semaine) — admin pour contourner RLS.
  const admin = createAdminClient()
  // Blocage « petit malin » : la révision de flashcards est gelée (le quizz reste ouvert).
  if (await messageSiBloque(admin, userId)) return []
  const { unitesVisibles, tuplesVisibles } = await contexteVisibiliteCartes(admin, userId)

  const selectCarte = `
      id, recto, verso, format, type, concept_tag, semaine,
      scriptorium_unite_id,
      scriptorium_unites(label)
    `

  // Cartes partagées validées des unités publiées (eleve_id null)
  const { data: partageesBrutes } = unitesVisibles.length > 0
    ? await admin
        .from('quazian_flashcards')
        .select(selectCarte)
        .eq('statut', 'valide')
        .is('eleve_id', null)
        .in('scriptorium_unite_id', unitesVisibles)
    : { data: [] }

  // Filtre dérivé : semaine nulle (legacy) OU (unité, semaine) assignée à l'élève.
  const partagees = (partageesBrutes ?? []).filter((c) => {
    const sem = (c as { semaine: number | null }).semaine
    return sem == null || tuplesVisibles.has(`${c.scriptorium_unite_id}:${sem}`)
  })

  // Cartes personnelles de l'élève (ex. Codex) — toujours révisables par lui
  const { data: perso } = await admin
    .from('quazian_flashcards')
    .select(selectCarte)
    .eq('statut', 'valide')
    .eq('eleve_id', userId)

  const flashcards = [...(partagees ?? []), ...(perso ?? [])]
  if (flashcards.length === 0) return []

  const flashcardIds = flashcards.map((f) => f.id)

  // États FSRS existants pour cet élève
  const { data: etats } = await supabase
    .from('quazian_card_states')
    .select('id, flashcard_id, state, due, difficulty, stability, reps, lapses, last_review')
    .eq('eleve_id', userId)
    .in('flashcard_id', flashcardIds)

  const etatsMap: Record<string, typeof etats extends (infer T)[] | null ? T : never> = {}
  for (const e of etats ?? []) {
    etatsMap[e.flashcard_id] = e
  }

  // File = nouvelles cartes (sans état) + cartes dues aujourd'hui
  const file: CarteRevision[] = []

  for (const f of flashcards) {
    const etat = etatsMap[f.id]
    const unites = f.scriptorium_unites as unknown as { label: string } | { label: string }[]
    const labelUnite = Array.isArray(unites) ? unites[0]?.label : unites?.label ?? ''

    if (!etat) {
      // Nouvelle carte — à réviser
      file.push({
        flashcard_id: f.id,
        card_state_id: null,
        recto: f.recto,
        verso: f.verso,
        format: f.format,
        type: f.type,
        concept_tag: f.concept_tag,
        label_unite: labelUnite,
        state: 0, // New
        due: maintenant,
      })
    } else if (etat.due <= maintenant) {
      // Carte due
      file.push({
        flashcard_id: f.id,
        card_state_id: etat.id,
        recto: f.recto,
        verso: f.verso,
        format: f.format,
        type: f.type,
        concept_tag: f.concept_tag,
        label_unite: labelUnite,
        state: etat.state,
        due: etat.due,
      })
    }
  }

  // Mélanger légèrement (nouvelles d'abord, puis dues)
  const nouvelles = file.filter((c) => c.card_state_id === null)
  const dues = file.filter((c) => c.card_state_id !== null)

  // Limiter à 30 cartes par session
  return [...nouvelles, ...dues].slice(0, 30)
}

export interface CarteConsultation {
  flashcard_id: string
  recto: string
  verso: string
  format: string
  type: string
  concept_tag: string
  label_unite: string
  nouvelle: boolean // pas encore d'état FSRS pour cet élève (= récemment ajoutée)
  created_at: string
}

// Mode « consultation » (Lot 11) : TOUTES les cartes visibles avec leur réponse,
// sans impact sur la répétition espacée. Même visibilité que la file de révision.
export async function chargerToutesLesCartes(): Promise<CarteConsultation[]> {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()

  // Unités publiées + visibilité par (unité, semaine) — même périmètre que la file.
  const { unitesVisibles, tuplesVisibles } = await contexteVisibiliteCartes(admin, userId)

  const selectCarte = `
      id, recto, verso, format, type, concept_tag, semaine, created_at,
      scriptorium_unite_id, scriptorium_unites(label)
    `

  const { data: partageesBrutes } = unitesVisibles.length > 0
    ? await admin
        .from('quazian_flashcards')
        .select(selectCarte)
        .eq('statut', 'valide')
        .is('eleve_id', null)
        .in('scriptorium_unite_id', unitesVisibles)
    : { data: [] }
  const partagees = (partageesBrutes ?? []).filter((c) => {
    const sem = (c as { semaine: number | null }).semaine
    return sem == null || tuplesVisibles.has(`${c.scriptorium_unite_id}:${sem}`)
  })

  const { data: perso } = await admin
    .from('quazian_flashcards')
    .select(selectCarte)
    .eq('statut', 'valide')
    .eq('eleve_id', userId)

  const flashcards = [...partagees, ...(perso ?? [])]
  if (flashcards.length === 0) return []

  const { data: etats } = await supabase
    .from('quazian_card_states')
    .select('flashcard_id')
    .eq('eleve_id', userId)
    .in('flashcard_id', flashcards.map((f) => f.id))
  const vues = new Set((etats ?? []).map((e) => e.flashcard_id as string))

  return flashcards
    .map((f) => {
      const u = f.scriptorium_unites as unknown as { label: string } | { label: string }[] | null
      const labelUnite = (Array.isArray(u) ? u[0]?.label : u?.label) ?? 'Cartes personnelles'
      return {
        flashcard_id: f.id as string,
        recto: f.recto as string,
        verso: f.verso as string,
        format: f.format as string,
        type: f.type as string,
        concept_tag: f.concept_tag as string,
        label_unite: labelUnite,
        nouvelle: !vues.has(f.id as string),
        created_at: f.created_at as string,
      }
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

// Soumettre une note et mettre à jour l'état FSRS
export async function soumettreNote(
  flashcardId: string,
  cardStateId: string | null,
  rating: 1 | 2 | 3 | 4
): Promise<{ due: string; state: number; cardStateId: string | null }> {
  const { supabase, userId } = await verifierEleve()

  // Garde-fou : élève bloqué → aucune mise à jour FSRS (la révision est gelée).
  if (await messageSiBloque(createAdminClient(), userId)) {
    return { due: new Date().toISOString(), state: 0, cardStateId }
  }

  const scheduler = fsrs()
  const maintenant = new Date()

  // Reconstruire la carte FSRS depuis l'état RÉEL en base (jamais l'état du client).
  // Résolution tolérante : par id si fourni ET valide, sinon par (élève, flashcard) — le
  // client peut renvoyer un id factice « pending » pour une carte neuve re-enfilée (raté).
  const idValide = cardStateId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cardStateId)
    ? cardStateId : null
  type EtatCarte = { id: string; difficulty: number; stability: number; state: number; due: string; reps: number; lapses: number; last_review: string | null }
  let etat: EtatCarte | null = null
  if (idValide) {
    const { data } = await supabase
      .from('quazian_card_states')
      .select('id, difficulty, stability, state, due, reps, lapses, last_review')
      .eq('id', idValide).eq('eleve_id', userId).maybeSingle()
    etat = (data as EtatCarte | null) ?? null
  }
  if (!etat) {
    const { data } = await supabase
      .from('quazian_card_states')
      .select('id, difficulty, stability, state, due, reps, lapses, last_review')
      .eq('eleve_id', userId).eq('flashcard_id', flashcardId).maybeSingle()
    etat = (data as EtatCarte | null) ?? null
  }

  // Garde de visibilité (création d'un nouvel état uniquement) : carte partagée valide, ou
  // carte personnelle de l'élève. Empêche de semer un état FSRS pour une carte arbitraire.
  if (!etat) {
    const { data: fc } = await supabase
      .from('quazian_flashcards').select('eleve_id, statut').eq('id', flashcardId).maybeSingle()
    if (!fc || (fc.eleve_id === null ? fc.statut !== 'valide' : fc.eleve_id !== userId)) {
      return { due: maintenant.toISOString(), state: 0, cardStateId: null }
    }
  }

  const card: Card = etat
    ? {
        due: new Date(etat.due),
        stability: etat.stability,
        difficulty: etat.difficulty,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: etat.reps,
        lapses: etat.lapses,
        learning_steps: 0,
        state: etat.state as 0 | 1 | 2 | 3,
        last_review: etat.last_review ? new Date(etat.last_review) : undefined,
      }
    : createEmptyCard(maintenant)

  const result = scheduler.next(card, maintenant, rating as Grade)
  const nouvelleCarteEtat = result.card
  const log = result.log

  const nouveauDue = nouvelleCarteEtat.due.toISOString()

  let etatId = etat?.id ?? null
  if (!etat) {
    // Créer l'état
    const { data: nouvelEtat, error } = await supabase
      .from('quazian_card_states')
      .insert({
        eleve_id: userId,
        flashcard_id: flashcardId,
        difficulty: nouvelleCarteEtat.difficulty,
        stability: nouvelleCarteEtat.stability,
        due: nouveauDue,
        last_review: maintenant.toISOString(),
        state: nouvelleCarteEtat.state,
        reps: nouvelleCarteEtat.reps,
        lapses: nouvelleCarteEtat.lapses,
      })
      .select('id')
      .single()

    if (!error && nouvelEtat) {
      etatId = nouvelEtat.id
      await supabase.from('quazian_review_log').insert({
        card_state_id: nouvelEtat.id,
        rating,
        reviewed_at: maintenant.toISOString(),
        elapsed_days: log.elapsed_days,
        scheduled_days: log.scheduled_days,
      })
    }
  } else {
    // Mettre à jour l'état existant
    await supabase
      .from('quazian_card_states')
      .update({
        difficulty: nouvelleCarteEtat.difficulty,
        stability: nouvelleCarteEtat.stability,
        due: nouveauDue,
        last_review: maintenant.toISOString(),
        state: nouvelleCarteEtat.state,
        reps: nouvelleCarteEtat.reps,
        lapses: nouvelleCarteEtat.lapses,
      })
      .eq('id', etat.id)
      .eq('eleve_id', userId)

    await supabase.from('quazian_review_log').insert({
      card_state_id: etat.id,
      rating,
      reviewed_at: maintenant.toISOString(),
      elapsed_days: log.elapsed_days,
      scheduled_days: log.scheduled_days,
    })
  }

  return { due: nouveauDue, state: nouvelleCarteEtat.state, cardStateId: etatId }
}

// Stats pour la page d'accueil
export async function chargerStatsRevision() {
  const { supabase, userId } = await verifierEleve()
  const maintenant = new Date().toISOString()
  const admin = createAdminClient()

  // Unités publiées + visibilité par (unité, semaine) — MÊME périmètre que la file de
  // révision, sinon les compteurs annoncent des cartes que l'élève ne verra jamais.
  const { unitesVisibles, tuplesVisibles } = await contexteVisibiliteCartes(admin, userId)

  // Cartes partagées des unités publiées, filtrées par (unité, semaine) visibles.
  const { data: partageesBrutes } = unitesVisibles.length > 0
    ? await admin
        .from('quazian_flashcards')
        .select('id, scriptorium_unite_id, semaine')
        .eq('statut', 'valide')
        .is('eleve_id', null)
        .in('scriptorium_unite_id', unitesVisibles)
    : { data: [] }
  const partagees = (partageesBrutes ?? []).filter((c) => {
    const sem = (c as { semaine: number | null }).semaine
    return sem == null || tuplesVisibles.has(`${c.scriptorium_unite_id}:${sem}`)
  })

  const { data: perso } = await admin
    .from('quazian_flashcards')
    .select('id')
    .eq('statut', 'valide')
    .eq('eleve_id', userId)

  const flashcards = [...(partagees ?? []), ...(perso ?? [])]
  const totalCartes = flashcards.length
  const ids = flashcards.map((f) => f.id)

  const { data: etats } = ids.length > 0
    ? await supabase
        .from('quazian_card_states')
        .select('state, due')
        .eq('eleve_id', userId)
        .in('flashcard_id', ids)
    : { data: [] }

  const connues = etats?.length ?? 0
  const dues = etats?.filter((e) => e.due <= maintenant).length ?? 0
  const nouvelles = totalCartes - connues

  return { totalCartes, connues, dues, nouvelles, aFaire: dues + Math.min(nouvelles, 20) }
}
