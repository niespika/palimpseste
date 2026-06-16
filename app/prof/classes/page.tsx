import { createClient } from '@/utils/supabase/server'
import { CreerClasse } from './CreerClasse'
import { GestionClasse } from './GestionClasse'

interface InscriptionRow {
  eleve_id: string
  statut: string
  profiles: { display_name: string } | { display_name: string }[] | null
}

interface ClasseRow {
  id: string
  nom: string
  niveau: string | null
  filiere: string | null
  annee_scolaire: string
  statut: string
  inscriptions: InscriptionRow[] | null
  classe_modules: { module_id: string }[] | null
}

export default async function PageClasses() {
  const supabase = await createClient()

  const [{ data: classes }, { data: eleves }, { data: modules }] = await Promise.all([
    supabase
      .from('classes')
      .select(`
        id, nom, niveau, filiere, annee_scolaire, statut,
        inscriptions(eleve_id, statut, profiles(display_name)),
        classe_modules(module_id)
      `)
      .order('annee_scolaire', { ascending: false })
      .order('nom'),
    supabase.from('profiles').select('id, display_name').eq('role', 'eleve').order('display_name'),
    supabase.from('modules').select('id, nom, actif').order('nom'),
  ])

  const tousEleves = (eleves ?? []) as { id: string; display_name: string }[]
  const tousModules = (modules ?? []) as { id: string; nom: string; actif: boolean }[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-serif text-stone-900">Classes</h2>
      </div>

      <p className="text-sm text-stone-500 mb-6">
        Les classes sont l&apos;unité de base : on y inscrit des élèves et on leur donne accès aux
        modules. Un élève peut appartenir à plusieurs classes (il cumule alors les accès).
      </p>

      <CreerClasse />

      <div className="mt-6 space-y-4">
        {(!classes || classes.length === 0) && (
          <p className="text-stone-400 text-sm text-center py-8">
            Aucune classe pour l&apos;instant. Crée-en une pour commencer.
          </p>
        )}

        {((classes ?? []) as ClasseRow[]).map((c) => {
          const inscrits = (c.inscriptions ?? [])
            .filter((i) => i.statut === 'active')
            .map((i) => {
              const p = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles
              return { id: i.eleve_id, display_name: p?.display_name ?? '—' }
            })
            .sort((a, b) => a.display_name.localeCompare(b.display_name))

          const moduleIdsAssignes = (c.classe_modules ?? []).map((m) => m.module_id)

          return (
            <GestionClasse
              key={c.id}
              classe={{
                id: c.id,
                nom: c.nom,
                niveau: c.niveau,
                filiere: c.filiere,
                annee_scolaire: c.annee_scolaire,
                statut: c.statut,
              }}
              inscrits={inscrits}
              tousEleves={tousEleves}
              modules={tousModules}
              moduleIdsAssignes={moduleIdsAssignes}
            />
          )
        })}
      </div>
    </div>
  )
}
