import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { chargerFileRevision, chargerStatsRevision } from './actions'
import { QuazianDashboard } from './QuazianDashboard'

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
      <div className="text-center py-16 text-stone-400 text-sm">
        Ce module n'est pas encore activé.
      </div>
    )
  }

  const { data: assignment } = await supabase
    .from('module_assignments')
    .select('id')
    .eq('eleve_id', user.id)
    .eq('module_id', module.id)
    .single()

  if (!assignment) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">
        Tu n'as pas encore accès à ce module.
      </div>
    )
  }

  const [file, stats] = await Promise.all([
    chargerFileRevision(),
    chargerStatsRevision(),
  ])

  return (
    <div>
      <Link
        href="/eleve"
        className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-flex items-center gap-1"
      >
        ← Retour
      </Link>

      <h2 className="text-xl font-serif text-stone-900 mb-6 mt-2">Flashcards</h2>

      <QuazianDashboard stats={stats} file={file} />
    </div>
  )
}
