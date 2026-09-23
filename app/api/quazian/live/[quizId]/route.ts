import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { chargerTableauLive } from '@/utils/quazian-tableau-live-serveur'

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

  const { data: quizz, error: eQuizz } = await supabase
    .from('quazian_quizzes')
    .select('classe_id')
    .eq('id', quizId)
    .maybeSingle()
  if (eQuizz) return NextResponse.json({ error: eQuizz.message }, { status: 500 })
  if (!quizz) return NextResponse.json({ error: 'Quizz introuvable' }, { status: 404 })

  const tableau = await chargerTableauLive(supabase, quizId, quizz.classe_id as string | null)
  if ('error' in tableau) return NextResponse.json({ error: tableau.error }, { status: 500 })
  return NextResponse.json(tableau)
}
