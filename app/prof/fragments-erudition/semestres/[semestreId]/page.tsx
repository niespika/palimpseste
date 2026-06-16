import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import { classeFragmentsActive } from '../../contexte-classe'
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

  // Classe active → inscriptions (1 inscription par élève dans la classe)
  const { classe } = await classeFragmentsActive(supabase)
  const inscrits = classe ? await inscriptionsClasse(admin, classe.id) : []
  const eleveIds = inscrits.map(i => i.eleve_id)
  const inscriptionIds = inscrits.map(i => i.id)
  const inscriptionParEleve = Object.fromEntries(inscrits.map(i => [i.eleve_id, i.id]))

  const { data: elevesBruts } = eleveIds.length > 0
    ? await admin.from('profiles').select('id, display_name, classe').in('id', eleveIds).eq('role', 'eleve').order('display_name')
    : { data: [] }

  const eleves = (elevesBruts ?? []).map(e => ({ ...e, inscription_id: inscriptionParEleve[e.id] }))

  // Synthèses existantes (scopées par inscription)
  const { data: syntheses } = inscriptionIds.length > 0
    ? await admin.from('fragments_syntheses')
        .select('id, eleve_id, statut, synthese, points_forts, axes_progres, note20_suggeree, note20_min, note20_max, note20_justification, note20_validee, note_visible_eleve, notes_prof, created_at, updated_at, publiee_at')
        .eq('semestre_id', semestreId)
        .in('inscription_id', inscriptionIds)
    : { data: [] }

  type SyntheseRow = { id: string; eleve_id: string; statut: string; synthese: string | null; points_forts: string | null; axes_progres: string | null; note20_suggeree: number | null; note20_min: number | null; note20_max: number | null; note20_justification: string | null; note20_validee: number | null; note_visible_eleve: boolean; notes_prof: string | null; publiee_at: string | null }
  const syntheseParEleve: Record<string, SyntheseRow> = {}
  for (const s of (syntheses ?? []) as SyntheseRow[]) {
    syntheseParEleve[s.eleve_id] = s
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

      <GestionSyntheses
        semestreId={semestreId}
        eleves={eleves as { id: string; display_name: string; classe: string | null; inscription_id: string }[]}
        syntheseParEleve={syntheseParEleve as Record<string, SyntheseRow | undefined>}
      />
    </div>
  )
}
