import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { eleveIdsAvecAccesModule } from '@/utils/acces'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  const { data: sessions } = await supabase
    .from('quazian_sessions')
    .select('eleve_id, submitted_at, auto_submitted')
    .eq('quiz_id', quizId)

  const { data: scores } = await supabase
    .from('quazian_quiz_scores')
    .select('eleve_id, score_moyen')
    .eq('quiz_id', quizId)

  const { data: moduleData } = await supabase.from('modules').select('id').eq('slug', 'quazian').single()
  const eleveIds = moduleData ? await eleveIdsAvecAccesModule(supabase, moduleData.id) : []
  const { data: rosterProfiles } = eleveIds.length > 0
    ? await supabase.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }

  const sessionsMap: Record<string, { submitted_at: string | null; auto_submitted: boolean }> = {}
  for (const s of sessions ?? []) sessionsMap[s.eleve_id] = s

  const scoresMap: Record<string, number> = {}
  for (const s of scores ?? []) scoresMap[s.eleve_id] = s.score_moyen

  const eleves = (rosterProfiles ?? []).map((p) => {
    const session = sessionsMap[p.id]
    return {
      id: p.id,
      display_name: p.display_name as string,
      soumis: !!session?.submitted_at,
      submitted_at: session?.submitted_at ?? null,
      score_moyen: scoresMap[p.id] ?? null,
      auto: session?.auto_submitted ?? false,
    }
  })

  return NextResponse.json({ eleves })
}
