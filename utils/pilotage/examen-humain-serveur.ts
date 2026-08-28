import 'server-only'
// ============================================================================
// C6 · L1 — LA FILE D'EXAMEN HUMAIN, VUE DU TABLEAU DE BORD.
// ----------------------------------------------------------------------------
// ⭐⭐ POURQUOI CETTE LECTURE EXISTE, ET C'EST UNE DEMANDE DE LOUIS (28/08) :
//    *« il faut me prévenir régulièrement de regarder. Sinon je vais oublier. »*
//
// La file d'examen humain vit sous l'onglet Compétences d'UNE classe. Un
// professeur qui n'ouvre pas cet onglet ne la voit jamais — or **ce n'est pas un
// confort** : « toute contestation portant sur une citation absente part
// DIRECTEMENT en file professeur — ce qui satisfait aussi l'exigence d'examen
// humain de la loi » (`06-` §2 et §7), et cette exigence dit que la contestation
// « aboutit AU PROFESSEUR — jamais à une file qui s'auto-résout ».
//
// ⭐ D'où une lecture GLOBALE, sur le tableau de bord : elle ne dépend d'aucun
//    agent, d'aucun rappel extérieur, d'aucune mémoire. Elle vit tant que la
//    plateforme vit. *C'est la première des deux moitiés de la demande ; la
//    seconde — « me prévenir aussi que ce n'est peut-être pas le bon moment » —
//    ne peut pas vivre ici : un écran ne prévient que celui qui le regarde.*
//
// ⛔ AUCUN NOUVEAU DOMICILE. L'analyse du JSONB est celle de `lireLesActes`, et
//    le tri celui de `fileDExamenHumain` — les deux mêmes que la page de la
//    classe. Une seconde lecture qui divergerait ferait SORTIR une contestation
//    de la file, c'est-à-dire de l'exigence de la loi.
//
// ⚠️ `supabase-js` NE LÈVE PAS et PLAFONNE À 1000 LIGNES : on pagine, et une
//    lecture ratée devient un incident que l'appelant peut dire — jamais un
//    silence qui se lirait « rien à examiner ».
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { fileDExamenHumain, lireLesActes, type ActeLu } from './attention'

type Admin = ReturnType<typeof createAdminClient>

const PAGE = 1000

export interface FileDExamenHumain {
  /** Les actes non traités portant sur une citation absente, du plus ancien au plus récent. */
  actes: ActeLu[]
  /** Où les regarder : une entrée par classe concernée, la plus fournie d'abord. */
  parClasse: Array<{ classeId: string; classeNom: string; actes: number }>
  /** L'instant du plus ancien acte non traité (ISO), ou `null`. */
  plusAncien: string | null
  /** ⛔ « Une lecture ratée n'est pas une file vide. » */
  incidents: string[]
}

const VIDE: FileDExamenHumain = { actes: [], parClasse: [], plusAncien: null, incidents: [] }

export async function chargerLaFileDExamenHumain(admin: Admin): Promise<FileDExamenHumain> {
  const incidents: string[] = []

  // ── Les métacognitions qui portent au moins un acte ───────────────────────
  const brutes: Array<{ depot_id: string; contestation_points: unknown }> = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin
      .from('exercices_metacognition')
      .select('depot_id, contestation_points')
      .not('contestation_points', 'is', null)
      .order('depot_id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) {
      return { ...VIDE, incidents: [`la file d’examen humain : ${error.message}`] }
    }
    const page = (data ?? []) as Array<{ depot_id: string; contestation_points: unknown }>
    brutes.push(...page)
    if (page.length < PAGE) break
  }
  if (brutes.length === 0) return VIDE

  // ── À qui appartiennent ces dépôts ────────────────────────────────────────
  const ids = brutes.map((b) => b.depot_id)
  const eleveDuDepot = new Map<string, string>()
  for (let debut = 0; debut < ids.length; debut += 200) {
    const { data, error } = await admin.from('exercices_depots')
      .select('id, eleve_id').in('id', ids.slice(debut, debut + 200))
    if (error) { incidents.push(`les dépôts contestés : ${error.message}`); continue }
    for (const d of (data ?? []) as Array<{ id: string; eleve_id: string }>) {
      eleveDuDepot.set(d.id, d.eleve_id)
    }
  }

  const actes = fileDExamenHumain(brutes.flatMap((b) =>
    lireLesActes(b.contestation_points, b.depot_id, eleveDuDepot.get(b.depot_id) ?? '?')))
  if (actes.length === 0) return { ...VIDE, incidents }

  // ── OÙ les regarder : la file vit sous l'onglet Compétences d'une CLASSE ──
  // ⚠️ Un élève peut être inscrit dans DEUX classes (éprouvé en base) : son acte
  //    compte alors pour les deux, parce qu'il est visible depuis les deux. On
  //    ne choisit pas à la place du professeur.
  const eleveIds = [...new Set(actes.map((a) => a.eleveId))]
  const { data: inscriptions, error: eInsc } = await admin
    .from('inscriptions').select('eleve_id, classe_id').eq('statut', 'active').in('eleve_id', eleveIds)
  if (eInsc) incidents.push(`les inscriptions : ${eInsc.message}`)
  const { data: classes, error: eCl } = await admin.from('classes').select('id, nom')
  if (eCl) incidents.push(`les classes : ${eCl.message}`)
  const nomDeLaClasse = new Map(((classes ?? []) as Array<{ id: string; nom: string }>)
    .map((c) => [c.id, c.nom]))

  const classesDeLEleve = new Map<string, string[]>()
  for (const i of (inscriptions ?? []) as Array<{ eleve_id: string; classe_id: string }>) {
    const lot = classesDeLEleve.get(i.eleve_id) ?? []
    lot.push(i.classe_id)
    classesDeLEleve.set(i.eleve_id, lot)
  }

  const compte = new Map<string, number>()
  for (const a of actes) {
    for (const c of classesDeLEleve.get(a.eleveId) ?? []) {
      compte.set(c, (compte.get(c) ?? 0) + 1)
    }
  }
  const parClasse = [...compte]
    .map(([classeId, n]) => ({ classeId, classeNom: nomDeLaClasse.get(classeId) ?? '?', actes: n }))
    .sort((a, b) => (b.actes - a.actes) || a.classeNom.localeCompare(b.classeNom, 'fr'))

  // `actes` est déjà trié du plus ancien au plus récent par `fileDExamenHumain`.
  return { actes, parClasse, plusAncien: actes[0].at || null, incidents }
}

/**
 * DEPUIS COMBIEN DE JOURS LA FILE ATTEND — en JOURS PLEINS, et jamais en cycles.
 *
 * ⚠️ **Ici, et seulement ici, le compte est en JOURS.** Les cycles du Calendrier
 *    servent aux règles du routeur — la cadence d'ancre, le re-signalement d'un
 *    dossier N3 —, parce que ce sont des règles pédagogiques. **L'examen humain
 *    d'une contestation n'en est pas une** : c'est une obligation légale, et un
 *    élève qui attend pendant les vacances attend quand même.
 *
 * `null` quand la file est vide ou l'instant illisible.
 */
export function joursDAttente(plusAncien: string | null, maintenant: string): number | null {
  if (!plusAncien) return null
  const a = Date.parse(plusAncien)
  const b = Date.parse(maintenant)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return Math.max(0, Math.floor((b - a) / 86_400_000))
}
