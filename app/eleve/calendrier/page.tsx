import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteClasseEleve } from '../contexte-classe'
import { calculerGrilleSemaines, jourParis } from '@/utils/calendrier-grille'
import { assemblerEvenements, type CalendarEvent, type SourceModule } from '@/utils/calendrier-evenements'

const BADGE_MODULE: Record<SourceModule, { label: string; classe: string }> = {
  fragments: { label: 'Fragments', classe: 'bg-amber-50 text-amber-700' },
  quazian: { label: 'Quazian', classe: 'bg-violet-50 text-violet-700' },
  codex: { label: 'Codex', classe: 'bg-blue-50 text-blue-700' },
  aletheia: { label: 'Aletheia', classe: 'bg-emerald-50 text-emerald-700' },
}

function fmtJour(d: string) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export default async function CalendrierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { active } = await contexteClasseEleve(supabase, user!.id)

  const admin = createAdminClient()
  const { data: sem } = await admin
    .from('semesters')
    .select('id, name, start_date, end_date')
    .eq('is_active', true)
    .maybeSingle()

  if (!active || !sem) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-serif text-stone-900">Calendrier</h2>
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
          {!active ? 'Tu n’es inscrit dans aucune classe pour l’instant.' : 'Aucun semestre actif pour le moment.'}
        </div>
      </div>
    )
  }

  const { data: hols } = await admin.from('holidays').select('label, start_date, end_date').eq('semester_id', sem.id)
  const grille = calculerGrilleSemaines(sem, hols ?? [])
  const events = (await assemblerEvenements({ debut: sem.start_date, fin: sem.end_date }))
    .filter((e) => e.classe_id === active.classe_id)
  const today = jourParis(new Date())

  const evParSemaine = (w: { start: string; end: string }) =>
    events.filter((e) => e.date >= w.start && e.date <= w.end).sort((a, b) => a.date.localeCompare(b.date))

  const ligne = (e: CalendarEvent, i: number) => {
    const b = BADGE_MODULE[e.source_module]
    return (
      <div key={i} className="flex items-center gap-2 text-sm">
        <span className="text-xs text-stone-400 w-12 flex-shrink-0">{fmtJour(e.date)}</span>
        <span className={`text-[11px] px-1.5 py-0.5 rounded flex-shrink-0 ${b.classe}`}>{b.label}</span>
        <span className="text-stone-700 truncate">{e.label}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif text-stone-900">Calendrier</h2>
        <p className="text-sm text-stone-500 mt-0.5">{sem.name} · {active.classe_nom}</p>
      </div>

      <div className="space-y-2">
        {grille.map((w) => {
          const evs = evParSemaine(w)
          const estCourante = w.start <= today && today <= w.end
          const passee = w.end < today
          return (
            <div
              key={w.start}
              className={`rounded-xl border p-4 ${
                estCourante ? 'border-stone-400 bg-white ring-1 ring-stone-300'
                : w.isVacation ? 'border-stone-200 bg-stone-50'
                : `border-stone-200 bg-white ${passee ? 'opacity-60' : ''}`
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className={`text-sm font-medium ${w.isVacation ? 'text-stone-400' : 'text-stone-900'}`}>
                  {w.isVacation ? `Vacances${w.vacanceLabel ? ` — ${w.vacanceLabel}` : ''}` : `Semaine ${w.pedagogicalNumber}`}
                  {estCourante && <span className="ml-2 text-xs text-stone-500">· en cours</span>}
                </span>
                <span className="text-xs text-stone-400">{fmtJour(w.start)} – {fmtJour(w.end)}</span>
              </div>
              {evs.length === 0 ? (
                !w.isVacation && <p className="text-xs text-stone-300">—</p>
              ) : (
                <div className="space-y-1 mt-2">{evs.map(ligne)}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
