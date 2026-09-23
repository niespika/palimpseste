import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { libellesCibles } from '@/utils/quazian-cibles'
import { chargerTableauLive } from '@/utils/quazian-tableau-live-serveur'
import { createAdminClient } from '@/utils/supabase/admin'
import { chargerAntichambre, lireAntichambreAt, lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'
import { lancerQuizz } from './actions'
import { TableauLive } from './TableauLive'
import { AntichambreProf } from './AntichambreProf'
import { BoutonOuvrirAntichambre } from './BoutonOuvrirAntichambre'

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
    .select('id, statut, classe_id, classes(nom), scope_unites, scope_contenus, duree_min, nb_questions, lance_at, ferme_at, moyenne_cohorte, ecart_type_cohorte')
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

  // L'antichambre (22/09) : lue SEULEMENT porte ouverte — porte fermée, la page
  // est celle d'hier, et la colonne peut même ne pas exister encore.
  const admin = createAdminClient()
  const porteAntichambre = quizz.statut === 'brouillon' && await lirePorteAntichambre(admin)
  const antichambreAt = porteAntichambre ? await lireAntichambreAt(admin, quizId) : null
  const salle = antichambreAt
    ? await chargerAntichambre(admin, quizId, quizz.classe_id as string | null)
    : null

  // Élèves de la CLASSE du quiz, leur avancée et leurs notes — même lecteur que
  // la route de sondage (`utils/quazian-tableau-live-serveur.ts`).
  // Un brouillon n'a pas de tableau : pas de lectures pour rien.
  const tableau = quizz.statut === 'brouillon'
    ? null
    : await chargerTableauLive(supabase, quizId, quizz.classe_id as string | null)

  // Périmètre BI-SOURCE (C7·L1) : contenus de bibliothèque d'abord, unités
  // héritées ensuite. Un id que ni l'une ni l'autre table ne connaît retombe sur
  // son uuid, comme avant.
  const scope = [
    ...((quizz.scope_contenus as string[] | null) ?? []),
    ...((quizz.scope_unites as string[] | null) ?? []),
  ]
  const labelsMap = await libellesCibles(supabase, scope)

  return (
    <div>
      <div className="mb-6">
        <Link href={`/prof/quazian/quizz/${quizId}`} className="text-sm text-muet hover:text-encre-douce">
          ← Quizz
        </Link>
        <h3 className="text-lg font-serif text-encre mt-2">
          {classeNom ?? 'Passation'} — {quizz.nb_questions} questions
        </h3>
        <p className="text-sm text-muet">
          {scope.map((id) => labelsMap.get(id) ?? id).join(' · ')}
          {' · '}{quizz.duree_min} min
        </p>
      </div>

      {/* L'antichambre ouverte : qui est là, et le lancement (second temps). */}
      {/* Une lecture ratée se DIT, mais ne retire ni « Lancer » ni « Refermer » :
          le professeur est devant sa classe (revue du 22/09). */}
      {salle && 'error' in salle && <p role="alert" className="text-sm text-retard mb-4">{salle.error}</p>}
      {salle && (
        <AntichambreProf
          quizId={quizId}
          dureeMin={quizz.duree_min}
          salleInit={'error' in salle ? { lignes: [], presents: 0, total: 0 } : salle}
        />
      )}

      {/* Porte ouverte, antichambre pas encore ouverte : le premier temps. */}
      {porteAntichambre && !antichambreAt && (
        <div className="bg-surface border border-bordure rounded-xl p-6 mb-6 text-center">
          <p className="text-encre-douce text-sm mb-1">
            Toutes les questions sont validées.
          </p>
          <p className="text-muet text-sm mb-4">
            Ouvre l’antichambre : les élèves y lisent les consignes et s’essaient sur une question
            qui ne compte pas. Tu lances quand ils sont là — le chrono ne part qu’à ce moment.
          </p>
          <BoutonOuvrirAntichambre quizId={quizId} />
        </div>
      )}

      {/* Lancement en un geste : la porte de l'antichambre est fermée. */}
      {quizz.statut === 'brouillon' && !porteAntichambre && (
        <div className="bg-surface border border-bordure rounded-xl p-6 mb-6 text-center">
          <p className="text-encre-douce text-sm mb-4">
            Toutes les questions sont validées. Le quizz est prêt à être lancé.
          </p>
          <form action={actionLancer}>
            <input type="hidden" name="quizId" value={quizId} />
            <input type="hidden" name="duree_min" value={quizz.duree_min} />
            <button
              type="submit"
              className="px-8 py-3 bg-ok text-surface rounded-xl hover:opacity-90 transition-colors font-medium"
            >
              Lancer le quizz maintenant
            </button>
          </form>
        </div>
      )}

      {tableau && 'error' in tableau && (
        <p role="alert" className="text-sm text-retard mb-4">{tableau.error}</p>
      )}

      {/* Même règle : l'erreur se dit, le chrono et « Fermer le quizz » restent. */}
      {tableau && (quizz.statut === 'lance' || quizz.statut === 'ferme') && (
        <TableauLive
          quizId={quizId}
          statut={quizz.statut}
          fermeAt={quizz.ferme_at}
          eleves={'error' in tableau ? [] : tableau.eleves}
          nbQuestions={'error' in tableau ? quizz.nb_questions : tableau.nbQuestions}
          moyenneCohorte={quizz.moyenne_cohorte}
          ecartTypeCohorte={quizz.ecart_type_cohorte}
        />
      )}
    </div>
  )
}
