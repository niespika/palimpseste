import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { eleveIdsAvecAccesModule } from '@/utils/acces'
import { lancerQuizz } from './actions'
import { TableauLive } from './TableauLive'

async function actionLancer(formData: FormData): Promise<void> {
  'use server'
  const res = await lancerQuizz(formData)
  if (res.success) {
    // revalidatePath se fait dans lancerQuizz
  }
}

export default async function LancerPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('id, statut, classe_id, classes(nom), scope_unites, duree_min, nb_questions, lance_at, ferme_at, moyenne_cohorte, ecart_type_cohorte')
    .eq('id', quizId)
    .single()

  if (!quizz) notFound()

  const classeNom = (() => {
    const c = Array.isArray(quizz.classes) ? quizz.classes[0] : quizz.classes
    return c ? (c as { nom: string }).nom : null
  })()

  // Vérifier que toutes les questions sont validées (pour un brouillon)
  if (quizz.statut === 'brouillon') {
    const { count } = await supabase
      .from('quazian_questions')
      .select('id', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('statut_validation', 'suggere')

    if ((count ?? 0) > 0) {
      redirect(`/prof/quazian/quizz/${quizId}`)
    }
  }

  // Récupérer les sessions et scores
  const { data: sessions } = await supabase
    .from('quazian_sessions')
    .select('id, eleve_id, submitted_at, auto_submitted')
    .eq('quiz_id', quizId)

  const { data: scores } = await supabase
    .from('quazian_quiz_scores')
    .select('eleve_id, score_moyen')
    .eq('quiz_id', quizId)

  const scoresMap: Record<string, number> = {}
  for (const s of scores ?? []) scoresMap[s.eleve_id] = s.score_moyen

  // Récupérer les élèves assignés au module Quazian
  const { data: moduleData } = await supabase
    .from('modules')
    .select('id')
    .eq('slug', 'quazian')
    .single()

  const eleveIds = moduleData ? await eleveIdsAvecAccesModule(supabase, moduleData.id) : []
  const { data: rosterProfiles } = eleveIds.length > 0
    ? await supabase.from('profiles').select('id, display_name').in('id', eleveIds)
    : { data: [] }

  const sessionsMap: Record<string, typeof sessions extends (infer T)[] | null ? T : never> = {}
  for (const s of sessions ?? []) sessionsMap[s.eleve_id] = s

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
  }).sort((a, b) => a.display_name.localeCompare(b.display_name))

  const { data: unitesLabels } = await supabase
    .from('scriptorium_unites')
    .select('id, label')
    .in('id', quizz.scope_unites as string[])

  const labelsMap: Record<string, string> = {}
  for (const u of unitesLabels ?? []) labelsMap[u.id] = u.label

  return (
    <div>
      <div className="mb-6">
        <Link href={`/prof/quazian/quizz/${quizId}`} className="text-sm text-stone-500 hover:text-stone-700">
          ← Quizz
        </Link>
        <h3 className="text-lg font-serif text-stone-900 mt-2">
          {classeNom ?? 'Passation'} — {quizz.nb_questions} questions
        </h3>
        <p className="text-sm text-stone-400">
          {(quizz.scope_unites as string[]).map((id) => labelsMap[id] ?? id).join(' · ')}
          {' · '}{quizz.duree_min} min
        </p>
      </div>

      {/* Lancement si encore brouillon */}
      {quizz.statut === 'brouillon' && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-stone-600 text-sm mb-4">
            Toutes les questions sont validées. Le quizz est prêt à être lancé.
          </p>
          <form action={actionLancer}>
            <input type="hidden" name="quizId" value={quizId} />
            <input type="hidden" name="duree_min" value={quizz.duree_min} />
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Lancer le quizz maintenant
            </button>
          </form>
        </div>
      )}

      {(quizz.statut === 'lance' || quizz.statut === 'ferme') && (
        <TableauLive
          quizId={quizId}
          statut={quizz.statut}
          fermeAt={quizz.ferme_at}
          eleves={eleves}
          moyenneCohorte={quizz.moyenne_cohorte}
          ecartTypeCohorte={quizz.ecart_type_cohorte}
        />
      )}
    </div>
  )
}
