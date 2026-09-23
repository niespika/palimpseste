import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { chargerAntichambre, lireAntichambreAt, lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'

// Le sondage du professeur pendant l'antichambre (retours de classe du 22/09) :
// qui est là, et le quiz est-il toujours en attente ?
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

  const { data: quizz, error } = await supabase
    .from('quazian_quizzes').select('statut, classe_id').eq('id', quizId).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!quizz) return NextResponse.json({ error: 'Quizz introuvable' }, { status: 404 })

  // La table de présence est au service-role : le rôle vient d'être vérifié.
  const admin = createAdminClient()
  const ouverte = (await lirePorteAntichambre(admin)) && !!(await lireAntichambreAt(admin, quizId))
  if (quizz.statut !== 'brouillon' || !ouverte) {
    return NextResponse.json({ statut: quizz.statut, ouverte: false })
  }
  const salle = await chargerAntichambre(admin, quizId, quizz.classe_id as string | null, Date.now())
  if ('error' in salle) return NextResponse.json({ error: salle.error }, { status: 500 })
  return NextResponse.json({ statut: quizz.statut, ouverte: true, ...salle })
}
