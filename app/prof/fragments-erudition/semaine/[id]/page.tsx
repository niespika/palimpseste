import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import VueSemaine from './VueSemaine'
import type { EleveAvecDepot } from '@/types/fragments'

export default async function PageVueSemaine({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('*')
    .eq('id', id)
    .single()

  if (!semaine) notFound()

  // Élèves ayant accès au module
  const { data: moduleData } = await supabase
    .from('modules')
    .select('id')
    .eq('slug', 'fragments-erudition')
    .single()

  const { data: assignments } = moduleData
    ? await supabase
        .from('module_assignments')
        .select('eleve_id')
        .eq('module_id', moduleData.id)
    : { data: [] }

  const eleveIds = (assignments ?? []).map(a => a.eleve_id)

  const { data: eleves } = eleveIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, display_name, classe, role, created_at')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  // Dépôts pour cette semaine
  const { data: depots } = await supabase
    .from('fragments_depots')
    .select(`
      id, eleve_id, semaine_id, statut, commentaire_eleve, created_at, updated_at,
      photos:fragments_photos(id, depot_id, storage_path, ordre, created_at)
    `)
    .eq('semaine_id', id)

  const depotParEleve = Object.fromEntries(
    (depots ?? []).map(d => [d.eleve_id, d])
  )

  // Analyses pour ces dépôts
  const depotIds = (depots ?? []).map(d => d.id)
  const { data: analyses } = depotIds.length > 0
    ? await supabase
        .from('fragments_analyses')
        .select('id, depot_id, statut, note_decouvertes, note_sources, note_reflexions')
        .in('depot_id', depotIds)
    : { data: [] }

  const analyseParDepot = Object.fromEntries(
    (analyses ?? []).map(a => [a.depot_id, a])
  )

  const elevesAvecDepot: EleveAvecDepot[] = (eleves ?? []).map(eleve => {
    const depot = depotParEleve[eleve.id]
    return {
      ...eleve,
      depot: depot
        ? { ...depot, photos: depot.photos ?? [] }
        : null,
      analyse: depot ? (analyseParDepot[depot.id] ?? null) : null,
    }
  })

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div>
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-stone-900">
            Semaine {semaine.numero}
            {semaine.titre ? ` — ${semaine.titre}` : ''}
          </p>
          <p className="text-sm text-stone-500 mt-0.5">
            Date limite : {formatDate(semaine.date_limite)}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          semaine.ouverte
            ? 'bg-green-100 text-green-700'
            : 'bg-stone-100 text-stone-600'
        }`}>
          {semaine.ouverte ? 'Ouverte' : 'Fermée'}
        </span>
      </div>

      {elevesAvecDepot.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
          Aucun élève n'a accès au module pour l'instant.
        </div>
      ) : (
        <VueSemaine eleves={elevesAvecDepot} semaineId={id} />
      )}
    </div>
  )
}
