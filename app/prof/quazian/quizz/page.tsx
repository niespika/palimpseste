import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { supprimerQuizz } from './actions'
import { CreerQuizz } from './CreerQuizz'
import Tuile from '@/components/Tuile'
import { formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'

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

export default async function QuizzListePage({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { classe: classeSel } = await searchParams
  const tz = await lireFuseau()

  const [{ data: quizzes }, { data: unites }, { data: classes }] = await Promise.all([
    supabase
      .from('quazian_quizzes')
      .select('id, statut, classe_id, classes(nom), scope_unites, lance_at, ferme_at, nb_questions, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('scriptorium_unites')
      .select('id, label, classe, ordre')
      .eq('type', 'unite')   // exclut les « livres » Aletheia du périmètre de quizz
      .order('ordre', { ascending: true }),
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

  // Labels des unités
  const labelsUnites: Record<string, string> = {}
  for (const u of unites ?? []) labelsUnites[u.id] = u.label

  return (
    <div>
      <div className="mb-6">
        <Link href="/prof/quazian" className="text-sm text-muet hover:text-encre-douce">
          ← Flashcards
        </Link>
        <h3 className="text-lg font-serif text-encre mt-2">Quizz</h3>
      </div>

      <CreerQuizz unites={unites ?? []} classes={classes ?? []} />

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
          const scope = (qz.scope_unites as string[]).map((id) => labelsUnites[id] ?? id)

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
