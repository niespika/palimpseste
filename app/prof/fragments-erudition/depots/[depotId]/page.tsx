import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import EditorAnalyseDepot from './EditorAnalyseDepot'

export default async function PageDepot({
  params,
  searchParams,
}: {
  params: Promise<{ depotId: string }>
  searchParams: Promise<{ essai?: string; classe?: string }>
}) {
  const { depotId } = await params
  const { essai: essaiId, classe: classeParam } = await searchParams
  const qsClasse = classeParam ? `&classe=${classeParam}` : ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: depot } = await admin
    .from('fragments_essai_depots')
    .select('id, eleve_id, essai_id, depose_par, inscription_id')
    .eq('id', depotId)
    .single()

  if (!depot) notFound()

  const [{ data: eleve }, { data: epreuve }, { data: photos }, { data: analyse }] = await Promise.all([
    admin.from('profiles').select('display_name, classe').eq('id', depot.eleve_id).single(),
    admin.from('fragments_essais_epreuves').select('id, titre, date_essai, duree_minutes').eq('id', depot.essai_id).single(),
    admin.from('fragments_essai_depot_photos').select('id, storage_path, ordre').eq('depot_id', depotId).order('ordre'),
    admin.from('fragments_essai_depot_analyses').select('*').eq('depot_id', depotId).maybeSingle(),
  ])

  // Navigation entre dépôts du même essai — scopée à la classe consultée (?classe=,
  // sinon la classe du dépôt courant) pour ne pas traverser les classes sur un essai
  // assigné à plusieurs classes (Lot 5d).
  let depotIds: string[] = []
  if (essaiId) {
    let classeScope = classeParam ?? null
    if (!classeScope && depot.inscription_id) {
      const { data: inscRow } = await admin
        .from('inscriptions').select('classe_id').eq('id', depot.inscription_id).single()
      classeScope = (inscRow?.classe_id as string | undefined) ?? null
    }
    const { data: tousDepots } = await admin
      .from('fragments_essai_depots')
      .select('id, inscription_id')
      .eq('essai_id', essaiId)
    let depots = tousDepots ?? []
    if (classeScope) {
      const { data: inscClasse } = await admin
        .from('inscriptions').select('id').eq('classe_id', classeScope)
      const idsClasse = new Set((inscClasse ?? []).map(i => i.id as string))
      depots = depots.filter(d => d.inscription_id && idsClasse.has(d.inscription_id as string))
    }
    depotIds = depots.map(d => d.id)
  }

  const indexActuel = depotIds.indexOf(depotId)
  const depotPrecedent = indexActuel > 0 ? depotIds[indexActuel - 1] : null
  const depotSuivant = indexActuel < depotIds.length - 1 ? depotIds[indexActuel + 1] : null

  // Config pour la fourchette
  const { data: config } = await admin.from('fragments_config').select('fourchette_points').eq('id', 1).single()
  const fourchettePoints = config?.fourchette_points ?? 2

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          {essaiId ? (
            <Link
              href={`/prof/fragments-erudition/essais/${essaiId}${classeParam ? `?classe=${classeParam}` : ''}`}
              className="text-sm text-muet hover:text-encre-douce"
            >
              ← {epreuve?.titre ?? 'Essai'}
            </Link>
          ) : (
            <Link href="/prof/fragments-erudition/essais" className="text-sm text-muet hover:text-encre-douce">
              ← Essais
            </Link>
          )}
          <h3 className="text-lg font-medium text-encre mt-0.5">
            {(eleve as { display_name: string; classe: string | null } | null)?.display_name ?? 'Élève'}
            {(eleve as { display_name: string; classe: string | null } | null)?.classe && (
              <span className="text-sm text-muet ml-2">
                {(eleve as { display_name: string; classe: string | null }).classe}
              </span>
            )}
          </h3>
          <p className="text-xs text-muet mt-0.5">
            {epreuve?.titre} · {epreuve?.duree_minutes} min
            {depot.depose_par === 'prof' && ' · déposé par le prof'}
          </p>
        </div>

        {essaiId && depotIds.length > 1 && (
          <div className="flex gap-2">
            {depotPrecedent ? (
              <Link href={`/prof/fragments-erudition/depots/${depotPrecedent}?essai=${essaiId}${qsClasse}`}
                className="text-sm px-3 py-1.5 border border-bordure rounded-lg hover:bg-parchemin-fonce">
                ← Élève précédent
              </Link>
            ) : <span className="text-sm px-3 py-1.5 text-muet">← Élève précédent</span>}
            {depotSuivant ? (
              <Link href={`/prof/fragments-erudition/depots/${depotSuivant}?essai=${essaiId}${qsClasse}`}
                className="text-sm px-3 py-1.5 border border-bordure rounded-lg hover:bg-parchemin-fonce">
                Élève suivant →
              </Link>
            ) : <span className="text-sm px-3 py-1.5 text-muet">Élève suivant →</span>}
          </div>
        )}
      </div>

      <EditorAnalyseDepot
        depotId={depotId}
        photos={(photos ?? []) as { id: string; storage_path: string; ordre: number }[]}
        analyse={analyse as import('@/types/fragments').EssaiDepotAnalyse | null}
        fourchettePoints={fourchettePoints}
      />
    </div>
  )
}
