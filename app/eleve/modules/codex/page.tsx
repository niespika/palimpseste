import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { chargerSeanceActive } from './actions'

export default async function CodexElevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'codex')
    .single()

  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">Ce module n&apos;est pas encore activé.</div>
    )
  }

  const { data: assignment } = await supabase
    .from('module_assignments')
    .select('id')
    .eq('eleve_id', user.id)
    .eq('module_id', module.id)
    .single()

  if (!assignment) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">Tu n&apos;as pas encore accès à ce module.</div>
    )
  }

  const seance = await chargerSeanceActive()

  return (
    <div>
      <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-flex items-center gap-1">
        ← Retour
      </Link>

      <h2 className="text-xl font-serif text-stone-900 mb-2 mt-2">Codex</h2>
      <p className="text-sm text-stone-500 mb-6">Écrire de mémoire le récapitulatif d&apos;une unité, puis l&apos;améliorer.</p>

      {!seance && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <p className="text-stone-500 text-sm">Aucune séance de synthèse en cours pour le moment.</p>
        </div>
      )}

      {seance && (seance.statut === 'phase_1' || seance.statut === 'phase_2') && (
        <Link
          href={`/eleve/modules/codex/seance/${seance.id}`}
          className="block bg-green-50 border border-green-300 rounded-xl p-5 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-green-800 text-sm">
                Séance en cours — {seance.unite_label}
              </p>
              <p className="text-xs text-green-600">
                {seance.statut === 'phase_1'
                  ? 'Phase 1 : écris ta V1, livre fermé → appuie pour commencer'
                  : 'Phase 2 : réécris ta V-finale avec les suggestions → appuie pour continuer'}
              </p>
            </div>
          </div>
        </Link>
      )}

      {seance && seance.statut === 'fermee' && (
        <Link
          href={`/eleve/modules/codex/seance/${seance.id}`}
          className="block bg-blue-50 border border-blue-200 rounded-xl p-5 hover:bg-blue-100 transition-colors"
        >
          <p className="text-sm font-medium text-blue-800">{seance.unite_label}</p>
          <p className="text-xs text-blue-600 mt-0.5">
            {seance.statut_validation === 'valide'
              ? 'Ton retour est prêt — appuie pour le consulter →'
              : 'Séance terminée — ton retour sera disponible une fois validé par le professeur.'}
          </p>
        </Link>
      )}
    </div>
  )
}
