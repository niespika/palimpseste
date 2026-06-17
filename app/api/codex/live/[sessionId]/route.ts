import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { eleveIdsInscritsClasse, eleveIdsAvecAccesModule } from '@/utils/acces'

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
  // Roster = élèves inscrits dans la classe de la séance (ou tous ceux ayant
  // accès au module si la séance n'est rattachée à aucune classe).
  const eleveIds = seance.classe_id
    ? await eleveIdsInscritsClasse(supabase, seance.classe_id as string)
    : (moduleData ? await eleveIdsAvecAccesModule(supabase, moduleData.id) : [])

  const { data: roster } = eleveIds.length > 0
    ? await supabase.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }

  const { data: travaux } = await supabase
    .from('codex_travaux')
    .select('id, eleve_id, photos_v1, photos_vf, analyse_v1_statut, analyse_vf_statut, statut_validation')
    .eq('session_id', sessionId)

  const travauxMap: Record<string, NonNullable<typeof travaux>[number]> = {}
  for (const t of travaux ?? []) travauxMap[t.eleve_id] = t

  const eleves = (roster ?? [])
    .map((p) => {
      const t = travauxMap[p.id]
      return {
        id: p.id,
        display_name: p.display_name as string,
        travail_id: t?.id ?? null,
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
