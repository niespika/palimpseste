import { createClient } from '@/utils/supabase/server'
import FormulaireSemaine from './FormulaireSemaine'
import { toggleSemaineOuverte } from '../actions'
import { semestreFragmentsActif } from '../contexte-semestre'
import type { FragmentSemaine } from '@/types/fragments'

async function toggleAction(formData: FormData): Promise<void> {
  'use server'
  await toggleSemaineOuverte(formData)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PageSemaines() {
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
    <div className="space-y-6">
      {semestre && (
        <p className="text-sm text-stone-500">
          Semestre courant du module : <span className="font-medium text-stone-700">{semestre.label}</span>
        </p>
      )}
      <FormulaireSemaine />

      {!semaines || semaines.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucune semaine créée pour l'instant.</p>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">N°</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Titre</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Date limite</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Statut</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {(semaines as FragmentSemaine[]).map(semaine => (
                <tr key={semaine.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3 text-sm font-medium text-stone-900">{semaine.numero}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">{semaine.titre ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-stone-600">{formatDate(semaine.date_limite)}</td>
                  <td className="px-4 py-3">
                    {semaine.ouverte ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ouverte</span>
                    ) : (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">Fermée</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleAction}>
                      <input type="hidden" name="id" value={semaine.id} />
                      <input type="hidden" name="ouverte" value={String(semaine.ouverte)} />
                      <button
                        type="submit"
                        className="text-xs text-stone-600 hover:text-stone-900 px-2 py-1 rounded hover:bg-stone-200 transition-colors"
                      >
                        {semaine.ouverte ? 'Fermer' : 'Rouvrir'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
