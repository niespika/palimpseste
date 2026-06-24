import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { classesAvecModule } from '@/utils/acces'
import { semestreFragmentsActif } from '../contexte-semestre'
import Tuile from '@/components/Tuile'
import FormulaireNouvelEssai from './FormulaireNouvelEssai'
import GestionEssaisClasse from './GestionEssaisClasse'

interface EssaiRow { id: string; titre: string; duree_minutes: number }
interface LienRow { essai_id: string; classe_id: string; date_essai: string; depots_ouverts: boolean }

export default async function PageEssais({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  const { semestre } = await semestreFragmentsActif(supabase)
  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = (moduleData && semestre) ? await classesAvecModule(admin, moduleData.id) : []

  if (!semestre || classes.length === 0) {
    return (
      <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
        Aucune classe avec le module Fragments{semestre ? '' : ' (ou aucun semestre)'}.
      </div>
    )
  }

  // Essais du semestre + liaisons (essai × classe).
  const { data: epreuves } = await admin
    .from('fragments_essais_epreuves')
    .select('id, titre, duree_minutes')
    .eq('semestre_id', semestre.id)
    .order('created_at', { ascending: false })
  const epreuveIds = (epreuves ?? []).map(e => e.id as string)

  const { data: liens } = epreuveIds.length > 0
    ? await admin
        .from('fragments_essais_classes')
        .select('essai_id, classe_id, date_essai, depots_ouverts')
        .in('essai_id', epreuveIds)
    : { data: [] }

  const epreuveParId = new Map((epreuves ?? []).map(e => [e.id as string, e as EssaiRow]))
  const liensParClasse = new Map<string, LienRow[]>()
  for (const l of (liens ?? []) as LienRow[]) {
    const arr = liensParClasse.get(l.classe_id) ?? []
    arr.push(l)
    liensParClasse.set(l.classe_id, arr)
  }

  const classeChoisie = classes.find(c => c.id === classeSel)

  // Données du détail de la classe choisie.
  let assignees: { id: string; titre: string; date_essai: string; depots_ouverts: boolean }[] = []
  let disponibles: { id: string; titre: string }[] = []
  if (classeChoisie) {
    const liensClasse = liensParClasse.get(classeChoisie.id) ?? []
    const assigneesIds = new Set(liensClasse.map(l => l.essai_id))
    assignees = liensClasse
      .map(l => {
        const ep = epreuveParId.get(l.essai_id)
        return ep ? { id: ep.id, titre: ep.titre, date_essai: l.date_essai, depots_ouverts: l.depots_ouverts } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.date_essai.localeCompare(b.date_essai))
    disponibles = (epreuves ?? [])
      .filter(e => !assigneesIds.has(e.id as string))
      .map(e => ({ id: e.id as string, titre: e.titre as string }))
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h3 className="text-base font-medium text-encre">Essais — {semestre.label}</h3>
        <p className="text-sm text-muet mt-0.5">Un essai = une session d&apos;écriture, assignable à plusieurs classes (date propre à chacune).</p>
      </div>

      <FormulaireNouvelEssai
        classes={classes.map(c => ({ id: c.id, nom: c.nom }))}
        semestreId={semestre.id}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map(c => {
          const n = (liensParClasse.get(c.id) ?? []).length
          return (
            <Tuile
              key={c.id}
              nom={c.nom}
              sousTitre={`${n} essai${n > 1 ? 's' : ''}`}
              href={`/prof/fragments-erudition/essais?classe=${c.id}`}
              selectionnee={classeSel === c.id}
              couleur={n > 0 ? 'vert' : 'neutre'}
            />
          )
        })}
      </div>

      {classeChoisie && (
        <GestionEssaisClasse
          classeId={classeChoisie.id}
          classeNom={classeChoisie.nom}
          assignees={assignees}
          disponibles={disponibles}
        />
      )}
    </div>
  )
}
