import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'

// ════════════════════════════════════════════════════════════════════════════
// Validation de lecture des retours — logique TRANSVERSE et BLOQUANTE.
// Tant qu'il reste UN retour non lu (n'importe quel module : Fragments écrit/essai,
// Codex, Aletheia VF, note de quizz Quazian), l'élève ne peut RIEN rendre nulle part.
// Exceptions (jamais bloquées) : le DÉPÔT d'essai (travail noté) et la passation
// Quazian — ces deux-là restent ouverts ; mais leur RETOUR reste une source.
//
// Toutes les sources sont scopées aux INSCRIPTIONS / CLASSES ACTIVES de l'élève :
// un retour d'une classe quittée (inscription non active) ne bloque pas. Un élève
// multi-classes reste bloqué par un retour non lu de N'IMPORTE laquelle de ses
// classes actives (intention produit) — le href porte l'inscription concernée pour
// que l'élève puisse y revenir.
//
// Dégradation : chaque source est best-effort (erreurs DB loguées, jamais
// propagées → la source renvoie []). Tant qu'une migration de colonne n'est pas
// passée (cf. retours_lus.sql), la source concernée est simplement non bloquante.
// NB : c'est un fail-OPEN sur erreur transitoire (contrairement à messageSiBloque
// qui propage). Acceptable pour un gate UX ; on logue pour repérer les régressions.
// ════════════════════════════════════════════════════════════════════════════

type Admin = ReturnType<typeof createAdminClient>

export type ModuleRetour = 'fragments_ecrit' | 'fragments_essai' | 'codex' | 'aletheia' | 'quazian'

export interface RetourNonLu {
  module: ModuleRetour
  label: string
  href: string
}

function log(source: string, error: { message?: string } | null) {
  if (error) console.error(`[retours-lus] ${source} :`, error.message ?? error)
}

// ── Sources ───────────────────────────────────────────────────────────────────

async function fragmentsEcritNonLus(admin: Admin, inscriptionIds: string[]): Promise<RetourNonLu[]> {
  try {
    if (inscriptionIds.length === 0) return []
    const { data: depots, error: eDep } = await admin
      .from('fragments_depots')
      .select('id, inscription_id')
      .in('inscription_id', inscriptionIds)
    log('fragments écrit (dépôts)', eDep)
    const ds = depots ?? []
    if (ds.length === 0) return []
    const { data, error } = await admin
      .from('fragments_analyses')
      .select('depot_id')
      .eq('statut', 'publiee')
      .is('retour_lu_at', null)
      .in('depot_id', ds.map((d) => d.id as string))
      .limit(1)
    log('fragments écrit (analyses)', error)
    if (!data || data.length === 0) return []
    const inscriptionId = ds.find((d) => d.id === data[0].depot_id)?.inscription_id
    const href = `/eleve/modules/fragments-erudition?vue=ecrit${inscriptionId ? `&inscription=${inscriptionId}` : ''}`
    return [{ module: 'fragments_ecrit', label: 'Fragments — retour écrit', href }]
  } catch {
    return []
  }
}

async function fragmentsEssaiNonLus(admin: Admin, inscriptionIds: string[]): Promise<RetourNonLu[]> {
  try {
    if (inscriptionIds.length === 0) return []
    const { data: depots, error: eDep } = await admin
      .from('fragments_essai_depots')
      .select('id, inscription_id')
      .in('inscription_id', inscriptionIds)
    log('fragments essai (dépôts)', eDep)
    const ds = depots ?? []
    if (ds.length === 0) return []
    const { data, error } = await admin
      .from('fragments_essai_depot_analyses')
      .select('depot_id')
      .eq('statut', 'publiee')
      .is('retour_lu_at', null)
      .in('depot_id', ds.map((d) => d.id as string))
      .limit(1)
    log('fragments essai (analyses)', error)
    if (!data || data.length === 0) return []
    const inscriptionId = ds.find((d) => d.id === data[0].depot_id)?.inscription_id
    const href = `/eleve/modules/fragments-erudition?vue=essai${inscriptionId ? `&inscription=${inscriptionId}` : ''}`
    return [{ module: 'fragments_essai', label: 'Fragments — retour d’essai', href }]
  } catch {
    return []
  }
}

async function codexNonLus(admin: Admin, eleveId: string, classeIds: string[]): Promise<RetourNonLu[]> {
  try {
    // Sessions fermées VISIBLES (classe active de l'élève ou session sans classe).
    const { data: sessions, error: eSess } = await admin.from('codex_sessions').select('id, classe_id').eq('statut', 'fermee')
    log('codex (sessions)', eSess)
    const visibles = (sessions ?? []).filter((s) => !s.classe_id || classeIds.includes(s.classe_id as string))
    if (visibles.length === 0) return []
    const { data: travaux, error } = await admin
      .from('codex_travaux')
      .select('session_id')
      .eq('eleve_id', eleveId)
      .eq('statut_validation', 'valide')
      .is('synthese_lu_at', null)
      .in('session_id', visibles.map((s) => s.id as string))
      .limit(1)
    log('codex (travaux)', error)
    return travaux && travaux.length > 0
      ? [{ module: 'codex', label: 'Codex — synthèse', href: `/eleve/modules/codex/synthese/${travaux[0].session_id}` }]
      : []
  } catch {
    return []
  }
}

async function aletheiaNonLus(admin: Admin, eleveId: string, classeIds: string[]): Promise<RetourNonLu[]> {
  try {
    if (classeIds.length === 0) return []
    // Livres encore assignés à une classe active de l'élève (un livre retiré de la
    // classe ne doit plus bloquer : sa validation deviendrait inatteignable).
    const { data: liens, error: eLien } = await admin
      .from('scriptorium_unite_classes')
      .select('unite_id')
      .in('classe_id', classeIds)
    log('aletheia (liens)', eLien)
    const livres = [...new Set((liens ?? []).map((l) => l.unite_id as string))]
    if (livres.length === 0) return []
    // Non lu = retour VF prêt mais semaine pas close (une fois validé, statut → DONE).
    const { data, error } = await admin
      .from('aletheia_travaux')
      .select('scriptorium_livre_id, semaine_index')
      .eq('eleve_id', eleveId)
      .eq('statut', 'FEEDBACK2_READY')
      .in('scriptorium_livre_id', livres)
      .limit(1)
    log('aletheia (travaux)', error)
    return data && data.length > 0
      ? [{
          module: 'aletheia',
          label: 'Aletheia — retour final',
          href: `/eleve/modules/aletheia/${data[0].scriptorium_livre_id}/${data[0].semaine_index}`,
        }]
      : []
  } catch {
    return []
  }
}

async function quazianNonLus(admin: Admin, eleveId: string, classeIds: string[]): Promise<RetourNonLu[]> {
  try {
    if (classeIds.length === 0) return []
    const { data: scores, error: eScore } = await admin
      .from('quazian_quiz_scores')
      .select('quiz_id')
      .eq('eleve_id', eleveId)
      .is('note_vue_at', null)
    log('quazian (scores)', eScore)
    const quizIds = (scores ?? []).map((s) => s.quiz_id as string)
    if (quizIds.length === 0) return []
    // La note n'est « à lire » que si le quizz est fermé (corrigé) et d'une classe active.
    const { data: quizzes, error } = await admin
      .from('quazian_quizzes')
      .select('id')
      .eq('statut', 'ferme')
      .in('classe_id', classeIds)
      .in('id', quizIds)
      .limit(1)
    log('quazian (quizzes)', error)
    return quizzes && quizzes.length > 0
      ? [{ module: 'quazian', label: 'Quazian — note de quizz', href: `/eleve/modules/quazian/quizz/${quizzes[0].id}` }]
      : []
  } catch {
    return []
  }
}

// ── API ─────────────────────────────────────────────────────────────────────

/**
 * Liste des retours encore non lus par l'élève (toutes sources, classes actives).
 * Vide = rien à lire. Sert au message serveur (gardes) ET à la bannière UI.
 */
export async function retoursNonLus(admin: Admin, eleveId: string): Promise<RetourNonLu[]> {
  // Inscriptions actives → ids (scoping Fragments + lien contextuel) + classes (Codex/Aletheia/Quazian).
  const { data: insc, error } = await admin
    .from('inscriptions')
    .select('id, classe_id')
    .eq('eleve_id', eleveId)
    .eq('statut', 'active')
  log('inscriptions actives', error)
  const inscriptionIds = (insc ?? []).map((i) => i.id as string)
  const classeIds = (insc ?? []).map((i) => i.classe_id as string)

  const sources = await Promise.all([
    fragmentsEcritNonLus(admin, inscriptionIds),
    fragmentsEssaiNonLus(admin, inscriptionIds),
    codexNonLus(admin, eleveId, classeIds),
    aletheiaNonLus(admin, eleveId, classeIds),
    quazianNonLus(admin, eleveId, classeIds),
  ])
  return sources.flat()
}

/**
 * Garde-fou serveur (miroir de messageSiBloque) : message à renvoyer si l'élève
 * a au moins un retour non lu, sinon null. À appeler en tête des actions de
 * rendu, APRÈS messageSiBloque.
 */
export async function messageSiRetoursNonLus(admin: Admin, eleveId: string): Promise<string | null> {
  const retours = await retoursNonLus(admin, eleveId)
  if (retours.length === 0) return null
  const liste = retours.map((r) => r.label).join(' · ')
  const intro = retours.length > 1
    ? 'Tu as plusieurs retours à lire avant de pouvoir rendre'
    : 'Tu as un retour à lire avant de pouvoir rendre'
  return `${intro} : ${liste}. Va les valider, puis reviens.`
}
