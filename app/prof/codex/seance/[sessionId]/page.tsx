import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { lancerSeance, supprimerSeance } from '../../actions'
import { TableauSeance } from './TableauSeance'

async function actionLancer(formData: FormData): Promise<void> {
  'use server'
  await lancerSeance(formData)
}

async function actionSupprimer(formData: FormData): Promise<void> {
  'use server'
  const { redirect } = await import('next/navigation')
  await supprimerSeance(formData)
  redirect('/prof/codex')
}

export default async function SeancePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: seance } = await supabase
    .from('codex_sessions')
    .select('id, statut, classe_id, duree_phase_min, lance_at, phase_2_at, ferme_at, phase_courante_fin_at, scriptorium_unite_id, scriptorium_unites(label)')
    .eq('id', sessionId)
    .single()

  if (!seance) notFound()

  const uniteLabel = (() => {
    const u = seance.scriptorium_unites as { label: string } | { label: string }[] | null
    return Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''
  })()

  // Élèves assignés au module Codex (filtrés par classe si renseignée)
  const { data: moduleData } = await supabase.from('modules').select('id').eq('slug', 'codex').single()

  const { data: assignments } = moduleData
    ? await supabase
        .from('module_assignments')
        .select('eleve_id, profiles!inner(display_name, classe)')
        .eq('module_id', moduleData.id)
    : { data: [] }

  // Travaux existants
  const { data: travaux } = await supabase
    .from('codex_travaux')
    .select('eleve_id, photos_v1, photos_vf, analyse_v1_statut, analyse_vf_statut, statut_validation')
    .eq('session_id', sessionId)

  const travauxMap: Record<string, NonNullable<typeof travaux>[number]> = {}
  for (const t of travaux ?? []) travauxMap[t.eleve_id] = t

  const eleves = (assignments ?? [])
    .map((a) => {
      const p = a.profiles as unknown as { display_name: string; classe: string | null }
      return { eleve_id: a.eleve_id, display_name: p.display_name, classe: p.classe }
    })
    .filter((e) => !seance.classe_id || e.classe === seance.classe_id)
    .map((e) => {
      const t = travauxMap[e.eleve_id]
      return {
        id: e.eleve_id,
        display_name: e.display_name,
        v1_envoyee: (t?.photos_v1?.length ?? 0) > 0,
        vf_envoyee: (t?.photos_vf?.length ?? 0) > 0,
        analyse_v1_statut: t?.analyse_v1_statut ?? 'vide',
        analyse_vf_statut: t?.analyse_vf_statut ?? 'vide',
        statut_validation: t?.statut_validation ?? null,
      }
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name))

  return (
    <div>
      <div className="mb-6">
        <Link href="/prof/codex" className="text-sm text-stone-500 hover:text-stone-700">
          ← Séances
        </Link>
        <h3 className="text-lg font-serif text-stone-900 mt-2">{uniteLabel}</h3>
        <p className="text-sm text-stone-400">
          {seance.classe_id ? `${seance.classe_id} · ` : ''}{seance.duree_phase_min} min par phase
        </p>
      </div>

      {seance.statut === 'brouillon' ? (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <p className="text-stone-600 text-sm mb-1">
            La discussion de synthèse orale se fait hors logiciel.
          </p>
          <p className="text-stone-400 text-xs mb-5">
            Lance la séance quand les élèves sont prêts à écrire la V1 (livre fermé, manuscrit).
          </p>
          <form action={actionLancer}>
            <input type="hidden" name="sessionId" value={sessionId} />
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Lancer la phase 1 (V1)
            </button>
          </form>
          <form action={actionSupprimer} className="mt-4">
            <input type="hidden" name="id" value={sessionId} />
            <button type="submit" className="text-xs text-stone-400 hover:text-red-600">
              Supprimer ce brouillon
            </button>
          </form>
        </div>
      ) : (
        <TableauSeance
          sessionId={sessionId}
          statut={seance.statut}
          phaseFinAt={seance.phase_courante_fin_at}
          eleves={eleves}
        />
      )}
    </div>
  )
}
