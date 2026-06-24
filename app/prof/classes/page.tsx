import { createClient } from '@/utils/supabase/server'
import Tuile from '@/components/Tuile'
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

export default async function PageClasses({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const supabase = await createClient()
  const { classe: classeSel } = await searchParams

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
  const classesList = (classes ?? []) as ClasseRow[]

  function inscritsActifs(c: ClasseRow) {
    return (c.inscriptions ?? [])
      .filter((i) => i.statut === 'active')
      .map((i) => {
        const p = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles
        return { id: i.eleve_id, display_name: p?.display_name ?? '—' }
      })
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
  }

  const classeChoisie = classesList.find((c) => c.id === classeSel)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif text-encre">Classes</h2>

      <p className="text-sm text-muet">
        Les classes sont l&apos;unité de base : on y inscrit des élèves et on leur donne accès aux
        modules. Un élève peut appartenir à plusieurs classes (il cumule alors les accès).
      </p>

      <CreerClasse />

      {classesList.length === 0 ? (
        <p className="text-muet text-sm text-center py-8">
          Aucune classe pour l&apos;instant. Crée-en une pour commencer.
        </p>
      ) : (
        <>
          {/* Tuiles cliquables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classesList.map((c) => {
              const n = inscritsActifs(c).length
              const nMod = (c.classe_modules ?? []).length
              const sousTitre = [c.niveau, c.filiere].filter(Boolean).join(' · ') || c.annee_scolaire
              return (
                <Tuile
                  key={c.id}
                  nom={c.nom}
                  sousTitre={sousTitre}
                  href={`/prof/classes?classe=${c.id}`}
                  selectionnee={classeSel === c.id}
                  couleur={n > 0 ? 'vert' : 'neutre'}
                  resume={
                    <span className="text-xs text-muet">
                      {n} élève{n > 1 ? 's' : ''} · {nMod} module{nMod > 1 ? 's' : ''}
                    </span>
                  }
                />
              )
            })}
          </div>

          {/* Détail de la classe sélectionnée */}
          {classeChoisie && (
            <GestionClasse
              classe={{
                id: classeChoisie.id,
                nom: classeChoisie.nom,
                niveau: classeChoisie.niveau,
                filiere: classeChoisie.filiere,
                annee_scolaire: classeChoisie.annee_scolaire,
                statut: classeChoisie.statut,
              }}
              inscrits={inscritsActifs(classeChoisie)}
              tousEleves={tousEleves}
              modules={tousModules}
              moduleIdsAssignes={(classeChoisie.classe_modules ?? []).map((m) => m.module_id)}
            />
          )}
        </>
      )}
    </div>
  )
}
