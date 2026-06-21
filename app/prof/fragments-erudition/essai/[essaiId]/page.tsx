import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import EditorAnalyseEssai from './EditorAnalyseEssai'

export default async function PageEssai({
  params,
  searchParams,
}: {
  params: Promise<{ essaiId: string }>
  searchParams: Promise<{ epreuve?: string; classe?: string }>
}) {
  const { essaiId } = await params
  const { epreuve: epreuveId, classe: classeParam } = await searchParams
  const qsClasse = classeParam ? `&classe=${classeParam}` : ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: essai } = await admin
    .from('fragments_essais')
    .select('id, eleve_id, epreuve_id, depose_par, inscription_id')
    .eq('id', essaiId)
    .single()

  if (!essai) notFound()

  const [{ data: eleve }, { data: epreuve }, { data: photos }, { data: analyse }] = await Promise.all([
    admin.from('profiles').select('display_name, classe').eq('id', essai.eleve_id).single(),
    admin.from('fragments_essais_epreuves').select('id, titre, date_epreuve, duree_minutes').eq('id', essai.epreuve_id).single(),
    admin.from('fragments_essais_photos').select('id, storage_path, ordre').eq('essai_id', essaiId).order('ordre'),
    admin.from('essais_analyses').select('*').eq('essai_id', essaiId).maybeSingle(),
  ])

  // Navigation entre essais de la même épreuve — scopée à la classe consultée (?classe=,
  // sinon la classe de l'essai courant) pour ne pas traverser les classes sur une épreuve
  // assignée à plusieurs classes (Lot 5d).
  let essaiIds: string[] = []
  if (epreuveId) {
    let classeScope = classeParam ?? null
    if (!classeScope && essai.inscription_id) {
      const { data: inscRow } = await admin
        .from('inscriptions').select('classe_id').eq('id', essai.inscription_id).single()
      classeScope = (inscRow?.classe_id as string | undefined) ?? null
    }
    const { data: tousEssais } = await admin
      .from('fragments_essais')
      .select('id, inscription_id')
      .eq('epreuve_id', epreuveId)
    let essais = tousEssais ?? []
    if (classeScope) {
      const { data: inscClasse } = await admin
        .from('inscriptions').select('id').eq('classe_id', classeScope)
      const idsClasse = new Set((inscClasse ?? []).map(i => i.id as string))
      essais = essais.filter(e => e.inscription_id && idsClasse.has(e.inscription_id as string))
    }
    essaiIds = essais.map(e => e.id)
  }

  const indexActuel = essaiIds.indexOf(essaiId)
  const essaiPrecedent = indexActuel > 0 ? essaiIds[indexActuel - 1] : null
  const essaiSuivant = indexActuel < essaiIds.length - 1 ? essaiIds[indexActuel + 1] : null

  // Config pour la fourchette
  const { data: config } = await admin.from('fragments_config').select('fourchette_points').eq('id', 1).single()
  const fourchettePoints = config?.fourchette_points ?? 2

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div>
          {epreuveId ? (
            <Link
              href={`/prof/fragments-erudition/epreuves/${epreuveId}${classeParam ? `?classe=${classeParam}` : ''}`}
              className="text-sm text-stone-500 hover:text-stone-700"
            >
              ← {epreuve?.titre ?? 'Épreuve'}
            </Link>
          ) : (
            <Link href="/prof/fragments-erudition/epreuves" className="text-sm text-stone-500 hover:text-stone-700">
              ← Épreuves
            </Link>
          )}
          <h3 className="text-lg font-medium text-stone-900 mt-0.5">
            {(eleve as { display_name: string; classe: string | null } | null)?.display_name ?? 'Élève'}
            {(eleve as { display_name: string; classe: string | null } | null)?.classe && (
              <span className="text-sm text-stone-400 ml-2">
                {(eleve as { display_name: string; classe: string | null }).classe}
              </span>
            )}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {epreuve?.titre} · {epreuve?.duree_minutes} min
            {essai.depose_par === 'prof' && ' · déposé par le prof'}
          </p>
        </div>

        {epreuveId && essaiIds.length > 1 && (
          <div className="flex gap-2">
            {essaiPrecedent ? (
              <Link href={`/prof/fragments-erudition/essai/${essaiPrecedent}?epreuve=${epreuveId}${qsClasse}`}
                className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50">
                ← Élève précédent
              </Link>
            ) : <span className="text-sm px-3 py-1.5 text-stone-300">← Élève précédent</span>}
            {essaiSuivant ? (
              <Link href={`/prof/fragments-erudition/essai/${essaiSuivant}?epreuve=${epreuveId}${qsClasse}`}
                className="text-sm px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50">
                Élève suivant →
              </Link>
            ) : <span className="text-sm px-3 py-1.5 text-stone-300">Élève suivant →</span>}
          </div>
        )}
      </div>

      <EditorAnalyseEssai
        essaiId={essaiId}
        photos={(photos ?? []) as { id: string; storage_path: string; ordre: number }[]}
        analyse={analyse as import('@/types/fragments').EssaiAnalyse | null}
        fourchettePoints={fourchettePoints}
      />
    </div>
  )
}
