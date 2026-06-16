import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule, classeIdsActives } from '@/utils/acces'
import { chargerFileRevision, chargerStatsRevision } from './actions'
import { QuazianDashboard } from './QuazianDashboard'

export default async function QuazianElevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Vérifier que le module est actif et assigné
  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'quazian')
    .single()

  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        Ce module n'est pas encore activé.
      </div>
    )
  }

  if (!(await aAccesModule(supabase, user.id, module.id))) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        Tu n'as pas encore accès à ce module.
      </div>
    )
  }

  // Quizz actif ou récent (lancé ou fermé) — uniquement pour une classe où
  // l'élève est inscrit (corrige le bug 0.3 : scoping par classe).
  const classeIds = await classeIdsActives(supabase, user.id)
  const { data: quizzActif } = classeIds.length > 0
    ? await supabase
        .from('quazian_quizzes')
        .select('id, statut, ferme_at, nb_questions')
        .in('classe_id', classeIds)
        .in('statut', ['lance', 'ferme'])
        .order('lance_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  // Vérifier si l'élève a déjà soumis ce quizz
  let quizzInfo: { id: string; statut: string; soumis: boolean } | null = null
  if (quizzActif) {
    const { data: session } = await supabase
      .from('quazian_sessions')
      .select('submitted_at')
      .eq('quiz_id', quizzActif.id)
      .eq('eleve_id', user.id)
      .maybeSingle()

    quizzInfo = {
      id: quizzActif.id,
      statut: quizzActif.statut,
      soumis: !!session?.submitted_at,
    }
  }

  const [file, stats] = await Promise.all([
    chargerFileRevision(),
    chargerStatsRevision(),
  ])

  return (
    <div>
      <Link
        href="/eleve"
        className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-flex items-center gap-1"
      >
        ← Retour
      </Link>

      {/* Bannière quizz actif */}
      {quizzInfo && quizzInfo.statut === 'lance' && !quizzInfo.soumis && (
        <Link
          href={`/eleve/modules/quazian/quizz/${quizzInfo.id}`}
          className="block bg-green-50 border border-green-300 rounded-xl p-4 mb-6 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-green-800 text-sm">Quizz en cours !</p>
              <p className="text-xs text-green-600">Appuie pour participer →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Résultats disponibles */}
      {quizzInfo && quizzInfo.statut === 'ferme' && quizzInfo.soumis && (
        <Link
          href={`/eleve/modules/quazian/quizz/${quizzInfo.id}`}
          className="block bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 hover:bg-blue-100 transition-colors"
        >
          <p className="text-sm font-medium text-blue-800">Résultats disponibles — voir le corrigé →</p>
        </Link>
      )}

      <h2 className="text-xl font-serif text-stone-900 mb-6 mt-2">Flashcards</h2>

      <QuazianDashboard stats={stats} file={file} />
    </div>
  )
}
