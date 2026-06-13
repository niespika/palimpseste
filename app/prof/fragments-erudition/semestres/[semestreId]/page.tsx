import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import GestionSyntheses from './GestionSyntheses'

export default async function PageSemestre({ params }: { params: Promise<{ semestreId: string }> }) {
  const { semestreId } = await params

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

  // Élèves du module
  const { data: moduleData } = await supabase.from('modules').select('id').eq('slug', 'fragments-erudition').single()
  const { data: assignments } = moduleData
    ? await supabase.from('module_assignments').select('eleve_id').eq('module_id', moduleData.id)
    : { data: [] }
  const eleveIds = (assignments ?? []).map(a => a.eleve_id as string)

  const { data: eleves } = eleveIds.length > 0
    ? await admin.from('profiles').select('id, display_name, classe').in('id', eleveIds).eq('role', 'eleve').order('display_name')
    : { data: [] }

  // Synthèses existantes
  const { data: syntheses } = eleveIds.length > 0
    ? await admin.from('fragments_syntheses')
        .select('id, eleve_id, statut, synthese, points_forts, axes_progres, note20_suggeree, note20_min, note20_max, note20_justification, note20_validee, note_visible_eleve, notes_prof, created_at, updated_at, publiee_at')
        .eq('semestre_id', semestreId)
        .in('eleve_id', eleveIds)
    : { data: [] }

  type SyntheseRow = { id: string; eleve_id: string; statut: string; synthese: string | null; points_forts: string | null; axes_progres: string | null; note20_suggeree: number | null; note20_min: number | null; note20_max: number | null; note20_justification: string | null; note20_validee: number | null; note_visible_eleve: boolean; notes_prof: string | null; publiee_at: string | null }
  const syntheseParEleve: Record<string, SyntheseRow> = {}
  for (const s of (syntheses ?? []) as SyntheseRow[]) {
    syntheseParEleve[s.eleve_id] = s
  }

  // Classes disponibles pour génération en lot
  const classes = [...new Set((eleves ?? []).map(e => e.classe).filter(Boolean) as string[])].sort()

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

      <GestionSyntheses
        semestreId={semestreId}
        eleves={(eleves ?? []) as { id: string; display_name: string; classe: string | null }[]}
        syntheseParEleve={syntheseParEleve as Record<string, SyntheseRow | undefined>}
        classes={classes}
      />
    </div>
  )
}
