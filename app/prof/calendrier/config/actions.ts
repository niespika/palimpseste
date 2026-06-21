'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

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
  return { supabase }
}

// ── Semestre ────────────────────────────────────────────────────────────────

export async function creerSemestre(data: {
  name: string
  start_date: string
  end_date: string
}): Promise<{ error?: string; data?: { semestreId: string } }> {
  const { supabase } = await verifierProf()

  const name = data.name?.trim()
  if (!name) return { error: 'Donne un nom au semestre.' }
  if (!data.start_date || !data.end_date) return { error: 'Renseigne les deux dates.' }
  if (data.end_date < data.start_date) return { error: 'La date de fin doit suivre la date de début.' }

  // Le premier semestre créé devient actif par défaut.
  const { count } = await supabase.from('semesters').select('id', { count: 'exact', head: true })
  const premier = (count ?? 0) === 0

  const { data: row, error } = await supabase
    .from('semesters')
    .insert({ name, start_date: data.start_date, end_date: data.end_date, is_active: premier })
    .select('id')
    .single()

  if (error || !row) return { error: error?.message ?? 'Création impossible.' }
  revalidatePath('/prof/calendrier/config')
  return { data: { semestreId: row.id } }
}

export async function modifierSemestre(
  id: string,
  data: { name: string; start_date: string; end_date: string }
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()

  const name = data.name?.trim()
  if (!name) return { error: 'Donne un nom au semestre.' }
  if (!data.start_date || !data.end_date) return { error: 'Renseigne les deux dates.' }
  if (data.end_date < data.start_date) return { error: 'La date de fin doit suivre la date de début.' }

  const { error } = await supabase
    .from('semesters')
    .update({ name, start_date: data.start_date, end_date: data.end_date })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

export async function definirSemestreActif(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  await supabase.from('semesters').update({ is_active: false }).eq('is_active', true)
  const { error } = await supabase.from('semesters').update({ is_active: true }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

export async function supprimerSemestre(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()

  // Refuser si des entités pédagogiques y sont rattachées (évite l'orphelinage
  // des semaines et le cascade-delete des thèmes / synthèses). Ces FK pointent
  // vers `semesters` après la bascule C1b ; avant, le compte sera simplement 0.
  for (const table of ['fragments_semaines', 'fragments_themes', 'fragments_syntheses'] as const) {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('semestre_id', id)
    if ((count ?? 0) > 0) {
      return { error: 'Ce semestre est utilisé (semaines, thèmes ou synthèses). Détache-les d\'abord.' }
    }
  }

  const { error } = await supabase.from('semesters').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

// ── Vacances ──────────────────────────────────────────────────────────────────

export async function creerHoliday(data: {
  semester_id: string
  label: string
  start_date: string
  end_date: string
}): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()

  const label = data.label?.trim()
  if (!label) return { error: 'Donne un libellé à la période.' }
  if (!data.semester_id) return { error: 'Semestre manquant.' }
  if (!data.start_date || !data.end_date) return { error: 'Renseigne les deux dates.' }
  if (data.end_date < data.start_date) return { error: 'La date de fin doit suivre la date de début.' }

  const { error } = await supabase.from('holidays').insert({
    semester_id: data.semester_id,
    label,
    start_date: data.start_date,
    end_date: data.end_date,
  })
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

export async function modifierHoliday(
  id: string,
  data: { label: string; start_date: string; end_date: string }
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()

  const label = data.label?.trim()
  if (!label) return { error: 'Donne un libellé à la période.' }
  if (!data.start_date || !data.end_date) return { error: 'Renseigne les deux dates.' }
  if (data.end_date < data.start_date) return { error: 'La date de fin doit suivre la date de début.' }

  const { error } = await supabase
    .from('holidays')
    .update({ label, start_date: data.start_date, end_date: data.end_date })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

export async function supprimerHoliday(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

// ── Génération des semaines (ancrage calendaire) ────────────────────────────

// Helpers de date en espace « date pure » (UTC) pour éviter tout décalage de
// fuseau / DST sur les bornes de semaine.
function lundiOnOrBefore(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00Z')
  const jour = d.getUTCDay() // 0 = dimanche … 6 = samedi
  const delta = jour === 0 ? -6 : 1 - jour
  d.setUTCDate(d.getUTCDate() + delta)
  return d
}
function addDaysUTC(d: Date, n: number): Date {
  const c = new Date(d)
  c.setUTCDate(c.getUTCDate() + n)
  return c
}
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * (Re)génère les semaines de TRAVAIL d'un semestre, alignées sur le calendrier
 * réel (lundi → dimanche), numérotées en continu en sautant les vacances.
 * - Les semaines de vacances ne sont PAS stockées (calculées à l'affichage).
 * - Mise à jour EN PLACE par date de début ; NON destructive (ne supprime
 *   jamais : les semaines existantes hors alignement sont seulement signalées).
 */
export async function regenererSemaines(
  semestreId: string
): Promise<{ error?: string; data?: { ajoutees: number; revues: number; horsCalendrier: number } }> {
  const { supabase } = await verifierProf()

  const { data: sem } = await supabase
    .from('semesters')
    .select('start_date, end_date')
    .eq('id', semestreId)
    .maybeSingle()
  if (!sem) return { error: 'Semestre introuvable.' }

  const { data: hols } = await supabase
    .from('holidays')
    .select('start_date, end_date')
    .eq('semester_id', semestreId)
  const holidays = hols ?? []

  // 1. Spans calendaires lundi→dimanche couvrant [start_date, end_date].
  type Span = { start: string; end: string; isVac: boolean; ped: number | null }
  const spans: Span[] = []
  let cursor = lundiOnOrBefore(sem.start_date)
  let ped = 0
  let garde = 0
  while (toISODate(cursor) <= sem.end_date && garde < 1000) {
    garde++
    const start = toISODate(cursor)
    const end = toISODate(addDaysUTC(cursor, 6))
    // 2. Vacance si chevauchement d'au moins un jour (comparaison lexicale sûre sur YYYY-MM-DD).
    const isVac = holidays.some((h) => h.start_date <= end && start <= h.end_date)
    // 3. Numérotation pédagogique continue, en sautant les vacances.
    let pedNum: number | null = null
    if (!isVac) {
      ped += 1
      pedNum = ped
    }
    spans.push({ start, end, isVac, ped: pedNum })
    cursor = addDaysUTC(cursor, 7)
  }

  // 4. Réconcilier avec l'existant (par date de début), en place.
  const { data: existing } = await supabase
    .from('fragments_semaines')
    .select('id, date_debut')
    .eq('semestre_id', semestreId)
  const parDebut = new Map((existing ?? []).map((w) => [w.date_debut as string, w.id as string]))
  const spanStarts = new Set(spans.map((s) => s.start))

  let ajoutees = 0
  let revues = 0
  for (const span of spans) {
    if (span.isVac) continue // les semaines de vacances ne sont pas stockées
    const id = parDebut.get(span.start)
    if (id) {
      const { error } = await supabase
        .from('fragments_semaines')
        .update({ end_date: span.end, pedagogical_number: span.ped, numero: span.ped, is_vacation: false })
        .eq('id', id)
      if (error) return { error: error.message }
      revues++
    } else {
      const { error } = await supabase.from('fragments_semaines').insert({
        semestre_id: semestreId,
        date_debut: span.start,
        end_date: span.end,
        date_limite: span.end,
        numero: span.ped,
        pedagogical_number: span.ped,
        is_vacation: false,
        ouverte: false,
      })
      if (error) return { error: error.message }
      ajoutees++
    }
  }

  // Semaines existantes non alignées sur une semaine calendaire (info, non supprimées).
  const horsCalendrier = (existing ?? []).filter((w) => !spanStarts.has(w.date_debut as string)).length

  revalidatePath('/prof/calendrier/config')
  return { data: { ajoutees, revues, horsCalendrier } }
}

// ── Couleur de classe ─────────────────────────────────────────────────────────

export async function definirCouleurClasse(
  classeId: string,
  couleur: string
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  // Validation hex simple (#rgb ou #rrggbb).
  if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(couleur)) {
    return { error: 'Couleur invalide.' }
  }
  const { error } = await supabase.from('classes').update({ couleur }).eq('id', classeId)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}
