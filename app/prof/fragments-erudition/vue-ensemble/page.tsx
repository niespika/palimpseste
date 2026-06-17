import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
import { semestreFragmentsActif } from '../contexte-semestre'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'
import { noteVersLettre, COULEUR_LETTRE } from '@/utils/notation'

// Moyenne d'une section (0-4) → badge lettre.
function BadgeMoyenne({ label, moyenne }: { label: string; moyenne: number | null }) {
  const l = noteVersLettre(moyenne)
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-stone-500">{label}</span>
      {l ? (
        <span className={`px-1.5 py-0.5 rounded font-medium ${COULEUR_LETTRE[l]}`}>{l}</span>
      ) : (
        <span className="text-stone-300">—</span>
      )}
    </span>
  )
}

interface MoySections { decouvertes: number | null; sources: number | null; reflexions: number | null }

function moyenne(xs: number[]): number | null {
  return xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

export default async function PageVueEnsemble({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { classe: classeSel } = await searchParams

  // Semestre consulté + ses semaines (pour le taux de dépôt)
  const { semestre } = await semestreFragmentsActif(supabase)
  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const classes = (moduleData && semestre) ? await classesAvecModule(admin, moduleData.id) : []

  const { data: semaines } = semestre
    ? await admin.from('fragments_semaines').select('id').eq('semestre_id', semestre.id)
    : { data: [] }
  const nbSemaines = (semaines ?? []).length
  const semaineIds = new Set((semaines ?? []).map(s => s.id as string))

  if (!semestre || classes.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
        Aucune classe avec le module Fragments{semestre ? '' : ' (ou aucun semestre)'}.
      </div>
    )
  }

  // Pour chaque classe : moyennes de sections par élève + de la classe.
  type EleveStats = { id: string; display_name: string; moy: MoySections; tauxDepot: number }
  const statsParClasse = new Map<string, { eleves: EleveStats[]; classeMoy: MoySections }>()

  for (const c of classes) {
    const inscrits = await inscriptionsClasse(admin, c.id)
    const inscriptionIds = inscrits.map(i => i.id)
    const eleveIds = inscrits.map(i => i.eleve_id)
    const inscParEleve = new Map(inscrits.map(i => [i.eleve_id, i.id]))

    const { data: profils } = eleveIds.length > 0
      ? await admin.from('profiles').select('id, display_name').in('id', eleveIds).eq('role', 'eleve').order('display_name')
      : { data: [] }

    // Dépôts (du semestre) + analyses publiées
    const { data: depots } = inscriptionIds.length > 0
      ? await admin.from('fragments_depots').select('id, inscription_id, semaine_id').in('inscription_id', inscriptionIds)
      : { data: [] }
    const depotsSemestre = (depots ?? []).filter(d => semaineIds.has(d.semaine_id as string))
    const depotParInsc = new Map<string, string[]>() // inscription → depotIds
    for (const d of depotsSemestre) {
      const arr = depotParInsc.get(d.inscription_id as string) ?? []
      arr.push(d.id as string)
      depotParInsc.set(d.inscription_id as string, arr)
    }
    const depotIds = depotsSemestre.map(d => d.id as string)
    const { data: analyses } = depotIds.length > 0
      ? await admin.from('fragments_analyses')
          .select('depot_id, note_decouvertes, note_sources, note_reflexions')
          .eq('statut', 'publiee').in('depot_id', depotIds)
      : { data: [] }
    const analyseParDepot = new Map((analyses ?? []).map(a => [a.depot_id as string, a]))

    const allD: number[] = [], allS: number[] = [], allR: number[] = []
    const eleves: EleveStats[] = (profils ?? []).map(p => {
      const inscId = inscParEleve.get(p.id as string)
      const dIds = inscId ? depotParInsc.get(inscId) ?? [] : []
      const ds: number[] = [], ss: number[] = [], rs: number[] = []
      for (const dId of dIds) {
        const a = analyseParDepot.get(dId)
        if (!a) continue
        if (a.note_decouvertes != null) { ds.push(a.note_decouvertes); allD.push(a.note_decouvertes) }
        if (a.note_sources != null) { ss.push(a.note_sources); allS.push(a.note_sources) }
        if (a.note_reflexions != null) { rs.push(a.note_reflexions); allR.push(a.note_reflexions) }
      }
      const tauxDepot = nbSemaines > 0 ? Math.round((dIds.length / nbSemaines) * 100) : 0
      return {
        id: p.id as string,
        display_name: p.display_name as string,
        moy: { decouvertes: moyenne(ds), sources: moyenne(ss), reflexions: moyenne(rs) },
        tauxDepot,
      }
    })

    statsParClasse.set(c.id, {
      eleves,
      classeMoy: { decouvertes: moyenne(allD), sources: moyenne(allS), reflexions: moyenne(allR) },
    })
  }

  const classeChoisie = classes.find(c => c.id === classeSel)
  const detail = classeChoisie ? statsParClasse.get(classeChoisie.id) : null

  return (
    <div className="space-y-6 pb-8">
      <p className="text-sm text-stone-500">
        Vue d&apos;ensemble — semestre <span className="font-medium text-stone-700">{semestre.label}</span> · moyennes des sections en lettres.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map(c => {
          const st = statsParClasse.get(c.id)
          const m = st?.classeMoy
          return (
            <Tuile
              key={c.id}
              nom={c.nom}
              sousTitre={`${st?.eleves.length ?? 0} élèves`}
              href={`/prof/fragments-erudition/vue-ensemble?classe=${c.id}`}
              selectionnee={classeSel === c.id}
              resume={
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <BadgeMoyenne label="Déc." moyenne={m?.decouvertes ?? null} />
                  <BadgeMoyenne label="Src." moyenne={m?.sources ?? null} />
                  <BadgeMoyenne label="Réf." moyenne={m?.reflexions ?? null} />
                </div>
              }
            />
          )
        })}
      </div>

      {detail && classeChoisie && (
        <DetailClasse
          nom={classeChoisie.nom}
          sousTitre="Moyenne par section (lettres) · taux de dépôt"
          eleves={detail.eleves.map((e): LigneEleve => ({
            id: e.id,
            display_name: e.display_name,
            statut: (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <BadgeMoyenne label="Déc." moyenne={e.moy.decouvertes} />
                <BadgeMoyenne label="Src." moyenne={e.moy.sources} />
                <BadgeMoyenne label="Réf." moyenne={e.moy.reflexions} />
                <span className="text-xs text-stone-500">dépôt {e.tauxDepot}%</span>
              </div>
            ),
            actions: (
              <Link href={`/prof/fragments-erudition/eleve/${e.id}?classe=${classeChoisie.id}`} className="text-xs text-stone-500 hover:text-stone-800 underline">
                Détail →
              </Link>
            ),
          }))}
        />
      )}
    </div>
  )
}
