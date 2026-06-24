import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Tuile from '@/components/Tuile'
import FormulaireAjoutEleve from './FormulaireAjoutEleve'
import LigneEleve from './LigneEleve'
import type { EleveAvecEmail } from '@/types'

const SANS_CLASSE = 'aucune'

export default async function PageEleves({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  // Profils élèves + leurs classes (via inscriptions actives).
  const [{ data: profiles }, { data: { users: authUsers } }, { data: classesBrutes }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, display_name, classe, created_at, inscriptions(statut, classes(id, nom))')
      .eq('role', 'eleve')
      .order('display_name'),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    supabase.from('classes').select('id, nom').order('nom'),
  ])

  const eleves: EleveAvecEmail[] = (profiles ?? []).map(profile => {
    const inscriptions = (profile.inscriptions ?? []) as { statut: string; classes: { id: string; nom: string } | { id: string; nom: string }[] | null }[]
    const classes = inscriptions
      .filter(i => i.statut === 'active')
      .map(i => (Array.isArray(i.classes) ? i.classes[0] : i.classes))
      .filter((c): c is { id: string; nom: string } => !!c)
    return {
      ...profile,
      email: authUsers.find(u => u.id === profile.id)?.email ?? '—',
      classes,
    }
  })

  const classesList = (classesBrutes ?? []) as { id: string; nom: string }[]

  // Regroupement par classe (un élève bi-classe apparaît sous chacune) + sans classe.
  const elevesParClasse = new Map<string, EleveAvecEmail[]>()
  for (const e of eleves) {
    if (e.classes.length === 0) {
      const arr = elevesParClasse.get(SANS_CLASSE) ?? []
      arr.push(e)
      elevesParClasse.set(SANS_CLASSE, arr)
    } else {
      for (const c of e.classes) {
        const arr = elevesParClasse.get(c.id) ?? []
        arr.push(e)
        elevesParClasse.set(c.id, arr)
      }
    }
  }
  const aSansClasse = (elevesParClasse.get(SANS_CLASSE)?.length ?? 0) > 0
  const elevesSelection = classeSel ? (elevesParClasse.get(classeSel) ?? []) : []
  const nomClasseSel = classeSel === SANS_CLASSE ? 'Sans classe' : classesList.find(c => c.id === classeSel)?.nom

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-serif text-encre">Élèves</h2>

      <FormulaireAjoutEleve />

      {eleves.length === 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Aucun élève pour l&apos;instant. Commence par en ajouter un.
        </div>
      ) : (
        <>
          {/* Tuiles par classe → liste */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classesList.map(c => {
              const n = elevesParClasse.get(c.id)?.length ?? 0
              return (
                <Tuile
                  key={c.id}
                  nom={c.nom}
                  sousTitre={`${n} élève${n > 1 ? 's' : ''}`}
                  href={`/prof/eleves?classe=${c.id}`}
                  selectionnee={classeSel === c.id}
                  couleur={n > 0 ? 'vert' : 'neutre'}
                />
              )
            })}
            {aSansClasse && (
              <Tuile
                nom="Sans classe"
                sousTitre={`${elevesParClasse.get(SANS_CLASSE)?.length} élève${(elevesParClasse.get(SANS_CLASSE)?.length ?? 0) > 1 ? 's' : ''}`}
                href={`/prof/eleves?classe=${SANS_CLASSE}`}
                selectionnee={classeSel === SANS_CLASSE}
                couleur="rouge"
              />
            )}
          </div>

          {/* Liste de la classe sélectionnée */}
          {classeSel && (
            <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-bordure">
                <h3 className="text-sm font-medium text-encre">{nomClasseSel ?? 'Classe'}</h3>
              </div>
              {elevesSelection.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muet">Aucun élève dans cette classe.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-parchemin-fonce border-b border-bordure">
                      <tr>
                        <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Nom affiché</th>
                        <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Classes</th>
                        <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Courriel</th>
                        <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {elevesSelection.map(eleve => (
                        <LigneEleve key={eleve.id} eleve={eleve} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
