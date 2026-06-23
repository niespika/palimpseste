import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { jourParis, lundiOnOrBefore, addDaysUTC, toISODate } from '@/utils/calendrier-grille'
import { assemblerEvenements, type CalendarEvent } from '@/utils/calendrier-evenements'
import { couleursParClasse } from '@/utils/calendrier-couleurs'

function fmtJourLong(d: string) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
}

// Tuiles « aujourd'hui » + « cette semaine » du tableau de bord prof :
// les échéances/jalons du jour et de la semaine calendaire en cours (F1).
export default async function TuilesJourSemaine() {
  const supabase = await createClient()

  const today = jourParis(new Date())
  const lundi = lundiOnOrBefore(today)
  const debut = toISODate(lundi)
  const fin = toISODate(addDaysUTC(lundi, 6))

  const [events, { data: classes }] = await Promise.all([
    assemblerEvenements({ debut, fin }),
    supabase.from('classes').select('id, nom, couleur').eq('statut', 'active'),
  ])
  const couleurs = couleursParClasse(classes ?? [])
  const evJour = events.filter((e) => e.date === today)
  const evSemaine = [...events].sort((a, b) => a.date.localeCompare(b.date))

  const ligne = (e: CalendarEvent, i: number, avecDate = false) => (
    <div key={i} className="flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: e.classe_id ? couleurs.get(e.classe_id) ?? '#a8a29e' : '#a8a29e' }}
      />
      <span className="text-sm text-stone-700 truncate">
        {avecDate && <span className="text-xs text-stone-400 mr-1">{new Date(e.date + 'T00:00:00Z').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' })}</span>}
        {e.label}
        {e.classe_nom && <span className="text-stone-400"> · {e.classe_nom}</span>}
      </span>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Aujourd'hui */}
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Aujourd&apos;hui</p>
        <p className="text-sm text-stone-400 capitalize mb-3">{fmtJourLong(today)}</p>
        {evJour.length === 0 ? (
          <p className="text-sm text-stone-400">Rien de prévu.</p>
        ) : (
          <div className="space-y-1.5">{evJour.map((e, i) => ligne(e, i))}</div>
        )}
      </div>

      {/* Cette semaine */}
      <Link
        href={`/prof/calendrier?vue=semaine&date=${debut}`}
        className="bg-white border border-stone-200 rounded-xl p-5 block hover:border-stone-300 hover:shadow-sm transition-all"
      >
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Cette semaine</p>
          <span className="text-xs text-stone-400">vue détaillée →</span>
        </div>
        {evSemaine.length === 0 ? (
          <p className="text-sm text-stone-400 mt-3">Rien de prévu cette semaine.</p>
        ) : (
          <div className="space-y-1.5 mt-3">
            {evSemaine.slice(0, 5).map((e, i) => ligne(e, i, true))}
            {evSemaine.length > 5 && <p className="text-xs text-stone-400">+ {evSemaine.length - 5} autre{evSemaine.length - 5 > 1 ? 's' : ''}…</p>}
          </div>
        )}
      </Link>
    </div>
  )
}
