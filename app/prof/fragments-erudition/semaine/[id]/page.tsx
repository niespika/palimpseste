import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import { classeFragmentsActive } from '../../contexte-classe'
import VueSemaine from './VueSemaine'
import TirageAuSort from './TirageAuSort'
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

  // Classe active → inscriptions (1 inscription par élève dans la classe)
  const { classe } = await classeFragmentsActive(supabase)
  if (!classe) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
        Aucune classe n'a accès à ce module.
      </div>
    )
  }
  const inscrits = await inscriptionsClasse(supabase, classe.id)
  const eleveIds = inscrits.map(i => i.eleve_id)
  const inscriptionIds = inscrits.map(i => i.id)

  const { data: eleves } = eleveIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, display_name, classe, role, created_at')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  // Dépôts pour cette semaine (de cette classe)
  const { data: depots } = inscriptionIds.length > 0
    ? await supabase
        .from('fragments_depots')
        .select(`
          id, eleve_id, semaine_id, statut, commentaire_eleve, created_at, updated_at,
          photos:fragments_photos(id, depot_id, storage_path, ordre, created_at)
        `)
        .eq('semaine_id', id)
        .in('inscription_id', inscriptionIds)
    : { data: [] }

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

  // Présentations pour cette semaine (de cette classe)
  const admin = createAdminClient()
  const { data: presentations } = inscriptionIds.length > 0
    ? await admin
        .from('fragments_presentations')
        .select('id, eleve_id, inscription_id, semaine_id, statut, created_at')
        .eq('semaine_id', id)
        .in('inscription_id', inscriptionIds)
        .order('created_at')
    : { data: [] }

  // Profils des élèves présentateurs
  const presentateurIds = [...new Set((presentations ?? []).map(p => p.eleve_id))]
  const { data: presentateurProfils } = presentateurIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, display_name, classe')
        .in('id', presentateurIds)
    : { data: [] }

  const profilParId = Object.fromEntries(
    (presentateurProfils ?? []).map(p => [p.id, p])
  )

  const presentationsAvecEleve = (presentations ?? []).map(p => ({
    ...p,
    eleve: profilParId[p.eleve_id] ?? null,
  }))

  // Nombre de présentations passées (statut='presente') par élève éligible
  const eligiblesIds = elevesAvecDepot.filter(e => e.depot).map(e => e.id)
  const { data: comptesPresentation } = eligiblesIds.length > 0 && inscriptionIds.length > 0
    ? await admin
        .from('fragments_presentations')
        .select('eleve_id')
        .eq('statut', 'presente')
        .in('inscription_id', inscriptionIds)
    : { data: [] }

  const nbParEleve: Record<string, number> = {}
  for (const p of comptesPresentation ?? []) {
    nbParEleve[p.eleve_id] = (nbParEleve[p.eleve_id] ?? 0) + 1
  }

  const eligibles = elevesAvecDepot
    .filter(e => e.depot)
    .map(e => ({
      id: e.id,
      display_name: e.display_name,
      classe: e.classe,
      nbPresentations: nbParEleve[e.id] ?? 0,
    }))

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
        <div className="space-y-6">
          <VueSemaine eleves={elevesAvecDepot} semaineId={id} />
          <TirageAuSort
            semaineId={id}
            classeId={classe.id}
            eligibles={eligibles}
            presentations={presentationsAvecEleve}
          />
        </div>
      )}
    </div>
  )
}
