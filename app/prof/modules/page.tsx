import { createClient } from '@/utils/supabase/server'
import GestionModule from './GestionModule'
import type { Module } from '@/types'

export default async function PageModules() {
  const supabase = await createClient()

  const [{ data: modules }, { data: classeModules }] = await Promise.all([
    supabase.from('modules').select('*').order('created_at'),
    supabase.from('classe_modules').select('module_id, classes(nom)'),
  ])

  // Classes ayant accès, par module
  const classesParModule: Record<string, string[]> = {}
  for (const cm of classeModules ?? []) {
    const c = Array.isArray(cm.classes) ? cm.classes[0] : cm.classes
    if (!c) continue
    ;(classesParModule[cm.module_id as string] ??= []).push((c as { nom: string }).nom)
  }

  return (
    <div>
      <h2 className="text-xl font-serif text-stone-900 mb-1">Modules</h2>
      <p className="text-stone-500 text-sm mb-6">
        Activez un module et donnez-y accès <strong>par classe</strong> depuis l&apos;onglet Classes.
      </p>

      {!modules || modules.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucun module dans le catalogue.</p>
      ) : (
        <div className="space-y-4">
          {(modules as Module[]).map((module) => (
            <GestionModule
              key={module.id}
              module={module}
              classesAvecAcces={(classesParModule[module.id] ?? []).sort()}
            />
          ))}
        </div>
      )}
    </div>
  )
}
