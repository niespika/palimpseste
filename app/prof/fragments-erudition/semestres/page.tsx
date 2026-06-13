import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import FormulaireNouveauSemestre from './FormulaireNouveauSemestre'

export default async function PageSemestres() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { data: semestres } = await admin
    .from('fragments_semestres')
    .select('id, label, date_debut, date_fin, created_at')
    .order('date_debut', { ascending: false })

  // Compter les synthèses par semestre
  const semestreIds = (semestres ?? []).map(s => s.id)
  const { data: syntheses } = semestreIds.length > 0
    ? await admin
        .from('fragments_syntheses')
        .select('semestre_id, statut')
        .in('semestre_id', semestreIds)
    : { data: [] }

  const statsParSemestre: Record<string, { total: number; publiees: number }> = {}
  for (const s of syntheses ?? []) {
    if (!statsParSemestre[s.semestre_id]) statsParSemestre[s.semestre_id] = { total: 0, publiees: 0 }
    statsParSemestre[s.semestre_id].total++
    if (s.statut === 'publiee') statsParSemestre[s.semestre_id].publiees++
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-stone-900">Synthèses de semestre</h3>
        <p className="text-sm text-stone-500 mt-0.5">Bilan de fin de semestre : fragments écrits + oral, avec note suggérée.</p>
      </div>

      <FormulaireNouveauSemestre />

      {(semestres ?? []).length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
          Aucun semestre créé.
        </div>
      ) : (
        <div className="space-y-2">
          {(semestres ?? []).map(s => {
            const stats = statsParSemestre[s.id] ?? { total: 0, publiees: 0 }
            return (
              <Link
                key={s.id}
                href={`/prof/fragments-erudition/semestres/${s.id}`}
                className="block bg-white border border-stone-200 rounded-xl px-5 py-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-900">{s.label}</p>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      {' → '}
                      {new Date(s.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {stats.total > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-stone-400">{stats.publiees}/{stats.total} publiées</p>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
