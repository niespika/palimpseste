import 'server-only'
import { createClient } from '@/utils/supabase/server'
import { addDaysUTC, toISODate } from '@/utils/calendrier-grille'

// Jours de cours (informatif). Pour chaque jour de la fenêtre, liste les classes
// ayant cours : motif hebdomadaire (hors vacances) + exceptions ponctuelles.
export async function coursParJour(opts: {
  debut: string
  fin: string
}): Promise<Map<string, { id: string; nom: string }[]>> {
  const supabase = await createClient()
  const [{ data: classes }, { data: patterns }, { data: exceptions }, { data: hols }] = await Promise.all([
    supabase.from('classes').select('id, nom').eq('statut', 'active').order('nom'),
    supabase.from('teaching_patterns').select('classe_id, weekday'),
    supabase.from('teaching_exceptions').select('classe_id, date, kind').gte('date', opts.debut).lte('date', opts.fin),
    supabase.from('holidays').select('start_date, end_date'),
  ])

  const cls = classes ?? []
  const motif = new Set((patterns ?? []).map((p) => `${p.classe_id}:${p.weekday}`))
  const ajout = new Set((exceptions ?? []).filter((e) => e.kind === 'ajout').map((e) => `${e.classe_id}:${e.date}`))
  const retrait = new Set((exceptions ?? []).filter((e) => e.kind === 'retrait').map((e) => `${e.classe_id}:${e.date}`))
  const holidays = hols ?? []
  const estVacance = (d: string) => holidays.some((h) => h.start_date <= d && d <= h.end_date)

  const map = new Map<string, { id: string; nom: string }[]>()
  let cur = opts.debut
  let garde = 0
  while (cur <= opts.fin && garde < 400) {
    garde++
    const wd = (new Date(cur + 'T00:00:00Z').getUTCDay() + 6) % 7 // 0 = lundi
    const vac = estVacance(cur)
    const liste: { id: string; nom: string }[] = []
    for (const c of cls) {
      const cle = `${c.id}:${cur}`
      const parMotif = motif.has(`${c.id}:${wd}`) && !vac
      if ((parMotif || ajout.has(cle)) && !retrait.has(cle)) liste.push({ id: c.id, nom: c.nom })
    }
    if (liste.length > 0) map.set(cur, liste)
    cur = toISODate(addDaysUTC(new Date(cur + 'T00:00:00Z'), 1))
  }
  return map
}
