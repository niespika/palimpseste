import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { resoudreDatesLivre, pairesLivresGouvernes } from './aletheia-dates'

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
  const tz = await lireFuseau() // jour local des instants (lance_at) dans le fuseau choisi

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
    const d = jourDansFuseau(q.lance_at as string, tz) // jour local (fuseau choisi), pas l'UTC
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
    const d = jourDansFuseau(s.lance_at as string, tz) // jour local (fuseau choisi)
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

  // 4. Aletheia : échéances de lecture — mode b UNIQUEMENT (dates issues du PARCOURS,
  //    résolues via snapshot/frise). Un livre non gouverné (mode a) ne génère aucune
  //    échéance (LD2). scriptorium_parcours* est en RLS prof-only → lecture via `admin` ;
  //    chaque événement porte son classe_id → la page élève filtre par classe (pas de
  //    fuite). L'échéance est déjà le DIMANCHE (résolveur).
  const admin = createAdminClient()
  const paires = await pairesLivresGouvernes(admin)
  if (paires.length) {
    const livreIds = [...new Set(paires.map(p => p.livreId))]
    const [{ data: docsLivre }, { data: livresRows }] = await Promise.all([
      admin.from('scriptorium_documents').select('unite_id, semaine').in('unite_id', livreIds).not('semaine', 'is', null),
      admin.from('scriptorium_unites').select('id, label').eq('type', 'livre').is('supprime_at', null).in('id', livreIds),
    ])
    const seancesParLivre = new Map<string, number[]>()
    for (const d of docsLivre ?? []) {
      const arr = seancesParLivre.get(d.unite_id as string) ?? []
      arr.push(d.semaine as number)
      seancesParLivre.set(d.unite_id as string, arr)
    }
    const labelParLivre = new Map<string, string>()
    for (const l of livresRows ?? []) labelParLivre.set(l.id as string, l.label as string)

    for (const { livreId, classeId } of paires) {
      const label = labelParLivre.get(livreId)
      if (!label) continue // livre supprimé/masqué → pas d'événement
      const seances = seancesParLivre.get(livreId) ?? []
      const { dates } = await resoudreDatesLivre(admin, livreId, classeId, seances)
      for (const s of seances) {
        const d = dates.get(s)?.valeur
        if (!d || d < debut || d > fin) continue
        events.push({
          source_module: 'aletheia',
          source_id: livreId,
          classe_id: classeId,
          classe_nom: nomParId.get(classeId) ?? null,
          kind: 'fermeture',
          date: d,
          label: `Aletheia — ${label} (séance ${s})`,
          is_editable: false,
        })
      }
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label))
  return events
}
