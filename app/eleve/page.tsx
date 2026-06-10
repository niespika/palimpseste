import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

type ModuleInfo = {
  id: string
  slug: string
  nom: string
  description: string | null
  actif: boolean
}

export default async function TableauDeBordEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  // Récupérer les modules assignés à cet élève ET actifs dans le catalogue
  const { data: assignments } = await supabase
    .from('module_assignments')
    .select(`
      module_id,
      modules(id, slug, nom, description, actif)
    `)
    .eq('eleve_id', user!.id)

  const modulesActifs: ModuleInfo[] = (assignments ?? [])
    .map(a => a.modules as unknown as ModuleInfo | ModuleInfo[] | null)
    .map(m => Array.isArray(m) ? m[0] : m)
    .filter((m): m is ModuleInfo => m !== null && m !== undefined && m.actif === true)

  return (
    <div>
      <h2 className="text-xl font-serif text-stone-900 mb-1">
        Bonjour, {profile?.display_name} !
      </h2>
      <p className="text-stone-500 text-sm mb-8">Voici tes modules disponibles.</p>

      {modulesActifs.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <p className="text-stone-600 text-sm leading-relaxed">
            Aucun module n'est encore activé pour toi.<br />
            Ton professeur les activera bientôt — reviens dans quelques instants.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modulesActifs.map(m => (
            <Link
              key={m.id}
              href={`/eleve/modules/${m.slug}`}
              className="bg-white border border-stone-200 rounded-xl p-6 hover:border-stone-400 hover:shadow-sm transition-all group"
            >
              <h3 className="font-medium text-stone-900 mb-1 group-hover:text-stone-700">
                {m.nom}
              </h3>
              {m.description && (
                <p className="text-sm text-stone-500 leading-relaxed">{m.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
