import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { semestreFragmentsActif } from './contexte-semestre'
import type { FragmentSemaine } from '@/types/fragments'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PageFragmentsPof() {
  const supabase = await createClient()
  const { semestre } = await semestreFragmentsActif(supabase)

  const { data: semaines } = semestre
    ? await supabase
        .from('fragments_semaines')
        .select('*')
        .eq('semestre_id', semestre.id)
        .order('numero', { ascending: false })
    : { data: [] }

  return (
    <div>
      {!semaines || semaines.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
          Aucune semaine créée.{' '}
          <Link href="/prof/fragments-erudition/semaines" className="underline hover:text-stone-700">
            Créer la première semaine →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(semaines as FragmentSemaine[]).map(semaine => (
            <Link
              key={semaine.id}
              href={`/prof/fragments-erudition/semaine/${semaine.id}`}
              className="block bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-stone-900 group-hover:text-stone-700">
                    Semaine {semaine.numero}
                    {semaine.titre ? ` — ${semaine.titre}` : ''}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Limite : {formatDate(semaine.date_limite)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    semaine.ouverte
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {semaine.ouverte ? 'Ouverte' : 'Fermée'}
                  </span>
                  <span className="text-stone-400 group-hover:text-stone-600">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
