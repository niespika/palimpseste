import 'server-only'
// ============================================================================
// C4 · L12 — LES CINQ SEGMENTS, LUS. Un domicile, et un seul.
// ----------------------------------------------------------------------------
// `01-` §4, couche 1 — « les cinq segments SE CALCULENT À LA CONCEPTION D'UN
// PLAN D'ÉVALUATION, ET ILS S'Y AFFICHENT ». C'est aussi de là que sort LE
// SEGMENT COURANT, donc la règle de calibration du §6, le démarrage des
// compteurs d'escalade au segment 3, et la table de proportions.
//
// ⭐ CE FICHIER NE FAIT QUE DÉMÉNAGER LA LECTURE QUE `app/prof/routeur/serveur.ts`
//    PORTAIT DÉJÀ (`chargerLesSegments`), pour que l'écran et le moteur lisent LA
//    MÊME CHOSE. L'écran l'appelle désormais ; son export ne bouge pas. *Deux
//    lectures d'un même calendrier finiraient par diverger, et c'est le segment
//    courant qui gouverne la moitié des règles.*
//
// ⚠️ LE SEMESTRE EST GLOBAL AU PROFESSEUR — aucun lien élève↔semestre, aucun lien
//    classe↔semestre : le rattachement se fait PAR LES DATES.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { calculerGrilleSemaines } from '@/utils/calendrier-grille'
import { decouperEnSegments, type DecoupeEnSegments } from '@/utils/routeur/segments'
import type { Segment } from '@/utils/routeur/types'

type Admin = ReturnType<typeof createAdminClient>

/**
 * Les semaines D'ENSEIGNEMENT du Calendrier — vacances déjà sautées — puis
 * `decouperEnSegments`, « qui fait le reste et signale seul un calendrier trop
 * court ». Rien d'autre ne se calcule ici.
 */
export async function lireLesSegments(
  admin: Admin, dateDebut?: string,
): Promise<DecoupeEnSegments & { incidents: string[] }> {
  const incidents: string[] = []
  const { data: semestres, error } = await admin
    .from('semesters').select('id, name, start_date, end_date')
    .is('archived_at', null).order('start_date')
  if (error) incidents.push(`semestres : ${error.message}`)

  const { data: vacances, error: eV } = await admin
    .from('holidays').select('semester_id, label, start_date, end_date')
  if (eV) incidents.push(`vacances : ${eV.message}`)

  const semaines: Array<{ dateDebutLundi: string; dateFinDimanche: string }> = []
  for (const s of (semestres ?? []) as Array<{ id: string; start_date: string; end_date: string }>) {
    const h = ((vacances ?? []) as Array<{ semester_id: string; label: string
      start_date: string; end_date: string }>)
      .filter((v) => v.semester_id === s.id)
      .map((v) => ({ label: v.label, start_date: v.start_date, end_date: v.end_date }))
    for (const w of calculerGrilleSemaines(s, h)) {
      if (w.isVacation) continue
      if (dateDebut && w.start < dateDebut) continue
      semaines.push({ dateDebutLundi: w.start, dateFinDimanche: w.end })
    }
  }
  return { ...decouperEnSegments(semaines), incidents }
}

export interface SegmentDuCycle {
  /** `null` quand le cycle demandé ne tombe dans AUCUN segment du calendrier. */
  segment: Segment | null
  regime: string | null
  /** Le rang de la semaine DANS le segment, 1 pour la première. */
  rangDansLeSegment: number | null
  motif: string
}

/**
 * Le segment auquel appartient un lundi donné. ⛔ « Le routeur N'INVENTE AUCUNE
 * BORNE » : un lundi hors calendrier ne reçoit pas un segment par défaut, il
 * reçoit un `null` et son motif.
 */
export function segmentDuCycle(
  decoupe: DecoupeEnSegments, cycleLundi: string,
): SegmentDuCycle {
  for (const s of decoupe.segments) {
    const i = s.semaines.findIndex((w) => w.dateDebutLundi === cycleLundi)
    if (i >= 0) {
      return { segment: s.segment, regime: s.regime, rangDansLeSegment: i + 1,
        motif: `segment ${s.segment} (${s.regime}), semaine ${i + 1} du segment.` }
    }
  }
  return { segment: null, regime: null, rangDansLeSegment: null,
    motif: `le lundi ${cycleLundi} n'appartient à aucun segment : aucun semestre non archivé ne `
      + 'le porte comme semaine de cours (vacances comprises). Le routeur n\'invente aucune borne.' }
}

/** Vrai quand ce lundi est le DERNIER du segment 2 — la borne où la calibration se clôt. */
export function estLaBorneDuSegment2(decoupe: DecoupeEnSegments, cycleLundi: string): boolean {
  const s2 = decoupe.segments.find((s) => s.segment === 2)
  const dernier = s2?.semaines[s2.semaines.length - 1]
  return !!dernier && dernier.dateDebutLundi === cycleLundi
}
