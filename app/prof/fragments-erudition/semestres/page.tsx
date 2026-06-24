import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Tuile from '@/components/Tuile'

export default async function PageSemestres() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { data: semestres } = await admin
    .from('semesters')
    .select('id, label:name, date_debut:start_date, date_fin:end_date, courant:is_active')
    .order('start_date', { ascending: false })

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
        <h3 className="text-base font-medium text-encre">Synthèses de semestre</h3>
        <p className="text-sm text-muet mt-0.5">
          Bilan de fin de semestre : fragments écrits + oral, avec note suggérée. Les
          semestres se créent et se gèrent depuis la{' '}
          <Link href="/prof/calendrier/config" className="underline hover:text-encre-douce">
            configuration du Calendrier
          </Link>.
        </p>
      </div>

      {(semestres ?? []).length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Aucun semestre. Crée-en un depuis la configuration du Calendrier.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(semestres ?? []).map(s => {
            const stats = statsParSemestre[s.id] ?? { total: 0, publiees: 0 }
            const debut = new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            const fin = new Date(s.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <Tuile
                key={s.id}
                nom={s.courant ? `${s.label} · actif` : s.label}
                sousTitre={`${debut} → ${fin}`}
                href={`/prof/fragments-erudition/semestres/${s.id}`}
                couleur={s.courant ? 'vert' : 'neutre'}
                resume={
                  stats.total > 0
                    ? <span className="text-xs text-muet">{stats.publiees}/{stats.total} synthèse{stats.total > 1 ? 's' : ''} publiée{stats.publiees > 1 ? 's' : ''}</span>
                    : <span className="text-xs text-muet">Aucune synthèse générée</span>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
