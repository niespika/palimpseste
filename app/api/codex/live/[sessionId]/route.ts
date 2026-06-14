import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data: seance } = await supabase
    .from('codex_sessions')
    .select('statut, classe_id, phase_courante_fin_at')
    .eq('id', sessionId)
    .single()

  if (!seance) return NextResponse.json({ error: 'Séance introuvable' }, { status: 404 })

  const { data: moduleData } = await supabase.from('modules').select('id').eq('slug', 'codex').single()
  const { data: assignments } = moduleData
    ? await supabase
        .from('module_assignments')
        .select('eleve_id, profiles!inner(display_name, classe)')
        .eq('module_id', moduleData.id)
    : { data: [] }

  const { data: travaux } = await supabase
    .from('codex_travaux')
    .select('eleve_id, photos_v1, photos_vf, analyse_v1_statut, analyse_vf_statut, statut_validation')
    .eq('session_id', sessionId)

  const travauxMap: Record<string, NonNullable<typeof travaux>[number]> = {}
  for (const t of travaux ?? []) travauxMap[t.eleve_id] = t

  const eleves = (assignments ?? [])
    .map((a) => {
      const p = a.profiles as unknown as { display_name: string; classe: string | null }
      return { eleve_id: a.eleve_id, display_name: p.display_name, classe: p.classe }
    })
    .filter((e) => !seance.classe_id || e.classe === seance.classe_id)
    .map((e) => {
      const t = travauxMap[e.eleve_id]
      return {
        id: e.eleve_id,
        display_name: e.display_name,
        v1_envoyee: (t?.photos_v1?.length ?? 0) > 0,
        vf_envoyee: (t?.photos_vf?.length ?? 0) > 0,
        analyse_v1_statut: t?.analyse_v1_statut ?? 'vide',
        analyse_vf_statut: t?.analyse_vf_statut ?? 'vide',
        statut_validation: t?.statut_validation ?? null,
      }
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name))

  return NextResponse.json({
    statut: seance.statut,
    phaseFinAt: seance.phase_courante_fin_at,
    eleves,
  })
}
