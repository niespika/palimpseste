'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { lundiOnOrBefore, addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { FUSEAUX, estFuseauValide, finDeJourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { PALETTE_CLASSES } from '@/utils/calendrier-couleurs'

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

type ClientProf = Awaited<ReturnType<typeof verifierProf>>['supabase']

// Deux semestres (vivants) ne doivent pas se recouvrir : la frise d'enseignement
// (parcours) chaîne les semestres consécutifs et une plage chevauchante corrompt la
// numérotation continue (cf. SPEC Parcours §5.3(d) / décision PO 4). On refuse donc
// la saisie à la source. Comparaison lexicale sûre sur YYYY-MM-DD. Renvoie le nom du
// semestre en conflit, ou null. Ne compare qu'aux semestres NON archivés.
async function chevauchementSemestre(
  supabase: ClientProf,
  start: string,
  end: string,
  exclureId?: string,
): Promise<{ ok: boolean; nom?: string }> {
  let q = supabase.from('semesters').select('id, name, start_date, end_date').is('archived_at', null)
  if (exclureId) q = q.neq('id', exclureId)
  const { data, error } = await q
  if (error) return { ok: false } // fail-closed : on refuse plutôt que d'autoriser en aveugle
  const conflit = (data ?? []).find(
    s => start <= (s.end_date as string) && (s.start_date as string) <= end,
  )
  return conflit ? { ok: false, nom: conflit.name as string } : { ok: true }
}

function messageChevauchement(res: { ok: boolean; nom?: string }): string {
  return res.nom
    ? `Ces dates chevauchent le semestre « ${res.nom} ». Deux semestres ne doivent pas se recouvrir.`
    : 'Vérification des chevauchements impossible — réessaie.'
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
  const chevauche = await chevauchementSemestre(supabase, data.start_date, data.end_date)
  if (!chevauche.ok) return { error: messageChevauchement(chevauche) }

  // Le premier semestre créé devient actif par défaut.
  const { count } = await supabase.from('semesters').select('id', { count: 'exact', head: true })
  const premier = (count ?? 0) === 0

  const { data: row, error } = await supabase
    .from('semesters')
    .insert({ name, start_date: data.start_date, end_date: data.end_date, is_active: premier })
    .select('id')
    .single()

  if (error || !row) return { error: error?.message ?? 'Création impossible.' }
  // Un semestre naît AVEC ses semaines. Sans cela, l'écran affiche « 12 semaines »
  // (grille calculée) et Fragments n'en a aucune (aucune ligne fragments_semaines)
  // → aucun dépôt élève possible, sans rien qui le signale.
  await synchroniserEnSilence(supabase, row.id)
  revaliderSemaines()
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
  const chevauche = await chevauchementSemestre(supabase, data.start_date, data.end_date, id)
  if (!chevauche.ok) return { error: messageChevauchement(chevauche) }

  const { error } = await supabase
    .from('semesters')
    .update({ name, start_date: data.start_date, end_date: data.end_date })
    .eq('id', id)

  if (error) return { error: error.message }
  // Les dates ont pu bouger : la grille se déplace, les semaines stockées doivent
  // suivre (numérotation, fin de semaine, échéance). Les semaines qui sortent de
  // l'intervalle ne sont PAS supprimées — elles sont comptées « hors calendrier ».
  await synchroniserEnSilence(supabase, id)
  revaliderSemaines()
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

  // Refuser si des entités pédagogiques y sont rattachées : sinon la suppression
  // CASCADE détruirait silencieusement thèmes, synthèses, essais (et
  // les dépôts déposés par les élèves), ainsi que les notes de semestre Quazian.
  // Tables Fragments (FK `semestre_id`).
  for (const table of ['fragments_semaines', 'fragments_themes', 'fragments_syntheses', 'fragments_essais_epreuves'] as const) {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('semestre_id', id)
    if ((count ?? 0) > 0) {
      return { error: 'Ce semestre est utilisé par Fragments (semaines, thèmes, synthèses ou essais). Détache-les d\'abord.' }
    }
  }
  // Tables Quazian (FK `semester_id`).
  for (const table of ['quazian_quizzes', 'quazian_semester'] as const) {
    const { count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('semester_id', id)
    if ((count ?? 0) > 0) {
      return { error: 'Ce semestre est utilisé par Quazian (quizz ou notes de semestre). Détache-les d\'abord.' }
    }
  }

  const { error } = await supabase.from('semesters').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

export async function archiverSemestre(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  // Garde-fou : ne jamais archiver le semestre actif (il pilote la numérotation
  // des semaines et sert de référence à Fragments/Quazian).
  const { data: sem } = await supabase.from('semesters').select('is_active').eq('id', id).maybeSingle()
  if (!sem) return { error: 'Semestre introuvable.' }
  if (sem.is_active) {
    return { error: 'Impossible d\'archiver le semestre actif. Définis d\'abord un autre semestre actif.' }
  }
  const { error } = await supabase
    .from('semesters')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof/calendrier/config')
  return {}
}

export async function restaurerSemestre(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  // Dé-archiver ne doit pas recréer un chevauchement : le garde-fou ignore les
  // archivés, donc un semestre restauré peut entrer en conflit avec un semestre vivant.
  const { data: sem } = await supabase
    .from('semesters').select('start_date, end_date').eq('id', id).maybeSingle()
  if (!sem) return { error: 'Semestre introuvable.' }
  const chevauche = await chevauchementSemestre(supabase, sem.start_date as string, sem.end_date as string, id)
  if (!chevauche.ok) {
    return { error: chevauche.nom
      ? `Restauration impossible : ces dates chevauchent le semestre « ${chevauche.nom} ». Modifie l'un des deux d'abord.`
      : 'Vérification des chevauchements impossible — réessaie.' }
  }
  const { error } = await supabase.from('semesters').update({ archived_at: null }).eq('id', id)
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

  // Borner la période aux dates du semestre (sinon des jours hors semestre sont
  // grisés « vacances » à l'affichage).
  const { data: sem } = await supabase
    .from('semesters')
    .select('start_date, end_date')
    .eq('id', data.semester_id)
    .maybeSingle()
  if (!sem) return { error: 'Semestre introuvable.' }
  if (data.start_date < sem.start_date || data.end_date > sem.end_date) {
    return { error: 'La période doit être comprise dans les dates du semestre.' }
  }

  const { error } = await supabase.from('holidays').insert({
    semester_id: data.semester_id,
    label,
    start_date: data.start_date,
    end_date: data.end_date,
  })
  if (error) return { error: error.message }
  // Une période de vacances retire des semaines pédagogiques et décale la
  // numérotation : les lignes stockées doivent suivre la grille affichée.
  await synchroniserEnSilence(supabase, data.semester_id)
  revaliderSemaines()
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

  // Borner la période aux dates du semestre auquel appartient la vacance.
  const { data: hol } = await supabase.from('holidays').select('semester_id').eq('id', id).maybeSingle()
  if (!hol) return { error: 'Période introuvable.' }
  const { data: sem } = await supabase
    .from('semesters')
    .select('start_date, end_date')
    .eq('id', hol.semester_id)
    .maybeSingle()
  if (sem && (data.start_date < sem.start_date || data.end_date > sem.end_date)) {
    return { error: 'La période doit être comprise dans les dates du semestre.' }
  }

  const { error } = await supabase
    .from('holidays')
    .update({ label, start_date: data.start_date, end_date: data.end_date })
    .eq('id', id)
  if (error) return { error: error.message }
  await synchroniserEnSilence(supabase, hol.semester_id as string)
  revaliderSemaines()
  return {}
}

export async function supprimerHoliday(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  // Le semestre est relu AVANT la suppression : après, la ligne n'existe plus.
  const { data: hol } = await supabase.from('holidays').select('semester_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('holidays').delete().eq('id', id)
  if (error) return { error: error.message }
  // Des semaines redeviennent pédagogiques : la numérotation se resserre.
  if (hol?.semester_id) await synchroniserEnSilence(supabase, hol.semester_id as string)
  revaliderSemaines()
  return {}
}

// ── Génération des semaines (ancrage calendaire) ────────────────────────────

// Les écrans du Calendrier affichent une grille de semaines CALCULÉE (fonction pure
// calculerGrilleSemaines) ; Fragments, lui, ne connaît que les LIGNES de
// `fragments_semaines` — c'est à elles que les dépôts sont rattachés. La seule
// couture entre les deux est la synchronisation ci-dessous : tant qu'elle n'a pas
// tourné, l'écran affiche « 12 semaines » et Fragments n'en a aucune (constat du
// 24/07 : semestre actif sans une seule semaine → aucun dépôt possible).
// Elle est donc appelée à CHAQUE événement qui déplace la grille — création et
// modification d'un semestre, ajout/édition/suppression d'une période de vacances —
// et pas seulement par le bouton « Générer les semaines ».
const CHEMINS_SEMAINES = [
  '/prof/calendrier/config',
  '/prof/calendrier',
  '/prof/fragments-erudition',
  '/eleve/modules/fragments-erudition',
  '/eleve/calendrier',
  '/eleve',
] as const

function revaliderSemaines() {
  for (const chemin of CHEMINS_SEMAINES) revalidatePath(chemin)
}

/**
 * (Re)génère les semaines de TRAVAIL d'un semestre, alignées sur le calendrier
 * réel (lundi → dimanche), numérotées en continu en sautant les vacances.
 * - Les semaines de vacances ne sont PAS stockées (calculées à l'affichage).
 * - Mise à jour EN PLACE par date de début ; NON destructive (ne supprime
 *   jamais : les semaines existantes hors alignement sont seulement signalées).
 * - `date_limite` = fin de journée du dimanche DANS LE FUSEAU DE L'ÉCOLE (item 7).
 *   Écrire la date pure donnerait minuit UTC = la veille au soir sur place.
 * Idempotente : rejouée sans changement, elle ne fait que réécrire les mêmes valeurs.
 */
async function synchroniserSemaines(
  supabase: ClientProf,
  semestreId: string
): Promise<{ error?: string; data?: { ajoutees: number; revues: number; horsCalendrier: number } }> {
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

  // Fuseau de l'école : il porte l'heure des échéances (jamais UTC — item 7).
  const tz = await lireFuseau()

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
  // On relit les valeurs, pas seulement les identifiants : cette synchronisation
  // tourne désormais à chaque édition de vacances, et une semaine déjà juste ne doit
  // pas coûter un aller-retour d'écriture (une vingtaine par semestre, sinon).
  const { data: existing } = await supabase
    .from('fragments_semaines')
    .select('id, date_debut, end_date, date_limite, numero, pedagogical_number, is_vacation')
    .eq('semestre_id', semestreId)
  type Ligne = {
    id: string; date_debut: string; end_date: string | null; date_limite: string | null
    numero: number | null; pedagogical_number: number | null; is_vacation: boolean
  }
  const lignes = (existing ?? []) as unknown as Ligne[]
  const parDebut = new Map(lignes.map((w) => [w.date_debut, w]))
  const spanStarts = new Set(spans.map((s) => s.start))
  // `date_limite` revient de PostgREST en « 2026-07-06T03:59:59.999+00:00 » là où on
  // écrit « …999Z » : comparer les instants, jamais les chaînes.
  const memeInstant = (a: string | null, b: string) =>
    a !== null && new Date(a).getTime() === new Date(b).getTime()

  let ajoutees = 0
  let revues = 0
  for (const span of spans) {
    const ligne = parDebut.get(span.start)
    if (span.isVac) {
      // Une semaine de travail déjà stockée qui passe en vacances (ajout/extension
      // d'une période) : la marquer vacance + retirer son numéro pédagogique, sans
      // la supprimer (d'éventuels dépôts restent rattachés). Pas de création.
      if (ligne && !(ligne.is_vacation && ligne.pedagogical_number === null)) {
        const { error } = await supabase
          .from('fragments_semaines')
          .update({ is_vacation: true, pedagogical_number: null })
          .eq('id', ligne.id)
        if (error) return { error: error.message }
        revues++
      }
      continue
    }
    // `date_limite` est REVUE aussi bien à la création qu'à la mise à jour : sans
    // cela, une semaine créée avant ce correctif garderait éternellement une échéance
    // à minuit UTC (= samedi soir sur place), et un déplacement des dates du semestre
    // laisserait l'échéance sur l'ancien dimanche.
    const dateLimite = finDeJourDansFuseau(span.end, tz)
    if (ligne) {
      const dejaJuste =
        ligne.end_date === span.end &&
        ligne.numero === span.ped &&
        ligne.pedagogical_number === span.ped &&
        ligne.is_vacation === false &&
        memeInstant(ligne.date_limite, dateLimite)
      if (dejaJuste) continue
      const { error } = await supabase
        .from('fragments_semaines')
        .update({
          end_date: span.end,
          date_limite: dateLimite,
          pedagogical_number: span.ped,
          numero: span.ped,
          is_vacation: false,
        })
        .eq('id', ligne.id)
      if (error) return { error: error.message }
      revues++
    } else {
      const { error } = await supabase.from('fragments_semaines').insert({
        semestre_id: semestreId,
        date_debut: span.start,
        end_date: span.end,
        date_limite: dateLimite,
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
  const horsCalendrier = lignes.filter((w) => !spanStarts.has(w.date_debut)).length

  return { data: { ajoutees, revues, horsCalendrier } }
}

/**
 * Bouton « Générer les semaines » (écrans Semestres et Vacances de la config).
 * Enveloppe l'action de synchronisation : contrôle du rôle + invalidation des vues.
 */
export async function regenererSemaines(
  semestreId: string
): Promise<{ error?: string; data?: { ajoutees: number; revues: number; horsCalendrier: number } }> {
  const { supabase } = await verifierProf()
  const res = await synchroniserSemaines(supabase, semestreId)
  revaliderSemaines()
  return res
}

/**
 * Synchronisation implicite, déclenchée par les actions qui déplacent la grille.
 * Best-effort : elle ne doit jamais faire échouer l'action porteuse (le semestre
 * créé reste créé). Un échec est journalisé ET reste visible à l'écran — la config
 * affiche « générées / prévues » et signale l'écart (cf. page.tsx / EcranSemestres).
 */
async function synchroniserEnSilence(supabase: ClientProf, semestreId: string) {
  try {
    const res = await synchroniserSemaines(supabase, semestreId)
    if (res.error) console.error('[calendrier] synchronisation des semaines :', res.error)
  } catch (e) {
    console.error('[calendrier] synchronisation des semaines :', e)
  }
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

/**
 * « Couleurs auto » : réattribue à toutes les classes actives des teintes de
 * palette ESPACÉES (maximise l'écart de teinte pour N classes). Déterministe :
 * classes triées par nom, teinte = round(i · 12 / N). Le client rejoue le même
 * calcul pour un rendu optimiste. Écrase les couleurs existantes.
 */
export async function repartirCouleursClasses(): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('statut', 'active')
    .order('nom')
  const liste = classes ?? []
  const n = Math.max(liste.length, 1)
  for (let i = 0; i < liste.length; i++) {
    const couleur = PALETTE_CLASSES[Math.floor((i * PALETTE_CLASSES.length) / n) % PALETTE_CLASSES.length]
    const { error } = await supabase.from('classes').update({ couleur }).eq('id', liste[i].id)
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/calendrier/config')
  revalidatePath('/prof/calendrier')
  return {}
}

// ── Fuseau horaire d'affichage (singleton global) ───────────────────────────

export async function definirFuseau(fuseau: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  // Restreint à la liste curée (et identifiant IANA valide).
  if (!estFuseauValide(fuseau) || !FUSEAUX.some((f) => f.id === fuseau)) {
    return { error: 'Fuseau invalide.' }
  }
  const { error } = await supabase
    .from('calendrier_params')
    .upsert({ id: 1, fuseau, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  // Le fuseau change l'affichage de TOUTES les pages → invalidation large.
  revalidatePath('/', 'layout')
  return {}
}

// ── Jours de cours (motif hebdomadaire par classe) ──────────────────────────

export async function definirJoursCours(
  classeId: string,
  weekdays: number[]
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  // Remplace le motif de la classe par l'ensemble fourni (0 = lundi … 6 = dimanche).
  await supabase.from('teaching_patterns').delete().eq('classe_id', classeId)
  const valides = [...new Set(weekdays)].filter((w) => Number.isInteger(w) && w >= 0 && w <= 6)
  if (valides.length > 0) {
    const { error } = await supabase
      .from('teaching_patterns')
      .insert(valides.map((w) => ({ classe_id: classeId, weekday: w })))
    if (error) return { error: error.message }
  }
  revalidatePath('/prof/calendrier/config')
  revalidatePath('/prof/calendrier')
  return {}
}
