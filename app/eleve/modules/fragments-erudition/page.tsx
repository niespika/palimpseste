import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import FormulaireDepot from './FormulaireDepot'
import HistoriqueDepots from './HistoriqueDepots'
import AnalysePubliee from './AnalysePubliee'
import type { FragmentAnalyse, FragmentPiste } from '@/types/fragments'

function formatDateLimite(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PageFragments() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Thème
  const { data: theme } = await supabase
    .from('fragments_themes')
    .select('theme, description')
    .eq('eleve_id', user.id)
    .maybeSingle()

  // Semaine ouverte
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('*')
    .eq('ouverte', true)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Dépôt de la semaine en cours
  const { data: depotActuel } = semaine
    ? await supabase
        .from('fragments_depots')
        .select('id, statut, commentaire_eleve, created_at, fragments_photos(id, storage_path, ordre)')
        .eq('eleve_id', user.id)
        .eq('semaine_id', semaine.id)
        .maybeSingle()
    : { data: null }

  // Analyse de la semaine en cours (publiée uniquement)
  const { data: analyseActuelle } = depotActuel
    ? await admin
        .from('fragments_analyses')
        .select('*')
        .eq('depot_id', depotActuel.id)
        .eq('statut', 'publiee')
        .maybeSingle()
    : { data: null }

  // Pistes de l'analyse actuelle
  const { data: pistesActuelles } = analyseActuelle
    ? await admin
        .from('fragments_pistes')
        .select('*')
        .eq('analyse_id', analyseActuelle.id)
        .order('created_at')
    : { data: [] }

  // Historique des dépôts passés
  const { data: historique } = await supabase
    .from('fragments_depots')
    .select(`
      id, statut, commentaire_eleve, created_at, updated_at, eleve_id, semaine_id,
      semaine:fragments_semaines(id, numero, titre, date_debut, date_limite, ouverte, created_at),
      photos:fragments_photos(id, depot_id, storage_path, ordre, created_at)
    `)
    .eq('eleve_id', user.id)
    .order('created_at', { ascending: false })

  const depotsPasses = (historique ?? []).filter(d =>
    semaine ? d.semaine_id !== semaine.id : true
  )

  // Analyses publiées pour les dépôts passés
  const depotIdsHistorique = depotsPasses.map(d => d.id)
  const { data: analysesPassees } = depotIdsHistorique.length > 0
    ? await admin
        .from('fragments_analyses')
        .select('*')
        .eq('statut', 'publiee')
        .in('depot_id', depotIdsHistorique)
    : { data: [] }

  const analyseParDepot: Record<string, FragmentAnalyse> = Object.fromEntries(
    (analysesPassees ?? []).map(a => [a.depot_id, a])
  )

  // Pistes pour les analyses passées
  const analyseIdsPassees = (analysesPassees ?? []).map(a => a.id)
  const { data: pistesPassees } = analyseIdsPassees.length > 0
    ? await admin
        .from('fragments_pistes')
        .select('*')
        .in('analyse_id', analyseIdsPassees)
        .order('created_at')
    : { data: [] }

  const pistesParAnalyse: Record<string, FragmentPiste[]> = {}
  for (const piste of pistesPassees ?? []) {
    if (!pistesParAnalyse[piste.analyse_id]) pistesParAnalyse[piste.analyse_id] = []
    pistesParAnalyse[piste.analyse_id].push(piste)
  }

  const depotEnRetard = semaine && depotActuel?.statut === 'en_retard'

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700">← Retour</Link>
      </div>

      <div>
        <h2 className="text-xl font-serif text-stone-900 mb-1">Fragments d'érudition</h2>
        {theme ? (
          <div className="bg-stone-100 rounded-xl px-4 py-3">
            <p className="text-xs text-stone-500 mb-0.5">Ton thème</p>
            <p className="font-medium text-stone-800">{theme.theme}</p>
            {theme.description && (
              <p className="text-sm text-stone-500 mt-1">{theme.description}</p>
            )}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
            <p className="text-sm text-stone-500 italic">
              Ton thème sera défini avec ton professeur.
            </p>
          </div>
        )}
      </div>

      {/* Semaine en cours */}
      {semaine ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-stone-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Semaine en cours</p>
                <p className="font-medium text-stone-900">
                  Semaine {semaine.numero}
                  {semaine.titre ? ` — ${semaine.titre}` : ''}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  À rendre avant le {formatDateLimite(semaine.date_limite)}
                </p>
              </div>

              {depotActuel ? (
                <div className="flex-shrink-0">
                  {depotEnRetard ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      ⚠ En retard
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✓ Déposé
                    </span>
                  )}
                </div>
              ) : (
                <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  À déposer
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">
            <FormulaireDepot
              semaineId={semaine.id}
              eleveId={user.id}
              depotExistant={!!depotActuel}
            />

            {/* Statut retour */}
            {depotActuel && !analyseActuelle && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                <p className="text-sm text-stone-500">
                  Retour en préparation — ton professeur l'examinera bientôt.
                </p>
              </div>
            )}

            {/* Analyse publiée de la semaine en cours */}
            {analyseActuelle && (
              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                  Retour de ton professeur
                </p>
                <AnalysePubliee
                  analyse={analyseActuelle as FragmentAnalyse}
                  pistes={(pistesActuelles ?? []) as FragmentPiste[]}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <p className="text-stone-500 text-sm">
            Aucune semaine n'est ouverte pour l'instant.<br />
            Ton professeur en créera une bientôt.
          </p>
        </div>
      )}

      {/* Historique des semaines passées */}
      {depotsPasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Semaines précédentes</h3>
          {depotsPasses.map(depot => {
            const analyse = analyseParDepot[depot.id]
            const pistes = analyse ? (pistesParAnalyse[analyse.id] ?? []) : []
            const semaineTitre = (depot.semaine as unknown as { numero: number; titre: string | null } | null)
            return (
              <div key={depot.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <p className="font-medium text-stone-800 text-sm">
                    Semaine {semaineTitre?.numero ?? '?'}
                    {semaineTitre?.titre ? ` — ${semaineTitre.titre}` : ''}
                  </p>
                  {analyse ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Retour disponible
                    </span>
                  ) : (
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      Déposé ✓
                    </span>
                  )}
                </div>
                {analyse && (
                  <div className="px-4 py-4">
                    <AnalysePubliee
                      analyse={analyse}
                      pistes={pistes as FragmentPiste[]}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
