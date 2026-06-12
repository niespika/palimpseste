import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import EnregistreurAudio from './EnregistreurAudio'
import EditorAnalyseOrale from './EditorAnalyseOrale'

export default async function PagePresentation({
  params,
}: {
  params: Promise<{ presentationId: string }>
}) {
  const { presentationId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  // Présentation
  const { data: presentation } = await admin
    .from('fragments_presentations')
    .select('id, eleve_id, semaine_id, statut, created_at')
    .eq('id', presentationId)
    .single()

  if (!presentation) notFound()

  // Profil élève + semaine
  const [{ data: eleve }, { data: semaine }] = await Promise.all([
    admin.from('profiles').select('id, display_name, classe').eq('id', presentation.eleve_id).single(),
    admin.from('fragments_semaines').select('id, numero, titre').eq('id', presentation.semaine_id).single(),
  ])

  // Oral existant
  const { data: oral } = await admin
    .from('fragments_oraux')
    .select('*')
    .eq('presentation_id', presentationId)
    .maybeSingle()

  // Analyse orale existante
  const { data: analyseOrale } = oral
    ? await admin
        .from('fragments_analyses_orales')
        .select('*')
        .eq('oral_id', oral.id)
        .maybeSingle()
    : { data: null }

  // Config (pour l'option suppression audio)
  const { data: config } = await admin
    .from('fragments_config')
    .select('supprimer_audio_publication')
    .eq('id', 1)
    .single()

  const titrePresentation = `Semaine ${semaine?.numero ?? '?'}${semaine?.titre ? ` — ${semaine.titre}` : ''}`

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href={`/prof/fragments-erudition/semaine/${presentation.semaine_id}`}
          className="text-sm text-stone-500 hover:text-stone-700"
        >
          ← {titrePresentation}
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-400 mb-0.5">Présentation orale</p>
          <p className="font-medium text-stone-900">
            {eleve?.display_name ?? '?'}
            {eleve?.classe && <span className="text-stone-400 font-normal ml-2 text-sm">{eleve.classe}</span>}
          </p>
          <p className="text-sm text-stone-500 mt-0.5">{titrePresentation}</p>
        </div>
        <Link
          href={`/prof/fragments-erudition/eleve/${presentation.eleve_id}`}
          className="text-xs text-stone-500 hover:text-stone-700 underline"
        >
          Fiche élève
        </Link>
      </div>

      {/* Pas encore d'oral → enregistreur */}
      {!oral && (
        <EnregistreurAudio
          presentationId={presentationId}
          eleveId={presentation.eleve_id}
        />
      )}

      {/* Oral en cours ou prêt à valider */}
      {oral && (
        <EditorAnalyseOrale
          oral={oral}
          analyseOrale={analyseOrale}
          presentationId={presentationId}
          supprimerAudioParDefaut={config?.supprimer_audio_publication ?? true}
        />
      )}
    </div>
  )
}
