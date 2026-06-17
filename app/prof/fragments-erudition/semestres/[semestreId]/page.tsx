import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
import Tuile from '@/components/Tuile'
import GestionSyntheses from './GestionSyntheses'

export default async function PageSemestre({
  params,
  searchParams,
}: {
  params: Promise<{ semestreId: string }>
  searchParams: Promise<{ classe?: string }>
}) {
  const { semestreId } = await params
  const { classe: classeSel } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: semestre } = await admin
    .from('fragments_semestres')
    .select('*')
    .eq('id', semestreId)
    .single()

  if (!semestre) notFound()

  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = moduleData ? await classesAvecModule(admin, moduleData.id) : []

  // Classe choisie (?classe=) → ses élèves + leurs synthèses de ce semestre.
  const classeChoisie = classes.find(c => c.id === classeSel)
  let eleves: { id: string; display_name: string; classe: string | null; inscription_id: string }[] = []
  let syntheseParEleve: Record<string, unknown> = {}

  if (classeChoisie) {
    const inscrits = await inscriptionsClasse(admin, classeChoisie.id)
    const eleveIds = inscrits.map(i => i.eleve_id)
    const inscriptionIds = inscrits.map(i => i.id)
    const inscriptionParEleve = Object.fromEntries(inscrits.map(i => [i.eleve_id, i.id]))

    const { data: elevesBruts } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name, classe').in('id', eleveIds).eq('role', 'eleve').order('display_name')
      : { data: [] }
    eleves = (elevesBruts ?? []).map(e => ({ ...e, inscription_id: inscriptionParEleve[e.id] })) as typeof eleves

    const { data: syntheses } = inscriptionIds.length > 0
      ? await admin.from('fragments_syntheses')
          .select('id, eleve_id, statut, synthese, points_forts, axes_progres, note20_suggeree, note20_min, note20_max, note20_justification, note20_validee, note_visible_eleve, notes_prof, created_at, updated_at, publiee_at')
          .eq('semestre_id', semestreId)
          .in('inscription_id', inscriptionIds)
      : { data: [] }
    for (const s of syntheses ?? []) {
      syntheseParEleve[s.eleve_id as string] = s
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/prof/fragments-erudition/semestres" className="text-sm text-stone-500 hover:text-stone-700">← Semestres</Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
        <h3 className="text-lg font-serif text-stone-900">{semestre.label}</h3>
        <p className="text-sm text-stone-500 mt-0.5">
          {new Date(semestre.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' → '}
          {new Date(semestre.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
          Aucune classe avec le module Fragments.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classes.map(c => (
            <Tuile
              key={c.id}
              nom={c.nom}
              href={`/prof/fragments-erudition/semestres/${semestreId}?classe=${c.id}`}
              selectionnee={classeSel === c.id}
            />
          ))}
        </div>
      )}

      {classeChoisie && (
        <GestionSyntheses
          semestreId={semestreId}
          eleves={eleves}
          syntheseParEleve={syntheseParEleve as Parameters<typeof GestionSyntheses>[0]['syntheseParEleve']}
        />
      )}
    </div>
  )
}
