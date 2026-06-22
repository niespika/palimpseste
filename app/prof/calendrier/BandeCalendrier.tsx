import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { calculerGrilleSemaines, jourParis } from '@/utils/calendrier-grille'
import { assemblerEvenements } from '@/utils/calendrier-evenements'
import { couleursParClasse } from '@/utils/calendrier-couleurs'

const NB_SEMAINES_BANDE = 6

function fmtJour(d: string) {
  return new Date(d + 'T00:00:00Z').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// Bande des prochaines semaines sur le tableau de bord (lecture seule).
// Chaque semaine montre son numéro pédagogique (ou « Vacances ») + des pastilles
// d'échéances colorées par classe. Clic → vue semaine détaillée.
export default async function BandeCalendrier() {
  const supabase = await createClient()

  const { data: sem } = await supabase
    .from('semesters')
    .select('id, name, start_date, end_date')
    .eq('is_active', true)
    .maybeSingle()

  if (!sem) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Calendrier</h3>
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-500">
          Aucun semestre actif.{' '}
          <Link href="/prof/calendrier/config" className="underline hover:text-stone-800">
            Configurer le calendrier →
          </Link>
        </div>
      </section>
    )
  }

  const { data: hols } = await supabase
    .from('holidays')
    .select('label, start_date, end_date')
    .eq('semester_id', sem.id)
  const grille = calculerGrilleSemaines(sem, hols ?? [])

  // Fenêtre : à partir de la semaine en cours (sinon les dernières du semestre).
  const today = jourParis(new Date())
  let startIdx = grille.findIndex((w) => w.end >= today)
  if (startIdx < 0) startIdx = Math.max(0, grille.length - NB_SEMAINES_BANDE)
  const bande = grille.slice(startIdx, startIdx + NB_SEMAINES_BANDE)

  const debut = bande[0]?.start ?? sem.start_date
  const fin = bande[bande.length - 1]?.end ?? sem.end_date
  const events = await assemblerEvenements({ debut, fin })

  const { data: classes } = await supabase
    .from('classes')
    .select('id, nom, couleur')
    .eq('statut', 'active')
    .order('nom')
  const couleurs = couleursParClasse(classes ?? [])

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">
          Calendrier · {sem.name}
        </h3>
        <Link href="/prof/calendrier" className="text-xs text-stone-500 hover:text-stone-800 underline">
          Vue détaillée →
        </Link>
      </div>

      {bande.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 text-sm text-stone-400">
          Le semestre est terminé.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {bande.map((w) => {
            const evs = events.filter((e) => e.date >= w.start && e.date <= w.end)
            return (
              <Link
                key={w.start}
                href={`/prof/calendrier?vue=semaine&date=${w.start}`}
                className={`block rounded-xl border p-3 min-h-[7rem] transition-colors ${
                  w.isVacation
                    ? 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                    : 'bg-white border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className={`text-sm font-medium ${w.isVacation ? 'text-stone-400' : 'text-stone-900'}`}>
                    {w.isVacation ? 'Vacances' : `S${w.pedagogicalNumber}`}
                  </span>
                  <span className="text-[10px] text-stone-400">{fmtJour(w.start)}</span>
                </div>
                {w.isVacation && w.vacanceLabel && (
                  <p className="text-[10px] text-stone-400 mt-0.5 truncate">{w.vacanceLabel}</p>
                )}
                <div className="mt-2 space-y-1">
                  {evs.slice(0, 3).map((e, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: e.classe_id ? couleurs.get(e.classe_id) ?? '#a8a29e' : '#a8a29e' }}
                      />
                      <span className="text-[11px] text-stone-600 truncate">{e.label}</span>
                    </div>
                  ))}
                  {evs.length > 3 && (
                    <p className="text-[10px] text-stone-400">+ {evs.length - 3} autre{evs.length - 3 > 1 ? 's' : ''}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
