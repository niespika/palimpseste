import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
import Tuile from '@/components/Tuile'
import VueSemaine from './VueSemaine'
import TirageAuSort from './TirageAuSort'
import type { EleveAvecDepot, StatutPresentation } from '@/types/fragments'

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
})

export default async function PageVueSemaine({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ classe?: string }>
}) {
  const { id } = await params
  const { classe: classeSel } = await searchParams
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: semaine } = await supabase.from('fragments_semaines').select('*').eq('id', id).single()
  if (!semaine) notFound()

  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = moduleData ? await classesAvecModule(admin, moduleData.id) : []

  // Compteurs (cumulatifs) par classe pour cette semaine.
  type Compteurs = { inscrits: number; deposes: number; retard: number; manquant: number; aValider: number; publie: number }
  const compteursParClasse = new Map<string, Compteurs>()
  // Données du détail si une classe est sélectionnée.
  let detail: { elevesAvecDepot: EleveAvecDepot[]; eligibles: { id: string; display_name: string; classe: string | null; nbPresentations: number }[]; presentationsAvecEleve: { id: string; eleve_id: string; inscription_id: string | null; semaine_id: string; statut: StatutPresentation; created_at: string; eleve: { display_name: string; classe: string | null } | null }[] } | null = null

  for (const c of classes) {
    const inscrits = await inscriptionsClasse(admin, c.id)
    const inscriptionIds = inscrits.map(i => i.id)
    const { data: depots } = inscriptionIds.length > 0
      ? await admin.from('fragments_depots')
          .select('id, eleve_id, statut')
          .eq('semaine_id', id)
          .in('inscription_id', inscriptionIds)
      : { data: [] }
    const depotIds = (depots ?? []).map(d => d.id as string)
    const { data: analyses } = depotIds.length > 0
      ? await admin.from('fragments_analyses').select('depot_id, statut').in('depot_id', depotIds)
      : { data: [] }
    compteursParClasse.set(c.id, {
      inscrits: inscrits.length,
      deposes: (depots ?? []).length,
      retard: (depots ?? []).filter(d => d.statut === 'en_retard').length,
      manquant: inscrits.length - (depots ?? []).length,
      aValider: (analyses ?? []).filter(a => a.statut === 'generee').length,
      publie: (analyses ?? []).filter(a => a.statut === 'publiee').length,
    })
  }

  const classeChoisie = classes.find(c => c.id === classeSel)
  if (classeChoisie) {
    const inscrits = await inscriptionsClasse(admin, classeChoisie.id)
    const inscriptionIds = inscrits.map(i => i.id)
    const eleveIds = inscrits.map(i => i.eleve_id)
    const { data: eleves } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name, classe, role, created_at').in('id', eleveIds).eq('role', 'eleve').order('display_name')
      : { data: [] }
    const { data: depots } = inscriptionIds.length > 0
      ? await admin.from('fragments_depots')
          .select('id, eleve_id, semaine_id, statut, commentaire_eleve, created_at, updated_at, photos:fragments_photos(id, depot_id, storage_path, ordre, created_at)')
          .eq('semaine_id', id).in('inscription_id', inscriptionIds)
      : { data: [] }
    const depotParEleve = Object.fromEntries((depots ?? []).map(d => [d.eleve_id, d]))
    const depotIds = (depots ?? []).map(d => d.id)
    const { data: analyses } = depotIds.length > 0
      ? await admin.from('fragments_analyses').select('id, depot_id, statut, note_decouvertes, note_sources, note_reflexions').in('depot_id', depotIds)
      : { data: [] }
    const analyseParDepot = Object.fromEntries((analyses ?? []).map(a => [a.depot_id, a]))
    const elevesAvecDepot: EleveAvecDepot[] = (eleves ?? []).map(eleve => {
      const depot = depotParEleve[eleve.id]
      return { ...eleve, depot: depot ? { ...depot, photos: depot.photos ?? [] } : null, analyse: depot ? (analyseParDepot[depot.id] ?? null) : null }
    })

    const { data: presentations } = inscriptionIds.length > 0
      ? await admin.from('fragments_presentations').select('id, eleve_id, inscription_id, semaine_id, statut, created_at').eq('semaine_id', id).in('inscription_id', inscriptionIds).order('created_at')
      : { data: [] }
    const presIds = [...new Set((presentations ?? []).map(p => p.eleve_id))]
    const { data: presProfils } = presIds.length > 0
      ? await admin.from('profiles').select('id, display_name, classe').in('id', presIds)
      : { data: [] }
    const profilParId = Object.fromEntries((presProfils ?? []).map(p => [p.id, p]))
    const presentationsAvecEleve = (presentations ?? []).map(p => ({ ...p, statut: p.statut as StatutPresentation, eleve: profilParId[p.eleve_id] ?? null }))

    const { data: comptes } = inscriptionIds.length > 0
      ? await admin.from('fragments_presentations').select('eleve_id').eq('statut', 'presente').in('inscription_id', inscriptionIds)
      : { data: [] }
    const nbParEleve: Record<string, number> = {}
    for (const p of comptes ?? []) nbParEleve[p.eleve_id] = (nbParEleve[p.eleve_id] ?? 0) + 1
    const eligibles = elevesAvecDepot.filter(e => e.depot).map(e => ({ id: e.id, display_name: e.display_name, classe: e.classe, nbPresentations: nbParEleve[e.id] ?? 0 }))

    detail = { elevesAvecDepot, eligibles, presentationsAvecEleve }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-surface border border-bordure rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-encre">
            Semaine {semaine.numero}{semaine.titre ? ` — ${semaine.titre}` : ''}
          </p>
          <p className="text-sm text-muet mt-0.5">Date limite : {formatDate(semaine.date_limite)}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${semaine.ouverte ? 'bg-ok-teinte text-ok' : 'bg-parchemin-fonce text-muet'}`}>
          {semaine.ouverte ? 'Ouverte' : 'Fermée'}
        </span>
      </div>

      {/* Tuiles de classe (compteurs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map(c => {
          const k = compteursParClasse.get(c.id)
          const couleur = k && k.manquant > 0 ? 'rouge' : k && k.aValider > 0 ? 'neutre' : 'vert'
          return (
            <Tuile
              key={c.id}
              nom={c.nom}
              sousTitre={`${k?.inscrits ?? 0} élèves`}
              couleur={couleur}
              href={`/prof/fragments-erudition/semaine/${id}?classe=${c.id}`}
              selectionnee={classeSel === c.id}
              resume={
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="bg-ok-teinte text-ok px-1.5 py-0.5 rounded-full">{k?.deposes ?? 0} déposés</span>
                  {(k?.retard ?? 0) > 0 && <span className="bg-attention-teinte text-attention px-1.5 py-0.5 rounded-full">{k!.retard} retard</span>}
                  {(k?.manquant ?? 0) > 0 && <span className="bg-retard-teinte text-retard px-1.5 py-0.5 rounded-full">{k!.manquant} manquant</span>}
                  {(k?.aValider ?? 0) > 0 && <span className="bg-attention-teinte text-attention px-1.5 py-0.5 rounded-full">{k!.aValider} à valider</span>}
                  {(k?.publie ?? 0) > 0 && <span className="bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded-full">{k!.publie} publié</span>}
                </div>
              }
            />
          )
        })}
        {classes.length === 0 && (
          <p className="text-sm text-muet">Aucune classe avec le module Fragments.</p>
        )}
      </div>

      {/* Détail de la classe sélectionnée */}
      {detail && classeChoisie && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link href={`/prof/fragments-erudition/semaine/${id}`} className="text-sm text-muet hover:text-encre-douce">← Toutes les classes</Link>
            <span className="text-sm text-muet">·</span>
            <span className="text-sm font-medium text-encre-douce">{classeChoisie.nom}</span>
          </div>
          {detail.elevesAvecDepot.length === 0 ? (
            <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">Aucun élève inscrit dans cette classe.</div>
          ) : (
            <>
              <VueSemaine eleves={detail.elevesAvecDepot} semaineId={id} />
              <TirageAuSort
                semaineId={id}
                classeId={classeChoisie.id}
                eligibles={detail.eligibles}
                presentations={detail.presentationsAvecEleve}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
