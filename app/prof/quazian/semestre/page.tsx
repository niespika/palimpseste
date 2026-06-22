import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { calculerNotesSemestre } from './actions'

async function actionCalculer(formData: FormData): Promise<void> {
  'use server'
  await calculerNotesSemestre(formData)
}

export default async function SemestrePage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string }>
}) {
  const supabase = await createClient()
  const { sem } = await searchParams

  // Semestres (global) + semestre sélectionné (défaut : actif, sinon le plus récent).
  const { data: semestresData } = await supabase
    .from('semesters')
    .select('id, name, is_active')
    .order('start_date', { ascending: false })
  const semestres = semestresData ?? []
  const selId =
    sem && semestres.some((s) => s.id === sem)
      ? sem
      : semestres.find((s) => s.is_active)?.id ?? semestres[0]?.id ?? null
  const semSel = semestres.find((s) => s.id === selId) ?? null

  // Classes distinctes depuis les quizz fermés DU SEMESTRE sélectionné
  const { data: quizzes } = selId
    ? await supabase
        .from('quazian_quizzes')
        .select('classe_id')
        .eq('statut', 'ferme')
        .eq('semester_id', selId)
    : { data: [] }

  const classes = [...new Set((quizzes ?? []).map((q) => q.classe_id).filter(Boolean))] as string[]

  // Noms des classes (les classe_id sont des uuid → résoudre pour l'affichage).
  const { data: classesNoms } = await supabase.from('classes').select('id, nom')
  const nomClasse = new Map((classesNoms ?? []).map((c) => [c.id as string, c.nom as string]))
  const libelleClasse = (id: string) => nomClasse.get(id) ?? id

  // Notes du semestre sélectionné
  const { data: notes } = selId
    ? await supabase
        .from('quazian_semester')
        .select('eleve_id, classe_id, z_moyen, note_relative_20, note_absolue_20, note_finale_20')
        .eq('semester_id', selId)
        .order('note_finale_20', { ascending: false })
    : { data: null }

  // Noms des élèves
  const eleveIds = [...new Set((notes ?? []).map((s) => s.eleve_id))]
  const { data: profiles } = eleveIds.length > 0
    ? await supabase.from('profiles').select('id, display_name, classe').in('id', eleveIds)
    : { data: [] }

  const profilesMap: Record<string, { display_name: string; classe: string | null }> = {}
  for (const p of profiles ?? []) profilesMap[p.id] = p

  // Historique des quizz par élève
  const { data: quizzScores } = await supabase
    .from('quazian_quiz_scores')
    .select('eleve_id, quiz_id, note_formative_20, score_moyen, z_quiz')

  const scoresParEleve: Record<string, typeof quizzScores> = {}
  for (const s of quizzScores ?? []) {
    if (!scoresParEleve[s.eleve_id]) scoresParEleve[s.eleve_id] = []
    scoresParEleve[s.eleve_id]!.push(s)
  }

  // Grouper par classe
  const parClasse: Record<string, typeof notes> = {}
  for (const s of notes ?? []) {
    const cls = s.classe_id ?? 'Sans classe'
    if (!parClasse[cls]) parClasse[cls] = []
    parClasse[cls]!.push(s)
  }

  return (
    <div>
      {/* Sélecteur de semestre */}
      {semestres.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-12">
          Aucun semestre. Crée-en un dans la{' '}
          <Link href="/prof/calendrier/config" className="underline">configuration du Calendrier</Link>.
        </p>
      ) : (
        <>
          {semestres.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {semestres.map((s) => (
                <Link
                  key={s.id}
                  href={`/prof/quazian/semestre?sem=${s.id}`}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    s.id === selId
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {s.name}
                  {s.is_active ? ' ·' : ''}
                </Link>
              ))}
            </div>
          )}

          {/* Recalcul */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 mb-8">
            <h3 className="text-sm font-medium text-stone-700 mb-3">
              Calculer / recalculer les notes — {semSel?.name ?? '—'}
            </h3>
            <form action={actionCalculer} className="flex gap-3 items-end flex-wrap">
              <input type="hidden" name="semester_id" value={selId ?? ''} />
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Classe (optionnel)</label>
                <select name="classe" className="px-3 py-2 text-sm border border-stone-300 rounded-lg">
                  <option value="">Toutes les classes</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>{libelleClasse(c)}</option>
                  ))}
                </select>
              </div>
              <button type="submit"
                className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900 transition-colors">
                Calculer les notes de semestre
              </button>
            </form>
          </div>

          {Object.keys(parClasse).length === 0 && (
            <p className="text-stone-400 text-sm text-center py-12">
              Aucune note calculée pour ce semestre. Lance d&apos;abord le calcul ci-dessus.
            </p>
          )}

          {Object.entries(parClasse).map(([classe, lignes]) => (
            <section key={classe} className="mb-10">
              <h3 className="text-sm font-medium text-stone-600 mb-3">{libelleClasse(classe)}</h3>
              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-xs text-stone-400">
                      <th className="text-left px-4 py-3">Élève</th>
                      <th className="text-right px-4 py-3">z moyen</th>
                      <th className="text-right px-4 py-3">Relative /20</th>
                      <th className="text-right px-4 py-3">Absolue /20</th>
                      <th className="text-right px-4 py-3 font-bold text-stone-600">Finale /20</th>
                      <th className="text-right px-4 py-3">Quizz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(lignes ?? []).map((n) => {
                      const profil = profilesMap[n.eleve_id]
                      const scores = scoresParEleve[n.eleve_id] ?? []
                      return (
                        <tr key={n.eleve_id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                          <td className="px-4 py-3 text-stone-800">{profil?.display_name ?? n.eleve_id}</td>
                          <td className="px-4 py-3 text-right font-mono text-stone-500 text-xs">
                            {n.z_moyen?.toFixed(2) ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-stone-600">
                            {n.note_relative_20?.toFixed(1) ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-stone-600">
                            {n.note_absolue_20?.toFixed(1) ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-stone-900">
                            {n.note_finale_20?.toFixed(1) ?? '—'}/20
                          </td>
                          <td className="px-4 py-3 text-right text-stone-400 text-xs">
                            {scores.length > 0 ? (
                              <span title={scores.map((s) => `${s.note_formative_20?.toFixed(1)}/20`).join(' · ')}>
                                {scores.length} quizz
                              </span>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
