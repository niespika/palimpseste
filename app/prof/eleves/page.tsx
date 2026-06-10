import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import FormulaireAjoutEleve from './FormulaireAjoutEleve'
import LigneEleve from './LigneEleve'
import type { EleveAvecEmail } from '@/types'

export default async function PageEleves() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Récupérer tous les profils élèves avec leurs modules
  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      id, role, display_name, classe, created_at,
      modules_assignes:module_assignments(
        module_id,
        modules(nom)
      )
    `)
    .eq('role', 'eleve')
    .order('display_name')

  // Récupérer les emails via le client admin
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  const eleves: EleveAvecEmail[] = (profiles ?? []).map(profile => ({
    ...profile,
    email: authUsers.find(u => u.id === profile.id)?.email ?? '—',
    modules_assignes: (profile.modules_assignes ?? []) as EleveAvecEmail['modules_assignes'],
  }))

  return (
    <div>
      <h2 className="text-xl font-serif text-stone-900 mb-6">Élèves</h2>

      <FormulaireAjoutEleve />

      {eleves.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
          Aucun élève pour l'instant. Commence par en ajouter un.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Nom affiché</th>
                  <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Classe</th>
                  <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Courriel</th>
                  <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Modules</th>
                  <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {eleves.map(eleve => (
                  <LigneEleve key={eleve.id} eleve={eleve} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
