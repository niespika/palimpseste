'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  lundiOnOrBefore,
  addDaysUTC,
  toISODate,
  calerAnnee,
  type BornesAnnee,
} from '@/utils/calendrier-grille'
import { anneeScolaireDe, libelleAnneeScolaire } from '@/utils/frise-enseignement'
import { FUSEAUX, estFuseauValide, finDeJourDansFuseau, jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { materialiserSemestreActif } from '@/utils/semestre-actif'
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
// Une LISTE d'ids à exclure, jamais un seul : l'enregistrement d'une année écrit
// DEUX lignes, et l'état intermédiaire (nouveau S1 déjà écrit, ancien S2 pas encore)
// ferait mordre la garde sur les semestres de l'année qu'on est justement en train
// de déplacer. Exclure les deux ; continuer de protéger contre les AUTRES années.
async function chevauchementSemestre(
  supabase: ClientProf,
  start: string,
  end: string,
  exclureIds: string[] = [],
): Promise<{ ok: boolean; nom?: string }> {
  const { data, error } = await supabase
    .from('semesters')
    .select('id, name, start_date, end_date')
    .is('archived_at', null)
  if (error) return { ok: false } // fail-closed : on refuse plutôt que d'autoriser en aveugle
  const exclus = new Set(exclureIds)
  const conflit = (data ?? [])
    .filter(s => !exclus.has(s.id as string))
    .find(s => start <= (s.end_date as string) && (s.start_date as string) <= end)
  return conflit ? { ok: false, nom: conflit.name as string } : { ok: true }
}

function messageChevauchement(res: { ok: boolean; nom?: string }): string {
  return res.nom
    ? `Ces dates chevauchent le semestre « ${res.nom} ». Deux semestres ne doivent pas se recouvrir.`
    : 'Vérification des chevauchements impossible — réessaie.'
}

// ── Année scolaire ──────────────────────────────────────────────────────────
//
// Ce qui se conçoit, c'est l'ANNÉE : trois dates (rentrée · fin du 1er semestre ·
// fin d'année), et les deux semestres s'en déduisent. La table `semesters` reste la
// source de vérité — trente-huit lectures dans vingt-deux fichiers en dépendent, et
// ce lot n'en touche aucune. Seule la PORTE D'ENTRÉE change : au lieu d'écrire une
// ligne à la fois, on en écrit deux d'un coup.
//
// L'année scolaire ne porte pas de colonne : elle se DÉDUIT des dates, par
// `anneeScolaireDe` (frontière du 1er août, testée) — la seule définition qui fait foi.

const NOMS_DEFAUT = ['Semestre 1', 'Semestre 2'] as const

type LigneSemestre = { id: string; name: string; start_date: string; end_date: string }

/** Semestres (vivants ou archivés, au choix) dont l'année scolaire est `ay`, triés. */
async function semestresDeAnnee(
  supabase: ClientProf,
  ay: number,
  vivants: boolean,
): Promise<LigneSemestre[] | null> {
  // Même fenêtre que la frise du parcours (`parcours/frise-serveur.ts`) : l'AY se
  // lit sur la DATE DE DÉBUT, [ay-08-01, (ay+1)-07-31].
  let q = supabase
    .from('semesters')
    .select('id, name, start_date, end_date')
    .gte('start_date', `${ay}-08-01`)
    .lte('start_date', `${ay + 1}-07-31`)
    .order('start_date', { ascending: true })
  q = vivants ? q.is('archived_at', null) : q.not('archived_at', 'is', null)
  const { data, error } = await q
  if (error) return null
  return (data ?? []) as LigneSemestre[]
}

/** Année scolaire du jour, lue dans le fuseau de l'école (jamais en heure serveur). */
async function anneeScolaireDuJour(): Promise<number> {
  return anneeScolaireDe(jourDansFuseau(new Date(), await lireFuseau()))
}

/**
 * Enregistre l'ANNÉE : crée **ou** met à jour les deux lignes `semesters` à partir
 * de trois dates. `S1 = [rentrée, fin S1]`, `S2 = [lendemain de fin S1, fin d'année]`,
 * bornes calées sur la semaine calendaire (`calerAnnee`).
 *
 * Ce qui n'est JAMAIS fait ici : supprimer une ligne, changer un `id`, réécrire un
 * nom déjà saisi. Les dépôts, quiz, plans et semaines rattachés survivent tels quels.
 */
export async function enregistrerAnnee(data: {
  rentree: string
  finS1: string
  finAnnee: string
}): Promise<{
  error?: string
  data?: {
    bornes: BornesAnnee
    crees: number
    misAJour: number
    vacancesRattachees: number
    vacancesSignalees: number
  }
}> {
  const { supabase } = await verifierProf()

  const { rentree, finS1, finAnnee } = data
  const estDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '')
  if (!estDate(rentree) || !estDate(finS1) || !estDate(finAnnee)) {
    return { error: 'Renseigne les trois dates : rentrée, fin du 1er semestre, fin de l’année.' }
  }
  if (finS1 < rentree) return { error: 'La fin du 1er semestre doit suivre la rentrée.' }
  if (finAnnee < finS1) return { error: 'La fin de l’année doit suivre la fin du 1er semestre.' }

  const bornes = calerAnnee(rentree, finS1, finAnnee)

  // Le calage peut vider le second semestre : si la fin d'année tombe dans la même
  // semaine calendaire que la fin du S1, `s2` démarrerait le lundi SUIVANT son
  // dimanche de fin. Les dates saisies sont pourtant dans le bon ordre — d'où ce
  // refus distinct, formulé sur ce que l'app aurait retenu.
  if (bornes.s2.end < bornes.s2.start) {
    return {
      error: 'La fin de l’année tombe dans la même semaine que la fin du 1er semestre : le second semestre serait vide. Recule la fin de l’année d’au moins une semaine.',
    }
  }

  // Une année qui enjambe la frontière du 1er août ferait tomber les deux semestres
  // dans deux années scolaires différentes — et la frise du parcours, qui filtre par
  // AY, n'en verrait plus qu'un (`parcours/frise-serveur.ts`).
  const ayDebut = anneeScolaireDe(bornes.s1.start)
  const ayFin = anneeScolaireDe(bornes.s2.end)
  if (ayDebut !== ayFin) {
    return {
      error: `Une année scolaire va du 1er août au 31 juillet : ces dates enjambent la frontière (${libelleAnneeScolaire(ayDebut)} → ${libelleAnneeScolaire(ayFin)}). Resserre la rentrée ou la fin de l’année.`,
    }
  }

  // L'écran travaille sur l'année scolaire DU JOUR (préparer l'année suivante en
  // avance n'est pas de ce lot). Sans ce refus, saisir les dates de l'an prochain
  // réécrirait en silence les bornes de l'année en cours, sous les dépôts déjà faits.
  const ayJour = await anneeScolaireDuJour()
  if (ayDebut !== ayJour) {
    return {
      error: `Ces dates appartiennent à l’année scolaire ${libelleAnneeScolaire(ayDebut)}, alors que l’écran travaille sur ${libelleAnneeScolaire(ayJour)}. Préparer une année à l’avance n’est pas encore possible.`,
    }
  }

  const existants = await semestresDeAnnee(supabase, ayJour, true)
  if (existants === null) return { error: 'Lecture des semestres impossible — réessaie.' }

  // Filet contre la RECRÉATION EN DOUBLON : la garde de chevauchement ignore les
  // archivés (à raison — ils ne gênent personne), donc rien n'empêcherait d'insérer
  // une copie exacte d'une année qu'on vient d'archiver. Les dépôts, semaines et
  // thèmes resteraient sur les `id` archivés pendant que les lignes neuves et vides
  // porteraient le drapeau actif. On refuse, et on montre la sortie : restaurer.
  const archives = await semestresDeAnnee(supabase, ayJour, false)
  if (archives === null) return { error: 'Lecture des semestres impossible — réessaie.' }
  const copie = archives.find(
    (a) =>
      (a.start_date === bornes.s1.start && a.end_date === bornes.s1.end) ||
      (a.start_date === bornes.s2.start && a.end_date === bornes.s2.end),
  )
  if (copie) {
    return {
      error: `Ces dates sont déjà celles de « ${copie.name} », archivé. Restaure l’année depuis l’onglet Archives plutôt que d’en créer une copie — sinon les dépôts et les semaines resteraient sur l’ancienne.`,
    }
  }

  if (existants.length > 2) {
    return {
      error: `${existants.length} semestres vivants pour ${libelleAnneeScolaire(ayJour)} : archive les surnuméraires avant d’enregistrer l’année.`,
    }
  }

  // P1 — la garde de chevauchement doit ignorer les DEUX semestres de l'année
  // éditée (sinon l'état intermédiaire se mord la queue), sans cesser de protéger
  // contre les autres années.
  const exclus = existants.map((s) => s.id)
  for (const b of [bornes.s1, bornes.s2]) {
    const chevauche = await chevauchementSemestre(supabase, b.start, b.end, exclus)
    if (!chevauche.ok) return { error: messageChevauchement(chevauche) }
  }

  // Écriture : la ligne la plus précoce devient S1, la suivante S2. Un nom déjà
  // saisi n'est jamais réécrit — seules les dates bougent.
  const ids: string[] = []
  let crees = 0
  let misAJour = 0
  for (const [rang, b] of [bornes.s1, bornes.s2].entries()) {
    const existant = existants[rang]
    if (existant) {
      const { error } = await supabase
        .from('semesters')
        .update({ start_date: b.start, end_date: b.end })
        .eq('id', existant.id)
      if (error) return { error: error.message }
      ids.push(existant.id)
      misAJour++
    } else {
      const { data: row, error } = await supabase
        .from('semesters')
        .insert({ name: NOMS_DEFAUT[rang], start_date: b.start, end_date: b.end, is_active: false })
        .select('id')
        .single()
      if (error || !row) return { error: error?.message ?? 'Création du semestre impossible.' }
      ids.push(row.id as string)
      crees++
    }
  }

  // P5 — les vacances appartiennent à un SEMESTRE, pas à l'année : déplacer les
  // bornes peut faire sortir une période de son semestre. On ne détruit rien.
  const vacances = await recalerVacances(supabase, ids[0], bornes.s1, ids[1], bornes.s2)

  // P2 — la grille a bougé pour les DEUX semestres : les lignes `fragments_semaines`
  // doivent suivre. Best-effort (l'écart reste visible à l'écran, « générées / prévues »).
  for (const id of ids) await synchroniserEnSilence(supabase, id)

  // Le drapeau `is_active` se recalcule : il n'est plus saisi (plus de « Définir actif »).
  await materialiserSemestreActif()

  revaliderSemaines()
  return { data: { bornes, crees, misAJour, ...vacances } }
}

/**
 * Après un déplacement des bornes : une période de vacances qui tombe ENTIÈREMENT
 * dans l'autre semestre de la même année y est RATTACHÉE (changement de FK, rien de
 * perdu) ; toute autre période hors de son semestre est laissée en place et
 * SIGNALÉE sur l'écran Vacances. Une période à cheval sur la frontière S1/S2 se
 * signale, elle ne se découpe pas toute seule.
 */
async function recalerVacances(
  supabase: ClientProf,
  s1Id: string,
  s1: { start: string; end: string },
  s2Id: string,
  s2: { start: string; end: string },
): Promise<{ vacancesRattachees: number; vacancesSignalees: number }> {
  const { data, error } = await supabase
    .from('holidays')
    .select('id, semester_id, start_date, end_date')
    .in('semester_id', [s1Id, s2Id])
  if (error) return { vacancesRattachees: 0, vacancesSignalees: 0 }

  const bornes = new Map([[s1Id, s1], [s2Id, s2]])
  let rattachees = 0
  let signalees = 0
  for (const h of data ?? []) {
    const sien = bornes.get(h.semester_id as string)!
    const debut = h.start_date as string
    const fin = h.end_date as string
    if (debut >= sien.start && fin <= sien.end) continue // toujours chez lui
    const autreId = h.semester_id === s1Id ? s2Id : s1Id
    const autre = bornes.get(autreId)!
    if (debut >= autre.start && fin <= autre.end) {
      const { error: errMaj } = await supabase
        .from('holidays')
        .update({ semester_id: autreId })
        .eq('id', h.id)
      if (!errMaj) {
        rattachees++
        continue
      }
    }
    signalees++
  }
  return { vacancesRattachees: rattachees, vacancesSignalees: signalees }
}

/**
 * Archive UN semestre isolé. L'archivage nominal porte sur l'ANNÉE (spec §2) — cette
 * action ne sert qu'au cas anormal « trois semestres vivants ou plus » (spec §5), où
 * l'écran demande d'archiver les SURNUMÉRAIRES : sans elle, la seule sortie offerte
 * était « archiver toute l'année », qui emportait aussi le semestre porteur des dépôts.
 */
export async function archiverSemestre(id: string): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  const { data: sem } = await supabase
    .from('semesters').select('id, archived_at').eq('id', id).maybeSingle()
  if (!sem) return { error: 'Semestre introuvable.' }
  if (sem.archived_at) return { error: 'Ce semestre est déjà archivé.' }
  const { error } = await supabase
    .from('semesters')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  await materialiserSemestreActif()
  revaliderSemaines()
  return {}
}

/** Archive les DEUX semestres d'une année d'un coup (l'archivage porte sur l'année). */
export async function archiverAnnee(ay: number): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  const vivants = await semestresDeAnnee(supabase, ay, true)
  if (vivants === null) return { error: 'Lecture des semestres impossible — réessaie.' }
  if (vivants.length === 0) return { error: 'Aucun semestre vivant pour cette année.' }
  const { error } = await supabase
    .from('semesters')
    .update({ archived_at: new Date().toISOString() })
    .in('id', vivants.map((s) => s.id))
  if (error) return { error: error.message }
  // L'ancien garde-fou « ne jamais archiver le semestre actif » n'a plus lieu d'être :
  // le drapeau n'est plus un choix, il se recalcule sur ce qu'il reste de vivant.
  await materialiserSemestreActif()
  revaliderSemaines()
  return {}
}

/** Restaure les semestres archivés d'une année (les deux ensemble). */
export async function restaurerAnnee(ay: number): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  const archives = await semestresDeAnnee(supabase, ay, false)
  if (archives === null) return { error: 'Lecture des semestres impossible — réessaie.' }
  if (archives.length === 0) return { error: 'Aucun semestre archivé pour cette année.' }
  // Dé-archiver ne doit pas recréer un chevauchement : la garde ignore les archivés,
  // donc une année restaurée peut entrer en conflit avec une année vivante.
  const ids = archives.map((s) => s.id)

  // Les archivées doivent d'abord être cohérentes ENTRE ELLES : `chevauchementSemestre`
  // ne lit que les vivants, il ne les compare donc pas. Une AY qui porte plusieurs
  // générations archivées (accident de recréation) les ressusciterait toutes d'un coup,
  // et la frise du parcours lèverait un `avisBloquant` sur le premier chevauchement.
  const triees = [...archives].sort((a, b) => (a.start_date < b.start_date ? -1 : 1))
  for (let i = 1; i < triees.length; i++) {
    if (triees[i].start_date <= triees[i - 1].end_date) {
      return {
        error: `Restauration impossible : « ${triees[i].name} » chevauche « ${triees[i - 1].name} » dans les archives de cette année. Restaure-les un par un après avoir corrigé leurs dates.`,
      }
    }
  }
  if (archives.length > 2) {
    return {
      error: `${archives.length} semestres archivés pour cette année — l’écran en attend deux au plus. Restaure-les un par un après avoir corrigé leurs dates.`,
    }
  }

  for (const s of archives) {
    const chevauche = await chevauchementSemestre(supabase, s.start_date, s.end_date, ids)
    if (!chevauche.ok) {
      return {
        error: chevauche.nom
          ? `Restauration impossible : « ${s.name} » chevauche le semestre « ${chevauche.nom} ». Modifie l’année en cours d’abord.`
          : 'Vérification des chevauchements impossible — réessaie.',
      }
    }
  }
  const { error } = await supabase.from('semesters').update({ archived_at: null }).in('id', ids)
  if (error) return { error: error.message }
  await materialiserSemestreActif()
  revaliderSemaines()
  return {}
}

/**
 * Supprime définitivement les semestres d'une année. Garde les vérifications de
 * rattachement de l'ancien `supprimerSemestre` — et refuse l'année ENTIÈRE dès
 * qu'UN des deux semestres est utilisé : sinon la suppression CASCADE détruirait
 * silencieusement thèmes, synthèses, essais, dépôts d'élèves et notes Quazian.
 */
export async function supprimerAnnee(
  ay: number,
  inclureArchives = false,
): Promise<{ error?: string }> {
  const { supabase } = await verifierProf()
  const vivants = await semestresDeAnnee(supabase, ay, true)
  const archives = inclureArchives ? await semestresDeAnnee(supabase, ay, false) : []
  if (vivants === null || archives === null) return { error: 'Lecture des semestres impossible — réessaie.' }
  const cibles = inclureArchives ? archives : vivants
  if (cibles.length === 0) return { error: 'Aucun semestre à supprimer pour cette année.' }

  for (const sem of cibles) {
    // Tables Fragments (FK `semestre_id`).
    for (const table of ['fragments_semaines', 'fragments_themes', 'fragments_syntheses', 'fragments_essais_epreuves'] as const) {
      const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('semestre_id', sem.id)
      if ((count ?? 0) > 0) {
        return { error: `« ${sem.name} » est utilisé par Fragments (semaines, thèmes, synthèses ou essais). Détache-les d’abord — l’année entière est conservée.` }
      }
    }
    // Tables Quazian (FK `semester_id`).
    for (const table of ['quazian_quizzes', 'quazian_semester'] as const) {
      const { count } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('semester_id', sem.id)
      if ((count ?? 0) > 0) {
        return { error: `« ${sem.name} » est utilisé par Quazian (quizz ou notes de semestre). Détache-les d’abord — l’année entière est conservée.` }
      }
    }
  }

  const { error } = await supabase.from('semesters').delete().in('id', cibles.map((s) => s.id))
  if (error) return { error: error.message }
  await materialiserSemestreActif()
  revaliderSemaines()
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
