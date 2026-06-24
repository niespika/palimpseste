import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule, classeIdsActives } from '@/utils/acces'
import { chargerFileRevision, chargerStatsRevision, chargerToutesLesCartes } from './actions'
import { QuazianDashboard } from './QuazianDashboard'
import Tuile from '@/components/Tuile'

type QuizListItem = { id: string; statut: string; lance_at: string | null; nb_questions: number }

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
      <div className="text-center py-16 text-muet text-sm">
        Ce module n'est pas encore activé.
      </div>
    )
  }

  if (!(await aAccesModule(supabase, user.id, module.id))) {
    return (
      <div className="text-center py-16 text-muet text-sm">
        Tu n'as pas encore accès à ce module.
      </div>
    )
  }

  // Quizz des classes de l'élève (corrige le bug 0.3 : scoping par classe).
  const classeIds = await classeIdsActives(supabase, user.id)
  const { data: quizzes } = classeIds.length > 0
    ? await supabase
        .from('quazian_quizzes')
        .select('id, statut, lance_at, ferme_at, nb_questions')
        .in('classe_id', classeIds)
        .in('statut', ['lance', 'ferme'])
        .order('lance_at', { ascending: false })
    : { data: [] }
  const quizList = (quizzes ?? []) as QuizListItem[]

  // État de soumission de l'élève par quizz
  const quizIds = quizList.map(q => q.id)
  const { data: sessions } = quizIds.length > 0
    ? await supabase.from('quazian_sessions').select('quiz_id, submitted_at').eq('eleve_id', user.id).in('quiz_id', quizIds)
    : { data: [] }
  const soumisMap = new Map<string, boolean>()
  for (const s of sessions ?? []) soumisMap.set(s.quiz_id as string, !!s.submitted_at)

  // Notes des quizz corrigés (affichées dans la liste) — une seule requête.
  const fermeIds = quizList.filter(q => q.statut === 'ferme').map(q => q.id)
  const { data: scores } = fermeIds.length > 0
    ? await supabase.from('quazian_quiz_scores').select('quiz_id, score_moyen').eq('eleve_id', user.id).in('quiz_id', fermeIds)
    : { data: [] }
  const scoreMap = new Map<string, number>()
  for (const s of scores ?? []) scoreMap.set(s.quiz_id as string, s.score_moyen as number)

  // Quizz en cours non encore soumis → bannière d'appel (à faire)
  const quizzActif = quizList.find(q => q.statut === 'lance' && !soumisMap.get(q.id))

  // Données de révision (FSRS + consultation)
  const [file, stats, toutesCartes] = await Promise.all([
    chargerFileRevision(),
    chargerStatsRevision(),
    chargerToutesLesCartes(),
  ])

  return (
    <div>
      <Link
        href="/eleve"
        className="text-sm text-encre-douce hover:text-encre mb-6 inline-flex items-center gap-1"
      >
        ← Retour
      </Link>

      {/* Bannière quizz actif (à faire) */}
      {quizzActif && (
        <Link
          href={`/eleve/modules/quazian/quizz/${quizzActif.id}`}
          className="block bg-ok-teinte border border-ok rounded-xl p-4 mb-6 hover:opacity-90 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-ok animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-ok text-sm">Quizz en cours !</p>
              <p className="text-xs text-ok">Appuie pour participer →</p>
            </div>
          </div>
        </Link>
      )}

      <h2 className="text-xl font-serif text-pigment mb-6 mt-2">Quazian</h2>

      {/* Deux zones nettes : Réviser (haut) puis Quizz (bas). */}
      <QuazianDashboard
        stats={stats}
        file={file}
        toutesCartes={toutesCartes}
        quizz={<QuizzSection quizList={quizList} soumisMap={soumisMap} scoreMap={scoreMap} />}
      />
    </div>
  )
}

// ── Section QUIZZ : une tuile par quiz, statut charté (+ note /10 si corrigé) ──
function QuizzSection({
  quizList, soumisMap, scoreMap,
}: {
  quizList: QuizListItem[]
  soumisMap: Map<string, boolean>
  scoreMap: Map<string, number>
}) {
  if (quizList.length === 0) {
    return (
      <p className="text-muet text-sm">
        Aucun quizz pour l&apos;instant. Ton professeur n&apos;en a pas encore lancé.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {quizList.map(q => {
        const soumis = soumisMap.get(q.id)
        const date = q.lance_at ? new Date(q.lance_at).toLocaleDateString('fr-FR') : ''
        let resume: React.ReactNode
        if (q.statut === 'lance' && !soumis) {
          resume = <span className="text-xs px-2 py-0.5 rounded-full bg-pigment-teinte text-pigment">ouvert — participer →</span>
        } else if (q.statut === 'lance' && soumis) {
          resume = <span className="text-xs text-muet">soumis — en attente du corrigé</span>
        } else if (q.statut === 'ferme' && soumis) {
          const score = scoreMap.get(q.id)
          resume = (
            <span className="inline-flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-parchemin-fonce text-muet">corrigé</span>
              {score != null && <span className="font-medium text-encre">{score.toFixed(1)}/10</span>}
              <span className="text-info">revoir →</span>
            </span>
          )
        } else {
          resume = <span className="text-xs text-muet">terminé (non passé)</span>
        }
        return (
          <Tuile
            key={q.id}
            nom={date ? `Quizz du ${date}` : 'Quizz'}
            sousTitre={`${q.nb_questions} question${q.nb_questions > 1 ? 's' : ''}`}
            href={`/eleve/modules/quazian/quizz/${q.id}`}
            couleur="neutre"
            resume={resume}
          />
        )
      })}
    </div>
  )
}
