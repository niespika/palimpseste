import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import FormulaireDepot from './FormulaireDepot'
import HistoriqueDepots from './HistoriqueDepots'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Récupérer le thème
  const { data: theme } = await supabase
    .from('fragments_themes')
    .select('theme, description')
    .eq('eleve_id', user.id)
    .maybeSingle()

  // Récupérer la semaine ouverte la plus récente
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('*')
    .eq('ouverte', true)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Dépôt existant pour cette semaine
  const { data: depotActuel } = semaine
    ? await supabase
        .from('fragments_depots')
        .select('id, statut, commentaire_eleve, created_at, fragments_photos(id, storage_path, ordre)')
        .eq('eleve_id', user.id)
        .eq('semaine_id', semaine.id)
        .maybeSingle()
    : { data: null }

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

  const maintenant = new Date()
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

          <div className="px-4 py-4">
            <FormulaireDepot
              semaineId={semaine.id}
              eleveId={user.id}
              depotExistant={!!depotActuel}
              onSuccess={() => {
                // La page se rechargera via revalidatePath
              }}
            />
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

      {/* Historique */}
      {depotsPasses.length > 0 && (
        <HistoriqueDepots
          depots={depotsPasses as unknown as Parameters<typeof HistoriqueDepots>[0]['depots']}
        />
      )}
    </div>
  )
}
