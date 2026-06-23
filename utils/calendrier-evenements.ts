import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { addDaysUTC, toISODate, jourParis } from '@/utils/calendrier-grille'

// Agrégation LECTURE SEULE des échéances datées des modules. Le calendrier ne
// stocke aucune échéance : il projette ce que les modules déclarent. L'édition
// légère (lot C6) réécrit dans le module propriétaire.

export type SourceModule = 'fragments' | 'quazian' | 'codex' | 'aletheia'
export type KindEvenement = 'ouverture' | 'fermeture' | 'epreuve' | 'quizz' | 'jalon'

export interface CalendarEvent {
  source_module: SourceModule
  source_id: string
  classe_id: string | null // uuid si résoluble, sinon null (événement général)
  classe_nom: string | null
  kind: KindEvenement
  date: string // YYYY-MM-DD
  label: string
  is_editable: boolean
}

// Normalise une relation imbriquée Supabase (objet ou tableau) en un objet.
function un<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null
  return x ?? null
}

/**
 * Collecte les événements datés de tous les modules dans la fenêtre [debut, fin].
 * Bornes incluses (comparaison lexicale sur YYYY-MM-DD).
 */
export async function assemblerEvenements(opts: {
  debut: string
  fin: string
}): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const { debut, fin } = opts
  const events: CalendarEvent[] = []

  // Map des classes (pour résoudre les classe_id textuels de Codex + les noms).
  const { data: classes } = await supabase.from('classes').select('id, nom')
  const idParNom = new Map<string, string>()
  const nomParId = new Map<string, string>()
  for (const c of classes ?? []) {
    if (c.nom) idParNom.set(c.nom.toLowerCase().trim(), c.id)
    nomParId.set(c.id, c.nom)
  }

  // 1. Essais Fragments (date par classe, éditable).
  const { data: epClasses } = await supabase
    .from('fragments_essais_classes')
    .select('essai_id, classe_id, date_essai, fragments_essais_epreuves(titre)')
    .gte('date_essai', debut)
    .lte('date_essai', fin)
  for (const e of epClasses ?? []) {
    const titre = un<{ titre: string }>(e.fragments_essais_epreuves)?.titre ?? 'Essai'
    events.push({
      source_module: 'fragments',
      source_id: e.essai_id,
      classe_id: e.classe_id,
      classe_nom: nomParId.get(e.classe_id) ?? null,
      kind: 'epreuve',
      date: e.date_essai,
      label: `Essai — ${titre}`,
      is_editable: true,
    })
  }

  // 2. Quizz Quazian (date = lancement ; non rééditable, lancés en live).
  const { data: quizzes } = await supabase
    .from('quazian_quizzes')
    .select('id, classe_id, lance_at')
    .not('lance_at', 'is', null)
  for (const q of quizzes ?? []) {
    const d = jourParis(q.lance_at as string) // jour local (fuseau école), pas l'UTC
    if (d < debut || d > fin) continue
    events.push({
      source_module: 'quazian',
      source_id: q.id,
      classe_id: q.classe_id ?? null,
      classe_nom: q.classe_id ? nomParId.get(q.classe_id) ?? null : null,
      kind: 'quizz',
      date: d,
      label: 'Quizz',
      is_editable: false,
    })
  }

  // 3. Synthèses Codex (classe_id TEXTUEL → résolu par nom ; date = lancement).
  const { data: sessions } = await supabase
    .from('codex_sessions')
    .select('id, classe_id, lance_at, scriptorium_unites(label)')
    .not('lance_at', 'is', null)
  for (const s of sessions ?? []) {
    const d = jourParis(s.lance_at as string) // jour local (fuseau école)
    if (d < debut || d > fin) continue
    const nom = (s.classe_id as string | null) ?? null
    const cid = nom ? idParNom.get(nom.toLowerCase().trim()) ?? null : null
    const unite = un<{ label: string }>(s.scriptorium_unites)?.label
    events.push({
      source_module: 'codex',
      source_id: s.id,
      classe_id: cid,
      classe_nom: nom,
      kind: 'jalon',
      date: d,
      label: unite ? `Codex — ${unite}` : 'Codex (synthèse)',
      is_editable: false,
    })
  }

  // 4. Aletheia : échéances de lecture par semaine, DÉRIVÉES du livre
  //    (scriptorium_unites type='livre' : date_debut + (i)·7 → fin de semaine).
  const { data: livres } = await supabase
    .from('scriptorium_unites')
    .select('id, label, date_debut')
    .eq('type', 'livre')
    .not('date_debut', 'is', null)
  const livreIds = (livres ?? []).map((l) => l.id)
  const { data: livreClasses } = livreIds.length > 0
    ? await supabase.from('scriptorium_unite_classes').select('unite_id, classe_id').in('unite_id', livreIds)
    : { data: [] }
  const classesParLivre = new Map<string, string[]>()
  for (const lc of livreClasses ?? []) {
    const arr = classesParLivre.get(lc.unite_id) ?? []
    arr.push(lc.classe_id)
    classesParLivre.set(lc.unite_id, arr)
  }
  // Les semaines réelles du livre = ses documents (scriptorium_documents.semaine),
  // comme la planification élève — et NON un compteur nb_semaines qui peut diverger.
  const { data: docsLivre } = livreIds.length > 0
    ? await supabase
        .from('scriptorium_documents')
        .select('unite_id, semaine')
        .in('unite_id', livreIds)
        .not('semaine', 'is', null)
    : { data: [] }
  const semainesParLivre = new Map<string, number[]>()
  for (const d of docsLivre ?? []) {
    const arr = semainesParLivre.get(d.unite_id as string) ?? []
    arr.push(d.semaine as number)
    semainesParLivre.set(d.unite_id as string, arr)
  }
  for (const livre of livres ?? []) {
    const base = new Date((livre.date_debut as string) + 'T00:00:00Z')
    const cls = classesParLivre.get(livre.id) ?? []
    for (const s of semainesParLivre.get(livre.id) ?? []) {
      // Échéance = fin de la semaine de lecture s (1-based, comme l'élève :
      // date_debut + (s-1)·7, +6 pour le dimanche).
      const d = toISODate(addDaysUTC(base, (s - 1) * 7 + 6))
      if (d < debut || d > fin) continue
      const cibles = cls.length > 0 ? cls : [null]
      for (const cid of cibles) {
        events.push({
          source_module: 'aletheia',
          source_id: livre.id,
          classe_id: cid,
          classe_nom: cid ? nomParId.get(cid) ?? null : null,
          kind: 'fermeture',
          date: d,
          label: `Aletheia — ${livre.label} (sem. ${s})`,
          is_editable: false,
        })
      }
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
  return events
}
