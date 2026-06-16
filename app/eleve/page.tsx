import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { moduleIdsAccessibles } from '@/utils/acces'

type ModuleInfo = {
  id: string
  slug: string
  nom: string
  description: string | null
  actif: boolean
}

// Modules masqués côté élève (interrupteur simple).
// Pour réafficher la tuile — ex. si du contenu Scriptorium est partagé aux élèves —
// retirer le slug de cette liste.
const MODULES_MASQUES_ELEVE = ['scriptorium']

async function getStatutFragments(supabase: Awaited<ReturnType<typeof createClient>>, eleveId: string) {
  // Semaine ouverte la plus récente
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('id, numero, date_limite, ouverte')
    .eq('ouverte', true)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!semaine) return null

  const { data: depot } = await supabase
    .from('fragments_depots')
    .select('id, statut')
    .eq('eleve_id', eleveId)
    .eq('semaine_id', semaine.id)
    .maybeSingle()

  const dateLimite = new Date(semaine.date_limite)
  const jourLimite = dateLimite.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })

  if (depot) {
    return depot.statut === 'en_retard'
      ? `Semaine ${semaine.numero} — déposé en retard`
      : `Semaine ${semaine.numero} — déposé ✓`
  }

  return `Semaine ${semaine.numero} — à déposer avant ${jourLimite}`
}

export default async function TableauDeBordEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user!.id)
    .single()

  // Accès dérivé : modules des classes où l'élève est inscrit (union).
  const idsAccessibles = await moduleIdsAccessibles(supabase, user!.id)

  const { data: mods } = idsAccessibles.size > 0
    ? await supabase
        .from('modules')
        .select('id, slug, nom, description, actif')
        .in('id', [...idsAccessibles])
    : { data: [] as ModuleInfo[] }

  const modulesActifs: ModuleInfo[] = (mods ?? [])
    .filter((m): m is ModuleInfo =>
      m !== null && m !== undefined && m.actif === true && !MODULES_MASQUES_ELEVE.includes(m.slug))

  // Statuts spécifiques par module
  const statuts: Record<string, string | null> = {}
  for (const mod of modulesActifs) {
    if (mod.slug === 'fragments-erudition') {
      statuts[mod.id] = await getStatutFragments(supabase, user!.id)
    }
  }

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
              {statuts[m.id] ? (
                <p className="text-sm font-medium text-stone-600 mt-1">{statuts[m.id]}</p>
              ) : m.description ? (
                <p className="text-sm text-stone-500 leading-relaxed">{m.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
