import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { formatJour } from '@/utils/fuseau'
import { semestreFragmentsActif } from './contexte-semestre'
import { toggleSemaineOuverte } from './actions'
import type { FragmentSemaine } from '@/types/fragments'

async function toggleAction(formData: FormData): Promise<void> {
  'use server'
  await toggleSemaineOuverte(formData)
}

const formatDate = (dateStr: string) => formatJour(dateStr, { day: 'numeric', month: 'long' })

export default async function PageFragmentsPof() {
  const supabase = await createClient()
  const { semestre } = await semestreFragmentsActif(supabase)

  // Les semaines sont dérivées du semestre (+ vacances) dans le Calendrier
  // (regenererSemaines). On n'affiche que les semaines de travail (hors vacances).
  const { data: semaines } = semestre
    ? await supabase
        .from('fragments_semaines')
        .select('*')
        .eq('semestre_id', semestre.id)
        .eq('is_vacation', false)
        .order('numero', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muet">
          Semaines du semestre <span className="font-medium text-encre-douce">{semestre?.label ?? '—'}</span>
        </p>
        <Link
          href="/prof/calendrier/config"
          className="text-xs text-muet hover:text-encre px-2 py-1 rounded hover:bg-parchemin-fonce transition-colors"
        >
          Gérer le calendrier →
        </Link>
      </div>

      {!semaines || semaines.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Aucune semaine dans ce semestre. Les semaines sont générées automatiquement à partir du semestre et des vacances définis dans le{' '}
          <Link href="/prof/calendrier/config" className="text-encre-douce underline">Calendrier</Link>.
        </div>
      ) : (
        <div className="space-y-3">
          {(semaines as FragmentSemaine[]).map(semaine => (
            <div
              key={semaine.id}
              className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl px-5 py-4 flex items-center justify-between gap-3 transition-colors hover:border-pigment hover:shadow-sm"
            >
              <Link
                href={`/prof/fragments-erudition/semaine/${semaine.id}`}
                className="min-w-0 group flex-1"
              >
                <p className="font-medium text-encre group-hover:text-encre-douce">
                  Semaine {semaine.numero}{semaine.titre ? ` — ${semaine.titre}` : ''}
                </p>
                <p className="text-sm text-muet mt-0.5">Limite : {formatDate(semaine.date_limite)}</p>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  semaine.ouverte ? 'bg-ok-teinte text-ok' : 'bg-parchemin-fonce text-muet'
                }`}>
                  {semaine.ouverte ? 'Ouverte' : 'Fermée'}
                </span>
                <form action={toggleAction}>
                  <input type="hidden" name="id" value={semaine.id} />
                  <input type="hidden" name="ouverte" value={String(semaine.ouverte)} />
                  <button type="submit" className="text-xs text-muet hover:text-encre px-2 py-1 rounded hover:bg-parchemin-fonce transition-colors">
                    {semaine.ouverte ? 'Fermer' : 'Rouvrir'}
                  </button>
                </form>
                <Link href={`/prof/fragments-erudition/semaine/${semaine.id}`} className="text-muet hover:text-encre-douce">→</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
