import { createClient } from '@/utils/supabase/server'
import LigneTheme from './LigneTheme'
import BoutonActiverClasse from './BoutonActiverClasse'
import type { Profile } from '@/types'
import type { FragmentTheme } from '@/types/fragments'

export default async function PageThemes() {
  const supabase = await createClient()

  // Élèves qui ont accès au module fragments-erudition
  const { data: moduleData } = await supabase
    .from('modules')
    .select('id')
    .eq('slug', 'fragments-erudition')
    .single()

  const { data: assignments } = moduleData
    ? await supabase
        .from('module_assignments')
        .select('eleve_id')
        .eq('module_id', moduleData.id)
    : { data: [] }

  const eleveIds = (assignments ?? []).map(a => a.eleve_id)

  const { data: eleves } = eleveIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, role, display_name, classe, created_at')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  const { data: themes } = await supabase
    .from('fragments_themes')
    .select('*')
    .in('eleve_id', eleveIds.length > 0 ? eleveIds : ['none'])

  const themeParEleve = Object.fromEntries(
    (themes ?? []).map(t => [t.eleve_id, t])
  )

  // Classes disponibles pour activation en lot
  const classes = [...new Set((eleves ?? []).map(e => (e as Profile).classe).filter(Boolean) as string[])].sort()

  return (
    <div className="space-y-4">
      {classes.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Activer l'essai par classe</span>
          {classes.map(c => (
            <BoutonActiverClasse key={c} classe={c} />
          ))}
        </div>
      )}

      {!eleves || eleves.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
          Aucun élève n'a accès à ce module pour l'instant.<br />
          Assigne-leur le module depuis la section <strong>Modules</strong>.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide w-1/4">Élève</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Thème</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide text-center w-24">Essai actif</th>
                <th className="px-4 py-3 text-xs font-medium text-stone-500 uppercase tracking-wide">Question d'essai</th>
              </tr>
            </thead>
            <tbody>
              {(eleves as Profile[]).map(eleve => (
                <LigneTheme
                  key={eleve.id}
                  eleve={eleve}
                  theme={(themeParEleve[eleve.id] as FragmentTheme) ?? null}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
