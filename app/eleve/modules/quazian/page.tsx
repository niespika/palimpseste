import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule, classeIdsActives } from '@/utils/acces'
import { chargerFileRevision, chargerStatsRevision, chargerToutesLesCartes } from './actions'
import { QuazianDashboard } from './QuazianDashboard'
import Tuile from '@/components/Tuile'

export default async function QuazianElevePage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const { onglet = 'flashcards' } = await searchParams
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
  const quizList = (quizzes ?? []) as { id: string; statut: string; lance_at: string | null; nb_questions: number }[]

  // État de soumission de l'élève par quizz
  const quizIds = quizList.map(q => q.id)
  const { data: sessions } = quizIds.length > 0
    ? await supabase.from('quazian_sessions').select('quiz_id, submitted_at').eq('eleve_id', user.id).in('quiz_id', quizIds)
    : { data: [] }
  const soumisMap = new Map<string, boolean>()
  for (const s of sessions ?? []) soumisMap.set(s.quiz_id as string, !!s.submitted_at)

  // Quizz en cours non encore soumis → bannière d'appel (à faire)
  const quizzActif = quizList.find(q => q.statut === 'lance' && !soumisMap.get(q.id))

  return (
    <div>
      <Link
        href="/eleve"
        className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-flex items-center gap-1"
      >
        ← Retour
      </Link>

      {/* Bannière quizz actif (à faire) — visible quel que soit l'onglet */}
      {quizzActif && (
        <Link
          href={`/eleve/modules/quazian/quizz/${quizzActif.id}`}
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

      <h2 className="text-xl font-serif text-stone-900 mb-4 mt-2">Quazian</h2>

      {/* Onglets Flashcards / Quizz */}
      <nav className="flex gap-1 mb-6 border-b border-stone-200">
        {[
          { key: 'flashcards', label: 'Flashcards' },
          { key: 'quizz', label: 'Quizz' },
        ].map(({ key, label }) => (
          <Link
            key={key}
            href={`/eleve/modules/quazian?onglet=${key}`}
            className={`px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              onglet === key
                ? 'border-stone-800 text-stone-900 font-medium'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {onglet === 'quizz' ? (
        <OngletQuizz quizList={quizList} soumisMap={soumisMap} />
      ) : (
        <OngletFlashcards />
      )}
    </div>
  )
}

// ── Onglet Flashcards : révision FSRS + consultation (inchangé) ──────────────
async function OngletFlashcards() {
  const [file, stats, toutesCartes] = await Promise.all([
    chargerFileRevision(),
    chargerStatsRevision(),
    chargerToutesLesCartes(),
  ])
  return <QuazianDashboard stats={stats} file={file} toutesCartes={toutesCartes} />
}

// ── Onglet Quizz : une tuile par quiz (revoir quiz + retour) ─────────────────
function OngletQuizz({
  quizList, soumisMap,
}: {
  quizList: { id: string; statut: string; lance_at: string | null; nb_questions: number }[]
  soumisMap: Map<string, boolean>
}) {
  if (quizList.length === 0) {
    return (
      <p className="text-center py-12 text-stone-400 text-sm">
        Aucun quizz pour l&apos;instant. Ton professeur n&apos;en a pas encore lancé.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {quizList.map(q => {
        const soumis = soumisMap.get(q.id)
        const date = q.lance_at ? new Date(q.lance_at).toLocaleDateString('fr-FR') : ''
        let etat: { texte: string; classe: string }
        let couleur: 'vert' | 'neutre'
        if (q.statut === 'lance' && !soumis) {
          etat = { texte: 'En cours — participer', classe: 'text-green-700' }
          couleur = 'vert'
        } else if (q.statut === 'lance' && soumis) {
          etat = { texte: 'Soumis — en attente du corrigé', classe: 'text-stone-400' }
          couleur = 'neutre'
        } else if (q.statut === 'ferme' && soumis) {
          etat = { texte: 'Revoir le quiz + le retour →', classe: 'text-blue-600' }
          couleur = 'neutre'
        } else {
          etat = { texte: 'Terminé (non passé)', classe: 'text-stone-400' }
          couleur = 'neutre'
        }
        return (
          <Tuile
            key={q.id}
            nom={date ? `Quizz du ${date}` : 'Quizz'}
            sousTitre={`${q.nb_questions} question${q.nb_questions > 1 ? 's' : ''}`}
            href={`/eleve/modules/quazian/quizz/${q.id}`}
            couleur={couleur}
            resume={<span className={`text-xs ${etat.classe}`}>{etat.texte}</span>}
          />
        )
      })}
    </div>
  )
}
