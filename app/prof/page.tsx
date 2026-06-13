import { createClient } from '@/utils/supabase/server'

export default async function ProfAccueil() {
  const supabase = await createClient()

  const [{ count: nbEleves }, { data: modules }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'eleve'),
    supabase.from('modules').select('actif'),
  ])

  const nbModulesActifs = modules?.filter(m => m.actif).length ?? 0
  const nbModulesTotal = modules?.length ?? 0

  return (
    <div>
      <h2 className="text-xl font-serif text-stone-900 mb-6">Tableau de bord</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <p className="text-sm text-stone-500 mb-1">Élèves inscrits</p>
          <p className="text-3xl font-serif text-stone-900">{nbEleves ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <p className="text-sm text-stone-500 mb-1">Modules actifs</p>
          <p className="text-3xl font-serif text-stone-900">
            {nbModulesActifs}
            <span className="text-lg text-stone-400 font-sans ml-1">/ {nbModulesTotal}</span>
          </p>
        </div>
      </div>

    </div>
  )
}
