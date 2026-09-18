// ============================================================================
// L'AGENDA DE CLASSE — la partie PURE (18/09/2026). Testée par
// `calendrier-agenda.test.ts` ; la couche I/O vit dans `calendrier-evenements.ts`
// (source 6), `calendrier-agenda-porte.ts` (la porte) et les actions du calendrier.
//
// Deux choses, demandées ensemble par Louis le 18/09 :
//  · un ÉVÈNEMENT LIBRE : une date, un titre, une classe — ce qu'aucun module ne
//    porte (« avoir fini la lecture de ce livre pour tel jour ») ;
//  · l'INTITULÉ d'un exercice du plan d'évaluation, pour que « Quiz » devienne
//    « Quiz — Les Lumières » partout où l'exercice se lit.
// ============================================================================

export const TITRE_MAX = 120
export const DETAIL_MAX = 1000
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Une date PURE existante : le format, et le calendrier (V8 normalise « 2026-02-30 » en mars). */
export function estUneDate(s: unknown): s is string {
  if (typeof s !== 'string' || !RE_DATE.test(s)) return false
  const t = Date.parse(s + 'T00:00:00Z')
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s
}

export interface EvenementAgendaSaisi {
  titre: string
  date: string
  detail: string | null
  visible_eleves: boolean
  classe_ids: string[]
}

/** Valide et normalise la saisie d'un évènement libre. Une erreur = un message pour l'écran. */
export function validerEvenementAgenda(input: {
  titre?: unknown; date?: unknown; detail?: unknown; visible_eleves?: unknown; classe_ids?: unknown
}): { ok: true; valeur: EvenementAgendaSaisi } | { ok: false; error: string } {
  const titre = typeof input.titre === 'string' ? input.titre.trim().replace(/\s+/g, ' ') : ''
  if (!titre) return { ok: false, error: 'Donne un titre à l’évènement.' }
  if (titre.length > TITRE_MAX) return { ok: false, error: `Le titre dépasse ${TITRE_MAX} caractères.` }
  const date = typeof input.date === 'string' ? input.date : ''
  if (!estUneDate(date)) return { ok: false, error: 'Date invalide.' }
  const detailBrut = typeof input.detail === 'string' ? input.detail.trim() : ''
  if (detailBrut.length > DETAIL_MAX) return { ok: false, error: `Le détail dépasse ${DETAIL_MAX} caractères.` }
  const classeIds = Array.isArray(input.classe_ids)
    ? [...new Set(input.classe_ids.filter((x): x is string => typeof x === 'string' && RE_UUID.test(x)))]
    : []
  if (classeIds.length === 0) return { ok: false, error: 'Choisis au moins une classe.' }
  return {
    ok: true,
    valeur: {
      titre, date, detail: detailBrut || null,
      visible_eleves: !([false, '0', 'non', 'false', 'off'] as unknown[]).includes(input.visible_eleves),
      classe_ids: classeIds,
    },
  }
}

/** Normalise l'intitulé d'un exercice du plan : vide ⇒ null (aucun intitulé). */
export function normaliserIntitule(brut: unknown): { ok: true; valeur: string | null } | { ok: false; error: string } {
  const s = typeof brut === 'string' ? brut.trim().replace(/\s+/g, ' ') : ''
  if (!s) return { ok: true, valeur: null }
  if (s.length > TITRE_MAX) return { ok: false, error: `L’intitulé dépasse ${TITRE_MAX} caractères.` }
  return { ok: true, valeur: s }
}

/**
 * Libellé d'un exercice du plan au calendrier. Le générique (« Quiz ») reste la
 * base ; l'intitulé s'y accole quand il existe ET que l'agenda est ouvert.
 * Côté prof, le statut de conception suit. Côté élève, l'intitulé ne part QUE
 * sur un examen ANNONCÉ par le prof (`annonce`) : annoncer, c'est publier la
 * date ET le nom. ⚠️ Un quiz servi par le réglage global « quiz annoncé » (D5)
 * n'est pas annoncé par le prof : il garde son générique (passe adversariale 18/09).
 */
export function libelleExercicePlanifie(opts: {
  generique: string          // libelleTypeExercice(...) en minuscules
  titre: string | null
  statut: 'a_concevoir' | 'concu' | string
  surface: 'prof' | 'eleve'
  agendaActif: boolean
  annonce?: boolean          // requis pour servir l'intitulé à l'élève
}): string {
  const base = opts.generique.charAt(0).toUpperCase() + opts.generique.slice(1)
  const intituleServi = opts.agendaActif && !!opts.titre && (opts.surface === 'prof' || opts.annonce === true)
  const nom = intituleServi ? `${base} — ${opts.titre}` : base
  if (opts.surface === 'eleve') return nom
  return `${nom} · ${opts.statut === 'concu' ? 'conçu' : 'à concevoir'}`
}

export interface LigneEvenementAgenda {
  id: string
  classe_id: string
  date: string
  titre: string
  detail: string | null
  visible_eleves: boolean
}

/**
 * Ce que la source 6 ÉMET, à partir des lignes lues : la fenêtre, puis la
 * surface. Élève : seulement ses classes (fail-closed sans `classeIds`) et
 * seulement le visible. Prof : tout, une note privée comprise.
 */
export function filtrerEvenementsAgenda(lignes: LigneEvenementAgenda[], opts: {
  debut: string; fin: string; surface: 'prof' | 'eleve'; classeIds?: string[]
}): LigneEvenementAgenda[] {
  const scope = opts.surface === 'eleve' ? new Set(opts.classeIds ?? []) : null
  return lignes.filter((l) => {
    if (l.date < opts.debut || l.date > opts.fin) return false
    if (scope === null) return true
    return l.visible_eleves && scope.has(l.classe_id)
  })
}
