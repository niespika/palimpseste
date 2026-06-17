import { createClient } from '@/utils/supabase/server'
import Tuile from '@/components/Tuile'
import DetailModule from './DetailModule'
import type { Module } from '@/types'

export default async function PageModules({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  const supabase = await createClient()
  const { module: moduleSel } = await searchParams

  const [{ data: modules }, { data: classeModules }, { data: classes }] = await Promise.all([
    supabase.from('modules').select('*').order('created_at'),
    supabase.from('classe_modules').select('module_id, classe_id'),
    supabase.from('classes').select('id, nom').order('nom'),
  ])

  const toutesClasses = (classes ?? []) as { id: string; nom: string }[]
  const nomClasse = new Map(toutesClasses.map((c) => [c.id, c.nom]))

  // Classes ayant accès, par module (ids)
  const accesParModule = new Map<string, string[]>()
  for (const cm of classeModules ?? []) {
    const arr = accesParModule.get(cm.module_id as string) ?? []
    arr.push(cm.classe_id as string)
    accesParModule.set(cm.module_id as string, arr)
  }

  const moduleChoisi = (modules as Module[] | null)?.find((m) => m.id === moduleSel) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif text-stone-900 mb-1">Modules</h2>
        <p className="text-stone-500 text-sm">
          Activez un module et accordez-y l&apos;accès <strong>par classe</strong>. Un élève voit un module
          s&apos;il est <strong>actif</strong> et qu&apos;une de ses classes y a accès (union pour les bi-classes).
        </p>
      </div>

      {!modules || modules.length === 0 ? (
        <p className="text-stone-500 text-sm">Aucun module dans le catalogue.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(modules as Module[]).map((m) => {
            const nbClasses = (accesParModule.get(m.id) ?? []).length
            return (
              <Tuile
                key={m.id}
                nom={m.nom}
                sousTitre={m.description ?? undefined}
                couleur={m.actif ? 'vert' : 'neutre'}
                href={`/prof/modules?module=${m.id}`}
                selectionnee={moduleSel === m.id}
                resume={
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={`px-1.5 py-0.5 rounded-full ${m.actif ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'}`}>
                      {m.actif ? 'Actif' : 'Fermé'}
                    </span>
                    <span className="text-stone-500">{nbClasses} classe{nbClasses > 1 ? 's' : ''}</span>
                  </div>
                }
              />
            )
          })}
        </div>
      )}

      {moduleChoisi && (
        <DetailModule
          module={{ id: moduleChoisi.id, nom: moduleChoisi.nom, description: moduleChoisi.description, actif: moduleChoisi.actif }}
          classesAvecAcces={(accesParModule.get(moduleChoisi.id) ?? [])
            .map((id) => ({ id, nom: nomClasse.get(id) ?? '?' }))
            .sort((a, b) => a.nom.localeCompare(b.nom))}
          classesDisponibles={toutesClasses.filter((c) => !(accesParModule.get(moduleChoisi.id) ?? []).includes(c.id))}
        />
      )}
    </div>
  )
}
