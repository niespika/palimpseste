import { createClient } from '@/utils/supabase/server'
import GestionModule from './GestionModule'
import type { Module, Profile } from '@/types'

export default async function PageModules() {
  const supabase = await createClient()

  const [{ data: modules }, { data: eleves }, { data: assignments }] = await Promise.all([
    supabase.from('modules').select('*').order('created_at'),
    supabase.from('profiles').select('id, role, display_name, classe, created_at').eq('role', 'eleve').order('display_name'),
    supabase.from('module_assignments').select('module_id, eleve_id'),
  ])

  return (
    <div>
      <h2 className="text-xl font-serif text-stone-900 mb-6">Modules</h2>

      {!modules || modules.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucun module dans le catalogue.</p>
      ) : (
        <div className="space-y-4">
          {(modules as Module[]).map(module => {
            const elevesAssignes = (assignments ?? [])
              .filter(a => a.module_id === module.id)
              .map(a => a.eleve_id)

            return (
              <GestionModule
                key={module.id}
                module={module}
                eleves={(eleves ?? []) as Profile[]}
                elevesAssignes={elevesAssignes}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
