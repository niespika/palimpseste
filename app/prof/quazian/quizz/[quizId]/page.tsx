import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { libellesCibles } from '@/utils/quazian-cibles'
import { validerToutesQuestions } from '../actions'
import { QuestionCard } from './QuestionCard'
import { AjouterQuestions } from './AjouterQuestions'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireAntichambreAt, lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'

// « Ajouter des questions » part d'ici : génération contrôlée (génération, relecture
// à l'aveugle, réécriture, relecture), jusqu'à ~1 min au banc du 23/09.
export const maxDuration = 300

async function actionValiderToutes(formData: FormData): Promise<void> {
  'use server'
  await validerToutesQuestions(formData)
}

export default async function QuizzDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>
}) {
  const { quizId } = await params
  const supabase = await createClient()

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('id, statut, classe_id, classes(nom), scope_unites, scope_contenus, duree_min, nb_questions, lance_at, ferme_at, moyenne_cohorte, ecart_type_cohorte')
    .eq('id', quizId)
    .single()

  if (!quizz) notFound()

  const classeNom = (() => {
    const c = Array.isArray(quizz.classes) ? quizz.classes[0] : quizz.classes
    return c ? (c as { nom: string }).nom : null
  })()

  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('id, enonce, options, index_correct, concept_tag, statut_validation')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })

  // Périmètre BI-SOURCE (C7·L1) : contenus de bibliothèque d'abord, unités
  // héritées ensuite. Un id que ni l'une ni l'autre table ne connaît retombe sur
  // son uuid, comme avant.
  const scope = [
    ...((quizz.scope_contenus as string[] | null) ?? []),
    ...((quizz.scope_unites as string[] | null) ?? []),
  ]
  const labelsMap = await libellesCibles(supabase, scope)

  const nbValidees = (questions ?? []).filter((q) => q.statut_validation === 'valide').length
  const total = (questions ?? []).length
  const toutValide = nbValidees === total && total > 0
  // L'antichambre ouverte (22/09) fige le quiz comme un lancement : des élèves
  // attendent devant ces questions. Lue seulement porte ouverte.
  const admin = createAdminClient()
  const enAntichambre = quizz.statut === 'brouillon' && await lirePorteAntichambre(admin)
    && !!(await lireAntichambreAt(admin, quizId))
  const readOnly = quizz.statut !== 'brouillon' || enAntichambre

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/prof/quazian/quizz" className="text-sm text-muet hover:text-encre-douce">
            ← Quizz
          </Link>
          <h3 className="text-lg font-serif text-encre mt-2">
            {classeNom ?? 'Quizz'} — {total} questions
          </h3>
          <p className="text-sm text-muet mt-0.5">
            {scope.map((id) => labelsMap.get(id) ?? id).join(' · ')}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              enAntichambre ? 'bg-attention-teinte text-attention' :
              quizz.statut === 'brouillon' ? 'bg-parchemin-fonce text-muet' :
              quizz.statut === 'lance' ? 'bg-ok-teinte text-ok' :
              'bg-info-teinte text-info'
            }`}>
              {enAntichambre ? 'Antichambre ouverte' : quizz.statut === 'brouillon' ? 'Brouillon' : quizz.statut === 'lance' ? 'En cours' : 'Terminé'}
            </span>
            <span className="text-xs text-muet">{quizz.duree_min} min</span>
            {!readOnly && (
              <span className="text-xs text-muet">{nbValidees}/{total} validées</span>
            )}
          </div>
        </div>

        {/* Actions principales */}
        <div className="flex gap-2 shrink-0 flex-wrap">
          {!readOnly && (
            <form action={actionValiderToutes}>
              <input type="hidden" name="quizId" value={quizId} />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure transition-colors"
              >
                ✓ Tout valider
              </button>
            </form>
          )}
          {toutValide && quizz.statut === 'brouillon' && (
            <Link
              href={`/prof/quazian/quizz/${quizId}/lancer`}
              className="px-4 py-2 text-sm bg-ok text-surface rounded-lg hover:opacity-90 transition-colors"
            >
              {enAntichambre ? 'Voir l’antichambre →' : 'Lancer le quizz →'}
            </Link>
          )}
          {quizz.statut === 'lance' && (
            <Link
              href={`/prof/quazian/quizz/${quizId}/lancer`}
              className="px-4 py-2 text-sm bg-ok text-surface rounded-lg hover:opacity-90 transition-colors"
            >
              Tableau de bord live →
            </Link>
          )}
        </div>
      </div>

      {!toutValide && !readOnly && (
        <div className="bg-attention-teinte border border-attention rounded-xl p-3 mb-6 text-sm text-attention">
          {total === 0
            ? "Ce quiz n'a plus de question — génère-en ci-dessous."
            : `${total - nbValidees} question${total - nbValidees > 1 ? 's' : ''} encore à valider avant de pouvoir lancer le quizz.`}
        </div>
      )}

      <div className="space-y-3">
        {(questions ?? []).map((q, i) => (
          <QuestionCard
            key={q.id}
            question={q}
            numero={i + 1}
            quizId={quizId}
            readOnly={readOnly}
          />
        ))}
      </div>
      {!readOnly && <AjouterQuestions quizId={quizId} />}
    </div>
  )
}
