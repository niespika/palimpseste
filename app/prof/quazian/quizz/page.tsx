import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { supprimerQuizz } from './actions'
import { CreerQuizz } from './CreerQuizz'
import { chargerContexteQuazianPlan } from './plan-quazian'
import { chargerCiblesQuazian, libellesCibles } from '@/utils/quazian-cibles'
import Tuile from '@/components/Tuile'
import { formatInstant, formatJour } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'

// (perf) Le contexte plan (gate ON) résout la frise d'enseignement par classe. Inerte gate OFF.
export const maxDuration = 60

// lance_at / ferme_at = instants (timestamptz) → affichés dans le fuseau choisi.
const DATE_COURTE: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

async function actionSupprimer(formData: FormData): Promise<void> {
  'use server'
  await supprimerQuizz(formData)
}

const STATUT_LABELS: Record<string, { label: string; couleur: string }> = {
  brouillon: { label: 'Brouillon', couleur: 'bg-parchemin-fonce text-muet' },
  lance: { label: 'En cours', couleur: 'bg-ok-teinte text-ok' },
  ferme: { label: 'Terminé', couleur: 'bg-info-teinte text-info' },
}

export default async function QuizzListePage({ searchParams }: { searchParams: Promise<{ classe?: string; exercice?: string }> }) {
  const supabase = await createClient()
  const { classe: classeSel, exercice } = await searchParams
  const tz = await lireFuseau()
  // Contexte plan d'évaluation (lot 4, gate) : encart « à concevoir » + deep-link.
  const ctxPlan = await chargerContexteQuazianPlan(exercice ?? null)

  // C7·L1 — le périmètre d'un quizz se choisit parmi les CONTENUS du Scriptorium
  // (Textes, Cours) ; les livres restent hors de portée (anti-spoiler). Avant ce
  // lot, cette requête demandait `type='unite'` : zéro ligne, donc un formulaire
  // sans rien à cocher (§4.1 du RAPPORT_Diagnostic_C7_quazian.md).
  const [{ data: quizzes }, cibles, { data: classes }] = await Promise.all([
    supabase
      .from('quazian_quizzes')
      .select('id, statut, classe_id, classes(nom), scope_unites, scope_contenus, lance_at, ferme_at, nb_questions, created_at')
      .order('created_at', { ascending: false }),
    chargerCiblesQuazian(supabase),
    supabase.from('classes').select('id, nom').order('nom'),
  ])

  // Compter les questions par quizz
  const { data: questions } = await supabase
    .from('quazian_questions')
    .select('quiz_id, statut_validation')

  const qMap: Record<string, { total: number; validees: number }> = {}
  for (const q of questions ?? []) {
    if (!qMap[q.quiz_id]) qMap[q.quiz_id] = { total: 0, validees: 0 }
    qMap[q.quiz_id].total++
    if (q.statut_validation === 'valide') qMap[q.quiz_id].validees++
  }

  // Libellés du périmètre — bi-source : les quiz d'aujourd'hui portent des
  // contenus, les quiz hérités des unités. Un id inconnu retombe sur son uuid.
  const scopeDuQuiz = (qz: { scope_unites: unknown; scope_contenus: unknown }) =>
    [...((qz.scope_contenus as string[] | null) ?? []), ...((qz.scope_unites as string[] | null) ?? [])]
  const labelsCibles = await libellesCibles(supabase, (quizzes ?? []).flatMap(scopeDuQuiz))

  return (
    <div>
      <div className="mb-6">
        <Link href="/prof/quazian" className="text-sm text-muet hover:text-encre-douce">
          ← Flashcards
        </Link>
        {/* C7·L2 — « Semestre » n'est plus un onglet (R8 : trois au plus) : les
            notes de semestre se calculent depuis les quiz fermés, elles entrent
            donc ici. */}
        <div className="flex items-baseline justify-between gap-3 mt-2">
          <h3 className="text-lg font-serif text-encre">Quizz</h3>
          <Link href="/prof/quazian/semestre" className="text-sm text-pigment hover:underline">
            Notes de semestre →
          </Link>
        </div>
      </div>

      <CreerQuizz cibles={cibles} classes={classes ?? []} contexte={ctxPlan.contexte} semainesParClasse={ctxPlan.semainesParClasse} />

      {/* Encart « À concevoir » : quiz planifiés (plans validés) pas encore conçus.
          Gate OFF → ctxPlan.aConcevoir vide → rien ne s'affiche (page inchangée). */}
      {ctxPlan.aConcevoir.length > 0 && (
        <div className="mt-6 bg-surface border border-bordure rounded-xl p-4">
          <h4 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">
            À concevoir · {ctxPlan.aConcevoir.length} quiz planifié{ctxPlan.aConcevoir.length > 1 ? 's' : ''}
          </h4>
          <div className="space-y-2">
            {ctxPlan.aConcevoir.map((q) => (
              <Link
                key={q.exerciceId}
                href={`/prof/quazian/quizz?exercice=${q.exerciceId}`}
                className="flex items-center gap-3 rounded-lg border border-bordure px-3 py-2 hover:shadow-sm transition-shadow"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${q.enRetard ? 'bg-retard' : 'bg-pigment'} flex-shrink-0`} aria-hidden />
                <span className="font-corps text-sm text-encre flex-1">
                  Quiz — {q.classeNom}
                </span>
                {q.enRetard && (
                  <span className="font-ui text-xs text-retard bg-retard-teinte px-2 py-0.5 rounded-full flex-shrink-0">en retard</span>
                )}
                <span className="font-ui text-xs text-muet flex-shrink-0">{formatJour(q.echeance, { day: 'numeric', month: 'short' })}</span>
                <span className="font-ui text-xs text-pigment flex-shrink-0">Concevoir →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tuiles de classe : nombre de quizz lancés, clic → filtre la liste */}
      {(classes ?? []).length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(classes ?? []).map((c) => {
            const faits = (quizzes ?? []).filter((q) => q.classe_id === c.id && q.statut !== 'brouillon').length
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={`${faits} quizz fait${faits > 1 ? 's' : ''}`}
                href={classeSel === c.id ? '/prof/quazian/quizz' : `/prof/quazian/quizz?classe=${c.id}`}
                selectionnee={classeSel === c.id}
                couleur={faits > 0 ? 'vert' : 'neutre'}
              />
            )
          })}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {classeSel && (
          <p className="text-xs text-muet">
            Filtré sur {(classes ?? []).find((c) => c.id === classeSel)?.nom ?? 'une classe'} ·{' '}
            <Link href="/prof/quazian/quizz" className="underline">tout afficher</Link>
          </p>
        )}
        {(quizzes ?? []).filter((q) => !classeSel || q.classe_id === classeSel).length === 0 && (
          <p className="text-muet text-sm text-center py-8">Aucun quizz{classeSel ? ' pour cette classe' : ''}.</p>
        )}
        {(quizzes ?? []).filter((q) => !classeSel || q.classe_id === classeSel).map((qz) => {
          const stats = qMap[qz.id] ?? { total: 0, validees: 0 }
          const statut = STATUT_LABELS[qz.statut] ?? STATUT_LABELS.brouillon
          const scope = scopeDuQuiz(qz).map((id) => labelsCibles.get(id) ?? id)

          return (
            <div key={qz.id} className="bg-surface border border-bordure rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statut.couleur}`}>
                    {statut.label}
                  </span>
                  {(() => {
                    const c = Array.isArray(qz.classes) ? qz.classes[0] : qz.classes
                    return c ? <span className="text-sm text-encre-douce">{(c as { nom: string }).nom}</span> : null
                  })()}
                  <span className="text-xs text-muet">{stats.total} questions</span>
                  {qz.statut === 'brouillon' && stats.total > 0 && (
                    <span className="text-xs text-attention">
                      {stats.validees}/{stats.total} validées
                    </span>
                  )}
                </div>
                <p className="text-xs text-muet mt-1 truncate">
                  {scope.join(' · ')}
                </p>
                {qz.lance_at && (
                  <p className="text-xs text-muet">
                    Lancé le {formatInstant(qz.lance_at as string, tz, DATE_COURTE)}
                    {qz.ferme_at && ` · Fermé le ${formatInstant(qz.ferme_at as string, tz, DATE_COURTE)}`}
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/prof/quazian/quizz/${qz.id}`}
                  className="px-3 py-1 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 transition-colors"
                >
                  {qz.statut === 'brouillon' ? 'Valider →' : 'Voir →'}
                </Link>
                {qz.statut === 'brouillon' && (
                  <form action={actionSupprimer}>
                    <input type="hidden" name="id" value={qz.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs text-retard hover:opacity-80 hover:bg-retard-teinte rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </form>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
