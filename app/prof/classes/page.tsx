import { createClient } from '@/utils/supabase/server'
import Tuile from '@/components/Tuile'
import EnTeteMobileProf from '@/components/EnTeteMobileProf'
import { CreerClasse } from './CreerClasse'

interface InscriptionRow {
  statut: string
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

  const { data: classes } = await supabase
    .from('classes')
    .select(`
      id, nom, niveau, filiere, annee_scolaire, statut,
      inscriptions(statut),
      classe_modules(module_id)
    `)
    .order('annee_scolaire', { ascending: false })
    .order('nom')

  const classesList = (classes ?? []) as ClasseRow[]

  function nbInscrits(c: ClasseRow) {
    return (c.inscriptions ?? []).filter((i) => i.statut === 'active').length
  }

  return (
    <div className="space-y-6">
      <EnTeteMobileProf titre="Classes" />
      <h2 className="hidden sm:block text-xl font-serif text-encre">Classes</h2>

      <p className="text-sm text-muet">
        Les classes sont l&apos;unité de base : on y inscrit des élèves et on leur donne accès aux
        modules. Ouvre une classe pour la <strong>piloter</strong> (matrice élèves × modules, accès,
        gestion). Un élève peut appartenir à plusieurs classes (il cumule alors les accès).
      </p>

      <CreerClasse />

      {classesList.length === 0 ? (
        <p className="text-muet text-sm text-center py-8">
          Aucune classe pour l&apos;instant. Crée-en une pour commencer.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classesList.map((c) => {
            const n = nbInscrits(c)
            const nMod = (c.classe_modules ?? []).length
            const sousTitre = [c.niveau, c.filiere].filter(Boolean).join(' · ') || c.annee_scolaire
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={sousTitre}
                href={`/prof/classes/${c.id}`}
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
      )}
    </div>
  )
}
